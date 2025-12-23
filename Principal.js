
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
  if (!pageTitle) return;
  pageTitle.textContent = newTitle;
  pageTitle.style.animation = "none";
  pageTitle.offsetHeight;
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
    filterByCategory(selectedCategory);
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const observer = new MutationObserver(() => {
    allSongsList = document.querySelectorAll(".song");
  });
  observer.observe(document.body, { childList: true, subtree: true });
});

/* ========================
   4.1 SCROLL HORIZONTAL CON FLECHAS (FUNCIONAL)
======================== */

const catScroll = document.getElementById("catScroll");
const catLeft = document.getElementById("catLeftBtn");
const catRight = document.getElementById("catRightBtn");

if (catScroll && catLeft && catRight) {

  const scrollAmount = 250; // distancia por clic

  function updateCategoryArrows() {
    // Desactivar izquierda al llegar al inicio
    catLeft.classList.toggle("disabled", catScroll.scrollLeft <= 0);

    // Desactivar derecha al llegar al final
    const atEnd =
      catScroll.scrollLeft + catScroll.clientWidth >= catScroll.scrollWidth - 2;

    catRight.classList.toggle("disabled", atEnd);
  }

  catLeft.addEventListener("click", () => {
    catScroll.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    setTimeout(updateCategoryArrows, 300);
  });

  catRight.addEventListener("click", () => {
    catScroll.scrollBy({ left: scrollAmount, behavior: "smooth" });
    setTimeout(updateCategoryArrows, 300);
  });

  // Cuando se hace scroll manual
  catScroll.addEventListener("scroll", updateCategoryArrows);

  // Ejecutar al cargar
  updateCategoryArrows();
}


/* ========================
   5. CATEGORÍAS DEL SUBMENÚ
======================== */
document.querySelectorAll("#submenu a").forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();

    const category = link.textContent.trim().toLowerCase();

    const mainBtn = Array.from(document.querySelectorAll(".category-btn"))
      .find(btn => btn.textContent.trim().toLowerCase() === category);

    if (mainBtn) mainBtn.click();

    sidebar.classList.remove("active");
    overlay.classList.remove("active");
    sidebar.setAttribute("aria-hidden", "true");
    topbar?.classList.remove("hidden");

    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

/* ========================
   5. SCROLL HORIZONTAL
======================== */
const scrollContainer = document.querySelector(".search-categories");
let isDown = false, startX, scrollLeft;

if (scrollContainer) {
  scrollContainer.addEventListener("mousedown", e => {
    isDown = true;
    scrollContainer.classList.add("grabbing");
    startX = e.pageX - scrollContainer.offsetLeft;
    scrollLeft = scrollContainer.scrollLeft;
  });

  ["mouseleave", "mouseup"].forEach(evt =>
    scrollContainer.addEventListener(evt, () => {
      isDown = false;
      scrollContainer.classList.remove("grabbing");
    })
  );

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
let filteredSongs = [];

function renderPagination() {
  const paginationContainer = document.getElementById("pagination");
  paginationContainer.innerHTML = "";

  const list = filteredSongs.length > 0 ? filteredSongs : allSongs;
  const totalPages = Math.ceil(list.length / songsPerPage);

  if (totalPages <= 1) return;

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

    const list = filteredSongs.length > 0 ? filteredSongs : allSongs;

    allSongs.forEach(song => (song.style.display = "none"));
    list.forEach((song, index) => {
      song.style.display = (index >= start && index < end) ? "block" : "none";
    });

    renderPagination();
    container.style.opacity = "1";
  }, 150);
}

function initializeSongs() {
  allSongs = Array.from(document.querySelectorAll(".song"));
  filteredSongs = [];
  currentPage = 1;
  showPage(currentPage);
}

function filterByCategory(category) {
  if (category === "todos") {
    filteredSongs = [];
    currentPage = 1;
    showPage(currentPage);
    return;
  }

  filteredSongs = allSongs.filter(song => song.dataset.category?.toLowerCase() === category);
  currentPage = 1;
  showPage(currentPage);
}

/* ==============================
   7. MOSTRAR / OCULTAR ACORDES
============================== */
const toggleChordsBtn = document.getElementById("toggleChordsBtn");
let showChords = localStorage.getItem("showChords");
showChords = showChords === null ? true : showChords === "true";

