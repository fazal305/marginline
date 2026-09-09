import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { computeMarginHealth } from "../services/marginHealth.js";

function summary(overrides) {
  return {
    netIncomeMinor: 0,
    fixedExpensesMinor: 0,
    variableExpensesMinor: 0,
    netMarginMinor: 0,
    marginRate: null,
    transactionCount: 0,
    ...overrides
  };
}

describe("computeMarginHealth", () => {
  test("no transactions yields INSUFFICIENT_DATA, not a crash on null marginRate", () => {
    const result = computeMarginHealth(summary({}));
    assert.equal(result.status, "INSUFFICIENT_DATA");
  });

  test("zero income with transactions present still yields INSUFFICIENT_DATA (division-by-zero guard)", () => {
    const result = computeMarginHealth(
      summary({ transactionCount: 2, netIncomeMinor: 0, netMarginMinor: 0, marginRate: null })
    );
    assert.equal(result.status, "INSUFFICIENT_DATA");
  });

  test("negative margin is always NEGATIVE regardless of margin rate", () => {
    const result = computeMarginHealth(
      summary({
        transactionCount: 5,
        netIncomeMinor: 100000,
        netMarginMinor: -5000,
        marginRate: -5,
        fixedExpensesMinor: 50000
      })
    );
    assert.equal(result.status, "NEGATIVE");
  });

  test("high fixed-to-income ratio is TIGHT even if margin rate looks acceptable", () => {
    const result = computeMarginHealth(
      summary({
        transactionCount: 5,
        netIncomeMinor: 100000,
        netMarginMinor: 15000,
        marginRate: 15,
        fixedExpensesMinor: 75000
      })
    );
    assert.equal(result.status, "TIGHT");
    assert.equal(result.fixedRatio, 0.75);
  });

  test("healthy margin rate with reasonable fixed ratio is HEALTHY", () => {
    const result = computeMarginHealth(
      summary({
        transactionCount: 5,
        netIncomeMinor: 100000,
        netMarginMinor: 30000,
        marginRate: 30,
        fixedExpensesMinor: 40000
      })
    );
    assert.equal(result.status, "HEALTHY");
  });

  test("margin rate between 10 and 20 percent is STABLE", () => {
    const result = computeMarginHealth(
      summary({
        transactionCount: 5,
        netIncomeMinor: 100000,
        netMarginMinor: 15000,
        marginRate: 15,
        fixedExpensesMinor: 30000
      })
    );
    assert.equal(result.status, "STABLE");
  });
});
