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

## Typography

- **UI font:** Inter, weights 400/500/600/700/800.
- **Monospace font:** Roboto Mono, weights 400/500/600/700 — used for code blocks, tile initials/icons, and numeric stats.
- Headings: `700` weight. Body: `400`. Labels/badges: `500–700` at `10.5–13px`.

## Radius

- **Pill (`999px`)** — all buttons, text/password inputs, textareas. This is a hard rule in the mockup (`button, input, textarea { border-radius: pill !important }`).
- **`8px`** — small boxed elements needing square corners inside a pill-default page (code editors, textareas acting as code boxes) — use the escape-hatch `.box-radius` utility.
- **`10–12px`** — cards, stat widgets, list containers.
- **`14–16px`** — modals.
- **`50%`** — avatars, icon circles.

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
