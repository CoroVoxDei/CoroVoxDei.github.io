import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, updatePassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* ========================
   CONFIGURACIÓN DE FIREBASE
======================== */
// NOTA PARA EL DESARROLLADOR (VS CODE / GITHUB):
// Para conectar tu base de datos real en la nube:
// 1. Crea un proyecto gratuito en https://console.firebase.google.com/
// 2. Registra una aplicación web y copia el objeto de configuración 'firebaseConfig'.
// 3. Reemplaza el objeto de abajo con tus credenciales reales.
// 4. Activa "Authentication" (con método Correo/Contraseña) y "Firestore Database" en tu consola de Firebase.
const firebaseConfig = {
  apiKey: "AIzaSyCbPlWwHtl1m3mj34MIP2rNHQjXZPIqzVk",
  authDomain: "cancionero-vox-dei.firebaseapp.com",
  projectId: "cancionero-vox-dei",
  storageBucket: "cancionero-vox-dei.firebasestorage.app",
  messagingSenderId: "175902980655",
  appId: "1:175902980655:web:338fe5a7e7e85e53dee4da",
  measurementId: "G-XKXH8TX5V0"
};

let app, auth, db;
let isFirebaseReal = false;

// Intentar inicializar Firebase si el usuario ha ingresado sus credenciales reales
if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "TU_API_KEY") {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebaseReal = true;
    console.log("☁️ Firebase Cloud Database inicializado con éxito.");
  } catch (err) {
    console.error("❌ Error al inicializar Firebase. Activando Modo Simulado local:", err);
  }
} else {
  console.log("ℹ️ Usando Modo Simulado de Base de Datos. Inserta tus credenciales reales para conectar con la nube.");
}

/* ==========================================================================
   FUNCIÓN GLOBAL DE NOTIFICACIONES TOAST (ELEGANTE Y SIN POPUPS NATIVOS)
   ========================================================================== */
function showToast(message, type = "info", duration = 3800) {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast-item toast-${type}`;

  let iconName = "info";
  if (type === "success") iconName = "check-circle";
  if (type === "error") iconName = "alert-triangle";
  if (type === "warning") iconName = "alert-circle";

  toast.innerHTML = `
    <i data-lucide="${iconName}" class="toast-icon"></i>
    <span class="toast-message">${message.replace(/\n/g, '<br>')}</span>
    <button class="toast-close" aria-label="Cerrar">&times;</button>
  `;

  const closeBtn = toast.querySelector(".toast-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      toast.classList.add("toast-hiding");
      setTimeout(() => toast.remove(), 300);
    });
  }

  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  requestAnimationFrame(() => {
    toast.classList.add("toast-showing");
  });

  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add("toast-hiding");
      setTimeout(() => toast.remove(), 300);
    }
  }, duration);
}
window.showToast = showToast;

function showConfirmModal({
  title = "Confirmar acción",
  message = "¿Estás seguro de realizar esta acción?",
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  danger = true,
  icon = "help-circle"
} = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "custom-dialog-overlay";
    
    overlay.innerHTML = `
      <div class="custom-dialog-box">
        <div class="custom-dialog-header">
          <div class="custom-dialog-icon-badge ${danger ? 'danger' : 'info'}">
            <i data-lucide="${icon}"></i>
          </div>
          <h3 class="custom-dialog-title">${title}</h3>
        </div>
        <p class="custom-dialog-message">${message.replace(/\n/g, '<br>')}</p>
        <div class="custom-dialog-actions">
          <button type="button" class="custom-dialog-btn btn-cancel">${cancelText}</button>
          <button type="button" class="custom-dialog-btn ${danger ? 'btn-danger' : 'btn-primary'}">${confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    if (window.lucide) window.lucide.createIcons();

    requestAnimationFrame(() => {
      overlay.classList.add("showing");
    });

    const btnCancel = overlay.querySelector(".btn-cancel");
    const btnConfirm = overlay.querySelector(".btn-primary, .btn-danger");

    const cleanup = (result) => {
      overlay.classList.remove("showing");
      overlay.classList.add("hiding");
      setTimeout(() => {
        overlay.remove();
        resolve(result);
      }, 250);
    };

    btnCancel?.addEventListener("click", () => cleanup(false));
    btnConfirm?.addEventListener("click", () => cleanup(true));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) cleanup(false);
    });
  });
}
window.showConfirmModal = showConfirmModal;

