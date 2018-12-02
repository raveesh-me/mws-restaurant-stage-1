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