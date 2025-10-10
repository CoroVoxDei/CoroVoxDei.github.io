/* ========================
   1. ENCABEZADO
======================== */
const homeBtn = document.getElementById("homeBtn");
const pageTitle = document.getElementById("pageTitle");

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const sidebarClose = document.getElementById("sidebarClose");
const overlay = document.getElementById("overlay");
const topbar = document.querySelector(".topbar");

function closeSidebar() {
  sidebar.classList.remove("active");
  overlay.classList.remove("active");
  sidebar.setAttribute("aria-hidden", "true");
  topbar.classList.remove("hidden");
}

menuBtn?.addEventListener("click", () => {
  sidebar.classList.add("active");
  overlay.classList.add("active");
  sidebar.setAttribute("aria-hidden", "false");
  topbar.classList.add("hidden");
});

sidebarClose?.addEventListener("click", closeSidebar);
overlay?.addEventListener("click", closeSidebar);

// --- Submenú ---
const toggleSubmenu = document.getElementById("toggleSubmenu");
const submenu = document.getElementById("submenu");

toggleSubmenu?.addEventListener("click", (e) => {
  e.preventDefault();
  submenu.classList.toggle("open");
});

/* ========================
   2. TITULO DINAMICO
======================== */
function updateTitle(newTitle) {
  pageTitle.textContent = newTitle;
  pageTitle.style.animation = "none";
  pageTitle.offsetHeight; // reinicia animación
  pageTitle.style.animation = "fadeIn 2s ease forwards";
}

/* ========================
   3. BARRA DE BÚSQUEDA
======================== */
const searchInput = document.getElementById("searchInput");

function initSearch() {
  searchInput?.addEventListener("keyup", () => {
    const filter = searchInput.value.toLowerCase();
    allSongs.forEach(song => {
      const title = song.querySelector("h2")?.textContent.toLowerCase() || "";
      const text = (song.querySelector(".lyrics, .lyrics1")?.textContent || "").toLowerCase();
      song.style.display = (title.includes(filter) || text.includes(filter)) ? "block" : "none";
    });
  });
}

/* ========================
   FILTRO POR CATEGORÍAS
======================== */
const categoryButtons = document.querySelectorAll('.category-btn');
let allSongsList = document.querySelectorAll('.song');

categoryButtons.forEach(button => {
  button.addEventListener('click', () => {
    // Quitar clase activa de todos
    categoryButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    const selectedCategory = button.dataset.category?.toLowerCase();

    allSongsList.forEach(song => {
      const songCategory = song.dataset.category?.toLowerCase();

      // Mostrar solo canciones que coinciden o todas si es "todos"
      song.style.display =
        selectedCategory === 'todos' || songCategory === selectedCategory
          ? 'block'
          : 'none';
    });
  });
});

// Reactivar después de cargar nuevas canciones dinámicamente
document.addEventListener("DOMContentLoaded", () => {
  const observer = new MutationObserver(() => {
    allSongsList = document.querySelectorAll('.song');
  });

  observer.observe(document.body, { childList: true, subtree: true });
});

/* ========================
   SCROLL HORIZONTAL CON ARRASTRE (para PC)
======================== */
const scrollContainer = document.querySelector('.search-categories');
let isDown = false;
let startX, scrollLeft;

if (scrollContainer) {
  scrollContainer.addEventListener('mousedown', e => {
    isDown = true;
    scrollContainer.classList.add('grabbing');
    startX = e.pageX - scrollContainer.offsetLeft;
    scrollLeft = scrollContainer.scrollLeft;
  });

  scrollContainer.addEventListener('mouseleave', () => {
    isDown = false;
    scrollContainer.classList.remove('grabbing');
  });

  scrollContainer.addEventListener('mouseup', () => {
    isDown = false;
    scrollContainer.classList.remove('grabbing');
  });

  scrollContainer.addEventListener('mousemove', e => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - scrollContainer.offsetLeft;
    const walk = (x - startX) * 1.5; // velocidad de desplazamiento
    scrollContainer.scrollLeft = scrollLeft - walk;
  });
}

