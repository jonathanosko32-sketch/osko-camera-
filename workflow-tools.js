(() => {
  const $ = s => document.querySelector(s);
  const shell = document.querySelector('.app-shell');
  if (!shell) return;

  const style = document.createElement('style');
  style.textContent = `
    .workflow-panel{margin:18px 0;padding:16px;border:1px solid rgba(130,210,255,.22);border-radius:18px;background:linear-gradient(180deg,rgba(12,39,61,.96),rgba(4,20,33,.96));box-shadow:0 14px 34px rgba(0,0,0,.22)}
    .workflow-panel h2,.workflow-panel h3{margin:.2rem 0 .6rem}.workflow-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.workflow-grid button,.workflow-panel input,.workflow-panel textarea,.workflow-panel select{width:100%;box-sizing:border-box}.workflow-card{margin-top:12px;padding:12px;border-radius:14px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08)}.workflow-row{display:grid;grid-template-columns:1fr 1fr;gap:9px}.workflow-status{margin:.7rem 0 0;color:#bfe9ff}.before-overlay{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;opacity:.38;z-index:2}.markup-stage{width:100%;max-height:420px;object-fit:contain;background:#07131d;border-radius:12px;touch-action:none}.storage-line{font-size:.92rem;color:#cfefff}.danger-mark{accent-color:#ff6b6b}@media(max-width:620px){.workflow-grid,.workflow-row{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const panel = document.createElement('section');
  panel.className = 'workflow-panel';
  panel.innerHTML = `
    <p class="eyebrow">ALASKA ICE CRYSTALS</p><h2>Work, Website & Personal Tools</h2>
    <div class="workflow-grid">
      <button id="jobProofBtn" type="button">Job Proof Mode</button>
      <button id="beforeAfterBtn" type="button">Before / After Guide</button>
      <button id="damageBtn" type="button">Damage Markup</button>
      <button id="websiteSetBtn" type="button">Make Website Set</button>
      <button id="voiceCaptionBtn" type="button">Voice Caption</button>
      <button id="auroraBurstBtn" type="button">Aurora Burst</button>
      <button id="backupBtn" type="button">Backup Settings & Notes</button>
      <label style="display:block"><span class="native-button" style="display:block;text-align:center">Restore Backup<input id="restoreBackupInput" type="file" accept="application/json" hidden></span></label>
    </div>
    <div class="workflow-card">
      <div class="workflow-row"><input id="jobNameInput" placeholder="Job, load, website, or project name"><input id="jobNumberInput" placeholder="Order, load, invoice, or item number"></div>
      <textarea id="workflowCaption" class="note-input" style="min-height:70px" placeholder="Caption, damage note, website description, or memory"></textarea>
      <div class="workflow-row"><select id="websiteShape"><option value="original">Original shape</option><option value="square">Square product photo</option><option value="landscape">Website landscape</option><option value="banner">Wide banner</option><option value="portrait">Phone portrait</option></select><button id="saveProofPackageBtn" type="button">Save Proof Summary</button></div>
      <p id="workflowStatus" class="workflow-status">Ready</p><p id="storageMeter" class="storage-line"></p>
    </div>
    <div id="markupCard" class="workflow-card" hidden><h3>Damage Markup</h3><canvas id="markupCanvas" class="markup-stage"></canvas><div class="workflow-row"><button id="clearMarkupBtn" type="button">Clear marks</button><button id="saveMarkupBtn" type="button">Save marked copy</button></div></div>`;
  const gallerySection = document.querySelector('.gallery-section');
  shell.insertBefore(panel, gallerySection || null);

  const status = $('#workflowStatus');
  const caption = $('#workflowCaption');
  const jobName = $('#jobNameInput');
  const jobNumber = $('#jobNumberInput');
  const shape = $('#websiteShape');
  const storageMeter = $('#storageMeter');
  const markupCard = $('#markupCard');
  const markupCanvas = $('#markupCanvas');
  let beforeOverlay = null;
  let markupBase = null;
  let drawing = false;
  let lastPoint = null;

  const say = m => { status.textContent = m; if (typeof setStatus === 'function') setStatus(m); };
  const latestPhoto = () => (typeof captures !== 'undefined' ? captures.find(c => c.type === 'photo') : null);
  const safeName = s => String(s || '').trim().replace(/[^a-z0-9-_]+/gi,'-').replace(/^-+|-+$/g,'') || 'alaska-ice-crystals';

  function estimateStorage(){
    const bytes = typeof captures === 'undefined' ? 0 : captures.reduce((n,c)=>n+(c.blob?.size||0),0);
    storageMeter.textContent = `Current session storage: ${(bytes/1024/1024).toFixed(1)} MB · ${captures?.length||0} item(s)`;
  }
  const oldRender = typeof renderGallery === 'function' ? renderGallery : null;
  if (oldRender) {
    const wrapped = () => { oldRender(); estimateStorage(); };
    try { window.renderGallery = wrapped; } catch {}
  }
  setInterval(estimateStorage, 2000);

  async function imageBitmapFrom(item){ return createImageBitmap(item.blob); }
  function canvasBlob(c,q=.94){ return new Promise(r=>c.toBlob(r,'image/jpeg',q)); }
  function cropBox(w,h,type){
    const ratios={square:1,landscape:16/9,banner:3,portrait:4/5};
    const ratio=ratios[type]; if(!ratio)return {sx:0,sy:0,sw:w,sh:h};
    const current=w/h; if(current>ratio){const sw=h*ratio;return{sx:(w-sw)/2,sy:0,sw,sh:h}}const sh=w/ratio;return{sx:0,sy:(h-sh)/2,sw:w,sh};
  }
  async function makeVariant(item,maxSide,kind,label,quality){
    const bm=await imageBitmapFrom(item),box=cropBox(bm.width,bm.height,kind),scale=Math.min(1,maxSide/Math.max(box.sw,box.sh));
    const c=document.createElement('canvas');c.width=Math.max(1,Math.round(box.sw*scale));c.height=Math.max(1,Math.round(box.sh*scale));
    const ctx=c.getContext('2d');ctx.drawImage(bm,box.sx,box.sy,box.sw,box.sh,0,0,c.width,c.height);
    const text=caption.value.trim();if(text){const fs=Math.max(18,Math.round(c.width/42));ctx.font=`600 ${fs}px system-ui`;ctx.fillStyle='rgba(0,0,0,.62)';ctx.fillRect(0,c.height-fs*2.2,c.width,fs*2.2);ctx.fillStyle='#fff';ctx.fillText(text.slice(0,90),fs*.7,c.height-fs*1.55)}
    const blob=await canvasBlob(c,quality);addCapture(blob,'photo','jpg',label);return blob;
  }

  $('#websiteSetBtn').addEventListener('click',async()=>{
    const item=latestPhoto();if(!item)return say('Take a photo first');
    say('Making full, website, and thumbnail copies…');
    try{await makeVariant(item,2600,shape.value,'website-full',.95);await makeVariant(item,1600,shape.value,'website',.86);await makeVariant(item,480,shape.value,'thumbnail',.78);say('Website set created: full, web, and thumbnail')}catch(e){console.error(e);say('Website set failed')}
  });

  $('#jobProofBtn').addEventListener('click',()=>{
    stampToggle.checked=true;locationToggle.checked=true;steadyToggle.checked=true;projectFolder && (projectFolder.value='Load Paperwork');updateVisuals?.();say('Job Proof Mode ready — take wide, close, and paperwork photos');
  });

  $('#saveProofPackageBtn').addEventListener('click',()=>{
    const data={created:new Date().toISOString(),job:jobName.value.trim(),number:jobNumber.value.trim(),caption:caption.value.trim(),photoFiles:(captures||[]).filter(c=>c.type==='photo').map(c=>c.filename),location:typeof currentLocation!=='undefined'?currentLocation:null};
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${safeName(data.job||'job-proof')}-${Date.now()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);say('Proof summary saved')
  });

  $('#beforeAfterBtn').addEventListener('click',()=>{
    const item=latestPhoto();if(!item)return say('Take the BEFORE photo first');
    if(beforeOverlay){beforeOverlay.remove();beforeOverlay=null;say('Before guide turned off');return}
    beforeOverlay=document.createElement('img');beforeOverlay.className='before-overlay';beforeOverlay.src=item.url;cameraCard.appendChild(beforeOverlay);say('Before guide on — line up the AFTER photo and tap again to turn off');
  });

  async function openMarkup(){
    const item=latestPhoto();if(!item)return say('Take a damage photo first');
    markupBase=await imageBitmapFrom(item);markupCanvas.width=markupBase.width;markupCanvas.height=markupBase.height;markupCanvas.getContext('2d').drawImage(markupBase,0,0);markupCard.hidden=false;markupCard.scrollIntoView({behavior:'smooth',block:'center'});say('Draw circles or arrows over the damage');
  }
  $('#damageBtn').addEventListener('click',openMarkup);
  function point(e){const r=markupCanvas.getBoundingClientRect();return{x:(e.clientX-r.left)*markupCanvas.width/r.width,y:(e.clientY-r.top)*markupCanvas.height/r.height}}
  markupCanvas.addEventListener('pointerdown',e=>{drawing=true;lastPoint=point(e);markupCanvas.setPointerCapture(e.pointerId)});
  markupCanvas.addEventListener('pointermove',e=>{if(!drawing)return;const p=point(e),ctx=markupCanvas.getContext('2d');ctx.strokeStyle='#ff2f45';ctx.lineWidth=Math.max(8,markupCanvas.width/180);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(lastPoint.x,lastPoint.y);ctx.lineTo(p.x,p.y);ctx.stroke();lastPoint=p});
  markupCanvas.addEventListener('pointerup',()=>drawing=false);markupCanvas.addEventListener('pointercancel',()=>drawing=false);
  $('#clearMarkupBtn').addEventListener('click',()=>{if(markupBase){const c=markupCanvas.getContext('2d');c.clearRect(0,0,markupCanvas.width,markupCanvas.height);c.drawImage(markupBase,0,0)}});
  $('#saveMarkupBtn').addEventListener('click',async()=>{const ctx=markupCanvas.getContext('2d'),text=caption.value.trim();if(text){const fs=Math.max(24,Math.round(markupCanvas.width/38));ctx.font=`700 ${fs}px system-ui`;ctx.fillStyle='rgba(0,0,0,.65)';ctx.fillRect(0,markupCanvas.height-fs*2.3,markupCanvas.width,fs*2.3);ctx.fillStyle='#fff';ctx.fillText(text.slice(0,100),fs*.6,markupCanvas.height-fs*1.5)}const blob=await canvasBlob(markupCanvas,.96);addCapture(blob,'photo','jpg','damage-markup');say('Marked damage copy saved; original kept')});

  $('#auroraBurstBtn').addEventListener('click',async()=>{
    if(typeof stream==='undefined'||!stream)return say('Start the camera first');say('Aurora burst: hold steady');for(let i=0;i<5;i++){await captureNow(false);await new Promise(r=>setTimeout(r,260))}say('Aurora burst finished — 5 shots saved')
  });

  $('#voiceCaptionBtn').addEventListener('click',()=>{
    const R=window.SpeechRecognition||window.webkitSpeechRecognition;if(!R)return say('Voice caption needs Chrome speech support');const r=new R();r.lang='en-US';r.interimResults=false;r.onstart=()=>say('Listening for caption…');r.onresult=e=>{caption.value=e.results[0][0].transcript;say('Voice caption added')};r.onerror=()=>say('Voice caption did not record');r.start();
  });

  $('#backupBtn').addEventListener('click',()=>{
    const keys=['osko-camera-notes','osko-camera-save-settings'];const backup={app:'Alaska Ice Crystals Camera',created:new Date().toISOString(),settings:{}};keys.forEach(k=>backup.settings[k]=localStorage.getItem(k));backup.workflow={job:jobName.value,number:jobNumber.value,caption:caption.value,shape:shape.value};const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`alaska-ice-camera-backup-${Date.now()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);say('Backup file saved')
  });
  $('#restoreBackupInput').addEventListener('change',async e=>{try{const f=e.target.files?.[0];if(!f)return;const b=JSON.parse(await f.text());Object.entries(b.settings||{}).forEach(([k,v])=>{if(v!==null)localStorage.setItem(k,v)});jobName.value=b.workflow?.job||'';jobNumber.value=b.workflow?.number||'';caption.value=b.workflow?.caption||'';shape.value=b.workflow?.shape||'original';say('Backup restored — reopen the app to reload all saved settings')}catch{say('That backup file could not be restored')}e.target.value=''});

  estimateStorage();
})();