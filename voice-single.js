(()=>{
  const originalButton=document.getElementById('voiceCommandBtn');
  const statusEl=document.getElementById('voiceStatus');
  if(!originalButton)return;

  const button=originalButton.cloneNode(true);
  originalButton.replaceWith(button);

  document.getElementById('skyFloatingButton')?.remove();
  const floating=document.createElement('button');
  floating.id='skyFloatingButton';
  floating.type='button';
  floating.textContent='SKY';
  floating.setAttribute('aria-label','Start Sky voice control');
  floating.style.cssText='position:fixed;right:16px;bottom:92px;z-index:10002;width:68px;height:68px;border-radius:50%;border:2px solid rgba(110,220,255,.7);background:#123a52;color:#fff;font-weight:900;font-size:18px;box-shadow:0 8px 24px rgba(0,0,0,.45)';
  document.body.appendChild(floating);

  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  let recognition=null,listening=false,starting=false,enabled=false,restartTimer=null;

  const status=message=>{
    if(statusEl)statusEl.textContent=message;
    if(typeof setStatus==='function')setStatus(message);
  };

  function updateButtons(){
    button.textContent=listening?'Sky listening':'Start Sky listening';
    button.classList.toggle('active',listening);
    floating.textContent=listening?'● SKY':'SKY';
    floating.style.background=listening?'#0b7895':'#123a52';
  }

  function clickView(view){
    const navButton=document.querySelector(`.compact-nav [data-view="${view}"]`);
    if(navButton){navButton.click();return true}
    return false;
  }

  function scrollToElement(element){
    setTimeout(()=>element?.scrollIntoView({behavior:'smooth',block:'start'}),120);
  }

  async function openCamera(){
    clickView('camera');
    window.scrollTo({top:0,behavior:'smooth'});
    const camera=document.getElementById('cameraCard');
    camera?.classList.remove('app-view-hidden');
    try{
      if(typeof stream==='undefined'||!stream){
        if(typeof startCamera==='function')await startCamera();
      }
    }catch(error){console.warn(error)}
    scrollToElement(camera);
    const opened=typeof stream!=='undefined'&&!!stream;
    status(opened?'Camera open':'Camera page open. Tap Start if permission is needed.');
  }

  function openPictures(){clickView('gallery');window.scrollTo({top:0,behavior:'smooth'});status('Pictures open')}
  function openTools(){clickView('tools');window.scrollTo({top:0,behavior:'smooth'});status('Tools open')}
  function openScan(){clickView('scan');window.scrollTo({top:0,behavior:'smooth'});status('Scanner open')}

  function setRange(id,value){
    const element=document.getElementById(id);
    if(!element)return false;
    const min=Number(element.min||value),max=Number(element.max||value);
    element.value=String(Math.max(min,Math.min(max,value)));
    element.dispatchEvent(new Event('input',{bubbles:true}));
    element.dispatchEvent(new Event('change',{bubbles:true}));
    return true;
  }

  function setChecked(id,value){
    const element=document.getElementById(id);
    if(!element)return false;
    element.checked=value;
    element.dispatchEvent(new Event('change',{bubbles:true}));
    return true;
  }

  function setSelect(id,value){
    const element=document.getElementById(id);
    if(!element)return false;
    element.value=value;
    element.dispatchEvent(new Event('change',{bubbles:true}));
    return true;
  }

  async function run(transcript){
    const original=String(transcript||'').trim();
    let command=original.toLowerCase().replace(/\b(hey\s+)?(sky|skie|skye)\b/g,'').trim();
    if(!command)return;
    status('Heard: '+original);

    if(/stop listening|go to sleep|sky off/.test(command)){
      enabled=false;
      try{recognition.stop()}catch{}
      updateButtons();
      status('Sky listening off');
      return;
    }

    if(/scroll to (bottom|end)|go to (the )?bottom/.test(command)){
      window.scrollTo({top:document.documentElement.scrollHeight,behavior:'smooth'});
      status('Going to bottom');
      return;
    }
    if(/scroll to (top|start)|go to (the )?top/.test(command)){
      window.scrollTo({top:0,behavior:'smooth'});
      status('Going to top');
      return;
    }
    if(/scroll down|go down|move down/.test(command)){
      window.scrollBy({top:Math.max(500,Math.round(innerHeight*.8)),behavior:'smooth'});
      status('Scrolling down');
      return;
    }
    if(/scroll up|go up|move up/.test(command)){
      window.scrollBy({top:-Math.max(500,Math.round(innerHeight*.8)),behavior:'smooth'});
      status('Scrolling up');
      return;
    }

    if(/open|show|go to|bring/.test(command)&&/(pictures|photos|gallery)/.test(command)){openPictures();return}
    if(/open|show|go to|bring/.test(command)&&/(scanner|scan)/.test(command)){openScan();return}
    if(/open|show|go to|bring/.test(command)&&/tools/.test(command)){openTools();return}
    if(/open|show|go to|bring|start/.test(command)&&/camera/.test(command)){await openCamera();return}

    if(/take|snap|capture/.test(command)&&/(picture|photo)/.test(command)){
      await openCamera();
      setTimeout(()=>typeof takePhoto==='function'&&takePhoto(),500);
      status('Taking picture');
      return;
    }
    if(/flip|switch/.test(command)&&/camera/.test(command)){await openCamera();if(typeof switchCamera==='function')await switchCamera();status('Camera flipped');return}
    if(/start recording|record video|start video/.test(command)){await openCamera();if(typeof toggleRecording==='function')toggleRecording();status('Recording started');return}
    if(/stop recording|stop video/.test(command)){if(typeof toggleRecording==='function')toggleRecording();status('Recording stopped');return}

    if(/flash|flashlight|torch/.test(command)&&/on/.test(command)){await openCamera();if(typeof setRearFlash==='function')await setRearFlash(true);status('Flash on');return}
    if(/flash|flashlight|torch/.test(command)&&/off/.test(command)){if(typeof setRearFlash==='function')await setRearFlash(false);status('Flash off');return}

    if(/brightness up|brighter/.test(command)){const e=document.getElementById('brightnessRange');setRange('brightnessRange',Number(e?.value||100)+10);status('Brightness raised');return}
    if(/brightness down|darker/.test(command)){const e=document.getElementById('brightnessRange');setRange('brightnessRange',Number(e?.value||100)-10);status('Brightness lowered');return}
    const brightness=command.match(/brightness(?: to)?\s*(\d{2,3})/);
    if(brightness){setRange('brightnessRange',Number(brightness[1]));status(`Brightness ${brightness[1]} percent`);return}

    if(/normal mode/.test(command)){setSelect('modeSelect','normal');status('Normal mode');return}
    if(/night mode|dark walk/.test(command)){setSelect('modeSelect','night');status('Night mode');return}
    if(/steady.*on/.test(command)){setChecked('steadyToggle',true);status('Steady mode on');return}
    if(/steady.*off/.test(command)){setChecked('steadyToggle',false);status('Steady mode off');return}
    if(/grid.*on/.test(command)){setChecked('gridToggle',true);status('Grid on');return}
    if(/grid.*off/.test(command)){setChecked('gridToggle',false);status('Grid off');return}

    if(/no watermark|watermark none/.test(command)){setSelect('watermarkChoice','none');status('No watermark');return}
    if(/personal watermark/.test(command)){setSelect('watermarkChoice','personal');status('Personal watermark');return}
    if(/osko.*watermark/.test(command)){setSelect('watermarkChoice','osko');status('OSKO watermark');return}
    if(/alaska.*watermark/.test(command)){setSelect('watermarkChoice','alaska');status('Alaska watermark');return}
    if(/work watermark/.test(command)){setSelect('watermarkChoice','work');status('Work watermark');return}

    status('Command not recognized. Nothing was saved as a note.');
  }

  function schedule(delay=300){
    clearTimeout(restartTimer);
    if(!enabled||document.hidden||starting||listening)return;
    restartTimer=setTimeout(()=>{
      if(!enabled||document.hidden||starting||listening)return;
      starting=true;
      try{recognition.start()}catch{}
      setTimeout(()=>{starting=false},650);
    },delay);
  }

  function startListening(){
    enabled=true;
    try{recognition.stop()}catch{}
    setTimeout(()=>schedule(30),120);
    status('Starting Sky listening');
  }

  if(!Recognition){button.disabled=true;floating.disabled=true;status('Sky voice needs Chrome speech support');return}
  recognition=new Recognition();
  recognition.lang='en-US';
  recognition.continuous=false;
  recognition.interimResults=false;
  recognition.maxAlternatives=1;
  recognition.onstart=()=>{starting=false;listening=true;updateButtons();status('Sky is listening')};
  recognition.onresult=event=>run(event.results?.[0]?.[0]?.transcript||'').catch(()=>status('Voice command failed'));
  recognition.onerror=event=>{starting=false;listening=false;updateButtons();if(!['no-speech','aborted'].includes(event.error))status('Voice error: '+event.error);schedule(700)};
  recognition.onend=()=>{starting=false;listening=false;updateButtons();schedule(400)};

  button.addEventListener('click',startListening);
  floating.addEventListener('click',startListening);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)try{recognition.stop()}catch{};else if(enabled)schedule(250)});
  window.addEventListener('focus',()=>{if(enabled)schedule(250)});
  setInterval(()=>{if(enabled&&!listening&&!document.hidden)schedule(50)},1800);
  window.oskoRunVoiceCommand=run;
  updateButtons();
})();