/* ========================
   4. PAGINACIÓN
======================== */
const songsPerPage = 5;
let currentPage = 1;
let allSongs = [];

function renderPagination() {
  const paginationContainer = document.getElementById("pagination");
  paginationContainer.innerHTML = "";

  const totalPages = Math.ceil(allSongs.length / songsPerPage);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === currentPage) btn.classList.add("active");

    btn.addEventListener("click", () => {
      if (i !== currentPage) {
        currentPage = i;
        showPage(currentPage);
      }
    });

    paginationContainer.appendChild(btn);
  }
}

function showPage(page) {
  const container = document.getElementById("songsContainer");

  // 🔹 Animación de fundido sutil
  container.style.opacity = "0";

  setTimeout(() => {
    const start = (page - 1) * songsPerPage;
    const end = start + songsPerPage;

    allSongs.forEach((song, index) => {
      song.style.display = (index >= start && index < end) ? "block" : "none";
    });

    renderPagination();

    // 🔹 Aparece suavemente
    container.style.opacity = "1";
  }, 150); // Duración de fundido corta y elegante
}


/* ========================
   MOSTRAR / OCULTAR ACORDES (desde el menú lateral)
======================== */
const toggleChordsBtn = document.getElementById("toggleChordsBtn");

// Leer preferencia guardada
let showChords = localStorage.getItem("showChords");
showChords = showChords === null ? true : showChords === "true"; // Por defecto visibles

function updateChordsVisibility() {
  if (showChords) {
    document.body.classList.remove("hide-chords");
  } else {
    document.body.classList.add("hide-chords");
  }

  // Cambiar texto del botón
  if (toggleChordsBtn) {
    toggleChordsBtn.textContent = showChords ? "Ocultar acordes" : "Mostrar acordes";
  }

  // Guardar preferencia
  localStorage.setItem("showChords", showChords);
}

function cleanEmptyChordLines() {
  document.querySelectorAll("pre").forEach(pre => {
    // Si el <pre> solo contiene acordes (o queda vacío tras ocultarlos)
    const text = pre.textContent.trim();
    const hasOnlyChords = pre.querySelectorAll(".chord").length > 0 && text === "";
    if (hasOnlyChords || text === "") pre.style.display = "none";
    else pre.style.display = "";
  });
}

// Llama a la limpieza cada vez que cambie el modo de acordes
function updateChordsVisibility() {
  if (showChords) {
    document.body.classList.remove("hide-chords");
  } else {
    document.body.classList.add("hide-chords");
  }

  // Cambiar texto del botón
  if (toggleChordsBtn) {
    toggleChordsBtn.textContent = showChords ? "Ocultar acordes" : "Mostrar acordes";
  }

  // Guardar preferencia
  localStorage.setItem("showChords", showChords);

  // 🧹 Limpia líneas vacías o contenedores vacíos
  cleanEmptyChordLines();
}


// Evento click
toggleChordsBtn?.addEventListener("click", e => {
  e.preventDefault();
  showChords = !showChords;
  updateChordsVisibility();
});

// Aplicar visibilidad inicial al cargar la página
document.addEventListener("DOMContentLoaded", updateChordsVisibility);

/* ========================
   5. CARGA DE CANCIONES
======================== */
function loadSongs(files, categoryTitle = "CANCIONERO DIGITAL") {
  if (!Array.isArray(files)) files = [files]; // si pasas 1 archivo, lo convierte en array

  Promise.all(files.map(file => fetch(file).then(res => res.text())))
    .then(htmls => {
      document.getElementById("songsContainer").innerHTML = htmls.join(""); // concatena

      // capturamos todas las canciones cargadas
      allSongs = Array.from(document.querySelectorAll(".song"));

      initSongButtons();
      initSearch();
      updateTitle(categoryTitle);

      // mostrar primera página con paginación
      currentPage = 1;
      showPage(currentPage);
    })
    .catch(err => console.error("Error cargando canciones:", err));
}

