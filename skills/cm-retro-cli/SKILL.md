# cm-retro-cli — operational learnings JSONL

## Append

```bash
cm retro --project . --tool claude --note "Forgot to run gate before push; CI failed on lint."
```

Stored in `.cm/operational-learnings.jsonl`.

## Summary

```bash
cm retro --project . --summary
```

## Use with skill evolution

Feed highlights into **cm-skill-evolution** / project learnings DB so future sessions avoid repeating mistakes.
