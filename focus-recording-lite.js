(() => {
  'use strict';

  const card = document.getElementById('cameraCard');
  const preview = document.getElementById('preview');
  const badge = document.getElementById('recordingBadge');
  if (!card || !preview) return;

  let recordingStartedAt = 0;
  let recordingTimer = 0;
  let focusRing = null;

  const style = document.createElement('style');
  style.textContent = `
    .osko-focus-ring{
      position:absolute;width:72px;height:72px;border:3px solid #8eeaff;border-radius:18px;
      box-shadow:0 0 0 2px rgba(0,0,0,.35),0 0 22px rgba(69,211,255,.9);
      transform:translate(-50%,-50%);z-index:55;pointer-events:none;opacity:0;
      transition:opacity .18s ease,transform .18s ease;
    }
    .osko-focus-ring.show{opacity:1;transform:translate(-50%,-50%) scale(.86)}
    .osko-exposure-control{
      position:absolute;right:12px;top:46%;transform:translateY(-50%);z-index:54;
      display:flex;flex-direction:column;align-items:center;gap:5px;padding:8px 6px;
      border-radius:22px;background:rgba(5,20,34,.55);backdrop-filter:blur(7px);
    }
    .osko-exposure-control span{color:#fff;font:800 12px system-ui}
    .osko-exposure-control input{writing-mode:vertical-lr;direction:rtl;width:28px;height:120px}
    .recording-badge{min-width:126px;text-align:center}
  `;
  document.head.appendChild(style);

  focusRing = document.createElement('div');
  focusRing.className = 'osko-focus-ring';
  card.appendChild(focusRing);

  const exposureWrap = document.createElement('label');
  exposureWrap.className = 'osko-exposure-control';
  exposureWrap.hidden = true;
  exposureWrap.innerHTML = '<span>LIGHT</span><input id="oskoExposure" type="range" min="-2" max="2" step="0.1" value="0" aria-label="Exposure adjustment"><span id="oskoExposureValue">0.0</span>';
  card.appendChild(exposureWrap);
  const exposure = exposureWrap.querySelector('input');
  const exposureValue = exposureWrap.querySelector('#oskoExposureValue');

  function status(message){ try{ if(typeof setStatus==='function') setStatus(message); }catch{} }

  function capabilities(){ try{return videoTrack?.getCapabilities?.()||{};}catch{return{};} }

  async function applyExposure(value){
    if(!videoTrack || videoTrack.readyState!=='live') return;
    const caps=capabilities();
    if(!caps.exposureCompensation) return;
    const min=Number(caps.exposureCompensation.min??-2);
    const max=Number(caps.exposureCompensation.max??2);
    const step=Number(caps.exposureCompensation.step??0.1);
    const safe=Math.max(min,Math.min(max,Math.round(Number(value)/step)*step));
    exposure.value=String(safe);
    exposureValue.textContent=safe.toFixed(1);
    try{
      await videoTrack.applyConstraints({advanced:[{exposureCompensation:safe}]});
      status(`Light ${safe>0?'+':''}${safe.toFixed(1)}`);
    }catch(error){console.debug('OSKO exposure adjustment unavailable',error);}
  }

  function refreshExposure(){
    const caps=capabilities();
    const available=Boolean(caps.exposureCompensation);
    exposureWrap.hidden=!available;
    if(available){
      exposure.min=String(caps.exposureCompensation.min??-2);
      exposure.max=String(caps.exposureCompensation.max??2);
      exposure.step=String(caps.exposureCompensation.step??0.1);
      const current=Number(videoTrack?.getSettings?.().exposureCompensation??0);
      exposure.value=String(current);
      exposureValue.textContent=current.toFixed(1);
    }
  }

  exposure.addEventListener('input',()=>applyExposure(exposure.value));

  async function tapFocus(event){
    if(!stream || !videoTrack || recorder?.state==='recording') return;
    const rect=card.getBoundingClientRect();
    const x=event.clientX-rect.left;
    const y=event.clientY-rect.top;
    if(event.target.closest('button,input,label,.osko-quick-zoom,.viewfinder-controls')) return;
    focusRing.style.left=`${x}px`;
    focusRing.style.top=`${y}px`;
    focusRing.classList.add('show');
    setTimeout(()=>focusRing.classList.remove('show'),850);

    const caps=capabilities();
    const nx=Math.max(0,Math.min(1,x/rect.width));
    const ny=Math.max(0,Math.min(1,y/rect.height));
    const attempts=[];
    if(Array.isArray(caps.focusMode)&&caps.focusMode.includes('single-shot')) attempts.push({focusMode:'single-shot'});
    if(Array.isArray(caps.focusMode)&&caps.focusMode.includes('continuous')) attempts.push({focusMode:'continuous'});
    if(caps.pointsOfInterest) attempts.unshift({pointsOfInterest:[{x:nx,y:ny}],focusMode:'single-shot'});
    for(const constraint of attempts){
      try{await videoTrack.applyConstraints({advanced:[constraint]});status('Focused');return;}catch{}
    }
    status('Focus point selected');
  }

  card.addEventListener('pointerup',tapFocus);

  function formatTime(ms){
    const total=Math.max(0,Math.floor(ms/1000));
    const m=Math.floor(total/60).toString().padStart(2,'0');
    const s=(total%60).toString().padStart(2,'0');
    return `${m}:${s}`;
  }

  function stopRecordingClock(){
    clearInterval(recordingTimer);recordingTimer=0;recordingStartedAt=0;
    if(badge && !badge.hidden) badge.textContent='● Recording';
  }

  function startRecordingClock(){
    stopRecordingClock();recordingStartedAt=Date.now();
    recordingTimer=setInterval(()=>{
      if(!recorder || !badge) return;
      if(recorder.state==='recording'){
        badge.hidden=false;
        badge.textContent=`● ${formatTime(Date.now()-recordingStartedAt)}`;
      }else if(recorder.state==='paused'){
        badge.hidden=false;
        badge.textContent=`Ⅱ ${formatTime(Date.now()-recordingStartedAt)}`;
      }else stopRecordingClock();
    },500);
  }

  let watchedRecorder=null;
  setInterval(()=>{
    refreshExposure();
    if(recorder && recorder!==watchedRecorder){
      watchedRecorder=recorder;
      recorder.addEventListener('start',startRecordingClock);
      recorder.addEventListener('stop',stopRecordingClock);
      recorder.addEventListener('error',stopRecordingClock);
      if(recorder.state==='recording') startRecordingClock();
    }
  },900);

  window.oskoFocusExposure={refresh:refreshExposure,exposure:applyExposure};
  status('Tap focus and recording timer ready');
})();