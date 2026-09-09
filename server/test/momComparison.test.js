import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createTestDb, insertTransaction } from "./helpers/testDb.js";
import { computeMomComparison, previousMonth } from "../services/momComparison.js";

describe("previousMonth", () => {
  test("crosses a year boundary correctly (January -> December of prior year)", () => {
    assert.equal(previousMonth("2026-01"), "2025-12");
  });

  test("normal mid-year case", () => {
    assert.equal(previousMonth("2026-09"), "2026-08");
  });
});

describe("computeMomComparison", () => {
  test("percent change is null (not Infinity or NaN) when the previous month was zero and current is nonzero", () => {
    const db = createTestDb();
    insertTransaction(db, { date: "2026-09-05", type: "INCOME", amountMinor: 100000 });
    const result = computeMomComparison(db, "2026-09");
    assert.equal(result.previous.incomeMinor, 0);
    assert.equal(result.deltas.incomePct, null);
  });

  test("percent change is 0 when both months are zero, not null or NaN", () => {
    const db = createTestDb();
    const result = computeMomComparison(db, "2026-09");
    assert.equal(result.deltas.incomePct, 0);
  });

  test("computes a correct positive percent increase", () => {
    const db = createTestDb();
    insertTransaction(db, { date: "2026-08-05", type: "INCOME", amountMinor: 100000 });
    insertTransaction(db, { date: "2026-09-05", type: "INCOME", amountMinor: 150000 });
    const result = computeMomComparison(db, "2026-09");
    assert.equal(result.deltas.incomePct, 50);
  });
});
