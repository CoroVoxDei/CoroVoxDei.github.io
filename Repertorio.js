/* =====================================================
   🎵 MI REPERTORIO — CÓDIGO LIMPIO Y ORGANIZADO
   Orden lógico: Encabezado → Portada → Búsqueda → Contenido
===================================================== */

// ========================
// 🔹 1. VARIABLES GLOBALES
// ========================
let repertorio = JSON.parse(localStorage.getItem("repertorio")) || [];
let letrasAbiertas = JSON.parse(localStorage.getItem("letrasAbiertas")) || [];

const list = document.getElementById("repertorio-list");
const empty = document.getElementById("empty-message");
const clearBtn = document.getElementById("clearBtn");
const searchInput = document.getElementById("searchRepertorio");

// ========================
// 🔹 2. RENDERIZAR CANCIONES
// ========================
function renderRepertorio(filter = "") {
  list.innerHTML = "";

  const filtered = repertorio.filter(song =>
    song.title.toLowerCase().includes(filter.toLowerCase())
  );

  if (filtered.length === 0) {
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  filtered.forEach((song, index) => {
    const section = document.createElement("section");
    section.className = "song";
    section.dataset.index = index;

    section.innerHTML = `
  <div class="song-header">
    <span class="drag-handle">☰</span>
    <h2>${song.title} <span class="autor">${song.author || ''}</span></h2>
    <div class="song-actions">
      <button class="toggle-lyrics">
        <span class="icon">▼</span>
        <span class="text">Ver letra</span>
      </button>
      <button class="remove-btn">
        <span class="icon">🗑</span>
        <span class="text">Quitar</span>
      </button>
    </div>
  </div>
  <div class="lyrics">${song.lyrics}</div>
`;


    list.appendChild(section);
  });

  initButtons();
  initSortable(); // permite arrastrar/reordenar
  restoreOpenLyrics();
}

// ========================
// 🔹 3. BOTONES DE ACCIÓN
// ========================
function initButtons() {
  // Mostrar / ocultar letra
  document.querySelectorAll(".toggle-lyrics").forEach(btn => {
    btn.addEventListener("click", () => {
      const song = btn.closest(".song");
      const lyrics = song.querySelector(".lyrics");
      const icon = btn.querySelector(".icon");
      const text = btn.querySelector(".text");
      const title = song.querySelector("h2").childNodes[0].textContent.trim();

      lyrics.classList.toggle("show");
      const isOpen = lyrics.classList.contains("show");

      icon.textContent = isOpen ? "▲" : "▼";
      text.textContent = isOpen ? "Ocultar letra" : "Ver letra";

      // Guardar estado en localStorage
      if (isOpen) {
        if (!letrasAbiertas.includes(title)) letrasAbiertas.push(title);
      } else {
        letrasAbiertas = letrasAbiertas.filter(t => t !== title);
      }
      localStorage.setItem("letrasAbiertas", JSON.stringify(letrasAbiertas));
    });
  });

  // ✅ Botón quitar canción (corrige el bug del índice tras mover canciones)
document.querySelectorAll(".remove-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const song = btn.closest(".song");
    const title = song.querySelector("h2")?.childNodes[0]?.textContent.trim();

    // Buscar por título (más confiable que por índice)
    const indexToRemove = repertorio.findIndex(item => item.title === title);
    if (indexToRemove === -1) return; // no encontrado (seguridad)

    // Eliminar también de letras abiertas
    letrasAbiertas = letrasAbiertas.filter(t => t !== title);

    repertorio.splice(indexToRemove, 1);
    localStorage.setItem("repertorio", JSON.stringify(repertorio));
    localStorage.setItem("letrasAbiertas", JSON.stringify(letrasAbiertas));

    renderRepertorio(searchInput.value);
  });
});

}

// ========================
// 🔹 4. RESTAURAR LETRAS ABIERTAS
// ========================
function restoreOpenLyrics() {
  document.querySelectorAll(".song").forEach((song, i) => {
    const title = repertorio[i]?.title;
    if (letrasAbiertas.includes(title)) {
      const lyrics = song.querySelector(".lyrics");
      const icon = song.querySelector(".toggle-lyrics .icon");
      const text = song.querySelector(".toggle-lyrics .text");

      lyrics.classList.add("show");
      icon.textContent = "▲";
      text.textContent = "Ocultar letra";
    }
  });
}

// ========================
// 🔹 5. BUSCADOR DE CANCIONES
// ========================
searchInput.addEventListener("keyup", e => renderRepertorio(e.target.value));

// ========================
// 🔹 6. LIMPIAR REPERTORIO
// ========================
clearBtn.addEventListener("click", () => {
  if (confirm("¿Seguro que quieres limpiar todo tu repertorio?")) {
    localStorage.removeItem("repertorio");
    localStorage.removeItem("letrasAbiertas");
    repertorio = [];
    letrasAbiertas = [];
    renderRepertorio();
  }
});

// ========================
// 🔹 7. REORDENAR (Drag & Drop)
// ========================
// Usa Sortable.js (compatible con mouse y táctil)
function initSortable() {
  const container = document.getElementById("repertorio-list");
  if (!container) return;

  Sortable.create(container, {
    animation: 150, // suaviza el movimiento
    handle: ".drag-handle", // 👈 solo se arrastra desde el icono ☰
    ghostClass: "drag-ghost",
    onEnd: function () {
      // Actualizar el orden en localStorage
      const newOrder = [];
      document.querySelectorAll(".song").forEach(song => {
        const title = song.querySelector("h2")?.childNodes[0]?.textContent.trim();
        const found = repertorio.find(item => item.title === title);
        if (found) newOrder.push(found);
      });
      repertorio = newOrder;
      localStorage.setItem("repertorio", JSON.stringify(repertorio));
    }
  });
}




// ========================
// 🔹 8. ACORDEÓN EN MÓVILES
// ========================
function enableMobileAccordion() {
  document.querySelectorAll(".song-header").forEach(header => {
    if (header._mobileHandler) {
      header.removeEventListener("click", header._mobileHandler);
      delete header._mobileHandler;
    }

    if (window.innerWidth <= 768) {
      header._mobileHandler = function (e) {
        if (e.target.closest(".add-repertorio") || e.target.closest(".toggle-lyrics")) return;

        const lyrics = header.closest(".song").querySelector(".lyrics");
        const icon = header.querySelector(".toggle-lyrics .icon");
        const text = header.querySelector(".toggle-lyrics .text");

        lyrics.classList.toggle("show");
        const isOpen = lyrics.classList.contains("show");

        icon.textContent = isOpen ? "▲" : "▼";
        text.textContent = isOpen ? "Ocultar letra" : "Ver letra";
      };
      header.addEventListener("click", header._mobileHandler);
    }
  });
}

window.addEventListener("load", enableMobileAccordion);
window.addEventListener("resize", enableMobileAccordion);

// ========================
// 🔹 9. INICIALIZACIÓN
// ========================
renderRepertorio();
