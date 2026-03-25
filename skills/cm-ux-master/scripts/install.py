#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MasterDesign Agent — Multi-Platform Installer

Install ux-master skill for any supported AI coding assistant.

Usage:
    python3 install.py                          # Interactive mode
    python3 install.py --platform amp           # Amp / Claude Code
    python3 install.py --platform cursor        # Cursor
    python3 install.py --platform gemini        # Gemini CLI (Google Antigravity)
    python3 install.py --platform antigravity   # Google Antigravity (VS Code)
    python3 install.py --platform opencode      # OpenCode CLI
    python3 install.py --platform all           # Install for all platforms
    python3 install.py --list                   # Show supported platforms

Options:
    --project-dir DIR    Project directory (default: current directory)
    --global             Install globally (user-level, not project-level)
    --dry-run            Show what would be done without making changes
"""

import argparse
import json
import os
import shutil
import sys
from pathlib import Path
from datetime import datetime

# ============================================================================
# PLATFORM CONFIGURATIONS
# ============================================================================

SKILL_NAME = "ux-master"
SKILL_DESCRIPTION = (
    "Ultimate UI/UX design intelligence (Free Tier). 48 UX Laws, 37 Design Tests, "
    "Design System Extractor. "
    "Use when designing, building, or improving any UI/UX. "
    "Upgrade to Pro for Harvester v3 & Token Mapper: https://ux-master.dev/pro"
)
SKILL_DESCRIPTION_LONG = (
    "UI/UX design intelligence (Free Tier). 67 styles, 96 palettes, 57 font pairings, 48 UX Laws, "
    "37 Design Tests, 25 charts, 13 stacks (React, Next.js, Vue, Svelte, SwiftUI, "
    "React Native, Flutter, Tailwind, shadcn/ui, Astro, Nuxt, Jetpack Compose). "
    "Actions: plan, build, create, design, implement, review, fix, improve, optimize UI/UX code. "
    "Topics: color palette, accessibility, layout, typography, font pairing, "
    "UX laws, design tests, design system extraction. "
    "Upgrade to Pro (Harvester v3, Token Mapper, Design Docs): https://ux-master.dev/pro"
)

PLATFORMS = {
    "amp": {
        "name": "Amp / Claude Code",
        "global_root": "~/.agents/skills",
        "project_root": ".agents/skills",
        "skill_dir": SKILL_NAME,
        "config_file": None,
        "needs_frontmatter": True,
        "quick_reference": True,
        "notes": "Also works with Claude Code (.claude/skills/)",
    },
    "claude": {
        "name": "Claude Code",
        "global_root": "~/.claude/skills",
        "project_root": ".claude/skills",
        "skill_dir": SKILL_NAME,
        "config_file": None,
        "needs_frontmatter": True,
        "quick_reference": True,
        "notes": "Legacy Claude Code path",
    },
    "cursor": {
        "name": "Cursor",
        "global_root": None,
        "project_root": ".cursor/rules",
        "skill_dir": SKILL_NAME,
        "config_file": ".cursorrules",
        "needs_frontmatter": False,
        "quick_reference": False,
        "notes": "Installs skill + adds .cursorrules reference",
    },
    "gemini": {
        "name": "Gemini CLI",
        "global_root": "~/.gemini",
        "project_root": ".gemini",
        "skill_dir": f"skills/{SKILL_NAME}",
        "config_file": "GEMINI.md",
        "needs_frontmatter": True,
        "quick_reference": False,
        "notes": "Google Gemini CLI agent",
    },
    "antigravity": {
        "name": "Google Antigravity (VS Code)",
        "global_root": "~/.gemini/antigravity/skills",
        "project_root": ".gemini/antigravity/skills",
        "skill_dir": SKILL_NAME,
        "config_file": None,
        "needs_frontmatter": True,
        "quick_reference": False,
        "notes": "Google Antigravity extension for VS Code",
    },
    "opencode": {
        "name": "OpenCode CLI",
        "global_root": None,
        "project_root": ".opencode/skills",
        "skill_dir": SKILL_NAME,
        "config_file": "AGENTS.md",
        "needs_frontmatter": True,
        "quick_reference": False,
        "notes": "OpenCode terminal-based AI assistant",
    },
}


# ============================================================================
# SKILL CONTENT GENERATORS
# ============================================================================

def get_skill_root() -> Path:
    """Get the root directory of this skill installation."""
    return Path(__file__).parent.parent


def get_files_to_copy() -> list:
    """Get list of all files to copy (relative to skill root)."""
    root = get_skill_root()
    files = []
    for path in root.rglob("*"):
        if path.is_file():
            rel = path.relative_to(root)
            rel_str = str(rel)
            # Skip installer itself, docs, pycache, DS_Store
            if any(skip in rel_str for skip in ["__pycache__", ".DS_Store", "docs/"]):
                continue
            files.append(rel)
    return files


def generate_skill_md(platform: str) -> str:
    """Generate platform-specific SKILL.md content."""
    config = PLATFORMS[platform]
    script_path = f"{config['skill_dir']}/scripts/search.py" if "/" in config["skill_dir"] else f"scripts/search.py"

    lines = []

    # Frontmatter
    if config["needs_frontmatter"]:
        lines.append("---")
        lines.append(f"name: {SKILL_NAME}")
        if platform in ("amp", "claude"):
            lines.append(f'description: "{SKILL_DESCRIPTION_LONG}"')
        else:
            lines.append(f'description: "{SKILL_DESCRIPTION}"')
        lines.append("---")
        lines.append("")

    # Read original SKILL.md and strip its frontmatter
    original_skill = get_skill_root() / "SKILL.md"
    if original_skill.exists():
        content = original_skill.read_text(encoding="utf-8")
        # Remove frontmatter if present
        if content.startswith("---"):
            parts = content.split("---", 2)
            if len(parts) >= 3:
                content = parts[2].lstrip("\n")

        # Replace script paths for platforms with different directory structures
        if platform in ("gemini", "antigravity"):
            content = content.replace(
                "scripts/search.py",
                f"skills/{SKILL_NAME}/scripts/search.py"
            )
            content = content.replace(
                "scripts/extractor.py",
                f"skills/{SKILL_NAME}/scripts/extractor.py"
            )

        lines.append(content)

    return "\n".join(lines)


def generate_cursorrules(project_dir: Path) -> str:
    """Generate .cursorrules content that references the skill."""
    skill_path = project_dir / ".cursor" / "rules" / SKILL_NAME
    return f"""# MasterDesign Agent Design Intelligence
