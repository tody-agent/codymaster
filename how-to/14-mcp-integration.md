# MCP Integration

> Connect Goose, Claude Desktop, Cursor, and other MCP clients. This guide teaches you how to integrate CodyMaster with external AI agents.

## Table of Contents

1. [Overview](#overview)
2. [MCP Basics](#mcp-basics)
3. [Claude Desktop](#claude-desktop)
4. [Goose](#goose)
5. [Cursor](#cursor)
6. [VS Code with Continue](#vs-code-with-continue)
7. [Manual Connection](#manual-connection)
8. [MCP Tools](#mcp-tools)
9. [Troubleshooting](#troubleshooting)

---

## Overview

### What is MCP?

Model Context Protocol (MCP) is a standard for connecting AI agents to external tools and data sources.

### Why Use MCP?

- **Access CodyMaster tools** from any MCP client
- **Share context** between AI agents
- **Extend capabilities** of your favorite AI tool
- **Seamless integration** with existing workflows

### Supported Clients

| Client | Platform | Setup |
|--------|----------|-------|
| **Claude Desktop** | macOS, Windows | JSON config |
| **Goose** | macOS, Linux | YAML config |
| **Cursor** | macOS, Windows, Linux | JSON config |
| **VS Code (Continue)** | macOS, Windows, Linux | JSON config |
| **Any stdio client** | All | Command line |

---

## MCP Basics

### Start MCP Server

```bash
# Start MCP server
cm mcp-serve --project /path/to/your/project

# This exposes 15 MCP tools:
# - cm_memory_read/write/search
# - cm_context_get/advance
# - cm_budget_check
# - cm_skill_resolve
# - cm_natural (plain English memory)
# - And more...
```

### Get Configuration

```bash
# Get config for your client
cm mcp-serve --print-config

# Output:
# Claude Desktop config:
# { "mcpServers": { "codymaster": { ... } }
#
# Goose config:
# extensions:
#   codymaster:
#     cmd: cm
#     args: [...]
```

---

## Claude Desktop

### Step 1: Get Configuration

```bash
cm mcp-serve --print-config --client claude
```

### Step 2: Edit Config File

Open:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

### Step 3: Add Configuration

```json
{
  "mcpServers": {
    "codymaster": {
      "command": "cm",
      "args": [
        "mcp-serve",
        "--project",
        "/path/to/your/project"
      ]
    }
  }
}
```

### Step 4: Restart Claude Desktop

Close and reopen Claude Desktop.

### Step 5: Verify Connection

In Claude Desktop, ask:
```
What tools do you have available?
```

You should see CodyMaster tools listed.

---

## Goose

### Step 1: Get Configuration

```bash
cm mcp-serve --print-config --client goose
```

### Step 2: Edit Config File

Open: `~/.config/goose/config.yaml`

### Step 3: Add Configuration

```yaml
extensions:
  codymaster:
    cmd: cm
    args:
      - mcp-serve
      - --project
      - /path/to/your/project
```

### Step 4: Restart Goose

Close and reopen Goose.

### Step 5: Verify Connection

In Goose, ask:
```
What tools do you have available?
```

You should see CodyMaster tools listed.

---

## Cursor

### Step 1: Get Configuration

```bash
cm mcp-serve --print-config --client cursor
```

### Step 2: Edit Config File

Create/edit:
- Project-level: `.cursor/mcp.json`
- Global: `~/.cursor/mcp.json`

### Step 3: Add Configuration

```json
{
  "mcpServers": {
    "codymaster": {
      "command": "cm",
      "args": [
        "mcp-serve",
        "--project",
        "${workspaceFolder}"
      ]
    }
  }
}
```

### Step 4: Restart Cursor

Close and reopen Cursor.

### Step 5: Verify Connection

In Cursor, open the MCP panel and verify CodyMaster is connected.

---

## VS Code with Continue

### Step 1: Get Configuration

```bash
cm mcp-serve --print-config --client continue
```

### Step 2: Edit Config File

Open: `.continue/config.json` (project-level)

### Step 3: Add Configuration

```json
{
  "mcpServers": [
    {
      "name": "codymaster",
      "command": "cm",
      "args": [
        "mcp-serve",
        "--project",
        "${workspaceFolder}"
      ]
    }
  ]
}
```

### Step 4: Restart VS Code

Close and reopen VS Code.

### Step 5: Verify Connection

In Continue, ask:
```
What tools do you have available?
```

You should see CodyMaster tools listed.

---

## Manual Connection

### Any stdio MCP Client

```bash
# Start MCP server
cm mcp-serve --project /path/to/your/project

# The server communicates via stdio
# Use any MCP client that supports stdio
```

### Test Connection

```bash
# Test with MCP inspector
npx @modelcontextprotocol/inspector cm mcp-serve --project .

# This opens a web UI to test MCP tools
```

---

## MCP Tools

### Available Tools

| Tool | Purpose |
|------|---------|
| `cm_memory_read` | Read from memory |
| `cm_memory_write` | Write to memory |
| `cm_memory_search` | Search memory |
| `cm_context_get` | Get context bus state |
| `cm_context_advance` | Advance chain step |
| `cm_budget_check` | Check token budget |
| `cm_skill_resolve` | Resolve skill |
| `cm_natural` | Natural language memory |
| `cm_query` | FTS5 search |
| `cm_resolve` | Resolve URI |
| `cm_chain_status` | Get chain status |
| `cm_chain_advance` | Advance chain |
| `cm_status` | Get project status |
| `cm_logs` | Get logs |
| `cm_help` | Get help |

### Usage Examples

```bash
# Via MCP in your AI agent

# Save a learning
cm_natural("remember that we use bcrypt for password hashing")

# Retrieve learnings
cm_natural("what did we learn about password hashing?")

# Check context
cm_resolve("cm://pipeline/current")

# Check budget
cm_budget_check(category="implementation", estimated_tokens=5000)

# Get chain status
cm_chain_status("feature-auth")
```

---

## Troubleshooting

### Common Issues

#### "cm: command not found"

```bash
# Check if cm is in PATH
which cm

# If not, add to PATH
export PATH="$(npm config get prefix)/bin:$PATH"

# Or reinstall
npm install -g codymaster
```

#### "MCP server failed to start"

```bash
# Check if port is in use
lsof -i :3000

# Kill existing process
kill -9 $(lsof -t -i :3000)

# Try again
cm mcp-serve --project .
```

#### "Client not connecting"

```bash
# Verify config is correct
cat ~/.config/goose/config.yaml  # Goose
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json  # Claude

# Restart the client
# Try again
```

#### "Tools not showing up"

```bash
# Check MCP server is running
ps aux | grep "cm mcp-serve"

# Check logs
cm logs --tail 50

# Restart client and server
```

### Debug Commands

```bash
# Check MCP server status
cm mcp-serve --status

# Test MCP tools
cm mcp-test

# View MCP logs
cm logs --mcp --tail 50
```

---

## Example: Complete Integration

### Step 1: Setup

```bash
# Install CodyMaster
npm install -g codymaster

# Initialize project
cd your-project
cm init

# Verify
cm doctor
```

### Step 2: Configure Client

```bash
# For Claude Desktop
cm mcp-serve --print-config --client claude

# Copy output to claude_desktop_config.json
```

### Step 3: Restart Client

Close and reopen Claude Desktop.

### Step 4: Test Connection

In Claude Desktop:
```
What tools do you have available?
```

Expected output:
```
I have access to CodyMaster tools:
- cm_memory_read/write/search
- cm_context_get/advance
- cm_budget_check
- cm_skill_resolve
- cm_natural
- And more...
```

### Step 5: Use Tools

In Claude Desktop:
```
Remember that we use bcrypt for password hashing
```

This saves to CodyMaster memory.

Later:
```
What did we learn about password hashing?
```

This retrieves the learning.

---

## Next Steps

- [Knowledge Management](./16-knowledge-management.md) — Advanced knowledge system
- [Skill Chain Automation](./17-skill-chain-automation.md) — Automate workflows
- [Team Collaboration](./13-team-collaboration.md) — Share context with team
