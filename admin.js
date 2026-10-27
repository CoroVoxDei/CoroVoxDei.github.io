/* ==========================================================================
   CAPA DE ADMINISTRADOR (admin.js)
   Exclusivo para Director / Editor / Administrador (CMS, Wizard y Personalización).
   Módulo desacoplado de Principal.js para máxima ligereza y rendimiento.
   ========================================================================== */

import { doc, setDoc, deleteDoc, collection, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

(function initAdminLayer() {
  const MASTER_ADMIN_EMAIL = "jhonbastidas2805@gmail.com";

  // Enlaces directos a utilidades y estado global expuesto por Principal.js
  const getDb = () => window.db;
  const getStorage = () => window.storage;
  const showToast = (msg, type = "info", duration = 3000) => window.showToast ? window.showToast(msg, type, duration) : console.log(msg);
  const showConfirmModal = (opts) => window.showConfirmModal ? window.showConfirmModal(opts) : Promise.resolve(confirm(opts.message || ""));
  const showPromptModal = (opts) => window.showPromptModal ? window.showPromptModal(opts) : Promise.resolve(prompt(opts.message || ""));
  
  const getActiveUser = () => {
    if (window.AuthEngine && typeof window.AuthEngine.getCurrentUser === "function") {
      const u = window.AuthEngine.getCurrentUser();
      if (u) return u;
    }
    if (window.currentUser) return window.currentUser;
    const cached = localStorage.getItem("voxdei_last_logged_user") || localStorage.getItem("simulated_logged_user");
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return null;
  };

  const AuthEngine = {
    getCurrentUser: getActiveUser,
    onAuthStateChanged: (cb) => window.AuthEngine?.onAuthStateChanged?.(cb)
  };

  const isCurrentUserEditor = () => {
    const user = getActiveUser();
    return isUserAdmin(user);
  };
  const isFirebaseReal = () => typeof window.isFirebaseReal !== "undefined" ? window.isFirebaseReal : true;
  const getCategoryCollectionName = (cat) => typeof window.getCategoryCollectionName === "function" ? window.getCategoryCollectionName(cat) : (cat || "Entrada");

  const ALL_CATEGORY_COLLECTIONS = [
    "Entrada", "Penitencial", "Gloria", "Aclamacion",
    "Ofertorio", "Santo", "PadreNuestro", "Cordero",
    "Comunion", "AdoracionMeditacion", "EnvioSalida", "Marianos",
    "Salesianos", "Cuaresma", "Pascua", "EspirituSanto",
    "Adviento", "HimnosSalmos", "Contemporaneo"
  ];

  /* ==========================================================================
     1. GESTIÓN DE ROLES Y PERMISOS DE EDITORES (CMS EN PERFIL)
     ========================================================================== */
  const getAuthorizedEditors = () => {
    try {
      const list = JSON.parse(localStorage.getItem("voxdei_authorized_editors") || "[]");
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  };

  const isUserAdmin = (user) => {
    const active = user || getActiveUser();
    if (!active || !active.email) return false;
    const email = active.email.toLowerCase().trim();
    return email === MASTER_ADMIN_EMAIL.toLowerCase() || getAuthorizedEditors().includes(email);
  };

  const isUserEditor = (user) => {
    return isUserAdmin(user);
  };

  window.isCurrentUserEditor = () => {
    const user = getActiveUser();
    return isUserEditor(user);
  };
  window.isCurrentUserAdmin = window.isCurrentUserEditor;

  const getActiveViewMode = () => {
    return localStorage.getItem("voxdei_active_view_mode") || "editor";
  };
  window.getActiveViewMode = getActiveViewMode;

  const renderAuthorizedEditorsChips = () => {
    const container = document.getElementById("editorsListContainer");
    if (!container) return;
    const editors = getAuthorizedEditors();
    
    if (editors.length === 0) {
      container.innerHTML = `<span style="font-size: 0.84rem; color: #94a3b8; font-style: italic;">No hay editores secundarios asignados aún. Solo jhonbastidas2805@gmail.com administra el cancionero.</span>`;
      return;
    }

    container.innerHTML = editors.map(email => `
      <div class="editor-chip" style="display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); padding: 5px 12px; border-radius: 20px; font-size: 0.85rem; margin: 4px;">
        <i data-lucide="user-check" style="width: 14px; height: 14px; color: #34d399;"></i>
        <span>${email}</span>
        <button type="button" class="btn-remove-editor" data-email="${email}" style="background: none; border: none; color: #f87171; cursor: pointer; display: flex; align-items: center; padding: 0 4px; font-size: 1.1rem; line-height: 1;" title="Revocar rol de editor">
          &times;
        </button>
      </div>
    `).join("");

    container.querySelectorAll(".btn-remove-editor").forEach(btn => {
      btn.addEventListener("click", () => {
        const emailToRemove = btn.getAttribute("data-email");
        removeAuthorizedEditor(emailToRemove);
      });
    });

    if (window.lucide) window.lucide.createIcons();
  };

  const addAuthorizedEditor = async (email) => {
    if (!email || !email.includes("@")) {
      showToast("Por favor ingresa un correo electrónico válido.", "error");
      return;
    }
    const cleanEmail = email.toLowerCase().trim();
    if (cleanEmail === MASTER_ADMIN_EMAIL.toLowerCase()) {
      showToast("jhonbastidas2805@gmail.com ya es el Administrador Maestro.", "info");
      return;
    }
    let editors = getAuthorizedEditors();
    if (editors.includes(cleanEmail)) {
      showToast("Este correo ya está en la lista de editores.", "warning");
      return;
    }
    editors.push(cleanEmail);
    localStorage.setItem("voxdei_authorized_editors", JSON.stringify(editors));
    if (isFirebaseReal() && getDb()) {
      try {
        await setDoc(doc(getDb(), "app_config", "authorized_editors"), { list: editors }, { merge: true });
      } catch (e) {
        console.warn("No se pudo guardar la lista de editores en Firestore:", e);
      }
    }
    renderAuthorizedEditorsChips();
    showToast(`Editor autorizado agregado: ${cleanEmail}`, "success");
    const input = document.getElementById("inputNewEditorEmail");
    if (input) input.value = "";
  };

  const removeAuthorizedEditor = async (email) => {
    let editors = getAuthorizedEditors().filter(e => e.toLowerCase().trim() !== email.toLowerCase().trim());
    localStorage.setItem("voxdei_authorized_editors", JSON.stringify(editors));
    if (isFirebaseReal() && getDb()) {
      try {
        await setDoc(doc(getDb(), "app_config", "authorized_editors"), { list: editors }, { merge: true });
      } catch (e) {
        console.warn("No se pudo actualizar lista de editores en Firestore:", e);
      }
    }
    renderAuthorizedEditorsChips();
    showToast(`Rol de editor revocado para: ${email}`, "info");
  };

  const updateEditorModeUI = (user = AuthEngine.getCurrentUser()) => {
    const activeUser = user || getActiveUser();
    const isMaster = activeUser?.email && activeUser.email.toLowerCase().trim() === MASTER_ADMIN_EMAIL.toLowerCase();
    const isEditor = isMaster || isUserEditor(activeUser);
    const currentMode = getActiveViewMode(); // "editor" | "singer"
    
    const profileAdminPanel = document.getElementById("profileAdminPanel");
    const btnToggleEditorMode = document.getElementById("btnToggleEditorMode");
    const iconEditorMode = document.getElementById("iconEditorMode");
    const textEditorMode = document.getElementById("textEditorMode");
    const btnNewSongFab = document.getElementById("btnNewSongFab");
    const btnSidebarNewSong = document.getElementById("btnSidebarNewSong");
    const btnFloatingAddSong = document.getElementById("btnFloatingAddSong");

    if (profileAdminPanel) {
      profileAdminPanel.style.display = isEditor ? "block" : "none";
    }

    const showEditorTools = isEditor && (currentMode === "editor");

    if (btnNewSongFab) {
      btnNewSongFab.style.display = showEditorTools ? "flex" : "none";
    }

    if (btnFloatingAddSong) {
      btnFloatingAddSong.style.display = showEditorTools ? "flex" : "none";
    }

    if (btnSidebarNewSong) {
      btnSidebarNewSong.style.display = isEditor ? "flex" : "none";
    }

    if (btnFloatingAddSong) {
      btnFloatingAddSong.style.display = showEditorTools ? "flex" : "none";
    }

    // Ocultar o mostrar opciones de editar en los menús de 3 puntos
    document.querySelectorAll(".opt-edit-song").forEach(btn => {
      btn.style.display = isEditor ? "flex" : "none";
    });

    // Botones de personalización de portada tipo Facebook y frases litúrgicas
    const btnEditHomeCover = document.getElementById("btnEditHomeCover");
    const btnEditRepCover = document.getElementById("btnEditRepCover");
    const btnEditIndiceCover = document.getElementById("btnEditIndiceCover");
    const btnAdminCustomHeaders = document.getElementById("btnAdminCustomHeaders");
    const btnProfileEditCovers = document.getElementById("btnProfileEditCovers");

    if (btnEditHomeCover) btnEditHomeCover.style.display = showEditorTools ? "inline-flex" : "none";
    if (btnEditRepCover) btnEditRepCover.style.display = showEditorTools ? "inline-flex" : "none";
    if (btnEditIndiceCover) btnEditIndiceCover.style.display = showEditorTools ? "inline-flex" : "none";
    if (btnProfileEditCovers) btnProfileEditCovers.style.display = isEditor ? "flex" : "none";
    if (btnAdminCustomHeaders) btnAdminCustomHeaders.style.display = isEditor ? "inline-flex" : "none";

    if (btnToggleEditorMode) {
      if (currentMode === "editor") {
        btnToggleEditorMode.className = "btn-toggle-editor-mode mode-editor-on";
        if (iconEditorMode) iconEditorMode.setAttribute("data-lucide", "pen-tool");
        if (textEditorMode) textEditorMode.textContent = "Modo Editor (Activo)";
      } else {
        btnToggleEditorMode.className = "btn-toggle-editor-mode mode-singer-on";
        if (iconEditorMode) iconEditorMode.setAttribute("data-lucide", "eye");
        if (textEditorMode) textEditorMode.textContent = "Modo Cantante (Activo)";
      }
    }

    renderAuthorizedEditorsChips();
    if (window.lucide) window.lucide.createIcons();
  };
  window.updateEditorModeUI = updateEditorModeUI;

  /* ==========================================================================
     2. WIZARD DEL EDITOR DE CANCIONES, BOTTOM SHEET Y SELECTOR
     ========================================================================== */
  // Alternar entre Modo Editor y Modo Cantante
  document.getElementById("btnToggleEditorMode")?.addEventListener("click", () => {
    const current = getActiveViewMode();
    const newMode = (current === "editor") ? "singer" : "editor";
    localStorage.setItem("voxdei_active_view_mode", newMode);
    updateEditorModeUI();
    if (newMode === "singer") {
      showToast("Modo Cantante activo: vista limpia para ensayar o cantar sin herramientas de edición.", "info", 4500);
    } else {
      showToast("Modo Editor activo: herramientas de creación y corrección habilitadas.", "success", 4500);
    }
  });

  // Cajón para gestionar editores del coro
  document.getElementById("btnToggleManageEditors")?.addEventListener("click", () => {
    const drawer = document.getElementById("adminEditorsDrawer");
    if (!drawer) return;
    const isHidden = (drawer.style.display === "none" || !drawer.style.display);
    drawer.style.display = isHidden ? "block" : "none";
    if (isHidden) renderAuthorizedEditorsChips();
    if (window.lucide) window.lucide.createIcons();
  });

  document.getElementById("btnAddEditorEmail")?.addEventListener("click", () => {
    const input = document.getElementById("inputNewEditorEmail");
    if (input) addAuthorizedEditor(input.value.trim());
  });

  document.getElementById("inputNewEditorEmail")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addAuthorizedEditor(e.target.value.trim());
    }
  });

  // Helper para redimensionar y comprimir fotos de portada de canciones
  function resizeImageToDataUrl(file, maxWidth = 400, maxHeight = 400, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          if (w > maxWidth || h > maxHeight) {
            if (w > h) {
              h = Math.round((h * maxWidth) / w);
              w = maxWidth;
            } else {
              w = Math.round((w * maxHeight) / h);
              h = maxHeight;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // CONTROLADOR DEL MODAL DE EDICIÓN DE CANCIONES (CMS EN LA NUBE)
  let currentEditingSongData = null;

  // Funciones de sincronización del editor visual (WYSIWYG con tipografía monoespaciada para acordes)
  const getLyricsFromEditor = (el) => {
    if (!el) return "";
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") return el.value;
    const clone = el.cloneNode(true);
    clone.querySelectorAll("br").forEach(br => br.replaceWith("\n"));
    clone.querySelectorAll("div").forEach(div => div.prepend("\n"));
    clone.querySelectorAll("p").forEach(p => p.prepend("\n"));
    let html = clone.innerHTML;
    html = html.replace(/&nbsp;/g, " ");
    html = html.replace(/<(?!(\/?(b|strong|i|em|u)\b))[^>]+>/gi, "");
    html = html.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    return html.replace(/^\n+/, "").replace(/\n+$/, "");
  };

  const setLyricsToEditor = (el, val) => {
    if (!el) return;
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
      el.value = val || "";
      return;
    }
    let safe = val || "";
    safe = safe
      .replace(/<span[^>]*class=['"]chord['"][^>]*>/gi, "")
      .replace(/<\/span>/gi, "")
      .replace(/<\/?pre[^>]*>/gi, "");
    const lines = safe.split(/\r?\n/);
    el.innerHTML = lines.join("<br>");
  };

  const ensureLyricsEditor = () => {
    const el = document.getElementById("editorSongLyrics");
    if (!el) return null;
    if (el.tagName !== "TEXTAREA" && !el._hasCustomValueAccessor) {
      el._hasCustomValueAccessor = true;
      Object.defineProperty(el, "value", {
        get() {
          return getLyricsFromEditor(el);
        },
        set(val) {
          setLyricsToEditor(el, val);
        },
        configurable: true
      });
      // Pegar solo texto plano preservando alineación de acordes sin estilos externos sucios
      el.addEventListener("paste", (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData("text/plain");
        document.execCommand("insertText", false, text);
      });
    }
    return el;
  };

  const openSongEditorModal = (songData = null) => {
    if (typeof window.isCurrentUserEditor === "function" && !window.isCurrentUserEditor()) {
      showToast("Acceso exclusivo para el administrador (jhonbastidas2805@gmail.com).", "warning");
      return;
    }
    const modal = document.getElementById("songEditorModal");
    if (!modal) return;

    currentEditingSongData = songData;
    if (typeof setLyricsPreviewMode === "function") {
      setLyricsPreviewMode(false);
    }

    const modalTitle = document.getElementById("songEditorModalTitle");
    const modalSubtitle = document.getElementById("songEditorModalSubtitle");
    const publishText = document.getElementById("btnPublishSongText");
    const btnDelete = document.getElementById("btnDeleteCurrentCloudSong");

    const titleIn = document.getElementById("editorSongTitle");
    const authorIn = document.getElementById("editorSongAuthor");
    const categoryIn = document.getElementById("editorSongCategory");
    const tagsIn = document.getElementById("editorSongTags");
    const audioIn = document.getElementById("editorSongAudio");
    const youtubeIn = document.getElementById("editorSongYoutube");
    const lyricsIn = ensureLyricsEditor() || document.getElementById("editorSongLyrics");
    const charCounter = document.getElementById("editorTitleCharCount");

    if (songData) {
      if (modalTitle) modalTitle.textContent = "Editar canción";
      if (modalSubtitle) modalSubtitle.textContent = "Modifica la letra, acordes o categoría del canto";
      if (publishText) publishText.textContent = "Guardar cambios";
      if (btnDelete) btnDelete.style.display = "none";

      // Cargar título y autor asegurando que nunca se borren al editar
      const songTitle = songData.title || songData.titulo || document.getElementById("popupTitulo")?.textContent?.trim() || window.currentOpenedSongTitle || "";
      const songAuthor = songData.author || songData.autor || document.getElementById("popupAutor")?.textContent?.replace(/[()]/g, "")?.trim() || window.currentOpenedSongAuthor || "";
      if (titleIn) titleIn.value = songTitle;
      if (authorIn) authorIn.value = songAuthor;

      // Seleccionar con exactitud la categoría correspondiente de la canción
      let resolvedCategory = songData.category || songData.categoria || "";
      if (!resolvedCategory && songData.title && window.allSongs) {
        const found = window.allSongs.find(s => {
          const info = typeof window.getSongInfo === "function" ? window.getSongInfo(s) : null;
          return info && info.title && info.title.toLowerCase().trim() === songData.title.toLowerCase().trim();
        });
        if (found) resolvedCategory = found.dataset.category || "";
      }
      if (!resolvedCategory && window.currentOpenedSongData?.category) {
        resolvedCategory = window.currentOpenedSongData.category;
      }

      // Cargar YouTube y Audio buscando en todas las fuentes disponibles
      let songYoutube = songData.youtube || "";
      let songAudio = songData.audio || "";
      if (!songYoutube && window.isYouTubeUrl(songAudio)) {
        songYoutube = songAudio;
        songAudio = "";
      }
      if ((!songYoutube && !songAudio) && (songData.id || songTitle)) {
        try {
          const customSongs = JSON.parse(localStorage.getItem("voxdei_custom_cloud_songs") || "{}");
          const match = Object.values(customSongs).find(cs => (songData.id && cs.id === songData.id) || (songTitle && cs.title && normStr(cs.title) === normStr(songTitle)));
          if (match) {
            songYoutube = match.youtube || "";
            songAudio = match.audio || "";
            if (!songYoutube && window.isYouTubeUrl(songAudio)) {
              songYoutube = songAudio;
              songAudio = "";
            }
          }
        } catch(e) {}
      }

      // Cargar foto de portada buscando en todas las fuentes disponibles
      let coverVal = songData.cover || songData.coverUrl || songData.dataset?.cover || "";
      if (!coverVal && (songData.id || songTitle)) {
        try {
          const customSongs = JSON.parse(localStorage.getItem("voxdei_custom_cloud_songs") || "{}");
          const match = Object.values(customSongs).find(cs => (songData.id && cs.id === songData.id) || (songTitle && cs.title && normStr(cs.title) === normStr(songTitle)));
          if (match && (match.cover || match.coverUrl)) {
            coverVal = match.cover || match.coverUrl;
          }
        } catch(e) {}
      }
      if (!coverVal && songTitle && window.allSongs) {
        const foundEl = window.allSongs.find(s => {
          const info = typeof window.getSongInfo === "function" ? window.getSongInfo(s) : null;
          return (info?.title && normStr(info.title) === normStr(songTitle)) || (s.dataset?.title && normStr(s.dataset.title) === normStr(songTitle));
        });
        if (foundEl) {
          coverVal = foundEl.dataset?.cover || foundEl.querySelector?.(".song-cover-thumb")?.src || "";
        }
      }

      currentEditingSongData = {
        ...songData,
        originalTitle: songTitle,
        originalAuthor: songAuthor,
        originalCategory: resolvedCategory || "Entrada",
        category: resolvedCategory || "Entrada",
        originalId: songData.id || songData.dataset?.id || (window.generateStableSongId ? window.generateStableSongId(songTitle, songAuthor) : ""),
        id: songData.id || songData.dataset?.id || (window.generateStableSongId ? window.generateStableSongId(songTitle, songAuthor) : ""),
        cover: coverVal,
        coverUrl: coverVal,
        youtube: songYoutube,
        audio: songAudio
      };

      if (categoryIn) {
        if (resolvedCategory) {
          const normTarget = resolvedCategory.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
          let matched = false;
          for (let i = 0; i < categoryIn.options.length; i++) {
            const optVal = categoryIn.options[i].value;
            const normOpt = optVal.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
            if (normOpt === normTarget) {
              categoryIn.selectedIndex = i;
              matched = true;
              break;
            }
          }
          if (!matched) categoryIn.value = resolvedCategory;
        } else {
          categoryIn.value = "Entrada";
        }
      }
      if (tagsIn) {
        tagsIn.value = songData.tags || "";
        window.syncQuickTagPills?.(tagsIn.value);
      }
      if (audioIn) audioIn.value = songAudio;
      if (youtubeIn) youtubeIn.value = songYoutube;
      
      let cleanLyrics = songData.lyrics || songData.letraHtml || "";
      if (cleanLyrics.includes("<") && cleanLyrics.includes(">")) {
        cleanLyrics = cleanLyrics
          .replace(/<span[^>]*class=['"]chord['"][^>]*>/gi, "")
          .replace(/<\/span>/gi, "")
          .replace(/<\/?pre[^>]*>/gi, "")
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/p>/gi, "\n")
          .replace(/<p[^>]*>/gi, "")
          // Preservar <b>, <strong>, <i>, <em>, <u> para que el coro en negrita continúe intacto y visible
          .trim();
      }
      if (lyricsIn) lyricsIn.value = cleanLyrics;
    } else {
      if (modalTitle) modalTitle.textContent = "Nueva canción";
      if (modalSubtitle) modalSubtitle.textContent = "Agrega una nueva canción al repertorio del coro";
      if (publishText) publishText.textContent = "Guardar canción";
      if (btnDelete) btnDelete.style.display = "none";

      if (titleIn) titleIn.value = "";
      if (authorIn) authorIn.value = "";

      // Si el usuario tiene una categoría seleccionada actualmente en el filtro, usarla por defecto
      const activeFilterBtn = document.querySelector(".category-filter-btn.active, .cat-chip.active, [data-category].active");
      const currentFilteredCat = activeFilterBtn?.dataset?.category || "";
      let defaultCat = "Entrada";
      if (currentFilteredCat && currentFilteredCat.toLowerCase() !== "todos") {
        defaultCat = currentFilteredCat;
      }
      if (categoryIn) {
        const normTarget = defaultCat.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
        for (let i = 0; i < categoryIn.options.length; i++) {
          const optVal = categoryIn.options[i].value;
          const normOpt = optVal.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
          if (normOpt === normTarget) {
            categoryIn.selectedIndex = i;
            break;
          }
        }
      }
      if (tagsIn) {
        tagsIn.value = "";
        window.syncQuickTagPills?.("");
      }
      if (audioIn) audioIn.value = "";
      if (youtubeIn) youtubeIn.value = "";
      if (lyricsIn) lyricsIn.value = "";
    }

    if (charCounter) {
      charCounter.textContent = `${titleIn?.value.length || 0}/100`;
    }

    // Inicializar visualmente la sección de Audio / YouTube
    const audioVal = audioIn?.value || "";
    const youtubeVal = youtubeIn?.value || "";
    const mediaAudioBtn = document.getElementById("btnMediaOptionAudio");
    const mediaYtBtn = document.getElementById("btnMediaOptionYoutube");
    const panelAudio = document.getElementById("mediaPanelAudio");
    const panelYt = document.getElementById("mediaPanelYoutube");
    const audioEmptyState = document.getElementById("audioEmptyState");
    const audioUploadingState = document.getElementById("audioUploadingState");
    const audioReadyState = document.getElementById("audioReadyState");
    const audioPreviewPlayer = document.getElementById("editorAudioPreviewPlayer");
    const audioReadyFileName = document.getElementById("audioReadyFileName");

    if (audioVal && !window.isYouTubeUrl(audioVal)) {
      mediaAudioBtn?.classList.add("active");
      mediaYtBtn?.classList.remove("active");
      if (panelAudio) panelAudio.style.display = "block";
      if (panelYt) panelYt.style.display = "none";
      if (audioEmptyState) audioEmptyState.style.display = "none";
      if (audioUploadingState) audioUploadingState.style.display = "none";
      if (audioReadyState) audioReadyState.style.display = "flex";
      if (audioPreviewPlayer) audioPreviewPlayer.src = audioVal;
      if (audioReadyFileName) audioReadyFileName.textContent = songData?.title ? ("Grabación: " + songData.title) : "Audio guardado";
    } else if (youtubeVal || (audioVal && window.isYouTubeUrl(audioVal))) {
      mediaYtBtn?.classList.add("active");
      mediaAudioBtn?.classList.remove("active");
      if (panelAudio) panelAudio.style.display = "none";
      if (panelYt) panelYt.style.display = "block";
      if (audioEmptyState) audioEmptyState.style.display = "flex";
      if (audioReadyState) audioReadyState.style.display = "none";
      if (audioPreviewPlayer) audioPreviewPlayer.src = "";
    } else {
      mediaAudioBtn?.classList.add("active");
      mediaYtBtn?.classList.remove("active");
      if (panelAudio) panelAudio.style.display = "block";
      if (panelYt) panelYt.style.display = "none";
      if (audioEmptyState) audioEmptyState.style.display = "flex";
      if (audioUploadingState) audioUploadingState.style.display = "none";
      if (audioReadyState) audioReadyState.style.display = "none";
      if (audioPreviewPlayer) audioPreviewPlayer.src = "";
    }

    // Cargar foto de portada si la canción ya tiene una
    const coverVal = currentEditingSongData?.cover || songData?.cover || songData?.coverUrl || songData?.dataset?.cover || "";
    const editorSongCover = document.getElementById("editorSongCover");
    const coverEmptyState = document.getElementById("coverEmptyState");
    const coverReadyState = document.getElementById("coverReadyState");
    const editorCoverPreviewImg = document.getElementById("editorCoverPreviewImg");
    const editorCoverFileName = document.getElementById("editorCoverFileName");
    if (editorSongCover) editorSongCover.value = coverVal;
    if (coverVal) {
      if (coverEmptyState) coverEmptyState.style.display = "none";
      if (coverReadyState) coverReadyState.style.display = "flex";
      if (editorCoverPreviewImg) editorCoverPreviewImg.src = coverVal;
      if (editorCoverFileName) editorCoverFileName.textContent = songData?.title ? ("Portada: " + songData.title) : "Portada lista";
    } else {
      if (coverEmptyState) coverEmptyState.style.display = "flex";
      if (coverReadyState) coverReadyState.style.display = "none";
      if (editorCoverPreviewImg) editorCoverPreviewImg.src = "";
    }

    if (typeof setLyricsPreviewMode === "function") setLyricsPreviewMode(false);
    const tagsDropdownMenu = document.getElementById("tagsDropdownMenu");
    if (tagsDropdownMenu) tagsDropdownMenu.style.display = "none";
    const tagsChevronIcon = document.getElementById("tagsChevronIcon");
    if (tagsChevronIcon) tagsChevronIcon.style.transform = "rotate(0deg)";
    const btnPublishInit = document.getElementById("btnPublishSong");
    if (btnPublishInit) {
      btnPublishInit.style.setProperty("display", "none", "important");
      btnPublishInit.classList.add("step-hidden");
    }
    // Inicializar wizard en paso 1
    setEditorStep(1);
    updateEditorFontSize();

    modal.classList.add("showing");
    modal.classList.add("active");
    if (window.lucide) window.lucide.createIcons();

    if (lyricsIn) {
      lyricsIn.style.height = "";
    }
  };
  window.openSongEditorModal = openSongEditorModal;

  // Lógica de pestañas Audio / YouTube
  document.getElementById("btnMediaOptionAudio")?.addEventListener("click", () => {
    document.getElementById("btnMediaOptionAudio")?.classList.add("active");
    document.getElementById("btnMediaOptionYoutube")?.classList.remove("active");
    const panelAudio = document.getElementById("mediaPanelAudio");
    const panelYt = document.getElementById("mediaPanelYoutube");
    if (panelAudio) panelAudio.style.display = "block";
    if (panelYt) panelYt.style.display = "none";
  });

  document.getElementById("btnMediaOptionYoutube")?.addEventListener("click", () => {
    document.getElementById("btnMediaOptionYoutube")?.classList.add("active");
    document.getElementById("btnMediaOptionAudio")?.classList.remove("active");
    const panelAudio = document.getElementById("mediaPanelAudio");
    const panelYt = document.getElementById("mediaPanelYoutube");
    if (panelAudio) panelAudio.style.display = "none";
    if (panelYt) panelYt.style.display = "block";
  });

  // SUBIDA DIRECTA DE AUDIO A LA NUBE (FIREBASE STORAGE)
  const audioFileInput = document.getElementById("songAudioFileInput");
  const triggerAudioUploadBtn = document.getElementById("btnTriggerAudioUpload");
  const audioEmptyDropzone = document.getElementById("audioEmptyState");
  const btnRemoveAudio = document.getElementById("btnRemoveAudioFile");

  const openAudioPicker = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    audioFileInput?.click();
  };

  triggerAudioUploadBtn?.addEventListener("click", openAudioPicker);
  audioEmptyDropzone?.addEventListener("click", (e) => {
    if (e.target.closest("button") === triggerAudioUploadBtn) return;
    openAudioPicker(e);
  });

  audioFileInput?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith("audio/") && !/\.(mp3|m4a|wav|aac|ogg|wma)$/i.test(file.name)) {
      showToast("Por favor selecciona un archivo de audio válido (MP3, M4A, WAV...)", "error");
      return;
    }

    const emptyBox = document.getElementById("audioEmptyState");
    const uploadingBox = document.getElementById("audioUploadingState");
    const readyBox = document.getElementById("audioReadyState");
    const statusText = document.getElementById("audioUploadStatusText");
    const progressFill = document.getElementById("audioUploadProgressFill");
    const readyName = document.getElementById("audioReadyFileName");
    const readySize = document.getElementById("audioReadySize");
    const previewPlayer = document.getElementById("editorAudioPreviewPlayer");
    const audioInputHidden = document.getElementById("editorSongAudio");

    if (emptyBox) emptyBox.style.display = "none";
    if (readyBox) readyBox.style.display = "none";
    if (uploadingBox) uploadingBox.style.display = "flex";
    if (statusText) statusText.textContent = "Preparando subida de audio...";
    if (progressFill) progressFill.style.width = "5%";

    try {
      if (getStorage() && isFirebaseReal()) {
        const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storagePath = `canciones_audio/${Date.now()}_${cleanName}`;
        const audioRef = ref(getStorage(), storagePath);
        const uploadTask = uploadBytesResumable(audioRef, file);

        uploadTask.on("state_changed", 
          (snapshot) => {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            if (progressFill) progressFill.style.width = `${Math.max(5, pct)}%`;
            if (statusText) statusText.textContent = `Subiendo audio a la nube... (${pct}%)`;
          },
          (err) => {
            console.warn("Storage upload error, using local fallback:", err);
            // Fallback a URL local / Data URL para que nunca se quede trabado
            const localUrl = URL.createObjectURL(file);
            if (audioInputHidden) audioInputHidden.value = localUrl;
            if (readyName) readyName.textContent = file.name;
            if (readySize) readySize.textContent = `${(file.size / (1024 * 1024)).toFixed(1)} MB (Audio temporal)`;
            if (previewPlayer) previewPlayer.src = localUrl;
            if (uploadingBox) uploadingBox.style.display = "none";
            if (readyBox) readyBox.style.display = "flex";
            showToast("Audio cargado para la canción. (Nota: Para subida permanente a la nube, revisa reglas de Storage en Firebase)", "warning");
          },
          async () => {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            if (audioInputHidden) audioInputHidden.value = downloadUrl;
            if (readyName) readyName.textContent = file.name;
            if (readySize) readySize.textContent = `${(file.size / (1024 * 1024)).toFixed(1)} MB · Guardado en la nube`;
            if (previewPlayer) previewPlayer.src = downloadUrl;
            if (uploadingBox) uploadingBox.style.display = "none";
            if (readyBox) readyBox.style.display = "flex";
            showToast("¡Audio grabado subido y guardado exitosamente!", "success");
            if (window.lucide) window.lucide.createIcons();
          }
        );
      } else {
        // Modo offline / sin Storage activo
        const localUrl = URL.createObjectURL(file);
        if (audioInputHidden) audioInputHidden.value = localUrl;
        if (readyName) readyName.textContent = file.name;
        if (readySize) readySize.textContent = `${(file.size / (1024 * 1024)).toFixed(1)} MB (Guardado local)`;
        if (previewPlayer) previewPlayer.src = localUrl;
        if (uploadingBox) uploadingBox.style.display = "none";
        if (readyBox) readyBox.style.display = "flex";
        showToast("Audio grabado cargado en la canción.", "success");
      }
    } catch (uploadErr) {
      console.error("Error al procesar audio:", uploadErr);
      const localUrl = URL.createObjectURL(file);
      if (audioInputHidden) audioInputHidden.value = localUrl;
      if (readyName) readyName.textContent = file.name;
      if (previewPlayer) previewPlayer.src = localUrl;
      if (uploadingBox) uploadingBox.style.display = "none";
      if (readyBox) readyBox.style.display = "flex";
      showToast("Audio disponible para reproducir.", "success");
    }
  });

  btnRemoveAudio?.addEventListener("click", () => {
    const audioInputHidden = document.getElementById("editorSongAudio");
    const previewPlayer = document.getElementById("editorAudioPreviewPlayer");
    const emptyBox = document.getElementById("audioEmptyState");
    const readyBox = document.getElementById("audioReadyState");
    const fileInput = document.getElementById("songAudioFileInput");

    if (audioInputHidden) audioInputHidden.value = "";
    if (previewPlayer) {
      previewPlayer.pause();
      previewPlayer.src = "";
    }
    if (fileInput) fileInput.value = "";
    if (readyBox) readyBox.style.display = "none";
    if (emptyBox) emptyBox.style.display = "flex";
    showToast("Audio removido de la canción.", "info");
  });

  // LÓGICA DE SUBIDA DE FOTO DE PORTADA (PASO 3)
  const coverFileInput = document.getElementById("songCoverFileInput");
  const coverEmptyBox = document.getElementById("coverEmptyState");
  const btnRemoveCover = document.getElementById("btnRemoveCoverFile");

  coverEmptyBox?.addEventListener("click", () => {
    coverFileInput?.click();
  });

  coverFileInput?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp|gif|svg)$/i.test(file.name)) {
      showToast("Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP)", "error");
      return;
    }

    try {
      const dataUrl = await resizeImageToDataUrl(file, 400, 400, 0.85);
      const editorSongCover = document.getElementById("editorSongCover");
      const editorCoverPreviewImg = document.getElementById("editorCoverPreviewImg");
      const editorCoverFileName = document.getElementById("editorCoverFileName");
      const coverReadyState = document.getElementById("coverReadyState");
      const coverEmptyState = document.getElementById("coverEmptyState");

      if (editorSongCover) editorSongCover.value = dataUrl;
      if (editorCoverPreviewImg) editorCoverPreviewImg.src = dataUrl;
      if (editorCoverFileName) editorCoverFileName.textContent = file.name;
      if (coverEmptyState) coverEmptyState.style.display = "none";
      if (coverReadyState) coverReadyState.style.display = "flex";
      if (window.lucide) window.lucide.createIcons();
      showToast("Foto de portada seleccionada con éxito.", "success");
    } catch (err) {
      console.error(err);
      showToast("No se pudo cargar la imagen de portada.", "error");
    }
  });

  btnRemoveCover?.addEventListener("click", () => {
    const editorSongCover = document.getElementById("editorSongCover");
    const coverFileInput = document.getElementById("songCoverFileInput");
    const coverReadyState = document.getElementById("coverReadyState");
    const coverEmptyState = document.getElementById("coverEmptyState");
    const editorCoverPreviewImg = document.getElementById("editorCoverPreviewImg");

    if (editorSongCover) editorSongCover.value = "";
    if (currentEditingSongData) {
      currentEditingSongData.cover = "";
      currentEditingSongData.coverUrl = "";
    }
    if (coverFileInput) coverFileInput.value = "";
    if (editorCoverPreviewImg) editorCoverPreviewImg.src = "";
    if (coverReadyState) coverReadyState.style.display = "none";
    if (coverEmptyState) coverEmptyState.style.display = "flex";
    if (window.lucide) window.lucide.createIcons();
    showToast("Foto de portada removida.", "info");
  });

  let currentEditorStep = 1;
  const totalEditorSteps = 4;

  const updateSummaryView = () => {
    const titleVal = document.getElementById("editorSongTitle")?.value.trim() || "Sin título";
    const authorVal = document.getElementById("editorSongAuthor")?.value.trim() || "Desconocido";
    const catVal = document.getElementById("editorSongCategory")?.value || "Entrada";
    const tagsVal = document.getElementById("editorSongTags")?.value.trim() || "";
    const audioVal = document.getElementById("editorSongAudio")?.value.trim() || "";
    const ytVal = document.getElementById("editorSongYoutube")?.value.trim() || "";
    const lyricsVal = (ensureLyricsEditor() || document.getElementById("editorSongLyrics"))?.value?.trim() || "";

    const sumTitle = document.getElementById("summarySongTitle");
    const sumSub = document.getElementById("summarySongSubmeta");
    const sumLyrics = document.getElementById("summaryLyricsStatus");
    const sumAudio = document.getElementById("summaryAudioStatus");
    const sumCat = document.getElementById("summaryCategoryVal");
    const sumAuthor = document.getElementById("summaryAuthorVal");
    const sumTagsRow = document.getElementById("summaryTagsRow");
    const sumTagsVal = document.getElementById("summaryTagsVal");

    if (sumTitle) sumTitle.textContent = titleVal;
    if (sumSub) sumSub.textContent = `${catVal} • ${authorVal}`;
    if (sumLyrics) {
      const chordCount = (lyricsVal.match(/\[([A-G][b#]?[m]?[0-9]?[^\]]*)\]/g) || []).length;
      sumLyrics.textContent = lyricsVal ? (chordCount > 0 ? `Lista (${chordCount} acordes)` : "Lista con letra") : "Sin letra";
    }
    if (sumAudio) {
      if (audioVal && !window.isYouTubeUrl(audioVal)) sumAudio.textContent = "Audio grabado";
      else if (ytVal || (audioVal && window.isYouTubeUrl(audioVal))) sumAudio.textContent = "Enlace de YouTube";
      else sumAudio.textContent = "Sin audio";
    }
    if (sumCat) sumCat.textContent = catVal;
    if (sumAuthor) sumAuthor.textContent = authorVal;
    if (sumTagsRow && sumTagsVal) {
      if (tagsVal) {
        sumTagsRow.style.display = "flex";
        sumTagsVal.textContent = tagsVal;
      } else {
        sumTagsRow.style.display = "none";
      }
    }
  };

  const setEditorStep = (step) => {
    currentEditorStep = step;

    // Actualizar indicador de paso (ej. 1 de 4)
    const indicatorText = document.getElementById("editorStepIndicatorText");
    if (indicatorText) {
      indicatorText.textContent = `${Math.min(step, totalEditorSteps)} de ${totalEditorSteps}`;
    }

    // Actualizar segmentos de progreso rellenando con rojo según el paso actual
    document.querySelectorAll(".step-seg").forEach((seg, idx) => {
      const isFilled = (idx + 1 <= step);
      if (isFilled) {
        seg.classList.add("active");
        seg.style.setProperty("background-color", "#dc2626", "important");
      } else {
        seg.classList.remove("active");
        seg.style.removeProperty("background-color");
      }
    });

    // Mostrar el panel de paso activo en móvil
    for (let i = 1; i <= totalEditorSteps; i++) {
      const pane = document.getElementById(`editorStep${i}`);
      if (pane) {
        if (i === step) pane.classList.add("active");
        else pane.classList.remove("active");
      }
    }
    const successPane = document.getElementById("editorStepSuccess");
    if (successPane) {
      if (step === 5) successPane.classList.add("active");
      else successPane.classList.remove("active");
    }

    const editorBody = document.querySelector(".modern-editor-body");
    if (editorBody) {
      editorBody.scrollTop = 0;
      if (step === 2) {
        editorBody.classList.add("editor-step-2-active");
      } else {
        editorBody.classList.remove("editor-step-2-active");
      }
    }

    // Botones de navegación en pie del modal y cabecera
    const btnBack = document.getElementById("btnEditorBack");
    const btnPrev = document.getElementById("btnEditorPrevStep");
    const btnNext = document.getElementById("btnEditorNextStep");
    const btnPublish = document.getElementById("btnPublishSong");
    const btnDelete = document.getElementById("btnDeleteCurrentCloudSong");
    const modalFooter = document.getElementById("modernEditorFooter");
    const progressBar = document.getElementById("editorStepProgressBar");

    if (step === 5) {
      // Pantalla de éxito: ocultar navegación estándar
      if (btnBack) btnBack.style.display = "none";
      if (progressBar) progressBar.style.display = "none";
      if (modalFooter) modalFooter.style.display = "none";
      if (btnDelete) btnDelete.style.display = "none";
    } else {
      if (modalFooter) modalFooter.style.display = "flex";
      if (progressBar) progressBar.style.display = "flex";

      // Botón atrás (flecha sin texto)
      if (step === 1) {
        if (btnBack) btnBack.style.display = "none";
        if (btnPrev) btnPrev.style.display = "none";
      } else {
        if (btnBack && window.innerWidth < 768) btnBack.style.display = "inline-flex";
        if (btnPrev) btnPrev.style.display = "inline-flex";
      }

      // Botón Eliminar: SÓLO en modo corregir canción existente Y SÓLO en el paso 1 (al inicio).
      // En pasos 2, 3, 4 y en "Nueva canción", NUNCA se muestra.
      if (btnDelete) {
        if (currentEditingSongData && step === 1) {
          btnDelete.style.setProperty("display", "inline-flex", "important");
        } else {
          btnDelete.style.setProperty("display", "none", "important");
        }
      }

      // Paso final vs pasos intermedios:
      // En pasos 1, 2, 3: SOLO flecha siguiente (btnNext), NUNCA guardar canción / guardar cambios
      // En paso final (4): Se oculta flecha adelante y SE MUESTRA guardar
      if (step === totalEditorSteps) {
        if (btnNext) {
          btnNext.style.setProperty("display", "none", "important");
        }
        if (btnPublish) {
          btnPublish.style.setProperty("display", "inline-flex", "important");
          btnPublish.classList.remove("step-hidden");
          const publishText = document.getElementById("btnPublishSongText");
          if (publishText) {
            publishText.textContent = currentEditingSongData ? "Guardar cambios" : "Guardar canción";
          }
        }
        updateSummaryView();
      } else {
        if (btnNext) {
          btnNext.style.setProperty("display", "inline-flex", "important");
        }
        if (btnPublish) {
          btnPublish.style.setProperty("display", "none", "important");
          btnPublish.classList.add("step-hidden");
        }
      }
    }

    if (window.lucide) window.lucide.createIcons();
  };

  const goToNextStep = () => {
    if (currentEditorStep === 1) {
      const title = document.getElementById("editorSongTitle")?.value.trim();
      if (!title) {
        showToast("Por favor ingresa el nombre de la canción.", "error");
        document.getElementById("editorSongTitle")?.focus();
        return;
      }
    } else if (currentEditorStep === 2) {
      const lyrics = (ensureLyricsEditor() || document.getElementById("editorSongLyrics"))?.value?.trim() || "";
      if (!lyrics) {
        showToast("Por favor escribe la letra y acordes antes de continuar.", "error");
        document.getElementById("editorSongLyrics")?.focus();
        return;
      }
    }
    if (currentEditorStep < totalEditorSteps) {
      setEditorStep(currentEditorStep + 1);
    }
  };

  const goToPrevStep = () => {
    if (currentEditorStep > 1) {
      setEditorStep(currentEditorStep - 1);
    }
  };

  document.getElementById("btnEditorNextStep")?.addEventListener("click", goToNextStep);
  document.getElementById("btnEditorPrevStep")?.addEventListener("click", goToPrevStep);
  document.getElementById("btnEditorBack")?.addEventListener("click", goToPrevStep);

  // Botón éxito: Ver en repertorio
  document.getElementById("btnSuccessViewSong")?.addEventListener("click", () => {
    closeSongEditorModal();
  });

  // Botón éxito: Agregar otra
  document.getElementById("btnSuccessAddAnother")?.addEventListener("click", () => {
    openSongEditorModal(null);
  });

  const closeSongEditorModal = () => {
    const modal = document.getElementById("songEditorModal");
    if (!modal) return;
    modal.classList.remove("showing");
    modal.classList.remove("active");
    currentEditingSongData = null;
    setLyricsPreviewMode(false);
    const tagsDropdownMenu = document.getElementById("tagsDropdownMenu");
    if (tagsDropdownMenu) tagsDropdownMenu.style.display = "none";
    const tagsChevronIcon = document.getElementById("tagsChevronIcon");
    if (tagsChevronIcon) tagsChevronIcon.style.transform = "rotate(0deg)";
    setEditorStep(1);
  };
  window.closeSongEditorModal = closeSongEditorModal;

  document.getElementById("closeSongEditorModal")?.addEventListener("click", closeSongEditorModal);
  document.getElementById("btnCancelSongEditor")?.addEventListener("click", closeSongEditorModal);

  let isEditorPreviewActive = false;
  const btnToggleLyricsPreview = document.getElementById("btnToggleLyricsPreview");
  const editorWriteTabContent = document.getElementById("editorWriteTabContent");
  const editorPreviewTabContent = document.getElementById("editorPreviewTabContent");

  const setLyricsPreviewMode = (active) => {
    isEditorPreviewActive = !!active;
    if (isEditorPreviewActive) {
      btnToggleLyricsPreview?.classList.add("active");
      btnToggleLyricsPreview?.setAttribute("title", "Volver al editor de letra");
      if (editorWriteTabContent) {
        editorWriteTabContent.classList.remove("active");
        editorWriteTabContent.style.setProperty("display", "none", "important");
      }
      if (editorPreviewTabContent) {
        editorPreviewTabContent.classList.add("active");
        editorPreviewTabContent.style.setProperty("display", "flex", "important");
      }
      updateEditorPreview();
    } else {
      btnToggleLyricsPreview?.classList.remove("active");
      btnToggleLyricsPreview?.setAttribute("title", "Ver cómo se verá con acordes");
      if (editorPreviewTabContent) {
        editorPreviewTabContent.classList.remove("active");
        editorPreviewTabContent.style.setProperty("display", "none", "important");
      }
      if (editorWriteTabContent) {
        editorWriteTabContent.classList.add("active");
        editorWriteTabContent.style.setProperty("display", "flex", "important");
      }
    }
    if (window.lucide) window.lucide.createIcons();
  };
  window.setLyricsPreviewMode = setLyricsPreviewMode;

  btnToggleLyricsPreview?.addEventListener("click", () => {
    setLyricsPreviewMode(!isEditorPreviewActive);
  });

  // Controles de tamaño de letra visual estándar (ni gigante ni diminuto, óptimo para jóvenes y celulares)
  const FONT_SIZES = [10, 11, 12, 13, 14, 15, 16, 18];
  let currentFontSizeIdx = 3; // 13px estándar por defecto

  const updateEditorFontSize = () => {
    const textarea = document.getElementById("editorSongLyrics");
    const previewBody = document.getElementById("previewSongBody");
    const badge = document.getElementById("editorFontSizeBadge");
    const size = FONT_SIZES[currentFontSizeIdx];
    if (textarea) textarea.style.fontSize = `${size}px`;
    if (previewBody) previewBody.style.fontSize = `${size}px`;
    if (badge) badge.textContent = `${size}px`;
  };

  document.getElementById("btnLyricZoomOut")?.addEventListener("click", () => {
    if (currentFontSizeIdx > 0) {
      currentFontSizeIdx--;
      updateEditorFontSize();
    }
  });

  document.getElementById("btnLyricZoomIn")?.addEventListener("click", () => {
    if (currentFontSizeIdx < FONT_SIZES.length - 1) {
      currentFontSizeIdx++;
      updateEditorFontSize();
    }
  });

  const updateEditorPreview = () => {
    const lyricsVal = (ensureLyricsEditor() || document.getElementById("editorSongLyrics"))?.value || "";
    const previewBody = document.getElementById("previewSongBody");
    const previewChords = document.getElementById("previewChordsCount");

    const formattedHtml = window.formatLyricsWithChords(lyricsVal);
    if (previewBody) {
      previewBody.innerHTML = formattedHtml;
      updateEditorFontSize();
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = formattedHtml;
    const chordsCount = tempDiv.querySelectorAll(".chord").length;
    if (previewChords) {
      previewChords.textContent = `${chordsCount} acordes detectados`;
    }
  };

  const formatSelection = (command, fallbackPrefix = "<b>", fallbackSuffix = "</b>") => {
    const el = ensureLyricsEditor() || document.getElementById("editorSongLyrics");
    if (!el) return;

    // Guardar posición exacta del scroll del editor y del modal para evitar cualquier salto
    const prevScroll = el.scrollTop;
    const modalBody = el.closest(".modern-editor-body") || document.querySelector(".modern-editor-body");
    const prevModalScroll = modalBody ? modalBody.scrollTop : 0;

    if (el.getAttribute("contenteditable") === "true") {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || !el.contains(sel.anchorNode)) {
        el.focus({ preventScroll: true });
      }
      document.execCommand(command, false, null);
    } else {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const text = el.value;
      const selected = text.substring(start, end);
      if (!selected) {
        const placeholder = "Escribe aquí la estrofa o coro";
        el.value = text.substring(0, start) + `${fallbackPrefix}${placeholder}${fallbackSuffix}` + text.substring(end);
        el.focus({ preventScroll: true });
        el.setSelectionRange(start + fallbackPrefix.length, start + fallbackPrefix.length + placeholder.length);
      } else {
        if (selected.startsWith(fallbackPrefix) && selected.endsWith(fallbackSuffix)) {
          const unwrapped = selected.slice(fallbackPrefix.length, -fallbackSuffix.length);
          el.value = text.substring(0, start) + unwrapped + text.substring(end);
          el.focus({ preventScroll: true });
          el.setSelectionRange(start, start + unwrapped.length);
        } else {
          const replacement = `${fallbackPrefix}${selected}${fallbackSuffix}`;
          el.value = text.substring(0, start) + replacement + text.substring(end);
          el.focus({ preventScroll: true });
          el.setSelectionRange(start + fallbackPrefix.length, start + fallbackPrefix.length + selected.length);
        }
      }
      el.dispatchEvent(new Event("input"));
    }

    // Restaurar inmediatamente el scroll exacto: NUNCA se baja ni se sube
    el.scrollTop = prevScroll;
    if (modalBody) modalBody.scrollTop = prevModalScroll;
  };

  const wrapSelectionWithBrackets = () => {
    const el = ensureLyricsEditor() || document.getElementById("editorSongLyrics");
    if (!el) return;

    const prevScroll = el.scrollTop;
    const modalBody = el.closest(".modern-editor-body") || document.querySelector(".modern-editor-body");
    const prevModalScroll = modalBody ? modalBody.scrollTop : 0;

    if (el.getAttribute("contenteditable") === "true") {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
        const range = sel.getRangeAt(0);
        const selectedText = range.toString();
        if (selectedText.startsWith("[") && selectedText.endsWith("]")) {
          const textNode = document.createTextNode(selectedText.slice(1, -1));
          range.deleteContents();
          range.insertNode(textNode);
        } else {
          const textNode = document.createTextNode(`[${selectedText || "Acorde"}]`);
          range.deleteContents();
          range.insertNode(textNode);
        }
      } else {
        el.focus({ preventScroll: true });
        document.execCommand("insertText", false, "[Acorde]");
      }
    } else {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const text = el.value;
      const selected = text.substring(start, end);
      if (!selected) {
        el.value = text.substring(0, start) + "[Acorde]" + text.substring(end);
        el.focus({ preventScroll: true });
        el.setSelectionRange(start + 1, start + 7);
      } else {
        const replacement = selected.startsWith("[") && selected.endsWith("]")
          ? selected.slice(1, -1)
          : `[${selected}]`;
        el.value = text.substring(0, start) + replacement + text.substring(end);
        el.focus({ preventScroll: true });
        el.setSelectionRange(start, start + replacement.length);
      }
      el.dispatchEvent(new Event("input"));
    }

    el.scrollTop = prevScroll;
    if (modalBody) modalBody.scrollTop = prevModalScroll;
  };

  document.getElementById("btnWordBold")?.addEventListener("click", () => formatSelection("bold", "<b>", "</b>"));
  document.getElementById("btnWordItalic")?.addEventListener("click", () => formatSelection("italic", "<i>", "</i>"));
  document.getElementById("btnWordUnderline")?.addEventListener("click", () => formatSelection("underline", "<u>", "</u>"));
  document.getElementById("btnWordChordsWrap")?.addEventListener("click", () => wrapSelectionWithBrackets());

  // Atajo de teclado universal Ctrl+B / Cmd+B para poner en negrita el coro
  document.getElementById("editorSongLyrics")?.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === "b" || e.key === "B")) {
      e.preventDefault();
      formatSelection("bold", "<b>", "</b>");
    } else if ((e.ctrlKey || e.metaKey) && (e.key === "i" || e.key === "I")) {
      e.preventDefault();
      formatSelection("italic", "<i>", "</i>");
    } else if ((e.ctrlKey || e.metaKey) && (e.key === "u" || e.key === "U")) {
      e.preventDefault();
      formatSelection("underline", "<u>", "</u>");
    }
  });

  // Contador en vivo de caracteres del título
  document.getElementById("editorSongTitle")?.addEventListener("input", function() {
    const charCounter = document.getElementById("editorTitleCharCount");
    if (charCounter) {
      charCounter.textContent = `${this.value.length}/100`;
    }
  });

  // =========================================================================
  // MENÚ DESPLEGABLE DE ETIQUETAS DE USO (TIPO OPCIÓN MÚLTIPLE DE FORMULARIO)
  // =========================================================================
  const btnToggleSuggestedTags = document.getElementById("btnToggleSuggestedTags");
  const tagsDropdownMenu = document.getElementById("tagsDropdownMenu");
  const tagsChevronIcon = document.getElementById("tagsChevronIcon");
  const editorSongTags = document.getElementById("editorSongTags");
  const tagsDropdownWrapper = document.getElementById("tagsDropdownWrapper");

  const syncTagMenuOptions = () => {
    const rawVal = editorSongTags?.value || "";
    const selectedList = rawVal
      .split(/[,–\-\/]/)
      .map(t => t.trim().toLowerCase())
      .filter(Boolean);

    document.querySelectorAll(".tag-menu-option").forEach(opt => {
      const tag = (opt.getAttribute("data-tag") || "").trim().toLowerCase();
      if (tag && selectedList.includes(tag)) {
        opt.classList.add("selected");
      } else {
        opt.classList.remove("selected");
      }
    });
  };
  window.syncQuickTagPills = syncTagMenuOptions;

  const toggleTagsDropdown = (forceState = null) => {
    if (!tagsDropdownMenu) return;
    const isCurrentlyHidden = (tagsDropdownMenu.style.display === "none" || !tagsDropdownMenu.style.display);
    const shouldOpen = (forceState !== null) ? forceState : isCurrentlyHidden;

    tagsDropdownMenu.style.display = shouldOpen ? "block" : "none";
    if (tagsChevronIcon) {
      tagsChevronIcon.style.transform = shouldOpen ? "rotate(180deg)" : "rotate(0deg)";
    }
    if (shouldOpen) {
      syncTagMenuOptions();
      if (window.lucide) window.lucide.createIcons();
    }
  };

  btnToggleSuggestedTags?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleTagsDropdown();
  });

  // Abrir también al hacer clic en el input de etiquetas
  editorSongTags?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleTagsDropdown(true);
  });

  // Cerrar menú al hacer clic fuera del contenedor
  document.addEventListener("click", (e) => {
    if (tagsDropdownMenu && tagsDropdownMenu.style.display !== "none") {
      if (!tagsDropdownWrapper || !tagsDropdownWrapper.contains(e.target)) {
        toggleTagsDropdown(false);
      }
    }
  });

  // Selección múltiple con casillas de verificación
  document.querySelectorAll(".tag-menu-option").forEach(option => {
    option.addEventListener("click", (e) => {
      e.stopPropagation();
      const tag = option.getAttribute("data-tag")?.trim();
      if (!tag || !editorSongTags) return;

      let currentTags = editorSongTags.value
        .split(/[,–\-\/]/)
        .map(t => t.trim())
        .filter(Boolean);

      const existingIndex = currentTags.findIndex(t => t.toLowerCase() === tag.toLowerCase());
      if (existingIndex >= 0) {
        currentTags.splice(existingIndex, 1);
        option.classList.remove("selected");
      } else {
        currentTags.push(tag);
        option.classList.add("selected");
      }

      editorSongTags.value = currentTags.join(", ");
      editorSongTags.dispatchEvent(new Event("input"));
      if (window.lucide) window.lucide.createIcons();
    });
  });

  editorSongTags?.addEventListener("input", syncTagMenuOptions);

  // Soporte Drag and Drop en la dropzone de audio
  const emptyAudioDropzone = document.getElementById("audioEmptyState");
  if (emptyAudioDropzone) {
    emptyAudioDropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      emptyAudioDropzone.classList.add("dragover");
    });
    emptyAudioDropzone.addEventListener("dragleave", () => {
      emptyAudioDropzone.classList.remove("dragover");
    });
    emptyAudioDropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      emptyAudioDropzone.classList.remove("dragover");
      const files = e.dataTransfer?.files;
      const fileInput = document.getElementById("songAudioFileInput");
      if (files && files.length > 0 && fileInput) {
        fileInput.files = files;
        fileInput.dispatchEvent(new Event("change"));
      }
    });
  }

  const btnWordCaseMenu = document.getElementById("btnWordCaseMenu");
  const wordCaseDropdown = document.getElementById("wordCaseDropdown");

  btnWordCaseMenu?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!wordCaseDropdown) return;
    const isHidden = (wordCaseDropdown.style.display === "none" || !wordCaseDropdown.style.display);
    if (isHidden) {
      wordCaseDropdown.style.display = "flex";
      wordCaseDropdown.style.left = "0";
      wordCaseDropdown.style.right = "auto";
      const rect = wordCaseDropdown.getBoundingClientRect();
      if (rect.right > (window.innerWidth - 12)) {
        wordCaseDropdown.style.left = "auto";
        wordCaseDropdown.style.right = "0";
      }
    } else {
      wordCaseDropdown.style.display = "none";
    }
  });

  document.addEventListener("click", () => {
    if (wordCaseDropdown) wordCaseDropdown.style.display = "none";
  });

  document.querySelectorAll(".case-option")?.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const caseType = btn.getAttribute("data-case");
      const textarea = document.getElementById("editorSongLyrics");
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      if (start === end) return;
      const text = textarea.value;
      let selected = text.substring(start, end);

      if (caseType === "upper") {
        selected = selected.toUpperCase();
      } else if (caseType === "lower") {
        selected = selected.toLowerCase();
      } else if (caseType === "title") {
        selected = selected.replace(/\b\w/g, l => l.toUpperCase());
      } else if (caseType === "sentence") {
        selected = selected.charAt(0).toUpperCase() + selected.slice(1).toLowerCase();
      }

      textarea.value = text.substring(0, start) + selected + text.substring(end);
      textarea.focus();
      textarea.setSelectionRange(start, start + selected.length);
      if (wordCaseDropdown) wordCaseDropdown.style.display = "none";
    });
  });

  document.querySelectorAll(".word-tag-btn")?.forEach(btn => {
    btn.addEventListener("click", () => {
      const tag = btn.getAttribute("data-insert") + "\n";
      const textarea = document.getElementById("editorSongLyrics");
      if (!textarea) return;
      const start = textarea.selectionStart;
      const text = textarea.value;
      textarea.value = text.substring(0, start) + tag + text.substring(start);
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    });
  });

  document.getElementById("btnPublishSong")?.addEventListener("click", async () => {
    if (typeof window.isCurrentUserEditor === "function" && !window.isCurrentUserEditor()) {
      showToast("Acceso exclusivo para el administrador (jhonbastidas2805@gmail.com).", "warning");
      return;
    }
    const title = document.getElementById("editorSongTitle")?.value.trim() || "";
    const author = document.getElementById("editorSongAuthor")?.value.trim() || "";
    const category = document.getElementById("editorSongCategory")?.value || "Entrada";
    const tags = document.getElementById("editorSongTags")?.value.trim() || "";
    
    // Preservar portada, audio y youtube si la canción ya los tenía y el usuario no los borró
    const coverInput = document.getElementById("editorSongCover")?.value.trim() || "";
    const cover = coverInput || currentEditingSongData?.cover || currentEditingSongData?.coverUrl || "";

    const audioInput = document.getElementById("editorSongAudio")?.value.trim() || "";
    const audio = audioInput || currentEditingSongData?.audio || "";

    const youtubeInput = document.getElementById("editorSongYoutube")?.value.trim() || "";
    const youtube = youtubeInput || currentEditingSongData?.youtube || "";

    const lyricsEl = ensureLyricsEditor() || document.getElementById("editorSongLyrics");
    const rawLyrics = (lyricsEl ? lyricsEl.value : "").trim();

    if (!title) {
      showToast("Por favor ingresa un título para la canción.", "error");
      document.getElementById("editorSongTitle")?.focus();
      return;
    }

    if (!rawLyrics) {
      showToast("Por favor escribe la letra y acordes de la canción.", "error");
      document.getElementById("editorSongLyrics")?.focus();
      return;
    }

    const formattedLyrics = window.formatLyricsWithChords(rawLyrics);

    const btnPublish = document.getElementById("btnPublishSong");
    if (btnPublish) btnPublish.disabled = true;

    try {
      const oldCategory = currentEditingSongData?.originalCategory || currentEditingSongData?.category || "";
      const oldTitle = currentEditingSongData?.originalTitle || currentEditingSongData?.title || "";
      const oldAuthor = currentEditingSongData?.originalAuthor || currentEditingSongData?.author || "";
      const oldId = currentEditingSongData?.originalId || currentEditingSongData?.id || (oldTitle ? (window.generateStableSongId ? window.generateStableSongId(oldTitle, oldAuthor) : null) : null);

      const songId = (window.generateStableSongId ? window.generateStableSongId(title, author) : null) || oldId || ("song_" + Date.now());
      const songPayload = {
        id: songId,
        originalId: oldId,
        originalTitle: oldTitle,
        originalCategory: oldCategory,
        title: title,
        author: author,
        category: category,
        tags: tags,
        audio: audio,
        youtube: youtube,
        cover: cover,
        lyrics: formattedLyrics,
        updatedAt: new Date().toISOString(),
        updatedBy: AuthEngine.getCurrentUser()?.email || MASTER_ADMIN_EMAIL
      };

      const targetColl = getCategoryCollectionName(category);
      if (isFirebaseReal() && getDb()) {
        // Guardar documento en la colección de la nueva categoría asignada
        await setDoc(doc(getDb(), targetColl, songId), songPayload, { merge: true });

        // Si se cambió de categoría o existían copias en otras colecciones:
        // Eliminar de TODAS las demás colecciones de categorías para asegurar que solo exista en la nueva
        const collectionsToClean = ALL_CATEGORY_COLLECTIONS.filter(c => c !== targetColl);
        for (const collName of collectionsToClean) {
          try {
            await deleteDoc(doc(getDb(), collName, songId));
            if (oldId && oldId !== songId) {
              await deleteDoc(doc(getDb(), collName, oldId));
            }
          } catch (e) {}
        }
        // Limpiar de la colección obsoleta general 'songs' si existiese allí
        try {
          await deleteDoc(doc(getDb(), "songs", songId));
          if (oldId && oldId !== songId) {
            await deleteDoc(doc(getDb(), "songs", oldId));
          }
        } catch (e) {}
      }

      // Actualizar localStorage custom cloud songs
      let customSongs = JSON.parse(localStorage.getItem("voxdei_custom_cloud_songs") || "{}");
      if (oldId && oldId !== songId && customSongs[oldId]) {
        delete customSongs[oldId];
      }
      customSongs[songId] = songPayload;
      localStorage.setItem("voxdei_custom_cloud_songs", JSON.stringify(customSongs));

      // Guardar override de categoría persistente para que ni siquiera el catálogo HTML local vuelva a duplicarla
      let catOverrides = JSON.parse(localStorage.getItem("voxdei_song_category_overrides") || "{}");
      catOverrides[songId] = category;
      if (oldId) catOverrides[oldId] = category;
      const normNewTitle = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      const normNewAuthor = (author || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      if (normNewAuthor) {
        catOverrides["title_author:" + normNewTitle + "--" + normNewAuthor] = category;
      }
      if (oldTitle) {
        const normOldTitle = oldTitle.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        const normOldAuthor = (oldAuthor || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        if (normOldAuthor) {
          catOverrides["title_author:" + normOldTitle + "--" + normOldAuthor] = category;
        }
      }
      localStorage.setItem("voxdei_song_category_overrides", JSON.stringify(catOverrides));

      // Actualizar de inmediato en el DOM y en allSongs
      window.upsertSongInApp(songPayload);

      // En móviles mostramos la pantalla de éxito con animaciones y opciones
      if (window.innerWidth < 768) {
        const successMsg = document.getElementById("successScreenMessage");
        if (successMsg) {
          successMsg.textContent = `"${title}" ha sido guardada correctamente en la categoría "${category}".`;
        }
        setEditorStep(5);
        showToast("¡Canción guardada con éxito!", "success");
      } else {
        closeSongEditorModal();
        showToast("¡Canción guardada y asignada a " + category + " exitosamente!", "success");
      }

      if (window.currentOpenedSongData && (window.currentOpenedSongData.title === title || (oldTitle && window.currentOpenedSongData.title === oldTitle))) {
        window.abrirLetra(title, formattedLyrics, author, "", audio, tags, null, null, youtube, category);
      }
    } catch (err) {
      console.error(err);
      showToast("Error al guardar en la nube: " + (err.message || err), "error");
    } finally {
      if (btnPublish) btnPublish.disabled = false;
    }
  });

  document.getElementById("btnDeleteCurrentCloudSong")?.addEventListener("click", async () => {
    if (typeof window.isCurrentUserEditor === "function" && !window.isCurrentUserEditor()) {
      showToast("Acceso exclusivo para el administrador (jhonbastidas2805@gmail.com).", "warning");
      return;
    }
    if (!currentEditingSongData) return;
    const songTitle = currentEditingSongData.title || currentEditingSongData.titulo || "";
    const ok = await showConfirmModal({
      title: "Eliminar canción",
      message: `¿Estás seguro de que deseas eliminar permanentemente la canción "${songTitle}" de la nube?`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      danger: true,
      icon: "trash-2"
    });
    if (!ok) return;

    try {
      const songId = currentEditingSongData.id || currentEditingSongData.originalId || window.generateStableSongId(songTitle, currentEditingSongData.author || currentEditingSongData.autor);
      if (isFirebaseReal() && getDb() && songId) {
        for (const coll of ALL_CATEGORY_COLLECTIONS) {
          try {
            await deleteDoc(doc(getDb(), coll, songId));
          } catch (e) {}
        }
        try {
          await deleteDoc(doc(getDb(), "songs", songId));
        } catch (e) {}
      }

      let customSongs = JSON.parse(localStorage.getItem("voxdei_custom_cloud_songs") || "{}");
      if (customSongs[songId]) {
        delete customSongs[songId];
        localStorage.setItem("voxdei_custom_cloud_songs", JSON.stringify(customSongs));
      }

      let catOverrides = JSON.parse(localStorage.getItem("voxdei_song_category_overrides") || "{}");
      if (catOverrides[songId]) delete catOverrides[songId];
      const normTitle = songTitle.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      const normAuthor = (currentEditingSongData.author || currentEditingSongData.autor || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      if (normAuthor && catOverrides["title_author:" + normTitle + "--" + normAuthor]) {
        delete catOverrides["title_author:" + normTitle + "--" + normAuthor];
      }
      localStorage.setItem("voxdei_song_category_overrides", JSON.stringify(catOverrides));

      const titleTarget = songTitle.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      const authorTarget = normAuthor;
      if (Array.isArray(window.allSongs)) {
        window.allSongs = window.allSongs.filter(s => {
          const info = typeof window.getSongInfo === "function" ? window.getSongInfo(s) : null;
          const t = info ? info.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : "";
          const a = info ? (info.author || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : "";
          const isMatch = (s.dataset.id && s.dataset.id === songId) || (t && t === titleTarget && (!authorTarget || a === authorTarget));
          if (isMatch) {
            s.remove();
            return false;
          }
          return true;
        });
      }

      const activeCatBtn = document.querySelector(".category-filter-btn.active")?.getAttribute("data-category");
      if (activeCatBtn && activeCatBtn !== "todos" && typeof window.filterByCategory === "function") {
        window.filterByCategory(activeCatBtn);
      }

      closeSongEditorModal();
      document.getElementById("popupLetra")?.classList.remove("active");
      showToast("La canción ha sido eliminada.", "info");
    } catch (err) {
      showToast("Error al eliminar canción: " + err.message, "error");
    }
  });

  // Conectar botones de apertura del selector: Nueva Canción / Corregir o editar (PC y móvil)
  const bottomSheet = document.getElementById("newSongBottomSheet");
  const openNewSongSheet = () => {
    if (typeof window.isCurrentUserEditor === "function" && !window.isCurrentUserEditor()) {
      showToast("Acceso exclusivo para el administrador (jhonbastidas2805@gmail.com).", "warning");
      return;
    }
    if (bottomSheet) {
      bottomSheet.classList.add("active");
      if (window.lucide) window.lucide.createIcons();
    } else {
      openSongEditorModal(null);
    }
  };
  window.openNewSongSheet = openNewSongSheet;
  window.openSongEditorModal = openSongEditorModal;

  const closeNewSongSheet = () => {
    if (bottomSheet) bottomSheet.classList.remove("active");
  };

  document.getElementById("btnCloseNewSongSheet")?.addEventListener("click", closeNewSongSheet);

  bottomSheet?.addEventListener("click", (e) => {
    if (e.target === bottomSheet) closeNewSongSheet();
  });

  document.getElementById("btnSheetNewSong")?.addEventListener("click", () => {
    closeNewSongSheet();
    openSongEditorModal(null);
  });

  // Modal selector para "Corregir o editar canción"
  const editSongSelectModal = document.getElementById("editSongSelectModal");
  const editSongListContainer = document.getElementById("editSongListContainer");
  const inputFilterEditSong = document.getElementById("inputFilterEditSong");

  const closeEditSongSelectModal = () => {
    if (editSongSelectModal) {
      editSongSelectModal.classList.remove("active");
      editSongSelectModal.classList.remove("showing");
    }
  };

  const stripHtml = (html) => (html || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
  const normStr = (str) => (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  const getAllAvailableSongsForEdit = () => {
    let list = [];
    if (typeof window.getGlobalSongsList === "function") {
      try {
        const globalList = window.getGlobalSongsList();
        if (Array.isArray(globalList) && globalList.length > 0) {
          list = [...globalList];
        }
      } catch (e) {}
    }
    if (!list || list.length === 0) {
      if (Array.isArray(window.rawCatalogSongs) && window.rawCatalogSongs.length > 0) {
        list = [...window.rawCatalogSongs];
      }
    }
    if (!list || list.length === 0) {
      const source = (typeof window.allSongs !== "undefined" && Array.isArray(window.allSongs) && window.allSongs.length > 0)
        ? window.allSongs
        : Array.from(document.querySelectorAll("#songsContainer .song, .song:not(.saved-rep-song-row):not(.add-songs-modal-row)"));
      
      list = source.map(songEl => {
        if (!songEl) return null;
        if (songEl.title && !songEl.tagName) return songEl;
        const info = (typeof window.getSongInfo === "function") ? window.getSongInfo(songEl) : { title: "", author: "", id: "" };
        const lyrics = songEl.querySelector(".lyrics-hidden, .lyrics, .lyrics1, .letra-content, .letra, pre")?.innerHTML?.trim() || "";
        return {
          id: songEl.dataset?.id || info.id || "",
          title: info.title || songEl.dataset?.title || songEl.querySelector(".song-row-title")?.textContent?.trim() || "",
          author: (info.author || songEl.dataset?.author || songEl.querySelector(".song-row-author")?.textContent?.replace(/[()]/g, "") || "").trim(),
          category: songEl.dataset?.category || info.category || "General",
          lyrics: lyrics,
          audio: songEl.dataset?.audio || "",
          youtube: songEl.dataset?.youtube || "",
          tags: songEl.dataset?.tags || "",
          cover: songEl.dataset?.cover || info.cover || songEl.querySelector?.(".song-cover-thumb")?.src || ""
        };
      }).filter(s => s && s.title);
    }
    if (!list || list.length === 0) {
      try {
        const cached = JSON.parse(localStorage.getItem("voxdei_cached_songs_catalog") || "[]");
        if (Array.isArray(cached) && cached.length > 0) {
          list = [...cached];
        }
      } catch (e) {}
    }

    // Integrar canciones guardadas en almacenamiento local / nube
    try {
      const customSongs = JSON.parse(localStorage.getItem("voxdei_custom_cloud_songs") || "{}");
      Object.values(customSongs).forEach(cs => {
        if (!cs || !cs.title) return;
        const idx = list.findIndex(s => (s.id && s.id === cs.id) || (s.title && normStr(s.title) === normStr(cs.title)));
        if (idx >= 0) {
          list[idx] = { 
            ...list[idx], 
            ...cs,
            cover: cs.cover || cs.coverUrl || list[idx].cover || "",
            youtube: cs.youtube || list[idx].youtube || "",
            audio: cs.audio || list[idx].audio || ""
          };
        } else {
          list.unshift(cs);
        }
      });
    } catch (e) {}

    // Desduplicar catálogo por ID y Título + Autor
    const seen = new Set();
    const uniqueList = [];
    list.forEach(s => {
      if (!s || !s.title) return;
      const key = (s.id ? `id:${s.id}` : "") + `__${normStr(s.title)}__${normStr(s.author)}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueList.push(s);
      }
    });

    return uniqueList;
  };

  const renderEditSongItems = (filterText = "") => {
    if (!editSongListContainer) return;
    const cleanFilter = normStr(filterText);
    const qWords = cleanFilter.split(/\s+/).filter(Boolean);

    // Obtener todas las canciones disponibles en la aplicación
    const allSongItems = getAllAvailableSongsForEdit();

    let filtered = [];

    if (qWords.length === 0) {
      // Sin filtro: listar todo el catálogo ordenado alfabéticamente por título
      filtered = [...allSongItems].sort((a, b) =>
        (a.title || "").localeCompare(b.title || "", "es", { sensitivity: "base" })
      );
    } else {
      // Motor de búsqueda con filtro estricto por prioridades ordenadas:
      // 1. Título comienza exactamente con el texto buscado (ej: "Señor...")
      // 2. Título contiene el texto buscado o todas las palabras (ej: "Himno al Señor de los Milagros")
      // 3. Autor comienza con el texto buscado
      // 4. Autor contiene el texto buscado o todas las palabras
      // 5. Letra de la canción contiene el término o palabras
      // 6. Categoría o etiquetas contienen el término
      const scoredItems = [];

      for (const s of allSongItems) {
        const titleNorm = normStr(s.title);
        const authorNorm = normStr(s.author);
        const lyricsNorm = normStr(stripHtml(s.lyrics || s.letra || s.letraHtml || ""));
        const catNorm = normStr(s.category);
        const tagsNorm = normStr(s.tags);

        let priority = 999;

        // 1. Prioridad 1: El título comienza con el término de búsqueda
        if (titleNorm.startsWith(cleanFilter)) {
          priority = 1;
        }
        // 2. Prioridad 2: El título contiene la frase completa o todas las palabras
        else if (titleNorm.includes(cleanFilter) || (qWords.length > 1 && qWords.every(w => titleNorm.includes(w)))) {
          priority = 2;
        }
        // 3. Prioridad 3: El autor comienza con el término de búsqueda
        else if (authorNorm.startsWith(cleanFilter)) {
          priority = 3;
        }
        // 4. Prioridad 4: El autor contiene el término de búsqueda o todas las palabras
        else if (authorNorm.includes(cleanFilter) || (qWords.length > 1 && qWords.every(w => authorNorm.includes(w)))) {
          priority = 4;
        }
        // 5. Prioridad 5: La letra de la canción contiene el término de búsqueda o palabras
        else if (lyricsNorm.includes(cleanFilter) || qWords.every(w => lyricsNorm.includes(w))) {
          priority = 5;
        }
        // 6. Prioridad 6: Categoría o etiquetas
        else if (catNorm.includes(cleanFilter) || tagsNorm.includes(cleanFilter) || qWords.every(w => `${catNorm} ${tagsNorm}`.includes(w))) {
          priority = 6;
        }
        // 7. Prioridad 7: Todas las palabras distribuidas entre título, autor y letra
        else if (qWords.every(w => `${titleNorm} ${authorNorm} ${lyricsNorm} ${catNorm} ${tagsNorm}`.includes(w))) {
          priority = 7;
        }

        if (priority < 999) {
          scoredItems.push({ song: s, priority });
        }
      }

      // Ordenar estrictamente por prioridad (1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7)
      // y dentro de cada nivel de prioridad, ordenar alfabéticamente por título
      scoredItems.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return (a.song.title || "").localeCompare(b.song.title || "", "es", { sensitivity: "base" });
      });

      filtered = scoredItems.map(item => item.song);
    }

    if (filtered.length === 0) {
      editSongListContainer.innerHTML = `
        <div style="text-align: center; padding: 36px 16px; color: #94a3b8; font-size: 0.92rem; font-weight: 500;">
          <p style="margin: 0;">No se encontraron canciones con ese criterio</p>
        </div>
      `;
      return;
    }

    editSongListContainer.innerHTML = filtered.map(s => {
      const cleanTitle = (s.title || "Sin título").replace(/"/g, '&quot;');
      const cleanAuthor = (s.author || "").replace(/[()]/g, "").trim() || "Desconocido";
      return `
        <div class="edit-song-row" data-song-title="${cleanTitle}">
          <span class="edit-song-title">${s.title}</span>
          <span class="edit-song-author">${cleanAuthor}</span>
        </div>
      `;
    }).join("");

    // Conectar clic en cada canción para abrirla directamente en el editor
    editSongListContainer.querySelectorAll(".edit-song-row, .edit-song-item").forEach(item => {
      item.addEventListener("click", () => {
        const songTitle = item.getAttribute("data-song-title");
        const found = allSongItems.find(s => (s.title || "").toLowerCase().trim() === (songTitle || "").toLowerCase().trim());
        closeEditSongSelectModal();
        if (found) {
          openSongEditorModal(found);
        }
      });
    });

    if (window.lucide) window.lucide.createIcons();
  };

  // Auto-refrescar lista si las canciones terminan de cargarse mientras el modal selector está abierto
  window.addEventListener("voxdei_songs_loaded", () => {
    if (editSongSelectModal && (editSongSelectModal.classList.contains("active") || editSongSelectModal.classList.contains("showing"))) {
      renderEditSongItems(inputFilterEditSong?.value || "");
    }
  });

  const openEditSongSelectorModal = () => {
    if (typeof window.isCurrentUserEditor === "function" && !window.isCurrentUserEditor()) {
      showToast("Acceso exclusivo para el administrador (jhonbastidas2805@gmail.com).", "warning");
      return;
    }
    if (!editSongSelectModal) return;
    editSongSelectModal.classList.add("active");
    editSongSelectModal.classList.add("showing");
    if (inputFilterEditSong) {
      inputFilterEditSong.value = "";
      setTimeout(() => inputFilterEditSong.focus(), 120);
    }
    renderEditSongItems("");
    if (window.lucide) window.lucide.createIcons();
  };
  window.openEditSongSelectorModal = openEditSongSelectorModal;

  inputFilterEditSong?.addEventListener("input", function() {
    renderEditSongItems(this.value);
  });

  document.getElementById("closeEditSongSelectModal")?.addEventListener("click", closeEditSongSelectModal);
  editSongSelectModal?.addEventListener("click", (e) => {
    if (e.target === editSongSelectModal) closeEditSongSelectModal();
  });

  // Conectar botón del bottom sheet: "Corregir o editar canción"
  document.getElementById("btnSheetEditSong")?.addEventListener("click", () => {
    closeNewSongSheet();
    openEditSongSelectorModal();
  });

  document.getElementById("btnAdminCreateSong")?.addEventListener("click", openNewSongSheet);
  document.getElementById("btnNewSongFab")?.addEventListener("click", openNewSongSheet);
  document.getElementById("btnFloatingAddSong")?.addEventListener("click", openNewSongSheet);
  document.getElementById("btnSidebarNewSong")?.addEventListener("click", () => {
    if (typeof window.closeSidebar === "function") window.closeSidebar();
    openNewSongSheet();
  });


  /* ==========================================================================
     3. MOTOR DE PERSONALIZACIÓN DE PORTADAS Y FRASES LITÚRGICAS
     ========================================================================== */
/* ==========================================================================
   13. MOTOR DE PERSONALIZACIÓN DE PORTADAS Y FRASES LITÚRGICAS (ADMIN / DIRECTOR)
   Flujo paso a paso idéntico al creador de canciones:
   1. Bottom Sheet / Selector de sección (Inicio, Repertorio, Índice)
   2. Paso 1: Cambiar foto de portada con réplica exacta de PC y Móvil
   3. Paso 2: Editar frase o lema litúrgico
   ========================================================================== */
(function initHeaderConfigEngine() {
  const DEFAULT_HEADER_CONFIG = {
    home: {
      coverUrl: "Principal/Santuario.png",
      coverPosition: "center 50%",
      quote: "“La música también\nes una forma de orar”"
    },
    repertorio: {
      coverUrl: "Principal/Santisimo.png",
      coverPosition: "center 50%",
      quote: "“Cantar es orar\ndos veces”"
    },
    indice: {
      coverUrl: "Principal/Santuario.png",
      coverPosition: "center 50%",
      quote: "“Alaben al Señor con alegría”"
    }
  };

  const SECTION_METADATA = {
    home: {
      name: "Página de Inicio",
      title: "CANCIONERO",
      titleHighlight: "DIGITAL",
      subtitle: "Coro Juvenil Salesiano Vox Dei",
      badgeText: "Vista previa en PC",
      defaultCover: "Principal/Santuario.png",
      defaultQuote: "“La música también\nes una forma de orar”",
      icon: "home"
    },
    repertorio: {
      name: "Página de Repertorio",
      title: "REPERTORIO",
      titleHighlight: "DIGITAL",
      subtitle: "Organiza y prepara tus cantos para la celebración",
      badgeText: "Vista previa en PC",
      defaultCover: "Principal/Santisimo.png",
      defaultQuote: "“Cantar es orar\ndos veces”",
      icon: "list-music"
    },
    indice: {
      name: "Directorio General (Índice)",
      title: "ÍNDICE DE",
      titleHighlight: "CANTOS",
      subtitle: "Directorio General del Cancionero Litúrgico",
      badgeText: "Vista previa en PC",
      defaultCover: "Principal/Santuario.png",
      defaultQuote: "“Alaben al Señor con alegría”",
      icon: "book-open"
    }
  };

  let currentHeaderConfig = { ...DEFAULT_HEADER_CONFIG };
  let currentCustomizerSection = "home"; // home | repertorio | indice
  let currentWizardStep = 1; // 1: Foto | 2: Frase
  let currentPreviewMode = "pc"; // pc | mobile

  function loadLocalHeaderConfig() {
    try {
      const saved = localStorage.getItem("voxdei_headers_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        currentHeaderConfig = {
          home: { ...DEFAULT_HEADER_CONFIG.home, ...(parsed.home || {}) },
          repertorio: { ...DEFAULT_HEADER_CONFIG.repertorio, ...(parsed.repertorio || {}) },
          indice: { ...DEFAULT_HEADER_CONFIG.indice, ...(parsed.indice || {}) }
        };
      }
    } catch (e) {}
  }

  const formatMaxTwoLines = (str) => {
    if (!str) return "";
    const lines = str.split("\n").map(l => l.trim()).filter(Boolean).slice(0, 2);
    return lines.join("<br>");
  };

  function applyHeaderConfigToDOM(config = currentHeaderConfig) {

    // 1. Inicio
    const homeImg = document.getElementById("homeHeroImg");
    if (homeImg) {
      if (config.home?.coverUrl) homeImg.src = config.home.coverUrl;
      homeImg.style.objectPosition = config.home?.coverPosition || "center 50%";
    }
    const homeQuote = document.getElementById("homeHeroQuote");
    if (homeQuote && config.home?.quote) homeQuote.innerHTML = formatMaxTwoLines(config.home.quote);

    // 2. Repertorio
    const repImg = document.getElementById("repertorioHeroImg");
    if (repImg) {
      if (config.repertorio?.coverUrl) repImg.src = config.repertorio.coverUrl;
      repImg.style.objectPosition = config.repertorio?.coverPosition || "center 50%";
    }
    const repQuote = document.getElementById("repertorioHeroQuote");
    if (repQuote && config.repertorio?.quote) repQuote.innerHTML = formatMaxTwoLines(config.repertorio.quote);

    // 3. Índice
    const indiceImg = document.getElementById("indiceHeroImg");
    if (indiceImg) {
      if (config.indice?.coverUrl) indiceImg.src = config.indice.coverUrl;
      indiceImg.style.objectPosition = config.indice?.coverPosition || "center 50%";
    }
    const indiceQuote = document.getElementById("indiceHeroQuote");
    if (indiceQuote && config.indice?.quote) indiceQuote.innerHTML = formatMaxTwoLines(config.indice.quote);
  }

  function syncWithFirestore() {
    if (!getDb()) return;
    try {
      const settingsRef = doc(getDb(), "site_settings", "headers");
      onSnapshot(settingsRef, (docSnap) => {
        if (docSnap.exists()) {
          const remote = docSnap.data();
          currentHeaderConfig = {
            home: { ...DEFAULT_HEADER_CONFIG.home, ...(remote.home || {}) },
            repertorio: { ...DEFAULT_HEADER_CONFIG.repertorio, ...(remote.repertorio || {}) },
            indice: { ...DEFAULT_HEADER_CONFIG.indice, ...(remote.indice || {}) }
          };
          localStorage.setItem("voxdei_headers_config", JSON.stringify(currentHeaderConfig));
          applyHeaderConfigToDOM();
          updateWizardStage();
        }
      }, (err) => {
        console.warn("Sincronización remota de portadas:", err);
      });
    } catch (e) {
      console.warn("Aviso Firestore headers:", e);
    }
  }

  async function compressImageFile(file, maxWidth = 1600, maxHeight = 600, quality = 0.82) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Subir nueva foto
  async function handleCoverUpload(file, sectionKey) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Por favor selecciona un archivo de imagen válido", "error");
      return;
    }

    try {
      showToast("Optimizando y aplicando portada...", "info");
      const compressedDataUrl = await compressImageFile(file, 1600, 600, 0.84);

      currentHeaderConfig[sectionKey] = {
        ...(currentHeaderConfig[sectionKey] || {}),
        coverUrl: compressedDataUrl,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem("voxdei_headers_config", JSON.stringify(currentHeaderConfig));
      applyHeaderConfigToDOM();
      updateWizardStage();

      if (getDb()) {
        try {
          const settingsRef = doc(getDb(), "site_settings", "headers");
          await setDoc(settingsRef, {
            [sectionKey]: {
              coverUrl: compressedDataUrl,
              coverPosition: currentHeaderConfig[sectionKey]?.coverPosition || "center 50%",
              quote: currentHeaderConfig[sectionKey]?.quote || "",
              updatedAt: new Date().toISOString(),
              updatedBy: AuthEngine.getCurrentUser()?.email || "director"
            }
          }, { merge: true });
        } catch (dbErr) {
          console.warn("Firestore save cover warning:", dbErr);
        }
      }

      showToast("¡Foto de portada actualizada exitosamente!", "success");
    } catch (err) {
      console.error("Error al procesar foto:", err);
      showToast("No se pudo procesar la imagen seleccionada", "error");
    }
  }

  // Restablecer foto original
  async function handleResetCover(sectionKey) {
    const meta = SECTION_METADATA[sectionKey] || SECTION_METADATA.home;
    const defaultUrl = meta.defaultCover;
    currentHeaderConfig[sectionKey] = {
      ...(currentHeaderConfig[sectionKey] || {}),
      coverUrl: defaultUrl,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem("voxdei_headers_config", JSON.stringify(currentHeaderConfig));
    applyHeaderConfigToDOM();
    updateWizardStage();

    if (getDb()) {
      try {
        const settingsRef = doc(getDb(), "site_settings", "headers");
        await setDoc(settingsRef, {
          [sectionKey]: {
            coverUrl: defaultUrl,
            updatedAt: new Date().toISOString(),
            updatedBy: AuthEngine.getCurrentUser()?.email || "director"
          }
        }, { merge: true });
      } catch (e) {}
    }

    showToast("Portada restablecida a la original", "info");
  }

  // Actualizar la vista del modal limpio según sección seleccionada
  function updateCoverCustomizerUI() {
    const meta = SECTION_METADATA[currentCustomizerSection] || SECTION_METADATA.home;
    const currentSecData = currentHeaderConfig[currentCustomizerSection] || {};

    // 1. Título y subtítulo contextuales y limpios (sin selector de otras páginas)
    const titleEl = document.getElementById("headerCustomizerTitle");
    const subEl = document.getElementById("coverModalSubtitle");
    if (titleEl) {
      if (currentCustomizerSection === "home") {
        titleEl.textContent = "Editar Portada de Inicio";
        if (subEl) subEl.textContent = "Ajusta la foto y el lema litúrgico de la pantalla principal";
      } else if (currentCustomizerSection === "repertorio") {
        titleEl.textContent = "Editar Portada de Repertorio";
        if (subEl) subEl.textContent = "Ajusta la foto y el lema litúrgico de Repertorio";
      } else if (currentCustomizerSection === "indice") {
        titleEl.textContent = "Editar Portada del Directorio";
        if (subEl) subEl.textContent = "Ajusta la foto del Directorio General de cantos";
      } else {
        titleEl.textContent = "Personalizar Portada";
        if (subEl) subEl.textContent = "Ajusta la foto y el lema litúrgico en tiempo real";
      }
    }

    // 2. Previsualización de la imagen
    const previewImg = document.getElementById("customizerCoverPreviewImg");
    if (previewImg) {
      previewImg.src = currentSecData.coverUrl || meta.defaultCover;
      const pos = currentSecData.coverPosition || "center 50%";
      previewImg.style.objectPosition = pos;

      const slider = document.getElementById("coverPositionSlider");
      const label = document.getElementById("framingPercentLabel");
      const match = pos.match(/(\d+)%/);
      const val = match ? parseInt(match[1], 10) : 50;
      if (slider) slider.value = val;
      if (label) {
        if (val < 35) label.textContent = "Arriba (" + val + "%)";
        else if (val > 65) label.textContent = "Abajo (" + val + "%)";
        else label.textContent = "Centro (" + val + "%)";
      }
    }

    // 3. Aplicar modo de previsualización (PC o Móvil) con proporción matemática real
    setPreviewMode(currentPreviewMode);

    // 4. Título y Subtítulo de la réplica exacta
    const repTitle = document.getElementById("replicaHeroTitle");
    if (repTitle) repTitle.innerHTML = meta.title + ' <span class="highlight-red">' + meta.titleHighlight + '</span>';
    const repSub = document.getElementById("replicaHeroSubtitle");
    if (repSub) repSub.textContent = meta.subtitle;

    // 5. Frase réplica con soporte estricto de 2 líneas (<br>)
    const rawQuote = currentSecData.quote || meta.defaultQuote;
    const repQuote = document.getElementById("replicaHeroQuote");
    if (repQuote) {
      const formattedQuote = formatMaxTwoLines(rawQuote);
      repQuote.innerHTML = formattedQuote || "“Escribe una frase...”";
    }

    // 6. Textarea de Frase (conserva saltos de línea \n tal cual)
    const txtQuote = document.getElementById("inputWizardCurrentQuote");
    if (txtQuote && document.activeElement !== txtQuote) {
      txtQuote.value = rawQuote;
    }

    if (window.lucide) window.lucide.createIcons();
  }
  const updateWizardStage = updateCoverCustomizerUI;

  // Conmutador dinámico de simulación PC / Móvil con proporciones matemáticas fijas y estables
  function setPreviewMode(mode) {
    currentPreviewMode = mode;
    const viewport = document.getElementById("coverPreviewViewport");
    const previewHero = document.getElementById("coverPreviewHero");
    const btnPC = document.getElementById("btnPreviewModePC");
    const btnMobile = document.getElementById("btnPreviewModeMobile");

    if (btnPC) btnPC.classList.toggle("active", mode === "pc");
    if (btnMobile) btnMobile.classList.toggle("active", mode === "mobile");

    if (viewport) {
      viewport.classList.remove("mode-pc", "mode-mobile");
      viewport.classList.add(mode === "pc" ? "mode-pc" : "mode-mobile");
    }

    if (previewHero) {
      // Proporción matemática estable:
      // - Modo PC: Panorámico 4.85 / 1
      // - Modo Celular: Compacto 2.38 / 1
      // Nunca medimos el elemento del DOM en vivo porque en celulares el banner de fondo
      // tiene medidas de teléfono, lo que deformaba la simulación al volver a PC.
      previewHero.style.aspectRatio = (mode === "pc") ? "4.85 / 1" : "2.38 / 1";
    }
  }

  // Abrir Modal directo y sin pasos complicados
  function openCoverCustomizerModal(sectionKey = "home") {
    currentCustomizerSection = sectionKey;
    const modal = document.getElementById("modalHeaderCustomizer");
    if (!modal) {
      console.warn("modalHeaderCustomizer no encontrado en el DOM");
      return;
    }

    // Predeterminar modo de vista según la pantalla del usuario (móvil vs PC)
    currentPreviewMode = (window.innerWidth <= 768) ? "mobile" : "pc";

    try {
      updateCoverCustomizerUI();
    } catch (err) {
      console.error("Error al actualizar UI de portada:", err);
    }

    modal.style.display = "flex";
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeCoverCustomizerModal() {
    const modal = document.getElementById("modalHeaderCustomizer");
    if (modal) {
      modal.classList.remove("active");
      modal.style.display = "none";
      document.body.style.overflow = "";
    }
  }

  // Guardar cambios finales
  async function saveCoverCustomizerChanges() {
    const inputQuote = document.getElementById("inputWizardCurrentQuote");
    const newQuote = inputQuote?.value?.trim() || "";
    const meta = SECTION_METADATA[currentCustomizerSection] || SECTION_METADATA.home;
    const finalQuote = newQuote || meta.defaultQuote;
    const pos = currentHeaderConfig[currentCustomizerSection]?.coverPosition || "center 50%";

    currentHeaderConfig[currentCustomizerSection] = {
      ...(currentHeaderConfig[currentCustomizerSection] || {}),
      quote: finalQuote,
      coverPosition: pos,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem("voxdei_headers_config", JSON.stringify(currentHeaderConfig));
    applyHeaderConfigToDOM();

    if (getDb()) {
      try {
        const settingsRef = doc(getDb(), "site_settings", "headers");
        await setDoc(settingsRef, {
          [currentCustomizerSection]: {
            coverUrl: currentHeaderConfig[currentCustomizerSection]?.coverUrl || meta.defaultCover,
            coverPosition: pos,
            quote: finalQuote,
            updatedAt: new Date().toISOString(),
            updatedBy: AuthEngine.getCurrentUser()?.email || "director"
          }
        }, { merge: true });
      } catch (err) {
        console.warn("Firestore save headers warning:", err);
      }
    }

    showToast("¡Portada y frase de " + meta.name + " guardadas con éxito!", "success");
    closeCoverCustomizerModal();
  }

  // Vincular eventos del motor
  function bindHeaderCustomizerEvents() {
    // 1. Cerrar y cancelar
    document.getElementById("btnCloseHeaderCustomizer")?.addEventListener("click", closeCoverCustomizerModal);
    document.getElementById("btnCancelHeaderCustomizer")?.addEventListener("click", closeCoverCustomizerModal);
    document.getElementById("btnSaveHeaderCustomizer")?.addEventListener("click", saveCoverCustomizerChanges);

    document.getElementById("modalHeaderCustomizer")?.addEventListener("click", (e) => {
      if (e.target.id === "modalHeaderCustomizer") closeCoverCustomizerModal();
    });

    // 2. Simulación PC vs Celular
    document.getElementById("btnPreviewModePC")?.addEventListener("click", () => setPreviewMode("pc"));
    document.getElementById("btnPreviewModeMobile")?.addEventListener("click", () => setPreviewMode("mobile"));

    // 3. Deslizador de encuadre vertical
    const slider = document.getElementById("coverPositionSlider");
    slider?.addEventListener("input", (e) => {
      const val = e.target.value;
      const pos = "center " + val + "%";
      const previewImg = document.getElementById("customizerCoverPreviewImg");
      if (previewImg) previewImg.style.objectPosition = pos;

      const activeHeroImg = currentCustomizerSection === "home" 
        ? document.getElementById("homeHeroImg")
        : (currentCustomizerSection === "repertorio" 
           ? document.getElementById("repertorioHeroImg") 
           : document.getElementById("indiceHeroImg"));
      if (activeHeroImg) activeHeroImg.style.objectPosition = pos;

      const label = document.getElementById("framingPercentLabel");
      if (label) {
        if (val < 35) label.textContent = "Arriba (" + val + "%)";
        else if (val > 65) label.textContent = "Abajo (" + val + "%)";
        else label.textContent = "Centro (" + val + "%)";
      }

      currentHeaderConfig[currentCustomizerSection] = {
        ...(currentHeaderConfig[currentCustomizerSection] || {}),
        coverPosition: pos
      };
    });

    // 4. Subir foto desde dispositivo
    const fileInput = document.getElementById("inputHeaderCoverFile");
    const uploadBtn = document.getElementById("btnCustomizerUploadFile");
    uploadBtn?.addEventListener("click", () => {
      if (fileInput) {
        fileInput.value = "";
        fileInput.click();
      }
    });

    fileInput?.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (file) {
        handleCoverUpload(file, currentCustomizerSection);
      }
    });

    // 5. Restablecer portada original
    document.getElementById("btnCustomizerResetCover")?.addEventListener("click", () => {
      handleResetCover(currentCustomizerSection);
    });

    // 6. Input en vivo de la frase litúrgica (soporta saltos de línea con enter)
    const quoteTextarea = document.getElementById("inputWizardCurrentQuote");
    quoteTextarea?.addEventListener("input", (e) => {
      const val = e.target.value;
      const formatted = formatMaxTwoLines(val);
      const repQuote = document.getElementById("replicaHeroQuote");
      if (repQuote) {
        repQuote.innerHTML = formatted || "“Escribe una frase...”";
      }

      const activeHeroQuote = currentCustomizerSection === "home" 
        ? document.getElementById("homeHeroQuote")
        : (currentCustomizerSection === "repertorio" 
           ? document.getElementById("repertorioHeroQuote") 
           : document.getElementById("indiceHeroQuote"));
      if (activeHeroQuote) {
        activeHeroQuote.innerHTML = formatted || "";
      }
    });

    // 8. Botones directos en los banners hero de cada página
    document.getElementById("btnEditHomeCover")?.addEventListener("click", () => {
      openCoverCustomizerModal("home");
    });

    document.getElementById("btnEditRepCover")?.addEventListener("click", () => {
      openCoverCustomizerModal("repertorio");
    });

    document.getElementById("btnEditIndiceCover")?.addEventListener("click", () => {
      openCoverCustomizerModal("indice");
    });

    // 9. Botón en Perfil / Ajustes de Admin
    document.getElementById("btnProfileEditCovers")?.addEventListener("click", () => {
      openCoverCustomizerModal("home");
    });

    document.getElementById("btnAdminCustomHeaders")?.addEventListener("click", () => {
      openCoverCustomizerModal("home");
    });

    // Delegación global para que el clic funcione siempre, incluso si los botones se re-renderizan
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("#btnEditHomeCover, #btnEditRepCover, #btnEditIndiceCover, #btnProfileEditCovers, #btnAdminCustomHeaders, .btn-hero-cover-edit");
      if (!btn) return;
      e.preventDefault();
      if (btn.id === "btnEditHomeCover") openCoverCustomizerModal("home");
      else if (btn.id === "btnEditRepCover") openCoverCustomizerModal("repertorio");
      else if (btn.id === "btnEditIndiceCover") openCoverCustomizerModal("indice");
      else openCoverCustomizerModal("home");
    });

    // 10. Tecla Escape
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeCoverCustomizerModal();
      }
    });
  }

  // Inicialización
  loadLocalHeaderConfig();
  applyHeaderConfigToDOM();
  syncWithFirestore();
  bindHeaderCustomizerEvents();

  window.openCoverSelectorSheet = openCoverCustomizerModal;
  window.openCoverWizardModal = openCoverCustomizerModal;
  window.openCoverCustomizerModal = openCoverCustomizerModal;
})();


  // Sincronización automática de controles de administración al cambiar usuario
  function setupAdminAuthListeners() {
    if (window.AuthEngine && typeof window.AuthEngine.onAuthStateChanged === "function") {
      window.AuthEngine.onAuthStateChanged((user) => {
        if (typeof updateEditorModeUI === "function") {
          updateEditorModeUI(user);
        }
      });
    }
  }

  const runInitialAdminSync = () => {
    setupAdminAuthListeners();
    if (typeof updateEditorModeUI === "function") {
      updateEditorModeUI();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runInitialAdminSync);
  } else {
    runInitialAdminSync();
  }
})();
