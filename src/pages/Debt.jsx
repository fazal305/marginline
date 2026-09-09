import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { formatCurrency } from "../components/MetricCard.jsx";
import LoadingState from "../components/LoadingState.jsx";
import "./Debt.css";

const INITIAL_DRAFT = {
  name: "",
  originalBalance: "",
  currentBalance: "",
  interestRate: "",
  minPayment: "",
  extraPayment: ""
};

export default function Debt() {
  const [debts, setDebts] = useState([]);
  const [totals, setTotals] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState(INITIAL_DRAFT);

  function load() {
    setStatus("loading");
    api
      .getDebts()
      .then((data) => {
        setDebts(data.debts);
        setTotals(data.totals);
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
    if (!draft.name.trim() || !draft.originalBalance || !draft.currentBalance) {
      setError("Name, original balance, and current balance are required.");
      return;
    }
    setError(null);
    try {
      await api.createDebt({
        name: draft.name.trim(),
        originalBalance: Number(draft.originalBalance),
        currentBalance: Number(draft.currentBalance),
        interestRate: Number(draft.interestRate) || 0,
        minPayment: Number(draft.minPayment) || 0,
        extraPayment: Number(draft.extraPayment) || 0
      });
      setDraft(INITIAL_DRAFT);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this debt record?")) return;
    try {
      await api.deleteDebt(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="ml-debt">
      <header className="ml-page-header">
        <p className="ml-eyebrow">Planning</p>
        <h1>Debt</h1>
        <p className="ml-page-subtitle">Track balances, interest, and minimum obligations across your debts.</p>
      </header>

      {status === "ready" && totals && debts.length > 0 ? (
        <section className="ml-metric-grid" aria-label="Debt summary">
          <div className="ml-metric-card">
            <p className="ml-metric-label">Total Debt</p>
            <p className="ml-metric-value ml-numeric">{formatCurrency(totals.totalBalanceMinor)}</p>
          </div>
          <div className="ml-metric-card">
            <p className="ml-metric-label">Monthly Obligation</p>
            <p className="ml-metric-value ml-numeric">{formatCurrency(totals.totalMonthlyPaymentMinor)}</p>
          </div>
          <div className="ml-metric-card">
            <p className="ml-metric-label">Paid Down So Far</p>
            <p className="ml-metric-value ml-numeric">
              {formatCurrency(totals.totalOriginalMinor - totals.totalBalanceMinor)}
            </p>
          </div>
        </section>
      ) : null}

      <form className="ml-debt-form" onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="Debt name (e.g. Car loan)"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
        <input
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Original balance"
          value={draft.originalBalance}
          onChange={(e) => setDraft({ ...draft, originalBalance: e.target.value })}
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Current balance"
          value={draft.currentBalance}
          onChange={(e) => setDraft({ ...draft, currentBalance: e.target.value })}
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Interest rate %"
          value={draft.interestRate}
          onChange={(e) => setDraft({ ...draft, interestRate: e.target.value })}
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Min payment"
          value={draft.minPayment}
          onChange={(e) => setDraft({ ...draft, minPayment: e.target.value })}
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Extra payment"
          value={draft.extraPayment}
          onChange={(e) => setDraft({ ...draft, extraPayment: e.target.value })}
        />
        <button type="submit">Add Debt</button>
      </form>

      {error ? (
        <p className="ml-dashboard-error" role="alert">
          {error}
        </p>
      ) : null}

      {status === "loading" ? <LoadingState label="Loading debts…" /> : null}

      {status === "ready" && debts.length === 0 ? (
        <div className="ml-dashboard-empty">
          <h2>No debts tracked</h2>
          <p>This module is optional — add a debt above only if you want to track it here.</p>
        </div>
      ) : null}

      {status === "ready" && debts.length > 0 ? (
        <div className="ml-debt-list">
          {debts.map((debt) => (
            <div key={debt.id} className="ml-debt-card">
              <div className="ml-debt-card-header">
                <span className="ml-debt-name">{debt.name}</span>
                <button type="button" onClick={() => handleDelete(debt.id)}>
                  Delete
                </button>
              </div>
              <div className="ml-debt-card-figures">
                <div>
                  <p className="ml-debt-figure-label">Balance</p>
                  <p className="ml-debt-figure-value">{formatCurrency(debt.currentBalanceMinor)}</p>
                </div>
                <div>
                  <p className="ml-debt-figure-label">Rate</p>
                  <p className="ml-debt-figure-value">{debt.interestRate}%</p>
                </div>
                <div>
                  <p className="ml-debt-figure-label">Monthly Payment</p>
                  <p className="ml-debt-figure-value">
                    {formatCurrency(debt.minPaymentMinor + debt.extraPaymentMinor)}
                  </p>
                </div>
                <div>
                  <p className="ml-debt-figure-label">Est. Payoff</p>
                  <p className="ml-debt-figure-value">
                    {debt.payoffMonths === null
                      ? "Never at this rate"
                      : debt.payoffMonths === 0
                      ? "Paid off"
                      : `${debt.payoffMonths} mo`}
                  </p>
                </div>
              </div>
              <div className="ml-debt-track">
                <div
                  className="ml-debt-fill"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(100, (1 - debt.currentBalanceMinor / debt.originalBalanceMinor) * 100)
                    )}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <p className="ml-debt-note">
        Payoff estimates are a standard fixed-payment amortization calculation, not a guarantee — they assume your
        payment and rate stay constant.
      </p>
    </div>
  );
}
