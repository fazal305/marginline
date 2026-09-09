# Financial Model

Marginline is built around one idea: your personal financial margin is the prerequisite for
intelligently managing any larger budget.

```
NET INCOME
   − FIXED EXPENSES
   − VARIABLE EXPENSES
   = NET MARGIN
```

## The lifecycle

```
INCOME → FIXED BASELINE → VARIABLE SPENDING → NET MARGIN
   → LIQUIDITY / DEBT / BUFFER → AVAILABLE CAPITAL → PLANNING & DECISIONS
   → LEARNING FROM ACTUALS
```

## Transaction types

- **INCOME** — money entering your usable financial ecosystem (salary, freelance, retainers,
  side income, distributions).
- **EXPENSE** — money leaving, split into two classifications:
  - **Fixed** — structural, recurring baseline costs (rent, utilities, debt minimums, insurance,
    subscriptions).
  - **Variable** — behavioral/operational spending (groceries, transport, dining, entertainment,
    shopping, travel).
- **TRANSFER** — money moving between your own accounts. Transfers are never counted as income
  or expense. This is deliberate and load-bearing: without it, moving money between your own
  accounts would inflate both income and expense totals and silently distort your margin.

Every expense is also tagged **essential** or **discretionary**, independent of fixed/variable —
a subscription is fixed but discretionary; groceries are variable but essential.

## Core metrics

| Metric | Formula |
|---|---|
| Net Income | sum of INCOME transactions |
| Fixed Expenses | sum of EXPENSE transactions where `is_fixed = true` |
| Variable Expenses | sum of EXPENSE transactions where `is_fixed = false` |
| Net Margin | Net Income − Fixed Expenses − Variable Expenses |
| Margin Rate | Net Margin ÷ Net Income × 100, or `null` when income is zero (never divides by zero) |

See [calculations.md](calculations.md) for the exact formulas behind every derived metric, and
[data-model.md](data-model.md) for the schema these are computed from.

## Margin Health

A rules-based (not AI-generated, not personalized advice) read on your current margin:

- **Insufficient Data** — no transactions, or zero income logged yet.
- **Negative** — expenses exceed income.
- **Tight** — margin rate under 10%, or fixed expenses exceed 70% of income.
- **Stable** — margin rate between 10% and 20%.
- **Healthy** — margin rate 20%+ with a reasonable fixed ratio.

Thresholds live in `server/services/marginHealth.js` and are constants, not hardcoded inline —
change them there if your own sense of "tight" differs.

## Financial Operating Order

The logic the app is built around, shown on the Margin Health page as general framework, not
advice tailored to your situation:

1. Protect Liquidity
2. Control High-Cost Debt
3. Stabilize Monthly Margin
4. Build Surplus
5. Make Long-Term Capital Decisions
