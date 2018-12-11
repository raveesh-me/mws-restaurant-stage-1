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
    return `http://localhost:${port}/restaurants`;
  }



  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    const fetchDataFromServer = fetch(DBHelper.DATABASE_URL).then(function(response) {
      return response.json()
    });

    let dbPromise = idb.open(
      "rastaurants-store", 1,
      upgradeDB => {
        upgradeDB.createObjectStore('restaurants')
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

    const fetchDataFromIDB = dbPromise.then(db=>{
      const tx = db.transaction('restaurants');
      return tx.objectStore('restaurants').get('restaurants');
    });

    fetchDataFromIDB.then(function(restaurants) {
      callback(null, restaurants);
      // saveDataToIdb(restaurants);
    }).catch(function(error) {
      console.log(`${error}`);
    });
    // if (!window.indexedDB) {//return early from server if indexedDB not supported
    //   fetchDataFromServer().then(function(data){
    //     callback(null, data);
    //   }).catch(function(error){
    //     callback(error, null);
    //   });
    // } else if (idbHasData) {/**if idb, check if idb has data
    //   if idb has data, return from db and then fetch content and update
    //   database and call the assigned callback again
    //   **/
    //   fetchDataFromIDB().then(function(data) {
    //     callback(null, data);
    //     fetchDataFromServer().then(function(data) {
    //       callback(null, data);
    //       console.log('refreshed idb data');
    //     }).catch(function(error){
    //       callback(error, null);
    //     });
    //   }).catch(function(error) {
    //     console.log(`E:FETCHING_FROM_IDB: ${error}`);
    //   });
    // } else {
    //   /*if idb supported and idb does not have data (first run)
    //   fetch from internet and then callback
    //   */
    //   fetchDataFromServer().then(function(data) {
    //     callback(null, data);
    //   }).catch(function(error){
    //     callback(error, null);
    //   });
    // }
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
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

}
