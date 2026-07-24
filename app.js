const $ = selector => document.querySelector(selector);

const preview = $('#preview');
const canvas = $('#canvas');
const emptyState = $('#emptyState');
const statusEl = $('#status');
const recordingBadge = $('#recordingBadge');
const countdownEl = $('#countdown');
const gridOverlay = $('#gridOverlay');
const gallery = $('#gallery');

const startBtn = $('#startBtn');
const captureBtn = $('#captureBtn');
const recordBtn = $('#recordBtn');
const switchBtn = $('#switchBtn');
const quickCaptureBtn = $('#quickCaptureBtn');
const quickSwitchBtn = $('#quickSwitchBtn');
const quickRecordBtn = $('#quickRecordBtn');
const clearBtn = $('#clearBtn');
const zoomRange = $('#zoomRange');
const zoomValue = $('#zoomValue');
const brightnessRange = $('#brightnessRange');
const brightnessValue = $('#brightnessValue');
const nightToggle = $('#nightToggle');
const torchToggle = $('#torchToggle');
const gridToggle = $('#gridToggle');
const stampToggle = $('#stampToggle');
const locationToggle = $('#locationToggle');
const timerSelect = $('#timerSelect');

let stream = null;
let facingMode = 'environment';
let recorder = null;
let recordedChunks = [];
let captures = [];
let videoTrack = null;
let currentLocation = null;
let countdownRunning = false;

function setStatus(message) {
  statusEl.textContent = message;
}

function cameraAvailable() {
  return Boolean(navigator.mediaDevices?.getUserMedia);
}

function resetCountdown() {
  countdownRunning = false;
  countdownEl.hidden = true;
  countdownEl.textContent = '';
}

function setCameraButtons(enabled) {
  captureBtn.disabled = quickCaptureBtn.disabled = !enabled;
  switchBtn.disabled = quickSwitchBtn.disabled = !enabled;
  const canRecord = enabled && typeof MediaRecorder !== 'undefined';
  recordBtn.disabled = quickRecordBtn.disabled = !canRecord;
}

function getPreviewBrightness() {
  return Number(brightnessRange.value) / 100;
}

