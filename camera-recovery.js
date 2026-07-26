(() => {
  'use strict';

  const preview = document.getElementById('preview');
  const status = document.getElementById('status');
  const errorBox = document.getElementById('errorBox');
  if (!preview) return;

  let recovering = false;
  let lastGoodFrame = 0;
  let recoveryCount = 0;

  function statusText(message) {
    if (status) status.textContent = message;
  }

  function visibleError(message = '') {
    if (!errorBox) return;
    errorBox.hidden = !message;
    errorBox.textContent = message;
  }

  function hasLiveTrack() {
    return typeof videoTrack !== 'undefined' && videoTrack && videoTrack.readyState === 'live';
  }

  function frameLooksAlive() {
    return hasLiveTrack() && preview.readyState >= 2 && preview.videoWidth > 0 && preview.videoHeight > 0 && !preview.paused && !preview.ended;
  }

  async function recoverCamera(reason) {
    if (recovering || typeof stream === 'undefined' || !stream) return;
    recovering = true;
    recoveryCount += 1;
    statusText(`Restoring camera… ${reason}`);
    visibleError('The camera feed paused. OSKO is restoring it automatically.');

    try {
      if (typeof torchOn !== 'undefined' && torchOn && typeof tryTorch === 'function') {
        try { await tryTorch(false); } catch {}
      }

      try { stream.getTracks().forEach(track => track.stop()); } catch {}
      stream = null;
      videoTrack = null;
      preview.srcObject = null;
      await new Promise(resolve => setTimeout(resolve, 350));

      if (typeof startCamera === 'function') await startCamera();
      await new Promise(resolve => setTimeout(resolve, 700));

      if (frameLooksAlive()) {
        lastGoodFrame = Date.now();
        visibleError('');
        statusText('Camera restored');
      } else {
        throw new Error('Feed did not resume');
      }
    } catch (error) {
      console.error('OSKO camera recovery failed', error);
      visibleError('Camera recovery did not finish. Tap Start Camera once. If it stays black, close and reopen OSKO Camera.');
      statusText('Camera needs restart');
    } finally {
      recovering = false;
    }
  }

  preview.addEventListener('playing', () => {
    lastGoodFrame = Date.now();
    recoveryCount = 0;
    visibleError('');
  });
  preview.addEventListener('timeupdate', () => { lastGoodFrame = Date.now(); });
  preview.addEventListener('waiting', () => setTimeout(() => {
    if (!frameLooksAlive()) recoverCamera('feed waiting');
  }, 1200));
  preview.addEventListener('stalled', () => recoverCamera('feed stalled'));
  preview.addEventListener('error', () => recoverCamera('video error'));

  document.addEventListener('visibilitychange', async () => {
    if (document.hidden) return;
    await new Promise(resolve => setTimeout(resolve, 250));
    if (typeof stream !== 'undefined' && stream && !frameLooksAlive()) recoverCamera('returning to app');
  });

  setInterval(() => {
    if (typeof stream === 'undefined' || !stream || recovering) return;
    if (frameLooksAlive()) {
      lastGoodFrame = Date.now();
      return;
    }
    const silentFor = Date.now() - lastGoodFrame;
    if (silentFor > 2200 && recoveryCount < 3) recoverCamera('black screen detected');
  }, 900);

  window.oskoRecoverCamera = () => recoverCamera('manual recovery');
})();
