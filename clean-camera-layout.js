(()=>{
  'use strict';
  const card=document.getElementById('cameraCard');
  if(!card)return;

  const labelControls=()=>{
    const set=(id,text)=>{const el=document.getElementById(id);if(el)el.textContent=text;};
    set('quickSwitchBtn','SWITCH');
    set('quickRecordBtn','VIDEO');
    set('fullscreenBtn','FULL');
    set('cameraExit','CLOSE');
    const shutter=document.getElementById('quickCaptureBtn');
    if(shutter){shutter.setAttribute('aria-label','TAKE PHOTO');shutter.innerHTML='<span>PHOTO</span>';}
  };

  const removeLegacy=()=>{
    card.querySelectorAll('.camera-live-overlay,.mobile-camera-overlay-controls,.mobile-camera-controls,.camera-light-btn,.camera-light-glow,.crystal-rail,.crystal-bottom-controls,.osko-exposure-control').forEach(el=>el.remove());
    labelControls();
  };
  removeLegacy();

  const style=document.createElement('style');
  style.textContent=`
    #cameraCard{position:relative;overflow:hidden;min-height:620px}
    #cameraCard video{width:100%;height:100%;object-fit:cover}
    .osko-exposure-control{display:none!important}

    #quickTorchBtn{position:absolute!important;top:14px!important;left:14px!important;right:auto!important;bottom:auto!important;z-index:60!important;min-height:42px!important;padding:0 13px!important;border-radius:22px!important;font-size:11px!important}
    #steadyBadge{position:absolute!important;top:14px!important;left:50%!important;transform:translateX(-50%)!important;z-index:59!important;min-height:42px!important;padding:0 14px!important;border-radius:22px!important;display:flex!important;align-items:center!important;font-size:11px!important}
    #fullscreenBtn{position:absolute!important;top:14px!important;right:14px!important;left:auto!important;bottom:auto!important;z-index:60!important;width:auto!important;height:42px!important;padding:0 12px!important;border-radius:22px!important;font-size:11px!important}
    #modeBadge{position:absolute!important;top:64px!important;right:14px!important;left:auto!important;bottom:auto!important;z-index:58!important;font-size:11px!important}
    #cameraExit{position:absolute!important;top:64px!important;left:14px!important;z-index:58!important;width:auto!important;max-width:none!important;font-size:11px!important;padding:8px 11px!important;opacity:.9}

    .osko-quick-zoom-side{top:48%!important;transform:translateY(-50%)!important;gap:10px!important;padding:4px!important;background:rgba(5,19,32,.38)!important;z-index:57!important}
    .osko-quick-zoom-side.left{left:6px!important}
    .osko-quick-zoom-side.right{right:6px!important}
    .osko-quick-zoom-side button{width:42px!important;height:42px!important;font-size:13px!important;box-shadow:0 3px 10px rgba(0,0,0,.34)!important}

    .osko-stamp-tools{left:50%!important;bottom:88px!important;transform:translateX(-50%)!important;width:82%!important;max-width:420px!important;gap:6px!important;padding:5px 6px!important;z-index:58!important;background:rgba(5,19,32,.72)!important}
    .osko-stamp-tools button{flex:1!important;min-height:32px!important;padding:6px 8px!important;font-size:9px!important;border-radius:16px!important}

    .viewfinder-controls{position:absolute!important;left:50%!important;right:auto!important;bottom:14px!important;transform:translateX(-50%)!important;width:88%!important;max-width:430px!important;display:grid!important;grid-template-columns:1fr 1.35fr 1fr!important;align-items:center!important;justify-items:stretch!important;gap:8px!important;z-index:60!important}
    .viewfinder-controls .viewfinder-small,.viewfinder-controls .shutter{width:100%!important;height:58px!important;border-radius:20px!important;font-size:11px!important;font-weight:900!important;letter-spacing:.04em!important;padding:0 8px!important}
    .viewfinder-controls .shutter span{display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;height:100%!important;border:0!important;background:none!important;border-radius:0!important;color:inherit!important;font:900 12px system-ui!important;letter-spacing:.05em!important}

    #recordingBadge{top:64px!important;left:50%!important;transform:translateX(-50%)!important;z-index:61!important}
    #countdown{z-index:70!important}

    @media(max-width:420px){
      #cameraCard{min-height:560px}
      #quickTorchBtn{left:8px!important;top:8px!important;padding:0 10px!important;font-size:10px!important}
      #steadyBadge{top:8px!important;min-height:40px!important;font-size:10px!important;padding:0 11px!important}
      #fullscreenBtn{top:8px!important;right:8px!important;height:40px!important;font-size:10px!important;padding:0 10px!important}
      #modeBadge{top:56px!important;right:8px!important}
      #cameraExit{top:56px!important;left:8px!important}
      .osko-quick-zoom-side.left{left:4px!important}.osko-quick-zoom-side.right{right:4px!important}
      .osko-quick-zoom-side button{width:38px!important;height:38px!important;font-size:12px!important}
      .osko-stamp-tools{bottom:80px!important;width:86%!important}
      .osko-stamp-tools button{font-size:8px!important;padding:5px 6px!important}
      .viewfinder-controls{bottom:10px!important;width:92%!important;gap:6px!important}
      .viewfinder-controls .viewfinder-small,.viewfinder-controls .shutter{height:54px!important;font-size:10px!important}
      .viewfinder-controls .shutter span{font-size:11px!important}
    }
  `;
  document.head.appendChild(style);

  const observer=new MutationObserver(removeLegacy);
  observer.observe(card,{childList:true,subtree:true});
  setInterval(removeLegacy,900);
})();