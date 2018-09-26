// create a numerical cache ID that can be updated when needed
let cacheID = "mws-restaurant-0001";

// create an array of URLs that need to be cached
// setting as its own variable so it's easier to change later
let urlsToCache = [
  './',
  './index.html',
  './restaurant.html',
  './js/',
  './register_sw.js',
  './js/main.js',
  './js/dbhelper.js',
  './js/restaurant_info.js',
  './js/.secrets.js',
  './css/styles.css',
  './img/icon-512.png',
  './img/icon-192.png',
  './js/idb.js'
]

// when service worker is installed
self.addEventListener('install', event => {
  // wait for installation to complete
  event.waitUntil(
    // open a cache by the name given in the variable cacheID
    // or else create one by that name if it doesn't yet exist
    caches.open(cacheID)
      .then(cache => {
        // log success
        console.log(`Opened cache called ${cacheID}`)
        // add specified list of URLs to this cache
        return cache.addAll(urlsToCache)
        .catch(error => {
          // log error
          console.log("Failed to open cache: " + error);
        });
      })
  );
 });


// when there's a fetch request
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url)
  let cacheRequest = event.request;

  // if the request is for a specific restaurant page, it won't
  // find anything in the cache with a search string included
  // so change the request to look for just restaurant.html
  if (event.request.url.includes("restaurant.html?id")) {
    console.log('requested a specific restaurant page')
    cacheRequest = new Request('/restaurant.html');
    console.log(`revised requested URL is ${cacheRequest.url}`);
    event.respondWith(
      caches.match(cacheRequest).then(response => {
        // if the requested resource is found in the cache,
        // load the cached version for quickest load time and
        // offline functionality, otherwise attempt to fetch from
        // live network
        return (response || fetch(event.request))
      }) // end then
    ) //end event.respondWith
    return;
  } // end if clause

  // } else {
  //   // if the request is for mapbox or leaflet (external resources),
  //   // don't mess with it
  //     console.log(`requesting external resource: ${requestUrl}`)
  // }

  // In either case (internal or external resource requested)
  event.respondWith(
    // use cacheRequest here so that it looks for restaurant.html
    // without the search string if relevant, otherwise the
    // original request
    // console.log(`cacheRequestUrl right before looking in cache is ${cacheRequest.url}`)
    caches.match(event.request).then(response => {
      // if the requested resource is found in the cache,
      // load the cached version for quickest load time and
      // offline functionality, otherwise attempt to fetch from
      // live network
      return (response ||
        fetch(event.request)
        // if fetched from live server, then save resource to cache
        .then(response => {
          // if there's something wrong with the response (it doesn't exist,
          // isn't of type basic, or doesn't have a 200 status), return the
          // crappy response itself
          if(!response.ok) {
            return response;
          }
          // otherwise, if there's a valid network response, clone it to cache it
          var validResponseToCache = response.clone();
          var validResponseToReturn = response.clone();

          caches.open(cacheID)
            // add the network response to the cache
            .then(cache => {
              cache.put(event.request, validResponseToCache)
            })

          return validResponseToReturn;
        }) //end network fetch response
      ) // end return response || fetch event request
    }) // end match.then response
  ) // end event.respondwith
}) //end selft.addEventListener
