(() => {
  const panel = document.querySelector('#codeScannerPanel');
  const frame = document.querySelector('#codeFrame');
  const codeStatus = document.querySelector('#codeStatus');
  const codeHelp = document.querySelector('#codeHelp');
  const attemptStatus = document.querySelector('#codeAttemptStatus');
  const resultBox = document.querySelector('#codeResult');
  const formatEl = document.querySelector('#codeFormat');
  const valueEl = document.querySelector('#codeValue');
  const actionTypeEl = document.querySelector('#codeActionType');
  const domainEl = document.querySelector('#codeDomain');
  const copyBtn = document.querySelector('#copyCodeBtn');
  const openBtn = document.querySelector('#openCodeBtn');
  const productBtn = document.querySelector('#productLookupBtn');
  const proofBtn = document.querySelector('#saveCodeProofBtn');
  const retryBtn = document.querySelector('#retryCodeBtn');
  const imageInput = document.querySelector('#codeImageInput');
  const lowMemoryToggle = document.querySelector('#lowMemoryScanToggle');
  const clearBtn = document.querySelector('#clearCodesBtn');
  const historyEl = document.querySelector('#codeHistory');

  let detector = null;
  let scanTimer = null;
  let current = null;
  let history = loadHistory();
  let detecting = false;
  let lastValue = '';
  let lastAt = 0;
  let livePass = 0;
  let lastImportedBitmap = null;

  const preferredFormats = [
    'qr_code', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39',
    'code_93', 'codabar', 'itf', 'data_matrix', 'aztec', 'pdf417'
  ];

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function loadHistory() {
    try { return JSON.parse(localStorage.getItem('osko-code-history') || '[]'); }
    catch { return []; }
  }

  function saveHistory() {
    try { localStorage.setItem('osko-code-history', JSON.stringify(history.slice(0, 25))); }
    catch {}
  }

  function friendlyFormat(format = '') {
    const names = {
      qr_code: 'QR CODE', ean_13: 'EAN-13', ean_8: 'EAN-8', upc_a: 'UPC-A',
      upc_e: 'UPC-E', code_128: 'CODE 128', code_39: 'CODE 39', code_93: 'CODE 93',
      codabar: 'CODABAR', itf: 'ITF', data_matrix: 'DATA MATRIX', aztec: 'AZTEC', pdf417: 'PDF417'
    };
    return names[format] || String(format || 'CODE').replaceAll('_', ' ').toUpperCase();
  }

  function normalizeUrl(value) {
    const trimmed = String(value || '').trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
    return null;
  }

  function classifyValue(value, format = '') {
    const text = String(value || '').trim();
    const url = normalizeUrl(text);
    if (url) {
      let domain = '';
      try { domain = new URL(url).hostname.replace(/^www\./, ''); } catch {}
      const playStore = /play\.google\.com|market:\/\//i.test(text);
      const form = /docs\.google\.com\/forms|forms\.gle|form|check-?in|register|lumper|payment|pay/i.test(text);
      return { kind: playStore ? 'app' : form ? 'form' : 'website', label: playStore ? 'App / Play Store link' : form ? 'Form or check-in page' : 'Website link', domain, target: url };
    }
    if (/^mailto:/i.test(text) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
      const email = text.replace(/^mailto:/i, '');
      return { kind: 'email', label: 'Email address', domain: email.split('@')[1] || '', target: `mailto:${email}` };
    }
    if (/^tel:/i.test(text) || /^\+?[\d\s().-]{7,}$/.test(text)) {
      const phone = text.replace(/^tel:/i, '').replace(/[^\d+]/g, '');
      if (phone.length >= 7 && phone.length <= 16) return { kind: 'phone', label: 'Phone number', domain: '', target: `tel:${phone}` };
    }
    const numeric = text.replace(/\s/g, '');
    const productFormat = ['ean_13', 'ean_8', 'upc_a', 'upc_e'].includes(format);
    if (productFormat || /^\d{8,14}$/.test(numeric)) return { kind: 'product', label: 'Product barcode', domain: 'Search stores for current price', target: null };
    return { kind: 'text', label: 'Text or reference number', domain: '', target: null };
  }

  async function setupDetector() {
    if (!('BarcodeDetector' in window)) return false;
    try {
      const supported = typeof BarcodeDetector.getSupportedFormats === 'function'
        ? await BarcodeDetector.getSupportedFormats()
        : preferredFormats;
      const formats = preferredFormats.filter(format => supported.includes(format));
      detector = new BarcodeDetector(formats.length ? { formats } : undefined);
      codeHelp.textContent = `Ready for ${formats.length || 'common'} public QR and barcode formats. Use live camera or a saved picture.`;
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
    codeStatus.textContent = stream ? 'Looking for any public code…' : 'Start camera or scan saved picture';
    startScanning();
  }

  function renderResult(item) {
    current = item;
    resultBox.hidden = false;
    formatEl.textContent = friendlyFormat(item.format);
    valueEl.textContent = item.rawValue;
    const info = classifyValue(item.rawValue, item.format);
    actionTypeEl.textContent = info.label;
    domainEl.textContent = info.domain;
    openBtn.textContent = info.kind === 'product' ? 'Search' : info.kind === 'phone' ? 'Call' : info.kind === 'email' ? 'Email' : 'Open';
    productBtn.hidden = info.kind !== 'product';
    codeStatus.textContent = 'Code found';
  }

  function renderHistory() {
    historyEl.innerHTML = '';
    history.forEach(item => {
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

  function acceptDetection(code, source = 'live') {
    const rawValue = String(code.rawValue || '').trim();
    if (!rawValue) return false;
    const now = Date.now();
    if (rawValue === lastValue && now - lastAt < 2500) return true;
    lastValue = rawValue;
    lastAt = now;
    const item = { rawValue, format: code.format || 'unknown', time: now, source };
    history = [item, ...history.filter(existing => existing.rawValue !== rawValue)].slice(0, 25);
    saveHistory();
    renderResult(item);
    renderHistory();
    attemptStatus.textContent = source === 'picture' ? 'Read from saved picture.' : 'Read from live camera.';
    navigator.vibrate?.([80, 40, 80]);
    return true;
  }

  function buildCanvas(source, rotation = 0, enhanced = false, cropCenter = false) {
    const sourceWidth = source.videoWidth || source.width;
    const sourceHeight = source.videoHeight || source.height;
    const maxSide = lowMemoryToggle?.checked ? 1200 : 2000;
    let sx = 0, sy = 0, sw = sourceWidth, sh = sourceHeight;
    if (cropCenter) {
      sx = sourceWidth * 0.08;
      sy = sourceHeight * 0.16;
      sw = sourceWidth * 0.84;
      sh = sourceHeight * 0.64;
    }
    const scale = Math.min(1, maxSide / Math.max(sw, sh));
    const baseW = Math.max(1, Math.round(sw * scale));
    const baseH = Math.max(1, Math.round(sh * scale));
    const swap = Math.abs(rotation) % 180 === 90;
    const canvas = document.createElement('canvas');
    canvas.width = swap ? baseH : baseW;
    canvas.height = swap ? baseW : baseH;
    const ctx = canvas.getContext('2d', { willReadFrequently: enhanced });
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rotation * Math.PI / 180);
    if (enhanced) ctx.filter = 'grayscale(1) contrast(2.1) brightness(1.18)';
    ctx.drawImage(source, sx, sy, sw, sh, -baseW / 2, -baseH / 2, baseW, baseH);
    ctx.restore();
    if (enhanced) {
      const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = image.data;
      for (let i = 0; i < data.length; i += 4) {
        const value = data[i] > 150 ? 255 : data[i] < 80 ? 0 : data[i];
        data[i] = data[i + 1] = data[i + 2] = value;
      }
      ctx.putImageData(image, 0, 0);
    }
    return canvas;
  }

  async function detectSource(source, sourceName = 'picture', thorough = false) {
    if (!detector) return false;
    const passes = thorough
      ? [
          { rotation: 0, enhanced: false, crop: false, name: 'original' },
          { rotation: 0, enhanced: true, crop: false, name: 'high contrast' },
          { rotation: 0, enhanced: false, crop: true, name: 'center crop' },
          { rotation: 90, enhanced: false, crop: false, name: 'rotated right' },
          { rotation: 270, enhanced: false, crop: false, name: 'rotated left' },
          { rotation: 180, enhanced: true, crop: false, name: 'rotated high contrast' }
        ]
      : [
          { rotation: 0, enhanced: false, crop: false, name: 'original' },
          { rotation: 0, enhanced: true, crop: true, name: 'enhanced center' }
        ];
    for (let index = 0; index < passes.length; index++) {
      const pass = passes[index];
      attemptStatus.textContent = `Trying ${pass.name} (${index + 1} of ${passes.length})…`;
      await sleep(20);
      try {
        const target = pass.rotation || pass.enhanced || pass.crop ? buildCanvas(source, pass.rotation, pass.enhanced, pass.crop) : source;
        const codes = await detector.detect(target);
        if (codes.length) return acceptDetection(codes[0], sourceName);
      } catch (error) {
        console.warn(`Universal scan pass failed: ${pass.name}`, error);
      }
    }
    attemptStatus.textContent = 'No code read yet. Move closer, avoid glare, or use Try harder.';
    return false;
  }

  async function detectOnce() {
    if (detecting || !detector || !inCodeMode() || !stream || preview.readyState < 2) return;
    detecting = true;
    try {
      livePass += 1;
      const useEnhanced = livePass % (lowMemoryToggle?.checked ? 6 : 3) === 0;
      const target = useEnhanced ? buildCanvas(preview, 0, true, true) : preview;
      const codes = await detector.detect(target);
      if (codes.length) acceptDetection(codes[0], 'live');
      else if (!current) codeStatus.textContent = useEnhanced ? 'Trying enhanced live view…' : 'Looking for any public code…';
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
        codeHelp.textContent = 'This Chrome version does not expose direct barcode scanning. The Android-app version will use its own scanner engine.';
        return;
      }
    }
    if (scanTimer) return;
    const interval = lowMemoryToggle?.checked ? 500 : 260;
    scanTimer = window.setInterval(detectOnce, interval);
  }

  function restartScanning() {
    stopScanning();
    startScanning();
  }

  function stopScanning() {
    if (scanTimer) window.clearInterval(scanTimer);
    scanTimer = null;
    detecting = false;
  }

  async function scanImportedFile(file, thorough = true) {
    if (!file) return;
    if (!detector && !await setupDetector()) {
      codeStatus.textContent = 'Scanner unavailable in this browser';
      return;
    }
    try {
      codeStatus.textContent = 'Reading saved picture…';
      if (lastImportedBitmap?.close) lastImportedBitmap.close();
      lastImportedBitmap = await createImageBitmap(file);
      const found = await detectSource(lastImportedBitmap, 'picture', thorough);
      if (!found) codeStatus.textContent = 'No code found in picture';
    } catch (error) {
      console.error(error);
      codeStatus.textContent = 'Could not read that picture';
      attemptStatus.textContent = 'Try a clearer photo with the whole code visible.';
    }
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
    const info = classifyValue(current.rawValue, current.format);
    let target = info.target;
    if (info.kind === 'product') target = `https://www.google.com/search?q=${encodeURIComponent(`${current.rawValue} product price`)}`;
    if (!target) target = `https://www.google.com/search?q=${encodeURIComponent(current.rawValue)}`;
    window.open(target, '_blank', 'noopener,noreferrer');
  }

  function productLookup() {
    if (!current) return;
    const code = encodeURIComponent(current.rawValue);
    window.open(`https://www.walmart.com/search?q=${code}`, '_blank', 'noopener,noreferrer');
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
    if (!current) return;
    let source = null;
    if (stream && preview.videoWidth) source = preview;
    else if (lastImportedBitmap) source = lastImportedBitmap;
    if (!source) {
      codeStatus.textContent = 'Use camera or saved picture first';
      return;
    }
    const proof = document.createElement('canvas');
    proof.width = source.videoWidth || source.width;
    proof.height = source.videoHeight || source.height;
    const context = proof.getContext('2d');
    context.drawImage(source, 0, 0, proof.width, proof.height);
    const fontSize = Math.max(28, Math.round(proof.width / 38));
    const padding = Math.round(fontSize * 0.7);
    const boxHeight = Math.round(fontSize * 4.5);
    context.fillStyle = 'rgba(0,0,0,.78)';
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

  async function retryCurrent() {
    if (!detector && !await setupDetector()) return;
    if (lastImportedBitmap) {
      codeStatus.textContent = 'Trying every picture method…';
      await detectSource(lastImportedBitmap, 'picture', true);
      return;
    }
    if (stream && preview.readyState >= 2) {
      codeStatus.textContent = 'Trying every live method…';
      detecting = true;
      try { await detectSource(preview, 'live', true); }
      finally { detecting = false; }
      return;
    }
    codeStatus.textContent = 'Start camera or choose a saved picture';
  }

  function clearCodes() {
    history = [];
    saveHistory();
    current = null;
    lastValue = '';
    resultBox.hidden = true;
    historyEl.innerHTML = '';
    codeStatus.textContent = stream ? 'Looking for any public code…' : 'Ready to scan';
    attemptStatus.textContent = 'Live scan checks the original view and enhanced contrast.';
  }

  modeSelect?.addEventListener('change', updateModeUi);
  startBtn?.addEventListener('click', () => setTimeout(updateModeUi, 700));
  dockStart?.addEventListener('click', () => setTimeout(updateModeUi, 700));
  switchBtn?.addEventListener('click', () => setTimeout(updateModeUi, 700));
  dockSwitch?.addEventListener('click', () => setTimeout(updateModeUi, 700));
  copyBtn?.addEventListener('click', copyCurrent);
  openBtn?.addEventListener('click', openCurrent);
  productBtn?.addEventListener('click', productLookup);
  proofBtn?.addEventListener('click', saveProof);
  retryBtn?.addEventListener('click', retryCurrent);
  imageInput?.addEventListener('change', async () => {
    const file = imageInput.files?.[0];
    await scanImportedFile(file, true);
    imageInput.value = '';
  });
  lowMemoryToggle?.addEventListener('change', restartScanning);
  clearBtn?.addEventListener('click', clearCodes);
  document.addEventListener('visibilitychange', () => document.hidden ? stopScanning() : startScanning());
  window.addEventListener('beforeunload', () => {
    stopScanning();
    if (lastImportedBitmap?.close) lastImportedBitmap.close();
  });

  renderHistory();
  updateModeUi();
})();