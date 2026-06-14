# v0.dev Prompt Playbook — Client Issue Tracker

UI prototyping plan for Phase 3. Contains: (1) the prompt **strategy**, (2) a
**Global Context** block to paste once per v0 session, (3) the **API contract**
(so v0 generates components that match the real backend), and (4) **ready-to-paste
prompts for every screen**, including the Sidebar + Navbar + Main shell.

> The backend is already implemented and was pasted into v0. These prompts build
> the **frontend only**, consuming the exact endpoints + the standardized
> response envelope documented below. Tailwind v4 + shadcn/ui design tokens are
> already wired in `src/app/globals.css` — instruct v0 to reuse them.

---

## 1. Prompt Strategy

**Principles that get the best v0 output:**

1. **One reusable context, then one screen per prompt.** Paste the *Global
   Context* (§2) first in a session, then ask for a single screen/component per
   message. Large "build the whole app" prompts produce shallow, inconsistent UI.
2. **Give v0 the data shape, not just the words.** Every screen prompt below
   embeds the exact endpoint + JSON it must render. v0 designs far better tables,
   badges, and empty states when it knows the real fields and enums.
3. **Design tokens over hex codes.** Tell v0 to use the existing shadcn CSS
   variables (`bg-background`, `text-foreground`, `bg-card`, `border-border`,
   `bg-sidebar`, `text-muted-foreground`, `bg-primary`, …) so every screen is
   theme-consistent and dark-mode ready. Never hard-code colors.
4. **State coverage is mandatory.** Always request loading (skeleton), empty,
   error, and (where relevant) unauthorized/forbidden states. Production UI lives
   or dies on these.
5. **RBAC-aware UI.** Components must accept a `role: "CLIENT" | "MANAGER"` and
   hide/disable manager-only controls (status/severity edit, AI panel, internal
   notes) for clients.
6. **Map enums to design.** Provide v0 the enum→variant mapping (severity color,
   status color) so badges are consistent everywhere.
7. **Iterate with surgical follow-ups** (§14): "tighten spacing", "make the
   status badge a dropdown", "add a skeleton row" — not full rewrites.
