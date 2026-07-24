(()=>{
  const old=document.getElementById('voiceCommandBtn');
  const statusEl=document.getElementById('voiceStatus');
  if(!old)return;

  const button=old.cloneNode(true);
  old.replaceWith(button);
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  const KEY='osko-skie-autolisten-v1';
  let recognition=null,listening=false,starting=false,restartTimer=null,enabled=true;

  const floating=document.createElement('button');
  floating.type='button';
  floating.id='skieFloatingButton';
  floating.textContent='SKIE';
  floating.setAttribute('aria-label','Skie voice control');
  floating.style.cssText='position:fixed;right:16px;bottom:92px;z-index:10002;width:72px;height:72px;border-radius:50%;border:2px solid rgba(110,220,255,.75);background:#123a52;color:white;font-weight:900;font-size:17px;box-shadow:0 8px 24px rgba(0,0,0,.45)';
  document.body.appendChild(floating);

  const status=m=>{if(statusEl)statusEl.textContent=m;if(typeof setStatus==='function')setStatus(m)};
  const navButton=view=>document.querySelector(`.compact-nav [data-view="${view}"]`);

  function update(){
    button.textContent=listening?'Skie listening':'Start Skie';
    floating.textContent=listening?'● SKIE':'SKIE';
    floating.style.background=listening?'#087b98':'#123a52';
  }

  function clickView(view){
    const b=navButton(view);
    if(b){b.click();return true}
    return false;
  }

  async function startCameraForReal(){
    clickView('camera');
    await new Promise(r=>setTimeout(r,120));
    let on=typeof stream!=='undefined'&&!!stream;
    if(!on&&typeof startCamera==='function'){
      try{await startCamera()}catch(e){console.warn(e)}
      on=typeof stream!=='undefined'&&!!stream;
    }
    if(!on){
      const start=document.getElementById('startBtn')||document.getElementById('dockStart');
      try{start?.click()}catch{}
      await new Promise(r=>setTimeout(r,700));
      on=typeof stream!=='undefined'&&!!stream;
    }
    document.getElementById('cameraCard')?.scrollIntoView({behavior:'smooth',block:'start'});
    status(on?'Camera open and running':'Camera tab opened. Tap Start once if Chrome asks for permission.');
    return on;
  }

  function scrollToBottom(){
    window.scrollTo({top:document.documentElement.scrollHeight,behavior:'smooth'});
    status('Scrolling to bottom');
  }

  function scrollToTop(){
    window.scrollTo({top:0,behavior:'smooth'});
    status('Scrolling to top');
  }

  async function run(spoken){
    const original=String(spoken||'').trim();
    let c=original.toLowerCase().replace(/\b(hey\s+)?(sky|skie|skye)\b/g,'').trim();
    if(!c)return;
    status('Heard: '+original);

    if(/scroll to (the )?bottom|go to (the )?bottom|bottom of (the )?page/.test(c)){scrollToBottom();return}
    if(/scroll to (the )?top|go to (the )?top|top of (the )?page/.test(c)){scrollToTop();return}
    if(/scroll down|go down|move down/.test(c)){window.scrollBy({top:Math.round(innerHeight*.8),behavior:'smooth'});status('Scrolling down');return}
    if(/scroll up|go up|move up/.test(c)){window.scrollBy({top:-Math.round(innerHeight*.8),behavior:'smooth'});status('Scrolling up');return}

    if(/open camera|show camera|go to camera|start camera|turn camera on/.test(c)){await startCameraForReal();return}
    if(/open pictures|show pictures|open photos|open gallery/.test(c)){clickView('gallery');status('Pictures open');return}
    if(/open tools|show tools/.test(c)){clickView('tools');status('Tools open');return}
    if(/open scan|open scanner|show scanner/.test(c)){clickView('scan');status('Scanner open');return}

    if(/take (a )?(picture|photo)|snap (a )?(picture|photo)|capture (a )?(picture|photo)/.test(c)){
      await startCameraForReal();
      setTimeout(()=>typeof takePhoto==='function'&&takePhoto(),300);
      status('Taking picture');
      return;
    }
    if(/flip camera|switch camera/.test(c)){await startCameraForReal();if(typeof switchCamera==='function')await switchCamera();status('Camera flipped');return}
    if(/flash (on)|flashlight on|torch on/.test(c)){await startCameraForReal();if(typeof setRearFlash==='function')await setRearFlash(true);return}
    if(/flash (off)|flashlight off|torch off/.test(c)){if(typeof setRearFlash==='function')await setRearFlash(false);return}

    status('Command not recognized');
  }

  function schedule(delay=250){
    clearTimeout(restartTimer);
    if(!enabled||document.hidden||starting||listening||!recognition)return;
    restartTimer=setTimeout(()=>{
      if(!enabled||document.hidden||starting||listening)return;
      starting=true;
      try{recognition.start()}catch{}
      setTimeout(()=>{starting=false},700);
    },delay);
  }

  function startListening(){
    enabled=true;
    localStorage.setItem(KEY,'1');
    try{recognition.stop()}catch{}
    setTimeout(()=>schedule(50),150);
    status('Starting Skie');
  }

  if(!Recognition){
    button.disabled=true;floating.disabled=true;
    status('Skie voice needs Chrome speech support');
    return;
  }

  recognition=new Recognition();
  recognition.lang='en-US';
  recognition.continuous=false;
  recognition.interimResults=false;
  recognition.maxAlternatives=1;
  recognition.onstart=()=>{starting=false;listening=true;update();status('Skie is listening')};
  recognition.onresult=e=>{const text=e.results?.[0]?.[0]?.transcript||'';run(text).catch(()=>status('Voice command failed'))};
  recognition.onerror=e=>{starting=false;listening=false;update();if(!['no-speech','aborted'].includes(e.error))status('Voice error: '+e.error);schedule(700)};
  recognition.onend=()=>{starting=false;listening=false;update();schedule(350)};

  button.addEventListener('click',startListening);
  floating.addEventListener('click',startListening);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){try{recognition.stop()}catch{}}else schedule(150)});
  window.addEventListener('focus',()=>schedule(150));
  window.addEventListener('load',()=>schedule(350));
  setInterval(()=>{if(enabled&&!listening&&!document.hidden)schedule(30)},1600);

  enabled=localStorage.getItem(KEY)!=='0';
  localStorage.setItem(KEY,'1');
  window.oskoRunVoiceCommand=run;
  update();
  schedule(500);
})();