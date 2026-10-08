import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { getStoredTheme, applyTheme } from "../theme.js";
import "./Settings.css";

const THEME_OPTIONS = [
  { value: "system", label: "Match System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" }
];

const CURRENCY_OPTIONS = [
  { value: "PKR", label: "PKR — Pakistani Rupee" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "SAR", label: "SAR — Saudi Riyal" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "AUD", label: "AUD — Australian Dollar" }
];

export default function Settings() {
  const [theme, setTheme] = useState(getStoredTheme());
  const [currency, setCurrency] = useState("PKR");
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState("");

  useEffect(() => {
    api
      .getSettings()
      .then((data) => {
        setCurrency(data.currency);
        setStatus("ready");
      })
      .catch((err) => {
        setError(err.message);
        setStatus("error");
      });
  }, []);

  function handleThemeChange(value) {
    setTheme(value);
    applyTheme(value);
  }

  async function handleCurrencySave() {
    setSavingCurrency(true);
    setError(null);
    try {
      await api.updateSettings({ currency });
      window.location.reload();
    } catch (err) {
      setError(err.message);
      setSavingCurrency(false);
    }
  }

  async function handleClearData() {
    if (clearConfirmText !== "DELETE") return;
    setClearing(true);
    setError(null);
    try {
      await api.clearAllData();
      window.location.reload();
    } catch (err) {
      setError(err.message);
      setClearing(false);
    }
  }

  return (
    <div className="ml-settings">
      <header className="ml-page-header">
        <p className="ml-eyebrow">System</p>
        <h1>Settings</h1>
        <p className="ml-page-subtitle">Appearance, currency, and data management.</p>
      </header>

      {error ? (
        <p className="ml-dashboard-error" role="alert">
          {error}
        </p>
      ) : null}

      <section className="ml-settings-section" aria-label="Appearance">
        <h2 className="ml-section-heading">Appearance</h2>
        <div className="ml-settings-radio-group" role="radiogroup" aria-label="Theme">
          {THEME_OPTIONS.map((opt) => (
            <label key={opt.value} className={`ml-theme-option ${theme === opt.value ? "is-active" : ""}`}>
              <input
                type="radio"
                name="theme"
                value={opt.value}
                checked={theme === opt.value}
                onChange={() => handleThemeChange(opt.value)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="ml-settings-section" aria-label="Currency">
        <h2 className="ml-section-heading">Currency</h2>
        <p className="ml-settings-note">
          Applies to how amounts are displayed throughout the app. This does not convert existing
          amounts — it changes the display format only.
        </p>
        {status === "ready" ? (
          <div className="ml-settings-row">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button type="button" onClick={handleCurrencySave} disabled={savingCurrency}>
              {savingCurrency ? "Saving…" : "Save & Reload"}
            </button>
          </div>
        ) : null}
      </section>

      <section className="ml-settings-section" aria-label="Data management">
        <h2 className="ml-section-heading">Data Management</h2>
        <div className="ml-settings-links">
          <Link to="/categories">Manage Categories</Link>
          <Link to="/import-export">Import / Export Data</Link>
        </div>

        <div className="ml-settings-danger">
          <h3>Clear All Data</h3>
          <p>
            Permanently deletes every transaction, budget, recurring template, and debt, and
            resets your emergency fund reserve to zero. Categories and accounts are kept.
            Export a backup first if you want to keep a copy — this cannot be undone.
          </p>
          <div className="ml-settings-row">
            <input
              type="text"
              placeholder='Type "DELETE" to confirm'
              value={clearConfirmText}
              onChange={(e) => setClearConfirmText(e.target.value)}
            />
            <button
              type="button"
              className="ml-danger-button"
              disabled={clearConfirmText !== "DELETE" || clearing}
              onClick={handleClearData}
            >
              {clearing ? "Clearing…" : "Clear All Data"}
            </button>
          </div>
        </div>
      </section>

      <p className="ml-settings-note">
        No push or email notifications are implemented yet. Budget and margin status are shown
        passively in the app (color-coded cards, the Budgets progress bars) rather than as a
        separate alert system.
      </p>
    </div>
  );
}
