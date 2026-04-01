// ZENITH Fitness Tracker - Service Worker
// IMPORTANT: Increment version when deploying new builds to bust caches
const SW_VERSION = '2';
const CACHE_NAME = `zenith-fitness-v${SW_VERSION}`;
const STATIC_CACHE = `zenith-static-v${SW_VERSION}`;
const DYNAMIC_CACHE = `zenith-dynamic-v${SW_VERSION}`;

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// API routes to cache with network-first strategy
const API_ROUTES = [
  '/api/diet/plan',
  '/api/workout/plan',
  '/api/progress',
  '/api/user/profile',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v' + SW_VERSION);
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting()) // Immediately activate new SW
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v' + SW_VERSION);
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            // Delete ALL old caches that don't match current version
            .filter((name) => !name.includes(`v${SW_VERSION}`))
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim()) // Take control of all clients immediately
  );
});

// Listen for skip waiting message from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skip waiting requested');
    self.skipWaiting();
  }
  
  // Allow client to request cache clear
  if (event.data && event.data.type === 'CLEAR_CACHES') {
    console.log('[SW] Cache clear requested');
    event.waitUntil(
      caches.keys().then((names) => Promise.all(names.map((name) => caches.delete(name))))
    );
  }
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API requests - Network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Static assets (images, fonts, CSS) - Cache first, fallback to network
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // JS bundles - Network first to prevent stale React/module issues
  // This is critical for SPAs to prevent "Invalid hook call" errors from cached old bundles
  if (isJSBundle(url.pathname)) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // HTML pages - Network first for fresh content
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Default - Stale while revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// Check if URL is a static asset (excluding JS bundles which need special handling)
function isStaticAsset(pathname) {
  // JS bundles should NOT use cache-first to prevent stale React issues
  // Only truly static assets like images, fonts, CSS use cache-first
  return /\.(css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i.test(pathname);
}

// Check if URL is a JS bundle (needs network-first for freshness)
function isJSBundle(pathname) {
  return /\.js$/i.test(pathname);
}

// Cache-first strategy
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Cache-first fetch failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network-first strategy
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network-first falling back to cache:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // For API requests, return a proper JSON error
    if (request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({ error: 'You are offline', offline: true }),
        { 
          status: 503, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // For pages, return the cached index.html for SPA routing
    const indexCache = await caches.match('/index.html');
    if (indexCache) {
      return indexCache;
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const networkResponsePromise = fetch(request)
    .then(async (networkResponse) => {
      if (networkResponse.ok) {
        const responseClone = networkResponse.clone();
        const cache = await caches.open(DYNAMIC_CACHE);
        await cache.put(request, responseClone);
      }
      return networkResponse;
    })
    .catch(() => null);

  // Return cached response immediately, or wait for network
  if (cachedResponse) {
    // Trigger background update but return cached immediately
    networkResponsePromise.catch(() => {}); // Ignore errors on background update
    return cachedResponse;
  }
  
  const networkResponse = await networkResponsePromise;
  return networkResponse || new Response('Offline', { status: 503 });
}

// Handle background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-food-logs') {
    event.waitUntil(syncFoodLogs());
  }
  
  if (event.tag === 'sync-workout-logs') {
    event.waitUntil(syncWorkoutLogs());
  }
});

// Sync food logs when back online
async function syncFoodLogs() {
  // This would be implemented with IndexedDB to store offline logs
  // and sync them when back online
  console.log('[SW] Syncing food logs...');
}

// Sync workout logs when back online
async function syncWorkoutLogs() {
  // This would be implemented with IndexedDB to store offline logs
  // and sync them when back online
  console.log('[SW] Syncing workout logs...');
}

// Handle push notifications (future feature)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/',
      },
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        const url = event.notification.data?.url || '/';
        
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

console.log('[SW] Service worker loaded');
