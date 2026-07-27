(() => {
  'use strict';

  const preview = document.getElementById('preview');
  const cameraCard = document.getElementById('cameraCard');
  if (!preview || !cameraCard) return;

  const style = document.createElement('style');
  style.textContent = `
    #cameraCard.osko-front-fill #preview {
      width:100%;
      height:100%;
      object-fit:cover;
      object-position:center 38%;
      background:#000;
    }
    #cameraCard.osko-rear-fit #preview {
      width:100%;
      height:100%;
      object-fit:cover;
      object-position:center center;
    }
  `;
  document.head.appendChild(style);

  function currentFacing() {
    try {
      const settings = videoTrack?.getSettings?.() || {};
      return settings.facingMode || facingMode || 'environment';
    } catch {
      return typeof facingMode !== 'undefined' ? facingMode : 'environment';
    }
  }

  function updateFraming() {
    const front = currentFacing() === 'user';
    cameraCard.classList.toggle('osko-front-fill', front);
    cameraCard.classList.toggle('osko-rear-fit', !front);
    preview.style.transformOrigin = 'center center';
  }

  preview.addEventListener('loadedmetadata', updateFraming);
  preview.addEventListener('playing', updateFraming);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) setTimeout(updateFraming, 250);
  });
  setInterval(updateFraming, 1000);
  updateFraming();
})();
