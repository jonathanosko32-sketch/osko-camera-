(() => {
  'use strict';

  let lastTrackId = '';
  let clearZoomLimit = 1;
  let hardwareZoomMax = 1;
  let photoCapabilities = null;

  function qualityLabel(value) {
    const zoom = Number(value || 1);
    if (zoom <= clearZoomLimit + 0.001) return 'CLEAR';
    if (zoom <= Math.min(hardwareZoomMax, clearZoomLimit * 1.7)) return 'EXTENDED';
    return 'MAX';
  }

  function updateZoomReadout() {
    if (!zoomRange || !zoomValue) return;
    const zoom = Number(zoomRange.value || 1);
    zoomValue.textContent = `${zoom.toFixed(1)}× · ${qualityLabel(zoom)}`;
    zoomValue.title = `Hardware range: ${Number(zoomRange.min || 1).toFixed(1)}× to ${hardwareZoomMax.toFixed(1)}×. Clear starting range: up to ${clearZoomLimit.toFixed(1)}×; final clear limit must be tested on this phone.`;
  }

  async function applyClarityControls() {
    if (!videoTrack || videoTrack.readyState !== 'live') return;
    const settings = videoTrack.getSettings?.() || {};
    const trackId = settings.deviceId || videoTrack.id || '';
    if (trackId === lastTrackId && photoCapabilities) return;
    lastTrackId = trackId;

    const caps = videoTrack.getCapabilities?.() || {};
    photoCapabilities = caps;
    const advanced = [];

    if (Array.isArray(caps.focusMode) && caps.focusMode.includes('continuous')) advanced.push({ focusMode: 'continuous' });
    if (Array.isArray(caps.exposureMode) && caps.exposureMode.includes('continuous')) advanced.push({ exposureMode: 'continuous' });
    if (Array.isArray(caps.whiteBalanceMode) && caps.whiteBalanceMode.includes('continuous')) advanced.push({ whiteBalanceMode: 'continuous' });
    if (Array.isArray(caps.resizeMode) && caps.resizeMode.includes('none')) advanced.push({ resizeMode: 'none' });

    for (const constraint of advanced) {
      try { await videoTrack.applyConstraints({ advanced: [constraint] }); }
      catch (error) { console.debug('OSKO clarity control not available:', constraint, error); }
    }

    if (caps.zoom) {
      hardwareZoomMax = Number(caps.zoom.max || 1);
      clearZoomLimit = Math.min(hardwareZoomMax, hardwareZoomMax <= 2 ? hardwareZoomMax : 3);
      zoomRange.min = Number(caps.zoom.min || 1);
      zoomRange.max = hardwareZoomMax;
      zoomRange.step = Number(caps.zoom.step || 0.1);
      zoomRange.disabled = false;
      updateZoomReadout();
    } else {
      hardwareZoomMax = 1;
      clearZoomLimit = 1;
      updateZoomReadout();
    }

    const width = Number(settings.width || preview.videoWidth || 0);
    const height = Number(settings.height || preview.videoHeight || 0);
    if (width && height) setStatus(`Camera ready · ${width}×${height} · clarity tuned`);
  }

  async function takeHighestResolutionFrame() {
    if (!videoTrack || !('ImageCapture' in window)) return null;
    try {
      const imageCapture = new ImageCapture(videoTrack);
      const blob = await imageCapture.takePhoto();
      if (!blob || !blob.size) return null;
      return await createImageBitmap(blob);
    } catch (error) {
      console.debug('Full-resolution still capture unavailable; using live frame.', error);
      return null;
    }
  }

  const originalMakeProcessedCanvas = makeProcessedCanvas;
  makeProcessedCanvas = async function makeCrystalClearCanvas() {
    if (!stream || !preview.videoWidth) throw new Error('Camera is not ready');

    const bitmap = await takeHighestResolutionFrame();
    if (!bitmap) return originalMakeProcessedCanvas();

    let sourceWidth = bitmap.width;
    let sourceHeight = bitmap.height;
    let width = sourceWidth;
    let height = sourceHeight;

    if (modeSelect.value === 'scanner') {
      const maxSide = 3000;
      const scale = Math.min(1, maxSide / Math.max(width, height));
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: false });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.filter = filterString();

    const crop = steadyToggle.checked ? 0.025 : 0;
    const sx = sourceWidth * crop;
    const sy = sourceHeight * crop;
    const sw = sourceWidth - sx * 2;
    const sh = sourceHeight - sy * 2;
    ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, width, height);
    bitmap.close?.();
    ctx.filter = 'none';

    if (modeSelect.value === 'scanner') {
      let data = ctx.getImageData(0, 0, width, height);
      const clarity = Number(scanClarityRange.value);
      if (clarity > 0) data = sharpenPixels(data, width, height, clarity);
      if (scanColorSelect.value === 'bw') {
        const threshold = 205 - Number(scanCleanupRange.value) * 0.75;
        data = blackWhitePixels(data, threshold);
      }
      ctx.putImageData(data, 0, 0);
    }

    return { ctx, width, height };
  };

  zoomRange?.addEventListener('input', () => {
    updateZoomReadout();
    const zoom = Number(zoomRange.value || 1);
    if (zoom > clearZoomLimit) setStatus(`${zoom.toFixed(1)}× ${qualityLabel(zoom).toLowerCase()} zoom · check fine detail`);
  });

  const startControls = [startBtn, dockStart, switchBtn, quickSwitchBtn, dockSwitch].filter(Boolean);
  startControls.forEach(button => button.addEventListener('click', () => setTimeout(applyClarityControls, 650)));

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) setTimeout(applyClarityControls, 300);
  });

  setInterval(() => {
    if (stream && videoTrack?.readyState === 'live') applyClarityControls();
  }, 1500);

  if (brightnessRange && modeSelect?.value === 'normal' && Number(brightnessRange.value) > 100) {
    brightnessRange.value = 100;
    brightnessValue.textContent = '100%';
    updateVisuals();
  }

  window.oskoCameraClarity = () => {
    const settings = videoTrack?.getSettings?.() || {};
    const capabilities = videoTrack?.getCapabilities?.() || {};
    return {
      resolution: `${settings.width || 0}×${settings.height || 0}`,
      currentZoom: Number(settings.zoom || zoomRange?.value || 1),
      clearZoomLimit,
      hardwareZoomMax,
      torchSupported: Boolean(capabilities.torch),
      focusModes: capabilities.focusMode || [],
      exposureModes: capabilities.exposureMode || [],
      whiteBalanceModes: capabilities.whiteBalanceMode || []
    };
  };

  updateZoomReadout();
})();
