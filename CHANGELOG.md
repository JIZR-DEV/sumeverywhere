# Changelog — SumEverywhere

All notable changes to this project will be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

## [0.2.0] — 2026-06-10

### Added
- First public release packaged for Chrome Web Store and Mozilla AMO.
- Gemini Nano (Summarizer API) on-device summarization for Chrome 138+.
- Extractive TextRank fallback for all browsers (zero network, pure JS).
- Internationalization in 6 languages: English, Spanish, Portuguese, French, German, Italian.
- Privacy page and donation page bundled inside the extension (no external payment processing).
- Welcome page shown on first install.
- Options page with storage.local persistence and clear-data action.
- Firefox MV3 support (Firefox 140+, Firefox for Android 142+).
- webextension-polyfill included unminified as required by AMO.

## [0.1.0] — 2026-06-09

### Added
- Initial development version.
- Core architecture: background service worker, on-demand content script injection,
  popup, options, and summarizer modules.
- Dual manifest system (manifests/chrome.json, manifests/firefox.json).
- Node-based build pipeline (build/build.mjs, build/zip.mjs) with no external bundler.
