# CodeMentor Design System — Kaggle-Inspired Analysis

> **Sources.** This document is grounded in two things: (1) live inspection of
> `kaggle.com` and `kaggle.com/competitions` (computed styles pulled directly from the rendered
> page — font stacks, border colors, radii, spacing — captured 2026-08-01), and (2) the two
> reference screenshots supplied for this task (homepage hero + "Who's on Kaggle", and the
> Competitions listing with its card grid). Where an earlier draft (`DESIGN-LANGUAGE.md`, written
> without live browser access) guessed a value, this document corrects it against the live
> measurement and notes the correction.
>
> **Codebase baseline.** CodeMentor already has a working design token system
> (`src/app/globals.css`) and a primitive library (`src/components/ui/*`, `EntityCard`,
> `ProblemRow`, `PageHeader`, `FilterBar`). Large parts of what this document recommends are
> **already implemented** (currently uncommitted on the working tree — see
> `IMPLEMENTATION_PLAN.md` for exact status). This document explains *why* those choices are
> correct and what's left to apply them consistently at the page level.

---

## 1. Design Philosophy — why Kaggle reads as professional

Kaggle's UI is an instrument for scanning large amounts of structured information (competitions,
datasets, leaderboards) quickly and deciding "is this relevant, do I click in." Its personality is
*technical-credible, not corporate-shiny*: near-white surfaces, one restrained brand hue, tight
typographic contrast, almost no illustration or marketing gloss outside the hero. The first
impression is "built by people who work with data" — for an audience of engineers and students,
that reads as more trustworthy than a glossier product would.

Three structural reasons drive that feeling:

1. **No competing texture.** Every content block sits on a flat surface with a single hairline
   border — no gradients, no background imagery, no shadow "pop." Verified live: competition cards
   use `border: 1px solid rgb(218, 220, 224)` and `box-shadow: none`.
2. **Color is spent on state and action only**, never decoration. A colored element always means
   something (a link, a live badge, the primary CTA).
3. **Type does the hierarchy work.** Size and weight differences separate a title from its
   metadata — not hue.

Density feels comfortable, not cramped, because whitespace is *asymmetric*: tight inside a
component (label-to-value, icon-to-text), generous between unrelated components (card-to-card,
section-to-section). A naive design spaces everything evenly; Kaggle's competition list packs
10+ rows on one screen precisely because it doesn't.

**For CodeMentor:** this maps directly onto principle #4 and #10 in
`PROJECT_DESIGN_PRINCIPLES.md`. It also validates a decision CodeMentor's original
`DESIGN-SYSTEM.md` already made independently — sections separated by `border-t`/`border-b`
instead of large margins, cards at `gap-4`–`gap-5` rather than generous marketing spacing. Keep
that instinct; formalize it as tokens (see `DESIGN_TOKENS.md`).

## 2. Visual Hierarchy

Hierarchy is built with **weight + size + color-value (not hue)**: a bold, larger, near-black
title; a smaller, lighter-weight gray metadata line beneath it; a small neutral chip for a
category, with the single brand hue reserved for one "this is the one to notice" element per view
(primary CTA, live/active state). Live-measured: Kaggle's hero `<h1>` is `700` weight, `44px`,
`52px` line-height, color `rgb(32,33,36)` (near-black, not pure `#000`) — heavy weight and tight
line-height on a large size, not a saturated color, is what makes it read as "the most important
thing on the page."

Because there is only one accent hue in the whole system, when it does appear the eye is drawn to
it immediately. This is the core trick behind why the UI looks calm *and* still directs attention
— CodeMentor already has this structurally (only `navy`/`ink` + `primary` orange exist as hues;
`success`/`accent`/`ai` all alias `ink`, `danger` aliases `primary`). Nothing new is needed here —
the discipline is in *not* reaching for a third hue when a feature "needs to stand out."

## 3. Layout System

**Correction vs. the earlier draft:** live-measured content width on `kaggle.com/competitions` is
`1280px` (`<main>` width at desktop viewport), not the guessed 1200–1280px range — close enough
that CodeMentor's existing `--container-max: 1200px` token needs no change; it's a reasonable,
slightly tighter equivalent.

Kaggle organizes content as either (a) a fixed-width left rail (icon nav, ~64–70px collapsed) +
fluid content, matching the screenshot's left icon rail, or (b) a repeating card grid (2–4 columns
by breakpoint) with a fixed gutter. CodeMentor's app shell already uses exactly pattern (a):
`Sidebar` is a collapsible icon+label rail (`w-16` collapsed / `w-60` expanded) next to a fluid
`<main>`. No structural change needed — this is a case of "already Kaggle-aligned, keep it."

