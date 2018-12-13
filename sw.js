importScripts('/js/dbhelper.js');
importScripts('/js/idb_promised.js');

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

self.addEventListener('fetch', function(event){
    event.respondWith(
        caches.match(event.request).then(function(response){
            return response || fetch(event.request);
        })
    );
});

self.addEventListener('sync', event => {
  let dbPromise = idb.open("restaurants-store", 1);

  const getOutbox = dbPromise.then(db => {
    let tx = db.transaction('outbox');
    return tx.objectStore('outbox').getAll();
  });

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
              fetch(`${DBHelper.DATABASE_URL}/reviews`, {
                method: 'post',
                body: JSON.stringify(message),
              }).then(
                response => {
                  console.log('POST response:');
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
});
