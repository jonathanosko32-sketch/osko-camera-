(() => {
  const panel = document.querySelector('#codeScannerPanel');
  const frame = document.querySelector('#codeFrame');
  const codeStatus = document.querySelector('#codeStatus');
  const codeHelp = document.querySelector('#codeHelp');
  const resultBox = document.querySelector('#codeResult');
  const formatEl = document.querySelector('#codeFormat');
  const valueEl = document.querySelector('#codeValue');
  const copyBtn = document.querySelector('#copyCodeBtn');
  const openBtn = document.querySelector('#openCodeBtn');
  const proofBtn = document.querySelector('#saveCodeProofBtn');
  const clearBtn = document.querySelector('#clearCodesBtn');
  const historyEl = document.querySelector('#codeHistory');

  let detector = null;
  let scanTimer = null;
  let current = null;
  let history = [];
  let detecting = false;
  let lastValue = '';
  let lastAt = 0;

  const preferredFormats = [
    'qr_code', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39',
    'code_93', 'codabar', 'itf', 'data_matrix', 'aztec', 'pdf417'
  ];

  function friendlyFormat(format = '') {
    const names = {
      qr_code: 'QR CODE', ean_13: 'EAN-13', ean_8: 'EAN-8', upc_a: 'UPC-A',
      upc_e: 'UPC-E', code_128: 'CODE 128', code_39: 'CODE 39', code_93: 'CODE 93',
      codabar: 'CODABAR', itf: 'ITF', data_matrix: 'DATA MATRIX', aztec: 'AZTEC', pdf417: 'PDF417'
    };
    return names[format] || String(format || 'CODE').replaceAll('_', ' ').toUpperCase();
  }

  async function setupDetector() {
    if (!('BarcodeDetector' in window)) return false;
    try {
      const supported = typeof BarcodeDetector.getSupportedFormats === 'function'
        ? await BarcodeDetector.getSupportedFormats()
        : preferredFormats;
      const formats = preferredFormats.filter(format => supported.includes(format));
      detector = new BarcodeDetector(formats.length ? { formats } : undefined);
      codeHelp.textContent = `Ready for ${formats.length || 'common'} QR and barcode formats. Hold the code flat, fill the box, and pause briefly.`;
      return true;
    } catch (error) {
      console.warn('Barcode detector setup failed', error);
      detector = null;
      return false;
    }
  }

  function inCodeMode() {
    return modeSelect?.value === 'codes';
  }

  function updateModeUi() {
    const active = inCodeMode();
    panel.hidden = !active;
    frame.hidden = !active;
    if (!active) {
      stopScanning();
      return;
    }
    codeStatus.textContent = stream ? 'Looking for a code…' : 'Start the camera';
    startScanning();
  }

  function renderResult(item) {
    current = item;
    resultBox.hidden = false;
    formatEl.textContent = friendlyFormat(item.format);
    valueEl.textContent = item.rawValue;
    codeStatus.textContent = 'Code found';
  }

  function renderHistory() {
    historyEl.innerHTML = '';
    history.forEach((item, index) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'code-history-item';
      card.innerHTML = `<span>${friendlyFormat(item.format)}</span><strong>${escapeHtml(item.rawValue)}</strong><small>${new Date(item.time).toLocaleTimeString()}</small>`;
      card.addEventListener('click', () => renderResult(item));
      historyEl.appendChild(card);
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function acceptDetection(code) {
    const rawValue = String(code.rawValue || '').trim();
    if (!rawValue) return;
    const now = Date.now();
    if (rawValue === lastValue && now - lastAt < 2500) return;
    lastValue = rawValue;
    lastAt = now;

    const item = { rawValue, format: code.format || 'unknown', time: now };
    history = [item, ...history.filter(existing => existing.rawValue !== rawValue)].slice(0, 25);
    renderResult(item);
    renderHistory();
    navigator.vibrate?.([80, 40, 80]);
  }

  async function detectOnce() {
    if (detecting || !detector || !inCodeMode() || !stream || preview.readyState < 2) return;
    detecting = true;
    try {
      const codes = await detector.detect(preview);
      if (codes.length) acceptDetection(codes[0]);
      else if (!current) codeStatus.textContent = 'Looking for a code…';
    } catch (error) {
      console.warn('Code scan failed', error);
    } finally {
      detecting = false;
    }
  }

  async function startScanning() {
    if (!inCodeMode()) return;
    if (!detector) {
      const ready = await setupDetector();
      if (!ready) {
        codeStatus.textContent = 'Browser scanner unavailable';
        codeHelp.textContent = 'This Chrome version does not expose direct barcode scanning. Take a clear photo, then use Google / Share to open it in Google Lens.';
        return;
      }
    }
    if (scanTimer) return;
    scanTimer = window.setInterval(detectOnce, 260);
  }

  function stopScanning() {
    if (scanTimer) window.clearInterval(scanTimer);
    scanTimer = null;
    detecting = false;
  }

  async function copyCurrent() {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(current.rawValue);
      codeStatus.textContent = 'Copied';
    } catch {
      const input = document.createElement('textarea');
      input.value = current.rawValue;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
      codeStatus.textContent = 'Copied';
    }
  }

  function openCurrent() {
    if (!current) return;
    const value = current.rawValue;
    const looksLikeUrl = /^https?:\/\//i.test(value);
    const target = looksLikeUrl
      ? value
      : `https://www.google.com/search?q=${encodeURIComponent(value)}`;
    window.open(target, '_blank', 'noopener,noreferrer');
  }

  function drawWrappedText(context, text, x, y, maxWidth, lineHeight) {
    const words = String(text).split(/\s+/);
    let line = '';
    for (const word of words) {
      const test = `${line}${word} `;
      if (context.measureText(test).width > maxWidth && line) {
        context.fillText(line.trim(), x, y);
        line = `${word} `;
        y += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) context.fillText(line.trim(), x, y);
  }

  async function saveProof() {
    if (!current || !stream || !preview.videoWidth) return;
    const proof = document.createElement('canvas');
    proof.width = preview.videoWidth;
    proof.height = preview.videoHeight;
    const context = proof.getContext('2d');
    context.filter = typeof filterString === 'function' ? filterString() : 'none';
    context.drawImage(preview, 0, 0, proof.width, proof.height);
    context.filter = 'none';

    const fontSize = Math.max(28, Math.round(proof.width / 38));
    const padding = Math.round(fontSize * 0.7);
    const boxHeight = Math.round(fontSize * 4.3);
    context.fillStyle = 'rgba(0,0,0,.76)';
    context.fillRect(0, proof.height - boxHeight, proof.width, boxHeight);
    context.fillStyle = '#fff';
    context.font = `800 ${fontSize}px system-ui`;
    context.fillText(friendlyFormat(current.format), padding, proof.height - boxHeight + padding);
    context.font = `600 ${Math.round(fontSize * .82)}px system-ui`;
    drawWrappedText(context, current.rawValue, padding, proof.height - boxHeight + padding + fontSize * 1.25, proof.width - padding * 2, fontSize * 1.05);

    proof.toBlob(blob => {
      if (!blob) return;
      if (typeof addCapture === 'function') addCapture(blob, 'photo', 'jpg', 'codes');
      codeStatus.textContent = 'Proof photo saved';
    }, 'image/jpeg', .96);
  }

  function clearCodes() {
    history = [];
    current = null;
    lastValue = '';
    resultBox.hidden = true;
    historyEl.innerHTML = '';
    codeStatus.textContent = stream ? 'Looking for a code…' : 'Ready to scan';
  }

  modeSelect?.addEventListener('change', updateModeUi);
  startBtn?.addEventListener('click', () => setTimeout(updateModeUi, 700));
  dockStart?.addEventListener('click', () => setTimeout(updateModeUi, 700));
  switchBtn?.addEventListener('click', () => setTimeout(updateModeUi, 700));
  dockSwitch?.addEventListener('click', () => setTimeout(updateModeUi, 700));
  copyBtn?.addEventListener('click', copyCurrent);
  openBtn?.addEventListener('click', openCurrent);
  proofBtn?.addEventListener('click', saveProof);
  clearBtn?.addEventListener('click', clearCodes);
  document.addEventListener('visibilitychange', () => document.hidden ? stopScanning() : startScanning());
  window.addEventListener('beforeunload', stopScanning);

  updateModeUi();
})();