(()=>{
  const md=navigator.mediaDevices;
  if(!md?.getUserMedia||md.getUserMedia.__oskoWrapped)return;
  const original=md.getUserMedia.bind(md);
  const wrapped=async constraints=>{
    let next=constraints;
    try{
      if(constraints&&constraints.video&&constraints.audio){
        next={...constraints,audio:false};
      }
    }catch{}
    return original(next);
  };
  wrapped.__oskoWrapped=true;
  try{md.getUserMedia=wrapped;}catch{}

  const note=document.createElement('div');
  note.id='oskoVoiceCameraNote';
  note.style.cssText='position:fixed;left:12px;right:12px;bottom:86px;z-index:9998;padding:10px 12px;border-radius:12px;background:rgba(4,22,35,.95);border:1px solid rgba(80,205,255,.45);color:#dff6ff;font-weight:700;text-align:center;display:none';
  document.body.appendChild(note);
  let timer;
  function show(msg){clearTimeout(timer);note.textContent=msg;note.style.display='block';timer=setTimeout(()=>note.style.display='none',2600)}
  window.addEventListener('osko-voice-view-change',e=>show(e.detail||'Sky switched sections'));
})();
