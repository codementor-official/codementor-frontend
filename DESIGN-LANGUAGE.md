> **Methodology note:** Live browser rendering of kaggle.com wasn't available in this session (Claude in Chrome extension not connected), so this analysis is built from Kaggle's long-stable, well-documented public interface architecture (competition listing, card system, nav, filter patterns), cross-checked against the site's current live metadata (brand color `#008ABC`, "AI Proving Ground" positioning, competitions/hackathons focus, fetched 2026-08-01). It focuses on structural and systemic design decisions — grid, spacing, hierarchy, component anatomy — which is what transfers to another product; it does not claim pixel-exact current values.
>
> **Codebase note:** CodeMentor's existing stack is Next.js 16 + Tailwind v4 (CSS-first `@theme` tokens in `src/app/globals.css`) with a primitive library already in `src/components/ui/` (`Button`, `Card`, `Badge`/`DifficultyBadge`, `Input`) and composed components (`CourseCard`, `ProblemRow`, `RoadmapCard`, `RoadmapFilterBar`, `Sidebar`, `Topbar`, `PageHeader`). Everything below is written to **extend** that system, not replace it — existing token names and component APIs are kept wherever possible.

# CodeMentor Design Language — Kaggle-Inspired Analysis & System

## Part 1 — Why Kaggle Feels Professional

### 1. Design Philosophy

Kaggle's UI is not decorative — it is an instrument for scanning large amounts of structured information (competitions, datasets, notebooks, leaderboards) quickly and making a decision ("is this relevant to me, do I click in"). Its personality is *technical-credible, not corporate-shiny*: near-white surfaces, one restrained brand hue, tight typographic contrast, and a near-total absence of illustration or marketing gloss. The first impression is "built by people who work with data," which for its audience of engineers and researchers reads as more trustworthy than a glossier consumer product would.

The UI feels clean for three structural reasons: (1) every block of content sits on a flat white/near-white surface with a single hairline border — there is no competing texture (gradients, shadows, background imagery) fighting for attention; (2) color is spent almost exclusively on *state and action* (a link, a live badge, a primary button) rather than on decoration, so a colored element is always meaningful; (3) type does the hierarchy work — size and weight differences, not color, separate a title from its metadata.

Density feels comfortable rather than cramped because whitespace is allocated *asymmetrically*: tight inside a component (label-to-value, icon-to-text), generous between unrelated components (card-to-card, section-to-section). This is the opposite of naive design, which spaces everything evenly. Kaggle's rows can pack 10+ competitions on one screen without feeling like a spreadsheet, because each row has internal breathing room and a consistent left-to-right reading order (identity → title/meta → tags → stats/action).

Content hierarchy is established almost entirely through **type weight + size + color-value (not hue)**: a bold, larger, near-black title; a smaller, lighter-weight gray line of metadata beneath it; a small pill/tag in the single brand hue for status. Because there is only one accent hue in the whole system, when it does appear the eye is drawn to it immediately — this is the core trick behind why the UI both looks calm and still directs attention effectively.

### 2. Layout System

Kaggle uses a constrained, centered content column (roughly 1200–1280px max width) with generous outer gutters at desktop, collapsing to full-bleed with fixed side padding (16–24px) on mobile. Inside that column, content is organized in a **12-column-equivalent grid**, most commonly expressed as either a fixed-width left rail (filters, ~260–280px) + fluid right content, or a repeating card grid (2 / 3 / 4 columns depending on breakpoint) with a fixed gutter.

Section rhythm is vertical and consistent: each major section (hero, "trending," "your work," footer) is separated by a fixed vertical rhythm unit rather than ad-hoc margins — sections either get a full padding block (e.g. 48–64px top/bottom) or a hairline divider with tighter padding, never both. This is a **reusable design grid**, not one-off spacing: once you know the base unit, every section's spacing is predictable multiples of it.

Alignment is strict: everything left-aligns to the same vertical guide (avatar, title, metadata all share the same left edge inside a row/card), and right-aligned elements (stats, actions) share their own consistent right edge. Nothing is centered except section-level intro copy (eyebrow + heading + subcopy above a grid), which mirrors how CodeMentor's landing page already centers its section headers above feature grids.

### 3. Typography System

