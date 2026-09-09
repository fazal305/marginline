import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { formatCurrency } from "../components/MetricCard.jsx";
import LoadingState from "../components/LoadingState.jsx";
import "./MonthlyReview.css";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

const TREND_LABEL = {
  EXPANDING: "Expanding",
  STABLE: "Stable",
  COMPRESSING: "Compressing",
  NEGATIVE: "Negative",
  INSUFFICIENT_DATA: "Insufficient Data"
};

const TREND_TONE = {
  EXPANDING: "positive",
  STABLE: "positive",
  COMPRESSING: "warning",
  NEGATIVE: "negative",
  INSUFFICIENT_DATA: "neutral"
};

function VarianceRow({ label, expectedLabel, expectedMinor, actualMinor, hasExpected, invert = false }) {
  const variance = hasExpected === false || expectedMinor === null || expectedMinor === undefined
    ? null
    : actualMinor - expectedMinor;
  const isGood = variance === null ? null : invert ? variance <= 0 : variance >= 0;
  return (
    <div className="ml-review-row">
      <span className="ml-review-row-label">{label}</span>
      <div className="ml-review-row-figures">
        <div>
          <p className="ml-review-figure-label">{expectedLabel}</p>
          <p className="ml-review-figure-value">
            {hasExpected === false ? "—" : formatCurrency(expectedMinor ?? 0)}
          </p>
        </div>
        <div>
          <p className="ml-review-figure-label">Actual</p>
          <p className="ml-review-figure-value">{formatCurrency(actualMinor)}</p>
        </div>
        <div>
          <p className="ml-review-figure-label">Variance</p>
          <p className={`ml-review-figure-value ${isGood === null ? "" : isGood ? "is-positive" : "is-negative"}`}>
            {variance === null ? "—" : formatCurrency(Math.abs(variance))}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MonthlyReview() {
  const [month, setMonth] = useState(currentMonth());
  const [review, setReview] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    setStatus("loading");
    api
      .getMonthlyReview(month)
      .then((data) => {
        setReview(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [month]);

  const hasData = review && (review.income.actualMinor > 0 || review.fixed.actualMinor > 0 || review.variable.actualMinor > 0);

  return (
    <div className="ml-monthly-review">
      <header className="ml-page-header">
        <p className="ml-eyebrow">Review</p>
        <h1>Monthly Review</h1>
        <p className="ml-page-subtitle">One screen to understand the month that just happened.</p>
      </header>

      <label className="ml-field" style={{ marginBottom: "var(--ml-space-5)" }}>
        <span>Month</span>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
      </label>

      {status === "loading" ? <LoadingState label="Loading monthly review…" /> : null}

      {status === "ready" && !hasData ? (
        <div className="ml-dashboard-empty">
          <h2>Nothing to review for {month}</h2>
          <p>Log some transactions for this month to generate a review.</p>
        </div>
      ) : null}

      {status === "ready" && hasData && review ? (
        <>
          <section className="ml-review-rows">
            <VarianceRow
              label="Income"
              expectedLabel="Expected"
              expectedMinor={review.income.expectedMinor}
              actualMinor={review.income.actualMinor}
              hasExpected={review.income.hasExpected}
            />
            <VarianceRow
              label="Fixed Spending"
              expectedLabel="Budget"
              expectedMinor={review.fixed.budgetMinor}
              actualMinor={review.fixed.actualMinor}
              hasExpected={review.fixed.hasBudget}
              invert
            />
            <VarianceRow
              label="Variable Spending"
              expectedLabel="Budget"
              expectedMinor={review.variable.budgetMinor}
              actualMinor={review.variable.actualMinor}
              hasExpected={review.variable.hasBudget}
              invert
            />
            <VarianceRow
              label="Margin"
              expectedLabel="Expected"
              expectedMinor={review.margin.expectedMinor}
              actualMinor={review.margin.actualMinor}
              hasExpected={review.margin.expectedMinor !== null}
            />
          </section>

          <div className={`ml-margin-trend tone-${TREND_TONE[review.margin.trend]}`}>
            <span>Margin Trend</span>
            <strong>{TREND_LABEL[review.margin.trend]}</strong>
          </div>

          <section className="ml-review-narrative">
            <NarrativeBlock title="What Improved" items={review.whatImproved} empty="Nothing notable improved this month." />
            <NarrativeBlock title="What Worsened" items={review.whatWorsened} empty="Nothing notable worsened this month." />

            <div className="ml-narrative-block">
              <h3>Biggest Variance</h3>
              {review.biggestVariance ? (
                <p>
                  {review.biggestVariance.categoryName}:{" "}
                  {review.biggestVariance.varianceMinor >= 0 ? "under" : "over"} budget by{" "}
                  {formatCurrency(Math.abs(review.biggestVariance.varianceMinor))}
                </p>
              ) : (
                <p className="ml-text-faint">No budgets set this month to compare against.</p>
              )}
            </div>

            <div className="ml-narrative-block">
              <h3>Biggest Spending Category</h3>
              {review.biggestCategory ? (
                <p>
                  {review.biggestCategory.categoryName} — {formatCurrency(review.biggestCategory.totalMinor)}
                </p>
              ) : (
                <p className="ml-text-faint">No expenses logged this month.</p>
              )}
            </div>

            <div className="ml-narrative-block">
              <h3>Recurring Changes</h3>
              {review.recurringChanges.length === 0 ? (
                <p className="ml-text-faint">No recurring amounts changed from last month.</p>
              ) : (
                <ul>
                  {review.recurringChanges.map((c) => (
                    <li key={c.description}>
                      {c.description}: {formatCurrency(c.previousMinor)} → {formatCurrency(c.currentMinor)}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="ml-narrative-block">
              <h3>Next Month Watchlist</h3>
              <ul>
                {review.nextMonthWatchlist.expectedFixedMinor > 0 ? (
                  <li>
                    {formatCurrency(review.nextMonthWatchlist.expectedFixedMinor)} in fixed obligations expected in{" "}
                    {review.nextMonthWatchlist.month}.
                  </li>
                ) : null}
                {review.nextMonthWatchlist.overBudgetCategories.map((c) => (
                  <li key={c.categoryId}>
                    {c.categoryName} was at {c.utilizationPct.toFixed(0)}% of budget — worth watching next month.
                  </li>
                ))}
                {review.nextMonthWatchlist.expectedFixedMinor === 0 &&
                review.nextMonthWatchlist.overBudgetCategories.length === 0 ? (
                  <li className="ml-text-faint">Nothing flagged for next month.</li>
                ) : null}
              </ul>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function NarrativeBlock({ title, items, empty }) {
  return (
    <div className="ml-narrative-block">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p className="ml-text-faint">{empty}</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
