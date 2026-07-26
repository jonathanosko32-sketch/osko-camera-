(() => {
  'use strict';

  const cameraCard = document.getElementById('cameraCard');
  const zoomRange = document.getElementById('zoomRange');
  const brightnessRange = document.getElementById('brightnessRange');
  const exposureRange = document.getElementById('exposureRange');
  const lowLightRange = document.getElementById('lowLightStrength');
  const startBtn = document.getElementById('startBtn');
  const captureBtn = document.getElementById('captureBtn');
  const switchBtn = document.getElementById('switchBtn');
  const torchToggle = document.getElementById('torchToggle');
  const steadyToggle = document.getElementById('steadyToggle');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const preview = document.getElementById('preview');
  if (!cameraCard || !zoomRange) return;

  document.querySelector('.camera-live-overlay')?.remove();
  document.querySelector('.mobile-camera-controls')?.remove();

  const overlay = document.createElement('section');
  overlay.className = 'camera-live-overlay';
  overlay.setAttribute('aria-label', 'Live camera controls');
  overlay.innerHTML = `
    <div class="crystal-rail crystal-rail-left">
      <label class="rail-control" for="overlayExposure">
        <span class="rail-name">EXP</span>
        <input id="overlayExposure" type="range" min="-2" max="2" step="0.1" value="0">
        <strong id="overlayExposureValue">0.0</strong>
      </label>
      <label class="rail-control" for="overlayLowLight">
        <span class="rail-name">LOW</span>
        <input id="overlayLowLight" type="range" min="1" max="5" step="1" value="3">
        <strong id="overlayLowLightValue">3</strong>
      </label>
    </div>

    <div class="crystal-rail crystal-rail-right">
      <label class="rail-control" for="overlayBrightness">
        <span class="rail-name">BRI</span>
        <input id="overlayBrightness" type="range" min="100" max="320" step="5" value="100">
        <strong id="overlayBrightnessValue">100</strong>
      </label>
      <label class="rail-control" for="overlayZoom">
        <span class="rail-name">ZOOM</span>
        <input id="overlayZoom" type="range" min="1" max="1" step="0.1" value="1" disabled>
        <strong id="overlayZoomValue">1.0×</strong>
      </label>
    </div>

    <div class="crystal-bottom-controls">
      <div class="crystal-presets" aria-label="Zoom presets">
        <button type="button" data-overlay-zoom="1">1×</button>
        <button type="button" data-overlay-zoom="2">2×</button>
        <button type="button" data-overlay-zoom="4">4×</button>
        <button type="button" data-overlay-zoom="8">8×</button>
      </div>
      <div class="crystal-actions">
        <button id="overlayFlashBtn" type="button">LIGHT</button>
        <button id="overlaySteadyBtn" type="button">STEADY</button>
        <button id="overlayPhotoBtn" class="primary-crystal" type="button">START CAMERA</button>
        <button id="overlayFlipBtn" type="button">FLIP</button>
        <button id="overlayFullBtn" type="button">FULL</button>
      </div>
    </div>`;
  cameraCard.appendChild(overlay);

  const overlayZoom = document.getElementById('overlayZoom');
  const overlayZoomValue = document.getElementById('overlayZoomValue');
  const overlayBrightness = document.getElementById('overlayBrightness');
  const overlayBrightnessValue = document.getElementById('overlayBrightnessValue');
  const overlayExposure = document.getElementById('overlayExposure');
  const overlayExposureValue = document.getElementById('overlayExposureValue');
  const overlayLowLight = document.getElementById('overlayLowLight');
  const overlayLowLightValue = document.getElementById('overlayLowLightValue');
  const flashBtn = document.getElementById('overlayFlashBtn');
  const steadyBtn = document.getElementById('overlaySteadyBtn');
  const photoBtn = document.getElementById('overlayPhotoBtn');
  const flipBtn = document.getElementById('overlayFlipBtn');
  const fullBtn = document.getElementById('overlayFullBtn');
  const presetButtons = [...overlay.querySelectorAll('[data-overlay-zoom]')];

  function cameraIsRunning() {
    const media = preview?.srcObject;
    const tracks = media?.getVideoTracks?.() || [];
    return tracks.some(track => track.readyState === 'live');
  }

  function copyRange(source, target) {
    if (!source || !target) return;
    target.min = source.min;
    target.max = source.max;
    target.step = source.step || 1;
    target.value = source.value;
    target.disabled = source.disabled;
  }

  function syncFromMain() {
    copyRange(zoomRange, overlayZoom);
    copyRange(brightnessRange, overlayBrightness);
    copyRange(exposureRange, overlayExposure);
    copyRange(lowLightRange, overlayLowLight);

    overlayZoomValue.textContent = `${Number(zoomRange.value || 1).toFixed(1)}×`;
    overlayBrightnessValue.textContent = `${Math.round(Number(brightnessRange?.value || 100))}`;
    overlayExposureValue.textContent = Number(exposureRange?.value || 0).toFixed(1);
    overlayLowLightValue.textContent = `${Math.round(Number(lowLightRange?.value || 3))}`;

    const running = cameraIsRunning();
    const min = Number(zoomRange.min || 1);
    const max = Number(zoomRange.max || 1);
    const current = Number(zoomRange.value || 1);
    presetButtons.forEach(button => {
      const target = Number(button.dataset.overlayZoom);
      button.disabled = !running || zoomRange.disabled || target < min || target > max;
      button.classList.toggle('active', Math.abs(target - current) < 0.06);
    });

    const torchOn = Boolean(torchToggle?.checked);
    flashBtn.classList.toggle('active', torchOn);
    flashBtn.textContent = torchOn ? 'LIGHT ON' : 'LIGHT';
    flashBtn.disabled = !running;
    steadyBtn.classList.toggle('active', Boolean(steadyToggle?.checked));
    photoBtn.textContent = running ? 'PHOTO' : 'START CAMERA';
    photoBtn.classList.toggle('start-mode', !running);
    photoBtn.disabled = false;
    flipBtn.disabled = !running || Boolean(switchBtn?.disabled);
    overlay.classList.toggle('camera-off', !running);
  }

  function relayRange(source, value) {
    if (!source || source.disabled || !cameraIsRunning()) return;
    source.value = value;
    source.dispatchEvent(new Event('input', { bubbles: true }));
    setTimeout(syncFromMain, 30);
  }

  overlayZoom.addEventListener('input', () => relayRange(zoomRange, overlayZoom.value));
  overlayBrightness.addEventListener('input', () => relayRange(brightnessRange, overlayBrightness.value));
  overlayExposure.addEventListener('input', () => relayRange(exposureRange, overlayExposure.value));
  overlayLowLight.addEventListener('input', () => relayRange(lowLightRange, overlayLowLight.value));
  presetButtons.forEach(button => button.addEventListener('click', () => relayRange(zoomRange, button.dataset.overlayZoom)));

  photoBtn.addEventListener('click', async () => {
    if (cameraIsRunning()) {
      captureBtn?.click();
      return;
    }

    photoBtn.disabled = true;
    photoBtn.textContent = 'OPENING…';
    try {
      if (typeof startCamera === 'function') {
        await startCamera();
      } else {
        startBtn?.click();
      }
    } catch (error) {
      console.error('Could not start camera from crystal controls', error);
      if (typeof showError === 'function') showError('Camera did not open. Tap Camera permission in Chrome, then try again.');
    } finally {
      setTimeout(syncFromMain, 700);
    }
  });

  flipBtn.addEventListener('click', () => switchBtn?.click());
  fullBtn.addEventListener('click', () => fullscreenBtn?.click());
  steadyBtn.addEventListener('click', () => {
    if (!steadyToggle) return;
    steadyToggle.checked = !steadyToggle.checked;
    steadyToggle.dispatchEvent(new Event('change', { bubbles: true }));
    syncFromMain();
  });
  flashBtn.addEventListener('click', () => {
    if (!torchToggle || !cameraIsRunning()) return;
    torchToggle.checked = !torchToggle.checked;
    torchToggle.dispatchEvent(new Event('change', { bubbles: true }));
    setTimeout(syncFromMain, 200);
  });

  [zoomRange, brightnessRange, exposureRange, lowLightRange].filter(Boolean)
    .forEach(control => control.addEventListener('input', syncFromMain));
  [torchToggle, steadyToggle].filter(Boolean)
    .forEach(control => control.addEventListener('change', syncFromMain));
  [startBtn, captureBtn, switchBtn].filter(Boolean)
    .forEach(button => button.addEventListener('click', () => setTimeout(syncFromMain, 350)));
  preview?.addEventListener('playing', syncFromMain);
  preview?.addEventListener('emptied', syncFromMain);

  const poll = setInterval(syncFromMain, 500);
  window.addEventListener('beforeunload', () => clearInterval(poll));
  syncFromMain();
})();
