#!/usr/bin/env python3
"""
Project Registry — Manages multiple harvested design systems.

Each project lives in output/<slug>/ with:
  ├── manifest.json        # Project metadata + pages scanned
  ├── harvest-raw.json     # Merged raw harvest
  ├── semi-theme-override.css
  ├── figma-tokens.json
  └── design-system.html   # Doc site (Enhancement 3)
"""
import json
import os
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path


OUTPUT_DIR = Path(__file__).parent.parent / "output"


def slugify(name: str) -> str:
    """Convert project name to URL-safe slug."""
    slug = name.lower().strip()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s-]+', '-', slug)
    return slug.strip('-')


class ProjectRegistry:
    """Manages multiple harvested design systems."""

    def __init__(self, output_dir: Path = None):
        self.output_dir = output_dir or OUTPUT_DIR
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def create(self, name: str, url: str) -> dict:
        """Create a new project. Returns ProjectInfo dict."""
        slug = slugify(name)
        project_dir = self.output_dir / slug
        project_dir.mkdir(parents=True, exist_ok=True)

        manifest = {
            "name": name,
            "slug": slug,
            "url": url,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "pages": [],
            "harvest_count": 0,
        }

        self._write_manifest(slug, manifest)
        return manifest

    def get(self, slug: str) -> dict:
        """Get project info by slug. Returns None if not found."""
        manifest_path = self.output_dir / slug / "manifest.json"
        if not manifest_path.exists():
            return None
        with open(manifest_path, "r") as f:
            return json.load(f)

    def list_all(self) -> list:
        """List all registered projects."""
        projects = []
        if not self.output_dir.exists():
            return projects
        for entry in sorted(self.output_dir.iterdir()):
            if entry.is_dir():
                manifest_path = entry / "manifest.json"
                if manifest_path.exists():
                    with open(manifest_path, "r") as f:
                        projects.append(json.load(f))
        return projects

    def add_page_harvest(self, slug: str, page_harvest: dict) -> dict:
        """Add a page harvest to a project. Returns updated manifest."""
        manifest = self.get(slug)
        if manifest is None:
            raise ValueError(f"Project '{slug}' not found")

        # Track page URL
        page_url = page_harvest.get("meta", {}).get("url", "unknown")
        page_entry = {
            "url": page_url,
            "timestamp": page_harvest.get("meta", {}).get("timestamp", ""),
            "title": page_harvest.get("meta", {}).get("title", ""),
        }
        manifest["pages"].append(page_entry)
        manifest["harvest_count"] = len(manifest["pages"])
        manifest["updated_at"] = datetime.now(timezone.utc).isoformat()

        # Save raw harvest for this page
        harvests_dir = self.output_dir / slug / "harvests"
        harvests_dir.mkdir(exist_ok=True)
        harvest_file = harvests_dir / f"page-{manifest['harvest_count']}.json"
        with open(harvest_file, "w") as f:
            json.dump(page_harvest, f, indent=2, ensure_ascii=False)

        # Merge all harvests into single harvest-raw.json
        merged = self._merge_project_harvests(slug)
        merged_path = self.output_dir / slug / "harvest-raw.json"
        with open(merged_path, "w") as f:
            json.dump(merged, f, indent=2, ensure_ascii=False)

        self._write_manifest(slug, manifest)
        return manifest

    def delete(self, slug: str) -> bool:
        """Delete a project directory. Returns True if deleted."""
        project_dir = self.output_dir / slug
        if not project_dir.exists():
            return False
        shutil.rmtree(project_dir)
        return True

    def get_project_dir(self, slug: str) -> Path:
        """Get the output directory path for a project."""
        return self.output_dir / slug

    def get_merged_harvest(self, slug: str) -> dict:
        """Get the merged harvest data for a project."""
        merged_path = self.output_dir / slug / "harvest-raw.json"
        if not merged_path.exists():
            return None
        with open(merged_path, "r") as f:
            return json.load(f)

    def _write_manifest(self, slug: str, manifest: dict):
        """Write manifest.json to project directory."""
        manifest_path = self.output_dir / slug / "manifest.json"
        with open(manifest_path, "w") as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)

    def _merge_project_harvests(self, slug: str) -> dict:
        """Merge all page harvests into a single consolidated harvest."""
        harvests_dir = self.output_dir / slug / "harvests"
        if not harvests_dir.exists():
            return {}

        harvests = []
        for f in sorted(harvests_dir.glob("page-*.json")):
            with open(f, "r") as fp:
                harvests.append(json.load(fp))

        if not harvests:
            return {}
        if len(harvests) == 1:
            return harvests[0]

        # Use harvest_session.merge_harvests if available
        try:
            from harvest_session import merge_harvests
            return merge_harvests(harvests)
        except ImportError:
            # Fallback: use last harvest
            return harvests[-1]


# ============ CLI ============

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Project Registry — Manage design system projects")
    parser.add_argument("--create", metavar="NAME", help="Create a new project")
    parser.add_argument("--url", default="", help="Project source URL (used with --create)")
    parser.add_argument("--list", action="store_true", help="List all projects")
    parser.add_argument("--get", metavar="SLUG", help="Get project info")
    parser.add_argument("--delete", metavar="SLUG", help="Delete a project")
    parser.add_argument("--add-harvest", metavar="SLUG", help="Add harvest to project")
    parser.add_argument("--input", "-i", help="Input JSON file (used with --add-harvest)")

    args = parser.parse_args()
    registry = ProjectRegistry()

    if args.create:
        info = registry.create(args.create, args.url)
        print(f"[OK] Created project '{info['slug']}' at output/{info['slug']}/")
        print(json.dumps(info, indent=2))

    elif args.list:
        projects = registry.list_all()
        if not projects:
            print("No projects found.")
        else:
            print(f"Found {len(projects)} project(s):\n")
            for p in projects:
                pages = p.get("harvest_count", 0)
                print(f"  [{p['slug']}] {p['name']} — {pages} page(s) — {p['url']}")

    elif args.get:
        info = registry.get(args.get)
        if info:
            print(json.dumps(info, indent=2))
        else:
            print(f"Project '{args.get}' not found.")

    elif args.delete:
        if registry.delete(args.delete):
            print(f"[OK] Deleted project '{args.delete}'")
        else:
            print(f"Project '{args.delete}' not found.")

    elif args.add_harvest:
        if not args.input:
            print("Error: --input/-i required with --add-harvest")
        else:
            with open(args.input, "r") as f:
                harvest = json.load(f)
            manifest = registry.add_page_harvest(args.add_harvest, harvest)
            print(f"[OK] Added harvest #{manifest['harvest_count']} to '{args.add_harvest}'")

    else:
        parser.print_help()
