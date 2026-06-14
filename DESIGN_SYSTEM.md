# Design System — "Stark Modern"

The frontend reproduces the **Stitch designs** (`Stitch Design/*.zip`) pixel-for-
pixel. This document is the canonical reference for the implemented system. It
**supersedes** any earlier dark/shadcn exploration.

> Aesthetic: high-contrast, light-mode, minimalist B2B SaaS — "digital luxury".
> White surfaces, deep-navy structure, a single neon-pink accent, generous
> whitespace, 1px borders instead of heavy shadows.

## Tokens (implemented in `src/app/globals.css` via Tailwind v4 `@theme`)

### Color
| Role | Token (Tailwind class) | Value |
|------|------------------------|-------|
| Background / surface | `surface`, `surface-bright`, `background` | `#fcf8f8` |
| Card surface | `surface-container-lowest` | `#ffffff` |
| Raised surfaces | `surface-container-low/.../highest` | `#f6f3f2 … #e5e2e1` |
| Primary text | `on-surface` | `#1c1b1b` |
| Secondary text | `on-surface-variant` | `#444748` |
| **Secondary (navy)** — headings, nav, branding | `secondary` | `#201747` |
| **Tertiary (neon pink)** — CTAs, active state, accents | `tertiary` | `#fe147a` |
| Primary (neutral gray) | `primary` | `#5d5f5f` |
| Error | `error` / `error-container` | `#ba1a1a` / `#ffdad6` |
| Lines | `outline-variant` | `#c4c7c8` |

Status colors (badges) use Tailwind palette tints for clarity — see
`src/components/badges.tsx` (single source of truth):
- Website: ONLINE green · DEGRADED orange · DOWN red · UNKNOWN slate
- Severity: LOW slate · MEDIUM blue · HIGH orange/pink · CRITICAL red
- Issue status: OPEN pink-tint · IN_REVIEW violet · IN_PROGRESS surface · WAITING orange · RESOLVED green · CLOSED muted

### Typography (Inter, via `next/font`)
`headline-lg` 48/56 (-0.02em, 700) · `headline-md` 32/40 (600) · `body-lg` 18/28 ·
`body-md` 16/24 · `label-md` 14/20 (0.01em, 500). Used as `text-headline-md`,
`font-label-md`, etc.

### Spacing (8px base) & radius
Named scale `xs 4 · base 8 · sm 12 · md 24 · lg 48 · xl 80` → `p-md`, `gap-sm`,
`py-xl`. Radius: `rounded-lg` 0.5rem (controls), `rounded-xl` 0.75rem (cards).

### Icons
**Material Symbols Outlined** (loaded via `<link>` in the root layout), wrapped
by `src/components/icon.tsx` (`<Icon name="dashboard" />`, optional `fill`).

## App Shell
- **Sidebar** (`src/components/sidebar.tsx`) — fixed `w-64`, white surface, brand
  block, role-aware nav (Clients = manager only), active item `text-tertiary
  bg-surface-container`, neon-pink "Report Issue" CTA at the bottom.
- **Navbar** (`src/components/navbar.tsx`) — `h-20`, global debounced search,
  notification bell with live unread badge (polls 30s while tab visible),
  profile badge (initials + name + role) with a dropdown (logout).
- **Main** — `ml-64`, `p-lg`/`p-xl` canvas.

## Data & RBAC pattern
- **Server components** fetch via the `/services` layer with the session user, so
  RBAC and SSR happen together; the client never touches the DB.
- **Client components** (login, filters, report form, comment composer, manager
  status/severity controls, notifications list) call the API routes through
  `src/lib/api-client.ts` (`apiFetch`), which unwraps the standardized envelope
  and surfaces `error.message` + `Retry-After` on 429.

## Screens
Login · Dashboard · Websites · Issues list (filters + search + pagination) ·
Issue detail (description, conversation, timeline, manager status/severity + AI
panel) · Report Issue · Notifications · Clients (manager).

## Accessibility
Inter for legibility, visible focus rings (`focus:ring-tertiary`), `aria-label`s
on icon-only buttons, semantic headings, WCAG-AA contrast on the light surface.
