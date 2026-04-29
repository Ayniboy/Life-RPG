// Life RPG Service Worker v25
var CACHE_NAME = 'life-rpg-v25';

self.addEventListener('install', function(e){
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){return caches.delete(k);}));
    }).then(function(){return self.clients.claim();})
  );
});

self.addEventListener('fetch', function(e){
  var req=e.request;
  if(req.method!=='GET')return;
  if(!req.url.startsWith('http'))return;
  if(req.mode==='navigate'||req.url.indexOf('index.html')!==-1){
    e.respondWith(fetch(req).catch(function(){return caches.match(req);}));
    return;
  }
  e.respondWith(
    fetch(req).then(function(resp){
      var clone=resp.clone();
      caches.open(CACHE_NAME).then(function(cache){cache.put(req,clone);});
      return resp;
    }).catch(function(){return caches.match(req);})
  );
});

// ── Push Notifications ──
self.addEventListener('push', function(e){
  var data={title:'Life RPG',body:'Time to log your deeds!',icon:'/Life-RPG/icon-192.png'};
  try{if(e.data)data=e.data.json();}catch(err){}
  e.waitUntil(
    self.registration.showNotification(data.title,{
      body:data.body,
      icon:data.icon||'/Life-RPG/icon-192.png',
      badge:'/Life-RPG/icon-192.png',
      vibrate:[100,50,100],
      data:{url:data.url||'https://ayniboy.github.io/Life-RPG/'},
      actions:[
        {action:'open',title:'Open Game'},
        {action:'dismiss',title:'Later'},
      ]
    })
  );
});

self.addEventListener('notificationclick', function(e){
  e.notification.close();
  if(e.action==='dismiss')return;
  var url=e.notification.data&&e.notification.data.url?e.notification.data.url:'https://ayniboy.github.io/Life-RPG/';
  e.waitUntil(clients.openWindow(url));
});
