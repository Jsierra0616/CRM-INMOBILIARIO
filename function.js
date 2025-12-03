/* ==========================
   Util: almacenamiento local
========================== */
const STORAGE_KEYS = {
  LEADS: "cmr_leads",
  PROPS: "cmr_props",
};

function loadLeads() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.LEADS) || "[]");
}
function saveLeads(list) {
  localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(list));
}

function loadProps() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROPS) || "[]");
}
function saveProps(list) {
  localStorage.setItem(STORAGE_KEYS.PROPS, JSON.stringify(list));
}

/* ==========================
   Tabs
========================== */
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

/* ==========================
   Modelo simple
========================== */
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

/* ==========================
   CRUD Leads
========================== */
const leadForm = document.getElementById("leadForm");
const leadId = document.getElementById("leadId");
const leadNombre = document.getElementById("leadNombre");
const leadEmail = document.getElementById("leadEmail");
const leadTelefono = document.getElementById("leadTelefono");
const leadInteres = document.getElementById("leadInteres");
const leadCancelar = document.getElementById("leadCancelar");
const leadTableBody = document.getElementById("leadTableBody");

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

leadCancelar.addEventListener("click", () => {
  leadForm.reset();
  leadId.value = "";
});

function renderLeads() {
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

  // eventos
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
      document.querySelector('.tab-btn[data-tab="leads"]').click();
    });
  });

  leadTableBody.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-del");
      const filtered = loadLeads().filter(x => x.id !== id);
      saveLeads(filtered);
      renderLeads();
      renderPipeline();
    });
  });

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

/* ==========================
   Pipeline
========================== */
const COLS = {
  "Nuevo": document.getElementById("col-nuevo"),
  "Contactado": document.getElementById("col-contactado"),
  "En negociación": document.getElementById("col-negociacion"),
  "Cerrado": document.getElementById("col-cerrado"),
};
const ORDER = ["Nuevo", "Contactado", "En negociación", "Cerrado"];

function renderPipeline() {
  Object.values(COLS).forEach(ul => ul.innerHTML = "");
  const leads = loadLeads();

  leads.forEach(l => {
    const li = document.createElement("li");
    li.className = "card-lead";
    li.innerHTML = `
      <h4>${l.nombre}</h4>
      <p><b>Interés:</b> ${l.interes}</p>
      <p><b>Contacto:</b> ${l.email} · ${l.telefono}</p>
      <div class="btns">
        <button class="btn small" data-move="prev" data-id="${l.id}">← Mover atrás</button>
        <button class="btn small" data-move="next" data-id="${l.id}">Mover adelante →</button>
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

/* ==========================
   CRUD Propiedades (galería 5 URLs)
========================== */
const propForm = document.getElementById("propForm");
const propId = document.getElementById("propId");
const propTitulo = document.getElementById("propTitulo");
const propTipo = document.getElementById("propTipo");
const propZona = document.getElementById("propZona");
const propPrecio = document.getElementById("propPrecio");
const propCancelar = document.getElementById("propCancelar");
const propCards = document.getElementById("propCards");

propForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const props = loadProps();

  const urls = Array.from(propForm.querySelectorAll(".imgUrl"))
    .map(i => i.value.trim())
    .filter(u => u)
    .slice(0, 5);

  const data = {
    titulo: propTitulo.value.trim(),
    tipo: propTipo.value,
    zona: propZona.value.trim(),
    precio: Number(propPrecio.value || 0),
    images: urls,
  };

  if (!data.titulo || !data.zona || !data.precio) {
    alert("Completa los campos básicos de la propiedad.");
    return;
  }

  if (propId.value) {
    const idx = props.findIndex(p => p.id === propId.value);
    if (idx > -1) props[idx] = { ...props[idx], ...data };
  } else {
    props.push({ id: uid(), ...data });
  }

  saveProps(props);
  propForm.reset();
  propId.value = "";
  renderProps();
});

propCancelar.addEventListener("click", () => {
  propForm.reset();
  propId.value = "";
});

function renderProps() {
  const props = loadProps();
  propCards.innerHTML = "";

  props.forEach(p => {
    const card = document.createElement("article");
    card.className = "prop-card";

    // Galería (hasta 5)
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
        img.alt = "Foto propiedad " + p.titulo;
        gallery.appendChild(img);
      });
    }

    const info = document.createElement("div");
    info.className = "prop-info";
    info.innerHTML = `
      <h3>${p.titulo}</h3>
      <p><b>Tipo:</b> ${p.tipo} — <b>Zona:</b> ${p.zona}</p>
      <p><b>Precio:</b> $ ${Number(p.precio || 0).toLocaleString("es-CO")}</p>
    `;

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

  // listeners
  propCards.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-edit");
      const p = loadProps().find(x => x.id === id);
      if (!p) return;
      propId.value = p.id;
      propTitulo.value = p.titulo;
      propTipo.value = p.tipo;
      propZona.value = p.zona;
      propPrecio.value = p.precio;

      const inputs = propForm.querySelectorAll(".imgUrl");
      inputs.forEach((input, i) => input.value = (p.images && p.images[i]) ? p.images[i] : "");

      document.querySelector('.tab-btn[data-tab="propiedades"]').click();
    });
  });

  propCards.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-del");
      const filtered = loadProps().filter(x => x.id !== id);
      saveProps(filtered);
      renderProps();
    });
  });
}

/* ==========================
   Seed inicial (opcional)
========================== */
(function seedIfEmpty() {
  if (loadLeads().length === 0) {
    saveLeads([
      { id: uid(), nombre: "Juan Gómez", email: "juan@correo.com", telefono: "3001112233", interes: "Compra", etapa: "Nuevo" },
      { id: uid(), nombre: "María Ruiz", email: "maria@correo.com", telefono: "3015558899", interes: "Arriendo", etapa: "Contactado" }
    ]);
  }
  if (loadProps().length === 0) {
    saveProps([
      {
        id: uid(),
        titulo: "Apto 2H en Chapinero",
        tipo: "Apartamento",
        zona: "Chapinero",
        precio: 520000000,
        images: [
          "https://images.unsplash.com/photo-1505692794403-34d4982a83f0",
          "https://images.unsplash.com/photo-1505691938895-1758d7feb511"
        ]
      },
      {
        id: uid(),
        titulo: "Local Comercial Centro",
        tipo: "Local",
        zona: "Centro",
        precio: 350000000,
        images: []
      }
    ]);
  }
})();

/* ==========================
   Render inicial
========================== */
renderLeads();
renderPipeline();
renderProps();
