import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createTestDb, insertTransaction } from "./helpers/testDb.js";
import { computeSummary } from "../services/summary.js";

describe("computeSummary", () => {
  test("zero income and zero transactions yields null margin rate, not a division error", () => {
    const db = createTestDb();
    const result = computeSummary(db);
    assert.equal(result.netIncomeMinor, 0);
    assert.equal(result.netMarginMinor, 0);
    assert.equal(result.marginRate, null);
    assert.equal(result.transactionCount, 0);
  });

  test("splits fixed vs variable expenses correctly", () => {
    const db = createTestDb();
    insertTransaction(db, { type: "INCOME", amountMinor: 200000 });
    insertTransaction(db, { type: "EXPENSE", amountMinor: 60000, isFixed: 1 });
    insertTransaction(db, { type: "EXPENSE", amountMinor: 15000, isFixed: 0 });

    const result = computeSummary(db);
    assert.equal(result.netIncomeMinor, 200000);
    assert.equal(result.fixedExpensesMinor, 60000);
    assert.equal(result.variableExpensesMinor, 15000);
    assert.equal(result.totalExpensesMinor, 75000);
    assert.equal(result.netMarginMinor, 125000);
    assert.equal(result.marginRate, 62.5);
  });

  test("transfers are excluded from income and expense totals entirely", () => {
    const db = createTestDb();
    insertTransaction(db, { type: "INCOME", amountMinor: 100000 });
    insertTransaction(db, { type: "TRANSFER", amountMinor: 500000 });

    const result = computeSummary(db);
    assert.equal(result.netIncomeMinor, 100000, "transfer amount must not be counted as income");
    assert.equal(result.totalExpensesMinor, 0, "transfer amount must not be counted as expense");
    assert.equal(result.transactionCount, 1, "transfer must not be counted in the transaction count");
  });

  test("negative margin (expenses exceed income) is reported, not clamped to zero", () => {
    const db = createTestDb();
    insertTransaction(db, { type: "INCOME", amountMinor: 50000 });
    insertTransaction(db, { type: "EXPENSE", amountMinor: 80000, isFixed: 1 });

    const result = computeSummary(db);
    assert.equal(result.netMarginMinor, -30000);
    assert.equal(result.marginRate, -60);
  });

  test("rounding: amounts stay in integer minor units, no floating point drift", () => {
    const db = createTestDb();
    // 0.1 + 0.2 famously != 0.3 in floating point; verify minor-unit integers avoid this
    insertTransaction(db, { type: "EXPENSE", amountMinor: 10, isFixed: 0 });
    insertTransaction(db, { type: "EXPENSE", amountMinor: 20, isFixed: 0 });
    const result = computeSummary(db);
    assert.equal(result.variableExpensesMinor, 30);
    assert.equal(Number.isInteger(result.variableExpensesMinor), true);
  });
});
