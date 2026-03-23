"""
safe_path — Path traversal prevention utility.

Usage:
    from safe_path import safe_resolve, safe_join

    # Ensure config-driven path stays within project root
    resolved = safe_resolve(project_root, config["output"]["content_dir"])

    # Safe join for building paths from config values
    output_dir = safe_join(project_root, config["output"]["content_dir"])
"""

import os
from pathlib import Path


def safe_resolve(base_dir, user_path: str) -> Path:
    """Resolve user_path relative to base_dir, preventing path traversal.

    Args:
        base_dir: The allowed base directory (str or Path).
        user_path: User/config-provided path (may be relative or absolute).

    Returns:
        Resolved Path object that is within base_dir.

    Raises:
        ValueError: If the resolved path escapes base_dir.
    """
    base = Path(base_dir).resolve()
    resolved = (base / user_path).resolve()

    # Ensure resolved path is within base directory
    try:
        resolved.relative_to(base)
    except ValueError:
        raise ValueError(
            f"Path traversal detected: '{user_path}' resolves outside '{base}'"
        )

    return resolved


def safe_join(base_dir, *parts: str) -> Path:
    """Safely join path parts relative to base_dir.

    Like Path(base_dir) / part1 / part2, but validates the result
    stays within base_dir.
    """
    base = Path(base_dir).resolve()
    result = base
    for part in parts:
        result = result / part
    resolved = result.resolve()

    try:
        resolved.relative_to(base)
    except ValueError:
        raise ValueError(
            f"Path traversal detected: joining {parts} escapes '{base}'"
        )

    return resolved


def safe_open(base_dir, user_path: str, mode: str = "r", **kwargs):
    """Safely open a file, preventing path traversal."""
    resolved = safe_resolve(base_dir, user_path)
    return open(resolved, mode, **kwargs)
