
/* ========================
   1. ENCABEZADO Y NAVEGACIÓN SPA
======================== */
const homeBtn = document.getElementById("homeBtn");
const pageTitle = document.getElementById("pageTitle");
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const sidebarClose = document.getElementById("sidebarClose");
const overlay = document.getElementById("overlay");
const topbar = document.querySelector(".topbar");

// Vistas
const viewHome = document.getElementById("view-home");
const viewRepertorio = document.getElementById("view-repertorio");
const navInicio = document.getElementById("nav-inicio");
const navRepertorio = document.getElementById("nav-repertorio");

function closeSidebar() {
  sidebar?.classList.remove("active");
  overlay?.classList.remove("active");
  sidebar?.setAttribute("aria-hidden", "true");
  topbar?.classList.remove("hidden");
}

function switchView(view) {
  const alreadyInHome = (view === "home" && viewHome?.style.display !== "none");
  const alreadyInRepertorio = (view === "repertorio" && viewRepertorio?.style.display !== "none");

  if (view === "home") {
    if (viewHome) viewHome.style.display = "block";
    if (viewRepertorio) viewRepertorio.style.display = "none";
    navInicio?.classList.add("active");
    navRepertorio?.classList.remove("active");
    updateTitle("CANCIONERO DIGITAL");
  } else if (view === "repertorio") {
    if (viewHome) viewHome.style.display = "none";
    if (viewRepertorio) viewRepertorio.style.display = "block";
    navInicio?.classList.remove("active");
    navRepertorio?.classList.add("active");
    updateTitle("MI REPERTORIO");
    renderizarRepertorio(JSON.parse(localStorage.getItem("repertorio")) || []);
  }
  closeSidebar();
  
  // Solo hace scroll si realmente cambiamos de una sección a otra (Home <-> Repertorio)
  if (!alreadyInHome && !alreadyInRepertorio) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

menuBtn?.addEventListener("click", () => {
  sidebar?.classList.add("active");
  overlay?.classList.add("active");
  sidebar?.setAttribute("aria-hidden", "false");
  topbar?.classList.add("hidden");
});

sidebarClose?.addEventListener("click", closeSidebar);
overlay?.addEventListener("click", closeSidebar);

homeBtn?.addEventListener("click", () => switchView("home"));
navInicio?.addEventListener("click", (e) => { e.preventDefault(); switchView("home"); });
navRepertorio?.addEventListener("click", (e) => { e.preventDefault(); switchView("repertorio"); });

const toggleSubmenu = document.getElementById("toggleSubmenu");
const submenu = document.getElementById("submenu");
toggleSubmenu?.addEventListener("click", e => {
  e.preventDefault();
  submenu?.classList.toggle("open");
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
const searchRepertorioInput = document.getElementById("searchRepertorioInput");

function initSearch() {
  searchInput?.addEventListener("keyup", () => {
    const filter = searchInput.value.toLowerCase();
    allSongs.forEach(song => {
      const title = song.querySelector("h2")?.textContent.toLowerCase() || "";
      const text = (song.querySelector(".lyrics, .lyrics1, .lyrics-hidden")?.textContent || "").toLowerCase();
      song.style.display = (title.includes(filter) || text.includes(filter)) ? "block" : "none";
    });
  });

  if (searchRepertorioInput) {
    searchRepertorioInput.addEventListener("input", (e) => {
      const termino = e.target.value.toLowerCase().trim();
      let rep = JSON.parse(localStorage.getItem("repertorio")) || [];
      if (termino === "") {
        renderizarRepertorio(rep, false);
      } else {
        const filtrado = rep.filter(song => 
          song.title.toLowerCase().includes(termino) || 
          (song.author && song.author.toLowerCase().includes(termino))
        );
        renderizarRepertorio(filtrado, true);
      }
    });
  }
}

/* ========================
   4. FILTRO POR CATEGORÍAS
======================== */
const categoryButtons = document.querySelectorAll(".category-btn");
categoryButtons.forEach(button => {
  button.addEventListener("click", () => {
    categoryButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    const selectedCategory = button.dataset.category?.toLowerCase();
    if (viewHome && viewHome.style.display === "none") switchView("home");
    filterByCategory(selectedCategory);
  });
});

const catScroll = document.getElementById("catScroll");
const catLeft = document.getElementById("catLeftBtn");
const catRight = document.getElementById("catRightBtn");

if (catScroll && catLeft && catRight) {
  const scrollAmount = 250;
  function updateCategoryArrows() {
    catLeft.classList.toggle("disabled", catScroll.scrollLeft <= 0);
    const atEnd = catScroll.scrollLeft + catScroll.clientWidth >= catScroll.scrollWidth - 2;
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
  catScroll.addEventListener("scroll", updateCategoryArrows);
  updateCategoryArrows();
}

/* ========================
   5. CATEGORÍAS DEL SUBMENÚ
======================== */
document.querySelectorAll("#submenu a, #submenu li a").forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    const category = link.textContent.trim().toLowerCase() || link.dataset.category?.toLowerCase();
    const mainBtn = Array.from(document.querySelectorAll(".category-btn"))
      .find(btn => btn.textContent.trim().toLowerCase() === category);
    if (mainBtn) mainBtn.click();
    switchView("home");
    closeSidebar();
  });
});

