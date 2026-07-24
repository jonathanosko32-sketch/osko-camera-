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
  function click(id){
    const el=document.getElementById(id);
    if(!el)return false;
    el.click();
    return true;
  }
  function setMode(value){
    const mode=$('#modeSelect');
    if(!mode)return false;
    mode.value=value;
    mode.dispatchEvent(new Event('change',{bubbles:true}));
    return true;
  }
  function toggle(id,on){
    const el=document.getElementById(id);
    if(!el)return false;
    el.checked=typeof on==='boolean'?on:!el.checked;
    el.dispatchEvent(new Event('change',{bubbles:true}));
    return true;
  }
  function setRange(id,value){
    const el=document.getElementById(id);
    if(!el)return false;
    const min=Number(el.min||0),max=Number(el.max||100);
    el.value=Math.max(min,Math.min(max,value));
    el.dispatchEvent(new Event('input',{bubbles:true}));
    return true;
  }
  function sectionFor(selector){return $(selector)?.closest('.compact-section')||$(selector)}
  function closeAllDrawers(){document.querySelectorAll('details.compact-section').forEach(d=>d.open=false)}
  function openDrawerByText(words){
    const terms=Array.isArray(words)?words:[words];
    const drawer=[...document.querySelectorAll('details.compact-section')].find(d=>{
      const t=(d.querySelector('summary')?.textContent||'').toLowerCase();
      return terms.some(word=>t.includes(word));
    });
    if(drawer){closeAllDrawers();drawer.open=true;return drawer}
    return null;
  }
  function setView(view){
    const camera=$('#cameraCard'),error=$('#errorBox'),primary=$('.primary-actions'),settings=$('.settings-panel');
    const code=sectionFor('#codeScannerPanel'),paper=sectionFor('.scanner-quick-panel');
    const tools=$('.osko-tools'),native=$('.native-button'),gallery=$('.gallery-section');
    const map=new Map([
      [camera,new Set(['camera','scan'])],[error,new Set(['camera','scan'])],[primary,new Set(['camera','scan'])],[settings,new Set(['camera','scan'])],
      [code,new Set(['scan'])],[paper,new Set(['scan'])],[tools,new Set(['tools'])],[native,new Set(['tools'])],[gallery,new Set(['gallery'])]
    ]);
    map.forEach((allowed,el)=>{if(el)el.classList.toggle('app-view-hidden',!allowed.has(view))});
    document.querySelectorAll('.compact-nav [data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
    localStorage.setItem('osko-camera-view',view);
  }
  function moveTo(el){setTimeout(()=>el?.scrollIntoView({behavior:'smooth',block:'start'}),120)}
  async function ensureCamera(){
    if(typeof stream!=='undefined'&&stream)return true;
    if(typeof startCamera==='function'){
      await startCamera();
      return typeof stream!=='undefined'&&!!stream;
    }
    click('startBtn');
    return false;
  }
  async function openCamera(){
    closeAllDrawers();setView('camera');
    const ok=await ensureCamera();
    moveTo($('#cameraCard'));
    status(ok?'Camera open':'Tap Start and allow camera permission');
  }
  async function openPaperScanner(color){
    setView('scan');
    const drawer=openDrawerByText(['paperwork scanner','paperwork']);
    setMode('scanner');
    const colorSelect=$('#scanColorSelect');
    if(colorSelect&&color){colorSelect.value=color;colorSelect.dispatchEvent(new Event('change',{bubbles:true}))}
    await ensureCamera();
    drawer?.classList.remove('app-view-hidden');
    moveTo($('#cameraCard'));
    status('Paperwork scanner open');
  }
  async function openCodeScanner(){
    setView('scan');
    openDrawerByText(['universal code','code scanner']);
    setMode('codes');
    await ensureCamera();
    moveTo($('#cameraCard'));
    status('Code scanner open');
  }
  function openToolsDrawer(words,label){
    setView('tools');
    const drawer=openDrawerByText(words);
    moveTo(drawer||$('.osko-tools'));
    status(`${label} open`);
  }

  async function run(spoken){
    const original=String(spoken||'').trim();
    let c=original.toLowerCase().replace(/\b(hey\s+)?(sky|skie)\b/g,'').trim();
    if(!c)return;
    status(`Heard: ${original}`);

    if(/close everything|collapse everything|hide everything/.test(c)){closeAllDrawers();setView('camera');moveTo($('#cameraCard'));speak('Everything closed');return}
    if(/open|show|go to/.test(c)&&/(document scanner|paperwork scanner|scan document|document scan)/.test(c)){await openPaperScanner();speak('Paperwork scanner open');return}
    if(/color scan/.test(c)){await openPaperScanner('color');speak('Color scanner ready');return}
    if(/gray|grayscale/.test(c)){await openPaperScanner('gray');speak('Grayscale scanner ready');return}
    if(/black.*white/.test(c)){await openPaperScanner('bw');speak('Black and white scanner ready');return}
    if(/open|show|go to/.test(c)&&/(universal|barcode|qr|code scanner)/.test(c)){await openCodeScanner();speak('Code scanner open');return}
    if(/open|show|go to/.test(c)&&/scan/.test(c)){await openPaperScanner();speak('Scanner open');return}

    if(/open|start/.test(c)&&/camera/.test(c)){await openCamera();speak('Camera open');return}
    if(/stop|close|turn off/.test(c)&&/camera/.test(c)){if(typeof stream!=='undefined'&&stream&&typeof stopCamera==='function')await stopCamera();setView('camera');moveTo($('#cameraCard'));speak('Camera stopped');return}
    if((/take|snap|capture/.test(c)&&/(photo|picture)/.test(c))||/^(photo|picture)$/.test(c)){await openCamera();if(typeof takePhoto==='function')await takePhoto();speak('Picture taken');return}
    if(/start|record/.test(c)&&/video/.test(c)){await openCamera();if(typeof toggleRecording==='function')toggleRecording();speak('Video recording');return}
    if(/stop/.test(c)&&/(video|recording)/.test(c)){if(typeof toggleRecording==='function')toggleRecording();speak('Video stopped');return}
    if(/flip|switch/.test(c)&&/(camera|view)/.test(c)){if(typeof switchCamera==='function')await switchCamera();speak('Camera switched');return}
    if(/flash|torch|rear light/.test(c)&&/on/.test(c)){if(typeof setRearFlash==='function')await setRearFlash(true);speak('Rear light on');return}
    if(/flash|torch|rear light/.test(c)&&/off/.test(c)){if(typeof setRearFlash==='function')await setRearFlash(false);speak('Rear light off');return}
    if(/selfie light/.test(c)&&/on/.test(c)){toggle('screenLightToggle',true);speak('Selfie light on');return}
    if(/selfie light/.test(c)&&/off/.test(c)){toggle('screenLightToggle',false);speak('Selfie light off');return}

    if(/scan page|add page|capture page/.test(c)){await openPaperScanner();if(typeof captureNow==='function')await captureNow(true);speak('Scan page added');return}
    if(/print|save pdf/.test(c)){setView('scan');click('printScansBtn');speak('Opening PDF');return}
    if(/share scans?/.test(c)){setView('scan');click('shareScansBtn');return}

    if(/normal mode|modern mode|2026/.test(c)){setView('camera');setMode('normal');speak('Normal mode');return}
    if(/80s|eighties/.test(c)){setView('camera');setMode('eighties');speak('Eighties mode');return}
    if(/document mode/.test(c)){setView('camera');setMode('document');speak('Document mode');return}
    if(/night|dark walk/.test(c)){setView('camera');setMode('night');speak('Night mode');return}
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

    if(/open|show|go to/.test(c)&&/(pictures|gallery|photos)/.test(c)){closeAllDrawers();setView('gallery');moveTo($('.gallery-section'));speak('Pictures open');return}
    if(/open|show|go to/.test(c)&&/tools/.test(c)){closeAllDrawers();setView('tools');moveTo($('.osko-tools'));speak('Tools open');return}
    if(/open|show|go to/.test(c)&&/save/.test(c)){openToolsDrawer(['save, folders','watermark'],'Save tools');speak('Save tools open');return}
    if(/open|show|go to/.test(c)&&/notes?/.test(c)){openToolsDrawer(['notes and skie','notes'],'Notes');speak('Notes open');return}
    if(/open|show|go to/.test(c)&&/(stickers?|emojis?)/.test(c)){openToolsDrawer(['emojis and stickers','stickers'],'Stickers');speak('Stickers open');return}
    if(/open|show|go to/.test(c)&&/(photo workshop|workshop)/.test(c)){openToolsDrawer(['photo workshop','workshop'],'Photo workshop');speak('Photo workshop open');return}
    if(/close|hide/.test(c)&&/(tools|pictures|scanner|scan|notes|stickers|save|workshop)/.test(c)){closeAllDrawers();setView('camera');moveTo($('#cameraCard'));speak('Closed');return}

    if(/save last|save picture|save photo/.test(c)){openToolsDrawer(['save, folders','watermark'],'Save tools');click('saveLastBtn');speak('Saving last picture');return}
    if(/share last|send picture|send photo/.test(c)){click('shareLastBtn');return}
    if(/website copy/.test(c)){click('websiteCopyBtn')||click('saveWebsiteBtn');speak('Making website copy');return}
    if(/job proof/.test(c)){setView('tools');click('jobProofBtn');return}
    if(/before.*after/.test(c)){setView('tools');click('beforeAfterBtn');return}
    if(/damage markup|mark damage/.test(c)){setView('tools');click('damageBtn');return}
    if(/aurora burst|burst/.test(c)){setView('tools');click('auroraBurstBtn');return}
    if(/backup/.test(c)){setView('tools');click('backupBtn');return}
    if(/read notes/.test(c)){openToolsDrawer(['notes and skie','notes'],'Notes');click('readNotesBtn');return}
    if(/clear notes/.test(c)){openToolsDrawer(['notes and skie','notes'],'Notes');click('clearNotesBtn');return}
    const note=original.match(/(?:write|save|make|take) (?:a )?note(?: down)?[,:]?\s*(.*)/i);
    if(note){openToolsDrawer(['notes and skie','notes'],'Notes');const input=$('#noteInput');if(input)input.value=note[1]||'';click('saveNoteBtn');speak('Note saved');return}

    status('I did not recognize that command');
    speak('I did not recognize that command');
  }

  if(!Recognition){voiceBtn.disabled=true;status('Voice commands need Chrome speech support');return}
  recognition=new Recognition();
  recognition.lang='en-US';recognition.interimResults=false;recognition.continuous=false;
  recognition.onstart=()=>{listening=true;voiceBtn.textContent='Listening…';voiceBtn.classList.add('active');status('Say: Sky, open the camera');};
  recognition.onresult=e=>run(e.results[0][0].transcript).catch(err=>{console.error(err);status('Voice command failed')});
  recognition.onerror=e=>status(`Voice error: ${e.error}`);
  recognition.onend=()=>{listening=false;voiceBtn.textContent='Talk to Skie';voiceBtn.classList.remove('active');};
  voiceBtn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();if(listening)recognition.stop();else recognition.start();},true);
  window.oskoRunVoiceCommand=run;
})();