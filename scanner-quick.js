(()=>{
  const mode=document.getElementById('modeSelect');
  const color=document.getElementById('scanColorSelect');
  const settings=document.querySelector('.settings-panel');
  if(!mode||!color||!settings)return;

  const panel=document.createElement('section');
  panel.className='scanner-quick-panel';
  panel.innerHTML=`<h3>Paperwork scanner</h3><p>Choose the scan look. The camera opens automatically, then use Take Photo or Add scan page.</p><div class="scanner-quick-buttons"><button type="button" data-scan-quick="color">Color scan</button><button type="button" data-scan-quick="gray">Grayscale scan</button><button type="button" data-scan-quick="bw">Black & white scan</button></div><button type="button" id="paperworkStartCamera" class="paperwork-start-camera">Start paperwork camera</button>`;
  settings.insertAdjacentElement('afterend',panel);

  const buttons=[...panel.querySelectorAll('[data-scan-quick]')];
  const startButton=panel.querySelector('#paperworkStartCamera');

  function mark(){
    buttons.forEach(button=>button.classList.toggle('active',mode.value==='scanner'&&color.value===button.dataset.scanQuick));
  }

  async function openPaperworkCamera(scanColor){
    mode.value='scanner';
    color.value=scanColor||color.value||'color';
    mode.dispatchEvent(new Event('change',{bubbles:true}));
    color.dispatchEvent(new Event('change',{bubbles:true}));
    settings.open=true;
    mark();
    if(typeof stream==='undefined'||!stream){
      if(typeof startCamera==='function'){
        try{await startCamera();}catch(error){console.warn('Paperwork camera start failed',error);}
      }
    }
    const camera=document.getElementById('cameraCard');
    camera?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  buttons.forEach(button=>button.addEventListener('click',()=>openPaperworkCamera(button.dataset.scanQuick)));
  startButton?.addEventListener('click',()=>openPaperworkCamera(color.value));
  mode.addEventListener('change',mark);
  color.addEventListener('change',mark);
  mark();
})();