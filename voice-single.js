(()=>{
  const old=document.getElementById('voiceCommandBtn');
  const statusEl=document.getElementById('voiceStatus');
  if(!old)return;

  const button=old.cloneNode(true);old.replaceWith(button);
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  const KEY='osko-skie-autolisten-v3';
  let recognition=null,listening=false,starting=false,enabled=true,lastCommand='';

  const floating=document.createElement('button');
  floating.type='button';floating.id='skieFloatingButton';floating.textContent='SKIE';floating.setAttribute('aria-label','Skie voice control');
  floating.style.cssText='position:fixed;right:16px;bottom:92px;z-index:10002;width:72px;height:72px;border-radius:50%;border:2px solid rgba(110,220,255,.75);background:#123a52;color:white;font-weight:900;font-size:17px;box-shadow:0 8px 24px rgba(0,0,0,.45)';
  document.body.appendChild(floating);

  const status=m=>{if(statusEl)statusEl.textContent=m;if(typeof setStatus==='function')setStatus(m)};
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const navButton=view=>document.querySelector(`.compact-nav [data-view="${view}"]`);
  const clickView=view=>{const b=navButton(view);if(!b)return false;b.click();return true};
  const setChecked=(id,value)=>{const el=document.getElementById(id);if(!el)return false;el.checked=value;el.dispatchEvent(new Event('change',{bubbles:true}));return true};
  const setRange=(id,value)=>{const el=document.getElementById(id);if(!el)return false;const min=Number(el.min||value),max=Number(el.max||value);el.value=String(Math.max(min,Math.min(max,value)));el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));return true};
  const setSelect=(id,value)=>{const el=document.getElementById(id);if(!el)return false;el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));return true};
  const clickId=id=>{const el=document.getElementById(id);if(!el)return false;el.click();return true};

  function update(){
    button.textContent=listening?'Skie listening':'Start Skie';
    floating.textContent=listening?'● SKIE':'SKIE';
    floating.style.background=listening?'#087b98':'#123a52';
  }

  async function startCameraForReal(){
    clickView('camera');
    await wait(180);
    let on=typeof stream!=='undefined'&&!!stream;
    if(!on&&typeof startCamera==='function'){
      try{await startCamera()}catch(e){console.warn(e)}
      await wait(550);
      on=typeof stream!=='undefined'&&!!stream;
    }
    if(!on){
      const start=document.getElementById('startBtn')||document.getElementById('dockStart');
      try{start?.click()}catch{}
      await wait(900);
      on=typeof stream!=='undefined'&&!!stream;
    }
    document.getElementById('cameraCard')?.scrollIntoView({behavior:'smooth',block:'start'});
    status(on?'Camera open and running':'Camera page open. Allow camera permission or tap Start once.');
    return on;
  }

  function openDetailsByText(words){
    const terms=Array.isArray(words)?words:[words];
    const details=[...document.querySelectorAll('details')].find(d=>terms.some(t=>(d.querySelector('summary')?.textContent||'').toLowerCase().includes(t)));
    if(details){details.open=true;details.scrollIntoView({behavior:'smooth',block:'start'});return true}
    return false;
  }

  async function run(spoken){
    const original=String(spoken||'').trim();
    let c=original.toLowerCase().replace(/\b(hey\s+)?(sky|skie|skye)\b/g,'').trim();
    if(!c||c===lastCommand)return;
    lastCommand=c;setTimeout(()=>{lastCommand=''},1400);
    status('Heard: '+original);

    if(/stop listening|go to sleep|skie off/.test(c)){enabled=false;localStorage.setItem(KEY,'0');try{recognition.stop()}catch{};status('Skie listening off');return}

    if(/bottom/.test(c)&&/(scroll|go|move)/.test(c)){window.scrollTo({top:document.documentElement.scrollHeight,behavior:'smooth'});status('Scrolling to bottom');return}
    if(/top/.test(c)&&/(scroll|go|move)/.test(c)){window.scrollTo({top:0,behavior:'smooth'});status('Scrolling to top');return}
    if(/scroll down|go down|move down/.test(c)){window.scrollBy({top:Math.round(innerHeight*.8),behavior:'smooth'});status('Scrolling down');return}
    if(/scroll up|go up|move up/.test(c)){window.scrollBy({top:-Math.round(innerHeight*.8),behavior:'smooth'});status('Scrolling up');return}

    if(/camera/.test(c)&&/(open|show|start|turn on|go to)/.test(c)){await startCameraForReal();return}
    if(/camera/.test(c)&&/(stop|turn off|close)/.test(c)){if(typeof stopCamera==='function')await stopCamera();status('Camera stopped');return}
    if(/pictures|photos|gallery/.test(c)&&/(open|show|go to)/.test(c)){clickView('gallery');status('Pictures open');return}
    if(/tools/.test(c)&&/(open|show|go to)/.test(c)){clickView('tools');status('Tools open');return}
    if(/scan|scanner/.test(c)&&/(open|show|go to)/.test(c)){clickView('scan');status('Scanner open');return}
    if(/settings|camera controls/.test(c)&&/(open|show|go to)/.test(c)){clickView('camera');openDetailsByText(['camera controls','camera settings']);status('Camera controls open');return}
    if(/watermark|save tools/.test(c)&&/(open|show|go to)/.test(c)){clickView('tools');openDetailsByText(['save, folders','watermark']);status('Watermark tools open');return}
    if(/notes?/.test(c)&&/(open|show|go to)/.test(c)){clickView('tools');openDetailsByText(['notes and skie','notes']);status('Notes open');return}
    if(/stickers?|emojis?/.test(c)&&/(open|show|go to)/.test(c)){clickView('tools');openDetailsByText(['emojis and stickers','stickers']);status('Stickers open');return}

    if(/take|snap|capture/.test(c)&&/(picture|photo)/.test(c)){await startCameraForReal();setTimeout(()=>typeof takePhoto==='function'&&takePhoto(),350);status('Taking picture');return}
    if(/start recording|record video|start video/.test(c)){await startCameraForReal();if(typeof toggleRecording==='function')toggleRecording();status('Recording started');return}
    if(/stop recording|stop video/.test(c)){if(typeof toggleRecording==='function')toggleRecording();status('Recording stopped');return}
    if(/flip|switch/.test(c)&&/camera/.test(c)){await startCameraForReal();if(typeof switchCamera==='function')await switchCamera();status('Camera flipped');return}
    if(/flash|flashlight|torch/.test(c)&&/on/.test(c)){await startCameraForReal();if(typeof setRearFlash==='function')await setRearFlash(true);status('Flash on');return}
    if(/flash|flashlight|torch/.test(c)&&/off/.test(c)){if(typeof setRearFlash==='function')await setRearFlash(false);status('Flash off');return}

    if(/normal mode/.test(c)){setSelect('modeSelect','normal');status('Normal mode');return}
    if(/night mode|dark walk/.test(c)){setSelect('modeSelect','night');status('Night mode');return}
    if(/document mode/.test(c)){setSelect('modeSelect','document');status('Document mode');return}
    if(/scanner mode/.test(c)){setSelect('modeSelect','scanner');status('Scanner mode');return}
    if(/eighties|80s mode/.test(c)){setSelect('modeSelect','eighties');status('Eighties mode');return}
    if(/code mode|barcode mode|universal scan/.test(c)){setSelect('modeSelect','codes');status('Universal scan mode');return}

    if(/steady/.test(c)&&/on|enable/.test(c)){setChecked('steadyToggle',true);status('Steady mode on');return}
    if(/steady/.test(c)&&/off|disable/.test(c)){setChecked('steadyToggle',false);status('Steady mode off');return}
    if(/night boost/.test(c)&&/on|enable/.test(c)){setChecked('nightToggle',true);status('Night boost on');return}
    if(/night boost/.test(c)&&/off|disable/.test(c)){setChecked('nightToggle',false);status('Night boost off');return}
    if(/grid/.test(c)&&/on/.test(c)){setChecked('gridToggle',true);status('Grid on');return}
    if(/grid/.test(c)&&/off/.test(c)){setChecked('gridToggle',false);status('Grid off');return}
    if(/date.*stamp/.test(c)&&/on/.test(c)){setChecked('stampToggle',true);status('Date stamp on');return}
    if(/date.*stamp/.test(c)&&/off/.test(c)){setChecked('stampToggle',false);status('Date stamp off');return}
    if(/location.*stamp/.test(c)&&/on/.test(c)){setChecked('locationToggle',true);status('Location stamp on');return}
    if(/location.*stamp/.test(c)&&/off/.test(c)){setChecked('locationToggle',false);status('Location stamp off');return}

    const bright=c.match(/brightness(?: to)?\s*(\d{2,3})/);if(bright){setRange('brightnessRange',Number(bright[1]));status(`Brightness ${bright[1]} percent`);return}
    if(/brightness up|brighter/.test(c)){const e=document.getElementById('brightnessRange');setRange('brightnessRange',Number(e?.value||100)+10);status('Brightness raised');return}
    if(/brightness down|darker/.test(c)){const e=document.getElementById('brightnessRange');setRange('brightnessRange',Number(e?.value||100)-10);status('Brightness lowered');return}

    const zoom=c.match(/zoom(?: to)?\s*(\d+(?:\.\d+)?)/);if(zoom){const e=document.getElementById('zoomRange');if(e&&!e.disabled){setRange('zoomRange',Number(zoom[1]));status(`Zoom ${zoom[1]} times`)}else status('Zoom unavailable');return}
    if(/zoom in/.test(c)){const e=document.getElementById('zoomRange');if(e&&!e.disabled)setRange('zoomRange',Number(e.value||1)+.5);status('Zooming in');return}
    if(/zoom out/.test(c)){const e=document.getElementById('zoomRange');if(e&&!e.disabled)setRange('zoomRange',Number(e.value||1)-.5);status('Zooming out');return}

    const timer=c.match(/timer(?: for| to)?\s*(3|5|10)/);if(timer){setSelect('timerSelect',timer[1]);status(`Timer ${timer[1]} seconds`);return}
    if(/timer off/.test(c)){setSelect('timerSelect','0');status('Timer off');return}

    if(/no watermark|watermark none/.test(c)){setSelect('watermarkChoice','none');status('No watermark');return}
    if(/personal watermark/.test(c)){setSelect('watermarkChoice','personal');status('Personal watermark');return}
    if(/osko.*watermark/.test(c)){setSelect('watermarkChoice','osko');status('OSKO Ice Crystals watermark');return}
    if(/alaska.*watermark/.test(c)){setSelect('watermarkChoice','alaska');status('Alaska Ice Crystals watermark');return}
    if(/work watermark/.test(c)){setSelect('watermarkChoice','work');status('Work watermark');return}

    if(/share last|share picture|share photo/.test(c)){clickId('shareLastBtn');status('Opening share');return}
    if(/save last|save picture|save photo/.test(c)){clickId('saveLastBtn');status('Saving last picture');return}
    if(/website copy|make website/.test(c)){clickId('websiteCopyBtn')||clickId('saveWebsiteBtn');status('Making website copy');return}
    if(/clear pictures|clear gallery/.test(c)){clickId('clearBtn');status('Clearing pictures');return}
    if(/job proof/.test(c)){clickId('jobProofBtn');status('Job proof mode');return}
    if(/before after/.test(c)){clickId('beforeAfterBtn');status('Before and after guide');return}
    if(/damage markup|mark damage/.test(c)){clickId('damageBtn');status('Damage markup open');return}
    if(/website set/.test(c)){clickId('websiteSetBtn');status('Making website set');return}
    if(/aurora burst|burst mode/.test(c)){clickId('auroraBurstBtn');status('Aurora burst started');return}
    if(/backup settings|make backup/.test(c)){clickId('backupBtn');status('Saving backup');return}

    status('Command not recognized');
  }

  function startListening(){
    enabled=true;localStorage.setItem(KEY,'1');
    if(listening||starting){status('Skie is already listening');return}
    starting=true;
    try{recognition.start()}catch{starting=false}
  }

  if(!Recognition){button.disabled=true;floating.disabled=true;status('Skie voice needs Chrome speech support');return}

  recognition=new Recognition();
  recognition.lang='en-US';
  recognition.continuous=true;
  recognition.interimResults=false;
  recognition.maxAlternatives=3;
  recognition.onstart=()=>{starting=false;listening=true;update();status('Skie is listening')};
  recognition.onresult=e=>{
    const result=e.results?.[e.results.length-1];
    if(!result)return;
    const choices=[...result].map(x=>x.transcript).filter(Boolean);
    const best=choices.find(t=>/camera|scroll|picture|photo|tools|gallery|scan|flash|flip|switch|brightness|watermark|mode|timer|record|zoom/i.test(t))||choices[0]||'';
    run(best).catch(()=>status('Voice command failed'));
  };
  recognition.onerror=e=>{starting=false;listening=false;update();if(!['no-speech','aborted'].includes(e.error))status('Voice error: '+e.error)};
  recognition.onend=()=>{starting=false;listening=false;update();if(enabled)status('Skie paused. Tap SKIE once to resume without repeated dings.')};

  button.addEventListener('click',startListening);
  floating.addEventListener('click',startListening);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){try{recognition.stop()}catch{}}});
  window.addEventListener('load',()=>setTimeout(startListening,700));

  enabled=localStorage.getItem(KEY)!=='0';
  localStorage.setItem(KEY,'1');
  window.oskoRunVoiceCommand=run;
  update();
})();