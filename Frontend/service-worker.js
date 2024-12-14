self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("mai-cache").then((cache) => {
      return cache.addAll(["/", "/index.html", "/social/mai_icon.png", "/social/mai_co.png"]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
