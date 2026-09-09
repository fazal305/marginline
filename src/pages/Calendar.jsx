import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { formatCurrency } from "../components/MetricCard.jsx";
import LoadingState from "../components/LoadingState.jsx";
import "./Calendar.css";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function firstWeekday(year, month) {
  return new Date(year, month - 1, 1).getDay();
}

function shiftMonth(month, delta) {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(year, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month) {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function Calendar() {
  const [month, setMonth] = useState(currentMonth());
  const [byDay, setByDay] = useState({});
  const [upcoming, setUpcoming] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    setStatus("loading");
    api
      .getCalendar(month)
      .then((data) => {
        setByDay(data.byDay);
        setUpcoming(data.upcoming);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [month]);

  const [year, m] = month.split("-").map(Number);
  const totalDays = daysInMonth(year, m);
  const leadingBlanks = firstWeekday(year, m);
  const cells = [...Array(leadingBlanks).fill(null), ...Array.from({ length: totalDays }, (_, i) => i + 1)];

  return (
    <div className="ml-calendar">
      <header className="ml-page-header">
        <p className="ml-eyebrow">Cash Flow</p>
        <h1>Calendar</h1>
        <p className="ml-page-subtitle">Upcoming obligations and daily transaction activity.</p>
      </header>

      <div className="ml-calendar-layout">
        <section>
          <div className="ml-calendar-nav">
            <button type="button" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month">
              ‹
            </button>
            <h2>{monthLabel(month)}</h2>
            <button type="button" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month">
              ›
            </button>
          </div>

          <div className="ml-calendar-grid">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="ml-calendar-weekday">
                {d}
              </div>
            ))}
            {cells.map((day, i) => {
              if (day === null) return <div key={`blank-${i}`} className="ml-calendar-cell is-blank" />;
              const data = byDay[day];
              return (
                <div key={day} className="ml-calendar-cell">
                  <span className="ml-calendar-day">{day}</span>
                  {data ? (
                    <div className="ml-calendar-figures">
                      {data.incomeMinor > 0 ? (
                        <span className="is-positive">+{formatCurrency(data.incomeMinor)}</span>
                      ) : null}
                      {data.expenseMinor > 0 ? (
                        <span className="is-negative">-{formatCurrency(data.expenseMinor)}</span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section aria-label="Upcoming obligations">
          <h2 className="ml-section-heading">Upcoming Obligations</h2>
          {status === "loading" ? <LoadingState label="Loading…" /> : null}
          {status === "ready" && upcoming.length === 0 ? (
            <p className="ml-text-faint">No recurring obligations in the next 45 days.</p>
          ) : null}
          {status === "ready" && upcoming.length > 0 ? (
            <ul className="ml-upcoming-list">
              {upcoming.map((item) => (
                <li key={`${item.templateId}-${item.date}`} className="ml-upcoming-item">
                  <div>
                    <p className="ml-upcoming-desc">{item.description}</p>
                    <p className="ml-upcoming-date">{item.date}</p>
                  </div>
                  <span className={item.type === "EXPENSE" ? "is-negative" : "is-positive"}>
                    {item.type === "EXPENSE" ? "-" : "+"}
                    {formatCurrency(item.amountMinor)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </div>
    </div>
  );
}
