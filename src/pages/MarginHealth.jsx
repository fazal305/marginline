import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { formatCurrency } from "../components/MetricCard.jsx";
import LoadingState from "../components/LoadingState.jsx";
import "./MarginHealth.css";

const STATUS_LABEL = {
  HEALTHY: "Healthy",
  STABLE: "Stable",
  TIGHT: "Tight",
  NEGATIVE: "Negative",
  INSUFFICIENT_DATA: "Insufficient Data"
};

const STATUS_TONE = {
  HEALTHY: "positive",
  STABLE: "positive",
  TIGHT: "warning",
  NEGATIVE: "negative",
  INSUFFICIENT_DATA: "neutral"
};

const OPERATIONS_ORDER = [
  { title: "Protect Liquidity", description: "Keep enough cash on hand to absorb a shock before anything else." },
  { title: "Control High-Cost Debt", description: "Pay down the debt that's actively working against your margin." },
  { title: "Stabilize Monthly Margin", description: "Get income minus fixed and variable spending consistently positive." },
  { title: "Build Surplus", description: "Once margin is stable, let it accumulate into real reserves." },
  { title: "Make Long-Term Capital Decisions", description: "Only once the foundation above is solid." }
];

export default function MarginHealth() {
  const [health, setHealth] = useState(null);
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    Promise.all([api.getMarginHealth(), api.getSummary()])
      .then(([healthData, summaryData]) => {
        setHealth(healthData);
        setSummary(summaryData);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  const tone = health ? STATUS_TONE[health.status] || "neutral" : "neutral";

  return (
    <div className="ml-margin-health-page">
      <header className="ml-page-header">
        <p className="ml-eyebrow">Overview</p>
        <h1>Margin Health</h1>
        <p className="ml-page-subtitle">
          A rules-based read on your margin — not personalized financial advice, just what the numbers say.
        </p>
      </header>

      {status === "loading" ? <LoadingState label="Loading margin health…" /> : null}

      {status === "ready" && health ? (
        <section className={`ml-health-panel tone-${tone}`}>
          <p className="ml-health-status">{STATUS_LABEL[health.status] || health.status}</p>
          <p className="ml-health-reason">{health.reason}</p>
          {summary && summary.transactionCount > 0 ? (
            <dl className="ml-health-figures">
              <div>
                <dt>Net Income</dt>
                <dd>{formatCurrency(summary.netIncomeMinor)}</dd>
              </div>
              <div>
                <dt>Fixed Baseline</dt>
                <dd>{formatCurrency(summary.fixedExpensesMinor)}</dd>
              </div>
              <div>
                <dt>Margin Rate</dt>
                <dd>{summary.marginRate === null ? "—" : `${summary.marginRate.toFixed(1)}%`}</dd>
              </div>
              {health.fixedRatio !== undefined ? (
                <div>
                  <dt>Fixed / Income Ratio</dt>
                  <dd>{(health.fixedRatio * 100).toFixed(1)}%</dd>
                </div>
              ) : null}
            </dl>
          ) : null}
        </section>
      ) : null}

      <section aria-label="Financial operating order">
        <h2 className="ml-section-heading">The Financial Operating Order</h2>
        <p className="ml-operations-intro">
          The logic behind this system, in sequence — a general framework, not advice tailored to you.
        </p>
        <ol className="ml-operations-list">
          {OPERATIONS_ORDER.map((step, i) => (
            <li key={step.title}>
              <span className="ml-operations-index">{i + 1}</span>
              <div>
                <p className="ml-operations-title">{step.title}</p>
                <p className="ml-operations-description">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
