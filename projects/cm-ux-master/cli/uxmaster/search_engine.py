#!/usr/bin/env python3
"""
UX-Master Search Engine

BM25-based search across design knowledge base.
Supports 16 domains and 17 technology stacks.
"""

import csv
import json
import re
from collections import defaultdict
from dataclasses import dataclass
from math import log
from pathlib import Path
from typing import Optional


@dataclass
class SearchResult:
    """Single search result."""
    data: dict
    score: float
    source_file: str


class BM25:
    """BM25 ranking algorithm implementation."""
    
    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.corpus: list[list[str]] = []
        self.doc_lengths: list[int] = []
        self.avgdl: float = 0.0
        self.idf: dict[str, float] = {}
        self.doc_freqs: defaultdict[str, int] = defaultdict(int)
        self.N: int = 0
    
    def tokenize(self, text: str) -> list[str]:
        """Tokenize text for indexing."""
        text = re.sub(r'[^\w\s]', ' ', str(text).lower())
        return [w for w in text.split() if len(w) > 2]
    
    def fit(self, documents: list[str]) -> None:
        """Build BM25 index from documents."""
        self.corpus = [self.tokenize(doc) for doc in documents]
        self.N = len(self.corpus)
        
        if self.N == 0:
            return
        
        self.doc_lengths = [len(doc) for doc in self.corpus]
        self.avgdl = sum(self.doc_lengths) / self.N
        
        # Calculate document frequencies
        for doc in self.corpus:
            seen = set()
            for word in doc:
                if word not in seen:
                    self.doc_freqs[word] += 1
                    seen.add(word)
        
        # Calculate IDF scores
        for word, freq in self.doc_freqs.items():
            self.idf[word] = log((self.N - freq + 0.5) / (freq + 0.5) + 1)
    
    def score(self, query: str) -> list[tuple[int, float]]:
        """Score all documents against query."""
        query_tokens = self.tokenize(query)
        scores = []
        
        for idx, doc in enumerate(self.corpus):
            score = 0.0
            doc_len = self.doc_lengths[idx]
            term_freqs: defaultdict[str, int] = defaultdict(int)
            
            for word in doc:
                term_freqs[word] += 1
            
            for token in query_tokens:
                if token in self.idf:
                    tf = term_freqs[token]
                    idf = self.idf[token]
                    numerator = tf * (self.k1 + 1)
                    denominator = tf + self.k1 * (1 - self.b + self.b * doc_len / self.avgdl)
                    score += idf * numerator / denominator
            
            scores.append((idx, score))
        
        return sorted(scores, key=lambda x: x[1], reverse=True)


