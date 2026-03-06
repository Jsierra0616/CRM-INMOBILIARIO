// backend/src/routes/admin.properties.routes.js
const express = require("express");
const router = express.Router();
const db = require("../db");

/**
 * Helper: traer imágenes de una propiedad
 */
async function getImagesByPropertyId(propertyId) {
  const [rows] = await db.query(
    `SELECT url FROM property_images WHERE property_id = ? ORDER BY sort_order ASC, id ASC`,
    [propertyId]
  );
  return rows.map(r => r.url);
}

/**
 * GET /api/admin/properties
 * Devuelve todas las propiedades con images:[]
 */
router.get("/", async (req, res) => {
  try {
    const [props] = await db.query(
      `SELECT id, titulo, tipo, zona, precio, tipo_operacion AS tipoOperacion
       FROM properties
       ORDER BY updated_at DESC`
    );

    if (!props.length) return res.json([]);

    const ids = props.map(p => p.id);
    const [imgs] = await db.query(
      `SELECT property_id, url, sort_order
       FROM property_images
       WHERE property_id IN (?)
       ORDER BY property_id, sort_order ASC, id ASC`,
      [ids]
    );

    const map = new Map();
    imgs.forEach(img => {
      if (!map.has(img.property_id)) map.set(img.property_id, []);
      map.get(img.property_id).push(img.url);
    });

    res.json(
      props.map(p => ({
        ...p,
        images: map.get(p.id) || []
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error listando propiedades", error: String(err.message || err) });
  }
});

/**
 * POST /api/admin/properties
 * body: { titulo, tipo, zona, precio, tipoOperacion, images: [] }
 */
router.post("/", async (req, res) => {
  try {
    const { titulo, tipo, zona, precio, tipoOperacion, images } = req.body || {};

    if (!titulo || !zona || !precio) {
      return res.status(400).json({ message: "Faltan campos obligatorios (titulo, zona, precio)." });
    }

    const id = "P-" + Math.random().toString(36).slice(2, 10).toUpperCase();

    await db.query(
      `INSERT INTO properties (id, titulo, tipo, zona, precio, tipo_operacion)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, titulo, tipo || null, zona, Number(precio) || 0, tipoOperacion || null]
    );

    // imágenes (URLs)
    const urls = Array.isArray(images) ? images.filter(Boolean).slice(0, 5) : [];
    for (let i = 0; i < urls.length; i++) {
      await db.query(
        `INSERT INTO property_images (property_id, url, sort_order) VALUES (?, ?, ?)`,
        [id, urls[i], i + 1]
      );
    }

    const imgs = await getImagesByPropertyId(id);

    res.status(201).json({
      id,
      titulo,
      tipo: tipo || null,
      zona,
      precio: Number(precio) || 0,
      tipoOperacion: tipoOperacion || null,
      images: imgs
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creando propiedad", error: String(err.message || err) });
  }
});

/**
 * PUT /api/admin/properties/:id
 * body: { titulo, tipo, zona, precio, tipoOperacion, images: [] }
 */
router.put("/:id", async (req, res) => {
  try {
    const id = String(req.params.id);
    const { titulo, tipo, zona, precio, tipoOperacion, images } = req.body || {};

    if (!titulo || !zona || !precio) {
      return res.status(400).json({ message: "Faltan campos obligatorios (titulo, zona, precio)." });
    }

    const [exists] = await db.query(`SELECT id FROM properties WHERE id = ? LIMIT 1`, [id]);
    if (!exists.length) return res.status(404).json({ message: "Propiedad no encontrada" });

    await db.query(
      `UPDATE properties
       SET titulo = ?, tipo = ?, zona = ?, precio = ?, tipo_operacion = ?
       WHERE id = ?`,
      [titulo, tipo || null, zona, Number(precio) || 0, tipoOperacion || null, id]
    );

    // Reemplazar imágenes: borramos y reinsertamos
    await db.query(`DELETE FROM property_images WHERE property_id = ?`, [id]);

    const urls = Array.isArray(images) ? images.filter(Boolean).slice(0, 5) : [];
    for (let i = 0; i < urls.length; i++) {
      await db.query(
        `INSERT INTO property_images (property_id, url, sort_order) VALUES (?, ?, ?)`,
        [id, urls[i], i + 1]
      );
    }

    const imgs = await getImagesByPropertyId(id);

    res.json({
      id,
      titulo,
      tipo: tipo || null,
      zona,
      precio: Number(precio) || 0,
      tipoOperacion: tipoOperacion || null,
      images: imgs
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error actualizando propiedad", error: String(err.message || err) });
  }
});

/**
 * DELETE /api/admin/properties/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const id = String(req.params.id);
    await db.query(`DELETE FROM properties WHERE id = ?`, [id]); // cascada borra images
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error eliminando propiedad", error: String(err.message || err) });
  }
});

module.exports = router;
