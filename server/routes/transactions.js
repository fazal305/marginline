import { Router } from "express";
import db from "../db.js";

const router = Router();
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const VALID_TYPES = ["INCOME", "EXPENSE", "TRANSFER"];

function serialize(row) {
  return {
    id: row.id,
    date: row.date,
    type: row.type,
    amountMinor: row.amount_minor,
    currency: row.currency,
    categoryId: row.category_id,
    categoryName: row.category_name ?? undefined,
    accountId: row.account_id,
    accountName: row.account_name ?? undefined,
    paymentMethod: row.payment_method,
    isFixed: !!row.is_fixed,
    isEssential: !!row.is_essential,
    description: row.description,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

router.get("/", (req, res) => {
  try {
    const { type, isFixed, categoryId, accountId, search, dateFrom, dateTo, sort } = req.query;

    const clauses = [];
    const params = [];

    if (type && VALID_TYPES.includes(type)) {
      clauses.push("t.type = ?");
      params.push(type);
    }

    if (isFixed === "true" || isFixed === "false") {
      clauses.push("t.is_fixed = ?");
      params.push(isFixed === "true" ? 1 : 0);
    }

    if (categoryId) {
      clauses.push("t.category_id = ?");
      params.push(Number(categoryId));
    }

    if (accountId) {
      clauses.push("t.account_id = ?");
      params.push(Number(accountId));
    }

    if (dateFrom && DATE_RE.test(dateFrom)) {
      clauses.push("t.date >= ?");
      params.push(dateFrom);
    }

    if (dateTo && DATE_RE.test(dateTo)) {
      clauses.push("t.date <= ?");
      params.push(dateTo);
    }

    if (search && search.trim()) {
      clauses.push("(t.description LIKE ? OR t.notes LIKE ?)");
      const like = `%${search.trim()}%`;
      params.push(like, like);
    }

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const orderBy = sort === "date_asc" ? "t.date ASC, t.id ASC" : "t.date DESC, t.id DESC";

    const rows = db
      .prepare(
        `SELECT t.*, c.name AS category_name, a.name AS account_name
         FROM transactions t
         LEFT JOIN categories c ON c.id = t.category_id
         LEFT JOIN accounts a ON a.id = t.account_id
         ${where}
         ORDER BY ${orderBy}`
      )
      .all(...params);

    res.json(rows.map(serialize));
  } catch {
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});

function validatePayload(body) {
  const { date, type, amount, amountMinor, categoryId, accountId } = body;

  if (!date || !DATE_RE.test(date)) {
    return "Date is required in YYYY-MM-DD format";
  }

  if (!VALID_TYPES.includes(type)) {
    return "Type must be INCOME, EXPENSE, or TRANSFER";
  }

  const resolvedAmountMinor =
    amountMinor !== undefined ? Number(amountMinor) : Math.round(Number(amount) * 100);

  if (!Number.isFinite(resolvedAmountMinor) || resolvedAmountMinor <= 0) {
    return "Amount must be a positive number";
  }

  if (categoryId !== undefined && categoryId !== null) {
    const category = db.prepare("SELECT id FROM categories WHERE id = ?").get(categoryId);
    if (!category) return "Category not found";
  }

  if (accountId !== undefined && accountId !== null) {
    const account = db.prepare("SELECT id FROM accounts WHERE id = ?").get(accountId);
    if (!account) return "Account not found";
  }

  return null;
}

router.post("/", (req, res) => {
  try {
    const error = validatePayload(req.body);
    if (error) return res.status(400).json({ message: error });

    const {
      date,
      type,
      amount,
      amountMinor,
      categoryId = null,
      accountId = null,
      paymentMethod = null,
      isFixed = false,
      isEssential = false,
      description = null,
      notes = null
    } = req.body;

    const resolvedAmountMinor =
      amountMinor !== undefined ? Number(amountMinor) : Math.round(Number(amount) * 100);

    const result = db
      .prepare(
        `INSERT INTO transactions
          (date, type, amount_minor, category_id, account_id, payment_method, is_fixed, is_essential, description, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        date,
        type,
        resolvedAmountMinor,
        categoryId,
        accountId,
        paymentMethod,
        isFixed ? 1 : 0,
        isEssential ? 1 : 0,
        description,
        notes
      );

    const row = db
      .prepare(
        `SELECT t.*, c.name AS category_name, a.name AS account_name
         FROM transactions t
         LEFT JOIN categories c ON c.id = t.category_id
         LEFT JOIN accounts a ON a.id = t.account_id
         WHERE t.id = ?`
      )
      .get(result.lastInsertRowid);

    res.status(201).json(serialize(row));
  } catch {
    res.status(500).json({ message: "Failed to create transaction" });
  }
});

router.patch("/:id", (req, res) => {
  try {
    const existing = db.prepare("SELECT * FROM transactions WHERE id = ?").get(req.params.id);
    if (!existing) return res.status(404).json({ message: "Transaction not found" });

    const nextDate = req.body.date ?? existing.date;
    const nextType = req.body.type ?? existing.type;
    const nextCategoryId = req.body.categoryId !== undefined ? req.body.categoryId : existing.category_id;
    const nextAccountId = req.body.accountId !== undefined ? req.body.accountId : existing.account_id;
    const hasAmountUpdate = req.body.amountMinor !== undefined || req.body.amount !== undefined;

    const error = validatePayload({
      date: nextDate,
      type: nextType,
      amountMinor: hasAmountUpdate ? req.body.amountMinor : existing.amount_minor,
      amount: hasAmountUpdate ? req.body.amount : undefined,
      categoryId: nextCategoryId,
      accountId: nextAccountId
    });
    if (error) return res.status(400).json({ message: error });

    const {
      date,
      type,
      amount,
      amountMinor,
      categoryId,
      accountId,
      paymentMethod,
      isFixed,
      isEssential,
      description,
      notes
    } = req.body;

    const resolvedAmountMinor =
      amountMinor !== undefined
        ? Number(amountMinor)
        : amount !== undefined
        ? Math.round(Number(amount) * 100)
        : null;

    db.prepare(
      `UPDATE transactions SET
        date = COALESCE(?, date),
        type = COALESCE(?, type),
        amount_minor = COALESCE(?, amount_minor),
        category_id = CASE WHEN ? THEN ? ELSE category_id END,
        account_id = CASE WHEN ? THEN ? ELSE account_id END,
        payment_method = COALESCE(?, payment_method),
        is_fixed = COALESCE(?, is_fixed),
        is_essential = COALESCE(?, is_essential),
        description = COALESCE(?, description),
        notes = COALESCE(?, notes),
        updated_at = datetime('now')
      WHERE id = ?`
    ).run(
      date ?? null,
      type ?? null,
      resolvedAmountMinor,
      categoryId !== undefined ? 1 : 0,
      categoryId ?? null,
      accountId !== undefined ? 1 : 0,
      accountId ?? null,
      paymentMethod ?? null,
      isFixed !== undefined ? (isFixed ? 1 : 0) : null,
      isEssential !== undefined ? (isEssential ? 1 : 0) : null,
      description ?? null,
      notes ?? null,
      req.params.id
    );

    const row = db
      .prepare(
        `SELECT t.*, c.name AS category_name, a.name AS account_name
         FROM transactions t
         LEFT JOIN categories c ON c.id = t.category_id
         LEFT JOIN accounts a ON a.id = t.account_id
         WHERE t.id = ?`
      )
      .get(req.params.id);

    res.json(serialize(row));
  } catch {
    res.status(500).json({ message: "Failed to update transaction" });
  }
});

router.delete("/:id", (req, res) => {
  try {
    const result = db.prepare("DELETE FROM transactions WHERE id = ?").run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json({ message: "Transaction deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete transaction" });
  }
});

export default router;
