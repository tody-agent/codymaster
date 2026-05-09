# Design: Remove OpenViking From The Default CodyMaster Path

## Context & Technical Approach

The repo currently contains two conflicting stories:

- product-facing surfaces still market OpenViking as a meaningful default capability
- architecture docs already state the current OpenViking package is not production-ready for CodyMaster's required API

This change resolves that mismatch without attempting a risky one-shot backend deletion.

The implementation is intentionally split into a low-risk transition:

1. stop auto-installing OpenViking in installer paths
2. mark `viking` as deprecated experimental in runtime/config guidance
3. rewrite top-level docs and skill instructions so SQLite + FTS5 is the supported default
4. remove stale OpenViking positioning from legacy landing/demo content that users can still browse

## Proposed Changes

### Installer surfaces
- Remove OpenViking installation calls from [install.sh](/Volumes/Data/Skills/codymaster/Cody_Master/install.sh)
- Remove OpenViking installation calls from [scripts/postinstall.js](/Volumes/Data/Skills/codymaster/Cody_Master/scripts/postinstall.js)
- Keep installation focused on the Node-based CodyMaster path

### Runtime behavior
- Update [src/storage-backend.ts](/Volumes/Data/Skills/codymaster/Cody_Master/src/storage-backend.ts) so selecting `storage.backend: viking` emits a deprecation warning
- Update [src/continuity.ts](/Volumes/Data/Skills/codymaster/Cody_Master/src/continuity.ts) config template comments to mark `viking` as deprecated experimental

### Docs and skill guidance
- Rewrite top-level messaging in [README.md](/Volumes/Data/Skills/codymaster/Cody_Master/README.md) and [README-vi.md](/Volumes/Data/Skills/codymaster/Cody_Master/README-vi.md)
- Align supporting docs in `docs/` with the same support statement
- Update key skills that currently recommend switching to OpenViking as a normal workflow
- Rewrite `skills/cm-content-factory/landing/` home copy, translations, and docs so they describe Smart Spine / SQLite memory instead of OpenViking

## Verification

- Targeted tests for `getBackend()` warning behavior pass
- Installer/postinstall no longer attempt `pip install openviking`
- README/docs/skills consistently describe SQLite + FTS5 as the recommended backend
- Legacy landing/demo content no longer markets OpenViking as an active feature
