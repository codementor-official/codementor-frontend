# CodeMentor Web — UI Audit, Solutions & Rebuild Plan

**Scope:** `apps/web` (member/student app). Audited 2026-08-16 against the current
`src/` tree, not against the older Kaggle-analysis docs.

**Status of those older docs:** `DESIGN-LANGUAGE.md`, `docs/DESIGN_SYSTEM.md`,
`docs/PAGE_GUIDELINES.md`, `docs/IMPLEMENTATION_PLAN.md` describe an *intended* system.
The code diverged from it. This document is the corrective pass and supersedes their
page-level guidance where they conflict.

---

# Phase 1 — Review of the current UI

## 1.1 Findings the user raised

### F1. `/exercises` is a meaningless tab
`app/(app)/exercises/page.tsx` is a two-tab shell:

- **"Bài tập đã soạn"** (`authored-problems-tab.tsx`) — duplicates the sidebar's own
  elevated `Tạo bài tập` action (`/create-problem`). Authoring lives there; a second
  surface to *look at* what you authored has no job the create flow doesn't already do.
- **"Lịch sử nộp bài"** (`submissions-tab.tsx`) — reads `data/submission-history.ts`.
  There is no submission-service. `lib/api.ts` exposes exactly one real backend call
  (`judge.run`), which explicitly *does not persist a submission* (see its own comment).

So the tab is a mock viewing a mock, sitting in prime nav real estate. **Delete.**

### F2. No course surface
Courses are the product's actual unit of learning, and they are reachable only at
`/paths/[pathId]/courses/[courseSlug]` — three levels deep, and only if you already
picked a roadmap. `/explore` shows "Khóa học đang nổi" in a horizontally-scrolling
strip; `/dashboard` shows the same `featuredCourses` array again in another strip.
Neither links to a course index, because none exists.

`lib/roadmap/course-catalog.ts` already exports `courseCatalog` — every course across
every roadmap, flattened. The data for a `/courses` route is already built; only the
route is missing.

### F3. "Lộ trình học" is verbose
`components/nav-items.ts` label, `PageBanner` title, `PageHeader` title, roadmap-detail
back-link text, and several body strings all spell it out. Rename to **"Lộ trình"**
everywhere the label acts as navigation.

### F4. Layout has no orientation rule
23 `overflow-x-auto` sites. The same content type renders three different ways:

| Content | `/dashboard` | `/explore` | `/articles` |
|---|---|---|---|
| Course cards | horizontal strip, `w-64` fixed | horizontal strip, `w-64` fixed | — |
| Article cards | — | 3-col grid | 3-col grid |

Horizontal strips are used on a desktop layout that has *unused horizontal space*, so
cards get clipped mid-row while the page has empty gutters. There is no stated criterion
for when a list is horizontal, and no page follows one.

`/practice` compounds it: topic chips scroll horizontally (`overflow-x-auto`), status
filters wrap on a separate row, difficulty/sort live in a third row inside `FilterBar` —
three filter mechanisms, three visual languages, stacked.

### F5. No breadcrumb anywhere
`grep -rn "readcrumb"` → **0 hits in the whole repo.** Detail pages improvise:

- `/paths/[pathId]` — plain text link `← Quay lại lộ trình học`, hardcoded to `/paths`.
- `/workspace/[groupId]` — `ArrowLeft` icon link, different markup, hardcoded.
- `/paths/[pathId]/courses/[courseSlug]` — **nothing**. Dead end.
- `/lessons/[lessonId]`, `/articles/[slug]` — nothing.

Consequence: arriving at a course from `/explore` or `/dashboard`, "back" either doesn't
exist or throws you to `/paths`, a page you were never on. The trail is also unrecoverable
— you cannot jump to the parent roadmap from a course page.

`docs/COMPONENT_SPECIFICATION.md` already specs a `Breadcrumb` in "Part B — doesn't exist
yet". It was specced and never built.

### F6. Content does not fill the layout
Width is clamped **twice**, with three different values that no one reconciled:

```
components/app-content.tsx   →  mx-auto max-w-(--container-max)   = 1200px
app/(app)/exercises/page.tsx →  mx-auto max-w-6xl                 = 1152px
app/(app)/practice/page.tsx  →  mx-auto max-w-7xl                 = 1280px  (silently capped to 1200 by the parent)
```

