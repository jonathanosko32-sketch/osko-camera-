(()=>{
  const preview=document.getElementById('preview');
  const zoomRange=document.getElementById('zoomRange');
  const zoomValue=document.getElementById('zoomValue');
  const zoomLabel=zoomRange?.closest('label');
  if(!preview||!zoomRange||!zoomValue||!zoomLabel)return;

  let hardwareZoom=false;
  let digitalZoom=1;
  let minZoom=1;
  let maxZoom=8;
  let step=.1;
  let applying=false;
  let queued=null;

  const controls=document.createElement('div');
  controls.className='osko-zoom-controls';
  controls.innerHTML=`
    <button type="button" data-zoom-step="-1" aria-label="Zoom out">−</button>
    <button type="button" data-zoom-preset="1">1×</button>
    <button type="button" data-zoom-preset="2">2×</button>
    <button type="button" data-zoom-preset="4">4×</button>
    <button type="button" data-zoom-preset="8">8×</button>
    <button type="button" data-zoom-step="1" aria-label="Zoom in">+</button>`;
  zoomLabel.insertAdjacentElement('afterend',controls);

  const style=document.createElement('style');
  style.textContent=`
    .osko-zoom-controls{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-top:8px}
    .osko-zoom-controls button{min-height:42px;font-weight:800}
    .osko-zoom-controls button.active{outline:2px solid currentColor}
  `;
  document.head.appendChild(style);

  function clamp(value){return Math.max(minZoom,Math.min(maxZoom,value))}
  function rounded(value){return Math.round(value*10)/10}
  function current(){return rounded(Number(zoomRange.value||1))}
  function updateDisplay(value){
    const z=rounded(value);
    zoomRange.value=String(z);
    zoomValue.textContent=`${z.toFixed(1)}×`;
    controls.querySelectorAll('[data-zoom-preset]').forEach(button=>{
      button.classList.toggle('active',Number(button.dataset.zoomPreset)===z);
    });
  }

  function applyPreviewTransform(){
    preview.style.transform=hardwareZoom?'scale(1)':`scale(${digitalZoom})`;
    preview.style.transformOrigin='center center';
  }

  async function detectZoom(){
    const track=typeof videoTrack!=='undefined'?videoTrack:null;
    const caps=track?.getCapabilities?.()||{};
    const settings=track?.getSettings?.()||{};
    if(caps.zoom&&Number.isFinite(caps.zoom.min)&&Number.isFinite(caps.zoom.max)){
      hardwareZoom=true;
      minZoom=Math.max(1,Number(caps.zoom.min));
      maxZoom=Math.min(12,Number(caps.zoom.max));
      step=Math.max(.1,Number(caps.zoom.step)||.1);
      const start=clamp(Number(settings.zoom)||minZoom);
      zoomRange.min=String(minZoom);
      zoomRange.max=String(maxZoom);
      zoomRange.step=String(step);
      zoomRange.disabled=false;
      updateDisplay(start);
      digitalZoom=1;
      applyPreviewTransform();
      return;
    }
    hardwareZoom=false;
    minZoom=1;
    maxZoom=8;
    step=.1;
    zoomRange.min='1';
    zoomRange.max='8';
    zoomRange.step='.1';
    zoomRange.disabled=false;
    updateDisplay(clamp(current()));
    digitalZoom=current();
    applyPreviewTransform();
  }

  async function applyZoom(value){
    const z=rounded(clamp(Number(value)||1));
    updateDisplay(z);
    if(!hardwareZoom){
      digitalZoom=z;
      applyPreviewTransform();
      if(typeof setStatus==='function')setStatus(`Zoom ${z.toFixed(1)}×`);
      return;
    }
    queued=z;
    if(applying)return;
    applying=true;
    while(queued!==null){
      const target=queued;
      queued=null;
      try{
        await videoTrack?.applyConstraints({advanced:[{zoom:target}]});
        const actual=Number(videoTrack?.getSettings?.().zoom)||target;
        updateDisplay(actual);
        if(typeof setStatus==='function')setStatus(`Zoom ${rounded(actual).toFixed(1)}×`);
      }catch(error){
        console.warn('Hardware zoom failed; using digital zoom instead.',error);
        hardwareZoom=false;
        digitalZoom=target;
        zoomRange.min='1';zoomRange.max='8';zoomRange.step='.1';
        applyPreviewTransform();
        if(typeof setStatus==='function')setStatus(`Digital zoom ${target.toFixed(1)}×`);
      }
    }
    applying=false;
  }

  zoomRange.addEventListener('input',event=>applyZoom(event.target.value));
  controls.addEventListener('click',event=>{
    const preset=event.target.closest('[data-zoom-preset]');
    if(preset)return applyZoom(Number(preset.dataset.zoomPreset));
    const stepButton=event.target.closest('[data-zoom-step]');
    if(stepButton)return applyZoom(current()+Number(stepButton.dataset.zoomStep)*Math.max(step,.5));
  });

  const originalUpdateVisuals=typeof updateVisuals==='function'?updateVisuals:null;
  if(originalUpdateVisuals){
    try{
      updateVisuals=function(){
        originalUpdateVisuals();
        applyPreviewTransform();
      };
    }catch(error){console.warn('Could not wrap updateVisuals',error)}
  }

  const originalSetupCapabilities=typeof setupCapabilities==='function'?setupCapabilities:null;
  if(originalSetupCapabilities){
    try{
      setupCapabilities=function(){
        originalSetupCapabilities();
        setTimeout(detectZoom,0);
      };
    }catch(error){console.warn('Could not wrap setupCapabilities',error)}
  }

  const originalMakeProcessedCanvas=typeof makeProcessedCanvas==='function'?makeProcessedCanvas:null;
  if(originalMakeProcessedCanvas){
    try{
      makeProcessedCanvas=async function(){
        if(hardwareZoom||digitalZoom<=1.001)return originalMakeProcessedCanvas();
        if(!stream||!preview.videoWidth)throw new Error('Camera is not ready');
        let width=preview.videoWidth,height=preview.videoHeight;
        if(modeSelect.value==='scanner'){
          const max=2200,scale=Math.min(1,max/Math.max(width,height));
          width=Math.round(width*scale);height=Math.round(height*scale);
        }
        canvas.width=width;canvas.height=height;
        const ctx=canvas.getContext('2d',{willReadFrequently:true});
        ctx.filter=typeof filterString==='function'?filterString():'none';
        const sourceWidth=preview.videoWidth/digitalZoom;
        const sourceHeight=preview.videoHeight/digitalZoom;
        const sx=(preview.videoWidth-sourceWidth)/2;
        const sy=(preview.videoHeight-sourceHeight)/2;
        ctx.drawImage(preview,sx,sy,sourceWidth,sourceHeight,0,0,width,height);
        ctx.filter='none';
        return{ctx,width,height};
      };
    }catch(error){console.warn('Could not align digital zoom capture',error)}
  }

  window.addEventListener('load',()=>setTimeout(detectZoom,300));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(detectZoom,250)});
  detectZoom();
})();