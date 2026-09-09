function pad(n) {
  return String(n).padStart(2, "0");
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return { year: y, month: m - 1, day: d };
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function addMonths(dateStr, monthsToAdd, anchorDay) {
  const { year, month, day } = parseDate(dateStr);
  const targetDay = anchorDay ?? day;

  const totalMonths = year * 12 + month + monthsToAdd;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12;

  // Clamp to the target month's last day (e.g. an anchor of the 31st in a
  // 30-day month), but never lose the anchor permanently: the next time the
  // anchor day actually exists in a month, it's used again rather than
  // continuing to drift down from whatever the last clamped value was.
  const clampedDay = Math.min(targetDay, daysInMonth(targetYear, targetMonth));
  return formatDate(new Date(targetYear, targetMonth, clampedDay));
}

export function addInterval(dateStr, frequency, anchorDay = null) {
  const { year, month, day } = parseDate(dateStr);

  switch (frequency) {
    case "weekly": {
      const date = new Date(year, month, day + 7);
      return formatDate(date);
    }
    case "biweekly": {
      const date = new Date(year, month, day + 14);
      return formatDate(date);
    }
    case "monthly":
      return addMonths(dateStr, 1, anchorDay);
    case "yearly":
      return addMonths(dateStr, 12, anchorDay);
    default:
      throw new Error(`Unknown frequency: ${frequency}`);
  }
}

function anchorDayOf(template) {
  return Number(template.start_date.split("-")[2]);
}

export function nextOccurrence(template, afterDate) {
  const anchorDay = anchorDayOf(template);
  let cursor = template.last_generated_date
    ? addInterval(template.last_generated_date, template.frequency, anchorDay)
    : template.start_date;

  while (cursor < afterDate) {
    cursor = addInterval(cursor, template.frequency, anchorDay);
  }

  if (template.end_date && cursor > template.end_date) {
    return null;
  }

  return cursor;
}

export function generateDueTransactions(db, todayStr = formatDate(new Date())) {
  const templates = db
    .prepare("SELECT * FROM recurring_templates WHERE status = 'active' AND start_date <= ?")
    .all(todayStr);

  const insertTx = db.prepare(
    `INSERT INTO transactions
      (date, type, amount_minor, category_id, account_id, is_fixed, is_essential, recurring_template_id, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const updateTemplate = db.prepare(
    "UPDATE recurring_templates SET last_generated_date = ?, updated_at = datetime('now') WHERE id = ?"
  );

  let generatedCount = 0;

  for (const template of templates) {
    const anchorDay = anchorDayOf(template);
    let cursor = template.last_generated_date
      ? addInterval(template.last_generated_date, template.frequency, anchorDay)
      : template.start_date;

    while (cursor <= todayStr && (!template.end_date || cursor <= template.end_date)) {
      insertTx.run(
        cursor,
        template.type,
        template.amount_minor,
        template.category_id,
        template.account_id,
        template.is_fixed,
        template.is_essential,
        template.id,
        template.description
      );
      updateTemplate.run(cursor, template.id);
      generatedCount += 1;
      cursor = addInterval(cursor, template.frequency, anchorDay);
    }
  }

  return generatedCount;
}

export { formatDate };
