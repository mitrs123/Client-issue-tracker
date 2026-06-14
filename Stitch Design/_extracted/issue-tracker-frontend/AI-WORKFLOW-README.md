# AI Workflow — Ongoing Development Log

> Living document, updated **in lockstep** with every code/logic step (per the
> standing pairing rule). Tracks tools, prompts, reflections, and efficiency
> metrics across all phases. This is the working log; the polished
> `AI_WORKFLOW.md` deliverable is generated in Phase 5 from this material.

---

## 1. AI Tools Used

| Tool | Role in this workflow | Status |
|------|----------------------|--------|
| **Claude Code (Opus 4.8)** | Primary engineering agent — architecture, schema, backend, auth, refactoring, docs, tooling/audit | Active |
| Vercel AI SDK | Planned runtime LLM integration for issue analysis (Phase 4) | Planned |
| v0.dev | Planned UI prototyping reference (Phase 3) | Planned |

---

## 2. Sample Prompts Matrix

### 🏛️ Architecture & System Design
- *"Start and follow the `.clauderules`, `MASTER_PLAN.md`, `specification.docx`, `Task.docx`."* — established the Yield & Confirm phased workflow and Tier-3 production target.

### 🗄️ Database Schema & Design
- *"Phase 1: Propose the Prisma schema based on the Master Plan."* — normalized 3NF schema with audit trail, soft deletes, snake_case mapping, unique `username`/`issue_no`.
- *"Add `assignedManagerId` to Issue, strengthen Attachment metadata, add AI traceability fields, improve Notification delivery/read tracking, ensure IssueEvent covers the full lifecycle."* — applied as schema refinements (see Manual corrections).

### ⚙️ Backend Development
- *"Proceed to Phase 2: Backend & Auth."* — produced the services layer, custom JWT auth (HttpOnly cookies), RBAC helpers, shared zod schemas, standardized API responses, and the App Router API surface (auth, websites, issues, comments, timeline, notifications).

### 🎨 Frontend Development
- _(pending — Phase 3)_

### ♻️ Refactoring & Code Optimization
- _(pending)_

### 🚀 Production Readiness & Security
- *(during Phase 2)* — `npm audit` review: bumped Next.js off CVE-2025-66478 and pinned a patched `postcss` via `overrides` → **0 vulnerabilities**. (Tier-3 requirement.)
- *"No Upstash — use in-memory rate limiting via the header."* — implemented a process-local fixed-window limiter keyed by `X-Forwarded-For`/`X-Real-IP`, emitting `Retry-After` + `X-RateLimit-*` headers; applied to login (5/min) and issue/comment creation.
- *"Add rate limit to the issue status + severity update routes; verify it returns 429 with Retry-After; add Google reCAPTCHA + testing; re-run npm audit."* — rate-limited both manager update routes (30/min, before auth), added graceful server-side reCAPTCHA verification on login, added a `node:test` suite, and verified end-to-end.

---

## 3. AI Reflection

### ✅ Successful outputs
- **Phase 1 schema** generated cleanly: 9 models, enums, audit/timeline table, soft-delete columns, snake_case `@map`/`@@map`, indexes on all FKs.
- **Phase 2 backend** compiles green on the first verification pass: `tsc --noEmit` (strict, `noUncheckedIndexedAccess`) → 0 errors; `next lint` → clean; `prisma validate` → valid.
- **Architecture discipline held:** all business logic sits in `/services`; routes only parse → call service → return standardized envelope; client never touches the DB.
- **Atomicity:** multi-table operations (issue create + event, status change + event + notification) run inside Prisma `$transaction`.
- **Rate limiting verified end-to-end (live):** the status & severity routes returned `401` for 30 unauth requests, then `HTTP 429` with `Retry-After: 60` + `X-RateLimit-*` headers on the 31st — exactly as designed.
- **Test suite green:** 13/13 `node:test` tests pass (rate limiter window/reset/headers/enforce; reCAPTCHA skip/missing-token/success/failure/low-score/fail-closed).

