// backend/src/routes/public.properties.routes.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// Helper: adjuntar imágenes a las propiedades
async function attachImages(rows) {
  if (!rows || rows.length === 0) return [];

  const ids = rows.map(r => r.id);
  const [imgs] = await db.query(
    `
    SELECT property_id, url
    FROM property_images
    WHERE property_id IN (?)
    ORDER BY sort_order ASC, id ASC
    `,
    [ids]
  );

  const map = new Map();
  imgs.forEach(img => {
    if (!map.has(img.property_id)) map.set(img.property_id, []);
    map.get(img.property_id).push(img.url);
  });

  return rows.map(p => ({
    ...p,
    images: map.get(p.id) || []
  }));
}

/**
 * GET /api/public/properties
 * Filtros: zona, precioMax, operacion
 */
router.get("/", async (req, res) => {
  try {
    const zona = (req.query.zona || "").toLowerCase();
    const precioMax = Number(req.query.precioMax || 0);
    const operacion = (req.query.operacion || "").trim();

    const where = [];
    const params = [];

    if (zona) {
      where.push("LOWER(zona) LIKE ?");
      params.push(`%${zona}%`);
    }

    if (precioMax && !Number.isNaN(precioMax)) {
      where.push("precio <= ?");
      params.push(precioMax);
    }

    if (operacion) {
      where.push("tipo_operacion = ?");
      params.push(operacion);
    }

    const sql = `
      SELECT id, titulo, tipo, zona, precio,
             tipo_operacion AS tipoOperacion
      FROM properties
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY updated_at DESC
      LIMIT 200
    `;

    const [rows] = await db.query(sql, params);
    const result = await attachImages(rows);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error cargando propiedades" });
  }
});

/**
 * GET /api/public/properties/:id
 * Detalle de inmueble
 */
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const [rows] = await db.query(
      `
      SELECT id, titulo, tipo, zona, precio,
             tipo_operacion AS tipoOperacion
      FROM properties
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Inmueble no encontrado" });
    }

    const [imgs] = await db.query(
      `
      SELECT url
      FROM property_images
      WHERE property_id = ?
      ORDER BY sort_order ASC, id ASC
      `,
      [id]
    );

    res.json({
      ...rows[0],
      images: imgs.map(i => i.url)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error cargando inmueble" });
  }
});

module.exports = router;
