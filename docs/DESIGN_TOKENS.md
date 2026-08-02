# CodeMentor Design Tokens

Source of truth: `src/app/globals.css` (Tailwind v4 CSS-first `@theme` block). The tables below
document what's **already defined and in use**, then list the small number of **genuine
additions** this refactor needs (marked NEW). Nothing here proposes a rewrite — this is additive,
matching principle #15 (reuse before creating).

## Colors — Neutral / Ink

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#F8FAFC` | Page background |
| `--color-surface` | `#FFFFFF` | Cards, panels, inputs |
| `--color-border` | `#E5E7EB` | Default 1px borders |
| `--color-border-soft` | `#F3F4F6` | Dividers, subtle fills, tint backgrounds |
| `--color-ink` | `#18181B` | True neutral near-black — primary text on dark surfaces, dark hero/card fills, neutral badges |
| `--color-navy` | `= --color-ink` | **Legacy alias** — kept so existing `bg-navy`/`text-navy` classes keep working. New code may use either name; they're the same value. |
| `--color-text` | `#374151` | Body text |
| `--color-text-muted` | `#6B7280` | Secondary text |
| `--color-text-faint` | `#9CA3AF` | Placeholder / least-important text |

## Colors — Brand (single accent hue)

| Token | Value | Use |
|---|---|---|
| `--color-primary` | `#EA580C` | The one accent — primary CTAs, active states, "danger" |
| `--color-primary-hover` | `#DC4F09` | Hover |
| `--color-primary-active` | `#C2410C` | Pressed/active |
| `--color-primary-tint` | `#FFF7ED` | Low-intensity orange background (badges, banners, note callouts) |
| `--color-brown` | `#78350F` | "Chủ nhóm/Owner" role badge only — not a general-purpose hue |
| `--color-brown-tint` | `#FAF0E6` | Brown-tinted background |

## Colors — Semantic aliases

