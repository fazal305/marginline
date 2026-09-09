# Security

## SQL injection

Every database query in the codebase uses parameterized prepared statements (`?` placeholders
bound via `.run()`/`.get()`/`.all()`). There is no string interpolation of user input into SQL
anywhere — verified by grepping the entire `server/` tree for template-literal SQL construction
(see Phase 9 audit notes). Even the dynamically-built filter clauses in
`server/routes/transactions.js` build static `"column = ?"` fragments and pass values separately.

## XSS

The frontend is plain React with no `dangerouslySetInnerHTML` anywhere in the codebase. All
user-entered text (descriptions, notes, category names) goes through React's default JSX
escaping, which HTML-encodes it automatically.

## Secrets

- No API keys, tokens, or credentials are hardcoded anywhere in the codebase (verified by grep
  before each phase's completion).
- `.env` is gitignored; `.env.example` documents every variable without real values.
- The only environment variables the app uses are `PORT`, `CLIENT_ORIGIN`, `DB_PATH`, and
  `DEMO_MODE` — none of them secrets.
- No third-party API integration means no third-party API key to protect (see
  [api-integrations.md](api-integrations.md)).

## Logging

The application logs exactly one line on startup (`Server running on port ${PORT}`). No
transaction data, no personal information, and no request bodies are ever logged.

## Input validation

Every mutating route validates its input server-side before touching the database — not just in
the UI. Amounts must be positive numbers, dates must match `YYYY-MM-DD`, types are checked
against an explicit allow-list, and category/account references are verified to exist before a
transaction is created. CSV import runs the same validation per row and reports errors without
writing anything until you explicitly confirm.

## Dependencies

`npm audit` reports zero known vulnerabilities as of the last dependency install. The dependency
list is deliberately small — see [architecture.md](architecture.md) for why `node:sqlite` was
chosen over an npm package that would have needed native compilation.

## What's not implemented (and why that's an open item, not an oversight)

There is currently no authentication layer. Marginline is designed as a single-user, locally-run
application — the "user" is whoever has access to the machine or server it's running on. If you
deploy it somewhere multiple people can reach over the network, you are responsible for putting
access control (e.g. a reverse proxy with auth) in front of it; the application itself does not
gate access. This is a deliberate scope boundary, not a bug — see
[decisions.md](decisions.md) for a note on when this should change.
