---
name: cm-qa-visual-cli
description: "Use when you need to take screenshots or run visual QA via the browse daemon CLI."
---
# cm-qa-visual-cli — screenshot via browse daemon

## Prerequisites

`cm browse start` running with the same `CM_BROWSE_TOKEN`.

## CLI

```bash
cm qa-visual --url http://localhost:5173 --port 17395
```

Writes `cm-qa-visual.png` in the current working directory.

## Next

- Diff against golden images for visual regression.
- Map `git diff` → affected routes (project-specific heuristics).
