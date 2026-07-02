/**
 * Ambient Weather Service Worker
 * Caches the last successful weather API response so the app works offline.
 * Strategy: Network-first for API calls, cache-first for static assets.
 */

const CACHE_NAME = 'ambient-weather-v1';
const WEATHER_CACHE = 'ambient-weather-data-v1';

// Static assets to pre-cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== WEATHER_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-first for weather API calls — fallback to cache
  if (
    url.hostname.includes('open-meteo.com') ||
    url.hostname.includes('geocoding-api.open-meteo.com') ||
    url.hostname.includes('api.openweathermap.org')
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache a clone of the successful response
          if (response.ok) {
            const clone = response.clone();
            caches.open(WEATHER_CACHE).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline — serve stale cache if available
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
