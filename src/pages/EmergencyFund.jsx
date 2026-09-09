import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { formatCurrency } from "../components/MetricCard.jsx";
import LoadingState from "../components/LoadingState.jsx";
import "./EmergencyFund.css";

export default function EmergencyFund() {
  const [fund, setFund] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [reserveDraft, setReserveDraft] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    setStatus("loading");
    api
      .getEmergencyFund()
      .then((data) => {
        setFund(data);
        setReserveDraft((data.currentReserveMinor / 100).toString());
        setStatus("ready");
      })
      .catch((err) => {
        setError(err.message);
        setStatus("error");
      });
  }

  useEffect(load, []);

  async function handleTargetChange(months) {
    try {
      const data = await api.updateEmergencyFund({ targetMonths: months });
      setFund(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleReserveSave(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const data = await api.updateEmergencyFund({ currentReserve: Number(reserveDraft) || 0 });
      setFund(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const presetMonths = [3, 4, 5, 6];
  const isCustom = fund && !presetMonths.includes(fund.targetMonths);

  return (
    <div className="ml-emergency-fund">
      <header className="ml-page-header">
        <p className="ml-eyebrow">Planning</p>
        <h1>Emergency Fund</h1>
        <p className="ml-page-subtitle">
          Your liquidity shield — a cash buffer sized against your fixed monthly baseline, not your income.
        </p>
      </header>

      {error ? (
        <p className="ml-dashboard-error" role="alert">
          {error}
        </p>
      ) : null}

      {status === "loading" ? <LoadingState label="Loading emergency fund…" /> : null}

      {status === "ready" && fund ? (
        <>
          {fund.fixedBaselineMinor === 0 ? (
            <div className="ml-dashboard-empty">
              <h2>Not enough history yet</h2>
              <p>Log some fixed expenses first — the target is based on your average monthly fixed baseline.</p>
            </div>
          ) : (
            <section className="ml-fund-panel">
              <div className="ml-fund-progress-row">
                <div>
                  <p className="ml-fund-label">Current Reserve</p>
                  <p className="ml-fund-value">{formatCurrency(fund.currentReserveMinor)}</p>
                </div>
                <div>
                  <p className="ml-fund-label">Target ({fund.targetMonths}mo)</p>
                  <p className="ml-fund-value">{formatCurrency(fund.targetMinor)}</p>
                </div>
                <div>
                  <p className="ml-fund-label">Remaining</p>
                  <p className="ml-fund-value">{formatCurrency(fund.remainingMinor)}</p>
                </div>
                <div>
                  <p className="ml-fund-label">Months Covered</p>
                  <p className="ml-fund-value">{fund.monthsCovered === null ? "—" : fund.monthsCovered.toFixed(1)}</p>
                </div>
              </div>

              <div className="ml-fund-track">
                <div className="ml-fund-fill" style={{ width: `${fund.progressPct}%` }} />
              </div>
              <p className="ml-fund-progress-label">{fund.progressPct.toFixed(0)}% of target</p>
            </section>
          )}

          <div className="ml-fund-controls">
            <div className="ml-fund-target-picker">
              <span>Target</span>
              {presetMonths.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={fund.targetMonths === m ? "is-active" : ""}
                  onClick={() => handleTargetChange(m)}
                >
                  {m} months
                </button>
              ))}
              <input
                type="number"
                min="1"
                step="0.5"
                placeholder={isCustom ? `Custom: ${fund.targetMonths}` : "Custom months"}
                className={isCustom ? "is-active" : ""}
                onBlur={(e) => e.target.value && handleTargetChange(Number(e.target.value))}
              />
            </div>

            <form className="ml-fund-reserve-form" onSubmit={handleReserveSave}>
              <label>
                <span>Update Current Reserve</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={reserveDraft}
                  onChange={(e) => setReserveDraft(e.target.value)}
                />
              </label>
              <button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </form>
          </div>

          <p className="ml-fund-note">
            This is planning support, not individualized financial advice. Update your reserve manually as your
            actual savings change.
          </p>
        </>
      ) : null}
    </div>
  );
}
