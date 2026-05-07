---
name: cm-second-opinion-cli
description: "Use when you need a cross-model review or second opinion on a diff or code change."
---
# cm-second-opinion-cli — cross-model review stub

## CLI

```bash
cm second-opinion --file /tmp/my.diff
```

- With `OPENAI_API_KEY`, calls **OpenAI chat completions** (`CM_SECOND_OPINION_MODEL` optional, default `gpt-4o-mini`).
- Without key, prints a **stub** reminder (no network).

## Safety

- **Never** paste secrets or production credentials into the diff file.
- Prefer unified diffs of **application code** only.

## Roadmap

Add Anthropic / Google / Ollama providers via shared provider interface (see **cm-engineering-meta**).
