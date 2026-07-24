(()=>{
  const $=s=>document.querySelector(s);
  const voiceStatus=$('#voiceStatus');
  const errorBox=$('#errorBox');
  const camera=$('#cameraCard');
  const settings=$('.settings-panel');

  const style=document.createElement('style');
  style.textContent=`
    html,body{scroll-behavior:smooth;overflow-y:auto!important;overscroll-behavior-y:auto}
    .app-shell{padding-bottom:116px!important}
    .bottom-dock{z-index:70}
    .error-box[data-stale-camera-error="1"]{display:none!important}
    @media(max-width:640px){.camera-card{height:auto!important;min-height:52vh}.error-box{font-size:1rem;line-height:1.28;padding:14px}.primary-actions{margin-bottom:12px}}
  `;
  document.head.appendChild(style);

  function cameraIsLive(){
    const video=$('#preview');
    return !!(video?.srcObject&&video.srcObject.getVideoTracks?.().some(t=>t.readyState==='live'));
  }
  function clearStaleError(){
    if(cameraIsLive()&&errorBox&&!errorBox.hidden){
      errorBox.hidden=true;
      errorBox.textContent='';
      errorBox.dataset.staleCameraError='1';
    }
  }
  setInterval(clearStaleError,700);
  $('#preview')?.addEventListener('playing',clearStaleError);

  function setView(name){
    const btn=$(`.compact-nav [data-view="${name}"]`);
    if(btn){btn.click();return true}
    return false;
  }
  function openDrawer(words){
    const terms=Array.isArray(words)?words:[words];
    const drawers=[...document.querySelectorAll('details.compact-section')];
    const found=drawers.find(d=>{
      const label=(d.querySelector('summary')?.textContent||'').toLowerCase();
      return terms.some(t=>label.includes(t));
    });
    drawers.forEach(d=>d.open=d===found);
    if(found){found.classList.remove('app-view-hidden');setTimeout(()=>found.scrollIntoView({behavior:'smooth',block:'start'}),120);return true}
    return false;
  }
  async function ensureCamera(){
    if(cameraIsLive())return true;
    try{if(typeof startCamera==='function')await startCamera();else $('#startBtn')?.click()}catch{}
    setTimeout(clearStaleError,600);
    return cameraIsLive();
  }
  async function forceScanner(color){
    setView('scan');
    const mode=$('#modeSelect');
    if(mode){mode.value='scanner';mode.dispatchEvent(new Event('change',{bubbles:true}))}
    const colorSelect=$('#scanColorSelect');
    if(color&&colorSelect){colorSelect.value=color;colorSelect.dispatchEvent(new Event('change',{bubbles:true}))}
    settings&&(settings.open=true);
    openDrawer(['paperwork scanner','paperwork']);
    await ensureCamera();
    setTimeout(()=>camera?.scrollIntoView({behavior:'smooth',block:'start'}),150);
  }
  function act(raw){
    const c=String(raw||'').toLowerCase().replace(/^heard:\s*/,'').replace(/\b(hey\s+)?(sky|skie)\b/g,'').trim();
    if(!c)return;
    if(/scroll down|go down|move down|next section/.test(c)){window.scrollBy({top:Math.max(360,innerHeight*.7),behavior:'smooth'});return}
    if(/scroll up|go up|move up|previous section/.test(c)){window.scrollBy({top:-Math.max(360,innerHeight*.7),behavior:'smooth'});return}
    if(/top of page|go to top|scroll to top/.test(c)){window.scrollTo({top:0,behavior:'smooth'});return}
    if(/bottom of page|go to bottom|scroll to bottom/.test(c)){window.scrollTo({top:document.documentElement.scrollHeight,behavior:'smooth'});return}
    if(/camera controls|open settings|open controls/.test(c)){setView('camera');if(settings){settings.open=true;setTimeout(()=>settings.scrollIntoView({behavior:'smooth',block:'start'}),100)}return}
    if(/document scanner|paperwork scanner|scan document|document scan/.test(c)){forceScanner();return}
    if(/color scan/.test(c)){forceScanner('color');return}
    if(/gray|grayscale/.test(c)){forceScanner('gray');return}
    if(/black.*white/.test(c)){forceScanner('bw');return}
    if(/open tools|show tools|go to tools/.test(c)){setView('tools');setTimeout(()=>$('.osko-tools')?.scrollIntoView({behavior:'smooth',block:'start'}),100);return}
    if(/open pictures|show pictures|open gallery|show photos/.test(c)){setView('gallery');setTimeout(()=>$('.gallery-section')?.scrollIntoView({behavior:'smooth',block:'start'}),100);return}
    if(/open save|save tools/.test(c)){setView('tools');openDrawer(['save, folders','watermark']);return}
    if(/open notes|show notes/.test(c)){setView('tools');openDrawer(['notes and skie','notes']);return}
    if(/open stickers|open emojis/.test(c)){setView('tools');openDrawer(['emojis and stickers','stickers']);return}
    if(/photo workshop|open workshop/.test(c)){setView('tools');openDrawer(['photo workshop','workshop']);return}
  }

  if(voiceStatus){
    let last='';
    new MutationObserver(()=>{
      const text=voiceStatus.textContent||'';
      if(text===last||!/^Heard:/i.test(text))return;
      last=text;
      act(text);
    }).observe(voiceStatus,{childList:true,subtree:true,characterData:true});
  }

  window.oskoVoiceUiAction=act;
})();