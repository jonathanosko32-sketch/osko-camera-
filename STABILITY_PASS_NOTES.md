# OSKO Camera Stability Pass

Branch: `osko-camera-stability-pass`

## What this build adds
- Blocks overlapping camera actions and repeated taps while an operation is still running.
- Protects camera switching while recording or while another camera operation is active.
- Debounces zoom hardware commands so slider movement does not overload the phone camera.
- Watches the live camera track for ended or muted states and attempts a controlled recovery.
- Adds safer video-recorder error handling and clear status feedback.
- Stops camera tracks, recorder activity, recovery timers, and zoom timers when the page is closed or frozen.
- Exposes `window.oskoStableCamera.status()` for testing and troubleshooting.

## Existing product features preserved
- Crystal camera entrance and exit
- Live preview
- Photo and video capture
- OSKO Best Shot, Choose Your Shot, and Single Shot
- Front/rear camera switching
- Rear torch and selfie light
- Hardware zoom and clarity labels
- Steady mode, night mode, scanner, universal scan
- Gallery, sharing, saving, stamps, watermarks, project folders
- SKIE voice controls

## Required phone test before merging to main
1. Refresh/reopen the installed camera so service-worker cache v72 loads.
2. Open and close the camera at least five times.
3. Press Start, Photo, Video, Flip, and Flash repeatedly and confirm double taps do not create overlapping actions.
4. Move zoom slowly and quickly across the full range; record the clearest usable limit.
5. Record a short video with sound, stop it, reopen it, and confirm it saved.
6. Test front and rear cameras, rear flash, selfie light, normal mode, and night mode.
7. Put Chrome in the background, return, and confirm the preview recovers.
8. Test all three shutter modes.
9. Confirm SKIE commands trigger the same actions reliably.
10. Record any failure with the exact button, mode, and phone state.

## Protection rule
Do not replace `main` until this branch passes real-phone photo and video testing. Keep `main` as the known working version.