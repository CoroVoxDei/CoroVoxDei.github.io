/* ==========================================================================
   Service Worker — Cancionero Digital Vox Dei
   - Páginas (HTML): primero la red; si no hay internet, la última versión guardada.
   - Archivos propios y librerías (CSS, JS, imágenes, Firebase SDK, Lucide, fuentes):
     se sirven desde caché y se actualizan en segundo plano.
   - songs-catalog.json: primero la red; si no hay internet, la copia guardada.
   - NUNCA toca Firestore, Autenticación, Storage, audios ni el generador de QR.
   - En localhost/127.0.0.1 no intercepta nada (para que desarrollar no cause confusión).
   Para forzar que todos los usuarios limpien su caché: cambia VERSION.
   ========================================================================== */
const VERSION = "v1";
const RUNTIME_CACHE = "voxdei-runtime-" + VERSION;
const PAGE_CACHE = "voxdei-offline-v1"; // el mismo que ya llena Principal.js
const IS_DEV = ["localhost", "127.0.0.1"].includes(self.location.hostname);

const PRECACHE = [
  "./",
  "index.html",
  "songs-catalog.json",
  "Principal/VoxDei.png",
  "Principal/VoxDeiBlanco.png"
];

function isCacheableCdn(url) {
  const h = url.hostname;
  if (h === "www.gstatic.com") return url.pathname.startsWith("/firebasejs/");
  return ["fonts.googleapis.com", "fonts.gstatic.com", "unpkg.com", "cdnjs.cloudflare.com", "cdn.jsdelivr.net"].includes(h);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(RUNTIME_CACHE)
      // allSettled: si un archivo falta, los demás igual se guardan
      .then((cache) => Promise.allSettled(PRECACHE.map((u) => cache.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((k) => k !== RUNTIME_CACHE && k !== PAGE_CACHE)
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

async function pageNetworkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const key = self.registration.scope; // la página principal, sin importar el ?r=CÓDIGO
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) cache.put(key, fresh.clone()).catch(() => {});
    return fresh;
  } catch (err) {
    return (await cache.match(key)) ||
           (await cache.match("index.html")) ||
           new Response("Sin conexión. Abre la app una vez con internet para usarla sin conexión.",
             { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) cache.put(request, fresh.clone()).catch(() => {});
    return fresh;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function staleWhileRevalidate(event) {
  const request = event.request;
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const update = fetch(request)
    .then((res) => {
      if (res && (res.ok || res.type === "opaque")) cache.put(request, res.clone()).catch(() => {});
      return res;
    })
    .catch(() => null);
  event.waitUntil(update);
  return cached || (await update) || Response.error();
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (IS_DEV || request.method !== "GET" || request.headers.has("range")) return;

  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(pageNetworkFirst(request));
    return;
  }

  if (url.origin === self.location.origin) {
    if (url.pathname.includes("/Audios/")) return;          // audios pesados: siempre de la red
    if (url.pathname.endsWith("/songs-catalog.json")) {
      event.respondWith(networkFirst(request));
      return;
    }
    event.respondWith(staleWhileRevalidate(event));
    return;
  }

  if (isCacheableCdn(url)) {
    event.respondWith(staleWhileRevalidate(event));
  }
  // Todo lo demás (Firestore, Auth, Storage, QR, Formspree…) pasa directo a la red.
});
