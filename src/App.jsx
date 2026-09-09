import { Routes, Route } from "react-router-dom";
import AppShell from "./components/AppShell.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Transactions from "./pages/Transactions.jsx";
import Categories from "./pages/Categories.jsx";
import MarginHealth from "./pages/MarginHealth.jsx";
import Recurring from "./pages/Recurring.jsx";
import Calendar from "./pages/Calendar.jsx";
import Budgets from "./pages/Budgets.jsx";
import EmergencyFund from "./pages/EmergencyFund.jsx";
import Debt from "./pages/Debt.jsx";
import Reports from "./pages/Reports.jsx";
import MonthlyReview from "./pages/MonthlyReview.jsx";
import ImportExport from "./pages/ImportExport.jsx";
import { Settings } from "./pages/stubs.jsx";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/margin-health" element={<MarginHealth />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/recurring" element={<Recurring />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/emergency-fund" element={<EmergencyFund />} />
        <Route path="/debt" element={<Debt />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/monthly-review" element={<MonthlyReview />} />
        <Route path="/import-export" element={<ImportExport />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </AppShell>
  );
}
