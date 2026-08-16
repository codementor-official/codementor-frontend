# CodeMentor Design System

**The single source of truth for the design system** — tokens, components, and the rules every
page follows. Five overlapping documents used to describe this system and contradict each other;
they were merged into this file and deleted.

- Page-level application: `docs/PAGE_GUIDELINES.md`
- Component props and gaps: `docs/COMPONENT_SPECIFICATION.md`
- Why the rules exist: `docs/PROJECT_DESIGN_PRINCIPLES.md`, `docs/UI_AUDIT_AND_PLAN.md`
- Enforcement: `packages/eslint-config`

Extracted from the CodeForge mockup (`mock.html`). Single-accent palette: neutral (navy/gray) + one orange accent. `accent`, `success`, and `ai` semantic tokens all alias navy; `danger` aliases primary orange — there are only two hues in the whole UI.

## Page shell — the structure every page has

Every route under `(app)` renders exactly this, in this order:

```
Breadcrumb      rendered by the shell, derived from route-meta.ts — never by the page
PageHeader      title · subtitle? · actions?   ← the only component that emits an <h1>
StatStrip?      at most one, ≤64px tall, real numbers only
<content>       fills the width the shell gives it
```

Rules:

- **No page renders its own `<header>`** or an `<h1>` outside `PageHeader`.
- **A page's loading state uses the same header components as its loaded state.** A page that
  swaps header component while data loads visibly changes shape — that is a bug.
- **No page sets `max-w-*` on its root.** Width is the shell's job (`--container-wide`). The one
  permitted clamp is `max-w-[72ch]` on prose — article body, lesson text, long descriptions.
  Data, grids, and tables never clamp.
- **Never hand-roll a back link.** `← Quay lại X` hardcodes a destination the user may not have
  come from. Back is the previous crumb.

## Layout — orientation and density

> **Grid** when items are comparable and the user is choosing between them.
> **List / table** when items are scannable and the user is looking for one.

