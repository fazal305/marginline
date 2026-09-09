export function computeBudgetVariance(db, month) {
  const budgets = db
    .prepare(
      `SELECT b.id, b.category_id AS categoryId, c.name AS categoryName, c.kind, b.amount_minor AS budgetMinor
       FROM budgets b
       JOIN categories c ON c.id = b.category_id
       WHERE b.month = ?
       ORDER BY c.name`
    )
    .all(month);

  const actuals = db
    .prepare(
      `SELECT category_id AS categoryId, SUM(amount_minor) AS actualMinor
       FROM transactions
       WHERE type = 'EXPENSE' AND strftime('%Y-%m', date) = ?
       GROUP BY category_id`
    )
    .all(month);

  const actualByCategory = new Map(actuals.map((row) => [row.categoryId, row.actualMinor]));

  return budgets.map((budget) => {
    const actualMinor = actualByCategory.get(budget.categoryId) || 0;
    const varianceMinor = budget.budgetMinor - actualMinor;
    const utilizationPct = budget.budgetMinor > 0 ? (actualMinor / budget.budgetMinor) * 100 : 0;

    return {
      id: budget.id,
      categoryId: budget.categoryId,
      categoryName: budget.categoryName,
      kind: budget.kind,
      budgetMinor: budget.budgetMinor,
      actualMinor,
      remainingMinor: Math.max(0, varianceMinor),
      varianceMinor,
      utilizationPct
    };
  });
}
