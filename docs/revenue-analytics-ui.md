# Revenue analytics UI

## Scope and data sources

This includes read-only reporting filters and presentation. No commerce business rules, database schema,
payment requests, reconciliation jobs, hold periods or ledger entries are changed.

- Admin report: `GET /commerce/admin/analytics?days=7|30|90&instructorId=…`.
- Instructor directory: `GET /commerce/admin/analytics/instructors?days=7|30|90`.
- Lecturer report: `GET /commerce/wallet/analytics?days=7|30|90`.
- Lecturer balances: the existing `GET /commerce/wallet` endpoint.

All three reporting endpoints also accept paired `from`/`to` ISO calendar dates
(inclusive in Vietnam, up to 366 days); missing/invalid/reversed ranges return 400.
The API does not currently provide previous-period comparisons,
instructor avatars, or daily revenue per individual course. The UI does not invent
these values. Initials identify instructors; course drill-down displays aggregate
values in the selected reporting period rather than implying a per-course trend.

## Reading the report

The Lecturer initial view contains one summary surface and a large daily trend chart.
Admin defaults to a system-wide overview: one summary surface explicitly separates
learner order value, instructor allocation and CodeMentor allocation. Five visible
charts cover the comparative daily trend, allocation between recipients, course
contribution to CodeMentor, instructor order activity and order statuses. Selecting
an instructor changes every period chart and summary together. Course chart names
open the existing aggregate detail modal; instructor names narrow the report.

The comparative trend overlays, rather than stacks, gross order value and the
CodeMentor allocation. Instructor allocation comes directly from the directory's
historical order shares; it is not inferred by subtracting platform revenue from
gross, so refunded orders or provider fees cannot turn into invented income.
The allocation donut only partitions the two recorded shares, not bank cash.
The `Góc nhìn` selector opens course performance, instructor performance (Admin),
order-status distribution, ledger balances, or daily detail records. Tables are
not shown alongside the main trend by default. Select `Tất cả` to render every
report section together, including the course table, daily detail and current balances.
The redundant trend-to-distribution hint has been removed from Lecturer.

- Share revenue excludes refunded orders and uses the split saved on each order;
  it is before payment-provider fees, not net bank proceeds or withdrawable cash.
- Gross value and the order count include paid/refunded orders. Average order
  value is gross divided by this count, including zero-priced orders.
- Order-status charts count orders, not monetary revenue. Paid/refunded orders
  use payment confirmation dates; unpaid orders use creation dates.
- All-time ledger balances are explicitly separate from period revenue. The date
  selector does not change their temporal scope, only the selected instructor.
- Ranking shows the top seven positive values. Donuts show the top four plus a
  truthful remainder. Zero-value rows remain accessible in the detail tables.
- Selecting a course chart segment/name opens a modal. Selecting an instructor
  segment/name changes the report scope; a clear action returns to all instructors.

## Filters and detail access

Report and summary data disappear into a loading state while their scope changes.
Obsolete requests cannot replace the latest result. Export is disabled during
loading. Reset restores 30 days, the trend view and all instructors (Admin).
The calendar is available under `Chọn ngày tùy ý`. Both dates must be selected,
then `Áp dụng ngày` updates the API scope. Draft dates do not change reports or CSV.
Preset selection and Reset clear the custom dates. All views retain the same applied
period, and the Admin instructor directory uses those same bounds.

The instructor picker searches name/email with deferred input, supports arrows,
Enter and Escape, confines scrolling to a bounded list, and initially renders
50 rows with incremental expansion. It does not imply server-side pagination or
virtualization. Daily/course/instructor tables use the shared pagination control,
10 rows per page, relevant sorting and searches where meaningful.

Report CSV exports the whole period, regardless of daily table pagination/filter.
The instructor-list export respects the selected scope and name/email query, and
exports all matching rows rather than only the visible page. Existing operational
exports keep their original semantics.

## Component ownership

- `packages/ui/src/revenue-overview.tsx`: report navigation, filters and composition.
- `packages/ui/src/revenue/`: summaries, trend, ranking/distribution, detail tables,
  number formatting. Shared components never fetch or mutate commerce data.
- Admin `features/commerce/revenue/`: searchable instructor picker, instructor
  performance, system summary/overview and ledger-balance presentation. Shared
  report composition accepts an Admin-owned overview renderer; Lecturer retains
  its simpler trend-first layout.
- Lecturer `features/commerce/revenue-balances.tsx`: lecturer ledger explanations.
- Page components own authorization and requests; existing transaction tabs remain.

## Verification checklist

Use authorized accounts against the current data, without creating transactions
or invoking financial commands. Disable local commerce jobs while verifying an
EC2-backed environment.

- Verify both roles, exact totals, zero-data scope, and scope reset.
- Change period rapidly and switch metrics/views; no stale report is displayed.
- Search/select an instructor with keyboard and pointer; Escape restores focus.
- Open course/instructor drill-down from charts and accessible name controls.
- Verify tables, sorting, search, pagination, and whole-period CSV downloads.
- Inspect desktop/mobile charts, legends, units, tooltips and internal table scroll.
- Run root lint, typecheck and production builds. Local HTTP login uses dev mode;
  production login retains its HTTPS requirement.

Calendar verification (2026-10-07): 10 visible Chromium checks passed across Admin
and Lecturer, using existing EC2 data and local services with commerce jobs disabled.
Covered All view and scroll access, both calendar bounds, exact CSV dates/totals,
draft/invalid input, server 400/role 403, one day/leap day/366 days, reset, mobile
and dark mode. No financial commands were called. Backend: 27 focused reporting
tests passed. Frontend root typecheck/build passed; lint has 0 errors and the
existing 40 warnings. Deployment must update learning-service before these frontends.
