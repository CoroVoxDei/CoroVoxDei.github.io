/* ========================
   1. ENCABEZADO Y NAVEGACIÓN SPA
======================== */
/* ========================
   AUDIO PLAYER LOGIC
======================== */
let currentAudio = null;
let currentAudioBtn = null;

const SVG_PLAY = `<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" style="display: block;"><path d="M8 5v14l11-7z"/></svg>`;
const SVG_PAUSE = `<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" style="display: block;"><path d="M6 5h3v14H6V5zm9 0h3v14h-3V5z"/></svg>`;

// Iconos para el menú lateral
const SVG_SUN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
const SVG_MOON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
const SVG_MUSIC = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
const SVG_MUSIC_OFF = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><line x1="2" y1="2" x2="22" y2="22"/><path d="M9 13V5l12-2v5"/><path d="M9 18v-1"/><circle cx="6" cy="18" r="3"/><path d="M18 16a3 3 0 0 0-3-3"/></svg>`;

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
    updateTitle("Mi Repertorio");
    renderizarRepertorio(JSON.parse(localStorage.getItem("repertorio")) || []);
    if (window.renderizarRepertoriosGuardados) {
      window.renderizarRepertoriosGuardados();
    }
  }
  closeSidebar();
  
  if (!alreadyInHome && !alreadyInRepertorio) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}
window.switchView = switchView;

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
  let currentSearchFilter = "title"; // title, author, lyrics

  if (searchInput) {
    searchInput.addEventListener("focus", (e) => {
      // En celulares, desplazar la pantalla suavemente para que todo se deslice hacia arriba,
      // dejando la barra de búsqueda justo debajo del topbar, sin recortar, deformar, ni achicar nada del inicio.
      if (window.innerWidth <= 768) {
        setTimeout(() => {
          const searchBarSec = document.querySelector(".search-bar");
          if (searchBarSec) {
            const topbar = document.querySelector(".topbar");
            const topbarHeight = topbar ? topbar.offsetHeight : 75;
            const elementPosition = searchBarSec.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - topbarHeight - 12; // Deja un espacio visual estético de 12px y evita que se tape
            
            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth"
            });
          }
        }, 300); // Pequeño delay para esperar que el teclado virtual empiece a mostrarse
      }
    });

    searchInput.addEventListener("input", () => {
      // También re-scroll en inputs largos si es necesario para mantener la vista arriba
      if (window.innerWidth <= 768) {
        const searchBarSec = document.querySelector(".search-bar");
        if (searchBarSec) {
          const topbar = document.querySelector(".topbar");
          const topbarHeight = topbar ? topbar.offsetHeight : 75;
          const elementPosition = searchBarSec.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementPosition - topbarHeight - 12;
          
          if (Math.abs(window.pageYOffset - offsetPosition) > 30) {
            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth"
            });
          }
        }
      }
    });
  }

  // Desplegable de filtros de búsqueda (toggling show class)
  const toggleFiltersBtn = document.getElementById("toggleSearchFilters");
  const filtersContainer = document.querySelector(".search-filters-container");
  if (toggleFiltersBtn && filtersContainer) {
    toggleFiltersBtn.onclick = (e) => {
      e.preventDefault();
      const isShown = filtersContainer.classList.toggle("show");
      toggleFiltersBtn.classList.toggle("active", isShown);
    };
  }

  const filterButtons = document.querySelectorAll(".search-filter-btn");
  filterButtons.forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentSearchFilter = btn.dataset.filter || "title";
      
      // Forzar búsqueda con la nueva categoría de filtro
      if (searchInput) {
        searchInput.dispatchEvent(new Event("keyup"));
      }
    };
  });

  // Helpers para búsqueda mejorada
  const normalize = (str) => {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  };

  const levenshtein = (a, b) => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
        }
      }
    }
    return matrix[b.length][a.length];
  };

  // Mapeo de categorías para búsqueda
  const catMap = {
    "Entrada": "Entrada", "Penitencial": "Penitencial", "Gloria": "Gloria",
    "Aclamacion": "Aclamación", "Ofertorio": "Ofertorio", "Santo": "Santo",
    "PadreNuestro": "Padre Nuestro", "Cordero": "Cordero", "Comunión": "Comunión",
    "AdoracionMeditacion": "Adoración y Meditación", "EnvioSalida": "Salida y Envío",
    "Marianos": "Marianos", "Salesianos": "Salesianos", "Cuaresma": "Cuaresma",
    "Pascua": "Pascua", "Adviento": "Adviento y Navidad", "HimnosSalmos": "Himnos y Salmos",
    "Contemporáneo" : "Contemporáneo"
  };

  const matchWord = (qWord, nTitle, nLyrics, nAuthor, nCategory, titleWords, lyricsWordSet, lyricsWords, songAllWords, allSearchableWords) => {
    if (currentSearchFilter === "title") {
      if (nTitle.includes(qWord)) return { matched: true, field: 'title' };
      if (qWord.length >= 3) {
        const fuzzyDetected = titleWords.some(tWord => {
          if (Math.abs(tWord.length - qWord.length) > 2) return false;
          const dist = levenshtein(tWord, qWord);
          return dist <= (qWord.length > 5 ? 2 : 1);
        });
        if (fuzzyDetected) return { matched: true, field: 'fuzzy' };
      }
      return { matched: false };
    }
    
    if (currentSearchFilter === "author") {
      if (nAuthor.includes(qWord)) return { matched: true, field: 'author' };
      const authorWords = nAuthor.split(/[\s,.\-!¡?¿]+/);
      if (qWord.length >= 3) {
        const fuzzyDetected = authorWords.some(aWord => {
          if (Math.abs(aWord.length - qWord.length) > 2) return false;
          const dist = levenshtein(aWord, qWord);
          return dist <= (qWord.length > 5 ? 2 : 1);
        });
        if (fuzzyDetected) return { matched: true, field: 'fuzzy' };
      }
      return { matched: false };
    }

    if (currentSearchFilter === "category") {
      if (nCategory.includes(qWord)) return { matched: true, field: 'category' };
      const categoryWords = nCategory.split(/[\s,.\-!¡?¿]+/);
      if (qWord.length >= 3) {
        const fuzzyDetected = categoryWords.some(cWord => {
          if (Math.abs(cWord.length - qWord.length) > 2) return false;
          const dist = levenshtein(cWord, qWord);
          return dist <= (qWord.length > 5 ? 2 : 1);
        });
        if (fuzzyDetected) return { matched: true, field: 'fuzzy' };
      }
      return { matched: false };
    }

    if (currentSearchFilter === "lyrics") {
      if (lyricsWordSet.has(qWord) || nLyrics.includes(qWord)) return { matched: true, field: 'lyrics' };
      if (qWord.length >= 3) {
        const fuzzyDetected = lyricsWords.some(lWord => {
          if (Math.abs(lWord.length - qWord.length) > 2) return false;
          const dist = levenshtein(lWord, qWord);
          return dist <= (qWord.length > 5 ? 2 : 1);
        });
        if (fuzzyDetected) return { matched: true, field: 'fuzzy' };
      }
      return { matched: false };
    }

    // Fallback por seguridad
    if (nTitle.includes(qWord)) return { matched: true, field: 'title' };
    if (nAuthor.includes(qWord)) return { matched: true, field: 'author' };
    if (nCategory.includes(qWord)) return { matched: true, field: 'category' };
    if (lyricsWordSet.has(qWord) || nLyrics.includes(qWord)) return { matched: true, field: 'lyrics' };
    
    if (qWord.length >= 3) {
      const fuzzyDetected = allSearchableWords.some(tWord => {
        if (Math.abs(tWord.length - qWord.length) > 2) return false;
        const dist = levenshtein(tWord, qWord);
        return dist <= (qWord.length > 5 ? 2 : 1);
      });
      if (fuzzyDetected) return { matched: true, field: 'fuzzy' };
    }
    return { matched: false };
  };

  const calculateSongScore = (song, query) => {
    const nTitle = normalize(song.querySelector("h2")?.textContent || "");
    const nLyrics = normalize(song.querySelector(".lyrics, .lyrics1, .lyrics-hidden")?.textContent || "");
    const categoryId = song.dataset.category || "";
    const categoryName = catMap[categoryId] || categoryId;
    const songType = song.dataset.type || "";
    const nCategory = normalize(categoryName + " " + songType);
    const nAuthor = normalize(song.querySelector(".autor")?.textContent || "");

    const nQuery = normalize(query);
    if (!nQuery) return { score: 0, hasTitleMatch: false, hasAuthorMatch: false };

    const queryWords = nQuery.split(/\s+/);
    const titleWords = nTitle.split(/[\s,.\-!¡?¿]+/);
    const lyricsWords = nLyrics.split(/[\s,.\-!¡?¿]+/);
    const lyricsWordSet = new Set(lyricsWords);

    const songAllWords = [...titleWords, ...nAuthor.split(/[\s,.\-!¡?¿]+/), ...nCategory.split(/[\s,.\-!¡?¿]+/)];
    const allSearchableWords = [...songAllWords, ...lyricsWords];

    let allMatched = true;
    for (const qWord of queryWords) {
      const m = matchWord(qWord, nTitle, nLyrics, nAuthor, nCategory, titleWords, lyricsWordSet, lyricsWords, songAllWords, allSearchableWords);
      if (!m.matched) {
        allMatched = false;
        break;
      }
    }

    if (!allMatched) return { score: 0, hasTitleMatch: false, hasAuthorMatch: false };

    let score = 0;
    let hasTitleMatch = false;
    let hasAuthorMatch = false;

    // Coincidencia exacta/frase-completa en título
    if (nTitle === nQuery) {
      score += 100000;
      hasTitleMatch = true;
    } else if (nTitle.startsWith(nQuery)) {
      score += 50000;
      hasTitleMatch = true;
    } else if (nTitle.includes(nQuery)) {
      score += 20000;
      hasTitleMatch = true;
    }

    // Coincidencias palabra por palabra en título
    let titleMatchesCount = 0;
    queryWords.forEach(qWord => {
      if (titleWords.includes(qWord)) {
        titleMatchesCount++;
        hasTitleMatch = true;
      } else if (titleWords.some(t => t.includes(qWord))) {
        titleMatchesCount += 0.5;
        hasTitleMatch = true;
      }
    });
    score += titleMatchesCount * 5000;

    // Coincidencias de autor
    if (nAuthor === nQuery) {
      score += 4000;
      hasAuthorMatch = true;
    } else if (nAuthor.includes(nQuery)) {
      score += 2000;
      hasAuthorMatch = true;
    }

    // Coincidencias de categoría
    let hasCategoryMatch = false;
    if (nCategory === nQuery) {
      score += 1500;
      hasCategoryMatch = true;
    } else if (nCategory.includes(nQuery)) {
      score += 500;
      hasCategoryMatch = true;
    } else {
      queryWords.forEach(qWord => {
        if (nCategory.includes(qWord)) {
          hasCategoryMatch = true;
        }
      });
    }

    // Coincidencias de frase de letra
    if (nLyrics.includes(nQuery)) {
      score += 100;
    }

    // Coincidencias por palabra de letra
    let lyricsMatchesCount = 0;
    queryWords.forEach(qWord => {
      if (lyricsWordSet.has(qWord)) {
        lyricsMatchesCount++;
      } else if (lyricsWords.some(l => l.includes(qWord))) {
        lyricsMatchesCount += 0.5;
      }
    });
    score += lyricsMatchesCount * 10;

    return { score, hasTitleMatch, hasAuthorMatch, hasCategoryMatch };
  };

  // Función tradicional de coincidencia fuzzy (usada por otros componentes como repertorio)
  const fuzzyMatch = (text, query) => {
    const nText = normalize(text);
    const nQuery = normalize(query);
    if (!nQuery) return true;
    
    if (nText.includes(nQuery)) return true;

    const queryWords = nQuery.split(/\s+/);
    const textWords = nText.split(/[\s,.\-!¡?¿]+/);

    return queryWords.every(qWord => {
      if (qWord.length < 3) return textWords.some(tWord => tWord.includes(qWord));
      
      return textWords.some(tWord => {
        if (Math.abs(tWord.length - qWord.length) > 2) return false;
        if (tWord.includes(qWord)) return true;
        const dist = levenshtein(tWord, qWord);
        return dist <= (qWord.length > 5 ? 2 : 1);
      });
    });
  };

  searchInput?.addEventListener("keyup", () => {
    const filter = searchInput.value;
    
    if (!filter.trim()) {
      const activeBtn = document.querySelector(".category-btn.active");
      const activeCategory = activeBtn ? activeBtn.dataset.category?.toLowerCase() : "todos";
      
      const container = document.getElementById("songsContainer");
      if (container) {
        allSongs.forEach(song => container.appendChild(song));
      }
      
      filterByCategory(activeCategory);
      return;
    }

    const songsWithScore = allSongs.map(song => {
      const res = calculateSongScore(song, filter);
      return { 
        song, 
        score: res.score, 
        hasTitleMatch: res.hasTitleMatch, 
        hasAuthorMatch: res.hasAuthorMatch,
        hasCategoryMatch: res.hasCategoryMatch
      };
    });

    const matched = songsWithScore.filter(item => item.score > 0);
    
    let filteredSongsList = [];
    if (currentSearchFilter === "title") {
      filteredSongsList = matched.filter(item => item.hasTitleMatch);
    } else if (currentSearchFilter === "author") {
      filteredSongsList = matched.filter(item => item.hasAuthorMatch);
    } else if (currentSearchFilter === "category") {
      filteredSongsList = matched.filter(item => item.hasCategoryMatch);
    } else {
      // De lo contrario (ej. "letra" o sin filtro), permitimos cualquier coincidencia con puntuación positiva
      filteredSongsList = matched;
    }

    filteredSongsList.sort((a, b) => b.score - a.score);

    const sortedSongs = filteredSongsList.map(item => item.song);

    const container = document.getElementById("songsContainer");
    if (container) {
      sortedSongs.forEach(song => container.appendChild(song));
    }

    filteredSongs = sortedSongs;
    currentPage = 1;
    showPage(currentPage);
  });

  if (searchRepertorioInput) {
    searchRepertorioInput.addEventListener("input", (e) => {
      const filter = e.target.value;
      let rep = JSON.parse(localStorage.getItem("repertorio")) || [];
      if (!filter.trim()) {
        renderizarRepertorio(rep, false);
      } else {
        const filtrado = rep.filter(song => {
          const searchableText = `${song.title} ${song.author || ""} ${song.type || ""}`;
          return fuzzyMatch(searchableText, filter);
        });
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
let currentCategory = "todos";

function renderPagination() {
  const paginationContainer = document.getElementById("pagination");
  if (!paginationContainer) return;
  paginationContainer.innerHTML = "";

  const isSearchActive = searchInput && searchInput.value.trim() !== "";
  if (currentCategory !== "todos" || isSearchActive) {
    return;
  }

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
    const isSearchActive = searchInput && searchInput.value.trim() !== "";
    const isCategoryFiltered = currentCategory !== "todos";
    const list = (isSearchActive || isCategoryFiltered) ? filteredSongs : allSongs;

    if (isCategoryFiltered || isSearchActive) {
      allSongs.forEach(song => (song.style.display = "none"));
      
      if (list.length === 0) {
        let noResultsMsg = document.getElementById("search-no-results");
        if (!noResultsMsg) {
          noResultsMsg = document.createElement("div");
          noResultsMsg.id = "search-no-results";
          noResultsMsg.className = "search-no-results-msg";
          noResultsMsg.innerHTML = `
            <i data-lucide="search-x" class="no-results-icon"></i>
            <h3>No se encontraron cantos</h3>
            <p>Intenta con otras palabras clave o cambia el filtro de búsqueda.</p>
          `;
          container.appendChild(noResultsMsg);
          if (window.lucide) window.lucide.createIcons();
        } else {
          noResultsMsg.style.display = "flex";
        }
      } else {
        const noResultsMsg = document.getElementById("search-no-results");
        if (noResultsMsg) noResultsMsg.style.display = "none";
        
        list.forEach(song => {
          song.style.display = "block";
        });
      }
      
      const paginationContainer = document.getElementById("pagination");
      if (paginationContainer) paginationContainer.innerHTML = "";
    } else {
      const noResultsMsg = document.getElementById("search-no-results");
      if (noResultsMsg) noResultsMsg.style.display = "none";

      const start = (page - 1) * songsPerPage;
      const end = start + songsPerPage;
      allSongs.forEach(song => (song.style.display = "none"));
      list.forEach((song, index) => {
        song.style.display = (index >= start && index < end) ? "block" : "none";
      });
      renderPagination();
    }
    container.style.opacity = "1";
  }, 150);
}

function filterByCategory(category) {
  currentCategory = category;
  const container = document.getElementById("songsContainer");
  if (category === "todos") {
    filteredSongs = [];
    if (container) {
      allSongs.forEach(song => container.appendChild(song));
    }
  } else {
    filteredSongs = allSongs.filter(song => song.dataset.category?.toLowerCase() === category);
    // Ordenar filteredSongs alfabéticamente por título de forma robusta
    filteredSongs.sort((a, b) => {
      const infoA = window.getSongInfo(a);
      const infoB = window.getSongInfo(b);
      return infoA.title.localeCompare(infoB.title, 'es', { sensitivity: 'base' });
    });
    if (container) {
      filteredSongs.forEach(song => container.appendChild(song));
    }
  }
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

    // NORMALIZACIÓN ESTRUCTURAL PROACTIVA: Evita descuadres, doble pre-wrapping y acoplamiento de estrofas
    // 1. Quitar <pre> inicial/final si existiese duplicado para evitar estilos heredados no deseados
    content = content.replace(/^\s*<pre[^>]*>/i, "").replace(/<\/pre>\s*$/i, "");
    
    // 2. Normalizar las etiquetas de formato que están solas en líneas, evitando "saltos fantasma" al ocultar acordes
    content = content.replace(/\r?\n\s*(<(?:b|strong|i|em|u)>)\s*\r?\n/gi, '\n\n$1');
    content = content.replace(/\r?\n\s*(<\/(?:b|strong|i|em|u)>)\s*\r?\n/gi, '$1\n\n');
    
    // 3. Limpiar saltos de línea múltiples consecutivos redundantes
    content = content.replace(/\n{3,}/g, '\n\n');
    content = content.trim();

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
        const lines = content.split(/\r?\n/);
        const processedLines = [];
        let pendingOpeningTags = "";
        const tempDiv = document.createElement("div");

        lines.forEach(line => {
            // Permitir detección flexible de acordes (por clase o estructura)
            const hasChord = line.includes('class="chord"') || line.includes("class='chord'") || /class=['"]chord['"]/.test(line);
            const lineWithoutChords = line.replace(/<span[^>]*class=['"]chord['"][^>]*>[\s\S]*?<\/span>/g, "");
            
            // Usar la potencia del DOM para ignorar etiquetas HTML y entidades de espacio como &nbsp; de forma 100% fiable
            tempDiv.innerHTML = lineWithoutChords;
            const hasText = tempDiv.textContent.trim() !== "";

            if (hasText) {
                let cleanLine = lineWithoutChords;
                if (pendingOpeningTags) {
                    cleanLine = pendingOpeningTags + cleanLine;
                    pendingOpeningTags = "";
                }
                processedLines.push(cleanLine);
            } else {
                const tags = lineWithoutChords.match(/<[^>]+>/g) || [];
                if (tags.length > 0) {
                    const closingTags = [];
                    const openingTags = [];
                    tags.forEach(tag => {
                        if (tag.startsWith("</")) {
                            closingTags.push(tag);
                        } else {
                            openingTags.push(tag);
                        }
                    });
                    if (closingTags.length > 0 && processedLines.length > 0) {
                        processedLines[processedLines.length - 1] += closingTags.join("");
                    }
                    if (openingTags.length > 0) {
                        pendingOpeningTags += openingTags.join("");
                    }
                }

                if (!hasChord && line.trim() === "") {
                    if (processedLines.length > 0 && processedLines[processedLines.length - 1] !== "") {
                        processedLines.push("");
                    }
                }
            }
        });

        if (pendingOpeningTags && processedLines.length > 0) {
            processedLines[processedLines.length - 1] += pendingOpeningTags;
        }

        while(processedLines.length > 0 && processedLines[processedLines.length - 1].trim() === "") {
            processedLines.pop();
        }

        textoElem.innerHTML = processedLines.join("\n");
        textoElem.classList.add("sin-acordes");
    }
    
    if(window.tamañoFuente) {
        textoElem.style.fontSize = window.tamañoFuente + "px";
    }
    if(window.espaciadoLinea) {
        textoElem.style.lineHeight = window.espaciadoLinea;
    }
};

function updateChordsVisibility() {
  if (toggleChordsBtn) {
    toggleChordsBtn.innerHTML = window.showChords 
      ? `${SVG_MUSIC_OFF} Ocultar acordes` 
      : `${SVG_MUSIC} Mostrar acordes`;
  }
  document.querySelectorAll(".chord").forEach(span => span.style.display = window.showChords ? "inline" : "none");
  const popup = document.getElementById("popupLetra");
  if (popup && popup.classList.contains("active")) window.renderPopupLyrics();
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
        contadorCanciones.textContent = `${total} ${total === 1 ? 'canción elegida' : 'canciones elegidas'}`;
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
      if (song.tags) section.dataset.tags = song.tags;
      if (song.category) section.dataset.category = song.category;
      if (song.type) section.dataset.type = song.type;

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
            
            <div class="song-title-author">
                <h2 class="repertorio-title">
                  <span class="song-title-text">${song.title}</span>
                  ${song.author ? `<span class="autor">(${window.cleanAuthor(song.author)})</span>` : ''}
                </h2>
            </div>
          </div>
          <div class="song-btns" onclick="event.stopPropagation();">
            <button class="remove-button" onclick="borrarCancion('${song.title.replace(/'/g, "\\'")}', '${(song.author || "").replace(/'/g, "\\'")}')">
              <span class="icon"><i data-lucide="x"></i></span>
              <span class="text">Quitar</span>
            </button>
          </div>
        </div>
        <div class="lyrics-hidden" style="display:none;">${song.lyrics}</div>
      `;

      contenedor.appendChild(section);
    });

    if (window.lucide) window.lucide.createIcons();

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
        onStart: function() {
          contenedor.classList.add('sorting-active');
        },
        onEnd: function (evt) {
          contenedor.classList.remove('sorting-active');
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

window.borrarCancion = function(title, author = "") {
  if (!confirm(`¿Deseas eliminar "${title}" del repertorio?`)) return;
  let rep = JSON.parse(localStorage.getItem("repertorio")) || [];
  rep = rep.filter(s => !(s.title === title && (s.author || "").trim() === author.trim()));
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

/* =========================================
   8.1 PERSISTENCIA DE MÚLTIPLES REPERTORIOS (GUARDADOS)
========================================= */
window.abrirGuardarRepertorio = function() {
  const rep = JSON.parse(localStorage.getItem("repertorio")) || [];
  const modal = document.getElementById("popupGuardarRepertorio");
  if (modal) {
    modal.classList.add("active");
    
    // Update dynamic selected songs counter in the save modal
    const badge = document.getElementById("saveRepertorioCountBadge");
    if (badge) {
      badge.textContent = `${rep.length} ${rep.length === 1 ? "canto seleccionado" : "cantos seleccionados"}`;
    }
    
    const input = document.getElementById("repertorioNameInput");
    if (input) {
      input.value = "";
      setTimeout(() => input.focus(), 100);
    }
    
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
};

window.cerrarGuardarRepertorio = function() {
  const modal = document.getElementById("popupGuardarRepertorio");
  if (modal) {
    modal.classList.remove("active");
  }
};

window.renderizarRepertoriosGuardados = function() {
  const contenedor = document.getElementById("saved-repertorios-list");
  if (!contenedor) return;
  
  contenedor.innerHTML = "";
  const saved = JSON.parse(localStorage.getItem("saved_repertorios")) || [];
  
  if (saved.length === 0) {
    contenedor.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: #777; font-style: italic; background: rgba(255, 255, 255, 0.02); border: 1px dashed rgba(255, 255, 255, 0.08); border-radius: 15px;">
        No tienes ningún repertorio guardado para otras ocasiones. ¡Guarda tu lista actual usando el botón de "Guardar Repertorio" de arriba!
      </div>
    `;
    return;
  }
  
  saved.forEach(rep => {
    const card = document.createElement("div");
    card.className = "saved-repertorio-card";
    
    const countText = rep.songs.length === 1 ? "1 canto" : `${rep.songs.length} cantos`;
    
    card.innerHTML = `
      <div class="saved-repertorio-info">
        <div class="saved-repertorio-name">${rep.name}</div>
        <div class="saved-repertorio-meta">
          <span class="saved-repertorio-date">${rep.date}</span>
          <span class="saved-repertorio-badge">${countText}</span>
        </div>
      </div>
      <div class="saved-repertorio-actions">
        <button class="btn-delete-repertorio" title="Eliminar este repertorio">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    `;

    // Asignar eventos de forma segura con JS para abrir el repertorio al hacer clic en la tarjeta
    card.onclick = () => window.abrirVerRepertorio(rep.id);
    card.querySelector(".btn-delete-repertorio").onclick = (e) => {
      e.stopPropagation();
      window.eliminarRepertorioGuardado(rep.id);
    };

    contenedor.appendChild(card);
  });
  
  if (window.lucide) window.lucide.createIcons();
};

window.currentSavedRepertorioId = null;
window.editSavedRepertorioMode = false;

function getGlobalSongsList() {
  if (!window.allSongs || window.allSongs.length === 0) {
    window.allSongs = Array.from(document.querySelectorAll(".song"));
  }
  return window.allSongs.map(songSection => {
    const info = window.getSongInfo(songSection);
    const lyrics = songSection.querySelector(".lyrics-hidden, .lyrics, .lyrics1")?.innerHTML.trim() || "";
    const type = songSection.dataset.type || "";
    const audio = songSection.dataset.audio || "";
    const tags = songSection.dataset.tags || window.getSongTag(songSection) || "";
    const category = songSection.dataset.category || "";
    return { title: info.title, author: info.author, lyrics, type, audio, tags, category };
  }).filter(s => s.title);
}

window.eliminarCantoDeRepertorioGuardado = function(repertorioId, songIndex) {
  const saved = JSON.parse(localStorage.getItem("saved_repertorios")) || [];
  const target = saved.find(r => r.id === repertorioId);
  if (!target) return;

  const songName = target.songs[songIndex]?.title || "este canto";
  if (confirm(`¿Estás seguro de que deseas quitar "${songName}" de este repertorio?`)) {
    target.songs.splice(songIndex, 1);
    localStorage.setItem("saved_repertorios", JSON.stringify(saved));
    window.renderizarRepertoriosGuardados(); // Actualiza contadores en la lista principal
    window.renderVerRepertorioDetalle();    // Re-renderiza detalle
  }
};

window.agregarCantoARepertorioGuardado = function(songData) {
  const id = window.currentSavedRepertorioId;
  const saved = JSON.parse(localStorage.getItem("saved_repertorios")) || [];
  const target = saved.find(r => r.id === id);
  if (!target) return;

  const existe = target.songs.some(s => s.title === songData.title && (s.author || "").trim() === (songData.author || "").trim());
  if (existe) {
    alert(`"${songData.title}" ya está en este repertorio.`);
    return;
  }

  target.songs.push(songData);
  localStorage.setItem("saved_repertorios", JSON.stringify(saved));
  window.renderizarRepertoriosGuardados(); // Actualiza la lista principal
  window.renderVerRepertorioDetalle();    // Actualiza el detalle
  
  // Limpiar/actualizar resultados rápidos de búsqueda
  const searchInput = document.getElementById("savedRepSongSearchInput");
  if (searchInput) {
    window.buscarCancionesParaRepertorioGuardado(searchInput.value);
  }
};

window.buscarCancionesParaRepertorioGuardado = function(query) {
  const container = document.getElementById("savedRepSongSearchResults");
  if (!container) return;

  if (!query || !query.trim()) {
    container.innerHTML = "";
    container.style.display = "none";
    return;
  }

  const cleanQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const allAvailable = getGlobalSongsList();

  const filtradas = allAvailable.filter(song => {
    const titleClean = song.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const authorClean = (song.author || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return titleClean.includes(cleanQuery) || authorClean.includes(cleanQuery);
  });

  if (filtradas.length === 0) {
    container.innerHTML = `<p style="padding: 12px; text-align: center; color: #888; font-size: 0.85rem;">No se encontraron canciones.</p>`;
    container.style.display = "block";
    return;
  }

  container.innerHTML = "";
  container.style.display = "block";

  filtradas.slice(0, 50).forEach(song => {
    const item = document.createElement("div");
    item.className = "saved-rep-search-item";

    const info = document.createElement("div");
    info.className = "saved-rep-search-info";
    info.innerHTML = `
      <span class="saved-rep-search-title">${song.title}</span>
      <span class="saved-rep-search-meta">${song.author ? `${song.author}` : ""} ${song.category ? `• ${song.category.toUpperCase()}` : ""}</span>
    `;

    const addBtn = document.createElement("button");
    addBtn.className = "btn-add-to-saved";
    addBtn.innerHTML = `<i data-lucide="plus" style="width: 12px; height: 12px;"></i> Añadir`;
    
    addBtn.onclick = () => {
      window.agregarCantoARepertorioGuardado(song);
    };

    item.appendChild(info);
    item.appendChild(addBtn);
    container.appendChild(item);
  });

  if (window.lucide) window.lucide.createIcons();
};

window.renderVerRepertorioDetalle = function() {
  const id = window.currentSavedRepertorioId;
  const saved = JSON.parse(localStorage.getItem("saved_repertorios")) || [];
  const target = saved.find(r => r.id === id);
  if (!target) return;

  const detailSection = document.getElementById("saved-repertorio-detail");
  const mainSection = document.getElementById("saved-repertorios-main");
  const title = document.getElementById("saved-repertorio-detail-title");
  const countBadge = document.getElementById("saved-repertorio-detail-count");
  const container = document.getElementById("saved-repertorio-detail-list");

  if (!detailSection || !mainSection || !container) return;

  // Título estático y cliqueable para renombrar de forma simple y amigable
  if (title) {
    title.textContent = target.name;
    title.style.cursor = "pointer";
    title.title = "Haz clic aquí para cambiar el nombre";
    title.onclick = (e) => {
      e.preventDefault();
      const nuevoNombre = prompt("Ingresa el nuevo nombre para este repertorio:", target.name);
      if (nuevoNombre && nuevoNombre.trim()) {
        target.name = nuevoNombre.trim();
        localStorage.setItem("saved_repertorios", JSON.stringify(saved));
        window.renderizarRepertoriosGuardados(); // Actualiza contadores en la lista principal
        window.renderVerRepertorioDetalle();    // Re-renderiza detalle
      }
    };
  }

  // El botón al costado del nombre ahora controla el Modo Edición de cantos
  const btnRename = document.getElementById("btnRenameSavedRepertorio");
  if (btnRename) {
    if (window.editSavedRepertorioMode) {
      btnRename.innerHTML = `<i data-lucide="check"></i>`;
      btnRename.title = "Terminar edición";
      btnRename.classList.add("editing-active");
    } else {
      btnRename.innerHTML = `<i data-lucide="edit-3"></i>`;
      btnRename.title = "Editar canciones";
      btnRename.classList.remove("editing-active");
    }

    btnRename.onclick = (e) => {
      e.preventDefault();
      window.editSavedRepertorioMode = !window.editSavedRepertorioMode;
      
      if (!window.editSavedRepertorioMode) {
        // Limpiar búsqueda rápida al salir
        const searchInput = document.getElementById("savedRepSongSearchInput");
        if (searchInput) {
          searchInput.value = "";
          window.buscarCancionesParaRepertorioGuardado("");
        }
      }
      window.renderVerRepertorioDetalle();
    };
  }

  if (countBadge) {
    const count = target.songs.length;
    countBadge.textContent = `${count} ${count === 1 ? 'canto' : 'cantos'}`;
  }

  container.innerHTML = "";

  if (target.songs.length === 0) {
    container.innerHTML = `<p style="text-align: center; color: #888; padding: 30px; font-family: 'Poppins', sans-serif; font-size: 0.9rem;">Este repertorio está vacío. Busca canciones abajo para agregarlas.</p>`;
  } else {
    const list = document.createElement("ul");
    list.className = "saved-rep-song-list";

    target.songs.forEach((song, idx) => {
      const li = document.createElement("li");
      li.className = "saved-rep-song-item";
      li.dataset.title = song.title;
      li.dataset.author = song.author || "";

      // En modo edición, mostramos el tirador de arrastre para ordenar
      if (window.editSavedRepertorioMode) {
        const handle = document.createElement("span");
        handle.className = "saved-rep-drag-handle";
        handle.title = "Arrastrar para reordenar";
        handle.innerHTML = `<i data-lucide="grip-vertical" style="width: 14px; height: 14px;"></i>`;
        li.appendChild(handle);
      }

      const infoA = document.createElement("a");
      infoA.className = "saved-rep-song-info";
      infoA.href = "#";
      infoA.onclick = (e) => {
        e.preventDefault();
        window.abrirLetra(song.title, song.lyrics, song.author, song.type, song.audio, song.tags);
      };

      // Limpiar doble paréntesis en el autor si existieran
      const cleanAuthor = window.cleanAuthor(song.author);
      const displayedAuthor = cleanAuthor ? `(${cleanAuthor})` : "";

      infoA.innerHTML = `
        <span class="saved-rep-song-number">${idx + 1}</span>
        <span class="saved-rep-song-title" title="${song.title}">${song.title}</span>
        ${displayedAuthor ? `<span class="saved-rep-song-author" title="${song.author}">${displayedAuthor}</span>` : ""}
      `;

      li.appendChild(infoA);

      if (window.editSavedRepertorioMode) {
        const removeBtn = document.createElement("button");
        removeBtn.className = "btn-remove-saved-song";
        removeBtn.title = "Eliminar de la lista";
        removeBtn.innerHTML = `<i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>`;
        removeBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          window.eliminarCantoDeRepertorioGuardado(id, idx);
        };
        li.appendChild(removeBtn);
      }

      list.appendChild(li);
    });

    container.appendChild(list);

    // Inicializar SortableJS para reordenación interactiva en tiempo real en modo edición
    if (window.editSavedRepertorioMode) {
      const SortableLib = window.Sortable;
      if (SortableLib) {
        const oldSortable = SortableLib.get(list);
        if (oldSortable) oldSortable.destroy();

        new SortableLib(list, {
          handle: '.saved-rep-drag-handle',
          animation: 150,
          ghostClass: 'sortable-ghost',
          chosenClass: 'sortable-chosen',
          dragClass: 'sortable-drag',
          forceFallback: true, // Mejor compatibilidad táctil
          fallbackTolerance: 3, // Evita disparos accidentales
          onStart: function() {
            list.classList.add('sorting-active');
          },
          onEnd: function() {
            list.classList.remove('sorting-active');
            const items = Array.from(list.querySelectorAll(".saved-rep-song-item"));
            const newSongs = items.map(item => {
              const sTitle = item.dataset.title;
              const sAuthor = item.dataset.author;
              return target.songs.find(s => s.title === sTitle && (s.author || "").trim() === (sAuthor || "").trim());
            }).filter(Boolean);

            target.songs = newSongs;
            localStorage.setItem("saved_repertorios", JSON.stringify(saved));
            window.renderizarRepertoriosGuardados(); // Actualiza contadores en la lista principal
            window.renderVerRepertorioDetalle();    // Re-renderiza para actualizar los números
          }
        });
      }
    }
  }

  const addSection = document.getElementById("saved-repertorio-add-section");
  if (addSection) {
    addSection.style.display = window.editSavedRepertorioMode ? "block" : "none";
  }

  if (window.lucide) window.lucide.createIcons();
};

window.abrirVerRepertorio = function(id) {
  window.currentSavedRepertorioId = id;
  window.editSavedRepertorioMode = false;

  const searchInput = document.getElementById("savedRepSongSearchInput");
  if (searchInput) {
    searchInput.value = "";
    // Asegurar que configuramos el event listener una vez
    if (!searchInput.dataset.listenerAttached) {
      searchInput.addEventListener("input", (e) => {
        window.buscarCancionesParaRepertorioGuardado(e.target.value);
      });
      searchInput.dataset.listenerAttached = "true";
    }
  }

  window.renderVerRepertorioDetalle();

  const detailSection = document.getElementById("saved-repertorio-detail");
  const mainSection = document.getElementById("saved-repertorios-main");
  if (mainSection) mainSection.style.display = "none";
  if (detailSection) detailSection.style.display = "block";

  if (window.lucide) window.lucide.createIcons();
};

window.compartirRepertorioId = function(id) {
  const saved = JSON.parse(localStorage.getItem("saved_repertorios")) || [];
  const target = saved.find(r => r.id === id);
  if (!target) return;
  
  if (target.songs.length === 0) {
    alert("Este repertorio está vacío. Agrega canciones antes de compartirlo.");
    return;
  }
  
  // Nuevo formato ultra compacto: NombreRepertorio|Cancion1|Cancion2...
  const plainText = [target.name, ...target.songs.map(s => s.title)].join('|');
  
  try {
    // Base64 robusto con soporte Unicode
    const base64 = btoa(encodeURIComponent(plainText).replace(/%([0-9A-F]{2})/g, function(match, p1) {
      return String.fromCharCode('0x' + p1);
    }));
    
    const shareUrl = `${window.location.origin}${window.location.pathname}#import=${base64}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert(`¡Enlace del repertorio "${target.name}" copiado al portapapeles!\n\nEnvía este link por WhatsApp o redes sociales. Al abrirlo, la otra persona podrá guardarlo y cargarlo automáticamente.`);
      }).catch(err => {
        prompt("Copia este enlace para compartir el repertorio:", shareUrl);
      });
    } else {
      prompt("Copia este enlace para compartir el repertorio:", shareUrl);
    }
  } catch (err) {
    console.error("Error al generar enlace de compartir:", err);
    alert("No se pudo generar el enlace de compartir.");
  }
};

