#!/usr/bin/env python3
"""
Content Factory Wizard — Interactive project setup.

Asks clarifying questions, generates config, and scaffolds a complete
content project ready for any AI coding agent.

Usage:
    python3 wizard.py                    # Interactive mode
    python3 wizard.py --niche 01         # Pre-select niche
    python3 wizard.py --test             # Self-test
"""

import json
import sys
import os
import shutil
import argparse
from pathlib import Path
from datetime import datetime
from safe_path import safe_resolve

SCRIPT_DIR = Path(__file__).resolve().parent
SKILL_DIR = SCRIPT_DIR.parent
EXAMPLES_DIR = SKILL_DIR / "examples"

NICHES = [
    ("01", "🏠 Real Estate",         "01-real-estate"),
    ("02", "💳 Personal Finance",     "02-personal-finance"),
    ("03", "❤️ Health & Wellness",    "03-health-wellness"),
    ("04", "💻 SaaS/Software",       "04-saas-software"),
    ("05", "⚖️ Legal Services",      "05-legal-services"),
    ("06", "🛡️ Insurance",           "06-insurance"),
    ("07", "🛒 E-commerce/Dropship", "07-ecommerce-dropship"),
    ("08", "🎓 Online Education",    "08-online-education"),
    ("09", "₿ Crypto/DeFi",          "09-crypto-defi"),
    ("10", "💄 Beauty/Skincare",     "10-beauty-skincare"),
    ("11", "🔧 Home Services",       "11-home-services"),
    ("12", "🦷 Dental Clinic",       "12-dental-clinic"),
    ("13", "🐾 Pet Care",            "13-pet-care"),
    ("14", "✈️ Travel",              "14-travel-hospitality"),
    ("15", "🤖 AI/Automation",       "15-ai-automation"),
    ("16", "💒 Wedding/Events",      "16-wedding-events"),
    ("17", "💪 Fitness Coaching",    "17-fitness-coaching"),
    ("18", "🔒 Cybersecurity",       "18-cybersecurity"),
    ("19", "🍳 Food/Restaurant",     "19-food-restaurant"),
    ("20", "☀️ Solar Energy",        "20-solar-energy"),
    ("21", "🔧 Custom",              None),
]

DEPLOY_OPTIONS = [
    ("1", "☁️ Cloudflare Pages", "cloudflare"),
    ("2", "🐙 GitHub Pages",     "github"),
    ("3", "🌐 Netlify",          "netlify"),
    ("4", "⏭ None (local only)", "none"),
]

LANGUAGES = [
    ("1", "🇻🇳 Tiếng Việt", "vi"),
    ("2", "🇺🇸 English",     "en"),
    ("3", "🇯🇵 日本語",       "ja"),
    ("4", "🇰🇷 한국어",       "ko"),
    ("5", "🇨🇳 中文",         "zh"),
]


