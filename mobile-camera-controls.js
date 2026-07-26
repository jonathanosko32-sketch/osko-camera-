(() => {
  'use strict';

  const camera = document.getElementById('cameraCard');
  const zoomRange = document.getElementById('zoomRange');
  const quickTorchBtn = document.getElementById('quickTorchBtn');
  const quickCaptureBtn = document.getElementById('quickCaptureBtn');
  const quickSwitchBtn = document.getElementById('quickSwitchBtn');
  const nav = document.querySelector('.compact-nav');
  if (!camera || !zoomRange) return;

  document.querySelector('.mobile-camera-controls')?.remove();

  const overlay = document.createElement('section');
  overlay.className = 'mobile-camera-overlay-controls';
  overlay.setAttribute('aria-label', 'Camera controls on the live view');
  overlay.innerHTML = `
    <div class="camera-side-rail camera-side-left" aria-label="Near zoom controls">
      <button type="button" data-side-zoom="1">1×</button>
      <button type="button" data-side-zoom="2">2×</button>
    </div>
    <div class="camera-side-rail camera-side-right" aria-label="Far zoom controls">
      <button type="button" data-side-zoom="4">4×</button>
      <button type="button" data-side-zoom="8">8×</button>
    </div>
    <div class="camera-overlay-bottom">
      <button type="button" class="overlay-light">Light</button>
      <button type="button" class="overlay-photo">Photo</button>
      <button type="button" class="overlay-flip">Flip</button>
    </div>`;
  camera.appendChild(overlay);

  const zoomButtons = [...overlay.querySelectorAll('[data-side-zoom]')];
  const lightButton = overlay.querySelector('.overlay-light');
  const photoButton = overlay.querySelector('.overlay-photo');
  const flipButton = overlay.querySelector('.overlay-flip');

  function cameraViewActive() {
    const active = nav?.querySelector('[data-view="camera"].active');
    return Boolean(active) || !nav;
  }

  function syncOverlay() {
    const current = Number(zoomRange.value || 1);
    const min = Number(zoomRange.min || 1);
    const max = Number(zoomRange.max || 1);

    zoomButtons.forEach(button => {
      const target = Number(button.dataset.sideZoom);
      button.disabled = zoomRange.disabled || target < min || target > max;
      button.classList.toggle('active', Math.abs(target - current) < 0.06);
    });

    photoButton.disabled = Boolean(quickCaptureBtn?.disabled);
    flipButton.disabled = Boolean(quickSwitchBtn?.disabled);
    const lightOn = Boolean(typeof torchOn !== 'undefined' && torchOn);
    lightButton.classList.toggle('active', lightOn);
    lightButton.textContent = lightOn ? 'Light On' : 'Light';
    overlay.classList.toggle('app-view-hidden', !cameraViewActive());
  }

  function applyZoom(value) {
    if (zoomRange.disabled) return;
    zoomRange.value = value;
    zoomRange.dispatchEvent(new Event('input', { bubbles: true }));
    syncOverlay();
  }

  zoomButtons.forEach(button => button.addEventListener('click', () => applyZoom(button.dataset.sideZoom)));
  lightButton.addEventListener('click', () => quickTorchBtn?.click());
  photoButton.addEventListener('click', () => quickCaptureBtn?.click());
  flipButton.addEventListener('click', () => quickSwitchBtn?.click());

  zoomRange.addEventListener('input', syncOverlay);
  quickTorchBtn?.addEventListener('click', () => setTimeout(syncOverlay, 200));
  nav?.addEventListener('click', () => setTimeout(syncOverlay, 50));

  const observer = new MutationObserver(syncOverlay);
  [zoomRange, quickCaptureBtn, quickSwitchBtn, quickTorchBtn]
    .filter(Boolean)
    .forEach(element => observer.observe(element, { attributes: true, attributeFilter: ['disabled', 'class'] }));

  setInterval(syncOverlay, 900);
  syncOverlay();
})();
