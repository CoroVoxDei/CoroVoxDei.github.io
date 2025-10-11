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

toggleSubmenu?.addEventListener("click", e => {
  e.preventDefault();
  submenu.classList.toggle("open");
});

/* ========================
   2. TÍTULO DINÁMICO
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
   4. FILTRO POR CATEGORÍAS
======================== */
const categoryButtons = document.querySelectorAll(".category-btn");
let allSongsList = document.querySelectorAll(".song");

categoryButtons.forEach(button => {
  button.addEventListener("click", () => {
    categoryButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");

    const selectedCategory = button.dataset.category?.toLowerCase();

    allSongsList.forEach(song => {
      const songCategory = song.dataset.category?.toLowerCase();
      song.style.display =
        selectedCategory === "todos" || songCategory === selectedCategory
          ? "block"
          : "none";
    });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const observer = new MutationObserver(() => {
    allSongsList = document.querySelectorAll(".song");
  });
  observer.observe(document.body, { childList: true, subtree: true });
});

/* ================================================================================
   5. SCROLL HORIZONTAL CON ARRASTRE (PC)
      sirve para que en computadoras (no celulares) puedas deslizar con el mouse la 
      fila de categorías de izquierda a derecha como si fuera una galería, haciendo 
      clic y arrastrando.
================================================================================ */

const scrollContainer = document.querySelector(".search-categories");
let isDown = false;
let startX, scrollLeft;

if (scrollContainer) {
  scrollContainer.addEventListener("mousedown", e => {
    isDown = true;
    scrollContainer.classList.add("grabbing");
    startX = e.pageX - scrollContainer.offsetLeft;
    scrollLeft = scrollContainer.scrollLeft;
  });

  scrollContainer.addEventListener("mouseleave", () => {
    isDown = false;
    scrollContainer.classList.remove("grabbing");
  });

  scrollContainer.addEventListener("mouseup", () => {
    isDown = false;
    scrollContainer.classList.remove("grabbing");
  });

  scrollContainer.addEventListener("mousemove", e => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - scrollContainer.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollContainer.scrollLeft = scrollLeft - walk;
  });
}

/* ========================
   6. PAGINACIÓN
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
  container.style.opacity = "0";

  setTimeout(() => {
    const start = (page - 1) * songsPerPage;
    const end = start + songsPerPage;

    allSongs.forEach((song, index) => {
      song.style.display = (index >= start && index < end) ? "block" : "none";
    });

    renderPagination();
    container.style.opacity = "1";
  }, 150);
}

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
   8. CARGA DE CANCIONES
======================== */
function loadSongs(files, categoryTitle = "CANCIONERO DIGITAL") {
  if (!Array.isArray(files)) files = [files];

  Promise.all(files.map(file => fetch(file).then(res => res.text())))
    .then(htmls => {
      document.getElementById("songsContainer").innerHTML = htmls.join("");
      allSongs = Array.from(document.querySelectorAll(".song"));

      initSongButtons();
      initSearch();
      updateTitle(categoryTitle);

      currentPage = 1;
      showPage(currentPage);
    })
    .catch(err => console.error("Error cargando canciones:", err));
}

document.querySelectorAll("#submenu a").forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    const file = e.target.getAttribute("data-file");
    const name = e.target.textContent;
    if (file) {
      loadSongs(file, `Cantos ${name}`);
      closeSidebar();
    }
  });
});

homeBtn?.addEventListener("click", () => {
  loadSongs(["Entrada.html", "Penitencial.html", "Gloria.html", "Comunion.html", "Eucaristicos.html"]);
  updateTitle("CANCIONERO DIGITAL");
});

/* ========================
   9. BOTONES DE CANCIONES
======================== */
function initSongButtons() {
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

  document.querySelectorAll(".add-repertorio").forEach(btn => {
    btn.addEventListener("click", () => {
      const songSection = btn.closest(".song");
      const title = songSection.querySelector("h2")?.childNodes[0]?.textContent.trim() || "";
      const author = songSection.querySelector(".autor")?.textContent.trim() || "";
      const lyrics = songSection.querySelector(".lyrics, .lyrics1")?.innerHTML.trim();
      const category = songSection.dataset.category || "Sin categoría";

      if (!title || !lyrics) {
        console.error("❌ No se pudo guardar la canción. Faltan datos.");
        return;
      }

      let repertorio = JSON.parse(localStorage.getItem("repertorio")) || [];

      if (!repertorio.some(song => song.title === title)) {
        repertorio.push({ title, author, lyrics, category });
        localStorage.setItem("repertorio", JSON.stringify(repertorio));
        alert(`✅ "${title}" de ${author} se añadió al repertorio`);
      } else {
        alert(`⚠️ "${title}" ya está en tu repertorio`);
      }
    });
  });
}

/* ========================
   10. INICIO
======================== */
loadSongs(["Entrada.html", "Penitencial.html", "Gloria.html", "Comunion.html", "Eucaristicos.html"]);

/* ========================
   11. ACORDEÓN MÓVIL
======================== */
function enableMobileAccordion() {
  document.querySelectorAll(".song-header").forEach(header => {
    if (header._mobileHandler) {
      header.removeEventListener("click", header._mobileHandler);
      delete header._mobileHandler;
    }

    if (window.innerWidth <= 768) {
      header._mobileHandler = function (e) {
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

window.addEventListener("load", enableMobileAccordion);
window.addEventListener("resize", enableMobileAccordion);
