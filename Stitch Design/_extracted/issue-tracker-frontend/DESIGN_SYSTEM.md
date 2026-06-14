# Client Issue Tracker - Design System

## Overview

The Client Issue Tracker frontend implements a **pixel-future.com inspired** dark-first modern SaaS design language with professional, calm aesthetic. All styling uses semantic design tokens defined in `src/app/globals.css` with no hardcoded colors.

---

## Color System

### Primary Design Tokens

All colors use **OKLCh color space** for better perceptual uniformity in dark mode.

#### Dark Theme (Primary)
- **Background**: `oklch(0.11 0 0)` - Deep near-black
- **Card**: `oklch(0.17 0.01 250)` - Slightly lighter cards with subtle blue tint
- **Foreground**: `oklch(0.95 0.01 250)` - Off-white text with blue undertone
- **Primary**: `oklch(0.52 0.22 250)` - Vibrant blue accent (primary actions)
- **Accent**: `oklch(0.64 0.2 250)` - Lighter blue for secondary elements
- **Muted**: `oklch(0.25 0.01 250)` - Muted text and backgrounds
- **Destructive**: `oklch(0.63 0.22 27)` - Red for errors/danger

### Status Badge Colors

**Website Status:**
- `ONLINE`: Green (`oklch(0.62 0.22 142)`)
- `DOWN`: Red (`oklch(0.63 0.22 27)`)
- `DEGRADED`: Amber (`oklch(0.75 0.2 70)`)
- `UNKNOWN`: Gray (uses `--muted`)

**Issue Severity:**
- `LOW`: Light blue (`oklch(0.55 0.08 250)`)
- `MEDIUM`: Blue (`oklch(0.62 0.22 250)`)
- `HIGH`: Amber (`oklch(0.75 0.2 70)`)
- `CRITICAL`: Red (`oklch(0.63 0.22 27)`)

**Issue Status:**
- `OPEN`: Blue (`oklch(0.62 0.22 250)`)
- `IN_REVIEW`: Violet (`oklch(0.62 0.2 310)`)
- `IN_PROGRESS`: Cyan (`oklch(0.65 0.2 200)`)
- `WAITING_FOR_CLIENT`: Amber (`oklch(0.75 0.2 70)`)
- `RESOLVED`: Green (`oklch(0.62 0.22 142)`)
- `CLOSED`: Gray (uses `--muted`)

---

## Component Design Patterns

### Cards & Containers

All card-based components follow the "glassy" design pattern:

```css
.card {
  @apply bg-card border border-border rounded-xl p-6 shadow-soft;
}
```

**Key Characteristics:**
- Rounded corners: `rounded-xl` (1.4x base radius)
- Subtle border: 8% opacity white on dark theme
- Soft shadow: `shadow-lg shadow-black/20`
- Padding: `p-6` for generous spacing
- Hover state: `hover:border-primary/30` for interaction feedback

### Typography

**Headings:**
- Page titles: `text-3xl font-bold text-foreground`
- Section titles: `text-2xl font-bold text-foreground`
- Subsections: `text-xl font-semibold text-foreground`

**Body Text:**
- Standard: `text-sm text-muted-foreground`
- Labels: `text-xs font-medium text-muted-foreground uppercase tracking-wide`

### Badges

All status badges use semi-transparent backgrounds with matching borders:

```tsx
// Example: Severity badge
<span className="text-amber-500 bg-amber-500/10 border border-amber-500/30 
                 inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold">
  High
</span>
```

**Badge Properties:**
- Padding: `px-3 py-1` (compact but readable)
- Border: 30% opacity matching text color
- Background: 10% opacity matching text color
- Radius: `rounded-lg` (less aggressive than cards)
- Font: `text-xs font-semibold`

### Tables

- Header: `bg-muted/30` with `uppercase tracking-wider` labels
- Rows: `hover:bg-muted/20 transition-smooth` for interactive feedback
- Cells: `px-6 py-4` for comfortable spacing
- Links: `text-primary hover:text-accent transition-colors`

### Buttons

Primary buttons use the vibrant accent color:
- Default: `bg-primary text-primary-foreground`
- Hover: Darker shade with smooth transition
- Size options: `sm`, `md` (default), `lg`

---

## Layout & Spacing

### Application Shell

**Sidebar:**
- Width: `w-64` (fixed, collapsible on mobile)
- Background: `bg-sidebar` (dark with subtle blue tint)
- Border: `border-r border-sidebar-border`

**Navbar:**
- Height: `h-16` (includes padding)
- Background: `bg-card`
- Border: `border-b border-border`

