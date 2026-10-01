const CACHE_NAME = 'gookal-cache-v4';
const DYNAMIC_CACHE_NAME = 'gookal-dynamic-v4';

// Essential static app shell assets to precache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css'
];

// Install Event: Precache static assets & skip waiting
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use catch on each to avoid failing entire install if some dev URLs differ
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[Service Worker] Pre-caching failed for ${url}:`, err);
          })
        )
      );
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate Event: Clean up old cache versions & claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== DYNAMIC_CACHE_NAME)
          .map((name) => {
            console.log('[Service Worker] Deleting outdated cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch Event: Cache strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests for caching
  if (request.method !== 'GET') {
    // For API POST requests when offline, return helpful JSON response
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(
        fetch(request).catch(() => {
          return new Response(
            JSON.stringify({
              offline: true,
              error: 'คุณกำลังอยู่ในโหมดออฟไลน์ (No Internet Connection) ไม่สามารถเรียก AI วิเคราะห์อาหารใหม่ได้ แต่ยังสามารถดูบันทึกและประวัติย้อนหลังได้ตามปกติ'
            }),
            {
              status: 503,
              statusText: 'Service Unavailable (Offline)',
              headers: { 'Content-Type': 'application/json; charset=utf-8' }
            }
          );
        })
      );
    }
    return;
  }

  // 1. Navigation requests (HTML pages) -> Network first, fallback to Cache, then fallback to index.html
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // If offline, try cached page, then fallback to cached root/index.html
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;

          const rootCached = await caches.match('/index.html') || await caches.match('/');
          if (rootCached) return rootCached;

          return new Response(
            `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>KalGuru - โหมดออฟไลน์</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:sans-serif;padding:2rem;text-align:center;background:#fafafa;color:#333;"><h2>🌿 โหมดออฟไลน์ (Offline Mode)</h2><p>กำลังเปิดแอปพลิเคชันจากแคช...</p><button onclick="window.location.reload()" style="padding:0.75rem 1.5rem;background:#f97316;color:#fff;border:none;border-radius:1rem;font-weight:bold;cursor:pointer;margin-top:1rem;">โหลดใหม่</button></body></html>`,
            {
              headers: { 'Content-Type': 'text/html; charset=utf-8' }
            }
          );
        })
    );
    return;
  }

  // 2. Static Assets (JS, CSS, Images, Fonts, Vite chunks) -> Stale While Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch((err) => {
          // Return cached response if available when network fails
          if (cachedResponse) return cachedResponse;
          throw err;
        });

      // If we have cached response, return it immediately while fetching fresh in background
      return cachedResponse || fetchPromise;
    })
  );
});

// Notification Click Event: Focus app window & open scan screen
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  if (action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/#scan';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window client is already open, focus it and post a message
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({
            type: 'NAVIGATE_TAB',
            tab: 'scan',
            mealType: event.notification.data?.mealType
          });
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

