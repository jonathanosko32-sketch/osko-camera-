(()=>{
  const $=s=>document.querySelector(s);
  const voiceBtn=$('#voiceCommandBtn');
  const voiceStatus=$('#voiceStatus');
  if(!voiceBtn)return;

  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  let recognition=null;
  let listening=false;

  function status(message){
    if(voiceStatus)voiceStatus.textContent=message;
    if(typeof setStatus==='function')setStatus(message);
  }
  function speak(message){
    if(!('speechSynthesis'in window))return;
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(message);
    u.rate=.95;
    speechSynthesis.speak(u);
  }
  function click(id){const el=document.getElementById(id);if(el){el.click();return true}return false}
  function chooseView(name){document.querySelector(`.compact-nav [data-view="${name}"]`)?.click()}
  function setMode(value){
    const mode=$('#modeSelect');if(!mode)return false;
    mode.value=value;mode.dispatchEvent(new Event('change',{bubbles:true}));return true;
  }
  function toggle(id,on){
    const el=document.getElementById(id);if(!el)return false;
    if(typeof on==='boolean')el.checked=on;else el.checked=!el.checked;
    el.dispatchEvent(new Event('change',{bubbles:true}));return true;
  }
  function setRange(id,value){
    const el=document.getElementById(id);if(!el)return false;
    const min=Number(el.min||0),max=Number(el.max||100);
    el.value=Math.max(min,Math.min(max,value));el.dispatchEvent(new Event('input',{bubbles:true}));return true;
  }
  function latest(){return typeof captures!=='undefined'?captures[0]:null}

  async function run(spoken){
    const original=String(spoken||'').trim();
    let c=original.toLowerCase().replace(/\b(sky|skie|hey sky|hey skie)\b/g,'').trim();
    if(!c)return;
    status(`Heard: ${original}`);

    if(/open|start/.test(c)&&/camera/.test(c)){chooseView('camera');if(typeof stream==='undefined'||!stream)await startCamera();speak('Camera open');return}
    if(/stop|close|turn off/.test(c)&&/camera/.test(c)){if(typeof stream!=='undefined'&&stream)await stopCamera();speak('Camera stopped');return}
    if(/take|snap|capture/.test(c)&&/(photo|picture)/.test(c)||/^(photo|picture)$/.test(c)){if(typeof stream==='undefined'||!stream)await startCamera();await takePhoto();speak('Picture taken');return}
    if(/start|record/.test(c)&&/video/.test(c)){if(typeof stream==='undefined'||!stream)await startCamera();toggleRecording();speak('Video recording');return}
    if(/stop/.test(c)&&/video|recording/.test(c)){toggleRecording();speak('Video stopped');return}
    if(/flip|switch/.test(c)&&/camera|view/.test(c)){await switchCamera();speak('Camera switched');return}
    if(/flash|torch|light/.test(c)&&/on/.test(c)){await setRearFlash(true);speak('Rear light on');return}
    if(/flash|torch|light/.test(c)&&/off/.test(c)){await setRearFlash(false);speak('Rear light off');return}
    if(/selfie light/.test(c)&&/on/.test(c)){toggle('screenLightToggle',true);speak('Selfie light on');return}
    if(/selfie light/.test(c)&&/off/.test(c)){toggle('screenLightToggle',false);speak('Selfie light off');return}

    if(/open|show|go to/.test(c)&&/scan/.test(c)){chooseView('scan');speak('Scanner open');return}
    if(/color scan/.test(c)){chooseView('scan');setMode('scanner');const el=$('#scanColorSelect');if(el){el.value='color';el.dispatchEvent(new Event('change',{bubbles:true}))}if(typeof stream==='undefined'||!stream)await startCamera();speak('Color scanner ready');return}
    if(/gray|grayscale/.test(c)){chooseView('scan');setMode('scanner');const el=$('#scanColorSelect');if(el){el.value='gray';el.dispatchEvent(new Event('change',{bubbles:true}))}if(typeof stream==='undefined'||!stream)await startCamera();speak('Grayscale scanner ready');return}
    if(/black.*white/.test(c)){chooseView('scan');setMode('scanner');const el=$('#scanColorSelect');if(el){el.value='bw';el.dispatchEvent(new Event('change',{bubbles:true}))}if(typeof stream==='undefined'||!stream)await startCamera();speak('Black and white scanner ready');return}
    if(/scan page|add page|capture page/.test(c)){if(typeof stream==='undefined'||!stream)await startCamera();await captureNow(true);speak('Scan page added');return}
    if(/print|save pdf/.test(c)){click('printScansBtn');speak('Opening PDF');return}
    if(/share scans?/.test(c)){click('shareScansBtn');return}
    if(/universal|barcode|qr|code scanner/.test(c)){chooseView('scan');setMode('codes');if(typeof stream==='undefined'||!stream)await startCamera();speak('Code scanner ready');return}

    if(/normal mode|modern mode|2026/.test(c)){setMode('normal');speak('Normal mode');return}
    if(/80s|eighties/.test(c)){setMode('eighties');speak('Eighties mode');return}
    if(/document mode/.test(c)){setMode('document');speak('Document mode');return}
    if(/night|dark walk/.test(c)){setMode('night');speak('Night mode');return}
    if(/steady/.test(c)&&/on/.test(c)){toggle('steadyToggle',true);speak('Steady mode on');return}
    if(/steady/.test(c)&&/off/.test(c)){toggle('steadyToggle',false);speak('Steady mode off');return}
    if(/grid/.test(c)&&/on/.test(c)){toggle('gridToggle',true);speak('Grid on');return}
    if(/grid/.test(c)&&/off/.test(c)){toggle('gridToggle',false);speak('Grid off');return}
    if(/date.*stamp/.test(c)&&/on/.test(c)){toggle('stampToggle',true);speak('Date stamp on');return}
    if(/date.*stamp/.test(c)&&/off/.test(c)){toggle('stampToggle',false);speak('Date stamp off');return}
    if(/location.*stamp/.test(c)&&/on/.test(c)){toggle('locationToggle',true);speak('Location stamp on');return}
    if(/location.*stamp/.test(c)&&/off/.test(c)){toggle('locationToggle',false);speak('Location stamp off');return}
    const zoom=c.match(/zoom(?: to)?\s*(\d+(?:\.\d+)?)/);if(zoom){setRange('zoomRange',Number(zoom[1]));speak(`Zoom ${zoom[1]}`);return}
    const bright=c.match(/brightness(?: to)?\s*(\d+)/);if(bright){setRange('brightnessRange',Number(bright[1]));speak(`Brightness ${bright[1]} percent`);return}
    const timer=c.match(/timer(?: for)?\s*(3|5|10)/);if(timer){const el=$('#timerSelect');if(el){el.value=timer[1];el.dispatchEvent(new Event('change',{bubbles:true}))}speak(`${timer[1]} second timer`);return}
    if(/timer off/.test(c)){const el=$('#timerSelect');if(el)el.value='0';speak('Timer off');return}

    if(/open|show|go to/.test(c)&&/(pictures|gallery|photos)/.test(c)){chooseView('gallery');speak('Pictures open');return}
    if(/open|show|go to/.test(c)&&/tools/.test(c)){chooseView('tools');speak('Tools open');return}
    if(/save last|save picture|save photo/.test(c)){chooseView('tools');click('saveLastBtn');speak('Saving last picture');return}
    if(/share last|send picture|send photo/.test(c)){click('shareLastBtn');return}
    if(/website copy/.test(c)){click('websiteCopyBtn')||click('saveWebsiteBtn');speak('Making website copy');return}
    if(/job proof/.test(c)){click('jobProofBtn');return}
    if(/before.*after/.test(c)){click('beforeAfterBtn');return}
    if(/damage markup|mark damage/.test(c)){click('damageBtn');return}
    if(/aurora burst|burst/.test(c)){click('auroraBurstBtn');return}
    if(/backup/.test(c)){click('backupBtn');return}
    if(/read notes/.test(c)){click('readNotesBtn');return}
    if(/clear notes/.test(c)){click('clearNotesBtn');return}
    const note=original.match(/(?:write|save|make|take) (?:a )?note(?: down)?[,:]?\s*(.*)/i);
    if(note){const input=$('#noteInput');if(input)input.value=note[1]||'';click('saveNoteBtn');speak('Note saved');return}

    status('I did not recognize that command');
    speak('I did not recognize that command');
  }

  if(!Recognition){voiceBtn.disabled=true;status('Voice commands need Chrome speech support');return}
  recognition=new Recognition();
  recognition.lang='en-US';recognition.interimResults=false;recognition.continuous=false;
  recognition.onstart=()=>{listening=true;voiceBtn.textContent='Listening…';voiceBtn.classList.add('active');status('Say: Sky, take a picture');};
  recognition.onresult=e=>run(e.results[0][0].transcript).catch(err=>{console.error(err);status('Voice command failed')});
  recognition.onerror=e=>status(`Voice error: ${e.error}`);
  recognition.onend=()=>{listening=false;voiceBtn.textContent='Talk to Skie';voiceBtn.classList.remove('active');};
  voiceBtn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();if(listening)recognition.stop();else recognition.start();},true);
  window.oskoRunVoiceCommand=run;
})();