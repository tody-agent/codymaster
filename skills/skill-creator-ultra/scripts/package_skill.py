#!/usr/bin/env python3
"""
package_skill.py — Đóng gói skill thành file .skill (zip) để phân phối.

Adapted from Anthropic's skill-creator package_skill.py.
Standalone version — không dependency ngoài Python stdlib.

Usage:
    python package_skill.py <path/to/skill-folder> [output-directory]

Example:
    python package_skill.py ~/.gemini/antigravity/skills/my-skill
    python package_skill.py ~/.gemini/antigravity/skills/my-skill ./dist
"""

import fnmatch
import sys
import zipfile
import yaml
from pathlib import Path

# Patterns to exclude when packaging
EXCLUDE_DIRS = {"__pycache__", "node_modules", ".git", "evals"}
EXCLUDE_GLOBS = {"*.pyc", "*.pyo"}
EXCLUDE_FILES = {".DS_Store", "Thumbs.db"}


def should_exclude(rel_path: Path) -> bool:
    """Check if a path should be excluded from packaging."""
    parts = rel_path.parts
    if any(part in EXCLUDE_DIRS for part in parts):
        return True
    name = rel_path.name
    if name in EXCLUDE_FILES:
        return True
    return any(fnmatch.fnmatch(name, pat) for pat in EXCLUDE_GLOBS)


def validate_skill(skill_path: Path) -> tuple:
    """
    Validate skill structure — standalone version.
    Returns (is_valid: bool, message: str).
    """
    skill_md = skill_path / "SKILL.md"
    if not skill_md.exists():
        return False, "SKILL.md not found"

    content = skill_md.read_text(encoding="utf-8")

    # Check YAML frontmatter
    if not content.startswith("---"):
        return False, "SKILL.md missing YAML frontmatter (---)"

    try:
        end = content.index("---", 3)
        frontmatter = content[3:end].strip()
        meta = yaml.safe_load(frontmatter)
    except (ValueError, yaml.YAMLError) as e:
        return False, f"Invalid YAML frontmatter: {e}"

    if not meta or not isinstance(meta, dict):
        return False, "YAML frontmatter is empty"

    if "name" not in meta:
        return False, "Missing 'name' in frontmatter"

    if "description" not in meta:
        return False, "Missing 'description' in frontmatter"

    desc = str(meta.get("description", ""))
    if len(desc) < 20:
        return False, f"Description too short ({len(desc)} chars) — minimum 20"

    return True, f"Valid skill: {meta['name']}"


def package_skill(skill_path, output_dir=None):
    """
    Package a skill folder into a .skill file (zip format).

    Args:
        skill_path: Path to the skill folder
        output_dir: Optional output directory (defaults to cwd)

    Returns:
        Path to created .skill file, or None if error
    """
    skill_path = Path(skill_path).resolve()

    if not skill_path.exists():
        print(f"❌ Error: Skill folder not found: {skill_path}")
        return None

    if not skill_path.is_dir():
        print(f"❌ Error: Not a directory: {skill_path}")
        return None

    # Validate before packaging
    print("🔍 Validating skill...")
    valid, message = validate_skill(skill_path)
    if not valid:
        print(f"❌ Validation failed: {message}")
        return None
    print(f"✅ {message}\n")

    # Output location
    skill_name = skill_path.name
    if output_dir:
        output_path = Path(output_dir).resolve()
        output_path.mkdir(parents=True, exist_ok=True)
    else:
        output_path = Path.cwd()

    skill_filename = output_path / f"{skill_name}.skill"

    # Create .skill file (zip)
    try:
        file_count = 0
        with zipfile.ZipFile(skill_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file_path in sorted(skill_path.rglob('*')):
                if not file_path.is_file():
                    continue
                arcname = file_path.relative_to(skill_path.parent)
                if should_exclude(arcname):
                    print(f"  ⏭ Skipped: {arcname}")
                    continue
                zipf.write(file_path, arcname)
                print(f"  📄 Added: {arcname}")
                file_count += 1

        size_kb = skill_filename.stat().st_size / 1024
        print(f"\n✅ Packaged {file_count} files → {skill_filename}")
        print(f"📦 Size: {size_kb:.1f} KB")
        return skill_filename

    except Exception as e:
        print(f"❌ Error creating .skill file: {e}")
        return None


def main():
    if len(sys.argv) < 2:
        print("📦 Skill Packager — Đóng gói skill thành .skill file")
        print()
        print("Usage: python package_skill.py <path/to/skill> [output-dir]")
        print()
        print("Example:")
        print("  python package_skill.py ~/.gemini/antigravity/skills/my-skill")
        print("  python package_skill.py ./my-skill ./dist")
        sys.exit(1)

    skill_path = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else None

    print(f"📦 Packaging skill: {skill_path}")
    if output_dir:
        print(f"   Output: {output_dir}")
    print()

    result = package_skill(skill_path, output_dir)
    sys.exit(0 if result else 1)


if __name__ == '__main__':
    main()
