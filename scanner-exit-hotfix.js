(()=>{
  const mode=document.getElementById('modeSelect');
  const cameraCard=document.getElementById('cameraCard');
  const cameraNav=document.querySelector('.compact-nav [data-view="camera"]');
  if(!mode||!cameraCard)return;

  function leaveScanner(){
    if(mode.value!=='scanner'&&mode.value!=='codes')return;
    mode.value='normal';
    mode.dispatchEvent(new Event('change',{bubbles:true}));
    const scanFrame=document.getElementById('scanFrame');
    const codeFrame=document.getElementById('codeFrame');
    const scannerControls=document.getElementById('scannerControls');
    if(scanFrame)scanFrame.hidden=true;
    if(codeFrame)codeFrame.hidden=true;
    if(scannerControls)scannerControls.hidden=true;
    const badge=document.getElementById('modeBadge');
    if(badge)badge.textContent='NORMAL';
    if(typeof updateVisuals==='function')updateVisuals();
  }

  cameraNav?.addEventListener('click',()=>setTimeout(leaveScanner,0),true);
  ['startBtn','captureBtn','dockStart','dockPhoto','quickCaptureBtn'].forEach(id=>{
    document.getElementById(id)?.addEventListener('click',()=>setTimeout(leaveScanner,0),true);
  });

  const observer=new MutationObserver(()=>{
    if(cameraNav?.classList.contains('active'))leaveScanner();
  });
  if(cameraNav)observer.observe(cameraNav,{attributes:true,attributeFilter:['class']});

  window.oskoLeaveScannerMode=leaveScanner;
})();
