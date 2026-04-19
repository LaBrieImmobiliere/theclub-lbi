// Service Worker — v8 (pass-through minimal)
//
// Les versions précédentes cachaient trop agressivement (HTML et chunks JS),
// ce qui cassait la navigation après chaque déploiement Vercel car les
// nouveaux chunks ont des hashes différents de ceux en cache. Cette version
// ne touche plus du tout aux requêtes de l'app — le navigateur gère tout.
// Seules restent : les notifications push, et un fallback offline.html.

const CACHE_NAME = "theclub-v8";
const OFFLINE_URL = "/offline.html";

// Install : pré-cache uniquement le fallback offline et les icônes essentielles
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([
      "/offline.html",
      "/logo-white.png",
      "/apple-touch-icon.png",
    ]))
  );
  self.skipWaiting();
});

// Activate : purge tous les anciens caches (potentiellement corrompus)
// puis prend le contrôle des pages ouvertes immédiatement.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch : pass-through complet. On n'intercepte QUE les navigations, et
// uniquement pour servir offline.html si le réseau est vraiment mort.
// Tout le reste (JS, CSS, images, API, RSC) passe direct au navigateur.
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.mode === "navigate" && request.method === "GET") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
  }
  // Sinon : no event.respondWith → le navigateur gère directement
});

// Permet au client d'accélérer l'activation d'un nouveau SW
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

// ─── Push notifications ───
self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || "The Club LBI", {
        body: data.body || "",
        icon: data.icon || "/apple-touch-icon.png",
        badge: data.badge || "/apple-touch-icon.png",
        data: { url: data.url || "/" },
        vibrate: [200, 100, 200],
        tag: data.tag || "default",
        renotify: true,
      })
    );
  } catch (e) {
    console.error("[sw] Push parse error:", e);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
