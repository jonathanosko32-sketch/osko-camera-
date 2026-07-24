(()=>{
  const old=document.getElementById('voiceCommandBtn');
  const statusEl=document.getElementById('voiceStatus');
  if(!old)return;

  const button=old.cloneNode(true);old.replaceWith(button);
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  const KEY='osko-skie-autolisten-v2';
  let recognition=null,listening=false,starting=false,restartTimer=null,enabled=true,lastCommand='';

  const floating=document.createElement('button');
  floating.type='button';floating.id='skieFloatingButton';floating.textContent='SKIE';floating.setAttribute('aria-label','Skie voice control');
  floating.style.cssText='position:fixed;right:16px;bottom:92px;z-index:10002;width:72px;height:72px;border-radius:50%;border:2px solid rgba(110,220,255,.75);background:#123a52;color:white;font-weight:900;font-size:17px;box-shadow:0 8px 24px rgba(0,0,0,.45)';
  document.body.appendChild(floating);

  const status=m=>{if(statusEl)statusEl.textContent=m;if(typeof setStatus==='function')setStatus(m)};
  const navButton=view=>document.querySelector(`.compact-nav [data-view="${view}"]`);
  const wait=ms=>new Promise(r=>setTimeout(r,ms));

  function update(){
    button.textContent=listening?'Skie listening':'Start Skie';
    floating.textContent=listening?'● SKIE':'SKIE';
    floating.style.background=listening?'#087b98':'#123a52';
  }

  function clickView(view){
    const b=navButton(view);
    if(!b)return false;
    b.click();
    return true;
  }

  async function startCameraForReal(){
    clickView('camera');
    await wait(250);
    let on=typeof stream!=='undefined'&&!!stream;
    if(!on&&typeof startCamera==='function'){
      try{await startCamera()}catch(e){console.warn(e)}
      await wait(500);
      on=typeof stream!=='undefined'&&!!stream;
    }
    if(!on){
      const start=document.getElementById('startBtn')||document.getElementById('dockStart');
      try{start?.click()}catch{}
      await wait(900);
      on=typeof stream!=='undefined'&&!!stream;
    }
    document.getElementById('cameraCard')?.scrollIntoView({behavior:'smooth',block:'start'});
    status(on?'Camera open and running':'Camera opened. Allow permission or tap Start once.');
    return on;
  }

  async function run(spoken){
    const original=String(spoken||'').trim();
    let c=original.toLowerCase().replace(/\b(hey\s+)?(sky|skie|skye)\b/g,'').trim();
    if(!c||c===lastCommand)return;
    lastCommand=c;setTimeout(()=>{lastCommand=''},1200);
    status('Heard: '+original);

    if(/bottom/.test(c)&&/(scroll|go|move)/.test(c)){window.scrollTo({top:document.documentElement.scrollHeight,behavior:'smooth'});status('Scrolling to bottom');return}
    if(/top/.test(c)&&/(scroll|go|move)/.test(c)){window.scrollTo({top:0,behavior:'smooth'});status('Scrolling to top');return}
    if(/scroll down|go down|move down/.test(c)){window.scrollBy({top:Math.round(innerHeight*.8),behavior:'smooth'});status('Scrolling down');return}
    if(/scroll up|go up|move up/.test(c)){window.scrollBy({top:-Math.round(innerHeight*.8),behavior:'smooth'});status('Scrolling up');return}

    if(/camera/.test(c)&&/(open|show|start|turn on|go to)/.test(c)){await startCameraForReal();return}
    if(/pictures|photos|gallery/.test(c)&&/(open|show|go to)/.test(c)){clickView('gallery');status('Pictures open');return}
    if(/tools/.test(c)&&/(open|show|go to)/.test(c)){clickView('tools');status('Tools open');return}
    if(/scan|scanner/.test(c)&&/(open|show|go to)/.test(c)){clickView('scan');status('Scanner open');return}

    if(/take|snap|capture/.test(c)&&/(picture|photo)/.test(c)){await startCameraForReal();setTimeout(()=>typeof takePhoto==='function'&&takePhoto(),350);status('Taking picture');return}
    if(/flip|switch/.test(c)&&/camera/.test(c)){await startCameraForReal();if(typeof switchCamera==='function')await switchCamera();status('Camera flipped');return}
    if(/flash|flashlight|torch/.test(c)&&/on/.test(c)){await startCameraForReal();if(typeof setRearFlash==='function')await setRearFlash(true);status('Flash on');return}
    if(/flash|flashlight|torch/.test(c)&&/off/.test(c)){if(typeof setRearFlash==='function')await setRearFlash(false);status('Flash off');return}

    status('Command not recognized');
  }

  function schedule(delay=1200){
    clearTimeout(restartTimer);
    if(!enabled||document.hidden||starting||listening||!recognition)return;
    restartTimer=setTimeout(()=>{
      if(!enabled||document.hidden||starting||listening)return;
      starting=true;
      try{recognition.start()}catch{}
      setTimeout(()=>{starting=false},900);
    },delay);
  }

  function startListening(){
    enabled=true;localStorage.setItem(KEY,'1');
    if(listening){status('Skie is already listening');return}
    schedule(50);
    status('Starting Skie');
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
    const best=choices.find(t=>/camera|scroll|picture|photo|tools|gallery|scan|flash|flip|switch/i.test(t))||choices[0]||'';
    run(best).catch(()=>status('Voice command failed'));
  };
  recognition.onerror=e=>{starting=false;listening=false;update();if(!['no-speech','aborted'].includes(e.error))status('Voice error: '+e.error);schedule(1800)};
  recognition.onend=()=>{starting=false;listening=false;update();schedule(1500)};

  button.addEventListener('click',startListening);
  floating.addEventListener('click',startListening);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){try{recognition.stop()}catch{}}else schedule(900)});
  window.addEventListener('focus',()=>schedule(900));
  window.addEventListener('load',()=>schedule(800));

  enabled=localStorage.getItem(KEY)!=='0';
  localStorage.setItem(KEY,'1');
  window.oskoRunVoiceCommand=run;
  update();
  schedule(900);
})();