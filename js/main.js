let restaurants,
  neighborhoods,
  cuisines
var newMap
var markers = []
var mapDiv = document.getElementById("map");

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  if (!navigator.onLine) {
    mapDiv.classList.add("offline")
  } else {
    mapDiv.classList.remove("offline")
  }

  // refactored code on page load to remove multiple fetches from server
  DBHelper.fetchRestaurants()
    .then(initMap)
    .then(updateRestaurants)
    .then(fillNeighborhoodsHTML)
    .then(fillCuisinesHTML)
});

/**
  * Was only used to call the fetchNeighborhoods in dbhelper.js, which is no longer USED
  * this function appears not to be called anywhere now
 * Fetch all neighborhoods and set their HTML.
 */
// fetchNeighborhoods = () => {
//   console.log('IN fetchNeighborhoods')
//   DBHelper.fetchNeighborhoods((error, neighborhoods) => {
//     if (error) { // Got an error
//       console.error(error);
//     } else {
//       self.neighborhoods = neighborhoods;
//       fillNeighborhoodsHTML();
//     }
//   });
// }

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (restaurants) => {
  const neighborhoods = DBHelper.uniqueNeighborhoods(restaurants);
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
  return restaurants;
}

/**
 * Was only used to call the fetchCusines in dbhelper.js, which is no longer USED
 * this function appears not to be called anywhere now
 * Fetch all cuisines and set their HTML.
 */
// fetchCuisines = () => {
//   console.log('IN fetchCuisines')
//   DBHelper.fetchCuisines((error, cuisines) => {
//     if (error) { // Got an error!
//       console.error(error);
//     } else {
//       self.cuisines = cuisines;
//       fillCuisinesHTML();
//     }
//   });
// }

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (restaurants) => {
  const cuisines = DBHelper.uniqueCuisines(restaurants);
  const select = document.getElementById('cuisines-select');
  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
  return restaurants;
}

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = (restaurants) => {
  // only try to create a map if browser is online
  if (navigator.onLine) {
    self.newMap = L.map('map', {
          center: [40.722216, -73.987501],
          zoom: 12,
          scrollWheelZoom: false
        });
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
      mapboxToken: topSecretMapboxToken, //be sure to set a value for this in js/.secrets.js
      maxZoom: 18,
      attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      id: 'mapbox.streets'
    }).addTo(newMap);
    mapDiv.classList.remove("offline") // set map div class to reflect online status
  }
  return restaurants // to make promise chain work
}


/**
 * Update page and map for current restaurants.
 * If you pass in a list of restaurants (on page load), it doesn't fetch.
 * If you don't, it does.
 * The idea for this approach came from @AlexandroPerez
 * (https://github.com/AlexandroPerez/restaviews) but I've implemented it
 * differently.
 */
updateRestaurants = (restaurants = null) => {
  // if restaurants passed in (on page load), skip the fetch
  if (restaurants) {
    console.log(`IN updateRestaurants on first load so won't re-fetch`)
    resetRestaurants(restaurants);
    fillRestaurantsHTML();
    return restaurants // to make promise chain work
  } else {
    console.log('IN updateRestaurants on subsequent load so will fetch and filter')
    const cSelect = document.getElementById('cuisines-select');
    const nSelect = document.getElementById('neighborhoods-select');

    const cIndex = cSelect.selectedIndex;
    const nIndex = nSelect.selectedIndex;

    const cuisine = cSelect[cIndex].value;
    const neighborhood = nSelect[nIndex].value;

    DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
      if (error) { // Got an error!
        console.error(error);
      } else {
        resetRestaurants(restaurants);
        fillRestaurantsHTML();
        return restaurants // to make promise chain work
      }
    })
  } // end else
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  // get the right image url from the tile directory
  image.src = DBHelper.imageUrlForRestaurant(restaurant, 'tile');
  // give it an alt tag that includes the restaurant name, per
  // instructor's suggestion
  image.alt = `Image of ${restaurant.name} restaurant`
  li.append(image);

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  // create button rather than just link for accessiblity
  const more = document.createElement('button');
  more.innerHTML = 'View Details';
  // set onclick action to link to restaurant detail URL
  more.onclick = function () {
    window.location = DBHelper.urlForRestaurant(restaurant);
  }
  // more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more)

  const favorite = document.createElement('button');
  favorite.id = "favorite-" + restaurant.id;
  favorite.classList = "favorite-button";
  favorite.setAttribute('data-id', restaurant.id);
  // favorite.setAttribute('data-favorite', (restaurant.is_favorite || "false"));
  if (!restaurant.is_favorite || restaurant.is_favorite === "false") {
    favorite.setAttribute('data-favorite', "false");
    favorite.setAttribute('aria-label', "Add to favorites")
  } else {
    favorite.setAttribute('data-favorite', "true");
    favorite.setAttribute('aria-label', "Remove from favorites")
  }
  favorite.innerHTML = "&#10084;";
  // when clicked, call toggleFavorite and pass in restaurant ID and old state
  favorite.onclick = function () {
    DBHelper.toggleFavorite(favorite.getAttribute("data-id"), favorite.getAttribute("data-favorite"));
  }
  li.append(favorite);

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  // only try to add markers to map if newMap is defined
  // (it will be undefinied if offline)
  if (self.newMap) {
    restaurants.forEach(restaurant => {
      // Add marker to the map
      const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
      marker.on("click", onClick);
      function onClick() {
        window.location.href = marker.options.url;
      }
      self.markers.push(marker);
    });
  }
}
