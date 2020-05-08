const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/index.js",
  '/manifest.webmanifest',
  "/styles.css",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

const CACHE_NAME = "static-cache-v1";
const DATA_CACHE_NAME = "data-cache-v1";

// Install =================================================
self.addEventListener('install', function(evt) {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("Your files were pre-cached successfully!");
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  self.skipWaiting();
});

// Active ===================================================
self.addEventListener("activate", function(evt) {
  evt.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log("Removing old cache data", key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

//  Fetch Calls ===============================================
self.addEventListener('fetch', function(evt) {
  if (evt.request.url.includes('/api/')){
    console.log('[Service Worker] Fetch (data)', evt.request.url);

    evt.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return fetch(evt.request)
          .then(response => {
            cache.put(evt.request, response.clone());
            return response;
          })
          .catch(function() {
            console.log("Connection could not be made.  Returning last cached result");
            return caches.match(evt.request)
          });
      })
    );
    return;

  }
  evt.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(evt.request).then(response => {
        return response || fetch(evt.request);
      });
    })
  );
});