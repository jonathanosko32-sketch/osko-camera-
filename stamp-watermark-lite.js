(() => {
  'use strict';

  const cameraCard = document.getElementById('cameraCard');
  const watermarkChoice = document.getElementById('watermarkChoice');
  const watermarkPosition = document.getElementById('watermarkPosition');
  const watermarkSize = document.getElementById('watermarkSize');
  const watermarkOpacity = document.getElementById('watermarkOpacity');
  const stampToggle = document.getElementById('stampToggle');
  const saveStatus = document.getElementById('saveStatus');
  if (!cameraCard || !watermarkChoice || !stampToggle) return;

  const KEY = 'osko-quick-stamp-watermark-v1';

  const style = document.createElement('style');
  style.textContent = `
    .osko-stamp-tools{
      position:absolute;left:50%;bottom:78px;transform:translateX(-50%);
      z-index:44;display:flex;gap:8px;align-items:center;justify-content:center;
      padding:6px 8px;border-radius:22px;background:rgba(5,19,32,.48);
      backdrop-filter:blur(7px);max-width:88%;
    }
    .osko-stamp-tools button{
      min-height:38px;border-radius:20px;border:1.5px solid rgba(255,255,255,.78);
      background:#10283a;color:#fff;font:800 12px/1.1 system-ui,sans-serif;
      padding:8px 12px;white-space:nowrap;
    }
    .osko-stamp-tools button.active{background:#087b98;color:#fff;box-shadow:0 0 0 2px rgba(117,226,255,.22)}
    @media(max-width:420px){.osko-stamp-tools{bottom:74px}.osko-stamp-tools button{font-size:11px;padding:7px 9px}}
  `;
  document.head.appendChild(style);

  const bar = document.createElement('div');
  bar.className = 'osko-stamp-tools';
  bar.setAttribute('aria-label', 'Watermark and date time controls');

  const watermarkBtn = document.createElement('button');
  watermarkBtn.type = 'button';
  watermarkBtn.setAttribute('aria-label', 'Toggle Alaska Ice Crystals watermark');

  const dateBtn = document.createElement('button');
  dateBtn.type = 'button';
  dateBtn.setAttribute('aria-label', 'Toggle date and time stamp');

  bar.append(watermarkBtn, dateBtn);
  cameraCard.appendChild(bar);

  function applyWatermarkDefaults() {
    if (watermarkPosition) watermarkPosition.value = 'bottom-right';
    if (watermarkSize) watermarkSize.value = '4';
    if (watermarkOpacity) watermarkOpacity.value = '35';
    watermarkPosition?.dispatchEvent(new Event('change', { bubbles: true }));
    watermarkSize?.dispatchEvent(new Event('change', { bubbles: true }));
    watermarkOpacity?.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        watermarkOn: watermarkChoice.value === 'alaska',
        dateOn: Boolean(stampToggle.checked)
      }));
    } catch {}
  }

  function status(message) {
    try { if (typeof setStatus === 'function') setStatus(message); } catch {}
    if (saveStatus) saveStatus.textContent = message;
  }

  function refresh() {
    const watermarkOn = watermarkChoice.value === 'alaska';
    watermarkBtn.classList.toggle('active', watermarkOn);
    watermarkBtn.textContent = watermarkOn ? 'ALASKA MARK ON' : 'ALASKA MARK OFF';
    watermarkBtn.setAttribute('aria-pressed', watermarkOn ? 'true' : 'false');

    const dateOn = Boolean(stampToggle.checked);
    dateBtn.classList.toggle('active', dateOn);
    dateBtn.textContent = dateOn ? 'DATE/TIME ON' : 'DATE/TIME OFF';
    dateBtn.setAttribute('aria-pressed', dateOn ? 'true' : 'false');
  }

  function setWatermark(on) {
    watermarkChoice.value = on ? 'alaska' : 'none';
    if (on) applyWatermarkDefaults();
    watermarkChoice.dispatchEvent(new Event('change', { bubbles: true }));
    save();
    refresh();
    status(on ? 'Alaska Ice Crystals watermark set small and light in the lower-right' : 'Watermark off for next picture');
  }

  function setDate(on) {
    stampToggle.checked = on;
    stampToggle.dispatchEvent(new Event('change', { bubbles: true }));
    save();
    refresh();
    status(on ? 'Date and time will be added to the next picture' : 'Date and time off for next picture');
  }

  watermarkBtn.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    setWatermark(watermarkChoice.value !== 'alaska');
  });

  dateBtn.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    setDate(!stampToggle.checked);
  });

  watermarkChoice.addEventListener('change', () => { save(); refresh(); });
  stampToggle.addEventListener('change', () => { save(); refresh(); });

  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch {}
  if (saved) {
    setWatermark(saved.watermarkOn !== false);
    setDate(Boolean(saved.dateOn));
  } else {
    setWatermark(true);
    setDate(false);
  }

  window.oskoStampWatermark = {
    watermarkOn: () => watermarkChoice.value === 'alaska',
    dateOn: () => Boolean(stampToggle.checked),
    setWatermark,
    setDate
  };
})();