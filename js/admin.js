/* ===========================================================
   ADMIN.JS — CRM INMOBILIARIO
   - Leads y Pipeline: localStorage
   - Propiedades: MySQL vía API (Node/Express)
   =========================================================== */

/* ===========================================================
   CONFIGURACIÓN API (backend)
   =========================================================== */
const API_BASE = "http://localhost:3000";

/* ===========================================================
   SECCIÓN 1 — UTILIDADES Y LOCAL STORAGE (Solo Leads)
   =========================================================== */

// Claves usadas en localStorage
const STORAGE_KEYS = {
  LEADS: "cmr_leads",
  PROPS: "cmr_props", // (se deja por compatibilidad, pero ya no se usa)
};

/* ---- LEADS (localStorage) ---- */

function loadLeads() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.LEADS) || "[]");
}

function saveLeads(list) {
  localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(list));
}

/* ---- GENERADOR DE ID ÚNICO ---- */
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

/* ===========================================================
   SECCIÓN 2 — PESTAÑAS
   =========================================================== */

const tabButtons = document.querySelectorAll(".tab-btn");
const tabSections = document.querySelectorAll(".tab-section");

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    tabButtons.forEach(b => b.classList.remove("active"));
    tabSections.forEach(s => s.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

/* ===========================================================
   SECCIÓN 3 — CRUD DE LEADS (localStorage)
   =========================================================== */

// Referencias a los campos del formulario
const leadForm = document.getElementById("leadForm");
const leadId = document.getElementById("leadId");
const leadNombre = document.getElementById("leadNombre");
const leadEmail = document.getElementById("leadEmail");
const leadTelefono = document.getElementById("leadTelefono");
const leadInteres = document.getElementById("leadInteres");
const leadCancelar = document.getElementById("leadCancelar");

// Donde se dibujan los leads
const leadTableBody = document.getElementById("leadTableBody");

/* ---- GUARDAR O EDITAR LEAD ---- */
if (leadForm) {
  leadForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const leads = loadLeads();

    const data = {
      nombre: leadNombre.value.trim(),
      email: leadEmail.value.trim(),
      telefono: leadTelefono.value.trim(),
      interes: leadInteres.value,
    };

    if (!data.nombre || !data.email || !data.telefono) {
      alert("Completa todos los campos del lead.");
      return;
    }

    if (leadId.value) {
      const idx = leads.findIndex(l => l.id === leadId.value);
      if (idx > -1) leads[idx] = { ...leads[idx], ...data };
    } else {
      leads.push({ id: uid(), ...data, etapa: "Nuevo" });
    }

    saveLeads(leads);

    leadForm.reset();
    leadId.value = "";

    renderLeads();
    renderPipeline();
  });
}

/* ---- BOTÓN CANCELAR ---- */
if (leadCancelar) {
  leadCancelar.addEventListener("click", () => {
    leadForm.reset();
    leadId.value = "";
  });
}

