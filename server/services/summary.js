export function computeSummary(db) {
  const rows = db
    .prepare(`SELECT type, is_fixed AS isFixed, amount_minor AS amountMinor FROM transactions WHERE type != 'TRANSFER'`)
    .all();

  let netIncomeMinor = 0;
  let fixedExpensesMinor = 0;
  let variableExpensesMinor = 0;

  for (const row of rows) {
    if (row.type === "INCOME") {
      netIncomeMinor += row.amountMinor;
    } else if (row.type === "EXPENSE") {
      if (row.isFixed) {
        fixedExpensesMinor += row.amountMinor;
      } else {
        variableExpensesMinor += row.amountMinor;
      }
    }
  }

  const totalExpensesMinor = fixedExpensesMinor + variableExpensesMinor;
  const netMarginMinor = netIncomeMinor - totalExpensesMinor;
  const marginRate = netIncomeMinor > 0 ? (netMarginMinor / netIncomeMinor) * 100 : null;

  return {
    netIncomeMinor,
    fixedExpensesMinor,
    variableExpensesMinor,
    totalExpensesMinor,
    netMarginMinor,
    marginRate,
    transactionCount: rows.length
  };
}