window.importarRepertorioCompartido = function(base64) {
  try {
    const plainText = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const parts = plainText.split('|');
    if (parts.length < 2) {
      throw new Error("Formato de importación inválido");
    }
    
    const name = parts[0];
    const songTitles = parts.slice(1);
    
    const globalSongs = getGlobalSongsList();
    const resolvedSongs = [];
    const missingTitles = [];
    
    songTitles.forEach(title => {
      const matched = globalSongs.find(gs => gs.title.toLowerCase().trim() === title.toLowerCase().trim());
      if (matched) {
        resolvedSongs.push(matched);
      } else {
        missingTitles.push(title);
      }
    });
    
    if (resolvedSongs.length === 0) {
      alert("No se pudieron encontrar las canciones de este repertorio en el catálogo local.");
      return;
    }
    
    // Cambiar de inmediato vistas a la pestaña Activo para que vea la carga del repertorio de inmediato
    if (window.switchRepertorioTab) {
      window.switchRepertorioTab("activo");
    }
    switchView("repertorio");
    
    // Cargar siempre primero en el repertorio activo actual
    localStorage.setItem("repertorio", JSON.stringify(resolvedSongs));
    if (typeof renderizarRepertorio === "function") {
      renderizarRepertorio(resolvedSongs);
    }
    
    // Actualizar botones de estado de canciones en la lista
    if (typeof window.initSongButtons === "function") {
      window.initSongButtons();
    }
    
    // Limpiar el hash de la URL de inmediato para evitar loops de carga o refrescos molestos
    window.location.hash = "";
    
    alert(`¡Se han cargado las ${resolvedSongs.length} canciones de "${name}" en tu Repertorio Activo!`);
    
    if (missingTitles.length > 0) {
      alert(`Nota: No se encontraron ${missingTitles.length} canciones en el catálogo local:\n- ${missingTitles.join("\n- ")}`);
    }
  } catch (e) {
    console.error("Error al importar:", e);
    alert("Hubo un problema al procesar el enlace del repertorio compartido.");
  }
};

