import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createTestDb } from "./helpers/testDb.js";
import { addInterval, nextOccurrence, generateDueTransactions } from "../services/recurringEngine.js";

describe("addInterval", () => {
  test("weekly adds exactly 7 days", () => {
    assert.equal(addInterval("2026-09-01", "weekly"), "2026-09-08");
  });

  test("biweekly adds exactly 14 days", () => {
    assert.equal(addInterval("2026-09-01", "biweekly"), "2026-09-15");
  });

  test("monthly on a normal day preserves the day of month", () => {
    assert.equal(addInterval("2026-01-15", "monthly"), "2026-02-15");
  });

  test("yearly on a leap-year Feb 29 clamps to Feb 28 in a non-leap target year, not March 1", () => {
    assert.equal(addInterval("2028-02-29", "yearly"), "2029-02-28");
  });

  test("monthly on the 31st clamps to the last day of a shorter target month, without rolling into the next month", () => {
    const result = addInterval("2026-01-31", "monthly");
    assert.equal(result, "2026-02-28", "Feb 2026 has 28 days; the occurrence must land inside February, not overflow into March");
  });

  test("an explicit anchor day restores the original day once a month long enough occurs again", () => {
    // Simulates the real generateDueTransactions loop: Jan 31 -> Feb (clamped to 28) -> March (31 days, anchor restored)
    const anchor = 31;
    const feb = addInterval("2026-01-31", "monthly", anchor);
    const mar = addInterval(feb, "monthly", anchor);
    assert.equal(feb, "2026-02-28");
    assert.equal(mar, "2026-03-31", "once the anchor day exists again in a longer month, it must be used, not stay clamped at 28");
  });
});

describe("generateDueTransactions", () => {
  test("a template anchored on the 31st restores its anchor day across a full end-to-end generation run", () => {
    const db = createTestDb();
    db.prepare(
      `INSERT INTO recurring_templates (description, type, amount_minor, frequency, start_date, status)
       VALUES ('Subscription', 'EXPENSE', 1000, 'monthly', '2026-01-31', 'active')`
    ).run();

    generateDueTransactions(db, "2026-04-01");

    const rows = db.prepare("SELECT date FROM transactions ORDER BY date").all();
    assert.deepEqual(
      rows.map((r) => r.date),
      ["2026-01-31", "2026-02-28", "2026-03-31"],
      "Feb must clamp to 28 (no 29/30/31 in Feb 2026) while March, which does have 31 days, restores the original anchor day"
    );
  });

  test("a monthly template starting in the past generates one transaction per elapsed month, not extra or fewer", () => {
    const db = createTestDb();
    db.prepare(
      `INSERT INTO recurring_templates (description, type, amount_minor, frequency, start_date, status)
       VALUES ('Rent', 'EXPENSE', 60000, 'monthly', '2026-06-01', 'active')`
    ).run();

    const count = generateDueTransactions(db, "2026-09-08");
    assert.equal(count, 4, "Jun 1, Jul 1, Aug 1, Sep 1 have all elapsed by Sep 8 -> 4 occurrences");

    const rows = db.prepare("SELECT date FROM transactions ORDER BY date").all();
    assert.deepEqual(
      rows.map((r) => r.date),
      ["2026-06-01", "2026-07-01", "2026-08-01", "2026-09-01"]
    );
  });

  test("running generateDueTransactions twice for the same 'today' does not create duplicates", () => {
    const db = createTestDb();
    db.prepare(
      `INSERT INTO recurring_templates (description, type, amount_minor, frequency, start_date, status)
       VALUES ('Rent', 'EXPENSE', 60000, 'monthly', '2026-09-01', 'active')`
    ).run();

    generateDueTransactions(db, "2026-09-08");
    const secondRunCount = generateDueTransactions(db, "2026-09-08");

    assert.equal(secondRunCount, 0, "a second run on the same date must not regenerate already-generated occurrences");
    const total = db.prepare("SELECT COUNT(*) AS c FROM transactions").get().c;
    assert.equal(total, 1);
  });

  test("a paused template generates nothing", () => {
    const db = createTestDb();
    db.prepare(
      `INSERT INTO recurring_templates (description, type, amount_minor, frequency, start_date, status)
       VALUES ('Rent', 'EXPENSE', 60000, 'monthly', '2026-06-01', 'paused')`
    ).run();

    const count = generateDueTransactions(db, "2026-09-08");
    assert.equal(count, 0);
  });

  test("a template with a future start date generates nothing yet", () => {
    const db = createTestDb();
    db.prepare(
      `INSERT INTO recurring_templates (description, type, amount_minor, frequency, start_date, status)
       VALUES ('Rent', 'EXPENSE', 60000, 'monthly', '2027-01-01', 'active')`
    ).run();

    const count = generateDueTransactions(db, "2026-09-08");
    assert.equal(count, 0);
  });

  test("an end_date stops generation even if start_date is far in the past", () => {
    const db = createTestDb();
    db.prepare(
      `INSERT INTO recurring_templates (description, type, amount_minor, frequency, start_date, end_date, status)
       VALUES ('Old subscription', 'EXPENSE', 1000, 'monthly', '2026-01-01', '2026-03-01', 'active')`
    ).run();

    const count = generateDueTransactions(db, "2026-09-08");
    assert.equal(count, 3, "only Jan, Feb, Mar occurrences should generate; nothing past the end_date");
  });
});
