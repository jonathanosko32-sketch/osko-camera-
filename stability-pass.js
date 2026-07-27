(() => {
  'use strict';

  const state = {
    busy: false,
    busyName: '',
    zoomTimer: 0,
    recoveryTimer: 0,
    lastRecoveryAt: 0,
    watchedTrackId: '',
    expectedCameraOn: false,
    recordingTransition: false
  };

  const byId = id => document.getElementById(id);
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const cameraButtons = [
    'startBtn', 'dockStart', 'captureBtn', 'quickCaptureBtn', 'dockPhoto',
    'recordBtn', 'quickRecordBtn', 'dockVideo', 'switchBtn', 'quickSwitchBtn',
    'dockSwitch', 'quickTorchBtn'
  ].map(byId).filter(Boolean);

  function announce(message) {
    try { setStatus(message); } catch { /* existing camera status is optional */ }
  }

  function setBusy(on, name = '') {
    state.busy = on;
    state.busyName = on ? name : '';
    document.body.classList.toggle('camera-busy', on);
    cameraButtons.forEach(button => {
      if (!button) return;
      button.setAttribute('aria-busy', on ? 'true' : 'false');
    });
  }

  async function runLocked(name, action, minimumMs = 180) {
    if (state.busy) {
      announce(`${state.busyName || 'Camera'} is still working…`);
      return false;
    }
    setBusy(true, name);
    const started = performance.now();
    try {
      await action();
      const remaining = minimumMs - (performance.now() - started);
      if (remaining > 0) await wait(remaining);
      return true;
    } catch (error) {
      console.error(`OSKO ${name} failed`, error);
      try { showError(`${name} did not finish. The camera stayed protected; try once more.`); } catch {}
      announce(`${name} needs another try`);
      return false;
    } finally {
      setBusy(false);
    }
  }

  const original = {
    start: typeof startCamera === 'function' ? startCamera : null,
    stop: typeof stopCamera === 'function' ? stopCamera : null,
    capture: typeof takePhoto === 'function' ? takePhoto : null,
    switch: typeof switchCamera === 'function' ? switchCamera : null,
    record: typeof toggleRecording === 'function' ? toggleRecording : null,
    flash: typeof setRearFlash === 'function' ? setRearFlash : null
  };

  async function stableStart() {
    if (!original.start) return;
    await runLocked(stream ? 'Closing camera' : 'Opening camera', async () => {
      await original.start();
      state.expectedCameraOn = Boolean(stream);
      if (stream) watchCurrentTrack();
    }, 350);
  }

  async function stableCapture() {
    if (!original.capture || !stream) return;
    await runLocked('Taking picture', async () => {
      await original.capture();
    }, 250);
  }

  async function stableSwitch() {
    if (!original.switch || !stream) return;
    if (recorder?.state === 'recording') {
      announce('Stop recording before switching cameras');
      return;
    }
    await runLocked('Switching camera', async () => {
      await original.switch();
      state.expectedCameraOn = Boolean(stream);
      watchCurrentTrack();
    }, 500);
  }

  async function stableFlash() {
    if (!original.flash) return;
    await runLocked(torchOn ? 'Turning flash off' : 'Turning flash on', async () => {
      await original.flash(!torchOn);
    }, 220);
  }

  async function stableRecord() {
    if (!original.record || !stream || state.recordingTransition) return;
    if (state.busy) {
      announce(`${state.busyName || 'Camera'} is still working…`);
      return;
    }
    state.recordingTransition = true;
    try {
      original.record();
      await wait(350);
      if (recorder) {
        recorder.addEventListener('error', event => {
          console.error('OSKO recorder error', event.error || event);
          try { setRecordingUI(false); } catch {}
          announce('Recording stopped safely after a camera error');
        }, { once: true });
      }
    } catch (error) {
      console.error('OSKO recording transition failed', error);
      try { setRecordingUI(false); } catch {}
      try { showError('Video could not start. The camera is still ready for another try.'); } catch {}
    } finally {
      state.recordingTransition = false;
    }
  }

  function intercept(ids, handler) {
    ids.map(byId).filter(Boolean).forEach(button => {
      button.addEventListener('click', event => {
        if (button.disabled) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        handler();
      }, true);
    });
  }

  intercept(['startBtn', 'dockStart'], stableStart);
  intercept(['captureBtn', 'quickCaptureBtn', 'dockPhoto'], stableCapture);
  intercept(['switchBtn', 'quickSwitchBtn', 'dockSwitch'], stableSwitch);
  intercept(['recordBtn', 'quickRecordBtn', 'dockVideo'], stableRecord);
  intercept(['quickTorchBtn'], stableFlash);

  const zoom = byId('zoomRange');
  if (zoom) {
    zoom.addEventListener('input', event => {
      event.stopImmediatePropagation();
      const value = Number(zoom.value || 1);
      const readout = byId('zoomValue');
      if (readout) {
        const max = Number(zoom.max || 1);
        const clearLimit = max <= 2 ? max : Math.min(max, 3);
        const label = value <= clearLimit ? 'CLEAR' : value <= Math.min(max, clearLimit * 1.7) ? 'EXTENDED' : 'MAX';
        readout.textContent = `${value.toFixed(1)}× · ${label}`;
      }
      clearTimeout(state.zoomTimer);
      state.zoomTimer = setTimeout(async () => {
        if (!videoTrack || videoTrack.readyState !== 'live') return;
        try {
          await videoTrack.applyConstraints({ advanced: [{ zoom: value }] });
        } catch (error) {
          console.debug('OSKO smooth zoom unavailable', error);
          try { showError('This camera stopped accepting zoom changes. Switch cameras once to reset it.'); } catch {}
        }
      }, 90);
    }, true);
  }

  function watchCurrentTrack() {
    const track = stream?.getVideoTracks?.()[0];
    if (!track) return;
    const id = track.id || track.getSettings?.().deviceId || '';
    if (id && id === state.watchedTrackId) return;
    state.watchedTrackId = id;
    track.addEventListener('ended', () => scheduleRecovery('Camera connection ended'));
    track.addEventListener('mute', () => {
      clearTimeout(state.recoveryTimer);
      state.recoveryTimer = setTimeout(() => {
        if (track.muted && track.readyState === 'live') scheduleRecovery('Camera picture paused');
      }, 1600);
    });
    track.addEventListener('unmute', () => clearTimeout(state.recoveryTimer));
  }

  function scheduleRecovery(reason) {
    if (!state.expectedCameraOn || document.hidden || recorder?.state === 'recording') return;
    if (Date.now() - state.lastRecoveryAt < 6000) return;
    clearTimeout(state.recoveryTimer);
    state.recoveryTimer = setTimeout(() => recoverCamera(reason), 350);
  }

  async function recoverCamera(reason) {
    if (state.busy || document.hidden || !state.expectedCameraOn) return;
    state.lastRecoveryAt = Date.now();
    await runLocked('Recovering camera', async () => {
      announce(`${reason} · reconnecting…`);
      try { await original.stop?.(); } catch {}
      await wait(250);
      await original.start?.();
      state.expectedCameraOn = Boolean(stream);
      watchCurrentTrack();
      announce(stream ? 'Camera recovered' : 'Tap Start Camera to reconnect');
    }, 600);
  }

  setInterval(() => {
    if (stream) {
      state.expectedCameraOn = true;
      watchCurrentTrack();
      const track = stream.getVideoTracks?.()[0];
      if (track && track.readyState === 'ended') scheduleRecovery('Camera connection ended');
    }
  }, 1800);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && state.expectedCameraOn) {
      setTimeout(() => {
        const track = stream?.getVideoTracks?.()[0];
        if (!track || track.readyState !== 'live') scheduleRecovery('Camera resumed');
        else watchCurrentTrack();
      }, 350);
    }
  });

  function emergencyShutdown() {
    clearTimeout(state.zoomTimer);
    clearTimeout(state.recoveryTimer);
    state.expectedCameraOn = false;
    try {
      if (recorder && recorder.state !== 'inactive') recorder.stop();
    } catch {}
    try {
      stream?.getTracks?.().forEach(track => track.stop());
    } catch {}
  }

  window.addEventListener('pagehide', emergencyShutdown);
  window.addEventListener('freeze', emergencyShutdown);

  window.oskoStableCamera = {
    start: stableStart,
    capture: stableCapture,
    switchCamera: stableSwitch,
    record: stableRecord,
    flash: stableFlash,
    recover: () => recoverCamera('Manual recovery'),
    status: () => ({
      busy: state.busy,
      operation: state.busyName,
      cameraOn: Boolean(stream),
      trackState: stream?.getVideoTracks?.()[0]?.readyState || 'none',
      recording: recorder?.state || 'inactive',
      zoom: Number(zoom?.value || 1)
    })
  };

  announce('Camera stability protection ready');
})();