function updatePreviewLight() {
  const brightness = getPreviewBrightness();
  const contrast = nightToggle.checked ? 1.18 : 1.05;
  const saturation = nightToggle.checked ? 1.12 : 1.02;
  preview.style.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`;
  brightnessValue.textContent = `${brightnessRange.value}%`;
}

async function setTorch(enabled) {
  if (!videoTrack) return;
  try {
    await videoTrack.applyConstraints({ advanced: [{ torch: enabled }] });
    torchToggle.checked = enabled;
    setStatus(enabled ? 'Flashlight on' : 'Flashlight off');
  } catch (error) {
    console.warn('Torch unavailable', error);
    torchToggle.checked = false;
    torchToggle.disabled = true;
    setStatus('Flashlight unavailable');
  }
}

async function stopCamera() {
  resetCountdown();
  if (recorder?.state === 'recording') recorder.stop();
  if (torchToggle.checked) await setTorch(false);
  stream?.getTracks().forEach(track => track.stop());
  stream = null;
  videoTrack = null;
  preview.srcObject = null;
  emptyState.hidden = false;
  setCameraButtons(false);
  zoomRange.disabled = true;
  torchToggle.disabled = true;
  torchToggle.checked = false;
  startBtn.textContent = 'Start Camera';
  setStatus('Camera off');
}

function setupCameraCapabilities() {
  videoTrack = stream?.getVideoTracks()[0] || null;
  const capabilities = videoTrack?.getCapabilities?.() || {};

  if (capabilities.zoom) {
    zoomRange.min = capabilities.zoom.min;
    zoomRange.max = capabilities.zoom.max;
    zoomRange.step = capabilities.zoom.step || 0.1;
    zoomRange.value = videoTrack.getSettings().zoom || capabilities.zoom.min;
    zoomValue.textContent = `${Number(zoomRange.value).toFixed(1)}×`;
    zoomRange.disabled = false;
  } else {
    zoomRange.min = zoomRange.max = zoomRange.value = 1;
    zoomValue.textContent = '1.0×';
    zoomRange.disabled = true;
  }

  torchToggle.disabled = !capabilities.torch;
  torchToggle.checked = false;
}

async function startCamera() {
  if (!cameraAvailable()) {
    setStatus('Camera unsupported');
    alert('Try Chrome or Safari over HTTPS.');
    return;
  }

  if (stream) {
    await stopCamera();
    return;
  }

  try {
    resetCountdown();
    setStatus('Opening camera…');
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 3840 },
        height: { ideal: 2160 }
      },
      audio: true
    });
    preview.srcObject = stream;
    await preview.play();
    emptyState.hidden = true;
    setCameraButtons(true);
    startBtn.textContent = 'Stop Camera';
    setupCameraCapabilities();
    updatePreviewLight();
    setStatus('Camera ready');
    document.querySelector('.camera-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    console.error(error);
    stream = null;
    setCameraButtons(false);
    resetCountdown();
    setStatus('Permission needed');
    alert('Allow camera and microphone permission, then tap Start Camera again.');
  }
}

async function switchCamera() {
  if (!stream) return;
  resetCountdown();
  stream.getTracks().forEach(track => track.stop());
  stream = null;
  facingMode = facingMode === 'environment' ? 'user' : 'environment';
  await startCamera();
}

async function getLocation() {
  if (!locationToggle.checked) return null;
  if (currentLocation) return currentLocation;
  setStatus('Getting location…');

  return new Promise(resolve => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      position => {
        currentLocation = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };
        resolve(currentLocation);
      },
      () => {
        setStatus('Location unavailable');
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  });
}

function addCapture(blob, type, extension) {
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  captures.unshift({ url, type, filename: `osko-${type}-${stamp}.${extension}` });
  renderGallery();
}

function drawStamp(context, width, height, location) {
  const lines = [];
  if (stampToggle.checked) lines.push(new Date().toLocaleString());
  if (location) lines.push(`${location.lat.toFixed(6)}, ${location.lon.toFixed(6)}`);
  if (!lines.length) return;

  const size = Math.max(24, Math.round(width / 45));
  const padding = Math.round(size * 0.65);
  const lineHeight = Math.round(size * 1.25);
  const boxHeight = lines.length * lineHeight + padding * 2;
  context.font = `600 ${size}px system-ui`;
  context.textBaseline = 'top';
  context.fillStyle = 'rgba(0,0,0,.62)';
  context.fillRect(0, height - boxHeight, width, boxHeight);
  context.fillStyle = '#fff';
  lines.forEach((line, index) => context.fillText(line, padding, height - boxHeight + padding + index * lineHeight));
}

async function captureNow() {
  if (!stream || !preview.videoWidth) return;
  const location = await getLocation();
  canvas.width = preview.videoWidth;
  canvas.height = preview.videoHeight;
  const context = canvas.getContext('2d');

  const brightness = getPreviewBrightness();
  const contrast = nightToggle.checked ? 1.18 : 1.05;
  const saturation = nightToggle.checked ? 1.12 : 1.02;
  context.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`;
  context.drawImage(preview, 0, 0, canvas.width, canvas.height);
  context.filter = 'none';
  drawStamp(context, canvas.width, canvas.height, location);

  canvas.toBlob(blob => {
    if (!blob) return;
    addCapture(blob, 'photo', 'jpg');
    setStatus('Photo captured');
  }, 'image/jpeg', 0.96);
}

