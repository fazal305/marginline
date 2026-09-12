import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { api } from "../api/client.js";
import { setActiveCurrency } from "./MetricCard.jsx";
import OfflineBanner from "./OfflineBanner.jsx";
import "./AppShell.css";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { to: "/", label: "Dashboard", end: true },
      { to: "/margin-health", label: "Margin Health" }
    ]
  },
  {
    label: "Cash Flow",
    items: [
      { to: "/transactions", label: "Transactions" },
      { to: "/categories", label: "Categories" },
      { to: "/recurring", label: "Recurring" },
      { to: "/calendar", label: "Calendar" }
    ]
  },
  {
    label: "Planning",
    items: [
      { to: "/budgets", label: "Budgets" },
      { to: "/emergency-fund", label: "Emergency Fund" },
      { to: "/debt", label: "Debt" }
    ]
  },
  {
    label: "Review",
    items: [
      { to: "/reports", label: "Reports" },
      { to: "/monthly-review", label: "Monthly Review" }
    ]
  },
  {
    label: "System",
    items: [
      { to: "/import-export", label: "Import / Export" },
      { to: "/settings", label: "Settings" }
    ]
  }
];

export default function AppShell({ children }) {
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    api
      .getDemoMode()
      .then((data) => setDemoMode(data.enabled))
      .catch(() => {});
    api
      .getSettings()
      .then((data) => setActiveCurrency(data.currency))
      .catch(() => {});
  }, []);

  return (
    <div className="ml-shell">
      <a className="ml-skip-link" href="#ml-main">
        Skip to main content
      </a>
      <OfflineBanner />
      {demoMode ? (
        <div className="ml-demo-banner" role="status">
          DEMO MODE — all figures shown are fictional sample data, not real financial information.
        </div>
      ) : null}
      <nav className="ml-nav" aria-label="Primary">
        <div className="ml-brand">
          <span className="ml-brand-mark" aria-hidden="true" />
          <span className="ml-brand-name">Marginline</span>
        </div>
        {NAV_SECTIONS.map((section) => (
          <div className="ml-nav-section" key={section.label}>
            <p className="ml-nav-heading">{section.label}</p>
            <ul>
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => "ml-nav-link" + (isActive ? " is-active" : "")}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <main id="ml-main" className="ml-main">
        {children}
      </main>
    </div>
  );
}
