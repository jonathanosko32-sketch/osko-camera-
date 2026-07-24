(()=>{
  const mode=document.getElementById('modeSelect');
  const color=document.getElementById('scanColorSelect');
  const settings=document.querySelector('.settings-panel');
  if(!mode||!color||!settings)return;
  const panel=document.createElement('section');
  panel.className='scanner-quick-panel';
  panel.innerHTML=`<h3>Paperwork scanner</h3><p>Choose the scan look first. These buttons turn on Document Scanner automatically.</p><div class="scanner-quick-buttons"><button type="button" data-scan-quick="color">Color scan</button><button type="button" data-scan-quick="gray">Grayscale scan</button><button type="button" data-scan-quick="bw">Black & white scan</button></div>`;
  settings.insertAdjacentElement('afterend',panel);
  const buttons=[...panel.querySelectorAll('[data-scan-quick]')];
  function mark(){buttons.forEach(b=>b.classList.toggle('active',mode.value==='scanner'&&color.value===b.dataset.scanQuick));}
  buttons.forEach(button=>button.addEventListener('click',()=>{
    mode.value='scanner';
    color.value=button.dataset.scanQuick;
    mode.dispatchEvent(new Event('change',{bubbles:true}));
    color.dispatchEvent(new Event('change',{bubbles:true}));
    mark();
    document.getElementById('scannerControls')?.scrollIntoView({behavior:'smooth',block:'center'});
  }));
  mode.addEventListener('change',mark);
  color.addEventListener('change',mark);
  mark();
})();