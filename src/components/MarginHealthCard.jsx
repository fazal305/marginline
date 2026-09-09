import { Link } from "react-router-dom";
import "./MarginHealthCard.css";

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

export default function MarginHealthCard({ health }) {
  if (!health) return null;

  const tone = STATUS_TONE[health.status] || "neutral";

  return (
    <Link to="/margin-health" className={`ml-margin-health-card tone-${tone}`}>
      <div>
        <p className="ml-margin-health-label">Margin Health</p>
        <p className="ml-margin-health-status">{STATUS_LABEL[health.status] || health.status}</p>
      </div>
      <p className="ml-margin-health-reason">{health.reason}</p>
    </Link>
  );
}
