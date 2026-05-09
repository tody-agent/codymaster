"""Tests for memory.py — MemoryEngine 3-layer memory system."""
import json
import sys
import pytest
from pathlib import Path
from datetime import datetime

SCRIPTS_DIR = Path(__file__).resolve().parent.parent / "scripts"
sys.path.insert(0, str(SCRIPTS_DIR))


class TestMemoryEngineInit:
    """Test MemoryEngine initialization."""

    def test_creates_directory_structure(self, tmp_project):
        """Should create semantic/, episodic/, working/ directories."""
        from memory import MemoryEngine
        _, config_path, _ = tmp_project
        engine = MemoryEngine(str(config_path))

        memory_dir = tmp_project[0] / "memory"
        assert (memory_dir / "semantic").is_dir()
        assert (memory_dir / "episodic").is_dir()
        assert (memory_dir / "working").is_dir()

    def test_creates_semantic_files(self, tmp_project):
        """Should initialize default semantic memory files."""
        from memory import MemoryEngine
        _, config_path, _ = tmp_project
        engine = MemoryEngine(str(config_path))

        semantic_dir = tmp_project[0] / "memory" / "semantic"
        assert (semantic_dir / "writing_patterns.json").exists()
        assert (semantic_dir / "seo_patterns.json").exists()
        assert (semantic_dir / "niche_knowledge.json").exists()
        assert (semantic_dir / "mistakes.json").exists()

    def test_creates_working_session(self, tmp_project):
        """Should initialize current_session.json."""
        from memory import MemoryEngine
        _, config_path, _ = tmp_project
        engine = MemoryEngine(str(config_path))

        session_file = tmp_project[0] / "memory" / "working" / "current_session.json"
        assert session_file.exists()


class TestWritingPatterns:
    """Test writing pattern add/update."""

    def test_add_new_pattern(self, tmp_project):
        """Should add a new pattern with default confidence 0.5."""
        from memory import MemoryEngine
        _, config_path, _ = tmp_project
        engine = MemoryEngine(str(config_path))

        engine.add_writing_pattern("test_pattern", {"description": "Use short sentences"})

        data = engine.load_semantic("writing_patterns")
        assert "test_pattern" in data["patterns"]
        assert data["patterns"]["test_pattern"]["confidence"] == 0.5
        assert data["patterns"]["test_pattern"]["applications"] == 1

    def test_update_existing_pattern_increases_confidence(self, tmp_project):
        """Applying same pattern again should increase confidence and applications."""
        from memory import MemoryEngine
        _, config_path, _ = tmp_project
        engine = MemoryEngine(str(config_path))

        engine.add_writing_pattern("p1", {"description": "Be concise"})
        engine.add_writing_pattern("p1", {"description": "Be concise"})

        data = engine.load_semantic("writing_patterns")
        assert data["patterns"]["p1"]["applications"] == 2
        assert data["patterns"]["p1"]["confidence"] == 0.55  # 0.5 + 0.05


class TestWritingContext:
    """Test get_writing_context() aggregation."""

    def test_empty_context_returns_structure(self, tmp_project):
        """Even with no data, should return proper dict structure."""
        from memory import MemoryEngine
        _, config_path, _ = tmp_project
        engine = MemoryEngine(str(config_path))

        ctx = engine.get_writing_context()
        assert "style" in ctx
        assert "top_patterns" in ctx
        assert "avoid" in ctx
        assert "seo_rules" in ctx
        assert "domain_knowledge" in ctx

    def test_context_includes_added_patterns(self, tmp_project):
        """Added patterns should appear in top_patterns."""
        from memory import MemoryEngine
        _, config_path, _ = tmp_project
        engine = MemoryEngine(str(config_path))

        engine.add_writing_pattern("p1", {"description": "Short sentences"})
        ctx = engine.get_writing_context()
        assert len(ctx["top_patterns"]) >= 1


class TestSessionLifecycle:
    """Test session start/end cycle."""

    def test_start_session_returns_id(self, tmp_project):
        """start_session should return a session ID string."""
        from memory import MemoryEngine
        _, config_path, _ = tmp_project
        engine = MemoryEngine(str(config_path))

        sid = engine.start_session(phase="write")
        assert sid.startswith("ses-")
        assert len(sid) > 4

    def test_start_session_creates_working_file(self, tmp_project):
        """Should update current_session.json with new session data."""
        from memory import MemoryEngine
        _, config_path, _ = tmp_project
        engine = MemoryEngine(str(config_path))

        engine.start_session(phase="audit")
        session_file = tmp_project[0] / "memory" / "working" / "current_session.json"
        data = json.loads(session_file.read_text())
        assert data["phase"] == "audit"
        assert data["session_id"].startswith("ses-")
