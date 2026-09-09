// Fictional demo data only. No real personal financial information belongs here.
export function seedDemoData(db) {
  const existingCount = db.prepare("SELECT COUNT(*) AS c FROM transactions").get().c;
  if (existingCount > 0) return;

  const categoryId = (name) => db.prepare("SELECT id FROM categories WHERE name = ?").get(name)?.id ?? null;
  const accountId = db.prepare("SELECT id FROM accounts LIMIT 1").get()?.id ?? null;

  const insertTx = db.prepare(
    `INSERT INTO transactions
      (date, type, amount_minor, category_id, account_id, is_fixed, is_essential, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const months = ["2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09"];

  db.exec("BEGIN");
  try {
    for (const [i, month] of months.entries()) {
      insertTx.run(`${month}-01`, "INCOME", 320000, null, accountId, 0, 0, "Demo Salary");
      insertTx.run(`${month}-01`, "EXPENSE", 90000, categoryId("Rent / Mortgage"), accountId, 1, 1, "Demo Rent");
      insertTx.run(`${month}-05`, "EXPENSE", 12000, categoryId("Utilities"), accountId, 1, 1, "Demo Electricity Bill");
      insertTx.run(`${month}-06`, "EXPENSE", 4500, categoryId("Subscriptions"), accountId, 1, 0, "Demo Streaming Subscription");
      insertTx.run(`${month}-10`, "EXPENSE", 25000 + i * 1500, categoryId("Groceries"), accountId, 0, 1, "Demo Groceries");
      insertTx.run(`${month}-14`, "EXPENSE", 8000, categoryId("Transportation"), accountId, 0, 1, "Demo Fuel");
      insertTx.run(`${month}-18`, "EXPENSE", 6000, categoryId("Dining Out"), accountId, 0, 0, "Demo Dinner Out");
      if (i % 2 === 0) {
        insertTx.run(`${month}-20`, "EXPENSE", 9000, categoryId("Entertainment"), accountId, 0, 0, "Demo Movie Night");
      }
    }

    const groceries = categoryId("Groceries");
    if (groceries) {
      db.prepare("INSERT OR IGNORE INTO budgets (category_id, month, amount_minor) VALUES (?, ?, ?)").run(
        groceries,
        "2026-09",
        30000
      );
    }

    db.prepare(
      `INSERT INTO debts (name, original_balance_minor, current_balance_minor, interest_rate, min_payment_minor, extra_payment_minor)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run("Demo Car Loan", 1000000, 620000, 14, 18000, 2000);

    db.prepare("UPDATE emergency_fund SET current_reserve_minor = ? WHERE id = 1").run(180000);

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
