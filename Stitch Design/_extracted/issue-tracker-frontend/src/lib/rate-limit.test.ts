import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  rateLimit,
  getClientIp,
  rateLimitHeaders,
  enforceRateLimit,
} from "./rate-limit";
import { AppError } from "./errors";

// Unique keys per test so the shared in-memory store doesn't leak between tests.
let counter = 0;
const uniqueKey = () => `test:${Date.now()}:${counter++}`;

describe("rateLimit", () => {
  it("allows up to the limit, then blocks", () => {
    const key = uniqueKey();
    const opts = { limit: 3, windowMs: 1000 };
    assert.equal(rateLimit(key, opts).success, true); // 1
    assert.equal(rateLimit(key, opts).success, true); // 2
    const third = rateLimit(key, opts); // 3
    assert.equal(third.success, true);
    assert.equal(third.remaining, 0);

    const fourth = rateLimit(key, opts); // 4 -> blocked
    assert.equal(fourth.success, false);
    assert.equal(fourth.remaining, 0);
    assert.ok(fourth.retryAfterSeconds > 0);
  });

  it("resets after the window elapses", async () => {
    const key = uniqueKey();
    const opts = { limit: 1, windowMs: 50 };
    assert.equal(rateLimit(key, opts).success, true);
    assert.equal(rateLimit(key, opts).success, false);
    await new Promise((resolve) => setTimeout(resolve, 70));
    assert.equal(rateLimit(key, opts).success, true);
  });
});

describe("getClientIp", () => {
  it("uses the first x-forwarded-for entry", () => {
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    assert.equal(getClientIp(req), "1.2.3.4");
  });

  it("falls back to x-real-ip, then 'unknown'", () => {
    assert.equal(
      getClientIp(
        new Request("http://x", { headers: { "x-real-ip": "9.9.9.9" } }),
      ),
      "9.9.9.9",
    );
    assert.equal(getClientIp(new Request("http://x")), "unknown");
  });
});

describe("rateLimitHeaders", () => {
  it("sets Retry-After only when blocked", () => {
    const allowed = rateLimitHeaders({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Date.now() + 1000,
      retryAfterSeconds: 0,
    });
    assert.equal(allowed["X-RateLimit-Limit"], "5");
    assert.equal(allowed["X-RateLimit-Remaining"], "4");
    assert.equal(allowed["Retry-After"], undefined);

    const blocked = rateLimitHeaders({
      success: false,
      limit: 5,
      remaining: 0,
      reset: Date.now() + 1000,
      retryAfterSeconds: 7,
    });
    assert.equal(blocked["Retry-After"], "7");
  });
});

describe("enforceRateLimit", () => {
  it("throws a 429 RATE_LIMITED AppError with retry details when exceeded", () => {
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "203.0.113.5" },
    });
    const opts = { name: uniqueKey(), limit: 1, windowMs: 1000 };

    assert.doesNotThrow(() => enforceRateLimit(req, opts)); // 1st: ok
    try {
      enforceRateLimit(req, opts); // 2nd: blocked
      assert.fail("expected enforceRateLimit to throw");
    } catch (err) {
      assert.ok(err instanceof AppError);
      assert.equal(err.code, "RATE_LIMITED");
      assert.equal(err.status, 429);
      const details = err.details as { retryAfterSeconds: number };
      assert.ok(details.retryAfterSeconds > 0);
    }
  });
});