class Wizard:
    """Interactive project setup wizard."""

    def __init__(self):
        self.answers = {}

    def run(self):
        """Run the interactive wizard."""
        self._print_header()

        # Q1: Niche
        niche = self._ask_niche()
        self.answers["niche"] = niche

        # Q2: Brand
        brand_name = self._ask("? Brand name", default=niche.get("default_brand", "My Brand"))
        slogan = self._ask("? Tagline/Slogan", default=niche.get("default_slogan", ""))
        self.answers["brand_name"] = brand_name
        self.answers["slogan"] = slogan

        # Q3: Language
        lang = self._ask_choice("? Ngôn ngữ / Language", LANGUAGES, default="1")
        self.answers["language"] = lang

        # Q4: Deploy
        deploy = self._ask_choice("? Deploy to", DEPLOY_OPTIONS, default="1")
        self.answers["deploy"] = deploy

        # Q5: Project directory
        project_dir = self._ask("? Project directory", default=f"./{self._slugify(brand_name)}")
        self.answers["project_dir"] = project_dir

        # Confirm
        self._print_confirm()
        proceed = self._ask("? Proceed? (Y/n)", default="Y")
        if proceed.lower() not in ("y", "yes", ""):
            print("\n  ❌ Cancelled")
            return None

        # Generate
        config = self._generate_config()
        # Validate output_dir stays within cwd or is explicitly absolute
        cwd = Path.cwd()
        output_dir = Path(project_dir).resolve()
        try:
            output_dir.relative_to(cwd)
        except ValueError:
            print(f"  ⚠️ Warning: output directory '{output_dir}' is outside current working directory")
            confirm = self._ask("  Continue anyway? (y/N)", default="N")
            if confirm.lower() not in ("y", "yes"):
                print("  ❌ Cancelled")
                return None
        self._write_output(config, output_dir)

        return {
            "config": config,
            "output_dir": str(output_dir),
            "deploy": deploy
        }

    def _print_header(self):
        print(f"\n{'═' * 56}")
        print(f"  🏭 CONTENT FACTORY — Setup Wizard")
        print(f"  Tạo dự án content hoàn chỉnh trong 2 phút")
        print(f"{'═' * 56}\n")

    def _ask_niche(self) -> dict:
        print("  Chọn ngành nghề:")
        print("  ─────────────────")
        for code, label, _ in NICHES:
            print(f"    {code}. {label}")
        print()

        choice = self._ask("? Chọn số (01-21)", default="01")

        # Find selected niche
        selected = None
        for code, label, config_name in NICHES:
            if choice == code:
                selected = (code, label, config_name)
                break

        if not selected:
            selected = NICHES[0]

        code, label, config_name = selected

        if config_name is None:
            # Custom niche
            custom_name = self._ask("? Tên ngành")
            return {
                "id": self._slugify(custom_name),
                "label": custom_name,
                "config_file": None,
                "default_brand": custom_name.title(),
                "default_slogan": ""
            }

        # Load template config
        config_file = EXAMPLES_DIR / f"{config_name}.config.json"
        template = {}
        if config_file.exists():
            with open(config_file) as f:
                template = json.load(f)

        return {
            "id": template.get("niche", config_name),
            "label": label,
            "config_file": str(config_file),
            "template": template,
            "default_brand": template.get("brand", {}).get("name", "My Brand"),
            "default_slogan": template.get("brand", {}).get("slogan", "")
        }

    def _ask_choice(self, prompt: str, options: list, default: str = "1") -> str:
        print()
        for code, label, _ in options:
            marker = " ←" if code == default else ""
            print(f"    {code}. {label}{marker}")
        print()
        choice = self._ask(prompt, default=default)

        for code, label, value in options:
            if choice == code:
                return value
        return options[0][2]

    def _ask(self, prompt: str, default: str = "") -> str:
        default_hint = f" [{default}]" if default else ""
        try:
            answer = input(f"  {prompt}{default_hint}: ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            return default
        return answer if answer else default

    def _print_confirm(self):
        niche = self.answers["niche"]
        print(f"\n{'═' * 56}")
        print(f"  ✅ CONFIRM:")
        print(f"  ─────────────────")
        print(f"  Ngành:   {niche['label']}")
        print(f"  Brand:   {self.answers['brand_name']}")
        print(f"  Slogan:  {self.answers['slogan']}")
        print(f"  Language: {self.answers['language']}")
        print(f"  Deploy:  {self.answers['deploy']}")
        print(f"  Dir:     {self.answers['project_dir']}")
        print(f"{'═' * 56}\n")

    def _generate_config(self) -> dict:
        niche = self.answers["niche"]

        # Start from template if available
        if "template" in niche:
            config = dict(niche["template"])
        else:
            config = {
                "niche": niche["id"],
                "content": {
                    "article_types": [
                        {"id": "guide", "title_template": "{topic_name}: Complete Guide", "category": "guides", "seo_intent": "informational", "tags_base": ["guide"]},
                        {"id": "review", "title_template": "Best {topic_name}: Reviews & Comparison", "category": "reviews", "seo_intent": "commercial", "tags_base": ["review"]},
                        {"id": "how-to", "title_template": "How to {topic_name}: Step-by-Step", "category": "tutorials", "seo_intent": "informational", "tags_base": ["tutorial"]},
                        {"id": "faq", "title_template": "{topic_name}: FAQ & Expert Answers", "category": "faq", "seo_intent": "informational", "tags_base": ["FAQ"]}
                    ],
                    "frontmatter_schema": {"required": ["title", "slug", "description", "category"], "optional": ["date", "author", "tags", "image"]},
                    "word_count": {"min": 1000, "max": 2500},
                    "language": self.answers.get("language", "en")
                },
                "sources": {"type": "manual", "path": "knowledge/"},
                "output": {"content_dir": "content/blog/", "knowledge_dir": "knowledge/", "queue_dir": "topics-queue/"},
                "pipeline": {"concurrency": 3, "ai_provider": "gemini-cli", "auto_validate": True, "auto_publish": False, "git_branch": "main"},
                "audit": {"error_patterns": ["I cannot", "Please provide", "As an AI"], "min_headings": 4, "require_faq": True, "require_cta": True, "require_disclaimer": False},
            }

        # Override with user answers
        config["brand"] = {
            "name": self.answers["brand_name"],
            "slogan": self.answers["slogan"],
            "tone": config.get("brand", {}).get("tone", "professional-friendly"),
            "language": self.answers["language"],
            "colors": config.get("brand", {}).get("colors", {"primary": "#1A1A2E", "secondary": "#E94560", "accent": "#F5F5F5"})
        }

        # Ensure all v2+ sections exist
        config.setdefault("memory", {"enabled": True, "memory_dir": "memory/", "auto_learn": True, "max_episodic_days": 90})
        config.setdefault("research", {"auto_research": True, "search_provider": "browser", "competitor_urls": [], "max_sources_per_topic": 10})
        config.setdefault("scoring", {"reward_praise": 10, "reward_engagement": 5, "reward_first_pass": 3, "penalty_edit": -5, "penalty_delete": -10, "penalty_audit_fail": -3})
        config.setdefault("extensions", {"openclaw": {"enabled": False}, "hooks": {}})

        # Deploy config
        config["deploy"] = {"target": self.answers["deploy"]}

        return config

    def _write_output(self, config: dict, output_dir: Path):
        """Write config and skill files to project directory."""
        output_dir.mkdir(parents=True, exist_ok=True)

        # 1. Write config
        config_path = output_dir / "content-factory.config.json"
        with open(config_path, "w", encoding="utf-8") as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
        print(f"\n  ✅ Config: {config_path}")

        # 2. Copy skill to project
        target_skill = output_dir / ".agents" / "skills" / "content-factory"
        if not target_skill.exists():
            shutil.copytree(SKILL_DIR, target_skill, dirs_exist_ok=True)
            print(f"  ✅ Skill: {target_skill}")

        # 3. Copy workflows
        src_workflows = SKILL_DIR.parent.parent / "workflows"
        target_workflows = output_dir / ".agents" / "workflows"
        if src_workflows.exists() and not target_workflows.exists():
            shutil.copytree(src_workflows, target_workflows, dirs_exist_ok=True)
            print(f"  ✅ Workflows: {target_workflows}")

        # 4. Create content directories
        for d in ["content/blog", "knowledge", "topics-queue", "memory/semantic", "memory/episodic", "memory/working"]:
            (output_dir / d).mkdir(parents=True, exist_ok=True)

        print(f"\n  🎉 Project ready at: {output_dir}")
        print(f"  Next steps:")
        print(f"    cd {output_dir}")
        print(f"    python3 .agents/skills/content-factory/scripts/pipeline.py --status")
        print(f"    # Or use your AI agent: /content-factory")

    def _slugify(self, text: str) -> str:
        import re
        return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')


def main():
    parser = argparse.ArgumentParser(description="Content Factory — Setup Wizard")
    parser.add_argument("--niche", help="Pre-select niche (01-21)")
    parser.add_argument("--test", action="store_true", help="Run self-test")
    parser.add_argument("--list-niches", action="store_true", help="List available niches")
    args = parser.parse_args()

    if args.list_niches:
        print("\n  Available niches:")
        for code, label, config in NICHES:
            print(f"    {code}. {label}")
        return

    if args.test:
        print("🧪 Testing wizard...")
        w = Wizard()
        # Simulate answers
        w.answers = {
            "niche": {"id": "test", "label": "Test Niche", "config_file": None, "default_brand": "Test"},
            "brand_name": "TestBrand",
            "slogan": "Test Slogan",
            "language": "en",
            "deploy": "none",
            "project_dir": "/tmp/content-factory-test"
        }
        config = w._generate_config()
        assert config["brand"]["name"] == "TestBrand"
        assert config["memory"]["enabled"] == True
        assert config["scoring"]["reward_praise"] == 10
        print(f"  ✅ Config generation works ({len(config)} sections)")
        print(f"  ✅ All wizard tests passed!")
        return

    wizard = Wizard()
    result = wizard.run()
    if result:
        print(f"\n  🏭 Setup complete! Your content factory is ready.")


if __name__ == "__main__":
    main()
