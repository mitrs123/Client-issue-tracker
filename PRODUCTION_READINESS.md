# Production Readiness

**Author:** Platform / DevOps
**Scope:** Client Issue Tracker — Next.js 15 (App Router) + Prisma + PostgreSQL (Supabase) + Vercel
**Purpose:** A tailored assessment of what is already production-grade in this codebase and the concrete, architecture-specific steps required to achieve exceptional enterprise-grade quality.

This document balances practical implementation with an enterprise mindset, explaining what is implemented now, what is prototype-only, and what must be upgraded for a high-traffic production environment. The goal is to demonstrate awareness of what is required to maintain a mission-critical SaaS application.

**Architecture Note:** The app uses Next.js App Router with SSR/server components where useful, rather than a pure SPA. This is deliberate, as auth/RBAC and sensitive dashboard data heavily benefit from server-side access control and secure data fetching before rendering.

---

## 1. Security

**Current Implementation:**
- **Authentication:** Custom JWT transported via HttpOnly, SameSite, Secure cookies (resistant to XSS). Passwords hashed using bcrypt (cost 12).
- **Authorization:** Strictly enforced RBAC in the service layer (`requireUser` / `requireRole`) and re-checked in the App Router layouts.
- **Input Validation:** Zod schemas applied universally on client and server endpoints.
- **Rate Limiting:** Currently uses an in-memory rate limiter with Google reCAPTCHA integration on login. *Note: This in-memory limiter is suitable for a single-instance prototype only.*
- **Security Posture:** `npm audit` reports 0 vulnerabilities. Security headers are configured via `vercel.json`.

**Production Upgrades:**
- **Distributed Rate Limiting:** Because serverless deployments have multiple instances, the in-memory rate limiter **must** be replaced with a distributed Redis/Upstash implementation in production to effectively prevent API abuse and DDoS attacks.
- **CSRF & CORS:** Implement strict CSRF protection tokens for mutating requests and restrict CORS origins if any APIs are exposed cross-domain.
- **Secret Management & API Key Storage:** Move all secrets to a managed secrets vault (AWS KMS, Doppler, or HashiCorp Vault) with automated rotation.
- **Supply-Chain & Workstation Security:** Harden developer machines and the CI pipeline using a supply-chain and workstation scanner (e.g., **"Bumblebee"**). This ensures that compromised dependencies (npm), malicious editor extensions, or rogue MCP (Model Context Protocol) AI agents are caught before code is built or credentials are exfiltrated. Validate and enforce a YAML-defined security policy for all AI agents.

---

## 2. Reliability

**Current Implementation:**
- **Error Handling:** A centralized route wrapper standardizes API error responses globally.
- **Logging:** Structured JSON logging is in place, ready for external log drains.
- **Audit Trails:** A dedicated `IssueEvent` table tracks lifecycle events securely, ensuring a full audit trail.
- **Graceful Degradation:** The system safely degrades if optional provider keys (AI, S3, SMTP) are missing.
- **Data Lifecycle:** Soft deletes are implemented globally; no hard deletions occur.

**Production Upgrades:**
- **Advanced System Resilience (Circuit Breakers):** Implement the Circuit Breaker pattern. If a third-party AI provider goes down, the backend shouldn't crash; the breaker should gracefully disable AI features while keeping the core issue tracker online.
- **Graceful Shutdowns:** Document and implement handlers for process termination (e.g., SIGTERM) to finish processing active client requests and cleanly close database connections before shutting down during a deployment.
- **Backup Strategy & Data Integrity:** Enable and drill automated daily backups and Point-in-Time Recovery (PITR) in Supabase. Explicitly enforce AES-256 for database storage and TLS 1.3 for data in transit to meet compliance.
- **Retry Strategy:** Implement robust exponential backoff and retries for external dependencies.

---

## 3. Scalability

