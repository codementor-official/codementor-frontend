# CodeMentor Page Guidelines

## The page shell — mandatory, every route under `(app)`

```
Breadcrumb      rendered by the shell from route-meta.ts — never by the page
PageHeader      title · subtitle? · actions?   ← the only <h1> on the page
StatStrip?      at most one, ≤64px, real numbers only
<content>       fills the width the shell gives it
```

Building a page means deciding three things, and nothing else about its chrome:

1. **What is its title and its one primary action?** → `PageHeader`.
2. **Are there ≤5 real, actionable numbers?** → one `StatStrip`. Otherwise none.
3. **Is the user choosing between items, or hunting for one?** → grid, or list.

Everything else is fixed. In particular:

- No page renders its own `<header>`, its own `<h1>`, or its own back link.
- No page sets `max-w-*` on its root. `max-w-[72ch]` on prose is the only clamp.
- No horizontal scroll strips. Chips wrap; card lists become grids.
- One `FilterBar` and at most one `SegmentedTabs` per page — never three filter surfaces.
- Right rail: ≤2 cards, each with an action or a deadline.
- Loading state uses the same header components as the loaded state.

Rules and their rationale: `AGENTS.md` → UI rules, `DESIGN-SYSTEM.md`, `docs/UI_AUDIT_AND_PLAN.md`.

### Route inventory

| Route | Nav | Content shape |
|---|---|---|
| `/dashboard` | Tổng quan | `StatStrip` + continue-learning grid + recommended list + ≤2 rail cards |
| `/explore` | Khám phá | `FilterBar` + `SegmentedTabs` + mixed grids |
| `/courses` | Khóa học | `FilterBar` + `SegmentedTabs` + `EntityCard` grid over `courseCatalog` |
| `/paths` | Lộ trình | `FilterBar` + `EntityCard` grid |
| `/paths/[pathId]` | — | Detail: header + curriculum outline |
| `/paths/[pathId]/courses/[courseSlug]` | — | Detail: header + chapter accordion |
| `/practice` | Luyện tập | `FilterBar` + `SegmentedTabs` + dense table |
| `/workspace`, `/workspace/[groupId]` | Nhóm học tập | Grid, then tabbed detail |
| `/ai-tutor` | Trợ lý AI | Tool surface — shell rules only (breadcrumb + tokens) |
| `/articles`, `/articles/[slug]` | — | Grid, then prose (`max-w-[72ch]`) |
| `/create-problem` | Tạo bài tập | Authoring form |
| `/settings`, `/profile` | Cài đặt | Form sections |
| `/solve/[exerciseId]` | — | Tool surface — shell rules only |

Deleted, do not resurrect: `/exercises`, `/progress`, `/admin` (the `apps/admin` application owns
administration). See `docs/UI_AUDIT_AND_PLAN.md` §1.3 for why.

---

## Historical per-page notes

The sections below predate the audit and describe the pre-`PageBanner`-removal layout. They are
kept for the per-page *content* observations only. **Where they conflict with the page shell
above, the shell wins** — in particular, ignore any instruction to use `PageBanner`, to set a page
`max-w-*`, or to use a horizontal card strip.

## Tier 1 — Core content pages (highest priority)

### Landing (`/`, `app/page.tsx`)
- **Purpose:** marketing entry point — explain the product, drive to Đăng ký.
- **Current sections:** sticky header (own inline implementation, not `Topbar`) → dark hero band
  (headline, subcopy, 2 CTAs, inline stat row, code-editor mockup illustration) → feature grid (4
  `Card`s) → "3 steps" section → workspace/groups feature pairs → `Testimonials` → `Faq` → closing
  CTA band → footer.
- **Component usage:** `Card`, `Button`, `Testimonials`, `Faq`. Inline `stats` array not yet using
  `StatBlock`.
- **Target adjustments:**
  1. Route the inline `stats` row through `StatBlock` (`tone="onDark"` — it already sits on the
     navy hero band).
  2. Consolidate the page's own `<header>` with `Topbar` via a `variant="marketing" | "app"` prop
     (see `COMPONENT_SPECIFICATION.md` Topbar gap) instead of two independent implementations.
  3. Audit section padding against the formal `--space-12`/`--space-16` tokens — currently mixes
     `py-12`/`py-16` ad hoc.
