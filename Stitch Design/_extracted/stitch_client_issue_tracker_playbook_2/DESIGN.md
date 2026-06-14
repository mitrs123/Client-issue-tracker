---
name: Stark Modern
colors:
  surface: '#fcf8f8'
  surface-dim: '#ddd9d9'
  surface-bright: '#fcf8f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f1edec'
  surface-container-high: '#ebe7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#444748'
  inverse-surface: '#313030'
  inverse-on-surface: '#f4f0ef'
  outline: '#747878'
  outline-variant: '#c4c7c8'
  surface-tint: '#5d5f5f'
  primary: '#5d5f5f'
  on-primary: '#ffffff'
  primary-container: '#ffffff'
  on-primary-container: '#747676'
  inverse-primary: '#c6c6c7'
  secondary: '#60578b'
  on-secondary: '#ffffff'
  secondary-container: '#cdc2fd'
  on-secondary-container: '#564d80'
  tertiary: '#bb0057'
  on-tertiary: '#ffffff'
  tertiary-container: '#ffffff'
  on-tertiary-container: '#e7006d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#e6deff'
  secondary-fixed-dim: '#cabffa'
  on-secondary-fixed: '#1c1343'
  on-secondary-fixed-variant: '#484071'
  tertiary-fixed: '#ffd9e0'
  tertiary-fixed-dim: '#ffb1c3'
  on-tertiary-fixed: '#3f0019'
  on-tertiary-fixed-variant: '#8f0041'
  background: '#fcf8f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
---

# Design System: Stark Modern

## Brand & Style
The brand identity has shifted toward a high-contrast, minimalist aesthetic that feels both premium and avant-garde. By utilizing a pure white base paired with a deep midnight navy and a vibrant neon pink, the brand evokes a sense of "digital luxury" and precision.

The style is **Minimalism** with a **High-Contrast** edge. It relies on heavy whitespace to allow the bold tertiary accents to draw immediate attention to key actions. The emotional response should be one of clarity, sophistication, and high-energy modernism.

## Colors
The color palette is dominated by a clean, light-mode foundation.

*   **Primary (#ffffff):** Used for large surfaces, backgrounds, and core structural elements to maintain a pristine, airy feel.
*   **Secondary (#201747):** A deep, saturated navy used for primary text, navigation backgrounds, or high-density information areas to provide strong grounding.
*   **Tertiary (#FE147A):** A vivid neon pink used exclusively for call-to-actions, highlights, and interactive states that require maximum visibility.
*   **Neutral:** Naturally derived from the secondary navy tones to ensure harmonious grays and borders without introducing warmth.

## Typography
We use **Inter** across all levels to maintain a functional, geometric, and highly readable interface. The type scale emphasizes a bold hierarchy, using tight letter spacing and heavy weights for large headlines to create a "Swiss-style" impact.

*   **Headlines:** Set in Bold or Semi-Bold. Large sizes use negative letter spacing to feel compact and modern.
*   **Body:** Set in Regular weight. Line heights are generous (1.5x) to ensure readability against the high-contrast background.
*   **Labels:** Medium weight for utility text, ensuring functional elements remain distinct from body prose.

## Layout & Spacing
The layout follows a **Fluid Grid** model with an 8px base unit. 

*   **Desktop:** 12-column grid with 24px gutters and 80px margins.
*   **Tablet:** 8-column grid with 16px gutters and 40px margins.
*   **Mobile:** 4-column grid with 16px gutters and 16px margins.

The spacing rhythm is intentional and expansive, using large gaps to separate major content sections, reinforcing the minimalist brand style.

## Elevation & Depth
In line with the high-contrast aesthetic, depth is conveyed through **Low-contrast outlines** and sharp tonal changes rather than heavy shadows.

*   **Surface Levels:** White on White uses a 1px border (#201747 at 10% opacity) to define boundaries.
*   **Interactive Depth:** Elements slightly "lift" using a very subtle, tight ambient shadow only when necessary for accessibility.
*   **Overlays:** Modals and menus use a sharp backdrop blur to maintain focus without losing the context of the underlying white space.

## Shapes
The shape language is **Rounded**, balancing the starkness of the colors with approachable geometry. 

*   **Standard Elements:** 0.5rem (8px) radius for buttons and input fields.
*   **Containers:** 1rem (16px) radius for cards and larger surface areas.
*   **Large Sections:** 1.5rem (24px) radius for hero sections or featured modules.

## Components
*   **Buttons:** Primary buttons are solid Tertiary (#FE147A) with white text. Secondary buttons are Secondary (#201747) with white text. Both use 0.5rem corner rounding.
*   **Inputs:** 1px border using a lightened version of the Secondary color. On focus, the border thickens and changes to the Tertiary accent.
*   **Cards:** White backgrounds with a subtle 1px border. No drop shadows are used; instead, use spacing and borders to define the card's container.
*   **Chips:** Small, rounded elements using a pale tint of the secondary navy with bold navy text for high legibility.