Only two hues exist in the whole system by design (principle #11/#12). These aliases exist so
component code can read semantically (`text-danger`) without introducing a third hue.

| Semantic | Aliases to |
|---|---|
| `--color-accent` | `--color-ink` |
| `--color-success` | `--color-ink` |
| `--color-ai` | `--color-ink` |
| `--color-danger` | `--color-primary` |
| `--color-accent-tint` / `--color-success-tint` / `--color-ai-tint` | `--color-border-soft` |
| `--color-danger-tint` | `--color-primary-tint` |

## Typography

| Token | Family |
|---|---|
| `--font-sans` | Inter (via `next/font`, weights 400/500/600/700/800) |
| `--font-mono` | Roboto Mono (code, tile initials, numeric stats) |

| Token | Size | Typical use |
|---|---|---|
| `--text-2xs` | 11px | Tightest metadata (chapter/lesson counts) |
| `--text-xs` | 12px | Metadata, badges, captions |
| `--text-sm` | 14px | Body text, default UI |
| `--text-base` | 16px | Emphasized body |
| `--text-lg` | 18px | Card/section titles |
| `--text-xl` | 20px | Section subheads |
| `--text-2xl` | 24px | Page titles (`PageHeader` default) |
| `--text-3xl` | 30px | Marketing section headings |
| `--text-4xl` | 36px | Hero headline, mobile |
| `--text-5xl` | 48px | Hero headline, desktop |

**Weight is the primary hierarchy lever** (principle #9) — prefer stepping weight (500 → 600 →
700) before stepping size when two elements need to differentiate but live at a similar scale.

## Radius

| Token | Value | Use |
|---|---|---|
| `--radius-xs` | 4px | Small tags/chips |
| `--radius-sm` | 6px | Badges, difficulty pills, status labels |
| `--radius-md` | 8px | Buttons, inputs, textareas (component default) |
| `--radius-lg` | 10px | Cards, list rows, stat widgets |
| `--radius-xl` | 12px | Large panels, hero banners, modals |
| `--radius-2xl` | 16px | **NEW** — large feature/hero surfaces only (e.g. a marketing feature card), not dense list cards. Matches Kaggle's measured card radius for the few places CodeMentor wants that softer, larger-surface feel. |
| `rounded-full` (Tailwind builtin) | 9999px | Avatars, icon circles, dots, count badges — never approximate this with the scale above |

## Shadow

| Token | Value | Use |
|---|---|---|
| `--shadow-card` | `0 1px 2px rgba(15,23,42,.06)` | Barely-there — the default `Card` |
| `--shadow-dropdown` | `0 8px 24px rgba(0,0,0,.25)` | Menus, popovers |
| `--shadow-modal` | `0 24px 60px rgba(0,0,0,.35)` | Modals, the mobile filter sheet |

This is the ceiling — no new, heavier shadow tier (see `DESIGN_SYSTEM.md` §7).

## Border

| Convention | Use |
|---|---|
| `1px solid var(--color-border)` | Default card/panel/input border |
| `1px solid var(--color-border-soft)` | Internal divider (between rows in a list) |
| `1.5px solid var(--color-primary)` / `var(--color-ink)` | Active/selected state |

## Spacing scale (4px base)

| Token | Value |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |
| `--space-16` | 64px |

Usage bands: `1`–`2` intra-component (icon-to-label), `3`–`4` internal card/row padding, `5`–`6`
between grid items, `8`+ between major page sections.

## Container / Grid

| Token | Value |
|---|---|
| `--container-max` | 1200px |
| `--container-padding` | 24px (desktop gutter) |
| `--container-padding-sm` | 16px (mobile gutter) |
| `--grid-gap` | 16px (card grid gutter) |

## Breakpoints (Tailwind defaults, documented explicitly)

| Token | Value |
|---|---|
| `--breakpoint-sm` | 640px |
| `--breakpoint-md` | 768px |
| `--breakpoint-lg` | 1024px |
| `--breakpoint-xl` | 1280px |

## Icon sizes

| Token | Value | Use |
|---|---|---|
| `--icon-xs` | 14px | Inline with `text-xs` |
| `--icon-sm` | 16px | Inline with `text-sm` (default) |
| `--icon-md` | 20px | Buttons, standalone |
| `--icon-lg` | 24px | Feature tiles, empty states |

## Component heights

| Token | Value | Use |
|---|---|---|
| `--h-input-sm` | 32px | |
| `--h-input-md` | 40px | |
| `--h-button-sm` | 32px | `Button size="sm"` |
| `--h-button-md` | 40px | `Button size="md"` (default) |
| `--h-topbar` | 64px | Matches Kaggle's live-measured nav height exactly |
| `--h-tile-row` | 36px | `ProblemRow` identity tile |
| `--h-tile-card` | 64px | `EntityCard` identity tile (`tileHeight="sm"`) |

## Button / Input size pairing

| Size | Height | Padding (x) | Font |
|---|---|---|---|
| `sm` | `--h-button-sm` (32px) | 12px | `--text-xs` |
| `md` | `--h-button-md` (40px) | 16px | `--text-sm` |

## Z-index — **NEW, formalizes existing ad-hoc values**

Current code already uses `z-10`, `z-20`, `z-40`, `z-100`/`z-101`, `z-150` as bare Tailwind
utilities scattered across `workspace/*`, `FilterBar`'s mobile sheet, and the onboarding modal.
Formalizing these as named tokens prevents a future component from picking an arbitrary value that
collides with an existing layer.

| Token | Value | Use |
|---|---|---|
| `--z-dropdown` | 20 | Inline dropdowns/popovers (e.g. language picker) |
| `--z-sheet` | 40 | Mobile filter bottom sheet |
| `--z-overlay` | 100 | Full-screen click-away backdrops |
| `--z-modal` | 150 | Centered modals (onboarding, quick-list popup) |

## Animation duration & easing — **NEW, currently only ad-hoc `transition-colors`/`duration-150`**

| Token | Value | Use |
|---|---|---|
| `--duration-fast` | 120ms | Micro-interactions (hover color/border delta) |
| `--duration-base` | 180ms | Default — matches the existing sidebar width transition |
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | The only easing curve used anywhere — no bounce/elastic |

Only `color`, `background-color`, `border-color`, and `transform: translate/rotate` (chevron,
sidebar width) are ever animated — never `box-shadow`, `scale`, or opacity-based "pop" effects
(`DESIGN_SYSTEM.md` §12).

---

## Adding the new tokens

The additions above (`--radius-2xl`, `--z-*`, `--duration-*`, `--ease-standard`) are a handful of
new lines inside the existing `@theme` block in `src/app/globals.css` — no restructuring, no
component API changes. Everything else in this document already exists in the codebase today.