/* ========================
   6. PAGINACIÓN INTELIGENTE
======================== */
const songsPerPage = 5;
let currentPage = 1;
let allSongs = [];
let filteredSongs = [];

function renderPagination() {
  const paginationContainer = document.getElementById("pagination");
  if (!paginationContainer) return;
  paginationContainer.innerHTML = "";

  const list = filteredSongs.length > 0 ? filteredSongs : allSongs;
  const totalPages = Math.ceil(list.length / songsPerPage);
  if (totalPages <= 1) return;

  // Determinar número de botones visibles según dispositivo
  const isMobile = window.innerWidth <= 600;
  const maxButtons = isMobile ? 5 : 10;

  // Botón Salto -5
  const btnPrev5 = document.createElement("button");
  btnPrev5.innerHTML = "«";
  btnPrev5.className = "nav-btn";
  btnPrev5.disabled = currentPage <= 1;
  btnPrev5.onclick = () => { 
    currentPage = Math.max(1, currentPage - 5); 
    showPage(currentPage); 
  };
  paginationContainer.appendChild(btnPrev5);

  // Botón Retroceder 1
  const btnPrev1 = document.createElement("button");
  btnPrev1.innerHTML = "‹";
  btnPrev1.className = "nav-btn";
  btnPrev1.disabled = currentPage <= 1;
  btnPrev1.onclick = () => { 
    currentPage = Math.max(1, currentPage - 1); 
    showPage(currentPage); 
  };
  paginationContainer.appendChild(btnPrev1);

  // Calcular rango de números
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = startPage + maxButtons - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === currentPage) btn.classList.add("active");
    btn.onclick = () => {
      currentPage = i;
      showPage(currentPage);
    };
    paginationContainer.appendChild(btn);
  }

  // Botón Avanzar 1
  const btnNext1 = document.createElement("button");
  btnNext1.innerHTML = "›";
  btnNext1.className = "nav-btn";
  btnNext1.disabled = currentPage >= totalPages;
  btnNext1.onclick = () => { 
    currentPage = Math.min(totalPages, currentPage + 1); 
    showPage(currentPage); 
  };
  paginationContainer.appendChild(btnNext1);

  // Botón Salto +5
  const btnNext5 = document.createElement("button");
  btnNext5.innerHTML = "»";
  btnNext5.className = "nav-btn";
  btnNext5.disabled = currentPage >= totalPages;
  btnNext5.onclick = () => { 
    currentPage = Math.min(totalPages, currentPage + 5); 
    showPage(currentPage); 
  };
  paginationContainer.appendChild(btnNext5);
}

// Escuchar cambios de tamaño para re-renderizar paginación
window.addEventListener('resize', renderPagination);