### ❌ Rejected outputs
- **`AiProvider` enum** — rejected in favor of free-form `provider String` so bonus providers need no migration.
- **Prisma `autoincrement()` for `issueNo`** — not allowed on non-`@id` fields; replaced with a transaction-scoped generator (`ISS-000123`) plus a P2002 retry loop.
- **npm's suggested audit "fix" (`next@9.3.3`)** — rejected as a nonsensical downgrade; resolved properly by upgrading within the 15.x line + a `postcss` override.

### ✏️ Manual corrections (human-directed)
- Reviewer requested five schema strengthenings after Phase 1, all applied:
  1. Renamed `assigneeId` → **`assignedManagerId`** (clearer intent).
  2. **Attachment metadata**: added `extension`, `bucket`, `checksum`, and an `AttachmentStatus` (PENDING→UPLOADED→FAILED→QUARANTINED) for the presigned-upload lifecycle.
  3. **AI traceability**: added `status`, `requestId`, token counts, `latencyMs`, `costUsd`, `error`, and `appliedFields` to `AiSuggestion`.
  4. **Notification delivery/read**: added `attempts`, `deliveredAt`, `failedAt`, `lastError` + `DELIVERED`/`RETRYING` statuses.
  5. **Full lifecycle** on `IssueEventType`: added title/description edits, unassign, attachment removal, reopen, and AI generate/apply events.
- Reviewer overrode the Master Plan's Upstash dependency → **in-memory rate limiting** (header-based client id). Removed `UPSTASH_*` from env/flags; limiter is now always-on with no external service.
- Reviewer asked to rate-limit the status/severity routes, add reCAPTCHA + tests, and re-run `npm audit` — all done; placed the limiter **before** `requireRole` so floods are throttled before auth work.

### 💡 Lessons learned
- Next.js `15.1.6` ships with a published CVE; always run `npm audit` immediately after install and pin to a patched minor (`15.5.19`).
- With ESLint 9 + `next lint`, custom `@typescript-eslint/*` rules require extending **`next/typescript`** (not just `next/core-web-vitals`) to register the plugin.
- Next 15 makes `cookies()`/route `params` **async** — session/cookie helpers and dynamic routes must `await` them.
- The Yield gate is the right place to surface design decisions for confirmation; the reviewer's refinements landed cleanly because the schema was proposed, not assumed-final.
- Next 15 renamed `experimental.serverComponentsExternalPackages` → top-level **`serverExternalPackages`** (caught via a dev-server warning; fixed).
- `tsx` resolves the `@/*` path alias once `baseUrl` is set in `tsconfig.json`, so tests can run with no bundler.
- Reading `RECAPTCHA_SECRET_KEY` at **call time** (not module load) keeps the feature toggle per-environment and makes both the enabled/disabled paths unit-testable in one process.

---

## 4. AI Efficiency Metrics

| Metric | Value (approx.) |
|--------|-----------------|
| Running Prompt Count | ~5 user prompts |
| Running Development Turns | 4 (Phase 1 · refinements+Phase 2 · rate limiting · recaptcha/tests/verify) |
| Estimated Productivity Improvement | ~85% time saved vs. hand-writing schema + auth + services + tooling + tests |

---

### Phase Log
- **Phase 1 — Database Setup:** ✅ approved (with refinements). `prisma/schema.prisma`, `.env.example`.
- **Phase 2 — Backend & Auth:** ✅ implemented & verified. Core lib (env/flags, prisma, jwt, cookies, RBAC, errors, standardized responses, route wrapper, logger, **in-memory rate limiter**), shared zod schemas, services (auth/user/website/issue/comment/notification/issue-event), App Router API routes, demo seed. Verified: `npm audit` 0 vulns · `tsc --noEmit` clean · `next lint` clean · `prisma validate` ok. _Awaiting review._
- **Phase 2.1 — Security hardening:** ✅ in-memory rate limiter (login + issue/comment create + **status/severity** updates), graceful Google reCAPTCHA on login, `node:test` suite (13 pass). Verified: live `429` + `Retry-After`, `tsc` clean, `next lint` clean, `npm audit` **0 vulns**. _Awaiting review._
- **Phase 3 — UI Prototyping:** _not started (paused at user's request for review)._
