#!/usr/bin/env python3
"""
Deploy — Multi-platform deployment for content factory projects.

Supports: Cloudflare Pages, GitHub Pages, Netlify, Vercel.

Usage:
    python3 deploy.py --config content-factory.config.json
    python3 deploy.py --config content-factory.config.json --target cloudflare
    python3 deploy.py --config content-factory.config.json --dry-run
"""

import json
import sys
import subprocess
import argparse
from pathlib import Path


DEPLOY_COMMANDS = {
    "cloudflare": {
        "build": "npm run build",
        "deploy": "npx wrangler pages deploy ./dist --project-name={slug}",
        "check": "npx wrangler --version"
    },
    "github": {
        "build": "npm run build",
        "deploy": "git add -A && git commit -m 'deploy: auto-publish {date}' && git push origin main",
        "check": "git --version"
    },
    "netlify": {
        "build": "npm run build",
        "deploy": "npx netlify deploy --prod --dir=dist",
        "check": "npx netlify --version"
    },
    "vercel": {
        "build": "npm run build",
        "deploy": "npx vercel deploy --prod ./dist",
        "check": "npx vercel --version"
    }
}


class DeployEngine:
    """Multi-platform deployment engine."""

    def __init__(self, config_path: str):
        with open(config_path, "r", encoding="utf-8") as f:
            self.config = json.load(f)
        self.project_root = Path(config_path).resolve().parent
        self.brand = self.config.get("brand", {})
        self.target = self.config.get("deploy", {}).get("target", "none")

    def deploy(self, target: str = None, dry_run: bool = False):
        """Deploy the project."""
        target = target or self.target
        if target == "none" or target not in DEPLOY_COMMANDS:
            print(f"\n  ⚠️ No deploy target configured.")
            print(f"  Available: cloudflare, github, netlify, vercel")
            print(f"  Set in config: deploy.target")
            return False

        cmds = DEPLOY_COMMANDS[target]
        slug = self.brand.get("name", "site").lower().replace(" ", "-")
        from datetime import datetime
        date = datetime.now().strftime("%Y-%m-%d %H:%M")

        print(f"\n{'═' * 50}")
        print(f"  🚀 DEPLOY to {target.upper()}")
        print(f"  Project: {self.brand.get('name', 'Unknown')}")
        print(f"{'═' * 50}")

        # Step 1: Build
        build_cmd = cmds["build"]
        print(f"\n  📦 Building: {build_cmd}")
        if not dry_run:
            result = subprocess.run(build_cmd, shell=True, cwd=self.project_root, capture_output=True, text=True)
            if result.returncode != 0:
                print(f"  ❌ Build failed: {result.stderr[:200]}")
                return False
            print(f"  ✅ Build success")

        # Step 2: Deploy
        deploy_cmd = cmds["deploy"].format(slug=slug, date=date)
        print(f"\n  🚀 Deploying: {deploy_cmd}")
        if not dry_run:
            result = subprocess.run(deploy_cmd, shell=True, cwd=self.project_root, capture_output=True, text=True)
            if result.returncode != 0:
                print(f"  ❌ Deploy failed: {result.stderr[:200]}")
                return False
            print(f"  ✅ Deployed!")
            if result.stdout:
                # Try to find URL in output
                for line in result.stdout.split('\n'):
                    if 'http' in line.lower():
                        print(f"  🌐 {line.strip()}")
        else:
            print(f"  ⏭️ DRY RUN — skipped")

        return True

    def status(self):
        """Show deploy status."""
        print(f"\n  Deploy target: {self.target}")
        print(f"  Brand: {self.brand.get('name', 'Unknown')}")

        if self.target in DEPLOY_COMMANDS:
            check_cmd = DEPLOY_COMMANDS[self.target]["check"]
            try:
                result = subprocess.run(check_cmd, shell=True, capture_output=True, text=True, timeout=10)
                if result.returncode == 0:
                    print(f"  CLI: ✅ {result.stdout.strip()[:50]}")
                else:
                    print(f"  CLI: ❌ Not installed")
            except Exception:
                print(f"  CLI: ❌ Error checking")

        # Check deploy configs
        configs = {
            "cloudflare": self.project_root / "wrangler.toml",
            "github": self.project_root / ".github/workflows/deploy.yml",
            "netlify": self.project_root / "netlify.toml"
        }
        for name, path in configs.items():
            status = "✅" if path.exists() else "⬜"
            print(f"  {name}: {status} {path.name}")


def main():
    parser = argparse.ArgumentParser(description="Deploy — Multi-platform deployment")
    parser.add_argument("--config", required=True)
    parser.add_argument("--target", choices=["cloudflare", "github", "netlify", "vercel"])
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--status", action="store_true")
    args = parser.parse_args()

    engine = DeployEngine(args.config)

    if args.status:
        engine.status()
    else:
        engine.deploy(target=args.target, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
