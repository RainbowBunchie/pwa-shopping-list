var dataCacheName = 'shopping-cache-data-9';
var cacheName = 'shopping-cache-9';
var filesToCache = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/images/delete.png',
  '/images/icon192x192.png',
  '/rainbow.jpg',
  '/js/index.js',
  '/js/firebase-app.js',
  '/js/firebase-database.js',
  '/js/firebase-firestore.js',
  '/js/firebase-messaging.js',
  '/manifest.json'
];


self.addEventListener('install', function(e) {
 self.skipWaiting();
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      // console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(filesToCache);
    })
  );
});

// this.addEventListener('fetch', function (event) {
// });

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== cacheName && key !== dataCacheName) {
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  var dataUrl = 'www.gstatic.com/firebasejs';
  if (e.request.url.indexOf(dataUrl) > -1) {
    e.respondWith(
      caches.open(dataCacheName).then(function(cache) {
        return fetch(e.request).then(function(response){
          cache.put(e.request.url, response.clone());
          return response;
        });
      })
    );
  }
  else if(e.request.url.indexOf('fcm.googleapis.com') > -1) {

  }
  else {
    e.respondWith(
      caches.match(e.request).then(function(response) {
        return response || fetch(e.request);
      })
    );
  }
});
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  console.log(JSON.parse(event.data.text()));
  let content = JSON.parse(event.data.text());

  const title = content.notification.title;
  const options = {
    body: content.notification.body,
    icon: 'images/icon192x192.png',
    badge: 'images/icon192x192.png'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
