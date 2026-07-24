(()=>{
  const main=document.querySelector('.app-shell');
  const camera=document.getElementById('cameraCard');
  const settings=document.querySelector('.settings-panel');
  const code=document.getElementById('codeScannerPanel');
  const scans=document.getElementById('scanSession');
  const tools=document.querySelector('.osko-tools');
  const gallerySection=document.querySelector('.gallery-section');
  if(!main||!camera)return;

  function scrollToEl(el){if(!el)return;el.scrollIntoView({behavior:'smooth',block:'start'});}
  const nav=document.createElement('nav');
  nav.className='compact-nav';
  nav.setAttribute('aria-label','OSKO Camera sections');
  nav.innerHTML='<button type="button" data-go="camera">Camera</button><button type="button" data-go="scan">Scan</button><button type="button" data-go="tools">Tools</button><button type="button" data-go="gallery">Pictures</button>';
  camera.before(nav);
  nav.addEventListener('click',e=>{
    const b=e.target.closest('[data-go]'); if(!b)return;
    const go=b.dataset.go;
    if(go==='camera')scrollToEl(camera);
    if(go==='scan'){
      const mode=document.getElementById('modeSelect');
      if(mode){mode.value='scanner';mode.dispatchEvent(new Event('change'));}
      if(settings)settings.open=true;
      scrollToEl(settings||camera);
    }
    if(go==='tools')scrollToEl(tools);
    if(go==='gallery')scrollToEl(gallerySection);
  });

  function wrap(title,nodes,open=false){
    const valid=nodes.filter(Boolean).filter(n=>n.isConnected);
    if(!valid.length)return null;
    const details=document.createElement('details');
    details.className='compact-section';
    details.open=open;
    const summary=document.createElement('summary'); summary.textContent=title;
    const content=document.createElement('div'); content.className='compact-section-content';
    details.append(summary,content);
    valid[0].before(details);
    valid.forEach(n=>content.appendChild(n));
    return details;
  }

  if(settings){settings.open=false;settings.querySelector('summary').textContent='Camera controls';}
  wrap('Universal code scanner',[code],false);
  wrap('Paperwork pages and PDF',[scans],false);

  if(tools){
    const voice=tools.querySelector('.voice-box');
    const stickers=tools.querySelector('.sticker-box');
    const save=document.getElementById('saveWatermarkPanel');
    const workshop=document.querySelector('.photo-workshop');
    const quick=[...tools.children].filter(el=>![voice,stickers,save,workshop].includes(el));
    const holder=document.createElement('div');
    holder.className='compact-section-content';
    quick.forEach(n=>holder.appendChild(n));
    tools.prepend(holder);
    wrap('Notes and Skie',[voice],false);
    wrap('Emojis and stickers',[stickers],false);
    wrap('Save, folders and watermark',[save],false);
    wrap('Photo workshop',[workshop],false);
  }

  const mode=document.getElementById('modeSelect');
  mode?.addEventListener('change',()=>{
    if(mode.value==='codes')setTimeout(()=>scrollToEl(code?.closest('.compact-section')||code),80);
    if(mode.value==='scanner')setTimeout(()=>scrollToEl(settings),80);
  });

  document.documentElement.classList.add('osko-compact-ready');
})();