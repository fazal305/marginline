import { computeExpectedFromRecurring } from "./expectedFromRecurring.js";
import { computeMonthlySeries } from "./monthly.js";

function nextMonth(month) {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(year, m, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function computeCashFlowForecast(db, fromMonth) {
  const target = nextMonth(fromMonth);
  const expected = computeExpectedFromRecurring(db, target);

  const history = computeMonthlySeries(db, 3).filter((m) => m.variableMinor > 0 || m.incomeMinor > 0);
  const avgVariableMinor = history.length
    ? Math.round(history.reduce((sum, m) => sum + m.variableMinor, 0) / history.length)
    : 0;

  const hasAnyBasis = expected.hasIncomeTemplates || expected.hasFixedTemplates || history.length > 0;

  return {
    month: target,
    forecastIncomeMinor: expected.expectedIncomeMinor,
    forecastFixedMinor: expected.expectedFixedMinor,
    forecastVariableMinor: avgVariableMinor,
    forecastMarginMinor: expected.expectedIncomeMinor - expected.expectedFixedMinor - avgVariableMinor,
    basis: {
      incomeFromRecurring: expected.hasIncomeTemplates,
      fixedFromRecurring: expected.hasFixedTemplates,
      variableFromHistoryMonths: history.length
    },
    hasAnyBasis
  };
}
