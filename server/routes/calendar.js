import { Router } from "express";
import db from "../db.js";
import { computeCalendarMonth, computeUpcomingObligations } from "../services/calendarView.js";

const router = Router();
const MONTH_RE = /^\d{4}-\d{2}$/;

router.get("/", (req, res) => {
  try {
    const month = req.query.month;
    if (!month || !MONTH_RE.test(month)) {
      return res.status(400).json({ message: "month query param is required (YYYY-MM)" });
    }

    res.json({
      byDay: computeCalendarMonth(db, month),
      upcoming: computeUpcomingObligations(db)
    });
  } catch {
    res.status(500).json({ message: "Failed to compute calendar" });
  }
});

export default router;
