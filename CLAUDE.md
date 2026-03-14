@.claude/testing.md

# Key Behaviors

- Subtitles are fetched via a local Node.js server (`server/subtitle-server.mjs` on port 9876) that wraps yt-dlp.
- Extension code is split into 8 focused modules under `extension/`, loaded in dependency order via manifest.json. All scripts share the content script global scope (no bundler).
- Preferences saved to `localStorage`: panel width, font size, language, Show-button position.

# Workflow Preferences

- After completing any meaningful update, auto-commit directly to `main` without asking for confirmation.
- No pull requests — this is a solo project.
- While actively debugging an issue where it's unclear if the fix worked, do not commit until the fix is confirmed.

# Communication

- Always start every response with "Hey Zoey,"

# Memory Files

Every memory file saved to `~/.claude/projects/.../memory/` must use this frontmatter format:

```markdown
---
name: {{memory name}}
description: {{one-line description}}
type: {{user | feedback | project | reference}}
---

{{content — for feedback/project: lead with the rule/fact, then **Why:** and **How to apply:** lines}}
```

After saving a memory file, always update `MEMORY.md` with a pointer entry.

## Plans

Work items (bugs, features, TODOs) go in `memory/plans/` as individual files. Use this template:

```markdown
---
name: {{plan name}}
description: {{one-line summary}}
type: project
---

{{1–2 sentence description of the problem or feature.}}

**Status:** {{Not started | In progress | Done}}

**Location:** `{{file:line}}`

**Why:** {{Root cause or motivation.}}

**Approach:** {{Concrete steps or implementation direction.}}

**How to apply:** {{Guidance for Claude — what to watch out for or assume.}}
```

Update **Status** to `In progress` when starting work, and `Done` when complete.
