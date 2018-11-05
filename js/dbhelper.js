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
   * have to append `?restaurant_id=<id> to get a specific restaurant's reviews
   */
  static get DATABASE_REVIEWS_URL() {
    const port = 1337 // Change this to your server port if different
    return `http://localhost:${port}/reviews/`;
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
          console.log('in openIDB finishing creating restaurantStore')
          // restaurantStore.createIndex('restID', 'id');
        }
        case 2: {
          const reviewStore = upgradeDb.createObjectStore('reviews', {keyPath: 'id'});
          // reviewStore.createIndex('reviewID', 'id');
          reviewStore.createIndex('restaurant_id', 'restaurant_id')
          console.log('in openIDB finishing reviewStore')
        }
        case 3: {
          const syncStore = upgradeDb.createObjectStore('sync_queue', {keyPath: 'id', autoIncrement: true});
          syncStore.createIndex('restaurant_id', 'restaurant_id')
          console.log('in openIDB finishing syncStore')
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
    // update local and remote database first, then update styling only if successful
    DBHelper.updateFavoriteInIDB(restaurantId, newStateBoolean, newStateString)
  }

  /**
   * Update favorite status in IDB
   * While online, it syncs to remote server, then stores also in idb
   * Doesn't work offline currently
   */
   // TODO: Change order so it saves to IDB, then tries to sync. If offline,
   // queue later sync.
   static updateFavoriteInIDB(restaurantId, newStateBoolean, newStateString, newAriaLabel) {
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
              restaurant.is_favorite = newStateString
              restaurantStore.put(restaurant)
              console.log('updated favorite status in IDB')
            })
          })
          return tx.complete;
        })
        // update button UI once saved
        .then(response => {
          const favoriteButton = document.getElementById("favorite-" + restaurantId)
          favoriteButton.setAttribute('data-favorite', newStateString)
          favoriteButton.setAttribute('aria-label', newAriaLabel)
        })
      .catch(error => {
        console.log('error updating favorite in remote DB is: ', error)
        alert(`Unable to update favorite status while offline.`)
      })
   }

   static fetchReviewsByRestaurantId(id, callback) {
     // try to fetch reviews from server
     return fetch(`${DBHelper.DATABASE_REVIEWS_URL}?restaurant_id=${id}`)
      .then(response => response.json())
      // if it sucessfully fetches response from live server
      .then(reviews => {
        console.log('reviews fetched from online as: ', reviews)
        this.openIDB()
          .then(db => {
            if (!db) return;

            let tx = db.transaction('reviews', 'readwrite')
            const reviewStore = tx.objectStore('reviews')
            // if there are multiple reviews, loop through the array to store
            if (Array.isArray(reviews)) {
              reviews.forEach(review => {
                reviewStore.put(review)

              })
            } else {
              // if there's only one, store that one
              reviewStore.put(reviews)
            }
          })
        callback(null, reviews)
      })
      // if you couldn't get them from live server
    .catch(error => {
      //try to load reviews from IDB
      return DBHelper.openIDB()
       .then(db => {
         if(!db) return;
         const reviewStore = db.transaction('reviews').objectStore('reviews');
         const restaurantIdIndex = reviewStore.index('restaurant_id')
         return restaurantIdIndex.getAll(id)
           .then(offlineReviews => {
             // if no reviews available in idb
             if (offlineReviews.length === 0) {
               console.log(`no reviews for restaurant ${id} found in IDB`)
               callback ('offline and no reviews in IndexedDB', null)
               // if reviews available in idb
             } else {
               console.log(`found these reviews for restaurant ${id} in IDB: `, offlineReviews)
               callback (null, offlineReviews)
             }
           })
       })
    })
  } // end fetchReviewsByRestaurantId

  static saveReview(restaurantId, review, callback, finalCallback) {
    console.log('in saveReview and restaurant id is ', restaurantId)
    console.log('and review is ', review)
    // save to reviews IDB whether online or offline
    DBHelper.saveReviewInIDB(restaurantId, review)
    .then(()=> {
      console.log('succeeded at saving to REVIEWS idb, will now try to save remotely')
      // if online, save to live database
      return fetch(`${DBHelper.DATABASE_REVIEWS_URL}`, {
        method: "POST",
        body: JSON.stringify(review)
      })
      .then( response => response.json() )
      .then(review => {
        console.log('tried to post review and successful review response is: ', review)
        callback("false", review)
      })
      // if not able to save to live database, save to sync queue
      .catch( error => {
        console.log("can't post review and error is: ", error)
        DBHelper.queueReviewInIDB(restaurantId, review, finalCallback)
        .then(()=> {
          console.log('saved in SYNC IDB ')
          callback("true", review)
        })
      })
    })
  }

  static saveReviewInIDB(restaurantId, review) {
    console.log('in updateReviewInIDB')
    return DBHelper.openIDB()
      .then(db => {
        console.log('opened database')
        let tx = db.transaction('reviews', 'readwrite')
        const reviewStore = tx.objectStore('reviews')
        console.log('about to put review in REVIEWS IDB')
        reviewStore.put(review)
        console.log(`put review into IDB`)
        return tx.complete;
      })
  }

  static queueReviewInIDB(restaurantId, review, finalCallback) {
    console.log('in queueReviewInIDB')
    return DBHelper.openIDB()
      .then(db => {
        console.log('opened database')
        let tx = db.transaction('sync_queue', 'readwrite')
        const syncStore = tx.objectStore('sync_queue')
        console.log('about to put review in SYNC IDB')
        syncStore.put(review)
        console.log(`put review into SYNC IDB`)
        return tx.complete;
      })
      .then(DBHelper.syncLoop(restaurantId, finalCallback))
  }

  // I got the idea for this pseudo-recursion via callback from project coach Doug Brown
  // https://github.com/thefinitemonkey/udacity-restaurant-reviews/blob/master/app/js/dbhelper.js
  // but have implemented it a bit differently
  static syncLoop(restaurantId, finalCallback) {
    DBHelper.attemptSync(restaurantId, DBHelper.syncLoop, finalCallback)
  }

  // loop through queued items by running this again and again until the
  // network fails
  static attemptSync(restaurantId, callback, finalCallback) {
    DBHelper.openIDB()
      .then(db => {
        if(!db) return;
        let tx = db.transaction('sync_queue', 'readwrite')
        const syncStore = tx.objectStore('sync_queue')
        console.log('opening sync queue to try to sync entries')
        syncStore.openCursor()
        .then(cursor => {
          // if there's nothing to loop through, bail out and run fillReviewsHTML
          // red boxes will go away when loading from reviews object store in IDB
          if (!cursor) {
            console.log('nothing in sync queue; returning')
            const reviewStore = db.transaction('reviews').objectStore('reviews');
            const restaurantIdIndex = reviewStore.index('restaurant_id')
            return restaurantIdIndex.getAll(restaurantId)
              .then(reviews => {
                  finalCallback(null, reviews)
              })
            return;
          }
          const review = cursor.value
          console.log('in cursor and review is: ', review)
          console.log('about to sync that to server')
          return fetch(`${DBHelper.DATABASE_REVIEWS_URL}`, {
            method: "POST",
            body: JSON.stringify(review)
          })
          .then( response => {
            console.log('response.status is: ', response.status)
            console.log('response.ok is: ', response.ok)
            console.log('response.redirected is: ', response.redirected)
            // if the network response is bad, assume the connection won't
            // work and stop trying to sync
            if (!response.ok && !response.redirected) {
              console.log('bailing because network response is breadcrumb')
              return;
            }
          })
          // if the sync worked, delete the first cursor (which was just synced)
          // and then run this function again to sync the next entry in the list
          .then( () => {
            console.log('successfully synced that one, now trying to delete it')
            let tx = db.transaction('sync_queue', 'readwrite')
            const syncStoreAgain = tx.objectStore('sync_queue')
            syncStoreAgain.openCursor()
            .then(cursor => {
              cursor.delete()
              .then(()=> {
                callback() // this makes this function run again
              })
            })
            console.log('deleted that one from queue')
          })
          .catch( error => {
            console.log('error saving to server or cursoring is ', error)
            return;
          })
        })
      })
  }


} // end class DBHelper
