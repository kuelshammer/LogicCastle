/**
 * LogicCastle Service Worker
 * Provides offline functionality for all games
 */

const CACHE_NAME = 'logiccastle-v1.0.0';
const STATIC_CACHE_NAME = 'logiccastle-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'logiccastle-dynamic-v1.0.0';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  
  // Connect4 game files
  '/games/connect4/',
  '/games/connect4/index.html',
  '/games/connect4/css/game.css',
  '/games/connect4/css/ui.css',
  '/games/connect4/js/game.js',
  '/games/connect4/js/ai.js',
  '/games/connect4/js/helpers.js',
  '/games/connect4/js/ui.js',
  '/games/connect4/js/fork-detection.js',
  
  // Gobang game files
  '/games/gobang/',
  '/games/gobang/index.html',
  '/games/gobang/css/game.css',
  '/games/gobang/css/ui.css',
  '/games/gobang/js/game.js',
  '/games/gobang/js/ai.js',
  '/games/gobang/js/helpers.js',
  '/games/gobang/js/ui.js',
  '/games/gobang/js/evaluation.js',
  
  // Trio game files
  '/games/trio/',
  '/games/trio/index.html',
  '/games/trio/css/game.css',
  '/games/trio/css/ui.css',
  '/games/trio/js/game.js',
  '/games/trio/js/ai.js',
  '/games/trio/js/ui.js'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching static files...');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('✅ Static files cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Error caching static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Serve from cache
          return cachedResponse;
        }
        
        // Not in cache, fetch from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Don't cache if not a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // Clone the response (can only be consumed once)
            const responseClone = networkResponse.clone();
            
            // Cache dynamic content
            caches.open(DYNAMIC_CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseClone);
              });
            
            return networkResponse;
          })
          .catch(() => {
            // Network failed, try to serve offline fallback
            if (event.request.destination === 'document') {
              return caches.match('/offline.html');
            }
            
            // For other resources, could return a default offline asset
            return new Response('Offline - Resource not available', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: CACHE_NAME,
      cached_files: STATIC_FILES.length
    });
  }
});

// Background sync (if needed for future features)
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
});

// Push notification handler (for future features)
self.addEventListener('push', (event) => {
  console.log('📬 Push notification received');
  
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Neue Nachrichten von LogicCastle',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: [
        {
          action: 'open',
          title: 'Öffnen'
        },
        {
          action: 'close', 
          title: 'Schließen'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'LogicCastle', options)
    );
  }
});

console.log('🎮 LogicCastle Service Worker loaded successfully!');