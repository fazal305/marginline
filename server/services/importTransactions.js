const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const VALID_TYPES = ["INCOME", "EXPENSE", "TRANSFER"];

function toBool(value) {
  if (typeof value === "boolean") return value;
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

export function validateImportRows(rows, db) {
  const categories = db.prepare("SELECT id, name FROM categories").all();
  const categoryByName = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

  const existing = db
    .prepare("SELECT date, type, amount_minor AS amountMinor, description FROM transactions")
    .all();
  const existingKeys = new Set(
    existing.map((t) => `${t.date}|${t.type}|${t.amountMinor}|${(t.description || "").toLowerCase()}`)
  );

  const valid = [];
  const errors = [];
  const duplicates = [];
  const seenInBatch = new Set();

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // account for header row
    const date = row.date?.trim();
    const type = row.type?.trim().toUpperCase();
    const amountRaw = row.amount?.trim();
    const description = row.description?.trim() || null;
    const categoryName = row.category?.trim();

    const rowErrors = [];

    if (!date || !DATE_RE.test(date)) rowErrors.push("date must be YYYY-MM-DD");
    if (!VALID_TYPES.includes(type)) rowErrors.push("type must be INCOME, EXPENSE, or TRANSFER");

    const amountMinor = Math.round(Number(amountRaw) * 100);
    if (!Number.isFinite(amountMinor) || amountMinor <= 0) rowErrors.push("amount must be a positive number");

    let categoryId = null;
    if (categoryName) {
      categoryId = categoryByName.get(categoryName.toLowerCase()) ?? null;
      if (categoryId === null) rowErrors.push(`unknown category "${categoryName}"`);
    }

    if (rowErrors.length > 0) {
      errors.push({ row: rowNumber, data: row, errors: rowErrors });
      return;
    }

    const key = `${date}|${type}|${amountMinor}|${(description || "").toLowerCase()}`;

    if (existingKeys.has(key) || seenInBatch.has(key)) {
      duplicates.push({ row: rowNumber, date, type, amountMinor, description });
      return;
    }

    seenInBatch.add(key);
    valid.push({
      row: rowNumber,
      date,
      type,
      amountMinor,
      categoryId,
      isFixed: toBool(row.isFixed),
      isEssential: toBool(row.isEssential),
      description,
      notes: row.notes?.trim() || null
    });
  });

  return { valid, errors, duplicates };
}

export function commitImportRows(db, rows) {
  const insert = db.prepare(
    `INSERT INTO transactions
      (date, type, amount_minor, category_id, is_fixed, is_essential, description, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  db.exec("BEGIN");
  try {
    for (const row of rows) {
      insert.run(
        row.date,
        row.type,
        row.amountMinor,
        row.categoryId,
        row.isFixed ? 1 : 0,
        row.isEssential ? 1 : 0,
        row.description,
        row.notes
      );
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return rows.length;
}
