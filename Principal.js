

/* ========================
   1. ENCABEZADO Y NAVEGACIÓN SPA
======================== */
/* ========================
   AUDIO PLAYER LOGIC
======================== */
let currentAudio = null;
let currentAudioBtn = null;

const SVG_PLAY = `<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" style="display: block;"><path d="M8 5v14l11-7z"/></svg>`;
const SVG_PAUSE = `<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" style="display: block;"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;

function updateIcon(el, iconName) {
    if (!el) return;
    el.innerHTML = `<i data-lucide="${iconName}"></i>`;
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

window.toggleAudio = function(url, btn) {
    const audioProgress = document.getElementById("audioProgress");
    const audioTime = document.getElementById("audioTime");

    function formatTime(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    }

    // Si ya hay un audio cargado y es el mismo URL
        if (currentAudio && currentAudio.dataset.url === url) {
        if (currentAudio.paused) {
            currentAudio.play();
            btn.classList.add("playing");
            if (btn.id === "btnToolAudio") btn.innerHTML = SVG_PAUSE;
            else updateIcon(btn, "pause");
        } else {
            currentAudio.pause();
            btn.classList.remove("playing");
            if (btn.id === "btnToolAudio") btn.innerHTML = SVG_PLAY;
            else updateIcon(btn, "play");
        }
    } else {
        // Si hay un audio diferente sonando, lo detenemos
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            if (currentAudioBtn) {
                currentAudioBtn.classList.remove("playing");
                if (currentAudioBtn.id === "btnToolAudio") currentAudioBtn.innerHTML = SVG_PLAY;
                else updateIcon(currentAudioBtn, "play");
            }
        }
        
        // Creamos la nueva instancia
        currentAudio = new Audio(url);
        currentAudio.dataset.url = url; // Guardamos el URL para identificarlo
        currentAudioBtn = btn;
        
        currentAudio.play().catch(err => console.error("Error al reproducir audio:", err));
        btn.classList.add("playing");
        if (btn.id === "btnToolAudio") btn.innerHTML = SVG_PAUSE;
        else updateIcon(btn, "pause");
        
        currentAudio.onloadedmetadata = () => {
            if (audioProgress) audioProgress.max = currentAudio.duration;
        };

        currentAudio.ontimeupdate = () => {
            if (audioProgress) audioProgress.value = currentAudio.currentTime;
            if (audioTime) audioTime.textContent = formatTime(currentAudio.currentTime);
        };

        currentAudio.onended = () => {
            btn.classList.remove("playing");
            updateIcon(btn, "play");
            if (audioProgress) audioProgress.value = 0;
            if (audioTime) audioTime.textContent = "0:00";
            currentAudio = null;
            currentAudioBtn = null;
        };
    }
};

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
   5. CATEGORÍAS DEL SUBMENÚ (AHORA ÍNDICE)
======================== */
document.querySelectorAll("#submenu a, #submenu li a").forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    const category = link.dataset.category || link.textContent.trim();
    window.abrirIndice(category);
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

  const isMobile = window.innerWidth <= 600;
  const maxButtons = isMobile ? 5 : 10;

  const btnPrev5 = document.createElement("button");
  btnPrev5.innerHTML = "«";
  btnPrev5.className = "nav-btn";
  btnPrev5.disabled = currentPage <= 1;
  btnPrev5.onclick = () => { 
    currentPage = Math.max(1, currentPage - 5); 
    showPage(currentPage); 
  };
  paginationContainer.appendChild(btnPrev5);

  const btnPrev1 = document.createElement("button");
  btnPrev1.innerHTML = "‹";
  btnPrev1.className = "nav-btn";
  btnPrev1.disabled = currentPage <= 1;
  btnPrev1.onclick = () => { 
    currentPage = Math.max(1, currentPage - 1); 
    showPage(currentPage); 
  };
  paginationContainer.appendChild(btnPrev1);

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

  const btnNext1 = document.createElement("button");
  btnNext1.innerHTML = "›";
  btnNext1.className = "nav-btn";
  btnNext1.disabled = currentPage >= totalPages;
  btnNext1.onclick = () => { 
    currentPage = Math.min(totalPages, currentPage + 1); 
    showPage(currentPage); 
  };
  paginationContainer.appendChild(btnNext1);

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
window.chordNotation = localStorage.getItem("chordNotation") || "english"; 
window.transposeOffset = 0; 

const NOTES_ENG = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const BEMOLES_MAP = { "Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#" };
const LATIN_MAP = { 
  'C': 'Do', 'C#': 'Do#', 'D': 'Re', 'D#': 'Re#', 'E': 'Mi', 
  'F': 'Fa', 'F#': 'Fa#', 'G': 'Sol', 'G#': 'Sol#', 'A': 'La', 'A#': 'La#', 'B': 'Si' 
};

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
        let cleanHtml = content.replace(/<span class="chord">[\s\S]*?<\/span>/g, "___CHORD___");
        const lines = cleanHtml.split(/\r?\n/);
        const processedLines = [];
        lines.forEach(line => {
            const lineWithoutChords = line.replace(/___CHORD___/g, "");
            const hasTags = /<[^>]+>/.test(lineWithoutChords);
            const hasText = /[^\s]/.test(lineWithoutChords.replace(/<[^>]+>/g, ""));
            if (hasTags || hasText) {
                processedLines.push(lineWithoutChords);
            } 
            else if (line.trim() === "" && processedLines.length > 0 && processedLines[processedLines.length - 1].trim() !== "") {
                processedLines.push("");
            }
        });
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
      if (song.audio) section.dataset.audio = song.audio;

      // UNIFICACIÓN DE ESTRUCTURA: Para que el buscador delegado funcione idéntico en ambas vistas
      section.innerHTML = `
        <div class="song-header">
          <div class="song-info-container">
            ${!esBusqueda ? `
              <span class="drag-handle">
                <svg width="12" height="18" viewBox="0 0 12 18" fill="currentColor">
                  <circle cx="2" cy="2" r="1.5" />
                  <circle cx="2" cy="9" r="1.5" />
                  <circle cx="2" cy="16" r="1.5" />
                  <circle cx="10" cy="2" r="1.5" />
                  <circle cx="10" cy="9" r="1.5" />
                  <circle cx="10" cy="16" r="1.5" />
                </svg>
              </span>` : ''}
            ${song.audio ? `<button class="audio-btn" onclick="window.toggleAudio('${song.audio}', this)" title="Escuchar audio"><i data-lucide="play"></i></button>` : ''}
            <div class="song-title-author">
                <h2 class="repertorio-title">${song.title}</h2>
                <small class="autor">${song.author || ""}</small>
            </div>
          </div>
          <div class="song-btns">
            <button class="lyrics-btn" ${song.audio ? `data-audio="${song.audio}"` : ''}>Ver letra</button>
            <button class="remove-button" onclick="borrarCancion('${song.title.replace(/'/g, "\\'")}')">
              <span class="icon"><i data-lucide="x"></i></span>
              <span class="text">Quitar</span>
            </button>
          </div>
        </div>
        <div class="lyrics-hidden" style="display:none;">${song.lyrics}</div>
      `;

      contenedor.appendChild(section);
    });

    // Inicializar SortableJS si no es una búsqueda
    if (!esBusqueda && lista.length > 0) {
      // Usamos window.Sortable para asegurar compatibilidad
      const SortableLib = window.Sortable;
      if (!SortableLib) return;

      // Destruir instancia previa si existe
      const oldSortable = SortableLib.get(contenedor);
      if (oldSortable) oldSortable.destroy();

      new SortableLib(contenedor, {
        handle: '.drag-handle',
        animation: 150,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        forceFallback: true, // Mejor compatibilidad táctil
        fallbackTolerance: 3, // Evita disparos accidentales
        onEnd: function (evt) {
          let rep = JSON.parse(localStorage.getItem("repertorio")) || [];
          const itemMovido = rep.splice(evt.oldIndex, 1)[0];
          rep.splice(evt.newIndex, 0, itemMovido);
          localStorage.setItem("repertorio", JSON.stringify(rep));
          
          // Actualizamos los dataset-index para consistencia
          Array.from(contenedor.children).forEach((child, i) => {
            child.dataset.index = i;
          });
        }
      });
    }
}

// Eliminamos addDragEvents ya que SortableJS se encarga de todo

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
      
      // Insertar etiquetas de tipo dinámicamente
      document.querySelectorAll(".song").forEach(song => {
        const audio = song.dataset.audio;
        if (audio) {
            const infoContainer = song.querySelector(".song-info-container");
            if (infoContainer && !infoContainer.querySelector(".audio-btn")) {
                const btn = document.createElement("button");
                btn.className = "audio-btn";
                btn.innerHTML = `<i data-lucide="play"></i>`;
                btn.title = "Escuchar audio";
                btn.onclick = (e) => {
                    e.stopPropagation();
                    window.toggleAudio(audio, btn);
                };
                if (window.lucide) window.lucide.createIcons();
                // Insertar después del drag-handle si existe, o al principio
                const handle = infoContainer.querySelector(".drag-handle");
                if (handle) handle.after(btn);
                else infoContainer.prepend(btn);
            }
            
            // También asegurar que el botón de letra tenga el data-audio
            const lyricsBtn = song.querySelector(".lyrics-btn");
            if (lyricsBtn) lyricsBtn.dataset.audio = audio;
        }

        const type = song.dataset.type || song.querySelector(".lyrics-btn")?.dataset.type;
        if (type) {
          const h2 = song.querySelector("h2");
          if (h2 && !h2.querySelector(".song-tag")) {
            // ELIMINADO: Ya no se agregan etiquetas en la lista principal
          }
        }
      });

      allSongs = Array.from(document.querySelectorAll(".song"));
      shuffleArray(allSongs);
      initSongButtons();
      initSearch();
      currentPage = 1;
      showPage(1);
      updateChordsVisibility();
      if (window.lucide) window.lucide.createIcons();
    });
}

function initSongButtons() {
  document.querySelectorAll(".add-repertorio").forEach(btn => {
    const songSection = btn.closest(".song");
    // Extraer título considerando ambas estructuras (Inicio y Repertorio)
    const title = songSection?.querySelector(".repertorio-title")?.textContent.trim() || 
                  songSection?.querySelector("h2")?.childNodes[0]?.textContent.trim() || 
                  songSection?.querySelector("h2 div")?.childNodes[0]?.textContent.trim() || "";
    let rep = JSON.parse(localStorage.getItem("repertorio")) || [];
    const isInRep = rep.some(s => s.title === title);
    actualizarBoton(btn, isInRep);

    btn.onclick = (e) => {
      e.preventDefault();
      let currentRep = JSON.parse(localStorage.getItem("repertorio")) || [];
      const index = currentRep.findIndex(s => s.title === title);
      if (index === -1) {
        const author = songSection.querySelector(".autor")?.textContent.trim() || "";
        const lyrics = songSection.querySelector(".lyrics-hidden, .lyrics, .lyrics1")?.innerHTML.trim();
        const type = songSection.dataset.type || "";
        const audio = songSection.dataset.audio || songSection.querySelector(".lyrics-btn")?.dataset.audio || "";
        currentRep.push({ title, author, lyrics, type, audio });
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
  if (window.lucide) window.lucide.createIcons();
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
    "Categorias/Ofertorio.html", "Categorias/Santo.html", "Categorias/PadreNuestro.html", "Categorias/Cordero.html",
    "Categorias/Comunion.html", "Categorias/AdoracionMeditacion.html", "Categorias/Anexo.html", "Categorias/Marianos.html",
    "Categorias/Salesianos.html","Categorias/Cuaresma.html", "Categorias/Pascua.html" ,
    "Categorias/Adviento.html", "Categorias/HimnosSalmos.html",
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
  const btnToolAudio = document.getElementById("btnToolAudio");
  const menuItemAudio = document.getElementById("menuItemAudio");
  
  const panelSize = document.getElementById("panelSize");
  const panelSpacing = document.getElementById("panelSpacing");
  const panelTranspose = document.getElementById("panelTranspose");
  const panelAudio = document.getElementById("panelAudio");
  
  const sizeSlider = document.getElementById("fontSizeSlider");
  const spacingSlider = document.getElementById("lineSpacingSlider");
  const audioProgress = document.getElementById("audioProgress");
  const audioTime = document.getElementById("audioTime");
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

  window.abrirLetra = function(titulo, letraHtml, autor, tipo, audioUrl) {
    const popup = document.getElementById("popupLetra");
    if (!popup) return;
    
    // Sistema dinámico de etiquetas
    const tagMapping = {
      "liturgico": { label: "Litúrgico", class: "tag-liturgico" },
      "personal": { label: "Personal", class: "tag-no-liturgico" },
      "no-liturgico": { label: "Personal", class: "tag-no-liturgico" },
      "domingo-ramos": { label: "Domingo de Ramos", class: "tag-semana-santa" },
      "jueves-santo": { label: "Jueves Santo", class: "tag-semana-santa" },
      "viernes-santo": { label: "Viernes Santo", class: "tag-semana-santa" },
      "vigilia-pascual": { label: "Vigilia Pascual", class: "tag-semana-santa" },
      "domingo-resurreccion": { label: "Domingo de Resurrección", class: "tag-semana-santa" },
      "navidad": { label: "Navidad", class: "tag-navidad" },
      "entrada": { label: "Canto de Entrada", class: "tag-misa" },
      "salida": { label: "Canto de Salida", class: "tag-misa" }
    };

    let tagHtml = "";
    if (tipo) {
      const info = tagMapping[tipo.toLowerCase()] || { 
        label: tipo.charAt(0).toUpperCase() + tipo.slice(1).replace(/-/g, ' '), 
        class: "tag-generic" 
      };
      tagHtml = `<span class="song-tag ${info.class}">Para uso: ${info.label}</span>`;
    }

    document.getElementById("popupTitulo").textContent = titulo;
    document.getElementById("popupAutor").textContent = autor;
    
    const tagContainer = document.getElementById("popupTagContainer");
    if (tagContainer) {
      tagContainer.innerHTML = tagHtml;
    }

    if (menuItemAudio && btnToolAudio) {
        const audioProgress = document.getElementById("audioProgress");
        const audioTime = document.getElementById("audioTime");

        if (audioUrl) {
            menuItemAudio.style.display = "flex";
            btnToolAudio.onclick = (e) => {
                e.stopPropagation();
                window.toggleAudio(audioUrl, btnToolAudio);
            };
            // Reset icon if it was playing another song
            if (currentAudio && currentAudio.dataset.url === audioUrl) {
                if (!currentAudio.paused) {
                    btnToolAudio.classList.add("playing");
                    btnToolAudio.innerHTML = SVG_PAUSE;
                }
                if (audioProgress) {
                    audioProgress.max = currentAudio.duration || 100;
                    audioProgress.value = currentAudio.currentTime;
                }
            } else {
                btnToolAudio.classList.remove("playing");
                btnToolAudio.innerHTML = SVG_PLAY;
                if (audioProgress) audioProgress.value = 0;
                if (audioTime) audioTime.textContent = "0:00";
            }
        } else {
            menuItemAudio.style.display = "none";
        }
    }

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
    if (window.lucide) window.lucide.createIcons();
    resetHideTimer();
  };

  window.cerrarLetra = () => {
    document.getElementById("popupLetra").style.display = "none";
    clearTimeout(hideTimer);
    
    // Detener audio al cerrar el popup
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        if (currentAudioBtn) {
            currentAudioBtn.classList.remove("playing");
            if (currentAudioBtn.id === "btnToolAudio") currentAudioBtn.innerHTML = SVG_PLAY;
            else updateIcon(currentAudioBtn, "play");
        }
        const audioProgress = document.getElementById("audioProgress");
        const audioTime = document.getElementById("audioTime");
        if (audioProgress) audioProgress.value = 0;
        if (audioTime) audioTime.textContent = "0:00";
        currentAudio = null;
        currentAudioBtn = null;
    }
  };

  settingsBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    const isActive = settingsBtn.classList.toggle("active");
    settingsMenu?.classList.toggle("active");
    if (!isActive) {
        panelSize?.classList.remove("active");
        panelSpacing?.classList.remove("active");
        panelTranspose?.classList.remove("active");
        panelAudio?.classList.remove("active");
        btnToolSize?.classList.remove("active");
        btnToolSpacing?.classList.remove("active");
        btnToolTranspose?.classList.remove("active");
        btnToolAudio?.classList.remove("active");
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

  btnToolAudio?.addEventListener("click", (e) => {
    e.stopPropagation();
    // Si el panel ya está activo, solo toggleamos el audio
    if (panelAudio?.classList.contains("active")) {
        // El toggle ya se maneja en el onclick dinámico de abrirLetra
    } else {
        // Si no está activo, lo mostramos y ocultamos los demás
        panelAudio?.classList.add("active");
        btnToolAudio.classList.add("active");
        
        panelSize?.classList.remove("active");
        panelSpacing?.classList.remove("active");
        panelTranspose?.classList.remove("active");
        btnToolSize?.classList.remove("active");
        btnToolSpacing?.classList.remove("active");
        btnToolTranspose?.classList.remove("active");
    }
  });

  audioProgress?.addEventListener("input", (e) => {
    if (currentAudio) {
        currentAudio.currentTime = e.target.value;
    }
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

  btnDownloadImage?.addEventListener("click", async () => {
    if (!window.htmlToImage) {
        alert("La librería de descarga aún no está lista.");
        return;
    }

    const originalCaptureArea = document.getElementById("captureArea");
    const titulo = document.getElementById("popupTitulo").textContent;
    const captureClone = originalCaptureArea.cloneNode(true);
    captureClone.classList.add("capture-mode");
    
    const settingsInClone = captureClone.querySelector(".popup-settings-wrapper");
    if (settingsInClone) settingsInClone.remove();
    captureClone.querySelectorAll(".popup-action-btn").forEach(btn => btn.remove());

    document.body.appendChild(captureClone);

    const pre = captureClone.querySelector(".popup-letra");
    const A4_WIDTH = 800; 
    const A4_HEIGHT_MAX = 1131; 
    const WORD_PT_TO_PX = 1.3333;
    const MIN_FONT_SINGLE = 12 * WORD_PT_TO_PX;
    const MIN_FONT_MULTI = 10 * WORD_PT_TO_PX;
    const MAX_FONT = 32 * WORD_PT_TO_PX;

    const checkOverflow = (fontSize, isMulti) => {
        pre.style.fontSize = fontSize + 'px';
        pre.querySelectorAll('span').forEach(s => s.style.fontSize = fontSize + 'px');
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
        const currentWidthLimit = isMulti ? (A4_WIDTH / 2.2) : (A4_WIDTH - 120);
        return { widthOverflow: maxLineWidth > currentWidthLimit, heightOverflow: captureClone.offsetHeight > A4_HEIGHT_MAX };
    };

    let currentFontSize = MIN_FONT_SINGLE;
    let initialCheck = checkOverflow(MIN_FONT_SINGLE, false);
    if (initialCheck.heightOverflow) {
        captureClone.classList.add('multi-column');
        let multiCheck = checkOverflow(MIN_FONT_SINGLE, true);
        if (multiCheck.heightOverflow || multiCheck.widthOverflow) currentFontSize = MIN_FONT_MULTI;
        else {
            currentFontSize = MIN_FONT_SINGLE;
            while (currentFontSize < MAX_FONT) {
                let nextSize = currentFontSize + 1;
                let check = checkOverflow(nextSize, true);
                if (check.heightOverflow || check.widthOverflow) break;
                currentFontSize = nextSize;
            }
        }
    } else {
        currentFontSize = MIN_FONT_SINGLE;
        while (currentFontSize < MAX_FONT) {
            let nextSize = currentFontSize + 1;
            let check = checkOverflow(nextSize, false);
            if (check.widthOverflow || check.heightOverflow) break;
            currentFontSize = nextSize;
        }
    }

    pre.style.fontSize = currentFontSize + 'px';
    pre.querySelectorAll('span').forEach(s => s.style.fontSize = currentFontSize + 'px');

    try {
        await new Promise(r => setTimeout(r, 400));
        const dataUrl = await window.htmlToImage.toPng(captureClone, {
            backgroundColor: '#ffffff',
            pixelRatio: 2,
            cacheBust: true,
            width: A4_WIDTH,
            height: captureClone.offsetHeight
        });
        const link = document.createElement('a');
        link.download = `${titulo.replace(/\s+/g, '_')}_VoxDei.png`;
        link.href = dataUrl;
        link.click();
    } catch (error) {
        alert("Ocurrió un error al generar la imagen profesional.");
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

  // LISTENER DELEGADO: Maneja Inicio y Repertorio de forma unificada
  document.addEventListener("click", e => {
    const btn = e.target.closest(".lyrics-btn");
    if (!btn || btn.onclick) return; 
    e.preventDefault();
    const songSection = btn.closest(".song");
    const lyrics = songSection?.querySelector(".lyrics-hidden, .lyrics, .lyrics1")?.innerHTML.trim();
    
    // Obtener título de forma robusta para ambas estructuras
    const h2 = songSection?.querySelector("h2");
    if (!h2) return;
    
    let title = "";
    if (h2.classList.contains("repertorio-title")) {
        title = h2.textContent.trim();
    } else if (h2.querySelector("div")) {
        // Estructura antigua de Repertorio (con div contenedor de título)
        title = h2.querySelector("div").childNodes[0]?.textContent.trim();
    } else {
        // Estructura de Inicio (título directo)
        title = h2.childNodes[0]?.textContent.trim();
    }
    
    const autor = songSection?.querySelector(".autor")?.textContent.trim();
    const tipo = songSection?.dataset.type || btn.dataset.type;
    const audio = songSection?.dataset.audio || btn.dataset.audio;
    window.abrirLetra(title, lyrics, autor, tipo, audio);
  });

  /* ========================
     12. LÓGICA DEL ÍNDICE
  ======================== */
  const categoryConfig = {
    "Entrada": { name: "Entrada", order: 1 },
    "Penitencial": { name: "Penitencial", order: 2 },
    "Gloria": { name: "Gloria", order: 3 },
    "Aclamacion": { name: "Aclamación", order: 4 },
    "Ofertorio": { name: "Ofertorio", order: 5 },
    "Santo": { name: "Santo", order: 6 },
    "PadreNuestro": { name: "Padre Nuestro", order: 7 },
    "Cordero": { name: "Cordero", order: 8 },
    "Comunión": { name: "Comunión", order: 9 },
    "AdoracionMeditacion": { name: "Adoración y Meditación", order: 10 },
    "Marianos": { name: "Marianos", order: 11 },
    "Salesianos": { name: "Salesianos", order: 12 },
    "Cuaresma": { name: "Cuaresma", order: 13 },
    "Pascua": { name: "Pascua", order: 14 },
    "Adviento": { name: "Adviento y Navidad", order: 15 },
    "HimnosSalmos": { name: "Himnos y Salmos", order: 16 }
  };

  window.abrirIndice = (categoria) => {
    const popup = document.getElementById("popupIndice");
    const titleElem = document.getElementById("indexTitle");
    const bodyElem = document.getElementById("indexBody");
    if (!popup || !bodyElem) return;

    const catNormal = categoria.toLowerCase();
    const config = Object.values(categoryConfig).find(c => c.name.toLowerCase() === catNormal) || 
                   categoryConfig[categoria] || 
                   { name: categoria, order: 99 };

    titleElem.textContent = catNormal === "todos" ? "INDICE GENERAL" : `INDICE ${config.name.toUpperCase()}`;
    bodyElem.innerHTML = "";

    if (catNormal === "todos") {
      // Agrupar por categorías
      const categories = {};
      allSongs.forEach(song => {
        const catKey = song.dataset.category || "Otros";
        if (!categories[catKey]) categories[catKey] = [];
        categories[catKey].push(song);
      });

      // Ordenar categorías según el orden definido
      const sortedCatKeys = Object.keys(categories).sort((a, b) => {
        const orderA = categoryConfig[a]?.order || 99;
        const orderB = categoryConfig[b]?.order || 99;
        return orderA - orderB;
      });

      sortedCatKeys.forEach(catKey => {
        const section = document.createElement("div");
        section.className = "index-section";
        const displayName = categoryConfig[catKey]?.name || catKey;
        section.innerHTML = `<h3>${displayName}</h3>`;
        
        const list = document.createElement("ul");
        list.className = "index-list";
        
        categories[catKey].sort((a, b) => {
          const titleA = a.querySelector("h2")?.textContent.trim() || "";
          const titleB = b.querySelector("h2")?.textContent.trim() || "";
          return titleA.localeCompare(titleB);
        }).forEach(song => {
          const title = song.querySelector("h2")?.childNodes[0]?.textContent.trim() || 
                        song.querySelector("h2 div")?.childNodes[0]?.textContent.trim() || "";
          const author = song.querySelector(".autor")?.textContent.trim() || "";
          const li = document.createElement("li");
          const authorHtml = author ? ` <span class="index-author">(${author})</span>` : "";
          li.innerHTML = `<a href="#" onclick="window.irACancion('${title.replace(/'/g, "\\'")}'); return false;">${title}${authorHtml}</a>`;
          list.appendChild(li);
        });
        section.appendChild(list);
        bodyElem.appendChild(section);
      });
    } else {
      // Solo una categoría
      const catKey = Object.keys(categoryConfig).find(k => k.toLowerCase() === catNormal || categoryConfig[k].name.toLowerCase() === catNormal) || categoria;
      
      const filtered = allSongs.filter(song => song.dataset.category === catKey || song.dataset.category?.toLowerCase() === catNormal)
        .sort((a, b) => {
          const titleA = a.querySelector("h2")?.textContent.trim() || "";
          const titleB = b.querySelector("h2")?.textContent.trim() || "";
          return titleA.localeCompare(titleB);
        });

      const list = document.createElement("ul");
      list.className = "index-single-list";
      filtered.forEach(song => {
        const title = song.querySelector("h2")?.childNodes[0]?.textContent.trim() || 
                      song.querySelector("h2 div")?.childNodes[0]?.textContent.trim() || "";
        const author = song.querySelector(".autor")?.textContent.trim() || "";
        const audio = song.dataset.audio || song.querySelector(".lyrics-btn")?.dataset.audio || "";
        const li = document.createElement("li");
        const authorHtml = author ? ` <span class="index-author">(${author})</span>` : "";
        li.innerHTML = `<a href="#" onclick="window.irACancion('${title.replace(/'/g, "\\'")}', '${audio}'); return false;">${title}${authorHtml}</a>`;
        list.appendChild(li);
      });
      bodyElem.appendChild(list);
    }

    popup.style.display = "flex";
  };

  window.cerrarIndice = () => {
    document.getElementById("popupIndice").style.display = "none";
  };

  window.irACancion = (titulo, audioUrl) => {
    const song = allSongs.find(s => {
      const t = s.querySelector("h2")?.childNodes[0]?.textContent.trim() || 
                s.querySelector("h2 div")?.childNodes[0]?.textContent.trim() || "";
      return t === titulo;
    });

    if (song) {
      const lyrics = song.querySelector(".lyrics-hidden, .lyrics, .lyrics1")?.innerHTML.trim();
      const autor = song.querySelector(".autor")?.textContent.trim();
      const tipo = song.dataset.type;
      const audio = audioUrl || song.dataset.audio || song.querySelector(".lyrics-btn")?.dataset.audio || "";
      window.abrirLetra(titulo, lyrics, autor, tipo, audio);
      window.cerrarIndice();
    }
  };

  document.addEventListener("click", e => {
    if (e.target.matches(".popup-cerrar") || e.target.classList.contains("popup-overlay")) {
      window.cerrarLetra();
      window.cerrarIndice();
    }
  });

  // Inicializar iconos de Lucide
  if (window.lucide) {
    window.lucide.createIcons();
  }
})();

// Asegurar que los iconos se creen al final de la carga
if (window.lucide) window.lucide.createIcons();
