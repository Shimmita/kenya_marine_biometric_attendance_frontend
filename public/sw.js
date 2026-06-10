const CACHE_NAME = 'kmfri-attendance-cache-v2';
const RUNTIME_CACHE = 'kmfri-attendance-runtime-v1';
const PRECACHE_URLS = [
  '/index.html',
  '/manifest.json',
  '/vite.svg',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

function cacheResponse(request, response) {
  if (!response || response.status !== 200 || response.type !== 'basic') return response;
  const responseClone = response.clone();
  caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseClone));
  return response;
}

function networkFirst(event) {
  return fetch(event.request)
    .then((response) => cacheResponse(event.request, response))
    .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/index.html')));
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin === self.location.origin && request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response.ok ? response : caches.match('/index.html');
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  if (url.origin === self.location.origin && ['style', 'script', 'image', 'font'].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => cachedResponse || fetch(request).then((response) => cacheResponse(request, response)))
    );
    return;
  }

  event.respondWith(
    networkFirst(event)
  );
});
