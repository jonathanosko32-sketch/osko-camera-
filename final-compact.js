(()=>{
  const main=document.querySelector('.app-shell');
  const camera=document.getElementById('cameraCard');
  const errorBox=document.getElementById('errorBox');
  const primary=document.querySelector('.primary-actions');
  const settings=document.querySelector('.settings-panel');
  const code=document.getElementById('codeScannerPanel');
  const scans=document.getElementById('scanSession');
  const tools=document.querySelector('.osko-tools');
  const nativeButton=document.querySelector('.native-button');
  const gallerySection=document.querySelector('.gallery-section');
  if(!main||!camera)return;

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
  const universalSection=wrap('Universal code scanner',[code],false);
  const paperworkSection=wrap('Paperwork pages and PDF',[scans],false);

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

  const nav=document.createElement('nav');
  nav.className='compact-nav';
  nav.setAttribute('aria-label','OSKO Camera sections');
  nav.innerHTML='<button type="button" data-view="camera">Camera</button><button type="button" data-view="scan">Scan</button><button type="button" data-view="tools">Tools</button><button type="button" data-view="gallery">Pictures</button>';
  camera.before(nav);

  const cameraItems=[camera,errorBox,primary,settings].filter(Boolean);
  const scanItems=[universalSection,paperworkSection].filter(Boolean);
  const toolItems=[tools,nativeButton].filter(Boolean);
  const galleryItems=[gallerySection].filter(Boolean);
  const groups={camera:cameraItems,scan:scanItems,tools:toolItems,gallery:galleryItems};

  function setView(view,scroll=true){
    Object.entries(groups).forEach(([name,items])=>items.forEach(el=>el.classList.toggle('app-view-hidden',name!==view)));
    nav.querySelectorAll('[data-view]').forEach(btn=>btn.classList.toggle('active',btn.dataset.view===view));
    localStorage.setItem('osko-camera-view',view);
    if(view==='scan'){
      const mode=document.getElementById('modeSelect');
      if(mode&&mode.value!=='codes'&&mode.value!=='scanner'){
        mode.value='codes';
        mode.dispatchEvent(new Event('change'));
      }
    }
    if(scroll)window.scrollTo({top:0,behavior:'smooth'});
  }

  nav.addEventListener('click',e=>{
    const btn=e.target.closest('[data-view]');
    if(btn)setView(btn.dataset.view);
  });

  const mode=document.getElementById('modeSelect');
  mode?.addEventListener('change',()=>{
    if(mode.value==='codes'||mode.value==='scanner')setView('scan',false);
  });

  document.querySelectorAll('.compact-section').forEach(section=>section.addEventListener('toggle',()=>{
    if(!section.open)return;
    document.querySelectorAll('.compact-section').forEach(other=>{if(other!==section)other.open=false;});
  }));

  setView(localStorage.getItem('osko-camera-view')||'camera',false);
  document.documentElement.classList.add('osko-compact-ready');
})();