/* ---- DIBUJAR TABLA DE LEADS ---- */
function renderLeads() {
  if (!leadTableBody) return;

  const leads = loadLeads();
  leadTableBody.innerHTML = "";

  leads.forEach((l) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${l.nombre}</td>
      <td>${l.email}</td>
      <td>${l.telefono}</td>
      <td>${l.interes}</td>
      <td>
        <select data-stage="${l.id}">
          <option ${l.etapa==='Nuevo'?'selected':''}>Nuevo</option>
          <option ${l.etapa==='Contactado'?'selected':''}>Contactado</option>
          <option ${l.etapa==='En negociación'?'selected':''}>En negociación</option>
          <option ${l.etapa==='Cerrado'?'selected':''}>Cerrado</option>
        </select>
      </td>
      <td>
        <button class="btn small" data-edit="${l.id}">Editar</button>
        <button class="btn small danger" data-del="${l.id}">Eliminar</button>
      </td>
    `;

    leadTableBody.appendChild(tr);
  });

  // EDITAR
  leadTableBody.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-edit");
      const l = loadLeads().find(x => x.id === id);
      if (!l) return;

      leadId.value = l.id;
      leadNombre.value = l.nombre;
      leadEmail.value = l.email;
      leadTelefono.value = l.telefono;
      leadInteres.value = l.interes;

      document.querySelector('.tab-btn[data-tab="leads"]')?.click();
    });
  });

  // ELIMINAR
  leadTableBody.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-del");
      const filtered = loadLeads().filter(x => x.id !== id);
      saveLeads(filtered);
      renderLeads();
      renderPipeline();
    });
  });

  // CAMBIO DE ETAPA
  leadTableBody.querySelectorAll("[data-stage]").forEach(sel => {
    sel.addEventListener("change", () => {
      const id = sel.getAttribute("data-stage");
      const leads = loadLeads();
      const idx = leads.findIndex(x => x.id === id);

      if (idx > -1) {
        leads[idx].etapa = sel.value;
        saveLeads(leads);
        renderPipeline();
      }
    });
  });
}

/* ===========================================================
   SECCIÓN 4 — PIPELINE (localStorage)
   =========================================================== */

const COLS = {
  "Nuevo": document.getElementById("col-nuevo"),
  "Contactado": document.getElementById("col-contactado"),
  "En negociación": document.getElementById("col-negociacion"),
  "Cerrado": document.getElementById("col-cerrado"),
};

const ORDER = ["Nuevo", "Contactado", "En negociación", "Cerrado"];

function renderPipeline() {
  if (!COLS["Nuevo"]) return;

  Object.values(COLS).forEach(ul => ul && (ul.innerHTML = ""));

  const leads = loadLeads();

  leads.forEach(l => {
    const li = document.createElement("li");
    li.className = "card-lead";

    li.innerHTML = `
      <h4>${l.nombre}</h4>
      <p><b>Interés:</b> ${l.interes}</p>
      <p><b>Contacto:</b> ${l.email} · ${l.telefono}</p>

      <div class="btns">
        <button class="btn small" data-move="prev" data-id="${l.id}">← Atrás</button>
        <button class="btn small" data-move="next" data-id="${l.id}">Adelante →</button>
      </div>
    `;

    COLS[l.etapa]?.appendChild(li);
  });

  document.querySelectorAll("[data-move]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const dir = btn.getAttribute("data-move");

      const leads = loadLeads();
      const idx = leads.findIndex(x => x.id === id);
      if (idx < 0) return;

      const pos = ORDER.indexOf(leads[idx].etapa);

      if (dir === "prev" && pos > 0) leads[idx].etapa = ORDER[pos - 1];
      if (dir === "next" && pos < ORDER.length - 1) leads[idx].etapa = ORDER[pos + 1];

      saveLeads(leads);
      renderLeads();
      renderPipeline();
    });
  });
}

/* ===========================================================
   SECCIÓN 5 — PROPIEDADES (API + MySQL)
   =========================================================== */

// Referencias de formulario (propiedades)
const propForm = document.getElementById("propForm");
const propId = document.getElementById("propId");
const propTitulo = document.getElementById("propTitulo");
const propTipo = document.getElementById("propTipo");
const propOperacion = document.getElementById("propOperacion"); // ⚠️ Debe existir en admin.html
const propZona = document.getElementById("propZona");
const propPrecio = document.getElementById("propPrecio");
const propCancelar = document.getElementById("propCancelar");

// Donde se dibujan las tarjetas
const propCards = document.getElementById("propCards");

/* ---- API helpers ---- */

async function apiGetProps() {
  const r = await fetch(`${API_BASE}/api/admin/properties`);
  if (!r.ok) throw new Error("No se pudieron cargar propiedades");
  return await r.json();
}

async function apiCreateProp(data) {
  const r = await fetch(`${API_BASE}/api/admin/properties`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error("No se pudo crear la propiedad");
  return await r.json();
}

async function apiUpdateProp(id, data) {
  const r = await fetch(`${API_BASE}/api/admin/properties/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error("No se pudo actualizar la propiedad");
  return await r.json();
}

async function apiDeleteProp(id) {
  const r = await fetch(`${API_BASE}/api/admin/properties/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!r.ok) throw new Error("No se pudo eliminar la propiedad");
  return await r.json();
}

/* ---- GUARDAR O EDITAR PROPIEDAD (API) ---- */
if (propForm) {
  propForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const urls = Array.from(propForm.querySelectorAll(".imgUrl"))
      .map(i => i.value.trim())
      .filter(u => u)
      .slice(0, 5);

    const data = {
      titulo: propTitulo.value.trim(),
      tipo: propTipo.value || null,
      tipoOperacion: propOperacion ? (propOperacion.value || null) : null,
      zona: propZona.value.trim(),
      precio: Number(propPrecio.value || 0),
      images: urls,
    };

    if (!data.titulo || !data.zona || !data.precio) {
      alert("Completa los campos básicos de la propiedad.");
      return;
    }

    try {
      if (propId.value) {
        await apiUpdateProp(propId.value, data);
      } else {
        await apiCreateProp(data);
      }

      propForm.reset();
      propId.value = "";
      await renderProps();
      alert("Propiedad guardada en base de datos ✅");
    } catch (err) {
      console.error(err);
      alert("Error guardando la propiedad. Revisa consola (F12).");
    }
  });
}

/* ---- BOTÓN CANCELAR ---- */
if (propCancelar) {
  propCancelar.addEventListener("click", () => {
    propForm.reset();
    propId.value = "";
  });
}

/* ---- DIBUJAR PROPIEDADES DESDE API ---- */
async function renderProps() {
  if (!propCards) return;

  let props = [];
  try {
    props = await apiGetProps();
  } catch (err) {
    console.error(err);
    propCards.innerHTML = "<p>Error cargando propiedades desde la API.</p>";
    return;
  }

  propCards.innerHTML = "";

  props.forEach(p => {
    const card = document.createElement("article");
    card.className = "prop-card";

    // Galería
    const gallery = document.createElement("div");
    gallery.className = "prop-gallery";

    if (!p.images || p.images.length === 0) {
      const ph = document.createElement("div");
      ph.className = "placeholder";
      ph.textContent = "Sin imágenes";
      gallery.appendChild(ph);
    } else {
      p.images.slice(0, 5).forEach(url => {
        const img = document.createElement("img");
        img.src = url;
        img.alt = "Foto de " + (p.titulo || "Propiedad");
        gallery.appendChild(img);
      });
    }

    // Información
    const info = document.createElement("div");
    info.className = "prop-info";
    info.innerHTML = `
      <h3>${p.titulo}</h3>
      <p><b>Tipo:</b> ${p.tipo || "N/D"} — <b>Operación:</b> ${p.tipoOperacion || "N/D"}</p>
      <p><b>Zona:</b> ${p.zona || "N/D"}</p>
      <p><b>Precio:</b> $ ${Number(p.precio || 0).toLocaleString("es-CO")}</p>
    `;

    // Acciones
    const actions = document.createElement("div");
    actions.className = "prop-actions";
    actions.innerHTML = `
      <button class="btn small" data-edit="${p.id}">Editar</button>
      <button class="btn small danger" data-del="${p.id}">Eliminar</button>
    `;

    card.appendChild(gallery);
    card.appendChild(info);
    card.appendChild(actions);

    propCards.appendChild(card);
  });

  // EDITAR
  propCards.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-edit");

      let props = [];
      try {
        props = await apiGetProps();
      } catch (err) {
        console.error(err);
        alert("Error cargando para editar.");
        return;
      }

      const p = props.find(x => String(x.id) === String(id));
      if (!p) return;

      propId.value = p.id;
      propTitulo.value = p.titulo || "";
      propTipo.value = p.tipo || "";

      if (propOperacion) {
        // Si el select no tiene ese valor, intenta dejarlo
        propOperacion.value = p.tipoOperacion || "Compra";
      }

      propZona.value = p.zona || "";
      propPrecio.value = p.precio || 0;

      const inputs = propForm.querySelectorAll(".imgUrl");
      inputs.forEach((input, i) => {
        input.value = (p.images && p.images[i]) ? p.images[i] : "";
      });

      document.querySelector('.tab-btn[data-tab="propiedades"]')?.click();
    });
  });

  // ELIMINAR
  propCards.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-del");
      if (!confirm("¿Seguro que deseas eliminar esta propiedad?")) return;

      try {
        await apiDeleteProp(id);
        await renderProps();
      } catch (err) {
        console.error(err);
        alert("Error eliminando. Revisa consola (F12).");
      }
    });
  });
}

/* ===========================================================
   SECCIÓN 6 — DATOS INICIALES (solo Leads)
   =========================================================== */

(function seedIfEmpty() {
  // Si no hay leads, insertar unos de ejemplo
  if (loadLeads().length === 0) {
    saveLeads([
      {
        id: uid(),
        nombre: "Juan Gómez",
        email: "juan@correo.com",
        telefono: "3001112233",
        interes: "Compra",
        etapa: "Nuevo"
      },
      {
        id: uid(),
        nombre: "María Ruiz",
        email: "maria@correo.com",
        telefono: "3015558899",
        interes: "Arriendo",
        etapa: "Contactado"
      }
    ]);
  }
})();

/* ===========================================================
   RENDER INICIAL
   =========================================================== */

renderLeads();
renderPipeline();
renderProps();