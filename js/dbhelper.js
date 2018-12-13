/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    let dbPromise = idb.open(
      "restaurants-store", 1,
      upgradeDB => {
        upgradeDB.createObjectStore('restaurants');
        upgradeDB.createObjectStore('reviews')
      });

    const fetchDataFromServer = fetch(`${DBHelper.DATABASE_URL}/restaurants`).then(function(response) {
      return response.json();
    });

    const fetchDataFromIDB = dbPromise.then(db => {
      const tx = db.transaction('restaurants');
      return tx.objectStore('restaurants').get('restaurants');
    });



    const saveDataToIdb = function(restaurants) {
      if (!window.indexedDB) {
        console.log("indexedDB is not supported on this browser");
        return;
      }

      dbPromise.then(db => {
        const tx = db.transaction('restaurants', 'readwrite');
        tx.objectStore('restaurants').put(restaurants, 'restaurants');
        return tx.complete;
      });
    }

    const showRestaurants = function(restaurants) {
      callback(null, restaurants);
    }

    if (!window.indexedDB) {
      fetchDataFromServer().then(restaurants => {
        showRestaurants(restaurants)
      }).catch(function(error) {
        console.log(error);
      });
    } else {
      fetchDataFromIDB.then(restaurants => {
        if (!restaurants) {
          return fetchDataFromServer;
        }
        showRestaurants(restaurants);
        return fetchDataFromServer;
      }).then(restaurants => {
        showRestaurants(restaurants);
        saveDataToIdb(restaurants);
      }).catch(error => {
        console.log(error);
      });
    }

  }

  static fetchReviewsByRestaurant(restaurant, callback) {
    let dbPromise = idb.open(
      "restaurants-store", 1,
      upgradeDB => {
        upgradeDB.createObjectStore('restaurants');
        upgradeDB.createObjectStore('reviews');
    });

    const serverDataURL = `${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${restaurant.id}`;
    const fetchDataFromServer = fetch(serverDataURL).then(function(response) {
      return response.json();
    });

    const fetchDataFromIDB = dbPromise.then(db => {
      const tx = db.transaction('reviews');
      return tx.objectStore('reviews').get(`${restaurant.id}`);
    });

    const saveDataToIdb = function(reviews) {
      const key = `${restaurant.id}`;
      if (!window.indexedDB) {
        console.log("indexedDB is not supported on this browser");
        return;
      }
      dbPromise.then(db => {
        const tx = db.transaction('reviews', 'readwrite');
        tx.objectStore('reviews').put(reviews, key);
        return tx.complete;
      });
    }
    // Fetch reviews from idb and fetch them again from the network
    if (!window.indexedDB) {
      fetchDataFromServer().then(reviews => {
        callback(null, reviews);
      }).catch(function(error) {
        callback(error, null);
      });
    } else {
      fetchDataFromIDB.then(reviews => {
        if (!reviews) {
          return fetchDataFromServer;
        }
        callback(null, reviews);
        return fetchDataFromServer;
      }).then(reviews => {
        saveDataToIdb(reviews);
        callback(null, reviews);
      }).catch(error => {
        callback(error, null);
      });
    }
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
          DBHelper.fetchReviewsByRestaurant(restaurant, (error, reviews) => {
            if (error) {
              callback(error, restaurant);
            } else {
              restaurant.reviews = reviews;
              callback(null, restaurant);
            }
          });
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
   */
  static imageUrlForRestaurant(restaurant) {
    var returnAddr = `/img/${restaurant.photograph || '1'}.jpg`;
    //if there is no photograph, using {1.jpg}
    // console.log(`DB_HELPER_IMG: ${returnAddr}.png`)
    return (returnAddr);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {
        title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant),
        keyboard: false,
      })
    marker.addTo(newMap);
    return marker;
  }

}
