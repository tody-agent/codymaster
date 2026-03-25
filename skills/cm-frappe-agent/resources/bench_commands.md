# Bench Commands Quick Reference

## Development

| Command | Purpose |
|---------|---------|
| `bench new-app my_app` | Create new custom app |
| `bench --site mysite install-app my_app` | Install app on site |
| `bench --site mysite set-config developer_mode 1` | Enable dev mode |
| `bench start` | Start local dev server |
| `bench --site mysite migrate` | Run migrations (after DocType changes) |
| `bench build --app my_app` | Build JS/CSS assets |
| `bench --site mysite clear-cache` | Clear server cache |
| `bench --site mysite clear-website-cache` | Clear website cache |

## Testing

| Command | Purpose |
|---------|---------|
| `bench --site mysite run-tests --app my_app` | Run Frappe tests |
| `python -m pytest apps/my_app/my_app/tests/ -v` | Run standalone pytest |
| `bench --site mysite console` | Open Python console |

## Fixtures

| Command | Purpose |
|---------|---------|
| `bench --site mysite export-fixtures --app my_app` | Export fixtures |
| `bench --site mysite import-doc path/to/fixture.json` | Import single fixture |

## Database

| Command | Purpose |
|---------|---------|
| `bench --site mysite backup` | Backup database |
| `bench --site mysite restore path/to/backup.sql.gz` | Restore backup |
| `bench --site mysite mariadb` | Open MariaDB shell |

## Site Management

| Command | Purpose |
|---------|---------|
| `bench new-site mysite` | Create new site |
| `bench --site mysite reinstall` | ⚠️ Reinstall (DESTROYS DATA) |
| `bench drop-site mysite` | ⚠️ Delete site completely |

## Deployment

| Command | Purpose |
|---------|---------|
| `bench --site mysite set-config maintenance_mode 1` | Enable maintenance |
| `bench --site mysite set-config maintenance_mode 0` | Disable maintenance |
| `bench setup nginx` | Generate nginx config |
| `bench setup supervisor` | Generate supervisor config |
| `sudo bench setup production` | Setup production mode |

## Debug

| Command | Purpose |
|---------|---------|
| `bench --site mysite doctor` | Check site health |
| `bench --site mysite show-config` | Show site config |
| `tail -f logs/worker.error.log` | Watch error logs |
| `tail -f logs/frappe.log` | Watch frappe logs |

## Scheduler

| Command | Purpose |
|---------|---------|
| `bench --site mysite enable-scheduler` | Enable scheduler |
| `bench --site mysite disable-scheduler` | Disable scheduler |
| `bench --site mysite execute my_app.tasks.monthly.run_monthly` | Run task manually |
| `bench --site mysite scheduler get-all` | List scheduled jobs |
