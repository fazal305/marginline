import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { projectPayoffMonths } from "../services/debtPayoff.js";

describe("projectPayoffMonths", () => {
  test("already-paid-off debt returns 0 months, not null or an error", () => {
    assert.equal(projectPayoffMonths(0, 18, 20000), 0);
  });

  test("zero or negative payment returns null (never), not Infinity or a crash", () => {
    assert.equal(projectPayoffMonths(500000, 18, 0), null);
  });

  test("payment that doesn't cover monthly interest returns null (debt would never be paid off)", () => {
    // 5000 balance @ 24% APR = 2% monthly = 100 interest/month; a 50/month payment can't even cover interest
    assert.equal(projectPayoffMonths(500000, 24, 5000), null);
  });

  test("0% interest is a simple linear division, not a formula that divides by zero", () => {
    assert.equal(projectPayoffMonths(100000, 0, 10000), 10);
  });

  test("standard amortization case matches manual calculation", () => {
    // Rs 5000 balance, 18% APR, Rs 200/month -> verified against manual amortization formula
    assert.equal(projectPayoffMonths(500000, 18, 20000), 32);
  });

  test("higher payment on the same balance pays off faster", () => {
    const slow = projectPayoffMonths(500000, 18, 20000);
    const fast = projectPayoffMonths(500000, 18, 40000);
    assert.ok(fast < slow, "doubling the payment must reduce the payoff time");
  });
});
