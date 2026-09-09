import { Router } from "express";
import db from "../db.js";
import { computeEmergencyFund } from "../services/emergencyFund.js";
import { computeAverageMonthlyFixed } from "../services/monthly.js";

const router = Router();

router.get("/", (req, res) => {
  try {
    const fixedBaseline = computeAverageMonthlyFixed(db);
    res.json(computeEmergencyFund(db, fixedBaseline));
  } catch {
    res.status(500).json({ message: "Failed to compute emergency fund" });
  }
});

router.patch("/", (req, res) => {
  try {
    const { targetMonths, currentReserve } = req.body;

    if (targetMonths !== undefined && (!Number.isFinite(Number(targetMonths)) || Number(targetMonths) <= 0)) {
      return res.status(400).json({ message: "Target months must be a positive number" });
    }

    const currentReserveMinor =
      currentReserve !== undefined ? Math.round(Number(currentReserve) * 100) : undefined;

    if (currentReserveMinor !== undefined && (!Number.isFinite(currentReserveMinor) || currentReserveMinor < 0)) {
      return res.status(400).json({ message: "Current reserve must be zero or a positive number" });
    }

    db.prepare(
      `UPDATE emergency_fund SET
        target_months = COALESCE(?, target_months),
        current_reserve_minor = COALESCE(?, current_reserve_minor),
        updated_at = datetime('now')
      WHERE id = 1`
    ).run(targetMonths !== undefined ? Number(targetMonths) : null, currentReserveMinor ?? null);

    const fixedBaseline = computeAverageMonthlyFixed(db);
    res.json(computeEmergencyFund(db, fixedBaseline));
  } catch {
    res.status(500).json({ message: "Failed to update emergency fund" });
  }
});

export default router;
