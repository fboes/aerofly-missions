/* eslint-env worker, es6 */
// @see https://pwabuilder.com
'use strict';

const CACHE = 'aerofly-missions-v2.8.9'; // Increment version when resources change

const offlineFallbackPage = [
  './index.html',
  './styles.css',
  './favicon-180x180.png',
  './favicon-512x512.png',
  './favicon-512x512.svg',
  './Web/App.js',
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activate the new service worker immediately
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(offlineFallbackPage);
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE) // Keep only the current cache
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim(); // Take control of all clients immediately
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') {
    return;
  }

  if (event.request.url.includes('mapbox')) {
    return fetch(event.request); // Bypass caching for Mapbox requests
  }

  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        event.waitUntil(updateCache(event.request, response.clone()));
        return response;
      })
      .catch(async function () {
        try {
          return await fromCache(event.request);
        } catch {
          return await caches.match('./index.html');
        } // Serve offline page as fallback
      })
  );
});

async function fromCache(request) {
  const cache = await caches.open(CACHE);
  const matching = await cache.match(request);
  if (!matching || matching.status >= 400) {
    return Promise.reject('no-match');
  }
  return matching;
}

async function updateCache(request, response) {
  const cache = await caches.open(CACHE);
  return await cache.put(request, response);
}
