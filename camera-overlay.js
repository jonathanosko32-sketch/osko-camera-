(() => {
  'use strict';

  const cameraCard = document.getElementById('cameraCard');
  const zoomRange = document.getElementById('zoomRange');
  const zoomValue = document.getElementById('zoomValue');
  const captureBtn = document.getElementById('captureBtn');
  const switchBtn = document.getElementById('switchBtn');
  const torchToggle = document.getElementById('torchToggle');
  if (!cameraCard || !zoomRange) return;

  document.querySelector('.camera-live-overlay')?.remove();

  const overlay = document.createElement('section');
  overlay.className = 'camera-live-overlay';
  overlay.setAttribute('aria-label', 'Live camera controls');
  overlay.innerHTML = `
    <div class="overlay-zoom-row">
      <label for="overlayZoomRange">ZOOM</label>
      <input id="overlayZoomRange" type="range" min="1" max="1" step="0.1" value="1" disabled>
      <span id="overlayZoomValue" class="overlay-zoom-value">1.0×</span>
    </div>
    <div class="overlay-presets">
      <button type="button" data-overlay-zoom="1">1×</button>
      <button type="button" data-overlay-zoom="2">2×</button>
      <button type="button" data-overlay-zoom="4">4×</button>
      <button type="button" data-overlay-zoom="8">8×</button>
    </div>
    <div class="overlay-actions">
      <button id="overlayFlashBtn" class="overlay-flash" type="button">FLASHLIGHT</button>
      <button id="overlayPhotoBtn" class="overlay-photo" type="button">PHOTO</button>
      <button id="overlayFlipBtn" type="button">FLIP</button>
    </div>`;
  cameraCard.appendChild(overlay);

  const overlayZoom = document.getElementById('overlayZoomRange');
  const overlayZoomValue = document.getElementById('overlayZoomValue');
  const flashBtn = document.getElementById('overlayFlashBtn');
  const photoBtn = document.getElementById('overlayPhotoBtn');
  const flipBtn = document.getElementById('overlayFlipBtn');
  const presetButtons = [...overlay.querySelectorAll('[data-overlay-zoom]')];

  function syncFromMain() {
    overlayZoom.min = zoomRange.min;
    overlayZoom.max = zoomRange.max;
    overlayZoom.step = zoomRange.step || 0.1;
    overlayZoom.value = zoomRange.value;
    overlayZoom.disabled = zoomRange.disabled;
    overlayZoomValue.textContent = `${Number(zoomRange.value || 1).toFixed(1)}×`;

    const min = Number(zoomRange.min || 1);
    const max = Number(zoomRange.max || 1);
    const current = Number(zoomRange.value || 1);
    presetButtons.forEach(button => {
      const target = Number(button.dataset.overlayZoom);
      button.disabled = zoomRange.disabled || target < min || target > max;
      button.classList.toggle('active', Math.abs(target - current) < 0.06);
    });

    const torchOn = Boolean(torchToggle?.checked);
    flashBtn.classList.toggle('active', torchOn);
    flashBtn.textContent = torchOn ? 'LIGHT ON' : 'FLASHLIGHT';
    photoBtn.disabled = Boolean(captureBtn?.disabled);
    flipBtn.disabled = Boolean(switchBtn?.disabled);
  }

  async function applyZoom(value) {
    zoomRange.value = value;
    zoomRange.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 40));
    syncFromMain();
  }

  overlayZoom.addEventListener('input', () => applyZoom(overlayZoom.value));
  presetButtons.forEach(button => button.addEventListener('click', () => applyZoom(button.dataset.overlayZoom)));
  photoBtn.addEventListener('click', () => captureBtn?.click());
  flipBtn.addEventListener('click', () => switchBtn?.click());
  flashBtn.addEventListener('click', () => {
    if (torchToggle) {
      torchToggle.checked = !torchToggle.checked;
      torchToggle.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (typeof setRearFlash === 'function') {
      setRearFlash(!flashBtn.classList.contains('active'));
    }
    setTimeout(syncFromMain, 250);
  });

  zoomRange.addEventListener('input', syncFromMain);
  torchToggle?.addEventListener('change', () => setTimeout(syncFromMain, 100));
  [captureBtn, switchBtn].filter(Boolean).forEach(button => {
    const observer = new MutationObserver(syncFromMain);
    observer.observe(button, { attributes: true, attributeFilter: ['disabled'] });
  });

  const poll = setInterval(syncFromMain, 800);
  window.addEventListener('beforeunload', () => clearInterval(poll));
  syncFromMain();
})();
