(() => {
  'use strict';

  const cameraCard = document.getElementById('cameraCard');
  const screenLightToggle = document.getElementById('screenLightToggle');
  const torchToggle = document.getElementById('torchToggle');
  const quickTorchBtn = document.getElementById('quickTorchBtn');
  if (!cameraCard) return;

  const crystal = document.createElement('section');
  crystal.className = 'crystal-selfie-light';
  crystal.setAttribute('aria-label', 'Crystal selfie light');
  crystal.innerHTML = `
    <div class="crystal-selfie-label">
      <strong>ICE CRYSTAL LIGHT</strong>
      <span>Dark blue when off · bright for selfies</span>
    </div>
    <button id="crystalLightButton" class="crystal-light-button" type="button">SELFIE LIGHT</button>`;
  cameraCard.parentNode.insertBefore(crystal, cameraCard);

  const crystalButton = document.getElementById('crystalLightButton');

  function facingIsFront() {
    return typeof facingMode !== 'undefined' && facingMode === 'user';
  }

  function updateCrystalLight() {
    const on = Boolean(screenLightToggle?.checked && facingIsFront());
    crystal.classList.toggle('on', on);
    crystalButton?.classList.toggle('active', on);
    if (crystalButton) crystalButton.textContent = on ? 'SELFIE LIGHT ON' : 'SELFIE LIGHT';
    document.body.classList.toggle('selfie-light', on);
  }

  async function turnCrystalLight(on) {
    if (on && !facingIsFront()) {
      if (typeof switchCamera === 'function' && typeof stream !== 'undefined' && stream) {
        await switchCamera();
      } else {
        if (typeof showError === 'function') showError('Start the camera and switch to the front camera for the crystal selfie light.');
        return;
      }
    }
    if (screenLightToggle) screenLightToggle.checked = Boolean(on);
    updateCrystalLight();
    if (typeof setStatus === 'function') setStatus(on ? 'Crystal selfie light on' : 'Crystal selfie light off');
  }

  crystalButton?.addEventListener('click', () => turnCrystalLight(!crystal.classList.contains('on')));
  screenLightToggle?.addEventListener('change', updateCrystalLight);

  [document.getElementById('switchBtn'), document.getElementById('quickSwitchBtn'), document.getElementById('dockSwitch')]
    .filter(Boolean)
    .forEach(button => button.addEventListener('click', () => setTimeout(updateCrystalLight, 500)));

  if (torchToggle) {
    const label = torchToggle.closest('label')?.querySelector('span');
    if (label) label.textContent = 'Rear flashlight / walk light';
  }
  if (quickTorchBtn) quickTorchBtn.setAttribute('aria-label', 'Rear flashlight and walk light');

  window.oskoCrystalLight = {
    on: () => turnCrystalLight(true),
    off: () => turnCrystalLight(false),
    refresh: updateCrystalLight
  };

  updateCrystalLight();
})();
