# SKY — READ THIS FIRST: OSKO Camera

## Priority
The real working camera comes before appearance changes. Do not restart the project and do not replace the working version with a mockup or generated picture.

## User requirement
OSKO Camera must work mainly on Osko's Android phone and be ready for real work. Image clarity is the highest priority. Features must never weaken the basic camera.

## Required camera behavior
- Sharp normal photo at 1×.
- Show the exact zoom number on screen.
- Test the closest usable view and farthest usable zoom before fine detail fades.
- Maximize usable clear zoom, not merely the largest zoom number.
- Stable focus after zooming.
- Full-resolution saving where the browser and phone allow it.
- Rear flashlight off/on, with glare protection for close work where supported.
- Front and rear camera testing.
- Indoor, outdoor, bright, low-light, close, and distant testing.
- Preserve originals and avoid unnecessary compression.

## Current implementation
- `app.js`: base live camera, photo, video, zoom, torch, gallery, stamps, scanner.
- `clarity.js`: requests continuous focus/exposure/white balance, reads hardware zoom, uses ImageCapture for the highest-resolution still frame when available, and labels zoom quality.
- `camera-controls.js`: tap-to-focus, 1×/2×/4×/8× presets, user-tested clear-zoom calibration stored on the phone, real resolution/lens readout, and torch exposure protection.
- `camera-controls.css`: precision control and focus-ring styling.
- Service-worker cache version `osko-camera-v57` includes the new clarity and precision-control files.

## Testing still required on Osko's actual phone
Browser code cannot certify lens quality without physical test photos. Test in this order:
1. Rear camera at 1× in normal daylight.
2. Tap a detailed object to verify focus.
3. Test 2×, 4×, 8× only where the phone reports those values.
4. At the last sharp zoom, tap **Mark this as clear max**.
5. Test close-up with rear light off and on for glare.
6. Test far detail, indoor light, low light, front camera, saving, and reopening saved photos.

## Protection rules
- Commit every important change to GitHub.
- Keep a working phone copy and a full Google Drive backup.
- Do not delete or rewrite working camera controls without first preserving the current version.
- Document every important fix here or in a dated project note.
