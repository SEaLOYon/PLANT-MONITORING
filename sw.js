// TechMon Service Worker v2 — Pass-through for all external requests

const CACHE = 'techmon-static-v4';
const STATIC_ASSETS = ['./index.html','./manifest.json','./icon-192.png','./icon-512.png','./favicon.png'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC_ASSETS).catch(()=>{})));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(names => Promise.all(names.filter(n => n !== CACHE).map(n => caches.delete(n))))
    .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // CRITICAL: DO NOT intercept ANY external requests
  // Just let the browser handle them natively
  if (url.origin !== self.location.origin) {
    return; // Browser handles it directly — no SW interference
  }

  // Only handle same-origin requests (our HTML and icons)
  // Network-first for HTML
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request) || caches.match('./index.html'))
    );
    return;
  }

  // Cache-first for icons/manifest
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
