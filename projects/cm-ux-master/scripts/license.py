#!/usr/bin/env python3
"""
MasterDesign Agent — License Verification Utility

Checks for Pro license via environment variable UX_MASTER_PRO_KEY.
Used by Pro features to gate access and display upgrade prompts.

Usage:
    from license import is_pro, require_pro

    if is_pro():
        # run Pro feature
    else:
        # fallback to Free

    # Or as a decorator/gate:
    require_pro("Token Mapper")  # Prints banner + returns False if not Pro
"""
import os


PRO_URL = "https://ux-master.dev/pro"
ENV_KEY = "UX_MASTER_PRO_KEY"


def is_pro() -> bool:
    """Check if Pro license key is set. Returns True if licensed."""
    return bool(os.environ.get(ENV_KEY, "").strip())


def get_license_key() -> str:
    """Get the license key from environment. Returns empty string if not set."""
    return os.environ.get(ENV_KEY, "").strip()


def require_pro(feature_name: str) -> bool:
    """
    Check Pro license and print upgrade banner if not licensed.
    
    Args:
        feature_name: Name of the Pro feature being accessed
        
    Returns:
        True if licensed, False if not
    """
    if is_pro():
        return True
    
    print_upgrade_banner(feature_name)
    return False


def print_upgrade_banner(feature_name: str):
    """Print a beautiful upgrade banner for a Pro feature."""
    width = 50
    print()
    print("╔" + "═" * width + "╗")
    print("║" + f"  🔒 {feature_name}".ljust(width) + "║")
    print("║" + f"     requires MasterDesign Agent Pro".ljust(width) + "║")
    print("║" + " " * width + "║")
    print("║" + f"  What you get with Pro:".ljust(width) + "║")
    print("║" + f"  • Harvester v3 (80+ tokens)".ljust(width) + "║")
    print("║" + f"  • Token Mapper → CSS/Figma".ljust(width) + "║")
    print("║" + f"  • Design Doc Generator".ljust(width) + "║")
    print("║" + f"  • Multi-Project Registry".ljust(width) + "║")
    print("║" + f"  • Harvest Merge + Compare".ljust(width) + "║")
    print("║" + f"  • Semi MCP Bridge".ljust(width) + "║")
    print("║" + " " * width + "║")
    print("║" + f"  → {PRO_URL}".ljust(width) + "║")
    print("║" + f"  One-time payment. Lifetime access.".ljust(width) + "║")
    print("╚" + "═" * width + "╝")
    print()


if __name__ == "__main__":
    if is_pro():
        key = get_license_key()
        masked = key[:4] + "****" + key[-4:] if len(key) > 8 else "****"
        print(f"✅ MasterDesign Agent Pro licensed: {masked}")
    else:
        print_upgrade_banner("License Check")
