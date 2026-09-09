import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { formatCurrency } from "../components/MetricCard.jsx";
import LoadingState from "../components/LoadingState.jsx";
import "./Budgets.css";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default function Budgets() {
  const [month, setMonth] = useState(currentMonth());
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState({ categoryId: "", amount: "" });

  function load() {
    setStatus("loading");
    Promise.all([api.getBudgets(month), api.getCategories()])
      .then(([budgetRows, cats]) => {
        setRows(budgetRows);
        setCategories(cats);
        setStatus("ready");
      })
      .catch((err) => {
        setError(err.message);
        setStatus("error");
      });
  }

  useEffect(load, [month]);

  const budgetedIds = new Set(rows.map((r) => r.categoryId));
  const availableCategories = categories.filter((c) => !budgetedIds.has(c.id));

  async function handleAdd(event) {
    event.preventDefault();
    if (!draft.categoryId || !draft.amount) {
      setError("Choose a category and enter an amount.");
      return;
    }
    setError(null);
    try {
      await api.saveBudget({ categoryId: Number(draft.categoryId), month, amount: Number(draft.amount) });
      setDraft({ categoryId: "", amount: "" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteBudget(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const totalBudget = rows.reduce((sum, r) => sum + r.budgetMinor, 0);
  const totalActual = rows.reduce((sum, r) => sum + r.actualMinor, 0);

  return (
    <div className="ml-budgets">
      <header className="ml-page-header">
        <p className="ml-eyebrow">Planning</p>
        <h1>Budgets</h1>
        <p className="ml-page-subtitle">Set a monthly limit per category and track actual spending against it.</p>
      </header>

      <div className="ml-budgets-toolbar">
        <label className="ml-field">
          <span>Month</span>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </label>
        {rows.length > 0 ? (
          <div className="ml-budgets-total">
            <span>Total budgeted</span>
            <strong>{formatCurrency(totalBudget)}</strong>
            <span className="ml-text-faint">vs. actual {formatCurrency(totalActual)}</span>
          </div>
        ) : null}
      </div>

      <form className="ml-budget-form" onSubmit={handleAdd}>
        <select value={draft.categoryId} onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}>
          <option value="">Choose a category…</option>
          {availableCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="1"
          step="1"
          placeholder="Monthly budget amount"
          value={draft.amount}
          onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
        />
        <button type="submit">Set Budget</button>
      </form>

      {error ? (
        <p className="ml-dashboard-error" role="alert">
          {error}
        </p>
      ) : null}

      {status === "loading" ? <LoadingState label="Loading budgets…" /> : null}

      {status === "ready" && rows.length === 0 ? (
        <div className="ml-dashboard-empty">
          <h2>No budgets set for {month}</h2>
          <p>Pick a category above and set a monthly limit to start tracking budget vs. actual.</p>
        </div>
      ) : null}

      {status === "ready" && rows.length > 0 ? (
        <div className="ml-budget-rows">
          {rows.map((row) => (
            <BudgetRow key={row.id} row={row} onDelete={() => handleDelete(row.id)} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function BudgetRow({ row, onDelete }) {
  const overBudget = row.utilizationPct > 100;
  const nearLimit = row.utilizationPct >= 80 && row.utilizationPct <= 100;

  return (
    <div className="ml-budget-row">
      <div className="ml-budget-row-header">
        <span className="ml-budget-row-name">{row.categoryName}</span>
        <span className="ml-budget-row-figures">
          {formatCurrency(row.actualMinor)} <span className="ml-text-faint">of</span> {formatCurrency(row.budgetMinor)}
        </span>
        <button type="button" className="ml-budget-row-delete" onClick={onDelete}>
          Remove
        </button>
      </div>
      <div className="ml-budget-track">
        <div
          className={`ml-budget-fill ${overBudget ? "is-over" : nearLimit ? "is-near" : ""}`}
          style={{ width: `${Math.min(100, row.utilizationPct)}%` }}
        />
      </div>
      <div className="ml-budget-row-footer">
        <span>{row.utilizationPct.toFixed(0)}% used</span>
        <span>
          {row.varianceMinor >= 0
            ? `${formatCurrency(row.varianceMinor)} remaining`
            : `${formatCurrency(Math.abs(row.varianceMinor))} over budget`}
        </span>
      </div>
    </div>
  );
}
