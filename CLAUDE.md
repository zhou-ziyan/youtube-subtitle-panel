@.claude/behaviors.md
@.claude/bugs.md
@.claude/testing.md

# Workflow Preferences

- After completing any meaningful update, auto-commit directly to `main` without asking for confirmation.
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
