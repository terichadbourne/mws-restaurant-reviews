/**
 * Common database helper functions.
 * Relies on Jake Archibald's IndexedDB Promised library
 * (https://github.com/jakearchibald/idb)
 */

// importScripts('js/idb.js') //import the IndexedDB Promised library
console.log(`in dbhelper file and typeof idb is ${typeof idb}`)

class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port if different
    return `http://localhost:${port}/restaurants`;
  }


  /**
   * Open IndexedDB and upgrade if needed.
   */
  static openIDB() {
    return idb.open('restaurant_reviews', 1, function(upgradeDb) {
      switch(upgradeDb.oldVersion) {
        case 0:
        case 1: {
          const restaurantStore = upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});
          console.log('in openIDB and created object store and restaurantStore is ', restaurantStore)
          // restaurantStore.createIndex('restID', 'id');
        }
      } // end switch
    })
  }

  /**
   * Store all restaurants in IDB; takes in data from API
   * but does not include the fetch action
   */
  static storeRestaurantsInIDB(data) {
    return DBHelper.openIDB().then(db => {
      if(!db) return;
      const tx = db.transaction('restaurants', 'readwrite');
      const restaurantStore = tx.objectStore('restaurants');
      // loop through the data from the API and put store each
      // record into the 'restaurants' store in IDB
      data.forEach(restaurant => {
        restaurantStore.put(restaurant)
      })
      console.log('just stored restaurants and restaurantStore is ', restaurantStore)
      return tx.complete;
    })
  }

  /**
   * Fetches restaurants from API and sends resulting data
   * to the storeRestaurantsInIDB function for IDB storage
   */
  static fetchAndStoreInIDB() {
    return fetch(DBHelper.DATABASE_URL)
      .then(response => response.json)
      .then(restaurants => {
        console.log('restaurants JSON retrieved from live server: ', restaurants)
        DBHelper.storeRestaurantsInIDB(restaurants)
        return restaurants
      })
  }

  /**
   * Get all restaurants from IDB
   */
   static getRestaurantsFromIDB() {
     return DBHelper.openIDB()
      .then(db => {
        if(!db) return;
        var restaurantStore = db.transaction('restaurants').objectStore('restaurants');
        return restaurantStore.getAll();
      })
   }


  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    // NEW VERSION USING FETCH
    // try to get restaurants from IDB first
    return DBHelper.getRestaurantsFromIDB()
     .then(restaurants => {
       // if that worked
       if (restaurants.length) {
         return Promise.resolve(restaurants);
       // if nothing was in IDB, fetch from server and save to IDB
       } else {
         return DBHelper.fetchAndStoreInIDB();
       }
     })
      .then(restaurants => {
        callback(null, restaurants)
      })
      .catch(error => {
        console.log('error retrieving restaurant JSON from live server. Error is: ', error)
        callback(error, null)
      })
    }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        console.log('in fetchRestaurantByCuisineAndNeighborhood and had error')
        callback(error, null);
      } else {
        console.log('in fetchRestaurantByCuisineAndNeighborhood w/ success')
        let results = restaurants
        console.log('in fetchRestaurantByCuisineAndNeighborhood and results before filter:')
        console.log(results)
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        console.log('in fetchRestaurantByCuisineAndNeighborhood and results after filter:')
        console.log(results)
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
    takes either 'tile' or 'banner' as directory/type
   */
  static imageUrlForRestaurant(restaurant, type) {
    return (`/img/${type}/${restaurant.id}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  }

} // end class DBHelper