Kaggle's type is a single, functional grotesque/sans family used at a narrow set of sizes with **weight, not size, as the primary lever**: body copy sits at 13–14px, metadata drops to 11–12px, section headings run 20–28px bold, page-level headings 28–36px bold. Line-height is generous for body text (~1.5–1.6) and tight for headings (~1.1–1.2), which is what makes dense metadata blocks still feel legible — the eye gets enough leading to separate lines without the block visually expanding.

Paragraph/description text is deliberately short (1–2 lines, often truncated with ellipsis) — Kaggle treats body copy as a *preview*, not prose, reinforcing that the page's job is to help you decide whether to click through, not to read in place. Visual emphasis is built with weight (600–700) and color-*value* shifts (near-black vs. mid-gray), almost never with italics, underlines, or hue changes, which keeps the reading rhythm uninterrupted.

This directly matches CodeMentor's current type scale (`text-2xl font-bold` page titles, `text-sm`/`text-xs` body and metadata, `font-semibold` for card titles) — the existing system is already Kaggle-aligned; it mainly needs a slightly more disciplined size/weight pairing table (below) applied consistently across pages that currently improvise sizes inline.

### 4. Color System

Kaggle's palette is intentionally narrow: a near-white/very-light-gray background, white card surfaces, near-black text, two or three steps of gray for secondary text and borders, and **one** brand hue reserved for links, primary actions, and a small number of status accents (active/live, selected). Category and difficulty differentiation is carried by *label text and icon*, not by a rainbow of tag colors — tags are neutral gray chips with text, occasionally the brand hue for "featured/active."

