(() => {
  'use strict';

  const cameraCard = document.getElementById('cameraCard');
  const zoomRange = document.getElementById('zoomRange');
  const zoomValue = document.getElementById('zoomValue');
  if (!cameraCard || !zoomRange) return;

  const style = document.createElement('style');
  style.textContent = `
    .osko-quick-zoom-side {
      position:absolute;
      top:50%;
      transform:translateY(-50%);
      z-index:45;
      display:flex;
      flex-direction:column;
      gap:18px;
      align-items:center;
      justify-content:center;
      padding:8px 6px;
      border-radius:32px;
      background:rgba(5,19,32,.28);
      backdrop-filter:blur(6px);
    }
    .osko-quick-zoom-side.left { left:10px; }
    .osko-quick-zoom-side.right { right:10px; }
    .osko-quick-zoom-side button {
      width:54px;
      height:54px;
      border-radius:50%;
      border:2px solid rgba(255,255,255,.88);
      background:#10283a;
      color:#fff;
      font:800 16px/1 system-ui,sans-serif;
      box-shadow:0 5px 18px rgba(0,0,0,.38);
      padding:0;
    }
    .osko-quick-zoom-side button.active {
      background:#fff;
      color:#10283a;
      transform:scale(1.08);
    }
    .osko-quick-zoom-side button:disabled { opacity:.35; }
    @media (max-width:420px){
      .osko-quick-zoom-side{gap:16px;padding:6px 4px}
      .osko-quick-zoom-side.left{left:6px}
      .osko-quick-zoom-side.right{right:6px}
      .osko-quick-zoom-side button{width:48px;height:48px;font-size:15px}
    }
  `;
  document.head.appendChild(style);

  const leftBar = document.createElement('div');
  leftBar.className = 'osko-quick-zoom-side left';
  leftBar.setAttribute('aria-label', 'Near zoom controls');

  const rightBar = document.createElement('div');
  rightBar.className = 'osko-quick-zoom-side right';
  rightBar.setAttribute('aria-label', 'Far zoom controls');

  const levels = [1, 2, 4, 8];
  const buttons = [];

  function maxZoom() { return Number(zoomRange.max || 1); }
  function currentZoom() { return Number(zoomRange.value || 1); }

  function refresh() {
    const max = maxZoom();
    const current = currentZoom();
    buttons.forEach(button => {
      const requested = Number(button.dataset.zoom);
      button.disabled = requested > max + 0.01;
      button.classList.toggle('active', Math.abs(current - Math.min(requested, max)) < 0.12);
      button.title = requested > max ? `Phone maximum is ${max.toFixed(1)}×` : `${requested}× zoom`;
    });
  }

  async function applyZoom(requested) {
    const max = maxZoom();
    const min = Number(zoomRange.min || 1);
    const value = Math.max(min, Math.min(max, requested));
    zoomRange.value = String(value);
    zoomRange.dispatchEvent(new Event('input', { bubbles: true }));
    zoomRange.dispatchEvent(new Event('change', { bubbles: true }));
    if (zoomValue) {
      const label = value <= Math.min(max, 3) ? 'CLEAR' : value <= Math.min(max, 5) ? 'EXTENDED' : 'MAX';
      zoomValue.textContent = `${value.toFixed(1)}× · ${label}`;
    }
    try { if (typeof setStatus === 'function') setStatus(`${value.toFixed(1)}× zoom`); } catch {}
    refresh();
  }

  levels.forEach(level => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.zoom = String(level);
    button.textContent = `${level}×`;
    button.setAttribute('aria-label', `Set zoom to ${level} times`);
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      applyZoom(level);
    });
    buttons.push(button);
    (level <= 2 ? leftBar : rightBar).appendChild(button);
  });

  cameraCard.appendChild(leftBar);
  cameraCard.appendChild(rightBar);
  zoomRange.addEventListener('input', refresh);
  zoomRange.addEventListener('change', refresh);

  const observer = new MutationObserver(refresh);
  observer.observe(zoomRange, { attributes: true, attributeFilter: ['min', 'max', 'disabled', 'value'] });

  setInterval(refresh, 1200);
  refresh();

  window.oskoQuickZoom = {
    set: applyZoom,
    levels: () => levels.filter(level => level <= maxZoom()),
    current: currentZoom
  };
})();
