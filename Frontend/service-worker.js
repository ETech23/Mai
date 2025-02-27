const CACHE_NAME = 'mai-cache-v8.1.9';
const STATIC_FILES = ['/offline.html'];

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
          if (cache !== CACHE_NAME) {
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
    fetch(event.request)
      .then((networkResponse) => {
        console.log('Serving from network:', event.request.url);
        return networkResponse;
      })
      .catch(() => {
        console.log('Network failed, serving offline.html');
        if (event.request.destination === 'document') {
          return caches.match('/offline.html');
        }
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});