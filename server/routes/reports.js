import { Router } from "express";
import db from "../db.js";
import { computeMomComparison } from "../services/momComparison.js";
import { detectSpendingLeaks } from "../services/leakDetector.js";
import { computeMonthlyReview } from "../services/monthlyReviewService.js";
import { computeCashFlowForecast } from "../services/cashFlowForecast.js";

const router = Router();
const MONTH_RE = /^\d{4}-\d{2}$/;

function requireMonth(req, res) {
  const month = req.query.month;
  if (!month || !MONTH_RE.test(month)) {
    res.status(400).json({ message: "month query param is required (YYYY-MM)" });
    return null;
  }
  return month;
}

router.get("/mom", (req, res) => {
  try {
    const month = requireMonth(req, res);
    if (!month) return;
    res.json(computeMomComparison(db, month));
  } catch {
    res.status(500).json({ message: "Failed to compute month-over-month comparison" });
  }
});

router.get("/leaks", (req, res) => {
  try {
    const month = requireMonth(req, res);
    if (!month) return;
    res.json(detectSpendingLeaks(db, month));
  } catch {
    res.status(500).json({ message: "Failed to detect spending leaks" });
  }
});

router.get("/monthly-review", (req, res) => {
  try {
    const month = requireMonth(req, res);
    if (!month) return;
    res.json(computeMonthlyReview(db, month));
  } catch {
    res.status(500).json({ message: "Failed to compute monthly review" });
  }
});

router.get("/forecast", (req, res) => {
  try {
    const month = requireMonth(req, res);
    if (!month) return;
    res.json(computeCashFlowForecast(db, month));
  } catch {
    res.status(500).json({ message: "Failed to compute cash flow forecast" });
  }
});

export default router;
