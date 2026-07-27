const CACHE_NAME='osko-camera-live-v92';
const CORE=['./','./index.html','./styles.css','./crystal-case.css','./app.js','./manifest.json','./osko-camera-icon.svg'];
const EXTRA_SCRIPTS=['stability-pass.js','finish-pass.js','quick-zoom.js','focus-recording-lite.js','front-framing.js','stamp-watermark-lite.js','approved-heart-case.js','clean-camera-layout.js','compact-camera-v2.js','startup-recovery-v91.js'];

const timeout=ms=>new Promise((_,reject)=>setTimeout(()=>reject(new Error('network timeout')),ms));

async function injectScripts(response){
  if(!response||!response.ok)return response;
  let html=await response.text();
  for(const script of EXTRA_SCRIPTS){
    if(!html.includes(script))html=html.replace('</body>',`<script src="${script}?v=92"></script></body>`);
  }
  return new Response(html,{status:response.status,statusText:response.statusText,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
}

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(async cache=>{
    await Promise.allSettled(CORE.map(url=>cache.add(url)));
  }));
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)));
    if(self.registration.navigationPreload)await self.registration.navigationPreload.enable();
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;

  if(event.request.mode==='navigate'){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE_NAME);
      try{
        const preload=await event.preloadResponse;
        const network=preload||await Promise.race([fetch(event.request,{cache:'no-store'}),timeout(3500)]);
        const served=await injectScripts(network);
        await cache.put(event.request,served.clone());
        await cache.put('./index.html',served.clone());
        return served;
      }catch(error){
        const cached=await cache.match(event.request)||await cache.match('./index.html')||await caches.match(event.request)||await caches.match('./index.html');
        if(cached)return cached;
        return new Response('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;background:#04111d;color:white;font-family:system-ui;display:grid;place-items:center;min-height:100vh;text-align:center"><main><h1>OSKO Camera</h1><p>Connection is slow.</p><button onclick="location.reload()" style="font-size:20px;padding:14px 24px">TRY AGAIN</button></main></body>',{headers:{'content-type':'text/html; charset=utf-8'}});
      }
    })());
    return;
  }

  event.respondWith((async()=>{
    try{
      const response=await Promise.race([fetch(event.request),timeout(5000)]);
      if(response&&response.ok){
        const cache=await caches.open(CACHE_NAME);
        cache.put(event.request,response.clone());
      }
      return response;
    }catch{
      return (await caches.match(event.request))||Response.error();
    }
  })());
});