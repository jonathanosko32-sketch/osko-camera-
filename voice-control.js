(()=>{
  const $=s=>document.querySelector(s);
  const voiceBtn=$('#voiceCommandBtn');
  const voiceStatus=$('#voiceStatus');
  if(!voiceBtn)return;

  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  const WAKE_KEY='osko-sky-hands-free-v1';
  let recognition=null,listening=false,handsFree=localStorage.getItem(WAKE_KEY)==='1',restarting=false;
  let pendingPhoto=false,photoTimer=null,scanTimer=null;

  function status(message){if(voiceStatus)voiceStatus.textContent=message;if(typeof setStatus==='function')setStatus(message)}
  function updateButton(){voiceBtn.textContent=handsFree?(listening?'Sky listening':'Start Sky listening'):'Enable hands-free Sky';voiceBtn.classList.toggle('active',listening)}
  function stopRecognition(){try{recognition?.stop()}catch{}}
  function restartSoon(delay=350){if(!handsFree||document.hidden||restarting)return;restarting=true;setTimeout(()=>{restarting=false;if(!handsFree||document.hidden||listening)return;try{recognition.start()}catch{}},delay)}
  // Silent mode: confirmations stay on screen. Sky does not speak or make app sounds while listening/scanning.
  function speak(message){status(message)}
  function click(id){const el=document.getElementById(id);if(!el)return false;el.click();return true}
  function setMode(value){const mode=$('#modeSelect');if(!mode)return false;mode.value=value;mode.dispatchEvent(new Event('change',{bubbles:true}));return true}
  function sectionFor(selector){return $(selector)?.closest('.compact-section')||$(selector)}
  function closeAllDrawers(){document.querySelectorAll('details.compact-section').forEach(d=>d.open=false)}
  function openDrawerByText(words){const terms=Array.isArray(words)?words:[words];const drawer=[...document.querySelectorAll('details.compact-section')].find(d=>{const t=(d.querySelector('summary')?.textContent||'').toLowerCase();return terms.some(word=>t.includes(word))});if(drawer){closeAllDrawers();drawer.open=true;drawer.classList.remove('app-view-hidden');return drawer}return null}
  function setView(view){const camera=$('#cameraCard'),error=$('#errorBox'),primary=$('.primary-actions'),settings=$('.settings-panel');const code=sectionFor('#codeScannerPanel'),paper=sectionFor('.scanner-quick-panel');const tools=$('.osko-tools'),native=$('.native-button'),gallery=$('.gallery-section');const map=new Map([[camera,new Set(['camera','scan'])],[error,new Set(['camera','scan'])],[primary,new Set(['camera','scan'])],[settings,new Set(['camera','scan'])],[code,new Set(['scan'])],[paper,new Set(['scan'])],[tools,new Set(['tools'])],[native,new Set(['tools'])],[gallery,new Set(['gallery'])]]);map.forEach((allowed,el)=>{if(el)el.classList.toggle('app-view-hidden',!allowed.has(view))});document.querySelectorAll('.compact-nav [data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));localStorage.setItem('osko-camera-view',view)}
  function moveTo(el){setTimeout(()=>el?.scrollIntoView({behavior:'smooth',block:'start'}),120)}
  async function ensureCamera(){if(typeof stream!=='undefined'&&stream)return true;if(typeof startCamera==='function'){await startCamera();return typeof stream!=='undefined'&&!!stream}click('startBtn');return false}
  async function bringCameraUp(){closeAllDrawers();setView('camera');const ok=await ensureCamera();moveTo($('#cameraCard'));status(ok?'Camera is up':'Tap Start and allow camera permission');return ok}
  async function openPaperScanner(color){setView('scan');const drawer=openDrawerByText(['paperwork scanner','paperwork']);setMode('scanner');const colorSelect=$('#scanColorSelect');if(colorSelect&&color){colorSelect.value=color;colorSelect.dispatchEvent(new Event('change',{bubbles:true}))}const ok=await ensureCamera();drawer?.classList.remove('app-view-hidden');moveTo($('#cameraCard'));status(ok?'Paperwork scanner ready':'Allow camera permission');return ok}
  function openToolsDrawer(words,label){setView('tools');const drawer=openDrawerByText(words);moveTo(drawer||$('.osko-tools'));status(`${label} open`)}
  function cancelPending(message='Canceled'){pendingPhoto=false;clearTimeout(photoTimer);clearTimeout(scanTimer);photoTimer=scanTimer=null;status(message)}

  async function takeDirectPhoto(){cancelPending('Camera opening');const ok=await bringCameraUp();if(!ok){status('Please allow camera permission');return}status('Taking picture in 3 seconds');photoTimer=setTimeout(async()=>{if(typeof takePhoto==='function')await takePhoto();status('Picture taken')},3000)}
  async function armPhoto(){await bringCameraUp();pendingPhoto=true;status('Say “Sky, take it” when ready')}
  async function takeConfirmedPhoto(){if(!pendingPhoto){await armPhoto();return}pendingPhoto=false;status('Taking picture in 3 seconds');photoTimer=setTimeout(async()=>{if(typeof takePhoto==='function')await takePhoto();status('Picture taken')},3000)}
  async function scanPaperNow(color){cancelPending('Opening paperwork scanner');const ok=await openPaperScanner(color);if(!ok){status('Please allow camera permission');return}status('Hold steady — scanning in 4 seconds');scanTimer=setTimeout(async()=>{if(typeof captureNow==='function')await captureNow(true);status('Paper scanned')},4000)}

  async function run(spoken){
    const original=String(spoken||'').trim(),lower=original.toLowerCase();
    if(!/\b(hey\s+)?(sky|skie)\b/.test(lower))return;
    const c=lower.replace(/\b(hey\s+)?(sky|skie)\b/g,'').trim();if(!c)return;status(`Heard: ${original}`);

    if(/stop listening|go to sleep|quit listening/.test(c)){handsFree=false;localStorage.setItem(WAKE_KEY,'0');stopRecognition();updateButton();status('Sky listening off');return}
    if(/cancel|never mind/.test(c)){cancelPending();return}
    if(/close everything|collapse everything|hide everything/.test(c)){cancelPending();closeAllDrawers();setView('camera');moveTo($('#cameraCard'));status('Everything closed');return}
    if(/(open|bring|show).*(camera).*(take|snap|capture).*(picture|photo)|(take|snap|capture).*(picture|photo).*(open|bring|show).*(camera)/.test(c)){await takeDirectPhoto();return}
    if(/(open|show|go to).*(document scanner|paperwork scanner|scan document|document scan)/.test(c)){await scanPaperNow();return}
    if(/color scan/.test(c)){await scanPaperNow('color');return}
    if(/gray|grayscale/.test(c)){await scanPaperNow('gray');return}
    if(/black.*white/.test(c)){await scanPaperNow('bw');return}
    if(/scan it|scan paper|scan page|capture page|add page/.test(c)){await scanPaperNow();return}
    if(/bring.*camera.*up|camera.*up|open.*camera|show.*camera|go to.*camera/.test(c)){cancelPending('Camera selected');await bringCameraUp();return}
    if(/close.*camera|turn.*camera.*off|stop.*camera/.test(c)){cancelPending();if(typeof stream!=='undefined'&&stream&&typeof stopCamera==='function')await stopCamera();setView('camera');moveTo($('#cameraCard'));status('Camera stopped');return}
    if(/get ready.*picture|ready.*picture|prepare.*picture/.test(c)){await armPhoto();return}
    if(/take.*picture|take.*photo|snap.*picture|capture.*photo/.test(c)){await takeDirectPhoto();return}
    if(/take it|snap it|shoot now|take now/.test(c)){await takeConfirmedPhoto();return}
    if(/open|show|go to/.test(c)&&/(universal|barcode|qr|code scanner)/.test(c)){setView('scan');openDrawerByText(['universal code','code scanner']);setMode('codes');await ensureCamera();moveTo($('#cameraCard'));status('Code scanner open');return}
    if(/open|show|go to/.test(c)&&/scan/.test(c)){await scanPaperNow();return}
    if(/open|show|go to/.test(c)&&/(pictures|gallery|photos)/.test(c)){cancelPending();closeAllDrawers();setView('gallery');moveTo($('.gallery-section'));status('Pictures open');return}
    if(/open|show|go to/.test(c)&&/tools/.test(c)){cancelPending();closeAllDrawers();setView('tools');moveTo($('.osko-tools'));status('Tools open');return}
    if(/open|show|go to/.test(c)&&/save/.test(c)){openToolsDrawer(['save, folders','watermark'],'Save tools');return}
    if(/open|show|go to/.test(c)&&/notes?/.test(c)){openToolsDrawer(['notes and skie','notes'],'Notes');return}
    if(/open|show|go to/.test(c)&&/(stickers?|emojis?)/.test(c)){openToolsDrawer(['emojis and stickers','stickers'],'Stickers');return}
    if(/open|show|go to/.test(c)&&/(photo workshop|workshop)/.test(c)){openToolsDrawer(['photo workshop','workshop'],'Photo workshop');return}
    if(/close|hide/.test(c)&&/(tools|pictures|scanner|scan|notes|stickers|save|workshop)/.test(c)){closeAllDrawers();setView('camera');moveTo($('#cameraCard'));status('Closed');return}
    if(/start|record/.test(c)&&/video/.test(c)){await bringCameraUp();if(typeof toggleRecording==='function')toggleRecording();status('Video recording');return}
    if(/stop/.test(c)&&/(video|recording)/.test(c)){if(typeof toggleRecording==='function')toggleRecording();status('Video stopped');return}
    if(/flip|switch/.test(c)&&/(camera|view)/.test(c)){if(typeof switchCamera==='function')await switchCamera();status('Camera switched');return}
    if(/flash|torch|rear light/.test(c)&&/on/.test(c)){if(typeof setRearFlash==='function')await setRearFlash(true);status('Rear light on');return}
    if(/flash|torch|rear light/.test(c)&&/off/.test(c)){if(typeof setRearFlash==='function')await setRearFlash(false);status('Rear light off');return}
    if(/normal mode|modern mode|2026/.test(c)){setView('camera');setMode('normal');status('Normal mode');return}
    if(/80s|eighties/.test(c)){setView('camera');setMode('eighties');status('Eighties mode');return}
    if(/document mode/.test(c)){setView('camera');setMode('document');status('Document mode');return}
    if(/night|dark walk/.test(c)){setView('camera');setMode('night');status('Night mode');return}
    if(/save last|save picture|save photo/.test(c)){openToolsDrawer(['save, folders','watermark'],'Save tools');click('saveLastBtn');return}
    status('I did not recognize that Sky command');
  }

  if(!Recognition){voiceBtn.disabled=true;status('Hands-free voice needs Chrome speech support');return}
  recognition=new Recognition();recognition.lang='en-US';recognition.interimResults=false;recognition.continuous=true;
  recognition.onstart=()=>{listening=true;updateButton();status('Sky is listening silently')};
  recognition.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++){if(e.results[i].isFinal)run(e.results[i][0].transcript).catch(err=>{console.error(err);status('Voice command failed')})}};
  recognition.onerror=e=>{if(e.error==='not-allowed'||e.error==='service-not-allowed'){handsFree=false;localStorage.setItem(WAKE_KEY,'0');status('Microphone permission is blocked')}else if(e.error!=='no-speech'&&e.error!=='aborted')status(`Voice error: ${e.error}`)};
  recognition.onend=()=>{listening=false;updateButton();restartSoon(350)};
  voiceBtn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();handsFree=!handsFree;localStorage.setItem(WAKE_KEY,handsFree?'1':'0');if(handsFree){status('Hands-free Sky enabled — silent listening');restartSoon(20)}else{stopRecognition();status('Sky listening off')}updateButton()},true);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopRecognition();else restartSoon(250)});
  window.oskoRunVoiceCommand=run;updateButton();if(handsFree)restartSoon(500);
})();