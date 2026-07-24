(()=>{
  const shell=document.querySelector('.app-shell');
  if(!shell)return;

  const bar=document.createElement('div');
  bar.className='osko-compact-bar';
  bar.innerHTML=`
    <button type="button" data-jump="cameraCard">Camera</button>
    <button type="button" data-jump="codeScannerPanel">Scan</button>
    <button type="button" data-jump="saveWatermarkPanel">Save</button>
    <button type="button" class="install-app" id="installOskoBtn">Install</button>`;
  const topbar=document.querySelector('.topbar');
  topbar?.after(bar);

  bar.addEventListener('click',e=>{
    const btn=e.target.closest('[data-jump]');
    if(!btn)return;
    const id=btn.dataset.jump;
    if(id==='codeScannerPanel'){
      const mode=document.getElementById('modeSelect');
      if(mode){mode.value='codes';mode.dispatchEvent(new Event('change'));}
    }
    const target=document.getElementById(id);
    target?.scrollIntoView({behavior:'smooth',block:'start'});
  });

  const tools=document.querySelector('.osko-tools');
  if(tools){
    [...tools.children].forEach((child,index)=>{
      if(index<4||child.id==='quickStatus')return;
      child.dataset.oskoToolBody='1';
    });
    const toggle=document.createElement('button');
    toggle.type='button';
    toggle.className='osko-panel-toggle';
    toggle.innerHTML='<span>More camera tools</span><span>⌄</span>';
    const marker=[...tools.children].find(el=>el.dataset.oskoToolBody==='1');
    marker?.before(toggle);
    let open=localStorage.getItem('osko-tools-open')==='1';
    const apply=()=>{
      tools.querySelectorAll('[data-osko-tool-body="1"]').forEach(el=>el.classList.toggle('osko-collapsed',!open));
      toggle.lastElementChild.textContent=open?'⌃':'⌄';
      toggle.firstElementChild.textContent=open?'Hide extra tools':'More camera tools';
    };
    toggle.addEventListener('click',()=>{open=!open;localStorage.setItem('osko-tools-open',open?'1':'0');apply();});
    apply();
  }

  const settings=document.querySelector('.settings-panel');
  if(settings&&window.innerWidth<560&&!sessionStorage.getItem('osko-settings-seen'))settings.open=false;
  settings?.addEventListener('toggle',()=>{if(settings.open)sessionStorage.setItem('osko-settings-seen','1');});

  let deferredPrompt=null;
  const installBtn=document.getElementById('installOskoBtn');
  const standalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  if(standalone&&installBtn){installBtn.textContent='Installed';installBtn.disabled=true;}
  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();
    deferredPrompt=event;
    if(installBtn){installBtn.disabled=false;installBtn.textContent='Install';}
  });
  installBtn?.addEventListener('click',async()=>{
    if(standalone)return;
    if(deferredPrompt){
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt=null;
      return;
    }
    alert('In Chrome, tap the three-dot menu and choose Add to Home screen or Install app.');
  });
})();