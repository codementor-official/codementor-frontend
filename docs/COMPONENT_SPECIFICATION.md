# CodeMentor Component Specification

Two parts: **Part A** documents every reusable component that already exists (props pulled
directly from source, not idealized) — extend these before building anything new. **Part B** is
the gap analysis: components a Kaggle-level UI needs that CodeMentor genuinely doesn't have yet.

Per principle #15, this ordering matters: read Part A fully before touching Part B.

---

# Part A — Existing components

## Primitives (`src/components/ui/`)

### `Button` — `ui/button.tsx`
- **Purpose:** every clickable action except an inline text link.
- **Props:** `variant?: "primary" | "outline" | "ghost"` (default `primary`), `size?: "sm" | "md"`
  (default `md`), `href?: string` (renders as a Next `Link` instead of `<button>`), plus native
  button/anchor attributes.
- **States:** default, `hover` (`primary-hover` / `bg` tint), `active` (`primary-active` /
  `border-soft`), `focus-visible` (2px `ring-navy` with offset), `disabled` (50% opacity,
  `cursor-not-allowed`, `aria-disabled` set automatically).
- **Spacing:** `gap-2` icon-to-label; `sm` = 12px×32px, `md` = 16px×40px (see `DESIGN_TOKENS.md`).
- **Accessibility:** icon-only usage must pass `aria-label` explicitly — the component does not
  infer one.
- **Usage:** `<Button href="/paths">Xem lộ trình</Button>`, `<Button variant="outline" size="sm">…</Button>`.

### `Input` — `ui/input.tsx`
- **Purpose:** single-line text input, used standalone or inside `FilterBar`.
- **Props:** `icon?: ReactNode` (leading), `rightSlot?: ReactNode` (trailing, e.g. show/hide
  password), `containerClassName?: string`, plus native `<input>` attributes.
- **States:** default (`border-border`), `focus` (`border-navy`), placeholder (`text-faint`).
- **Responsive:** full-width by default (`w-full`); constrain via a wrapping `max-w-*` at the call
  site (see landing/auth usage).
- **Gap:** no visible error/invalid state yet — see Part B, `FormField`.

### `Badge` / `DifficultyBadge` — `ui/badge.tsx`
- **Purpose:** small status/category label.
- **Props:** `tone?: "neutral" | "navy" | "primary" | "accent" | "success" | "danger" | "ai"`
  (default `neutral`); `DifficultyBadge` wraps it with `difficulty: "Cơ bản" | "Trung bình" |
  "Nâng cao"` pre-mapped to a tone.
- **Note:** tone system already respects the 2-hue constraint — `accent`/`success`/`ai` all render
  identically to `navy`-tinted today; don't add a new tone without confirming it isn't just an
  existing one under a new name.

### `Card` — `ui/card.tsx`
- **Purpose:** base bordered surface for all card-style content.
- **Props:** `interactive?: boolean` (adds `hover:border-navy/20 transition-colors` for cards that
  are themselves a click target), plus native `<div>` attributes.
- **Structure:** 1px `border-border`, `radius-lg`, `shadow-card`. No built-in padding — children
  control it.

### `FilterBar` — `ui/filter-bar.tsx`
- **Purpose:** shared search + filter-controls shell — search input, inline controls row on
  desktop, a "Bộ lọc" trigger + bottom sheet on mobile. Extracted from `RoadmapFilterBar` so any
  searchable/filterable page can reuse the same responsive pattern instead of hand-rolling it.
- **Props:** `searchValue: string`, `onSearchChange: (v: string) => void`, `searchPlaceholder?:
  string`, `controls: ReactNode` (the filter `<select>`s/chips, rendered both inline and inside the
  sheet), `activeFilterCount?: number` (shown as a badge on the mobile trigger),
  `sheetTitle?: string` (default `"Bộ lọc"`), `className?: string`.
- **States:** mobile sheet open/closed (internal `useState`); backdrop click or the `X` closes it.
- **Accessibility:** sheet close button has an `aria-label` derived from `sheetTitle`.
- **Reused by:** `RoadmapFilterBar` today. **Not yet reused by** Practice/Explore, which each
  hand-roll their own search row — see `PAGE_GUIDELINES.md`.

### `ProgressBar` — `ui/progress-bar.tsx`
- **Purpose:** thin linear progress indicator (course/roadmap completion).
- **Props:** `value: number` (0–100, clamped), `label?: string` (default `"Hoàn thành {value}%"`),
  `className?: string`.
- **Structure:** `h-1.5 rounded-full bg-border-soft` track, `bg-primary` fill.
- **Accessibility:** `role="progressbar"` with `aria-valuenow/min/max`.

