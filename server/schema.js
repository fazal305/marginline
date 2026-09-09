export const DEFAULT_CATEGORIES = [
  { name: "Rent / Mortgage", kind: "fixed", essential: 1 },
  { name: "Utilities", kind: "fixed", essential: 1 },
  { name: "Debt Payments", kind: "fixed", essential: 1 },
  { name: "Subscriptions", kind: "fixed", essential: 0 },
  { name: "Insurance", kind: "fixed", essential: 1 },
  { name: "Groceries", kind: "variable", essential: 1 },
  { name: "Transportation", kind: "variable", essential: 1 },
  { name: "Dining Out", kind: "variable", essential: 0 },
  { name: "Entertainment", kind: "variable", essential: 0 },
  { name: "Shopping", kind: "variable", essential: 0 },
  { name: "Travel", kind: "variable", essential: 0 }
];

export function initializeSchema(db, { seed = true } = {}) {
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'checking',
      archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('fixed', 'variable')),
      essential INTEGER NOT NULL DEFAULT 0,
      icon TEXT,
      color TEXT,
      archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE', 'TRANSFER')),
      amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
      currency TEXT NOT NULL DEFAULT 'PKR',
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
      payment_method TEXT,
      is_fixed INTEGER NOT NULL DEFAULT 0,
      is_essential INTEGER NOT NULL DEFAULT 0,
      recurring_template_id INTEGER,
      transfer_pair_id INTEGER,
      description TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);

    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      month TEXT NOT NULL,
      amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (category_id, month)
    );

    CREATE TABLE IF NOT EXISTS recurring_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
      amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
      is_fixed INTEGER NOT NULL DEFAULT 1,
      is_essential INTEGER NOT NULL DEFAULT 0,
      frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'yearly')),
      start_date TEXT NOT NULL,
      end_date TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
      last_generated_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS emergency_fund (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      target_months REAL NOT NULL DEFAULT 3,
      current_reserve_minor INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS debts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      original_balance_minor INTEGER NOT NULL CHECK (original_balance_minor > 0),
      current_balance_minor INTEGER NOT NULL CHECK (current_balance_minor >= 0),
      interest_rate REAL NOT NULL DEFAULT 0,
      min_payment_minor INTEGER NOT NULL CHECK (min_payment_minor >= 0),
      extra_payment_minor INTEGER NOT NULL DEFAULT 0,
      due_day INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const emergencyFundRow = db.prepare("SELECT id FROM emergency_fund WHERE id = 1").get();
  if (!emergencyFundRow) {
    db.prepare("INSERT INTO emergency_fund (id, target_months, current_reserve_minor) VALUES (1, 3, 0)").run();
  }

  if (!seed) return;

  const categoryCount = db.prepare("SELECT COUNT(*) AS count FROM categories").get().count;

  if (categoryCount === 0) {
    const insert = db.prepare("INSERT INTO categories (name, kind, essential) VALUES (@name, @kind, @essential)");
    db.exec("BEGIN");
    try {
      for (const row of DEFAULT_CATEGORIES) insert.run(row);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }

  const accountCount = db.prepare("SELECT COUNT(*) AS count FROM accounts").get().count;

  if (accountCount === 0) {
    db.prepare("INSERT INTO accounts (name, type) VALUES (?, ?)").run("Primary Account", "checking");
    db.prepare("INSERT INTO accounts (name, type) VALUES (?, ?)").run("Cash", "cash");
  }
}
