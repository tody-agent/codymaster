#!/usr/bin/env python3
"""
Landing Page Generator — Create persona-based landing pages from config.

Generates optimized HTML landing pages for each customer persona using
Content Mastery SB7 framework and UX Master design principles.

Usage:
    python3 scripts/landing_generator.py --config content-factory.config.json
    python3 scripts/landing_generator.py --config content-factory.config.json --persona "economic-buyer"
    python3 scripts/landing_generator.py --list
"""

import json
import os
import sys
import argparse
from pathlib import Path
from datetime import datetime


SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_TEMPLATE = """<!DOCTYPE html>
<html lang="{language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <meta name="description" content="{meta_description}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {{
            --primary: {primary_color};
            --secondary: {secondary_color};
            --accent: {accent_color};
            --bg: #0a0e17;
            --bg-card: #1a2332;
            --text: #e2e8f0;
            --text-muted: #94a3b8;
            --radius: 12px;
        }}
        *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{
            font-family: 'Inter', system-ui, sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.7;
            -webkit-font-smoothing: antialiased;
        }}
        .container {{ max-width: 960px; margin: 0 auto; padding: 0 1.5rem; }}

        /* Hero */
        .hero {{
            padding: 5rem 0 3rem;
            text-align: center;
            background: linear-gradient(180deg, rgba(6,182,212,0.05) 0%, transparent 60%);
        }}
        .hero-badge {{
            display: inline-block;
            font-size: 0.75rem;
            font-weight: 600;
            padding: 6px 16px;
            border-radius: 999px;
            background: rgba(6,182,212,0.1);
            color: var(--primary);
            border: 1px solid rgba(6,182,212,0.2);
            margin-bottom: 1.5rem;
        }}
        .hero h1 {{
            font-size: clamp(2rem, 5vw, 3rem);
            font-weight: 800;
            line-height: 1.2;
            margin-bottom: 1.25rem;
            background: linear-gradient(135deg, var(--text) 0%, var(--primary) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }}
        .hero p {{
            font-size: 1.15rem;
            color: var(--text-muted);
            max-width: 600px;
            margin: 0 auto 2rem;
        }}

        /* CTA */
        .cta-btn {{
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-family: inherit;
            font-size: 1rem;
            font-weight: 600;
            padding: 14px 32px;
            border: none;
            border-radius: var(--radius);
            cursor: pointer;
            text-decoration: none;
            transition: all 0.2s ease;
            min-height: 44px;
            min-width: 44px;
        }}
        .cta-primary {{
            background: var(--primary);
            color: #fff;
            box-shadow: 0 4px 20px rgba(6,182,212,0.3);
        }}
        .cta-primary:hover {{ transform: translateY(-2px); box-shadow: 0 6px 30px rgba(6,182,212,0.4); }}
        .cta-secondary {{
            background: transparent;
            color: var(--text);
            border: 1px solid var(--text-muted);
        }}
        .cta-secondary:hover {{ border-color: var(--primary); color: var(--primary); }}
        .cta-group {{ display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }}

        /* Sections */
        .section {{ padding: 4rem 0; }}
        .section-title {{
            font-size: 1.75rem;
            font-weight: 700;
            text-align: center;
            margin-bottom: 0.75rem;
        }}
        .section-subtitle {{
            font-size: 1rem;
            color: var(--text-muted);
            text-align: center;
            max-width: 600px;
            margin: 0 auto 2.5rem;
        }}

        /* Problem Section */
        .problems {{ background: var(--bg-card); border-radius: var(--radius); padding: 2rem; }}
        .problem-item {{
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            padding: 1rem 0;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }}
        .problem-item:last-child {{ border-bottom: none; }}
        .problem-icon {{ font-size: 1.25rem; flex-shrink: 0; margin-top: 2px; }}
        .problem-text {{ color: var(--text-muted); }}
        .problem-text strong {{ color: var(--text); }}

        /* Benefits Grid */
        .benefits-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 1.25rem;
        }}
        .benefit-card {{
            background: var(--bg-card);
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: var(--radius);
            padding: 1.5rem;
            transition: border-color 0.2s;
        }}
        .benefit-card:hover {{ border-color: rgba(6,182,212,0.3); }}
        .benefit-icon {{ font-size: 1.5rem; margin-bottom: 0.75rem; }}
        .benefit-title {{ font-weight: 600; margin-bottom: 0.5rem; }}
        .benefit-desc {{ font-size: 0.9rem; color: var(--text-muted); }}

        /* Social Proof */
        .social-proof {{ text-align: center; }}
        .proof-stats {{
            display: flex;
            justify-content: center;
            gap: 3rem;
            flex-wrap: wrap;
            margin-bottom: 2rem;
        }}
        .proof-stat-number {{ font-size: 2rem; font-weight: 800; color: var(--primary); }}
        .proof-stat-label {{ font-size: 0.85rem; color: var(--text-muted); }}

        /* Steps */
        .steps {{ counter-reset: step; }}
        .step-item {{
            display: flex;
            align-items: flex-start;
            gap: 1.5rem;
            padding: 1.5rem 0;
        }}
        .step-number {{
            counter-increment: step;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: rgba(6,182,212,0.1);
            border: 2px solid var(--primary);
            color: var(--primary);
            font-weight: 700;
            flex-shrink: 0;
        }}
        .step-number::before {{ content: counter(step); }}
        .step-content h3 {{ font-weight: 600; margin-bottom: 0.25rem; }}
        .step-content p {{ color: var(--text-muted); font-size: 0.9rem; }}

        /* CTA Section */
        .cta-section {{
            text-align: center;
            padding: 4rem 2rem;
            background: linear-gradient(135deg, rgba(6,182,212,0.08) 0%, rgba(16,185,129,0.08) 100%);
            border-radius: var(--radius);
            margin: 2rem 0;
        }}
        .cta-section h2 {{ font-size: 1.75rem; margin-bottom: 0.75rem; }}
        .cta-section p {{ color: var(--text-muted); margin-bottom: 1.5rem; }}

        /* Footer */
        .landing-footer {{
            text-align: center;
            padding: 2rem;
            font-size: 0.8rem;
            color: var(--text-muted);
            border-top: 1px solid rgba(255,255,255,0.05);
        }}

        @media (max-width: 640px) {{
            .hero {{ padding: 3rem 0 2rem; }}
            .section {{ padding: 2.5rem 0; }}
            .proof-stats {{ gap: 1.5rem; }}
        }}
    </style>
</head>
<body>
    <section class="hero">
        <div class="container">
            <span class="hero-badge">{badge_text}</span>
            <h1>{headline}</h1>
            <p>{subheadline}</p>
            <div class="cta-group">
                <a href="{cta_url}" class="cta-btn cta-primary">{cta_text}</a>
                <a href="{secondary_cta_url}" class="cta-btn cta-secondary">{secondary_cta_text}</a>
            </div>
        </div>
    </section>

    <section class="section">
        <div class="container">
            <h2 class="section-title">{problem_title}</h2>
            <p class="section-subtitle">{problem_subtitle}</p>
            <div class="problems">
                {problem_items}
            </div>
        </div>
    </section>

    <section class="section">
        <div class="container">
            <h2 class="section-title">{benefits_title}</h2>
            <p class="section-subtitle">{benefits_subtitle}</p>
            <div class="benefits-grid">
                {benefit_cards}
            </div>
        </div>
    </section>

    <section class="section social-proof">
        <div class="container">
            <h2 class="section-title">{proof_title}</h2>
            <div class="proof-stats">
                {proof_stats}
            </div>
        </div>
    </section>

    <section class="section">
        <div class="container">
            <h2 class="section-title">{steps_title}</h2>
            <p class="section-subtitle">{steps_subtitle}</p>
            <div class="steps">
                {step_items}
            </div>
        </div>
    </section>

    <section class="cta-section">
        <div class="container">
            <h2>{final_cta_title}</h2>
            <p>{final_cta_subtitle}</p>
            <a href="{cta_url}" class="cta-btn cta-primary">{cta_text}</a>
        </div>
    </section>

    <footer class="landing-footer">
        <p>&copy; {year} {brand_name}. {footer_text}</p>
    </footer>
</body>
</html>"""


