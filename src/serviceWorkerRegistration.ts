// Service Worker Registration for offline capabilities and asset caching

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // In development mode, always unregister service worker and purge cache to prevent stale files
  const isProd = import.meta.env.PROD;
  if (isProd) {
    // Automatically reload when a new service worker controller takes over
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[GooKal] ServiceWorker registered with scope:', registration.scope);

          // Check for SW updates periodically
          registration.update().catch(() => {});

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) return;

            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('[GooKal] New version detected, activating immediately...');
                  installingWorker.postMessage({ type: 'SKIP_WAITING' });
                } else {
                  console.log('[GooKal] Content is cached for offline use.');
                }
              }
            };
          };
        })
        .catch((error) => {
          console.warn('[GooKal] ServiceWorker registration failed:', error);
        });
    });
  } else {
    // In development mode: clean up any existing service worker and caches to ensure latest code is always loaded
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    }).catch(() => {});

    if ('caches' in window) {
      caches.keys().then((names) => {
        for (const name of names) {
          caches.delete(name);
        }
      }).catch(() => {});
    }
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
