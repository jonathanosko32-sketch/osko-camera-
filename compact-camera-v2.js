(()=>{
  'use strict';
  const card=document.getElementById('cameraCard');
  if(!card)return;

  const byId=id=>document.getElementById(id);
  const zoomRange=byId('zoomRange');
  const quickTorch=byId('quickTorchBtn');
  const fullBtn=byId('fullscreenBtn');
  const closeBtn=byId('cameraExit');
  const switchBtn=byId('quickSwitchBtn');
  const photoBtn=byId('quickCaptureBtn');
  const videoBtn=byId('quickRecordBtn');
  const watermarkChoice=byId('watermarkChoice');
  const stampToggle=byId('stampToggle');
  const modeSelect=byId('modeSelect');
  const gridToggle=byId('gridToggle');
  const timerSelect=byId('timerSelect');
  const steadyToggle=byId('steadyToggle');
  const settingsPanel=document.querySelector('.settings-panel');

  document.querySelectorAll('.osko-compact-top,.osko-compact-bottom,.osko-more-sheet').forEach(el=>el.remove());

  const style=document.createElement('style');
  style.textContent=`
    #cameraCard{min-height:640px!important;overflow:hidden!important}
    #quickTorchBtn,#steadyBadge,#fullscreenBtn,#modeBadge,#cameraExit,
    .osko-quick-zoom-side,.osko-stamp-tools,.osko-exposure-control,
    .camera-light-btn,.camera-light-glow,.camera-live-overlay,
    .mobile-camera-overlay-controls,.mobile-camera-controls{display:none!important}

    .osko-compact-top{position:absolute;left:10px;right:10px;top:10px;z-index:90;height:44px;display:flex;align-items:center;justify-content:center;gap:5px;padding:0 8px;border-radius:22px;background:rgba(3,13,24,.72);backdrop-filter:blur(8px)}
    .osko-compact-top button{appearance:none;border:0;background:transparent;color:#fff;min-width:34px;height:36px;padding:0 7px;font:800 14px/1 system-ui,sans-serif;border-radius:10px}
    .osko-compact-top button.active{color:#8fe6ff;background:rgba(113,214,255,.14)}
    .osko-compact-top .flash{font-size:19px;margin-right:3px}
    .osko-compact-top .more{margin-left:auto;font-size:11px;letter-spacing:.06em}
    .osko-compact-top .full{font-size:11px}

    .osko-compact-bottom{position:absolute;left:10px;right:10px;bottom:112px;z-index:89;display:grid;grid-template-columns:1fr 1.25fr 1.25fr;gap:6px;padding:5px;border-radius:18px;background:rgba(3,13,24,.70);backdrop-filter:blur(8px)}
    .osko-compact-bottom button{min-height:36px;border:1px solid rgba(255,255,255,.7);border-radius:13px;background:rgba(11,35,53,.88);color:#fff;font:800 10px/1.05 system-ui,sans-serif;padding:5px 4px}
    .osko-compact-bottom button.active{background:#087f9d}

    .viewfinder-controls{position:absolute!important;left:50%!important;right:auto!important;bottom:18px!important;transform:translateX(-50%)!important;width:86%!important;max-width:390px!important;display:grid!important;grid-template-columns:74px 1fr 74px!important;align-items:end!important;justify-items:center!important;gap:12px!important;z-index:91!important}
    .viewfinder-controls .viewfinder-small{width:60px!important;height:60px!important;border-radius:50%!important;position:relative!important;font-size:0!important}
    .viewfinder-controls .shutter{width:80px!important;height:80px!important;border-radius:50%!important}
    .viewfinder-controls #quickSwitchBtn::after{content:'SWITCH';position:absolute;left:50%;top:66px;transform:translateX(-50%);font:800 10px system-ui;color:#fff;white-space:nowrap}
    .viewfinder-controls #quickCaptureBtn::after{content:'PHOTO';position:absolute;left:50%;top:86px;transform:translateX(-50%);font:800 10px system-ui;color:#fff;white-space:nowrap}
    .viewfinder-controls #quickRecordBtn::after{content:'VIDEO';position:absolute;left:50%;top:66px;transform:translateX(-50%);font:800 10px system-ui;color:#fff;white-space:nowrap}

    .osko-more-sheet{position:absolute;left:10px;right:10px;bottom:108px;z-index:120;padding:12px;border-radius:22px;background:rgba(5,16,28,.96);border:1px solid rgba(160,225,255,.38);box-shadow:0 12px 36px rgba(0,0,0,.55)}
    .osko-more-sheet[hidden]{display:none!important}
    .osko-more-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;color:#fff;font:800 13px system-ui}
    .osko-more-head button{border:0;background:transparent;color:#fff;font:800 18px system-ui}
    .osko-more-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
    .osko-more-grid button{min-height:48px;border:1px solid rgba(255,255,255,.22);border-radius:14px;background:#10283a;color:#fff;font:800 11px/1.15 system-ui;padding:6px}
    .osko-more-grid button.active{background:#087f9d;border-color:#bceeff}

    @media(max-width:420px){
      #cameraCard{min-height:590px!important}
      .osko-compact-top{left:6px;right:6px;top:6px;gap:2px;padding:0 5px}
      .osko-compact-top button{min-width:30px;padding:0 5px;font-size:13px}
      .osko-compact-bottom{left:6px;right:6px;bottom:104px}
      .osko-compact-bottom button{font-size:9px}
      .viewfinder-controls{bottom:14px!important;width:88%!important;grid-template-columns:66px 1fr 66px!important;gap:8px!important}
      .viewfinder-controls .viewfinder-small{width:54px!important;height:54px!important}
      .viewfinder-controls .shutter{width:74px!important;height:74px!important}
      .viewfinder-controls #quickSwitchBtn::after,.viewfinder-controls #quickRecordBtn::after{top:60px}
      .viewfinder-controls #quickCaptureBtn::after{top:80px}
      .osko-more-sheet{left:6px;right:6px;bottom:102px}
    }
  `;
  document.head.appendChild(style);

  const top=document.createElement('div');
  top.className='osko-compact-top';
  top.setAttribute('aria-label','Compact camera controls');
  const flash=document.createElement('button');flash.type='button';flash.className='flash';flash.textContent='⚡';flash.setAttribute('aria-label','Flash for dark rooms');
  top.appendChild(flash);
  const zoomButtons=[];
  [1,2,4,8].forEach(level=>{
    const b=document.createElement('button');b.type='button';b.textContent=String(level);b.dataset.zoom=String(level);b.setAttribute('aria-label',`${level} times zoom`);top.appendChild(b);zoomButtons.push(b);
  });
  const full=document.createElement('button');full.type='button';full.className='full';full.textContent='FULL';
  const more=document.createElement('button');more.type='button';more.className='more';more.textContent='MORE';
  top.append(full,more);
  card.appendChild(top);

  const bottom=document.createElement('div');bottom.className='osko-compact-bottom';
  const close=document.createElement('button');close.type='button';close.textContent='CLOSE';
  const mark=document.createElement('button');mark.type='button';
  const date=document.createElement('button');date.type='button';
  bottom.append(close,mark,date);card.appendChild(bottom);

  const sheet=document.createElement('section');sheet.className='osko-more-sheet';sheet.hidden=true;
  sheet.innerHTML=`<div class="osko-more-head"><span>MORE CAMERA TOOLS</span><button type="button" aria-label="Close more tools">×</button></div><div class="osko-more-grid"></div>`;
  card.appendChild(sheet);
  const grid=sheet.querySelector('.osko-more-grid');

  const tools=[
    ['NORMAL',()=>setMode('normal')],['NIGHT',()=>setMode('night')],['DOCUMENT',()=>setMode('document')],
    ['SCAN',()=>setMode('scanner')],['QR / CODES',()=>setMode('codes')],['GRID',()=>toggleCheckbox(gridToggle)],
    ['TIMER',cycleTimer],['STEADY',()=>toggleCheckbox(steadyToggle)],['SETTINGS',openSettings]
  ];
  tools.forEach(([label,action])=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.tool=label;b.addEventListener('click',()=>{action();refresh();});grid.appendChild(b);});

  function setMode(value){if(!modeSelect)return;modeSelect.value=value;modeSelect.dispatchEvent(new Event('change',{bubbles:true}));}
  function toggleCheckbox(el){if(!el)return;el.checked=!el.checked;el.dispatchEvent(new Event('change',{bubbles:true}));}
  function cycleTimer(){if(!timerSelect)return;const values=['0','3','5','10'];const next=values[(values.indexOf(timerSelect.value)+1)%values.length];timerSelect.value=next;timerSelect.dispatchEvent(new Event('change',{bubbles:true}));}
  function openSettings(){if(settingsPanel){settingsPanel.open=true;settingsPanel.scrollIntoView({behavior:'smooth',block:'start'});}sheet.hidden=true;}
  function maxZoom(){return Number(zoomRange?.max||1)}
  function applyZoom(level){if(!zoomRange||zoomRange.disabled)return;const value=Math.min(maxZoom(),level);zoomRange.value=String(value);zoomRange.dispatchEvent(new Event('input',{bubbles:true}));zoomRange.dispatchEvent(new Event('change',{bubbles:true}));refresh();}
  zoomButtons.forEach(b=>b.addEventListener('click',()=>applyZoom(Number(b.dataset.zoom))));

  flash.addEventListener('click',()=>quickTorch?.click());
  full.addEventListener('click',()=>fullBtn?.click());
  more.addEventListener('click',()=>{sheet.hidden=!sheet.hidden;});
  sheet.querySelector('.osko-more-head button').addEventListener('click',()=>{sheet.hidden=true;});
  close.addEventListener('click',()=>closeBtn?.click());
  mark.addEventListener('click',()=>window.oskoStampWatermark?.setWatermark?.(watermarkChoice?.value!=='alaska'));
  date.addEventListener('click',()=>window.oskoStampWatermark?.setDate?.(!stampToggle?.checked));

  function refresh(){
    const current=Number(zoomRange?.value||1),max=maxZoom();
    zoomButtons.forEach(b=>{const z=Number(b.dataset.zoom);b.disabled=z>max+.01;b.classList.toggle('active',Math.abs(Math.min(z,max)-current)<.12);});
    const flashOn=Boolean(quickTorch?.classList.contains('active')||document.getElementById('torchToggle')?.checked);
    flash.classList.toggle('active',flashOn);flash.title=flashOn?'Flash on':'Flash off';
    const markOn=watermarkChoice?.value==='alaska';mark.classList.toggle('active',markOn);mark.textContent=markOn?'WATERMARK ON':'WATERMARK OFF';
    const dateOn=Boolean(stampToggle?.checked);date.classList.toggle('active',dateOn);date.textContent=dateOn?'DATE/TIME ON':'DATE/TIME OFF';
    grid.querySelectorAll('button[data-tool]').forEach(b=>{
      const t=b.dataset.tool;
      b.classList.toggle('active',(t===String(modeSelect?.value||'').toUpperCase())||(t==='GRID'&&gridToggle?.checked)||(t==='STEADY'&&steadyToggle?.checked));
      if(t==='TIMER')b.textContent=`TIMER ${timerSelect?.value==='0'?'OFF':timerSelect?.value+'s'}`;
    });
  }

  [zoomRange,watermarkChoice,stampToggle,modeSelect,gridToggle,timerSelect,steadyToggle].filter(Boolean).forEach(el=>{el.addEventListener('input',refresh);el.addEventListener('change',refresh);});
  quickTorch?.addEventListener('click',()=>setTimeout(refresh,180));
  setInterval(refresh,900);
  refresh();
})();