function showPromptModal({
  title = "Ingresar dato",
  message = "Por favor ingresa la información solicitada:",
  defaultValue = "",
  placeholder = "",
  inputType = "text",
  confirmText = "Aceptar",
  cancelText = "Cancelar"
} = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "custom-dialog-overlay";
    
    overlay.innerHTML = `
      <div class="custom-dialog-box">
        <div class="custom-dialog-header">
          <div class="custom-dialog-icon-badge info">
            <i data-lucide="edit-3"></i>
          </div>
          <h3 class="custom-dialog-title">${title}</h3>
        </div>
        <p class="custom-dialog-message">${message.replace(/\n/g, '<br>')}</p>
        <div class="custom-dialog-input-group">
          <input type="${inputType}" class="custom-dialog-input" value="${defaultValue.replace(/"/g, '&quot;')}" placeholder="${placeholder.replace(/"/g, '&quot;')}" />
        </div>
        <div class="custom-dialog-actions">
          <button type="button" class="custom-dialog-btn btn-cancel">${cancelText}</button>
          <button type="button" class="custom-dialog-btn btn-primary">${confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    if (window.lucide) window.lucide.createIcons();

    const input = overlay.querySelector(".custom-dialog-input");
    requestAnimationFrame(() => {
      overlay.classList.add("showing");
      if (input) {
        input.focus();
        input.select();
      }
    });

    const btnCancel = overlay.querySelector(".btn-cancel");
    const btnConfirm = overlay.querySelector(".btn-primary");

    const cleanup = (result) => {
      overlay.classList.remove("showing");
      overlay.classList.add("hiding");
      setTimeout(() => {
        overlay.remove();
        resolve(result);
      }, 250);
    };

    btnCancel?.addEventListener("click", () => cleanup(null));
    btnConfirm?.addEventListener("click", () => {
      cleanup(input ? input.value : "");
    });
    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        cleanup(input.value);
      } else if (e.key === "Escape") {
        cleanup(null);
      }
    });
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) cleanup(null);
    });
  });
}
window.showPromptModal = showPromptModal;

// --- ENGINE DE AUTENTICACIÓN HÍBRIDO (FIREBASE + LOCALSTORAGE) ---
const AuthEngine = {
  currentUser: null,

  getCurrentUser: function() {
    if (AuthEngine.currentUser) return AuthEngine.currentUser;
    if (isFirebaseReal && auth?.currentUser) {
      AuthEngine.currentUser = auth.currentUser;
      return auth.currentUser;
    }
    const cached = localStorage.getItem("voxdei_last_logged_user") || localStorage.getItem("simulated_logged_user");
    if (cached) {
      try {
        const u = JSON.parse(cached);
        AuthEngine.currentUser = u;
        return u;
      } catch (e) {}
    }
    return null;
  },

  onAuthStateChanged: function(callback) {
    if (isFirebaseReal) {
      onAuthStateChanged(auth, (user) => {
        AuthEngine.currentUser = user;
        if (user) {
          localStorage.setItem("voxdei_last_logged_user", JSON.stringify({ uid: user.uid, email: user.email, displayName: user.displayName }));
        } else {
          localStorage.removeItem("voxdei_last_logged_user");
        }
        callback(user);
      });
    } else {
      const checkAuth = () => {
        const loggedUser = JSON.parse(localStorage.getItem("simulated_logged_user") || "null");
        AuthEngine.currentUser = loggedUser;
        callback(loggedUser);
      };
      checkAuth();
      window.addEventListener("simulatedAuthChanged", checkAuth);
    }
  },

  signInWithGoogle: async function() {
    if (isFirebaseReal) {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      try {
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: userCredential.user.email,
          createdAt: new Date().toISOString(),
          provider: "google"
        });
      } catch (e) {
        console.warn("No se pudo guardar la estadística en Firestore:", e);
      }
      return userCredential.user;
    } else {
      const emailInput = await showPromptModal({
        title: "Simulador de Google",
        message: "Introduce tu correo de Google para ingresar:",
        defaultValue: "musico.demo@gmail.com",
        placeholder: "ejemplo@gmail.com",
        confirmText: "Iniciar sesión"
      });
      if (!emailInput) {
        throw new Error("Inicio de sesión de Google cancelado.");
      }
      const simulatedGoogleUser = {
        uid: "sim_google_" + Math.random().toString(36).substr(2, 9),
        email: emailInput,
        displayName: "Músico Demo Google"
      };
      const users = JSON.parse(localStorage.getItem("simulated_users") || "[]");
      if (!users.some(u => u.email === simulatedGoogleUser.email)) {
        users.push({ ...simulatedGoogleUser, createdAt: new Date().toISOString() });
        localStorage.setItem("simulated_users", JSON.stringify(users));
      }
      localStorage.setItem("simulated_logged_user", JSON.stringify(simulatedGoogleUser));
      window.dispatchEvent(new Event("simulatedAuthChanged"));
      return simulatedGoogleUser;
    }
  },


  
  signUp: async function(email, password) {
    if (isFirebaseReal) {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      try {
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: email,
          createdAt: new Date().toISOString()
        });
      } catch (e) {
        console.warn("No se pudo guardar la estadística en Firestore:", e);
      }
      return userCredential.user;
    } else {
      const users = JSON.parse(localStorage.getItem("simulated_users") || "[]");
      if (users.some(u => u.email === email)) {
        throw new Error("Este correo electrónico ya está registrado.");
      }
      const newUser = { uid: "sim_" + Math.random().toString(36).substr(2, 9), email: email };
      users.push({ ...newUser, password: password, createdAt: new Date().toISOString() });
      localStorage.setItem("simulated_users", JSON.stringify(users));
      localStorage.setItem("simulated_logged_user", JSON.stringify(newUser));
      window.dispatchEvent(new Event("simulatedAuthChanged"));
      return newUser;
    }
  },

  signIn: async function(email, password) {
    if (isFirebaseReal) {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } else {
      const users = JSON.parse(localStorage.getItem("simulated_users") || "[]");
      const matched = users.find(u => u.email === email && u.password === password);
      if (!matched) {
        throw new Error("El correo electrónico o la contraseña son incorrectos.");
      }
      const user = { uid: matched.uid, email: matched.email };
      localStorage.setItem("simulated_logged_user", JSON.stringify(user));
      window.dispatchEvent(new Event("simulatedAuthChanged"));
      return user;
    }
  },

  signOut: async function() {
    if (isFirebaseReal) {
      await signOut(auth);
    } else {
      localStorage.removeItem("simulated_logged_user");
      window.dispatchEvent(new Event("simulatedAuthChanged"));
    }
  },

  resetPassword: async function(email) {
    if (!email) {
      throw new Error("Por favor, ingresa tu correo electrónico.");
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      throw new Error("Por favor, ingresa una dirección de correo válida.");
    }

    if (isFirebaseReal) {
      await sendPasswordResetEmail(auth, email);
    } else {
      const users = JSON.parse(localStorage.getItem("simulated_users") || "[]");
      const exists = users.some(u => u.email === email);
      if (!exists && email !== "musico.demo@gmail.com") {
        throw new Error("No existe ninguna cuenta registrada con este correo electrónico.");
      }
    }
    return true;
  },

  changeUserPassword: async function(newPassword) {
    if (!newPassword || newPassword.trim().length < 6) {
      throw new Error("La nueva contraseña debe tener al menos 6 caracteres.");
    }
    const user = AuthEngine.getCurrentUser();
    if (!user) throw new Error("No hay una sesión activa de usuario.");

    if (isFirebaseReal && auth?.currentUser) {
      try {
        await updatePassword(auth.currentUser, newPassword.trim());
      } catch (err) {
        if (err.code === "auth/requires-recent-login") {
          await sendPasswordResetEmail(auth, user.email);
          throw new Error("Por seguridad, se envió un enlace a tu correo para restablecer la contraseña.");
        } else {
          throw err;
        }
      }
    } else {
      const users = JSON.parse(localStorage.getItem("simulated_users") || "[]");
      const userIndex = users.findIndex(u => u.email === user.email || u.uid === user.uid);
      if (userIndex !== -1) {
        users[userIndex].password = newPassword.trim();
        localStorage.setItem("simulated_users", JSON.stringify(users));
      } else {
        users.push({ uid: user.uid || "sim_" + Date.now(), email: user.email || "demo@gmail.com", password: newPassword.trim(), createdAt: new Date().toISOString() });
        localStorage.setItem("simulated_users", JSON.stringify(users));
      }
    }
    return true;
  },

  getRegisteredUsersCount: async function() {
    if (isFirebaseReal) {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        return querySnapshot.size;
      } catch (e) {
        console.error("Error al leer estadísticas de Firestore:", e);
        return 1;
      }
    } else {
      const users = JSON.parse(localStorage.getItem("simulated_users") || "[]");
      // Retorna una estimación bonita simulada para demo si no hay usuarios registrados
      return Math.max(1, users.length + 3);
    }
  }
};

// --- ENGINE DE SINCRONIZACIÓN DE REPERTORIOS (FIREBASE + LOCALSTORAGE) ---
const SyncEngine = {
  saveRepertorios: async function(user, repertorios) {
    if (!user) return;
    if (isFirebaseReal) {
      try {
        await setDoc(doc(db, "repertorios", user.uid), {
          repertorios: repertorios,
          updatedAt: new Date().toISOString()
        });
      } catch (e) {
        console.error("Error al guardar repertorios en la nube de Firebase:", e);
      }
    } else {
      localStorage.setItem(`simulated_cloud_repertorios_${user.uid}`, JSON.stringify(repertorios));
    }
  },

  loadRepertorios: async function(user) {
    if (!user) return null;
    if (isFirebaseReal) {
      try {
        const docSnap = await getDoc(doc(db, "repertorios", user.uid));
        if (docSnap.exists()) {
          return docSnap.data().repertorios;
        }
      } catch (e) {
        console.error("Error al cargar repertorios de la nube de Firebase:", e);
      }
      return null;
    } else {
      const data = localStorage.getItem(`simulated_cloud_repertorios_${user.uid}`);
      return data ? JSON.parse(data) : null;
    }
  }
};

window.getCurrentUser = () => {
  if (isFirebaseReal) {
    return auth?.currentUser || null;
  } else {
    return JSON.parse(localStorage.getItem("simulated_logged_user") || "null");
  }
};

window.saveLocalAndCloudRepertorios = async function(repertoriosArray) {
  localStorage.setItem("saved_repertorios", JSON.stringify(repertoriosArray));
  const currentUser = window.getCurrentUser();
  if (currentUser) {
    await SyncEngine.saveRepertorios(currentUser, repertoriosArray);
  }
};

window.syncLocalAndCloudOnLogin = async function(user) {
  const cloudReps = await SyncEngine.loadRepertorios(user);
  const localReps = JSON.parse(localStorage.getItem("saved_repertorios")) || [];
  
  if (!cloudReps || cloudReps.length === 0) {
    if (localReps.length > 0) {
      await SyncEngine.saveRepertorios(user, localReps);
    }
    return;
  }
  
  // Unir listas locales y en la nube
  const merged = [...cloudReps];
  localReps.forEach(localRep => {
    if (!merged.some(cloudRep => cloudRep.id === localRep.id)) {
      merged.push(localRep);
    }
  });
  
  localStorage.setItem("saved_repertorios", JSON.stringify(merged));
  await SyncEngine.saveRepertorios(user, merged);
  
  if (typeof window.renderizarRepertoriosGuardados === "function") {
    window.renderizarRepertoriosGuardados();
  }
};

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
  const viewHome = document.getElementById("view-home");
  const viewRepertorio = document.getElementById("view-repertorio");
  const viewProfile = document.getElementById("view-profile");
  const navInicio = document.getElementById("nav-inicio");
  const navRepertorio = document.getElementById("nav-repertorio");
  const navAuth = document.getElementById("nav-auth");

  const alreadyInHome = (view === "home" && viewHome?.style.display !== "none");
  const alreadyInRepertorio = (view === "repertorio" && viewRepertorio?.style.display !== "none");
  const alreadyInProfile = (view === "profile" && viewProfile?.style.display !== "none");

  if (view === "home") {
    if (viewHome) viewHome.style.display = "block";
    if (viewRepertorio) viewRepertorio.style.display = "none";
    if (viewProfile) viewProfile.style.display = "none";
    navInicio?.classList.add("active");
    navRepertorio?.classList.remove("active");
    navAuth?.classList.remove("active");
  } else if (view === "repertorio") {
    if (viewHome) viewHome.style.display = "none";
    if (viewRepertorio) viewRepertorio.style.display = "block";
    if (viewProfile) viewProfile.style.display = "none";
    navInicio?.classList.remove("active");
    navRepertorio?.classList.add("active");
    navAuth?.classList.remove("active");
    renderizarRepertorio(JSON.parse(localStorage.getItem("repertorio")) || []);
    if (window.renderizarRepertoriosGuardados) {
      window.renderizarRepertoriosGuardados();
    }
  } else if (view === "profile") {
    if (viewHome) viewHome.style.display = "none";
    if (viewRepertorio) viewRepertorio.style.display = "none";
    if (viewProfile) viewProfile.style.display = "block";
    navInicio?.classList.remove("active");
    navRepertorio?.classList.remove("active");
    navAuth?.classList.add("active");

    const user = AuthEngine.getCurrentUser();
    if (user && typeof renderUserProfile === "function") {
      renderUserProfile(user);
    } else if (typeof showLoggedOutUI === "function") {
      showLoggedOutUI();
    }
    if (typeof updateCommunityStats === "function") {
      updateCommunityStats();
    }
    if (window.lucide) window.lucide.createIcons();
  }
  closeSidebar();
  
  if (!alreadyInHome && !alreadyInRepertorio && !alreadyInProfile) {
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
function centerCategoryButton(button) {
  if (!button) return;
  const container = document.getElementById("catScroll");
  if (!container) return;
  const containerWidth = container.clientWidth;
  const buttonLeft = button.offsetLeft;
  const buttonWidth = button.offsetWidth;
  const targetScrollLeft = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
  container.scrollTo({
    left: Math.max(0, targetScrollLeft),
    behavior: "smooth"
  });
}
window.centerCategoryButton = centerCategoryButton;

const categoryButtons = document.querySelectorAll(".category-btn");
categoryButtons.forEach(button => {
  button.addEventListener("click", () => {
    categoryButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    centerCategoryButton(button);
    const selectedCategory = button.dataset.category?.toLowerCase();
    if (viewHome && viewHome.style.display === "none") switchView("home");
    filterByCategory(selectedCategory);
  });
});

/* ========================
   DESLIZAMIENTO ENTRE CATEGORÍAS (SWIPE TÁCTIL)
======================== */
(function setupCategorySwipe() {
  const songsContainer = document.getElementById("songsContainer") || document.getElementById("viewHome");
  if (!songsContainer) return;

  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  let isIgnored = false;

  songsContainer.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      if (e.target.closest("input, textarea, select, audio, .audio-player, .volume-slider, .seekbar, button")) {
        isIgnored = true;
        return;
      }
      isIgnored = false;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchEndX = touchStartX;
      touchEndY = touchStartY;
    }
  }, { passive: true });

  songsContainer.addEventListener("touchmove", (e) => {
    if (!isIgnored && e.touches.length === 1) {
      touchEndX = e.touches[0].clientX;
      touchEndY = e.touches[0].clientY;
    }
  }, { passive: true });

  songsContainer.addEventListener("touchend", () => {
    if (isIgnored) return;
    const viewHome = document.getElementById("viewHome");
    if (viewHome && viewHome.style.display === "none") return;
    if (document.querySelector(".modal.active, .popup.active")) return;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      const activeBtn = document.querySelector(".category-btn.active");
      if (!activeBtn) return;

      const currentCategory = activeBtn.dataset.category?.toLowerCase();
      if (currentCategory === "todos") return;

      const categoryButtonsList = Array.from(document.querySelectorAll(".category-btn"));
      const currentIndex = categoryButtonsList.indexOf(activeBtn);

      if (currentIndex === -1) return;

      if (deltaX < 0) {
        // Deslizar a la izquierda -> Siguiente categoría
        if (currentIndex + 1 < categoryButtonsList.length) {
          const nextBtn = categoryButtonsList[currentIndex + 1];
          nextBtn.click();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } else {
        // Deslizar a la derecha -> Categoría anterior
        if (currentIndex - 1 >= 0) {
          const prevBtn = categoryButtonsList[currentIndex - 1];
          const prevCategory = prevBtn.dataset.category?.toLowerCase();
          if (prevCategory !== "todos") {
            prevBtn.click();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }
      }
    }
  });
})();

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
        textoElem.style.setProperty("font-size", window.tamañoFuente + "px", "important");
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
      const resolvedSong = window.resolveSong(song) || song;
      const section = document.createElement("section");
      section.classList.add("song");
      section.dataset.index = index;
      if (resolvedSong.audio) section.dataset.audio = resolvedSong.audio;
      if (resolvedSong.tags) section.dataset.tags = resolvedSong.tags;
      if (resolvedSong.category) section.dataset.category = resolvedSong.category;
      if (resolvedSong.type) section.dataset.type = resolvedSong.type;

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
                  <span class="song-title-text">${resolvedSong.title}</span>
                  ${resolvedSong.author ? `<span class="autor">(${window.cleanAuthor(resolvedSong.author)})</span>` : ''}
                </h2>
            </div>
          </div>
          <div class="song-btns" onclick="event.stopPropagation();">
            <button class="remove-button" onclick="borrarCancion('${resolvedSong.title.replace(/'/g, "\\'")}', '${(resolvedSong.author || "").replace(/'/g, "\\'")}')">
              <span class="icon"><i data-lucide="x"></i></span>
              <span class="text">Quitar</span>
            </button>
          </div>
        </div>
        <div class="lyrics-hidden" style="display:none;">${resolvedSong.lyrics}</div>
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

window.borrarCancion = async function(title, author = "") {
  const ok = await showConfirmModal({
    title: "Eliminar canción",
    message: `¿Deseas eliminar "${title}" del repertorio?`,
    confirmText: "Eliminar",
    cancelText: "Cancelar",
    danger: true,
    icon: "trash-2"
  });
  if (!ok) return;
  let rep = JSON.parse(localStorage.getItem("repertorio")) || [];
  rep = rep.filter(s => !(s.title === title && (s.author || "").trim() === author.trim()));
  localStorage.setItem("repertorio", JSON.stringify(rep));
  renderizarRepertorio(rep);
  initSongButtons();
  showToast(`"${title}" eliminada del repertorio`, "info");
};

document.getElementById("btnLimpiarRepertorio")?.addEventListener("click", async () => {
    let rep = JSON.parse(localStorage.getItem("repertorio")) || [];
    if (rep.length === 0) return;
    const ok = await showConfirmModal({
      title: "Vaciar repertorio",
      message: "¿Estás seguro de que deseas eliminar TODAS las canciones de tu repertorio activo?",
      confirmText: "Vaciar todo",
      cancelText: "Cancelar",
      danger: true,
      icon: "alert-triangle"
    });
    if (ok) {
        localStorage.removeItem("repertorio");
        renderizarRepertorio([]);
        initSongButtons();
        showToast("Repertorio vaciado con éxito", "info");
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
  // Intentar usar primero la lista cargada de canciones en la variable global o en window
  let source = (typeof allSongs !== "undefined" && allSongs && allSongs.length > 0) ? allSongs : window.allSongs;
  if (!source || source.length === 0) {
    source = Array.from(document.querySelectorAll(".song"));
    // Evitar guardar un array vacío en window.allSongs de forma permanente si aún no se han cargado las canciones
    if (source.length > 0) {
      window.allSongs = source;
    }
  }
  return source.map(songSection => {
    const info = window.getSongInfo(songSection);
    const lyrics = songSection.querySelector(".lyrics-hidden, .lyrics, .lyrics1")?.innerHTML.trim() || "";
    const type = songSection.dataset.type || "";
    const audio = songSection.dataset.audio || "";
    const tags = songSection.dataset.tags || window.getSongTag(songSection) || "";
    const category = songSection.dataset.category || "";
    return { id: info.id, title: info.title, author: info.author, lyrics, type, audio, tags, category };
  }).filter(s => s.title);
}

window.resolveSong = function(storedSong) {
  if (!storedSong) return null;
  const globalList = getGlobalSongsList();
  if (!globalList || globalList.length === 0) {
    return storedSong;
  }

  const sTitle = (storedSong.title || "").toLowerCase().trim();
  const sAuthor = (storedSong.author || "").toLowerCase().trim();

  // 1. Coincidencia exacta por título y autor (la prioridad absoluta y más segura de todas)
  if (sTitle) {
    const match = globalList.find(s => 
      s.title.toLowerCase().trim() === sTitle &&
      (s.author || "").toLowerCase().trim() === sAuthor
    );
    if (match) return match;
  }

  // 2. Coincidencia por ID estable (para cuando cambien sutilmente los títulos)
  if (storedSong.id) {
    // Evitar usar IDs genéricos/viejos que causan colisiones en repertorios previos
    const rawId = storedSong.id.toLowerCase().trim();
    const isGenericId = ["letra", "letra marianos", "letra mariano", "letra adoracion", "letra el profeta", "letra tantum ergo"].some(gen => rawId.includes(gen));
    if (!isGenericId) {
      const idMatch = globalList.find(s => s.id === storedSong.id);
      if (idMatch) return idMatch;
    }
  }

  // 3. Fallback por título solamente
  if (sTitle) {
    const titleMatch = globalList.find(s => 
      s.title.toLowerCase().trim() === sTitle
    );
    if (titleMatch) return titleMatch;
  }

  return storedSong;
};

window.eliminarCantoDeRepertorioGuardado = async function(repertorioId, songIndex) {
  const saved = JSON.parse(localStorage.getItem("saved_repertorios")) || [];
  const target = saved.find(r => r.id === repertorioId);
  if (!target) return;

  const songName = target.songs[songIndex]?.title || "este canto";
  const ok = await showConfirmModal({
    title: "Quitar canto",
    message: `¿Estás seguro de que deseas quitar "${songName}" de este repertorio?`,
    confirmText: "Quitar",
    cancelText: "Cancelar",
    danger: true,
    icon: "trash-2"
  });
  if (ok) {
    target.songs.splice(songIndex, 1);
    window.saveLocalAndCloudRepertorios(saved);
    window.renderizarRepertoriosGuardados(); // Actualiza contadores en la lista principal
    window.renderVerRepertorioDetalle();    // Re-renderiza detalle
    showToast(`"${songName}" quitada del repertorio`, "info");
  }
};

window.agregarCantoARepertorioGuardado = function(songData) {
  const id = window.currentSavedRepertorioId;
  const saved = JSON.parse(localStorage.getItem("saved_repertorios")) || [];
  const target = saved.find(r => r.id === id);
  if (!target) return;

  // Comprobar existencia con máxima precisión (ID estable si está disponible, o título + autor como fallback)
  const existe = target.songs.some(s => 
    (s.id && songData.id && s.id === songData.id) || 
    (!s.id && !songData.id && s.title === songData.title && (s.author || "").trim() === (songData.author || "").trim())
  );
  if (existe) {
    showToast(`"${songData.title}" ya está en este repertorio.`, "warning");
    return;
  }

  target.songs.push(songData);
  window.saveLocalAndCloudRepertorios(saved);
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
    title.onclick = async (e) => {
      e.preventDefault();
      const nuevoNombre = await showPromptModal({
        title: "Renombrar repertorio",
        message: "Ingresa el nuevo nombre para este repertorio:",
        defaultValue: target.name,
        placeholder: "Nombre del repertorio",
        confirmText: "Guardar"
      });
      if (nuevoNombre && nuevoNombre.trim()) {
        target.name = nuevoNombre.trim();
        window.saveLocalAndCloudRepertorios(saved);
        window.renderizarRepertoriosGuardados(); // Actualiza contadores en la lista principal
        window.renderVerRepertorioDetalle();    // Re-renderiza detalle
        showToast("Repertorio renombrado a: " + target.name, "success");
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
      const resolvedSong = window.resolveSong(song) || song;
      const li = document.createElement("li");
      li.className = "saved-rep-song-item";
      li.dataset.title = resolvedSong.title;
      li.dataset.author = resolvedSong.author || "";
      li.dataset.idx = idx; // Guardar el índice real para ordenar sin riesgo de homónimos

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
        const latestSong = window.resolveSong(song) || song;
        window.abrirLetra(latestSong.title, latestSong.lyrics, latestSong.author, latestSong.type, latestSong.audio, latestSong.tags, target.songs, idx);
      };

      // Limpiar doble paréntesis en el autor si existieran
      const cleanAuthor = window.cleanAuthor(resolvedSong.author);
      const displayedAuthor = cleanAuthor ? `(${cleanAuthor})` : "";

      infoA.innerHTML = `
        <span class="saved-rep-song-number">${idx + 1}</span>
        <div class="saved-rep-song-text-container">
          <span class="saved-rep-song-title" title="${resolvedSong.title}">${resolvedSong.title}</span>
          ${displayedAuthor ? `<span class="saved-rep-song-author" title="${resolvedSong.author}">${displayedAuthor}</span>` : ""}
        </div>
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
            // Mapear por el índice de origen original exacto (libre de fallos por cantos homónimos)
            const newSongs = items.map(item => {
              const oldIdx = parseInt(item.dataset.idx, 10);
              return target.songs[oldIdx];
            }).filter(Boolean);

            target.songs = newSongs;
            window.saveLocalAndCloudRepertorios(saved);
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

window.mostrarModalCompartir = function(nombreRepertorio, shareUrl) {
  const modal = document.getElementById("shareModal");
  if (!modal) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast(`¡Enlace del repertorio "${nombreRepertorio}" copiado!\nEnvía este link por WhatsApp o redes sociales.`, "success");
      }).catch(() => {
        showPromptModal({
          title: "Copiar enlace",
          message: "Copia este enlace para compartir:",
          defaultValue: shareUrl,
          confirmText: "Cerrar"
        });
      });
    } else {
      showPromptModal({
        title: "Copiar enlace",
        message: "Copia este enlace para compartir:",
        defaultValue: shareUrl,
        confirmText: "Cerrar"
      });
    }
    return;
  }

  // Título dinámico
  const titleEl = document.getElementById("shareModalTitle");
  if (titleEl) titleEl.textContent = `Compartir "${nombreRepertorio}"`;

  // Asignar valor al input
  const inputEl = document.getElementById("shareUrlInput");
  if (inputEl) inputEl.value = shareUrl;

  // Codificar el texto de compartir para redes sociales
  const shareText = `Te comparto mi repertorio de cantos "${nombreRepertorio}" de la App Vox Dei. Abre este enlace para importarlo directamente en tu dispositivo: ${shareUrl}`;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(shareUrl);

  // Configurar enlaces de redes sociales
  const whatsappEl = document.getElementById("shareWhatsApp");
  if (whatsappEl) whatsappEl.href = `https://api.whatsapp.com/send?text=${encodedText}`;

  const facebookEl = document.getElementById("shareFacebook");
  if (facebookEl) facebookEl.href = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

  const telegramEl = document.getElementById("shareTelegram");
  if (telegramEl) telegramEl.href = `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(`Repertorio: ${nombreRepertorio}`)}`;

  const emailEl = document.getElementById("shareEmail");
  if (emailEl) emailEl.href = `mailto:?subject=${encodeURIComponent(`Repertorio de cantos: ${nombreRepertorio}`)}&body=${encodedText}`;

  // Configurar botón de compartir nativo del sistema (Web Share API)
  const nativeBtn = document.getElementById("btnNativeShare");
  const nativeWrapper = document.getElementById("nativeShareWrapper");
  if (nativeBtn) {
    if (navigator.share) {
      if (nativeWrapper) nativeWrapper.style.display = "block";
      nativeBtn.style.display = "flex";
      nativeBtn.onclick = () => {
        navigator.share({
          title: `Repertorio: ${nombreRepertorio}`,
          text: `Te comparto mi repertorio de cantos "${nombreRepertorio}" de la App Vox Dei.`,
          url: shareUrl
        }).catch(err => {
          console.log("Error al compartir de forma nativa:", err);
        });
      };
    } else {
      if (nativeWrapper) nativeWrapper.style.display = "none";
      nativeBtn.style.display = "none";
    }
  }

  // Configurar botón de copiar
  const copyBtn = document.getElementById("btnCopyShareUrl");
  if (copyBtn) {
    copyBtn.onclick = () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(() => {
          const spanEl = copyBtn.querySelector("span");
          if (spanEl) {
            const originalText = spanEl.textContent;
            spanEl.textContent = "¡Copiado!";
            copyBtn.style.background = "#25D366";
            copyBtn.style.color = "#ffffff";
            
            setTimeout(() => {
              spanEl.textContent = originalText;
              copyBtn.style.background = "";
              copyBtn.style.color = "";
            }, 2000);
          } else {
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = "¡Copiado!";
            copyBtn.style.background = "#25D366";
            copyBtn.style.color = "#ffffff";
            setTimeout(() => {
              copyBtn.innerHTML = originalHTML;
              copyBtn.style.background = "";
              copyBtn.style.color = "";
            }, 2000);
          }
        }).catch(() => {
          showToast("Por favor selecciona el texto del enlace y cópialo manualmente.", "info");
        });
      } else {
        showToast("Por favor selecciona el texto del enlace y cópialo manualmente.", "info");
      }
    };
  }

  // Mostrar el modal
  modal.classList.add("active");

  // Configurar cierre del modal
  const closeBtn = document.getElementById("closeShareModal");
  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.classList.remove("active");
    };
  }

  // Cerrar al hacer clic fuera
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.classList.remove("active");
    }
  };

  if (window.lucide) window.lucide.createIcons();
};

