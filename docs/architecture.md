# Architecture

## Stack

- **Frontend**: React (plain JS/JSX, no TypeScript) + Vite + React Router. No component library —
  hand-built design system (`src/styles/tokens.css`).
- **Backend**: Node.js + Express.
- **Storage**: SQLite via Node's built-in `node:sqlite` module. No native compilation step (this
  is why `better-sqlite3` was rejected — see [decisions.md](decisions.md)), no cloud database.
- **Testing**: Node's built-in `node:test` runner. No external test framework dependency.

## Why this stack

The product brief called for a privacy-first, local-first personal finance tool. A cloud database
(the original MongoDB Atlas the project started with) is a poor default for that: it's a third
party with access to your real transaction history, requires network access to function, and
needs credential management. SQLite removes all of that — your data lives in one file you control.

## Directory structure

```
marginline/
  server/
    index.js              Express app entry, route wiring, startup tasks
    db.js                  Opens the production database file
    schema.js               Table definitions + default category/account seeding (shared with tests)
    demoSeed.js              Fictional data for DEMO_MODE
    routes/                 One file per resource, thin — validation + calling services
    services/                Pure calculation/business logic, no HTTP concerns
    test/                   node:test suite, mirrors services/
      helpers/testDb.js       In-memory SQLite fixture using the real schema
  src/
    main.jsx, App.jsx        Entry point, route table
    api/client.js            Single fetch wrapper, one method per endpoint
    components/              Shared UI: AppShell (nav + demo banner), MetricCard, charts, forms
    pages/                   One file per screen, matches the route table
    styles/                  Design tokens (colors/spacing/type) + global resets
  docs/                     This directory
  data/                     SQLite file lives here (gitignored)
```

## Request flow

```
Browser → Vite dev server (proxies /api to Express in dev)
        → Express route (server/routes/*.js) — validates input, calls a service
        → service (server/services/*.js) — pure function, talks to SQLite via prepared statements
        → route serializes the result to JSON
```

In production, `npm run build` outputs `dist/`, which Express serves as static files alongside
the same API — one process, one deployable.

## Why services are separated from routes

Every route handler is a thin wrapper: validate the request, call a service function, return
JSON. The service functions themselves take a `db` handle and plain arguments, return plain
objects, and have no knowledge of Express. This is what makes them testable without spinning up
an HTTP server — `server/test/*.test.js` calls services directly against an in-memory database.

## Recurring transaction generation

There's no background job scheduler. `generateDueTransactions(db)` runs once at server startup
and again whenever a recurring template is created — it catches up any occurrences between a
template's `last_generated_date` and "today." For a personal-use, likely-not-always-running app,
this is simpler and more honest than a cron job that assumes the process stays alive.

## Frontend state

No global state library (Redux/Zustand/etc.). Each page fetches what it needs on mount via
`useEffect` + the shared `api` client, keeps it in local `useState`, and re-fetches after
mutations. This is enough for the current scale; see [decisions.md](decisions.md) for when that
might stop being true.
