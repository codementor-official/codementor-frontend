# Admin reconciliation feedback

At /commerce, confirm **Đối soát ngay** to send the explicit POST command.
The results modal separates selected/confirmed/waiting/errors for all five stages;
confirmed terminal responses include unsuccessful provider transactions.
Available-credit amounts and debt offsets come from committed income releases.
They are not reported as a bank balance or overall net wallet change.

Backlog reasons explain why available income may not increase. Unknown statistics
are shown as unavailable, not zero. A partial run preserves its successful outcomes.
An already-running response does not launch another run. Network/legacy backend errors
ask Admin to refresh/check journals before retrying; no automatic financial retries.
The latest report can be reopened until leaving/reloading the page and exported as CSV.

**Chính sách doanh thu** edits the database-backed holding period in days or minutes
(0–90 days / 0–129600 minutes). Confirmation displays exact current/proposed values;
blank, fractional or out-of-range inputs cannot be saved. Switching units never
silently rounds a duration. Short minute settings warn about the global demo impact.
New policy only affects newly created orders/withdrawal requests. Historical order
snapshots remain unchanged; zero days still requires verification and refund checks.
Backend migration 0039 must precede the exact-minute backend release. Missing minute
fields from an older API fall back to days, so frontend rollout remains compatible.

Lecturer earnings show ledger-derived held income, the current policy for new orders,
the nearest future order deadline, eligibility counts and withdrawal conditions.
Each order detail uses its own duration snapshot and a Vietnam-time deadline.
The deadline is not a promise of automatic release; Admin/system reconciliation and
refund/debt safeguards still apply. Refresh reads data without running jobs.

For a one-minute demo, confirm the policy before creating a new order, verify payment,
wait for its deadline, run normal reconciliation, then refresh the lecturer wallet.
Restore the normal policy afterwards. Do not expect historical orders to change.

2026-10-08: root typecheck/lint/build passed. Browser tests checked a cancelled
one-minute policy confirmation, invalid fractional input, lecturer descriptions and
order details using read-only production data; no financial or policy writes forwarded.

Local QA: eight authenticated visible-Chromium checks passed; financial requests were
intercepted while policy/operational reads used the existing data. Actual server policy
was unchanged; no financial command or migration was forwarded. CSV download, failure
feedback, cancellation, validation and desktop/mobile/dark layouts were checked.
Backend report computation is covered by isolated tests, not fabricated UI outcomes.
These local checks do not certify a real provider reconciliation or payout;
production deployment and health checks are verified separately.