On a 1920px viewport: 240px sidebar + 40px shell padding + 1200px content = **440px of
dead gutter**, while `/practice`'s table hides its "Tỷ lệ đạt" and "Thời gian" columns
behind `xl:block` breakpoints for lack of room. The content is starved inside a container
that is itself starved inside a container.

### F7. Stat cards displace the actual content
Measured above-the-fold cost on `/dashboard` before the first piece of real content:

| Block | Approx. height |
|---|---|
| `PageBanner` (eyebrow + h1 + desc + 2 buttons + 3 highlight tiles + illustration) | ~300px |
| 4× `StatBlock` cards | ~110px |
| "Đề xuất từ AI" banner | ~120px |
| **Total** | **~530px** |

At 1080p with the 64px topbar, "Tiếp tục học" — the one thing a returning user opens the
app for — starts below the fold.

Worse, most of those numbers are **hardcoded strings**, not data:
`/paths` highlights read `{ value: "6", label: "hướng chuyên môn" }` and
`{ value: "1", label: "bước để bắt đầu" }`; `/explore` reads `"24"`, `"15"`, `"8"`;
`/workspace` reads `{ value: "1", label: "bài đang chờ" }`. They are decoration priced as
content.

## 1.2 Additional findings

### F8. Three competing page-header patterns, no rule
- `PageBanner` — `/dashboard`, `/explore`, `/paths`, `/workspace`, `/articles`
- `PageHeader` — `/progress`, `/admin`, `/paths` loading state (so `/paths` uses **both**,
  switching header component between its loading and loaded states — the page visibly
  changes shape when data arrives)
- Inline `<header>` — `/practice`, `/exercises`

Three shapes for one job. A user cannot learn "where the title is" because it moves.

### F9. Two component libraries with colliding names
`packages/ui` exports `Button`, `Card`, `Input`, `PageHeader`, `FilterBar`, `Select`,
`SegmentedTabs`, `Modal`, `DataTable`, `TablePagination`, `StatusBadge`.
`apps/web/src/components/ui/` separately defines `Button`, `Card`, `Badge`, `ProgressBar`,
`StatBlock`, `ConfirmDialog`, `RowActionMenu`, `CategoryFilterCards`.

`/practice` imports `FilterBar, Select` from `@codementor/ui` **and** `Card` from
`@/components/ui/card` — in the same file. Two `Card`s, two `Button`s, two `PageHeader`s,
disambiguated only by import path. Nothing prevents a page from picking the wrong one.

`AGENTS.md` still describes `packages/ui` as "`DashboardShell` + `styles.css`, used only by
the two scaffolds" and `packages/api-client` / `types` as having "No consumer yet". Both
statements are false — `apps/web/package.json` depends on all of them. **The architecture
doc is stale enough to actively mislead.**

### F10. The right rail is a dumping ground
`/dashboard` right column: `WeeklyGoalCard`, Chuỗi ngày, Hạn sắp tới, Hoạt động gần đây,
Xem gần đây — 5 stacked cards, ~1400px tall.
`/practice` right rail: Chuỗi luyện tập, Tiến độ & XP, Từ khóa thịnh hành, Nhu cầu tuyển
dụng — 4 cards.

"Chuỗi ngày" / "Chuỗi luyện tập" is the **same widget rendered twice with different
markup** (dashboard: 7 flex cells with `Flame`; practice: `grid-cols-7` with `Check`).
"Nhu cầu tuyển dụng" is six hardcoded company names. None of these rails contain an action.

### F11. Hardcoded colors bypass the token system
`/dashboard`: `border-orange-200 bg-orange-50/50 hover:bg-orange-50`, `bg-white`.
`/practice`: `text-zinc-400`, `border-orange-200 bg-orange-50/50`.
`/admin`: `border-zinc-200 text-zinc-500`.

The repo ships a dark mode driven entirely by token redefinition (`DESIGN-SYSTEM.md` →
Dark mode). Every hardcoded value above is a hole in it: `bg-orange-50` and `bg-white` do
not flip, so those blocks stay light-on-light in dark theme.

### F12. Typography escapes its own scale
`--text-2xs` (11px) is defined as a token and **used zero times**. Instead the pages
hand-write `text-[9px]`, `text-[10px]`, `text-[10.5px]`, `text-[11px]`. Column widths are
similarly hand-tuned per table (`w-15`, `w-14`, `w-12`, `w-7`) rather than shared.

