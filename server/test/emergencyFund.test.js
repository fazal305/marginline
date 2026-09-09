import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createTestDb } from "./helpers/testDb.js";
import { computeEmergencyFund } from "../services/emergencyFund.js";

describe("computeEmergencyFund", () => {
  test("target is fixed baseline times target months", () => {
    const db = createTestDb();
    const result = computeEmergencyFund(db, 68000); // default target_months = 3
    assert.equal(result.targetMinor, 204000);
  });

  test("monthsCovered is null when there is no fixed baseline yet (avoids division by zero)", () => {
    const db = createTestDb();
    const result = computeEmergencyFund(db, 0);
    assert.equal(result.monthsCovered, null);
  });

  test("progress percentage is capped at 100 even if reserve exceeds target", () => {
    const db = createTestDb();
    db.prepare("UPDATE emergency_fund SET current_reserve_minor = ? WHERE id = 1").run(500000);
    const result = computeEmergencyFund(db, 68000); // target = 204000, reserve = 500000
    assert.equal(result.progressPct, 100);
    assert.equal(result.remainingMinor, 0, "remaining must not go negative once the target is exceeded");
  });

  test("reflects an updated target_months setting", () => {
    const db = createTestDb();
    db.prepare("UPDATE emergency_fund SET target_months = ? WHERE id = 1").run(6);
    const result = computeEmergencyFund(db, 10000);
    assert.equal(result.targetMinor, 60000);
  });
});
