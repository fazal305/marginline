import { Router } from "express";
import db from "../db.js";
import { exportTransactionsCSV, exportBackupJSON } from "../services/exportData.js";
import { parseCSV } from "../services/csv.js";
import { validateImportRows, commitImportRows } from "../services/importTransactions.js";

const router = Router();

router.get("/export/transactions.csv", (req, res) => {
  try {
    const csv = exportTransactionsCSV(db);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=marginline-transactions.csv");
    res.send(csv);
  } catch {
    res.status(500).json({ message: "Failed to export CSV" });
  }
});

router.get("/export/backup.json", (req, res) => {
  try {
    const data = exportBackupJSON(db);
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", "attachment; filename=marginline-backup.json");
    res.send(JSON.stringify(data, null, 2));
  } catch {
    res.status(500).json({ message: "Failed to export JSON backup" });
  }
});

router.post("/import/preview", (req, res) => {
  try {
    const { csv } = req.body;
    if (!csv || typeof csv !== "string") {
      return res.status(400).json({ message: "csv text is required" });
    }

    const rows = parseCSV(csv);
    if (rows.length === 0) {
      return res.status(400).json({ message: "No rows found in CSV" });
    }

    const requiredHeaders = ["date", "type", "amount"];
    const headers = Object.keys(rows[0]).map((h) => h.toLowerCase());
    const missing = requiredHeaders.filter((h) => !headers.includes(h));
    if (missing.length > 0) {
      return res.status(400).json({ message: `CSV is missing required column(s): ${missing.join(", ")}` });
    }

    const result = validateImportRows(rows, db);
    res.json(result);
  } catch {
    res.status(500).json({ message: "Failed to parse CSV" });
  }
});

router.post("/import/commit", (req, res) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: "No rows to import" });
    }
    const count = commitImportRows(db, rows);
    res.json({ imported: count });
  } catch {
    res.status(500).json({ message: "Failed to import transactions" });
  }
});

export default router;
