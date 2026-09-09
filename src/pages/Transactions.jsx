import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client.js";
import QuickAddTransaction from "../components/QuickAddTransaction.jsx";
import { formatCurrency } from "../components/MetricCard.jsx";
import TransactionRow from "../components/TransactionRow.jsx";
import LoadingState from "../components/LoadingState.jsx";
import "./Transactions.css";

const EMPTY_FILTERS = {
  search: "",
  type: "",
  isFixed: "",
  categoryId: "",
  dateFrom: "",
  dateTo: ""
};

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  const loadTransactions = useCallback((activeFilters) => {
    setStatus("loading");
    api
      .getTransactions(activeFilters)
      .then((data) => {
        setTransactions(data);
        setStatus("ready");
      })
      .catch((err) => {
        setError(err.message);
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    Promise.all([api.getCategories(), api.getAccounts()])
      .then(([cats, accts]) => {
        setCategories(cats);
        setAccounts(accts);
      })
      .catch((err) => setError(err.message));
    loadTransactions(EMPTY_FILTERS);
  }, [loadTransactions]);

  useEffect(() => {
    const timeout = setTimeout(() => loadTransactions(filters), 250);
    return () => clearTimeout(timeout);
  }, [filters, loadTransactions]);

  function updateFilter(field, value) {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }

  async function handleDelete(id) {
    if (!confirm("Delete this transaction?")) return;
    try {
      await api.deleteTransaction(id);
      loadTransactions(filters);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdate(id, payload) {
    await api.updateTransaction(id, payload);
    loadTransactions(filters);
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <div className="ml-transactions">
      <header className="ml-page-header">
        <p className="ml-eyebrow">Cash Flow</p>
        <h1>Transactions</h1>
        <p className="ml-page-subtitle">Every income, expense, and transfer — logged in seconds.</p>
      </header>

      <QuickAddTransaction categories={categories} accounts={accounts} onCreated={() => loadTransactions(filters)} />

      <div className="ml-filter-bar" role="search">
        <input
          type="search"
          placeholder="Search description or notes…"
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
          aria-label="Search transactions"
        />
        <select value={filters.type} onChange={(e) => updateFilter("type", e.target.value)} aria-label="Filter by type">
          <option value="">All types</option>
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
          <option value="TRANSFER">Transfer</option>
        </select>
        <select
          value={filters.isFixed}
          onChange={(e) => updateFilter("isFixed", e.target.value)}
          aria-label="Filter by fixed or variable"
        >
          <option value="">Fixed + Variable</option>
          <option value="true">Fixed only</option>
          <option value="false">Variable only</option>
        </select>
        <select
          value={filters.categoryId}
          onChange={(e) => updateFilter("categoryId", e.target.value)}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => updateFilter("dateFrom", e.target.value)}
          aria-label="From date"
        />
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => updateFilter("dateTo", e.target.value)}
          aria-label="To date"
        />
        {hasActiveFilters ? (
          <button type="button" className="ml-filter-clear" onClick={() => setFilters(EMPTY_FILTERS)}>
            Clear filters
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="ml-dashboard-error" role="alert">
          {error}
        </p>
      ) : null}

      {status === "loading" ? <LoadingState label="Loading transactions…" /> : null}

      {status === "ready" && transactions.length === 0 ? (
        <div className="ml-dashboard-empty">
          <h2>{hasActiveFilters ? "No transactions match your filters" : "No transactions yet"}</h2>
          <p>
            {hasActiveFilters
              ? "Try widening your search or clearing filters."
              : "Use the form above to log your first income or expense."}
          </p>
        </div>
      ) : null}

      {status === "ready" && transactions.length > 0 ? (
        <div className="ml-table-wrap">
          <table className="ml-table">
            <caption className="ml-visually-hidden">Transaction ledger</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Description</th>
                <th scope="col">Category</th>
                <th scope="col">Type</th>
                <th scope="col">Amount</th>
                <th scope="col">
                  <span className="ml-visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  transaction={tx}
                  categories={categories}
                  onDelete={() => handleDelete(tx.id)}
                  onUpdate={(payload) => handleUpdate(tx.id, payload)}
                  formatCurrency={formatCurrency}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