### F13. Interaction language contradicts its own spec
`DESIGN-LANGUAGE.md` §"Micro-interactions": *"hover/focus states are always a background
or border delta, never a shadow pop… no scale/bounce."*

Actual code: `/articles` and `/explore` cards use `group-hover:-translate-y-0.5
group-hover:shadow-card`; `/practice` collection cards use `hover:-translate-y-0.5`;
`/dashboard` cards use `hover:border-navy`. Three hover languages, two of which the design
doc explicitly forbids.

### F14. Orphan placeholder routes
`/progress` and `/admin` render nothing but `<Placeholder label="Chỉ số #1" />` boxes.
Neither is in `nav-items.ts` — they are reachable only by typing the URL, or via
`/dashboard`'s "Xem chi tiết →" link, which lands the user on four grey boxes. `/admin`
also duplicates the purpose of the separate `apps/admin` application.

### F15. Duplicated pagination
`Pagination` is defined inline inside `app/(app)/practice/page.tsx`; `RoadmapList` has its
own paging via `useRoadmapFilters`; `packages/ui` exports `TablePagination`. Three.

### F16. Accessibility gaps
- No `<nav aria-label="breadcrumb">` landmark anywhere (F5).
- Horizontal strips are mouse/trackpad-only — no keyboard affordance to scroll them.
- `ProblemTableRow` is a `<div>` containing a `<Link>` plus sibling `<button>`s; the list
  has no list semantics, and the row's clickable region excludes its own metadata.
- The `Topbar` search input is focusable, placeholder-labelled, and **wired to nothing**.
  A keyboard user tabs into a dead control on every page.

### F17. The topbar is 64px of wasted height
It contains one non-functional search box, centered inside `max-w-3xl`. It is the natural
home for the breadcrumb and currently holds nothing that earns the row.

### F18. Design-doc sprawl and contradiction
Seven overlapping documents (`DESIGN-LANGUAGE.md`, `DESIGN-SYSTEM.md`,
`docs/DESIGN_SYSTEM.md`, `docs/DESIGN_TOKENS.md`, `docs/COMPONENT_SPECIFICATION.md`,
`docs/PROJECT_DESIGN_PRINCIPLES.md`, `docs/PAGE_GUIDELINES.md`), ~1,400 lines, with
direct conflicts — e.g. `DESIGN-SYSTEM.md` prescribes section padding `py-10`–`py-14`
while `DESIGN-LANGUAGE.md`'s token table prescribes `--space-12`/`--space-16`. When docs
disagree, code follows neither.

## 1.3 Mock-only surfaces (no backend), ranked by whether they earn their space

| Surface | Data source | Verdict |
|---|---|---|
| `/exercises` (both tabs) | `data/authored-problems.ts`, `data/submission-history.ts` | **Delete** (F1) |
| `/progress` | none — `<Placeholder>` | **Delete** (F14) |
| `/admin` (in `apps/web`) | none — `<Placeholder>` | **Delete** — `apps/admin` owns this |
| "Nhu cầu tuyển dụng" card | 6 hardcoded strings | **Delete** |
| `PageBanner` `highlights` | hardcoded strings | **Delete** with `PageBanner` (F7) |
| Explore "Bảng xếp hạng tuần" / "Cộng đồng" | `data/sample-explore.ts` | Keep, demote out of the rail |
| Dashboard "Hoạt động gần đây" / "Xem gần đây" | `data/sample-dashboard.ts` | Keep one, delete the other — same shape, same rail |
| `/articles` | `data/articles.ts` | **Keep** — real content, real detail page |
| Roadmaps / courses / practice items | `data/roadmaps.ts` etc. | **Keep** — the product |

Only `api.judge.run` talks to a backend today. Deleting the four rows marked **Delete**
removes ~5 files and 2 routes and costs nothing that works.

---

# Phase 2 — Solutions

Ten rules. Each is written to be checkable in review, not aspirational.

### R1 — One page shell, no exceptions

Every page under `(app)` renders exactly this structure, in this order:

```
Breadcrumb          (from the shell, not the page — see R3)
PageHeader          title · subtitle? · actions?          ← the only title component
StatStrip?          at most one, ≤64px tall               ← see R5
<content>           fills available width                 ← see R2
```

