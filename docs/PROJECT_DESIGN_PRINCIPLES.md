# CodeMentor — Project Design Principles

This is the constitution for the CodeMentor UI refactor. Every token, component, and page
decision in the other `docs/` files traces back to one of the principles below. When a new
situation isn't covered by the other docs, resolve it against this list, in order.

## 1. Inspired by Kaggle, not a clone of it

We are borrowing Kaggle's *systemic* design decisions — how it uses type weight for hierarchy,
how it spends its one accent color, how it separates cards with borders instead of shadows, how
dense a competition/dataset list can be while staying scannable. We are **not** reusing Kaggle's
HTML, CSS, icons, illustrations, copy, or exact layouts. A CodeMentor page should remind a user
of Kaggle's *quality bar*, not look like a re-skinned fork of it.

## 2. Original product, own identity

CodeMentor is a Vietnamese learning platform for programming, not a competition/dataset hub. Its
own content shapes (lộ trình → khóa học → chương → bài học, bài luyện tập, bài nộp) drive its own
card and list anatomy. Where Kaggle's pattern doesn't fit CodeMentor's content, we adapt the
pattern, we don't force the content to look like Kaggle's.

## 3. Content-first

The UI's job is to help a learner scan roadmaps/courses/exercises and decide what to do next. No
decoration competes with that job: no illustration-heavy hero sections beyond what the landing
page already needs for marketing, no gradients, no motion for its own sake. If a design choice
doesn't help someone read or decide faster, cut it.

## 4. Dense but readable

Pack real content into a screen — Kaggle can list 10+ competitions above the fold, and CodeMentor
should be able to do the same with roadmaps/exercises. Density comes from *tight intra-component
spacing* (icon-to-label, tag-to-tag) plus *generous inter-component spacing* (card-to-card,
section-to-section), never from shrinking type past a comfortable reading size.

## 5. Professional, not corporate-shiny

Near-white surfaces, one restrained brand hue, hairline borders, real content instead of stock
illustration. The product should read as "built by people who ship software," which for
CodeMentor's audience (students and self-learners preparing for dev jobs) is more credible than a
glossy consumer look.

## 6. Minimal, not empty

Minimal means no unnecessary chrome — it does not mean bare screens. Every state (loading, empty,
error) gets a deliberate, on-brand treatment (see `COMPONENT_SPECIFICATION.md`), never a blank
`<div>`.

## 7. Educational and developer-oriented

Code, technology tags, and monospace numerals get `font-mono` (Roboto Mono) treatment. Explanatory
copy stays short and scannable — descriptions are previews, not prose, mirroring how Kaggle treats
competition descriptions as a decision aid rather than a place to read in full.

## 8. Consistency over decoration

One card anatomy (`EntityCard`) for every "browse this thing" grid, one row anatomy (`ProblemRow`)
for every dense list, one filter shell (`FilterBar`) for every searchable/filterable page. A new
one-off component is a last resort, not a first instinct — see rule 15.

## 9. Typography creates hierarchy

Size and **weight** separate a title from its metadata, not color. Color is reserved for meaning
(a link, a live/active state, the one primary CTA on screen), so when orange appears, it means
something. This is already true of CodeMentor's type scale in `globals.css` — the refactor
tightens how consistently it's *applied*, not the scale itself.

## 10. Borders instead of heavy shadows

A card is a white surface with a 1px light border sitting on a barely-darker page background —
that value step alone reads as "raised." `shadow-card` stays essentially invisible; `shadow-dropdown`
and `shadow-modal` are reserved for content that's genuinely floating above the page (menus,
modals). No new, heavier shadow tier gets introduced.

## 11. Orange as the only brand hue

`--color-primary` (`#EA580C`) is the single accent. It marks the one primary action on a screen,
active/selected states, and the small number of "this matters" badges (live progress, primary CTA).
It is never used decoratively (large color blocks, backgrounds) — see the tint tokens in
`DESIGN_TOKENS.md` for how it appears at low intensity instead.

## 12. Neutral grayscale, true black — no blue undertone

Everything that isn't orange is ink (`#18181B`, a true achromatic near-black) or one of the gray
steps between it and white. `--color-navy` is kept only as a **token alias** for `--color-ink` so
existing `bg-navy`/`text-navy` usages don't need touching — new code should reach for `ink`
semantically even though the class name stays `navy` for now.

## 13. Vietnamese UI, English code

Every user-facing string — labels, buttons, empty states, validation, notifications — is
Vietnamese. Every identifier a developer reads — folders, components, props, hooks, services,
variables — is English. See the Language Rules table below; this is non-negotiable and already
how the codebase is written today.

## 14. Accessibility is not optional

Every interactive element gets a visible `focus-visible` state, every icon-only control gets an
`aria-label`, every "current" nav/tab state is marked with more than color alone (background fill,
`aria-selected`/`aria-current`), and color is never the sole carrier of meaning (status also gets
a text label).

## 15. Reuse before creating

Before writing a new component, check `src/components/ui/` and `src/components/` for something
that already does 80% of the job. `EntityCard`, `FilterBar`, `ProgressBar`, `SegmentedTabs`,
`StatBlock`, `ProblemRow`, `PageHeader`, `Card`, `Badge`, `Button`, `Input` already exist and cover
most "browse a list of things" and "show a stat" needs — extend their props before writing a
sibling component. `COMPONENT_SPECIFICATION.md` is the audit of what exists vs. what's a genuine
gap.

## 16. Business logic stays out of UI components

Data fetching, scoring/ranking, filtering, and formatting live in `src/lib/`, `src/hooks/`, and
`src/data/` — components receive already-shaped props and render them. This is already how the
roadmap feature (`lib/roadmap/*`, `hooks/use-roadmap-*`) is built; the refactor keeps that
boundary everywhere, including the pages that currently inline logic (e.g. `explore/page.tsx`'s
inline `matches()` filter is acceptable at its current size but shouldn't grow without moving to
`lib/`).

## 17. Responsive and mobile-first in practice, not just in theory

Every list/grid page needs a real 1-column mobile layout and a working filter-collapse pattern
(`FilterBar`'s bottom sheet) — not a squeezed desktop layout. This is already implemented for the
roadmap pages; it's the bar every other page's filter/search UI needs to clear.

---

## Language rules

| Layer | Language |
|---|---|
| Folder names, file names | English |
| Component names, props, interfaces | English |
| Variables, functions, hooks, services, utilities | English |
| Code comments (when needed at all) | English |
| Buttons, labels, descriptions | Vietnamese |
| Notifications, toasts, empty/error states | Vietnamese |
| Validation messages | Vietnamese |

## Explicit non-goals (what this refactor does not do)

- Does not copy Kaggle's HTML/CSS, icons, illustrations, logos, or exact grid measurements.
- Does not introduce a second brand hue, gradients, glassmorphism, neon, or heavy shadows.
- Does not make CodeMentor look like an AI product — no robot/sparkle/magic iconography, no
  "AI-powered" framing (see the existing `DESIGN-SYSTEM.md` decision to keep AI-flavored features
  visually restrained; that decision carries forward unchanged).
- Does not touch `Workspace`/`solve` (the IDE-like coding screen) — it intentionally uses a
  different, darker, editor-tool visual language (Monaco, terminal-style panes) that Kaggle's
  content-browsing pattern doesn't apply to. Out of scope for this refactor.
