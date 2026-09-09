import { useRef, useState } from "react";
import { api } from "../api/client.js";
import { formatCurrency } from "../components/MetricCard.jsx";
import "./ImportExport.css";

export default function ImportExport() {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("idle");
  const [importedCount, setImportedCount] = useState(null);

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setImportedCount(null);
    setFileName(file.name);
    setStatus("previewing");

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = await api.previewImport(reader.result);
        setPreview(result);
        setStatus("ready");
      } catch (err) {
        setError(err.message);
        setStatus("idle");
      }
    };
    reader.onerror = () => {
      setError("Could not read that file.");
      setStatus("idle");
    };
    reader.readAsText(file);
  }

  async function handleConfirm() {
    if (!preview || preview.valid.length === 0) return;
    setStatus("importing");
    setError(null);
    try {
      const result = await api.commitImport(preview.valid);
      setImportedCount(result.imported);
      setPreview(null);
      setFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setStatus("idle");
    } catch (err) {
      setError(err.message);
      setStatus("ready");
    }
  }

  function handleCancel() {
    setPreview(null);
    setFileName(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="ml-import-export">
      <header className="ml-page-header">
        <p className="ml-eyebrow">System</p>
        <h1>Import / Export</h1>
        <p className="ml-page-subtitle">Your data, portable. Nothing here leaves your machine unless you choose.</p>
      </header>

      <section className="ml-export-section" aria-label="Export data">
        <h2 className="ml-section-heading">Export</h2>
        <div className="ml-export-buttons">
          <a className="ml-export-button" href="/api/export/transactions.csv" download>
            Download Transactions (CSV)
          </a>
          <a className="ml-export-button" href="/api/export/backup.json" download>
            Download Full Backup (JSON)
          </a>
        </div>
        <p className="ml-export-note">
          CSV includes your transaction ledger only. JSON includes everything — transactions, categories, budgets,
          recurring templates, debts, and emergency fund settings.
        </p>
      </section>

      <section className="ml-import-section" aria-label="Import data">
        <h2 className="ml-section-heading">Import</h2>
        <p className="ml-import-note">
          CSV must include <code>date</code>, <code>type</code>, and <code>amount</code> columns (optionally{" "}
          <code>category</code>, <code>description</code>, <code>isFixed</code>, <code>isEssential</code>,{" "}
          <code>notes</code>). Nothing is written until you review and confirm below.
        </p>

        <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} />

        {error ? (
          <p className="ml-dashboard-error" role="alert">
            {error}
          </p>
        ) : null}

        {importedCount !== null ? (
          <p className="ml-import-success">
            Imported {importedCount} transaction{importedCount === 1 ? "" : "s"} successfully.
          </p>
        ) : null}

        {status === "previewing" ? <p className="ml-text-faint">Validating {fileName}…</p> : null}

        {preview ? (
          <div className="ml-import-preview">
            <div className="ml-import-summary">
              <span className="is-positive">{preview.valid.length} ready to import</span>
              <span className="ml-text-faint">{preview.duplicates.length} duplicates skipped</span>
              <span className="is-negative">{preview.errors.length} rows with errors</span>
            </div>

            {preview.errors.length > 0 ? (
              <div className="ml-import-issues">
                <h3>Errors</h3>
                <ul>
                  {preview.errors.map((e) => (
                    <li key={e.row}>
                      Row {e.row}: {e.errors.join("; ")}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {preview.valid.length > 0 ? (
              <div className="ml-table-wrap">
                <table className="ml-table">
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">Type</th>
                      <th scope="col">Amount</th>
                      <th scope="col">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.valid.slice(0, 20).map((row) => (
                      <tr key={row.row}>
                        <td>{row.date}</td>
                        <td>{row.type}</td>
                        <td>{formatCurrency(row.amountMinor)}</td>
                        <td>{row.description || <span className="ml-text-faint">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.valid.length > 20 ? (
                  <p className="ml-text-faint" style={{ padding: "var(--ml-space-2) var(--ml-space-4)" }}>
                    …and {preview.valid.length - 20} more
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="ml-import-actions">
              <button type="button" onClick={handleConfirm} disabled={preview.valid.length === 0 || status === "importing"}>
                {status === "importing" ? "Importing…" : `Confirm Import (${preview.valid.length})`}
              </button>
              <button type="button" className="ml-import-cancel" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
