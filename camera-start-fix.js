(() => {
  'use strict';

  const cameraCard = document.getElementById('cameraCard');
  const preview = document.getElementById('preview');
  const startBtn = document.getElementById('startBtn');
  if (!cameraCard || !preview) return;

  document.getElementById('oskoStartCameraNow')?.remove();

  const button = document.createElement('button');
  button.id = 'oskoStartCameraNow';
  button.className = 'osko-start-camera-now';
  button.type = 'button';
  button.textContent = 'START CAMERA';
  button.setAttribute('aria-label', 'Start OSKO Camera');
  cameraCard.appendChild(button);

  function running() {
    const tracks = preview.srcObject?.getVideoTracks?.() || [];
    return tracks.some(track => track.readyState === 'live');
  }

  function refresh() {
    const isRunning = running();
    button.hidden = isRunning;
    const photo = document.getElementById('overlayPhotoBtn');
    if (photo) {
      photo.textContent = isRunning ? 'PHOTO' : 'START';
      photo.disabled = false;
    }
  }

  async function openCamera() {
    button.disabled = true;
    button.textContent = 'OPENING…';
    try {
      if (typeof startCamera === 'function') {
        await startCamera();
      } else if (startBtn) {
        startBtn.disabled = false;
        startBtn.click();
      }
    } catch (error) {
      console.error('OSKO start camera failed', error);
      if (typeof showError === 'function') {
        showError('Camera did not open. Allow Camera permission in Chrome, then press START CAMERA again.');
      }
    } finally {
      button.disabled = false;
      button.textContent = 'START CAMERA';
      setTimeout(refresh, 700);
    }
  }

  button.addEventListener('click', openCamera);
  preview.addEventListener('playing', refresh);
  preview.addEventListener('emptied', refresh);
  startBtn?.addEventListener('click', () => setTimeout(refresh, 500));

  const timer = setInterval(refresh, 500);
  window.addEventListener('beforeunload', () => clearInterval(timer));
  refresh();
})();
