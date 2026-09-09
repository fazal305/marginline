# Marginline

A personal cash-flow and financial margin management system: know what comes in, what has to go
out, what you choose to spend, and what's actually left.

Marginline is not a generic expense tracker. It's built around one core idea — your personal
financial margin (income minus fixed costs minus variable spending) is the number that matters
before any budgeting concept can be applied usefully to anything bigger.

## Why this exists

Most expense trackers stop at "here's what you spent." Marginline is built around a specific
sequence instead:

```
WHAT CAME IN?
   → WHAT HAD TO GO OUT?
      → WHAT DID I CHOOSE TO SPEND?
         → WHAT IS LEFT?
            → IS MY MARGIN EXPANDING OR SHRINKING?
               → IS MY FOUNDATION PROTECTED?
                  → WHAT SHOULD I WATCH NEXT MONTH?
```

Every feature in this app exists to answer one of those questions with real numbers computed
directly from your transaction ledger — never estimated, never fabricated.

## Core Financial Model

```
NET INCOME
   − FIXED EXPENSES     (rent, utilities, debt minimums, insurance, subscriptions)
   − VARIABLE EXPENSES  (groceries, transport, dining, entertainment, shopping)
   = NET MARGIN
```

Transfers between your own accounts are tracked as a distinct transaction type and are never
counted as income or expense — this prevents double-counting money that never actually left your
financial ecosystem. Full formulas: [docs/calculations.md](docs/calculations.md).

## Features

- **Dashboard** — the five core metrics, a 6-month cash-flow chart, spending breakdown, and a
  rules-based Margin Health read (Healthy / Stable / Tight / Negative / Insufficient Data)
