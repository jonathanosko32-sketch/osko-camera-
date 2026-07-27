(()=>{
  'use strict';
  const card=document.getElementById('cameraCard');
  if(!card)return;

  const removeLegacy=()=>{
    card.querySelectorAll('.camera-live-overlay,.mobile-camera-overlay-controls,.mobile-camera-controls,.camera-light-btn,.camera-light-glow,.crystal-rail,.crystal-bottom-controls').forEach(el=>el.remove());
  };
  removeLegacy();

  const style=document.createElement('style');
  style.textContent=`
    #cameraCard{position:relative;overflow:hidden;min-height:620px}
    #cameraCard video{width:100%;height:100%;object-fit:cover}

    #quickTorchBtn{position:absolute!important;top:16px!important;left:16px!important;right:auto!important;bottom:auto!important;z-index:60!important;min-height:46px!important;padding:0 16px!important;border-radius:24px!important}
    #steadyBadge{position:absolute!important;top:16px!important;left:50%!important;transform:translateX(-50%)!important;z-index:59!important;min-height:46px!important;padding:0 18px!important;border-radius:24px!important;display:flex!important;align-items:center!important}
    #fullscreenBtn{position:absolute!important;top:16px!important;right:16px!important;left:auto!important;bottom:auto!important;z-index:60!important;width:48px!important;height:48px!important;border-radius:50%!important}
    #modeBadge{position:absolute!important;top:74px!important;right:16px!important;left:auto!important;bottom:auto!important;z-index:58!important}
    #cameraExit{position:absolute!important;top:78px!important;left:16px!important;z-index:58!important;max-width:90px!important;font-size:12px!important;padding:8px 10px!important;opacity:.86}

    .osko-quick-zoom-side{top:50%!important;transform:translateY(-50%)!important;gap:12px!important;padding:5px!important;background:rgba(5,19,32,.42)!important;z-index:57!important}
    .osko-quick-zoom-side.left{left:8px!important}
    .osko-quick-zoom-side.right{right:8px!important}
    .osko-quick-zoom-side button{width:46px!important;height:46px!important;font-size:14px!important;box-shadow:0 3px 12px rgba(0,0,0,.36)!important}

    .osko-stamp-tools{left:50%!important;bottom:106px!important;transform:translateX(-50%)!important;width:auto!important;max-width:76%!important;gap:6px!important;padding:5px 7px!important;z-index:58!important;background:rgba(5,19,32,.70)!important}
    .osko-stamp-tools button{min-height:34px!important;padding:7px 10px!important;font-size:10px!important;border-radius:17px!important}

    .viewfinder-controls{position:absolute!important;left:50%!important;right:auto!important;bottom:18px!important;transform:translateX(-50%)!important;width:72%!important;max-width:360px!important;display:grid!important;grid-template-columns:64px 1fr 64px!important;align-items:center!important;justify-items:center!important;gap:14px!important;z-index:60!important}
    .viewfinder-controls .viewfinder-small{width:58px!important;height:58px!important;border-radius:50%!important}
    .viewfinder-controls .shutter{width:78px!important;height:78px!important;border-radius:50%!important}

    #recordingBadge{top:78px!important;left:50%!important;transform:translateX(-50%)!important;z-index:61!important}
    #countdown{z-index:70!important}

    @media(max-width:420px){
      #cameraCard{min-height:560px}
      #quickTorchBtn{left:10px!important;top:10px!important;padding:0 12px!important;font-size:12px!important}
      #steadyBadge{top:10px!important;min-height:44px!important;font-size:13px!important}
      #fullscreenBtn{top:10px!important;right:10px!important;width:46px!important;height:46px!important}
      #modeBadge{top:65px!important;right:10px!important}
      #cameraExit{top:68px!important;left:10px!important}
      .osko-quick-zoom-side.left{left:5px!important}.osko-quick-zoom-side.right{right:5px!important}
      .osko-quick-zoom-side button{width:42px!important;height:42px!important;font-size:13px!important}
      .osko-stamp-tools{bottom:96px!important;max-width:72%!important}
      .osko-stamp-tools button{font-size:9px!important;padding:6px 8px!important}
      .viewfinder-controls{bottom:14px!important;width:70%!important;grid-template-columns:56px 1fr 56px!important;gap:10px!important}
      .viewfinder-controls .viewfinder-small{width:52px!important;height:52px!important}
      .viewfinder-controls .shutter{width:72px!important;height:72px!important}
    }
  `;
  document.head.appendChild(style);

  const observer=new MutationObserver(removeLegacy);
  observer.observe(card,{childList:true,subtree:true});
  setInterval(removeLegacy,1000);
})();