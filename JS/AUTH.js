/* ============================================
   auth.js
   Manejo del login y cierre de sesión
   ============================================ */

/* Este script:
   - Valida usuario y contraseña
   - Guarda en localStorage que el usuario es ADMIN
   - Redirecciona al panel interno
*/

document.addEventListener("DOMContentLoaded", () => {

  // Si estamos en login.html, este botón existe
  const btn = document.getElementById("btnLogin");
  if (btn) {
    btn.addEventListener("click", () => {

      // Capturar usuario y contraseña
      const u = document.getElementById("user").value.trim();
      const p = document.getElementById("pass").value.trim();

      // Credenciales válidas (proyecto académico)
      if (u === "admin" && p === "admin123") {

        // Guardar sesión
        localStorage.setItem("ROL_CMR", "ADMIN");

        // Enviar al panel interno
        window.location.href = "admin.html";

      } else {
        alert("Credenciales incorrectas");
      }
    });
  }
});

/* Función llamada desde admin.html */
function logout() {
  localStorage.removeItem("ROL_CMR");
  window.location.href = "index.html";
}


