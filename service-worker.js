const CACHE='osko-camera-rebuilt-v1';
const FILES=['./','./index.html','./app.js','./clarity.js','./camera-controls.js','./barcode.js','./extras.js','./storage.js','./workflow-tools.js','./crystal-case.js','./persistent-library.js','./styles.css','./camera-controls.css','./barcode.css','./extras.css','./storage.css','./crystal-case.css','./manifest.json','./osko-camera-icon.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 event.respondWith(fetch(event.request).then(response=>{
  if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));}
  return response;
 }).catch(()=>caches.match(event.request).then(cached=>cached||new Response('Connect once to load this camera file.',{status:503}))));
});
