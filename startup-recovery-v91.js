(()=>{
  'use strict';

  const gate=document.getElementById('crystalGate');
  const enter=document.getElementById('crystalEnter');
  const preview=document.getElementById('preview');
  if(!gate||!enter||!preview)return;

  let opening=false;

  const liveCamera=()=>{
    const media=preview.srcObject;
    return Boolean(media&&media.getVideoTracks?.().some(track=>track.readyState==='live'));
  };

  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

  async function openCameraSafely(event){
    event?.preventDefault?.();
    event?.stopImmediatePropagation?.();
    if(opening)return;

    opening=true;
    enter.disabled=true;
    enter.textContent='OPENING…';
    gate.hidden=false;
    gate.classList.remove('is-closing');
    gate.classList.add('is-open');

    try{
      if(!liveCamera()){
        if(typeof startCamera!=='function')throw new Error('Camera starter is unavailable');
        await Promise.race([
          Promise.resolve(startCamera()),
          wait(10000).then(()=>{throw new Error('Camera startup timed out');})
        ]);
      }

      await wait(650);
      if(!liveCamera())throw new Error('Camera did not become active');

      gate.hidden=true;
      gate.classList.remove('is-open','is-closing');
      enter.textContent='START CAMERA';
      try{if(typeof setStatus==='function')setStatus('OSKO Camera ready');}catch{}
    }catch(error){
      console.error('OSKO startup recovery:',error);
      gate.hidden=false;
      gate.classList.remove('is-open','is-closing');
      enter.textContent='TRY CAMERA AGAIN';
      try{if(typeof showError==='function')showError('Camera did not open. Allow camera permission, then tap Try Camera Again.');}catch{}
    }finally{
      enter.disabled=false;
      opening=false;
    }
  }

  // Capture phase prevents older startup handlers from fighting this repair.
  enter.addEventListener('click',openCameraSafely,true);

  // Never leave the installed app on an unresponsive splash/heart screen.
  setTimeout(()=>{
    if(gate.hidden||liveCamera())return;
    enter.disabled=false;
    if(enter.textContent==='OPENING…')enter.textContent='TRY CAMERA AGAIN';
  },12000);

  window.oskoStartupRecovery={open:openCameraSafely,isLive:liveCamera};
})();