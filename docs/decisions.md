# Decisions

Notable choices made during the build, and why — so a future change can be made deliberately
instead of by accident.

## SQLite via `node:sqlite`, not `better-sqlite3`

`better-sqlite3` requires native compilation (node-gyp), which needs Visual Studio C++ Build
Tools on Windows — a multi-gigabyte install for a database driver. Node 22+ ships a built-in
`node:sqlite` module with a very similar API (`DatabaseSync`, `.prepare()`, `.run()`/`.get()`/
`.all()`) and zero native dependencies. Tested and confirmed working, including named parameter
binding, before committing to it.

## No ORM

Plain prepared statements. For a schema this size (8 tables), an ORM's abstraction cost
(migrations tooling, generated types, a query builder to learn) outweighs the benefit. The SQL is
always visible in the route/service files, which also makes the "every query is parameterized"
security claim in [security.md](security.md) directly verifiable by reading the code.

## No running account balances

`accounts` exist to tag which account a transaction belongs to, but the app does not compute or
store a running balance per account. The emergency fund's "current reserve" is a manually-entered
figure, not derived from an account balance. This was a scope decision: computing accurate
running balances requires either an opening-balance concept per account or trusting that every
historical transaction was entered (including transfers), which the app can't guarantee for a
user who starts using it mid-history. Revisit if account-level reconciliation becomes a real need.

## No authentication

Single-user, locally-run by design. See [security.md](security.md) for what this means if you
deploy it somewhere network-reachable by more than one person.

## No background job scheduler for recurring transactions

`generateDueTransactions()` runs at server startup and when a template is created, catching up
any elapsed occurrences. A cron-style scheduler was considered and rejected: it assumes the
process stays running continuously, which isn't a safe assumption for a personal app that might
be started and stopped on demand. The catch-up approach is correct regardless of uptime.

## Anchor-day preservation in recurring generation

A monthly/yearly recurring template's occurrence date is computed by clamping to the target
month's last day when the original day-of-month doesn't exist (e.g. the 31st in February), but
the *original* day is preserved as an anchor and re-applied every time — so the sequence is
`Jan 31 → Feb 28 → Mar 31`, not `Jan 31 → Feb 28 → Mar 28` (permanent drift). This was a real bug
found during the Phase 10 test-writing pass; see `server/test/recurringEngine.test.js` for the
regression test.

## No client-side state management library

Each page fetches its own data via `useEffect` and keeps it in local state. This is adequate at
the current scale (13 pages, no deeply shared cross-page state). If pages start needing to share
live state (e.g. a global "unsaved changes" indicator, or real-time updates across tabs), that's
the point to introduce something like React Query rather than before.

## No TypeScript

Plain JS/JSX per an explicit standing preference for new projects, not a decision specific to
this app.
