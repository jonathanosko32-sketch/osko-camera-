(()=>{
  const cameraCard=document.getElementById('cameraCard');
  const startBtn=document.getElementById('startBtn');
  const nightToggle=document.getElementById('nightToggle');
  const brightnessRange=document.getElementById('brightnessRange');
  const quickTorchBtn=document.getElementById('quickTorchBtn');
  if(!cameraCard)return;

  const style=document.createElement('style');
  style.textContent=`
    .camera-light-btn{position:absolute;right:12px;bottom:112px;z-index:8;min-height:46px;padding:8px 12px;border-radius:14px;font-weight:800;background:rgba(8,28,42,.92);border:1px solid rgba(255,255,255,.24)}
    .camera-light-btn.active{background:#fff;color:#06131d;box-shadow:0 0 28px rgba(255,255,255,.95)}
    .camera-light-glow{position:absolute;inset:0;pointer-events:none;z-index:1;border-radius:inherit;box-shadow:inset 0 0 0 10px rgba(255,255,255,.92),inset 0 0 46px 22px rgba(255,255,255,.48);display:none}
    .camera-light-glow.active{display:block}
  `;
  document.head.appendChild(style);

  const glow=document.createElement('div');
  glow.className='camera-light-glow';
  const button=document.createElement('button');
  button.type='button';
  button.className='camera-light-btn';
  button.textContent='CAMERA LIGHT';
  cameraCard.append(glow,button);

  let on=false;
  async function ensureCamera(){
    if(typeof stream!=='undefined'&&stream)return true;
    if(typeof startCamera==='function'){
      await startCamera();
      return typeof stream!=='undefined'&&!!stream;
    }
    startBtn?.click();
    return false;
  }
  async function setLight(next){
    on=Boolean(next);
    if(on)await ensureCamera();
    let torchWorked=false;
    if(typeof setRearFlash==='function'){
      try{torchWorked=await setRearFlash(on);}catch{}
    }
    button.classList.toggle('active',on);
    glow.classList.toggle('active',on&&!torchWorked);
    button.textContent=on?'CAMERA LIGHT ON':'CAMERA LIGHT';
    if(on){
      if(nightToggle&&!nightToggle.checked){nightToggle.checked=true;nightToggle.dispatchEvent(new Event('change',{bubbles:true}));}
      if(brightnessRange&&Number(brightnessRange.value)<220){brightnessRange.value='220';brightnessRange.dispatchEvent(new Event('input',{bubbles:true}));}
    }
  }
  button.addEventListener('click',()=>setLight(!on));
  quickTorchBtn?.addEventListener('click',()=>{setTimeout(()=>{on=quickTorchBtn.classList.contains('active');button.classList.toggle('active',on);button.textContent=on?'CAMERA LIGHT ON':'CAMERA LIGHT';},200)});

  window.oskoCameraLight=setLight;
})();