def generate_problem_items(pain_points: list) -> str:
    icons = ["⚡", "🔥", "💸", "⏰", "😤", "📉", "🔒", "❌"]
    items = []
    for i, point in enumerate(pain_points[:6]):
        icon = icons[i % len(icons)]
        items.append(f'''                <div class="problem-item">
                    <span class="problem-icon">{icon}</span>
                    <p class="problem-text"><strong>{point}</strong></p>
                </div>''')
    return "\n".join(items)


def generate_benefit_cards(benefits: list) -> str:
    icons = ["🚀", "💎", "⚡", "🎯", "🔧", "📊"]
    cards = []
    for i, b in enumerate(benefits[:6]):
        icon = icons[i % len(icons)]
        title = b.get("title", b) if isinstance(b, dict) else b
        desc = b.get("description", "") if isinstance(b, dict) else ""
        cards.append(f'''                <div class="benefit-card">
                    <div class="benefit-icon">{icon}</div>
                    <div class="benefit-title">{title}</div>
                    <div class="benefit-desc">{desc}</div>
                </div>''')
    return "\n".join(cards)


def generate_proof_stats(stats: list) -> str:
    items = []
    for stat in stats[:4]:
        number = stat.get("number", "0")
        label = stat.get("label", "")
        items.append(f'''                <div>
                    <div class="proof-stat-number">{number}</div>
                    <div class="proof-stat-label">{label}</div>
                </div>''')
    return "\n".join(items)


