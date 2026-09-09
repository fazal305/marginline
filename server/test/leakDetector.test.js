import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createTestDb, insertTransaction, getCategoryIdByName } from "./helpers/testDb.js";
import { detectSpendingLeaks } from "../services/leakDetector.js";

describe("detectSpendingLeaks", () => {
  test("flags a category that increased 60% month over month", () => {
    const db = createTestDb();
    const groceries = getCategoryIdByName(db, "Groceries");
    insertTransaction(db, { date: "2026-08-10", type: "EXPENSE", amountMinor: 10000, categoryId: groceries });
    insertTransaction(db, { date: "2026-09-10", type: "EXPENSE", amountMinor: 16000, categoryId: groceries });

    const leaks = detectSpendingLeaks(db, "2026-09");
    assert.equal(leaks.length, 1);
    assert.equal(leaks[0].categoryName, "Groceries");
    assert.equal(leaks[0].changePct, 60);
  });

  test("does not flag a category below the 15% increase threshold", () => {
    const db = createTestDb();
    const groceries = getCategoryIdByName(db, "Groceries");
    insertTransaction(db, { date: "2026-08-10", type: "EXPENSE", amountMinor: 10000, categoryId: groceries });
    insertTransaction(db, { date: "2026-09-10", type: "EXPENSE", amountMinor: 11000, categoryId: groceries });

    const leaks = detectSpendingLeaks(db, "2026-09");
    assert.equal(leaks.length, 0);
  });

  test("does not flag a category with no prior-month spend (nothing to compare against)", () => {
    const db = createTestDb();
    const groceries = getCategoryIdByName(db, "Groceries");
    insertTransaction(db, { date: "2026-09-10", type: "EXPENSE", amountMinor: 50000, categoryId: groceries });

    const leaks = detectSpendingLeaks(db, "2026-09");
    assert.equal(leaks.length, 0, "a category with zero prior spend has no percent baseline to compare against");
  });

  test("does not flag tiny amounts even at a huge percent increase (noise floor)", () => {
    const db = createTestDb();
    const dining = getCategoryIdByName(db, "Dining Out");
    insertTransaction(db, { date: "2026-08-10", type: "EXPENSE", amountMinor: 10, categoryId: dining });
    insertTransaction(db, { date: "2026-09-10", type: "EXPENSE", amountMinor: 100, categoryId: dining });

    const leaks = detectSpendingLeaks(db, "2026-09");
    assert.equal(leaks.length, 0, "a jump from Rs 0.10 to Rs 1.00 should not be reported as a spending leak");
  });
});