### `SegmentedTabs` — `ui/segmented-tabs.tsx`
- **Purpose:** status/category switch above a list or grid (Kaggle's All/Featured/Playground
  pattern).
- **Props:** `options: {value, label, count?}[]`, `value: string`, `onChange: (v: string) => void`,
  `className?: string`.
- **Structure:** bordered pill container, `h-9` segments, active = `bg-navy text-white`, inactive =
  `text-text-muted hover:bg-bg`. Optional `count` renders a small rounded badge inside the segment.
- **Accessibility:** `role="tablist"` / `role="tab"` with `aria-selected`.
- **Used by:** Practice (difficulty filter). Not yet used by Explore or Submissions, which currently
  render their own unstyled tab row — see Part B / `PAGE_GUIDELINES.md`.

### `StatBlock` — `ui/stat-block.tsx`
- **Purpose:** large bold number + small gray caption — hero stat rows, dashboard/progress
  summaries.
- **Props:** `value: string`, `label: string`, `tone?: "default" | "onDark"` (for use inside a
  dark/`ink` hero band vs. a light surface), `className?: string`.
- **Gap:** not yet adopted on the landing page's inline `stats` row or the dashboard's `dashStats`
  card row — both still render the same shape by hand. See `IMPLEMENTATION_PLAN.md` Phase 4.

## Composed components

### `EntityCard` — `entity-card.tsx`
- **Purpose:** the single "browse this thing" card — consolidates what used to be two
  near-duplicate components (`CourseCard`, `RoadmapCard`).