Section rhythm is vertical and consistent: a section gets either a full padding block or a
hairline divider with tighter padding, never both. Alignment is strict — everything in a
row/card shares the same left guide (icon, title, metadata line up); right-aligned elements
(stats, actions) share their own consistent right edge. This is the same anatomy already specified
for `ProblemRow` (identity tile → title/meta stack → stat cluster → action, all sharing edges).

## 4. Typography System

Kaggle uses a **single functional grotesque for UI/body text** — live-verified:
`font-family: Inter, sans-serif` on `<body>`. Headings additionally load a distinct display face
(`zeitung`, a licensed/proprietary font) at `44px/700/52px` for the hero `<h1>`. **We do not adopt
the second display font** — it's proprietary, and introducing a second typeface is a bigger
commitment than this refactor calls for. CodeMentor already uses Inter everywhere (`--font-sans`)
and Roboto Mono for code/numerals (`--font-mono`); the Kaggle-derived lesson isn't "add a display
font," it's "let weight (700/800) and size do what a display font would do" — which is exactly
principle #9.

Body copy sits small (13–14px) and metadata smaller (11–12px), with generous line-height for body
(~1.5) and tight line-height for headings (~1.15) — this is what keeps dense metadata blocks
legible without visually expanding. Description text is short and truncated (1–2 lines,
`line-clamp`) — it's a preview to help someone decide whether to click in, not prose to read in
place. `EntityCard`'s `description` already uses `line-clamp-2` — correct, keep.

This already matches CodeMentor's type scale (`text-2xl font-bold` page titles, `text-sm`/`text-xs`
body/metadata, `font-semibold` card titles). The gap is *consistency of application*, not the
scale itself — see `PAGE_GUIDELINES.md` for pages that currently improvise sizes inline instead of
using the scale.

## 5. Color Usage

Live-verified palette shape: near-white page background, white card surfaces, near-black text
(`rgb(32,33,36)`), two-to-three gray steps for secondary text/borders, and **one** brand hue used
sparingly for links/primary actions/status. Category and difficulty differentiation is carried by
label text, not by a rainbow of tag colors — tag chips stay neutral gray with text.

This is precisely the constraint already set for CodeMentor (orange + ink + white + neutral gray
only), and it's already how the token system is built: `success`/`accent`/`ai` alias `ink`,
`danger` aliases `primary`. The one correction already applied in the current `globals.css`: the
old `--color-navy: #1F2937` had a faint blue undertone (a "slate," not a true neutral) — it's now
`--color-ink: #18181B` with `navy` kept only as a backward-compatible alias. That makes "only two
hues in the system" literally true rather than approximately true.

**Tint usage:** orange never appears as a large fill — `--color-primary-tint` (`#FFF7ED`) is used
for low-intensity backgrounds (banners, note callouts, active-badge fills), reserving the solid
`#EA580C` for the one primary action or true "live/active" indicator per view.

## 6. Border Radius System

**Correction vs. the earlier draft:** the earlier guess ("chips/tags and buttons around 4–6px,
cards around 6–8px") does not match live Kaggle. Measured directly: competition cards use
`border-radius: 16px`, and pill-style secondary buttons/chips ("View All Hackathons") use
`border-radius: 20px` (a true pill, `padding: 0 24px`). Kaggle's actual radius language is
**larger and softer** than the earlier draft assumed, split into two tiers: a generous
card-corner radius, and full-pill radius for buttons/chips/status pills.

**Recommendation for CodeMentor:** don't copy 16px/20px wholesale — CodeMentor's existing
`DESIGN-SYSTEM.md` made a deliberate, reasoned choice to be *squarer* than its own mockup
(`radius-lg: 10px` for cards, `radius-md: 8px` for buttons/inputs, explicitly avoiding
pill-everything). That's a legitimate, different identity choice ("tool," not "consumer app") and
the task's design requirements don't mandate matching Kaggle's radius. Keep the existing scale.
The one addition worth making: a `--radius-2xl: 16px` token for the small number of surfaces that
benefit from a softer corner at Kaggle's scale — large feature/hero cards, not the dense list
cards. See `DESIGN_TOKENS.md`.

## 7. Elevation System

Depth comes almost entirely from **borders and background-value steps**, not shadow — verified:
Kaggle's cards have `box-shadow: none`. A card is a white surface with a 1px light-gray border on
a barely-darker page background; that value difference alone reads as "raised." Shadow is reserved
for genuinely overlaid content (dropdowns, modals) where a border alone wouldn't separate it from
what's behind it. Hover states darken the border or nudge the background tint, never add
elevation — hovering shouldn't make the page feel busier.

CodeMentor's existing 3-tier shadow system (`shadow-card` barely-there, `shadow-dropdown`,
`shadow-modal`) already matches this restraint and is the ceiling — no new, heavier shadow tier
should be introduced. `Card`'s `interactive` prop (`hover:border-ink/20`) is the correct
implementation of "hover = border delta, not shadow pop."

