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
// MENÚ LATERAL (REPERTORIO)
// ========================

document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("menuBtn");
  const sidebar = document.getElementById("sidebar");
  const sidebarClose = document.getElementById("sidebarClose");
  const overlay = document.getElementById("overlay"); // Ya está en el HTML

  // 🔹 Abrir menú
  menuBtn?.addEventListener("click", () => {
    sidebar.classList.add("active");
    overlay.classList.add("active");
    document.body.style.overflow = "hidden"; // Evita scroll al abrir menú
  });

  // 🔹 Función para cerrar el menú
  const closeSidebar = () => {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
    document.body.style.overflow = ""; // Restaura scroll
  };

  // 🔹 Cerrar menú al hacer clic en cualquier enlace del sidebar
sidebar.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", (e) => {
    // Evita cerrar si es el botón que abre el submenú
    if (link.id === "toggleSubmenu") return;
    closeSidebar();
  });
});


  // 🔹 Cerrar menú al hacer clic en ✕ o fuera del menú
  sidebarClose?.addEventListener("click", closeSidebar);
  overlay?.addEventListener("click", closeSidebar);

  // 🔹 Submenú de canciones (abrir/cerrar)
  const toggleSubmenu = document.getElementById("toggleSubmenu");
  const submenu = document.getElementById("submenu");

  toggleSubmenu?.addEventListener("click", (e) => {
    e.preventDefault();
    submenu.classList.toggle("open");
    toggleSubmenu.textContent = submenu.classList.contains("open")
      ? "Canciones ▲"
      : "Canciones ▼";
  });
});


/* ========================
   7. MOSTRAR / OCULTAR ACORDES
======================== */
const toggleChordsBtn = document.getElementById("toggleChordsBtn");
let showChords = localStorage.getItem("showChords");
showChords = showChords === null ? true : showChords === "true";

function cleanEmptyChordLines() {
  document.querySelectorAll("pre").forEach(pre => {
    const text = pre.textContent.trim();
    const hasOnlyChords = pre.querySelectorAll(".chord").length > 0 && text === "";
    pre.style.display = (hasOnlyChords || text === "") ? "none" : "";
  });
}

function updateChordsVisibility() {
  document.body.classList.toggle("hide-chords", !showChords);

  if (toggleChordsBtn) {
    toggleChordsBtn.textContent = showChords ? "Ocultar acordes" : "Mostrar acordes";
  }

  localStorage.setItem("showChords", showChords);
  cleanEmptyChordLines();
}

toggleChordsBtn?.addEventListener("click", e => {
  e.preventDefault();
  showChords = !showChords;
  updateChordsVisibility();
});

document.addEventListener("DOMContentLoaded", updateChordsVisibility);

/* ========================
   FILTRAR CANCIONES EN "MI REPERTORIO"
======================== */
document.querySelectorAll("#submenu a").forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();

    const categoria = link.textContent.trim().toLowerCase();
    const canciones = document.querySelectorAll(".song");

    canciones.forEach(cancion => {
      const cat = cancion.dataset.category?.toLowerCase() || "";

      // 🔸 Si se elige "todas las canciones", muestra todo
      if (categoria === "todas las canciones" || categoria === "todas") {
        cancion.style.display = "block";
      } 
      // 🔸 Si coincide la categoría, muestra; si no, oculta
      else if (cat === categoria) {
        cancion.style.display = "block";
      } 
      else {
        cancion.style.display = "none";
      }
    });

    // Cierra el menú lateral y overlay
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");

    sidebar.classList.remove("active");
    overlay.classList.remove("active");
    sidebar.setAttribute("aria-hidden", "true");

    // Vuelve a mostrar la barra superior si aplica
    const topbar = document.querySelector(".topbar");
    topbar?.classList.remove("hidden");

    // Sube al inicio
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});



// ========================
// 🔹 2. RENDERIZAR CANCIONES (con filtro por categoría o mostrar todas)
// ========================
function renderRepertorio(filter = "") {
  list.innerHTML = "";

  const normalizedFilter = (filter || "").toLowerCase().trim();

  let filtered;

  // 🔸 Mostrar todas las canciones si el filtro está vacío o es "todas"
  if (!normalizedFilter || normalizedFilter === "todas") {
    filtered = repertorio;
  } else {
    filtered = repertorio.filter(song =>
      (song.category && song.category.toLowerCase() === normalizedFilter) ||
      (song.title && song.title.toLowerCase().includes(normalizedFilter))
    );
  }

  if (filtered.length === 0) {
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  filtered.forEach((song, index) => {
    const section = document.createElement("section");
    section.className = "song";
    section.dataset.index = index;
    section.dataset.category = ((song.category || "sin categoría")).toLowerCase();

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
  initSortable();
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