// Detectar clicks en el sidebar
document.querySelectorAll('#submenu a').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const file = e.target.getAttribute('data-file');
    const name = e.target.textContent;
    if (file) {
      loadSongs(file, `Cantos ${name}`);
      closeSidebar();
    }
  });
});

// Botón inicio → vuelve al general
homeBtn?.addEventListener("click", () => {
  loadSongs(["Entrada.html", "Penitencial.html", "Gloria.html", "Comunion.html", "Eucaristicos.html"]);
  updateTitle("CANCIONERO DIGITAL");
});

/* ========================
   6. BOTONES DE CANCIONES
======================== */
function initSongButtons() {
  // Toggle letra
  document.querySelectorAll(".toggle-lyrics").forEach(btn => {
    btn.addEventListener("click", () => {
      const lyrics = btn.closest(".song").querySelector(".lyrics, .lyrics1");
      const iconSpan = btn.querySelector(".icon");
      const textSpan = btn.querySelector(".text");

      lyrics.classList.toggle("show");

      if (iconSpan) iconSpan.textContent = lyrics.classList.contains("show") ? "▲" : "▼";
      if (textSpan) textSpan.textContent = lyrics.classList.contains("show") ? "Ocultar letra" : "Ver letra";
    });
  });

// Añadir repertorio
document.querySelectorAll('.add-repertorio').forEach(btn => {
  btn.addEventListener('click', () => {
    const songSection = btn.closest('.song');
    const title = songSection.querySelector("h2")?.childNodes[0]?.textContent.trim() || "";
    const author = songSection.querySelector(".autor")?.textContent.trim() || "";
    const lyrics = songSection.querySelector(".lyrics, .lyrics1")?.innerHTML.trim();
    const category = songSection.dataset.category || "Sin categoría";

    if (!title || !lyrics) {
      console.error("❌ No se pudo guardar la canción. Faltan datos.");
      return;
    }

    let repertorio = JSON.parse(localStorage.getItem("repertorio")) || [];

    // Evita duplicados
    if (!repertorio.some(song => song.title === title)) {
      repertorio.push({ title, author, lyrics, category }); // 👈 Agregamos el autor
      localStorage.setItem("repertorio", JSON.stringify(repertorio));
      alert(`✅ "${title}" de ${author} se añadió al repertorio`);
    } else {
      alert(`⚠️ "${title}" ya está en tu repertorio`);
    }
  });
});


}

/* ========================
   7. INICIO
======================== */
loadSongs(["Entrada.html", "Penitencial.html", "Gloria.html", "Comunion.html", "Eucaristicos.html" ]);


/* ========================
   8. ACORDEÓN MÓVIL (solo en celulares)
======================== */
function enableMobileAccordion() {
  document.querySelectorAll(".song-header").forEach(header => {
    // Eliminar handler viejo si existe
    if (header._mobileHandler) {
      header.removeEventListener("click", header._mobileHandler);
      delete header._mobileHandler;
    }

    // Solo activar en pantallas pequeñas
    if (window.innerWidth <= 768) {
      header._mobileHandler = function(e) {
        // Evita conflicto con botón "añadir repertorio"
        if (e.target.closest(".add-repertorio") || e.target.closest(".toggle-lyrics")) return;

        const lyrics = header.closest(".song").querySelector(".lyrics, .lyrics1");
        const iconSpan = header.querySelector(".toggle-lyrics .icon");
        const textSpan = header.querySelector(".toggle-lyrics .text");

        lyrics.classList.toggle("show");

        if (iconSpan) iconSpan.textContent = lyrics.classList.contains("show") ? "▲" : "▼";
        if (textSpan) textSpan.textContent = lyrics.classList.contains("show") ? "Ocultar letra" : "Ver letra";
      };

      header.addEventListener("click", header._mobileHandler);
    }
  });
}

// Detectar cambio de tamaño o carga inicial
window.addEventListener("load", enableMobileAccordion);
window.addEventListener("resize", enableMobileAccordion);

