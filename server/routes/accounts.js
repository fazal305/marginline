import { Router } from "express";
import db from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM accounts WHERE archived = 0 ORDER BY name").all();
    res.json(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        archived: !!row.archived
      }))
    );
  } catch {
    res.status(500).json({ message: "Failed to fetch accounts" });
  }
});

export default router;
