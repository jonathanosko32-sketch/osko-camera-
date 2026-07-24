(()=>{
  const preview=document.getElementById('preview');
  const settings=document.querySelector('.quick-tools');
  const zoomRange=document.getElementById('zoomRange');
  const zoomValue=document.getElementById('zoomValue');
  const status=document.getElementById('status');
  if(!preview||!settings||!zoomRange)return;

  const panel=document.createElement('div');
  panel.className='highzoom-tools';
  panel.innerHTML=`
    <label class="toggle"><input id="highZoomSteadyToggle" type="checkbox" checked><span>High-zoom steady</span></label>
    <label class="select-tool">Sharpest-frame burst<select id="highZoomBurst"><option value="3">3 frames</option><option value="4" selected>4 frames</option><option value="5">5 frames</option></select></label>
    <div id="zoomQualityMeter" class="zoom-quality good"><strong>Zoom quality: clean</strong><span>High-zoom steady turns on automatically above 4×.</span></div>`;
  settings.appendChild(panel);

  const toggle=document.getElementById('highZoomSteadyToggle');
  const burstSelect=document.getElementById('highZoomBurst');
  const meter=document.getElementById('zoomQualityMeter');
  const originalTakePhoto=takePhoto;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const setStatus=m=>{if(status)status.textContent=m};

  function currentZoom(){return Number(zoomRange.value||1)}
  function updateMeter(){
    const z=currentZoom();
    meter.className='zoom-quality '+(z<4?'good':z<=8?'watch':'limit');
    meter.querySelector('strong').textContent=z<4?'Zoom quality: clean':z<=8?'Zoom quality: high zoom':'Zoom quality: digital stretch';
    meter.querySelector('span').textContent=z<4?'Normal capture is fine.':z<=8?'Sharpest-frame capture will reduce hand shake.':'Pixels may break apart; move closer when possible.';
    if(zoomValue)zoomValue.title=z>8?'Beyond 8× may lose detail on this phone.':'';
  }

  function cloneFrame(){
    const width=preview.videoWidth,height=preview.videoHeight;
    const out=document.createElement('canvas');
    out.width=width;out.height=height;
    const ctx=out.getContext('2d',{willReadFrequently:true});
    ctx.filter=typeof filterString==='function'?filterString():'none';
    const crop=(typeof steadyToggle!=='undefined'&&steadyToggle.checked)?0.04:0;
    const sx=width*crop,sy=height*crop,sw=width-sx*2,sh=height-sy*2;
    ctx.drawImage(preview,sx,sy,sw,sh,0,0,width,height);
    ctx.filter='none';
    return out;
  }

  function sharpnessScore(source){
    const sample=document.createElement('canvas');
    const max=180,scale=Math.min(1,max/Math.max(source.width,source.height));
    sample.width=Math.max(20,Math.round(source.width*scale));
    sample.height=Math.max(20,Math.round(source.height*scale));
    const ctx=sample.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(source,0,0,sample.width,sample.height);
    const {data}=ctx.getImageData(0,0,sample.width,sample.height);
    let score=0,count=0;
    for(let y=1;y<sample.height-1;y+=2){
      for(let x=1;x<sample.width-1;x+=2){
        const i=(y*sample.width+x)*4;
        const lum=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];
        const ir=(y*sample.width+x+1)*4;
        const id=((y+1)*sample.width+x)*4;
        const right=.2126*data[ir]+.7152*data[ir+1]+.0722*data[ir+2];
        const down=.2126*data[id]+.7152*data[id+1]+.0722*data[id+2];
        score+=Math.abs(lum-right)+Math.abs(lum-down);count+=2;
      }
    }
    return count?score/count:0;
  }

  async function captureSharpest(){
    if(!stream||!preview.videoWidth){showError('Start the camera first.');return}
    if(typeof waitForSteady==='function')await waitForSteady();
    const frames=Math.max(3,Number(burstSelect.value||4));
    let best=null,bestScore=-1;
    for(let i=0;i<frames;i++){
      setStatus(`High-zoom steady ${i+1} of ${frames}…`);
      const frame=cloneFrame();
      const score=sharpnessScore(frame);
      if(score>bestScore){best=frame;bestScore=score}
      await sleep(95);
    }
    const loc=typeof getLocation==='function'?await getLocation():null;
    const ctx=best.getContext('2d');
    if(typeof drawStamp==='function')drawStamp(ctx,best.width,best.height,loc);
    best.toBlob(blob=>{
      if(!blob)return showError('Could not save the sharp frame.');
      addCapture(blob,'photo','jpg','high-zoom steady');
      setStatus(`Sharpest frame saved at ${currentZoom().toFixed(1)}×`);
    },'image/jpeg',0.97);
  }

  async function enhancedTakePhoto(){
    const useHighZoom=toggle.checked&&currentZoom()>=4&&modeSelect.value!=='scanner';
    if(!useHighZoom)return originalTakePhoto();
    if(countdownRunning||!stream)return;
    countdownRunning=true;
    [captureBtn,quickCaptureBtn,dockPhoto,addScanPageBtn].forEach(b=>b.disabled=true);
    try{
      for(let i=Number(timerSelect.value);i>0;i--){
        countdownEl.hidden=false;countdownEl.textContent=i;setStatus(`Photo in ${i}`);await sleep(1000);
      }
      resetCountdown();
      await captureSharpest();
    }finally{
      resetCountdown();
      if(stream)[captureBtn,quickCaptureBtn,dockPhoto,addScanPageBtn].forEach(b=>b.disabled=false);
    }
  }

  try{takePhoto=enhancedTakePhoto}catch(e){console.warn('Could not replace takePhoto',e)}
  zoomRange.addEventListener('input',updateMeter);
  updateMeter();
})();