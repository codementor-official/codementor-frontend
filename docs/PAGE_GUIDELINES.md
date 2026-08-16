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
