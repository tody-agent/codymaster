# Design: Codex Plugin Standard for CodyMaster

## Context & Technical Approach

Add a Codex-specific plugin wrapper without changing existing Claude or Cursor packaging.
The Codex plugin should expose the repo's real skills and install surface through:
- `.codex-plugin/plugin.json`
- `.codex-plugin/marketplace.json`
- `.codex-plugin/README.md`

Keep all existing platform directories intact.

## Proposed Changes

### `.codex-plugin/plugin.json`
- Create a Codex-ready manifest using the repo's existing CodyMaster metadata.
- Point `skills` to `./skills/`.
- Keep fields valid for Codex discovery while remaining independent of other platforms.

### `.codex-plugin/marketplace.json`
- Add a Codex marketplace entry for the repo-local plugin.
- Preserve append-only ordering.

### Documentation
- Add a short Codex-specific README explaining the plugin scope and install layout.

## Verification

- Confirm `.claude-plugin/` and `.cursor-plugin/` are unchanged.
- Confirm Codex manifest files exist and are valid JSON.
- Run the repo test gate if the change touches shared install logic.
