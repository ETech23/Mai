// service-worker.js
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installed");
});

self.addEventListener("fetch", (event) => {
  console.log("Service Worker: Fetching");
});	
