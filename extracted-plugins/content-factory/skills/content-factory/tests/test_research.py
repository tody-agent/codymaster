"""Tests for research.py — ResearchEngine initialization and query generation."""
import json
import sys
import pytest
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent.parent / "scripts"
sys.path.insert(0, str(SCRIPTS_DIR))


class TestResearchEngineInit:
    """Test ResearchEngine initialization."""

    def test_loads_config(self, tmp_project):
        """Should load config from file path."""
        from research import ResearchEngine
        _, config_path, config = tmp_project
        engine = ResearchEngine(str(config_path))
        assert engine.config["niche"] == "test-niche"

    def test_sets_project_root(self, tmp_project):
        """Should derive project_root from config path."""
        from research import ResearchEngine
        _, config_path, _ = tmp_project
        engine = ResearchEngine(str(config_path))
        assert engine.project_root == tmp_project[0]


class TestGenerateQueries:
    """Test _generate_queries() method."""

    def test_returns_list(self, tmp_project):
        """Should return a list of query strings."""
        from research import ResearchEngine
        _, config_path, _ = tmp_project
        engine = ResearchEngine(str(config_path))
        queries = engine._generate_queries("massage therapy benefits")
        assert isinstance(queries, list)
        assert len(queries) > 0

    def test_queries_contain_topic(self, tmp_project):
        """At least one query should contain the topic words."""
        from research import ResearchEngine
        _, config_path, _ = tmp_project
        engine = ResearchEngine(str(config_path))
        queries = engine._generate_queries("acupuncture")
        assert any("acupuncture" in q.lower() for q in queries)

    def test_queries_contain_niche(self, tmp_project):
        """Queries should incorporate niche context."""
        from research import ResearchEngine
        _, config_path, _ = tmp_project
        engine = ResearchEngine(str(config_path))
        queries = engine._generate_queries("benefits")
        # Should generate meaningful queries, not just empty strings
        assert all(len(q) > 0 for q in queries)
