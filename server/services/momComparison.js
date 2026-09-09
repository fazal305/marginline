import { computeMonthTotals } from "./monthly.js";

function previousMonth(month) {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(year, m - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function pctChange(current, previous) {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export function computeMomComparison(db, month) {
  const current = computeMonthTotals(db, month);
  const previous = computeMonthTotals(db, previousMonth(month));

  return {
    current,
    previous,
    deltas: {
      incomePct: pctChange(current.incomeMinor, previous.incomeMinor),
      fixedPct: pctChange(current.fixedMinor, previous.fixedMinor),
      variablePct: pctChange(current.variableMinor, previous.variableMinor),
      marginPct: pctChange(current.marginMinor, previous.marginMinor)
    }
  };
}

export { previousMonth };
