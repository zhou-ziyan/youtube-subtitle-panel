# Key Behaviors

- Subtitles are parsed from `ytInitialPlayerResponse` embedded in the page HTML.
- On YouTube SPA navigation (clicking a video link), the extension triggers one automatic page reload to get fresh player data. This is intentional.
- Preferences saved to `localStorage`: panel width, font size, language, Show-button position.