- **Delete `PageBanner`.** Its eyebrow becomes the breadcrumb, its title/description become
  `PageHeader`, its actions become `PageHeader.actions`, its `highlights` become a
  `StatStrip` **only when the numbers are real**, and its illustration is dropped.
- **No page declares its own `<header>`** and no page renders `<h1>` outside `PageHeader`.
- A page's loading state uses the **same** header components as its loaded state (fixes the
  `/paths` shape-shift in F8).

### R2 — Fluid width; clamp prose only

- `AppContent` stops centering a fixed max width. Content spans the column the sidebar
  leaves, with `px-6` gutters, up to a generous `--container-wide: 1600px` ceiling so
  ultrawide monitors don't produce 30cm reading lines.
- **No page sets its own `max-w-*` on its root.** Remove `max-w-6xl` from `/exercises`
  (deleted anyway) and `max-w-7xl` from `/practice`.
- The only permitted clamp is on **prose**: article body, lesson text, long-form
  description → `max-w-[72ch]`. Data, lists, grids, tables never clamp.
- Reclaimed width goes to the content, not the gutters: `/practice`'s table shows its
  hidden columns; card grids get a 4th and 5th column at `xl`/`2xl` instead of a scroller.

### R3 — Breadcrumb on every page, derived from one map

- New `packages/ui/src/breadcrumb.tsx` — `items: {label, href?}[]`, rendered as
  `<nav aria-label="breadcrumb">`, last item `aria-current="page"` and unlinked.
- New `apps/web/src/lib/navigation/route-meta.ts` — the single map from route segment →
  label and parent. The breadcrumb is **derived** from `usePathname()` plus this map, so a
  new route cannot ship without a trail, and a rename (F3) is a one-line edit.
- Dynamic segments resolve their label from the loaded entity (roadmap title, course
  title, group name) via a small `useBreadcrumbTitle(segment, title)` registration, falling
  back to the slug.
- Rendered **once, in the shell**, on the topbar row (R9) — never per page.
- **Delete every hand-rolled back link** (`← Quay lại lộ trình học`, the `ArrowLeft` in
  `/workspace/[groupId]`). "Back" is the previous crumb.

### R4 — One orientation rule for lists

> **Grid** when items are comparable and the user is choosing between them.
> **List/table** when items are scannable and the user is looking for one.
> **Horizontal strip: banned** in the `(app)` shell.

- Course/roadmap/article browsing → responsive grid,
  `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5`, `gap-4`.
- Problems, submissions, members, assignments → dense list rows, hairline-divided, no gap.
- "Continue where you left off" is the **one** exception and is a grid of ≤3, not a
  scroller.
- Filter chips that overflow **wrap**; they do not scroll.
- One filter mechanism per page: `FilterBar` (search + selects + mobile sheet) plus at most
  one `SegmentedTabs` row. `/practice`'s three-tier filter stack collapses into those two.

### R5 — Stats are a strip, not a wall

- New `packages/ui/src/stat-strip.tsx`: a single horizontal row of `label + value` pairs,
  hairline-separated, no card, no icon, no illustration, **≤64px tall**, wrapping on mobile.
- **At most one `StatStrip` per page**, directly under `PageHeader`.
- A number qualifies for the strip only if it is (a) computed from real data and (b)
  something the user would act on. Hardcoded marketing numbers do not qualify — delete them.
- Everything else moves **onto the entity it describes**: a course's chapter count belongs
  on the course card, not in a page-level tile.
- The right rail is capped at **2 cards**, and each must contain an action or a deadline.
  Dashboard's rail: `WeeklyGoalCard` + `Hạn sắp tới`. Streak/XP/activity/recently-viewed
  fold into the `StatStrip` or are deleted (F10).
- The streak widget is extracted once and reused — never re-marked-up per page.

### R6 — Two libraries, no ambiguity

> **Revised during Stage 4.** This rule originally read "`packages/ui` is the only home for
> primitives; web-local `Button`/`Card`/`PageHeader` are deleted, not aliased." Implementing
> it showed the rule was wrong, and the record is kept rather than quietly rewritten.

Two facts killed the merge:

