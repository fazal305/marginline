export function computeSpendingBreakdown(db, limit = 8, month = null) {
  const monthClause = month ? "AND strftime('%Y-%m', t.date) = ?" : "";
  const monthParams = month ? [month] : [];

  const rows = db
    .prepare(
      `SELECT c.id AS categoryId, c.name AS categoryName, SUM(t.amount_minor) AS totalMinor
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       WHERE t.type = 'EXPENSE' ${monthClause}
       GROUP BY c.id
       ORDER BY totalMinor DESC
       LIMIT ?`
    )
    .all(...monthParams, limit);

  const uncategorizedMonthClause = month ? "AND strftime('%Y-%m', date) = ?" : "";
  const uncategorizedRow = db
    .prepare(
      `SELECT SUM(amount_minor) AS totalMinor FROM transactions
       WHERE type = 'EXPENSE' AND category_id IS NULL ${uncategorizedMonthClause}`
    )
    .get(...monthParams);

  const result = rows.map((row) => ({
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    totalMinor: row.totalMinor
  }));

  if (uncategorizedRow.totalMinor) {
    result.push({ categoryId: null, categoryName: "Uncategorized", totalMinor: uncategorizedRow.totalMinor });
  }

  return result.sort((a, b) => b.totalMinor - a.totalMinor);
}
