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

function fromCache(request) {
  return caches.open(CACHE).then(function (cache) {
    return cache.match(request).then(function (matching) {
      if (!matching || matching.status >= 400) {
        return Promise.reject('no-match');
      }

      return matching;
    });
  });
}

function updateCache(request, response) {
  return caches.open(CACHE).then(function (cache) {
    return cache.put(request, response);
  });
}
