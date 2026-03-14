# Testing Checklist for Claude

Before committing any change to files under `extension/`, verify:

1. No new `ReferenceError`-prone patterns (see `bugs.md` for existing known issues).
2. Any new function follows the `[functionName]` log prefix convention.
3. `localStorage` keys for preferences remain backward-compatible if changed.
4. SPA navigation reload logic is not accidentally removed or duplicated.
