# CodeMentor frontend agent rules

Read `docs/architecture/frontend-architecture.md` before architecture-sensitive work.
Read `docs/UI_AUDIT_AND_PLAN.md` + `DESIGN-SYSTEM.md` before any UI work.

## Repository architecture

pnpm workspace (`apps/*`, `packages/*`) orchestrated by Turborepo.

| Path | Package name | Port | State |
| --- | --- | ---: | --- |
| `apps/client` | `@codementor/client` | 3000 | The real product: member/student app, all migrated routes and UI |
| `apps/lecturer` | `@codementor/lecturer` | 3010 | Built out: shell, auth, courses/exercises/roadmaps features |
| `apps/admin` | `@codementor/admin` | 3011 | Built out: shell, auth boundary, dashboard/section features |
| `packages/ui` | `@codementor/ui` | — | **The** primitive library — `Button`, `Card`, `Input`, `PageHeader`, `FilterBar`, `Select`, `SegmentedTabs`, `Modal`, `ConfirmButton`, `SideDrawer`, `DrawerDetail`/`DetailMeta`/`DetailRow`/`DetailSection`, `ToastProvider`/`useToast`, `DataTable`, `StatusBadge`, `ManagePage`, `DashboardShell`, `useResolvedTheme`, `workspace/*`. Consumed by all three apps |
| `packages/editor` | `@codementor/editor` | — | Monaco code editor + TipTap rich-text editor. Used by client + lecturer |
| `packages/api-client` | `@codementor/api-client` | — | `createApiClient`, `ApiClientError`. Used by all three apps |
| `packages/auth` | `@codementor/auth` | — | Keycloak config types, `hasRole`/`hasAnyRole`. Used by all three apps |
| `packages/solve` | `@codementor/solve` | — | `SolvePreview` (màn giải bài ba khung) + kiểu/nhãn bài code. Used by lecturer (xem thử) |
| `packages/types` | `@codementor/types` | — | `Role`, `User`, `Pagination`, `ApiResponse`, and the content vocabulary (`FIELDS`/`LEVELS`/`MODES`/`CONTENT_STATUSES`, `LESSON_TYPES` and their labels/tones). Used by all three apps |
| `packages/utils` | `@codementor/utils` | — | `joinUrl`. Used by `api-client`, client, lecturer |
| `packages/eslint-config` | `@codementor/eslint-config` | — | Flat config consumed by root `eslint.config.mjs` |
| `packages/typescript-config` | `@codementor/typescript-config` | — | `base.json`, `nextjs.json` |

