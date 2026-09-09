import { nextOccurrence, formatDate } from "./recurringEngine.js";

export function computeCalendarMonth(db, month) {
  const rows = db
    .prepare(
      `SELECT date, type, amount_minor AS amountMinor
       FROM transactions
       WHERE strftime('%Y-%m', date) = ? AND type != 'TRANSFER'`
    )
    .all(month);

  const byDay = {};
  for (const row of rows) {
    const day = Number(row.date.slice(8, 10));
    if (!byDay[day]) byDay[day] = { incomeMinor: 0, expenseMinor: 0, count: 0 };
    if (row.type === "INCOME") byDay[day].incomeMinor += row.amountMinor;
    else byDay[day].expenseMinor += row.amountMinor;
    byDay[day].count += 1;
  }

  return byDay;
}

export function computeUpcomingObligations(db, windowDays = 45) {
  const templates = db.prepare("SELECT * FROM recurring_templates WHERE status = 'active'").all();
  const today = formatDate(new Date());
  const horizon = formatDate(new Date(Date.now() + windowDays * 86400000));

  const upcoming = [];
  for (const template of templates) {
    const next = nextOccurrence(template, today);
    if (next && next <= horizon) {
      upcoming.push({
        templateId: template.id,
        description: template.description,
        type: template.type,
        amountMinor: template.amount_minor,
        date: next
      });
    }
  }

  return upcoming.sort((a, b) => (a.date < b.date ? -1 : 1));
}
