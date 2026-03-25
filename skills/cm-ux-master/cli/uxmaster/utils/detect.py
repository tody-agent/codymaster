"""AI assistant detection utilities."""

from pathlib import Path
from typing import Optional, Tuple

# AI type descriptions
AI_DESCRIPTIONS = {
    "claude": "Claude Code (Anthropic)",
    "cursor": "Cursor IDE",
    "windsurf": "Windsurf IDE",
    "antigravity": "Antigravity (VS Code extension)",
    "copilot": "GitHub Copilot",
    "kiro": "Kiro (VS Code extension)",
    "opencode": "OpenCode CLI",
    "roocode": "Roo Code (VS Code extension)",
    "codex": "Codex CLI (OpenAI)",
    "qoder": "Qoder IDE",
    "gemini": "Gemini CLI (Google)",
    "trae": "Trae IDE",
    "continue": "Continue (VS Code extension)",
    "codebuddy": "CodeBuddy IDE",
    "droid": "Droid (Factory)",
    "cline": "Cline (VS Code extension)",
}


def detect_ai_type() -> Tuple[list[str], Optional[str]]:
    """Detect which AI assistants are installed.
    
    Returns:
        Tuple of (detected_types, suggested_type)
    """
    detected = []
    suggested = None
    
    # Check for common configuration directories
    cwd = Path.cwd()
    home = Path.home()
    
    # Check current project
    indicators = {
        ".claude": "claude",
        ".cursor": "cursor",
        ".windsurf": "windsurf",
        ".antigravity": "antigravity",
        ".kiro": "kiro",
        ".opencode": "opencode",
        ".roocode": "roocode",
        ".codex": "codex",
        ".qoder": "qoder",
        ".trae": "trae",
        ".continue": "continue",
        ".factory": "droid",
    }
    
    for folder, ai_type in indicators.items():
        if (cwd / folder).exists():
            detected.append(ai_type)
            if suggested is None:
                suggested = ai_type
    
    # Check global configs
    global_indicators = {
        home / ".claude": "claude",
        home / ".cursor": "cursor",
        home / ".config" / "claude": "claude",
    }
    
    for path, ai_type in global_indicators.items():
        if path.exists() and ai_type not in detected:
            detected.append(ai_type)
    
    return detected, suggested


def get_ai_type_description(ai_type: str) -> str:
    """Get human-readable description for AI type."""
    return AI_DESCRIPTIONS.get(ai_type, ai_type.title())


def list_all_ai_types() -> dict[str, str]:
    """List all supported AI types."""
    return AI_DESCRIPTIONS.copy()
