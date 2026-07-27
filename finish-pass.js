(() => {
  'use strict';

  const stable = window.oskoStableCamera;
  if (!stable) {
    console.warn('OSKO finish pass waiting for stability layer');
    return;
  }

  let wakeLock = null;
  let pauseButton = null;
  let lastRecorder = null;
  let cleanupRunning = false;

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const byId = id => document.getElementById(id);

  function status(message) {
    try { setStatus(message); } catch {}
    const voice = byId('voiceStatus');
    if (voice) voice.textContent = message;
  }

  async function requestWakeLock() {
    if (!('wakeLock' in navigator) || document.hidden || wakeLock) return;
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } catch (error) {
      console.debug('OSKO screen wake lock unavailable', error);
    }
  }

  async function releaseWakeLock() {
    if (!wakeLock) return;
    try { await wakeLock.release(); } catch {}
    wakeLock = null;
  }

  function recorderState() {
    try { return recorder?.state || 'inactive'; } catch { return 'inactive'; }
  }

  function updatePauseButton() {
    if (!pauseButton) return;
    const state = recorderState();
    const active = state === 'recording' || state === 'paused';
    pauseButton.hidden = !active;
    pauseButton.disabled = !active;
    pauseButton.textContent = state === 'paused' ? 'Resume Video' : 'Pause Video';
    pauseButton.setAttribute('aria-pressed', state === 'paused' ? 'true' : 'false');
  }

  function attachRecorderEvents() {
    if (!recorder || recorder === lastRecorder) return;
    lastRecorder = recorder;
    recorder.addEventListener('start', async () => {
      await requestWakeLock();
      updatePauseButton();
      status('Recording started');
    });
    recorder.addEventListener('pause', () => {
      updatePauseButton();
      status('Recording paused');
    });
    recorder.addEventListener('resume', () => {
      updatePauseButton();
      status('Recording resumed');
    });
    recorder.addEventListener('stop', () => {
      updatePauseButton();
      status('Video saved');
    });
    recorder.addEventListener('error', event => {
      console.error('OSKO video recorder error', event.error || event);
      updatePauseButton();
      status('Video stopped safely after an error');
    });
  }

  async function togglePause() {
    attachRecorderEvents();
    const state = recorderState();
    try {
      if (state === 'recording') recorder.pause();
      else if (state === 'paused') recorder.resume();
    } catch (error) {
      console.error('OSKO pause/resume failed', error);
      status('Pause is not supported by this phone');
    }
    updatePauseButton();
  }

  function installPauseButton() {
    if (byId('pauseVideoBtn')) {
      pauseButton = byId('pauseVideoBtn');
      return;
    }
    const recordButton = byId('recordBtn');
    const parent = recordButton?.parentElement;
    if (!parent) return;
    pauseButton = document.createElement('button');
    pauseButton.id = 'pauseVideoBtn';
    pauseButton.type = 'button';
    pauseButton.hidden = true;
    pauseButton.textContent = 'Pause Video';
    pauseButton.setAttribute('aria-label', 'Pause or resume video recording');
    pauseButton.addEventListener('click', event => {
      event.preventDefault();
      togglePause();
    });
    parent.insertBefore(pauseButton, recordButton.nextSibling);
  }

  function routeGlobalCommandsThroughStableLayer() {
    try { startCamera = stable.start; } catch {}
    try { takePhoto = stable.capture; } catch {}
    try { switchCamera = stable.switchCamera; } catch {}
    try {
      toggleRecording = async () => {
        await stable.record();
        await wait(120);
        attachRecorderEvents();
        updatePauseButton();
        if (stream) await requestWakeLock();
      };
    } catch {}
    try {
      setRearFlash = async value => {
        const current = Boolean(typeof torchOn !== 'undefined' && torchOn);
        if (Boolean(value) === current) return true;
        return stable.flash();
      };
    } catch {}
  }

  function installVoiceExtensions() {
    const previous = window.oskoRunVoiceCommand;
    if (typeof previous !== 'function') return;
    window.oskoRunVoiceCommand = async spoken => {
      const command = String(spoken || '').toLowerCase();
      if (/pause (the )?(video|recording)/.test(command)) {
        await togglePause();
        return;
      }
      if (/resume (the )?(video|recording)/.test(command)) {
        await togglePause();
        return;
      }
      if (/recover|reconnect/.test(command) && /camera/.test(command)) {
        await stable.recover();
        return;
      }
      return previous(spoken);
    };
  }

  function trimCaptureMemory() {
    if (cleanupRunning || typeof captures === 'undefined' || !Array.isArray(captures)) return;
    if (captures.length <= 40) return;
    cleanupRunning = true;
    try {
      const removed = captures.splice(40);
      removed.forEach(item => {
        try { if (item?.url) URL.revokeObjectURL(item.url); } catch {}
      });
      try { renderGallery(); } catch {}
      status('Older temporary previews cleared to keep the camera fast');
    } finally {
      cleanupRunning = false;
    }
  }

  function watchRuntime() {
    setInterval(() => {
      attachRecorderEvents();
      updatePauseButton();
      trimCaptureMemory();
      if (stream && !document.hidden) requestWakeLock();
      if (!stream) releaseWakeLock();
    }, 1200);
  }

  document.addEventListener('visibilitychange', async () => {
    if (document.hidden) {
      await releaseWakeLock();
    } else if (stream) {
      await requestWakeLock();
      const state = stable.status();
      if (state.trackState !== 'live') await stable.recover();
    }
  });

  window.addEventListener('pagehide', releaseWakeLock);
  window.addEventListener('beforeunload', releaseWakeLock);

  installPauseButton();
  routeGlobalCommandsThroughStableLayer();
  installVoiceExtensions();
  watchRuntime();
  if (stream) requestWakeLock();
  status('OSKO camera finish controls ready');
})();