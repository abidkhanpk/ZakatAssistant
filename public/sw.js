const CACHE_NAME = 'za-static-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Never cache API and Next build assets to avoid stale chunk mismatch.
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/_next/')) {
    return;
  }

  // Navigation requests: network-first to always pick latest HTML shell.
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          return await fetch(req);
        } catch {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match(req);
          return cached || new Response('Offline', { status: 503 });
        }
      })()
    );
    return;
  }

  // Static public assets: cache-first fallback, cache only successful responses.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      if (cached) return cached;

      try {
        const response = await fetch(req);
        if (response.ok) {
          cache.put(req, response.clone());
        }
        return response;
      } catch {
        return new Response('Offline', { status: 503 });
      }
    })()
  );
});
