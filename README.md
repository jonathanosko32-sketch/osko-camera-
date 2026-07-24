# OSKO Camera

OSKO Camera is a lightweight phone-friendly web camera app.

## Current features

- Live camera preview
- Rear/front camera switching
- High-quality photo capture
- Video recording with microphone audio
- Recent-capture gallery
- Save/download photos and videos
- Delete individual captures or clear the gallery
- Installable web-app manifest
- Offline app-shell support
- Responsive phone and desktop layout

## Important browser requirement

Camera access only works from a secure address (`https://`) or from `localhost`. Opening `index.html` directly as a normal file may block camera permission.

## Run locally

With Python installed:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` on the same computer.

## Put it online

Deploy the repository to a secure HTTPS host such as GitHub Pages, Cloudflare Pages, Netlify, or Vercel. Once deployed, open the site in Chrome or Safari, allow camera and microphone access, and use the browser's **Add to Home screen** or **Install app** option.

## Privacy

The current version processes captures in the browser. Photos and videos are not automatically uploaded to a server. The user must tap **Save** to download a capture to the device.
