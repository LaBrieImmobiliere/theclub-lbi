const CACHE_NAME = "theclub-v7";
const OFFLINE_URL = "/offline.html";
const API_CACHE = "theclub-api-v1";
const API_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const QUEUE_STORE = "offline-actions-queue";

// Assets à pré-cacher (logo, offline page, manifest).
// PAS de HTML ici : les routes Next.js ont des chunks hashés qui changent
// à chaque déploiement, donc cacher le HTML = risque de chunks orphelins.
const PRECACHE_ASSETS = [
  "/offline.html",
  "/logo.png",
  "/logo-white.png",
  "/manifest.json",
  "/apple-touch-icon.png",
];

// Install: pre-cache essential assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: purge TOUS les anciens caches (corrompus après deploy)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: SW minimal — ne touche PAS aux navigations ni aux chunks Next.js.
// Cette approche élimine toute possibilité de servir un HTML/chunk obsolète
// après un déploiement Vercel. Le navigateur gère navigation + chunks
// directement. Le SW ne s'occupe que de :
//   1. GET /api/...  → network-first avec fallback cache (offline)
//   2. Fallback offline.html si navigation totalement hors ligne
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip tout ce qui n'est pas GET
  if (request.method !== "GET") return;

  // Skip auth, push, HMR, chunks Next.js — passe directement au navigateur
  if (url.pathname.startsWith("/auth/")) return;
  if (url.pathname.includes("webpack-hmr")) return;
  if (url.pathname.startsWith("/_next/")) return;

  // API GET : network-first avec cache fallback (pour hors ligne)
  if (url.pathname.startsWith("/api/")) {
    if (url.pathname.includes("/push") || url.pathname.includes("/auth")) return;
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || new Response('{"error":"offline"}', { status: 503, headers: { "Content-Type": "application/json" } })))
    );
    return;
  }

  // Navigation : on laisse le navigateur faire. Seulement si la requête échoue
  // complètement (vraiment hors ligne), on sert la page offline.html.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Assets statiques (logo, etc.) — stale-while-revalidate
  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|woff|woff2|ttf|eot|ico)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }
});

// Push notifications
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || "",
      icon: data.icon || "/apple-touch-icon.png",
      badge: data.badge || "/apple-touch-icon.png",
      data: { url: data.url || "/" },
      vibrate: [200, 100, 200],
      tag: data.tag || "default",
      renotify: true,
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "The Club LBI", options)
    );
  } catch (e) {
    console.error("Push parse error:", e);
  }
});

// Click on push notification → open the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if open
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new tab
      return clients.openWindow(url);
    })
  );
});

// ─── Offline Actions Queue (IndexedDB) ───
function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("theclub-offline", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function queueAction(action) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, "readwrite");
    const store = tx.objectStore(QUEUE_STORE);
    const req = store.add({ ...action, createdAt: Date.now() });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getQueuedActions() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, "readonly");
    const store = tx.objectStore(QUEUE_STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function removeQueuedAction(id) {
  const db = await openDb();
  return new Promise((resolve) => {
    const tx = db.transaction(QUEUE_STORE, "readwrite");
    tx.objectStore(QUEUE_STORE).delete(id);
    tx.oncomplete = () => resolve();
  });
}

// Replay queued actions when back online
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-offline-actions") {
    event.waitUntil(
      (async () => {
        const actions = await getQueuedActions();
        for (const action of actions) {
          try {
            const res = await fetch(action.url, {
              method: action.method,
              headers: action.headers,
              body: action.body,
            });
            if (res.ok) {
              await removeQueuedAction(action.id);
              // Notify clients
              const clients = await self.clients.matchAll();
              clients.forEach((c) => c.postMessage({
                type: "offline-action-synced",
                url: action.url,
              }));
            }
          } catch (err) {
            console.error("[sw] Failed to replay action:", err);
          }
        }
      })()
    );
  }
});

// Intercept failed POST/PATCH to queue them
self.addEventListener("message", async (event) => {
  if (event.data?.type === "queue-offline-action") {
    await queueAction(event.data.action);
    if ("sync" in self.registration) {
      await self.registration.sync.register("sync-offline-actions");
    }
  }
});
