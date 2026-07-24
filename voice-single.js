(()=>{
  const old=document.getElementById('voiceCommandBtn');
  const statusEl=document.getElementById('voiceStatus');
  if(!old)return;

  try{localStorage.setItem('osko-sky-hands-free-v1','0');if(old.classList.contains('active'))old.click()}catch{}
  const button=old.cloneNode(true);old.replaceWith(button);

  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  const KEY='osko-sky-single-v1';
  let recognition=null,listening=false,restartTimer=null;
  let enabled=localStorage.getItem(KEY)!=='0';
  let scrollAnimation=null;

  const status=m=>{if(statusEl)statusEl.textContent=m;if(typeof setStatus==='function')setStatus(m)};
  const setMode=value=>{const m=document.getElementById('modeSelect');if(!m)return;m.value=value;m.dispatchEvent(new Event('change',{bubbles:true}))};
  const sectionFor=selector=>document.querySelector(selector)?.closest('details.compact-section')||document.querySelector(selector);
  const closeDrawers=()=>document.querySelectorAll('details.compact-section').forEach(d=>d.open=false);
  const openDrawer=words=>{const terms=Array.isArray(words)?words:[words];const d=[...document.querySelectorAll('details.compact-section')].find(x=>terms.some(t=>(x.querySelector('summary')?.textContent||'').toLowerCase().includes(t)));if(d){closeDrawers();d.open=true;d.classList.remove('app-view-hidden')}return d};
  const move=el=>setTimeout(()=>el?.scrollIntoView({behavior:'smooth',block:'start'}),100);

  function smoothScrollBy(distance,duration=900){
    if(scrollAnimation)cancelAnimationFrame(scrollAnimation);
    const start=window.scrollY;
    const max=Math.max(0,document.documentElement.scrollHeight-innerHeight);
    const target=Math.max(0,Math.min(max,start+distance));
    const change=target-start;
    const started=performance.now();
    const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
    const step=now=>{
      const p=Math.min(1,(now-started)/duration);
      window.scrollTo(0,start+change*ease(p));
      if(p<1)scrollAnimation=requestAnimationFrame(step);else scrollAnimation=null;
    };
    scrollAnimation=requestAnimationFrame(step);
  }

  function setView(view){
    const camera=document.getElementById('cameraCard'),error=document.getElementById('errorBox'),primary=document.querySelector('.primary-actions'),settings=document.querySelector('.settings-panel');
    const code=sectionFor('#codeScannerPanel'),paper=sectionFor('.scanner-quick-panel'),tools=document.querySelector('.osko-tools'),native=document.querySelector('.native-button'),gallery=document.querySelector('.gallery-section');
    const map=new Map([[camera,['camera','scan']],[error,['camera','scan']],[primary,['camera','scan']],[settings,['camera','scan']],[code,['scan']],[paper,['scan']],[tools,['tools']],[native,['tools']],[gallery,['gallery']]]);
    map.forEach((views,el)=>el?.classList.toggle('app-view-hidden',!views.includes(view)));
    document.querySelectorAll('.compact-nav [data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
    localStorage.setItem('osko-camera-view',view);
  }

  async function ensureCamera(){
    if(typeof stream!=='undefined'&&stream)return true;
    try{if(typeof startCamera==='function')await startCamera()}catch{}
    return typeof stream!=='undefined'&&!!stream;
  }
  async function showCamera(){
    closeDrawers();setMode('normal');setView('camera');
    document.getElementById('scanFrame')?.setAttribute('hidden','');
    const badge=document.getElementById('modeBadge');if(badge)badge.textContent='NORMAL';
    const ok=await ensureCamera();move(document.getElementById('cameraCard'));status(ok?'Camera ready':'Tap Start and allow camera permission');
  }
  async function showScanner(){
    setView('scan');setMode('scanner');const d=openDrawer(['paperwork scanner','paperwork']);await ensureCamera();move(document.getElementById('cameraCard'));status('Document scanner ready');return d;
  }
  function showTools(){closeDrawers();setView('tools');move(document.querySelector('.osko-tools'));status('Tools open')}
  function showPictures(){closeDrawers();setView('gallery');move(document.querySelector('.gallery-section'));status('Pictures open')}
  function showNamedTool(words,label){setView('tools');const d=openDrawer(words);move(d||document.querySelector('.osko-tools'));status(label+' open')}

  async function run(text){
    const original=String(text||'').trim(),lower=original.toLowerCase();
    if(!/\b(hey\s+)?(sky|skie)\b/.test(lower))return;
    const c=lower.replace(/\b(hey\s+)?(sky|skie)\b/g,'').trim();if(!c)return;
    status('Heard: '+original);

    if(/stop listening|go to sleep/.test(c)){enabled=false;localStorage.setItem(KEY,'0');try{recognition.stop()}catch{};update();status('Sky listening off');return}
    if(/open|show|go to/.test(c)&&/(document scanner|paperwork scanner|scan document|document scan|paper scanner|receipt scanner)/.test(c)){await showScanner();return}
    if(/open|show|go to/.test(c)&&/(pictures|photos|gallery)/.test(c)){showPictures();return}
    if(/open|show|go to/.test(c)&&/tools/.test(c)){showTools();return}
    if(/open|show|go to/.test(c)&&/save/.test(c)){showNamedTool(['save, folders','watermark'],'Save tools');return}
    if(/open|show|go to/.test(c)&&/notes?/.test(c)){showNamedTool(['notes and skie','notes'],'Notes');return}
    if(/open|show|go to/.test(c)&&/(stickers?|emojis?)/.test(c)){showNamedTool(['emojis and stickers','stickers'],'Stickers');return}
    if(/open|show|go to/.test(c)&&/(camera controls|controls)/.test(c)){await showCamera();const s=document.querySelector('.settings-panel');if(s)s.open=true;move(s);return}
    if(/open|show|go to|bring/.test(c)&&/camera/.test(c)){await showCamera();return}
    if(/close everything|go back|close scanner/.test(c)){await showCamera();return}
    if(/scroll (down|lower)|go down|move down/.test(c)){smoothScrollBy(Math.max(420,Math.round(innerHeight*.82)),950);status('Scrolling down');return}
    if(/scroll (up|higher)|go up|move up/.test(c)){smoothScrollBy(-Math.max(420,Math.round(innerHeight*.82)),950);status('Scrolling up');return}
    if(/scroll to (top|start)|go to top/.test(c)){smoothScrollBy(-document.documentElement.scrollHeight,1100);status('Going to top');return}
    if(/scroll to (bottom|end)|go to bottom/.test(c)){smoothScrollBy(document.documentElement.scrollHeight,1200);status('Going to bottom');return}
    if(/take|snap|capture/.test(c)&&/(picture|photo)/.test(c)){await showCamera();setTimeout(()=>typeof takePhoto==='function'&&takePhoto(),1200);status('Taking picture');return}
    if(/scan it|scan page|capture page/.test(c)){await showScanner();setTimeout(()=>typeof captureNow==='function'&&captureNow(true),1200);status('Scanning page');return}
    if(/rear flash|flashlight|torch|camera light/.test(c)&&/on/.test(c)){await showCamera();if(typeof setRearFlash==='function')await setRearFlash(true);status('Rear flash on');return}
    if(/rear flash|flashlight|torch|camera light/.test(c)&&/off/.test(c)){if(typeof setRearFlash==='function')await setRearFlash(false);status('Rear flash off');return}
    status('I did not recognize that command');
  }

  function update(){button.textContent=enabled?(listening?'Sky listening':'Start Sky listening'):'Enable hands-free Sky';button.classList.toggle('active',listening)}
  function schedule(delay=450){clearTimeout(restartTimer);if(!enabled||document.hidden)return;restartTimer=setTimeout(()=>{if(!enabled||listening||document.hidden)return;try{recognition.start()}catch{}},delay)}

  if(!Recognition){button.disabled=true;status('Voice commands need Chrome speech support');return}
  recognition=new Recognition();recognition.lang='en-US';recognition.continuous=false;recognition.interimResults=false;
  recognition.onstart=()=>{listening=true;update();status('Sky is listening')};
  recognition.onresult=e=>run(e.results[0][0].transcript).catch(()=>status('Voice command failed'));
  recognition.onerror=e=>{if(!['no-speech','aborted'].includes(e.error))status('Voice error: '+e.error)};
  recognition.onend=()=>{listening=false;update();schedule(350)};
  button.addEventListener('click',()=>{enabled=!enabled;localStorage.setItem(KEY,enabled?'1':'0');if(enabled)schedule(20);else try{recognition.stop()}catch{};update()});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)try{recognition.stop()}catch{};else schedule(250)});
  window.oskoRunVoiceCommand=run;
  update();if(enabled)schedule(500);
})();
