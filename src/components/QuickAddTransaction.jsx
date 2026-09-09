import { useState } from "react";
import { api } from "../api/client.js";
import "./QuickAddTransaction.css";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const INITIAL_STATE = {
  amount: "",
  type: "EXPENSE",
  categoryId: "",
  accountId: "",
  isFixed: false,
  isEssential: false,
  date: todayISO(),
  description: ""
};

export default function QuickAddTransaction({ categories, accounts, onCreated }) {
  const [form, setForm] = useState(INITIAL_STATE);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleCategoryChange(categoryId) {
    const category = categories.find((c) => String(c.id) === categoryId);
    setForm((prev) => ({
      ...prev,
      categoryId,
      isFixed: category ? category.kind === "fixed" : prev.isFixed,
      isEssential: category ? category.essential : prev.isEssential
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    const amountValue = Number(form.amount);
    if (!form.amount || !Number.isFinite(amountValue) || amountValue <= 0) {
      setError("Enter a valid amount greater than zero.");
      return;
    }
    if (!form.date) {
      setError("Date is required.");
      return;
    }

    setSaving(true);
    try {
      await api.createTransaction({
        date: form.date,
        type: form.type,
        amount: amountValue,
        categoryId: form.type === "TRANSFER" ? null : form.categoryId ? Number(form.categoryId) : null,
        accountId: form.accountId ? Number(form.accountId) : null,
        isFixed: form.type === "TRANSFER" ? false : form.isFixed,
        isEssential: form.type === "TRANSFER" ? false : form.isEssential,
        description: form.description.trim() || null
      });
      setForm({ ...INITIAL_STATE, date: form.date });
      onCreated?.();
    } catch (err) {
      setError(err.message || "Could not save transaction.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="ml-quick-add" onSubmit={handleSubmit}>
      <div className="ml-quick-add-row">
        <label className="ml-field">
          <span>Amount</span>
          <input
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => update("amount", e.target.value)}
            required
          />
        </label>

        <label className="ml-field">
          <span>Type</span>
          <select value={form.type} onChange={(e) => update("type", e.target.value)}>
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
            <option value="TRANSFER">Transfer</option>
          </select>
        </label>

        {form.type !== "TRANSFER" ? (
          <label className="ml-field">
            <span>Category</span>
            <select value={form.categoryId} onChange={(e) => handleCategoryChange(e.target.value)}>
              <option value="">None</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="ml-field">
          <span>Account</span>
          <select value={form.accountId} onChange={(e) => update("accountId", e.target.value)}>
            <option value="">None</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>

        <label className="ml-field">
          <span>Date</span>
          <input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} required />
        </label>
      </div>

      <div className="ml-quick-add-row">
        <label className="ml-field ml-field-wide">
          <span>Description</span>
          <input
            type="text"
            placeholder="Optional"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            maxLength={120}
          />
        </label>

        {form.type !== "TRANSFER" ? (
          <label className="ml-checkbox">
            <input
              type="checkbox"
              checked={form.isFixed}
              onChange={(e) => update("isFixed", e.target.checked)}
            />
            <span>Fixed</span>
          </label>
        ) : null}

        {form.type !== "TRANSFER" ? (
          <label className="ml-checkbox">
            <input
              type="checkbox"
              checked={form.isEssential}
              onChange={(e) => update("isEssential", e.target.checked)}
            />
            <span>Essential</span>
          </label>
        ) : null}

        <button type="submit" className="ml-quick-add-submit" disabled={saving}>
          {saving ? "Saving…" : "Add Transaction"}
        </button>
      </div>

      {error ? (
        <p className="ml-quick-add-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
