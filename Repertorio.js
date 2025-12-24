document.addEventListener("DOMContentLoaded", () => {
  const contenedor = document.getElementById("repertorio-list");
  const mensajeVacio = document.getElementById("empty-message");
  const contadorCanciones = document.getElementById("contador-canciones");
  const btnLimpiar = document.getElementById("btnLimpiarRepertorio");
  const homeBtn = document.getElementById("homeBtn");

  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  const menuBtn = document.getElementById("menuBtn");
  const sidebarClose = document.getElementById("sidebarClose");
  const toggleChordsBtn = document.getElementById("toggleChordsBtn");
  const themeToggle = document.getElementById("themeToggle");

  // Almacén global para la letra que se está visualizando en el popup
  window.originalPopupLyrics = ""; 

  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      sidebar.classList.add("active");
      overlay.classList.add("active");
    });
  }

  if (sidebarClose) {
    sidebarClose.addEventListener("click", () => {
      sidebar.classList.remove("active");
      overlay.classList.remove("active");
    });
  }

  if (overlay) {
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("active");
      overlay.classList.remove("active");
    });
  }

  // --- LOGICA DE ACORDES PARA REPERTORIO ---
  window.showChords = localStorage.getItem("showChords") !== "false";

  function refreshChordsUI() {
    if (toggleChordsBtn) {
      toggleChordsBtn.textContent = window.showChords ? "Ocultar acordes" : "Mostrar acordes";
    }
    const popup = document.getElementById("popupLetra");
    if (popup && popup.style.display !== "none") {
      window.renderPopupLyrics();
    }
    localStorage.setItem("showChords", window.showChords);
  }

  // Habilitar botón exclusivamente para esta página
  if (toggleChordsBtn) {
    toggleChordsBtn.addEventListener("click", e => {
      e.preventDefault();
      window.showChords = !window.showChords;
      refreshChordsUI();
    });
  }

  refreshChordsUI();

  if (themeToggle) {
    themeToggle.addEventListener("click", (e) => {
      e.preventDefault();
      document.body.classList.toggle("light-mode");
      const isLight = document.body.classList.contains("light-mode");
      localStorage.setItem("theme", isLight ? "light" : "dark");
      themeToggle.textContent = isLight ? "Modo Oscuro" : "Modo Claro";
    });
  }

  if(homeBtn) {
    homeBtn.addEventListener("click", () => {
        window.location.href = "index.html";
    });
  }

  let repertorio = JSON.parse(localStorage.getItem("repertorio")) || [];
  let dragSrcEl = null; 
  
  function parseChords(text) {
    if (!text) return "";
    return text.replace(
      /\[([A-G][#b]?m?(?:7|maj7|sus4|dim|aug)?)\]/g,
      '<span class="chord">$1</span>'
    );
  }

  const style = document.createElement('style');
  style.innerHTML = `
    .drag-handle {
      cursor: grab;
      font-size: 1.5rem;
      margin-right: 15px;
      color: #888;
      user-select: none;
      padding: 0 10px;
      display: inline-block;
      vertical-align: middle;
      touch-action: none;
    }
    .drag-handle:active {
      cursor: grabbing;
      color: #ff4c4c;
    }
    .song.over {
      border: 2px dashed #ff4c4c;
      opacity: 0.8;
      transform: scale(0.98);
      background: rgba(255, 76, 76, 0.1);
    }
    .song-header h2 {
      display: flex;
      align-items: center;
    }
  `;
  document.head.appendChild(style);

  function renderizarRepertorio(lista, esBusqueda = false) {
    contenedor.innerHTML = "";

    if (contadorCanciones) {
        const total = repertorio.length;
        contadorCanciones.textContent = `${total} ${total === 1 ? 'CANCIÓN ELEGIDA' : 'CANCIONES ELEGIDAS'}`;
    }

    if (lista.length === 0) {
      if (!esBusqueda) mensajeVacio.style.display = "block";
      else contenedor.innerHTML = "<p style='text-align:center; padding: 20px; color: #aaa;'>No se encontraron resultados.</p>";
      return;
    }
    
    mensajeVacio.style.display = "none";

    lista.forEach((song, index) => {
      const section = document.createElement("section");
      section.classList.add("song");
      section.dataset.index = index;

      if (!esBusqueda) section.setAttribute("draggable", "false"); 

      section.innerHTML = `
        <div class="song-header">
          <h2>
            ${!esBusqueda ? '<span class="drag-handle" title="Mantén presionado para mover">☰</span>' : ''}
            <div>
                ${song.title}
                <small class="autor">${song.author || ""}</small>
            </div>
          </h2>

          <button class="lyrics-btn"
            data-title="${song.title}"
            data-lyrics="${encodeURIComponent(song.lyrics)}"
            data-author="${song.author || ""}">
            Ver letra
          </button>

          <button class="remove-button" data-title="${song.title}">
            <span class="icon">X</span>
            <span class="text">Quitar</span>
          </button>
        </div>
      `;

      if (!esBusqueda) {
        const handle = section.querySelector('.drag-handle');
        if (handle) {
            handle.addEventListener('mousedown', () => section.setAttribute("draggable", "true"));
            handle.addEventListener('mouseup', () => section.setAttribute("draggable", "false"));
            handle.addEventListener('mouseleave', () => {
                 if(dragSrcEl !== section) section.setAttribute("draggable", "false");
            });
        }
        addDragEvents(section);
      }

      const btnBorrar = section.querySelector(".remove-button");
      btnBorrar.addEventListener("click", () => borrarCancion(song.title));

      contenedor.appendChild(section);
    });
  }

  function addDragEvents(item) {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragenter', handleDragEnter);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('dragleave', handleDragLeave);
    item.addEventListener('drop', handleDrop);
    item.addEventListener('dragend', handleDragEnd);
  }

  function handleDragStart(e) {
    this.style.opacity = '0.4';
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
  }

  function handleDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
  }

  function handleDragEnter() { this.classList.add('over'); }
  function handleDragLeave() { this.classList.remove('over'); }

  function handleDrop(e) {
    if (e.stopPropagation) e.stopPropagation(); 
    if (dragSrcEl !== this) {
      const items = Array.from(contenedor.querySelectorAll('.song'));
      const fromIndex = items.indexOf(dragSrcEl);
      const toIndex = items.indexOf(this);
      if (fromIndex > -1 && toIndex > -1) {
          const itemMovido = repertorio[fromIndex];
          repertorio.splice(fromIndex, 1); 
          repertorio.splice(toIndex, 0, itemMovido); 
          localStorage.setItem("repertorio", JSON.stringify(repertorio));
          renderizarRepertorio(repertorio);
      }
    }
    return false;
  }

  function handleDragEnd() {
    this.style.opacity = '1';
    this.setAttribute("draggable", "false");
    document.querySelectorAll('.song').forEach(item => item.classList.remove('over'));
  }

  const buscadorInput = document.getElementById("searchInput");
  if (buscadorInput) {
    buscadorInput.addEventListener("input", (e) => {
      const termino = e.target.value.toLowerCase().trim();
      if (termino === "") {
        renderizarRepertorio(repertorio, false);
      } else {
        const filtrado = repertorio.filter(song => 
          song.title.toLowerCase().includes(termino) || 
          (song.author && song.author.toLowerCase().includes(termino))
        );
        renderizarRepertorio(filtrado, true);
      }
    });
  }

  function borrarCancion(title) {
    if (!confirm(`¿Deseas eliminar "${title}" del repertorio?`)) return;
    repertorio = repertorio.filter(song => song.title !== title);
    localStorage.setItem("repertorio", JSON.stringify(repertorio));
    renderizarRepertorio(repertorio);
  }

  if (btnLimpiar) {
    btnLimpiar.addEventListener("click", () => {
        if (repertorio.length === 0) return;
        if (confirm("¿Estás seguro de que deseas eliminar TODAS las canciones de tu repertorio?")) {
            repertorio = [];
            localStorage.removeItem("repertorio");
            renderizarRepertorio(repertorio);
        }
    });
  }

  renderizarRepertorio(repertorio);

  // Sobrescribir la función de abrir letra para Reperterio
  const originalAbrirLetra = window.abrirLetra;
  window.abrirLetra = function(titulo, letraHtml, autor) {
    const popup = document.getElementById("popupLetra");
    const tituloElem = document.getElementById("popupTitulo");
    const autorElem = document.getElementById("popupAutor");
    const textoElem = document.getElementById("popupTexto");

    if (!popup || !tituloElem || !textoElem) return;

    tituloElem.textContent = titulo || "";
    autorElem.textContent = autor || "";
    window.originalPopupLyrics = letraHtml || "";
    
    // Usar la función global de renderizado definida en Principal.js (mejorada)
    window.renderPopupLyrics();
    popup.style.display = "flex";
  };

  // Listener para botones de letra específicos del render de repertorio
  document.addEventListener("click", e => {
    const btn = e.target.closest(".lyrics-btn");
    if (!btn || !window.location.pathname.includes("Repertorio.html")) return;
    
    e.preventDefault();
    const lyricsData = btn.dataset.lyrics;
    if (lyricsData) {
      const textoPlano = decodeURIComponent(lyricsData);
      const letraHtml = parseChords(textoPlano);
      window.abrirLetra(btn.dataset.title, letraHtml, btn.dataset.author);
    }
  });

});