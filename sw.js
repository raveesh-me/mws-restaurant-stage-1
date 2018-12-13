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
syncFunction = event => {
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

  event.waitUntil(
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
    })
  );
}

self.addEventListener('sync', syncFunction);
