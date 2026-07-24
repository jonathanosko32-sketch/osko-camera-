(()=>{
  const preview=document.getElementById('preview');
  const settings=document.querySelector('.quick-tools');
  const brightness=document.getElementById('brightnessRange');
  const status=document.getElementById('status');
  if(!preview||!settings||!brightness)return;

  const panel=document.createElement('div');
  panel.className='lowlight-tools';
  panel.innerHTML=`
    <label class="toggle"><input id="autoLowLightToggle" type="checkbox"><span>Auto low-light balance</span></label>
    <label class="tool-row">Low-light strength <input id="lowLightStrength" type="range" min="1" max="5" value="3"><span id="lowLightStrengthValue">3</span></label>
    <p id="lowLightStatus" class="focus-help">Brightens dark areas while protecting strong highlights.</p>`;
  settings.insertBefore(panel,settings.children[3]||null);

  const toggle=document.getElementById('autoLowLightToggle');
  const strength=document.getElementById('lowLightStrength');
  const strengthValue=document.getElementById('lowLightStrengthValue');
  const info=document.getElementById('lowLightStatus');
  const sample=document.createElement('canvas');
  sample.width=48; sample.height=36;
  const ctx=sample.getContext('2d',{willReadFrequently:true});
  let timer=null;
  let lastApplied=Number(brightness.value)||150;

  const setStatus=message=>{if(status)status.textContent=message;};

  function measure(){
    if(!toggle.checked||!preview.srcObject||preview.readyState<2)return;
    try{
      ctx.drawImage(preview,0,0,sample.width,sample.height);
      const data=ctx.getImageData(0,0,sample.width,sample.height).data;
      let total=0,high=0,veryDark=0,pixels=0;
      for(let i=0;i<data.length;i+=4){
        const lum=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];
        total+=lum; pixels++;
        if(lum>225)high++;
        if(lum<45)veryDark++;
      }
      const avg=total/pixels;
      const highRatio=high/pixels;
      const darkRatio=veryDark/pixels;
      const power=Number(strength.value);
      let target=115;
      if(avg<45)target=185+power*9;
      else if(avg<70)target=165+power*7;
      else if(avg<95)target=145+power*5;
      else if(avg<120)target=125+power*3;
      if(highRatio>.12)target-=22;
      else if(highRatio>.06)target-=12;
      if(darkRatio>.55&&highRatio<.05)target+=8;
      target=Math.max(105,Math.min(235,target));
      const smooth=Math.round(lastApplied*.72+target*.28);
      if(Math.abs(smooth-lastApplied)>=2){
        lastApplied=smooth;
        brightness.value=String(smooth);
        brightness.dispatchEvent(new Event('input',{bubbles:true}));
      }
      info.textContent=`Scene ${Math.round(avg)} · highlights ${Math.round(highRatio*100)}% · balance ${Math.round(lastApplied)}%`;
    }catch(error){
      console.warn('Low-light sample failed',error);
    }
  }

  function start(){
    stop();
    if(toggle.checked){
      lastApplied=Number(brightness.value)||150;
      measure();
      timer=setInterval(measure,850);
      setStatus('Auto low-light balance on');
    }else{
      info.textContent='Brightens dark areas while protecting strong highlights.';
      setStatus('Auto low-light balance off');
    }
  }
  function stop(){if(timer)clearInterval(timer);timer=null;}

  toggle.addEventListener('change',start);
  strength.addEventListener('input',()=>{strengthValue.textContent=strength.value;measure();});
  document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
  window.addEventListener('beforeunload',stop);
})();