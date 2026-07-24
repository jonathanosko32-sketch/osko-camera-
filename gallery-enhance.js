(() => {
  const galleryEl = document.querySelector('#gallery');
  if (!galleryEl) return;

  const viewer = document.createElement('section');
  viewer.id = 'captureViewer';
  viewer.className = 'capture-viewer';
  viewer.hidden = true;
  viewer.setAttribute('aria-label', 'Full screen capture viewer');
  viewer.innerHTML = `
    <div class="capture-viewer-top">
      <div class="capture-viewer-title"><strong id="viewerMode">CAPTURE</strong><small id="viewerName"></small></div>
      <button id="viewerClose" class="capture-viewer-close" type="button" aria-label="Close full screen">×</button>
    </div>
    <div id="viewerMedia" class="capture-viewer-media"></div>
    <div class="capture-viewer-actions">
      <a id="viewerSave" href="#" download>Save</a>
      <button id="viewerShare" type="button">Google / Share</button>
      <button id="viewerDelete" class="delete-viewer" type="button">Delete</button>
    </div>`;
  document.body.appendChild(viewer);

  const mediaBox = viewer.querySelector('#viewerMedia');
  const modeEl = viewer.querySelector('#viewerMode');
  const nameEl = viewer.querySelector('#viewerName');
  const saveEl = viewer.querySelector('#viewerSave');
  const closeEl = viewer.querySelector('#viewerClose');
  const shareEl = viewer.querySelector('#viewerShare');
  const deleteEl = viewer.querySelector('#viewerDelete');
  let activeIndex = -1;

  function decorateCards() {
    galleryEl.querySelectorAll('.capture-item').forEach((card, index) => {
      card.dataset.openCapture = index;
      const media = card.querySelector('img,video');
      if (media) {
        media.dataset.openCapture = index;
        media.setAttribute('aria-label', 'Open capture full screen');
      }
      if (!card.querySelector('.capture-open-hint')) {
        const hint = document.createElement('span');
        hint.className = 'capture-open-hint';
        hint.textContent = 'Tap to enlarge';
        card.appendChild(hint);
      }
    });
  }

  function closeViewer() {
    viewer.hidden = true;
    document.body.style.overflow = '';
    mediaBox.innerHTML = '';
    activeIndex = -1;
  }

  function openViewer(index) {
    if (typeof captures === 'undefined') return;
    const item = captures[index];
    if (!item) return;
    activeIndex = index;
    mediaBox.innerHTML = '';
    const media = document.createElement(item.type === 'video' ? 'video' : 'img');
    media.src = item.url;
    if (item.type === 'video') {
      media.controls = true;
      media.playsInline = true;
      media.autoplay = true;
    } else {
      media.alt = 'OSKO full screen capture';
    }
    mediaBox.appendChild(media);
    modeEl.textContent = String(item.mode || 'normal').toUpperCase();
    nameEl.textContent = item.filename || '';
    saveEl.href = item.url;
    saveEl.download = item.filename || 'osko-capture';
    viewer.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  galleryEl.addEventListener('click', event => {
    if (event.target.closest('[data-share],[data-remove],a[download],button')) return;
    const target = event.target.closest('[data-open-capture],.capture-item');
    if (!target) return;
    openViewer(Number(target.dataset.openCapture));
  });

  closeEl.addEventListener('click', closeViewer);
  viewer.addEventListener('click', event => {
    if (event.target === viewer || event.target === mediaBox) closeViewer();
  });
  shareEl.addEventListener('click', () => {
    if (activeIndex >= 0 && typeof shareCapture === 'function') shareCapture(activeIndex);
  });
  deleteEl.addEventListener('click', () => {
    if (activeIndex < 0 || typeof captures === 'undefined' || !captures[activeIndex]) return;
    URL.revokeObjectURL(captures[activeIndex].url);
    captures.splice(activeIndex, 1);
    closeViewer();
    if (typeof renderGallery === 'function') renderGallery();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !viewer.hidden) closeViewer();
  });

  new MutationObserver(decorateCards).observe(galleryEl, { childList: true });
  decorateCards();
})();