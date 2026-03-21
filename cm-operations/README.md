# cm-operations

> Operations, deployment, and security skills for AI coding agents.

## Skills (6)

| Skill | Purpose |
|-------|---------|
| `cm-safe-deploy` | Multi-gate deploy pipeline with rollback |
| `cm-identity-guard` | Prevent wrong-account deploys across git/Cloudflare/Supabase |
| `cm-git-worktrees` | Isolated feature branches with smart directory selection |
| `cm-terminal` | Safe terminal execution with output logging |
| `cm-secret-shield` | Defense-in-depth secret scanning and prevention |
| `cm-safe-i18n` | Multi-pass i18n extraction with 8 audit gates |

## Commands (1)

| Command | Description |
|---------|-------------|
| `/deploy` | Safe deployment: test → identity check → stage → verify → production |

## Install

```bash
claude plugin install cm-operations@cody-master
```
