(()=>{
  const old=document.getElementById('voiceCommandBtn');
  const statusEl=document.getElementById('voiceStatus');
  if(!old)return;

  const button=old.cloneNode(true);old.replaceWith(button);
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  const KEY='osko-sky-single-v4';
  let recognition=null,listening=false,restartTimer=null,starting=false,enabled=false;
  let scrollAnimation=null;

  const floating=document.createElement('button');
  floating.type='button';floating.id='skyFloatingButton';floating.textContent='SKY';floating.setAttribute('aria-label','Start Sky voice control');
  floating.style.cssText='position:fixed;right:16px;bottom:92px;z-index:10002;width:68px;height:68px;border-radius:50%;border:2px solid rgba(110,220,255,.7);background:#123a52;color:white;font-weight:900;font-size:18px;box-shadow:0 8px 24px rgba(0,0,0,.45)';
  document.body.appendChild(floating);

  const status=m=>{if(statusEl)statusEl.textContent=m;if(typeof setStatus==='function')setStatus(m)};
  const speak=text=>{try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=.95;speechSynthesis.speak(u)}catch{}};
  const setMode=value=>{const m=document.getElementById('modeSelect');if(!m)return false;m.value=value;m.dispatchEvent(new Event('change',{bubbles:true}));return true};
  const setChecked=(id,value)=>{const el=document.getElementById(id);if(!el)return false;el.checked=value;el.dispatchEvent(new Event('change',{bubbles:true}));return true};
  const setRange=(id,value)=>{const el=document.getElementById(id);if(!el)return false;const min=Number(el.min||value),max=Number(el.max||value);el.value=String(Math.max(min,Math.min(max,value)));el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));return true};
  const setSelect=(id,value)=>{const el=document.getElementById(id);if(!el)return false;el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));return true};
  const sectionFor=selector=>document.querySelector(selector)?.closest('details.compact-section')||document.querySelector(selector);
  const closeDrawers=()=>document.querySelectorAll('details.compact-section').forEach(d=>d.open=false);
  const openDrawer=words=>{const terms=Array.isArray(words)?words:[words];const d=[...document.querySelectorAll('details.compact-section')].find(x=>terms.some(t=>(x.querySelector('summary')?.textContent||'').toLowerCase().includes(t)));if(d){closeDrawers();d.open=true;d.classList.remove('app-view-hidden')}return d};
  const move=el=>setTimeout(()=>el?.scrollIntoView({behavior:'smooth',block:'start'}),100);

  function smoothScrollBy(distance,duration=700){
    if(scrollAnimation)cancelAnimationFrame(scrollAnimation);
    const start=window.scrollY,max=Math.max(0,document.documentElement.scrollHeight-innerHeight),target=Math.max(0,Math.min(max,start+distance)),change=target-start,started=performance.now();
    const step=now=>{const p=Math.min(1,(now-started)/duration);window.scrollTo(0,start+change*(1-Math.pow(1-p,3)));if(p<1)scrollAnimation=requestAnimationFrame(step);else scrollAnimation=null};
    scrollAnimation=requestAnimationFrame(step);
  }

  function setView(view){
    const camera=document.getElementById('cameraCard'),error=document.getElementById('errorBox'),primary=document.querySelector('.primary-actions'),settings=document.querySelector('.settings-panel');
    const code=sectionFor('#codeScannerPanel'),paper=sectionFor('.scanner-quick-panel'),tools=document.querySelector('.osko-tools'),native=document.querySelector('.native-button'),gallery=document.querySelector('.gallery-section');
    const map=new Map([[camera,['camera','scan']],[error,['camera','scan']],[primary,['camera','scan']],[settings,['camera','scan']],[code,['scan']],[paper,['scan']],[tools,['tools']],[native,['tools']],[gallery,['gallery']]]);
    map.forEach((views,el)=>el?.classList.toggle('app-view-hidden',!views.includes(view)));
    document.querySelectorAll('.compact-nav [data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
    localStorage.setItem('osko-camera-view',view);
    window.dispatchEvent(new CustomEvent('osko-voice-view-change',{detail:`Sky opened ${view}`}));
  }

  async function ensureCamera(){if(typeof stream!=='undefined'&&stream)return true;try{if(typeof startCamera==='function')await startCamera()}catch{}return typeof stream!=='undefined'&&!!stream}
  async function showCamera(){closeDrawers();setMode('normal');setView('camera');const ok=await ensureCamera();move(document.getElementById('cameraCard'));status(ok?'Camera ready':'Tap Start and allow camera permission')}
  async function showScanner(){setView('scan');setMode('scanner');openDrawer(['paperwork scanner','paperwork']);await ensureCamera();move(document.getElementById('cameraCard'));status('Document scanner ready')}
  function showTools(){closeDrawers();setView('tools');move(document.querySelector('.osko-tools'));status('Tools open')}
  function showPictures(){closeDrawers();setView('gallery');move(document.querySelector('.gallery-section'));status('Pictures open')}
  function showNamedTool(words,label){setView('tools');const d=openDrawer(words);move(d||document.querySelector('.osko-tools'));status(label+' open')}

  async function run(text){
    const original=String(text||'').trim(),lower=original.toLowerCase();
    let c=lower.replace(/\b(hey\s+)?(sky|skie|skye)\b/g,'').trim();
    if(!c)c=lower.trim();
    if(!c)return;
    status('Heard: '+original);

    if(/stop listening|go to sleep|sky off/.test(c)){enabled=false;localStorage.setItem(KEY,'0');try{recognition.stop()}catch{};update();status('Sky listening off');return}
    if(/help|what can you do|commands/.test(c)){speak('I can open camera, scanner, tools, pictures, scroll, take photos, control flash, modes, brightness, timer, grid, stamps, steady mode, night boost, watermark, and zoom when zoom is available.');status('Sky command help');return}

    if(/open|show|go to/.test(c)&&/(document scanner|paperwork scanner|scan document|document scan|receipt scanner)/.test(c)){await showScanner();return}
    if(/open|show|go to/.test(c)&&/(pictures|photos|gallery)/.test(c)){showPictures();return}
    if(/open|show|go to/.test(c)&&/tools/.test(c)){showTools();return}
    if(/open|show|go to/.test(c)&&/(save|watermark)/.test(c)){showNamedTool(['save, folders','watermark'],'Save tools');return}
    if(/open|show|go to/.test(c)&&/notes?/.test(c)){showNamedTool(['notes and skie','notes'],'Notes');return}
    if(/open|show|go to/.test(c)&&/(stickers?|emojis?)/.test(c)){showNamedTool(['emojis and stickers','stickers'],'Stickers');return}
    if(/open|show|go to/.test(c)&&/(camera controls|settings|controls)/.test(c)){await showCamera();const s=document.querySelector('.settings-panel');if(s)s.open=true;move(s);status('Camera settings open');return}
    if(/open|show|go to|bring/.test(c)&&/camera/.test(c)){await showCamera();return}
    if(/close everything|go back|close scanner/.test(c)){await showCamera();return}

    if(/scroll (down|lower)|go down|move down/.test(c)){smoothScrollBy(Math.max(420,Math.round(innerHeight*.78)));status('Scrolling down');return}
    if(/scroll (up|higher)|go up|move up/.test(c)){smoothScrollBy(-Math.max(420,Math.round(innerHeight*.78)));status('Scrolling up');return}
    if(/scroll to (top|start)|go to top/.test(c)){window.scrollTo({top:0,behavior:'smooth'});status('Going to top');return}
    if(/scroll to (bottom|end)|go to bottom/.test(c)){window.scrollTo({top:document.documentElement.scrollHeight,behavior:'smooth'});status('Going to bottom');return}

    if(/start camera|turn camera on/.test(c)){await ensureCamera();status('Camera started');return}
    if(/stop camera|turn camera off/.test(c)){if(typeof stopCamera==='function')await stopCamera();status('Camera stopped');return}
    if(/flip camera|switch camera|front camera|rear camera/.test(c)){await ensureCamera();if(typeof switchCamera==='function')await switchCamera();status('Camera flipped');return}
    if(/take|snap|capture/.test(c)&&/(picture|photo)/.test(c)){await showCamera();setTimeout(()=>typeof takePhoto==='function'&&takePhoto(),500);status('Taking picture');return}
    if(/start recording|record video|start video/.test(c)){await showCamera();if(typeof toggleRecording==='function')toggleRecording();status('Video recording');return}
    if(/stop recording|stop video/.test(c)){if(typeof toggleRecording==='function')toggleRecording();status('Video stopped');return}
    if(/scan it|scan page|capture page/.test(c)){await showScanner();setTimeout(()=>typeof captureNow==='function'&&captureNow(true),500);status('Scanning page');return}

    if(/rear flash|flashlight|torch|camera light/.test(c)&&/on/.test(c)){await showCamera();if(typeof setRearFlash==='function')await setRearFlash(true);status('Rear flash on');return}
    if(/rear flash|flashlight|torch|camera light/.test(c)&&/off/.test(c)){if(typeof setRearFlash==='function')await setRearFlash(false);status('Rear flash off');return}
    if(/selfie light/.test(c)&&/on/.test(c)){setChecked('screenLightToggle',true);status('Selfie light on');return}
    if(/selfie light/.test(c)&&/off/.test(c)){setChecked('screenLightToggle',false);status('Selfie light off');return}
    if(/grid/.test(c)&&/on/.test(c)){setChecked('gridToggle',true);status('Grid on');return}
    if(/grid/.test(c)&&/off/.test(c)){setChecked('gridToggle',false);status('Grid off');return}
    if(/steady/.test(c)&&/(on|enable)/.test(c)){setChecked('steadyToggle',true);status('Steady mode on');return}
    if(/steady/.test(c)&&/(off|disable)/.test(c)){setChecked('steadyToggle',false);status('Steady mode off');return}
    if(/night boost/.test(c)&&/(on|enable)/.test(c)){setChecked('nightToggle',true);status('Night boost on');return}
    if(/night boost/.test(c)&&/(off|disable)/.test(c)){setChecked('nightToggle',false);status('Night boost off');return}
    if(/date.*stamp/.test(c)&&/on/.test(c)){setChecked('stampToggle',true);status('Date stamp on');return}
    if(/date.*stamp/.test(c)&&/off/.test(c)){setChecked('stampToggle',false);status('Date stamp off');return}
    if(/location.*stamp/.test(c)&&/on/.test(c)){setChecked('locationToggle',true);status('Location stamp on');return}
    if(/location.*stamp/.test(c)&&/off/.test(c)){setChecked('locationToggle',false);status('Location stamp off');return}

    if(/normal mode/.test(c)){setMode('normal');status('Normal mode');return}
    if(/night mode|dark walk/.test(c)){setMode('night');status('Night mode');return}
    if(/document mode/.test(c)){setMode('document');status('Document mode');return}
    if(/scanner mode/.test(c)){setMode('scanner');status('Scanner mode');return}
    if(/eighties|80s mode/.test(c)){setMode('eighties');status('Eighties mode');return}
    if(/universal scan|code mode|barcode mode/.test(c)){setMode('codes');status('Universal scan mode');return}

    const bright=c.match(/brightness(?: to)?\s*(\d{2,3})/);if(bright){setRange('brightnessRange',Number(bright[1]));status(`Brightness ${bright[1]} percent`);return}
    if(/brightness up|brighter/.test(c)){const e=document.getElementById('brightnessRange');setRange('brightnessRange',Number(e?.value||100)+10);status('Brightness raised');return}
    if(/brightness down|darker/.test(c)){const e=document.getElementById('brightnessRange');setRange('brightnessRange',Number(e?.value||100)-10);status('Brightness lowered');return}

    const timer=c.match(/timer(?: for| to)?\s*(3|5|10)/);if(timer){setSelect('timerSelect',timer[1]);status(`Timer ${timer[1]} seconds`);return}
    if(/timer off/.test(c)){setSelect('timerSelect','0');status('Timer off');return}

    if(/no watermark|watermark none/.test(c)){setSelect('watermarkChoice','none');status('No watermark');return}
    if(/personal watermark/.test(c)){setSelect('watermarkChoice','personal');status('Personal watermark');return}
    if(/osko.*watermark/.test(c)){setSelect('watermarkChoice','osko');status('OSKO Ice Crystals watermark');return}
    if(/alaska.*watermark/.test(c)){setSelect('watermarkChoice','alaska');status('Alaska Ice Crystals watermark');return}
    if(/work watermark/.test(c)){setSelect('watermarkChoice','work');status('Work watermark');return}

    const zoom=c.match(/zoom(?: to)?\s*(\d+(?:\.\d+)?)/);if(zoom){const z=Number(zoom[1]);const e=document.getElementById('zoomRange');if(e&&!e.disabled){setRange('zoomRange',z);status(`Zoom ${z} times`)}else status('Zoom is unavailable on this camera');return}
    if(/zoom in/.test(c)){const e=document.getElementById('zoomRange');if(e&&!e.disabled)setRange('zoomRange',Number(e.value||1)+.5);else status('Zoom is unavailable');return}
    if(/zoom out/.test(c)){const e=document.getElementById('zoomRange');if(e&&!e.disabled)setRange('zoomRange',Number(e.value||1)-.5);else status('Zoom is unavailable');return}

    status('I did not recognize that command');
  }

  function update(){button.textContent=listening?'Sky listening':'Start Sky listening';button.classList.toggle('active',listening);floating.textContent=listening?'● SKY':'SKY';floating.style.background=listening?'#0b7895':'#123a52'}
  function schedule(delay=250){clearTimeout(restartTimer);if(!enabled||document.hidden||starting||listening)return;restartTimer=setTimeout(()=>{if(!enabled||listening||document.hidden||starting)return;starting=true;try{recognition.start()}catch{}setTimeout(()=>{starting=false},600)},delay)}
  function startListening(){enabled=true;localStorage.setItem(KEY,'1');try{recognition.stop()}catch{};setTimeout(()=>schedule(30),120);status('Starting Sky listening')}

  if(!Recognition){button.disabled=true;floating.disabled=true;status('Sky voice needs Chrome speech support');return}
  recognition=new Recognition();recognition.lang='en-US';recognition.continuous=false;recognition.interimResults=false;recognition.maxAlternatives=1;
  recognition.onstart=()=>{starting=false;listening=true;update();status('Sky is listening')};
  recognition.onresult=e=>{const text=e.results?.[0]?.[0]?.transcript||'';run(text).catch(()=>status('Voice command failed'))};
  recognition.onerror=e=>{starting=false;listening=false;update();if(!['no-speech','aborted'].includes(e.error))status('Voice error: '+e.error);schedule(700)};
  recognition.onend=()=>{starting=false;listening=false;update();schedule(350)};
  button.addEventListener('click',startListening);floating.addEventListener('click',startListening);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)try{recognition.stop()}catch{};else if(enabled)schedule(250)});
  window.addEventListener('focus',()=>{if(enabled)schedule(250)});
  setInterval(()=>{if(enabled&&!listening&&!document.hidden)schedule(50)},1600);
  window.oskoRunVoiceCommand=run;
  update();
})();