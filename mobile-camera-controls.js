(() => {
  'use strict';

  const camera = document.getElementById('cameraCard');
  const zoomRange = document.getElementById('zoomRange');
  const zoomValue = document.getElementById('zoomValue');
  const quickTorchBtn = document.getElementById('quickTorchBtn');
  const quickCaptureBtn = document.getElementById('quickCaptureBtn');
  const quickSwitchBtn = document.getElementById('quickSwitchBtn');
  const nav = document.querySelector('.compact-nav');
  if (!camera || !zoomRange) return;

  const panel = document.createElement('section');
  panel.className = 'mobile-camera-controls';
  panel.setAttribute('aria-label', 'Always visible camera controls');
  panel.innerHTML = `
    <div class="mobile-camera-zoom-row">
      <span>Zoom</span>
      <input id="mobileZoomRange" type="range" min="1" max="1" step="0.1" value="1" disabled>
      <span id="mobileZoomValue" class="mobile-camera-zoom-value">1.0×</span>
    </div>
    <div class="mobile-camera-presets">
      <button type="button" data-mobile-zoom="1">1×</button>
      <button type="button" data-mobile-zoom="2">2×</button>
      <button type="button" data-mobile-zoom="4">4×</button>
      <button type="button" data-mobile-zoom="8">8×</button>
    </div>
    <div class="mobile-camera-actions">
      <button type="button" class="mobile-light">Flashlight</button>
      <button type="button" class="mobile-photo">Photo</button>
      <button type="button" class="mobile-flip">Flip</button>
    </div>
    <p class="mobile-camera-help">Camera stays visible while you change zoom and take the picture.</p>`;
  camera.insertAdjacentElement('afterend', panel);

  const mobileRange = panel.querySelector('#mobileZoomRange');
  const mobileValue = panel.querySelector('#mobileZoomValue');
  const presetButtons = [...panel.querySelectorAll('[data-mobile-zoom]')];
  const lightButton = panel.querySelector('.mobile-light');
  const photoButton = panel.querySelector('.mobile-photo');
  const flipButton = panel.querySelector('.mobile-flip');

  function cameraViewActive() {
    const active = nav?.querySelector('[data-view="camera"].active');
    return Boolean(active) || !nav;
  }

  function syncPanel() {
    mobileRange.min = zoomRange.min || 1;
    mobileRange.max = zoomRange.max || 1;
    mobileRange.step = zoomRange.step || 0.1;
    mobileRange.value = zoomRange.value || 1;
    mobileRange.disabled = zoomRange.disabled;
    const current = Number(zoomRange.value || 1);
    mobileValue.textContent = `${current.toFixed(1)}×`;
    presetButtons.forEach(button => {
      const target = Number(button.dataset.mobileZoom);
      button.disabled = zoomRange.disabled || target < Number(zoomRange.min || 1) || target > Number(zoomRange.max || 1);
      button.classList.toggle('active', Math.abs(target - current) < 0.06);
    });
    photoButton.disabled = Boolean(quickCaptureBtn?.disabled);
    flipButton.disabled = Boolean(quickSwitchBtn?.disabled);
    lightButton.classList.toggle('active', Boolean(typeof torchOn !== 'undefined' && torchOn));
    lightButton.textContent = typeof torchOn !== 'undefined' && torchOn ? 'Light On' : 'Flashlight';
    panel.classList.toggle('app-view-hidden', !cameraViewActive());
  }

  async function applyZoom(value) {
    if (zoomRange.disabled) return;
    zoomRange.value = value;
    zoomRange.dispatchEvent(new Event('input', { bubbles: true }));
    syncPanel();
  }

  mobileRange.addEventListener('input', () => applyZoom(mobileRange.value));
  presetButtons.forEach(button => button.addEventListener('click', () => applyZoom(button.dataset.mobileZoom)));
  lightButton.addEventListener('click', () => quickTorchBtn?.click());
  photoButton.addEventListener('click', () => quickCaptureBtn?.click());
  flipButton.addEventListener('click', () => quickSwitchBtn?.click());

  zoomRange.addEventListener('input', syncPanel);
  quickTorchBtn?.addEventListener('click', () => setTimeout(syncPanel, 200));
  nav?.addEventListener('click', () => setTimeout(syncPanel, 50));

  const observer = new MutationObserver(syncPanel);
  [zoomRange, quickCaptureBtn, quickSwitchBtn, quickTorchBtn].filter(Boolean).forEach(el => observer.observe(el, { attributes: true, attributeFilter: ['disabled', 'class'] }));

  setInterval(syncPanel, 900);
  syncPanel();
})();
