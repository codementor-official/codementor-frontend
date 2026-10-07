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

**Chính sách doanh thu** edits the database-backed holding period from 0–90 days.
The confirmation displays current/proposed values; blank/invalid days cannot be saved.
New policy only affects newly created orders/withdrawal requests. Historical order
snapshots remain unchanged; zero days still requires verification and refund checks.
No schema migration is required.

Local QA: eight authenticated visible-Chromium checks passed; financial requests were
intercepted while policy/operational reads used the existing data. Actual server policy
was unchanged; no financial command or migration was forwarded. CSV download, failure
feedback, cancellation, validation and desktop/mobile/dark layouts were checked.
Backend report computation is covered by isolated tests, not fabricated UI outcomes.
These local checks do not certify a real provider reconciliation or payout;
production deployment and health checks are verified separately.
