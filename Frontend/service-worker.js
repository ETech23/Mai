const CACHE_NAME = 'mai-cache-v8.1.2';
const DYNAMIC_CACHE_NAME = 'dynamic-cache-v8.1.2';

const STATIC_FILES = [
  '/offline.html',
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
  console.log('Fetching:', event.request.url);
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('Serving from cache:', event.request.url);
        return cachedResponse;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          console.log('Serving from network:', event.request.url);
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
          console.log('Network failed, serving offline.html');
          if (event.request.destination === 'document') {
            return caches.match('/offline.html');
          }
        });
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});