**Main Content:**
- Padding: `p-6` (generous margins)
- Max width: Responsive, no hard cap
- Spacing between sections: `space-y-8` or `space-y-6`

### Grid Layouts

**Dashboard Stats:**
```css
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4
```

**Responsive Approach:**
- Mobile: Single column
- Tablet: 2 columns
- Desktop: 4 columns (stats), 3 columns (websites), 2 columns (grids)

---

## Micro-interactions

### Transitions

```css
.transition-smooth {
  @apply transition-all duration-200 ease-out;
}
```

**Applied to:**
- Hover states on cards: `hover:border-primary/30 transition-smooth`
- Link color changes: `hover:text-accent transition-colors`
- Table rows: `hover:bg-muted/20 transition-smooth`
- Button interactions

### Focus States

All interactive elements use the ring color for focus visibility:
- Default ring: `outline-ring/50`
- Focus ring: `ring-2 ring-primary`

---

## Page-Specific Styling

### Login Page

- Centered layout with max-width container
- Large heading: `text-3xl font-bold`
- Form card: `bg-card border border-border rounded-xl p-6 shadow-lg`
- Demo credentials in subtle background: `bg-muted/30 rounded-lg p-3`

### Dashboard

**Stat Cards:**
- Grid layout: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
- Icons: Large (12x12) with 20% opacity color matching
- Numbers: Large and bold using status color

**Recent Issues Table:**
- Header: Uppercase labels with wide letter spacing
- Rows: Light hover effect, smooth transitions
- Severity/Status: Color-coded badges with borders

### Issues Page

**List View:**
- Table with full width and scroll capability
- Multiple filter options visible
- Status/severity badges with consistent coloring

**Detail View:**
- Two-column layout: Main content + sidebar
- Expandable sections for timeline and comments
- AI suggestions panel (manager-only) with highlighted styling

### Websites Page

- Card grid layout: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Website status indicator with live color
- Open issues count prominently displayed
- Action buttons in card footer

---

## Accessibility

### Color Contrast

All text colors meet WCAG AA standards on dark backgrounds:
- Foreground on background: 16:1+ contrast
- Muted foreground on background: 8:1+ contrast
- Badge text colors: 5:1+ contrast minimum

### Focus Indicators

- Visible focus rings on all interactive elements
- Ring color: Primary accent for high visibility
- Ring width: 2px with outer opacity

### Semantic HTML

- Proper heading hierarchy (h1 → h6)
- Form labels associated with inputs
- ARIA labels for icon-only buttons
- Alt text for images

---

## Implementation Details

### CSS Variables in Tailwind v4

The design system uses Tailwind v4's new CSS-based configuration:

```css
@theme inline {
  --color-background: var(--background);
  --color-card: var(--card);
  --color-primary: var(--primary);
  /* etc... */
}
```

This allows Tailwind classes to reference CSS variables:
- `bg-background`
- `text-foreground`
- `border-border`
- etc.

### Adding New Colors

To add a new semantic color:

1. Define CSS variable in `:root` and `.dark`
2. Add to `@theme` mapping in globals.css
3. Use in components via Tailwind class: `bg-[new-color]`

### Utility Classes

Custom utility classes defined in `globals.css`:

```css
.transition-smooth { @apply transition-all duration-200 ease-out; }
.glass-card { @apply bg-card/50 backdrop-blur-sm border border-border rounded-xl; }
.shadow-soft { @apply shadow-lg shadow-black/20; }
```

---

## Design Rationale

### Why OKLCh?

OKLCh provides:
- Perceptually uniform colors across lightness ranges
- Better saturation control than sRGB/HSL
- Consistent appearance in dark mode
- Better color harmony

### Why Subtle Accents?

- Reduces visual noise
- Focuses attention on important content
- Professional, calm aesthetic
- Complies with modern SaaS design trends

### Why Consistent Spacing?

- `p-6` and `gap-4` create visual rhythm
- Multiples of 4px follow web standards
- Generous spacing prevents cognitive overload
- Maintains data-dense but breathable layout

---

## Future Enhancements

- [ ] Light mode variant (alternate theme)
- [ ] Animated loading skeletons
- [ ] Gradient accents for premium features
- [ ] Custom chart colors matching badge palette
- [ ] SVG icon colorization via CSS variables
- [ ] Animation library integration (Framer Motion)

---

## References

- **Inspiration**: pixel-future.com
- **Color Space**: OKLCh (okcolor.com)
- **Framework**: Tailwind CSS v4
- **Component Library**: shadcn/ui
- **Icons**: lucide-react
