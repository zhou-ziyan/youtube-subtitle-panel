# Known Bugs

- `getCaptionTracks()` references undefined variables `i` and `maxRetries` (lines 423, 434 of `content.js`) — leftovers from a removed retry loop. Will throw `ReferenceError` if the first parse attempt fails.
- Night mode `// TODO` at line 233 of `content.js` — a light/dark toggle was planned but never implemented.
