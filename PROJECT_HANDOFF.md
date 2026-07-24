# OSKO Camera — Project Handoff

Repository: `jonathanosko32-sketch/osko-camera-`
Live site: `https://jonathanosko32-sketch.github.io/osko-camera-/`

## Current status

The OSKO Camera is live on GitHub Pages and is being actively developed for Android/Chrome use.

## Working features

- Live front and rear camera
- High-detail photo capture
- Video recording
- Front/rear camera switching
- Recent captures gallery
- Save, delete, and share controls
- Brightness control
- Night/Dark Walk mode
- Steady mode using motion sensing and crop stabilization
- Full-screen viewfinder
- Date/time and GPS stamps
- Zoom when supported by the phone/browser
- 80s filter mode
- Document mode
- Scanner mode:
  - color
  - grayscale
  - black and white
  - blur/sharpen control
  - paper cleanup
  - multi-page scan set
  - print/save as PDF
  - share scans
- Code Scanner mode intended for:
  - QR
  - UPC/EAN
  - Code 39/93/128
  - Data Matrix
  - PDF417
  - Aztec
  - ITF
  - Codabar
  - copy, search/open, proof photo, and scan history
- Google/Share workflow for sending captures to Lens, Translate, Photos, Drive, or other Android apps
- Native phone camera fallback

## Known issues / current priorities

1. Rear hardware flashlight is inconsistent in Chrome.
   - The phone reports a torch, and it worked once.
   - Current code retries the exact rear camera and several torch constraints.
   - Chrome may still block hardware torch control.
   - Selfie/screen light is separate and works only for the front camera.

2. Scanner and code scanner are usable but the user says they will work better once packaged as a real Android app.

3. The latest user request was to test and improve the Code Scanner on Walmart product barcodes, QR codes, and trucking labels.

4. Future useful work:
   - tap-to-focus
   - exposure control and bright-area protection
   - close-up/macro mode
   - stronger app-like layout
   - Android app packaging for deeper hardware access
   - trucking inspection folders and proof-photo workflows

## User feedback

- User says this is the clearest camera they have ever used.
- Close-up detail is extremely good.
- They want to use it for trucking work, personal use, documents, scanning, codes, and website images.
- They want all features kept in one OSKO Camera system.

## Next-chat instruction

Open this repository and inspect `PROJECT_HANDOFF.md`, `index.html`, `app.js`, `styles.css`, and `service-worker.js`. Continue from the current main branch without rebuilding from scratch.
