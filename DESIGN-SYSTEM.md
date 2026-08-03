# CodeMentor Design System

Extracted from the CodeForge mockup (`mock.html`). Single-accent palette: neutral (navy/gray) + one orange accent. `accent`, `success`, and `ai` semantic tokens all alias navy; `danger` aliases primary orange — there are only two hues in the whole UI.

## Colors

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#F8FAFC` | Page background |
| `--color-surface` | `#FFFFFF` | Cards, panels, inputs |
| `--color-border` | `#E5E7EB` | Default 1px borders |
| `--color-border-soft` | `#F3F4F6` | Dividers, subtle fills, tint backgrounds |
| `--color-navy` | `#1F2937` | Primary text color, dark surfaces (headers, hero banners), neutral badges |
| `--color-text` | `#374151` | Body text |
| `--color-text-muted` | `#6B7280` | Secondary text |
| `--color-text-faint` | `#9CA3AF` | Placeholder / least-important text |
| `--color-primary` | `#EA580C` | Accent orange — CTAs, active states, danger |
| `--color-primary-hover` | `#DC4F09` | Hover state of primary |
| `--color-primary-tint` | `#FFF7ED` | Orange-tinted background (badges, banners) |
| `--color-brown` | `#78350F` | "Owner/Chủ nhóm" role badge |
| `--color-brown-tint` | `#FAF0E6` | Brown-tinted background |

Semantic aliases (map straight to the tokens above, do not add new hues):

| Semantic | Aliases |
|---|---|
| `accent`, `success`, `ai` | `navy` / `border-soft` (tint) |
| `danger` | `primary` / `primary-tint` (tint) |

## Dark mode

Dark mode is a **token flip**, not a set of `dark:` variants. Around 1850 of the app's
~2000 colour usages already resolve through the semantic tokens above, so redefining those
tokens under `.dark` converts most of the UI with no component changes at all. Reach for a
`dark:` utility only when a value genuinely cannot be expressed as a token.

The `.dark` block lives **outside** `@theme` in `globals.css`. Tailwind v4 emits theme
variables into a layer, and unlayered rules outrank layered ones, so the overrides win
without `!important`.

| Token | Light | Dark | Note |
|---|---|---|---|
| `--color-bg` | `#FFFFFF` | `#0F0F11` | Page |
| `--color-surface` | `#FFFFFF` | `#18181B` | Cards — **lighter** than `bg`; elevation inverts |
| `--color-border` | `#E5E7EB` | `#2E2E33` | |
| `--color-border-soft` | `#F3F4F6` | `#232327` | |
| `--color-ink` / `navy` | `#18181B` | `#F4F4F5` | Foreground ink — inverts |
| `--color-on-ink` | `#FFFFFF` | `#18181B` | Text **on** an ink fill — inverts the other way |
| `--color-text` | `#374151` | `#D4D4D8` | |
| `--color-text-muted` | `#6B7280` | `#A1A1AA` | |
| `--color-text-faint` | `#9CA3AF` | `#71717A` | |
| `--color-primary` | `#EA580C` | `#FB923C` | Same hue ramp, lighter step |
| `--color-primary-hover` | `#DC4F09` | `#FDBA74` | |
| `--color-primary-active` | `#C2410C` | `#F97316` | |
| `--color-primary-tint` | `#FFF7ED` | `#2A1A0E` | A tint is a **dark** wash in dark mode |
| `--color-brown` | `#78350F` | `#FCD9B6` | |
| `--color-brown-tint` | `#FAF0E6` | `#2E2015` | |
| `--color-ink-fixed` | `#18181B` | `#18181B` | **Never flips** |
| `--color-primary-fixed` | `#EA580C` | `#EA580C` | **Never flips** |

### The three rules the values follow

1. **Elevation inverts.** Light mode puts a white card on a grey page; dark mode puts a
   lighter card on a darker page. `surface` must always sit a step above `bg`.
2. **Orange lightens.** `#EA580C` on near-black is ~3.5:1 — below AA for text. The dark
   steps move **up the same hue ramp**; they are not a second hue, so the two-hue rule holds.
3. **A fill and its text invert in opposite directions.** This is why `--color-on-ink` exists.

### `on-ink` — the one thing to get right

`navy` is read 408× as `text-navy` but 65× as `bg-navy`. A single token cannot serve both:
flipping it turns a `bg-navy text-white` avatar into white-on-white. So ink inverts as the
**foreground**, and anything filled with it pairs `text-on-ink`.

