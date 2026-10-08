import "./MetricCard.css";

const CURRENCY_STORAGE_KEY = "ml-currency";

function readStoredCurrency() {
  try {
    return localStorage.getItem(CURRENCY_STORAGE_KEY) || "PKR";
  } catch {
    return "PKR";
  }
}

let activeCurrency = readStoredCurrency();

export function setActiveCurrency(currency) {
  activeCurrency = currency;
  try {
    localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
  } catch {
    // localStorage unavailable - setting just won't persist across reloads
  }
}

export function getActiveCurrency() {
  return activeCurrency;
}

export function formatCurrency(amountMinor, currency = activeCurrency) {
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