window.compartirRepertorioId = function(id) {
  const saved = JSON.parse(localStorage.getItem("saved_repertorios")) || [];
  const target = saved.find(r => r.id === id);
  if (!target) return;
  
  if (target.songs.length === 0) {
    showToast("Este repertorio está vacío. Agrega canciones antes de compartirlo.", "warning");
    return;
  }
  
  // Nuevo formato v2 ultra-corto y preciso:
  const songIdentifiers = target.songs.map(s => {
    const resolved = window.resolveSong(s) || s;
    if (resolved.id) {
      return resolved.id;
    }
    // Fallback extremadamente raro
    return `fallback::${resolved.title || ""}::${resolved.author || ""}`;
  });
  
  // Formato: v2|NombreRepertorio|id1,id2,id3...
  const plainText = ["v2", target.name, songIdentifiers.join(',')].join('|');
  
  try {
    // Base64 robusto con soporte Unicode
    const base64 = btoa(encodeURIComponent(plainText).replace(/%([0-9A-F]{2})/g, function(match, p1) {
      return String.fromCharCode('0x' + p1);
    }));
    
    const shareUrl = `${window.location.origin}${window.location.pathname}#import=${base64}`;
    
    // Abrir el popup elegante de compartir
    window.mostrarModalCompartir(target.name, shareUrl);

  } catch (err) {
    console.error("Error al generar enlace de compartir:", err);
    showToast("No se pudo generar el enlace de compartir.", "error");
  }
};

