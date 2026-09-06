# Client dashboard: audit and implementation

## Audit

The historical page at `ab3e5b0^:apps/client/src/app/(app)/dashboard/page.tsx`
used `data/sample-dashboard.ts` for its welcome, stats, unfinished exercises,
weekly hours, deadlines, skills and popular topics. Recommendations were already
connected to recommendation-service in that revision. Earlier versions also had
streak cells, recent activity, recently viewed content and invented badge events.

The API-backed replacement kept profile/stats, enrolled courses/roadmaps,
assignments and recent activities, but removed recommendations, topic progress,
weekly goals and the activity visualization. Its seven initial requests plus one
request per workspace caused a fan-out (and silently truncated workspaces to 20).
One failed primary request hid the entire dashboard. For an owner/reviewer the
workspace assignment endpoint returned other members' work, which was incorrectly
presented as the current user's tasks.

## Data mapping

| Section | API/source | Decision |
| --- | --- | --- |
| Welcome | Existing AuthProvider profile from `/me` | Reuse; no duplicate profile request |
| XP, solved count, coding streak | `/me/stats` | Reuse existing statistics |
| Continue learning | `/activity/me/dashboard` → EnrollmentUseCases → course/roadmap enrollments | Aggregate; order recent activity first; include paused enrollments |
| Calendar and recent achievements | Same endpoint → UserActivityUseCases → enrollments, lesson/exercise progress | Restore from recorded events; 56 days, eight timeline entries |
| Recorded learning time | Same endpoint → lesson_progress sum | Lifetime recorded time, explicitly not weekly hours |
| Weekly plan | `/me/preferences` + calendar | Persisted goal/schedule; derive active days this week in account timezone |
| Upcoming work | `/workspaces/me/pending-assignments` → WorkspaceContentService/repository | New bounded query across all active memberships, current user only |
| Topic progress | `/exercises/topics` | Reuse public-bank counts and personal solved/attempted counts |
| Suggested next content | `/recommendations/exercises`, `/courses`, `/roadmaps` under recommendation prefix | Reuse recommendation-service; fetch only selected category, limit four |

Both new endpoints retain existing gateway prefixes, bearer-token authentication
and the platform `{ data: ... }` response envelope. No user ID is accepted as an
input. Pending assignments exclude completed, unpublished and deleted work, inactive
members and archived groups, and honor effective `view_exercise` permission. The
owner override follows workspace permission behavior. Sort is deadline first,
undated last, with a stable tie-breaker; at most eight rows are returned.

## Architecture and states

`page.tsx` remains a route-only entry. `features/dashboard` contains a typed service,
composition screen and sections: ContinueLearning, DashboardPlanner,
DashboardTrends, DashboardNextAction, DashboardAssignments, DashboardCoach,
DashboardSkills and DashboardRecommendations. Shared Card,
Button, Badge, ProgressBar, PageHeader and skeleton primitives are reused.

Five bounded domain requests replace per-group fan-out. Recommendations have a
separate loader and retry surface. Existing authenticated loading logic discards
responses from previous users/preferences/retries. Requests have a 15-second UI
deadline. Failures are represented as unavailable (`null`), never fake zero data.
The learning projection isolates subsection failures with Promise.allSettled.

Ranking remains in recommendation-service. The right rail now adds an explicit,
on-demand AI Coach: authenticated GET/POST `/ai/dashboard/insight` in the existing
Python AI service. GET reads the saved analysis; only POST calls the existing
structured-output provider with the configured chat model. Minimum learning
metadata (not email, name or token) is collected server-side. Personalization
opt-out disables both reads and generation. Results are cached per authenticated
subject in MongoDB for six hours, with a daily limit (default five), concurrency
lock and candidate-link allowlist. The model cannot invent destination URLs.
No automatic schedule mutation or model call occurs on dashboard refresh.

The center prioritizes next action, a 7/28-day activity bar chart, ongoing content,
the user's pending-assignment table, topic progress and content suggestions. Two
compound rail cards hold AI analysis and the saved plan, weekly habit, milestones
and recent activity. Empty data remains explicitly empty rather than fabricated.

## Deliberate data boundaries

- There is no daily study-duration ledger: assigning the lifetime lesson timer to
  a week would be false. The weekly card shows recorded active days against the
  persisted scheduled-day goal, and shows the configured hour target separately.
- There is no badge-award or recently-viewed ledger. Recorded completion events
  provide achievements; no fabricated badge or browsing history is returned.
- Topic completion is not an AI skill assessment; the UI labels this explicitly.
- Database schema and progress-maintaining triggers are unchanged. No migration,
  seed/reset or data backfill was needed.

## Verification

- Backend `learning-dashboard.service.spec.ts`: empty data, subsection failure,
  authenticated identity and service-account rejection.
- Backend `scripts/verify-dashboard.cjs`: authenticated owner/member API results
  compared with Prisma/database; verifies own assignments and ignored forged user ID.
- Frontend `scripts/dashboard-smoke.cjs`: password login, authenticated API reads,
  reload, desktop/mobile horizontal overflow, dark theme, subsection failure and
  JavaScript errors. Credentials come only from environment variables.
- Repository checks: `pnpm typecheck`, `pnpm lint`, `pnpm build`; backend Nest builds
  for learning/workspace and focused ESLint. Root frontend lint has pre-existing
  errors in `features/reports/report-button.tsx` (hardcoded white and outline-none).
- Fixed missing direct `highlight.js` dependencies in client and shared editor
  (same version already in lockfile), which caused solve-link prefetch to poison
  the dev server with compilation errors.
- AI unit tests cover opt-out, excluding completed courses, rejecting unexpected
  model fields and removing duplicate/unknown candidate links.
- AI authentication allows five seconds of clock skew after live testing found
  Keycloak's issued-at timestamp ahead of this local machine. A regression test
  verifies that expired JWTs remain rejected; signature/issuer/audience checks stay.
- Authenticated AI GET/POST/GET returned the same saved analysis and timestamp.

Final verification: `pnpm build` passed for client, lecturer and admin (3/3).
Client typecheck and dashboard-targeted ESLint passed. Python dashboard/suggestion
tests passed (12), plus the JWT clock-skew regression (1); Nest dashboard tests
passed (3). The final authenticated browser smoke passed including AI cache,
reload, partial failure, mobile overflow and no page errors. Root lint still has
the unrelated report-button errors noted above.

The earlier login panic log explicitly reported `Next.js package not found` after
the directory move. Current dependency junctions point to `D:/dev/uploads`, and the
authenticated smoke test logs in and reloads without the previous redirect loop.
No authentication/routing behavior was rewritten for the dashboard.