- **Responsive:** already has working `sm:`/`lg:` breakpoints for the hero grid and feature grid —
  keep.
- **Loading/empty/error:** not applicable (fully static).

### Login / Signup (`/login`, `/signup`, `auth-card.tsx`)
- **Purpose:** single shared `AuthCard` component in `mode="login" | "signup"`.
- **Current sections:** tab switcher (Đăng nhập/Đăng ký) → OAuth buttons (Google/GitHub) → divider
  → form → footer switch link.
- **Component usage:** `Button`, `Input`, `Card`.
- **Target adjustments:** already fairly minimal/Kaggle-adjacent (bordered card, no gradients).
  Main gap: `Input` has no visible invalid/error state (see `COMPONENT_SPECIFICATION.md`
  `FormField` note) — needed once real validation lands, not urgent while auth is mocked.
- **Loading/empty/error:** N/A today (mock submit just redirects — see prior session notes on the
  auth-card router fix). Add a submit-pending state on `Button` (disabled + label change) once a
  real request is wired.

### Dashboard (`/dashboard`)
- **Purpose:** the personalized home screen after login — "what should I do next."
- **Current sections:** welcome headline + "Chỉnh hồ sơ học tập" action → `dashStats` 4-card row →
  navy "Đề xuất từ AI" banner (links to `/paths`) → two-column layout: (left) "Tiếp tục học" list,
  "Bài luyện tập đề xuất" (`ProblemRow`s in a `Card`), "Đề xuất khóa học" (`EntityCard` via
  `CourseCard`, horizontal scroll) / (right) weekly-goal ring, streak strip, deadlines, recently
  viewed → popular-topics chip row.
- **Component usage:** `Card`, `Button`, `Badge`, `CourseCard`, `ProblemRow`. Good density and
  hierarchy already — this page is close to Kaggle's own profile/home stat-header pattern.
- **Target adjustments:**
  1. `dashStats` row → `StatBlock` (currently hand-written `Card` + two `div`s per stat,
     identical shape to what `StatBlock` already encodes).
  2. `PageHeader`-style header currently hand-rolled (title + `actions` inline) — could migrate to
     `PageHeader` with `actions={<Button href="/settings" …>}`, but low priority since the current
     markup is already correct, just not using the shared component.
- **Loading/empty/error:** all sections currently assume data exists (mock data always populated).
  Once wired to a real backend, each section needs its own `Skeleton`/`EmptyState`
  (`COMPONENT_SPECIFICATION.md` Part B).

### Lộ trình học — listing (`/paths`)
- **Status: already rebuilt this session, closest page to the target state.** Two-part structure
  per the user's own simplification request: hero (top recommendation with reasons) → "Khám phá
  theo tiêu chí" discover-card row (opens `RoadmapQuickListModal`) → "Toàn bộ lộ trình"
  (`RoadmapFilterBar` + `RoadmapList`, relevance-sorted by default, "load more" pagination).
- **Component usage:** `RoadmapHero`, `RoadmapDiscoverRow`, `RoadmapFilterBar` (→ `FilterBar`),
  `RoadmapList` (→ `EntityCard` via `RoadmapCard`), `RoadmapLoadingState`.
- **Target adjustments:** minimal — this page is the reference implementation for how
  filter+grid pages should look. Once `Modal` (Part B) exists, re-base `RoadmapQuickListModal` on
  it instead of its own overlay markup.
- **Loading/empty/error:** loading ✅ (`RoadmapLoadingState`), empty ✅ (inline in `RoadmapList`,
  candidate to move to the future `EmptyState` primitive), error: N/A (mock service never
  rejects).

### Roadmap detail (`/paths/[pathId]`)
- **Current sections:** back link → dark header band (title, description, level/duration/course
  count/target-audience) → "Bạn sẽ học được gì" → prerequisites + technologies cards → course
  summary list (`RoadmapCurriculum`, numbered, each linking to its own course page) → right rail
  (progress card, "Phù hợp với" audience list).
