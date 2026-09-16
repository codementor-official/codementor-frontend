# CodeMentor frontend guidance

Follow `AGENTS.md` and use `docs/architecture/frontend-architecture.md` as the architecture source of truth.

Critical constraints:

1. Maintain three independent Next.js apps: client, lecturer, and admin.
2. Never import application code across apps.
3. Shared packages may be consumed by apps but must never depend on apps.
4. Organize substantial business code feature-first under `apps/<app>/src/features`.
5. Keep App Router files thin and focused on composition.
6. Preserve current behavior during refactors.
7. Keycloak is the authentication and authorization provider; frontend checks do not replace backend enforcement.
8. Never expose secrets to browser code.
9. Do not perform unrelated dependency upgrades.
10. Run lint, typecheck, and build before finishing significant changes. `build` is the gate that
    catches prerender failures the other two miss; read its exit code, not a piped tail.
11. The backend is reached through the Kong gateway at one origin, never per-service ports.
    Keycloak lives at `https://id.codementor.cloud` — an issuer mismatch makes sign-in appear to
    succeed and then fails every API call with 401.
12. `README.md` describes the repo for humans; `AGENTS.md` holds the authoritative package table.
    When they disagree, `AGENTS.md` wins — and fix the README in the same change.
