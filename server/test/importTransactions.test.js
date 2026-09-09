import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createTestDb, insertTransaction, getCategoryIdByName } from "./helpers/testDb.js";
import { validateImportRows, commitImportRows } from "../services/importTransactions.js";

describe("validateImportRows", () => {
  test("a well-formed row is accepted", () => {
    const db = createTestDb();
    const { valid, errors } = validateImportRows(
      [{ date: "2026-09-01", type: "EXPENSE", amount: "50", category: "Groceries", description: "Food" }],
      db
    );
    assert.equal(errors.length, 0);
    assert.equal(valid.length, 1);
    assert.equal(valid[0].amountMinor, 5000);
  });

  test("rejects a malformed date", () => {
    const db = createTestDb();
    const { errors } = validateImportRows([{ date: "09/01/2026", type: "EXPENSE", amount: "50" }], db);
    assert.equal(errors.length, 1);
    assert.match(errors[0].errors[0], /date/);
  });

  test("rejects an invalid type", () => {
    const db = createTestDb();
    const { errors } = validateImportRows([{ date: "2026-09-01", type: "BOGUS", amount: "50" }], db);
    assert.equal(errors.length, 1);
    assert.match(errors[0].errors[0], /type/);
  });

  test("rejects a zero or negative amount", () => {
    const db = createTestDb();
    const { errors } = validateImportRows(
      [
        { date: "2026-09-01", type: "EXPENSE", amount: "0" },
        { date: "2026-09-01", type: "EXPENSE", amount: "-5" }
      ],
      db
    );
    assert.equal(errors.length, 2);
  });

  test("rejects an unknown category by name", () => {
    const db = createTestDb();
    const { errors } = validateImportRows(
      [{ date: "2026-09-01", type: "EXPENSE", amount: "10", category: "NotReal" }],
      db
    );
    assert.equal(errors.length, 1);
    assert.match(errors[0].errors[0], /category/);
  });

  test("flags a row that exactly matches an existing transaction as a duplicate, and does not import it", () => {
    const db = createTestDb();
    insertTransaction(db, { date: "2026-09-01", type: "EXPENSE", amountMinor: 5000, description: "Groceries run" });

    const { valid, duplicates } = validateImportRows(
      [{ date: "2026-09-01", type: "EXPENSE", amount: "50", description: "Groceries run" }],
      db
    );
    assert.equal(valid.length, 0);
    assert.equal(duplicates.length, 1);
  });

  test("flags two identical rows within the same import batch as a duplicate of each other", () => {
    const db = createTestDb();
    const row = { date: "2026-09-01", type: "EXPENSE", amount: "50", description: "Coffee" };
    const { valid, duplicates } = validateImportRows([row, row], db);
    assert.equal(valid.length, 1, "only the first occurrence should be imported");
    assert.equal(duplicates.length, 1, "the second identical row should be flagged as a duplicate");
  });

  test("does not falsely flag two different transactions on the same date as duplicates", () => {
    const db = createTestDb();
    const { valid } = validateImportRows(
      [
        { date: "2026-09-01", type: "EXPENSE", amount: "50", description: "Groceries" },
        { date: "2026-09-01", type: "EXPENSE", amount: "50", description: "Gas" }
      ],
      db
    );
    assert.equal(valid.length, 2, "different descriptions on the same day/amount are not the same transaction");
  });
});

describe("commitImportRows", () => {
  test("inserts all rows and returns the count", () => {
    const db = createTestDb();
    const groceries = getCategoryIdByName(db, "Groceries");
    const count = commitImportRows(db, [
      { date: "2026-09-01", type: "EXPENSE", amountMinor: 5000, categoryId: groceries, isFixed: false, isEssential: false, description: "Food", notes: null }
    ]);
    assert.equal(count, 1);
    const rows = db.prepare("SELECT * FROM transactions").all();
    assert.equal(rows.length, 1);
    assert.equal(rows[0].amount_minor, 5000);
  });

  test("rolls back the entire batch if one row fails (atomicity)", () => {
    const db = createTestDb();
    const before = db.prepare("SELECT COUNT(*) AS c FROM transactions").get().c;

    assert.throws(() => {
      commitImportRows(db, [
        { date: "2026-09-01", type: "EXPENSE", amountMinor: 5000, categoryId: null, isFixed: false, isEssential: false, description: "ok", notes: null },
        { date: "2026-09-01", type: "EXPENSE", amountMinor: -100, categoryId: null, isFixed: false, isEssential: false, description: "bad", notes: null }
      ]);
    });

    const after = db.prepare("SELECT COUNT(*) AS c FROM transactions").get().c;
    assert.equal(after, before, "a failed row must not leave a partial import committed");
  });
});
