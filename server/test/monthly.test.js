import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createTestDb, insertTransaction } from "./helpers/testDb.js";
import { computeMonthTotals, computeAverageMonthlyFixed } from "../services/monthly.js";

describe("computeMonthTotals date boundaries", () => {
  test("a transaction on the first day of the month is included", () => {
    const db = createTestDb();
    insertTransaction(db, { date: "2026-03-01", type: "INCOME", amountMinor: 1000 });
    const result = computeMonthTotals(db, "2026-03");
    assert.equal(result.incomeMinor, 1000);
  });

  test("a transaction on the last day of the month is included", () => {
    const db = createTestDb();
    insertTransaction(db, { date: "2026-03-31", type: "INCOME", amountMinor: 1000 });
    const result = computeMonthTotals(db, "2026-03");
    assert.equal(result.incomeMinor, 1000);
  });

  test("a transaction one day before the month starts is excluded", () => {
    const db = createTestDb();
    insertTransaction(db, { date: "2026-02-28", type: "INCOME", amountMinor: 1000 });
    const result = computeMonthTotals(db, "2026-03");
    assert.equal(result.incomeMinor, 0);
  });

  test("a transaction one day after the month ends is excluded", () => {
    const db = createTestDb();
    insertTransaction(db, { date: "2026-04-01", type: "INCOME", amountMinor: 1000 });
    const result = computeMonthTotals(db, "2026-03");
    assert.equal(result.incomeMinor, 0);
  });

  test("transfers are excluded from month totals", () => {
    const db = createTestDb();
    insertTransaction(db, { date: "2026-03-15", type: "TRANSFER", amountMinor: 50000 });
    const result = computeMonthTotals(db, "2026-03");
    assert.equal(result.incomeMinor, 0);
    assert.equal(result.fixedMinor, 0);
    assert.equal(result.variableMinor, 0);
  });

  test("marginRate is null when income is zero for the month", () => {
    const db = createTestDb();
    insertTransaction(db, { date: "2026-03-15", type: "EXPENSE", amountMinor: 5000, isFixed: 1 });
    const result = computeMonthTotals(db, "2026-03");
    assert.equal(result.marginRate, null);
  });
});

describe("computeAverageMonthlyFixed", () => {
  test("returns 0 when there is no history at all", () => {
    const db = createTestDb();
    assert.equal(computeAverageMonthlyFixed(db), 0);
  });

  test("averages only months that actually have activity, not the full window", () => {
    const db = createTestDb();
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-15`;
    // Only the current month has data; the prior two months in the 3-month window are empty
    insertTransaction(db, { date: thisMonth, type: "EXPENSE", amountMinor: 9000, isFixed: 1 });
    const avg = computeAverageMonthlyFixed(db, 3);
    assert.equal(avg, 9000, "average should be based on the one active month, not divided by 3 empty months");
  });
});