## 8. Spacing System

Live pattern: an 4px-based scale, applied with intent — small values (4/8) for intra-component
gaps, medium (12/16) for card/row internal padding, larger (24/32) between grid items, largest
(48/64) between major page sections. CodeMentor's original `DESIGN-SYSTEM.md` already documented
an intentionally *tighter* adaptation of this (sections at `py-10`–`py-14` rather than
`py-16`–`py-24`, card gaps at `gap-4`–`gap-5`) — that's a reasonable choice for a denser,
task-oriented app and should be kept, now formalized as an explicit `--space-*` token scale rather
than a prose range (see `DESIGN_TOKENS.md` — this scale is already in `globals.css`).

## 9. Component Relationships

The recurring Kaggle shell — icon rail nav, sticky top bar with search, filter bar above a
list/grid, right-aligned stat cluster or CTA — is already CodeMentor's shell:
`Sidebar` + `Topbar` + page content + (on roadmap pages) a right-hand progress/context rail. The
relationship that needs tightening, not inventing:

- **Card grid ↔ list row.** Kaggle offers both a card-grid view (datasets/competitions) and a
  dense row view (leaderboards, notebooks) for the same underlying content type. CodeMentor's
  `Practice` page already toggles between `ProblemRow` (list) and `EntityCard`-via-`CourseCard`
  (grid) for the same data — this is the right pattern; it should extend to `Explore`.
- **Filter bar ↔ content.** One `FilterBar` shell serves search + filters + sort + mobile sheet,
  reused by every filterable page, not re-implemented per page (already true for roadmap; not yet
  true for Practice/Explore, which hand-roll their own search row — see `PAGE_GUIDELINES.md`).

## 10. White Space

Kaggle allocates space asymmetrically (see §1). CodeMentor's spacing tokens already encode this:
tight `gap-1.5`–`gap-2.5` inside components, `gap-4`–`gap-5` between grid items, section
separation via borders rather than margin stacking. No new philosophy needed — the gap is
*applying it uniformly* on pages that currently improvise (see `PAGE_GUIDELINES.md` per-page
notes).

## 11. Responsive Strategy

- **Desktop:** multi-column grids (3–4 up), sidebar + filter bar fully expanded inline.
- **Tablet:** grids drop to 2 columns, filter bar wraps but stays inline.
- **Mobile:** grids collapse to 1 column, sidebar hides behind the existing collapse toggle,
  filter bar collapses into a "Bộ lọc" trigger + bottom sheet.

CodeMentor's `FilterBar` (extracted from `RoadmapFilterBar`) already implements the exact mobile
bottom-sheet pattern — it should be the shared filter primitive everywhere, not reinvented per
page.

## 12. Interaction Philosophy

- Hover/focus states are always a background or border delta, never a shadow pop or scale/bounce.
- Nothing animates beyond ~150–200ms, ease-out, and only `color`/`background`/`border`/`transform:
  translate` (e.g. the existing sidebar width transition, chevron rotation on `<details>`) —
  never a bouncy/elastic easing.
- Navigation marks "current" with a filled/tinted background, never color-text alone
  (accessibility — a colored label alone isn't a reliable "you are here" signal).
- Filter UIs always surface an active-filter count and make it obvious how to reset — `FilterBar`'s
  mobile trigger already shows a count badge; this should extend to the desktop inline controls
  too where it's currently missing.
- Card/row order is always **identity → title → description → metadata/tags → action** — never
  mixed between card types on the same page.

---

## Summary: what's already correct vs. what needs work

| Area | Status |
|---|---|
| Layout shell (rail + topbar + content) | ✅ Already matches, keep as-is |
| Type scale, weight-driven hierarchy | ✅ Scale already correct; consistency of use is the gap |
| Color system (2-hue constraint) | ✅ Already correct, `ink` correction already applied |
| Radius scale | ✅ Deliberate, reasoned CodeMentor identity — keep, add one large-surface token |
| Elevation (borders > shadow) | ✅ Already correct |
| Spacing scale | ✅ Already correct, now formalized as tokens |
| Filter bar pattern | ⚠️ Correct on roadmap pages, not yet reused on Practice/Explore |
| Card/list-row consolidation | ⚠️ `EntityCard`/`ProblemRow` exist; not every page uses them yet |
| Placeholder/stub pages (Settings, Submissions, Progress) | ❌ Not yet built — see `PAGE_GUIDELINES.md` |
