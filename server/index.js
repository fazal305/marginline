import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import db from "./db.js";
import { computeSummary } from "./services/summary.js";
import { computeMarginHealth } from "./services/marginHealth.js";
import { computeMonthlySeries } from "./services/monthly.js";
import { computeSpendingBreakdown } from "./services/breakdown.js";
import { generateDueTransactions } from "./services/recurringEngine.js";
import transactionsRouter from "./routes/transactions.js";
import categoriesRouter from "./routes/categories.js";
import accountsRouter from "./routes/accounts.js";
import budgetsRouter from "./routes/budgets.js";
import recurringRouter from "./routes/recurring.js";
import calendarRouter from "./routes/calendar.js";
import emergencyFundRouter from "./routes/emergencyFund.js";
import debtsRouter from "./routes/debts.js";
import reportsRouter from "./routes/reports.js";
import dataTransferRouter from "./routes/dataTransfer.js";
import { seedDemoData } from "./demoSeed.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "*";
const DEMO_MODE = process.env.DEMO_MODE === "true";

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", database: "connected" });
});

app.get("/api/demo-mode", (req, res) => {
  res.json({ enabled: DEMO_MODE });
});

app.get("/api/summary", (req, res) => {
  try {
    res.json(computeSummary(db));
  } catch {
    res.status(500).json({ message: "Failed to compute summary" });
  }
});

app.get("/api/margin-health", (req, res) => {
  try {
    res.json(computeMarginHealth(computeSummary(db)));
  } catch {
    res.status(500).json({ message: "Failed to compute margin health" });
  }
});

app.get("/api/summary/monthly", (req, res) => {
  try {
    const months = Math.min(Math.max(Number(req.query.months) || 6, 1), 24);
    res.json(computeMonthlySeries(db, months));
  } catch {
    res.status(500).json({ message: "Failed to compute monthly series" });
  }
});

app.get("/api/summary/breakdown", (req, res) => {
  try {
    res.json(computeSpendingBreakdown(db));
  } catch {
    res.status(500).json({ message: "Failed to compute spending breakdown" });
  }
});

app.use("/api/transactions", transactionsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/accounts", accountsRouter);
app.use("/api/budgets", budgetsRouter);
app.use("/api/recurring", recurringRouter);
app.use("/api/calendar", calendarRouter);
app.use("/api/emergency-fund", emergencyFundRouter);
app.use("/api/debts", debtsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api", dataTransferRouter);

const distDir = path.join(__dirname, "..", "dist");
app.use(express.static(distDir));

app.get(/^\/(?!api).*/, (req, res, next) => {
  res.sendFile(path.join(distDir, "index.html"), (err) => {
    if (err) next();
  });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

if (DEMO_MODE) {
  seedDemoData(db);
}

generateDueTransactions(db);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