window.chequearImportacionCompartida = function() {
  const hash = window.location.hash;
  if (hash && hash.startsWith("#import=")) {
    const base64 = hash.replace("#import=", "");
    if (base64) {
      setTimeout(() => {
        window.importarRepertorioCompartido(base64);
      }, 600);
    }
  }
};

window.eliminarRepertorioGuardado = function(id) {
  const saved = JSON.parse(localStorage.getItem("saved_repertorios")) || [];
  const target = saved.find(r => r.id === id);
  if (!target) return;
  
  if (confirm(`¿Estás seguro de que deseas eliminar el repertorio guardado "${target.name}"?`)) {
    const updated = saved.filter(r => r.id !== id);
    localStorage.setItem("saved_repertorios", JSON.stringify(updated));
    window.renderizarRepertoriosGuardados();
    
    // Si el que eliminamos estaba abierto en detalle, volver a la lista
    const detailSection = document.getElementById("saved-repertorio-detail");
    const mainSection = document.getElementById("saved-repertorios-main");
    if (detailSection && detailSection.style.display !== "none") {
      detailSection.style.display = "none";
      if (mainSection) mainSection.style.display = "block";
    }
  }
};

// Event Listeners para la gestión de Repertorio Guardado
document.addEventListener("DOMContentLoaded", () => {
  // Configuración de pestañas del repertorio
  const tabRepertorioActivo = document.getElementById("tabRepertorioActivo");
  const tabRepertoriosGuardados = document.getElementById("tabRepertoriosGuardados");
  const sectionRepertorioActivo = document.getElementById("section-repertorio-activo");
  const sectionRepertoriosGuardados = document.getElementById("section-repertorios-guardados");

  window.switchRepertorioTab = function(tab) {
    if (tab === "activo") {
      tabRepertorioActivo?.classList.add("active");
      tabRepertoriosGuardados?.classList.remove("active");
      if (sectionRepertorioActivo) sectionRepertorioActivo.style.display = "block";
      if (sectionRepertoriosGuardados) sectionRepertoriosGuardados.style.display = "none";
    } else if (tab === "guardados") {
      tabRepertorioActivo?.classList.remove("active");
      tabRepertoriosGuardados?.classList.add("active");
      if (sectionRepertorioActivo) sectionRepertorioActivo.style.display = "none";
      if (sectionRepertoriosGuardados) sectionRepertoriosGuardados.style.display = "block";
      
      // Mostrar lista principal de repertorios y ocultar detalle de inicio
      const detailSection = document.getElementById("saved-repertorio-detail");
      const mainSection = document.getElementById("saved-repertorios-main");
      if (detailSection) detailSection.style.display = "none";
      if (mainSection) mainSection.style.display = "block";
      
      window.renderizarRepertoriosGuardados();
    }
  };

  tabRepertorioActivo?.addEventListener("click", () => window.switchRepertorioTab("activo"));
  tabRepertoriosGuardados?.addEventListener("click", () => window.switchRepertorioTab("guardados"));

  document.getElementById("btnVolverRepertorios")?.addEventListener("click", () => {
    const detailSection = document.getElementById("saved-repertorio-detail");
    const mainSection = document.getElementById("saved-repertorios-main");
    if (detailSection) detailSection.style.display = "none";
    if (mainSection) mainSection.style.display = "block";
  });

  document.getElementById("btnGuardarRepertorio")?.addEventListener("click", (e) => {
    e.preventDefault();
    window.abrirGuardarRepertorio();
  });

  document.getElementById("btnConfirmarGuardarRepertorio")?.addEventListener("click", () => {
    const input = document.getElementById("repertorioNameInput");
    const name = input ? input.value.trim() : "";
    
    if (!name) {
      alert("Por favor ingresa un nombre para tu repertorio.");
      return;
    }
    
    const songs = JSON.parse(localStorage.getItem("repertorio")) || [];
    if (songs.length === 0) {
      alert("No tienes canciones en tu repertorio actual para guardar.");
      window.cerrarGuardarRepertorio();
      return;
    }
    
    const saved = JSON.parse(localStorage.getItem("saved_repertorios")) || [];
    const id = Date.now().toString();
    
    const dateFormatted = new Date().toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    
    saved.unshift({
      id,
      name,
      songs,
      date: dateFormatted
    });
    
    localStorage.setItem("saved_repertorios", JSON.stringify(saved));
    
    // Al guardar un repertorio, se limpia automáticamente el repertorio activo
    localStorage.removeItem("repertorio");
    
    // Renderizar la lista de canciones activa ahora vacía
    if (typeof renderizarRepertorio === "function") {
      renderizarRepertorio([]);
    }
    
    // Actualizar el estado de los botones de la pantalla principal (de check a +)
    if (typeof initSongButtons === "function") {
      initSongButtons();
    }
    
    window.cerrarGuardarRepertorio();
    window.renderizarRepertoriosGuardados();
  });

  document.getElementById("repertorioNameInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.getElementById("btnConfirmarGuardarRepertorio")?.click();
    }
  });

  // Eventos para cargar y compartir repertorios guardados
  document.getElementById("btnCompartirRepertorio")?.addEventListener("click", () => {
    if (window.currentSavedRepertorioId) {
      window.compartirRepertorioId(window.currentSavedRepertorioId);
    }
  });

  // Revisar si se accedió por un link de importación compartida
  window.chequearImportacionCompartida();
});

