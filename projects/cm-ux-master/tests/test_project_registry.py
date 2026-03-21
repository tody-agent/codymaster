#!/usr/bin/env python3
"""Tests for project_registry.py — Multi-Project Registry."""
import json
import os
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))

from project_registry import ProjectRegistry, slugify


class TestSlugify(unittest.TestCase):
    """Slug generation from project names."""

    def test_basic_name(self):
        self.assertEqual(slugify("Haravan"), "haravan")

    def test_spaces_to_dashes(self):
        self.assertEqual(slugify("My Project"), "my-project")

    def test_special_chars_removed(self):
        self.assertEqual(slugify("Haravan@2024!"), "haravan2024")

    def test_multiple_spaces(self):
        self.assertEqual(slugify("  My   Project  "), "my-project")

    def test_unicode_stripped(self):
        result = slugify("Café Shop")
        self.assertEqual(result, "caf-shop")


class TestProjectRegistry(unittest.TestCase):
    """CRUD operations on project registry."""

    def setUp(self):
        self.tmp_dir = Path(tempfile.mkdtemp())
        self.registry = ProjectRegistry(output_dir=self.tmp_dir)

    def tearDown(self):
        shutil.rmtree(self.tmp_dir)

    def test_create_project(self):
        info = self.registry.create("Haravan", "https://showcase.myharavan.com")
        self.assertEqual(info["slug"], "haravan")
        self.assertEqual(info["name"], "Haravan")
        self.assertEqual(info["url"], "https://showcase.myharavan.com")
        self.assertEqual(info["harvest_count"], 0)

    def test_create_writes_manifest(self):
        self.registry.create("Test", "https://test.com")
        manifest_path = self.tmp_dir / "test" / "manifest.json"
        self.assertTrue(manifest_path.exists())
        with open(manifest_path) as f:
            data = json.load(f)
        self.assertEqual(data["slug"], "test")

    def test_get_existing_project(self):
        self.registry.create("Demo", "https://demo.com")
        result = self.registry.get("demo")
        self.assertIsNotNone(result)
        self.assertEqual(result["name"], "Demo")

    def test_get_nonexistent_returns_none(self):
        result = self.registry.get("nonexistent")
        self.assertIsNone(result)

    def test_list_all_empty(self):
        projects = self.registry.list_all()
        self.assertEqual(len(projects), 0)

    def test_list_all_with_projects(self):
        self.registry.create("Alpha", "https://a.com")
        self.registry.create("Beta", "https://b.com")
        projects = self.registry.list_all()
        self.assertEqual(len(projects), 2)
        slugs = [p["slug"] for p in projects]
        self.assertIn("alpha", slugs)
        self.assertIn("beta", slugs)

    def test_delete_project(self):
        self.registry.create("ToDelete", "https://x.com")
        self.assertTrue(self.registry.delete("todelete"))
        self.assertIsNone(self.registry.get("todelete"))

    def test_delete_nonexistent_returns_false(self):
        self.assertFalse(self.registry.delete("nope"))

    def test_add_page_harvest(self):
        self.registry.create("Test", "https://test.com")
        harvest = {
            "meta": {"url": "https://test.com/dashboard", "timestamp": "2026-01-01T00:00:00Z", "title": "Dashboard"},
            "colors": {"primary": "rgb(23, 92, 211)"},
            "surfaces": {"app_bg": "rgb(244, 246, 248)"},
            "typography": {},
            "geometry": {}
        }
        manifest = self.registry.add_page_harvest("test", harvest)
        self.assertEqual(manifest["harvest_count"], 1)
        self.assertEqual(len(manifest["pages"]), 1)
        self.assertEqual(manifest["pages"][0]["url"], "https://test.com/dashboard")

    def test_add_multiple_harvests(self):
        self.registry.create("Multi", "https://multi.com")
        for i in range(3):
            harvest = {
                "meta": {"url": f"https://multi.com/page-{i}", "timestamp": "", "title": f"Page {i}"},
                "colors": {"primary": "rgb(0,0,0)"},
                "surfaces": {},
                "typography": {},
                "geometry": {}
            }
            self.registry.add_page_harvest("multi", harvest)
        manifest = self.registry.get("multi")
        self.assertEqual(manifest["harvest_count"], 3)

    def test_add_harvest_to_nonexistent_raises(self):
        with self.assertRaises(ValueError):
            self.registry.add_page_harvest("nope", {"meta": {}})

    def test_merged_harvest_saved(self):
        self.registry.create("Test", "https://test.com")
        harvest = {
            "meta": {"url": "https://test.com", "timestamp": "", "title": "Test"},
            "colors": {"primary": "rgb(0,0,255)"},
            "surfaces": {},
            "typography": {},
            "geometry": {}
        }
        self.registry.add_page_harvest("test", harvest)
        merged = self.registry.get_merged_harvest("test")
        self.assertIsNotNone(merged)
        self.assertIn("colors", merged)

    def test_project_dir_path(self):
        self.registry.create("Demo", "https://demo.com")
        path = self.registry.get_project_dir("demo")
        self.assertEqual(path, self.tmp_dir / "demo")
        self.assertTrue(path.exists())


if __name__ == "__main__":
    unittest.main()