def generate_step_items(steps: list) -> str:
    items = []
    for step in steps[:5]:
        title = step.get("title", step) if isinstance(step, dict) else step
        desc = step.get("description", "") if isinstance(step, dict) else ""
        items.append(f'''                <div class="step-item">
                    <div class="step-number"></div>
                    <div class="step-content">
                        <h3>{title}</h3>
                        <p>{desc}</p>
                    </div>
                </div>''')
    return "\n".join(items)


def slugify(text: str) -> str:
    import re
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    return re.sub(r'-+', '-', text).strip('-')


def generate_landing_page(persona: dict, brand: dict, config: dict) -> str:
    """Generate a complete landing page HTML for a persona."""
    colors = brand.get("colors", {})
    language = brand.get("language", config.get("content", {}).get("language", "en"))

    replacements = {
        "language": language,
        "title": persona.get("page_title", f"{brand['name']} — {persona['name']}"),
        "meta_description": persona.get("meta_description", persona.get("subheadline", "")),
        "primary_color": colors.get("primary", "#06b6d4"),
        "secondary_color": colors.get("secondary", "#10b981"),
        "accent_color": colors.get("accent", "#f5f5f5"),
        "badge_text": persona.get("badge", brand.get("slogan", "Welcome")),
        "headline": persona.get("headline", f"Dành cho {persona['name']}"),
        "subheadline": persona.get("subheadline", ""),
        "cta_text": persona.get("cta_text", "Bắt Đầu Ngay"),
        "cta_url": persona.get("cta_url", "#contact"),
        "secondary_cta_text": persona.get("secondary_cta_text", "Tìm Hiểu Thêm"),
        "secondary_cta_url": persona.get("secondary_cta_url", "#benefits"),
        "problem_title": persona.get("problem_title", "Bạn Đang Gặp Phải..."),
        "problem_subtitle": persona.get("problem_subtitle", ""),
        "problem_items": generate_problem_items(persona.get("pain_points", [])),
        "benefits_title": persona.get("benefits_title", "Giải Pháp Cho Bạn"),
        "benefits_subtitle": persona.get("benefits_subtitle", ""),
        "benefit_cards": generate_benefit_cards(persona.get("benefits", [])),
        "proof_title": persona.get("proof_title", "Con Số Nói Lên Tất Cả"),
        "proof_stats": generate_proof_stats(persona.get("social_proof", [])),
        "steps_title": persona.get("steps_title", "Chỉ 3 Bước Đơn Giản"),
        "steps_subtitle": persona.get("steps_subtitle", ""),
        "step_items": generate_step_items(persona.get("steps", [])),
        "final_cta_title": persona.get("final_cta_title", "Sẵn Sàng Bắt Đầu?"),
        "final_cta_subtitle": persona.get("final_cta_subtitle", ""),
        "brand_name": brand["name"],
        "year": datetime.now().year,
        "footer_text": persona.get("footer_text", "All rights reserved."),
    }

    return DEFAULT_TEMPLATE.format(**replacements)


def main():
    parser = argparse.ArgumentParser(description="Landing Page Generator")
    parser.add_argument("--config", required=True, help="Path to config JSON")
    parser.add_argument("--persona", help="Generate for specific persona slug")
    parser.add_argument("--list", action="store_true", help="List all personas")
    parser.add_argument("--output-dir", default="landing-pages", help="Output directory")
    args = parser.parse_args()

    with open(args.config, "r", encoding="utf-8") as f:
        config = json.load(f)

    personas = config.get("personas", [])
    brand = config.get("brand", {})

    if args.list:
        print(f"\n👥 Personas in {config.get('niche', 'unknown')}:")
        for p in personas:
            print(f"  • {p['name']} ({slugify(p['name'])})")
        return

    if not personas:
        print("⚠️ No personas defined in config. Add 'personas' array.")
        print("Example:")
        print(json.dumps({
            "personas": [{
                "name": "Economic Buyer",
                "headline": "Tiết Kiệm 50% Chi Phí Marketing",
                "subheadline": "AI tạo nội dung chuyên nghiệp, nhanh gấp 10x",
                "pain_points": ["Chi phí marketing cao", "Thiếu nhân sự content"],
                "benefits": [{"title": "Tiết kiệm", "description": "Giảm 50% chi phí"}],
                "cta_text": "Dùng Thử Miễn Phí",
            }]
        }, indent=2, ensure_ascii=False))
        return

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    targets = personas
    if args.persona:
        targets = [p for p in personas if slugify(p["name"]) == args.persona]
        if not targets:
            print(f"❌ Persona not found: {args.persona}")
            return

    for persona in targets:
        slug = slugify(persona["name"])
        page_dir = output_dir / slug
        page_dir.mkdir(parents=True, exist_ok=True)

        html = generate_landing_page(persona, brand, config)
        output_path = page_dir / "index.html"
        output_path.write_text(html, encoding="utf-8")
        print(f"  ✅ Generated: {output_path}")

    print(f"\n🎉 Generated {len(targets)} landing page(s) in {output_dir}/")


if __name__ == "__main__":
    main()
