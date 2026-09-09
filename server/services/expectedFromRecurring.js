import { addInterval } from "./recurringEngine.js";

const MAX_ITERATIONS = 1000;

function occurrencesInMonth(template, month) {
  const monthStart = `${month}-01`;
  const [year, m] = month.split("-").map(Number);
  const monthEnd = `${month}-${String(new Date(year, m, 0).getDate()).padStart(2, "0")}`;

  let cursor = template.start_date;
  let count = 0;
  let iterations = 0;

  while (cursor <= monthEnd && iterations < MAX_ITERATIONS) {
    if (template.end_date && cursor > template.end_date) break;
    if (cursor >= monthStart) count += 1;
    cursor = addInterval(cursor, template.frequency);
    iterations += 1;
  }

  return count;
}

export function computeExpectedFromRecurring(db, month) {
  const templates = db.prepare("SELECT * FROM recurring_templates WHERE status = 'active'").all();

  let expectedIncomeMinor = 0;
  let expectedFixedMinor = 0;
  let hasIncomeTemplates = false;
  let hasFixedTemplates = false;

  for (const template of templates) {
    const occurrences = occurrencesInMonth(template, month);
    if (occurrences === 0) continue;

    if (template.type === "INCOME") {
      expectedIncomeMinor += template.amount_minor * occurrences;
      hasIncomeTemplates = true;
    } else if (template.type === "EXPENSE" && template.is_fixed) {
      expectedFixedMinor += template.amount_minor * occurrences;
      hasFixedTemplates = true;
    }
  }

  return { expectedIncomeMinor, expectedFixedMinor, hasIncomeTemplates, hasFixedTemplates };
}
