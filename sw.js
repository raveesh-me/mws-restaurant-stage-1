importScripts('/js/idb_promised.js');

//serviceworker install event
self.addEventListener('install', function(event){

    var urlsToCache = [
        '/',
        '/css/',
        '/data/',
        '/img/',
        '/js/',
    ];

    event.waitUntil(
        caches.open('my-restaurant-1').then(function(cache){
            cache.addAll(urlsToCache);
        })
    );
});

//serviceworker fetch event
self.addEventListener('fetch', function(event){
    event.respondWith(
        caches.match(event.request).then(function(response){
            return response || fetch(event.request);
        })
    );
});

//sync event for background sync
syncReviews = () => {
  let dbPromise = idb.open("restaurants-store", 1);
  //get all messages from 'outbox' object store
  const getOutbox = dbPromise.then(db => {
    let tx = db.transaction('outbox');
    return tx.objectStore('outbox').getAll();
  });

  //delete a certain message from idb object store
  const deleteOutboxMessage = message => {
    dbPromise.then(db => {
      let tx = db.transaction('outbox', 'readwrite');
      return tx.objectStore('outbox').delete(message.id);
    });
  }

  //actual work
  getOutbox.then(
    messages => {
        return Promise.all(
          messages.map(message => {
            fetch(`http://localhost:1337/reviews`, {
              method: 'post',
              body: JSON.stringify(message),
            }).then(
              response => {
                if(response.statusText === 'Created'){
                  return deleteOutboxMessage(message);
                }else{
                  console.log(`Something went wrong`);
                  return;
                }
              })
          })
        )
    }).catch(err => {
    console.log(err);
  });
}

//sync likes:
syncLikes = () => {
  let dbPromise = idb.open("restaurants-store", 1);
  //get all restaurants from 'outbox' object store
  const getOutbox = dbPromise.then(db => {
    let tx = db.transaction('like-outbox');
    return tx.objectStore('like-outbox').getAll();
  });

  //delete a certain restaurant from idb object store
  const deleteOutboxRestaurant = restaurant => {
    dbPromise.then(db => {
      let tx = db.transaction('like-outbox', 'readwrite');
      return tx.objectStore('like-outbox').delete(restaurant.pid);
    });
  }

  /*given an array of restaurants and a restaurant,
   replaces the one with the same id with the new one*/
  const replaceRestaurantInRestaurants = (restaurant, restaurants)=> {
    return restaurants.map(restu => {
      if(restu.id == restaurant.id) return restaurant;
      return restu;
    });
  }


  // Save an array of restaurants to idb
  const saveRestaurantsToIDB = restaurants => {
    dbPromise.then(db => {
      let tx = db.transaction("restaurants", "readwrite");
      return tx.objectStore("restaurants").put(restaurants, "restaurants");
    }).catch(err => {
      console.log(err)
    });
  }

  //get Restaurants from IDB
  const getRestaurantsFromIDB = dbPromise.then(db => {
      let tx = db.transaction("restaurants");
      return tx.objectStore("restaurants").get("restaurants");
    });


  //cycle data through idb
  const appendRestaurantToIDB = newRestaurant => {
    getRestaurantsFromIDB.then(oldrestaurants => {
      return replaceRestaurantInRestaurants(newRestaurant, oldrestaurants);
    }).then(newrestaurants => {
      return saveRestaurantsToIDB(newrestaurants);
    }).catch(err => {
      console.log(err);
    });
  }


  //actual work
  getOutbox.then(
    restaurants => {
        return Promise.all(
          restaurants.map(restaurant => {
            let newIsFavorite;
            if(restaurant.is_favorite === "true"){
              newIsFavorite = false;
            }else{
              newIsFavorite = true;
            }
            fetch(`http://localhost:1337/restaurants/${restaurant.id}/?is_favorite=${newIsFavorite}`,
               {method: "put"}).then(response => {
                 if(!response.ok) return;
                 return response.json();
               }).then(newRestaurant => {
                 appendRestaurantToIDB(newRestaurant);
               }).then(()=>{
                 return deleteOutboxRestaurant(restaurant);
               })
          })
        )
    }).catch(err => {
    console.log(err);
  });
}


self.addEventListener('sync', event => {
  console.log(event.tag);
  switch(event.tag){
    case "outbox":
      event.waitUntil(
        syncReviews()
      );
    case "like-outbox":
      event.waitUntil(
        syncLikes()
      );
  }

});