1. **They do not share a palette.** Web's primitives are built on `navy`, `surface`,
   `on-ink`, and `border-soft`. `apps/lecturer` and `apps/admin` define none of those —
   they use the shadcn-style names in `packages/ui/src/theme.css`. Moving web's `Badge` or
   `ProgressBar` into `packages/ui` would produce a shared package with exactly one
   consumer, which `AGENTS.md` explicitly forbids: *"Extract to packages only when a
   concrete cross-application abstraction exists."*
2. **The same-named components are different on purpose.** Web's `Button` is a 40px CTA
   that renders as a `Link` when given `href`; the shared one is a 36px control for dense
   tables with no link mode. Merging them means a union API and a compromise height that
   suits neither surface.

The actual risk was never "two implementations exist" — it was **a file reaching for the
wrong one**. That is now an eslint error (`no-restricted-imports`), which costs no files
and closes the hole completely. So:

- `packages/ui` holds primitives **used by more than one app**, on the shared token names.
- `apps/web/src/components/ui` holds the student product's own primitives.
- Where a name exists in both, lint blocks the wrong import. **Never add a third copy of a
  name, and never re-export one library through the other.**
- `apps/web/src/components/*` (outside `ui/`) keeps only *composed, domain-aware*
  components (`EntityCard`, `ProblemRow`, `Sidebar`, `roadmap/*`, `study-group/*`).
- Genuine duplicates still go: `StatBlock` had zero importers and is deleted; the second
  and third numbered paginations collapse into one. `TablePagination` cannot absorb them —
  it is bound to a TanStack table instance and neither list is one.

### R7 — Tokens only

- Zero `zinc-*` / `gray-*` / `slate-*` / `orange-*` / `bg-white` / `text-white` in
  `apps/web/src`. Use `border-border`, `bg-surface`, `text-navy`, `bg-primary-tint`,
  `text-on-ink`, `bg-ink-fixed`. A third hue is never the answer — the landing page had
  picked up `violet-200`/`violet-50`, which is how a two-hue system stops being one.
- **`on-ink` vs `on-ink-fixed`.** `on-ink` inverts with the theme, which is correct on
  `bg-navy` and wrong on `bg-ink-fixed`: that surface deliberately stays dark, so an
  inverting foreground renders near-black on near-black. `--color-on-ink-fixed` was added
  for that pairing; three code blocks needed it.
- Zero arbitrary type sizes (`text-[10px]`, `text-[10.5px]`, `text-[9px]`). The scale is
  `text-2xs` … `text-5xl`; if a size isn't on it, use the nearest. 9px, 10px, 10.5px and
  11px were four sizes doing one job and all collapsed to `text-2xs`.
- Enforced by eslint in `packages/eslint-config` (see Stage 5).

### R8 — One interaction language

- Hover/focus = **border or background delta only**. No `translate`, no `scale`, no
  shadow-on-hover.
- Transition: `transition-colors duration-150`.
- Every interactive element has a visible `focus-visible` ring — `outline-2
  outline-offset-2 outline-primary`.
- This is what `DESIGN-LANGUAGE.md` already says; R8 makes it a lint-able rule instead of
  prose (F13).

### R9 — The topbar carries navigation, not decoration

`[ breadcrumb ......................... ] [ search ] [ user ]`

- Breadcrumb occupies the left of the topbar row, replacing the empty space (F17).
- The search input either gets wired to a real page-level search or is **removed**. A
  focusable control that does nothing is worse than no control.
- Height drops to 56px.

### R10 — Ship it or delete it

- No route reachable from nav, or from a link on a nav-reachable page, may render
  `<Placeholder>`.
- Mock data is allowed **only** where the shape and interaction are the real ones and a
  backend is planned. A mock that exists to fill a grid gets deleted.
- Delete `/exercises`, `/progress`, `/admin` (web copy) and their components/data files.

### Navigation, after the changes

| Order | Label | Route | Change |
|---:|---|---|---|
| — | Tạo bài tập | `/create-problem` | unchanged (elevated action) |
| 1 | Tổng quan | `/dashboard` | unchanged |
| 2 | Khám phá | `/explore` | unchanged |
| 3 | **Khóa học** | **`/courses`** | **new** (F2) |
| 4 | **Lộ trình** | `/paths` | **renamed** from "Lộ trình học" (F3) |
| 5 | Luyện tập | `/practice` | unchanged |
| 6 | Nhóm học tập | `/workspace` | unchanged |
| 7 | Trợ lý AI | `/ai-tutor` | unchanged |
| 8 | Cài đặt | `/settings` | unchanged |
| ~~—~~ | ~~Bài tập~~ | ~~`/exercises`~~ | **removed** (F1) |

