(()=>{
  const $=s=>document.querySelector(s);
  const removeOldBars=()=>document.querySelectorAll('.osko-compact-bar').forEach(el=>el.remove());
  removeOldBars(); setTimeout(removeOldBars,100); setTimeout(removeOldBars,800);

  const toast=document.createElement('div');
  toast.id='oskoHotfixToast';
  toast.style.cssText='position:fixed;left:14px;right:14px;bottom:92px;z-index:9999;padding:13px 15px;border-radius:14px;background:rgba(2,17,29,.96);border:1px solid rgba(80,205,255,.55);color:#fff;font-weight:700;text-align:center;box-shadow:0 12px 32px rgba(0,0,0,.4);display:none';
  document.body.appendChild(toast);
  let toastTimer;
  function show(message){clearTimeout(toastTimer);toast.textContent=message;toast.style.display='block';toastTimer=setTimeout(()=>toast.style.display='none',3200);}

  let switchingView=false;
  function chooseView(name){
    const btn=document.querySelector(`.compact-nav [data-view="${name}"]`);
    if(!btn||btn.classList.contains('active')||switchingView)return;
    switchingView=true;
    btn.click();
    setTimeout(()=>switchingView=false,80);
  }

  function revealCamera(){
    $('#cameraCard')?.classList.remove('app-view-hidden');
    $('#errorBox')?.classList.remove('app-view-hidden');
    $('.primary-actions')?.classList.remove('app-view-hidden');
    $('.settings-panel')?.classList.remove('app-view-hidden');
  }

  let openingCamera=false;
  async function ensureCamera(){
    revealCamera();
    if(typeof stream!=='undefined'&&stream)return true;
    if(openingCamera)return false;
    openingCamera=true;
    try{
      if(typeof startCamera==='function')await startCamera();
      else $('#startBtn')?.click();
      return typeof stream!=='undefined'&&Boolean(stream);
    }catch(e){console.warn(e);return false}
    finally{openingCamera=false}
  }

  async function openCamera(modeValue){
    chooseView('scan');
    revealCamera();
    const mode=$('#modeSelect');
    if(modeValue&&mode&&mode.value!==modeValue){
      mode.value=modeValue;
      mode.dispatchEvent(new Event('change',{bubbles:true}));
    }
    const ready=await ensureCamera();
    show(ready?'Camera ready':'Tap Start and allow camera permission');
    setTimeout(()=>$('#cameraCard')?.scrollIntoView({behavior:'smooth',block:'start'}),120);
  }

  const scanPanel=$('.scanner-quick-panel');
  if(scanPanel&&!$('#paperCameraBtn')){
    const b=document.createElement('button');b.id='paperCameraBtn';b.type='button';b.textContent='Open paperwork camera';
    b.style.cssText='width:100%;margin-top:10px;min-height:52px;font-weight:800';
    b.addEventListener('click',()=>openCamera('scanner'));
    scanPanel.appendChild(b);
  }
  document.querySelectorAll('[data-scan-quick]').forEach(b=>b.addEventListener('click',()=>openCamera('scanner')));
  document.querySelector('.compact-nav [data-view="scan"]')?.addEventListener('click',()=>{
    revealCamera();
    setTimeout(async()=>{
      const ready=await ensureCamera();
      if(!ready)show('Tap Start and allow camera permission');
    },120);
  });

  const needsPhoto=new Set(['beforeAfterBtn','damageBtn','websiteSetBtn']);
  document.addEventListener('click',e=>{
    const b=e.target.closest('button'); if(!b)return;
    if(needsPhoto.has(b.id)){
      const has=typeof captures!=='undefined'&&captures.some(c=>c.type==='photo');
      if(!has){
        e.preventDefault();e.stopImmediatePropagation();
        show('Take a photo first — opening camera');
        chooseView('camera');
        setTimeout(async()=>{await ensureCamera();$('#cameraCard')?.scrollIntoView({behavior:'smooth',block:'start'})},120);
      }
    }
    if(b.id==='jobProofBtn'){
      show('Job Proof Mode turned on');
      chooseView('camera');
      setTimeout(async()=>{await ensureCamera();$('#cameraCard')?.scrollIntoView({behavior:'smooth',block:'start'})},120);
    }
    if(b.id==='auroraBurstBtn'&&(typeof stream==='undefined'||!stream)){
      e.preventDefault();e.stopImmediatePropagation();
      show('Start camera first — opening camera');
      chooseView('camera');
      setTimeout(async()=>{await ensureCamera();$('#cameraCard')?.scrollIntoView({behavior:'smooth',block:'start'})},120);
    }
    if(b.id==='backupBtn')show('Preparing backup file');
    if(b.id==='voiceCaptionBtn')show('Allow microphone, then speak your caption');
    if(b.id==='saveProofPackageBtn')show('Preparing proof summary');
  },true);

  window.addEventListener('error',e=>{console.warn('OSKO camera error:',e.message);show(`Button error: ${e.message}`)});
  window.addEventListener('unhandledrejection',e=>{console.warn('OSKO camera promise error:',e.reason);show('A camera action failed — tap Start and try again')});
})();