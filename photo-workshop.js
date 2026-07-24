(()=>{
  const host=document.querySelector('.osko-tools');
  if(!host)return;
  const section=document.createElement('section');
  section.className='photo-workshop';
  section.innerHTML=`
    <h3>Photo workshop</h3>
    <p class="command-help">Mark a picture, organize it, or make a before-and-after copy. The original stays untouched.</p>
    <div class="workshop-grid">
      <label>Project
        <select id="workshopProject"><option>Personal</option><option>Trucking</option><option>Load Paperwork</option><option>Receipts</option><option>Website</option><option>OSKO Ice Crystals</option><option>Alaska Ice Crystals</option><option>Aurora</option></select>
      </label>
      <label>Marking
        <select id="markupType"><option value="text">Text label</option><option value="arrow">Arrow</option><option value="circle">Circle</option><option value="highlight">Highlight box</option><option value="blur">Blur area</option></select>
      </label>
      <label class="wide">Label words<input id="markupText" type="text" placeholder="Damage, tire, seal, pickup, etc."></label>
      <label>Left / right<input id="markupX" type="range" min="10" max="90" value="50"></label>
      <label>Up / down<input id="markupY" type="range" min="10" max="90" value="50"></label>
      <label>Size<input id="markupSize" type="range" min="5" max="35" value="16"></label>
    </div>
    <div class="workshop-actions">
      <button id="saveMarkupBtn" type="button">Save marked copy</button>
      <button id="saveProjectCopyBtn" type="button">Save project copy</button>
      <button id="beforeAfterBtn" type="button">Make before / after</button>
    </div>
    <div class="share-history-box">
      <div><strong>Send history</strong><button id="clearShareHistoryBtn" type="button">Clear</button></div>
      <div id="shareHistoryList"></div>
    </div>
    <p id="workshopStatus" class="quick-status">Workshop ready</p>`;
  const savePanel=document.getElementById('saveWatermarkPanel');
  host.insertBefore(section,savePanel||host.lastElementChild);

  const $=s=>section.querySelector(s);
  const status=$('#workshopStatus');
  const project=$('#workshopProject');
  const type=$('#markupType');
  const text=$('#markupText');
  const x=$('#markupX'),y=$('#markupY'),size=$('#markupSize');
  const historyList=$('#shareHistoryList');
  let history=loadHistory();

  function setStatus(message){status.textContent=message;try{if(typeof setStatus==='function')setStatus(message)}catch{}}
  function photos(){try{return captures.filter(item=>item.type==='photo')}catch{return[]}}
  function latest(){return photos()[0]||null}
  function cleanName(value){return String(value||'Personal').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase()||'personal'}
  function loadHistory(){try{return JSON.parse(localStorage.getItem('osko-share-history')||'[]')}catch{return[]}}
  function saveHistory(){localStorage.setItem('osko-share-history',JSON.stringify(history.slice(0,30)));renderHistory()}
  function renderHistory(){historyList.innerHTML=history.length?'':`<p class="command-help">Nothing shared yet.</p>`;history.slice(0,12).forEach(item=>{const row=document.createElement('div');row.className='share-history-row';row.innerHTML=`<span>${new Date(item.time).toLocaleString()}</span><strong>${item.name}</strong>`;historyList.appendChild(row)})}
  function recordShare(name){history.unshift({time:Date.now(),name:name||'OSKO Camera item'});saveHistory()}

  async function bitmapFor(item){if(!item)throw new Error('Take a picture first');return createImageBitmap(item.blob)}
  function point(canvas){return{x:Number(x.value)/100*canvas.width,y:Number(y.value)/100*canvas.height,s:Math.max(28,Number(size.value)/100*canvas.width)}}
  function roundedRect(ctx,x0,y0,w,h,r){ctx.beginPath();ctx.roundRect?ctx.roundRect(x0,y0,w,h,r):(ctx.rect(x0,y0,w,h));}

  async function saveMarkup(){const item=latest();if(!item)return status.textContent='Take a picture first';try{
    const bitmap=await bitmapFor(item),out=document.createElement('canvas');out.width=bitmap.width;out.height=bitmap.height;const ctx=out.getContext('2d');ctx.drawImage(bitmap,0,0);const p=point(out);ctx.lineWidth=Math.max(5,p.s*.08);ctx.strokeStyle='#ffea00';ctx.fillStyle='rgba(255,234,0,.28)';ctx.lineCap='round';
    if(type.value==='text'){
      const words=text.value.trim()||project.value;ctx.font=`800 ${p.s}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=Math.max(4,p.s*.08);ctx.strokeStyle='rgba(0,0,0,.8)';ctx.strokeText(words,p.x,p.y);ctx.fillStyle='#fff';ctx.fillText(words,p.x,p.y);
    }else if(type.value==='arrow'){
      const len=p.s*2.2,angle=-Math.PI/5,x1=p.x-len/2,y1=p.y+len*.22,x2=p.x+len/2,y2=p.y-len*.22;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-p.s*.55*Math.cos(angle),y2-p.s*.55*Math.sin(angle));ctx.moveTo(x2,y2);ctx.lineTo(x2-p.s*.55*Math.cos(-angle),y2-p.s*.55*Math.sin(-angle));ctx.stroke();
    }else if(type.value==='circle'){
      ctx.beginPath();ctx.arc(p.x,p.y,p.s*1.2,0,Math.PI*2);ctx.stroke();
    }else if(type.value==='highlight'){
      const w=p.s*3,h=p.s*1.7;ctx.fillRect(p.x-w/2,p.y-h/2,w,h);ctx.strokeRect(p.x-w/2,p.y-h/2,w,h);
    }else if(type.value==='blur'){
      const w=p.s*3,h=p.s*1.8,temp=document.createElement('canvas');temp.width=w;temp.height=h;const t=temp.getContext('2d');t.filter=`blur(${Math.max(12,p.s*.18)}px)`;t.drawImage(out,p.x-w/2,p.y-h/2,w,h,0,0,w,h);ctx.drawImage(temp,p.x-w/2,p.y-h/2);
    }
    out.toBlob(blob=>{if(!blob)return;addCapture(blob,'photo','jpg',`marked-${cleanName(project.value)}`);status.textContent='Marked copy saved; original kept'},'image/jpeg',.96);
  }catch(e){status.textContent=e.message||'Could not mark picture'}}

  async function saveProjectCopy(){const item=latest();if(!item)return status.textContent='Take a picture first';const stamp=new Date().toISOString().replace(/[:.]/g,'-');const mode=`project-${cleanName(project.value)}`;addCapture(item.blob,'photo','jpg',mode);try{captures[0].filename=`${cleanName(project.value)}-${stamp}.jpg`}catch{}status.textContent=`Saved copy under ${project.value}`}

  async function beforeAfter(){const list=photos();if(list.length<2)return status.textContent='Take two pictures first';try{
    const a=await bitmapFor(list[1]),b=await bitmapFor(list[0]);const h=Math.max(a.height,b.height),half=Math.round(h*.75),out=document.createElement('canvas');out.width=half*2;out.height=h+Math.round(h*.09);const ctx=out.getContext('2d');ctx.fillStyle='#000';ctx.fillRect(0,0,out.width,out.height);ctx.drawImage(a,0,0,a.width,a.height,0,0,half,h);ctx.drawImage(b,0,0,b.width,b.height,half,0,half,h);ctx.fillStyle='rgba(0,0,0,.78)';ctx.fillRect(0,h,out.width,out.height-h);ctx.fillStyle='#fff';ctx.font=`800 ${Math.max(28,Math.round(out.width/30))}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('BEFORE',half/2,h+(out.height-h)/2);ctx.fillText('AFTER',half+half/2,h+(out.height-h)/2);out.toBlob(blob=>{if(!blob)return;addCapture(blob,'photo','jpg',`before-after-${cleanName(project.value)}`);status.textContent='Before-and-after copy saved'},'image/jpeg',.94);
  }catch{status.textContent='Could not make before-and-after copy'}}

  $('#saveMarkupBtn').addEventListener('click',saveMarkup);
  $('#saveProjectCopyBtn').addEventListener('click',saveProjectCopy);
  $('#beforeAfterBtn').addEventListener('click',beforeAfter);
  $('#clearShareHistoryBtn').addEventListener('click',()=>{history=[];saveHistory()});
  document.addEventListener('click',e=>{const button=e.target.closest('[data-share]');if(button){let name='OSKO Camera picture';try{name=captures[Number(button.dataset.share)]?.filename||name}catch{}recordShare(name)}},true);
  renderHistory();
})();