`/courses` is built on the existing `courseCatalog` export — grid of `EntityCard`, one
`FilterBar` (search + roadmap + difficulty), one `SegmentedTabs` (Tất cả / Đang học / Đã
hoàn thành). No new data layer.

---

# Phase 3 — Implementation plan

Six stages. Each stage is independently shippable and leaves the app working. Run
`pnpm lint && pnpm typecheck && pnpm build` at the end of every stage.

## Stage 0 — Delete (no new code)

Removes ~2 routes, ~6 components, ~2 data files. Do this first so later stages don't
migrate things that are about to die.

| Action | Paths |
|---|---|
| Delete route | `app/(app)/exercises/` |
| Delete route | `app/(app)/progress/` |
| Delete route | `app/(app)/admin/` |
| Delete components | `components/exercises/*` |
| Delete component | `components/placeholder.tsx` (only consumer was `/progress`, `/admin`) |
| Delete data | `data/submission-history.ts`, `data/authored-problems.ts` (verify no other importer first) |
| Remove nav entry | `components/nav-items.ts` → drop `Bài tập` |
| Fix dangling links | `/dashboard` "Xem chi tiết →" → `/progress` (now gone) |
| Delete card | `/practice` "Nhu cầu tuyển dụng" |

**Done when:** no route renders `<Placeholder>`, `grep -rn "/exercises\|/progress" apps/web/src` is empty.

## Stage 1 — Shell: width, breadcrumb, topbar

The foundation every later stage depends on.

1. `packages/ui/src/breadcrumb.tsx` — new (R3). Export from `index.ts`.
2. `apps/web/src/lib/navigation/route-meta.ts` — new. Segment → `{label, parent}` map,
   covering all `(app)` routes. Rename `Lộ trình học` → `Lộ trình` here (R3/F3).
3. `apps/web/src/components/app-breadcrumb.tsx` — derives items from `usePathname()` +
   `route-meta`, resolves dynamic segments.
4. `components/topbar.tsx` — breadcrumb on the left, `h-14`, search wired or removed (R9).
5. `components/app-content.tsx` — drop `max-w-(--container-max)`; use
   `w-full px-6 max-w-(--container-wide)` (R2). Add `--container-wide: 1600px` to
   `globals.css`.
6. Delete hand-rolled back links in `/paths/[pathId]` and `/workspace/[groupId]`.

**Done when:** every `(app)` route shows a correct trail; clicking any ancestor crumb
navigates there; no page sets `max-w-*` on its root.

## Stage 2 — Header & stats consolidation

7. `packages/ui/src/stat-strip.tsx` — new (R5).
8. `packages/ui/src/page-header.tsx` — confirm it covers `title` / `subtitle` / `actions`;
   delete `apps/web/src/components/page-header.tsx` and repoint imports (R6).
9. **Delete `components/page-banner.tsx`.** Convert its 5 consumers to
   `PageHeader` + optional `StatStrip`:
   - `/dashboard` — header + `StatStrip` (real values from `dashStats`).
   - `/explore` — header only; the "24/15/8" highlights were fabricated (F7).
   - `/paths` — header only; same reason. Fixes the loading/loaded shape-shift (F8).
   - `/workspace` — header + `StatStrip` (group count is real).
   - `/articles` — header only.
10. `/practice` and `/dashboard`: right rail down to ≤2 action-bearing cards; extract the
    streak widget once (R5/F10).

**Done when:** `grep -rn "PageBanner" apps/web/src` is empty; every page's first element
under the breadcrumb is `PageHeader`; no page has more than one `StatStrip`.

## Stage 3 — `/courses` and list-orientation pass

11. `app/(app)/courses/page.tsx` — new. `courseCatalog` → `EntityCard` grid + `FilterBar`
    + `SegmentedTabs` (R4/F2).
12. Add `Khóa học` to `nav-items.ts` in position 3.
13. Replace every `overflow-x-auto` card strip with a responsive grid (R4):
    - `/dashboard` "Đề xuất lộ trình cho bạn" → grid, or delete (it now duplicates
      `/courses`).
    - `/explore` "Khóa học đang nổi" → grid, capped at 8, "Xem tất cả" → `/courses`.
    - `/practice` topic chips → `flex-wrap`.