8. **Keep it framework-correct.** Next.js App Router + TypeScript + shadcn/ui;
   presentational components take typed props; data fetching is wired in the repo
   during integration (don't let v0 invent its own fetch layer — see §15).

**Design language (pixel-future.com inspiration):** modern B2B SaaS, dark-first,
deep near-black background, glassy/low-contrast cards with subtle borders,
generous spacing, large confident headings, rounded-`xl` corners, soft shadows,
a single vibrant accent for primary actions, and restrained micro-interactions
(hover, focus rings, smooth transitions). Professional, calm, data-dense but
breathable.

---

## 2. Global Context (paste ONCE at the start of each v0 session)

```text
You are building the frontend for "Client Issue Tracker", a production B2B SaaS
for website monitoring + issue resolution. Two roles: CLIENT and MANAGER.

STACK (must follow exactly):
- Next.js (App Router) + TypeScript (strict, no `any`).
- Tailwind CSS v4 + shadcn/ui. The theme tokens already exist as CSS variables
  (background, foreground, card, popover, primary, secondary, muted, accent,
  destructive, border, input, ring, sidebar, sidebar-* , chart-*). ALWAYS use
  Tailwind classes bound to these tokens (bg-background, text-foreground,
  bg-card, border-border, text-muted-foreground, bg-primary, bg-sidebar, etc.).
  Never hard-code hex colors. Support light + dark; dark is the primary look.
- Use lucide-react for icons.
- Components are presentational: accept typed props, emit callbacks. Do NOT
  add a data-fetching layer or call APIs directly inside components — I will wire
  data in the app. Export the prop types.

DESIGN LANGUAGE (inspired by pixel-future.com):
- Modern, dark-first, professional SaaS. Deep near-black background, glassy cards
  with subtle borders, generous spacing, large confident headings, rounded-xl
  corners, soft shadows, one vibrant accent for primary actions, smooth hover/
  focus transitions. Data-dense but breathable. Accessible (WCAG AA, visible
  focus rings, aria labels).

APP SHELL (every authenticated screen lives inside it):
- Left SIDEBAR (collapsible): brand/logo at top, primary nav, role-aware items,
  user mini-card at bottom.
- Top NAVBAR: global search (left/center), notification bell with unread badge,
  profile badge (avatar initials + name + role) with dropdown.
- MAIN content area to the right of the sidebar, below the navbar, with a page
  header (title + actions) and scrollable content.

ENUM → VISUAL MAPPING (use consistently in every badge/indicator):
- Website status: ONLINE=green, DEGRADED=amber, DOWN=red, UNKNOWN=gray.
- Issue severity: LOW=slate, MEDIUM=blue, HIGH=amber, CRITICAL=red.
- Issue status: OPEN=blue, IN_REVIEW=violet, IN_PROGRESS=cyan,
  WAITING_FOR_CLIENT=amber, RESOLVED=green, CLOSED=gray.
- Issue type: BUG, FEEDBACK, SUGGESTION, IMPROVEMENT (neutral outline badges).
Render enum labels in Title Case with underscores as spaces (e.g.
"WAITING_FOR_CLIENT" -> "Waiting For Client").

API RESPONSE ENVELOPE (all endpoints):
- Success: { "success": true, "data": <payload>, "meta"?: {...} }
- Error:   { "success": false, "error": { "code": string, "message": string, "details"?: any } }
- List meta: { "total": number, "page": number, "pageSize": number, "totalPages": number }
Components should render `data`; show the `error.message` in error states.

RBAC: components accept role: "CLIENT" | "MANAGER". Manager-only UI (edit status,
edit severity, AI suggestions panel, internal notes, "view all clients") is
hidden or disabled for CLIENT.

Acknowledge and wait for the first screen request.
```

---

## 3. API Contract (reference — embed the relevant slice in each prompt)

Types used across screens:

```text
Role: "CLIENT" | "MANAGER"
WebsiteStatus: "ONLINE" | "DOWN" | "DEGRADED" | "UNKNOWN"
IssueType: "BUG" | "FEEDBACK" | "SUGGESTION" | "IMPROVEMENT"
IssueSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
IssueStatus: "OPEN" | "IN_REVIEW" | "IN_PROGRESS" | "WAITING_FOR_CLIENT" | "RESOLVED" | "CLOSED"
NotificationType: "ISSUE_CREATED" | "ISSUE_STATUS_CHANGED" | "ISSUE_SEVERITY_CHANGED" | "ISSUE_RESPONSE" | "ISSUE_RESOLVED" | "ISSUE_COMMENT"
IssueEventType: "CREATED" | "STATUS_CHANGED" | "SEVERITY_CHANGED" | "TYPE_CHANGED" | "TITLE_EDITED" | "DESCRIPTION_EDITED" | "ASSIGNED" | "UNASSIGNED" | "COMMENT_ADDED" | "RESPONSE_ADDED" | "ATTACHMENT_ADDED" | "ATTACHMENT_REMOVED" | "RESOLVED" | "REOPENED" | "CLOSED" | "AI_SUGGESTION_GENERATED" | "AI_SUGGESTION_APPLIED"

SafeUser: { id, username, email, name, role, isActive, createdAt, updatedAt }
```

Endpoints:

```text
AUTH
  POST /api/auth/login   body { username, password, recaptchaToken? }
       -> { success, data: { user: SafeUser } }   (sets HttpOnly cookie)
       429 on too many attempts: headers Retry-After, X-RateLimit-*
  POST /api/auth/logout  -> { success, data: { loggedOut: true } }
  GET  /api/auth/me      -> { success, data: { user: SafeUser | null } }

WEBSITES
  GET  /api/websites?page&pageSize
       -> { success, data: Website[], meta }
       Website: { id, name, url, status: WebsiteStatus, lastCheckedAt: string|null,
                  clientId, openIssues: number, createdAt, updatedAt }
  POST /api/websites (MANAGER) body { name, url, clientId } -> { data: Website }

ISSUES
  GET  /api/issues?page&pageSize&status&severity&type&websiteId&search
       -> { success, data: IssueListItem[], meta }
       IssueListItem: { id, issueNo, title, type, severity, status, createdAt,
                        updatedAt, website: { id, name, url, status },
                        reporter: SafeUser, assignedManager: SafeUser | null }
  POST /api/issues body { websiteId, title, description, type, severity }
       -> { data: Issue }   (201)
  GET  /api/issues/:id
       -> { data: IssueDetail }
       IssueDetail: { id, issueNo, title, description, type, severity, status,
                      resolvedAt, closedAt, createdAt, updatedAt,
                      website: { id, name, url, status, clientId },
                      reporter: SafeUser, assignedManager: SafeUser | null,
                      attachments: Attachment[],
                      aiSuggestion: AiSuggestion | null,   // MANAGER only
                      _count: { comments: number } }
  PATCH /api/issues/:id/status   (MANAGER) body { status, note? } -> { data: Issue }
  PATCH /api/issues/:id/severity (MANAGER) body { severity, note? } -> { data: Issue }
  GET  /api/issues/:id/comments  -> { data: Comment[] }
       Comment: { id, body, isInternal, createdAt, author: SafeUser }
  POST /api/issues/:id/comments  body { body, isInternal? } -> { data: Comment } (201)
  GET  /api/issues/:id/timeline  -> { data: IssueEvent[] }
       IssueEvent: { id, type: IssueEventType, fromValue, toValue, message,
                     metadata, createdAt, actor: SafeUser | null }

NOTIFICATIONS
  GET  /api/notifications?page&pageSize&unreadOnly
       -> { success, data: Notification[], meta: { ...pagination, unread: number } }
       Notification: { id, type: NotificationType, title, body, issueId: string|null,
                       readAt: string|null, createdAt }
  POST /api/notifications/:id/read   -> { data: Notification }
  POST /api/notifications/read-all   -> { data: { updated: number } }

ATTACHMENT (read-only in UI): { id, fileName, extension, mimeType, sizeBytes, status }
AI SUGGESTION (manager): { status, suggestedTitle, suggestedCategory, suggestedSeverity,
  enhancedDescription, summary, recommendedActions, suggestedResponse, provider, model }
```

---

## 4. Screen — App Shell (Sidebar + Navbar + Main)

```text
Build the authenticated APP SHELL layout: a fixed left Sidebar, a top Navbar, and
a Main content area. Export <AppShell role={...} user={...}>{children}</AppShell>.

SIDEBAR (use shadcn Sidebar; collapsible to icon-only on toggle, and a Sheet
drawer on mobile):
- Top: brand row — small logo mark + "Issue Tracker" wordmark.
- Primary nav (lucide icons + label, active state highlighted with bg-sidebar-accent):
    • Dashboard            (LayoutDashboard)  -> /dashboard
    • Websites             (Globe)            -> /websites
    • Issues               (Bug)              -> /issues
    • Notifications        (Bell)             -> /notifications   (show unread count pill)
  MANAGER-only items (render only when role === "MANAGER"):
    • Clients              (Users)            -> /clients
  Primary CTA button under the nav:
    • CLIENT: "Report Issue" (Plus)   -> /issues/new
    • MANAGER: "All Issues" quick filter
- Bottom: user mini-card — avatar (initials from user.name), name, role label,
  and a small settings/logout affordance.

NAVBAR (sticky top, inside the main column, h-14, border-b, bg-background/80
backdrop-blur):
- Left: a global SEARCH input (Search icon, placeholder "Search issues…",
  rounded-lg, max-w-md). Expose onSearch(query: string) — it will be debounced by
  the parent. On mobile show a search icon that expands.
- Right cluster:
    • Notification BELL button with an unread-count badge (red dot + number);
      clicking opens a dropdown panel (see Notifications dropdown prompt).
    • PROFILE BADGE: avatar initials + name + role; opens a dropdown menu with
      "Profile", "Settings" (manager), and "Log out".
    • A theme toggle (Sun/Moon) is a nice touch.

MAIN: render a page-header slot (title + right-aligned actions) and the children
in a max-w-screen-2xl container with comfortable padding; content scrolls, shell
stays fixed.

Use design tokens (bg-sidebar, bg-background, border-border, text-muted-foreground,
bg-sidebar-accent for active). Fully responsive, keyboard accessible, aria labels
on icon buttons. Provide TypeScript prop types:
  type ShellUser = { name: string; role: "CLIENT" | "MANAGER"; email: string };
  props: { role, user: ShellUser, unreadCount: number, onSearch, onLogout, children }
```

---

## 5. Screen — Login

```text
Build a polished LOGIN screen (public, no shell). Centered glassy card on a dark
gradient background with subtle product branding on one side (split layout on
desktop, stacked on mobile).

Form fields: username (text), password (with show/hide toggle). Primary button
"Sign in" with a loading spinner state. Below: small helper text. Include an
optional reCAPTCHA slot (render a placeholder box only if recaptchaEnabled is
true — the token is wired in the app).

States: idle, submitting (disable inputs + spinner), error (inline alert showing
error.message, e.g. "Invalid username or password"), and a rate-limited variant
(when status 429: show "Too many attempts, try again in {n}s" using Retry-After).

API it maps to:
  POST /api/auth/login  body { username, password, recaptchaToken? }
  success -> { success: true, data: { user } }
  error   -> { success: false, error: { code, message } }  (401 invalid, 429 limited)

Export <LoginForm onSubmit={(values)=>Promise} recaptchaEnabled={boolean} />
with typed values { username: string; password: string; recaptchaToken?: string }.
Use shadcn Card, Input, Label, Button, Alert. Strong visual quality.
```

---

## 6. Screen — Dashboard (role-aware overview)

```text
Build a DASHBOARD overview page (inside AppShell). Page header "Dashboard" with a
subtitle greeting "Welcome back, {firstName}".

TOP: a row of 4 stat cards (KPI cards with icon, big number, label, subtle trend
caption). 
- CLIENT: "My Websites", "Open Issues", "In Progress", "Resolved (30d)".
- MANAGER: "Total Issues", "Open", "Waiting For Client", "Resolved (30d)".

MIDDLE (2-column on desktop):
- Left: "Recent Issues" — compact list/table of the latest 5 issues (issueNo,
  title, severity badge, status badge, relative time). Row click -> issue detail.
- Right: "Websites at a glance" (CLIENT) or "Severity breakdown" (MANAGER, small
  bar/donut using chart tokens chart-1..5).

BOTTOM: "Recent Activity" timeline feed (last few IssueEvents, compact).

States: skeleton cards + skeleton rows while loading; empty states with a friendly
illustration/icon and a CTA ("Report your first issue" for clients).

Data shapes (rendered, not fetched here):
- stats: { label: string; value: number; icon: string }[]
- recentIssues: IssueListItem[]   (see contract)
- recentActivity: IssueEvent[]
Accept everything as typed props; expose onSelectIssue(id). Keep it data-dense but
breathable, all using design tokens.
```

---

## 7. Screen — Websites Dashboard

```text
Build the WEBSITES page (inside AppShell). Page header "Websites" with a manager-
only "Add Website" button on the right.

Render a responsive grid of WEBSITE CARDS. Each card shows:
- name (bold) + url (muted, truncated, external-link icon).
- a status pill: ONLINE=green, DEGRADED=amber, DOWN=red, UNKNOWN=gray (dot + label).
- "Last checked" relative time (e.g. "2 min ago").
- "Open issues" count with a small badge; clicking the card -> /websites/:id (or
  filters issues by website).
Provide a table view toggle for dense scanning (name, url, status, last checked,
open issues, actions).

States: skeleton grid while loading; empty state ("No websites yet"); error state.

API it maps to:
  GET /api/websites?page&pageSize -> { data: Website[], meta }
  Website: { id, name, url, status, lastCheckedAt, openIssues, createdAt, updatedAt }

Manager-only "Add Website" opens a dialog (shadcn Dialog) with fields name, url,
and a client (owner) select. On submit -> onCreate(values).
Server-side pagination: render a Pagination control bound to meta
{ page, totalPages }; expose onPageChange(page). Export typed props.
```

---

## 8. Screen — Issues List

```text
Build the ISSUES list page (inside AppShell). Page header "Issues" with a CLIENT
"Report Issue" button on the right.

TOOLBAR: a search input (debounced, expose onSearch), plus filter controls:
- Status (multi or single select), Severity, Type, Website. Render as shadcn
  Select/Combobox or filter chips. Expose onFilterChange(filters).
- Active filters shown as removable chips.

TABLE (shadcn Table, server-paginated): columns
- Issue # (issueNo, monospace, muted)
- Title (bold, truncate; subtitle = website name)
- Type (outline badge)
- Severity (colored badge per mapping)
- Status (colored badge per mapping)
- Reporter (avatar + name)
- Assigned manager (avatar or "—")
- Updated (relative time)
Row click -> onSelectIssue(id). Sticky header, zebra-free, hover highlight.

States: skeleton rows while loading; empty state with CTA; error row.
Pagination control bound to meta; expose onPageChange.

API it maps to:
  GET /api/issues?page&pageSize&status&severity&type&websiteId&search
  -> { data: IssueListItem[], meta: { total, page, pageSize, totalPages } }
  IssueListItem: { id, issueNo, title, type, severity, status, updatedAt,
                   website: { id, name }, reporter: SafeUser,
                   assignedManager: SafeUser | null }

Export typed props: { issues, meta, filters, onFilterChange, onSearch,
onSelectIssue, onPageChange, role }. Manager sees all; client sees only theirs
(the API enforces this — UI just renders).
```

---

## 9. Screen — Issue Detail

```text
Build the ISSUE DETAIL page (inside AppShell). Two-column layout on desktop
(main + right rail), single column on mobile.

HEADER: issueNo (monospace, muted) + title (large). Row of badges: type,
severity, status. Meta line: "Reported by {reporter.name} • {website.name} •
{relative createdAt}". 
- MANAGER controls (hidden for CLIENT): Status as an inline dropdown (the 6
  statuses) and Severity as an inline dropdown (the 4 levels); changing either
  opens a small confirm with an optional "note" field. Expose
  onChangeStatus(status, note?) and onChangeSeverity(severity, note?).

MAIN COLUMN:
- "Description" card (render description; preserve line breaks).
- "Attachments" card: list of files (icon by extension, fileName, size). Read-only.
- "Conversation" thread: comments in order. Each bubble = author avatar + name +
  role chip + relative time + body. MANAGER messages styled as "responses";
  internal notes (isInternal) show only to MANAGER with a distinct "Internal"
  tag/locked style. A composer at the bottom: textarea + send; MANAGER gets an
  "Internal note" toggle. Expose onAddComment({ body, isInternal? }).

RIGHT RAIL:
- "Details" card: website (link), reporter, assigned manager, created/updated,
  resolved/closed timestamps.
- "Timeline" card: vertical activity feed from IssueEvents (icon per event type,
  human sentence e.g. "Maya changed status from Open to In Progress", relative
  time). Include CREATED, STATUS_CHANGED, SEVERITY_CHANGED, ASSIGNED, COMMENT/
  RESPONSE_ADDED, RESOLVED, REOPENED, CLOSED, AI_SUGGESTION_* .
- MANAGER-ONLY "AI Suggestions" card: shows aiSuggestion fields (suggested title,
  category, severity, summary, recommended actions, suggested response). Each
  suggestion has "Apply" and "Edit" affordances and an "AI" badge + provider/model
  caption. Make clear these are suggestions only. Hidden entirely for CLIENT and
  when aiSuggestion is null (show a subtle "Generate suggestions" button instead).

States: skeleton, error, and a not-found/forbidden state.

API it maps to:
  GET   /api/issues/:id            -> { data: IssueDetail }
  GET   /api/issues/:id/comments   -> { data: Comment[] }
  GET   /api/issues/:id/timeline   -> { data: IssueEvent[] }
  POST  /api/issues/:id/comments   body { body, isInternal? }
  PATCH /api/issues/:id/status     (MANAGER) body { status, note? }
  PATCH /api/issues/:id/severity   (MANAGER) body { severity, note? }
(see contract for IssueDetail / Comment / IssueEvent / AiSuggestion shapes)

Export typed props with all callbacks above plus role.
```

---

## 10. Screen — Report Issue (create)

```text
Build the REPORT ISSUE form (inside AppShell), used by CLIENT (manager may also
use it). Page header "Report an issue".

A single clean form card:
- Website select (required) — options come from the client's websites.
- Title (required, 3–160 chars, live counter).
- Description (required, textarea, 10–10,000 chars, live counter).
- Type select: Bug / Feedback / Suggestion / Improvement (default Bug).
- Severity select: Low / Medium / High / Critical (default Medium), shown as
  colored options.
- Optional attachment dropzone (UI only — uploads are presigned later; show
  selected files with name/size and a remove button; max 5 files, 10MB each).
Primary "Submit issue" button with loading state; secondary "Cancel".

Inline validation messages mirror the constraints above. On success show a success
state / toast and expose onSubmitted(issue).

API it maps to:
  POST /api/issues  body { websiteId, title, description, type, severity }
  -> { data: Issue } (201);  validation errors -> 422 { error.details }

Export <ReportIssueForm websites={{id,name}[]} onSubmit={(values)=>Promise} />
with typed values. Use shadcn Form/Input/Textarea/Select/Button.
```

---

## 11. Component — Notifications (dropdown + full page)

```text
Build TWO related pieces.

A) NOTIFICATION DROPDOWN (opens from the navbar bell):
- Header "Notifications" + "Mark all as read" action.
- A scrollable list of recent notifications: icon by type, title (bold), body
  (muted, truncated), relative time. Unread items have a left accent bar / dot and
  bg-accent tint; clicking one marks it read and navigates to its issue.
- Footer link "View all" -> /notifications. Empty state "You're all caught up".

B) NOTIFICATIONS PAGE (inside AppShell): full list with a "Unread only" toggle,
server-side pagination, "Mark all as read" button, and per-item read on click.

Type → icon/label mapping:
  ISSUE_RESOLVED (CheckCircle, green), ISSUE_STATUS_CHANGED (RefreshCw),
  ISSUE_SEVERITY_CHANGED (AlertTriangle), ISSUE_RESPONSE (MessageSquare),
  ISSUE_COMMENT (MessageCircle), ISSUE_CREATED (PlusCircle).

API it maps to:
  GET  /api/notifications?page&pageSize&unreadOnly
       -> { data: Notification[], meta: { ...pagination, unread } }
       Notification: { id, type, title, body, issueId, readAt, createdAt }
  POST /api/notifications/:id/read
  POST /api/notifications/read-all

Notes for the app (not v0): poll GET /api/notifications?unreadOnly=true every 30s,
ONLY while logged in and document.visibilityState === "visible".

Export typed props: dropdown { items, unread, onItemClick, onMarkAllRead, onViewAll };
page { items, meta, unreadOnly, onToggleUnread, onPageChange, onItemClick,
onMarkAllRead }.
```

---

## 12. Component — Profile badge & menu

```text
Build the PROFILE BADGE for the navbar: a button showing an avatar (initials from
name), the user's name, and a small role label (CLIENT/MANAGER) underneath or as
a chip. Clicking opens a shadcn DropdownMenu:
- header row: avatar + name + email
- items: "Profile", "Settings" (MANAGER only), separator, "Log out" (destructive).
Expose onLogout() and onNavigate(path). Compact, accessible, design-token styled.
```

---

## 13. Cross-cutting — shared UI primitives

```text
Build a small set of SHARED, reusable presentational components used across the
app, each typed and token-styled:

1. <SeverityBadge severity={IssueSeverity} /> — colored per mapping.
2. <StatusBadge status={IssueStatus} /> — colored per mapping, Title-cased label.
3. <WebsiteStatusPill status={WebsiteStatus} /> — dot + label.
4. <TypeBadge type={IssueType} /> — neutral outline.
5. <UserAvatar name role size /> — initials avatar with optional role ring.
6. <RelativeTime value={ISOstring} /> — "2 min ago", title=absolute.
7. <EmptyState icon title description action? /> and <ErrorState message onRetry? />.
8. <Pagination page totalPages onPageChange /> — compact, accessible.
9. <DataTable> wrapper around shadcn Table with skeleton + empty states.

Return them as separate components with exported prop types. These must be the
single source of truth for enum→color so every screen stays consistent.
```

---

## 14. Iteration / refinement follow-ups (use sparingly, one at a time)

```text
- "Tighten the vertical spacing and reduce the card padding by one step."
- "Make the status badge in the issue header an inline dropdown (manager only)."
- "Add skeleton loading rows that match the real table columns."
- "The empty state feels plain — add a lucide icon and a primary CTA."
- "Improve mobile: collapse the sidebar to a Sheet and stack the two columns."
- "Ensure all interactive elements have visible focus rings and aria-labels."
- "Replace any hard-coded colors with the corresponding design tokens."
- "Add a subtle hover transition and active state to sidebar nav items."
```

---

## 15. Mapping v0 output → repo (Phase 3 integration checklist)

When pasting v0 components back into the project:

1. **Place files** under `src/components/` (shared in `src/components/ui` from
   shadcn; feature components in `src/components/<feature>/`).
2. **Keep components presentational.** Wire data in App Router pages / Server
   Components that fetch the real endpoints and pass typed props down. Client
   interactivity (search debounce, dropdowns, polling) lives in small
   `"use client"` wrappers.
3. **Reuse the real types.** Derive prop types from the backend contract (and,
   where possible, from Prisma/zod types) so the UI can't drift from the API.
4. **Standardized envelope:** write one `fetchApi<T>()` helper that unwraps
   `{ success, data, meta }` and throws on `{ success:false }` using `error.message`.
5. **RBAC at the edge:** read the session (`GET /api/auth/me` / server session)
   and pass `role` into the shell; protect routes server-side too — never rely on
   hidden UI alone.
6. **Tokens already exist** in `src/app/globals.css` (Tailwind v4 `@theme` +
   shadcn variables) — do not duplicate; just use the classes.
7. **Verify** after each batch: `npx tsc --noEmit`, `npx next lint`,
   `npm run build`.
8. **Accessibility + states pass** before marking a screen done (loading, empty,
   error, unauthorized).

---

### Screen coverage checklist
- [ ] App Shell (Sidebar + Navbar + Main)
- [ ] Login
- [ ] Dashboard (client + manager)
- [ ] Websites dashboard
- [ ] Issues list (filters + pagination + search)
- [ ] Issue detail (status/severity/comments/timeline/AI)
- [ ] Report issue (create)
- [ ] Notifications (dropdown + page)
- [ ] Profile badge & menu
- [ ] Shared primitives (badges, avatar, empty/error, pagination, table)
