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
