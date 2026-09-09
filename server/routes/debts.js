import { Router } from "express";
import db from "../db.js";
import { projectPayoffMonths } from "../services/debtPayoff.js";

const router = Router();

function serialize(row) {
  const monthlyPayment = row.min_payment_minor + row.extra_payment_minor;
  return {
    id: row.id,
    name: row.name,
    originalBalanceMinor: row.original_balance_minor,
    currentBalanceMinor: row.current_balance_minor,
    interestRate: row.interest_rate,
    minPaymentMinor: row.min_payment_minor,
    extraPaymentMinor: row.extra_payment_minor,
    dueDay: row.due_day,
    payoffMonths: projectPayoffMonths(row.current_balance_minor, row.interest_rate, monthlyPayment)
  };
}

router.get("/", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM debts ORDER BY current_balance_minor DESC").all();
    const debts = rows.map(serialize);

    const totals = debts.reduce(
      (acc, d) => ({
        totalBalanceMinor: acc.totalBalanceMinor + d.currentBalanceMinor,
        totalOriginalMinor: acc.totalOriginalMinor + d.originalBalanceMinor,
        totalMinPaymentMinor: acc.totalMinPaymentMinor + d.minPaymentMinor,
        totalMonthlyPaymentMinor: acc.totalMonthlyPaymentMinor + d.minPaymentMinor + d.extraPaymentMinor
      }),
      { totalBalanceMinor: 0, totalOriginalMinor: 0, totalMinPaymentMinor: 0, totalMonthlyPaymentMinor: 0 }
    );

    res.json({ debts, totals });
  } catch {
    res.status(500).json({ message: "Failed to fetch debts" });
  }
});

function validate(body) {
  const { name, originalBalance, currentBalance, minPayment } = body;
  if (!name || !name.trim()) return "Name is required";
  if (!Number.isFinite(Number(originalBalance)) || Number(originalBalance) <= 0)
    return "Original balance must be a positive number";
  if (!Number.isFinite(Number(currentBalance)) || Number(currentBalance) < 0)
    return "Current balance must be zero or positive";
  if (!Number.isFinite(Number(minPayment)) || Number(minPayment) < 0)
    return "Minimum payment must be zero or positive";
  return null;
}

router.post("/", (req, res) => {
  try {
    const error = validate(req.body);
    if (error) return res.status(400).json({ message: error });

    const {
      name,
      originalBalance,
      currentBalance,
      interestRate = 0,
      minPayment,
      extraPayment = 0,
      dueDay = null
    } = req.body;

    const result = db
      .prepare(
        `INSERT INTO debts
          (name, original_balance_minor, current_balance_minor, interest_rate, min_payment_minor, extra_payment_minor, due_day)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        name.trim(),
        Math.round(Number(originalBalance) * 100),
        Math.round(Number(currentBalance) * 100),
        Number(interestRate),
        Math.round(Number(minPayment) * 100),
        Math.round(Number(extraPayment) * 100),
        dueDay
      );

    const row = db.prepare("SELECT * FROM debts WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(serialize(row));
  } catch {
    res.status(500).json({ message: "Failed to create debt" });
  }
});

router.patch("/:id", (req, res) => {
  try {
    const existing = db.prepare("SELECT * FROM debts WHERE id = ?").get(req.params.id);
    if (!existing) return res.status(404).json({ message: "Debt not found" });

    const { name, currentBalance, interestRate, minPayment, extraPayment, dueDay } = req.body;

    const currentBalanceMinor = currentBalance !== undefined ? Math.round(Number(currentBalance) * 100) : null;
    const minPaymentMinor = minPayment !== undefined ? Math.round(Number(minPayment) * 100) : null;
    const extraPaymentMinor = extraPayment !== undefined ? Math.round(Number(extraPayment) * 100) : null;

    db.prepare(
      `UPDATE debts SET
        name = COALESCE(?, name),
        current_balance_minor = COALESCE(?, current_balance_minor),
        interest_rate = COALESCE(?, interest_rate),
        min_payment_minor = COALESCE(?, min_payment_minor),
        extra_payment_minor = COALESCE(?, extra_payment_minor),
        due_day = CASE WHEN ? THEN ? ELSE due_day END,
        updated_at = datetime('now')
      WHERE id = ?`
    ).run(
      name !== undefined ? name.trim() : null,
      currentBalanceMinor,
      interestRate !== undefined ? Number(interestRate) : null,
      minPaymentMinor,
      extraPaymentMinor,
      dueDay !== undefined ? 1 : 0,
      dueDay ?? null,
      req.params.id
    );

    const row = db.prepare("SELECT * FROM debts WHERE id = ?").get(req.params.id);
    res.json(serialize(row));
  } catch {
    res.status(500).json({ message: "Failed to update debt" });
  }
});

router.delete("/:id", (req, res) => {
  try {
    const result = db.prepare("DELETE FROM debts WHERE id = ?").run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ message: "Debt not found" });
    res.json({ message: "Debt deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete debt" });
  }
});

export default router;
