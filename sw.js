// TechMon Service Worker - always fetches fresh from network
// This fixes the mobile browser caching that causes login network errors

const CACHE_NAME = 'techmon-v4-' + Date.now();

// On install: skip waiting so new SW activates immediately
self.addEventListener('install', event => {
  self.skipWaiting();
});

// On activate: claim clients and delete old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names => {
      return Promise.all(
        names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch strategy: network-first for HTML, cache-first for static assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Never cache Apps Script calls or third-party scripts
  if (url.hostname.includes('script.google.com') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('gstatic.com')) {
    return; // Let browser handle normally
  }

  // Network-first for HTML pages (always get fresh)
  if (event.request.mode === 'navigate' ||
      event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for icons and manifest
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        if (response.ok && (event.request.url.endsWith('.png') ||
                            event.request.url.endsWith('.json'))) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
