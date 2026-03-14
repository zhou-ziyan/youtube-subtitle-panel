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

## Prerequisites

The extension relies on a local subtitle server that uses [yt-dlp](https://github.com/yt-dlp/yt-dlp) to download captions.

### 1. Install yt-dlp

```bash
# macOS
brew install yt-dlp

# or via pip
pip install yt-dlp
```

Verify it works:

```bash
yt-dlp --version
```

### 2. Install Node.js

Node.js 18+ is required to run the subtitle server. Download from [nodejs.org](https://nodejs.org/) or:

```bash
brew install node
```

---

## Installation

### Set up the subtitle server

```bash
# Clone or download this repository
git clone <repo-url>
cd subtitle

# Install Node dependencies (only needed once)
npm install
```

### Load the Chrome extension

1. Go to `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select this project folder

---

## Usage

### Step 1: Start the subtitle server

Before opening YouTube, start the server in a terminal:

```bash
node subtitle-server.mjs
```

You should see:

```
[subtitle-server] Running on http://localhost:9876
[subtitle-server] Endpoints:
  GET /langs?v=VIDEO_ID         — list available subtitle languages
  GET /captions?v=VIDEO_ID&lang=en — download captions as srv3 XML
  GET /health                    — health check
```

Keep this terminal open while using the extension.

### Step 2: Use the extension

1. Navigate to any YouTube video (`youtube.com/watch?v=...`).
2. The subtitle panel appears on the right. The page may reload once automatically — this is normal.
3. **Language:** Use the dropdown in the header to switch subtitle language. Your choice is saved.
4. **Font size:** Use `A-` / `A+` in the footer to adjust text size.
5. **Seek:** Click any subtitle line to jump to that point in the video.
6. **Resize:** Drag the left edge of the panel to resize it (200–600px).
7. **Hide/Show:** Click "Hide" to collapse; drag or click the floating "Show" button to restore.
8. **Subtitles not loading?** Make sure the subtitle server is running, then click the ⟳ refresh button in the header.

---

## How It Works

The extension uses a two-part architecture:

1. **Subtitle server** (`subtitle-server.mjs`) — A local Node.js HTTP server on port 9876 that calls `yt-dlp` to download subtitles. This avoids all YouTube API authentication issues since `yt-dlp` handles that internally.

2. **Chrome extension** (`content.js`, `styles.css`) — Injects a subtitle panel into YouTube video pages. When a video loads, the extension requests available languages and caption data from the local server.

```
YouTube page  →  content.js  →  localhost:9876  →  yt-dlp  →  YouTube
                  (UI panel)     (local server)     (CLI)     (captions)
```

---

## File Overview

| File | Purpose |
|---|---|
| `manifest.json` | Chrome extension manifest |
| `content.js` | Extension logic: panel injection, UI controls, SPA navigation |
| `styles.css` | Panel and UI styles |
| `subtitle-server.mjs` | Local HTTP server that fetches subtitles via yt-dlp |
| `icon48.png`, `icon128.png` | Extension icons |

---

## Troubleshooting

| Problem | Solution |
|---|---|
| "Subtitle server not running" error in panel | Start the server: `node subtitle-server.mjs` |
| No subtitles for a specific language | Not all videos have subtitles in all languages. Try `en` or check available languages in the dropdown |
| yt-dlp errors | Update yt-dlp: `pip install -U yt-dlp` or `brew upgrade yt-dlp` |
| Subtitles not updating after navigating to new video | Click the ⟳ refresh button in the panel header |

---

## Known Limitations

- Requires a local server running — the extension alone cannot fetch subtitles due to YouTube API restrictions.
- Auto-generated captions and manually uploaded tracks are both listed; availability depends on the video.
- The extension only activates on `/watch?v=...` pages, not YouTube Shorts or other YouTube URLs.
- First subtitle load for a video may take a few seconds as yt-dlp downloads the data.

---

## License

[MIT](LICENSE) — Free for personal and commercial use.

---

**Note:** This project is not affiliated with or endorsed by YouTube or Google.
