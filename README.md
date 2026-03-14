# YouTube Subtitle Panel Extension

Navigate YouTube videos with a smart, resizable subtitle panel—jump to any moment by clicking on subtitles!


## Features

- **Subtitle Panel:** Injected on YouTube video pages (`/watch?v=...`), fixed to the right side, resizable between 200–600px (default 400px).
- **Always Night Mode:** The panel always uses night mode — there is no light mode toggle.
- **Language Selection:** Dropdown lists all available subtitle tracks, sorted alphabetically. Automatically selects your preferred or browser language on first load; saves your choice for future videos.
- **Font Size Controls:** `A-` / `A+` buttons adjust subtitle font size between 12–24px (step 2, default 14px). Preference is saved.
- **Click-to-Seek:** Click any subtitle line to jump the video to that timestamp.
- **Refresh Button:** A "Not the new subtitle? Click here:" prompt with a refresh button (⟳) is always shown in the header. Use it if subtitles fail to load or are mismatched.
- **Auto-Reload on Navigation:** When you navigate to a new YouTube video via YouTube's in-page navigation (not a full page load), the extension automatically reloads the page once to fetch fresh subtitle data. This is expected behavior.
- **Hide / Show:** Click "Hide" to collapse the panel. It is replaced by a small "Show" button that you can drag anywhere on screen. Clicking "Show" restores the panel.
- **Ad Detection:** While an ad is playing, subtitle highlighting is paused and "Subtitles loaded. Ad is playing..." is shown.
- **Persistence:** Panel width, font size, language preference, and "Show" button position are all saved in `localStorage`.

---

## Installation

1. **Download this Repository**
   - Clone or download and unzip the code.

2. **Load the Extension in Chrome**
   - Go to `chrome://extensions/`
   - Enable **Developer mode** (top right toggle)
   - Click **Load unpacked**
   - Select this project folder

---

## Usage

1. Navigate to any YouTube video (`youtube.com/watch?v=...`).
2. The subtitle panel appears on the right. The page may reload once automatically — this is normal.
3. **Language:** Use the dropdown in the header to switch subtitle language. Your choice is saved.
4. **Font size:** Use `A-` / `A+` in the footer to adjust text size.
5. **Seek:** Click any subtitle line to jump to that point in the video.
6. **Resize:** Drag the left edge of the panel to resize it (200–600px).
7. **Hide/Show:** Click "Hide" to collapse; drag or click the floating "Show" button to restore.
8. **Subtitles not loading?** Click the ⟳ refresh button in the header.

---

## File Overview

- `manifest.json` — Chrome extension manifest
- `content.js` — All extension logic: panel injection, subtitle fetching, UI controls, SPA navigation handling
- `styles.css` — Panel and UI styles
- `icon16.png`, `icon48.png`, `icon128.png` — Extension icons

---

## Known Limitations

- Subtitles are fetched from `ytInitialPlayerResponse` embedded in the page HTML. If YouTube changes this format, subtitle loading may break.
- Auto-generated captions and manually uploaded tracks are both listed; availability depends on the video.
- The extension only activates on `/watch?v=...` pages, not YouTube Shorts or other YouTube URLs.

---

## Contributing

### Setup

1. Fork this repo and clone your fork.
2. Load the extension in Chrome (see [Installation](#installation) above).

### Making Changes

There is no build step. Edit the source files directly:

- **Logic/behavior** → `content.js`
- **Panel appearance** → `styles.css`

After saving a file, reload the extension to pick up changes:

- Go to `chrome://extensions/`
- Click the **reload** icon (⟳) on the extension card

Then refresh the YouTube tab you're testing on.

### Testing Manually

Open Chrome DevTools (`F12`) on a YouTube video page. The extension logs heavily to the console — all key events are prefixed with `[functionName]`, e.g. `[createSubtitlePanel]`, `[handlePageChange]`.

Scenarios to test after any change:

| Scenario | What to verify |
|---|---|
| Direct page load (`youtube.com/watch?v=...`) | Panel appears, subtitles load |
| Click a video link from YouTube homepage | Page auto-reloads once, then subtitles load |
| Browser back/forward | Panel resets for the new video |
| Language switch via dropdown | New subtitles load without a page reload |
| Resize the panel | Width is saved; persists after refresh |
| Hide → drag Show button → click Show | Panel restores; dragged position is forgotten |
| Video with no subtitles | Panel shows the "No subtitles" message, no crash |
| Video with an ad | Ad banner appears in panel; highlighting resumes after |

### Known Issues to Fix

- `getCaptionTracks()` references undefined variables `i` and `maxRetries` (lines 423, 434 of `content.js`) — these are leftovers from a removed retry loop and will throw a `ReferenceError` if hit.
- The night mode `// TODO` comment (line 233 of `content.js`) suggests a light/dark toggle was planned but never implemented.

### Submitting a PR

Please open an issue first for non-trivial changes so we can discuss the approach. PRs with a brief description of what was tested are appreciated.

---

## License

[MIT](LICENSE) — Free for personal and commercial use.

---

**Note:** This project is not affiliated with or endorsed by YouTube or Google.
