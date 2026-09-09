import { formatCurrency } from "./MetricCard.jsx";
import "./CashFlowChart.css";

const CHART_HEIGHT = 160;
const BAR_WIDTH = 16;
const GROUP_GAP = 28;

export default function CashFlowChart({ months }) {
  const maxValue = Math.max(
    1,
    ...months.map((m) => Math.max(m.incomeMinor, m.fixedMinor + m.variableMinor))
  );

  const groupWidth = BAR_WIDTH * 2 + 6;
  const chartWidth = months.length * (groupWidth + GROUP_GAP);

  function scale(value) {
    return (value / maxValue) * (CHART_HEIGHT - 24);
  }

  return (
    <div className="ml-chart">
      <svg
        viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT + 40}`}
        role="img"
        aria-labelledby="ml-chart-title"
        className="ml-chart-svg"
      >
        <title id="ml-chart-title">Monthly income versus fixed and variable expenses</title>
        {months.map((m, i) => {
          const x = i * (groupWidth + GROUP_GAP);
          const incomeHeight = scale(m.incomeMinor);
          const fixedHeight = scale(m.fixedMinor);
          const variableHeight = scale(m.variableMinor);
          const baseY = CHART_HEIGHT;
          const marginTone = m.marginMinor < 0 ? "negative" : m.incomeMinor === 0 ? "neutral" : "positive";

          return (
            <g key={m.month}>
              <rect
                x={x}
                y={baseY - incomeHeight}
                width={BAR_WIDTH}
                height={incomeHeight}
                rx="2"
                className="ml-bar-income"
              />
              <rect
                x={x + BAR_WIDTH + 6}
                y={baseY - fixedHeight}
                width={BAR_WIDTH}
                height={fixedHeight}
                rx="2"
                className="ml-bar-fixed"
              />
              <rect
                x={x + BAR_WIDTH + 6}
                y={baseY - fixedHeight - variableHeight}
                width={BAR_WIDTH}
                height={variableHeight}
                rx="2"
                className="ml-bar-variable"
              />
              <text x={x + groupWidth / 2} y={CHART_HEIGHT + 16} textAnchor="middle" className="ml-chart-label">
                {m.label}
              </text>
              <circle cx={x + groupWidth / 2} cy={8} r="3" className={`ml-margin-dot tone-${marginTone}`} />
            </g>
          );
        })}
      </svg>

      <div className="ml-chart-legend">
        <span>
          <i className="ml-legend-swatch swatch-income" /> Income
        </span>
        <span>
          <i className="ml-legend-swatch swatch-fixed" /> Fixed
        </span>
        <span>
          <i className="ml-legend-swatch swatch-variable" /> Variable
        </span>
        <span>
          <i className="ml-legend-swatch swatch-margin" /> Margin trend
        </span>
      </div>

      <table className="ml-visually-hidden">
        <caption>Monthly cash flow, income and expenses by month</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Income</th>
            <th scope="col">Fixed</th>
            <th scope="col">Variable</th>
            <th scope="col">Margin</th>
          </tr>
        </thead>
        <tbody>
          {months.map((m) => (
            <tr key={m.month}>
              <td>{m.label}</td>
              <td>{formatCurrency(m.incomeMinor)}</td>
              <td>{formatCurrency(m.fixedMinor)}</td>
              <td>{formatCurrency(m.variableMinor)}</td>
              <td>{formatCurrency(m.marginMinor)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
