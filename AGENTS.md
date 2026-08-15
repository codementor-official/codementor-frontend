# CodeMentor frontend agent rules

Read `docs/architecture/frontend-architecture.md` before architecture-sensitive work.

## Repository architecture

- `apps/web` is the primary member/student application.
- `apps/lecturer` is the lecturer dashboard.
- `apps/admin` is the administrator dashboard.
- `packages/*` contains reusable cross-application packages only.

Never import from one app into another. Shared packages must never import from an app.

## Placement and ownership

- Put business features in `apps/<app>/src/features/<feature>`.
- Keep Next.js route files focused on routing, layouts, boundaries, and page composition.
- Keep code used by one feature inside that feature.
- Keep code shared across features in one application under that application's `src/components`, `src/hooks`, or `src/lib`.
- Extract to `packages` only when a concrete cross-application abstraction exists. Do not extract code because it might be reusable later.

## Refactoring rules

- Preserve existing behavior, routes, UI, API contracts, and environment behavior.
- Do not introduce cross-app imports, unrelated UI changes, or unrequested dependency upgrades.
- Prefer small, reviewable changes.
- Keycloak and the backend enforce authorization. Client role checks are UX aids, not a security boundary.
- Never expose secrets through `NEXT_PUBLIC_*` variables or client bundles.

## Next.js

This repository uses Next.js 16. APIs and conventions may differ from training data. Before changing framework behavior, read the relevant guide from the installed Next.js documentation under the app's resolved `node_modules/next/dist/docs/` and heed deprecation notices.

## Validation

After meaningful changes, run:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Run relevant tests as well when tests exist.
