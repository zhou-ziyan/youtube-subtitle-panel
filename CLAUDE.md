@.claude/testing.md

# Key Behaviors

- Subtitles are parsed from `ytInitialPlayerResponse` embedded in the page HTML.
- On YouTube SPA navigation (clicking a video link), the extension triggers one automatic page reload to get fresh player data. This is intentional.
- Preferences saved to `localStorage`: panel width, font size, language, Show-button position.

# Workflow Preferences

- After completing any meaningful update, auto-commit and auto-push directly to `main` without asking for confirmation.
- No pull requests — this is a solo project.

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