class SearchEngine:
    """Main search engine for UX-Master knowledge base."""
    
    # Domain configurations
    CSV_CONFIG = {
        "style": {
            "file": "styles.csv",
            "search_cols": ["Style Category", "Keywords", "Best For", "Type"],
            "output_cols": [
                "Style Category", "Type", "Keywords", "Primary Colors", 
                "Effects & Animation", "Best For", "Performance", 
                "Accessibility", "AI Prompt Keywords"
            ]
        },
        "color": {
            "file": "colors.csv",
            "search_cols": ["Product Type", "Notes"],
            "output_cols": [
                "Product Type", "Primary (Hex)", "Secondary (Hex)", 
                "CTA (Hex)", "Background (Hex)", "Text (Hex)", "Notes"
            ]
        },
        "typography": {
            "file": "typography.csv",
            "search_cols": ["Font Pairing Name", "Category", "Mood/Style Keywords", "Best For"],
            "output_cols": [
                "Font Pairing Name", "Category", "Heading Font", "Body Font",
                "Mood/Style Keywords", "Best For", "Google Fonts URL"
            ]
        },
        "product": {
            "file": "products.csv",
            "search_cols": ["Product Type", "Keywords", "Primary Style Recommendation"],
            "output_cols": [
                "Product Type", "Keywords", "Primary Style Recommendation",
                "Secondary Styles", "Landing Page Pattern", "Color Palette Focus"
            ]
        },
        "landing": {
            "file": "landing.csv",
            "search_cols": ["Pattern Name", "Keywords", "Conversion Optimization"],
            "output_cols": [
                "Pattern Name", "Keywords", "Section Order",
                "Primary CTA Placement", "Color Strategy", "Conversion Optimization"
            ]
        },
        "chart": {
            "file": "charts.csv",
            "search_cols": ["Data Type", "Keywords", "Best Chart Type"],
            "output_cols": [
                "Data Type", "Best Chart Type", "Secondary Options",
                "Color Guidance", "Library Recommendation"
            ]
        },
        "ux-laws": {
            "file": "ux-laws.csv",
            "search_cols": ["Law_Name", "Definition", "Product_Type", "Application"],
            "output_cols": [
                "ID", "Law_Name", "Law_Category", "Definition",
                "Product_Type", "Application", "Design_Test_ID", "Severity"
            ]
        },
        "design-tests": {
            "file": "design-tests.csv",
            "search_cols": ["Test_ID", "Target", "Component", "Assertion"],
            "output_cols": [
                "Test_ID", "Target", "Component", "UX_Law_Name", "Assertion",
                "Pass_Criteria", "Fail_Criteria", "Severity", "Test_Method"
            ]
        },
        "ux": {
            "file": "ux-guidelines.csv",
            "search_cols": ["Category", "Issue", "Description"],
            "output_cols": ["Category", "Issue", "Description", "Do", "Don't", "Severity"]
        },
        "animation": {
            "file": "animation.csv",
            "search_cols": ["Pattern", "Use_Case", "Keywords"],
            "output_cols": ["Pattern", "Use_Case", "Duration", "Easing", "CSS_Example"]
        },
        "responsive": {
            "file": "responsive.csv",
            "search_cols": ["Breakpoint", "Target", "Guidelines"],
            "output_cols": ["Breakpoint", "Width", "Target", "Guidelines", "Container"]
        },
        "accessibility": {
            "file": "accessibility-advanced.csv",
            "search_cols": ["WCAG_Criterion", "Description", "Category"],
            "output_cols": ["WCAG_Criterion", "Level", "Description", "How_To_Test", "Common_Issues"]
        },
        "devices": {
            "file": "devices.csv",
            "search_cols": ["Device", "Viewport", "Context"],
            "output_cols": ["Device", "Viewport", "Safe_Area", "Touch_Target", "Context"]
        }
    }
    
    # Stack configurations
    STACK_CONFIG = {
        "html-tailwind": {"file": "stacks/html-tailwind.csv"},
        "react": {"file": "stacks/react.csv"},
        "nextjs": {"file": "stacks/nextjs.csv"},
        "vue": {"file": "stacks/vue.csv"},
        "nuxtjs": {"file": "stacks/nuxtjs.csv"},
        "nuxt-ui": {"file": "stacks/nuxt-ui.csv"},
        "svelte": {"file": "stacks/svelte.csv"},
        "astro": {"file": "stacks/astro.csv"},
        "swiftui": {"file": "stacks/swiftui.csv"},
        "react-native": {"file": "stacks/react-native.csv"},
        "flutter": {"file": "stacks/flutter.csv"},
        "shadcn": {"file": "stacks/shadcn.csv"},
        "jetpack-compose": {"file": "stacks/jetpack-compose.csv"},
        "angular": {"file": "stacks/angular.csv"},
        "htmx": {"file": "stacks/htmx.csv"},
        "electron": {"file": "stacks/electron.csv"},
        "tauri": {"file": "stacks/tauri.csv"}
    }
    
    def __init__(self, data_dir: Optional[Path] = None):
        """Initialize search engine.
        
        Args:
            data_dir: Directory containing CSV files
        """
        if data_dir is None:
            # Try to find data directory relative to package
            self.data_dir = Path(__file__).parent.parent.parent / "data"
        else:
            self.data_dir = Path(data_dir)
        
        self._cache: dict[str, list[dict]] = {}
    
    def _load_csv(self, filepath: Path) -> list[dict]:
        """Load CSV file with caching."""
        cache_key = str(filepath)
        if cache_key not in self._cache:
            with open(filepath, 'r', encoding='utf-8') as f:
                self._cache[cache_key] = list(csv.DictReader(f))
        return self._cache[cache_key]
    
    def search(self, query: str, domain: Optional[str] = None, 
               max_results: int = 3) -> list[dict]:
        """Search a specific domain or auto-detect.
        
        Args:
            query: Search query
            domain: Domain to search (or None for auto-detect)
            max_results: Maximum results to return
            
        Returns:
            List of result dictionaries
        """
        if domain is None:
            domain = self._detect_domain(query)
        
        if domain not in self.CSV_CONFIG:
            raise ValueError(f"Unknown domain: {domain}. Available: {list(self.CSV_CONFIG.keys())}")
        
        config = self.CSV_CONFIG[domain]
        filepath = self.data_dir / config["file"]
        
        if not filepath.exists():
            raise FileNotFoundError(f"Data file not found: {filepath}")
        
        data = self._load_csv(filepath)
        
        # Build documents from search columns
        documents = []
        for row in data:
            doc_text = " ".join(str(row.get(col, "")) for col in config["search_cols"])
            documents.append(doc_text)
        
        # BM25 search
        bm25 = BM25()
        bm25.fit(documents)
        ranked = bm25.score(query)
        
        # Get top results
        results = []
        for idx, score in ranked[:max_results]:
            if score > 0:
                row = data[idx]
                result = {col: row.get(col, "") for col in config["output_cols"]}
                result["_score"] = round(score, 4)
                results.append(result)
        
        return results
    
    def search_stack(self, query: str, stack: str, max_results: int = 3) -> list[dict]:
        """Search stack-specific guidelines.
        
        Args:
            query: Search query
            stack: Technology stack
            max_results: Maximum results to return
        """
        if stack not in self.STACK_CONFIG:
            available = ", ".join(self.STACK_CONFIG.keys())
            raise ValueError(f"Unknown stack: {stack}. Available: {available}")
        
        filepath = self.data_dir / self.STACK_CONFIG[stack]["file"]
        
        if not filepath.exists():
            raise FileNotFoundError(f"Stack file not found: {filepath}")
        
        data = self._load_csv(filepath)
        
        # Search relevant columns
        search_cols = ["Category", "Guideline", "Description", "Do"]
        output_cols = ["Category", "Guideline", "Description", "Do", "Don't", "Code Good", "Severity"]
        
        documents = []
        for row in data:
            doc_text = " ".join(str(row.get(col, "")) for col in search_cols)
            documents.append(doc_text)
        
        bm25 = BM25()
        bm25.fit(documents)
        ranked = bm25.score(query)
        
        results = []
        for idx, score in ranked[:max_results]:
            if score > 0:
                row = data[idx]
                result = {col: row.get(col, "") for col in output_cols if col in row}
                result["_score"] = round(score, 4)
                results.append(result)
        
        return results
    
    def _detect_domain(self, query: str) -> str:
        """Auto-detect the most relevant domain from query."""
        query_lower = query.lower()
        
        domain_keywords = {
            "ux-laws": ["law", "fitts", "hick", "miller", "doherty", "jakob", "pareto", "gestalt"],
            "design-tests": ["test", "validate", "pass", "fail", "criteria", "assertion"],
            "color": ["color", "palette", "hex", "rgb", "hsl", "primary", "secondary"],
            "chart": ["chart", "graph", "visualization", "bar", "pie", "line", "scatter"],
            "landing": ["landing", "page", "hero", "cta", "conversion", "testimonial"],
            "product": ["saas", "ecommerce", "fintech", "healthcare", "dashboard"],
            "style": ["style", "minimal", "glassmorphism", "neumorphism", "brutalism"],
            "typography": ["font", "typography", "serif", "sans", "heading", "body"],
            "animation": ["animation", "transition", "hover", "motion", "ease"],
            "responsive": ["responsive", "breakpoint", "mobile", "tablet", "viewport"],
            "accessibility": ["accessibility", "a11y", "wcag", "screen reader", "contrast"],
            "devices": ["device", "iphone", "android", "viewport", "safe area"]
        }
        
        scores = {
            domain: sum(1 for kw in keywords if kw in query_lower)
            for domain, keywords in domain_keywords.items()
        }
        
        best = max(scores, key=scores.get)
        return best if scores[best] > 0 else "style"
    
    def generate_design_system(self, query: str, project_name: Optional[str] = None,
                              output_format: str = "ascii", persist: bool = False,
                              page: Optional[str] = None) -> str:
        """Generate complete design system recommendation.
        
        This aggregates searches across multiple domains and applies reasoning.
        """
        # Multi-domain search
        domains_to_search = ["product", "style", "color", "landing", "typography"]
        
        search_results = {}
        for domain in domains_to_search:
            try:
                search_results[domain] = self.search(query, domain, max_results=3)
            except Exception:
                search_results[domain] = []
        
        # Get UX Laws and Design Tests for this product type
        ux_laws = self.search(query, "ux-laws", max_results=5)
        design_tests = self.search(query, "design-tests", max_results=3)
        
        # Build design system
        design_system = {
            "project_name": project_name or query.upper(),
            "query": query,
            "pattern": self._extract_pattern(search_results),
            "style": self._extract_style(search_results),
            "colors": self._extract_colors(search_results),
            "typography": self._extract_typography(search_results),
            "ux_laws": ux_laws,
            "design_tests": design_tests
        }
        
        # Format output
        if output_format == "json":
            return json.dumps(design_system, indent=2, ensure_ascii=False)
        elif output_format == "markdown":
            return self._format_markdown(design_system)
        else:
            return self._format_ascii(design_system)
    
    def _extract_pattern(self, results: dict) -> dict:
        """Extract landing page pattern from search results."""
        landing_results = results.get("landing", [])
        if landing_results:
            r = landing_results[0]
            return {
                "name": r.get("Pattern Name", "Hero + Features + CTA"),
                "sections": r.get("Section Order", "Hero > Features > CTA"),
                "cta_placement": r.get("Primary CTA Placement", "Above fold"),
                "conversion": r.get("Conversion Optimization", "")
            }
        return {"name": "Hero + Features + CTA", "sections": "Hero > Features > CTA"}
    
    def _extract_style(self, results: dict) -> dict:
        """Extract style recommendation from search results."""
        style_results = results.get("style", [])
        if style_results:
            r = style_results[0]
            return {
                "name": r.get("Style Category", "Minimalism"),
                "keywords": r.get("Keywords", ""),
                "effects": r.get("Effects & Animation", ""),
                "best_for": r.get("Best For", "")
            }
        return {"name": "Minimalism", "keywords": "", "effects": ""}
    
    def _extract_colors(self, results: dict) -> dict:
        """Extract color palette from search results."""
        color_results = results.get("color", [])
        if color_results:
            r = color_results[0]
            return {
                "primary": r.get("Primary (Hex)", "#2563EB"),
                "secondary": r.get("Secondary (Hex)", "#3B82F6"),
                "cta": r.get("CTA (Hex)", "#F97316"),
                "background": r.get("Background (Hex)", "#F8FAFC"),
                "text": r.get("Text (Hex)", "#1E293B"),
                "notes": r.get("Notes", "")
            }
        return {
            "primary": "#2563EB", "secondary": "#3B82F6",
            "cta": "#F97316", "background": "#F8FAFC", "text": "#1E293B"
        }
    
    def _extract_typography(self, results: dict) -> dict:
        """Extract typography from search results."""
        type_results = results.get("typography", [])
        if type_results:
            r = type_results[0]
            return {
                "heading": r.get("Heading Font", "Inter"),
                "body": r.get("Body Font", "Inter"),
                "mood": r.get("Mood/Style Keywords", ""),
                "best_for": r.get("Best For", ""),
                "google_fonts": r.get("Google Fonts URL", "")
            }
        return {"heading": "Inter", "body": "Inter", "mood": "", "google_fonts": ""}
    
    def _format_ascii(self, ds: dict) -> str:
        """Format design system as ASCII box."""
        width = 80
        lines = []
        
        lines.append("+" + "-" * width + "+")
        lines.append(f"|  UX-MASTER DESIGN SYSTEM: {ds['project_name']}".ljust(width + 1) + "|")
        lines.append("+" + "-" * width + "+")
        
        # Pattern
        pattern = ds['pattern']
        lines.append(f"|  PATTERN: {pattern.get('name', '')}".ljust(width + 1) + "|")
        lines.append(f"|    Sections: {pattern.get('sections', '')}".ljust(width + 1) + "|")
        lines.append("|" + " " * width + "|")
        
        # Style
        style = ds['style']
        lines.append(f"|  STYLE: {style.get('name', '')}".ljust(width + 1) + "|")
        lines.append(f"|    Effects: {style.get('effects', '')}".ljust(width + 1) + "|")
        lines.append("|" + " " * width + "|")
        
        # Colors
        colors = ds['colors']
        lines.append("|  COLORS:".ljust(width + 1) + "|")
        lines.append(f"|    Primary: {colors.get('primary', '')}".ljust(width + 1) + "|")
        lines.append(f"|    CTA: {colors.get('cta', '')}".ljust(width + 1) + "|")
        lines.append("|" + " " * width + "|")
        
        # Typography
        typography = ds['typography']
        lines.append(f"|  TYPOGRAPHY: {typography.get('heading', '')} / {typography.get('body', '')}".ljust(width + 1) + "|")
        lines.append("|" + " " * width + "|")
        
        # UX Laws
        lines.append(f"|  APPLICABLE UX LAWS ({len(ds.get('ux_laws', []))}):".ljust(width + 1) + "|")
        for law in ds.get('ux_laws', [])[:3]:
            law_name = law.get('Law_Name', '')
            lines.append(f"|    • {law_name}".ljust(width + 1) + "|")
        lines.append("|" + " " * width + "|")
        
        # Design Tests
        lines.append(f"|  DESIGN TESTS ({len(ds.get('design_tests', []))}):".ljust(width + 1) + "|")
        for test in ds.get('design_tests', [])[:3]:
            test_name = test.get('Test_ID', '')
            lines.append(f"|    • {test_name}".ljust(width + 1) + "|")
        lines.append("|" + " " * width + "|")
        
        lines.append("+" + "-" * width + "+")
        
        return "\n".join(lines)
    
    def _format_markdown(self, ds: dict) -> str:
        """Format design system as Markdown."""
        lines = []
        lines.append(f"## Design System: {ds['project_name']}")
        lines.append("")
        
        lines.append("### Pattern")
        pattern = ds['pattern']
        lines.append(f"- **Name:** {pattern.get('name', '')}")
        lines.append(f"- **Sections:** {pattern.get('sections', '')}")
        lines.append("")
        
        lines.append("### Style")
        style = ds['style']
        lines.append(f"- **Name:** {style.get('name', '')}")
        lines.append(f"- **Effects:** {style.get('effects', '')}")
        lines.append("")
        
        lines.append("### Colors")
        colors = ds['colors']
        lines.append(f"| Role | Hex |")
        lines.append(f"|------|-----|")
        lines.append(f"| Primary | {colors.get('primary', '')} |")
        lines.append(f"| CTA | {colors.get('cta', '')} |")
        lines.append("")
        
        lines.append("### UX Laws")
        for law in ds.get('ux_laws', []):
            lines.append(f"- **{law.get('Law_Name', '')}**: {law.get('Definition', '')[:100]}...")
        lines.append("")
        
        return "\n".join(lines)