**Current Implementation:**
- **Database Scaling:** PostgreSQL on Supabase with Prisma pooling (PgBouncer). Indexes are mapped on all foreign keys and hot filter columns. Server-side pagination and targeted queries prevent N+1 issues.
- **AI Service Scaling:** Multi-provider fallback capability via the Vercel AI SDK. Output is suggestion-only; human approval is required.
- **Notification Scaling:** Async queue structure with retry mechanisms for SMTP and Web Push. *Note: Vercel Hobby accounts are limited to running Cron Jobs once per day. The current deployment schedule is set to daily (`0 0 * * *`) to comply. Upgrading to a Pro plan is required to unlock higher frequency cron schedules (e.g., every 5 minutes) for faster notification dispatch.*

**Production Upgrades:**
- **Performance & Caching Architecture:** Introduce a Redis in-memory caching layer for frequently accessed, read-heavy data (like dashboard counts and notification states) to reduce database load.
- **Background Jobs (AI & Notification Scaling):** Replace the DB-backed queue with a dedicated robust queue service (e.g., AWS SQS, Upstash QStash) and move AI processing, email dispatches, and heavy monitoring tasks fully into background worker queues. Set up Dead-Letter Queues (DLQ) for failed jobs.
- **CDN & Edge Delivery:** Utilize a global Content Delivery Network (CDN) to serve static React/Next.js frontend assets, severely reducing latency for global clients.

---

## 4. Frontend Reliability

**Current Implementation:**
- Basic error handling via Next.js `error.tsx` and standard loading states.

**Production Upgrades:**
- **React Error Boundaries:** Implement granular React Error Boundaries. If one component on the dashboard fails (e.g., a timeline chart), it must be isolated so the rest of the page remains functional.
- **UX States:** Standardize skeleton loaders, empty states, and localized error messages.
- **Frontend Observability:** Integrate Sentry or Datadog for the frontend to capture real-time exceptions, Core Web Vitals (LCP, FID, CLS), and user session replays.

---

## 5. Testing & Quality Assurance

**Current Implementation:**
- Basic unit tests covering the rate limiter, reCAPTCHA logic, and RBAC guardrails.

**Production Upgrades:**
- **E2E Testing:** Implement Playwright or Cypress in the CI pipeline to automatically test critical user journeys (e.g., a client creating a high-severity issue, a manager resolving it) before any code is merged.
- **Load Testing:** Run k6 or Artillery tests before launch to ensure infrastructure handles concurrent client traffic spikes seamlessly.
- **Comprehensive Test Pyramid:** Expand integration tests to cover the full service layer and automated CI checks that block merges on coverage drops.

---

## 6. Deployment & Monitoring

**Current Implementation:**
- Hosted on Vercel (Next.js) and Supabase (PostgreSQL), utilizing Git-integrated CI/CD.
- Basic Vercel logs and API endpoint tracking.

**Production Upgrades:**
- **Hosting Recommendation:** Continue with Vercel + Supabase, but upgrade to Pro/Enterprise tiers to accommodate higher compute requirements, better PgBouncer connection limits, and SLA guarantees.
- **CI/CD Approach:** Transition to GitHub Actions CI/CD to run strict gating (lint, typecheck, tests, and security scans) *before* triggering Vercel builds. Ensure Database Migrations are safely managed in this pipeline using Prisma. Establish preview deployments and strict environment separation.
- **Monitoring Strategy:** Integrate Datadog, New Relic, or OpenTelemetry backend APM to thread correlation IDs across routes, services, and the database. Track API latency, error rates, and uptime. Set up PagerDuty/Opsgenie alerting for 5xx spikes.
- **Rollback Plan:** Establish and document an immediate one-click rollback procedure for bad deployments.

---

## 7. Maintenance

**Current Implementation:**
- Periodic execution of `npm audit`.

**Production Upgrades:**
- **Dependency Management:** Implement Dependabot or Renovate to automate routine dependency updates.
- **Schema Management:** Review every Prisma migration closely to avoid breaking changes to the database structure.
- **Routine Maintenance Tasks:** Schedule regular cleanup jobs for expired/stale attachments, stale logs, and older audit trail partitions to prevent unbounded database growth. Run regular restore drills to ensure backups are truly recoverable.
