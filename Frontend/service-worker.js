const CACHE_NAME = 'mai-cache-v9.0.3';
const DYNAMIC_CACHE_NAME = 'dynamic-cache-v9.0.3';
const STATIC_FILES = [
  '/offline.html',
  '/images/mai_logo.png', // Add the image to static files
];

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching static files');
      return cache.addAll(STATIC_FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
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
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('https://maicoin-41vo.onrender.com/api/auth/login')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Cache the login API response
          const clonedResponse = networkResponse.clone();
          caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
          return networkResponse;
        })
        .catch(() => {
          // Serve the cached login API response
          return caches.match(event.request);
        })
    );
  } else {
    // Handle other requests
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline.html'))
    );
  }
});
