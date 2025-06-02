/**
 * ServiceWorker Script (sw.js)
 * Modern, minimal, and fast implementation
 */

const CACHE_NAME = 'app-cache-v1';
const RUNTIME_CACHE = 'runtime-cache-v1';

// Essential assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

/**
 * Install Event - Precache essential assets
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(PRECACHE_ASSETS);
        
        // Skip waiting to activate immediately
        await self.skipWaiting();
      } catch (error) {
        console.error('Install failed:', error);
      }
    })()
  );
});

/**
 * Activate Event - Cleanup old caches
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        const deletions = cacheNames
          .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map(name => caches.delete(name));
        
        await Promise.all(deletions);
        
        // Claim all clients immediately
        await self.clients.claim();
      } catch (error) {
        console.error('Activate failed:', error);
      }
    })()
  );
});

/**
 * Fetch Event - Network-first with cache fallback
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension URLs
  if (request.method !== 'GET' || url.protocol.includes('chrome-extension')) {
    return;
  }
  
  event.respondWith(
    (async () => {
      try {
        // Try network first
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok && shouldCache(request)) {
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(request, networkResponse.clone()).catch(() => {
            // Silently fail cache writes
          });
        }
        
        return networkResponse;
      } catch (error) {
        // Network failed, try cache
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Return offline fallback for navigation requests
        if (request.mode === 'navigate') {
          const fallback = await caches.match('/');
          if (fallback) return fallback;
        }
        
        // Re-throw error if no cache match
        throw error;
      }
    })()
  );
});

/**
 * Message Event - Handle commands from main thread
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0]?.postMessage({ version: CACHE_NAME });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0]?.postMessage({ success: true });
      }).catch((error) => {
        event.ports[0]?.postMessage({ success: false, error: error.message });
      });
      break;
      
    default:
      console.warn('Unknown message type:', type);
  }
});

/**
 * Helper: Determine if request should be cached
 */
function shouldCache(request) {
  const url = new URL(request.url);
  
  // Don't cache if same origin and has search params (likely API calls)
  if (url.origin === self.location.origin && url.search) {
    return false;
  }
  
  // Cache static assets
  if (/\.(js|css|png|jpg|jpeg|gif|svg|woff2?|ttf)$/i.test(url.pathname)) {
    return true;
  }
  
  // Cache HTML pages
  if (request.mode === 'navigate' || request.headers.get('Accept')?.includes('text/html')) {
    return true;
  }
  
  return false;
}

/**
 * Helper: Clear all caches
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
}

/**
 * Background Sync (if supported)
 */
if ('sync' in self.registration) {
  self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
      event.waitUntil(doBackgroundSync());
    }
  });
}

async function doBackgroundSync() {
  // Implement background sync logic here
  console.log('Background sync triggered');
}