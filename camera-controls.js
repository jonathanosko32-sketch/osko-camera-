(() => {
  'use strict';

  const settings = document.querySelector('.quick-tools');
  const cameraCard = document.getElementById('cameraCard');
  const preview = document.getElementById('preview');
  const zoomRange = document.getElementById('zoomRange');
  const zoomValue = document.getElementById('zoomValue');
  const status = document.getElementById('status');
  if (!settings || !cameraCard || !preview || !zoomRange) return;

  const storageKey = 'osko-camera-clear-zoom-limit-v1';
  let savedClearMax = Number(localStorage.getItem(storageKey) || 0);
  let originalExposureCompensation = null;

  const panel = document.createElement('section');
  panel.className = 'precision-tools';
  panel.setAttribute('aria-label', 'Precision camera controls');
  panel.innerHTML = `
    <div class="zoom-presets" aria-label="Zoom presets">
      <button type="button" data-zoom-preset="1">1×</button>
      <button type="button" data-zoom-preset="2">2×</button>
      <button type="button" data-zoom-preset="4">4×</button>
      <button type="button" data-zoom-preset="8">8×</button>
    </div>
    <div class="clarity-readout">
      <strong id="clearZoomReadout">Clear zoom not calibrated</strong>
      <span id="cameraResolutionReadout">Start the camera to read the real lens limits.</span>
    </div>
    <div class="precision-actions">
      <button id="markClearZoomBtn" type="button">Mark this as clear max</button>
      <button id="resetClearZoomBtn" type="button">Reset clear max</button>
    </div>`;
  const zoomLabel = zoomRange.closest('label');
  (zoomLabel?.parentNode || settings).insertBefore(panel, zoomLabel?.nextSibling || null);

  const clearReadout = document.getElementById('clearZoomReadout');
  const resolutionReadout = document.getElementById('cameraResolutionReadout');
  const markClearBtn = document.getElementById('markClearZoomBtn');
  const resetClearBtn = document.getElementById('resetClearZoomBtn');
  const presetButtons = [...panel.querySelectorAll('[data-zoom-preset]')];

  function setStatusText(text) {
    if (status) status.textContent = text;
  }

  function currentTrack() {
    return typeof videoTrack !== 'undefined' ? videoTrack : null;
  }

  function currentZoom() {
    return Number(zoomRange.value || 1);
  }

  function updatePanel() {
    const track = currentTrack();
    const caps = track?.getCapabilities?.() || {};
    const trackSettings = track?.getSettings?.() || {};
    const min = Number(caps.zoom?.min || zoomRange.min || 1);
    const max = Number(caps.zoom?.max || zoomRange.max || 1);
    const zoom = currentZoom();

    presetButtons.forEach(button => {
      const target = Number(button.dataset.zoomPreset);
      button.disabled = !track || target < min || target > max;
      button.classList.toggle('active', Math.abs(target - zoom) < 0.06);
    });

    clearReadout.textContent = savedClearMax > 0
      ? `Your tested clear maximum: ${savedClearMax.toFixed(1)}×`
      : 'Clear zoom not calibrated';

    const width = Number(trackSettings.width || preview.videoWidth || 0);
    const height = Number(trackSettings.height || preview.videoHeight || 0);
    const focus = Array.isArray(caps.focusMode) ? caps.focusMode.join(', ') : 'automatic';
    resolutionReadout.textContent = track
      ? `${width || '?'}×${height || '?'} · hardware ${min.toFixed(1)}×–${max.toFixed(1)}× · focus ${focus}`
      : 'Start the camera to read the real lens limits.';

    if (savedClearMax > 0 && zoomValue) {
      const label = zoom <= savedClearMax + 0.001 ? 'CLEAR' : 'PAST TESTED CLEAR';
      zoomValue.textContent = `${zoom.toFixed(1)}× · ${label}`;
    }
  }

  async function applyZoom(target) {
    const track = currentTrack();
    if (!track) return;
    const caps = track.getCapabilities?.() || {};
    if (!caps.zoom) return;
    const value = Math.max(Number(caps.zoom.min || 1), Math.min(Number(caps.zoom.max || 1), Number(target)));
    zoomRange.value = value;
    try {
      await track.applyConstraints({ advanced: [{ zoom: value }] });
      zoomRange.dispatchEvent(new Event('input', { bubbles: true }));
      setStatusText(`Zoom ${value.toFixed(1)}×`);
    } catch (error) {
      console.warn('Preset zoom failed', error);
      if (typeof showError === 'function') showError('This lens would not accept that zoom level.');
    }
    updatePanel();
  }

  presetButtons.forEach(button => button.addEventListener('click', () => applyZoom(button.dataset.zoomPreset)));

  markClearBtn?.addEventListener('click', () => {
    if (!currentTrack()) return;
    savedClearMax = currentZoom();
    localStorage.setItem(storageKey, String(savedClearMax));
    setStatusText(`Clear zoom saved at ${savedClearMax.toFixed(1)}×`);
    updatePanel();
  });

  resetClearBtn?.addEventListener('click', () => {
    savedClearMax = 0;
    localStorage.removeItem(storageKey);
    setStatusText('Clear zoom calibration reset');
    updatePanel();
  });

  function showFocusRing(clientX, clientY) {
    const rect = cameraCard.getBoundingClientRect();
    const ring = document.createElement('div');
    ring.className = 'focus-ring';
    ring.style.left = `${clientX - rect.left}px`;
    ring.style.top = `${clientY - rect.top}px`;
    cameraCard.appendChild(ring);
    setTimeout(() => ring.remove(), 850);
  }

  async function focusAt(clientX, clientY) {
    const track = currentTrack();
    if (!track || preview.videoWidth <= 0 || preview.videoHeight <= 0) return;
    const caps = track.getCapabilities?.() || {};
    const rect = preview.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    showFocusRing(clientX, clientY);

    const attempts = [];
    if (caps.pointsOfInterest) attempts.push({ pointsOfInterest: [{ x, y }] });
    if (Array.isArray(caps.focusMode) && caps.focusMode.includes('single-shot')) attempts.push({ focusMode: 'single-shot', pointsOfInterest: [{ x, y }] });
    if (Array.isArray(caps.focusMode) && caps.focusMode.includes('continuous')) attempts.push({ focusMode: 'continuous', pointsOfInterest: [{ x, y }] });

    let worked = false;
    for (const constraint of attempts) {
      try {
        await track.applyConstraints({ advanced: [constraint] });
        worked = true;
        break;
      } catch (error) {
        console.debug('Tap focus attempt unavailable', constraint, error);
      }
    }
    setStatusText(worked ? 'Focus locked on tapped area' : 'Focus point selected');
  }

  cameraCard.addEventListener('pointerup', event => {
    if (!currentTrack()) return;
    if (event.target.closest('button')) return;
    focusAt(event.clientX, event.clientY);
  });
  cameraCard.classList.add('focus-supported');

  async function protectTorchExposure(on) {
    const track = currentTrack();
    if (!track) return;
    const caps = track.getCapabilities?.() || {};
    const current = track.getSettings?.() || {};
    if (!caps.exposureCompensation) return;

    if (on) {
      originalExposureCompensation = Number(current.exposureCompensation || 0);
      const low = Number(caps.exposureCompensation.min || 0);
      const target = Math.max(low, Math.min(-0.7, Number(caps.exposureCompensation.max || 0)));
      try { await track.applyConstraints({ advanced: [{ exposureCompensation: target }] }); }
      catch (error) { console.debug('Torch glare protection unavailable', error); }
    } else if (originalExposureCompensation !== null) {
      try { await track.applyConstraints({ advanced: [{ exposureCompensation: originalExposureCompensation }] }); }
      catch (error) { console.debug('Exposure restore unavailable', error); }
      originalExposureCompensation = null;
    }
  }

  if (typeof setRearFlash === 'function') {
    const originalSetRearFlash = setRearFlash;
    setRearFlash = async function enhancedRearFlash(on) {
      const worked = await originalSetRearFlash(on);
      if (worked) await protectTorchExposure(Boolean(on));
      return worked;
    };
  }

  zoomRange.addEventListener('input', updatePanel);
  const watch = setInterval(() => {
    const track = currentTrack();
    if (track?.readyState === 'live') updatePanel();
  }, 1200);
  window.addEventListener('beforeunload', () => clearInterval(watch));
  updatePanel();
})();
