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
.crystal-gate{background:radial-gradient(circle at 50% 42%,rgba(11,78,205,.32),#010716 68%,#00030c 100%);padding:14px;isolation:isolate}
.crystal-case.approved-heart-case{width:min(94vw,560px);aspect-ratio:1.12/1;filter:drop-shadow(0 30px 54px rgba(0,0,0,.8)) drop-shadow(0 0 42px rgba(27,119,255,.76));perspective:1300px}
.approved-heart-case .crystal-half{top:0;bottom:0;left:0;right:auto;width:100%;overflow:hidden;filter:saturate(1.36) contrast(1.18) brightness(1.07);transition:transform .82s cubic-bezier(.2,.82,.2,1),opacity .58s ease}
.approved-heart-case .crystal-half.left{clip-path:polygon(0 0,50% 0,50% 100%,0 100%);transform-origin:left center}
.approved-heart-case .crystal-half.right{clip-path:polygon(50% 0,100% 0,100% 100%,50% 100%);transform-origin:right center}
.approved-heart-case .crystal-half::before,
.approved-heart-case .crystal-half.left::before,
.approved-heart-case .crystal-half.right::before{content:"";position:absolute;inset:0;left:0;width:100%;height:100%;clip-path:path('M280 500 C226 447 42 309 42 166 C42 72 116 20 194 20 C236 20 267 45 280 75 C293 45 324 20 366 20 C444 20 518 72 518 166 C518 309 334 447 280 500 Z');background:
linear-gradient(132deg,rgba(255,255,255,.7),transparent 15%),
linear-gradient(42deg,transparent 20%,rgba(118,205,255,.33) 21% 34%,transparent 35%),
linear-gradient(150deg,transparent 29%,rgba(255,255,255,.34) 30% 43%,transparent 44%),
linear-gradient(18deg,transparent 51%,rgba(41,133,255,.42) 52% 65%,transparent 66%),
radial-gradient(circle at 50% 43%,#2490ff 0 7%,#0a57d8 23%,#052d91 49%,#02164f 73%,#01091f 100%);box-shadow:inset 0 0 38px rgba(184,236,255,.62),inset 0 0 92px rgba(12,74,220,.62)}
.approved-heart-case .crystal-title{top:43%;width:82%;text-align:center;text-shadow:0 2px 0 #06162e,0 5px 0 #0b3268,0 9px 15px rgba(0,0,0,.94),0 0 18px rgba(183,235,255,.92)}
.approved-heart-case .crystal-title strong{font:900 clamp(58px,15vw,100px)/.88 Georgia,serif;letter-spacing:.025em;-webkit-text-stroke:1.2px rgba(255,255,255,.96);background:linear-gradient(180deg,#fff 0%,#dcf5ff 18%,#82caff 44%,#2e73c7 68%,#eefbff 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 2px 0 #10234a) drop-shadow(0 5px 0 #0a3268) drop-shadow(0 9px 10px rgba(0,0,0,.9))}
.approved-heart-case .crystal-title span{display:block;margin-top:12px;font:900 clamp(22px,5.3vw,36px)/1 Georgia,serif;letter-spacing:.105em;color:#eefaff;-webkit-text-stroke:.7px #fff;text-shadow:0 2px 0 #07162c,0 4px 0 #0b3973,0 8px 11px rgba(0,0,0,.92)}
.approved-heart-case .crystal-seam{top:8%;bottom:13%;opacity:.7}
.approved-heart-case .crystal-enter{bottom:1%;min-width:220px;padding:14px 26px;border-radius:24px;font-size:19px;background:linear-gradient(180deg,rgba(18,91,194,.98),rgba(2,27,78,.99));box-shadow:0 0 0 2px rgba(104,205,255,.22),0 0 28px rgba(49,145,255,.72),inset 0 0 18px rgba(160,225,255,.16)}
.crystal-gate.is-open .approved-heart-case .crystal-half.left{transform:translateX(-52%) rotateY(-8deg);opacity:.97}
.crystal-gate.is-open .approved-heart-case .crystal-half.right{transform:translateX(52%) rotateY(8deg);opacity:.97}
.crystal-gate.is-open .approved-heart-case .crystal-title,.crystal-gate.is-open .approved-heart-case .crystal-enter{opacity:0;transition:opacity .2s ease}
@media(max-width:420px){.crystal-case.approved-heart-case{width:min(94vw,440px)}.approved-heart-case .crystal-title{top:42%}.approved-heart-case .crystal-enter{bottom:0;min-width:205px;font-size:18px;padding:13px 22px}}
`;
document.head.appendChild(style);
})();