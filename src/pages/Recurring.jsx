import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { formatCurrency } from "../components/MetricCard.jsx";
import LoadingState from "../components/LoadingState.jsx";
import "./Recurring.css";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const INITIAL_DRAFT = {
  description: "",
  type: "EXPENSE",
  amount: "",
  categoryId: "",
  frequency: "monthly",
  startDate: todayISO(),
  isFixed: true
};

const FREQUENCY_LABEL = { weekly: "Weekly", biweekly: "Every 2 weeks", monthly: "Monthly", yearly: "Yearly" };

export default function Recurring() {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState(INITIAL_DRAFT);

  function load() {
    setStatus("loading");
    Promise.all([api.getRecurring(), api.getCategories()])
      .then(([recurringData, cats]) => {
        setTemplates(recurringData);
        setCategories(cats);
        setStatus("ready");
      })
      .catch((err) => {
        setError(err.message);
        setStatus("error");
      });
  }

  useEffect(load, []);

  async function handleCreate(event) {
    event.preventDefault();
    if (!draft.description.trim() || !draft.amount) {
      setError("Description and amount are required.");
      return;
    }
    setError(null);
    try {
      await api.createRecurring({
        description: draft.description.trim(),
        type: draft.type,
        amount: Number(draft.amount),
        categoryId: draft.categoryId ? Number(draft.categoryId) : null,
        frequency: draft.frequency,
        startDate: draft.startDate,
        isFixed: draft.isFixed
      });
      setDraft(INITIAL_DRAFT);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleStatus(template) {
    try {
      await api.updateRecurring(template.id, { status: template.status === "active" ? "paused" : "active" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this recurring template? Past generated transactions stay in your ledger.")) return;
    try {
      await api.deleteRecurring(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="ml-recurring">
      <header className="ml-page-header">
        <p className="ml-eyebrow">Cash Flow</p>
        <h1>Recurring</h1>
        <p className="ml-page-subtitle">
          Templates for rent, salary, subscriptions — generated into your ledger automatically as they come due.
        </p>
      </header>

      <form className="ml-recurring-form" onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="Description (e.g. Rent, Salary)"
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        />
        <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>
          <option value="EXPENSE">Expense</option>
          <option value="INCOME">Income</option>
        </select>
        <input
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Amount"
          value={draft.amount}
          onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
        />
        <select value={draft.categoryId} onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}>
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={draft.frequency} onChange={(e) => setDraft({ ...draft, frequency: e.target.value })}>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Every 2 weeks</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
        <input
          type="date"
          value={draft.startDate}
          onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
        />
        <button type="submit">Add Recurring</button>
      </form>

      {error ? (
        <p className="ml-dashboard-error" role="alert">
          {error}
        </p>
      ) : null}

      {status === "loading" ? <LoadingState label="Loading recurring templates…" /> : null}

      {status === "ready" && templates.length === 0 ? (
        <div className="ml-dashboard-empty">
          <h2>No recurring transactions yet</h2>
          <p>Add your salary, rent, or a subscription above — occurrences generate automatically as they come due.</p>
        </div>
      ) : null}

      {status === "ready" && templates.length > 0 ? (
        <ul className="ml-recurring-list">
          {templates.map((t) => (
            <li key={t.id} className={`ml-recurring-item ${t.status === "paused" ? "is-paused" : ""}`}>
              <div className="ml-recurring-main">
                <span className="ml-recurring-desc">{t.description}</span>
                <span className="ml-recurring-meta">
                  {FREQUENCY_LABEL[t.frequency]} · {t.categoryName || "Uncategorized"}
                  {t.status === "paused" ? " · Paused" : ""}
                </span>
              </div>
              <span className={`ml-recurring-amount ${t.type === "EXPENSE" ? "is-negative" : "is-positive"}`}>
                {t.type === "EXPENSE" ? "-" : "+"}
                {formatCurrency(t.amountMinor)}
              </span>
              <div className="ml-recurring-actions">
                <button type="button" onClick={() => toggleStatus(t)}>
                  {t.status === "active" ? "Pause" : "Resume"}
                </button>
                <button type="button" onClick={() => handleDelete(t.id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
