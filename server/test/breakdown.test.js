import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createTestDb, insertTransaction, getCategoryIdByName } from "./helpers/testDb.js";
import { computeSpendingBreakdown } from "../services/breakdown.js";

describe("computeSpendingBreakdown", () => {
  test("groups spend by category and sorts descending", () => {
    const db = createTestDb();
    const groceries = getCategoryIdByName(db, "Groceries");
    const dining = getCategoryIdByName(db, "Dining Out");
    insertTransaction(db, { date: "2026-09-01", type: "EXPENSE", amountMinor: 5000, categoryId: groceries });
    insertTransaction(db, { date: "2026-09-02", type: "EXPENSE", amountMinor: 15000, categoryId: dining });

    const result = computeSpendingBreakdown(db);
    assert.equal(result[0].categoryName, "Dining Out");
    assert.equal(result[1].categoryName, "Groceries");
  });

  test("includes uncategorized expenses as their own bucket", () => {
    const db = createTestDb();
    insertTransaction(db, { date: "2026-09-01", type: "EXPENSE", amountMinor: 3000, categoryId: null });

    const result = computeSpendingBreakdown(db);
    assert.equal(result.length, 1);
    assert.equal(result[0].categoryName, "Uncategorized");
    assert.equal(result[0].totalMinor, 3000);
  });

  test("filters correctly by month when a month is passed", () => {
    const db = createTestDb();
    const groceries = getCategoryIdByName(db, "Groceries");
    insertTransaction(db, { date: "2026-08-01", type: "EXPENSE", amountMinor: 5000, categoryId: groceries });
    insertTransaction(db, { date: "2026-09-01", type: "EXPENSE", amountMinor: 7000, categoryId: groceries });

    const result = computeSpendingBreakdown(db, 8, "2026-09");
    assert.equal(result.length, 1);
    assert.equal(result[0].totalMinor, 7000, "only September's spend should be included");
  });

  test("income and transfers never appear in the spending breakdown", () => {
    const db = createTestDb();
    insertTransaction(db, { date: "2026-09-01", type: "INCOME", amountMinor: 100000 });
    insertTransaction(db, { date: "2026-09-01", type: "TRANSFER", amountMinor: 50000 });

    const result = computeSpendingBreakdown(db);
    assert.equal(result.length, 0);
  });
});
