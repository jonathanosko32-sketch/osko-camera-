(()=>{
  const gate=document.querySelector('#crystalGate');
  const enter=document.querySelector('#crystalEnter');
  const exit=document.querySelector('#cameraExit');
  const picker=document.querySelector('#shotPicker');
  const pickerGrid=document.querySelector('#shotPickerGrid');
  const pickerCancel=document.querySelector('#shotPickerCancel');
  const modeButtons=[...document.querySelectorAll('[data-shot-mode]')];
  const photoTriggers=new Set(['quickCaptureBtn','captureBtn','dockPhoto']);
  let shotMode=localStorage.getItem('osko-shot-mode')||'best';
  let busy=false;
  let gateBusy=false;

  function setMode(mode){
    shotMode=mode;
    localStorage.setItem('osko-shot-mode',mode);
    modeButtons.forEach(button=>button.classList.toggle('active',button.dataset.shotMode===mode));
    const names={best:'OSKO Best Shot',choose:'Choose Your Shot',single:'Single Shot'};
    setStatus?.(`${names[mode]} ready`);
  }

  async function openCase(){
    if(gateBusy)return;
    gateBusy=true;
    enter.disabled=true;
    enter.textContent='OPENING…';
    gate.hidden=false;
    gate.classList.remove('is-closing');
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    gate.classList.add('is-open');

    try{
      const animationFinished=sleep(780);
      const cameraStarted=stream?Promise.resolve():startCamera();
      await Promise.all([animationFinished,cameraStarted]);
      if(!stream)throw new Error('Camera did not start');
      gate.hidden=true;
      setStatus?.('OSKO Camera ready');
    }catch(error){
      console.error(error);
      gate.classList.remove('is-open');
      gate.hidden=false;
      enter.textContent='TRY CAMERA AGAIN';
      showError?.('Allow camera permission, then tap Try Camera Again.');
    }finally{
      enter.disabled=false;
      gateBusy=false;
      if(stream)enter.textContent='START CAMERA';
    }
  }

  async function closeCase(){
    if(busy||gateBusy)return;
    gateBusy=true;
    try{
      if(stream)await stopCamera();
      gate.hidden=false;
      gate.classList.remove('is-open');
      gate.classList.add('is-closing');
      enter.textContent='START CAMERA';
      await sleep(780);
      gate.classList.remove('is-closing');
      window.scrollTo({top:0,behavior:'smooth'});
    }finally{
      gateBusy=false;
    }
  }

  function frameScore(imageData){
    const d=imageData.data;
    let score=0;
    const step=16;
    for(let y=1;y<imageData.height-1;y+=4){
      for(let x=1;x<imageData.width-1;x+=4){
        const i=(y*imageData.width+x)*4;
        const l=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];
        const ir=i+step, ib=i+imageData.width*4;
        const lr=.2126*d[ir]+.7152*d[ir+1]+.0722*d[ir+2];
        const lb=.2126*d[ib]+.7152*d[ib+1]+.0722*d[ib+2];
        score+=Math.abs(l-lr)+Math.abs(l-lb);
      }
    }
    return score;
  }

  async function takeFrame(){
    const loc=await getLocation();
    const made=await makeProcessedCanvas();
    drawStamp(made.ctx,made.width,made.height,loc);
    const sampleW=Math.min(360,made.width);
    const sampleH=Math.max(1,Math.round(made.height*(sampleW/made.width)));
    const sample=document.createElement('canvas');
    sample.width=sampleW;sample.height=sampleH;
    const sctx=sample.getContext('2d',{willReadFrequently:true});
    sctx.drawImage(canvas,0,0,sampleW,sampleH);
    const score=frameScore(sctx.getImageData(0,0,sampleW,sampleH));
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.96));
    return {blob,score,url:URL.createObjectURL(blob)};
  }

  async function takeThree(){
    const frames=[];
    for(let i=0;i<3;i++){
      setStatus?.(`Taking picture ${i+1} of 3…`);
      frames.push(await takeFrame());
      if(i<2)await sleep(135);
    }
    return frames;
  }

  function saveFrame(frame,label){
    addCapture(frame.blob,'photo','jpg',label);
    frame.url&&URL.revokeObjectURL(frame.url);
  }

  function chooseFrame(frames){
    return new Promise(resolve=>{
      pickerGrid.innerHTML='';
      frames.forEach((frame,index)=>{
        const button=document.createElement('button');
        button.type='button';button.className='shot-choice';
        button.innerHTML=`<img src="${frame.url}" alt="Photo ${index+1}"><strong>Keep photo ${index+1}</strong>`;
        button.addEventListener('click',()=>{picker.hidden=true;resolve(index)},{once:true});
        pickerGrid.appendChild(button);
      });
      picker.hidden=false;
      pickerCancel.onclick=()=>{picker.hidden=true;resolve(-1)};
    });
  }

  async function shoot(){
    if(busy||!stream||!preview.videoWidth)return;
    busy=true;
    [captureBtn,quickCaptureBtn,dockPhoto].forEach(b=>b.disabled=true);
    try{
      await waitForSteady();
      if(shotMode==='single'){
        const frame=await takeFrame();
        saveFrame(frame,'single');
        setStatus?.('Single photo captured');
        return;
      }
      const frames=await takeThree();
      if(shotMode==='best'){
        let best=0;
        frames.forEach((frame,index)=>{if(frame.score>frames[best].score)best=index});
        frames.forEach((frame,index)=>{if(index===best)saveFrame(frame,'best-shot');else URL.revokeObjectURL(frame.url)});
        setStatus?.('Best of 3 captured');
      }else{
        const chosen=await chooseFrame(frames);
        frames.forEach((frame,index)=>{if(index===chosen)saveFrame(frame,'chosen-shot');else URL.revokeObjectURL(frame.url)});
        setStatus?.(chosen>=0?'Your selected photo was kept':'No photo kept');
      }
    }catch(error){
      console.error(error);showError?.('The photo could not be captured. Please try again.');
    }finally{
      busy=false;
      if(stream)[captureBtn,quickCaptureBtn,dockPhoto].forEach(b=>b.disabled=false);
    }
  }

  document.addEventListener('click',event=>{
    const trigger=event.target.closest('button');
    if(!trigger||!photoTriggers.has(trigger.id))return;
    event.preventDefault();event.stopImmediatePropagation();
    shoot();
  },true);

  enter?.addEventListener('click',openCase);
  exit?.addEventListener('click',closeCase);
  modeButtons.forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.shotMode)));
  setMode(shotMode);
  if(enter)enter.textContent='START CAMERA';
  gate.hidden=false;
})();