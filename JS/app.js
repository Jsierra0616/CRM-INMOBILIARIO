/* ------------------------------------------------------------
   FUNCIÓN COMPARTIDA: cargar propiedades desde localStorage
   ------------------------------------------------------------ */

function loadPublicProps() {
  // Leemos la misma clave que usa admin.js: "cmr_props"
  return JSON.parse(localStorage.getItem("cmr_props") || "[]");
}

/* ------------------------------------------------------------
   EVENTO PRINCIPAL: cuando el DOM está listo
   ------------------------------------------------------------ */

document.addEventListener("DOMContentLoaded", () => {

  // Contenedor del listado en index.html (página pública)
  const listContainer = document.getElementById("publicProps");

  // Contenedor del detalle en detalle.html
  const detailContainer = document.getElementById("detallePropiedad");

  /* ==========================================================
     1) LISTADO PÚBLICO (INDEX.HTML)
     ========================================================== */
  if (listContainer) {

    // Referencias a los filtros
    const filtroZona   = document.getElementById("filterZona");
    const filtroPrecio = document.getElementById("filterPrecio");
    const filtroOper   = document.getElementById("filterOperacion");
    const btnFiltrar   = document.getElementById("btnFiltrar");

    // Función que pinta las tarjetas según filtros
    function renderListado() {
      const zona  = (filtroZona.value || "").trim().toLowerCase();
      const precioMax = Number(filtroPrecio.value || 0);
      const oper  = filtroOper.value;   // "todos", "Compra", "Arriendo", etc.

      // Cargamos TODAS las propiedades
      const allProps = loadPublicProps();

      // Filtro básico
      const filtradas = allProps.filter(p => {
        // Filtro por zona (contiene el texto)
        if (zona && !p.zona.toLowerCase().includes(zona)) return false;

        // Filtro por precio máximo
        if (precioMax && p.precio > precioMax) return false;

        // Filtro por tipo de operación:
        // si NO usas todavía "tipoOperacion" en admin,
        // este bloque se puede comentar o dejar así:
        if (oper !== "todos") {
          // si existe p.tipoOperacion, filtramos por ese campo
          if (p.tipoOperacion && p.tipoOperacion !== oper) return false;
          // si NO existe, NO filtramos (para no eliminar la tarjeta)
        }

        return true;
      });

      // Limpiamos el contenedor
      listContainer.innerHTML = "";

      // Si no hay resultados, mostramos un mensaje amigable
      if (filtradas.length === 0) {
        listContainer.innerHTML = `<p>No se encontraron inmuebles con los filtros actuales.</p>`;
        return;
      }

      // Pintamos cada propiedad en una tarjeta
      filtradas.forEach(p => {
        const card = document.createElement("article");
        card.className = "prop-card";

        // Usamos la primera imagen si existe, o un placeholder
        const imgSrc = (p.images && p.images.length > 0)
          ? p.images[0]
          : "https://via.placeholder.com/300x200?text=Sin+imagen";

        card.innerHTML = `
          <div class="prop-gallery">
            <img src="${imgSrc}" alt="Foto de ${p.titulo}">
          </div>

          <div class="prop-info">
            <h3>${p.titulo}</h3>
            <p><b>Tipo:</b> ${p.tipo || "N/D"} — <b>Zona:</b> ${p.zona}</p>
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

    // Render inicial al cargar la página
    renderListado();

    // Botón "Aplicar filtros" vuelve a renderizar
    if (btnFiltrar) {
      btnFiltrar.addEventListener("click", renderListado);
    }
  }

  /* ==========================================================
     2) DETALLE DE INMUEBLE (DETALLE.HTML)
     ========================================================== */
  if (detailContainer) {

    // Extraemos el ID del inmueble desde la URL: ?id=XYZ
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    const props = loadPublicProps();
    const prop = props.find(p => p.id === id);

    // Si no se encuentra, mostramos mensaje
    if (!prop) {
      detailContainer.innerHTML = "<p>Inmueble no encontrado.</p>";
      return;
    }

    // Construimos la galería con todas las imágenes
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
      galeriaHTML = `<p>Este inmueble no tiene fotos registradas.</p>`;
    }

    // Insertamos todo el detalle en el contenedor
    detailContainer.innerHTML = `
      <h2>${prop.titulo}</h2>
      <p><b>Tipo:</b> ${prop.tipo || "N/D"}</p>
      <p><b>Zona:</b> ${prop.zona}</p>
      <p><b>Precio:</b> $ ${Number(prop.precio || 0).toLocaleString("es-CO")}</p>
      <hr>
      <h3>Galería</h3>
      ${galeriaHTML}
    `;
  }

});