async function takePhoto() {
  if (countdownRunning || !stream) return;
  countdownRunning = true;
  captureBtn.disabled = quickCaptureBtn.disabled = true;

  try {
    const seconds = Number(timerSelect.value);
    for (let remaining = seconds; remaining > 0; remaining -= 1) {
      if (!stream) return;
      countdownEl.hidden = false;
      countdownEl.textContent = remaining;
      setStatus(`Photo in ${remaining}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    resetCountdown();
    await captureNow();
  } finally {
    resetCountdown();
    if (stream) captureBtn.disabled = quickCaptureBtn.disabled = false;
  }
}

function bestVideoMimeType() {
  return ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']
    .find(type => MediaRecorder.isTypeSupported(type)) || '';
}

function setRecordingUi(active) {
  recordingBadge.hidden = !active;
  recordBtn.textContent = active ? 'Stop Recording' : 'Record Video';
  recordBtn.classList.toggle('danger', active);
  quickRecordBtn.classList.toggle('danger', active);
  quickRecordBtn.textContent = active ? '■' : '●';
  quickRecordBtn.setAttribute('aria-label', active ? 'Stop recording' : 'Record video');
}

function toggleRecording() {
  if (!stream || typeof MediaRecorder === 'undefined') return;
  if (recorder?.state === 'recording') {
    recorder.stop();
    return;
  }

  recordedChunks = [];
  const mimeType = bestVideoMimeType();
  recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  recorder.ondataavailable = event => {
    if (event.data.size) recordedChunks.push(event.data);
  };
  recorder.onstop = () => {
    const type = recorder.mimeType || 'video/webm';
    const extension = type.includes('mp4') ? 'mp4' : 'webm';
    addCapture(new Blob(recordedChunks, { type }), 'video', extension);
    setRecordingUi(false);
    setStatus('Video saved');
  };
  recorder.start(1000);
  setRecordingUi(true);
  setStatus('Recording');
}

function removeCapture(index) {
  URL.revokeObjectURL(captures[index].url);
  captures.splice(index, 1);
  renderGallery();
}

function renderGallery() {
  gallery.innerHTML = '';
  if (!captures.length) {
    gallery.innerHTML = '<p class="gallery-empty">Photos and videos will appear here.</p>';
    return;
  }

  captures.forEach((capture, index) => {
    const card = document.createElement('article');
    card.className = 'capture-item';
    const media = capture.type === 'photo'
      ? `<img src="${capture.url}" alt="OSKO camera capture">`
      : `<video src="${capture.url}" controls playsinline></video>`;
    card.innerHTML = `${media}<div class="capture-actions"><a href="${capture.url}" download="${capture.filename}">Save</a><button type="button" data-remove="${index}">Delete</button></div>`;
    gallery.appendChild(card);
  });
}

startBtn.addEventListener('click', startCamera);
captureBtn.addEventListener('click', takePhoto);
quickCaptureBtn.addEventListener('click', takePhoto);
recordBtn.addEventListener('click', toggleRecording);
quickRecordBtn.addEventListener('click', toggleRecording);
switchBtn.addEventListener('click', switchCamera);
quickSwitchBtn.addEventListener('click', switchCamera);

brightnessRange.addEventListener('input', updatePreviewLight);
nightToggle.addEventListener('change', () => {
  if (nightToggle.checked && Number(brightnessRange.value) < 165) brightnessRange.value = 165;
  updatePreviewLight();
  setStatus(nightToggle.checked ? 'Night boost on' : 'Night boost off');
});
torchToggle.addEventListener('change', () => setTorch(torchToggle.checked));
gridToggle.addEventListener('change', () => { gridOverlay.hidden = !gridToggle.checked; });
zoomRange.addEventListener('input', async () => {
  zoomValue.textContent = `${Number(zoomRange.value).toFixed(1)}×`;
  try {
    await videoTrack?.applyConstraints({ advanced: [{ zoom: Number(zoomRange.value) }] });
  } catch (error) {
    console.warn(error);
  }
});
locationToggle.addEventListener('change', () => {
  if (!locationToggle.checked) currentLocation = null;
});
clearBtn.addEventListener('click', () => {
  captures.forEach(capture => URL.revokeObjectURL(capture.url));
  captures = [];
  renderGallery();
});
gallery.addEventListener('click', event => {
  const button = event.target.closest('[data-remove]');
  if (button) removeCapture(Number(button.dataset.remove));
});
window.addEventListener('beforeunload', () => stream?.getTracks().forEach(track => track.stop()));

updatePreviewLight();
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(console.error));
}
if (!cameraAvailable()) setStatus('Camera unsupported');
