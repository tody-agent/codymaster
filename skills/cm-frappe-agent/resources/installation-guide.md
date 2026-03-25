# Frappe Installation & Setup Guide

> Complete reference for installing bench, creating sites, and production deployment.

---

## Prerequisites

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| OS | Ubuntu 22.04 / macOS 13+ | Ubuntu 22.04 LTS |
| Python | 3.10+ | 3.11 |
| Node.js | 18+ | 20 LTS |
| MariaDB | 10.6+ | 10.11 |
| Redis | 6+ | 7+ |
| RAM | 2 GB | 4 GB+ |
| Disk | 20 GB | 40 GB+ |

### Install Prerequisites (Ubuntu)
```bash
# System packages
sudo apt update && sudo apt upgrade -y
sudo apt install -y git python3-dev python3-pip python3-venv \
  redis-server mariadb-server mariadb-client \
  libmysqlclient-dev libffi-dev libssl-dev \
  wkhtmltopdf xvfb nginx supervisor

# Node.js via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
npm install -g yarn

# MariaDB configuration
sudo mysql_secure_installation
```

### Install Prerequisites (macOS)
```bash
# Via Homebrew
brew install python@3.11 node@20 mariadb redis
brew services start mariadb
brew services start redis

npm install -g yarn
```

### MariaDB Configuration
```ini
# /etc/mysql/mariadb.conf.d/50-server.cnf (Ubuntu)
# /opt/homebrew/etc/my.cnf (macOS)

[mysqld]
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
innodb_file_per_table = 1
innodb_large_prefix = 1

[client]
default-character-set = utf8mb4
```

```bash
# Restart MariaDB after config change
sudo systemctl restart mariadb  # Ubuntu
brew services restart mariadb   # macOS
```

---

## Bench Installation

### Install via pip
```bash
pip3 install frappe-bench
```

### Initialize Bench
```bash
# Latest version
bench init frappe-bench --frappe-branch version-15
cd frappe-bench

# Specific version
bench init frappe-bench --frappe-branch version-14
```

### Verify Installation
```bash
bench --version
bench find .  # Should find the bench directory
```

---

## Site Management

### Create New Site
```bash
bench new-site mysite.localhost \
  --mariadb-root-password <root_password> \
  --admin-password <admin_password>

# With PostgreSQL
bench new-site mysite.localhost \
  --db-type postgres \
  --db-host localhost \
  --db-port 5432
```

### Set Default Site
```bash
bench use mysite.localhost
```

### Install Apps on Site
```bash
# Get app from git
bench get-app erpnext --branch version-15
bench get-app https://github.com/user/my-custom-app.git

# Install on site
bench --site mysite.localhost install-app erpnext
bench --site mysite.localhost install-app my_custom_app
```

### Start Development Server
```bash
bench start
# Access at http://mysite.localhost:8000
```

---

## Custom App Development Setup

### Create New App
```bash
bench new-app my_custom_app
# Follow interactive prompts for title, description, etc.
```

### Install on Site
```bash
bench --site mysite.localhost install-app my_custom_app
```

### Development Workflow
```bash
# Watch for changes (auto-rebuild JS/CSS)
bench watch

# Manual build
bench build --app my_custom_app

# Run migrations after schema changes
bench --site mysite.localhost migrate

# Clear cache
bench --site mysite.localhost clear-cache
```

---

## Production Setup

### Setup Production (Ubuntu)
```bash
# Run as root or with sudo
sudo bench setup production <user>

# This configures:
# - Nginx (reverse proxy)
# - Supervisor (process manager)
# - Redis (cache & queue)
# - Fail2ban (security)
```

### Manual Production Setup

#### Nginx Config
```bash
bench setup nginx
sudo ln -s `pwd`/config/nginx.conf /etc/nginx/conf.d/frappe-bench.conf
sudo nginx -t && sudo systemctl reload nginx
```

#### Supervisor Config
```bash
bench setup supervisor
sudo ln -s `pwd`/config/supervisor.conf /etc/supervisor/conf.d/frappe-bench.conf
sudo supervisorctl reread && sudo supervisorctl update
```

#### SSL with Certbot
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d mysite.example.com
```

### Enable Scheduler (Production)
```bash
bench --site mysite.localhost enable-scheduler
```

---

## Docker Setup (Development)

### Using frappe_docker
```bash
git clone https://github.com/frappe/frappe_docker.git
cd frappe_docker

# Development setup
cp example.env .env
docker compose -f compose.yaml \
  -f overrides/compose.noproxy.yaml \
  -f overrides/compose.mariadb.yaml \
  up -d

# Create site
docker compose exec backend \
  bench new-site mysite.localhost --mariadb-root-password 123
```

---

## Common Installation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `ERROR 1698: Access denied for user 'root'` | MariaDB auth method | `sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'password';"` |
| `ModuleNotFoundError: No module named 'frappe'` | Virtualenv not activated | Run from bench directory, or `source env/bin/activate` |
| `error: externally-managed-environment` | PEP 668 on Ubuntu 23+ | Use `pip install --break-system-packages` or use `pipx` |
| `node: command not found` | Node.js not installed | Install via nvm: `nvm install 20` |
| `Redis connection refused` | Redis not running | `sudo systemctl start redis` or `brew services start redis` |
| `wkhtmltopdf not found` | PDF generation dependency | `sudo apt install wkhtmltopdf xvfb` |
| `yarn: command not found` | Yarn not installed | `npm install -g yarn` |
| `bench start` hangs | Port conflict | Check `lsof -i :8000` and kill conflicting process |

---

## Multi-Site Setup

```bash
# Enable DNS-based multi-tenancy
bench config dns_multitenant on

# Create additional sites
bench new-site site2.localhost
bench --site site2.localhost install-app erpnext

# Add to hosts file
echo "127.0.0.1 site2.localhost" | sudo tee -a /etc/hosts
```

---

## Backup & Restore

```bash
# Backup
bench --site mysite.localhost backup --with-files

# List backups
ls sites/mysite.localhost/private/backups/

# Restore
bench --site mysite.localhost restore \
  sites/mysite.localhost/private/backups/<backup>.sql.gz \
  --with-private-files <private.tar> \
  --with-public-files <public.tar>
```

---

## Version Upgrade

```bash
# Update to latest patch
bench update

# Switch major version
bench switch-to-branch version-15 frappe erpnext
bench update --patch
```
