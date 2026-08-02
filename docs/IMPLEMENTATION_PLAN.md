# CodeMentor Kaggle-Inspired Refactor — Implementation Plan

## Important status note before reading this plan

**Phases 1 and 2 below are largely already implemented on the working tree, uncommitted.** A
prior pass (captured in the now-superseded `DESIGN-LANGUAGE.md` at the repo root) already:

- Added `--color-ink`, `--color-primary-active`, the full `--space-*`/`--text-*`
  /`--container-*`/`--icon-*`/`--h-*` token scales to `globals.css`.
- Added `Card`'s `interactive` prop, `Button`'s `active`/`focus-visible` states.
- Built `EntityCard`, `FilterBar`, `ProgressBar`, `SegmentedTabs`, `StatBlock` as new primitives.
- Consolidated `CourseCard` and `RoadmapCard` into thin `EntityCard` wrappers.
- Extended `PageHeader` with `actions` and `ProblemRow` with `stats`.
- Fixed `Topbar`'s hardcoded `zinc-*` classes to use design tokens.

Run `git status` before starting any phase below — do not redo work that's already there. This
plan's phase numbers below are kept aligned with that prior pass's own stated order so the two
documents don't disagree.

---

## Phase 0 — Documentation *(this deliverable)*
- **Objective:** produce the 7 docs in `docs/` as the single source of truth before any further
  code changes.
- **Status:** done (this document is part of it).
- **Follow-up:** once approved, consider removing/archiving the root-level `DESIGN-LANGUAGE.md` —
  its content has been redistributed into `DESIGN_SYSTEM.md`, `DESIGN_TOKENS.md`, and
  `COMPONENT_SPECIFICATION.md` here, with corrections from live Kaggle measurement. Keeping both
  risks the two drifting out of sync. This is a call for the project owner, not made unilaterally.

## Phase 1 — Foundation (tokens)
- **Objective:** the token additions listed in `DESIGN_TOKENS.md` that don't already exist:
  `--radius-2xl`, `--z-dropdown/sheet/overlay/modal`, `--duration-fast/base`, `--ease-standard`.
- **Dependencies:** none.
- **Complexity:** trivial — a handful of new lines in the existing `@theme` block.
- **Risks:** none; purely additive, no existing class names change meaning.
- **Acceptance criteria:** new tokens present in `globals.css`; no visual regression anywhere
  (nothing consumes them yet).

