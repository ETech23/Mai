const CACHE_NAME = 'mai-cache-v7.5.0'; // Cache name
const DYNAMIC_CACHE_NAME = 'dynamic-cache-v7.5.0'; // Dynamic cache name

// Files to cache manually
const STATIC_FILES = [
  '/',
  '/index.html',
  '/style.css', // Main CSS file
  '/app.js',    // Main JavaScript file
  '/social/mai_icon.png',
  '/social/mai_co.png',
  '/news.js',
  '/news.html',
  '/news.css',
  '/task.html',
  '/task.js',
  '/task.css',
  '/offline.html', // Add offline.html for fallback
];

// Install Service Worker and cache static files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching static files');
      return cache.addAll(STATIC_FILES);
    })
  );
  self.skipWaiting(); // Immediately activate new service worker
});

// Activate Service Worker and clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME && cache !== DYNAMIC_CACHE_NAME) {
            console.log('Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim(); // Take control of all clients
});

// Fetch requests
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; // Return cached file if available
      }

      // Fetch from the network and cache dynamically
      return fetch(event.request)
        .then((networkResponse) => {
          return caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            if (
              event.request.url.startsWith('http') &&
              !event.request.url.includes('/api/')
            ) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        })
        .catch(() => {
          // Fallback to offline.html for documents
          if (event.request.destination === 'document') {
            return caches.match('/offline.html');
          }
        });
    })
  );
});

// Listen for skipWaiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
