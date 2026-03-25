"""Utility functions for UX-Master CLI."""

from .console import console, print_banner, print_success, print_error
from .detect import detect_ai_type, get_ai_type_description

__all__ = [
    "console", "print_banner", "print_success", "print_error",
    "detect_ai_type", "get_ai_type_description"
]