- **Transaction ledger** — fast quick-add, full CRUD, search/filter/sort, category auto-fill
- **Categories** — fixed/variable and essential/discretionary classification
- **Recurring transactions** — auto-generated on schedule (weekly/biweekly/monthly/yearly), with
  correct month-end anchor-day handling (a template starting on the 31st doesn't drift)
- **Financial Calendar** — daily activity grid plus a 45-day upcoming-obligations list
- **Budgets** — per-category monthly limits with budget-vs-actual variance
- **Emergency Fund** — target based on your real average fixed baseline, not a guess
- **Debt tracking** — balances, interest, and a real fixed-payment amortization payoff estimate
- **Reports** — month-over-month comparison, spending-leak detection (data-backed only, never
  fabricated), and a clearly-labeled cash-flow forecast
- **Monthly Review** — one screen: what improved, what worsened, biggest variance, biggest
  category, recurring changes, margin trend, next month's watchlist
- **Import/Export** — CSV import with per-row validation, duplicate prevention, and a mandatory
  preview before anything is written; CSV export of the ledger; full JSON backup of everything
- **Demo Mode** — a public deployment can show fictional sample data with a persistent on-screen
  banner, so a reviewer never sees a blank app or your real data

## Screenshots / Demo

No hosted public demo link is published in this README (deployment status changes; check the
repo's actual live links if any are current). To see the app with realistic data yourself:

```bash
DEMO_MODE=true npm run build && DEMO_MODE=true npm start
```

This seeds clearly-fictional sample data (only if the database is currently empty) and shows a
"DEMO MODE" banner. Never set `DEMO_MODE=true` against a database that holds your real data.

## Tech Stack

**Frontend**: React (plain JS/JSX, no TypeScript) · Vite · React Router
**Backend**: Node.js + Express
**Storage**: SQLite via Node's built-in `node:sqlite` module — no native compilation, no cloud
database
**Testing**: Node's built-in `node:test` runner — 77 tests, zero external test framework

Storage is local-first by design: your transaction data lives in a SQLite file on disk, not in a
third-party cloud database. Monetary amounts are stored as integer minor units (paisa/cents) to
avoid floating-point rounding errors. Full rationale: [docs/decisions.md](docs/decisions.md).

## Architecture

See [docs/architecture.md](docs/architecture.md) for the full breakdown. Short version:

```
Browser → Express routes (validate + delegate) → services (pure functions, no HTTP knowledge)
        → SQLite via parameterized prepared statements
```

## Getting Started

Clone the repository:

```bash
git clone https://github.com/fazal305/marginline.git
cd marginline
```

Install dependencies:

```bash
npm install
```

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Run the app in development (starts the API on port 5000 and the Vite dev server on port 5227,
with `/api` proxied through):

```bash
npm run dev
```

Or build for production and run the single deployable:

```bash
npm run build
npm start
```

Run the test suite:

```bash
npm test
```

## Environment Variables

```
PORT            Express server port (default 5000)
CLIENT_ORIGIN   Allowed CORS origin (default *)
DB_PATH         Path to the SQLite file (default ./data/marginline.db)
DEMO_MODE       "true" to seed fictional demo data + show the demo banner (default false)
```

No API keys or third-party credentials are required — the application has zero external network
dependencies by default. See [docs/api-integrations.md](docs/api-integrations.md) for what was
evaluated and why nothing was added.

## Data Model

Full schema: [docs/data-model.md](docs/data-model.md). Eight tables: `transactions`,
`categories`, `accounts`, `budgets`, `recurring_templates`, `emergency_fund`, `debts` — no ORM,
plain SQL, every query parameterized.

## Financial Calculations

Every formula the app uses, with the exact source file it lives in:
[docs/calculations.md](docs/calculations.md).

## Privacy

- All financial data is stored locally in a SQLite file you control.
- No transaction data is sent to any third-party service — zero external network calls in normal
  operation.
- No AI feature currently exists in this build; if one is added, it will only run on data you
  explicitly send it, never automatically.

Full detail: [docs/privacy.md](docs/privacy.md).

## Security

- Every SQL query is parameterized — no string interpolation into SQL anywhere in the codebase.
- No `dangerouslySetInnerHTML` — all user text goes through React's default escaping.
- No hardcoded secrets; `.env` is gitignored.
- Exactly one `console.log` in the entire backend (the startup port message) — no transaction
  data is ever logged.
- No authentication layer (this is a single-user, locally-run app by design — see
  [docs/security.md](docs/security.md) for what that means if you deploy it network-reachable to
  more than one person).

## Accessibility

- Semantic landmark structure (`nav`, `main`, headings), skip-to-content link
- Visible focus states on every interactive control
- Contrast ratios verified against WCAG AA (4.5:1) in both light and dark themes — a real
  contrast failure was found and fixed during the Phase 9 audit, not just assumed compliant
- Touch targets measured against the 24px WCAG minimum
- `prefers-reduced-motion` respected
- Color is never the sole indicator of financial status (every colored figure has a sign, label,
  or adjacent text alongside it)

## Testing

```bash
npm test
```

77 tests covering financial calculations, transfers-excluded-from-totals, date boundaries,
recurring-transaction generation (including a real month-end anchor-day bug found and fixed
during test-writing), budget variance, debt payoff amortization, and CSV import validation with
duplicate prevention. Full coverage notes: [docs/testing.md](docs/testing.md).

## Import / Export

- **CSV export** — your full transaction ledger, human-readable, re-importable
- **JSON export** — a complete backup: transactions, categories, budgets, recurring templates,
  debts, emergency fund settings
- **CSV import** — validates every row before anything is written, shows specific per-row errors,
  detects duplicates (against existing data and within the same import batch), and requires
  explicit confirmation after a preview — nothing is written silently

## Known Limitations

- No account-level running balances (see [docs/decisions.md](docs/decisions.md) for why)
- No authentication — single-user, locally-run by design
- No end-to-end browser test suite; UI correctness was verified manually and live during
  development rather than by an automated E2E tool (see [docs/testing.md](docs/testing.md))
- Single-currency by default; the schema supports a `currency` field per transaction but no
  multi-currency conversion exists

## Roadmap

An optional AI layer (transaction categorization assistance, monthly summary drafting) was
scoped but not built — it would only ship if it earns a concrete job beyond "dashboards usually
have one." Everything else from the original product brief (Phases 1–10: transaction engine,
dashboard, budgeting, recurring transactions, calendar, emergency fund, debt tracking, analytics,
monthly review, import/export, and a full test suite) is implemented.

## Documentation

- [docs/architecture.md](docs/architecture.md)
- [docs/financial-model.md](docs/financial-model.md)
- [docs/data-model.md](docs/data-model.md)
- [docs/calculations.md](docs/calculations.md)
- [docs/privacy.md](docs/privacy.md)
- [docs/security.md](docs/security.md)
- [docs/api-integrations.md](docs/api-integrations.md)
- [docs/testing.md](docs/testing.md)
- [docs/decisions.md](docs/decisions.md)

## License

MIT — see [LICENSE](LICENSE).