## Phase 2 — Shared component gaps
- **Objective:** build the Part B components from `COMPONENT_SPECIFICATION.md`, in priority order:
  1. `Modal` (`ui/modal.tsx`) — unblocks re-basing `OnboardingModal` and `RoadmapQuickListModal`.
  2. `EmptyState` (`ui/empty-state.tsx`) — unblocks consolidating the 3+ existing hand-written
     empty blocks (`RoadmapList`, Practice, Explore's per-section empties).
  3. `Skeleton` (`ui/skeleton.tsx`) — generalizes `RoadmapLoadingState`'s pattern.
  4. `Breadcrumb` (`ui/breadcrumb.tsx`) — needed by roadmap/course detail pages.
  5. `Accordion` (`ui/accordion.tsx`) — formalizes `CourseCurriculumOutline`'s `<details>` pattern.
  6. `ErrorState`, `Select`, `Tooltip`, `Pagination` — lower priority, build on demand when a page
     actually needs one (see each component's note in `COMPONENT_SPECIFICATION.md` — several are
     explicitly "don't build speculatively").
- **Dependencies:** Phase 1 (for `Modal`'s `z-modal`/`--duration-*` tokens).
- **Complexity:** low–medium per component; each is a self-contained primitive with no business
  logic.
- **Risks:** re-basing `OnboardingModal`/`RoadmapQuickListModal` onto the new `Modal` touches
  working, already-tested UI — do it as its own change with a manual click-through re-test
  (open/close/skip/complete flows), not bundled with unrelated work.
- **Acceptance criteria:** each new primitive has at least one real consumer by the end of this
  phase (no component built and left unused); `OnboardingModal`/`RoadmapQuickListModal` visually
  and behaviorally unchanged after re-basing.

## Phase 3 — Navigation shell consolidation
- **Objective:** unify the landing page's inline `<header>` and `Topbar` into one `Header`
  component with a `variant: "marketing" | "app"` prop (see `COMPONENT_SPECIFICATION.md`).
- **Dependencies:** none (tokens already aligned on both).
- **Complexity:** medium — needs to preserve marketing header's nav-links row and auth CTAs
  alongside app header's search input, without over-generalizing into a prop-soup component.
- **Risks:** landing page is the highest-traffic/first-impression page — regressions here are
  visible immediately. Test both variants manually (desktop + mobile) after the merge.
- **Acceptance criteria:** one `Header` implementation backs both usages; no visual change to
  either page from a user's perspective.

## Phase 4 — Landing page polish
- **Objective:** apply `StatBlock` to the hero stat row; audit section padding against the
  `--space-12`/`--space-16` tokens for consistency.
- **Dependencies:** Phase 1 (tokens), Phase 3 (if Header consolidation lands first, otherwise
  independent).
- **Complexity:** low.
- **Risks:** low — purely visual token substitution, testimonials/FAQ content unaffected.
- **Acceptance criteria:** hero stats render via `StatBlock`; no section's padding is an ad-hoc
  value outside the token scale.

## Phase 5 — Dashboard polish
- **Objective:** apply `StatBlock` to `dashStats`.
- **Dependencies:** Phase 1.
- **Complexity:** low.
- **Risks:** none — same data, same layout, just routed through the shared component.
- **Acceptance criteria:** visually identical 4-stat row, now backed by `StatBlock`.

## Phase 6 — Lộ trình học (roadmap/course pages)
- **Objective:** the smallest remaining lift — this feature was rebuilt this session and is
  already the reference implementation. Only: add `Breadcrumb` to roadmap/course detail once
  Phase 2 delivers it; re-base `RoadmapQuickListModal` onto `Modal`.
- **Dependencies:** Phase 2.
- **Complexity:** low.
- **Risks:** low — both changes are additive/substitutive with no data-shape changes.
- **Acceptance criteria:** breadcrumb trail present and correct on both detail page types; modal
  behavior unchanged after re-basing.

## Phase 7 — Explore / Practice
- **Objective:** the biggest remaining *page-level* lift.
  1. Practice: migrate the hand-rolled search+view-toggle row onto `FilterBar`.
  2. Explore: migrate the standalone search `Input` onto `FilterBar`; migrate "Bộ sưu tập học tập"
     cards onto `EntityCard`.
  3. Verify `SegmentedTabs` (already used on Practice) is the only tab pattern in use — no
     competing hand-rolled tab row survives elsewhere (see Submissions in Phase 9).
- **Dependencies:** none beyond what already exists (`FilterBar`, `EntityCard` are already built).
- **Complexity:** medium — `Practice`'s view-toggle (list/grid buttons) needs to fit inside
  `FilterBar`'s `controls` slot without looking like a filter dropdown; may need a small visual
  treatment decision (button group vs. select) made once, then reused.
- **Risks:** both pages have working search/filter logic today (`useMemo`-based) — the migration
  is presentational (swap the container, keep the state/logic in the page), so risk is low if
  done as a pure refactor without touching the filtering logic itself.
- **Acceptance criteria:** both pages visually match the roadmap listing page's filter-bar
  pattern; existing search/filter/view-toggle behavior unchanged; mobile bottom-sheet works on
  both.

## Phase 8 — Profile
- **Objective:** apply `StatBlock` to the 4-stat row.
- **Dependencies:** Phase 1.
- **Complexity:** low.
- **Risks:** none.
- **Acceptance criteria:** visually identical stat row, backed by `StatBlock`.

## Phase 9 — Settings / Submissions / Progress
- **Objective:** these are currently `Placeholder`-stub pages, not a visual-polish task — building
  real content is a separate scoping exercise from this design refactor. Two concrete bugs to fix
  regardless of when content lands:
  1. `Placeholder` component: replace hardcoded `zinc-*` classes with tokens
     (`border-border`/`bg-bg`/`text-text-faint`).
  2. Submissions' tab row: replace the non-functional hardcoded `<span>` row with `SegmentedTabs`.
- **Dependencies:** none for the two bug fixes; real content is out of this plan's scope.
- **Complexity:** trivial (the two fixes) / unscoped (real content).
- **Risks:** none for the two fixes.
- **Acceptance criteria:** `Placeholder` uses tokens; Submissions' tabs are a real, working
  `SegmentedTabs` instance (even while the table below it is still a placeholder).

## Phase 10 — Out of scope for this plan
- AI Tutor, Admin, Create Problem: not audited here (see `PAGE_GUIDELINES.md` Tier 3) — each needs
  its own short discovery pass before a design decision is made, since none of them are
  browse-a-grid pages that the `EntityCard`/`FilterBar` pattern obviously applies to.
- Workspace/Solve: explicitly excluded — different visual language by design (principle #17
  exception in `PROJECT_DESIGN_PRINCIPLES.md`).

---

## Sequencing summary

```
Phase 0 (docs) → Phase 1 (tokens) → Phase 2 (component gaps) → Phase 3 (nav shell)
                                                                        │
                        ┌───────────────┬───────────────┬──────────────┼───────────────┐
                        ▼               ▼               ▼              ▼               ▼
                    Phase 4         Phase 5         Phase 6        Phase 7         Phase 8
                    (Landing)     (Dashboard)      (Paths)     (Explore/Practice) (Profile)
                        │               │               │              │               │
                        └───────────────┴───────────────┴──────────────┴───────────────┘
                                                          ▼
                                                      Phase 9
                                              (Settings/Submissions/Progress
                                                    bug fixes only)
```

Phases 4–8 have no dependency on each other and can happen in any order (or in parallel across
separate PRs) once Phases 1–3 land — they're listed in priority order (highest-traffic pages
first), not a hard sequence.
