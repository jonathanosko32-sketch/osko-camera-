(()=>{
  const $=s=>document.querySelector(s);
  const voiceBtn=$('#voiceCommandBtn');
  const voiceStatus=$('#voiceStatus');
  if(!voiceBtn)return;

  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  let recognition=null;
  let listening=false;

  function status(message){if(voiceStatus)voiceStatus.textContent=message;if(typeof setStatus==='function')setStatus(message)}
  function speak(message){if(!('speechSynthesis'in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(message);u.rate=.95;speechSynthesis.speak(u)}
  function click(id){const el=document.getElementById(id);if(!el)return false;el.click();return true}
  function toggle(id,on){const el=document.getElementById(id);if(!el)return false;el.checked=typeof on==='boolean'?on:!el.checked;el.dispatchEvent(new Event('change',{bubbles:true}));return true}
  function setRange(id,value){const el=document.getElementById(id);if(!el)return false;const min=Number(el.min||0),max=Number(el.max||100);el.value=Math.max(min,Math.min(max,value));el.dispatchEvent(new Event('input',{bubbles:true}));return true}
  function setMode(value){const mode=$('#modeSelect');if(!mode)return false;mode.value=value;mode.dispatchEvent(new Event('change',{bubbles:true}));return true}

  function closeDrawers(){document.querySelectorAll('.compact-section').forEach(d=>d.open=false);const settings=$('.settings-panel');if(settings)settings.open=false}
  function openDrawer(words){
    const all=[...document.querySelectorAll('.compact-section')];
    const target=all.find(d=>d.querySelector('summary')?.textContent.toLowerCase().includes(words));
    if(!target)return false;
    all.forEach(d=>d.open=d===target);
    setTimeout(()=>target.scrollIntoView({behavior:'smooth',block:'start'}),80);
    return true;
  }
  function chooseView(name){
    const btn=document.querySelector(`.compact-nav [data-view="${name}"]`);
    if(btn){btn.click();return true}
    const groups={
      camera:['#cameraCard','#errorBox','.primary-actions','.settings-panel'],
      scan:['#cameraCard','#errorBox','.primary-actions','.settings-panel','.scanner-quick-panel'],
      tools:['.osko-tools','.native-button','.workflow-panel'],
      gallery:['.gallery-section']
    };
    Object.entries(groups).forEach(([group,selectors])=>selectors.forEach(sel=>document.querySelectorAll(sel).forEach(el=>el.classList.toggle('app-view-hidden',group!==name))));
    return false;
  }
  async function ensureCamera(){chooseView('camera');if(typeof stream==='undefined'||!stream){if(typeof startCamera==='function')await startCamera();else click('startBtn')}setTimeout(()=>$('#cameraCard')?.scrollIntoView({behavior:'smooth',block:'start'}),80)}

  async function run(spoken){
    const original=String(spoken||'').trim();
    let c=original.toLowerCase().replace(/\b(hey\s+)?(sky|skie)\b/g,'').trim();
    if(!c)return;
    status(`Heard: ${original}`);

    if(/close (everything|all|menus|drawers|panels)/.test(c)){closeDrawers();chooseView('camera');speak('Everything closed');return}
    if(/open|start|go to|show/.test(c)&&/camera/.test(c)){closeDrawers();await ensureCamera();speak('Camera open');return}
    if(/stop|close|turn off/.test(c)&&/camera/.test(c)){if(typeof stream!=='undefined'&&stream)await stopCamera();closeDrawers();chooseView('camera');speak('Camera stopped');return}
    if((/take|snap|capture/.test(c)&&/(photo|picture)/.test(c))||/^(photo|picture)$/.test(c)){await ensureCamera();await takePhoto();speak('Picture taken');return}
    if(/start|record/.test(c)&&/video/.test(c)){await ensureCamera();toggleRecording();speak('Video recording');return}
    if(/stop/.test(c)&&/(video|recording)/.test(c)){toggleRecording();speak('Video stopped');return}
    if(/flip|switch/.test(c)&&/(camera|view)/.test(c)){await ensureCamera();await switchCamera();speak('Camera switched');return}
    if(/flash|torch|rear light/.test(c)&&/on/.test(c)){await ensureCamera();await setRearFlash(true);speak('Rear light on');return}
    if(/flash|torch|rear light/.test(c)&&/off/.test(c)){await setRearFlash(false);speak('Rear light off');return}
    if(/selfie light/.test(c)&&/on/.test(c)){toggle('screenLightToggle',true);speak('Selfie light on');return}
    if(/selfie light/.test(c)&&/off/.test(c)){toggle('screenLightToggle',false);speak('Selfie light off');return}

    if(/open|show|go to/.test(c)&&/(scan|scanner)/.test(c)){chooseView('scan');openDrawer('paperwork scanner');setMode('scanner');if(typeof stream==='undefined'||!stream)await startCamera();speak('Scanner open');return}
    if(/color scan/.test(c)){chooseView('scan');openDrawer('paperwork scanner');setMode('scanner');const el=$('#scanColorSelect');if(el){el.value='color';el.dispatchEvent(new Event('change',{bubbles:true}))}if(typeof stream==='undefined'||!stream)await startCamera();speak('Color scanner ready');return}
    if(/gray|grayscale/.test(c)){chooseView('scan');openDrawer('paperwork scanner');setMode('scanner');const el=$('#scanColorSelect');if(el){el.value='gray';el.dispatchEvent(new Event('change',{bubbles:true}))}if(typeof stream==='undefined'||!stream)await startCamera();speak('Grayscale scanner ready');return}
    if(/black.*white/.test(c)){chooseView('scan');openDrawer('paperwork scanner');setMode('scanner');const el=$('#scanColorSelect');if(el){el.value='bw';el.dispatchEvent(new Event('change',{bubbles:true}))}if(typeof stream==='undefined'||!stream)await startCamera();speak('Black and white scanner ready');return}
    if(/scan page|add page|capture page/.test(c)){chooseView('scan');openDrawer('paperwork scanner');setMode('scanner');if(typeof stream==='undefined'||!stream)await startCamera();await captureNow(true);speak('Scan page added');return}
    if(/print|save pdf/.test(c)){chooseView('scan');openDrawer('paperwork scanner');click('printScansBtn');speak('Opening PDF');return}
    if(/share scans?/.test(c)){chooseView('scan');openDrawer('paperwork scanner');click('shareScansBtn');return}
    if(/universal|barcode|qr|code scanner/.test(c)){chooseView('scan');openDrawer('universal code scanner');setMode('codes');if(typeof stream==='undefined'||!stream)await startCamera();speak('Code scanner ready');return}

    if(/normal mode|modern mode|2026/.test(c)){chooseView('camera');setMode('normal');speak('Normal mode');return}
    if(/80s|eighties/.test(c)){chooseView('camera');setMode('eighties');speak('Eighties mode');return}
    if(/document mode/.test(c)){chooseView('camera');setMode('document');speak('Document mode');return}
    if(/night|dark walk/.test(c)){chooseView('camera');setMode('night');speak('Night mode');return}
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

    if(/open|show|go to/.test(c)&&/(pictures|gallery|photos)/.test(c)){closeDrawers();chooseView('gallery');setTimeout(()=>$('.gallery-section')?.scrollIntoView({behavior:'smooth',block:'start'}),80);speak('Pictures open');return}
    if(/open|show|go to/.test(c)&&/tools/.test(c)){chooseView('tools');speak('Tools open');return}
    if(/open|show|go to/.test(c)&&/(save|watermark)/.test(c)){chooseView('tools');openDrawer('save, folders and watermark');speak('Save tools open');return}
    if(/open|show|go to/.test(c)&&/(notes|skie)/.test(c)){chooseView('tools');openDrawer('notes and skie');speak('Notes open');return}
    if(/open|show|go to/.test(c)&&/(sticker|emoji)/.test(c)){chooseView('tools');openDrawer('emojis and stickers');speak('Stickers open');return}
    if(/open|show|go to/.test(c)&&/(photo workshop|workshop)/.test(c)){chooseView('tools');openDrawer('photo workshop');speak('Photo workshop open');return}
    if(/save last|save picture|save photo/.test(c)){chooseView('tools');openDrawer('save, folders and watermark');click('saveLastBtn');speak('Saving last picture');return}
    if(/share last|send picture|send photo/.test(c)){click('shareLastBtn');return}
    if(/website copy/.test(c)){click('websiteCopyBtn')||click('saveWebsiteBtn');speak('Making website copy');return}
    if(/job proof/.test(c)){chooseView('tools');click('jobProofBtn');return}
    if(/before.*after/.test(c)){chooseView('tools');click('beforeAfterBtn');return}
    if(/damage markup|mark damage/.test(c)){chooseView('tools');click('damageBtn');return}
    if(/aurora burst|burst/.test(c)){chooseView('tools');click('auroraBurstBtn');return}
    if(/backup/.test(c)){chooseView('tools');click('backupBtn');return}
    if(/read notes/.test(c)){chooseView('tools');openDrawer('notes and skie');click('readNotesBtn');return}
    if(/clear notes/.test(c)){chooseView('tools');openDrawer('notes and skie');click('clearNotesBtn');return}
    const note=original.match(/(?:write|save|make|take) (?:a )?note(?: down)?[,:]?\s*(.*)/i);if(note){chooseView('tools');openDrawer('notes and skie');const input=$('#noteInput');if(input)input.value=note[1]||'';click('saveNoteBtn');speak('Note saved');return}

    status('I did not recognize that command');speak('I did not recognize that command');
  }

  if(!Recognition){voiceBtn.disabled=true;status('Voice commands need Chrome speech support');return}
  recognition=new Recognition();recognition.lang='en-US';recognition.interimResults=false;recognition.continuous=false;
  recognition.onstart=()=>{listening=true;voiceBtn.textContent='Listening…';voiceBtn.classList.add('active');status('Say: Sky, open the camera')};
  recognition.onresult=e=>run(e.results[0][0].transcript).catch(err=>{console.error(err);status('Voice command failed')});
  recognition.onerror=e=>status(`Voice error: ${e.error}`);
  recognition.onend=()=>{listening=false;voiceBtn.textContent='Talk to Skie';voiceBtn.classList.remove('active')};
  voiceBtn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();if(listening)recognition.stop();else recognition.start()},true);
  window.oskoRunVoiceCommand=run;
})();