---
name: Deep Obsidian
colors:
  surface: '#0f131c'
  surface-dim: '#0f131c'
  surface-bright: '#353943'
  surface-container-lowest: '#0a0e17'
  surface-container-low: '#181b25'
  surface-container: '#1c1f29'
  surface-container-high: '#262a34'
  surface-container-highest: '#31353f'
  on-surface: '#dfe2ef'
  on-surface-variant: '#d8c3ad'
  inverse-surface: '#dfe2ef'
  inverse-on-surface: '#2c303a'
  outline: '#a08e7a'
  outline-variant: '#534434'
  surface-tint: '#ffb95f'
  primary: '#ffc174'
  on-primary: '#472a00'
  primary-container: '#f59e0b'
  on-primary-container: '#613b00'
  inverse-primary: '#855300'
  secondary: '#ffb77d'
  on-secondary: '#4d2600'
  secondary-container: '#d97707'
  on-secondary-container: '#432100'
  tertiary: '#c1cce4'
  on-tertiary: '#263143'
  tertiary-container: '#a6b1c8'
  on-tertiary-container: '#394457'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffddb8'
  primary-fixed-dim: '#ffb95f'
  on-primary-fixed: '#2a1700'
  on-primary-fixed-variant: '#653e00'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ffb77d'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#6e3900'
  tertiary-fixed: '#d8e3fb'
  tertiary-fixed-dim: '#bcc7de'
  on-tertiary-fixed: '#111c2d'
  on-tertiary-fixed-variant: '#3c475a'
  background: '#0f131c'
  on-background: '#dfe2ef'
  surface-variant: '#31353f'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.04em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.03em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  metric-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container-padding-desktop: 40px
  container-padding-mobile: 20px
  gutter: 24px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style
The design system embodies a "Deep Obsidian" aesthetic—a luxury fintech environment that feels authoritative, ultra-sleek, and futuristic. It is designed for high-net-worth users who value precision and exclusivity.

The visual style is a sophisticated blend of **Glassmorphism** and **High-Contrast Minimalism**. The interface relies on deep, infinite backgrounds punctuated by sharp, metallic accents and soft atmospheric glows. The emotional response should be one of "controlled power" and "digital craftsmanship." Every interaction must feel weighted and silky, utilizing micro-glows to indicate focus and status without cluttering the visual field.

## Colors
The palette is rooted in a dark-mode-first philosophy. The core is **Deep Obsidian (#090D16)**, serving as the infinite canvas. 

- **Primary Accent:** A metallic gradient from Warm Gold (#F59E0B) to Amber Gold (#D97706) used sparingly for high-intent actions and critical data points.
- **Surface Geometry:** Surfaces use a semi-transparent Slate (#0F172A) at 65% opacity, requiring a 20px backdrop blur to maintain legibility against background glows.
- **Atmospheric Glows:** Use low-opacity (5-10%) radial gradients of #1E293B and #D97706 behind primary containers to create a sense of depth and "under-lighting."
- **Semantic Colors:** Emerald Teal is used for growth and success metrics; Crimson Amber is reserved for risk alerts and deletions.

## Typography
The typography system prioritizes high-readability and institutional authority. **Inter** is the workhorse for all interface elements, utilizing tight letter-spacing in display sizes to create a dense, premium feel.

For financial data, metrics, and timestamps, **Tabular Numbers** must be enabled to ensure vertical alignment in data grids. **JetBrains Mono** (or a similar monospace) is utilized for small labels and metadata to lean into the futuristic, technical nature of the platform. All headlines should be set with negative letter-spacing to enhance the "sleek" aesthetic.

## Layout & Spacing
This design system utilizes a **Fluid Grid** with a 12-column structure for desktop and a 4-column structure for mobile. 

The spacing rhythm is strictly based on an **8px linear scale**. Margin and padding should be generous to allow the "Deep Obsidian" background to breathe, preventing the glass layers from feeling cluttered. Content blocks are separated by significant vertical "stacks" (48px+) to delineate different financial modules. All containers should use a consistent 24px gutter to maintain a rigorous alignment of financial data columns.

## Elevation & Depth
Depth is not communicated through shadows, but through **Tonal Layering** and **Transparency**.

- **Level 0 (Base):** Deep Obsidian (#090D16) with subtle, large-scale radial blurs of #1E293B.
- **Level 1 (Surface):** Semi-transparent Slate (#0F172A) at 65% opacity with a 20px backdrop-blur. 
- **Edges:** Surfaces are defined by a 1px solid border. Use a linear gradient for borders (Top-Left: White at 15% opacity to Bottom-Right: White at 5% opacity) to simulate a "glowing top edge."
- **Level 2 (Floating/Active):** High-intensity micro-glows. When an element is hovered or active, its border-opacity increases, and a faint outer glow of the Primary Accent (Gold) is applied with a 15px spread at 20% opacity.

## Shapes
The shape language is "Soft" yet precise. 

A consistent **0.25rem (4px)** radius is used for small components like inputs and checkboxes, while **0.5rem (8px)** is used for primary cards and buttons. This avoids the playfulness of hyper-rounded corners, maintaining a professional and "architectural" feel. Interactive elements should never be fully pill-shaped; they must retain their geometric integrity.

## Components

- **Buttons:** 
  - *Primary:* Solid Metallic Gold gradient background with dark text. No shadow; instead, use a 4px Gold outer glow on hover.
  - *Secondary:* Ghost style with the 1px "glowing edge" border and white text.
- **Cards:** Use the Level 1 Surface definition (65% opacity, 20px blur). Ensure all cards have a 1px top-down gradient border to separate them from the obsidian base.
- **Input Fields:** Darker than the surface (#020617) at 80% opacity. On focus, the 1px border transitions to a Primary Gold, and the background adds a subtle gold inner-glow.
- **Data Grids:** No horizontal or vertical lines. Use alternating row backgrounds (3% white opacity) and ensure all numbers use the `metric-xl` or `body-md` tokens with tabular spacing.
- **Chips/Status:** Small, monospace text with a 10% opacity background of the semantic color (e.g., 10% Teal for "Success").
- **Glow Accents:** Use "Light Orbs" (radial gradients) positioned behind key cards to draw the eye to critical portfolio metrics.