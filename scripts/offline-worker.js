const CACHE='forgotten-kingdom-offline-__BUILD_VERSION__';
const BASE=new URL(self.registration.scope),GAME=new URL('forgotten-kingdom.html',BASE).href;
const FILES=[GAME,...['manifest.webmanifest','offline-icon-192.png','offline-icon-512.png'].map(p=>new URL(p,BASE).href)];
const allowed=new Set(['','index.html','forgotten-kingdom.html','ashen-reliquary.html'].map(p=>new URL(p,BASE).pathname));
async function prepare(){const cache=await caches.open(CACHE);await cache.addAll(FILES.map(url=>new Request(url,{cache:'reload'})));return true;}
self.addEventListener('install',event=>event.waitUntil((async()=>{await prepare();if(!self.registration.active)await self.skipWaiting();})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('forgotten-kingdom-offline-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||event.request.mode!=='navigate'||url.origin!==BASE.origin||!allowed.has(url.pathname))return;
 event.respondWith((async()=>{try{const response=await fetch(event.request);if(response.ok)return response;const cached=await caches.match(GAME,{cacheName:CACHE});return cached||response;}catch{const cached=await caches.match(GAME,{cacheName:CACHE});return cached||Response.error();}})());
});
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE'){self.skipWaiting();return;}if(!['CHECK_OFFLINE','PREPARE_OFFLINE'].includes(event.data?.type))return;
 event.waitUntil((async()=>{try{if(event.data.type==='PREPARE_OFFLINE')await prepare();const ready=!!await caches.match(GAME,{cacheName:CACHE});event.ports[0]?.postMessage({ready,version:CACHE});}catch{event.ports[0]?.postMessage({ready:false,error:'Offline preparation failed. Reconnect and try again.'});}})());
});
