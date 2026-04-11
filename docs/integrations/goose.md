# CodyMaster + Goose Integration Guide

[Goose](https://block.github.io/goose/) is an open-source AI agent with 55,000+ users. CodyMaster adds persistent memory, skill orchestration, and token management to any Goose session.

## Prerequisites

- Goose installed (`pip install goose-ai` or see Goose docs)
- CodyMaster installed (`npm install -g codymaster`)
- A project directory to work in

## Installation

### 1. Install CodyMaster

```bash
npm install -g codymaster
```

### 2. Get the Goose configuration snippet

```bash
cd /path/to/your/project
cm mcp-serve --print-config
```

This outputs:
```json
{
  "id": "codymaster",
  "name": "CodyMaster Intelligence Layer",
  "type": "stdio",
  "cmd": "npx",
  "args": ["codymaster", "mcp-serve", "--project", "/path/to/your/project"]
}
```

### 3. Add to Goose config

Add the extension to your `~/.config/goose/config.yaml`:

```yaml
extensions:
  - id: codymaster
    name: CodyMaster Intelligence Layer
    type: stdio
    cmd: npx
    args:
      - codymaster
      - mcp-serve
      - --project
      - /path/to/your/project
    enabled: true
```

### 4. Restart Goose

Start a new Goose session. CodyMaster tools will appear in the available tools list.

## Testing the Integration

In your Goose session, try:

```
Use cm_query to search for any existing project learnings.
```

Or use the natural language interface:

```
Remember that we use pnpm, not npm, for this project.
```

```
What did we learn about the authentication module?
```

## Available Tools

| Tool | Description |
|---|---|
| `cm_query` | FTS5 search across learnings + decisions |
| `cm_memory_write` | Save a new learning/knowledge |
| `cm_natural` | Natural language interface ("remember X", "forget Y", "what did we learn about Z") |
| `cm_budget_check` | Check token budget before loading large contexts |
| `cm_bus_read` | Read current skill pipeline state |
| `cm_plan` | Get sprint context + next skill hint |
| `cm_deploy` | Deploy workflow hints |

## Troubleshooting

**`cm mcp-serve` not found:**
Run `npm run build` in the CodyMaster project directory first.

**No tools appearing in Goose:**
Check that `enabled: true` is set in your Goose config and restart Goose.

**Memory not persisting:**
Ensure `--project` points to the same directory in each session. Memory is stored in `.cm/context.db`.
