import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { formatCurrency } from "../components/MetricCard.jsx";
import LoadingState from "../components/LoadingState.jsx";
import "./Reports.css";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function DeltaTag({ pct }) {
  if (pct === null) return <span className="ml-delta is-neutral">—</span>;
  const rounded = Math.round(pct);
  if (rounded === 0) return <span className="ml-delta is-neutral">No change</span>;
  const isUp = rounded > 0;
  return (
    <span className={`ml-delta ${isUp ? "is-up" : "is-down"}`}>
      {isUp ? "▲" : "▼"} {Math.abs(rounded)}%
    </span>
  );
}

export default function Reports() {
  const [month, setMonth] = useState(currentMonth());
  const [mom, setMom] = useState(null);
  const [leaks, setLeaks] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    setStatus("loading");
    Promise.all([api.getMomComparison(month), api.getLeaks(month), api.getForecast(month)])
      .then(([momData, leaksData, forecastData]) => {
        setMom(momData);
        setLeaks(leaksData);
        setForecast(forecastData);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [month]);

  const hasData = mom && (mom.current.incomeMinor > 0 || mom.previous.incomeMinor > 0);

  return (
    <div className="ml-reports">
      <header className="ml-page-header">
        <p className="ml-eyebrow">Review</p>
        <h1>Reports</h1>
        <p className="ml-page-subtitle">Month-over-month comparison and spending-leak detection.</p>
      </header>

      <label className="ml-field" style={{ marginBottom: "var(--ml-space-5)" }}>
        <span>Month</span>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
      </label>

      {status === "loading" ? <LoadingState label="Loading report…" /> : null}

      {status === "ready" && !hasData ? (
        <div className="ml-dashboard-empty">
          <h2>Not enough data for {month}</h2>
          <p>Log transactions for this month and the previous one to see a comparison.</p>
        </div>
      ) : null}

      {status === "ready" && hasData && mom ? (
        <>
          <section className="ml-mom-grid" aria-label="Month over month comparison">
            <MomCard label="Income" current={mom.current.incomeMinor} pct={mom.deltas.incomePct} />
            <MomCard label="Fixed" current={mom.current.fixedMinor} pct={mom.deltas.fixedPct} invert />
            <MomCard label="Variable" current={mom.current.variableMinor} pct={mom.deltas.variablePct} invert />
            <MomCard label="Margin" current={mom.current.marginMinor} pct={mom.deltas.marginPct} />
          </section>

          <section aria-label="Spending leaks" className="ml-leak-section">
            <h2 className="ml-section-heading">Leak Detector</h2>
            {leaks.length === 0 ? (
              <p className="ml-text-faint">No categories increased by 15% or more this month — nothing flagged.</p>
            ) : (
              <ul className="ml-leak-list">
                {leaks.map((leak) => (
                  <li key={leak.categoryId} className="ml-leak-item">
                    <span>{leak.message}</span>
                    <span className="ml-leak-figures">
                      {formatCurrency(leak.previousMinor)} → {formatCurrency(leak.currentMinor)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {forecast && forecast.hasAnyBasis ? (
            <section aria-label="Cash flow forecast" className="ml-forecast-section">
              <h2 className="ml-section-heading">Cash-Flow Forecast — {forecast.month}</h2>
              <p className="ml-forecast-note">
                FORECAST, not actual — income/fixed from your recurring templates, variable from your recent
                average. Never treat this as a guaranteed balance.
              </p>
              <div className="ml-forecast-grid">
                <div>
                  <p className="ml-metric-label">Income</p>
                  <p className="ml-metric-value ml-numeric">{formatCurrency(forecast.forecastIncomeMinor)}</p>
                </div>
                <div>
                  <p className="ml-metric-label">Fixed</p>
                  <p className="ml-metric-value ml-numeric">{formatCurrency(forecast.forecastFixedMinor)}</p>
                </div>
                <div>
                  <p className="ml-metric-label">Variable (avg)</p>
                  <p className="ml-metric-value ml-numeric">{formatCurrency(forecast.forecastVariableMinor)}</p>
                </div>
                <div>
                  <p className="ml-metric-label">Forecast Margin</p>
                  <p className="ml-metric-value ml-numeric">{formatCurrency(forecast.forecastMarginMinor)}</p>
                </div>
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function MomCard({ label, current, pct, invert = false }) {
  const isImprovement = pct === null ? null : invert ? pct < 0 : pct > 0;
  return (
    <div className="ml-mom-card">
      <p className="ml-metric-label">{label}</p>
      <p className="ml-metric-value ml-numeric">{formatCurrency(current)}</p>
      <span className={isImprovement === null ? "" : isImprovement ? "ml-mom-good" : "ml-mom-bad"}>
        <DeltaTag pct={pct} />
      </span>
    </div>
  );
}