- **Target adjustments:** replace the `"← Quay lại lộ trình học"` link with `Breadcrumb` (Part B)
  once it exists: `Lộ trình học > {roadmap.title}`.
- **Loading/empty/error:** server component, no client loading state needed; empty-courses case
  already handled (`"Chưa có khóa học nào trong lộ trình này."`).

### Course detail (`/paths/[pathId]/courses/[courseSlug]`)
- **Current sections:** back link → dark header band → "Học xong bạn sẽ làm được gì" → "Yêu cầu
  đầu vào" → "Nội dung khóa học" (`CourseCurriculumOutline` — chapter accordion, next-lesson
  highlight) → right rail progress card.
- **Target adjustments:** same `Breadcrumb` upgrade as roadmap detail:
  `Lộ trình học > {roadmap.title} > {course.title}`. `CourseCurriculumOutline`'s `<details>` usage
  is a good candidate to formalize as the `Accordion` primitive once it exists (Part B), so a
  future FAQ/Settings section can reuse the same interaction without re-deriving it.
- **Loading/empty/error:** empty-curriculum case already handled
  (`"Nội dung chi tiết... đang được biên soạn."`), not-found course case already handled.

### Explore (`/explore`)
- **Purpose:** CodeMentor's closest analog to Kaggle's Competitions listing — "what's trending
  right now" across content types.
- **Current sections:** search input (standalone, not `FilterBar`) → "Khóa học đang nổi"
  (`CourseCard` grid) → "Bộ sưu tập học tập" (hand-written `Card` grid, icon + name + desc + count
  + tag) → two-column: (left) "Bài luyện tập phổ biến" (`ProblemRow`s), "Chủ đề AI đề xuất" (chip
  links) / (right) "Cộng đồng" card.
- **Target adjustments:**
  1. Replace the standalone search `Input` with `FilterBar` (even with zero extra filters, it
     gives Explore the same mobile-sheet-ready shell as Paths, and the active-filter-count
     behavior for free once a filter is added).
  2. "Bộ sưu tập học tập" cards are ~90% the same shape as `EntityCard` (icon tile, title, desc,
     footer meta+tag) — migrate them rather than keeping a third hand-written card shape.
- **Loading/empty/error:** empty-search states already handled per-section (own conditional
  text) — could consolidate onto `EmptyState` once it exists, low urgency.

### Practice (`/practice`)
- **Purpose:** the exercise browser — Kaggle-competitions-page equivalent for individual
  exercises rather than roadmaps.
- **Current sections:** stat placeholder row (4× `Placeholder` — not yet built) → AI-recommended
  placeholder → search + list/grid view toggle (hand-rolled, not `FilterBar`) → `SegmentedTabs`
  (difficulty) → `ProblemRow` list or `CourseCard` grid depending on view.
- **Target adjustments:**
  1. Search + view-toggle row → migrate onto `FilterBar` (`controls` slot can hold the
     list/grid toggle buttons alongside future real filters).
  2. The 4 stat placeholders and the "AI-recommended" placeholder are unbuilt — see
     `IMPLEMENTATION_PLAN.md` for whether these get real content or get deferred; either way, the
     stat row should become `StatBlock` once real numbers exist.
- **Loading/empty/error:** empty state ✅ already good (dashed card, title + description) — same
  shape as `RoadmapList`'s, both are candidates for the future `EmptyState` primitive.

---

## Tier 2 — Secondary pages (functional, needs Kaggle-consistency pass)

### Profile (`/profile`)
- **Current sections:** navy identity banner (avatar initials, name, role badge, rank) → 4-stat
  row (hand-written `Card`s) → 2-up "Thống kê bài làm" (conic-gradient ring) + "Biểu đồ tiến độ"
  (bar chart) → activity heatmap → 2-up "Công nghệ đang học" + "Lộ trình đang học" (progress bars).
- **Target adjustments:** the 4-stat row is another `StatBlock` candidate (identical shape to
  Dashboard's and Explore's). Otherwise already dense/card-based and consistent with the target
  language — lower priority than Tier 1.

