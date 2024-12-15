const CACHE_NAME = "mai-cache-v1"; // Update the cache name for versioning
const ASSETS_TO_CACHE = [
  "/", // Root URL
  "/index.html", // Main HTML file
  "/styles.css", // Main CSS file
  "/app.js", // Main JavaScript file
  "/social/mai_icon.png", // Icons
  "/social/mai_co.png",
  "/manifest.json", // PWA manifest
  "/news.js",
  "/news.html",
  "/news.css",
  "/task.html",
  "/task.js",
  "/task.css",
];

// Install event: Cache manually listed assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching static assets");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Fetch event: Serve cached assets and dynamically cache new ones
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if available
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise, fetch from network and dynamically cache the response
      return fetch(event.request).then((networkResponse) => {
        // Check if the response is valid
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
          return networkResponse;
        }

        // Clone the response to cache it
        const responseToCache = networkResponse.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});

// Activate event: Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