/* ========================
   9. CARGA Y BOTONES PRINCIPALES
======================== */
window.cleanAuthor = function(authorStr) {
  if (!authorStr) return "";
  let clean = authorStr.trim();
  while ((clean.startsWith("(") || clean.endsWith(")")) && clean.length > 0) {
    if (clean.startsWith("(")) {
      clean = clean.slice(1).trim();
    }
    if (clean.endsWith(")")) {
      clean = clean.slice(0, -1).trim();
    }
  }
  return clean;
};

window.getSongInfo = function(songSection) {
  if (!songSection) return { title: "", author: "" };
  
  // 1. Try restructured HTML first (e.g. inside our container)
  const titleSpan = songSection.querySelector(".song-title-text");
  if (titleSpan) {
    const authorSpan = songSection.querySelector(".autor");
    const author = authorSpan ? authorSpan.textContent : "";
    return {
      title: titleSpan.textContent.trim(),
      author: window.cleanAuthor(author)
    };
  }

  // 2. Fallback for original template HTML
  const h2 = songSection.querySelector("h2");
  if (h2) {
    let title = "";
    let author = "";
    const h2Clone = h2.cloneNode(true);
    const smallAutor = h2Clone.querySelector("small, .autor");
    if (smallAutor) {
      author = smallAutor.textContent;
      smallAutor.remove();
    }
    title = h2Clone.textContent.trim();
    return {
      title: title,
      author: window.cleanAuthor(author)
    };
  }

  return { title: "", author: "" };
};

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