window.importarRepertorioCompartido = function(base64) {
  try {
    const plainText = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    let name = "";
    let songIdentifiers = [];
    const isV2 = plainText.startsWith("v2|");
    
    if (isV2) {
      const parts = plainText.split('|');
      name = parts[1] || "";
      const idsString = parts[2] || "";
      songIdentifiers = idsString.split(',').filter(Boolean);
    } else {
      const parts = plainText.split('|');
      if (parts.length < 2) {
        throw new Error("Formato de importación inválido");
      }
      name = parts[0];
      songIdentifiers = parts.slice(1);
    }
    
    const globalSongs = getGlobalSongsList();
    // Crear la misma lista ordenada alfabéticamente estable, independiente del locale
    const sortedSongs = [...globalSongs].sort((a, b) => {
      const titleA = a.title.toLowerCase().trim();
      const titleB = b.title.toLowerCase().trim();
      if (titleA < titleB) return -1;
      if (titleA > titleB) return 1;
      return 0;
    });
    const resolvedSongs = [];
    const missingTitles = [];
    
    songIdentifiers.forEach(identifier => {
      if (!identifier) return;
      
      let matched = null;
      
      if (isV2) {
        if (identifier.includes('::')) {
          const parts = identifier.split('::');
          const title = parts[1] || "";
          const author = parts[2] || "";
          
          if (title) {
            const sTitle = title.toLowerCase().trim();
            const sAuthor = author.toLowerCase().trim();
            matched = globalSongs.find(gs => 
              gs.title.toLowerCase().trim() === sTitle &&
              (gs.author || "").toLowerCase().trim() === sAuthor
            );
            if (!matched) {
              matched = globalSongs.find(gs => gs.title.toLowerCase().trim() === sTitle);
            }
            if (!matched) {
              matched = {
                id: "",
                title: title,
                author: author,
                lyrics: "<i>(Letra no disponible en el catálogo local actual)</i>",
                type: "",
                audio: "",
                tags: "",
                category: ""
              };
            }
          }
        } else {
          // ID directo
          matched = globalSongs.find(gs => gs.id === identifier);
          if (!matched) {
            const alternateId = identifier.startsWith("letra-") ? identifier.replace("letra-", "") : "letra-" + identifier;
            matched = globalSongs.find(gs => gs.id === alternateId);
          }
          if (!matched) {
            // Traducir / buscar si coincide con el slug del título de alguna canción global para máxima compatibilidad
            const targetSlug = identifier.startsWith("letra-") ? identifier.substring(6) : identifier;
            matched = globalSongs.find(gs => {
              const songSlug = window.generateStableSongId(gs.title, "");
              const songWithAuthorSlug = window.generateStableSongId(gs.title, gs.author);
              return songSlug === targetSlug || songWithAuthorSlug === targetSlug;
            });
          }
          if (!matched) {
            const derivedTitle = identifier.replace("letra-", "").replace(/-/g, " ");
            const capitalizedTitle = derivedTitle.charAt(0).toUpperCase() + derivedTitle.slice(1);
            missingTitles.push(capitalizedTitle);

            // Crear objeto de canto parcial de respaldo para evitar pérdida de cantos en la lista
            matched = {
              id: identifier,
              title: capitalizedTitle,
              author: "",
              lyrics: "<i>(Letra no disponible en el catálogo local actual)</i>",
              type: "",
              audio: "",
              tags: "",
              category: ""
            };
          }
        }
      } else {
        // Formato legacy v1
        if (identifier.includes('::')) {
          const parts = identifier.split('::');
          const id = parts[0] || "";
          const title = parts[1] || "";
          const author = parts[2] || "";

          // Intentar coincidencia por ID
          if (id) {
            matched = globalSongs.find(gs => gs.id === id);
          }

          // Si no se encuentra por ID, intentar coincidencia por título y autor
          if (!matched && title) {
            const sTitle = title.toLowerCase().trim();
            const sAuthor = author.toLowerCase().trim();
            matched = globalSongs.find(gs => 
              gs.title.toLowerCase().trim() === sTitle &&
              (gs.author || "").toLowerCase().trim() === sAuthor
            );
          }

          // Si no se encuentra, intentar coincidencia por título únicamente
          if (!matched && title) {
            const sTitle = title.toLowerCase().trim();
            matched = globalSongs.find(gs => gs.title.toLowerCase().trim() === sTitle);
          }

          if (matched) {
            resolvedSongs.push(matched);
          } else if (title) {
            resolvedSongs.push({
              id: id,
              title: title,
              author: author,
              lyrics: "<i>(Letra no disponible en el catálogo local actual)</i>",
              type: "",
              audio: "",
              tags: "",
              category: ""
            });
          }
        } 
        // Check if identifier is an index prefixed with 'i' (legacy format)
        else if (/^i\d+$/.test(identifier)) {
          const idx = parseInt(identifier.slice(1), 10);
          if (idx >= 0 && idx < sortedSongs.length) {
            matched = sortedSongs[idx];
          } else {
            missingTitles.push(`Canción #${idx}`);
          }
        } 
        // Legacy formats (only title)
        else {
          matched = sortedSongs.find(gs => gs.title.toLowerCase().trim() === identifier.toLowerCase().trim());
          if (matched) {
            matched = matched;
          } else {
            missingTitles.push(identifier);
          }
        }
      }
      
      if (matched && !resolvedSongs.includes(matched)) {
        resolvedSongs.push(matched);
      }
    });
    
    if (resolvedSongs.length === 0) {
      showToast("No se pudieron encontrar las canciones de este repertorio en el catálogo local.", "error");
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
    
    showToast(`¡Se han cargado las ${resolvedSongs.length} canciones de "${name}" en tu Repertorio Activo!`, "success");
    
    if (missingTitles.length > 0) {
      showToast(`Nota: No se encontraron ${missingTitles.length} canciones en el catálogo local:\n- ${missingTitles.join("\n- ")}`, "warning");
    }
  } catch (e) {
    console.error("Error al importar:", e);
    showToast("Hubo un problema al procesar el enlace del repertorio compartido.", "error");
  }
};

window.chequearImportacionCompartida = function() {
  const hash = window.location.hash;
  if (hash && hash.startsWith("#import=")) {
    const base64 = hash.replace("#import=", "");
    if (base64) {
      window.importarRepertorioCompartido(base64);
    }
  }
};

window.eliminarRepertorioGuardado = async function(id) {
  const saved = JSON.parse(localStorage.getItem("saved_repertorios")) || [];
  const target = saved.find(r => r.id === id);
  if (!target) return;
  
  const ok = await showConfirmModal({
    title: "Eliminar repertorio",
    message: `¿Estás seguro de que deseas eliminar el repertorio guardado "${target.name}"?`,
    confirmText: "Eliminar",
    cancelText: "Cancelar",
    danger: true,
    icon: "trash-2"
  });
  if (ok) {
    const updated = saved.filter(r => r.id !== id);
    window.saveLocalAndCloudRepertorios(updated);
    window.renderizarRepertoriosGuardados();
    
    // Si el que eliminamos estaba abierto en detalle, volver a la lista
    const detailSection = document.getElementById("saved-repertorio-detail");
    const mainSection = document.getElementById("saved-repertorios-main");
    if (detailSection && detailSection.style.display !== "none") {
      detailSection.style.display = "none";
      if (mainSection) mainSection.style.display = "block";
    }
    showToast(`Repertorio "${target.name}" eliminado`, "info");
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
      showToast("Por favor ingresa un nombre para tu repertorio.", "warning");
      return;
    }
    
    const songs = JSON.parse(localStorage.getItem("repertorio")) || [];
    if (songs.length === 0) {
      showToast("No tienes canciones en tu repertorio actual para guardar.", "warning");
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
    
    window.saveLocalAndCloudRepertorios(saved);
    
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

  // ==========================================
  // CONTROLADOR DE PANTALLA Y PERFIL DE MÚSICO (MODAL EMERGENTE DE AUTENTICACIÓN)
  // ==========================================
  const navAuth = document.getElementById("nav-auth");
  const authModal = document.getElementById("authModal");
  const closeAuthModalBtn = document.getElementById("closeAuthModal");
  const btnTriggerAuthModal = document.getElementById("btnTriggerAuthModal");

  const authTabLogin = document.getElementById("authTabLogin");
  const authTabRegister = document.getElementById("authTabRegister");
  const btnSubmitAuth = document.getElementById("btnSubmitAuth");
  const authForm = document.getElementById("authForm");
  const btnLogout = document.getElementById("btnLogout");
  const btnGoogleAuth = document.getElementById("btnGoogleAuth");
  
  let currentAuthTab = "login"; // "login" o "register"

  const openAuthModal = () => {
    if (authModal) {
      authModal.style.display = "flex";
      authModal.classList.add("active");
      authTabLogin?.click();
      if (typeof window.updateLogos === "function") window.updateLogos();
    }
  };

  const closeAuthModal = () => {
    if (authModal) {
      authModal.style.display = "none";
      authModal.classList.remove("active");
    }
  };

  btnTriggerAuthModal?.addEventListener("click", () => {
    openAuthModal();
  });

  closeAuthModalBtn?.addEventListener("click", () => {
    closeAuthModal();
  });

  authModal?.addEventListener("click", (e) => {
    if (e.target === authModal) {
      closeAuthModal();
    }
  });

  navAuth?.addEventListener("click", (e) => {
    e.preventDefault();
    const user = AuthEngine.getCurrentUser();
    if (user) {
      switchView("profile");
    } else {
      openAuthModal();
    }
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    if (sidebar) sidebar.classList.remove("active");
    if (overlay) overlay.classList.remove("active");
  });

  const authFullNameGroup = document.getElementById("authFullNameGroup");
  const authPasswordGroup = document.getElementById("authPasswordGroup");
  const authOptionsRow = document.getElementById("authOptionsRow");
  const authDivider = document.getElementById("authDivider");
  const authSocialGroup = document.getElementById("authSocialGroup");
  const authSwitchPromptText = document.getElementById("authSwitchPromptText");
  const authSwitchBtn = document.getElementById("authSwitchBtn");

  const togglePasswordVisibility = document.getElementById("togglePasswordVisibility");
  const authPasswordInput = document.getElementById("authPassword");
  const eyeIcon = document.getElementById("eyeIcon");

  togglePasswordVisibility?.addEventListener("click", () => {
    if (!authPasswordInput) return;
    if (authPasswordInput.type === "password") {
      authPasswordInput.type = "text";
      if (eyeIcon) eyeIcon.setAttribute("data-lucide", "eye-off");
    } else {
      authPasswordInput.type = "password";
      if (eyeIcon) eyeIcon.setAttribute("data-lucide", "eye");
    }
    if (window.lucide) window.lucide.createIcons();
  });

  function setAuthTab(tab) {
    currentAuthTab = tab;
    const title = document.getElementById("authModalTitle");
    const sub = document.getElementById("authModalSub");

    // Reestablecer visibilidades
    if (authFullNameGroup) {
      authFullNameGroup.style.display = "none";
      authFullNameGroup.classList.add("hidden");
    }
    if (authPasswordGroup) authPasswordGroup.style.display = "flex";
    if (authOptionsRow) authOptionsRow.style.display = "flex";
    if (authDivider) authDivider.style.display = "flex";
    if (authSocialGroup) authSocialGroup.style.display = "block";

    if (tab === "login") {
      authTabLogin?.classList.add("active");
      authTabRegister?.classList.remove("active");
      if (btnSubmitAuth) {
        btnSubmitAuth.innerHTML = '<i data-lucide="lock" style="width: 16px; height: 16px;"></i><span>Iniciar sesión</span>';
      }
      if (title) title.textContent = "¡Bienvenido!";
      if (sub) sub.textContent = "Inicia sesión para continuar";
      if (authSwitchPromptText) authSwitchPromptText.textContent = "¿No tienes una cuenta?";
      if (authSwitchBtn) authSwitchBtn.textContent = "Crear cuenta";
    } else if (tab === "register") {
      authTabRegister?.classList.add("active");
      authTabLogin?.classList.remove("active");
      if (authFullNameGroup) {
        authFullNameGroup.style.display = "flex";
        authFullNameGroup.classList.remove("hidden");
      }
      if (btnSubmitAuth) {
        btnSubmitAuth.innerHTML = '<i data-lucide="user-plus" style="width: 16px; height: 16px;"></i><span>Crear cuenta</span>';
      }
      if (title) title.textContent = "¡Crear Cuenta!";
      if (sub) sub.textContent = "Regístrate gratis para sincronizar tus repertorios";
      if (authSwitchPromptText) authSwitchPromptText.textContent = "¿Ya tienes una cuenta?";
      if (authSwitchBtn) authSwitchBtn.textContent = "Iniciar sesión";
    } else if (tab === "forgot") {
      authTabLogin?.classList.remove("active");
      authTabRegister?.classList.remove("active");
      if (authPasswordGroup) authPasswordGroup.style.display = "none";
      if (authOptionsRow) authOptionsRow.style.display = "none";
      if (authDivider) authDivider.style.display = "none";
      if (authSocialGroup) authSocialGroup.style.display = "none";
      if (btnSubmitAuth) {
        btnSubmitAuth.innerHTML = '<i data-lucide="mail" style="width: 16px; height: 16px;"></i><span>Enviar enlace de recuperación</span>';
      }
      if (title) title.textContent = "Recuperar Contraseña";
      if (sub) sub.textContent = "Ingresa tu correo para enviarte las instrucciones";
      if (authSwitchPromptText) authSwitchPromptText.textContent = "¿Recordaste tu contraseña?";
      if (authSwitchBtn) authSwitchBtn.textContent = "Iniciar sesión";
    }
    if (window.lucide) window.lucide.createIcons();
  }

  authTabLogin?.addEventListener("click", () => setAuthTab("login"));
  authTabRegister?.addEventListener("click", () => setAuthTab("register"));

  const authForgotPass = document.getElementById("authForgotPass");
  authForgotPass?.addEventListener("click", (e) => {
    e.preventDefault();
    setAuthTab("forgot");
  });

  authSwitchBtn?.addEventListener("click", () => {
    if (currentAuthTab === "register" || currentAuthTab === "forgot") {
      setAuthTab("login");
    } else {
      setAuthTab("register");
    }
  });

  btnGoogleAuth?.addEventListener("click", async () => {
    try {
      if (btnGoogleAuth) btnGoogleAuth.disabled = true;
      btnGoogleAuth.innerHTML = '<span>Cargando...</span>';
      
      await AuthEngine.signInWithGoogle();
      closeAuthModal();
      showToast("¡Inicio de sesión con Google exitoso!", "success");
      
    } catch (err) {
      console.error(err);
      if (!err.message.includes("cancelado") && !err.message.includes("canceled")) {
        showToast("Error de autenticación con Google: " + err.message, "error");
      }
    } finally {
      if (btnGoogleAuth) btnGoogleAuth.disabled = false;
      const originalHtml = '<svg style="width: 18px; height: 18px;" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22-.03-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg><span>Continuar con Google</span>';
      if (btnGoogleAuth) btnGoogleAuth.innerHTML = originalHtml;
    }
  });

  authForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("authEmail")?.value.trim();
    const password = document.getElementById("authPassword")?.value;
    const fullName = document.getElementById("authFullName")?.value.trim();

    if (!email) {
      showToast("Por favor, ingresa tu correo electrónico.", "warning");
      return;
    }

    // Validar sintaxis del correo electrónico
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      showToast("Por favor, ingresa un correo electrónico válido (ejemplo: usuario@gmail.com).", "warning");
      return;
    }

    // MODO RECUPERACIÓN DE CONTRASEÑA
    if (currentAuthTab === "forgot") {
      if (btnSubmitAuth) {
        btnSubmitAuth.disabled = true;
        btnSubmitAuth.innerHTML = "<span>Enviando enlace...</span>";
      }
      try {
        await AuthEngine.resetPassword(email);
        showToast("¡Enlace enviado! Revisa tu bandeja de entrada o carpeta de spam en " + email + ".", "success", 6000);
        setAuthTab("login");
      } catch (err) {
        showToast(err.message || "No se pudo procesar la recuperación de contraseña.", "error");
      } finally {
        if (btnSubmitAuth) btnSubmitAuth.disabled = false;
      }
      return;
    }

    if (!password) {
      showToast("Por favor, ingresa tu contraseña.", "warning");
      return;
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      showToast("La contraseña debe tener al menos 6 caracteres.", "warning");
      return;
    }

    // Validar nombre completo en el registro
    if (currentAuthTab === "register") {
      if (!fullName || fullName.length < 3) {
        showToast("Por favor, ingresa tu nombre y apellido completos.", "warning");
        return;
      }
    }

    if (btnSubmitAuth) {
      btnSubmitAuth.disabled = true;
      btnSubmitAuth.innerHTML = currentAuthTab === "login" ? "<span>Ingresando...</span>" : "<span>Creando Cuenta...</span>";
    }

    try {
      if (currentAuthTab === "login") {
        await AuthEngine.signIn(email, password);
        closeAuthModal();
        showToast("¡Bienvenido de nuevo!", "success");
      } else {
        const newUser = await AuthEngine.signUp(email, password);
        if (newUser) {
          saveUserProfile(newUser, {
            fullName: fullName || "",
            phone: "",
            parish: "",
            group: "",
            role: "Músico",
            city: ""
          });
        }
        closeAuthModal();
        showToast("¡Cuenta de músico creada con éxito!", "success");
      }
      authForm.reset();
    } catch (err) {
      console.error(err);
      showToast("Error: " + err.message, "error");
    } finally {
      if (btnSubmitAuth) {
        btnSubmitAuth.disabled = false;
        setAuthTab(currentAuthTab);
      }
    }
  });

  // GESTIÓN DE PERFIL DE MÚSICO
  const getUserProfileKey = (user) => {
    if (!user) return "voxdei_user_profile_guest";
    return `voxdei_user_profile_${user.uid || user.email}`;
  };

  const getUserProfile = (user) => {
    if (!user) return null;
    const key = getUserProfileKey(user);
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Error al leer el perfil guardado:", e);
      }
    }
    return {
      fullName: user.displayName || "",
      photoUrl: user.photoURL || "",
      phone: "",
      parish: "",
      group: "coro",
      role: "Músico",
      city: "",
      dob: ""
    };
  };

  const saveUserProfile = (user, profileData) => {
    if (!user) return;
    const key = getUserProfileKey(user);
    localStorage.setItem(key, JSON.stringify(profileData));
  };

  const showLoggedOutUI = () => {
    const loggedOutContent = document.getElementById("authLoggedOutContent");
    const loggedInContent = document.getElementById("authLoggedInContent");
    if (loggedOutContent) loggedOutContent.style.setProperty("display", "block", "important");
    if (loggedInContent) loggedInContent.style.setProperty("display", "none", "important");

    const navAuthBtn = document.getElementById("nav-auth");
    if (navAuthBtn) {
      navAuthBtn.innerHTML = `<i data-lucide="user"></i> Iniciar Sesión`;
      if (window.lucide) window.lucide.createIcons();
    }
  };
  window.showLoggedOutUI = showLoggedOutUI;

  const renderUserProfile = (user) => {
    if (!user) {
      showLoggedOutUI();
      return;
    }
    const loggedOutContent = document.getElementById("authLoggedOutContent");
    const loggedInContent = document.getElementById("authLoggedInContent");
    if (loggedOutContent) loggedOutContent.style.setProperty("display", "none", "important");
    if (loggedInContent) loggedInContent.style.setProperty("display", "block", "important");

    const navAuthBtn = document.getElementById("nav-auth");
    if (navAuthBtn) {
      navAuthBtn.innerHTML = `<i data-lucide="user"></i> Mi Perfil <span id="authBadge" class="auth-badge-dot" style="display: inline-block; width: 8px; height: 8px; background: #10b981; border-radius: 50%; margin-left: 6px; vertical-align: middle;"></span>`;
      if (window.lucide) window.lucide.createIcons();
    }

    const profile = getUserProfile(user);

    const greetingEl = document.getElementById("profileGreeting");
    const subRoleEl = document.getElementById("profileSubRoleGroup");
    const emailEl = document.getElementById("profileUserEmail");
    const roleBadgeEl = document.getElementById("profileRoleBadge");
    const parishValEl = document.getElementById("profileParishVal");
    const groupValEl = document.getElementById("profileGroupVal");
    const phoneValEl = document.getElementById("profilePhoneVal");
    const cityValEl = document.getElementById("profileCityVal");
    const dobValEl = document.getElementById("profileDobVal");
    const emailValEl = document.getElementById("profileEmailVal");
    const initialsEl = document.getElementById("profileAvatarInitials");
    const avatarImgEl = document.getElementById("profileAvatarImg");

    const activeRepSongsCountEl = document.getElementById("profileActiveRepSongsCount");
    const savedRepsCountEl = document.getElementById("profileSavedRepsCount");

    const fullName = profile && profile.fullName ? profile.fullName.trim() : "";
    let firstName = "";
    let displayGreeting = "¡Hola! 👋";
    let initials = "U";

    if (fullName) {
      const nameParts = fullName.split(" ").filter(Boolean);
      firstName = nameParts[0] || "";
      displayGreeting = firstName ? `¡Hola, ${firstName}! 👋` : "¡Hola! 👋";
      if (nameParts.length >= 2) {
        initials = (nameParts[0][0] + nameParts[1][0]).toUpperCase();
      } else if (nameParts.length === 1) {
        initials = nameParts[0][0].toUpperCase();
      }
    } else if (user.email) {
      const emailName = user.email.split("@")[0];
      firstName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
      displayGreeting = `¡Hola, ${firstName}! 👋`;
      initials = user.email.charAt(0).toUpperCase();
    }

    const userRole = (profile && profile.role) || "Músico";
    const userGroup = (profile && profile.group) || "coro";

    if (greetingEl) greetingEl.textContent = displayGreeting;
    if (subRoleEl) subRoleEl.textContent = userGroup ? `${userRole} del ${userGroup}` : userRole;
    if (emailEl) emailEl.textContent = user.email || "Sin correo";
    if (roleBadgeEl) roleBadgeEl.textContent = userRole;

    // Foto de Perfil / Iniciales
    if (profile && profile.photoUrl) {
      if (avatarImgEl) {
        avatarImgEl.src = profile.photoUrl;
        avatarImgEl.style.display = "block";
      }
      if (initialsEl) initialsEl.style.display = "none";
    } else {
      if (avatarImgEl) avatarImgEl.style.display = "none";
      if (initialsEl) {
        initialsEl.style.display = "block";
        initialsEl.textContent = initials;
      }
    }

    if (parishValEl) parishValEl.textContent = (profile && profile.parish) || "Sin especificar";
    if (groupValEl) groupValEl.textContent = (profile && profile.group) || "Coro";
    if (phoneValEl) phoneValEl.textContent = (profile && profile.phone) || "Sin especificar";
    if (cityValEl) cityValEl.textContent = (profile && profile.city) || "Sin especificar";
    if (dobValEl) dobValEl.textContent = (profile && profile.dob) || "Sin especificar";
    if (emailValEl) emailValEl.textContent = user.email || "Sin correo";

    // Conteos Reales
    try {
      const activeRep = JSON.parse(localStorage.getItem("repertorio") || "[]");
      if (activeRepSongsCountEl) activeRepSongsCountEl.textContent = activeRep.length;
    } catch (e) {
      if (activeRepSongsCountEl) activeRepSongsCountEl.textContent = "0";
    }

    try {
      const savedReps = JSON.parse(localStorage.getItem("saved_repertorios") || "[]");
      if (savedRepsCountEl) savedRepsCountEl.textContent = savedReps.length;
    } catch (e) {
      if (savedRepsCountEl) savedRepsCountEl.textContent = "0";
    }

    if (window.lucide) window.lucide.createIcons();
  };
  window.renderUserProfile = renderUserProfile;

  // Manejo de la foto de perfil temporal en la edición
  let tempPhotoUrl = "";

  const updatePhotoPreview = (photoUrl, initials) => {
    const previewImg = document.getElementById("editProfilePhotoPreview");
    const previewInitials = document.getElementById("editProfilePhotoInitials");
    const btnRemove = document.getElementById("btnRemoveProfilePhoto");

    if (photoUrl) {
      if (previewImg) {
        previewImg.src = photoUrl;
        previewImg.style.display = "block";
      }
      if (previewInitials) previewInitials.style.display = "none";
      if (btnRemove) btnRemove.style.display = "inline-flex";
    } else {
      if (previewImg) previewImg.style.display = "none";
      if (previewInitials) {
        previewInitials.style.display = "block";
        previewInitials.textContent = initials || "U";
      }
      if (btnRemove) btnRemove.style.display = "none";
    }
  };

  // Botón rápido de cámara en el avatar
  document.getElementById("btnQuickChangePhoto")?.addEventListener("click", () => {
    const btnEdit = document.getElementById("btnEditProfile");
    if (btnEdit) btnEdit.click();
    setTimeout(() => {
      document.getElementById("editProfilePhotoFile")?.click();
    }, 150);
  });

  // Listener para selección de archivo de foto
  document.getElementById("editProfilePhotoFile")?.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        if (typeof showToast === "function") showToast("La imagen es muy grande. Selecciona una menor a 3MB.", "error");
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        tempPhotoUrl = evt.target.result;
        updatePhotoPreview(tempPhotoUrl, "U");
      };
      reader.readAsDataURL(file);
    }
  });

  // Listener para quitar foto
  document.getElementById("btnRemoveProfilePhoto")?.addEventListener("click", () => {
    tempPhotoUrl = "";
    const fileInput = document.getElementById("editProfilePhotoFile");
    if (fileInput) fileInput.value = "";
    updatePhotoPreview("", "U");
  });

  // Event Listeners para Editar Perfil
  const btnEditProfile = document.getElementById("btnEditProfile");
  const btnCancelEditProfile = document.getElementById("btnCancelEditProfile");
  const btnSaveProfile = document.getElementById("btnSaveProfile");
  const profileCardOverview = document.getElementById("profileCardOverview");
  const profileCardEditor = document.getElementById("profileCardEditor");

  btnEditProfile?.addEventListener("click", () => {
    const user = AuthEngine.getCurrentUser();
    if (!user) return;

    const profile = getUserProfile(user);
    tempPhotoUrl = profile ? (profile.photoUrl || "") : "";

    const editName = document.getElementById("editProfileName");
    const editPhone = document.getElementById("editProfilePhone");
    const editParish = document.getElementById("editProfileParish");
    const editGroup = document.getElementById("editProfileGroup");
    const editRole = document.getElementById("editProfileRole");
    const editCity = document.getElementById("editProfileCity");
    const editDob = document.getElementById("editProfileDob");

    if (editName) editName.value = profile ? (profile.fullName || "") : "";
    if (editPhone) editPhone.value = profile ? (profile.phone || "") : "";
    if (editParish) editParish.value = profile ? (profile.parish || "") : "";
    if (editGroup) editGroup.value = profile ? (profile.group || "") : "";
    if (editRole) editRole.value = profile ? (profile.role || "Músico") : "Músico";
    if (editCity) editCity.value = profile ? (profile.city || "") : "";
    if (editDob) editDob.value = profile ? (profile.dob || "") : "";

    updatePhotoPreview(tempPhotoUrl, "U");

    if (profileCardOverview) profileCardOverview.style.display = "none";
    if (profileCardEditor) profileCardEditor.style.display = "block";
    if (window.lucide) window.lucide.createIcons();
  });

  btnCancelEditProfile?.addEventListener("click", () => {
    if (profileCardEditor) profileCardEditor.style.display = "none";
    if (profileCardOverview) profileCardOverview.style.display = "block";
  });

  const handleSaveProfile = () => {
    const user = AuthEngine.getCurrentUser();
    if (!user) return;

    const fullName = document.getElementById("editProfileName")?.value.trim() || "";
    const phone = document.getElementById("editProfilePhone")?.value.trim() || "";
    const parish = document.getElementById("editProfileParish")?.value.trim() || "";
    const group = document.getElementById("editProfileGroup")?.value.trim() || "";
    const role = document.getElementById("editProfileRole")?.value || "Músico";
    const city = document.getElementById("editProfileCity")?.value.trim() || "";
    const dob = document.getElementById("editProfileDob")?.value.trim() || "";

    const profileData = {
      fullName,
      photoUrl: tempPhotoUrl,
      phone,
      parish,
      group,
      role,
      city,
      dob
    };
    saveUserProfile(user, profileData);

    renderUserProfile(user);

    if (profileCardEditor) profileCardEditor.style.display = "none";
    if (profileCardOverview) profileCardOverview.style.display = "block";

    if (typeof showToast === "function") showToast("¡Perfil actualizado exitosamente!", "success");
    if (window.lucide) window.lucide.createIcons();
  };

  btnSaveProfile?.addEventListener("click", handleSaveProfile);
  document.getElementById("editProfileForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    handleSaveProfile();
  });

  // Opciones de Configuración del Perfil
  document.getElementById("btnProfileChangePass")?.addEventListener("click", async () => {
    const user = AuthEngine.getCurrentUser();
    if (!user) {
      if (typeof showToast === "function") showToast("Debes iniciar sesión para cambiar tu contraseña.", "warning");
      return;
    }

    const newPass = await showPromptModal({
      title: "Cambiar contraseña",
      message: `Ingresa tu nueva contraseña para la cuenta (${user.email || 'tu cuenta'}):`,
      placeholder: "Mínimo 6 caracteres",
      inputType: "password",
      confirmText: "Cambiar contraseña",
      cancelText: "Cancelar"
    });

    if (newPass === null) return; // El usuario canceló la ventana
    if (!newPass || newPass.trim().length < 6) {
      if (typeof showToast === "function") showToast("La contraseña debe tener al menos 6 caracteres.", "error");
      return;
    }

    try {
      await AuthEngine.changeUserPassword(newPass.trim());
      if (typeof showToast === "function") showToast("¡Tu contraseña ha sido actualizada exitosamente!", "success");
    } catch (err) {
      if (typeof showToast === "function") showToast(err.message, "error");
    }
  });

  window.toggleAppTheme = function(showToastMsg = true) {
    document.body.classList.toggle("light-mode");
    const isLight = document.body.classList.contains("light-mode");
    try {
      localStorage.setItem("theme", isLight ? "light" : "dark");
    } catch (e) {}

    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
      const SVG_SUN = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
      const SVG_MOON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
      themeToggle.innerHTML = isLight ? `${SVG_MOON} Modo Oscuro` : `${SVG_SUN} Modo Claro`;
    }

    if (typeof window.updateLogos === "function") window.updateLogos();
    if (window.lucide) window.lucide.createIcons();

    if (showToastMsg && typeof showToast === "function") {
      showToast(isLight ? "Tema cambiado a Modo Claro ☀️" : "Tema cambiado a Modo Oscuro 🌙", "info");
    }
    return isLight;
  };

  document.getElementById("btnProfileTheme")?.addEventListener("click", () => {
    window.toggleAppTheme(true);
  });

  btnLogout?.addEventListener("click", async () => {
    const ok = await showConfirmModal({
      title: "Cerrar sesión",
      message: "¿Estás seguro de que deseas cerrar la sesión? Al hacerlo, tus repertorios locales permanecerán intactos.",
      confirmText: "Cerrar sesión",
      cancelText: "Cancelar",
      danger: false,
      icon: "log-out"
    });
    if (ok) {
      try {
        await AuthEngine.signOut();
        showToast("Sesión finalizada con éxito.", "info");
        showLoggedOutUI();
      } catch (err) {
        showToast("Error al cerrar sesión: " + err.message, "error");
      }
    }
  });

  async function updateCommunityStats() {
    const statsLabel = document.getElementById("communityStatsLabel");
    if (statsLabel) {
      const count = await AuthEngine.getRegisteredUsersCount();
      statsLabel.textContent = `Comunidad: ${count} músicos registrados`;
    }
  }

  // Escuchar el estado de autenticación real o simulado
  AuthEngine.onAuthStateChanged(async (user) => {
    const authBadge = document.getElementById("authBadge");

    if (user) {
      if (authBadge) authBadge.style.display = "inline-block";
      renderUserProfile(user);
      await window.syncLocalAndCloudOnLogin(user);
    } else {
      if (authBadge) authBadge.style.display = "none";
      showLoggedOutUI();
    }
    
    // Resetear formulario editor a vista principal
    if (profileCardEditor) profileCardEditor.style.display = "none";
    if (profileCardOverview) profileCardOverview.style.display = "block";

    if (window.lucide) window.lucide.createIcons();
    updateCommunityStats();
  });
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

