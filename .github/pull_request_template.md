## Summary

<!-- What changes, and why. Link the issue or report this addresses. -->

## Type of change

- [ ] Feature
- [ ] Bug fix
- [ ] Refactor (no behaviour change)
- [ ] Documentation
- [ ] Chore / tooling

## Applications affected

- [ ] Client
- [ ] Lecturer
- [ ] Admin
- [ ] Shared packages: <!-- e.g. packages/ui -->

## Screenshots

<!-- Before / after for every visible change, in light and dark themes. -->

| Before | After |
| --- | --- |
| | |

## How it was tested

- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] `pnpm build` passes (exit code checked)
- [ ] Checked in the browser, desktop and mobile widths

<!-- Describe the flows you exercised. -->

## Checklist

- [ ] No imports across apps; shared code lives in `packages/*`
- [ ] UI built from `packages/ui` with design tokens only
- [ ] No secrets behind a `NEXT_PUBLIC_` prefix
- [ ] Depends on a backend change: <!-- link, or "none" -->
