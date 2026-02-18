self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
  event.respondWith(caches.open('za-v1').then(async (cache) => {
    try {
      const response = await fetch(event.request);
      if (event.request.method === 'GET') cache.put(event.request, response.clone());
      return response;
    } catch {
      const cached = await cache.match(event.request);
      return cached || new Response('Offline', { status: 503 });
    }
  }));
});
