import { Router } from "express";
import db from "../db.js";

const router = Router();

function serializeCategory(row) {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    essential: !!row.essential,
    icon: row.icon,
    color: row.color,
    archived: !!row.archived,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

router.get("/", (req, res) => {
  try {
    const includeArchived = req.query.includeArchived === "true";
    const rows = includeArchived
      ? db.prepare("SELECT * FROM categories ORDER BY kind, name").all()
      : db.prepare("SELECT * FROM categories WHERE archived = 0 ORDER BY kind, name").all();
    res.json(rows.map(serializeCategory));
  } catch {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

router.post("/", (req, res) => {
  try {
    const { name, kind, essential = false, icon = null, color = null } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }

    if (!["fixed", "variable"].includes(kind)) {
      return res.status(400).json({ message: "Kind must be 'fixed' or 'variable'" });
    }

    const result = db
      .prepare("INSERT INTO categories (name, kind, essential, icon, color) VALUES (?, ?, ?, ?, ?)")
      .run(name.trim(), kind, essential ? 1 : 0, icon, color);

    const row = db.prepare("SELECT * FROM categories WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(serializeCategory(row));
  } catch {
    res.status(500).json({ message: "Failed to create category" });
  }
});

router.patch("/:id", (req, res) => {
  try {
    const existing = db.prepare("SELECT * FROM categories WHERE id = ?").get(req.params.id);

    if (!existing) {
      return res.status(404).json({ message: "Category not found" });
    }

    const { name, kind, essential, icon, color, archived } = req.body;

    if (kind !== undefined && !["fixed", "variable"].includes(kind)) {
      return res.status(400).json({ message: "Kind must be 'fixed' or 'variable'" });
    }

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ message: "Category name cannot be empty" });
    }

    db.prepare(
      `UPDATE categories SET
        name = COALESCE(?, name),
        kind = COALESCE(?, kind),
        essential = COALESCE(?, essential),
        icon = COALESCE(?, icon),
        color = COALESCE(?, color),
        archived = COALESCE(?, archived),
        updated_at = datetime('now')
      WHERE id = ?`
    ).run(
      name !== undefined ? name.trim() : null,
      kind !== undefined ? kind : null,
      essential !== undefined ? (essential ? 1 : 0) : null,
      icon !== undefined ? icon : null,
      color !== undefined ? color : null,
      archived !== undefined ? (archived ? 1 : 0) : null,
      req.params.id
    );

    const row = db.prepare("SELECT * FROM categories WHERE id = ?").get(req.params.id);
    res.json(serializeCategory(row));
  } catch {
    res.status(500).json({ message: "Failed to update category" });
  }
});

export default router;
