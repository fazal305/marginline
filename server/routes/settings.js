import { Router } from "express";
import db from "../db.js";

const router = Router();
const VALID_CURRENCIES = ["PKR", "USD", "EUR", "GBP", "INR", "AED", "SAR", "CAD", "AUD"];

router.get("/", (req, res) => {
  try {
    const row = db.prepare("SELECT currency FROM app_settings WHERE id = 1").get();
    res.json({ currency: row.currency });
  } catch {
    res.status(500).json({ message: "Failed to fetch settings" });
  }
});

router.patch("/", (req, res) => {
  try {
    const { currency } = req.body;

    if (currency !== undefined && !VALID_CURRENCIES.includes(currency)) {
      return res.status(400).json({ message: "Unsupported currency code" });
    }

    db.prepare(
      "UPDATE app_settings SET currency = COALESCE(?, currency), updated_at = datetime('now') WHERE id = 1"
    ).run(currency ?? null);

    const row = db.prepare("SELECT currency FROM app_settings WHERE id = 1").get();
    res.json({ currency: row.currency });
  } catch {
    res.status(500).json({ message: "Failed to update settings" });
  }
});

export default router;
