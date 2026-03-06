const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Health
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// Rutas
const publicPropertiesRoutes = require("./routes/public.properties.routes");
const adminPropertiesRoutes = require("./routes/admin.properties.routes");

app.use("/api/public/properties", publicPropertiesRoutes);
app.use("/api/admin/properties", adminPropertiesRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ API corriendo en http://localhost:${PORT}`);
});