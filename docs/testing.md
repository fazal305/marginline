# Testing

## Running the suite

```bash
npm test
```

Uses Node's built-in `node:test` runner — no external test framework dependency. Tests live in
`server/test/*.test.js`, one file per service, and run against a real in-memory SQLite database
(`:memory:`) created with the exact same schema production uses (`server/test/helpers/testDb.js`
calls the same `initializeSchema()` function as `server/db.js`).

As of the last run: **77 tests, 17 suites, all passing.**

## What's covered

- **Financial calculations**: income/fixed/variable totals, net margin, margin rate, negative
  margin, zero-income edge cases.
- **Transfers**: explicitly tested as excluded from income, expenses, and transaction counts —
  this is the specific double-counting bug the product brief called out, and it has direct test
  coverage in three separate services.
- **Rounding/precision**: integer minor-unit arithmetic, no floating-point drift.
- **Date boundaries**: first/last day of month inclusion, one-day-outside exclusion, year-boundary
  month arithmetic.
- **Recurring transactions**: catch-up generation, idempotency (a second run on the same date
  doesn't duplicate), paused/future-dated/end-dated templates, and the month-end anchor-day
  behavior (a template starting on the 31st clamps in February, then correctly returns to the
  31st in a longer month rather than drifting).
- **Budget variance**: over/under-budget signs, remaining clamped at zero, month isolation.
- **Debt payoff**: the amortization formula, including edge cases (already paid off, payment too
  small to cover interest, 0% interest).
- **Emergency fund**: division-by-zero guards, progress capped at 100%.
- **CSV import**: row validation with specific error messages, duplicate detection against both
  existing data and within the same import batch, atomic commit (a bad row rolls back the whole
  batch, not a partial import).
- **Spending-leak detection**: percent-increase threshold and the absolute noise floor.

## What's verified manually, not by automated test

- **UI behavior** — every page and interaction was exercised live in the browser during
  development (documented per-phase in the build history), including real bugs found and fixed
  this way: a Vite dev-server stale-cache issue, a timezone bug in month-key generation, a CSS
  color-contrast failure, and a variance-sign/color bug in the Monthly Review page.
- **Responsiveness** — checked at mobile (375px) and desktop widths, confirmed zero horizontal
  overflow.
- **Accessibility** — contrast ratios computed and verified against WCAG AA (4.5:1) in both
  light and dark themes; touch targets measured against the 24px WCAG minimum.
- **Security** — verified by code audit (see [security.md](security.md)), not a scanning tool.

There is no browser-based end-to-end test suite (e.g. Playwright) yet. For a single-user
personal-scale app this was judged not worth the added maintenance burden relative to the manual
verification already performed at each build phase — revisit this if the app grows multi-user or
gains contributors who can't manually re-verify every change.

## Writing a new test

Follow the existing pattern: import `createTestDb` from `server/test/helpers/testDb.js`, seed
whatever rows the scenario needs with `insertTransaction` or raw `db.prepare(...).run(...)`, call
the service function under test, and assert on the result. Keep one behavior per `test()` block
and name it as a sentence describing what would break if the assertion failed — not just what the
function does.