### Settings (`/settings`)
- **Status: mostly unbuilt** — `PageHeader` + 4 `Placeholder` blocks ("Hồ sơ học tập", "Hồ sơ",
  "Tùy chọn", "Tích hợp"). Needs real content before a design pass is meaningful; not a target of
  this refactor's first phases.

### Submissions (`/submissions`)
- **Status: mostly unbuilt.** `PageHeader` + a **hardcoded, non-token tab row**
  (`border-zinc-200 text-zinc-500`, plain `<span>`s with no click handler) + one `Placeholder` for
  the table. The tab row should become `SegmentedTabs` (Tất cả/Đạt/Không đạt) once the page gets
  real content — flagging now because it's a concrete token-drift + non-functional-control bug,
  not just an unbuilt section.

### Progress (`/progress`)
- **Status: mostly unbuilt** — `PageHeader` + 4 `Placeholder` stat blocks + 3 more `Placeholder`
  sections. Same note as Settings: build content first, then apply `StatBlock` to the stat row.

---

## Tier 3 — Not yet audited in this pass (lower priority / different context)

- **AI Tutor (`/ai-tutor`)** — chat-style interface; likely needs its own density rules (message
  bubbles, not cards) rather than the browse-grid pattern this refactor focuses on. Audit
  separately.
- **Admin (`/admin`)** — internal tool, not user-facing polish priority.
- **Create Problem (`/create-problem`)** — form-heavy authoring flow; benefits more from a
  `FormField`/validation pass than from card/grid Kaggle-alignment. Audit separately.
- **Workspace / Solve (`/workspace`, `/solve/[exerciseId]`)** — **explicitly out of scope**
  (principle #17 exception). This is the Monaco-editor IDE screen; it intentionally uses a darker,
  tool-focused visual language that the content-browsing Kaggle pattern doesn't apply to. Do not
  apply `EntityCard`/`FilterBar`/etc. here.

---

## Cross-page checklist — apply to every page as it is touched

**Shell**
- [ ] Breadcrumb resolves correctly, and every ancestor crumb navigates. Route has a `route-meta` entry.
- [ ] `PageHeader` is the page's only `<h1>`. No inline `<header>`, no hand-rolled back link.
- [ ] Loading state uses the same header components as the loaded state.
- [ ] Root element sets no `max-w-*`. Prose (and only prose) clamps at `max-w-[72ch]`.

**Layout**
- [ ] Grid for choosing, list for hunting. No `overflow-x-auto` on a card list.
- [ ] Chips and filters wrap; they do not scroll.
- [ ] Exactly one `FilterBar`, at most one `SegmentedTabs`. Not three filter surfaces.
- [ ] Grid widens at `xl`/`2xl` — reclaimed width goes to content, not gutters.

**Stats**
- [ ] At most one `StatStrip`, ≤64px, directly under `PageHeader`.
- [ ] Every number in it is computed from real data and actionable. No hardcoded figures.
- [ ] Per-entity metadata sits on the entity's card, not in a page-level tile.
- [ ] Right rail ≤2 cards, each with an action or a deadline.

**Components**
- [ ] Primitives imported from `@codementor/ui`, never from a local `components/ui/`.
- [ ] Browse grid uses `EntityCard`; dense list uses `ProblemRow`.
- [ ] No component duplicated inline that already exists (streak, pagination, progress bar).

**Tokens & interaction**
- [ ] No `zinc-*`/`gray-*`/`slate-*`/`orange-*`/`bg-white`/`text-white` — tokens only.
- [ ] No arbitrary type sizes (`text-[10px]`). Scale tokens only.
- [ ] Hover/focus is a border or background delta at `duration-150`. No translate, scale, or hover shadow.
- [ ] Every interactive element has a visible `focus-visible` ring.
- [ ] Dark mode checked — no light-on-light block.

**States**
- [ ] Loading, empty, and error states are deliberate, never a blank area.
- [ ] Mobile: grid → 1 column, filters → bottom sheet, no horizontal page overflow.
- [ ] No `<Placeholder>` on any nav-reachable route.
