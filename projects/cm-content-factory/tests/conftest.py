"""Shared fixtures for Content Factory tests."""
import json
import os
import tempfile
import pytest
from pathlib import Path


SCRIPTS_DIR = Path(__file__).resolve().parent.parent / "scripts"


@pytest.fixture
def tmp_project(tmp_path):
    """Create a temporary project directory with a valid config."""
    config = {
        "niche": "test-niche",
        "brand": {
            "name": "Test Brand",
            "slogan": "Testing is caring",
            "tone": "professional",
            "language": "en",
            "colors": {"primary": "#1A1A2E", "secondary": "#E94560", "accent": "#F5F5F5"}
        },
        "content": {
            "article_types": [
                {"id": "guide", "title_template": "{topic}: Guide", "category": "guides", "seo_intent": "informational", "tags_base": ["guide"]}
            ],
            "frontmatter_schema": {"required": ["title", "slug"], "optional": ["date", "tags"]},
            "word_count": {"min": 500, "max": 1200},
            "language": "en"
        },
        "sources": {"type": "manual", "path": "knowledge/"},
        "output": {"content_dir": "content/blog/", "knowledge_dir": "knowledge/", "queue_dir": "topics-queue/"},
        "pipeline": {"concurrency": 1, "ai_provider": "gemini-cli", "auto_validate": True},
        "seo": {"title_max_length": 60, "description_max_length": 160},
        "audit": {"error_patterns": ["As an AI"], "min_headings": 3, "require_faq": True, "require_cta": True},
        "memory": {"enabled": True, "memory_dir": "memory/", "auto_learn": True, "max_episodic_days": 90},
        "extensions": {"hooks": {}}
    }
    config_path = tmp_path / "content-factory.config.json"
    config_path.write_text(json.dumps(config, indent=2))
    return tmp_path, config_path, config


@pytest.fixture
def minimal_config():
    """Return a minimal valid config dict."""
    return {
        "niche": "test",
        "brand": {"name": "Test"},
        "content": {"article_types": [{"id": "g", "title_template": "T", "category": "c"}], "frontmatter_schema": {"required": ["title"]}},
        "sources": {"type": "manual", "path": "k/"},
        "output": {"content_dir": "content/"}
    }


@pytest.fixture
def bad_config_missing_brand():
    """Config missing brand.name."""
    return {
        "niche": "test",
        "brand": {},
        "content": {"article_types": []},
        "sources": {"type": "manual", "path": "k/"},
        "output": {"content_dir": "content/"}
    }
