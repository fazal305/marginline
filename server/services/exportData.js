import { toCSV } from "./csv.js";

const CSV_HEADERS = ["date", "type", "amount", "category", "account", "isFixed", "isEssential", "description", "notes"];

export function exportTransactionsCSV(db) {
  const rows = db
    .prepare(
      `SELECT t.date, t.type, t.amount_minor AS amountMinor, c.name AS category, a.name AS account,
              t.is_fixed AS isFixed, t.is_essential AS isEssential, t.description, t.notes
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       LEFT JOIN accounts a ON a.id = t.account_id
       ORDER BY t.date`
    )
    .all();

  const formatted = rows.map((r) => ({
    date: r.date,
    type: r.type,
    amount: (r.amountMinor / 100).toFixed(2),
    category: r.category || "",
    account: r.account || "",
    isFixed: r.isFixed ? "true" : "false",
    isEssential: r.isEssential ? "true" : "false",
    description: r.description || "",
    notes: r.notes || ""
  }));

  return toCSV(formatted, CSV_HEADERS);
}

export function exportBackupJSON(db) {
  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    transactions: db.prepare("SELECT * FROM transactions ORDER BY date").all(),
    categories: db.prepare("SELECT * FROM categories").all(),
    accounts: db.prepare("SELECT * FROM accounts").all(),
    budgets: db.prepare("SELECT * FROM budgets").all(),
    recurringTemplates: db.prepare("SELECT * FROM recurring_templates").all(),
    debts: db.prepare("SELECT * FROM debts").all(),
    emergencyFund: db.prepare("SELECT * FROM emergency_fund WHERE id = 1").get()
  };
}
