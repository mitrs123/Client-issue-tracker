# Client Issue Tracker – Master Project Plan

## 1. Project Overview & Architecture

The goal is to build a modern, production-grade Client Issue Tracker. The platform will serve two distinct roles: Client and Manager. The system must be highly secure, resilient to missing environment variables, and optimized for performance.

### 1.1 Technology Stack

**Frontend:** Next.js (App Router), Tailwind CSS, TypeScript, shadcn/ui.

**Backend:** Next.js API Routes / Server Actions.

**Database:** PostgreSQL (hosted on Supabase, accessed via direct connection string), Prisma ORM.

**AI Integration:** Vercel AI SDK.

**Hosting:** Vercel (free tier considerations applied).

## 2. Core Engineering Standards

### 2.1 Security & Authentication

**Custom Auth:** Implement custom role-based access control (RBAC) using bcrypt for password hashing.

**Session Management:** JWT tokens must be stored in HttpOnly, SameSite cookies. Strictly no local storage for tokens. Configure security headers via vercel.json.

**Abuse Prevention:** Integrate Google reCAPTCHA. Implement Redis/Upstash for API rate limiting.

**Environment Variables:** Do not expose sensitive ENV variables to the frontend. Ensure graceful degradation—if an external API key (e.g., AI or SMTP) is missing, the specific feature should disable itself without crashing the app.

### 2.2 Database & ORM Strategy

**Design:** Normalized 3NF schema. Every table must include created_at and updated_at.

**Identifiers:** Enforce unique constraints on username and issue_no.

**Data Integrity:** Implement soft deletes only (no hard deletes). Use Prisma transactions/sessions for operations spanning multiple tables to ensure atomicity.

**Audit Trail:** Maintain a comprehensive history table to track all issue lifecycle events (creation, status changes, severity updates).

### 2.3 API & Business Logic

**Structure:** Isolate all business logic within a services/ directory. API routes should only handle request parsing and response formatting.

**Validation:** Use zod for strict input validation. Share zod schemas between the frontend and backend.

**Responses:** Implement standardized API response utilities for success and error handling.

**Component Restriction:** Client components must never directly call the database.

## 3. Feature Specifications

### 3.1 AI Integration Workflow

**Providers:** Support Gemini, OpenAI, and Claude, with an OpenRouter fallback.

**Execution:** Make a single, pooled AI call to extract all required fields simultaneously.

**Usage:** When a client submits an issue (Title and Description required), use AI to determine: Enhanced Description, Title, Category, and Severity.

**Manager View:** AI provides Suggested Responses, Recommended Actions, and Summaries.

**Safety:** All AI outputs are suggestion-only. The manager must manually apply or edit them. If the AI fails, the UI must gracefully fall back to manual entry.

### 3.2 File Attachments (S3)

**Infrastructure:** Use S3-compatible storage via presigned URLs.

**Security:** Upload URLs expire in 2 minutes; download URLs expire in 5 minutes.

**Limits:** Maximum 5 files per issue, 10MB per file.

**Format:** File keys must follow the pattern:

`{website_id}/{issue_id}/{random_string}.{extension}`

**Allowed Types:** image, pdf, txt, log, excel, word, docx.

### 3.3 Notifications & Real-Time Updates

**Architecture:** Use an asynchronous/background queue approach for notifications to avoid blocking the main API response.

**Channels:** Implement SMTP/Nodemailer for background emails and Vapid API for web push notifications.

**Polling Fallback:** Due to Vercel free-tier WebSocket limitations, implement optimized polling (every 30 seconds) for in-app notifications, active only when the user is logged in and the tab is active.

### 3.4 UI/UX & Optimization

**Design:** Match the visual quality and modern SaaS feel of pixel-future.com.

**Performance:**

* Implement debouncing on global navbar search.
* Use server-side pagination (20 items per page).
* Leverage next/image for image optimization.
* Implement code splitting and dynamic imports.
* Cache dashboard counts and notification data.

## 4. Execution Workflow (Yield & Confirm)

The development must proceed in strictly gated phases. The AI must pause and request human approval before moving to the next phase.

### Phase 1: Database Setup

Propose the Prisma schema based on the Master Plan.

**[YIELD]** Wait for human confirmation.

### Phase 2: Backend & Auth

Implement services, custom auth, and API routes.

**[YIELD]** Wait for human confirmation.

### Phase 3: UI Prototyping

Review the provided **Stitch designs** (`Stitch Design/*.zip` — the canonical,
pixel-perfect source of truth) and map them to frontend components.

**Design source of truth:** the "Stark Modern" system from the Stitch exports —
a high-contrast light-mode SaaS look: white surfaces, deep-navy `secondary`
(#201747), neon-pink `tertiary` (#fe147a) accents, Inter type, Material Symbols
icons. Tokens are implemented 1:1 in `src/app/globals.css` (Tailwind v4 `@theme`)
and documented in `DESIGN_SYSTEM.md`. This supersedes the earlier dark/shadcn
exploration. Shell = fixed left **Sidebar** + top **Navbar** (search, notification
bell, profile) + **Main** content area.

Screens: Login, Dashboard, Websites, Issues list, Issue detail, Report Issue,
Notifications, Clients — App Router pages wired to the Phase 2 APIs/services
(server components for data + RBAC; client components for interactivity).

**[YIELD]** Wait for human confirmation.

### Phase 4: Integration

Connect frontend, AI integrations, S3, and notifications.

**[YIELD]** Wait for human confirmation.

### Phase 5: Pre-Flight

Run:

```bash
npm run lint
tsc --noEmit
```

And RBAC permission testing.

Generate required deliverables:

* README.md
* ARCHITECTURE.md
* AI_WORKFLOW.md
* PRODUCTION_READINESS.md
