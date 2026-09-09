import { Router } from "express";
import db from "../db.js";
import { generateDueTransactions } from "../services/recurringEngine.js";

const router = Router();
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const FREQUENCIES = ["weekly", "biweekly", "monthly", "yearly"];

function serialize(row) {
  return {
    id: row.id,
    description: row.description,
    type: row.type,
    amountMinor: row.amount_minor,
    categoryId: row.category_id,
    categoryName: row.category_name ?? undefined,
    accountId: row.account_id,
    isFixed: !!row.is_fixed,
    isEssential: !!row.is_essential,
    frequency: row.frequency,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    lastGeneratedDate: row.last_generated_date
  };
}

router.get("/", (req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT r.*, c.name AS category_name
         FROM recurring_templates r
         LEFT JOIN categories c ON c.id = r.category_id
         ORDER BY r.status, r.start_date`
      )
      .all();
    res.json(rows.map(serialize));
  } catch {
    res.status(500).json({ message: "Failed to fetch recurring templates" });
  }
});

function validate(body) {
  const { description, type, amount, frequency, startDate } = body;

  if (!description || !description.trim()) return "Description is required";
  if (!["INCOME", "EXPENSE"].includes(type)) return "Type must be INCOME or EXPENSE";
  if (!FREQUENCIES.includes(frequency)) return "Invalid frequency";
  if (!startDate || !DATE_RE.test(startDate)) return "Start date is required in YYYY-MM-DD format";

  const amountMinor = Math.round(Number(amount) * 100);
  if (!Number.isFinite(amountMinor) || amountMinor <= 0) return "Amount must be a positive number";

  return null;
}

router.post("/", (req, res) => {
  try {
    const error = validate(req.body);
    if (error) return res.status(400).json({ message: error });

    const {
      description,
      type,
      amount,
      categoryId = null,
      accountId = null,
      isFixed = true,
      isEssential = false,
      frequency,
      startDate,
      endDate = null
    } = req.body;

    const amountMinor = Math.round(Number(amount) * 100);

    const result = db
      .prepare(
        `INSERT INTO recurring_templates
          (description, type, amount_minor, category_id, account_id, is_fixed, is_essential, frequency, start_date, end_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        description.trim(),
        type,
        amountMinor,
        categoryId,
        accountId,
        isFixed ? 1 : 0,
        isEssential ? 1 : 0,
        frequency,
        startDate,
        endDate
      );

    generateDueTransactions(db);

    const row = db
      .prepare(
        `SELECT r.*, c.name AS category_name FROM recurring_templates r
         LEFT JOIN categories c ON c.id = r.category_id WHERE r.id = ?`
      )
      .get(result.lastInsertRowid);

    res.status(201).json(serialize(row));
  } catch {
    res.status(500).json({ message: "Failed to create recurring template" });
  }
});

router.patch("/:id", (req, res) => {
  try {
    const existing = db.prepare("SELECT * FROM recurring_templates WHERE id = ?").get(req.params.id);
    if (!existing) return res.status(404).json({ message: "Recurring template not found" });

    const { status, description, amount, categoryId, accountId, isFixed, isEssential, endDate } = req.body;

    if (status !== undefined && !["active", "paused"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'active' or 'paused'" });
    }

    const amountMinor = amount !== undefined ? Math.round(Number(amount) * 100) : null;
    if (amount !== undefined && (!Number.isFinite(amountMinor) || amountMinor <= 0)) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }

    db.prepare(
      `UPDATE recurring_templates SET
        status = COALESCE(?, status),
        description = COALESCE(?, description),
        amount_minor = COALESCE(?, amount_minor),
        category_id = CASE WHEN ? THEN ? ELSE category_id END,
        account_id = CASE WHEN ? THEN ? ELSE account_id END,
        is_fixed = COALESCE(?, is_fixed),
        is_essential = COALESCE(?, is_essential),
        end_date = CASE WHEN ? THEN ? ELSE end_date END,
        updated_at = datetime('now')
      WHERE id = ?`
    ).run(
      status ?? null,
      description !== undefined ? description.trim() : null,
      amountMinor,
      categoryId !== undefined ? 1 : 0,
      categoryId ?? null,
      accountId !== undefined ? 1 : 0,
      accountId ?? null,
      isFixed !== undefined ? (isFixed ? 1 : 0) : null,
      isEssential !== undefined ? (isEssential ? 1 : 0) : null,
      endDate !== undefined ? 1 : 0,
      endDate ?? null,
      req.params.id
    );

    const row = db
      .prepare(
        `SELECT r.*, c.name AS category_name FROM recurring_templates r
         LEFT JOIN categories c ON c.id = r.category_id WHERE r.id = ?`
      )
      .get(req.params.id);

    res.json(serialize(row));
  } catch {
    res.status(500).json({ message: "Failed to update recurring template" });
  }
});

router.delete("/:id", (req, res) => {
  try {
    const result = db.prepare("DELETE FROM recurring_templates WHERE id = ?").run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ message: "Recurring template not found" });
    res.json({ message: "Recurring template deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete recurring template" });
  }
});

export default router;
