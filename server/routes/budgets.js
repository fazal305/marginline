import { Router } from "express";
import db from "../db.js";
import { computeBudgetVariance } from "../services/budgetVariance.js";

const router = Router();
const MONTH_RE = /^\d{4}-\d{2}$/;

router.get("/", (req, res) => {
  try {
    const month = req.query.month;
    if (!month || !MONTH_RE.test(month)) {
      return res.status(400).json({ message: "month query param is required (YYYY-MM)" });
    }
    res.json(computeBudgetVariance(db, month));
  } catch {
    res.status(500).json({ message: "Failed to fetch budgets" });
  }
});

router.post("/", (req, res) => {
  try {
    const { categoryId, month, amount } = req.body;

    if (!categoryId || !month || !MONTH_RE.test(month)) {
      return res.status(400).json({ message: "categoryId and month (YYYY-MM) are required" });
    }

    const amountMinor = Math.round(Number(amount) * 100);
    if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }

    const category = db.prepare("SELECT id FROM categories WHERE id = ?").get(categoryId);
    if (!category) return res.status(400).json({ message: "Category not found" });

    const existing = db
      .prepare("SELECT id FROM budgets WHERE category_id = ? AND month = ?")
      .get(categoryId, month);

    if (existing) {
      db.prepare("UPDATE budgets SET amount_minor = ?, updated_at = datetime('now') WHERE id = ?").run(
        amountMinor,
        existing.id
      );
    } else {
      db.prepare("INSERT INTO budgets (category_id, month, amount_minor) VALUES (?, ?, ?)").run(
        categoryId,
        month,
        amountMinor
      );
    }

    res.status(201).json(computeBudgetVariance(db, month));
  } catch {
    res.status(500).json({ message: "Failed to save budget" });
  }
});

router.delete("/:id", (req, res) => {
  try {
    const result = db.prepare("DELETE FROM budgets WHERE id = ?").run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ message: "Budget not found" });
    res.json({ message: "Budget deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete budget" });
  }
});

export default router;
