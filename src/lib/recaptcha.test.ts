import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { verifyRecaptcha, isRecaptchaEnabled } from "./recaptcha";
import { AppError } from "./errors";

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
  delete process.env.RECAPTCHA_SECRET_KEY;
});

function mockFetch(body: unknown): void {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })) as typeof fetch;
}

describe("verifyRecaptcha", () => {
  it("is disabled and skips when no secret is configured (graceful degradation)", async () => {
    delete process.env.RECAPTCHA_SECRET_KEY;
    assert.equal(isRecaptchaEnabled(), false);
    await assert.doesNotReject(verifyRecaptcha(undefined));
  });

  it("rejects a missing token when enabled", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "test-secret";
    assert.equal(isRecaptchaEnabled(), true);
    await assert.rejects(
      verifyRecaptcha(undefined),
      (err: unknown) => err instanceof AppError && err.code === "BAD_REQUEST",
    );
  });

  it("passes when Google returns success (v2)", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "test-secret";
    mockFetch({ success: true });
    await assert.doesNotReject(verifyRecaptcha("valid-token"));
  });

  it("passes when v3 score is above threshold", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "test-secret";
    mockFetch({ success: true, score: 0.9 });
    await assert.doesNotReject(verifyRecaptcha("valid-token"));
  });

  it("rejects when Google returns failure", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "test-secret";
    mockFetch({ success: false, "error-codes": ["invalid-input-response"] });
    await assert.rejects(
      verifyRecaptcha("bad-token"),
      (err: unknown) => err instanceof AppError && err.code === "BAD_REQUEST",
    );
  });

  it("rejects a low v3 score", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "test-secret";
    mockFetch({ success: true, score: 0.1 });
    await assert.rejects(
      verifyRecaptcha("low-score-token"),
      (err: unknown) => err instanceof AppError && err.code === "FORBIDDEN",
    );
  });

  it("fails closed when the verification request throws", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "test-secret";
    globalThis.fetch = (async () => {
      throw new Error("network down");
    }) as typeof fetch;
    await assert.rejects(
      verifyRecaptcha("token"),
      (err: unknown) => err instanceof AppError && err.code === "BAD_REQUEST",
    );
  });
});