# Auto-generated by ux-master installer

When user requests UI/UX work (design, build, create, implement, review, fix, improve):

1. ALWAYS run the design system generator first:
   python3 {skill_path}/scripts/search.py "<product_type> <keywords>" --design-system -p "Project"

2. Check applicable UX Laws:
   python3 {skill_path}/scripts/search.py "<product_type>" --domain ux-laws -n 5

3. Get Design Test cases:
   python3 {skill_path}/scripts/search.py "<target>" --domain design-tests -n 5

4. For stack-specific guidelines:
   python3 {skill_path}/scripts/search.py "<keyword>" --stack html-tailwind

5. If design-system/BRAND-SKILL.md exists, ALWAYS read and follow it.
   Brand skill overrides generic style recommendations.

Available domains: product, style, color, typography, landing, chart, ux, icons, react, web, ux-laws, design-tests
Available stacks: html-tailwind, react, nextjs, astro, vue, nuxtjs, nuxt-ui, svelte, swiftui, react-native, flutter, shadcn, jetpack-compose
"""


def generate_gemini_instructions() -> str:
    """Generate GEMINI.md snippet to append."""
    return f"""
## MasterDesign Agent Design Intelligence

When user requests UI/UX work, use the ux-master skill:

```bash
# Generate design system
python3 skills/{SKILL_NAME}/scripts/search.py "<query>" --design-system -p "Project"

# Query UX Laws
python3 skills/{SKILL_NAME}/scripts/search.py "<query>" --domain ux-laws -n 5

# Query Design Tests
python3 skills/{SKILL_NAME}/scripts/search.py "<query>" --domain design-tests -n 5

# Extract from existing site
python3 skills/{SKILL_NAME}/scripts/extractor.py --url "<url>" -p "Brand" --generate-skill --persist
```

Available domains: product, style, color, typography, landing, chart, ux, icons, react, web, ux-laws, design-tests
"""


def generate_agents_md_snippet() -> str:
    """Generate AGENTS.md snippet for OpenCode."""
    return f"""
## MasterDesign Agent Design Intelligence

When user requests UI/UX work (design, build, create, implement, review, fix, improve):

1. Run design system generator:
   `python3 .opencode/skills/{SKILL_NAME}/scripts/search.py "<query>" --design-system -p "Project"`

2. Check UX Laws: `--domain ux-laws`
3. Check Design Tests: `--domain design-tests`
4. Stack guidelines: `--stack <stack>`