This is precisely the constraint the user has set for CodeMentor (orange + black + white + neutral gray only) and it is *already* how CodeMentor's existing `DESIGN-SYSTEM.md` is built: only two hues exist in the current system (`navy` and `primary` orange), with `success`/`accent`/`ai` all aliasing navy and `danger` aliasing orange. That is structurally identical to Kaggle's "one accent hue, everything else neutral" approach — it should be kept, not rebuilt. See the Color Compliance Note below for the one adjustment needed (the `navy` token's hex has a faint blue bias and should be nudged to a true achromatic ink to fully satisfy "no blue" going forward).

### 5. Border Radius System

Kaggle uses a small, consistent radius scale — chips/tags and buttons around 4–6px, cards and inputs around 6–8px, larger surfaces (modals) slightly more, and full-round only for avatars and true pills (status dots, count badges). It is a *scale*, not arbitrary per-component values, and radius stays modest throughout — nothing is aggressively rounded, which reinforces the "tool," not "app for consumers," feeling. CodeMentor's existing `radius-xs/sm/md/lg/xl` (4/6/8/10/12) scale already follows this exact philosophy and needs no change.

### 6. Elevation System

Depth is created almost entirely with **borders and background-value steps**, not shadow. A card is a white surface with a 1px light-gray border sitting on a very-slightly-darker page background — that value difference alone reads as "raised." Shadow is reserved for genuinely overlaid content (dropdowns, modals) where a border alone wouldn't separate it from what's behind it. Hover states darken the border or nudge the background tint rather than adding elevation, so hovering never makes the page feel busier. CodeMentor's existing 3-tier shadow system (`shadow-card` barely-there, `shadow-dropdown`, `shadow-modal`) already matches this restraint and should stay as the ceiling — no new heavier shadows should be introduced.

### 7. Spacing System

Kaggle's spacing reads as an 4px-based scale (4/8/12/16/24/32/48/64), applied with intent: 4/8 for intra-component gaps (icon-to-label, tag-to-tag), 12/16 for internal card/row padding, 24/32 between grid items and card cross-axis padding, 48/64 between major page sections. CodeMentor's `DESIGN-SYSTEM.md` already documents an intentionally *tighter* version of this (sections at `py-10`–`py-14` rather than `py-16`–`py-24`, card gaps at `gap-4`–`gap-5`) — that's a reasonable adaptation for a denser, task-oriented app and should be kept, just formalized as an explicit token scale rather than a range (Design Tokens section below).

## Part 2 — Layout, Components & Interaction Patterns

### 8. Component Library (Kaggle patterns, mapped to what CodeMentor needs)

- **Top navigation** — logo + a handful of primary nav links + search + auth actions, single row, sticky on scroll, no mega-menus. CodeMentor's `Topbar`/landing `<header>` already match this; needs the nav links + search consolidated into one reusable `Topbar`/`Header` rather than two separate implementations (see Component Guidelines).
- **Sidebar** — icon + label vertical nav, collapsible, active item marked by a filled/tinted background (not a colored line or icon-only color change). CodeMentor's `Sidebar` already does this correctly.
- **Hero** — dark or high-contrast band, short headline + subcopy + one primary CTA, optional supporting visual to the side. CodeMentor's landing hero (navy band, code-editor mockup) is directly analogous — keep the structure, tune spacing per tokens below.
- **Filter bar** — search input (flex-grow) + a row of select/chip filters + sort, collapsing to a "Filters" button + bottom sheet on mobile. CodeMentor's `RoadmapFilterBar` is already this exact pattern; it should become the shared filter-bar primitive for Practice/Explore too instead of being roadmap-specific.
- **List row** (Kaggle's competition-row pattern) — left identity tile → title + one-line meta stacked → tag chips → right-aligned stat cluster → chevron/action, full-width, divided by hairlines, hover = subtle background tint. CodeMentor's `ProblemRow` already implements this pattern well and is the closest thing CodeMentor has to a "Kaggle competition row" — it should be reused/extended (e.g. add a stat cluster slot) rather than rebuilt.
- **Card grid** (Kaggle's dataset/competition card) — thumbnail/tile header → title → 1–2 line description → tag row → footer meta, uniform height across a row. CodeMentor's `CourseCard` and `RoadmapCard` already implement this; they should be reconciled into one configurable `EntityCard` (see below) since they are currently near-duplicates.
- **Tabs / segmented control** — for status filters (e.g. Kaggle's All/Featured/Getting Started), a bordered pill group with one filled active segment. CodeMentor does not have this yet — new, small primitive needed.
- **Stat block** — large bold number + small gray label underneath, used in hero and dashboard-style summaries. CodeMentor's landing `stats` block already does this inline; worth promoting to a primitive since dashboard/progress pages will want the same shape.
- **Badge/Tag/Progress bar** — CodeMentor's `Badge`, `DifficultyBadge`, and inline progress bar (in `CourseCard`/`RoadmapCard`) already match Kaggle's restrained, text-first tag style and thin progress bar. Keep as-is; consolidate the repeated inline progress-bar markup into a `ProgressBar` primitive (see below).
- **Pagination / "load more"** — Kaggle favors simple numbered pagination or a single "load more" for long lists over infinite scroll, keeping scroll position predictable. Recommend the same for CodeMentor's Practice/Explore lists once they grow.
- **Empty/loading state** — a centered icon + one-line message + optional action, never a bare blank area. CodeMentor already has `roadmap-loading.tsx` as precedent; the same shape should be reused for empty search/filter results.

### 9–14. Card Design, Navigation, Search/Filter UX, Content Hierarchy, Visual Rhythm, Micro-interactions

These are covered inline within the Component Guidelines below (each component's own "structure / states / interaction" spec is more useful there than repeated narrative here). The short version: cards always order **identity → title → description → metadata/tags → action**, never mix orders between card types; navigation marks "current" with background fill, not color-text alone (accessibility); filters always show an active-filter count and an explicit "clear"; hierarchy is type + spacing, not color; hover/focus states are always a background or border delta, never a shadow pop; and nothing animates beyond 150–200ms ease-out (color/background/border transitions only — no scale/bounce), which is what keeps the interface feeling calm rather than "appy."

### 15. Responsive Strategy

Desktop: multi-column grids (3–4 up), sidebar + filter bar fully expanded inline. Tablet: grids drop to 2 columns, filter bar wraps but stays inline. Mobile: grids collapse to 1 column, sidebar becomes a bottom/hidden nav, filter bar collapses into a "Filters" trigger + bottom sheet (CodeMentor's `RoadmapFilterBar` already implements this exact mobile pattern — reuse it, don't reinvent per page).

---

## Color Compliance Note

The existing `--color-navy: #1F2937` has a faint blue undertone (it's a "slate," not a pure neutral). Given the hard constraint of **orange + black + white + neutral gray only**, the recommendation is to keep the token *name* `navy` (so no component files need touching) but shift its *value* to a true achromatic ink — e.g. `#18181B`. This is a one-line change in `globals.css` with zero API impact on any component, and it makes the "only two hues" claim in the current `DESIGN-SYSTEM.md` literally true rather than approximately true.

---

# Design Tokens

All values below extend the existing `@theme` block in `src/app/globals.css` — additive, not a rewrite. New/changed lines are marked.

```css
@import "tailwindcss";

@theme {
  /* ── Color — Neutral scale (extended: was single navy/bg/surface/border set) ── */
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-border: #e5e7eb;
  --color-border-soft: #f3f4f6;

  --color-ink: #18181b;          /* NEW — true neutral, replaces navy's blue bias */
  --color-navy: var(--color-ink); /* CHANGED — alias kept for backward compatibility */

  --color-text: #374151;
  --color-text-muted: #6b7280;
  --color-text-faint: #9ca3af;

  /* ── Color — Brand (single accent hue, unchanged) ── */
  --color-primary: #ea580c;
  --color-primary-hover: #dc4f09;
  --color-primary-active: #c2410c;   /* NEW — pressed state */
  --color-primary-tint: #fff7ed;

  --color-brown: #78350f;
  --color-brown-tint: #faf0e6;

  /* ── Semantic aliases — only 2 hues in the whole system, by design ── */
  --color-accent: var(--color-ink);
  --color-accent-tint: var(--color-border-soft);
  --color-success: var(--color-ink);
  --color-success-tint: var(--color-border-soft);
  --color-danger: var(--color-primary);
  --color-danger-tint: var(--color-primary-tint);
  --color-ai: var(--color-ink);
  --color-ai-tint: var(--color-border-soft);

  /* ── Typography ── */
  --font-sans: var(--font-inter);
  --font-mono: var(--font-roboto-mono);

  --text-2xs: 0.6875rem;   /* NEW — 11px, tightest metadata */
  --text-xs: 0.75rem;      /* 12px — metadata, badges */
  --text-sm: 0.875rem;     /* 14px — body, default UI */
  --text-base: 1rem;       /* 16px — emphasized body */
  --text-lg: 1.125rem;     /* 18px — card titles */
  --text-xl: 1.25rem;      /* 20px — section subheads */
  --text-2xl: 1.5rem;      /* 24px — page titles */
  --text-3xl: 1.875rem;    /* 30px — section headings (marketing) */
  --text-4xl: 2.25rem;     /* 36px — hero headline (mobile) */
  --text-5xl: 3rem;        /* 48px — hero headline (desktop) */

  /* ── Radius (unchanged — already Kaggle-aligned) ── */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 10px;
  --radius-xl: 12px;

  /* ── Shadow (unchanged — restraint is the point) ── */
  --shadow-card: 0 1px 2px rgba(15, 23, 42, 0.06);
  --shadow-dropdown: 0 8px 24px rgba(0, 0, 0, 0.25);
  --shadow-modal: 0 24px 60px rgba(0, 0, 0, 0.35);

  /* ── Spacing scale (NEW — formalizes the range already in DESIGN-SYSTEM.md) ── */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* ── Container / grid (NEW) ── */
  --container-max: 1200px;      /* section content width, was ad-hoc max-w-6xl (1152px) — close, formalized */
  --container-padding: 24px;    /* desktop gutter */
  --container-padding-sm: 16px; /* mobile gutter */
  --grid-gap: 16px;             /* card grid gutter, matches existing gap-4 */

  /* ── Breakpoints (Tailwind defaults, documented explicitly) ── */
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;

  /* ── Icon sizes (NEW) ── */
  --icon-xs: 14px;   /* inline with text-xs */
  --icon-sm: 16px;   /* inline with text-sm, default */
  --icon-md: 20px;   /* buttons, standalone */
  --icon-lg: 24px;   /* feature tiles, empty states */

  /* ── Component heights (NEW) ── */
  --h-input-sm: 32px;
  --h-input-md: 40px;
  --h-button-sm: 32px;
  --h-button-md: 40px;
  --h-topbar: 64px;
  --h-tile-row: 36px;   /* ProblemRow tile */
  --h-tile-card: 64px;  /* CourseCard/RoadmapCard tile */
}

body {
  background: var(--color-bg);
  color: var(--color-text);
}

button,
input[type="text"],
input[type="password"],
textarea {
  border-radius: var(--radius-md);
}
```

**Button / input size tokens (paired with existing `sm`/`md` variants in `ui/button.tsx`, `ui/input.tsx`):**

| Size | Height | Padding (x) | Font |
|---|---|---|---|
| `sm` | `--h-button-sm` (32px) | 12px | `--text-xs` |
| `md` | `--h-button-md` (40px) | 16px | `--text-sm` |

---

# Component Guidelines

Existing components are marked **[existing]** — extend, don't replace. New components are marked **[new]**.

### Button — `ui/button.tsx` [existing, extend]
- **Purpose:** all clickable actions except inline text links.
- **Variants:** `primary` (orange fill), `outline` (bordered, ink text), `ghost` (no border, ink text). *Recommend adding* `danger` (same visual as primary — danger and primary share a hue by design, differentiate by icon/label, not new color) only if a destructive action needs to visually separate from a normal primary CTA in the same view.
- **Sizes:** `sm` (32px), `md` (40px, default).
- **States:** default, hover (`primary-hover` / `bg` tint), active/pressed (*add* `primary-active`, currently missing), focus-visible (*add* a 2px ink outline-offset ring — currently no visible focus state, an accessibility gap), disabled (50% opacity, no pointer).
- **Spacing:** 8px icon-to-label gap (already `gap-2`).
- **Accessibility:** icon-only buttons need `aria-label`; disabled state must also set `aria-disabled`.

### Card — `ui/card.tsx` [existing, keep as-is]
- **Purpose:** base bordered surface for all card-style content.
- **Structure:** 1px `border`, `radius-lg`, `shadow-card`. No default padding (children control it) — correct, keep.
- **States:** *add* an optional `interactive` prop that adds `hover:border-ink/20 transition-colors` for clickable cards, so `CourseCard`/`RoadmapCard` stop hand-rolling hover styles ad hoc.

### EntityCard [new — consolidates `CourseCard` + `RoadmapCard`]
- **Purpose:** the two existing card components are ~90% identical (tile header, title, description, tag row, optional progress bar, footer/CTA). Rather than a third near-duplicate for a Kaggle-style "browse" grid, consolidate into one `EntityCard` with slots.
- **Props:** `tile` (initials/icon), `tileVariant: "ink" | "accent" | "primary"`, `title`, `description`, `tags: string[]`, `difficulty?`, `stats?: {label, value}[]` (footer meta, replaces the separate `participants`/`updated` and `courses.length`/`estimatedHours` props), `progress?: number`, `cta?: {label, href}`, `href?` (whole-card click).
- **Sizes:** single size; density controlled by parent grid, not the card.
- **States:** default, hover (border darken, per Card's new `interactive` prop), focus-visible (ring), selected (optional `1.5px solid primary` border, for future compare/select flows).
- **Spacing:** `p-4` body, `gap-2` internal stack, `pt-2.5` footer divider — matches current `CourseCard`.
- **Accessibility:** whole-card link must have an accessible name (title text), not rely on surrounding context alone.

### ProblemRow — `problem-row.tsx` [existing, extend into `ListRow`]
- **Purpose:** this is CodeMentor's closest existing analog to Kaggle's competition-row pattern — a dense, scannable horizontal item.
- **Recommended extension:** generalize to accept an optional right-aligned `stats: {label, value}[]` cluster (currently only supports a single trailing `DifficultyBadge`), so it can serve Practice, Submissions, and Explore lists with different metadata (e.g. "12 lượt nộp · 85% đạt" vs. "Cập nhật 2 ngày trước").
- **States:** default, hover (`hover:bg-bg`, existing — correct, matches Kaggle's row-hover-tint pattern), focus-visible (add ring, currently missing since it's a `Link`).
- **Spacing:** unchanged — `gap-3.5`, `px-4 py-3`, hairline `border-t` between rows (no gap) is exactly the Kaggle row pattern.

### FilterBar — generalize `RoadmapFilterBar` [existing, promote to shared primitive]
- **Purpose:** search + multi-select filters + sort, with mobile bottom-sheet collapse — needed on Practice and Explore, not just Paths/roadmap.
- **Recommended change:** extract the shell (search input, responsive controls row, mobile sheet trigger + sheet) into a generic `FilterBar` that takes `filters: ReactNode` (the `<FilterSelect>` controls) as children, and keep `RoadmapFilterBar` as a thin wrapper that passes roadmap-specific `FilterSelect`s into it. Avoids re-implementing the mobile-sheet logic per page.
- **States:** each `FilterSelect` — default, focus (`focus:border-ink`), a filter row should show an **active filter count badge** on the mobile "Bộ lọc" trigger when any filter ≠ default (Kaggle always surfaces this; CodeMentor's current mobile trigger doesn't).

### SegmentedTabs [new]
- **Purpose:** status/category switching above a list or grid (e.g. "Tất cả / Đang học / Chưa bắt đầu / Hoàn thành" on Practice, or "Tất cả / Cơ bản / Trung bình / Nâng cao"), Kaggle's All/Featured/Playground pattern.
- **Structure:** bordered pill container (`radius-md`, `border-border`), segments as buttons, active segment = `bg-ink text-white` (or `bg-primary-tint text-primary` for a lighter treatment — pick one and use consistently), inactive = `text-text-muted hover:bg-bg`.
- **Props:** `options: {value, label, count?}[]`, `value`, `onChange`.
- **Sizes:** one size, `h-9`, matches `--h-button-sm`/tile-row scale.
- **Accessibility:** `role="tablist"` / `role="tab"` with `aria-selected`.

### ProgressBar [new — extracted from repeated inline markup in `CourseCard`/`RoadmapCard`]
- **Purpose:** thin linear progress indicator, currently duplicated inline in two components.
- **Props:** `value: number` (0–100), `label?` (defaults to `"Hoàn thành {value}%"`).
- **Structure:** `h-1.5 rounded-full bg-border-soft` track, `bg-primary` fill — unchanged visual, just extracted.

### StatBlock [new — extracted from landing page's inline `stats` markup]
- **Purpose:** large bold number + small gray caption, used in hero stat rows and will be needed again on Dashboard/Progress summary headers.
- **Props:** `value: string`, `label: string`, `tone?: "default" | "onDark"` (for use inside the navy/ink hero band vs. on a light surface).

### Badge / DifficultyBadge — `ui/badge.tsx` [existing, keep]
No changes needed — tone system (`neutral`/`navy→ink`/`primary`/aliases) already matches the "two hues only" constraint precisely.

### PageHeader — `page-header.tsx` [existing, extend]
- **Recommended extension:** optional right-aligned `actions?: ReactNode` slot (primary action button, sort control) — Kaggle consistently pairs a page title with a right-aligned primary action on the same row; CodeMentor's current `PageHeader` only supports title + subtitle, forcing pages to duplicate the header row manually when they need an action.

### Topbar / landing header [existing, consolidate]
- Two separate header implementations currently exist (`topbar.tsx` for the app shell, an inline `<header>` in `page.tsx` for the landing page) with inconsistent tokens (`border-zinc-200`/`bg-white` hardcoded in `Topbar` instead of `border-border`/`bg-surface`). Recommend both consume the same token set at minimum, ideally share a `Header` primitive with a `variant: "app" | "marketing"` prop.

---

# Applying This to CodeMentor (page-level direction, no code yet)

- **Landing page** — structurally already Kaggle-aligned (hero band, feature grid, proof section, FAQ, footer). Main adjustments: pull the inline `stats` row into `StatBlock`, tighten section padding to the new `--space-12`/`--space-16` scale consistently (currently mixes `py-12`/`py-16` ad hoc), fix the `Topbar` token drift noted above.
- **Practice / Explore** (closest to Kaggle's Competitions listing) — add `SegmentedTabs` for status/category above the list, promote `FilterBar`, switch to the extended `ListRow` (generalized `ProblemRow`) as the default dense view with `EntityCard` grid as an optional alternate view — mirroring Kaggle's list-first, occasionally-grid competitions page.
- **Paths (roadmap)** — keep the existing card-grid approach (already close to Kaggle's dataset-grid pattern), migrate `RoadmapCard` onto `EntityCard`.
- **Dashboard / Progress** — good candidate for `StatBlock` row (streak, XP, problems solved, current roadmap %) at the top, echoing Kaggle's profile-page stat header.

This document is the spec to review before any implementation starts. Once approved, implementation should proceed in this order: (1) token changes in `globals.css`, (2) primitive extensions/additions (`Button` states, `Card` interactive prop, `ProgressBar`, `StatBlock`, `SegmentedTabs`, `FilterBar` generalization), (3) `EntityCard` consolidation, (4) page-level application.
