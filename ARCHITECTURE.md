# Architectural Design & System Overview

This document outlines the architectural blueprint for the **Client Issue Tracker**, a production-grade B2B SaaS platform. The architecture is designed for maintainability, security, and graceful scaling, utilizing a modern Next.js stack with strict separation of concerns.

---

## 1. Overall System Architecture

The IssueTracker platform is engineered as a monolithic Next.js 15 (App Router) application that seamlessly unifies both the user interface and the API. It enforces a strict layering paradigm to ensure that the presentation layer is decoupled from business logic and data access.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                               Browser Client                                │
│                   (React Server & Client Components)                        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HttpOnly Cookie (JWT)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Next.js App Router                                 │
│                                                                             │
│  ┌──────────────────────┐                    ┌───────────────────────────┐  │
│  │  Server Components   │───── Fetch ───────►│    Services Layer       │  │
│  │ (SSR, Initial Data)  │                    │ (Business Logic, RBAC)  │  │
│  └──────────────────────┘                    └─────────────┬─────────────┘  │
│                                                            │                │
│  ┌──────────────────────┐                    ┌─────────────▼─────────────┐  │
│  │    Route Handlers    │───── Parse ───────►│      Data Access          │  │
│  │   (/api/* routes)    │                    │ (Prisma ORM via Service)  │  │
│  └──────────────────────┘                    └───────────────────────────┘  │
└────────────────────────────────────────────────────────────┬────────────────┘
                                                             │
                                                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             PostgreSQL Database                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                        External Integrations (Optional)                     │
│    [ AI Providers ] · [ S3 Attachments ] · [ SMTP / Push ]                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Core Architectural Rule
All business logic, database transactions, and Role-Based Access Control (RBAC) validations reside exclusively in the `src/services` layer. 
- **Route Handlers (`/api/*`)** are kept intentionally thin: they validate incoming payloads using Zod schemas, invoke the appropriate service, and return a standardized JSON response envelope.
- **Server Components** fetch data directly via these internal services for rapid Server-Side Rendering (SSR).
- **Client Components** never access the database directly; instead, they communicate with Route Handlers via a dedicated `apiFetch` utility, which standardizes error handling, network retries, and parses the `{success, data, error}` envelope.

---

## 2. Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| **Next.js App Router (UI + API)** | Provides a single deployable unit. Server Components fetch directly from services, enabling fast SSR while keeping RBAC centralized. |
| **Services Layer Owns Logic & RBAC** | Ensures Route Handlers remain thin and uniform. Centralizing logic makes it highly testable and safely reusable across both SSR and API boundaries. |
| **Custom JWT in HttpOnly Cookies** | Tokens are completely isolated from client-side JavaScript, rendering them immune to XSS attacks. The `jose` library ensures compatibility across Node.js and Edge runtimes. |
| **Prisma + PostgreSQL (Soft Deletes)** | Employs a normalized 3NF structure. Guarantees atomic, multi-table writes via Prisma `$transaction`, while soft deletes preserve full lifecycle history. |
| **Standardized API Envelope** | All endpoints return `{ success: true, data: ... }` or `{ success: false, error: ... }`. This allows the client `apiFetch` wrapper to handle network retries, parse errors predictably, and map them to UI states. |
| **Shared Zod Schemas** | Acts as a single source of truth for data validation across both the client and server. The server always re-validates to prevent payload tampering. |
| **AI Multi-Provider Setup** | A unified, pooled `generateObject` call extracts all necessary fields. Supports multiple providers (Gemini/OpenAI/Anthropic) with an OpenRouter fallback mechanism. |
| **Performance & Caching Strategy** | Relies on Next.js App Router caching coupled with `router.refresh()` for mutation invalidation. Client-side memoization (`useMemo`/`useCallback`) is applied selectively only for expensive UI derivations. |

---

## 3. Database Design Approach

The data layer is powered by **PostgreSQL** and managed via **Prisma ORM**. 

### Conventions & Standards
- **Identifiers:** Globally unique `cuid` values are used for primary keys to prevent enumeration and collision.
- **Naming:** Tables and columns follow strict `snake_case` conventions at the database level (mapped via `@map` and `@@map` in Prisma).
- **Timestamps & Soft Deletes:** Every table includes `created_at` and `updated_at`. We strictly enforce **soft deletes** utilizing a nullable `deleted_at` column; physical row deletion is prohibited to maintain audit integrity.
- **Indexing:** Foreign keys and frequently queried fields (e.g., status, client IDs) are heavily indexed.

### Core Models & Relationships
- **Client & Website (`User 1—* Website`):** Ownership is established via `clientId`.
- **Issues (`Website 1—* Issue`):** Issues belong to a website, are reported by a Client, and can optionally be assigned to a Manager. Unique constraints are placed on human-readable IDs (e.g., `ISS-000123`), which are atomically generated with a Prisma P2002 retry mechanism.
- **Comments (`Issue 1—* Comment`):** Supports an `isInternal` flag to conceal manager-specific notes from clients.
- **Audit Timeline (`Issue 1—* IssueEvent`):** An append-only ledger tracking state changes (`from`/`to`/`metadata`), driving the immutable timeline visible to both roles.
- **Attachments (`Attachment`):** Stores only S3 metadata (utilizing a `{website_id}/{issue_id}/{random}.{ext}` key pattern) and tracks a `PENDING → UPLOADED` lifecycle.

---

## 4. Application Flow

The data lifecycle is meticulously structured to ensure security and predictability across the stack.

### 4.1. Auth Flow
1. `POST /api/auth/login` accepts credentials.
2. The route verifies the password via `bcrypt`.
3. A JWT is signed using `jose` and securely embedded in an HttpOnly, SameSite=Strict cookie.
4. The `(app)` layout resolves this session server-side. Unauthenticated users are forcefully redirected to `/login`, establishing defense in depth beyond per-route middleware.

### 4.2. Reading Data
1. A Server Component (e.g., the issues dashboard) invokes a service method like `listIssues(actor, query)`.
2. The service enforces RBAC scoping (e.g., restricting a Client to their own websites) and handles pagination.
3. The component renders the UI fully populated on the server. No client-side fetch is required for the initial paint.

### 4.3. Mutations
1. A Client Component triggers an action (e.g., updating an issue's status) by invoking the `apiFetch` utility. `apiFetch` manages network-level retries and expects a standardized `{ success, data, error }` envelope.
2. The Route Handler parses the payload via Zod and delegates to the Service Layer.
3. The Service Layer asserts RBAC permissions and executes a Prisma `$transaction` (e.g., updating the issue status while simultaneously appending an `IssueEvent` and queueing notifications).
4. Upon success, the client component triggers `router.refresh()`, instructing Next.js to re-fetch Server Components and seamlessly update the UI.

### 4.4. File Uploads
1. The client requests a secure upload capability.
2. The server generates an S3 Presigned URL, granting temporary, restricted write access.
3. The client uploads the file directly to the S3 bucket, bypassing the Node.js server to conserve bandwidth.
4. The client notifies the server of completion, updating the attachment state from `PENDING` to `UPLOADED`.

### 4.5. Async Jobs & Notifications
1. **Fire-and-Forget:** When an issue is resolved, the service immediately writes an in-app notification and queues Email/Push records in the database. A non-blocking asynchronous dispatch is then fired.
2. **Cron Dispatch:** A scheduled cron job periodically pings `/api/notifications/dispatch` to process the queue, ensuring reliable delivery with exponential backoff on serverless architectures.
3. **Slack Webhook Integration:** Alongside Email and Push, critical events (or daily summary reports) can be piped to a Slack webhook. This operates within the same asynchronous cron-based queue, preventing third-party API latency from impacting the user's mutation request.

---

## 5. Security & Resilience

### Security Implementations
- **Authentication:** Custom JWTs stored exclusively in HttpOnly cookies protect against XSS payload extraction.
- **Password Hygiene:** Secure hashing is enforced utilizing `bcrypt`.
- **Rate Limiting:** An in-memory rate limiter tracks header-based client IDs to throttle abusive traffic (designed to be easily swappable with Redis for multi-instance deployments).
- **Authorization:** Strict RBAC is centralized in the `src/services` layer, acting as an unbypassable gatekeeper for all data access.
- **Vulnerability Scanning:** Dependencies and configurations are actively checked via `npm audit` scripts and Bumblebee security checks for advanced vulnerability detection.

### Graceful Degradation
The system is built on a philosophy of **Graceful Degradation** for all third-party dependencies.
- Every external integration—including AI functionality, S3 file uploads, SMTP email delivery, Web Push notifications, Slack webhooks, and Google reCAPTCHA—is explicitly feature-flagged via environment variables.
- If an environment variable is omitted or invalid, the corresponding service **self-disables automatically**.
- **Crucially, the application will not crash.** The core issue-tracking functionalities remain fully operational, ensuring that missing configuration only impacts that specific optional feature.