- Browse grids: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5`,
  `gap-4`.
- Dense lists: hairline-divided rows, no gap between them.
- **Horizontal scroll strips are banned in the app shell.** They clip content on exactly the
  screens that have room to show it, and they are not keyboard-reachable. Chips and filters
  **wrap**; card lists become grids.
- One filter mechanism per page: `FilterBar` (search + selects + mobile sheet), plus at most one
  `SegmentedTabs` row. Not three stacked filter surfaces.

## Stats — a strip, not a wall

- `StatStrip`: one horizontal row of `label + value` pairs, hairline-separated. No card, no icon,
  no illustration. **≤64px tall.** Wraps on mobile.
- **At most one per page**, directly under `PageHeader`.
- A number earns a place only if it is (a) computed from real data and (b) something the user
  would act on. Hardcoded figures get deleted, not styled.
- Per-entity metadata belongs **on the entity's card** — a course's chapter count goes on the
  course card, not into a page-level tile.
- Right rails cap at **2 cards**, each containing an action or a deadline. A rail is not a place
  to put widgets that had nowhere else to go.
- Any widget appearing on two pages is extracted once and reused — never re-marked-up.

## Interaction

- Hover and focus are a **border or background delta**. Nothing else.
- Transition: `transition-colors duration-150`.
- **No `translate`, no `scale`, no hover shadow.** Shadow is reserved for genuinely overlaid
  content (dropdowns, modals).
### Focus is handled once, in `globals.css`

A base rule gives every `a[href]`, `button`, `summary`, `[role="button"]`, `[role="tab"]`,
`input`, `select`, and `textarea` a 2px primary outline on `:focus-visible`. **Do not add a focus
ring to a component** — it is already there, including on components that do not exist yet.

- The selector is wrapped in `:where()`, so its specificity is zero. A component that genuinely
  needs a different treatment still wins by declaring its own. `ProblemRow` does: it sits inside
  an `overflow-hidden` Card that would clip an outline, so it uses an inset ring instead.
- **Never write `outline-none`.** A bare `outline-none` removes the outline in *every* state
  including keyboard focus, and being a utility class it outranks the base rule. Four shared
  controls in `packages/ui` had it and silently suppressed focus in all three apps.
- Primary, not ink: the ring has to stay visible on the ink-filled bands (`bg-navy`,
  `bg-ink-fixed`) as well as on light surfaces.
- Verified by tabbing the rendered page, not by reading source — `:focus-visible` does not match
  a scripted `element.focus()`, so a source grep or a JS-driven check will both lie.

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

## Icon sizes

| Token | Value | Use |
|---|---|---|
| `--icon-xs` | `14px` | Inline with `text-xs` |
| `--icon-sm` | `16px` | Inline with `text-sm` — the default |
| `--icon-md` | `20px` | Buttons, standalone controls |
| `--icon-lg` | `24px` | Feature tiles, empty states |

## Component heights

| Token | Value |
|---|---|
| `--h-input-sm` / `--h-button-sm` | `32px` |
| `--h-input-md` / `--h-button-md` | `40px` |
| `--h-topbar` | `56px` |
| `--h-tile-row` | `36px` |
| `--h-tile-card` | `64px` |

| Button / input size | Height | Padding (x) | Font |
|---|---|---|---|
| `sm` | 32px | 12px | `--text-xs` |
| `md` | 40px | 16px | `--text-sm` |

## Z-index

Named layers, so a new component cannot pick a value that collides with an existing one.

| Token | Value | Use |
|---|---|---|
| `--z-dropdown` | 20 | Inline dropdowns and popovers |
| `--z-sheet` | 40 | Mobile filter bottom sheet |
| `--z-overlay` | 100 | Full-screen click-away backdrops |
| `--z-modal` | 150 | Centered modals |

## Motion

| Token | Value | Use |
|---|---|---|
| `--duration-fast` | `120ms` | Hover colour/border delta |
| `--duration-base` | `180ms` | Default — matches the sidebar width transition |
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | The only easing curve. No bounce, no elastic |

Only `color`, `background-color`, `border-color`, and `transform: translate/rotate` on a chevron
or the sidebar width are ever animated. Never `box-shadow`, never `scale` — see Interaction above,
which lint enforces.

## Difficulty badges

| Difficulty | Text | Background |
|---|---|---|
| Cơ bản | `navy` | `border-soft` |
| Trung bình | `white` | `primary` |
| Nâng cao | `white` | `navy` |

## Shared components

**`packages/ui` is the only home for primitives.** Every app imports them from `@codementor/ui`.
An application never defines its own `Button`, `Card`, `Input`, or `PageHeader` — **no two
exported components may share a name**, and a duplicate is deleted, not aliased.

`apps/<app>/src/components/` holds **composed, domain-aware** components only: things that know
about roadmaps, courses, study groups, or problems.

### Primitives — `packages/ui/src/`

| Component | Notes |
|---|---|
| `Button` | Variants `primary` \| `outline` \| `ghost`; sizes `sm` \| `md`. `radius-md`. |
| `Input` | Optional leading icon slot; `radius-md`. |
| `Card` | Bordered surface container, `radius-lg`, `shadow-card`. No default padding. |
| `Badge` / `DifficultyBadge` | Generic tone badge; `DifficultyBadge` maps Cơ bản/Trung bình/Nâng cao to the table above. `radius-sm`. |
| `StatusBadge` | State pill for tables and rows. |
| `PageHeader` | Title · subtitle? · actions?. **The only component that emits an `<h1>`.** |
| `Breadcrumb` | `items: {label, href?}[]`. `<nav aria-label="breadcrumb">`; last item unlinked, `aria-current="page"`. Rendered by the shell, not by pages. |
| `StatStrip` | One hairline-separated row of label/value pairs, ≤64px. Max one per page. |
| `FilterBar` | Search + selects + mobile bottom sheet + active-filter count. The **only** filter surface. |
| `Select` | Styled single-select used inside `FilterBar`. |
| `SegmentedTabs` | Status/category switching above a list. Max one row per page. |
| `ProgressBar` | Thin linear indicator, `h-1.5`, `bg-primary` on `bg-border-soft`. |
| `Modal` / `SideDrawer` | Overlay surfaces. The only place `shadow-modal` / `shadow-dropdown` are used. |
| `DataTable` / `TablePagination` | Table shell and the **single** pagination implementation. |
| `ManagePage` / `DashboardShell` | Layout shells for the lecturer/admin apps. |
| `workspace/*` | Pane, tab bar, resize handle, language dropdown for the editor surfaces. |

### Composed — `apps/client/src/components/`

| Component | Notes |
|---|---|
| `EntityCard` | Tile/cover + title + description + tags + stats + progress + CTA. The card for every browse grid. |
| `ProblemRow` | Dense, scannable list row. The row for every dense list. |
| `Sidebar` / `Topbar` | The app shell. `Topbar` carries the breadcrumb. |
| `roadmap/*`, `study-group/*`, `lesson-player/*` | Domain families. |
