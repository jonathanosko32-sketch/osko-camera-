(()=>{
  const KEY='osko-sky-hands-free-v1';
  const voiceBtn=document.getElementById('voiceCommandBtn');
  if(!voiceBtn)return;

  let restartTimer=null;
  let lastAttempt=0;

  function handsFreeOn(){return localStorage.getItem(KEY)==='1'}
  function isListening(){return voiceBtn.classList.contains('active')||/listening/i.test(voiceBtn.textContent||'')}
  function canRestart(){return handsFreeOn()&&!document.hidden&&!isListening()}

  function restartSky(delay=650){
    clearTimeout(restartTimer);
    restartTimer=setTimeout(()=>{
      if(!canRestart())return;
      const now=Date.now();
      if(now-lastAttempt<900)return;
      lastAttempt=now;
      voiceBtn.click();
    },delay);
  }

  // Every navigation change or completed command should return Sky to listening.
  document.addEventListener('click',event=>{
    if(event.target.closest('.compact-nav,[data-view],details.compact-section,summary'))restartSky(500);
  },true);

  const observer=new MutationObserver(()=>{
    if(canRestart())restartSky(500);
  });
  observer.observe(voiceBtn,{attributes:true,childList:true,subtree:true,characterData:true});

  const status=document.getElementById('voiceStatus');
  if(status)observer.observe(status,{childList:true,subtree:true,characterData:true});

  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden)restartSky(700);
  });

  window.addEventListener('focus',()=>restartSky(700));
  window.addEventListener('pageshow',()=>restartSky(900));

  // Keep listening after commands that move between Camera, Scan, Tools, and Pictures.
  setInterval(()=>{if(canRestart())restartSky(250)},1800);
})();