// --- FUNCIÓN GLOBAL PARA RENDERIZAR EL CONTENIDO DEL POPUP SIN ACORDES (MEJORADA) ---
window.renderPopupLyrics = function() {
    const textoElem = document.getElementById("popupTexto");
    if(!textoElem || !window.originalPopupLyrics) return;

    if (showChords) {
        // Mostrar original con acordes y espacios
        textoElem.innerHTML = window.originalPopupLyrics;
        textoElem.classList.remove("sin-acordes");
    } else {
        // Filtrar acordes, eliminar líneas de acordes y limpiar espacios de alineación
        const lines = window.originalPopupLyrics.split(/\r?\n/);
        const processedLines = [];
        
        lines.forEach(line => {
            const isOriginallyBlank = line.trim() === "";
            
            // Creamos un elemento temporal para manipular el HTML de la línea
            const temp = document.createElement("div");
            temp.innerHTML = line;
            
            // Buscamos y eliminamos los elementos de acorde
            const chords = temp.querySelectorAll(".chord");
            const hadChords = chords.length > 0;
            chords.forEach(c => c.remove());
            
            // Verificamos qué queda después de quitar los acordes
            const remainingHTML = temp.innerHTML.trim();
            const hasActualText = temp.textContent.trim().length > 0;

            if (hasActualText) {
                // Si la línea tiene letra, la añadimos (limpia de espacios de alineación externos)
                processedLines.push(remainingHTML);
            } else if (isOriginallyBlank) {
                // Si la línea era un salto de estrofa intencional
                // Evitamos acumular múltiples líneas en blanco seguidas
                if (processedLines.length > 0 && processedLines[processedLines.length - 1] !== "") {
                    processedLines.push("");
                }
            }
            // Las líneas que solo tenían acordes (hadChords && !hasActualText) se ignoran por completo
        });

        // Limpiar saltos de línea sobrantes al final
        while(processedLines.length > 0 && processedLines[processedLines.length - 1] === "") {
            processedLines.pop();
        }

        textoElem.innerHTML = processedLines.join("\n");
        textoElem.classList.add("sin-acordes");
    }

    // Reaplicar tamaño de fuente actual
    if(window.tamañoFuente) {
        textoElem.style.fontSize = window.tamañoFuente + "px";
        textoElem.querySelectorAll("span").forEach(s => s.style.fontSize = window.tamañoFuente + "px");
    }
};

function updateChordsVisibility() {
  // 1. En la lista principal
  document.querySelectorAll(".chord").forEach(span => {
    span.style.display = showChords ? "inline" : "none";
  });

  // 2. En el botón del menú
  if (toggleChordsBtn) {
    toggleChordsBtn.textContent = showChords ? "Ocultar acordes" : "Mostrar acordes";
  }

  // 3. Si el popup está abierto, renderizar de nuevo su contenido
  const popup = document.getElementById("popupLetra");
  if (popup && popup.style.display !== "none") {
      window.renderPopupLyrics();
  }

  localStorage.setItem("showChords", showChords);
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
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function loadSongs(files, categoryTitle = "CANCIONERO DIGITAL") {
  if (!Array.isArray(files)) files = [files];
  files = shuffleArray(files);

  Promise.all(files.map(file => fetch(file).then(res => res.text())))
    .then(htmls => {
      document.getElementById("songsContainer").innerHTML = shuffleArray(htmls).join("");
      allSongs = Array.from(document.querySelectorAll(".song"));

      initSongButtons();
      initSearch();
      updateTitle(categoryTitle);

      initializeSongs();
      // Asegurar que la visibilidad de acordes se aplique a los nuevos elementos cargados
      updateChordsVisibility(); 
    })
    .catch(err => console.error("Error cargando canciones:", err));
}


/* ========================
   9. BOTONES DE REPERTORIO
======================== */

function initSongButtons() {
  document.querySelectorAll(".add-repertorio").forEach(btn => {
    
    // evitar duplicar eventos
    if (btn.dataset.listenerAdded === "true") return;
    btn.dataset.listenerAdded = "true";

    const songSection = btn.closest(".song");
    const title = songSection.querySelector("h2")?.childNodes[0]?.textContent.trim() || "";

    // --- Marcar estado correcto al cargar ---
    let repertorio = JSON.parse(localStorage.getItem("repertorio")) || [];
    const isInRep = repertorio.some(song => song.title === title);

    actualizarBoton(btn, isInRep);

    // --- Evento ---
    btn.addEventListener("click", () => {

      const author = songSection.querySelector(".autor")?.textContent.trim() || "";
      const lyrics = songSection.querySelector(".lyrics-hidden")?.innerHTML.trim();
      const category = songSection.dataset.category || "Sin categoría";

      let repertorio = JSON.parse(localStorage.getItem("repertorio")) || [];

      const index = repertorio.findIndex(song => song.title === title);

      if (index === -1) {
        // AGREGAR
        repertorio.push({ title, author, lyrics, category });
        localStorage.setItem("repertorio", JSON.stringify(repertorio));
        actualizarBoton(btn, true);
      } else {
        // CONFIRMAR ELIMINACIÓN
        const confirmar = confirm(`¿Deseas eliminar "${title}" del repertorio?`);

        if (!confirmar) return;

        repertorio.splice(index, 1);
        localStorage.setItem("repertorio", JSON.stringify(repertorio));
        actualizarBoton(btn, false);
      }
    });
  });
}


function actualizarBoton(btn, activo) {
  const icon = btn.querySelector(".icon");
  const text = btn.querySelector(".text");

  if (activo) {
    btn.classList.add("active");
    icon.textContent = "✔";
    text.textContent = "En repertorio";
  } else {
    btn.classList.remove("active");
    icon.textContent = "+";
    text.textContent = "Añadir al repertorio";
  }
}

/* ========================
   10. INICIO
======================== */
loadSongs([
  "Entrada.html", "Penitencial.html", "Gloria.html", "Aclamacion.html",
  "Ofertorio.html", "Santo.html", "Cordero.html", "Comunion.html",
  "PosComunion.html", "Marianos.html", "Adoracion.html", "Salesianos.html", "Adviento.html",
  "Hakuna.html"
]);

homeBtn?.addEventListener("click", () => {
  filteredSongs = [];
  currentPage = 1;
  showPage(currentPage);
  updateTitle("CANCIONERO DIGITAL");
});



/* ========================
   12. MODO CLARO/OSCURO
======================== */
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("themeToggle");
  const body = document.body;

  if (!toggleBtn) return;

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    body.classList.add("light-mode");
    toggleBtn.innerHTML = "Modo Oscuro";
  } else {
    toggleBtn.innerHTML = "Modo Claro";
  }

  toggleBtn.addEventListener("click", e => {
    e.preventDefault();
    body.classList.toggle("light-mode");

    if (body.classList.contains("light-mode")) {
      toggleBtn.innerHTML = "Modo Oscuro";
      localStorage.setItem("theme", "light");
    } else {
      toggleBtn.innerHTML = "Modo Claro";
      localStorage.setItem("theme", "dark");
    }
  });
});

