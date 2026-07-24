(()=>{
  const preview=document.getElementById('preview');
  const cameraCard=document.getElementById('cameraCard');
  const settings=document.querySelector('.quick-tools');
  const status=document.getElementById('status');
  if(!preview||!cameraCard||!settings)return;

  const focusRing=document.createElement('div');
  focusRing.className='focus-ring';
  focusRing.hidden=true;
  cameraCard.appendChild(focusRing);

  const panel=document.createElement('div');
  panel.className='focus-exposure-tools';
  panel.innerHTML=`
    <label class="tool-row">Exposure <input id="exposureRange" type="range" min="-2" max="2" step="0.1" value="0" disabled><span id="exposureValue">0.0</span></label>
    <label class="toggle"><input id="brightProtectToggle" type="checkbox"><span>Protect bright areas</span></label>
    <label class="toggle"><input id="macroToggle" type="checkbox"><span>Close-up / macro</span></label>
    <p class="focus-help">Tap the picture where you want the camera to focus.</p>`;
  settings.insertBefore(panel,settings.children[2]||null);

  const exposureRange=document.getElementById('exposureRange');
  const exposureValue=document.getElementById('exposureValue');
  const brightProtectToggle=document.getElementById('brightProtectToggle');
  const macroToggle=document.getElementById('macroToggle');

  const track=()=>preview.srcObject?.getVideoTracks?.()[0]||null;
  const caps=()=>track()?.getCapabilities?.()||{};
  const settingsNow=()=>track()?.getSettings?.()||{};
  const setStatus=m=>{if(status)status.textContent=m};

  function refresh(){
    const c=caps(),s=settingsNow();
    if(c.exposureCompensation){
      exposureRange.min=c.exposureCompensation.min;
      exposureRange.max=c.exposureCompensation.max;
      exposureRange.step=c.exposureCompensation.step||0.1;
      exposureRange.value=s.exposureCompensation??0;
      exposureRange.disabled=false;
    }else exposureRange.disabled=true;
    exposureValue.textContent=Number(exposureRange.value).toFixed(1);
    macroToggle.disabled=!(c.focusMode?.includes?.('continuous')||c.focusDistance);
  }

  async function applyExposure(value){
    const t=track(); if(!t)return;
    try{
      await t.applyConstraints({advanced:[{exposureMode:'continuous',exposureCompensation:Number(value)}]});
      exposureValue.textContent=Number(value).toFixed(1);
      setStatus('Exposure adjusted');
    }catch{setStatus('Exposure control unavailable');}
  }

  async function applyBrightProtection(){
    if(!brightProtectToggle.checked)return applyExposure(exposureRange.value);
    const min=Number(exposureRange.min||-2),protectedValue=Math.max(min,-0.7);
    exposureRange.value=protectedValue;
    await applyExposure(protectedValue);
    setStatus('Bright-area protection on');
  }

  async function applyMacro(){
    const t=track(); if(!t)return;
    try{
      const c=caps(),advanced=[];
      if(macroToggle.checked){
        if(c.focusMode?.includes?.('continuous'))advanced.push({focusMode:'continuous'});
        if(c.focusDistance)advanced.push({focusDistance:c.focusDistance.min});
      }else if(c.focusMode?.includes?.('continuous'))advanced.push({focusMode:'continuous'});
      if(advanced.length)await t.applyConstraints({advanced});
      setStatus(macroToggle.checked?'Close-up mode on':'Close-up mode off');
    }catch{setStatus('Close-up control unavailable');}
  }

  async function tapFocus(e){
    const t=track(); if(!t||!preview.videoWidth)return;
    const r=preview.getBoundingClientRect();
    const x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));
    const y=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));
    focusRing.hidden=false;
    focusRing.style.left=`${x*100}%`;
    focusRing.style.top=`${y*100}%`;
    focusRing.classList.remove('focus-pop'); void focusRing.offsetWidth; focusRing.classList.add('focus-pop');
    setTimeout(()=>focusRing.hidden=true,900);
    try{
      const c=caps(),advanced=[];
      if(c.pointsOfInterest)advanced.push({pointsOfInterest:[{x,y}]});
      if(c.focusMode?.includes?.('single-shot'))advanced.push({focusMode:'single-shot'});
      else if(c.focusMode?.includes?.('continuous'))advanced.push({focusMode:'continuous'});
      if(advanced.length)await t.applyConstraints({advanced});
      setStatus('Focused');
    }catch{setStatus('Tap focus marked');}
  }

  exposureRange.addEventListener('input',()=>applyExposure(exposureRange.value));
  brightProtectToggle.addEventListener('change',applyBrightProtection);
  macroToggle.addEventListener('change',applyMacro);
  preview.addEventListener('pointerup',tapFocus);
  preview.addEventListener('loadedmetadata',()=>setTimeout(refresh,250));
  document.getElementById('switchBtn')?.addEventListener('click',()=>setTimeout(refresh,900));
  document.getElementById('startBtn')?.addEventListener('click',()=>setTimeout(refresh,900));
  setInterval(()=>{if(track()&&!exposureRange.dataset.ready){refresh();exposureRange.dataset.ready='1'}if(!track())delete exposureRange.dataset.ready;},1200);
})();
