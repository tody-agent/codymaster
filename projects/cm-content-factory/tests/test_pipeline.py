"""Tests for pipeline.py — Config loading, validation, hooks, and phase execution."""
import json
import sys
import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock

SCRIPTS_DIR = Path(__file__).resolve().parent.parent / "scripts"
sys.path.insert(0, str(SCRIPTS_DIR))


class TestValidateConfig:
    """Test validate_config() function."""

    def test_valid_config_passes(self, minimal_config):
        """Happy path: valid config returns True."""
        from pipeline import validate_config
        assert validate_config(minimal_config) is True

    def test_missing_niche_fails(self, minimal_config):
        """Missing top-level 'niche' key should fail."""
        from pipeline import validate_config
        del minimal_config["niche"]
        assert validate_config(minimal_config) is False

    def test_missing_brand_name_fails(self, bad_config_missing_brand):
        """Missing brand.name should fail."""
        from pipeline import validate_config
        assert validate_config(bad_config_missing_brand) is False

    def test_missing_sources_type_fails(self, minimal_config):
        """Missing sources.type should fail."""
        from pipeline import validate_config
        del minimal_config["sources"]["type"]
        assert validate_config(minimal_config) is False

    def test_missing_output_content_dir_fails(self, minimal_config):
        """Missing output.content_dir should fail."""
        from pipeline import validate_config
        del minimal_config["output"]["content_dir"]
        assert validate_config(minimal_config) is False

    def test_empty_config_fails(self):
        """Empty dict should fail."""
        from pipeline import validate_config
        assert validate_config({}) is False

    def test_missing_content_article_types_fails(self, minimal_config):
        """Missing content.article_types should fail."""
        from pipeline import validate_config
        del minimal_config["content"]["article_types"]
        assert validate_config(minimal_config) is False


class TestFireHooks:
    """Test fire_hooks() function."""

    def test_no_hooks_returns_silently(self, minimal_config):
        """Config without hooks should not raise."""
        from pipeline import fire_hooks
        # Should not raise
        fire_hooks(minimal_config, "pre_write")

    def test_empty_hooks_returns_silently(self):
        """Config with empty hooks dict should not raise."""
        from pipeline import fire_hooks
        config = {"extensions": {"hooks": {}}}
        fire_hooks(config, "pre_write")

    def test_nonexistent_hook_name_returns_silently(self):
        """Requesting a hook name that doesn't exist should not raise."""
        from pipeline import fire_hooks
        config = {"extensions": {"hooks": {"post_write": ["some_script.py"]}}}
        fire_hooks(config, "pre_audit")  # Different hook name


class TestLoadConfig:
    """Test load_config() function."""

    def test_load_valid_config(self, tmp_project):
        """Should load and return config dict from file."""
        tmp_path, config_path, expected_config = tmp_project
        from pipeline import load_config, CONFIG_FILE

        # Monkey-patch CONFIG_FILE to our temp file
        import pipeline
        original = pipeline.CONFIG_FILE
        pipeline.CONFIG_FILE = config_path
        try:
            result = load_config()
            assert result["niche"] == "test-niche"
            assert result["brand"]["name"] == "Test Brand"
        finally:
            pipeline.CONFIG_FILE = original

    def test_load_missing_config_exits(self, tmp_path):
        """Should sys.exit(1) when config file doesn't exist."""
        import pipeline
        original = pipeline.CONFIG_FILE
        pipeline.CONFIG_FILE = tmp_path / "nonexistent.json"
        try:
            with pytest.raises(SystemExit) as exc_info:
                from pipeline import load_config
                load_config()
            assert exc_info.value.code == 1
        finally:
            pipeline.CONFIG_FILE = original
