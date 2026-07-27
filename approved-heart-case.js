(()=>{
'use strict';
const gate=document.getElementById('crystalGate');
const box=document.querySelector('.crystal-case');
if(!gate||!box)return;
const approved='https://drive.google.com/thumbnail?id=1AI3OQsyjvZSBADjbYaLFkIubRUYFJnxa&sz=w1200';
box.classList.add('approved-heart-image-case');
const left=box.querySelector('.crystal-half.left');
const right=box.querySelector('.crystal-half.right');
[left,right].forEach((half,index)=>{
  half.style.backgroundImage=`url("${approved}")`;
  half.style.backgroundRepeat='no-repeat';
  half.style.backgroundSize='300% 100%';
  half.style.backgroundPosition=index===0?'left center':'33.333% center';
});
const title=box.querySelector('.crystal-title');
if(title)title.hidden=true;
const enter=document.getElementById('crystalEnter');
if(enter)enter.textContent='START CAMERA';
const style=document.createElement('style');
style.textContent=`
.crystal-gate{background:#010611!important;padding:14px!important}
.crystal-case.approved-heart-image-case{width:min(90vw,470px);aspect-ratio:480/570;filter:drop-shadow(0 24px 46px rgba(0,0,0,.82)) drop-shadow(0 0 34px rgba(25,112,255,.72));}
.approved-heart-image-case::before,.approved-heart-image-case::after{display:none!important}
.approved-heart-image-case .crystal-half{top:0;bottom:0;width:50%;overflow:hidden;filter:none!important;background-color:#010611;transition:transform .82s cubic-bezier(.2,.82,.2,1),opacity .58s ease}
.approved-heart-image-case .crystal-half::before{display:none!important}
.approved-heart-image-case .crystal-half.left{left:0;right:auto;clip-path:none!important;transform-origin:left center}
.approved-heart-image-case .crystal-half.right{right:0;left:auto;clip-path:none!important;transform-origin:right center}
.approved-heart-image-case .crystal-seam{top:10%;bottom:9%;width:1px;opacity:.24;box-shadow:0 0 8px rgba(185,234,255,.85)}
.approved-heart-image-case .crystal-enter{bottom:-12%;min-width:200px;padding:13px 24px;border-radius:20px;font-size:17px}
.crystal-gate.is-open .approved-heart-image-case .crystal-half.left{transform:translateX(-101%) rotateY(-7deg)}
.crystal-gate.is-open .approved-heart-image-case .crystal-half.right{transform:translateX(101%) rotateY(7deg)}
@media(max-width:420px){.crystal-case.approved-heart-image-case{width:min(87vw,390px)}.approved-heart-image-case .crystal-enter{bottom:-11%;min-width:190px;font-size:16px}}
`;
document.head.appendChild(style);
})();