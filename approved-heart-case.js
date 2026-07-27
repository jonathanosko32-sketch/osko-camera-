(()=>{
'use strict';
const gate=document.getElementById('crystalGate');
const box=document.querySelector('.crystal-case');
if(!gate||!box)return;
box.classList.add('approved-heart-case');
const title=box.querySelector('.crystal-title');
if(title)title.innerHTML='<strong>OSKO</strong><span>ICE CRYSTALS</span>';
const enter=document.getElementById('crystalEnter');
if(enter)enter.textContent='START CAMERA';
const style=document.createElement('style');
style.textContent=`
.crystal-gate{background:radial-gradient(circle at 50% 40%,rgba(14,88,224,.27),rgba(0,5,20,.985) 66%)}
.crystal-case.approved-heart-case{width:min(91vw,510px);aspect-ratio:1/1.08;filter:drop-shadow(0 30px 54px rgba(0,0,0,.76)) drop-shadow(0 0 38px rgba(25,118,255,.78))}
.approved-heart-case .crystal-half{filter:saturate(1.38) contrast(1.16) brightness(1.08)}
.approved-heart-case .crystal-half::before{background:
linear-gradient(132deg,rgba(255,255,255,.62),transparent 15%),
linear-gradient(42deg,transparent 22%,rgba(106,196,255,.30) 23% 34%,transparent 35%),
linear-gradient(150deg,transparent 30%,rgba(255,255,255,.30) 31% 42%,transparent 43%),
linear-gradient(18deg,transparent 52%,rgba(39,126,255,.36) 53% 64%,transparent 65%),
radial-gradient(circle at 50% 42%,#1680ff 0 8%,#0a50cf 24%,#052a84 51%,#02123f 76%,#01081d 100%);
box-shadow:inset 0 0 34px rgba(176,232,255,.58),inset 0 0 82px rgba(13,78,224,.58)}
.approved-heart-case .crystal-title{top:43%;width:86%;text-shadow:0 2px 0 #07172f,0 5px 0 #0b3268,0 8px 13px rgba(0,0,0,.92),0 0 15px rgba(182,232,255,.9)}
.approved-heart-case .crystal-title strong{font:900 clamp(62px,16vw,102px)/.85 Georgia,serif;letter-spacing:.025em;-webkit-text-stroke:1.2px rgba(255,255,255,.95);background:linear-gradient(180deg,#fff 0%,#d7f3ff 20%,#7dc7ff 46%,#2f75c8 68%,#eaf9ff 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 2px 0 #10224a) drop-shadow(0 5px 0 #0a3268) drop-shadow(0 8px 9px rgba(0,0,0,.86))}
.approved-heart-case .crystal-title span{margin-top:14px;font:900 clamp(22px,5.2vw,34px)/1 Georgia,serif;letter-spacing:.10em;color:#e6f7ff;-webkit-text-stroke:.7px #fff;text-shadow:0 2px 0 #07162c,0 4px 0 #0b3973,0 7px 10px rgba(0,0,0,.9)}
.approved-heart-case .crystal-seam{top:9%;bottom:8%;opacity:.62}
.approved-heart-case .crystal-enter{bottom:-17%;min-width:250px;border-radius:25px;background:linear-gradient(180deg,rgba(18,91,194,.98),rgba(2,27,78,.99));box-shadow:0 0 0 2px rgba(104,205,255,.22),0 0 28px rgba(49,145,255,.72),inset 0 0 18px rgba(160,225,255,.16)}
.crystal-gate.is-open .approved-heart-case .crystal-title,.crystal-gate.is-open .approved-heart-case .crystal-enter{opacity:0;transition:opacity .22s ease}
@media(max-width:420px){.crystal-case.approved-heart-case{width:min(89vw,420px)}.approved-heart-case .crystal-title{top:43%}.approved-heart-case .crystal-enter{bottom:-15%;min-width:225px}}
`;
document.head.appendChild(style);
})();