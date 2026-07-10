const CACHE_NAME = 'kmfri-attendance-cache-v3';
const RUNTIME_CACHE = 'kmfri-attendance-runtime-v2';
const PRECACHE_URLS = [
  '/index.html',
  '/manifest.json',
  '/kmfri.png',
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

function staleWhileRevalidate(request) {
  return caches.match(request).then((cachedResponse) => {
    const networkResponse = fetch(request)
      .then((response) => cacheResponse(request, response))
      .catch(() => cachedResponse);

    return cachedResponse || networkResponse;
  });
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
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(event));
  }
});
