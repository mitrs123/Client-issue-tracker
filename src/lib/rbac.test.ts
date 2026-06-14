import { describe, it, before } from "node:test";
import assert from "node:assert/strict";

/**
 * RBAC gate tests. The manager-only services check `actor.role` BEFORE touching
 * the database, so we assert the authorization gates with no DB connection.
 * Env is set before the dynamic imports so `@/lib/env` validation passes in CI.
 */
process.env.DATABASE_URL ||=
  "postgresql://user:pass@localhost:5432/db?schema=public";
process.env.DIRECT_URL ||=
  "postgresql://user:pass@localhost:5432/db?schema=public";
process.env.JWT_SECRET ||= "test-only-secret-test-only-secret-0123456789";

let issueSvc: typeof import("../services/issue.service");
let userSvc: typeof import("../services/user.service");
let websiteSvc: typeof import("../services/website.service");
let errors: typeof import("../lib/errors");

const client = {
  id: "client-1",
  username: "client",
  name: "Client",
  role: "CLIENT" as const,
};

before(async () => {
  issueSvc = await import("../services/issue.service");
  userSvc = await import("../services/user.service");
  websiteSvc = await import("../services/website.service");
  errors = await import("../lib/errors");
});

describe("RBAC — manager-only actions reject a client (no DB hit)", () => {
  const isForbidden = (err: unknown) =>
    err instanceof errors.AppError && err.code === "FORBIDDEN";

  it("updateIssueStatus is forbidden for a client", async () => {
    await assert.rejects(
      issueSvc.updateIssueStatus(client, "issue-1", { status: "RESOLVED" }),
      isForbidden,
    );
  });

  it("updateIssueSeverity is forbidden for a client", async () => {
    await assert.rejects(
      issueSvc.updateIssueSeverity(client, "issue-1", { severity: "HIGH" }),
      isForbidden,
    );
  });

  it("listClients is forbidden for a client", async () => {
    await assert.rejects(userSvc.listClients(client), isForbidden);
  });

  it("createWebsite is forbidden for a client", async () => {
    await assert.rejects(
      websiteSvc.createWebsite(client, {
        name: "Acme",
        url: "https://acme.example.com",
        clientId: "client-1",
      }),
      isForbidden,
    );
  });
});
