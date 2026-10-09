/**
 * ArecaAI - Service Worker for Offline Precision Agriculture
 */
const CACHE_NAME = 'areca-ai-v1';
const STATIC_ASSETS = [
  '/',
  '/analytics',
  '/diseases',
  '/history',
  '/about',
  '/mobile',
  '/css/style.css',
  '/js/main.js',
  '/js/analytics.js',
  '/js/detect.js',
  '/images/logo.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Some cache assets skipped during install:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(e.request).catch(() => {
        if (e.request.destination === 'document') {
          return caches.match('/');
        }
      });
    })
  );
});