function showPage(page) {
  const container = document.getElementById("songsContainer");
  if (!container) return;
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

function filterByCategory(category) {
  if (category === "todos") filteredSongs = [];
  else filteredSongs = allSongs.filter(song => song.dataset.category?.toLowerCase() === category);
  currentPage = 1;
  showPage(currentPage);
}

/* ==============================
   7. MOSTRAR / OCULTAR ACORDES, NOTACIÓN & TRANSPOSICIÓN
============================== */
const toggleChordsBtn = document.getElementById("toggleChordsBtn");
window.showChords = localStorage.getItem("showChords") !== "false";
window.chordNotation = localStorage.getItem("chordNotation") || "english"; // "english" o "latin"
window.transposeOffset = 0; // Offset de semitonos

// Escala cromática maestra
const NOTES_ENG = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const BEMOLES_MAP = { "Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#" };
const LATIN_MAP = { 
  'C': 'Do', 'C#': 'Do#', 'D': 'Re', 'D#': 'Re#', 'E': 'Mi', 
  'F': 'Fa', 'F#': 'Fa#', 'G': 'Sol', 'G#': 'Sol#', 'A': 'La', 'A#': 'La#', 'B': 'Si' 
};

/**
 * Función robusta que maneja TRANSPOSICIÓN y TRADUCCIÓN A LATÍN
 */
function processChordString(text, semitones, toLatin) {
    let result = "";
    let debt = 0;
    let i = 0;
    
    while (i < text.length) {
        const char = text[i];
        const isNoteStart = (i === 0 || /[\s\-\/\(]/.test(text[i - 1]));
        const match = isNoteStart ? text.substring(i).match(/^([A-G][#b]?)/) : null;
        
        if (match) {
            let root = match[1];
            i += root.length;
            let normalized = BEMOLES_MAP[root] || root;
            let idx = NOTES_ENG.indexOf(normalized);
            let transposedRoot = root;
            if (idx !== -1) {
                let newIdx = (idx + semitones) % 12;
                if (newIdx < 0) newIdx += 12;
                transposedRoot = NOTES_ENG[newIdx];
            }
            let finalRoot = toLatin ? (LATIN_MAP[transposedRoot] || transposedRoot) : transposedRoot;
            debt += (finalRoot.length - root.length);
            result += finalRoot;
        } 
        else if (char === " " && debt > 0) {
            debt--;
            i++;
        } 
        else {
            result += char;
            i++;
        }
    }
    return result;
}

function getOriginalKey(html) {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    const firstChord = temp.querySelector(".chord");
    if (!firstChord) return null;
    let note = firstChord.textContent.trim().match(/^([A-G][#b]?)/);
    if (!note) return null;
    let root = note[1];
    let normalized = BEMOLES_MAP[root] || root;
    return window.chordNotation === "latin" ? (LATIN_MAP[normalized] || normalized) : normalized;
}

window.renderPopupLyrics = function() {
    const textoElem = document.getElementById("popupTexto");
    const transpInfoElem = document.getElementById("popupTranspInfo");
    if(!textoElem || !window.originalPopupLyrics) return;

    let content = window.originalPopupLyrics;

    if (window.transposeOffset !== 0) {
        const originalKey = getOriginalKey(window.originalPopupLyrics);
        if (originalKey) {
            const offsetStr = (window.transposeOffset > 0 ? "+" : "") + window.transposeOffset;
            transpInfoElem.textContent = `Tono Original: ${originalKey} | Transposición: ${offsetStr} semitono(s)`;
            transpInfoElem.style.display = "block";
        } else {
            transpInfoElem.style.display = "none";
        }
    } else {
        transpInfoElem.style.display = "none";
    }

    if (window.showChords) {
        const temp = document.createElement("div");
        temp.innerHTML = content;
        temp.querySelectorAll(".chord").forEach(span => {
            span.textContent = processChordString(span.textContent, window.transposeOffset, window.chordNotation === "latin");
        });
        content = temp.innerHTML;
        textoElem.innerHTML = content;
        textoElem.classList.remove("sin-acordes");
    } else {
        // CORRECCIÓN FINAL: PROTECCIÓN DE ETIQUETAS ESTRUCTURALES (b, strong, etc)
        // 1. Eliminamos los spans de acordes pero conservamos TODO lo demás
        let cleanHtml = content.replace(/<span class="chord">[\s\S]*?<\/span>/g, "");
        
        // 2. Procesamos por líneas para eliminar huecos pero respetando etiquetas
        const lines = cleanHtml.split(/\r?\n/);
        const processedLines = [];
        
        lines.forEach(line => {
            // Un línea se conserva si tiene texto visible O si tiene etiquetas HTML (b, strong, etc)
            const hasTags = /<[^>]+>/.test(line); // Detecta cualquier tag
            const hasText = /[^\s]/.test(line.replace(/<[^>]+>/g, "")); // Texto real sin contar tags ni espacios
            
            if (hasTags || hasText) {
                processedLines.push(line);
            } 
            // Si es una línea verdaderamente en blanco (entre estrofas), preservamos solo una para el espaciado
            else if (line.trim() === "" && processedLines.length > 0 && processedLines[processedLines.length - 1].trim() !== "") {
                processedLines.push("");
            }
        });
        
        // Limpieza de colas vacías
        while(processedLines.length > 0 && processedLines[processedLines.length - 1].trim() === "") processedLines.pop();
        
        textoElem.innerHTML = processedLines.join("\n");
        textoElem.classList.add("sin-acordes");
    }
    
    if(window.tamañoFuente) {
        textoElem.style.fontSize = window.tamañoFuente + "px";
        textoElem.querySelectorAll("span").forEach(s => s.style.fontSize = window.tamañoFuente + "px");
    }
    if(window.espaciadoLinea) {
        textoElem.style.lineHeight = window.espaciadoLinea;
    }
};

function updateChordsVisibility() {
  if (toggleChordsBtn) toggleChordsBtn.textContent = window.showChords ? "Ocultar acordes" : "Mostrar acordes";
  document.querySelectorAll(".chord").forEach(span => span.style.display = window.showChords ? "inline" : "none");
  const popup = document.getElementById("popupLetra");
  if (popup && popup.style.display !== "none") window.renderPopupLyrics();
  localStorage.setItem("showChords", window.showChords);
}

toggleChordsBtn?.addEventListener("click", e => {
  e.preventDefault();
  window.showChords = !window.showChords;
  updateChordsVisibility();
});

/* ========================
   8. REPERTORIO (DRAG & DROP + LÓGICA)
======================== */
let dragSrcEl = null;
let touchDragEl = null;

function parseChords(text) {
  if (!text) return "";
  return text.replace(/\[([A-G][#b]?m?(?:7|maj7|sus4|dim|aug)?)\]/g, '<span class="chord">$1</span>');
}

function renderizarRepertorio(lista, esBusqueda = false) {
    const contenedor = document.getElementById("repertorio-list");
    const mensajeVacio = document.getElementById("empty-message");
    const contadorCanciones = document.getElementById("contador-canciones");
    if (!contenedor) return;
    
    contenedor.innerHTML = "";
    let repertorioActual = JSON.parse(localStorage.getItem("repertorio")) || [];

    if (contadorCanciones) {
        const total = repertorioActual.length;
        contadorCanciones.textContent = `${total} ${total === 1 ? 'CANCIÓN ELEGIDA' : 'CANCIONES ELEGIDAS'}`;
    }

    if (lista.length === 0) {
      if (!esBusqueda && mensajeVacio) mensajeVacio.style.display = "block";
      else contenedor.innerHTML = "<p style='text-align:center; padding: 20px; color: #aaa;'>No se encontraron resultados.</p>";
      return;
    }
    
    if (mensajeVacio) mensajeVacio.style.display = "none";

    lista.forEach((song, index) => {
      const section = document.createElement("section");
      section.classList.add("song");
      section.dataset.index = index;
      if (!esBusqueda) section.setAttribute("draggable", "false"); 

      section.innerHTML = `
        <div class="song-header">
          <h2 style="display: flex; align-items: center; flex: 1; overflow: hidden;">
            ${!esBusqueda ? '<span class="drag-handle" style="cursor:grab; margin-right:15px; color:#888; flex-shrink: 0;">☰</span>' : ''}
            <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${song.title}
                <small class="autor">${song.author || ""}</small>
            </div>
          </h2>
          <div class="song-btns">
            <button class="lyrics-btn" onclick="abrirLetraRepertorio('${encodeURIComponent(JSON.stringify(song))}')">Ver letra</button>
            <button class="remove-button" onclick="borrarCancion('${song.title.replace(/'/g, "\\'")}')">
              <span class="icon">✕</span>
              <span class="text">Quitar</span>
            </button>
          </div>
        </div>
      `;

      if (!esBusqueda) {
        const handle = section.querySelector('.drag-handle');
        handle.addEventListener('mousedown', () => section.setAttribute("draggable", "true"));
        handle.addEventListener('mouseup', () => section.setAttribute("draggable", "false"));
        addDragEvents(section);
      }
      contenedor.appendChild(section);
    });
}

function addDragEvents(item) {
  item.addEventListener('dragstart', function(e) {
    this.classList.add('dragging');
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
  });
  item.addEventListener('dragover', function(e) { 
    e.preventDefault(); 
    this.classList.add('over');
    return false; 
  });
  item.addEventListener('dragenter', function() { this.classList.add('over'); });
  item.addEventListener('dragleave', function() { this.classList.remove('over'); });
  item.addEventListener('drop', function(e) {
    if (dragSrcEl !== this) {
      let rep = JSON.parse(localStorage.getItem("repertorio")) || [];
      const fromIdx = parseInt(dragSrcEl.dataset.index);
      const toIdx = parseInt(this.dataset.index);
      const itemMovido = rep.splice(fromIdx, 1)[0];
      rep.splice(toIdx, 0, itemMovido);
      localStorage.setItem("repertorio", JSON.stringify(rep));
      renderizarRepertorio(rep);
    }
    return false;
  });
  item.addEventListener('dragend', function() {
    this.classList.remove('dragging');
    this.setAttribute("draggable", "false");
    document.querySelectorAll('.song').forEach(i => i.classList.remove('over'));
  });
}

window.abrirLetraRepertorio = function(dataEncoded) {
  const song = JSON.parse(decodeURIComponent(dataEncoded));
  const letraHtml = parseChords(song.lyrics);
  window.abrirLetra(song.title, letraHtml, song.author);
};

window.borrarCancion = function(title) {
  if (!confirm(`¿Deseas eliminar "${title}" del repertorio?`)) return;
  let rep = JSON.parse(localStorage.getItem("repertorio")) || [];
  rep = rep.filter(s => s.title !== title);
  localStorage.setItem("repertorio", JSON.stringify(rep));
  renderizarRepertorio(rep);
  initSongButtons();
};

document.getElementById("btnLimpiarRepertorio")?.addEventListener("click", () => {
    let rep = JSON.parse(localStorage.getItem("repertorio")) || [];
    if (rep.length === 0) return;
    if (confirm("¿Estás seguro de que deseas eliminar TODAS las canciones de tu repertorio?")) {
        localStorage.removeItem("repertorio");
        renderizarRepertorio([]);
        initSongButtons();
    }
});

/* ========================
   9. CARGA Y BOTONES PRINCIPALES
======================== */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function loadSongs(files) {
  const container = document.getElementById("songsContainer");
  if (!container) return;
  Promise.all(files.map(f => fetch(f).then(r => r.text()).catch(() => "")))
    .then(htmls => {
      container.innerHTML = htmls.join("");
      allSongs = Array.from(document.querySelectorAll(".song"));
      shuffleArray(allSongs);
      initSongButtons();
      initSearch();
      currentPage = 1;
      showPage(1);
      updateChordsVisibility();
    });
}

function initSongButtons() {
  document.querySelectorAll(".add-repertorio").forEach(btn => {
    const songSection = btn.closest(".song");
    const title = songSection?.querySelector("h2")?.childNodes[0]?.textContent.trim() || "";
    let rep = JSON.parse(localStorage.getItem("repertorio")) || [];
    const isInRep = rep.some(s => s.title === title);
    actualizarBoton(btn, isInRep);

    btn.onclick = (e) => {
      e.preventDefault();
      let currentRep = JSON.parse(localStorage.getItem("repertorio")) || [];
      const index = currentRep.findIndex(s => s.title === title);
      if (index === -1) {
        const author = songSection.querySelector(".autor")?.textContent.trim() || "";
        const lyrics = songSection.querySelector(".lyrics-hidden, .lyrics, .lyrics")?.innerHTML.trim();
        currentRep.push({ title, author, lyrics });
        localStorage.setItem("repertorio", JSON.stringify(currentRep));
        actualizarBoton(btn, true);
      } else {
        if (!confirm(`¿Deseas eliminar "${title}" del repertorio?`)) return;
        currentRep.splice(index, 1);
        localStorage.setItem("repertorio", JSON.stringify(currentRep));
        actualizarBoton(btn, false);
      }
      if (viewRepertorio?.style.display !== "none") renderizarRepertorio(currentRep);
    };
  });
}

function actualizarBoton(btn, activo) {
  const icon = btn.querySelector(".icon");
  const text = btn.querySelector(".text");
  if (activo) {
    btn.classList.add("active");
    if(icon) icon.textContent = "✔";
    if(text) text.textContent = "En repertorio";
  } else {
    btn.classList.remove("active");
    if(icon) icon.textContent = "+";
    if(text) text.textContent = "Añadir al repertorio";
  }
}

/* ========================
   10. MODO CLARO / OSCURO
======================== */
document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("themeToggle");
  if (localStorage.getItem("theme") === "light") document.body.classList.add("light-mode");
  if (themeToggle) themeToggle.textContent = document.body.classList.contains("light-mode") ? "Modo Oscuro" : "Modo Claro";

  themeToggle?.addEventListener("click", (e) => {
    e.preventDefault();
    document.body.classList.toggle("light-mode");
    const isLight = document.body.classList.contains("light-mode");
    localStorage.setItem("theme", isLight ? "light" : "dark");
    themeToggle.textContent = isLight ? "Modo Oscuro" : "Modo Claro";
    updateLogos();
  });

  function updateLogos() {
    document.querySelectorAll(".logo").forEach(logo => {
      const lightSrc = logo.getAttribute("data-light");
      if (document.body.classList.contains("light-mode") && lightSrc) {
        if (!logo.dataset.dark) logo.dataset.dark = logo.getAttribute("src");
        logo.setAttribute("src", lightSrc);
      } else if (logo.dataset.dark) {
        logo.setAttribute("src", logo.dataset.dark);
      }
    });
  }
  updateLogos();

  loadSongs([
    "Categorias/Entrada.html", "Categorias/Penitencial.html", "Categorias/Gloria.html", "Categorias/Aclamacion.html",
    "Categorias/Ofertorio.html", "Categorias/Santo.html", "Categorias/Cordero.html", "Categorias/Comunion.html",
    "Categorias/PosComunion.html", "Categorias/Marianos.html", "Categorias/Adoracion.html", "Categorias/Salesianos.html", 
    "Categorias/Adviento.html", "Categorias/Hakuna.html"
  ]);
});

/* ===============================
   11. POPUP DE LETRAS & AJUSTES
=============================== */
(function(){
  window.tamañoFuente = parseInt(localStorage.getItem("fontSize")) || 16;
  window.espaciadoLinea = parseFloat(localStorage.getItem("lineSpacing")) || 1.6;
  window.originalPopupLyrics = "";
  let hideTimer = null;

  const settingsWrapper = document.getElementById("popupSettingsWrapper");
  const settingsBtn = document.getElementById("popupSettingsBtn");
  const settingsMenu = document.getElementById("settingsMenu");
  
  const btnToolSize = document.getElementById("btnToolSize");
  const btnToolSpacing = document.getElementById("btnToolSpacing");
  const btnToolTranspose = document.getElementById("btnToolTranspose");
  const btnToolNotation = document.getElementById("btnToolNotation");
  
  const panelSize = document.getElementById("panelSize");
  const panelSpacing = document.getElementById("panelSpacing");
  const panelTranspose = document.getElementById("panelTranspose");
  
  const sizeSlider = document.getElementById("fontSizeSlider");
  const spacingSlider = document.getElementById("lineSpacingSlider");
  const transposeValueDisplay = document.getElementById("transposeValue");
  const btnTransposeUp = document.getElementById("btnTransposeUp");
  const btnTransposeDown = document.getElementById("btnTransposeDown");
  const btnDownloadImage = document.getElementById("btnDownloadImage");
  
  const popupBody = document.querySelector(".popup-body");

  function resetHideTimer() {
    if (settingsMenu?.classList.contains("active")) {
        clearTimeout(hideTimer);
        return;
    }
    settingsWrapper?.classList.remove("hidden-fab");
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
        if (!settingsMenu?.classList.contains("active")) settingsWrapper?.classList.add("hidden-fab");
    }, 3000);
  }

  window.abrirLetra = function(titulo, letraHtml, autor) {
    const popup = document.getElementById("popupLetra");
    if (!popup) return;
    document.getElementById("popupTitulo").textContent = titulo;
    document.getElementById("popupAutor").textContent = autor;
    window.originalPopupLyrics = letraHtml;
    
    window.transposeOffset = 0;
    if (transposeValueDisplay) transposeValueDisplay.textContent = "0";

    settingsMenu?.classList.remove("active");
    settingsBtn?.classList.remove("active");
    panelSize?.classList.remove("active");
    panelSpacing?.classList.remove("active");
    panelTranspose?.classList.remove("active");
    btnToolSize?.classList.remove("active");
    btnToolSpacing?.classList.remove("active");
    btnToolTranspose?.classList.remove("active");

    if(sizeSlider) sizeSlider.value = window.tamañoFuente;
    if(spacingSlider) spacingSlider.value = window.espaciadoLinea;
    if(btnToolNotation) btnToolNotation.textContent = window.chordNotation === "english" ? "C" : "Do";

    window.renderPopupLyrics();
    popup.style.display = "flex";
    resetHideTimer();
  };

  window.cerrarLetra = () => {
    document.getElementById("popupLetra").style.display = "none";
    clearTimeout(hideTimer);
  };

  settingsBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    const isActive = settingsBtn.classList.toggle("active");
    settingsMenu?.classList.toggle("active");
    if (!isActive) {
        panelSize?.classList.remove("active");
        panelSpacing?.classList.remove("active");
        panelTranspose?.classList.remove("active");
        btnToolSize?.classList.remove("active");
        btnToolSpacing?.classList.remove("active");
        btnToolTranspose?.classList.remove("active");
        resetHideTimer();
    } else clearTimeout(hideTimer);
  });

  btnToolSize?.addEventListener("click", (e) => {
    e.stopPropagation();
    btnToolSize.classList.toggle("active");
    panelSize?.classList.toggle("active");
    panelSpacing?.classList.remove("active");
    panelTranspose?.classList.remove("active");
    btnToolSpacing?.classList.remove("active");
    btnToolTranspose?.classList.remove("active");
  });

  btnToolSpacing?.addEventListener("click", (e) => {
    e.stopPropagation();
    btnToolSpacing.classList.toggle("active");
    panelSpacing?.classList.toggle("active");
    panelSize?.classList.remove("active");
    panelTranspose?.classList.remove("active");
    btnToolSize?.classList.remove("active");
    btnToolTranspose?.classList.remove("active");
  });

  btnToolTranspose?.addEventListener("click", (e) => {
    e.stopPropagation();
    btnToolTranspose.classList.toggle("active");
    panelTranspose?.classList.toggle("active");
    panelSize?.classList.remove("active");
    panelSpacing?.classList.remove("active");
    btnToolSize?.classList.remove("active");
    btnToolSpacing?.classList.remove("active");
  });

  btnTransposeUp?.addEventListener("click", (e) => {
    e.stopPropagation();
    window.transposeOffset++;
    if (transposeValueDisplay) transposeValueDisplay.textContent = (window.transposeOffset > 0 ? "+" : "") + window.transposeOffset;
    window.renderPopupLyrics();
  });

  btnTransposeDown?.addEventListener("click", (e) => {
    e.stopPropagation();
    window.transposeOffset--;
    if (transposeValueDisplay) transposeValueDisplay.textContent = (window.transposeOffset > 0 ? "+" : "") + window.transposeOffset;
    window.renderPopupLyrics();
  });

  btnToolNotation?.addEventListener("click", (e) => {
      e.stopPropagation();
      window.chordNotation = window.chordNotation === "english" ? "latin" : "english";
      localStorage.setItem("chordNotation", window.chordNotation);
      btnToolNotation.textContent = window.chordNotation === "english" ? "C" : "Do";
      window.renderPopupLyrics();
  });

  sizeSlider?.addEventListener("input", (e) => {
    window.tamañoFuente = parseInt(e.target.value);
    localStorage.setItem("fontSize", window.tamañoFuente);
    window.renderPopupLyrics();
  });

  spacingSlider?.addEventListener("input", (e) => {
    window.espaciadoLinea = parseFloat(e.target.value);
    localStorage.setItem("lineSpacing", window.espaciadoLinea);
    window.renderPopupLyrics();
  });

  // LÓGICA DE DESCARGA AVANZADA (MOTOR DINÁMICO A4 PROFESIONAL)
  btnDownloadImage?.addEventListener("click", async () => {
    if (!window.htmlToImage) {
        alert("La librería de descarga aún no está lista.");
        return;
    }

    const originalCaptureArea = document.getElementById("captureArea");
    const titulo = document.getElementById("popupTitulo").textContent;
    
    // Clonación profunda para renderizado en segundo plano
    const captureClone = originalCaptureArea.cloneNode(true);
    captureClone.classList.add("capture-mode");
    
    // Limpiar UI del clon
    const settingsInClone = captureClone.querySelector(".popup-settings-wrapper");
    if (settingsInClone) settingsInClone.remove();
    captureClone.querySelectorAll(".popup-action-btn").forEach(btn => btn.remove());

    document.body.appendChild(captureClone);

    const pre = captureClone.querySelector(".popup-letra");
    const A4_WIDTH = 800; // Ancho fijo base de la hoja
    const A4_HEIGHT_MAX = 1131; // Alto proporcional A4 (proporción 1:1.414)
    const PADDING_TOTAL = 120; // Márgenes laterales sumados (60 + 60)
    const CONTENT_WIDTH_LIMIT = A4_WIDTH - PADDING_TOTAL;

    // Conversión pt (Word) a px (CSS) -> 1pt ≈ 1.333px
    const WORD_PT_TO_PX = 1.3333;
    const MIN_FONT_SINGLE = 12 * WORD_PT_TO_PX; // 12pt Word
    const MIN_FONT_MULTI = 10 * WORD_PT_TO_PX; // 10pt Word
    const MAX_FONT = 32 * WORD_PT_TO_PX; // Máximo para evitar exageraciones

    /**
     * Función que verifica si el contenido desborda horizontalmente o verticalmente
     */
    const checkOverflow = (fontSize, isMulti) => {
        pre.style.fontSize = fontSize + 'px';
        pre.querySelectorAll('span').forEach(s => s.style.fontSize = fontSize + 'px');
        
        // Medir ancho de la línea más larga sin wrapping para el cálculo
        const lines = pre.textContent.split('\n');
        const testSpan = document.createElement('span');
        testSpan.style.fontFamily = getComputedStyle(pre).fontFamily;
        testSpan.style.fontSize = fontSize + 'px';
        testSpan.style.visibility = 'hidden';
        testSpan.style.position = 'absolute';
        testSpan.style.whiteSpace = 'pre';
        document.body.appendChild(testSpan);
        
        let maxLineWidth = 0;
        lines.forEach(line => {
            testSpan.textContent = line;
            maxLineWidth = Math.max(maxLineWidth, testSpan.offsetWidth);
        });
        document.body.removeChild(testSpan);
        
        // Límite de ancho depende de si es 1 o 2 columnas
        const currentWidthLimit = isMulti ? (CONTENT_WIDTH_LIMIT / 2.2) : CONTENT_WIDTH_LIMIT;
        const widthOverflow = maxLineWidth > currentWidthLimit;
        const heightOverflow = captureClone.offsetHeight > A4_HEIGHT_MAX;

        return { widthOverflow, heightOverflow };
    };

    // --- ALGORITMO DE AJUSTE INTELIGENTE ---
    let currentFontSize = MIN_FONT_SINGLE;
    let isMultiColumn = false;

    // 1. Verificar si cabe en 1 columna con el mínimo (12pt)
    let initialCheck = checkOverflow(MIN_FONT_SINGLE, false);
    
    if (initialCheck.heightOverflow) {
        // Demasiado larga: Activar 2 columnas
        isMultiColumn = true;
        captureClone.classList.add('multi-column');
        
        // Probar si cabe en 2 columnas con 12pt, si no, bajar hasta 10pt
        let multiCheck = checkOverflow(MIN_FONT_SINGLE, true);
        if (multiCheck.heightOverflow || multiCheck.widthOverflow) {
            currentFontSize = MIN_FONT_MULTI; // Forzar a 10pt
        } else {
            // Si cabe con 12pt en multi-columna, intentar subir un poco
            currentFontSize = MIN_FONT_SINGLE;
            while (currentFontSize < MAX_FONT) {
                let nextSize = currentFontSize + 1;
                let check = checkOverflow(nextSize, true);
                if (check.heightOverflow || check.widthOverflow) break;
                currentFontSize = nextSize;
            }
        }
    } else {
        // Cabe en 1 columna: Escalar hacia arriba desde 12pt hasta tocar bordes
        currentFontSize = MIN_FONT_SINGLE;
        while (currentFontSize < MAX_FONT) {
            let nextSize = currentFontSize + 1;
            let check = checkOverflow(nextSize, false);
            if (check.widthOverflow || check.heightOverflow) break;
            currentFontSize = nextSize;
        }
    }

    // Aplicar tamaño final encontrado
    pre.style.fontSize = currentFontSize + 'px';
    pre.querySelectorAll('span').forEach(s => s.style.fontSize = currentFontSize + 'px');

    try {
        // Espera de seguridad para renderizado final
        await new Promise(r => setTimeout(r, 400));

        const finalWidth = A4_WIDTH;
        const finalHeight = captureClone.offsetHeight; // Trim automático al final del texto

        const dataUrl = await window.htmlToImage.toPng(captureClone, {
            backgroundColor: '#ffffff',
            pixelRatio: 2,
            cacheBust: true,
            width: finalWidth,
            height: finalHeight,
            style: {
                left: '0',
                top: '0',
                opacity: '1',
                visibility: 'visible',
                transform: 'none'
            }
        });
        
        const link = document.createElement('a');
        link.download = `${titulo.replace(/\s+/g, '_')}_VoxDei.png`;
        link.href = dataUrl;
        link.click();
    } catch (error) {
        console.error('Error durante la descarga:', error);
        alert("Ocurrió un error al generar la imagen profesional. Inténtalo de nuevo.");
    } finally {
        if (document.body.contains(captureClone)) document.body.removeChild(captureClone);
    }
  });

  popupBody?.addEventListener("scroll", resetHideTimer);
  popupBody?.addEventListener("click", resetHideTimer);
  popupBody?.addEventListener("touchstart", resetHideTimer);

  document.addEventListener("click", (e) => {
    if (settingsMenu?.classList.contains("active") && !settingsWrapper.contains(e.target)) {
      settingsMenu.classList.remove("active");
      settingsBtn.classList.remove("active");
      panelSize?.classList.remove("active");
      panelSpacing?.classList.remove("active");
      panelTranspose?.classList.remove("active");
      btnToolSize?.classList.remove("active");
      btnToolSpacing?.classList.remove("active");
      btnToolTranspose?.classList.remove("active");
      resetHideTimer();
    }
  });

  document.addEventListener("click", e => {
    const btn = e.target.closest(".lyrics-btn");
    if (!btn || btn.onclick) return; 
    e.preventDefault();
    const songSection = btn.closest(".song");
    const lyrics = songSection?.querySelector(".lyrics-hidden, .lyrics, .lyrics1")?.innerHTML.trim();
    const title = songSection?.querySelector("h2")?.childNodes[0]?.textContent.trim();
    const autor = songSection?.querySelector(".autor")?.textContent.trim();
    window.abrirLetra(title, lyrics, autor);
  });

  document.addEventListener("click", e => {
    if (e.target.matches(".popup-cerrar") || e.target.classList.contains("popup-overlay")) window.cerrarLetra();
  });
})();
