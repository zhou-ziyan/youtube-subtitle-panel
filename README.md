# YouTube Subtitle Panel Extension

A modern Chrome extension that adds a resizable, always-night-mode subtitle panel to YouTube videos. The panel appears on the right side of the video page, supports language selection, font size controls, and robustly tracks video changes—even with YouTube's single-page navigation.

---

## Features

- 📺 **Subtitle Panel:** Always visible on YouTube video pages, resizable (200–600px), and night mode by default.
- 🌐 **Language Selection:** Choose from all available subtitle tracks, with automatic language preference.
- 🔠 **Font Size Controls:** Adjust subtitle font size, with your preference saved.
- 🔄 **Refresh Button:** Reload the page if subtitles are out of sync.
- 🕹️ **Draggable Show Button:** When hidden, the panel collapses to a draggable "Show" button.
- 🌓 **Ad Detection:** Pauses subtitle highlighting and shows a message when ads are playing.
- 🧠 **Robust:** Handles YouTube's SPA navigation, browser navigation, and video changes.
- 💾 **Persistence:** Remembers your panel width, font size, language, and button position.

---

## Installation

1. **Clone or Download this Repository**
   ```sh
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   ```
   Or download and unzip the code.

2. **Load the Extension in Chrome**
   - Go to `chrome://extensions/`
   - Enable **Developer mode** (top right)
   - Click **Load unpacked**
   - Select this project folder

---

## Usage

1. Go to any YouTube video page (`/watch?v=...`)
2. The subtitle panel will appear on the right.
3. Use the controls to select language, adjust font size, or refresh if needed.
4. Hide the panel with the "Hide" button; restore it with the draggable "Show" button.

---

## Development

- `manifest.json`: Chrome extension manifest
- `content.js`: Main logic (injection, panel, subtitles, events)
- `styles.css`: Panel and UI styles
- `icon48.png`, `icon128.png`: Extension icons

---

## Contributing

Pull requests and suggestions are welcome! Please open an issue or PR if you have ideas or bug reports.

---

## License

[MIT](LICENSE) — Free for personal and commercial use.

---

**Note:**  
This project is not affiliated with or endorsed by YouTube or Google. 