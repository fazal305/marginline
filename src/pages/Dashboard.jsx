import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import MetricCard, { formatCurrency } from "../components/MetricCard.jsx";
import MarginHealthCard from "../components/MarginHealthCard.jsx";
import CashFlowChart from "../components/CashFlowChart.jsx";
import SpendingBreakdown from "../components/SpendingBreakdown.jsx";
import LoadingState from "../components/LoadingState.jsx";
import "./Dashboard.css";

const EMPTY_SUMMARY = {
  netIncomeMinor: 0,
  fixedExpensesMinor: 0,
  variableExpensesMinor: 0,
  netMarginMinor: 0,
  marginRate: null,
  transactionCount: 0
};

function marginTone(summary) {
  if (summary.transactionCount === 0) return "neutral";
  if (summary.netMarginMinor < 0) return "negative";
  if (summary.marginRate !== null && summary.marginRate < 10) return "warning";
  return "positive";
}

export default function Dashboard() {
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [health, setHealth] = useState(null);
  const [months, setMonths] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    Promise.all([api.getSummary(), api.getMarginHealth(), api.getMonthlySummary(6), api.getBreakdown()])
      .then(([summaryData, healthData, monthsData, breakdownData]) => {
        if (cancelled) return;
        setSummary(summaryData);
        setHealth(healthData);
        setMonths(monthsData);
        setBreakdown(breakdownData);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const tone = marginTone(summary);
  const hasMonthlyActivity = months.some((m) => m.incomeMinor > 0 || m.fixedMinor > 0 || m.variableMinor > 0);

  return (
    <div className="ml-dashboard">
      <header className="ml-page-header">
        <p className="ml-eyebrow">Command Center</p>
        <h1>Dashboard</h1>
        <p className="ml-page-subtitle">Where your money stands right now.</p>
      </header>

      {status === "error" ? (
        <p className="ml-dashboard-error" role="alert">
          Couldn't reach the server. Make sure the backend is running.
        </p>
      ) : null}

      {status === "loading" ? <LoadingState label="Loading your financial snapshot…" /> : null}

      {status === "ready" ? (
        <section className="ml-metric-grid" aria-label="Financial snapshot">
          <MetricCard
            label="Net Margin"
            value={formatCurrency(summary.netMarginMinor)}
            tone={tone}
            emphasize
          />
          <MetricCard label="Net Income" value={formatCurrency(summary.netIncomeMinor)} />
          <MetricCard label="Fixed Baseline" value={formatCurrency(summary.fixedExpensesMinor)} />
          <MetricCard label="Variable Spending" value={formatCurrency(summary.variableExpensesMinor)} />
          <MetricCard
            label="Margin Rate"
            value={summary.marginRate === null ? "—" : `${summary.marginRate.toFixed(1)}%`}
            tone={tone}
          />
        </section>
      ) : null}

      {status === "ready" && summary.transactionCount === 0 ? (
        <div className="ml-dashboard-empty">
          <h2>No transactions yet</h2>
          <p>
            Log your first income or expense to start seeing your real net margin. The dashboard
            recalculates directly from your transaction ledger — nothing here is estimated.
          </p>
        </div>
      ) : null}

      {status === "ready" && summary.transactionCount > 0 ? (
        <>
          <MarginHealthCard health={health} />

          <div className="ml-dashboard-grid">
            <section aria-label="Monthly cash flow">
              <h2 className="ml-section-heading">Cash Flow, Last 6 Months</h2>
              {hasMonthlyActivity ? (
                <CashFlowChart months={months} />
              ) : (
                <p className="ml-text-faint">Not enough history yet to chart a trend.</p>
              )}
            </section>

            <section aria-label="Spending breakdown">
              <h2 className="ml-section-heading">Where Spending Goes</h2>
              {breakdown.length > 0 ? (
                <SpendingBreakdown items={breakdown} />
              ) : (
                <p className="ml-text-faint">No expenses logged yet.</p>
              )}
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
