const CACHE_NAME = "tahfidzflow-v4";
const OFFLINE_PAGE = "/offline";
const STATIC_ASSETS = [
  OFFLINE_PAGE,
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  if (
    url.pathname.startsWith("/api/auth") ||
    url.pathname.startsWith("/api/reports")
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        } catch {
          const cachedPage = await cache.match(request);
          if (cachedPage) {
            return cachedPage;
          }

          const offlineResponse = await cache.match(OFFLINE_PAGE);
          if (offlineResponse) {
            return offlineResponse;
          }

          return new Response("Offline", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        }
      })
    );
    return;
  }

  if (url.pathname.startsWith("/_next/")) {
    return;
  }

  if (
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".ico")
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          });
        })
      )
    );
    return;
  }
});
