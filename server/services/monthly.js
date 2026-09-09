function monthKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function monthLabel(key) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export function computeMonthlySeries(db, months = 6) {
  const now = new Date();
  const keys = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKey(d));
  }

  const earliest = `${keys[0]}-01`;

  const rows = db
    .prepare(
      `SELECT strftime('%Y-%m', date) AS month, type, is_fixed AS isFixed, amount_minor AS amountMinor
       FROM transactions
       WHERE type != 'TRANSFER' AND date >= ?`
    )
    .all(earliest);

  const byMonth = new Map(keys.map((key) => [key, { incomeMinor: 0, fixedMinor: 0, variableMinor: 0 }]));

  for (const row of rows) {
    const bucket = byMonth.get(row.month);
    if (!bucket) continue;

    if (row.type === "INCOME") {
      bucket.incomeMinor += row.amountMinor;
    } else if (row.type === "EXPENSE") {
      if (row.isFixed) bucket.fixedMinor += row.amountMinor;
      else bucket.variableMinor += row.amountMinor;
    }
  }

  return keys.map((key) => {
    const bucket = byMonth.get(key);
    const marginMinor = bucket.incomeMinor - bucket.fixedMinor - bucket.variableMinor;
    return {
      month: key,
      label: monthLabel(key),
      incomeMinor: bucket.incomeMinor,
      fixedMinor: bucket.fixedMinor,
      variableMinor: bucket.variableMinor,
      marginMinor
    };
  });
}

export function computeMonthTotals(db, month) {
  const rows = db
    .prepare(
      `SELECT type, is_fixed AS isFixed, amount_minor AS amountMinor
       FROM transactions
       WHERE type != 'TRANSFER' AND strftime('%Y-%m', date) = ?`
    )
    .all(month);

  let incomeMinor = 0;
  let fixedMinor = 0;
  let variableMinor = 0;

  for (const row of rows) {
    if (row.type === "INCOME") incomeMinor += row.amountMinor;
    else if (row.isFixed) fixedMinor += row.amountMinor;
    else variableMinor += row.amountMinor;
  }

  const marginMinor = incomeMinor - fixedMinor - variableMinor;
  const marginRate = incomeMinor > 0 ? (marginMinor / incomeMinor) * 100 : null;

  return { month, incomeMinor, fixedMinor, variableMinor, marginMinor, marginRate };
}

export function computeAverageMonthlyFixed(db, months = 3) {
  const series = computeMonthlySeries(db, months).filter(
    (m) => m.incomeMinor > 0 || m.fixedMinor > 0 || m.variableMinor > 0
  );
  if (series.length === 0) return 0;
  const total = series.reduce((sum, m) => sum + m.fixedMinor, 0);
  return Math.round(total / series.length);
}
