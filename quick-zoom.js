(() => {
  'use strict';

  const cameraCard = document.getElementById('cameraCard');
  const zoomRange = document.getElementById('zoomRange');
  const zoomValue = document.getElementById('zoomValue');
  if (!cameraCard || !zoomRange) return;

  const style = document.createElement('style');
  style.textContent = `
    .osko-quick-zoom {
      position:absolute;
      left:50%;
      bottom:132px;
      transform:translateX(-50%);
      z-index:45;
      display:flex;
      gap:10px;
      align-items:center;
      justify-content:center;
      padding:8px 10px;
      border-radius:28px;
      background:rgba(5,19,32,.42);
      backdrop-filter:blur(8px);
    }
    .osko-quick-zoom button {
      width:52px;
      height:52px;
      border-radius:50%;
      border:2px solid rgba(255,255,255,.82);
      background:#10283a;
      color:#fff;
      font:800 16px/1 system-ui,sans-serif;
      box-shadow:0 5px 18px rgba(0,0,0,.38);
      padding:0;
    }
    .osko-quick-zoom button.active {
      background:#fff;
      color:#10283a;
      transform:scale(1.08);
    }
    .osko-quick-zoom button:disabled {
      opacity:.35;
    }
    @media (max-width:420px){
      .osko-quick-zoom{gap:8px;bottom:128px}
      .osko-quick-zoom button{width:48px;height:48px;font-size:15px}
    }
  `;
  document.head.appendChild(style);

  const bar = document.createElement('div');
  bar.className = 'osko-quick-zoom';
  bar.setAttribute('aria-label', 'Quick zoom');
  const levels = [1, 2, 4, 8];

  function maxZoom() {
    return Number(zoomRange.max || 1);
  }

  function currentZoom() {
    return Number(zoomRange.value || 1);
  }

  function nearestLevel(value) {
    return levels.reduce((best, level) => Math.abs(level - value) < Math.abs(best - value) ? level : best, levels[0]);
  }

  function refresh() {
    const max = maxZoom();
    const current = currentZoom();
    [...bar.children].forEach(button => {
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
    bar.appendChild(button);
  });

  cameraCard.appendChild(bar);
  zoomRange.addEventListener('input', refresh);
  zoomRange.addEventListener('change', refresh);

  const observer = new MutationObserver(refresh);
  observer.observe(zoomRange, { attributes: true, attributeFilter: ['min', 'max', 'disabled', 'value'] });

  setInterval(refresh, 1200);
  refresh();

  window.oskoQuickZoom = {
    set: applyZoom,
    levels: () => levels.filter(level => level <= maxZoom()),
    current: currentZoom,
    nearest: () => nearestLevel(currentZoom())
  };
})();