const CACHE_NAME = 'copartir-v5';
const ASSETS = [
  '/',
  '/index.html',
  '/indexTest.html',
  '/result.html',
  '/testBox/resultTest.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

function resolveDocumentFallback(pathname) {
  if (pathname === '/result' || pathname === '/result.html') return '/result.html';
  if (
    pathname === '/resultTest' ||
    pathname === '/resultTest.html' ||
    pathname === '/testBox/resultTest' ||
    pathname === '/testBox/resultTest.html'
  ) return '/testBox/resultTest.html';
  if (pathname === '/indexTest' || pathname === '/indexTest.html') return '/indexTest.html';
  return '/index.html';
}

// Install : mise en cache des assets statiques
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate : suppression des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch :
// - pages HTML/navigation : network-first (pour voir les derniers changements)
// - assets statiques : cache-first
// - API : network-first
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // N'intercepte que les requêtes GET et même origine
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // Navigations/pages HTML : toujours tenter le réseau d'abord
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          const fallbackDoc = resolveDocumentFallback(url.pathname);
          return caches.match(request).then(cached => cached || caches.match(fallbackDoc) || caches.match('/index.html'));
        })
    );
    return;
  }

  // Requêtes API : network-first, pas de cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: 'Offline' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 503,
        })
      )
    );
    return;
  }

  // Assets statiques : cache-first
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => new Response('Offline', { status: 503, statusText: 'Offline' }));
    })
  );
});
