import { DatabaseSync } from "node:sqlite";
import { initializeSchema } from "../../schema.js";

export function createTestDb({ seed = true } = {}) {
  const db = new DatabaseSync(":memory:");
  initializeSchema(db, { seed });
  return db;
}

export function insertTransaction(db, overrides = {}) {
  const defaults = {
    date: "2026-01-01",
    type: "EXPENSE",
    amountMinor: 1000,
    categoryId: null,
    accountId: null,
    isFixed: 0,
    isEssential: 0,
    description: null,
    notes: null
  };
  const row = { ...defaults, ...overrides };

  const result = db
    .prepare(
      `INSERT INTO transactions (date, type, amount_minor, category_id, account_id, is_fixed, is_essential, description, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      row.date,
      row.type,
      row.amountMinor,
      row.categoryId,
      row.accountId,
      row.isFixed ? 1 : 0,
      row.isEssential ? 1 : 0,
      row.description,
      row.notes
    );

  return result.lastInsertRowid;
}

export function getCategoryIdByName(db, name) {
  return db.prepare("SELECT id FROM categories WHERE name = ?").get(name)?.id ?? null;
}
