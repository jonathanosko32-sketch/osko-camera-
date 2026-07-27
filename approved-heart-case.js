(()=>{
'use strict';
const gate=document.getElementById('crystalGate');
const box=document.querySelector('.crystal-case');
if(!gate||!box)return;
const img='data:image/webp;base64,UklGRnynAQBXRUJQVlA4WAoAAAAQAAAAbwIATwEASUNDUMgBAAAAAAIBAAAAAAAAAAAQAAAAAAEAAQAAAABtb...';
box.classList.add('approved-heart-case');
const left=box.querySelector('.crystal-half.left');
const right=box.querySelector('.crystal-half.right');
[left,right].forEach((half,i)=>{
  half.style.backgroundImage=`url("${img}")`;
  half.style.backgroundRepeat='no-repeat';
  half.style.backgroundSize='200% 100%';
  half.style.backgroundPosition=i===0?'left center':'right center';
  half.style.clipPath=i===0
    ? 'polygon(0 0,100% 0,100% 100%,0 100%)'
    : 'polygon(0 0,100% 0,100% 100%,0 100%)';
});
const title=box.querySelector('.crystal-title');
if(title){
  title.innerHTML='<strong>OSKO</strong><span>ICE CRYSTALS</span>';
}
const style=document.createElement('style');
style.textContent=`
.crystal-gate{background:radial-gradient(circle at 50% 42%,rgba(0,85,220,.22),rgba(0,5,20,.98) 66%)}
.crystal-case.approved-heart-case{width:min(92vw,520px);aspect-ratio:620/720;filter:drop-shadow(0 24px 42px rgba(0,0,0,.7)) drop-shadow(0 0 28px rgba(15,110,255,.72));}
.approved-heart-case .crystal-half{top:0;bottom:0;width:50%;overflow:hidden;background-color:transparent;filter:saturate(1.08) contrast(1.05) brightness(1.02);}
.approved-heart-case .crystal-half::before{display:none!important}
.approved-heart-case .crystal-seam{left:50%;top:7%;bottom:11%;width:2px;background:linear-gradient(180deg,transparent,rgba(220,245,255,.98) 17%,rgba(80,170,255,.9) 50%,rgba(220,245,255,.98) 82%,transparent);box-shadow:0 0 10px rgba(135,210,255,.95),0 0 24px rgba(0,105,255,.72);opacity:.5}
.approved-heart-case .crystal-title{position:absolute;left:50%;top:45%;transform:translate(-50%,-50%);z-index:6;width:86%;text-align:center;pointer-events:none;text-shadow:0 2px 0 #06172c,0 4px 0 #0b315f,0 7px 10px rgba(0,0,0,.9),0 0 12px rgba(180,230,255,.75)}
.approved-heart-case .crystal-title strong{display:block;font:900 clamp(58px,15vw,108px)/.86 Georgia,serif;letter-spacing:.025em;color:#d8efff;-webkit-text-stroke:1.4px #fff;background:linear-gradient(180deg,#fff 0%,#9edcff 35%,#2a6bbd 65%,#dff5ff 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 2px 0 #071d42) drop-shadow(0 5px 0 #0c3b76)}
.approved-heart-case .crystal-title span{display:block;margin-top:12px;font:800 clamp(22px,5vw,38px)/1 Georgia,serif;letter-spacing:.08em;color:#dff5ff;-webkit-text-stroke:.8px #fff;text-shadow:0 2px 0 #07172d,0 4px 0 #0b3972,0 6px 10px rgba(0,0,0,.85)}
.approved-heart-case .crystal-enter{bottom:2%;z-index:8;min-width:72%;padding:17px 24px;border-radius:28px;border:2px solid rgba(220,250,255,.96);background:linear-gradient(180deg,rgba(14,88,190,.95),rgba(2,28,78,.98));box-shadow:0 0 18px rgba(80,180,255,.7),inset 0 0 18px rgba(140,220,255,.18);font-weight:900;letter-spacing:.05em}
.crystal-gate.is-open .approved-heart-case .crystal-title{opacity:0;transition:opacity .25s ease}
.crystal-gate.is-open .approved-heart-case .crystal-enter{opacity:0;pointer-events:none;transition:opacity .2s ease}
@media(max-width:420px){.crystal-case.approved-heart-case{width:min(94vw,430px)}.approved-heart-case .crystal-title{top:44%}.approved-heart-case .crystal-enter{bottom:1.5%}}
`;
document.head.appendChild(style);
})();