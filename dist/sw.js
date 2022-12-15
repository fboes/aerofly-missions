/* eslint-env worker, es6 */
// @see https://pwabuilder.com
'use strict';

const CACHE = 'aerofly-missions';

const offlineFallbackPage = [
  './index.html',
  './styles.css',
  './favicon-180x180.png',
  './favicon-512x512.png',
  './favicon-512x512.svg',
  './aerofly-missions-web.js',
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(offlineFallbackPage);
    })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        event.waitUntil(updateCache(event.request, response.clone()));
        return response;
      })
      .catch(function () {
        return fromCache(event.request);
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
