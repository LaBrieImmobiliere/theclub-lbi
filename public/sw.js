const CACHE_NAME = "theclub-v2";
const OFFLINE_URL = "/offline.html";

// Assets to pre-cache
const PRECACHE_ASSETS = [
  "/",
  "/auth/connexion",
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

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first for navigation, stale-while-revalidate for assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip API routes and auth (always go to network)
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) {
    return;
  }

  // Skip _next/webpack-hmr for dev
  if (url.pathname.includes("webpack-hmr") || url.pathname.includes("_next/static/development")) {
    return;
  }

  // For navigation requests: network first, fallback to cache, then offline page
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // For static assets: stale-while-revalidate
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff|woff2|ttf|eot|ico)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
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
