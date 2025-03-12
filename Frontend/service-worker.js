const CACHE_NAME = 'mai-cache-v9.18.0';
const DYNAMIC_CACHE_NAME = 'dynamic-cache-v9.17.0';
const STATIC_FILES = [
  '/offline.html',
  '/social/MAI_logo2.png',
  '/index.html',
  'news.html',
  'more.html',
  'logout.html',
  'login.html',
  'main.js',
  'manifest.json',
  'login.js',
  'more.css',
  'news.css',
  'task.html',
];

// Install Event: Cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching static files');
      return cache.addAll(STATIC_FILES);
    })
  );
  self.skipWaiting(); // Activate the new Service Worker immediately
});

// Activate Event: Clean up old caches
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
  self.clients.claim(); // Take control of all clients immediately
});

// Fetch Event: Handle network requests
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Block loading specific pages when offline
  if (!navigator.onLine && requestUrl.pathname === '/index.html') {
    event.respondWith(caches.match('/offline.html'));
    return;
  }

  // Handle login API requests
  if (requestUrl.href.includes('https://maicoin-41vo.onrender.com/api/auth/login')) {
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
          // Serve the cached login API response if available
          return caches.match(event.request);
        })
    );
    return;
  }

  // Handle other requests
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache dynamic responses (optional)
        if (event.request.method === 'GET') {
          const clonedResponse = networkResponse.clone();
          caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Serve the offline page for all other requests when offline
        return caches.match('/offline.html');
      })
  );
});
