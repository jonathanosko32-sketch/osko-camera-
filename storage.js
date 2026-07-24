(() => {
  const $ = selector => document.querySelector(selector);
  const saveDestination = $('#saveDestination');
  const projectFolder = $('#projectFolder');
  const watermarkChoice = $('#watermarkChoice');
  const customWatermark = $('#customWatermark');
  const watermarkPosition = $('#watermarkPosition');
  const watermarkSize = $('#watermarkSize');
  const watermarkOpacity = $('#watermarkOpacity');
  const makeWatermarkBtn = $('#makeWatermarkBtn');
  const saveLastBtn = $('#saveLastBtn');
  const saveWebsiteBtn = $('#saveWebsiteBtn');
  const saveStatus = $('#saveStatus');
  const watermarkPanel = $('#saveWatermarkPanel');

  const SETTINGS_KEY = 'osko-save-settings-v1';
  const WATERMARK_LABELS = {
    none: '',
    personal: 'PERSONAL',
    osko: 'OSKO ICE CRYSTALS',
    alaska: 'ALASKA ICE CRYSTALS',
    work: 'WORK'
  };

  function latestPhoto() {
    return typeof captures !== 'undefined' ? captures.find(item => item.type === 'photo') : null;
  }

  function latestCapture() {
    return typeof captures !== 'undefined' ? captures[0] : null;
  }

  function setSaveStatus(message) {
    if (saveStatus) saveStatus.textContent = message;
    if (typeof setStatus === 'function') setStatus(message);
  }

  function currentSettings() {
    return {
      destination: saveDestination?.value || 'ask',
      folder: projectFolder?.value || 'Personal',
      watermark: watermarkChoice?.value || 'none',
      position: watermarkPosition?.value || 'bottom-right',
      size: Number(watermarkSize?.value || 6),
      opacity: Number(watermarkOpacity?.value || 70)
    };
  }

  function saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(currentSettings())); } catch {}
  }

  function setupPermanentWatermarkChoices() {
    if (watermarkChoice) {
      const previous = watermarkChoice.value;
      watermarkChoice.innerHTML = [
        ['none', 'None'],
        ['personal', 'Personal'],
        ['osko', 'OSKO Ice Crystals'],
        ['alaska', 'Alaska Ice Crystals'],
        ['work', 'Work']
      ].map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
      watermarkChoice.value = WATERMARK_LABELS.hasOwnProperty(previous) ? previous : 'none';
    }

    if (customWatermark) customWatermark.closest('label')?.remove();
    makeWatermarkBtn?.remove();

    const help = watermarkPanel?.querySelector('.command-help');
    if (help) help.textContent = 'Choose the watermark before taking the picture. It is placed permanently on that photo. Choose None for a clean picture.';

    const heading = watermarkPanel?.querySelector('h3');
    if (heading) heading.textContent = 'Save location and permanent watermark';
  }

  function restoreSettings() {
    try {
      const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      if (settings.destination && saveDestination) saveDestination.value = settings.destination;
      if (settings.folder && projectFolder) projectFolder.value = settings.folder;
      if (settings.watermark && watermarkChoice && WATERMARK_LABELS.hasOwnProperty(settings.watermark)) watermarkChoice.value = settings.watermark;
      if (settings.position && watermarkPosition) watermarkPosition.value = settings.position;
      if (settings.size && watermarkSize) watermarkSize.value = settings.size;
      if (settings.opacity && watermarkOpacity) watermarkOpacity.value = settings.opacity;
    } catch {}
  }

  function safeName(value) {
    return String(value || 'Personal').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '') || 'Personal';
  }

  function renamedFile(item, suffix = '') {
    const folder = safeName(projectFolder?.value || 'Personal');
    const original = item.filename || `osko-${Date.now()}.jpg`;
    const dot = original.lastIndexOf('.');
    const base = dot > 0 ? original.slice(0, dot) : original;
    const ext = dot > 0 ? original.slice(dot) : '.jpg';
    return `${folder}-${base}${suffix}${ext}`;
  }

  function downloadItem(item, suffix = '') {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(item.blob);
    link.download = renamedFile(item, suffix);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  async function shareToDrive(item, suffix = '') {
    const file = new File([item.blob], renamedFile(item, suffix), { type: item.blob.type || 'image/jpeg' });
    if (!navigator.canShare?.({ files: [file] })) {
      setSaveStatus('Drive sharing is unavailable here. Saved to phone instead.');
      downloadItem(item, suffix);
      return false;
    }
    try {
      await navigator.share({
        files: [file],
        title: `OSKO Camera — ${projectFolder?.value || 'Personal'}`,
        text: 'Choose Google Drive, Photos, email, or another destination.'
      });
      setSaveStatus('Share menu opened. Choose Google Drive and the folder you want.');
      return true;
    } catch (error) {
      if (error.name !== 'AbortError') setSaveStatus('Could not open sharing.');
      return false;
    }
  }

  async function saveItem(item, suffix = '') {
    if (!item) return setSaveStatus('Take a picture first.');
    saveSettings();
    const destination = saveDestination?.value || 'ask';
    if (destination === 'phone') {
      downloadItem(item, suffix);
      setSaveStatus('Saved to phone Downloads.');
      return;
    }
    if (destination === 'drive') {
      await shareToDrive(item, suffix);
      return;
    }
    if (destination === 'both') {
      downloadItem(item, suffix);
      setSaveStatus('Saved to phone. Opening Share for Google Drive…');
      await shareToDrive(item, suffix);
      return;
    }
    if (navigator.canShare) await shareToDrive(item, suffix);
    else {
      downloadItem(item, suffix);
      setSaveStatus('Saved to phone Downloads.');
    }
  }

  function watermarkText() {
    return WATERMARK_LABELS[watermarkChoice?.value || 'none'] || '';
  }

  function watermarkCoordinates(position, width, height, pad) {
    const map = {
      'top-left': [pad, pad, 'left', 'top'],
      'top-right': [width - pad, pad, 'right', 'top'],
      'bottom-left': [pad, height - pad, 'left', 'bottom'],
      'bottom-right': [width - pad, height - pad, 'right', 'bottom'],
      center: [width / 2, height / 2, 'center', 'middle']
    };
    return map[position] || map['bottom-right'];
  }

  async function applyPermanentWatermark(blob) {
    const text = watermarkText();
    if (!text) return blob;

    const bitmap = await createImageBitmap(blob);
    const out = document.createElement('canvas');
    out.width = bitmap.width;
    out.height = bitmap.height;
    const ctx = out.getContext('2d');
    ctx.drawImage(bitmap, 0, 0);

    const sizePercent = Number(watermarkSize?.value || 6) / 100;
    const fontSize = Math.max(22, Math.round(out.width * sizePercent));
    const pad = Math.max(18, Math.round(fontSize * 0.55));
    const [x, y, align, baseline] = watermarkCoordinates(watermarkPosition?.value, out.width, out.height, pad);

    ctx.font = `800 ${fontSize}px system-ui`;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.globalAlpha = Math.max(0.2, Math.min(1, Number(watermarkOpacity?.value || 70) / 100));
    ctx.lineWidth = Math.max(3, Math.round(fontSize * 0.08));
    ctx.strokeStyle = 'rgba(0,0,0,.82)';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, x, y);
    ctx.globalAlpha = 1;
    bitmap.close?.();

    return new Promise((resolve, reject) => {
      out.toBlob(result => result ? resolve(result) : reject(new Error('Watermark failed')), 'image/jpeg', 0.96);
    });
  }

  function installPermanentCaptureWatermark() {
    if (typeof addCapture !== 'function') return;
    const originalAddCapture = addCapture;
    addCapture = function(blob, type, ext, mode = typeof modeSelect !== 'undefined' ? modeSelect.value : 'normal') {
      const excludedModes = ['scanner', 'website', 'sticker', 'osko-watermark', 'alaska-watermark'];
      const shouldApply = type === 'photo' && !excludedModes.includes(mode) && Boolean(watermarkText());

      if (!shouldApply) {
        originalAddCapture(blob, type, ext, mode);
        return;
      }

      applyPermanentWatermark(blob)
        .then(markedBlob => {
          originalAddCapture(markedBlob, type, ext, mode);
          setSaveStatus(`${watermarkText()} watermark applied permanently.`);
        })
        .catch(error => {
          console.error(error);
          originalAddCapture(blob, type, ext, mode);
          setSaveStatus('Picture saved, but the watermark could not be applied.');
        });
    };
  }

  async function saveWebsiteCopy() {
    const item = latestPhoto();
    if (!item) return setSaveStatus('Take a picture first.');
    try {
      const bitmap = await createImageBitmap(item.blob);
      const maxSide = 1600;
      const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
      const out = document.createElement('canvas');
      out.width = Math.max(1, Math.round(bitmap.width * scale));
      out.height = Math.max(1, Math.round(bitmap.height * scale));
      out.getContext('2d').drawImage(bitmap, 0, 0, out.width, out.height);
      out.toBlob(async blob => {
        if (!blob) return setSaveStatus('Website copy failed.');
        const copy = { blob, filename: `osko-website-${Date.now()}.jpg`, type: 'photo' };
        if (typeof addCapture === 'function') addCapture(blob, 'photo', 'jpg', 'website');
        await saveItem(copy, '-website');
      }, 'image/jpeg', 0.84);
    } catch (error) {
      console.error(error);
      setSaveStatus('Website copy failed.');
    }
  }

  setupPermanentWatermarkChoices();
  restoreSettings();
  installPermanentCaptureWatermark();

  [saveDestination, projectFolder, watermarkChoice, watermarkPosition, watermarkSize, watermarkOpacity]
    .forEach(control => control?.addEventListener('change', saveSettings));

  watermarkChoice?.addEventListener('change', () => {
    const label = watermarkChoice.options[watermarkChoice.selectedIndex]?.text || 'None';
    setSaveStatus(label === 'None' ? 'No watermark selected.' : `${label} will be permanent on the next picture.`);
  });

  saveLastBtn?.addEventListener('click', () => saveItem(latestCapture()));
  saveWebsiteBtn?.addEventListener('click', saveWebsiteCopy);
})();