14. `/practice` filter stack → one `FilterBar` + one `SegmentedTabs` (R4).
15. Reclaim the width won in Stage 1: `/practice` table drops its `xl:block` column hiding
    at `lg`+.

**Done when:** no `overflow-x-auto` on a card list in `(app)`; `/courses` is reachable from
nav and from `/explore`.

## Stage 4 — Remove the real duplicates *(done — scope revised, see R6)*

16. ~~Move web primitives into `packages/ui`~~ — **not done, deliberately.** They are built
    on tokens lecturer and admin do not define, so the move would create a shared package
    with one consumer. See R6 for the full reasoning.
17. Delete `StatBlock` — zero importers.
18. Collapse the second and third numbered paginations into
    `apps/web/src/components/ui/pagination.tsx`, used by `/practice` and `RoadmapList`.
    `TablePagination` cannot serve them: it takes a TanStack table instance.
19. Add `no-restricted-imports` blocking `Button`/`Card`/`CardHeader`/`CardContent`/
    `PageHeader` from `@codementor/ui` inside `apps/web` — this, not a merge, is what
    removes the risk of a file picking the wrong primitive.

**Done when:** no component name has three copies, and importing the wrong `Button` in
`apps/web` fails lint.

## Stage 5 — Token & interaction cleanup, enforced *(done)*

21. Every hardcoded color replaced with a token (R7/F11), including a third hue (`violet`)
    that had appeared on the landing page.
22. Added `--color-on-ink-fixed` and repointed the three code blocks that paired an
    inverting foreground with a surface that never inverts.
23. Arbitrary type sizes collapsed onto the scale (R7/F12): 9/10/10.5/11px → `text-2xs`,
    13px → `text-xs`, 15px → `text-base`.
24. Every hover normalized to a border/background delta; `-translate-y-*`, `scale-*`, and
    `hover:shadow-*` are gone (R8/F13).
25. **The rule that keeps this audit from repeating** — `packages/eslint-config` enforces
    hardcoded palette colors, hardcoded white/black, arbitrary font sizes, and hover
    translate/scale/shadow. `error` in `apps/web`; `warn` in `apps/lecturer`, `apps/admin`,
    and `packages/ui`, which have not had their audits. Promote an app to `error` in the
    change that cleans it up. Never silence a rule to land a change.

**Still open:** `focus-visible` rings on `ProblemRow`, `EntityCard`, and the topic chips
(F16) — the breadcrumb has one. Not lint-enforceable as cheaply; needs a pass by hand.

**Done when:** `pnpm lint` passes with the rules on. It does — 0 errors.

## Stage 6 — Docs consolidation

26. `DESIGN-SYSTEM.md` becomes the single design source of truth (tokens, components,
    layout rules R1–R10).
27. `DESIGN-LANGUAGE.md`, `docs/DESIGN_SYSTEM.md`, `docs/DESIGN_TOKENS.md` → reduced to a
    pointer at `DESIGN-SYSTEM.md`, or deleted (F18).
28. `docs/PAGE_GUIDELINES.md` → rewritten around the R1 page shell.
29. `AGENTS.md` → correct the stale package table (F9) + add the UI rules section.
30. `docs/IMPLEMENTATION_PLAN.md`, `docs/ROADMAP.md` → superseded by this document; delete
    or point here.

**Done when:** one document defines each rule, and no two documents contradict.

## Sequencing

```
Stage 0  Delete            ── independent, do first
Stage 1  Shell             ── blocks 2, 3
Stage 2  Header & stats    ── blocks 3
Stage 3  /courses & lists  ──┐
Stage 4  Library unify     ──┤ 3 and 4 are independent of each other
Stage 5  Tokens & lint     ── after 3 and 4 (touches files both move)
Stage 6  Docs              ── last, records what actually shipped
```

## Not in this plan (deliberately)

- `/solve`, `/workspace/[groupId]` editor, `/ai-tutor` — tool surfaces with their own
  density rules. They keep the breadcrumb (R3) and the token rules (R7) and nothing else.
- Backend integration. Every rule here is presentation-layer and survives the data
  becoming real.
- `apps/lecturer`, `apps/admin`. Same rules apply when they are built out; they are not
  retrofitted here.
