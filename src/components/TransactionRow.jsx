import { useState } from "react";

const TYPE_LABEL = { INCOME: "Income", EXPENSE: "Expense", TRANSFER: "Transfer" };

export default function TransactionRow({ transaction, categories, onDelete, onUpdate, formatCurrency }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function startEdit() {
    setDraft({
      date: transaction.date,
      description: transaction.description || "",
      categoryId: transaction.categoryId ?? "",
      amount: (transaction.amountMinor / 100).toString(),
      isFixed: transaction.isFixed
    });
    setEditing(true);
    setError(null);
  }

  async function saveEdit() {
    const amountValue = Number(draft.amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }
    setSaving(true);
    try {
      await onUpdate({
        date: draft.date,
        description: draft.description.trim() || null,
        categoryId: draft.categoryId ? Number(draft.categoryId) : null,
        amount: amountValue,
        isFixed: draft.isFixed
      });
      setEditing(false);
    } catch (err) {
      setError(err.message || "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <tr className="ml-row is-editing">
        <td>
          <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
        </td>
        <td>
          <input
            type="text"
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            placeholder="Description"
          />
        </td>
        <td>
          <select value={draft.categoryId} onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}>
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </td>
        <td>{TYPE_LABEL[transaction.type]}</td>
        <td>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={draft.amount}
            onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
          />
        </td>
        <td className="ml-row-actions">
          <button type="button" onClick={saveEdit} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={() => setEditing(false)} disabled={saving}>
            Cancel
          </button>
          {error ? <p className="ml-row-error">{error}</p> : null}
        </td>
      </tr>
    );
  }

  const signedAmount =
    (transaction.type === "EXPENSE" ? "-" : transaction.type === "INCOME" ? "+" : "") +
    formatCurrency(transaction.amountMinor);

  return (
    <tr className="ml-row">
      <td>{transaction.date}</td>
      <td>{transaction.description || <span className="ml-text-faint">—</span>}</td>
      <td>{transaction.categoryName || <span className="ml-text-faint">Uncategorized</span>}</td>
      <td>
        <span className={`ml-type-badge type-${transaction.type.toLowerCase()}`}>
          {TYPE_LABEL[transaction.type]}
          {transaction.type === "EXPENSE" ? (transaction.isFixed ? " · Fixed" : " · Variable") : ""}
        </span>
      </td>
      <td className={`ml-numeric ml-amount ${transaction.type === "EXPENSE" ? "is-negative" : "is-positive"}`}>
        {signedAmount}
      </td>
      <td className="ml-row-actions">
        <button type="button" onClick={startEdit} aria-label={`Edit ${transaction.description || "transaction"}`}>
          Edit
        </button>
        <button type="button" onClick={onDelete} aria-label={`Delete ${transaction.description || "transaction"}`}>
          Delete
        </button>
      </td>
    </tr>
  );
}
