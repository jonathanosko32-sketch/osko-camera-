const preview = document.querySelector('#preview');
const canvas = document.querySelector('#canvas');
const emptyState = document.querySelector('#emptyState');
const statusEl = document.querySelector('#status');
const recordingBadge = document.querySelector('#recordingBadge');
const gallery = document.querySelector('#gallery');
const startBtn = document.querySelector('#startBtn');
const captureBtn = document.querySelector('#captureBtn');
const recordBtn = document.querySelector('#recordBtn');
const switchBtn = document.querySelector('#switchBtn');
const clearBtn = document.querySelector('#clearBtn');

let stream = null;
let facingMode = 'environment';
let recorder = null;
let recordedChunks = [];
let captures = [];

function setStatus(message) { statusEl.textContent = message; }
function cameraAvailable() { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia); }

async function stopCamera() {
  if (recorder?.state === 'recording') recorder.stop();
  stream?.getTracks().forEach(track => track.stop());
  stream = null;
  preview.srcObject = null;
  emptyState.hidden = false;
  captureBtn.disabled = true;
  recordBtn.disabled = true;
  switchBtn.disabled = true;
  startBtn.textContent = 'Start Camera';
  setStatus('Camera off');
}

async function startCamera() {
  if (!cameraAvailable()) {
    setStatus('Camera unsupported');
    alert('This browser does not provide camera access. Try Chrome or Safari over HTTPS.');
    return;
  }

  if (stream) {
    await stopCamera();
    return;
  }

  try {
    setStatus('Opening camera…');
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: facingMode }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: true
    });
    preview.srcObject = stream;
    await preview.play();
    emptyState.hidden = true;
    captureBtn.disabled = false;
    recordBtn.disabled = typeof MediaRecorder === 'undefined';
    switchBtn.disabled = false;
    startBtn.textContent = 'Stop Camera';
    setStatus('Camera ready');
  } catch (error) {
    console.error(error);
    stream = null;
    setStatus('Permission needed');
    alert('Camera access was blocked. Allow camera and microphone permission, then tap Start Camera again.');
  }
}

async function switchCamera() {
  if (!stream) return;
  stream.getTracks().forEach(track => track.stop());
  stream = null;
  facingMode = facingMode === 'environment' ? 'user' : 'environment';
  await startCamera();
}

function addCapture(blob, type, extension) {
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  captures.unshift({ url, type, filename: `osko-${type}-${stamp}.${extension}` });
  renderGallery();
}

function takePhoto() {
  if (!stream || !preview.videoWidth) return;
  canvas.width = preview.videoWidth;
  canvas.height = preview.videoHeight;
  const context = canvas.getContext('2d');
  context.drawImage(preview, 0, 0, canvas.width, canvas.height);
  canvas.toBlob(blob => {
    if (!blob) return;
    addCapture(blob, 'photo', 'jpg');
    setStatus('Photo captured');
  }, 'image/jpeg', 0.94);
}

function bestVideoMimeType() {
  const types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
  return types.find(type => MediaRecorder.isTypeSupported(type)) || '';
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
  recorder.ondataavailable = event => { if (event.data.size > 0) recordedChunks.push(event.data); };
  recorder.onstop = () => {
    const type = recorder.mimeType || 'video/webm';
    const extension = type.includes('mp4') ? 'mp4' : 'webm';
    addCapture(new Blob(recordedChunks, { type }), 'video', extension);
    recordingBadge.hidden = true;
    recordBtn.textContent = 'Record Video';
    recordBtn.classList.remove('danger');
    setStatus('Video saved');
  };
  recorder.start(1000);
  recordingBadge.hidden = false;
  recordBtn.textContent = 'Stop Recording';
  recordBtn.classList.add('danger');
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
recordBtn.addEventListener('click', toggleRecording);
switchBtn.addEventListener('click', switchCamera);
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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(console.error));
}

if (!cameraAvailable()) setStatus('Camera unsupported');
