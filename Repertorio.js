document.addEventListener("DOMContentLoaded", () => {
  const contenedor = document.getElementById("repertorio-list");
  const mensajeVacio = document.getElementById("empty-message");
  // ELEMENTOS NUEVOS
  const contadorCanciones = document.getElementById("contador-canciones");
  const btnLimpiar = document.getElementById("btnLimpiarRepertorio");
  const homeBtn = document.getElementById("homeBtn");

  // ELEMENTOS DEL MENÚ LATERAL (SIDEBAR)
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  const menuBtn = document.getElementById("menuBtn");
  const sidebarClose = document.getElementById("sidebarClose");
  const toggleChordsBtn = document.getElementById("toggleChordsBtn");
  const themeToggle = document.getElementById("themeToggle");

  // ==========================================
  // LÓGICA DEL MENÚ LATERAL Y BOTONES EXTRAS
  // ==========================================

  // Abrir Menú
  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      sidebar.classList.add("active");
      overlay.classList.add("active");
    });
  }

  // Cerrar Menú
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
// ==============================
// MOSTRAR / OCULTAR ACORDES (UNIFICADO)
// ==============================

window.showChords = localStorage.getItem("showChords") !== "false";

function updateChordsVisibility() {
  const pres = document.querySelectorAll("pre");

  pres.forEach(pre => {
    let lineas = pre.innerHTML.split("\n");

    if (!window.showChords) {
      // 1️⃣ eliminar líneas que solo contienen acordes
      lineas = lineas.filter(linea => {
        const limpio = linea
          .replace(/<[^>]*>/g, "")
          .replace(/\s+/g, "");
        return limpio !== "" && !/^[A-G][#bm\d\s]*$/.test(limpio);
      });

      // 2️⃣ colapsar líneas vacías múltiples
      let resultado = [];
      let lineaVacia = false;

      lineas.forEach(l => {
        if (l.trim() === "") {
          if (!lineaVacia) {
            resultado.push("");
            lineaVacia = true;
          }
        } else {
          resultado.push(l);
          lineaVacia = false;
        }
      });

      pre.innerHTML = resultado.join("\n");
    }
  });

  if (toggleChordsBtn) {
    toggleChordsBtn.textContent = window.showChords
      ? "Ocultar acordes"
      : "Mostrar acordes";
  }

  localStorage.setItem("showChords", window.showChords);
}



if (toggleChordsBtn) {
  toggleChordsBtn.addEventListener("click", e => {
    e.preventDefault();
    window.showChords = !window.showChords;
    updateChordsVisibility();
  });
}

updateChordsVisibility();

  // --- BOTÓN MODO CLARO / OSCURO ---
  if (themeToggle) {
    themeToggle.addEventListener("click", (e) => {
      e.preventDefault();
      const isLight = document.body.classList.toggle("light-mode");
      localStorage.setItem("voxdei_theme", isLight ? "light" : "dark");
      themeToggle.textContent = isLight ? "Modo Oscuro" : "Modo Claro";
    });
  }

  // ASEGURAR QUE EL BOTÓN HOME FUNCIONE EN ESTA PÁGINA
  if(homeBtn) {
    homeBtn.addEventListener("click", () => {
        window.location.href = "index.html";
    });
  }

  let repertorio = JSON.parse(localStorage.getItem("repertorio")) || [];
  let dragSrcEl = null; // Variable para controlar el elemento arrastrado
  
function parseChords(text) {
  if (!text) return "";
  return text.replace(
    /\[([A-G][#b]?m?(?:7|maj7|sus4|dim|aug)?)\]/g,
    '<span class="chord">$1</span>'
  );
}

  // ===============================
  // 0. INYECTAR ESTILOS PARA DND
  // ===============================
  const style = document.createElement('style');
  style.innerHTML = `
    .drag-handle {
      cursor: grab;
      font-size: 1.5rem; /* Más grande para facilitar el toque/clic */
      margin-right: 15px;
      color: #888;
      user-select: none;
      padding: 0 10px; /* Área de agarre más amplia */
      display: inline-block;
      vertical-align: middle;
      touch-action: none; /* Ayuda en algunos dispositivos táctiles */
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
    /* Asegurar que el header se alinee bien con el handle */
    .song-header h2 {
      display: flex;
      align-items: center;
    }
  `;
  document.head.appendChild(style);

  // ===============================
  // 1. FUNCIÓN DE RENDERIZADO
  // ===============================
  function renderizarRepertorio(lista, esBusqueda = false) {
    contenedor.innerHTML = "";

    // ACTUALIZAR CONTADOR DE CANCIONES
    if (contadorCanciones) {
        // Usamos el repertorio total, no el filtrado, para el contador global
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
      
      // Atributos base
      section.dataset.index = index; // Guardamos el índice real

      // LÓGICA CORE DE ARRASTRE:
      // Por defecto NO es arrastrable. Solo lo será si se agarra del handle.
      if (!esBusqueda) {
        section.setAttribute("draggable", "false"); 
      }

      section.innerHTML = `
        <div class="song-header">
          <h2>
            <!-- MANEJADOR PARA ARRASTRAR (HANDLE) -->
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
            <!-- Texto oculto en móviles por CSS, visible en desktop -->
            <span class="text">Quitar</span>
          </button>
        </div>
      `;

      // Eventos Drag & Drop (Solo si no es búsqueda)
      if (!esBusqueda) {
        // 1. Lógica para activar el arrastre SOLO desde el handle
        const handle = section.querySelector('.drag-handle');
        if (handle) {
            // Al presionar el mouse sobre el icono, hacemos la sección arrastrable
            handle.addEventListener('mousedown', () => {
                section.setAttribute("draggable", "true");
            });
            // Al soltar, quitamos la propiedad (limpieza)
            handle.addEventListener('mouseup', () => {
                section.setAttribute("draggable", "false");
            });
            // Si el mouse sale del icono sin arrastrar, reseteamos
            handle.addEventListener('mouseleave', () => {
                 // Pequeño delay por si el usuario mueve el mouse rápido al arrastrar
                 if(dragSrcEl !== section) section.setAttribute("draggable", "false");
            });
        }

        // 2. Añadir eventos estándar al contenedor
        addDragEvents(section);
      }

      // Evento Borrar
      const btnBorrar = section.querySelector(".remove-button");
      btnBorrar.addEventListener("click", (e) => borrarCancion(song.title, e));

      contenedor.appendChild(section);
    });
  }

  // ===============================
  // 2. LÓGICA DRAG & DROP
  // ===============================
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
    if (e.preventDefault) {
      e.preventDefault(); // Necesario para permitir el drop
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
  }

  function handleDragEnter(e) {
    this.classList.add('over');
  }

  function handleDragLeave(e) {
    this.classList.remove('over');
  }

  function handleDrop(e) {
    if (e.stopPropagation) {
      e.stopPropagation(); 
    }

    // No hacer nada si soltamos en el mismo elemento
    if (dragSrcEl !== this) {
      const items = Array.from(contenedor.querySelectorAll('.song'));
      const fromIndex = items.indexOf(dragSrcEl);
      const toIndex = items.indexOf(this);

      if (fromIndex > -1 && toIndex > -1) {
          // Reordenamos el array
          const itemMovido = repertorio[fromIndex];
          repertorio.splice(fromIndex, 1); 
          repertorio.splice(toIndex, 0, itemMovido); 

          // Guardamos y Renderizamos
          localStorage.setItem("repertorio", JSON.stringify(repertorio));
          renderizarRepertorio(repertorio);
      }
    }
    return false;
  }

  function handleDragEnd(e) {
    this.style.opacity = '1';
    // Importante: Resetear draggable a false al terminar
    this.setAttribute("draggable", "false");
    
    // Limpiar clases visuales
    document.querySelectorAll('.song').forEach(item => {
        item.classList.remove('over');
    });
  }

  // ===============================
  // 3. LÓGICA DE BÚSQUEDA
  // ===============================

  const buscadorInput = document.getElementById("searchInput") || document.querySelector("input[type='search']");

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

  // ===============================
  // 4. LÓGICA DE BORRADO Y LIMPIEZA
  // ===============================
  function borrarCancion(title, e) {
    if (!confirm(`¿Deseas eliminar "${title}" del repertorio?`)) return;

    repertorio = repertorio.filter(song => song.title !== title);
    localStorage.setItem("repertorio", JSON.stringify(repertorio));

    const termino = buscadorInput ? buscadorInput.value.toLowerCase().trim() : "";
    if (termino) {
        buscadorInput.dispatchEvent(new Event('input'));
    } else {
        renderizarRepertorio(repertorio);
    }
  }

  // EVENTO PARA LIMPIAR TODO EL REPERTORIO
  if (btnLimpiar) {
    btnLimpiar.addEventListener("click", () => {
        if (repertorio.length === 0) return;
        
        if (confirm("¿Estás seguro de que deseas eliminar TODAS las canciones de tu repertorio? Esta acción no se puede deshacer.")) {
            repertorio = [];
            localStorage.removeItem("repertorio");
            renderizarRepertorio(repertorio);
        }
    });
  }

  // ===============================
  // 5. INICIALIZACIÓN
  // ===============================
  renderizarRepertorio(repertorio);


  // ===============================
  // MOSTRAR LETRA (POPUP) - LÓGICA UNIFICADA
  // ===============================
  (function(){
    const tamañoInicial = 16;
    window.tamañoFuente = tamañoInicial;

    window.abrirLetra = function(titulo, letraHtml, autor) {
      const popup = document.getElementById("popupLetra");
      const tituloElem = document.getElementById("popupTitulo");
      const autorElem = document.getElementById("popupAutor");
      const textoElem = document.getElementById("popupTexto");

      if (!popup || !tituloElem || !textoElem) return;

      tituloElem.textContent = titulo || "";
      autorElem.textContent = autor || "";
      textoElem.innerHTML = letraHtml || "";

      // aplicar estado global de acordes al popup
textoElem.querySelectorAll(".chord").forEach(chord => {
  chord.style.display = window.showChords ? "inline" : "none";
});


      tamañoFuente = tamañoInicial;
      textoElem.style.fontSize = tamañoInicial + "px";
      textoElem.querySelectorAll("span").forEach(span => {
        span.style.fontSize = tamañoInicial + "px";
      });

      popup.style.display = "flex";
    };

    window.cerrarLetra = function() {
      const popup = document.getElementById("popupLetra");
      if (popup) popup.style.display = "none";
      const textoElem = document.getElementById("popupTexto");
      if(textoElem) textoElem.style.fontSize = tamañoInicial + "px";
    };

    document.addEventListener("click", function(e){
      const btn = e.target.closest(".lyrics-btn");
      if (!btn) return;

      e.preventDefault();

      let letraHtml = "";
      const targetId = btn.dataset.target;
      const lyricsData = btn.dataset.lyrics;

      if (targetId) {
        const cont = document.getElementById(targetId);
        if (cont) {
          const pre = cont.querySelector("pre");
          letraHtml = pre ? pre.innerHTML.trim() : cont.innerHTML.trim();
        }
      } else if (lyricsData) {
  const textoPlano = decodeURIComponent(lyricsData);
  letraHtml = parseChords(textoPlano);
}


      let titulo = btn.dataset.title || "";
      if(!titulo) {
          const h2 = btn.closest(".song")?.querySelector("h2");
          const divTexto = h2?.querySelector("div");
          if(divTexto) {
             titulo = divTexto.childNodes[0]?.textContent.trim();
          } else {
             titulo = h2?.textContent.trim();
          }
      }

      let autor = btn.dataset.author || "";

      abrirLetra(titulo, letraHtml, autor);
    });

    document.addEventListener("click", function(e){
      if (e.target.matches(".popup-cerrar")) cerrarLetra();
      if (e.target.classList.contains("popup-overlay")) cerrarLetra();
    });

  })();

  // ===============================
  // AUMENTAR Y REDUCIR TAMAÑO
  // ===============================
  window.cambiarFuente = function(delta) {
      tamañoFuente += delta;
      if (tamañoFuente < 10) tamañoFuente = 10;
      if (tamañoFuente > 40) tamañoFuente = 40;

      const letra = document.getElementById("popupTexto");
      if(letra) {
          letra.style.fontSize = tamañoFuente + "px";
          letra.querySelectorAll("span").forEach(span => {
              span.style.fontSize = tamañoFuente + "px";
          });
      }
  }

});