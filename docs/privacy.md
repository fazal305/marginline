# Privacy

## What data this app collects

Only what you type in: transactions, categories, budgets, recurring templates, debts, and your
emergency fund settings. There is no telemetry, no analytics, no crash reporting, and no
usage tracking of any kind.

## Where your data lives

A single SQLite file on disk (`data/marginline.db` by default, configurable via `DB_PATH`). If
you run Marginline locally, your financial data never leaves your machine. If you deploy it to a
server you control (e.g. Render), it lives on that server's disk, under your account, and is
not sent anywhere else by the application.

## What leaves the application

Nothing, by default. Marginline makes zero third-party network calls in normal operation — no
analytics SDK, no error-reporting service, no external API for currency rates or anything else
(see [api-integrations.md](api-integrations.md) for why none were added). The only network
traffic the app generates is between your browser and your own backend.

## AI

There is currently no AI feature in this build. If one is added later, it will only ever run on
data you explicitly send it (e.g. "summarize this month" on demand), never automatically, and
never as a background process reading your ledger without your action.

## Demo Mode

When `DEMO_MODE=true`, the app seeds clearly fictional data (`server/demoSeed.js`) and shows a
persistent on-screen banner. Demo Mode is intended for a public-facing deployment you want
reviewers to explore without touching real data — never enable it against a database that holds,
or will hold, your actual finances.

## Data portability

You can export everything at any time: `Transactions → CSV` for the ledger, or a full JSON
backup covering every table (transactions, categories, budgets, recurring templates, debts,
emergency fund settings) via Import/Export. There's no lock-in — the export formats are plain
CSV/JSON, not a proprietary format.

## Deleting your data

Since everything lives in one SQLite file, deleting your data means deleting that file (or the
individual records via the UI, which issues real `DELETE` statements — nothing is soft-deleted
or retained after you remove it).