// Logo dinámico según tema
const logos = document.querySelectorAll(".logo");

function updateLogos() {
  logos.forEach(logo => {
    const lightSrc = logo.getAttribute("data-light");
    const darkSrc = logo.getAttribute("src");

    if (document.body.classList.contains("light-mode")) {
      logo.setAttribute("src", lightSrc);
    } else {
      const blancoSrc = darkSrc.replace("Color", "Blanco");
      logo.setAttribute("src", blancoSrc);
    }
  });
}

updateLogos();

const modoBtn = document.getElementById("modoBtn");
modoBtn?.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
  updateLogos();
  modoBtn.textContent = document.body.classList.contains("light-mode")
    ? "Modo oscuro"
    : "Modo claro";
});


// ===============================
// POPUP DE LETRAS - FUNCIONES (CON AUTOR AUTOMÁTICO)
// ===============================
(function(){

  // Tamaño inicial REAL
  const tamañoInicial = 16;
  window.tamañoFuente = tamañoInicial;
  window.originalPopupLyrics = ""; // Variable para guardar el HTML original

  // ABRIR POPUP
  window.abrirLetra = function(titulo, letraHtml, autor) {
    const popup = document.getElementById("popupLetra");
    const tituloElem = document.getElementById("popupTitulo");
    const autorElem = document.getElementById("popupAutor");
    const textoElem = document.getElementById("popupTexto");

    if (!popup || !tituloElem || !textoElem) return;

    tituloElem.textContent = titulo || "";
    autorElem.textContent = autor || "";
    
    // GUARDAR ORIGINAL
    window.originalPopupLyrics = letraHtml || "";
    
    // RENDERIZAR SEGÚN ESTADO DE ACORDES
    window.renderPopupLyrics();

    // Restaurar tamaño original al abrir
    tamañoFuente = tamañoInicial;
    
    popup.style.display = "flex";
  };

  // CERRAR POPUP
  window.cerrarLetra = function() {
    const popup = document.getElementById("popupLetra");
    if (popup) popup.style.display = "none";
  };

  // CLICK PARA ABRIR POPUP
  document.addEventListener("click", function(e){
    const btn = e.target.closest(".lyrics-btn");
    if (!btn) return;

    e.preventDefault();

    const targetId = btn.dataset.target;
    let letraHtml = "";

    if (targetId) {
      const cont = document.getElementById(targetId);

      if (cont) {
        const pre = cont.querySelector("pre");
        letraHtml = pre 
          ? pre.innerHTML.trim()
          : cont.innerHTML.trim();
      }
    }

    // === OBTENER TÍTULO ===
    const h2 = btn.closest(".song")?.querySelector("h2");
    const rawTitle = h2?.childNodes[0]?.textContent || "";
    const titulo = rawTitle.trim();

    // === OBTENER AUTOR (small.autor) ===
    const autorElem = h2?.querySelector(".autor");
    const autor = autorElem ? autorElem.textContent.trim() : "";

    abrirLetra(titulo, letraHtml, autor);
  });

  // CLICK PARA CERRAR POPUP
  document.addEventListener("click", function(e){
    if (e.target.matches(".popup-cerrar")) cerrarLetra();
    if (e.target.classList.contains("popup-overlay")) cerrarLetra();
  });

})();

// ===============================
// AUMENTAR Y REDUCIR TAMAÑO
// ===============================
function cambiarFuente(delta) {
    window.tamañoFuente += delta;

    // límites
    if (window.tamañoFuente < 10) window.tamañoFuente = 10;
    if (window.tamañoFuente > 40) window.tamañoFuente = 40;

    const letra = document.getElementById("popupTexto");
    letra.style.fontSize = window.tamañoFuente + "px";

    // Ajustar también los acordes
    letra.querySelectorAll("span").forEach(span => {
        span.style.fontSize = window.tamañoFuente + "px";
    });
}