Read `.opencode/skills/{SKILL_NAME}/SKILL.md` for full workflow instructions.
"""


# ============================================================================
# INSTALLER
# ============================================================================

class Installer:
    """Multi-platform installer for ux-master skill."""

    def __init__(self, platform: str, project_dir: Path = None, global_install: bool = False, dry_run: bool = False):
        self.platform = platform
        self.config = PLATFORMS[platform]
        self.project_dir = project_dir or Path.cwd()
        self.global_install = global_install
        self.dry_run = dry_run
        self.actions = []

    def get_target_dir(self) -> Path:
        """Get target installation directory."""
        if self.global_install and self.config["global_root"]:
            root = Path(self.config["global_root"]).expanduser()
        else:
            root = self.project_dir / self.config["project_root"]

        return root / self.config["skill_dir"]

    def install(self):
        """Execute installation."""
        target = self.get_target_dir()
        source = get_skill_root()

        print(f"\n{'='*60}")
        print(f"  MasterDesign Agent Installer — {self.config['name']}")
        print(f"{'='*60}")
        print(f"  Source:  {source}")
        print(f"  Target:  {target}")
        print(f"  Mode:    {'Global' if self.global_install else 'Project-level'}")
        if self.dry_run:
            print(f"  ⚠️  DRY RUN — no changes will be made")
        print(f"{'='*60}\n")

        # Step 1: Create target directory
        self._mkdir(target)

        # Step 2: Copy data files
        self._copy_tree(source / "data", target / "data")

        # Step 3: Copy scripts
        self._copy_tree(source / "scripts", target / "scripts")

        # Step 4: Generate platform-specific SKILL.md
        skill_content = generate_skill_md(self.platform)
        self._write_file(target / "SKILL.md", skill_content)

        # Step 5: Platform-specific config
        self._install_platform_config()

        # Summary
        print(f"\n{'='*60}")
        if self.dry_run:
            print(f"  DRY RUN complete — {len(self.actions)} actions would be performed")
        else:
            print(f"  ✅ Installed successfully! ({len(self.actions)} actions)")
        print(f"{'='*60}")

        # Verification command
        self._print_verify_command(target)

    def _install_platform_config(self):
        """Install platform-specific configuration files."""
        if self.platform == "cursor":
            # Add .cursorrules
            rules_file = self.project_dir / ".cursorrules"
            snippet = generate_cursorrules(self.project_dir)
            if rules_file.exists():
                existing = rules_file.read_text(encoding="utf-8") if not self.dry_run else ""
                if SKILL_NAME not in existing:
                    self._append_file(rules_file, snippet)
                    print(f"  📝 Appended MasterDesign Agent rules to .cursorrules")
                else:
                    print(f"  ⏭️  .cursorrules already contains MasterDesign Agent reference")
            else:
                self._write_file(rules_file, snippet)
                print(f"  📝 Created .cursorrules with MasterDesign Agent rules")

        elif self.platform == "gemini":
            # Append to GEMINI.md if exists
            gemini_md = self.project_dir / ".gemini" / "GEMINI.md"
            if not self.global_install:
                gemini_md = self.project_dir / ".gemini" / "GEMINI.md"
            else:
                gemini_md = Path("~/.gemini/GEMINI.md").expanduser()

            snippet = generate_gemini_instructions()
            if gemini_md.exists():
                existing = gemini_md.read_text(encoding="utf-8") if not self.dry_run else ""
                if SKILL_NAME not in existing:
                    self._append_file(gemini_md, snippet)
                    print(f"  📝 Appended MasterDesign Agent instructions to GEMINI.md")
                else:
                    print(f"  ⏭️  GEMINI.md already contains MasterDesign Agent reference")
            else:
                self._write_file(gemini_md, f"# Gemini CLI Configuration\n{snippet}")
                print(f"  📝 Created GEMINI.md with MasterDesign Agent instructions")

        elif self.platform == "opencode":
            # Create/append AGENTS.md
            agents_md = self.project_dir / "AGENTS.md"
            snippet = generate_agents_md_snippet()
            if agents_md.exists():
                existing = agents_md.read_text(encoding="utf-8") if not self.dry_run else ""
                if SKILL_NAME not in existing:
                    self._append_file(agents_md, snippet)
                    print(f"  📝 Appended MasterDesign Agent instructions to AGENTS.md")
                else:
                    print(f"  ⏭️  AGENTS.md already contains MasterDesign Agent reference")
            else:
                self._write_file(agents_md, f"# Agent Instructions\n{snippet}")
                print(f"  📝 Created AGENTS.md with MasterDesign Agent instructions")

    def _print_verify_command(self, target: Path):
        """Print verification command."""
        script = target / "scripts" / "search.py"
        print(f"\n  Verify installation:")
        print(f"  $ python3 {script} \"SaaS\" --domain product -n 1\n")

    def _mkdir(self, path: Path):
        """Create directory."""
        self.actions.append(f"mkdir {path}")
        if not self.dry_run:
            path.mkdir(parents=True, exist_ok=True)
        print(f"  📁 {path}")

    def _copy_tree(self, src: Path, dst: Path):
        """Copy directory tree."""
        if not src.exists():
            print(f"  ⚠️  Source not found: {src}")
            return

        self.actions.append(f"copy {src} → {dst}")
        if not self.dry_run:
            if dst.exists():
                shutil.rmtree(dst)
            shutil.copytree(src, dst, ignore=shutil.ignore_patterns("__pycache__", ".DS_Store"))
        
        # Count files
        count = sum(1 for _ in src.rglob("*") if _.is_file()) if src.exists() else 0
        print(f"  📦 Copied {count} files → {dst.name}/")

    def _write_file(self, path: Path, content: str):
        """Write file."""
        self.actions.append(f"write {path}")
        if not self.dry_run:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8")
        print(f"  ✍️  Written: {path.name}")

    def _append_file(self, path: Path, content: str):
        """Append to file."""
        self.actions.append(f"append {path}")
        if not self.dry_run:
            with open(path, "a", encoding="utf-8") as f:
                f.write("\n" + content)


# ============================================================================
# CLI
# ============================================================================

def list_platforms():
    """Print supported platforms."""
    print(f"\n{'='*60}")
    print(f"  MasterDesign Agent — Supported Platforms")
    print(f"{'='*60}\n")

    for key, config in PLATFORMS.items():
        global_str = f"  Global: {config['global_root']}" if config["global_root"] else ""
        print(f"  {key:14s} │ {config['name']}")
        print(f"  {'':14s} │ Project: {config['project_root']}/{config['skill_dir']}")
        if global_str:
            print(f"  {'':14s} │{global_str}")
        if config["notes"]:
            print(f"  {'':14s} │ Note: {config['notes']}")
        print()


def interactive_select():
    """Interactive platform selection."""
    print(f"\n{'='*60}")
    print(f"  MasterDesign Agent — Interactive Installer")
    print(f"{'='*60}\n")
    print("  Select platform:\n")

    keys = list(PLATFORMS.keys())
    for i, key in enumerate(keys, 1):
        print(f"    {i}. {PLATFORMS[key]['name']:30s} ({key})")
    print(f"    {len(keys)+1}. All platforms")
    print()

    try:
        choice = input("  Enter number (or platform name): ").strip()
    except (EOFError, KeyboardInterrupt):
        print("\n  Cancelled.")
        sys.exit(0)

    if choice.isdigit():
        idx = int(choice) - 1
        if idx == len(keys):
            return "all"
        if 0 <= idx < len(keys):
            return keys[idx]
    elif choice in PLATFORMS:
        return choice
    elif choice.lower() == "all":
        return "all"

    print(f"  ❌ Invalid selection: {choice}")
    sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="MasterDesign Agent — Multi-Platform Installer",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Platforms:
  amp            Amp / Claude Code (~/.agents/skills/)
  claude         Claude Code (~/.claude/skills/)
  cursor         Cursor (.cursor/rules/ + .cursorrules)
  gemini         Gemini CLI (.gemini/skills/)
  antigravity    Google Antigravity (.gemini/antigravity/skills/)
  opencode       OpenCode CLI (.opencode/skills/ + AGENTS.md)
  all            Install for all platforms

Examples:
  python3 install.py --platform amp --global
  python3 install.py --platform cursor
  python3 install.py --platform gemini --global
  python3 install.py --platform all --dry-run
        """
    )
    parser.add_argument("--platform", "-p", choices=list(PLATFORMS.keys()) + ["all"],
                       help="Target platform")
    parser.add_argument("--project-dir", "-d", type=str, default=None,
                       help="Project directory (default: current directory)")
    parser.add_argument("--global", dest="global_install", action="store_true",
                       help="Install globally (user-level)")
    parser.add_argument("--dry-run", action="store_true",
                       help="Show what would be done without making changes")
    parser.add_argument("--list", "-l", action="store_true",
                       help="List supported platforms")

    args = parser.parse_args()

    if args.list:
        list_platforms()
        return

    platform = args.platform
    if not platform:
        platform = interactive_select()

    project_dir = Path(args.project_dir).resolve() if args.project_dir else Path.cwd()

    if platform == "all":
        for p in PLATFORMS:
            installer = Installer(p, project_dir, args.global_install, args.dry_run)
            installer.install()
    else:
        installer = Installer(platform, project_dir, args.global_install, args.dry_run)
        installer.install()


if __name__ == "__main__":
    main()