```
✗ <span className="bg-navy text-white">        invisible in dark mode
✓ <span className="bg-navy text-on-ink">       inverts to dark-on-light
```

Primary buttons take `text-on-ink` too: white on the lighter dark-mode orange is 2.1:1.

`text-white` is still correct on surfaces that are dark in **both** themes — the landing
hero, the solve workspace panes. Those don't invert, so nothing there changes.

### What must not flip

Use `ink-fixed` / `primary-fixed` for surfaces whose darkness is the point, not a
consequence of the theme:

- **Code blocks** (`.rich-text pre`, submission source, article snippets) — code is read on a
  dark surface here, matching the Monaco panes.
- **Decorative brand tiles** (the practice collection cards) — their gradients would
  otherwise run light-to-orange beneath white text.

### Preference and application

`useThemeStore` (`lib/store/theme-store.ts`) persists `light | dark | system` and stamps
`.dark` on `<html>`. `ThemeScript` applies the stored value inline in `<head>` before first
paint — without it every load flashes light before hydration. `useResolvedTheme()` returns
the concrete `light | dark` for code that can't use CSS, notably **Monaco**, which ships its
own themes and must be handed `vs` or `vs-dark` explicitly.

## Typography

- **UI font:** Inter, weights 400/500/600/700/800.
- **Monospace font:** Roboto Mono, weights 400/500/600/700 — used for code blocks, tile initials/icons, and numeric stats.
- Headings: `700` weight. Body: `400`. Labels/badges: `500–700` at `10.5–13px`.

## Radius

Deliberately squarer than the mockup — the mockup pills every control (`999px`); this build caps at `12px` and defaults form controls to `8px`.

| Token | Value | Use |
|---|---|---|
| `--radius-xs` | `4px` | Small tags/chips |
| `--radius-sm` | `6px` | Badges, difficulty pills, status labels |
| `--radius-md` | `8px` | Buttons, inputs, textareas — component default |
| `--radius-lg` | `10px` | Cards, list rows, stat widgets |
| `--radius-xl` | `12px` | Large panels, hero banners, modals |
| `50%` / `rounded-full` (Tailwind builtin) | — | Avatars, icon circles, dots — never use the scale above for circles |

## Spacing

Tighter than the mockup's generous whitespace — sections should sit close enough to read as one continuous page, not isolated blocks.

- Section vertical padding: `py-10`–`py-14` (mockup used `py-16`–`py-24`).
- Gap between stacked sections: `0` (adjacent `border-t`/`border-b` do the separating) instead of large margins.
- Card/grid gaps: `gap-4`–`gap-5` (mockup used `gap-6`–`gap-7`).
- Page content padding ((app) shell `<main>`): `p-5`.

## Shadows

- Card: `0 1px 2px rgba(15,23,42,.06)`
- Dropdown/menu: `0 8px 24px rgba(0,0,0,.25)`
- Modal: `0 24px 60px rgba(0,0,0,.35)`

## Borders

- Default border: `1px solid var(--color-border)`.
- Soft internal divider: `1px solid var(--color-border-soft)`.
- Active/selected state: `1.5px solid var(--color-primary)` or `var(--color-navy)`.

## Difficulty badges

| Difficulty | Text | Background |
|---|---|---|
| Cơ bản | `navy` | `border-soft` |
| Trung bình | `white` | `primary` |
| Nâng cao | `white` | `navy` |

## Shared components

Reusable primitives live in `src/components/ui/`; page code should compose these rather than re-declaring styled `<button>`/`<input>`/card divs inline.

| Component | File | Notes |
|---|---|---|
| `Button` | `ui/button.tsx` | Variants `primary` \| `outline` \| `ghost`; sizes `sm` \| `md`. `radius-md`. |
| `Input` | `ui/input.tsx` | Optional leading icon slot; `radius-md`. |
| `Badge` | `ui/badge.tsx` | Generic tone badge + `DifficultyBadge` (maps Cơ bản/Trung bình/Nâng cao to the table above). `radius-sm`. |
| `Card` | `ui/card.tsx` | Bordered surface container, `radius-lg`, `shadow-card`. |
| `CourseCard` | `course-card.tsx` | The tile-header + title/desc + tags + footer-meta card repeated for paths/practice/explore items in the mockup. |
