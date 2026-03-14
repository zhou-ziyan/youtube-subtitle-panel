# Project Overview

A Chrome extension (Manifest V3) that injects a resizable subtitle panel into YouTube video pages. No build step — all source is plain JS/CSS loaded directly by Chrome.

## File Structure

- `manifest.json` — Extension manifest (Manifest V3)
- `content.js` — All logic: panel injection, subtitle fetching, UI, SPA navigation
- `styles.css` — Panel styles (always night mode)
- `icon16.png`, `icon48.png`, `icon128.png` — Extension icons