- **Props:** `tile: string`, `tileVariant?: "ink" | "accent" | "primary"` (default `"ink"`),
  `tileHeight?: "sm" | "md"` (default `"md"`), `title: string`, `description: string`,
  `difficulty?: Difficulty`, `badge?: ReactNode`, `tags?: string[]`, `stats?: {label, value}[]`
  (inline meta row), `progress?: number`, `note?: string` (free-form callout, e.g. a roadmap
  "matched reason"), `footer?: ReactNode` (bordered footer row), `cta?: {label, href}` (standalone
  CTA link pinned to the bottom), `href?: string` (whole-card link — don't combine with `cta`).
- **Structure order (fixed, do not vary per instance):** tile → title + badge → description
  (`line-clamp-2`) → difficulty/tags → stats → note → progress → footer/cta.
- **States:** default; `interactive` hover via `Card`'s prop when `href` is set.
- **Accessibility:** when `href` wraps the whole card, the card's accessible name is its `title`
  text (via the `<h3>` inside the link) — don't rely on surrounding page context alone.
- **Consumers today:** `CourseCard` (thin wrapper, dashboard/practice/explore), `RoadmapCard` (thin
  wrapper, paths listing + quick-list popups). Both wrappers exist purely for call-site
  compatibility — new code should call `EntityCard` directly rather than adding a third wrapper.

### `ProblemRow` — `problem-row.tsx`
- **Purpose:** CodeMentor's closest analog to Kaggle's competition-row pattern — a dense,
  scannable horizontal item.
- **Props:** `tile: string`, `tileVariant?: "navy" | "accent" | "primary"`, `title: string`,
  `meta: string`, `difficulty?: Difficulty`, `stats?: {label, value}[]` (right-aligned cluster,
  hidden below `sm`), `href: string`.
- **Structure:** identity tile → title/meta stack → stat cluster → difficulty badge, hairline
  `border-t` between rows (no gap), `hover:bg-bg`.
- **Accessibility:** `focus-visible` ring (`ring-navy`, inset, `z-10` on focus so the ring isn't
  clipped by the next row's border).
- **Used by:** Dashboard (`recommendedProblems`), Practice (list view), Explore
  (`popularProblems`).

### `PageHeader` — `page-header.tsx`
- **Purpose:** the title + subtitle row every content page starts with.
- **Props:** `title: string`, `subtitle?: string`, `actions?: ReactNode` (right-aligned, same row
  — a primary button or sort control).
- **Used by:** every `(app)` page except the roadmap listing (which builds its own header row
  inline to place the onboarding CTA — could migrate to `actions`, see `PAGE_GUIDELINES.md`).

### `Sidebar` — `sidebar.tsx`
- **Purpose:** collapsible icon+label left nav rail.
- **Behavior:** `w-60` expanded / `w-16` collapsed (persisted via `useSidebarStore`, zustand +
  localStorage), active item = `bg-bg text-navy`, hidden below `md` (mobile nav is out of this
  component's scope today — see Part B gap).
- **Reads:** `navItems` from `nav-items.ts` (icon + label + href list).

### `Topbar` — `topbar.tsx`
- **Purpose:** app-shell header — logo + search input.
- **Gap:** the landing page (`app/page.tsx`) renders its own separate `<header>` rather than a
  `variant` of this component; both now use the correct `border-border`/`bg-surface` tokens (no
  more hardcoded `zinc-*`), but they're still two implementations. See `IMPLEMENTATION_PLAN.md`.

### `UserMenu` — `user-menu.tsx`
- **Purpose:** avatar button + click-outside dropdown (profile link, logout).
- **Props:** `collapsed: boolean` (hides the name label when the sidebar is collapsed).
- **Gap:** user name/email/initials are hardcoded (`"Gia Sĩ"`, `"GS"`) rather than sourced from a
  session/user object — expected at this mock-data stage, flagged for when auth lands.

### Onboarding family — `components/onboarding/*`
- `OnboardingModal` — the survey shell: progress indicator, step content, back/next/skip, per-step
  validation, auto-opens once (gated on store hydration).
- `OnboardingProgress` — step dots + connecting line + step counter text.
- `OnboardingOptionGrid` — data-driven single/multi-select option grid, shared by all 5 steps.
- **Note for this refactor:** `OnboardingModal` currently hand-rolls its own fixed-overlay markup
  (backdrop, centered panel, `z-150`). This is one of the two places a generic `Modal` primitive
  (Part B) should be extracted from.

### Roadmap family — `components/roadmap/*`
- `RoadmapHero` — top recommendation banner (dark band, reasons list, stats, progress, CTA).
- `RoadmapDiscoverRow` — the "Khám phá theo tiêu chí" quick-access card row (popular / newest /
  beginner / career-goal / technology), each opening a `RoadmapQuickListModal`.
- `RoadmapQuickListModal` — centered modal listing a curated `RankedRoadmap[]`. **The second
  hand-rolled overlay** that should be re-based on the Part B `Modal` primitive once it exists.
- `RoadmapFilterBar` — thin wrapper composing `FilterBar` with roadmap-specific `<select>`
  controls (field/level/technology/duration/sort).
- `RoadmapList` — filtered/sorted grid with a relevance divider and "load more."
- `RoadmapCard` — thin `EntityCard` wrapper (see above).
- `RoadmapCurriculum` — course summary cards inside a roadmap detail page, each linking to its own
  course page.
- `CourseCurriculumOutline` — chapter/lesson outline on a course detail page (native `<details>`
  accordion, next-lesson highlight). **Candidate to formalize as the Part B `Accordion`
  primitive.**
- `RoadmapLoadingState` — roadmap-page-specific skeleton (hero + card grid pulse blocks).
  **Candidate to generalize as the Part B `Skeleton` primitive.**

### `Placeholder` — `placeholder.tsx`
- **Purpose:** dashed-border stand-in for a section that isn't built yet (used throughout
  Settings/Submissions/Progress).
- **⚠️ Token drift:** hardcodes `border-zinc-300 bg-zinc-50 text-zinc-400` instead of
  `border-border`/`bg-bg`/`text-text-faint`. Low-risk (it's explicitly a temporary stand-in that
  gets deleted as each section is built) but should be fixed if it survives past the next round of
  page work — see `IMPLEMENTATION_PLAN.md`.

---

# Part B — Gap analysis: components that don't exist yet

These are needed to reach Kaggle-level polish and are **not** satisfied by anything in Part A.
Build them in this order (see `IMPLEMENTATION_PLAN.md` Phase 2) — each unblocks page-level work
that currently either duplicates markup or is simply missing.

### `Modal` / `Dialog` — new, `ui/modal.tsx`
- **Purpose:** generic centered overlay — currently duplicated by hand in `OnboardingModal` and
  `RoadmapQuickListModal` (same backdrop/centering/`z-150` markup, copy-pasted).
- **Proposed props:** `open: boolean`, `onClose: () => void`, `title?: string`,
  `size?: "sm" | "md" | "lg"`, `dismissible?: boolean` (onboarding shouldn't close on backdrop
  click; the quick-list popup should), `children: ReactNode`.
- **States:** open/closed, focus trap while open, `Escape` closes when `dismissible`.
- **Accessibility:** `role="dialog"`, `aria-modal="true"`, focus returns to the trigger on close —
  none of this is currently implemented by either hand-rolled overlay.

### `Select` / `Dropdown` — new, `ui/select.tsx`
- **Purpose:** styled single-select control. Today, `RoadmapFilterBar` styles a raw `<select>`
  inline (`FilterSelect`) — functional, but not reusable outside that file and not visually
  consistent with a custom-styled dropdown menu (native `<select>` popovers can't be themed).
- **Proposed props:** `value: string`, `onChange: (v: string) => void`, `options: {value,
  label}[]`, `label?: string` (for `aria-label`), `size?: "sm" | "md"`.
- **Note:** low priority — the native `<select>` is accessible and functional today; only worth
  building if a page needs custom-styled option rendering (icons/descriptions in the dropdown)
  that native `<select>` can't do.

### `Breadcrumb` — new, `ui/breadcrumb.tsx`
- **Purpose:** roadmap detail and course detail pages currently use a plain `"← Quay lại X"` link,
  not a trail. Kaggle-style detail pages (competition → notebook) use a real breadcrumb
  (`Home > Competitions > X`) so a user can jump to any ancestor, not just "back one level."
- **Proposed props:** `items: {label, href?}[]` (last item has no `href` — it's the current page).
- **Where it applies:** `/paths/[pathId]` (Lộ trình học > {roadmap}), `/paths/[pathId]/courses/
  [courseSlug]` (Lộ trình học > {roadmap} > {course}).

### `Tooltip` — new, `ui/tooltip.tsx`
- **Purpose:** doesn't exist anywhere yet. Needed for icon-only controls whose `aria-label` isn't
  visually obvious (e.g. sidebar collapse toggle when collapsed, `ProblemRow` stat abbreviations).
- **Proposed props:** `content: string`, `children: ReactElement`, `side?: "top" | "right" |
  "bottom" | "left"`.
- **Priority:** low — nice-to-have accessibility/discoverability polish, not blocking any page.

### `Pagination` — new, `ui/pagination.tsx`
- **Purpose:** `RoadmapList` only has a "load more" button today. Kaggle favors simple numbered
  pagination for long, stable lists (predictable scroll position) over infinite scroll. Worth
  adding once any list (Practice, Submissions) grows past a few dozen items — not urgent at
  current mock-data scale.
- **Proposed props:** `page: number`, `pageCount: number`, `onPageChange: (page: number) => void`.

### `Accordion` — new, `ui/accordion.tsx` (formalizes an existing pattern)
- **Purpose:** `CourseCurriculumOutline` already implements the right visual/interaction pattern
  using native `<details>`/`<summary>` — this is about extracting it into a reusable primitive
  (`AccordionItem` with a styled summary row + chevron) so a future accordion (e.g. an FAQ,
  Settings sections) doesn't re-derive the same markup.
- **Proposed props:** `title: ReactNode`, `defaultOpen?: boolean`, `meta?: ReactNode`
  (right-aligned summary text), `children: ReactNode`.

### `Skeleton` — new, `ui/skeleton.tsx` (formalizes an existing pattern)
- **Purpose:** `RoadmapLoadingState` already has the right idea (`animate-pulse` blocks matching
  the eventual layout) but is roadmap-shaped only. A generic `Skeleton` (`className` for
  width/height/radius) lets any future async page (Submissions, Progress once they're built) get a
  correctly-shaped loading state without copy-pasting `roadmap-loading.tsx`.
- **Proposed props:** `className?: string` (caller controls size/shape via Tailwind), or a small
  set of shape presets (`"text" | "card" | "avatar"`).

### `EmptyState` — new, `ui/empty-state.tsx` (formalizes an existing pattern)
- **Purpose:** `RoadmapList` and Practice both already render a correct-looking empty state
  inline (`"Không tìm thấy..." + explanatory line`) but as hand-written JSX each time. Extracting
  it keeps the "always a deliberate treatment, never a blank area" principle (#6) enforced by the
  component itself rather than by convention.
- **Proposed props:** `title: string`, `description?: string`, `icon?: ReactNode`, `action?: {
  label, onClick }`.

### `ErrorState` — new, `ui/error-state.tsx`
- **Purpose:** doesn't exist anywhere in the codebase yet — there is currently no consistent
  treatment for "a fetch/mock lookup failed." Low urgency while data is all local mock data
  (nothing currently *can* fail at runtime), but should exist before any real API integration
  lands, per principle #6.
- **Proposed props:** `title?: string` (default "Đã có lỗi xảy ra"), `description?: string`,
  `retry?: () => void`.

### `Drawer` — not a separate component; the mobile sheet inside `FilterBar` is the pattern
`FilterBar` already implements a bottom-sheet drawer for mobile filters. If a future feature needs
a drawer for something other than filters, extract that inline JSX into a standalone `Drawer`
primitive at that point — don't build it speculatively now (principle #15 / YAGNI).
