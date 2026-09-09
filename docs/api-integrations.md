# API Integrations

## Current state: none

Marginline makes zero third-party API calls. This was a deliberate decision made during initial
research (Phase 0), not an oversight.

## What was evaluated and rejected

| Candidate | Why it was rejected |
|---|---|
| Bank aggregation (Plaid, TrueLayer, etc.) | Requires handing a third party your real bank credentials/read access — directly against the privacy-first design goal. Manual/CSV entry is the correct model for a personal margin tool. |
| Currency/FX APIs (Frankfurter, exchangerate.host) | The app defaults to single-currency use. Not worth a network dependency unless you genuinely hold multi-currency accounts. |
| Receipt/OCR APIs | Adds a cloud dependency for a marginal convenience; manual entry already covers the core loop in seconds. |
| Economic indicator / market data APIs | Out of scope by design — this is a cash-flow tool, not an investment tool (see the financial model's explicit exclusion of investment speculation). |
| Notification/calendar APIs | The in-app Calendar page and upcoming-obligations list cover this without an external dependency. |

## If you want to add one

The one plausible future candidate is a currency/FX API, and only if you actually need
multi-currency support (the schema already has a `currency` column on `transactions`, unused
beyond a default of `PKR`). Before adding any external API, re-run the same evaluation: does it
require sensitive data, is it free, does it have a reasonable rate limit, and — most importantly —
does the app genuinely need it, or would it just be there because "dashboards usually have one"?
