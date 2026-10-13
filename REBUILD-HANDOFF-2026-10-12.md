# OSKO Camera separate recovery build

User requested reading existing camera code and making another camera app without losing originals. Original repository cloned read-only from jonathanosko32-sketch/osko-camera-, main commit 751d1ca7cfa9b4a73a6009a5bd3e550c9e6918ba. Original code and deployment were not modified.

Confirmed missing core interface: current app.js lacks makeProcessedCanvas, filterString, scanner functions, and recording functions. clarity.js references makeProcessedCanvas immediately, so it throws a ReferenceError during startup. Current setEnabled disables all video buttons. Existing extras/storage/workflow functions expect typed capture records, but current addCapture only makes photo records without type/mode. These are concrete code breaks; do not claim they prove all physical camera issues.

Recovered full app.js from commit 3c68746, containing photo processing, video, scans, gallery save/share/delete, native file capture, zoom, torch, timer, date/location stamping. Retained current UI, barcode, extras, storage, workflow, crystal-case, clarity modules. Reattached precision camera-controls module. Added camera startup lock and stop acquired tracks on playback/start failure. Separate manifest identity; original remains intact.

Replaced new copy's offline loader with explicit network-first caching; no hidden script injection. Old loader kept as legacy-service-worker.js in source for reference, excluded from output. Existing persistent-library.js attached to preserve captures in IndexedDB where browser storage permits. Photos remain device-local; no server upload added. New origin cannot automatically access the old origin's stored gallery. Browser storage is not a durable external backup: user should Save important captures.

Validation: syntax of all loaded modules; all core DOM selectors resolve to IDs in index; script/css asset presence; restored required processing and video interfaces. Physical phone testing is still required: rear/front feed, 1× clarity, zoom, focus, light, photo/video save, scans, offline reopen. Build is a separate test, not certified finished.

New private Site supplies versioned remote Git source and deploy history, plus downloadable source ZIP. Keep original repository/history untouched. User prefers working Chrome links to local file previews.
