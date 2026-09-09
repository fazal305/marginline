import { computeMomComparison, previousMonth } from "./momComparison.js";
import { computeExpectedFromRecurring } from "./expectedFromRecurring.js";
import { computeBudgetVariance } from "./budgetVariance.js";
import { computeSpendingBreakdown } from "./breakdown.js";
import { detectSpendingLeaks } from "./leakDetector.js";

const NOTABLE_PCT = 5;

function nextMonth(month) {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(year, m, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function recurringChanges(db, month) {
  const prev = previousMonth(month);

  const currentByTemplate = new Map(
    db
      .prepare(
        `SELECT recurring_template_id AS id, SUM(amount_minor) AS totalMinor, description
         FROM transactions
         WHERE recurring_template_id IS NOT NULL AND strftime('%Y-%m', date) = ?
         GROUP BY recurring_template_id`
      )
      .all(month)
      .map((r) => [r.id, r])
  );

  const previousByTemplate = new Map(
    db
      .prepare(
        `SELECT recurring_template_id AS id, SUM(amount_minor) AS totalMinor
         FROM transactions
         WHERE recurring_template_id IS NOT NULL AND strftime('%Y-%m', date) = ?
         GROUP BY recurring_template_id`
      )
      .all(prev)
      .map((r) => [r.id, r.totalMinor])
  );

  const changes = [];
  for (const [id, curr] of currentByTemplate) {
    const prevTotal = previousByTemplate.get(id);
    if (prevTotal !== undefined && prevTotal !== curr.totalMinor) {
      changes.push({
        description: curr.description,
        previousMinor: prevTotal,
        currentMinor: curr.totalMinor
      });
    }
  }
  return changes;
}

export function computeMonthlyReview(db, month) {
  const mom = computeMomComparison(db, month);
  const expected = computeExpectedFromRecurring(db, month);
  const fixedAndVariableBudgets = computeBudgetVariance(db, month);
  const biggestCategory = computeSpendingBreakdown(db, 1, month)[0] || null;
  const leaks = detectSpendingLeaks(db, month);
  const changes = recurringChanges(db, month);
  const nextMonthExpected = computeExpectedFromRecurring(db, nextMonth(month));

  const improved = [];
  const worsened = [];

  const { deltas } = mom;
  if (deltas.incomePct !== null && deltas.incomePct >= NOTABLE_PCT) improved.push(`Income up ${deltas.incomePct.toFixed(0)}%`);
  if (deltas.incomePct !== null && deltas.incomePct <= -NOTABLE_PCT) worsened.push(`Income down ${Math.abs(deltas.incomePct).toFixed(0)}%`);
  if (deltas.fixedPct !== null && deltas.fixedPct <= -NOTABLE_PCT) improved.push(`Fixed spending down ${Math.abs(deltas.fixedPct).toFixed(0)}%`);
  if (deltas.fixedPct !== null && deltas.fixedPct >= NOTABLE_PCT) worsened.push(`Fixed spending up ${deltas.fixedPct.toFixed(0)}%`);
  if (deltas.variablePct !== null && deltas.variablePct <= -NOTABLE_PCT) improved.push(`Variable spending down ${Math.abs(deltas.variablePct).toFixed(0)}%`);
  if (deltas.variablePct !== null && deltas.variablePct >= NOTABLE_PCT) worsened.push(`Variable spending up ${deltas.variablePct.toFixed(0)}%`);
  if (deltas.marginPct !== null && deltas.marginPct >= NOTABLE_PCT) improved.push(`Margin up ${deltas.marginPct.toFixed(0)}%`);
  if (deltas.marginPct !== null && deltas.marginPct <= -NOTABLE_PCT) worsened.push(`Margin down ${Math.abs(deltas.marginPct).toFixed(0)}%`);

  const fixedBudgetMinor = fixedAndVariableBudgets
    .filter((b) => b.kind === "fixed")
    .reduce((sum, b) => sum + b.budgetMinor, 0);
  const variableBudgetMinor = fixedAndVariableBudgets
    .filter((b) => b.kind === "variable")
    .reduce((sum, b) => sum + b.budgetMinor, 0);
  const hasFixedBudget = fixedAndVariableBudgets.some((b) => b.kind === "fixed");
  const hasVariableBudget = fixedAndVariableBudgets.some((b) => b.kind === "variable");

  const expectedMarginMinor =
    expected.hasIncomeTemplates && (hasFixedBudget || hasVariableBudget)
      ? expected.expectedIncomeMinor - fixedBudgetMinor - variableBudgetMinor
      : null;

  const biggestVariance = fixedAndVariableBudgets.length
    ? fixedAndVariableBudgets.reduce((max, b) => (Math.abs(b.varianceMinor) > Math.abs(max.varianceMinor) ? b : max))
    : null;

  let marginTrend = "INSUFFICIENT_DATA";
  if (mom.current.incomeMinor > 0 || mom.previous.incomeMinor > 0) {
    if (mom.current.marginMinor < 0) marginTrend = "NEGATIVE";
    else if (deltas.marginPct === null) marginTrend = "STABLE";
    else if (deltas.marginPct >= NOTABLE_PCT) marginTrend = "EXPANDING";
    else if (deltas.marginPct <= -NOTABLE_PCT) marginTrend = "COMPRESSING";
    else marginTrend = "STABLE";
  }

  return {
    month,
    income: {
      expectedMinor: expected.expectedIncomeMinor,
      actualMinor: mom.current.incomeMinor,
      hasExpected: expected.hasIncomeTemplates
    },
    fixed: {
      budgetMinor: fixedBudgetMinor,
      actualMinor: mom.current.fixedMinor,
      hasBudget: hasFixedBudget
    },
    variable: {
      budgetMinor: variableBudgetMinor,
      actualMinor: mom.current.variableMinor,
      previousMinor: mom.previous.variableMinor,
      hasBudget: hasVariableBudget
    },
    margin: {
      expectedMinor: expectedMarginMinor,
      actualMinor: mom.current.marginMinor,
      previousMinor: mom.previous.marginMinor,
      trend: marginTrend
    },
    whatImproved: improved,
    whatWorsened: worsened,
    biggestVariance,
    biggestCategory,
    leaks,
    recurringChanges: changes,
    nextMonthWatchlist: {
      month: nextMonth(month),
      expectedFixedMinor: nextMonthExpected.expectedFixedMinor,
      expectedIncomeMinor: nextMonthExpected.expectedIncomeMinor,
      overBudgetCategories: fixedAndVariableBudgets.filter((b) => b.utilizationPct >= 90)
    }
  };
}
