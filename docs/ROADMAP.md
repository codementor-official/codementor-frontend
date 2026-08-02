# CodeMentor Kaggle-Inspired Refactor — Roadmap

Priority-ordered checklist view of `IMPLEMENTATION_PLAN.md`. Use this file to track progress;
use the plan doc for the *why* behind each item.

## Already done (verify with `git status`, don't redo)

- [x] `--color-ink` true-neutral correction + `navy` alias
- [x] `--color-primary-active` state token
- [x] `--space-*` / `--text-*` / `--container-*` / `--icon-*` / `--h-*` token scales
- [x] `Card` `interactive` prop
- [x] `Button` `active`/`focus-visible` states
- [x] `EntityCard` (consolidates `CourseCard` + `RoadmapCard`)
- [x] `FilterBar` (extracted from `RoadmapFilterBar`)
- [x] `ProgressBar`, `SegmentedTabs`, `StatBlock` primitives
- [x] `PageHeader` `actions` prop
- [x] `ProblemRow` `stats` prop
- [x] `Topbar` token drift fix (no more hardcoded `zinc-*`)
- [x] Lộ trình học listing + detail + course detail pages (rebuilt this session — reference
      implementation for the rest of the app)

## Next up, in priority order

1. **Token additions** (`--radius-2xl`, `--z-*`, `--duration-*`, `--ease-standard`) — trivial,
   unblocks nothing but costs nothing either; do it first to close out Phase 1 cleanly.
2. **`Modal` primitive** — highest-leverage new component; two existing modals
   (`OnboardingModal`, `RoadmapQuickListModal`) are currently duplicated hand-rolled overlays and
   both become simpler once this exists.
3. **`EmptyState` + `Skeleton` primitives** — same leverage logic: 3+ existing hand-written empty
   states and one roadmap-specific loading skeleton all consolidate onto these.
4. **`Breadcrumb` primitive** — small, unblocks a real navigation-quality gap on both detail pages.
5. **Header consolidation** (`Topbar` + landing header → one `Header` with `variant`) — highest
   visual-risk item (touches the landing page), do it once, carefully, with manual before/after
   comparison.
6. **`StatBlock` adoption** across Landing, Dashboard, Profile — same component, three call sites,
   can be done as one pass or three small ones.
7. **Explore + Practice → `FilterBar`/`EntityCard`** — the largest remaining page-level lift;
   Practice's list/grid toggle needs one small design decision (see
   `IMPLEMENTATION_PLAN.md` Phase 7) before starting.
8. **Two standalone bug fixes** (`Placeholder` token drift, Submissions' tab row →
   `SegmentedTabs`) — cheap, do opportunistically, no need to block on anything above.

## Explicitly deferred (do not build speculatively)

- `Select`, `Tooltip`, `Pagination`, `ErrorState` — real components with a real spec in
  `COMPONENT_SPECIFICATION.md`, but no current page needs them yet. Build each the first time a
  page genuinely requires it, not ahead of time.
- `Drawer` as a standalone primitive — the pattern already lives correctly inside `FilterBar`;
  only extract it if a second, non-filter use case shows up.
- Settings / Submissions / Progress real content — separate product-scoping work, not a design
  refactor task. The two token/component bugs on those pages (item 8 above) are in scope; building
  out their actual features is not.
- AI Tutor / Admin / Create Problem — need their own discovery pass first (see
  `PAGE_GUIDELINES.md` Tier 3); don't assume `EntityCard`/`FilterBar` is the right pattern for a
  chat UI or a form-heavy authoring flow before checking.
- Workspace / Solve — out of scope by design, different visual language (IDE tool, not a content
  browser). Never apply this refactor's card/grid patterns there.

## Definition of done for the refactor

- Every Tier 1/2 page in `PAGE_GUIDELINES.md` passes its cross-page checklist.
- No page has a hardcoded `zinc-*`/`gray-*`/`slate-*` Tailwind color — only tokens.
- No two pages implement their own version of the same pattern (search+filter, stat row, card
  grid, empty state) — one shared component per pattern, everywhere.
- The root-level `DESIGN-LANGUAGE.md` has been reviewed for archival now that its content lives
  in `docs/` (owner decision, not automatic).
