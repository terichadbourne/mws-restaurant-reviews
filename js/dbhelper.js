/**
 * Common database helper functions.
 * Relies on Jake Archibald's IndexedDB Promised library
 * (referenced here as `idb`)
 * (https://github.com/jakearchibald/idb)
 */

// console.log(`in dbhelper file and typeof idb is ${typeof idb}`)

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
   * URL for reviews for a specific restaurant
   * have to append restaurant id # when using
   */
  static get DATABASE_REVIEWS_URL() {
    const port = 1337 // Change this to your server port if different
    return `http://localhost:${port}/reviews/?restaurant_id=`;
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
          console.log('finishing in openIDB')
          // restaurantStore.createIndex('restID', 'id');
        }
        // case 2: {
        //   const reviewStore = upgradeDb.createObjectStore('reviews', {keyPath: 'id'});
        //   console.log('in openIDB and reviewStore is:')
        //   console.log(reviewStore)
        //   // reviewStore.createIndex('reviewID', 'id');
        //   reviewStore.createIndex('restaurant', 'restaurant_id')
        // }
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
      console.log('finishing in storeRestaurantsInIDB')
      return tx.complete;
    })
  }

  /**
   * Fetches restaurants from API and sends resulting data
   * to the storeRestaurantsInIDB function for IDB storage
   */
  static fetchAndStoreInIDB() {
    return fetch(DBHelper.DATABASE_URL)
      .then(response => response.json())
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
        console.log('finishing in getRestaurantsFromIDB')
        return restaurantStore.getAll();
      })
   }


  /**
   * Fetch all restaurants.
   */
   // TODO: If it finds records in IDB, it should also check live server for
   // updated records
  static fetchRestaurants(callback) {
    // NEW VERSION USING FETCH
    // try to get restaurants from IDB first
    return DBHelper.getRestaurantsFromIDB()
     .then(restaurants => {
       // if that worked
       if (restaurants.length) {
         console.log('in fetchRestaurants and successfully found records in IDB:')
         console.log(restaurants)
         return Promise.resolve(restaurants);
       // if nothing was in IDB, fetch from server and save to IDB
       } else {
         console.log("in fetchRestaurants and couldn't find records in IDB")
         console.log("about to run fetchAndStoreInIDB")
         return DBHelper.fetchAndStoreInIDB();
       }
     })
      .then(restaurants => {
        if (callback) {
          callback(null, restaurants)
        } else {
          return restaurants
        }
      })
      .catch(error => {
        console.log('error retrieving restaurant JSON from live server. Error is: ', error)
        callback(error, null)
      })
    }

  /**
   * Fetch a restaurant by its ID.
   */
   // TODO: Save fetched server results to IDB while online
   // TODO:  Make this work from IDB while offline

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
   * Fetch and filter restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    console.log('IN fetchRestaurantByCuisineAndNeighborhood')
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
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

  /**
   * Toggle favorite status
   */
   static toggleFavorite(restaurantIdString, oldState) {
     let restaurantId = parseInt(restaurantIdString)
     let newStateString, newStateBoolean, newAriaLabel
     if (oldState === "true") {
       newStateString = "false"
       newStateBoolean = false
       newAriaLabel = "Add to favorites"
     } else {
       newStateString = "true"
       newStateBoolean = true
       newAriaLabel = "Remove from favorites"
     }
    // update local and remote database first
    DBHelper.updateFavoriteInIDB(restaurantId, newStateBoolean, newStateString)
    // then update button styling
    const favoriteButton = document.getElementById("favorite-" + restaurantId)
    favoriteButton.setAttribute('data-favorite', newStateString)
    favoriteButton.setAttribute('aria-label', newAriaLabel)
  }

  /**
   * Update favorite status in IDB
   */
   // TODO: Change order so it saves to IDB, then tries to sync. If offline,
   // queue later sync.
   static updateFavoriteInIDB(restaurantId, newStateBoolean, newStateString) {
     console.log(`attempting to set idb state of restaurant #${restaurantId} to ${newStateBoolean}`)
     //update favorite status in remote DB
     fetch (`${DBHelper.DATABASE_URL}/${restaurantId}/?is_favorite=${newStateBoolean}`, {
       method: 'PUT'
     })
      .then(response => {
        console.log('updated favorite in remote DB, now trying IDB')
        return DBHelper.openIDB().then(db => {
          if(!db) return;
          const tx = db.transaction('restaurants', 'readwrite');
          const restaurantStore = tx.objectStore('restaurants');
          //find relevant restaurant in IDB
          restaurantStore.get(restaurantId)
            // update is_Favorite in IDB and save record
            .then(restaurant => {
              // console.log('IDB restaurant before updating is: ')
              // console.log(restaurant)
              restaurant.is_favorite = newStateString
              restaurantStore.put(restaurant)
              // console.log('updated to: ')
              // console.log(restaurant)
              console.log('updated favorite status in IDB')
            })
          })
          return tx.complete;
        })
      .catch(error => {
        console.log('error updating favorite in remote DB is: ', error)
      })
   }

} // end class DBHelper
