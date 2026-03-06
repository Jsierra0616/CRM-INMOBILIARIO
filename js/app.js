/* ============================================================
   CONFIGURACIÓN GLOBAL
   ============================================================ */

// URL base de la API (backend en Node)
const API_BASE = "http://localhost:3000";

/* ============================================================
   FUNCIÓN COMPARTIDA: cargar propiedades desde la API
   ============================================================ */

async function loadPublicProps(filters = {}) {
  const qs = new URLSearchParams();

  if (filters.zona) qs.set("zona", filters.zona);
  if (filters.precioMax) qs.set("precioMax", filters.precioMax);
  if (filters.oper && filters.oper !== "todos") {
    qs.set("operacion", filters.oper);
  }

  const response = await fetch(`${API_BASE}/api/public/properties?${qs.toString()}`);

  if (!response.ok) {
    throw new Error("Error cargando propiedades");
  }

  return await response.json();
}

/* ============================================================
   EVENTO PRINCIPAL
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

  const listContainer   = document.getElementById("publicProps");
  const detailContainer = document.getElementById("detallePropiedad");

  /* ==========================================================
     1) LISTADO PÚBLICO (index.html)
     ========================================================== */
  if (listContainer) {

    const filtroZona   = document.getElementById("filterZona");
    const filtroPrecio = document.getElementById("filterPrecio");
    const filtroOper   = document.getElementById("filterOperacion");
    const btnFiltrar   = document.getElementById("btnFiltrar");

    async function renderListado() {
      const zona      = (filtroZona?.value || "").trim().toLowerCase();
      const precioMax = Number(filtroPrecio?.value || 0);
      const oper      = filtroOper?.value || "todos";

      let propiedades = [];

      try {
        propiedades = await loadPublicProps({ zona, precioMax, oper });
      } catch (error) {
        listContainer.innerHTML = "<p>Error cargando inmuebles.</p>";
        return;
      }

      listContainer.innerHTML = "";

      if (propiedades.length === 0) {
        listContainer.innerHTML = "<p>No se encontraron inmuebles.</p>";
        return;
      }

      propiedades.forEach(p => {
        const card = document.createElement("article");
        card.className = "prop-card";

        const imgSrc = (p.images && p.images.length > 0)
          ? p.images[0]
          : "https://via.placeholder.com/300x200?text=Sin+imagen";

        card.innerHTML = `
          <div class="prop-gallery">
            <img src="${imgSrc}" alt="Foto de ${p.titulo}">
          </div>

          <div class="prop-info">
            <h3>${p.titulo}</h3>
            <p><b>Tipo:</b> ${p.tipo || "N/D"} — <b>Zona:</b> ${p.zona || "N/D"}</p>
            <p><b>Precio:</b> $ ${Number(p.precio || 0).toLocaleString("es-CO")}</p>
          </div>

          <div class="prop-actions">
            <a class="btn primary" href="detalle.html?id=${p.id}">
              Ver detalle
            </a>
          </div>
        `;

        listContainer.appendChild(card);
      });
    }

    // Render inicial
    renderListado();

    if (btnFiltrar) {
      btnFiltrar.addEventListener("click", renderListado);
    }
  }

  /* ==========================================================
     2) DETALLE DE INMUEBLE (detalle.html)
     ========================================================== */
  if (detailContainer) {

    (async () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");

      let propiedades = [];

      try {
        propiedades = await loadPublicProps();
      } catch (error) {
        detailContainer.innerHTML = "<p>Error cargando el inmueble.</p>";
        return;
      }

      const prop = propiedades.find(p => String(p.id) === String(id));

      if (!prop) {
        detailContainer.innerHTML = "<p>Inmueble no encontrado.</p>";
        return;
      }

      let galeriaHTML = "";

      if (prop.images && prop.images.length > 0) {
        prop.images.forEach(url => {
          galeriaHTML += `
            <img src="${url}"
                 alt="Foto de ${prop.titulo}"
                 style="width:100%; margin-bottom:10px; border-radius:8px;">
          `;
        });
      } else {
        galeriaHTML = "<p>Este inmueble no tiene fotos.</p>";
      }

      detailContainer.innerHTML = `
        <h2>${prop.titulo}</h2>
        <p><b>Tipo:</b> ${prop.tipo || "N/D"}</p>
        <p><b>Zona:</b> ${prop.zona || "N/D"}</p>
        <p><b>Precio:</b> $ ${Number(prop.precio || 0).toLocaleString("es-CO")}</p>
        <hr>
        <h3>Galería</h3>
        ${galeriaHTML}
      `;
    })();
  }
});
