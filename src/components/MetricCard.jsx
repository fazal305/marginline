import "./MetricCard.css";

export function formatCurrency(amountMinor, currency = "PKR") {
  const amount = amountMinor / 100;
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

export default function MetricCard({ label, value, tone = "neutral", emphasize = false }) {
  return (
    <article className={`ml-metric-card${emphasize ? " is-emphasized" : ""} tone-${tone}`}>
      <p className="ml-metric-label">{label}</p>
      <p className="ml-metric-value ml-numeric">{value}</p>
    </article>
  );
}
