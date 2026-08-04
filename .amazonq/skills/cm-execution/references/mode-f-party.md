# Mode F — Party (Persona Rotation, single agent)

> One agent, three voices. Cheaper than Mode B, deeper than Mode A.

## When
- Task is non-trivial but small enough for one session.
- You want multi-perspective scrutiny without paying for multiple subagents.
- Quality matters more than raw speed.

## Process
```
1. ARCHITECT   Load agents/architect.md as voice → propose design / approach
                 Append round to .cm/handoff/party.json
2. ENGINEER    Load agents/engineer.md as voice → implement against the design
                 Append round
3. REVIEWER    Load agents/reviewer.md as voice → critique implementation
                 verdict: "pass" | "revise" | "block"
                 Append round
4. (optional)  SECURITY → load when task touches auth/files/subprocess
                 Also load references/security-rules.md
                 Append round
5. SYNTHESIZE  Write final summary and set handoff.emitted_at
```

## Stop Conditions
- Reviewer verdict `pass` → done.
- Reviewer verdict `revise` → loop back to ENGINEER, max 2 revisions.
- Reviewer verdict `block` or 3rd revision → escalate to user, do not ship.

## Output Contract — `.cm/handoff/party.json`
Must match `PartyHandoff` from `src/handoff/contracts.ts`.

```json
{
  "schema": "party@1",
  "emitted_at": "<ISO>",
  "emitted_by": "cm-execution",
  "data": {
    "topic": "<task title>",
    "rounds": [
      { "persona": "architect", "output": "...", "ts": "<ISO>" },
      { "persona": "engineer", "output": "...", "ts": "<ISO>" },
      { "persona": "reviewer", "output": "...", "verdict": "pass", "ts": "<ISO>" }
    ],
    "final": "<one-paragraph synthesis>"
  }
}
```

## Rules
- Never skip the reviewer round.
- Never edit a previous round — append only.
- One agent the whole way — do not dispatch subagents inside party mode.
- Persona files are the source of truth — load them, do not paraphrase them.

## Common Mistakes
| Mistake | Fix |
|---|---|
| Architect and engineer in the same voice | Reload persona between rounds |
| Skipping security on auth/file-touching tasks | Security round is mandatory |
| Reviewer revising more than 2 times | Escalate — that is a planning problem |