window.generateStableSongId = function(title, author) {
  if (!title) return "";
  const t = title.toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // eliminar acentos
    .replace(/[^a-z0-9]/g, "-") // reemplazar caracteres no alfanuméricos por guiones
    .replace(/-+/g, "-") // colapsar guiones múltiples
    .replace(/^-|-$/g, ""); // recortar guiones al inicio/final
  const cleanAuthor = window.cleanAuthor(author);
  if (!cleanAuthor) return t;
  const a = cleanAuthor.toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return a ? `${t}--${a}` : t;
};

window.getSongInfo = function(songSection) {
  if (!songSection) return { title: "", author: "", id: "" };
  
  // 1. Try restructured HTML first (e.g. inside our container)
  const titleSpan = songSection.querySelector(".song-title-text");
  if (titleSpan) {
    const authorSpan = songSection.querySelector(".autor");
    const author = authorSpan ? authorSpan.textContent : "";
    const title = titleSpan.textContent.trim();
    const cleanAuth = window.cleanAuthor(author);
    return {
      title: title,
      author: cleanAuth,
      id: songSection.dataset.id || window.generateStableSongId(title, cleanAuth)
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
    const cleanAuth = window.cleanAuthor(author);
    
    return {
      title: title,
      author: cleanAuth,
      id: songSection.dataset.id || window.generateStableSongId(title, cleanAuth)
    };
  }

  return { title: "", author: "", id: "" };
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

        // Generar y asignar un ID estable, único y determinista libre de espacios y duplicaciones genéricas
        const stableId = window.generateStableSongId(title, author);
        song.dataset.id = stableId;

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
      
      // Revisar si se accedió por un link de importación compartida ahora que todas las canciones están cargadas
      if (typeof window.chequearImportacionCompartida === "function") {
        window.chequearImportacionCompartida();
      }
    });
}

