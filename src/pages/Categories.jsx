import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import LoadingState from "../components/LoadingState.jsx";
import "./Categories.css";

const NEW_CATEGORY = { name: "", kind: "variable", essential: false };

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState(NEW_CATEGORY);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);

  function load() {
    setStatus("loading");
    api
      .getCategories()
      .then((data) => {
        setCategories(data);
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
    if (!draft.name.trim()) {
      setError("Category name is required.");
      return;
    }
    setError(null);
    try {
      await api.createCategory(draft);
      setDraft(NEW_CATEGORY);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(category) {
    setEditingId(category.id);
    setEditDraft({ name: category.name, kind: category.kind, essential: category.essential });
  }

  async function saveEdit(id) {
    try {
      await api.updateCategory(id, editDraft);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function archiveCategory(id) {
    if (!confirm("Archive this category? It stays on past transactions but won't be offered for new ones.")) return;
    try {
      await api.updateCategory(id, { archived: true });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const fixed = categories.filter((c) => c.kind === "fixed");
  const variable = categories.filter((c) => c.kind === "variable");

  return (
    <div className="ml-categories">
      <header className="ml-page-header">
        <p className="ml-eyebrow">Cash Flow</p>
        <h1>Categories</h1>
        <p className="ml-page-subtitle">
          Every category is fixed or variable, and essential or discretionary — this is what powers your margin
          breakdown.
        </p>
      </header>

      <form className="ml-category-form" onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="New category name"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          maxLength={60}
        />
        <select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value })}>
          <option value="variable">Variable</option>
          <option value="fixed">Fixed</option>
        </select>
        <label className="ml-checkbox">
          <input
            type="checkbox"
            checked={draft.essential}
            onChange={(e) => setDraft({ ...draft, essential: e.target.checked })}
          />
          <span>Essential</span>
        </label>
        <button type="submit">Add Category</button>
      </form>

      {error ? (
        <p className="ml-dashboard-error" role="alert">
          {error}
        </p>
      ) : null}

      {status === "loading" ? <LoadingState label="Loading categories…" /> : null}

      {status === "ready" ? (
        <div className="ml-category-groups">
          <CategoryGroup
            title="Fixed"
            categories={fixed}
            editingId={editingId}
            editDraft={editDraft}
            setEditDraft={setEditDraft}
            onStartEdit={startEdit}
            onSaveEdit={saveEdit}
            onCancelEdit={() => setEditingId(null)}
            onArchive={archiveCategory}
          />
          <CategoryGroup
            title="Variable"
            categories={variable}
            editingId={editingId}
            editDraft={editDraft}
            setEditDraft={setEditDraft}
            onStartEdit={startEdit}
            onSaveEdit={saveEdit}
            onCancelEdit={() => setEditingId(null)}
            onArchive={archiveCategory}
          />
        </div>
      ) : null}
    </div>
  );
}

function CategoryGroup({ title, categories, editingId, editDraft, setEditDraft, onStartEdit, onSaveEdit, onCancelEdit, onArchive }) {
  return (
    <section className="ml-category-group">
      <h2>{title}</h2>
      {categories.length === 0 ? (
        <p className="ml-text-faint">No {title.toLowerCase()} categories yet.</p>
      ) : (
        <ul>
          {categories.map((category) => (
            <li key={category.id} className="ml-category-item">
              {editingId === category.id ? (
                <div className="ml-category-edit">
                  <input
                    type="text"
                    value={editDraft.name}
                    onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                  />
                  <label className="ml-checkbox">
                    <input
                      type="checkbox"
                      checked={editDraft.essential}
                      onChange={(e) => setEditDraft({ ...editDraft, essential: e.target.checked })}
                    />
                    <span>Essential</span>
                  </label>
                  <button type="button" onClick={() => onSaveEdit(category.id)}>
                    Save
                  </button>
                  <button type="button" onClick={onCancelEdit}>
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <span className="ml-category-name">
                    {category.name}
                    {category.essential ? <span className="ml-essential-tag">Essential</span> : null}
                  </span>
                  <span className="ml-category-actions">
                    <button type="button" onClick={() => onStartEdit(category)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => onArchive(category.id)}>
                      Archive
                    </button>
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
