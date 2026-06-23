const CACHE_NAME = 'awl-elog-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './images/icon.svg',
  './css/style.css',
  './Component.js',
  './manifest.json',
  './model/models.js',
  './model/data.js',
  './view/App.view.xml',
  './view/View1.view.xml',
  './view/EditLog.view.xml',
  './controller/App.controller.js',
  './controller/View1.controller.js',
  './controller/EditLog.controller.js',
  './i18n/i18n.properties'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Don't fail install if a file is missing
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => cache.add(url).catch(err => console.warn('SW cache add failed for', url, err)))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Stale-while-revalidate strategy for PWA
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Cache successful responses for our app
        if (networkResponse.ok && event.request.url.startsWith(self.location.origin)) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
         // Fallback to cache if network fails
         return cachedResponse;
      });
      return cachedResponse || fetchPromise;
    })
  );
});
