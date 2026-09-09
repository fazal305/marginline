import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createTestDb, insertTransaction, getCategoryIdByName } from "./helpers/testDb.js";
import { computeBudgetVariance } from "../services/budgetVariance.js";

describe("computeBudgetVariance", () => {
  test("under-budget yields positive variance and remaining amount", () => {
    const db = createTestDb();
    const groceries = getCategoryIdByName(db, "Groceries");
    db.prepare("INSERT INTO budgets (category_id, month, amount_minor) VALUES (?, ?, ?)").run(groceries, "2026-09", 30000);
    insertTransaction(db, { date: "2026-09-05", type: "EXPENSE", amountMinor: 20000, categoryId: groceries });

    const [row] = computeBudgetVariance(db, "2026-09");
    assert.equal(row.actualMinor, 20000);
    assert.equal(row.varianceMinor, 10000);
    assert.equal(row.remainingMinor, 10000);
    assert.ok(Math.abs(row.utilizationPct - 66.6667) < 0.01);
  });

  test("over-budget yields negative variance, remaining clamped to zero (not negative)", () => {
    const db = createTestDb();
    const groceries = getCategoryIdByName(db, "Groceries");
    db.prepare("INSERT INTO budgets (category_id, month, amount_minor) VALUES (?, ?, ?)").run(groceries, "2026-09", 10000);
    insertTransaction(db, { date: "2026-09-05", type: "EXPENSE", amountMinor: 15000, categoryId: groceries });

    const [row] = computeBudgetVariance(db, "2026-09");
    assert.equal(row.varianceMinor, -5000);
    assert.equal(row.remainingMinor, 0, "remaining must never go negative even when over budget");
    assert.equal(row.utilizationPct, 150);
  });

  test("a category with a budget but no spend this month reports zero actual, not an error", () => {
    const db = createTestDb();
    const groceries = getCategoryIdByName(db, "Groceries");
    db.prepare("INSERT INTO budgets (category_id, month, amount_minor) VALUES (?, ?, ?)").run(groceries, "2026-09", 10000);

    const [row] = computeBudgetVariance(db, "2026-09");
    assert.equal(row.actualMinor, 0);
    assert.equal(row.utilizationPct, 0);
  });

  test("only returns budgets for the requested month", () => {
    const db = createTestDb();
    const groceries = getCategoryIdByName(db, "Groceries");
    db.prepare("INSERT INTO budgets (category_id, month, amount_minor) VALUES (?, ?, ?)").run(groceries, "2026-08", 10000);

    const rows = computeBudgetVariance(db, "2026-09");
    assert.equal(rows.length, 0);
  });
});
