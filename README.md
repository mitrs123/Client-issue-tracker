# IssueTracker — Client Issue Tracker

## Project Overview
A production-grade B2B SaaS platform for **website monitoring and issue resolution**. Clients report issues against their websites and track progress; managers triage, respond, and manage the full issue lifecycle — with an audit timeline, notifications, optional AI assistance, and file attachments.

> Built across gated phases (DB → Backend/Auth → UI → Integration → Pre-Flight) following a "Yield & Confirm" workflow. The AI-assisted development process is documented in [AI_WORKFLOW.md](AI_WORKFLOW.md); architecture in [ARCHITECTURE.md](ARCHITECTURE.md); production notes in [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md).

### Key Features
- **Two roles (RBAC):** Client and Manager, enforced server-side.
- **Websites dashboard:** status (Online/Degraded/Down/Unknown), last-checked, open-issue counts (mock monitoring).
- **Issues:** create, list (filters + search + server-side pagination), detail. Types (Bug/Feedback/Suggestion/Improvement), severities (Low→Critical), statuses (Open→Closed).
- **Issue management (manager):** update status & severity, respond, internal notes.
- **Timeline / audit trail:** every lifecycle event recorded and shown to both roles.
- **Notifications:** in-app (live unread badge, 30s polling) + background email (Nodemailer) + web push (VAPID) on resolution.
- **AI assistance (optional, multi-provider):** one structured call suggests title, category, severity, enhanced description, summary, recommended actions, and a draft response — **suggestion-only**, manager-reviewed.
- **Attachments (optional):** S3 presigned upload/download.
- **Security:** custom JWT in HttpOnly cookies, bcrypt hashing, in-memory rate limiting, optional Google reCAPTCHA, security headers.

## Graceful Degradation (Environment Variables)
This project is built with **graceful degradation** in mind. 
If you do not set an environment variable for a specific service (like AI, S3, SMTP for emails, VAPID for web push, or reCAPTCHA), **that service is automatically disabled**. 
The lack of an environment variable **will not crash the project** and the rest of the application will continue to function normally. Only the feature dependent on the missing variable will be affected.

## Tech Stack
| Layer | Choice |
|------|--------|
| **Framework** | Next.js 15 (App Router) + React 19 + TypeScript (strict) |
| **Styling** | Tailwind CSS v4 + Material Symbols + Inter ("Stark Modern" design system) |
| **Database** | PostgreSQL (Supabase) via Prisma 6 |
| **Auth** | Custom JWT (`jose`) in HttpOnly cookies + `bcryptjs` |
| **AI** | Vercel AI SDK v6 — Gemini / OpenAI / Anthropic / OpenRouter |
| **Storage** | S3-compatible (AWS SDK v3 presigned URLs) |
| **Email / Push** | Nodemailer (SMTP) / `web-push` (VAPID) |
| **Validation** | Zod (shared client + server) |
| **Hosting** | Vercel |

## Setup Instructions

### Prerequisites
- Node.js 20+ (developed on Node 24)
- A PostgreSQL database (Supabase recommended)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```
*Required variables:* `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` (≥32 chars). 
*Everything else is optional and self-disables when absent.*

### 3. Set Up the Database
```bash
npm run db:push     # apply the Prisma schema
npm run db:seed     # create demo users + sample data
```

## Run Instructions

### 1. Start the Development Server
```bash
npm run dev         # Runs on http://localhost:3000
```

### Demo Logins
| Role | Username | Password |
|------|----------|----------|
| Manager | `manager` | `Manager@123` |
| Client | `client` | `Client@123` |

### Scripts Reference
| Script | Purpose |
|--------|---------|
| `npm run dev` | Start the dev server |
| `npm run build` | `prisma generate` + production build |
| `npm start` | Start the production server |
| `npm run lint` | ESLint (Next + TypeScript rules) |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm test` | Unit tests (`node:test`) |
| `npm run db:push` | Push Prisma schema state to the database |
| `npm audit` | Check for package vulnerabilities |

## Project Structure
```text
prisma/schema.prisma     Data model (9 models, audit trail, soft deletes)
src/app/(auth)/          Public auth routes (login)
src/app/(app)/           Authenticated app (dashboard, websites, issues, …)
src/app/api/             Route handlers (parse → service → standardized response)
src/services/            ALL business logic + RBAC (no DB access elsewhere)
src/lib/                 env, prisma, jwt, cookies, auth, rate-limit, ai, s3,
                         mailer, push, validations, api-client, utils
src/components/          Presentational + small client components
public/sw.js             Web Push service worker
```

## Assumptions Made
- **Client → Website is one-to-many ownership** (`Website.clientId`). Sharing one site across multiple client users would use a join table.
- **Website monitoring is mocked** (status/last-checked are stored fields); a real uptime probe would update them on a schedule.
- **AI is manager-triggered** on the issue detail (a single structured call), kept suggestion-only and reliable rather than auto-running on submit.
- **Attachments are added on an existing issue** (the key needs the issue id); uploads use S3 presigned URLs.
- **Rate limiting is in-memory** (per instance) — see `PRODUCTION_READINESS.md` for the shared-store swap for multi-instance deployments.
- **Background email/push** use a fire-and-forget trigger plus a cron-hit dispatch endpoint so delivery is reliable on serverless without blocking the API.