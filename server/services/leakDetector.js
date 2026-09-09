import { previousMonth } from "./momComparison.js";

const INCREASE_THRESHOLD_PCT = 15;
const MIN_ABSOLUTE_MINOR = 5000;

function categorySpend(db, month) {
  const rows = db
    .prepare(
      `SELECT c.id AS categoryId, c.name AS categoryName, SUM(t.amount_minor) AS totalMinor
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       WHERE t.type = 'EXPENSE' AND strftime('%Y-%m', t.date) = ?
       GROUP BY c.id`
    )
    .all(month);
  return new Map(rows.map((r) => [r.categoryId, { categoryName: r.categoryName, totalMinor: r.totalMinor }]));
}

export function detectSpendingLeaks(db, month) {
  const current = categorySpend(db, month);
  const previous = categorySpend(db, previousMonth(month));

  const leaks = [];

  for (const [categoryId, curr] of current) {
    const prev = previous.get(categoryId);
    if (!prev || prev.totalMinor === 0) continue;
    if (curr.totalMinor < MIN_ABSOLUTE_MINOR) continue;

    const changePct = ((curr.totalMinor - prev.totalMinor) / prev.totalMinor) * 100;

    if (changePct >= INCREASE_THRESHOLD_PCT) {
      leaks.push({
        categoryId,
        categoryName: curr.categoryName,
        changePct,
        currentMinor: curr.totalMinor,
        previousMinor: prev.totalMinor,
        message: `${curr.categoryName} increased ${changePct.toFixed(0)}% this month.`
      });
    }
  }

  return leaks.sort((a, b) => b.changePct - a.changePct);
}
