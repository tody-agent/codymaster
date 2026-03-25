"""UX-Master CLI - Ultimate UX Design Intelligence."""

__version__ = "2.0.0"
__author__ = "UX Master Team"
__email__ = "hello@ux-master.dev"

from .template_engine import TemplateEngine, PlatformConfig
from .search_engine import SearchEngine

__all__ = ["TemplateEngine", "PlatformConfig", "SearchEngine"]
