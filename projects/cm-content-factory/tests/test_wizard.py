"""Tests for wizard.py — Config generation and utility functions."""
import json
import sys
import pytest
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent.parent / "scripts"
sys.path.insert(0, str(SCRIPTS_DIR))


class TestSlugify:
    """Test Wizard._slugify() method."""

    def test_basic_slug(self):
        """Should lowercase and replace spaces with hyphens."""
        from wizard import Wizard
        w = Wizard()
        assert w._slugify("Hello World") == "hello-world"

    def test_special_characters(self):
        """Should strip special characters."""
        from wizard import Wizard
        w = Wizard()
        assert w._slugify("Hello! @World #123") == "hello-world-123"

    def test_unicode_text(self):
        """Should handle Vietnamese/unicode text."""
        from wizard import Wizard
        w = Wizard()
        result = w._slugify("Spa Massage Đông Y")
        assert "-" in result or len(result) > 0

    def test_empty_string(self):
        """Should handle empty string."""
        from wizard import Wizard
        w = Wizard()
        assert w._slugify("") == ""

    def test_already_slug(self):
        """Should not change already-slugified text."""
        from wizard import Wizard
        w = Wizard()
        assert w._slugify("hello-world") == "hello-world"

    def test_leading_trailing_special(self):
        """Should strip leading/trailing hyphens."""
        from wizard import Wizard
        w = Wizard()
        assert w._slugify("--hello--") == "hello"


class TestGenerateConfig:
    """Test Wizard._generate_config() method."""

    def test_generates_valid_config(self):
        """Should produce a config with all required keys."""
        from wizard import Wizard
        w = Wizard()
        w.answers = {
            "niche": {"id": "test-niche"},
            "brand_name": "TestBrand",
            "slogan": "Test Slogan",
            "language": "en",
            "deploy": "cloudflare"
        }
        config = w._generate_config()

        assert "niche" in config
        assert "brand" in config
        assert config["brand"]["name"] == "TestBrand"
        assert config["brand"]["slogan"] == "Test Slogan"
        assert "content" in config
        assert "sources" in config
        assert "output" in config

    def test_config_has_memory_section(self):
        """Generated config should include memory settings."""
        from wizard import Wizard
        w = Wizard()
        w.answers = {
            "niche": {"id": "test"},
            "brand_name": "T",
            "slogan": "S",
            "language": "vi",
            "deploy": "none"
        }
        config = w._generate_config()
        assert "memory" in config
        assert config["memory"]["enabled"] is True

    def test_config_has_scoring_section(self):
        """Generated config should include scoring settings."""
        from wizard import Wizard
        w = Wizard()
        w.answers = {
            "niche": {"id": "test"},
            "brand_name": "T",
            "slogan": "S",
            "language": "vi",
            "deploy": "none"
        }
        config = w._generate_config()
        assert "scoring" in config
        assert config["scoring"]["reward_praise"] == 10
        assert config["scoring"]["penalty_delete"] == -10

    def test_config_from_template(self):
        """When niche has a template, should use it as base."""
        from wizard import Wizard
        w = Wizard()
        template = {"niche": "template-niche", "content": {"article_types": []}, "sources": {"type": "url", "path": "/"}, "output": {"content_dir": "c/"}}
        w.answers = {
            "niche": {"id": "templated", "template": template},
            "brand_name": "TB",
            "slogan": "TS",
            "language": "en",
            "deploy": "github"
        }
        config = w._generate_config()
        assert config["brand"]["name"] == "TB"
        assert "deploy" in config
