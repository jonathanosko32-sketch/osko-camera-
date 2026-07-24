(()=>{
  const DB_NAME='osko-camera-library';
  const STORE='captures';
  const MAX_ITEMS=80;

  function openDb(){
    return new Promise((resolve,reject)=>{
      const request=indexedDB.open(DB_NAME,1);
      request.onupgradeneeded=()=>{
        const db=request.result;
        if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id',autoIncrement:true});
      };
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error);
    });
  }

  async function saveCapture(item){
    if(!item?.blob)return;
    try{
      const db=await openDb();
      const tx=db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).add({
        created:Date.now(),
        blob:item.blob,
        type:item.type,
        filename:item.filename,
        mode:item.mode||''
      });
      await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
      const cleanup=db.transaction(STORE,'readwrite');
      const store=cleanup.objectStore(STORE);
      const all=store.getAllKeys();
      all.onsuccess=()=>{
        const keys=all.result||[];
        while(keys.length>MAX_ITEMS)store.delete(keys.shift());
      };
    }catch(error){console.warn('OSKO library save failed',error);}
  }

  async function loadLibrary(){
    try{
      const db=await openDb();
      const tx=db.transaction(STORE,'readonly');
      const req=tx.objectStore(STORE).getAll();
      const rows=await new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error);});
      rows.sort((a,b)=>a.created-b.created);
      for(const row of rows){
        if(typeof addCapture==='function')addCapture(row.blob,row.type,row.filename?.split('.').pop()||'jpg',row.mode||'saved');
      }
      if(rows.length&&typeof setStatus==='function')setStatus(`${rows.length} saved picture${rows.length===1?'':'s'} loaded`);
    }catch(error){console.warn('OSKO library load failed',error);}
  }

  if(typeof addCapture==='function'){
    const original=addCapture;
    let restoring=true;
    window.addCapture=function(blob,type,ext,mode){
      original(blob,type,ext,mode);
      const item=typeof captures!=='undefined'?captures[0]:null;
      if(!restoring&&item)saveCapture(item);
    };
    loadLibrary().finally(()=>{restoring=false;});
  }

  document.addEventListener('click',async event=>{
    const clear=event.target.closest('#clearBtn');
    if(!clear)return;
    try{
      const db=await openDb();
      const tx=db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).clear();
    }catch(error){console.warn('OSKO library clear failed',error);}
  },true);
})();
