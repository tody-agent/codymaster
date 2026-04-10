---
title: Open Source Credits
description: Major open-source components used by CodyMaster and how to inspect full license metadata.
keywords: open source credits, licenses, dependencies
robots: index, follow
---

# Open Source Credits

> [!TIP]
> **Authoritative list:** run `npm ls --all` locally and read each package’s `LICENSE` file. This page highlights the **direct** runtime and documentation dependencies declared in `package.json`.

## Runtime dependencies (`dependencies`)


| Package                      | SPDX (typical) | Role                  |
| ---------------------------- | -------------- | --------------------- |
| `commander`                  | MIT            | CLI parsing           |
| `express`                    | MIT            | Dashboard HTTP server |
| `better-sqlite3`             | MIT            | SQLite + FTS storage  |
| `chalk`                      | MIT            | Terminal styling      |
| `prompts` / `@clack/prompts` | MIT            | Interactive prompts   |
| `chokidar`                   | MIT            | File watching         |
| `yaml`                       | ISC            | YAML config parsing   |


## Development & quality (`devDependencies`)


| Package      | Role                                   |
| ------------ | -------------------------------------- |
| `typescript` | Compiler                               |
| `vitest`     | Unit tests                             |
| `playwright` | Browser automation (engineering flows) |
| `vitepress`  | Documentation site build               |
| `jsdom`      | DOM test environment                   |


## CodyMaster itself

- **License:** `ISC` (see `package.json`).
- **Repository:** `https://github.com/tody-agent/codymaster.git`

## See also

- [Changelog](./changelog.md)  
- [Security overview](../operations/security-overview.md)