Keep this table accurate. It drifted badly once (it described `packages/ui` as "DashboardShell
only" long after three apps depended on its full primitive set), and a wrong table is worse than
no table. Update it in the same commit that changes a package's contents or consumers.

Never import from one app into another. Shared packages must never import from an app. Nothing
enforces this mechanically — `@/*` resolves only to the owning app's `src/*`, and that is the
whole guardrail.

A Next.js app that imports a workspace package must list it in `dependencies` as `workspace:*`
**and** add it to `transpilePackages` in its `next.config.ts` (packages ship raw TypeScript).
See `apps/admin/next.config.ts`.

## Placement and ownership

- Put new business features in `apps/<app>/src/features/<feature>`.
- `apps/client/src/features` is currently empty. Existing client code is organized by domain folders
  under `src/components/<domain>` and `src/lib/<domain>`, with `src/data` (mock data), `src/types`,
  `src/hooks`. Do not bulk-migrate it; move a domain into `features/` only when you are already
  reworking it.
- Keep Next.js route files focused on routing, layouts, boundaries, and page composition.
- Keep code used by one feature inside that feature.
- Keep code shared across features in one application under that application's `src/components`,
  `src/hooks`, or `src/lib`.
- Extract to `packages` only when a concrete cross-application abstraction exists. Do not extract
  code because it might be reusable later.

## UI rules (non-negotiable)

Full reasoning and the audit that produced these: `docs/UI_AUDIT_AND_PLAN.md`.
Token/component detail: `DESIGN-SYSTEM.md`.

1. **One page shell.** Every `(app)` page is `Breadcrumb → PageHeader → StatStrip? → content`,
   in that order. No page renders its own `<header>` or an `<h1>` outside `PageHeader`. A page's
   loading state uses the same header components as its loaded state.
2. **Breadcrumb everywhere.** Rendered by the shell, derived from
   `apps/client/src/lib/navigation/route-meta.ts`. Never hand-roll a `← Quay lại X` link — "back"
   is the previous crumb. A new route ships its `route-meta` entry in the same commit.
3. **Fluid width.** Only the app shell sets a width ceiling. No page sets `max-w-*` on its root.
   The one permitted clamp is `max-w-[72ch]` on prose (article body, lesson text). Data, grids,
   and tables never clamp.
4. **List orientation has one rule.** Grid when items are comparable and the user is choosing;
   list/table when items are scannable and the user is hunting. **Horizontal scroll strips are
   banned** in the app shell — overflow wraps, it does not scroll. One filter mechanism per page:
   `FilterBar` plus at most one `SegmentedTabs`.
5. **Stats are a strip, not a wall.** At most one `StatStrip` per page (≤64px, no cards, no
   icons), directly under `PageHeader`. A number earns a place only if it is computed from real
   data *and* actionable — hardcoded marketing figures are deleted, not styled. Per-entity
   metadata belongs on the entity's card, not in a page-level tile. Right rails cap at 2 cards,
   each carrying an action or a deadline.
6. **Two libraries, no ambiguity.** `packages/ui` holds primitives that more than one app uses
   and that are built on the shared token names. `apps/client/src/components/ui` holds the student
   product's own primitives — they are built on `navy`/`surface`/`on-ink`/`border-soft`, which
   lecturer and admin do not define, so moving them would create a shared package with one
   consumer. Where both libraries export the same name (`Button`, `Card`, `PageHeader`), eslint
   blocks the wrong import rather than one being deleted; they differ on purpose (web's `Button`
   is a 40px CTA that can render as a Link, the shared one is a 36px control for dense tables).
   Never add a third copy of a name, and never re-export one library through the other.
7. **Tokens only.** No `zinc-*` / `gray-*` / `slate-*` / `orange-*` / `bg-white` / `text-white`,
   no arbitrary type sizes (`text-[10px]`). Hardcoded colors are holes in dark mode. On a surface
   that stays dark in both themes (`bg-ink-fixed`) the foreground is `text-on-ink-fixed`, not
   `text-on-ink` — the latter inverts and would render near-black on near-black.
8. **One interaction language.** Hover is a border or background delta —
   `transition-colors duration-150`. No `translate`, no `scale`, no hover shadow.
   **Focus is already handled**: a base rule in `globals.css` rings every interactive element on
   `:focus-visible`, so do not add one per component — and never write `outline-none`, which
   suppresses it everywhere including keyboard focus.

Rules 6–8 are enforced by eslint (`packages/eslint-config`), as errors in `apps/client` and as
warnings in `apps/lecturer`, `apps/admin`, and `packages/ui` until those get their own audit.
Promote an app to `error` in the same change that cleans it up. **Do not silence a rule to land
a change** — the whole point is that the convention runs rather than being remembered.
9. **Ship it or delete it.** No nav-reachable route may render a placeholder. Mock data is
   allowed only where the shape and interaction are the real ones and a backend is planned; a
   mock that exists to fill a grid gets deleted, along with its data file and components.
10. **Confirm in a dialog, report in a toast.** An action the user cannot walk back — deleting,
   unpublishing, rejecting, anything that changes what other people see — asks first in a modal
   (`ConfirmButton`, or `Modal` when the confirmation also collects input such as a reason). The
   modal names the consequence in a sentence; it does not merely say "are you sure". Never
   confirm with a second click on the same button, an inline warning strip, or `window.confirm`.

   The **result** of an action — "Đã lưu", "Đã duyệt", "Lưu thất bại" — is a toast
   (`useToast()`), never a strip under the page header. Header strips push the layout down,
   sit far from where the user just clicked, and stay on screen long after the fact.

   Three things stay in place and never become toasts, because the user needs them while
   looking at the thing they describe: a **load failure** for the surface being read (the list
   that could not be fetched), a **field validation** message (it belongs beside the field), and
   **record state** such as the rejection reason on content that was sent back. If a message is
   still true five seconds later, it is not a toast.

   `ToastProvider` wraps each app in its root `layout.tsx`, outside the auth provider.

## Refactoring rules

- Preserve existing behavior, routes, UI, API contracts, and environment behavior — except where
  `docs/UI_AUDIT_AND_PLAN.md` explicitly schedules a route or surface for deletion.
- Do not introduce cross-app imports, unrelated UI changes, or unrequested dependency upgrades.
- Prefer small, reviewable changes.
- Keycloak and the backend enforce authorization. Client role checks are UX aids, not a security boundary.
- Never expose secrets through `NEXT_PUBLIC_*` variables or client bundles. Each app declares its
  browser-safe variables in `apps/<app>/.env.example`; developers copy it to an untracked `.env.local`.

## Next.js

This repository uses Next.js 16.2.12 (all three apps pin the same version). APIs and conventions may differ from training data. Before changing framework behavior, read the relevant guide from the installed Next.js documentation under the app's resolved `node_modules/next/dist/docs/` and heed deprecation notices.

## Validation

After meaningful changes, run:

```bash
pnpm lint       # root eslint over the whole workspace, not a turbo task
pnpm typecheck  # turbo, per package
pnpm build      # turbo, per app
```

Single app: `pnpm dev:client`, `pnpm dev:lecturer`, `pnpm dev:admin`, or
`pnpm --filter @codementor/<name> <script>`.

`pnpm build` is the real gate and it is not redundant with `typecheck`: Next.js prerenders routes
at build time, so a page that only fails during static generation passes typecheck and fails here.
Check the exit code directly — `pnpm build | tail` reports the **pipe's** status, not the build's,
so a red build reads as green.

There are no tests in this repository yet. Run relevant tests once tests exist.
