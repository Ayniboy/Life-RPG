// Life RPG Service Worker v1
var CACHE_NAME = 'life-rpg-v23';

self.addEventListener('install', function(e){
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){return k!==CACHE_NAME;})
            .map(function(k){return caches.delete(k);})
      );
    }).then(function(){return self.clients.claim();})
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.url.indexOf('index.html')!==-1||e.request.mode==='navigate'){
    e.respondWith(fetch(e.request).catch(function(){return caches.match(e.request);}));
    return;
  }
  e.respondWith(
    fetch(e.request).then(function(resp){
      var clone=resp.clone();
      caches.open(CACHE_NAME).then(function(cache){cache.put(e.request,clone);});
      return resp;
    }).catch(function(){return caches.match(e.request);})
  );
});
