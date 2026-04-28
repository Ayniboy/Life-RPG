// Life RPG Service Worker v24
var CACHE_NAME = 'life-rpg-v24';

self.addEventListener('install', function(e){
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.map(function(k){ return caches.delete(k); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;

  // Only handle GET requests — skip POST, chrome-extension etc
  if(req.method !== 'GET') return;
  if(!req.url.startsWith('http')) return;

  // Always fetch index.html fresh
  if(req.mode === 'navigate' || req.url.indexOf('index.html') !== -1){
    e.respondWith(
      fetch(req).catch(function(){ return caches.match(req); })
    );
    return;
  }

  // Network first for everything else
  e.respondWith(
    fetch(req).then(function(resp){
      var clone = resp.clone();
      caches.open(CACHE_NAME).then(function(cache){ cache.put(req, clone); });
      return resp;
    }).catch(function(){ return caches.match(req); })
  );
});
