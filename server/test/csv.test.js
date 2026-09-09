import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseCSV, toCSV } from "../services/csv.js";

describe("parseCSV", () => {
  test("parses a simple CSV into row objects keyed by header", () => {
    const rows = parseCSV("date,amount\n2026-09-01,600\n");
    assert.deepEqual(rows, [{ date: "2026-09-01", amount: "600" }]);
  });

  test("handles a quoted field containing a comma", () => {
    const rows = parseCSV('date,description\n2026-09-01,"Rent, September"\n');
    assert.equal(rows[0].description, "Rent, September");
  });

  test("handles an escaped double-quote inside a quoted field", () => {
    const rows = parseCSV('date,description\n2026-09-01,"Say ""hi"""\n');
    assert.equal(rows[0].description, 'Say "hi"');
  });

  test("handles a quoted field containing a newline", () => {
    const rows = parseCSV('date,notes\n2026-09-01,"line one\nline two"\n');
    assert.equal(rows[0].notes, "line one\nline two");
  });

  test("returns an empty array for empty input", () => {
    assert.deepEqual(parseCSV(""), []);
  });

  test("handles a file with only a header row and no data rows", () => {
    assert.deepEqual(parseCSV("date,amount\n"), []);
  });
});

describe("toCSV", () => {
  test("quotes a field containing a comma", () => {
    const csv = toCSV([{ a: "x,y" }], ["a"]);
    assert.equal(csv, "a\n\"x,y\"");
  });

  test("escapes an embedded double-quote", () => {
    const csv = toCSV([{ a: 'has"quote' }], ["a"]);
    assert.equal(csv, 'a\n"has""quote"');
  });

  test("round-trips through parseCSV and produces the same data back", () => {
    const original = [{ date: "2026-09-01", description: "Rent, September" }];
    const csv = toCSV(original, ["date", "description"]);
    const reparsed = parseCSV(csv);
    assert.deepEqual(reparsed, original);
  });
});
