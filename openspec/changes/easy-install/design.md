# Design: Easy MCP Installation

## Context & Technical Approach
Currently, developers installing CodyMaster for Claude Desktop have to manually copy and paste a JSON block into \`claude_desktop_config.json\`. This is error-prone, especially with paths and environments. The README mistakenly referenced a GUI "Plugin Marketplace" for Claude Desktop, which confused users because Claude Desktop requires raw JSON modification (unlike Claude Code CLI).

To fix this, we will add an auto-installer flag to the \`cm mcp-serve\` command.

## Proposed Changes
### src/cli/commands/mcp-serve.ts
- Add \`--install-claude\` option.
- When triggered, automatically locate the \`claude_desktop_config.json\` file:
  - Mac: \`~/Library/Application Support/Claude/claude_desktop_config.json\`
  - Windows: \`%APPDATA%/Claude/claude_desktop_config.json\`
- Read and parse the JSON (create a new object if it doesn't exist).
- Inject \`cm-context\` and \`cm-dashboard\` into the \`mcpServers\` map with absolute paths, using \`process.execPath\` for the node binary and absolute resolved paths for the scripts.
- Write the formatted JSON back to the file and print a success message.

### README.md & README-vi.md
- Remove misleading sections about "Settings -> Plugins" in Claude Desktop.
- Provide the clear command: \`npx codymaster mcp-serve --install-claude\`.

## Verification
- Run \`npx vitest run test/engineering-kit-gate.test.ts\` and \`npm run test:gate:kit\`.
- Execute \`cm mcp-serve --install-claude\` locally and verify that \`claude_desktop_config.json\` has the injected nodes without overwriting user's other configs.