function initSongButtons() {
  document.querySelectorAll(".add-repertorio").forEach(btn => {
    const songSection = btn.closest(".song");
    const info = window.getSongInfo(songSection);
    const title = info.title || btn.dataset.title || "";
    const author = info.author || btn.dataset.author || "";

    let rep = JSON.parse(localStorage.getItem("repertorio")) || [];
    const isInRep = rep.some(s => 
      (s.id && info.id && s.id === info.id) || 
      (s.title === title && (s.author || "").trim() === author.trim())
    );
    actualizarBoton(btn, isInRep);

    btn.onclick = async (e) => {
      e.preventDefault();
      let currentRep = JSON.parse(localStorage.getItem("repertorio")) || [];
      const index = currentRep.findIndex(s => 
        (s.id && info.id && s.id === info.id) || 
        (s.title === title && (s.author || "").trim() === author.trim())
      );
      if (index === -1) {
        const lyrics = songSection.querySelector(".lyrics-hidden, .lyrics, .lyrics1")?.innerHTML.trim();
        const type = songSection.dataset.type || "";
        const audio = songSection.dataset.audio || "";
        const tags = songSection.dataset.tags || window.getSongTag(songSection) || "";
        const category = songSection.dataset.category || "";
        const songId = info.id || songSection.dataset.id || "";
        currentRep.push({ id: songId, title, author, lyrics, type, audio, tags, category });
        localStorage.setItem("repertorio", JSON.stringify(currentRep));
        actualizarBoton(btn, true);
        showToast(`"${title}" agregada al repertorio`, "success");
      } else {
        const ok = await showConfirmModal({
          title: "Quitar del repertorio",
          message: `¿Deseas eliminar "${title}" del repertorio?`,
          confirmText: "Eliminar",
          cancelText: "Cancelar",
          danger: true,
          icon: "trash-2"
        });
        if (!ok) return;
        currentRep.splice(index, 1);
        localStorage.setItem("repertorio", JSON.stringify(currentRep));
        actualizarBoton(btn, false);
        showToast(`"${title}" eliminada del repertorio`, "info");
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
    if (e && e.preventDefault) e.preventDefault();
    if (typeof window.toggleAppTheme === "function") {
      window.toggleAppTheme(true);
    }
  });

  function updateLogos() {
    if (typeof window.updateLogos === "function") {
      window.updateLogos();
    } else {
      const isLight = document.body.classList.contains("light-mode");
      document.querySelectorAll("img[data-light]").forEach(logo => {
        const lightSrc = logo.getAttribute("data-light");
        const darkSrc = logo.getAttribute("data-dark");
        if (isLight && lightSrc) {
          logo.setAttribute("src", lightSrc);
        } else if (!isLight && darkSrc) {
          logo.setAttribute("src", darkSrc);
        }
      });
    }
  }
  window.updateAppLogos = updateLogos;
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

  const deactivateAllPanels = () => {
    panelSize?.classList.remove("active");
    panelSpacing?.classList.remove("active");
    panelTranspose?.classList.remove("active");
    panelAudio?.classList.remove("active");
    btnToolSize?.classList.remove("active");
    btnToolSpacing?.classList.remove("active");
    btnToolTranspose?.classList.remove("active");
    btnToolAudio?.classList.remove("active");
    document.querySelectorAll(".menu-item-container").forEach(c => c.classList.remove("active-container"));
  };

  // Helper de eventos táctiles optimizado para evitar retrasos de 300ms y resolver conflictos de eventos en móviles
  function addTapListener(element, callback) {
    if (!element) return;
    let touchMoved = false;
    let touchStartTime = 0;
    let lastTriggerTime = 0;

    const handleAction = (e) => {
      const now = Date.now();
      if (now - lastTriggerTime < 300) return;
      lastTriggerTime = now;
      callback(e);
    };

    element.addEventListener("touchstart", (e) => {
      touchMoved = false;
      touchStartTime = Date.now();
    }, { passive: true });

    element.addEventListener("touchmove", (e) => {
      touchMoved = true;
    }, { passive: true });

    element.addEventListener("touchend", (e) => {
      if (!touchMoved && (Date.now() - touchStartTime < 350)) {
        e.preventDefault();
        e.stopPropagation();
        handleAction(e);
      }
    });

    element.addEventListener("click", (e) => {
      e.stopPropagation();
      handleAction(e);
    });
  }

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

  /* =========================================================
     SISTEMA DE NAVEGACIÓN SECUENCIAL DE CANCIONES (SWIPE / FLECHAS)
  ========================================================== */
  window.currentSongSequence = [];
  window.currentSongIndex = -1;

  window.normalizeSongData = function(item) {
    if (!item) return null;
    
    // Si es un elemento HTML (.song o .saved-rep-song-item)
    if (item instanceof HTMLElement || (item && item.nodeType === 1)) {
      const h2 = item.querySelector("h2, .song-title-text, .saved-rep-song-title");
      let title = item.dataset.title || "";
      if (!title && h2) {
        const titleTextEl = h2.querySelector(".song-title-text");
        if (titleTextEl) {
          title = titleTextEl.textContent.trim();
        } else {
          const h2Clone = h2.cloneNode(true);
          h2Clone.querySelectorAll("small, span, div, p, .autor").forEach(el => el.remove());
          title = h2Clone.textContent.trim();
        }
      }

      const autorElement = item.querySelector(".autor, small.autor, small, .saved-rep-song-author");
      let author = item.dataset.author || "";
      if (!author && autorElement) {
        author = autorElement.textContent.trim().replace(/^\(|\)$/g, "").trim();
      }

      const lyricsEl = item.querySelector(".lyrics-hidden, .lyrics, .lyrics1");
      let lyrics = item.dataset.lyrics || "";
      if (!lyrics && lyricsEl) {
        lyrics = lyricsEl.innerHTML.trim();
      }

      let type = item.dataset.type || "";
      let audio = item.dataset.audio || "";
      let tags = item.dataset.tags || (typeof window.getSongTag === "function" ? window.getSongTag(item) : "");

      // Si falta la letra o info, buscar en allSongs como fallback de precisión
      if ((!lyrics || !author) && title && window.allSongs) {
        const match = window.allSongs.find(s => {
          const info = typeof window.getSongInfo === "function" ? window.getSongInfo(s) : null;
          return info && info.title.toLowerCase().trim() === title.toLowerCase().trim();
        });
        if (match) {
          const matchInfo = window.getSongInfo(match);
          if (!lyrics) lyrics = matchInfo.lyrics;
          if (!author) author = matchInfo.author;
          if (!type) type = matchInfo.type;
          if (!audio) audio = matchInfo.audio;
          if (!tags) tags = matchInfo.tags;
        }
      }

      return { title, lyrics, author, type, audio, tags };
    } 
    // Si es un objeto JS (canción de repertorio guardado o activo)
    else if (typeof item === "object") {
      const resolved = (typeof window.resolveSong === "function" ? window.resolveSong(item) : item) || item;
      return {
        title: resolved.title || "",
        lyrics: resolved.lyrics || "",
        author: resolved.author || "",
        type: resolved.type || "",
        audio: resolved.audio || "",
        tags: resolved.tags || "",
        category: resolved.category || ""
      };
    }
    return null;
  };

  window.updateSongNavigationUI = function() {
    const btnPrev = document.getElementById("btnPopupPrevSong");
    const btnNext = document.getElementById("btnPopupNextSong");

    const seq = window.currentSongSequence || [];
    const idx = window.currentSongIndex;

    if (seq.length > 1 && idx >= 0) {
      if (btnPrev) {
        btnPrev.style.display = "";
        btnPrev.classList.toggle("disabled", idx <= 0);
      }
      if (btnNext) {
        btnNext.style.display = "";
        btnNext.classList.toggle("disabled", idx >= seq.length - 1);
      }
    } else {
      if (btnPrev) btnPrev.style.display = "none";
      if (btnNext) btnNext.style.display = "none";
    }
  };

  window.navigatePopupSong = function(direction) {
    if (!window.currentSongSequence || window.currentSongSequence.length <= 1) return;
    const newIndex = window.currentSongIndex + direction;
    if (newIndex < 0 || newIndex >= window.currentSongSequence.length) return;

    // Detener audio actual si está sonando al cambiar de canto
    if (currentAudio) {
      try {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        if (currentAudioBtn) {
          currentAudioBtn.classList.remove("playing");
          if (currentAudioBtn.id === "btnToolAudio") currentAudioBtn.innerHTML = SVG_PLAY;
        }
        currentAudio = null;
        currentAudioBtn = null;
      } catch (err) {}
    }

    const item = window.currentSongSequence[newIndex];
    const songData = window.normalizeSongData(item);

    if (songData) {
      window.abrirLetra(
        songData.title,
        songData.lyrics,
        songData.author,
        songData.type,
        songData.audio,
        songData.tags,
        window.currentSongSequence,
        newIndex
      );

      // Desplazar suavemente el popup al inicio superior
      const popupTexto = document.getElementById("popupTexto");
      const captureArea = document.getElementById("captureArea");
      if (popupTexto) popupTexto.scrollTop = 0;
      if (captureArea) captureArea.scrollTop = 0;
    }
  };

  window.abrirLetra = function(titulo, letraHtml, autor, tipo, audioUrl, tags, sequence, index) {
    const popup = document.getElementById("popupLetra");
    if (!popup) return;
    
    // Determinar secuencia de canciones
    if (Array.isArray(sequence) && sequence.length > 0 && typeof index === "number") {
      window.currentSongSequence = sequence;
      window.currentSongIndex = index;
    } else {
      const savedDetail = document.getElementById("saved-repertorio-detail");
      const viewRepertorio = document.getElementById("viewRepertorio");
      
      if (savedDetail && savedDetail.style.display !== "none" && window.currentSavedRepertorioId) {
        const saved = JSON.parse(localStorage.getItem("saved_repertorios")) || [];
        const target = saved.find(r => r.id === window.currentSavedRepertorioId);
        if (target && target.songs && target.songs.length > 0) {
          window.currentSongSequence = target.songs;
          window.currentSongIndex = target.songs.findIndex(s => {
            const res = (typeof window.resolveSong === "function" ? window.resolveSong(s) : s) || s;
            return res.title.toLowerCase().trim() === (titulo || "").toLowerCase().trim();
          });
          if (window.currentSongIndex === -1) window.currentSongIndex = 0;
        }
      } else if (viewRepertorio && viewRepertorio.style.display !== "none") {
        const repActiveTab = document.getElementById("tabRepertorioActivo");
        if (repActiveTab && repActiveTab.classList.contains("active")) {
          const activeRep = JSON.parse(localStorage.getItem("repertorio")) || [];
          if (activeRep.length > 0) {
            window.currentSongSequence = activeRep;
            window.currentSongIndex = activeRep.findIndex(s => {
              const res = (typeof window.resolveSong === "function" ? window.resolveSong(s) : s) || s;
              return res.title.toLowerCase().trim() === (titulo || "").toLowerCase().trim();
            });
            if (window.currentSongIndex === -1) window.currentSongIndex = 0;
          }
        }
      } else {
        const visibleSongs = Array.from(document.querySelectorAll("#songsContainer .song")).filter(s => {
          return s.offsetWidth > 0 || s.offsetHeight > 0 || getComputedStyle(s).display !== "none";
        });
        if (visibleSongs.length > 0) {
          window.currentSongSequence = visibleSongs;
          window.currentSongIndex = visibleSongs.findIndex(s => {
            const h2 = s.querySelector("h2");
            const songTitle = h2 ? (h2.querySelector(".song-title-text")?.textContent.trim() || h2.textContent.trim()) : "";
            return songTitle.toLowerCase().trim() === (titulo || "").toLowerCase().trim();
          });
          if (window.currentSongIndex === -1) window.currentSongIndex = 0;
        }
      }
    }

    // Actualizar UI de navegación lateral
    window.updateSongNavigationUI();

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
    deactivateAllPanels();
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

  addTapListener(settingsBtn, (e) => {
    const isActive = settingsBtn.classList.toggle("active");
    settingsMenu?.classList.toggle("active");
    if (!isActive) {
        deactivateAllPanels();
        btnToolColumns?.classList.remove("active");
        resetHideTimer();
    } else clearTimeout(hideTimer);
  });

  addTapListener(btnToolSize, (e) => {
    const wasActive = btnToolSize.classList.contains("active");
    deactivateAllPanels();
    if (!wasActive) {
      btnToolSize.classList.add("active");
      panelSize?.classList.add("active");
      btnToolSize.closest(".menu-item-container")?.classList.add("active-container");
    }
  });

  addTapListener(btnToolSpacing, (e) => {
    const wasActive = btnToolSpacing.classList.contains("active");
    deactivateAllPanels();
    if (!wasActive) {
      btnToolSpacing.classList.add("active");
      panelSpacing?.classList.add("active");
      btnToolSpacing.closest(".menu-item-container")?.classList.add("active-container");
    }
  });

  addTapListener(btnToolTranspose, (e) => {
    const wasActive = btnToolTranspose.classList.contains("active");
    deactivateAllPanels();
    if (!wasActive) {
      btnToolTranspose.classList.add("active");
      panelTranspose?.classList.add("active");
      btnToolTranspose.closest(".menu-item-container")?.classList.add("active-container");
    }
  });

  addTapListener(btnTransposeUp, (e) => {
    window.transposeOffset++;
    if (transposeValueDisplay) transposeValueDisplay.textContent = (window.transposeOffset > 0 ? "+" : "") + window.transposeOffset;
    window.renderPopupLyrics();
  });

  addTapListener(btnTransposeDown, (e) => {
    window.transposeOffset--;
    if (transposeValueDisplay) transposeValueDisplay.textContent = (window.transposeOffset > 0 ? "+" : "") + window.transposeOffset;
    window.renderPopupLyrics();
  });

  addTapListener(btnToolNotation, (e) => {
      window.chordNotation = window.chordNotation === "english" ? "latin" : "english";
      localStorage.setItem("chordNotation", window.chordNotation);
      btnToolNotation.textContent = window.chordNotation === "english" ? "C" : "Do";
      window.renderPopupLyrics();
  });

  addTapListener(btnToolColumns, (e) => {
    const popupTexto = document.getElementById("popupTexto");
    if (popupTexto) {
      const isMulti = popupTexto.classList.toggle("multi-column");
      btnToolColumns.classList.toggle("active", isMulti);
      popupTexto.closest(".popup-content")?.classList.toggle("multi-column-active", isMulti);
      window.adjustPopupWidth();
    }
  });

  addTapListener(btnToolAudio, (e) => {
    // Si el panel ya está activo, solo toggleamos el audio
    if (panelAudio?.classList.contains("active")) {
        // El toggle ya se maneja en el onclick dinámico de abrirLetra
    } else {
        deactivateAllPanels();
        panelAudio?.classList.add("active");
        btnToolAudio.classList.add("active");
        btnToolAudio.closest(".menu-item-container")?.classList.add("active-container");
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
        textoElem.style.setProperty("font-size", window.tamañoFuente + "px", "important");
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
        showToast("La librería de descarga aún no está lista.", "warning");
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
        showToast("Ocurrió un error al descargar la canción en formato de imagen de alta calidad.", "error");
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
      deactivateAllPanels();
      resetHideTimer();
    }
  });

  // Event listeners para los botones de navegación lateral en PC
  document.getElementById("btnPopupPrevSong")?.addEventListener("click", (e) => {
    e.stopPropagation();
    window.navigatePopupSong(-1);
  });

  document.getElementById("btnPopupNextSong")?.addEventListener("click", (e) => {
    e.stopPropagation();
    window.navigatePopupSong(1);
  });

  // Navegación con teclado (Flechas izquierda / derecha)
  document.addEventListener("keydown", (e) => {
    const popup = document.getElementById("popupLetra");
    if (!popup || !popup.classList.contains("active")) return;
    if (e.target.closest("input, textarea, select")) return;

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      window.navigatePopupSong(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      window.navigatePopupSong(1);
    }
  });

  // Gestos táctiles de deslizamiento (Swipe horizontal para cambiar de canto)
  (function setupPopupSwipe() {
    const popup = document.getElementById("popupLetra");
    if (!popup) return;

    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;
    let isIgnored = false;

    popup.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        if (e.target.closest("input, textarea, select, audio, .audio-player, .volume-slider, .seekbar, button, .settings-fab, .menu-fab, .tool-panel")) {
          isIgnored = true;
          return;
        }
        isIgnored = false;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        endX = startX;
        endY = startY;
      }
    }, { passive: true });

    popup.addEventListener("touchmove", (e) => {
      if (!isIgnored && e.touches.length === 1) {
        endX = e.touches[0].clientX;
        endY = e.touches[0].clientY;
      }
    }, { passive: true });

    popup.addEventListener("touchend", () => {
      if (isIgnored) return;
      if (!popup.classList.contains("active")) return;

      const deltaX = endX - startX;
      const deltaY = endY - startY;

      if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
        if (deltaX < 0) {
          window.navigatePopupSong(1);
        } else {
          window.navigatePopupSong(-1);
        }
      }
    });
  })();

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

      // Determinar la lista de canciones y la posición actual según el contenedor activo
      let seq = null;
      let songIdx = -1;

      const activeRepContainer = songSection.closest("#repertorio-list");
      if (activeRepContainer) {
        const items = Array.from(activeRepContainer.querySelectorAll(".song"));
        seq = items;
        songIdx = items.indexOf(songSection);
      } else {
        const songsContainer = songSection.closest("#songsContainer");
        if (songsContainer) {
          const items = Array.from(songsContainer.querySelectorAll(".song")).filter(s => {
            return s.offsetWidth > 0 || s.offsetHeight > 0 || getComputedStyle(s).display !== "none";
          });
          seq = items;
          songIdx = items.indexOf(songSection);
        }
      }

      window.abrirLetra(title, lyrics, autor, tipo, audio, tags, seq, songIdx);
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
              if (typeof centerCategoryButton === "function") centerCategoryButton(btn);
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