window.getSongTag = function(songSection, activeCategory) {
  if (songSection?.dataset && songSection.dataset.tags) {
    return songSection.dataset.tags.toUpperCase();
  }
  return "";
};

function loadSongs(files) {
  const container = document.getElementById("songsContainer");
  if (!container) return;
  Promise.all(files.map(f => fetch(f).then(r => r.ok && r.status === 200 ? r.text() : "").catch(() => "")))
    .then(htmls => {
      container.innerHTML = htmls.join("");
      
      // Re-estructurar todas las tarjetas de canciones cargadas dinámicamente
      document.querySelectorAll(".song").forEach(song => {
        const audio = song.dataset.audio;
        
        // 1. Extraer título de forma limpia
        const h2 = song.querySelector("h2");
        let title = "";
        let author = "";
        if (h2) {
          const h2Clone = h2.cloneNode(true);
          const smallAutor = h2Clone.querySelector("small, .autor");
          if (smallAutor) {
            author = smallAutor.textContent.replace(/[()]/g, "").trim();
            smallAutor.remove();
          }
          title = h2Clone.textContent.trim();
        }
        
        // Buscar .autor adicional si no se encontró en el h2
        if (!author) {
          const authorEl = song.querySelector(".autor, small");
          if (authorEl) {
            author = authorEl.textContent.replace(/[()]/g, "").trim();
          }
        }
        
        // 2. Obtener los elementos lyrics y add-repertorio originales
        const lyricsHidden = song.querySelector(".lyrics-hidden, [id^='letra-']");
        const addBtn = song.querySelector(".add-repertorio");
        const audioUrl = song.dataset.audio || "";

        // 3. Crear nueva estructura interna refinada y uniforme
        song.innerHTML = `
          <div class="song-header">
            <div class="song-info-container">
              <!-- Music Note Icon Badge -->
              <div class="song-icon-badge">
                <svg class="music-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 18V5l12-2v13"></path>
                  <circle cx="6" cy="18" r="3"></circle>
                  <circle cx="18" cy="16" r="3"></circle>
                </svg>
              </div>
              
              <!-- Title and Author -->
              <div class="song-title-author">
                <h2 class="repertorio-title">
                  <span class="song-title-text">${title}</span>
                  ${author ? `<span class="autor">(${author})</span>` : ''}
                </h2>
              </div>
            </div>
            
            <!-- Action buttons (right-aligned) -->
            <div class="song-btns" onclick="event.stopPropagation();">
              ${addBtn ? addBtn.outerHTML : `
                <button class="add-repertorio" data-title="${title.replace(/"/g, '&quot;')}">
                  <span class="icon">+</span>
                  <span class="text">Añadir al repertorio</span>
                </button>
              `}
            </div>
          </div>
          <div class="lyrics-hidden" style="display:none;">${lyricsHidden ? lyricsHidden.innerHTML : ''}</div>
        `;
      });

      allSongs = Array.from(document.querySelectorAll(".song"));
      shuffleArray(allSongs);
      allSongs.forEach(song => container.appendChild(song));
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
    const info = window.getSongInfo(songSection);
    const title = info.title || btn.dataset.title || "";
    const author = info.author || btn.dataset.author || "";

    let rep = JSON.parse(localStorage.getItem("repertorio")) || [];
    const isInRep = rep.some(s => s.title === title && (s.author || "").trim() === author.trim());
    actualizarBoton(btn, isInRep);

    btn.onclick = (e) => {
      e.preventDefault();
      let currentRep = JSON.parse(localStorage.getItem("repertorio")) || [];
      const index = currentRep.findIndex(s => s.title === title && (s.author || "").trim() === author.trim());
      if (index === -1) {
        const lyrics = songSection.querySelector(".lyrics-hidden, .lyrics, .lyrics1")?.innerHTML.trim();
        const type = songSection.dataset.type || "";
        const audio = songSection.dataset.audio || "";
        const tags = songSection.dataset.tags || window.getSongTag(songSection) || "";
        const category = songSection.dataset.category || "";
        currentRep.push({ title, author, lyrics, type, audio, tags, category });
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
  // Manejo de la pantalla de inicio (Splash Launch Screen)
  const splash = document.getElementById("splashScreen");
  if (splash) {
    setTimeout(() => {
      splash.classList.add("fade-out");
      setTimeout(() => {
        splash.remove();
      }, 550);
    }, 1500); // 1.5s de duración premium
  }

  if (window.lucide) window.lucide.createIcons();
  const themeToggle = document.getElementById("themeToggle");
  
  let savedTheme = "light";
  try {
    savedTheme = localStorage.getItem("theme") || "light";
  } catch (e) {}

  if (savedTheme !== "dark") {
    document.body.classList.add("light-mode");
  } else {
    document.body.classList.remove("light-mode");
  }
  
  if (themeToggle) {
    const isLight = document.body.classList.contains("light-mode");
    themeToggle.innerHTML = isLight 
      ? `${SVG_MOON} Modo Oscuro` 
      : `${SVG_SUN} Modo Claro`;
  }

  // Inicializar icono de acordes
  updateChordsVisibility();

  themeToggle?.addEventListener("click", (e) => {
    e.preventDefault();
    document.body.classList.toggle("light-mode");
    const isLight = document.body.classList.contains("light-mode");
    try {
      localStorage.setItem("theme", isLight ? "light" : "dark");
    } catch (e) {}
    
    themeToggle.innerHTML = isLight 
      ? `${SVG_MOON} Modo Oscuro` 
      : `${SVG_SUN} Modo Claro`;
      
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
    "Categorias/Comunion.html", "Categorias/AdoracionMeditacion.html", "Categorias/EnvioSalida.html", "Categorias/Marianos.html",
    "Categorias/Salesianos.html","Categorias/Cuaresma.html", "Categorias/Pascua.html" , "Categorias/EspirituSanto.html" ,
    "Categorias/Adviento.html", "Categorias/HimnosSalmos.html", "Categorias/Contemporáneo.html",
  ]);
});

/* ===============================
   11. POPUP DE LETRAS & AJUSTES
=============================== */
(function(){
  window.tamañoFuente = localStorage.getItem("fontSize") ? parseInt(localStorage.getItem("fontSize")) : (window.innerWidth < 600 ? 14 : 16);
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
  const btnToolColumns = document.getElementById("btnToolColumns");
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
  
  const popupBody = document.getElementById("captureArea");
  const popupLetraEl = document.getElementById("popupLetra");

  window.adjustPopupWidth = () => {
    // Width is now handled statically and beautifully by CSS media queries
  };

  window.addEventListener("resize", () => {
    window.adjustPopupWidth && window.adjustPopupWidth();
  });

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

  window.abrirLetra = function(titulo, letraHtml, autor, tipo, audioUrl, tags) {
    const popup = document.getElementById("popupLetra");
    if (!popup) return;
    
    // Obtener la etiqueta visual de forma unificada y premium
    let displayTag = tags || "";
    const sElem = Array.from(document.querySelectorAll(".song")).find(s => {
      const info = window.getSongInfo(s);
      return info.title === titulo;
    });
    if (sElem) {
        displayTag = window.getSongTag(sElem);
    }
    
    let tagHtml = "";
    if (displayTag) {
      tagHtml = `<span class="song-tag">${displayTag.toUpperCase()}</span>`;
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
    btnToolColumns?.classList.remove("active");
    const popupTextoEl = document.getElementById("popupTexto");
    popupTextoEl?.classList.remove("multi-column");
    popupTextoEl?.closest(".popup-content")?.classList.remove("multi-column-active");
    window.adjustPopupWidth();

    if(sizeSlider) sizeSlider.value = window.tamañoFuente;
    if(spacingSlider) spacingSlider.value = window.espaciadoLinea;
    if(btnToolNotation) btnToolNotation.textContent = window.chordNotation === "english" ? "C" : "Do";

    window.renderPopupLyrics();
    popup.classList.add("active");
    if (window.lucide) window.lucide.createIcons();
    resetHideTimer();
  };

  window.cerrarLetra = () => {
    document.getElementById("popupLetra").classList.remove("active");
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
        btnToolColumns?.classList.remove("active");
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

  btnToolColumns?.addEventListener("click", (e) => {
    e.stopPropagation();
    const popupTexto = document.getElementById("popupTexto");
    if (popupTexto) {
      const isMulti = popupTexto.classList.toggle("multi-column");
      btnToolColumns.classList.toggle("active", isMulti);
      popupTexto.closest(".popup-content")?.classList.toggle("multi-column-active", isMulti);
      window.adjustPopupWidth();
    }
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
    const textoElem = document.getElementById("popupTexto");
    if (textoElem) {
        textoElem.style.fontSize = window.tamañoFuente + "px";
    }
  });

  spacingSlider?.addEventListener("input", (e) => {
    window.espaciadoLinea = parseFloat(e.target.value);
    localStorage.setItem("lineSpacing", window.espaciadoLinea);
    const textoElem = document.getElementById("popupTexto");
    if (textoElem) {
        textoElem.style.lineHeight = window.espaciadoLinea;
    }
  });

  btnDownloadImage?.addEventListener("click", async () => {
    if (!window.htmlToImage) {
        alert("La librería de descarga aún no está lista.");
        return;
    }

    const originalContent = btnDownloadImage.innerHTML;
    btnDownloadImage.innerHTML = `<svg class="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 1s linear infinite; display: inline-block; vertical-align: middle;"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" stroke-dasharray="30 10"></circle></svg>`;
    btnDownloadImage.style.pointerEvents = "none";

    try {
        const titulo = document.getElementById("popupTitulo").textContent.trim();
        const autor = document.getElementById("popupAutor").textContent.trim();
        const lyricsHtml = document.getElementById("popupTexto").innerHTML;
        const transpInfo = document.getElementById("popupTranspInfo").textContent.trim();
        const currentLineHeight = window.espaciadoLinea || 1.65;

        // Obtener el tag de la canción en pantalla
        const tagContainer = document.getElementById("popupTagContainer");
        const activeTagText = tagContainer ? tagContainer.textContent.trim() : "";

        // 1. Analizar longitud de líneas y volumen para adaptabilidad Premium sin cortes
        const rawLines = lyricsHtml.split(/\r?\n/);
        
        // Helper para medir caracteres visibles (excluyendo spans de acordes)
        function getVisibleCharLength(htmlLine) {
            const clean = htmlLine
                .replace(/<[^>]+>/g, "")
                .replace(/&nbsp;/g, " ")
                .replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">");
            return clean.length;
        }

        const maxLineChars = rawLines.reduce((max, line) => Math.max(max, getVisibleCharLength(line)), 0);
        const rawLinesCount = rawLines.length;

        // Decidir si usar 2 columnas de forma inteligente y automática:
        // - Si está activado manualmente en pantalla.
        // - Si el volumen vertical es grande (> 28 líneas) para que quepa todo de forma compacta y elegante.
        const isUserMultiColumn = document.getElementById("popupTexto").classList.contains("multi-column");
        let use2Columns = isUserMultiColumn || (rawLinesCount > 28);

        const leftRightPadding = 120; // 60px izquierdo/derecho
        const defaultPageWidth = 800;
        const columnGap = 40;
        
        let optimalFontSize = 15; // Empezamos en 15px (letra normal legible)
        let determinedCardWidth = defaultPageWidth;

        if (use2Columns) {
            // Ancho predeterminado de columna en 800px de página: (800 - 120 - 40) / 2 = 320px
            // Medimos ancho en base al carácter monospace (aprox. 0.6 * optimalFontSize)
            const requiredColWidthAt15 = maxLineChars * 15 * 0.6;
            
            if (requiredColWidthAt15 <= 320) {
                optimalFontSize = 15;
            } else {
                // Buscamos un tamaño de fuente de hasta 8pt / 11px
                const possibleFontSize = 320 / (maxLineChars * 0.6);
                if (possibleFontSize >= 11) {
                    optimalFontSize = possibleFontSize;
                } else {
                    // Si cae por debajo de 8pt (11px), fijamos en exactamente 11px (8pt)
                    optimalFontSize = 11;
                    // Y ampliamos la tarjeta de captura para alojar cómodamente las 2 columnas y evitar saltos
                    const necessaryColWidth = maxLineChars * 11 * 0.6 + 15;
                    determinedCardWidth = Math.ceil(necessaryColWidth * 2 + columnGap + leftRightPadding);
                }
            }
        } else {
            // Evaluamos para 1 columna (ancho disponible = 800 - 120 = 680px)
            const requiredWidthAt15 = maxLineChars * 15 * 0.6;
            if (requiredWidthAt15 <= 680) {
                optimalFontSize = 15;
            } else {
                const possibleFontSize = 680 / (maxLineChars * 0.6);
                if (possibleFontSize >= 11) {
                    optimalFontSize = possibleFontSize;
                } else {
                    // Si a 11px (8pt) sigue siendo extremadamente grande, por directriz:
                    // "reduce las letras hasta un 8 y si ves que la letra sigue siendo grande recién aplicas la de 2 columnas"
                    use2Columns = true;
                    // Evaluamos fuente para las nuevas 2 columnas
                    const possibleColFontSize = 320 / (maxLineChars * 0.6);
                    if (possibleColFontSize >= 11) {
                        optimalFontSize = possibleColFontSize;
                    } else {
                        optimalFontSize = 11;
                        const necessaryColWidth = maxLineChars * 11 * 0.6 + 15;
                        determinedCardWidth = Math.ceil(necessaryColWidth * 2 + columnGap + leftRightPadding);
                    }
                }
            }
        }

        const isSinAcordes = document.getElementById("popupTexto").classList.contains("sin-acordes");

        // Crear una envoltura invisible de tamaño cero con overflow: hidden para alojar la tarjeta de captura.
        // Esto resuelve de raíz los problemas donde las coordenadas negativas extremas o fuera de pantalla
        // hacen que el motor de renderizado del navegador optimice y entregue imágenes vacías/transparentes.
        const renderWrapper = document.createElement("div");
        renderWrapper.style.cssText = `
            width: 0;
            height: 0;
            overflow: hidden;
            position: fixed;
            top: 0;
            left: 0;
            z-index: -99999;
            pointer-events: none;
            margin: 0;
            padding: 0;
        `;

        const captureCard = document.createElement("div");
        captureCard.className = "single-capture-sheet";
        captureCard.style.cssText = `
            width: ${determinedCardWidth}px !important;
            height: auto !important;
            position: relative !important;
            display: block !important;
            opacity: 1 !important;
            visibility: visible !important;
            padding: 55px 60px !important;
        `;
        
        if (use2Columns) {
            captureCard.classList.add("multi-column-active");
        }

        captureCard.innerHTML = `
            <div class="capture-card-inner">
                <div class="capture-card-header">
                    <span class="choir-branding">CORO JUVENIL SALESIANO VOX DEI</span>
                    <h1 class="capture-card-title">${titulo}</h1>
                    ${autor ? `<p class="capture-card-author">${autor}</p>` : ""}
                    ${activeTagText ? `<span class="capture-card-badge">${activeTagText}</span>` : ""}
                    ${transpInfo ? `<p class="capture-card-transp">${transpInfo}</p>` : ""}
                </div>
                <div class="capture-card-divider"></div>
                <pre class="capture-card-lyrics ${isSinAcordes ? "sin-acordes" : ""} ${use2Columns ? "multi-column-active" : ""}" 
                     style="font-size: ${optimalFontSize}px !important; line-height: ${(currentLineHeight * 1.15).toFixed(2)} !important;">${lyricsHtml}</pre>
                <div class="capture-card-footer">
                    <span>Generado digitalmente por el Cancionero Vox Dei</span>
                    <p class="copyright">© 2026 Vox Dei. Todos los derechos reservados.</p>
                </div>
            </div>
        `;

        renderWrapper.appendChild(captureCard);
        document.body.appendChild(renderWrapper);

        // Esperar fuentes y dar un respiro al render
        if (document.fonts) await document.fonts.ready;
        await new Promise(resolve => setTimeout(resolve, 600));

        // Capturar usando html-to-image de forma limpia
        const dataUrl = await window.htmlToImage.toPng(captureCard, {
            width: determinedCardWidth,
            height: captureCard.scrollHeight || captureCard.offsetHeight || 900,
            pixelRatio: 2.5, // Ultra HD nítido
            backgroundColor: "#ffffff",
            cacheBust: true,
            style: {
                transform: "none",
                left: "0",
                top: "0",
                position: "relative"
            }
        });

        // Enlace de descarga automática
        const link = document.createElement("a");
        const safeName = titulo.toUpperCase().replace(/[^A-Z0-9]/g, "_");
        link.download = `VOX_DEI_${safeName}.png`;
        link.href = dataUrl;
        link.click();

        // Limpieza de DOM de raíz
        document.body.removeChild(renderWrapper);
    } catch (error) {
        console.error("Error al generar la imagen PNG:", error);
        alert("Ocurrió un error al descargar la canción en formato de imagen de alta calidad. Por favor inténtalo de nuevo.");
    } finally {
        btnDownloadImage.innerHTML = originalContent;
        btnDownloadImage.style.pointerEvents = "auto";
    }
  });

  popupBody?.addEventListener("scroll", resetHideTimer, { passive: true });
  popupLetraEl?.addEventListener("click", resetHideTimer);
  popupLetraEl?.addEventListener("touchstart", resetHideTimer, { passive: true });

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

  // LISTENER PARA HACER CLIC EN TODA LA TARJETA CANCIÓN (ABRE LA LETRA DIRECTAMENTE)
  document.addEventListener("click", e => {
    const isInteractive = e.target.closest(".add-repertorio, .audio-btn, .remove-button, .drag-handle, .btn-remove-saved-song");
    if (isInteractive) return;

    const songSection = e.target.closest(".song");
    if (songSection) {
      const lyrics = songSection.querySelector(".lyrics-hidden, .lyrics, .lyrics1")?.innerHTML.trim() || "";
      const h2 = songSection.querySelector("h2");
      if (!h2) return;

      let title = "";
      const titleTextEl = h2.querySelector(".song-title-text");
      if (titleTextEl) {
        title = titleTextEl.textContent.trim();
      } else {
        const h2Clone = h2.cloneNode(true);
        h2Clone.querySelectorAll("small, span, div, p, .autor").forEach(el => el.remove());
        title = h2Clone.textContent.trim();
      }

      const autorElement = songSection.querySelector(".autor, small.autor, small");
      let autor = "";
      if (autorElement) {
        autor = autorElement.textContent.trim().replace(/^\(|\)$/g, "").trim();
      }

      const tipo = songSection.dataset.type || "";
      const audio = songSection.dataset.audio || "";
      const tags = songSection.dataset.tags || "";

      window.abrirLetra(title, lyrics, autor, tipo, audio, tags);
    }
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
    "Comunion": { name: "Comunión", order: 9 },
    "AdoracionMeditacion": { name: "Meditación y Adoración", order: 10 },
    "EnvioSalida": { name: "Salida y Envío", order: 11 },
    "Marianos": { name: "Marianos", order: 12 },
    "Salesianos": { name: "Salesianos", order: 13 },
    "Cuaresma": { name: "Cuaresma", order: 14 },
    "Pascua": { name: "Pascua", order: 15 },
    "EspirituSanto": { name: "Espíritu Santo", order: 16 },
    "Adviento": { name: "Adviento y Navidad", order: 17 },
    "HimnosSalmos": { name: "Himnos y Salmos", order: 18 },
    "Contemporáneo": { name: "Contemporáneo", order: 19 },
    "Contemporaneo": { name: "Contemporáneo", order: 19 }
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

    const noteSvg = `<svg class="index-item-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px; flex-shrink: 0; opacity: 0.6;"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>`;

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
        const songsCount = categories[catKey].length;

        section.innerHTML = `
          <h3>
            <span class="index-section-title">${displayName}</span>
            <span class="index-badge">${songsCount} ${songsCount === 1 ? 'canto' : 'cantos'}</span>
          </h3>
        `;
        
        const list = document.createElement("ul");
        list.className = "index-list";
        
        categories[catKey].sort((a, b) => {
          const infoA = window.getSongInfo(a);
          const infoB = window.getSongInfo(b);
          return infoA.title.localeCompare(infoB.title);
        }).forEach(song => {
          const info = window.getSongInfo(song);
          const li = document.createElement("li");
          li.innerHTML = `
            <a href="#" onclick="window.irACancion('${info.title.replace(/'/g, "\\'")}'); return false;">
              <span class="index-item-left">
                ${noteSvg}
                <span class="index-text-container">
                  <span class="index-song-title">${info.title}</span>
                  ${info.author ? `<span class="index-author">(${info.author})</span>` : ""}
                </span>
              </span>
            </a>`;
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
          const infoA = window.getSongInfo(a);
          const infoB = window.getSongInfo(b);
          return infoA.title.localeCompare(infoB.title);
        });

      const list = document.createElement("ul");
      list.className = "index-single-list";
      filtered.forEach(song => {
        const info = window.getSongInfo(song);
        const li = document.createElement("li");
        li.innerHTML = `
          <a href="#" onclick="window.irACancion('${info.title.replace(/'/g, "\\'")}'); return false;">
            <span class="index-item-left">
              ${noteSvg}
              <span class="index-text-container">
                <span class="index-song-title">${info.title}</span>
                ${info.author ? `<span class="index-author">(${info.author})</span>` : ""}
              </span>
            </span>
          </a>`;
        list.appendChild(li);
      });
      bodyElem.appendChild(list);
    }

    popup.classList.add("active");
  };

  window.cerrarIndice = () => {
    document.getElementById("popupIndice").classList.remove("active");
  };

  window.irACancion = (titulo) => {
    const song = allSongs.find(s => {
      const info = window.getSongInfo(s);
      return info.title.toLowerCase().trim() === titulo.toLowerCase().trim();
    });
 
    if (song) {
      const targetCategory = song.dataset.category;
      
      // Cerrar primero el índice
      window.cerrarIndice();
 
      // Cambiar a la categoría de la canción para garantizar visualización inmediata
      if (targetCategory) {
        const catBtn = Array.from(document.querySelectorAll(".category-btn")).find(btn => 
          btn.dataset.category?.toLowerCase() === targetCategory.toLowerCase()
        );
        if (catBtn) {
          catBtn.click();
        } else {
          if (viewHome && viewHome.style.display === "none") switchView("home");
          filterByCategory(targetCategory.toLowerCase());
          document.querySelectorAll(".category-btn").forEach(btn => {
            if (btn.dataset.category?.toLowerCase() === targetCategory.toLowerCase()) {
              btn.classList.add("active");
            } else {
              btn.classList.remove("active");
            }
          });
        }
      } else {
        const todosBtn = Array.from(document.querySelectorAll(".category-btn")).find(btn => 
          btn.dataset.category?.toLowerCase() === "todos"
        );
        if (todosBtn) {
          todosBtn.click();
        } else {
          if (viewHome && viewHome.style.display === "none") switchView("home");
          filterByCategory("todos");
        }
      }
 
      // Desplazarse suavemente y resaltar el canto en el contenedor principal
      // Esperar a que la transición y carga de canciones se complete
      setTimeout(() => {
        const songsInContainer = Array.from(document.querySelectorAll("#songsContainer .song"));
        const targetSongElement = songsInContainer.find(s => {
          const info = window.getSongInfo(s);
          return info.title.toLowerCase().trim() === titulo.toLowerCase().trim();
        });
 
        if (targetSongElement) {
          targetSongElement.scrollIntoView({ behavior: "smooth", block: "center" });
          
          // Aplicar efecto de pulso / brillo para que sea muy fácil de identificar
          targetSongElement.classList.add("highlight-pulse");
          
          setTimeout(() => {
            targetSongElement.classList.remove("highlight-pulse");
          }, 3000);
        }
      }, 350);
    }
  };

  document.addEventListener("click", e => {
    const isCerrarBtn = e.target.matches(".popup-cerrar") || e.target.closest(".popup-cerrar");
    const isOverlayBg = e.target.classList.contains("popup-overlay");
    
    if (isCerrarBtn || isOverlayBg) {
      const closestOverlay = e.target.closest(".popup-overlay");
      if (closestOverlay) {
        if (closestOverlay.id === "popupLetra") {
          window.cerrarLetra();
        } else if (closestOverlay.id === "popupIndice") {
          window.cerrarIndice();
        } else if (closestOverlay.id === "popupGuardarRepertorio" && window.cerrarGuardarRepertorio) {
          window.cerrarGuardarRepertorio();
        } else if (closestOverlay.id === "popupVerRepertorio" && window.cerrarVerRepertorio) {
          window.cerrarVerRepertorio();
        }
      }
    }
  });

  // Inicializar iconos de Lucide
  if (window.lucide) {
    window.lucide.createIcons();
  }

  /* =========================================
     LÓGICA DE FEEDBACK (Sugerencias/Correcciones)
  ========================================= */
  const feedbackContainer = document.getElementById("feedbackContainer");
  const feedbackToggle = document.getElementById("feedbackToggle");
  const feedbackFab = document.getElementById("feedbackFab");
  const feedbackModal = document.getElementById("feedbackModal");
  const closeFeedback = document.getElementById("closeFeedback");
  const feedbackForm = document.getElementById("feedbackForm");
  const fbType = document.getElementById("fbType");
  const fbSongGroup = document.getElementById("fbSongGroup");
  const fbSongInput = document.getElementById("fbSong");

  let feedbackTimer = null;

  function startFeedbackTimer() {
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => {
      if (!feedbackContainer.classList.contains("collapsed")) {
        feedbackContainer.classList.add("collapsed");
        feedbackToggle.innerHTML = `<i data-lucide="chevron-left"></i>`;
        if (window.lucide) window.lucide.createIcons();
      }
    }, 10000); // 10 segundos
  }

  // Iniciar temporizador al cargar
  startFeedbackTimer();

  feedbackToggle?.addEventListener("click", () => {
    const isCollapsed = feedbackContainer.classList.toggle("collapsed");
    feedbackToggle.innerHTML = isCollapsed ? 
      `<i data-lucide="chevron-left"></i>` : 
      `<i data-lucide="chevron-right"></i>`;
    if (window.lucide) window.lucide.createIcons();

    if (!isCollapsed) {
      startFeedbackTimer(); // Si se abre, reiniciar el temporizador
    } else {
      clearTimeout(feedbackTimer); // Si se cierra manualmente, quitar temporizador
    }
  });

  feedbackFab?.addEventListener("click", () => {
    feedbackModal?.classList.add("active");
    // Si hay una canción abierta, auto-completar el nombre
    const currentSongTitle = document.getElementById("popupTitulo")?.textContent;
    const isPopupVisible = document.getElementById("popupLetra")?.classList.contains("active");
    
    if (isPopupVisible && currentSongTitle) {
      fbType.value = "Corrección";
      fbSongGroup.style.display = "block";
      fbSongInput.value = currentSongTitle;
    } else {
      fbType.value = "Sugerencia";
      fbSongGroup.style.display = "none";
      fbSongInput.value = "";
    }
  });

  closeFeedback?.addEventListener("click", () => {
    feedbackModal?.classList.remove("active");
  });

  feedbackModal?.addEventListener("click", (e) => {
    if (e.target === feedbackModal) {
      feedbackModal.classList.remove("active");
    }
  });

  fbType?.addEventListener("change", () => {
    fbSongGroup.style.display = fbType.value === "Corrección" ? "block" : "none";
  });

  // El formulario ahora se envía de forma natural a Formspree
  // No necesitamos el preventDefault ni el fetch complejo que causaba errores
  feedbackForm?.addEventListener("submit", () => {
    // Solo cerramos el modal después de un pequeño retraso para que el navegador inicie el envío
    setTimeout(() => {
      feedbackModal?.classList.remove("active");
    }, 100);
  });

})();

// Asegurar que los iconos se creen al final de la carga
if (window.lucide) window.lucide.createIcons();
