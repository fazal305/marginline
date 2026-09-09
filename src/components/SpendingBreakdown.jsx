import { formatCurrency } from "./MetricCard.jsx";
import "./SpendingBreakdown.css";

export default function SpendingBreakdown({ items }) {
  const maxValue = Math.max(1, ...items.map((i) => i.totalMinor));

  return (
    <ul className="ml-breakdown">
      {items.map((item) => (
        <li key={item.categoryId ?? "uncategorized"} className="ml-breakdown-row">
          <span className="ml-breakdown-name">{item.categoryName}</span>
          <span className="ml-breakdown-bar-track">
            <span
              className="ml-breakdown-bar-fill"
              style={{ width: `${Math.max(4, (item.totalMinor / maxValue) * 100)}%` }}
            />
          </span>
          <span className="ml-breakdown-value ml-numeric">{formatCurrency(item.totalMinor)}</span>
        </li>
      ))}
    </ul>
  );
}
