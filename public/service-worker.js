const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/index.js",
  '/manifest.webmanifest',
  "/styles.css",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

const STATIC_CACHE = "static-cache-v1";
const API_CACHE = "data-cache-v1";

// Install =================================================
self.addEventListener('install', function (evt) {
  evt.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      console.log("Your files were pre-cached successfully!");
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  self.skipWaiting();
});

// Active ===================================================
self.addEventListener("activate", function (evt) {
  evt.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== STATIC_CACHE && key !== API_CACHE) {
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
self.addEventListener('fetch', function (evt) {

  // POST API ---
  if (evt.request.url.includes('/api/') && evt.request.method === "POST") {

    evt.respondWith(
      fetch(evt.request)
      .then(data => data)
      // FAILED WITHOUT CONNECTINON
      .catch(function () {
        console.log("POST REQUEST FAILED!:");
      })
    )

    return;
  }


  // Get API ---
  if (evt.request.url.includes('/api/') && evt.request.method === "GET") {
    console.log('[Service Worker] Fetch (data)', evt.request.url);

    evt.respondWith(
      caches.open(API_CACHE).then(cache => {
        return fetch(evt.request)
          .then(response => {
            cache.put(evt.request, response.clone());
            return response;
          })
          .catch(function () {
            console.log("Connection could not be made.  Returning last cached result");
            return caches.match(evt.request)
          });
      })
    );
    return;
  }

  // FILE CACHED --------------
  evt.respondWith(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.match(evt.request).then(response => {
        return response || fetch(evt.request);
      });
    })
  );
});