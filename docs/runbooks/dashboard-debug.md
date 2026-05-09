# Dashboard Debug Runbook

## Common Issues

### Dashboard won't start
1. Check if port 6969 is in use: `lsof -i :6969`
2. Check PID file: `cat ~/.codymaster/dashboard.pid`
3. Kill stale process: `cm dashboard stop`

### WebSocket not connecting
1. Verify server is running: `cm dashboard status`
2. Check firewall settings
3. Try `cm dashboard tail` to see if WS events are flowing

### Agent not spawning
1. Verify CLI is installed: `which claude`, `which codex`, etc.
2. Check agent version: agent should support --version
3. Check logs: `cm dashboard tail`

### Data corruption
1. JSON storage: delete `~/.codymaster/kanban.json` to reset
2. SQLite storage: delete `~/.codymaster/dashboard.db` to reset
3. Restart dashboard

### Performance issues
1. Check `/metrics` endpoint for dispatch latency
2. Check concurrent task count
3. Verify GC is running (workdir cleanup)
