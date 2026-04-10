---

## title: Changelog
description: CodyMaster release history and where to read the authoritative CHANGELOG in the repository.
keywords: codymaster changelog, releases, version history
robots: index, follow

# Changelog

## Authoritative source

The **full, line-by-line changelog** lives at the repository root:

- File: `CHANGELOG.md` (in the `codymaster` repo checkout)
- Remote: [github.com/tody-agent/codymaster](https://github.com/tody-agent/codymaster)

This docs page stays short so it does not drift from the source file.

## Recent highlights (4.7.0)

From `CHANGELOG.md` (April 2026):

- Zero-touch CLI installation improvements (`install.sh`, `scripts/postinstall.js`).
- OpenViking integration path in the installer for vector/graph memory setups.
- Skill chain auto-dispatch enhancements (`cm-skill-chain`).
- Postinstall auto-healing across environments.

## How we version

- Package version: `package.json` → `"version"` (currently `4.7.0`).
- Docs should mention behavior **as implemented in that version**; when in doubt, read the code paths linked from [System architecture](../architecture/system-architecture.md).

## See also

- [Testing and release gates](../quality/testing-and-release.md)  
- [Deployment](../operations/deployment.md)