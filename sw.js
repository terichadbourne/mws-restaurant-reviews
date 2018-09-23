// create a numerical cache ID that can be updated when needed
let cacheID = "mws-restaurant-0001";

// when service worker is installed, cache these items
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheID)
      .then(cache => {
        return cache.addAll([
          '/',
          'index.html',
          'restaurant.html',
          'data/restaurants.json',
          'js/',
          'register_sw.js',
          'js/main.js',
          'js/dbhelper.js',
          'js/restaurant_info.js',
          'js/.secrets.js',
          'css/styles.css',
          'img/'
        ])
        .catch(error => {
          console.log("Failed to open cache: " + error);
        });
      })
  );
 });

// load from cache first, then network if available
self.addEventListener('fetch', event => {
  console.log('event request is:');
  console.log(event.request);
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
