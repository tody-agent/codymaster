# Migration Guide: JSON to SQLite

## Overview
Starting with CM_EXECUTOR_V2=1, the dashboard uses SQLite instead of JSON for storage.

## Migration Steps
1. Stop the dashboard: `cm dashboard stop`
2. Set the flag: export CM_EXECUTOR_V2=1
3. Start the dashboard: `cm dashboard start`
4. The migration runs automatically on first boot
5. Original file renamed to `data.json.bak`

## Rollback
1. Stop the dashboard
2. Unset the flag: unset CM_EXECUTOR_V2
3. Delete `~/.codymaster/dashboard.db` (if needed)
4. Rename `data.json.bak` back to `data.json` (if needed)
5. Start the dashboard

## What's Preserved
- All projects
- All tasks (with status mapping)
- All activities
- All deployments
- All changelog entries

## What's New
- Transactional writes (no more data loss on concurrent requests)
- WebSocket real-time updates
- Structured request logging
- Prometheus metrics at /metrics
