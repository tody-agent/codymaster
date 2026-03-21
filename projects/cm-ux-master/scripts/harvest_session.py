#!/usr/bin/env python3
"""
Harvest Session — Merge multiple page harvests into consolidated tokens.

When scanning multiple pages of the same site, each page may reveal different
tokens (e.g., success/danger colors only on order pages, form styles on settings).
This module merges them using voting/frequency strategies and calculates
confidence scores for each token.
"""
import json
from collections import Counter


def merge_harvests(harvests: list) -> dict:
    """Merge multiple page harvests into a single consolidated harvest.

    Strategy:
      - meta: use first harvest's meta, add page_count
      - colors: most frequent value per key (voting)
      - surfaces: union of all found, most frequent value per key
      - typography: first non-empty value per key (body page wins)
      - geometry: most frequent value per key (mode)
    """
    if not harvests:
        return {}
    if len(harvests) == 1:
        return harvests[0]

    # Detect v3
    is_v3 = any(h.get("_version", 1) >= 3 for h in harvests)

    merged = {
        "meta": _merge_meta(harvests),
        "colors": _merge_section(harvests, "colors"),
        "surfaces": _merge_section(harvests, "surfaces"),
        "typography": _merge_section(harvests, "typography"),
        "geometry": _merge_section(harvests, "geometry"),
    }

    if is_v3:
        merged["_version"] = 3
        merged["neutrals"] = _merge_section(harvests, "neutrals")
        merged["borders"] = _merge_nested(harvests, "borders")
        merged["shadows"] = _merge_section(harvests, "shadows")
        merged["layout"] = _merge_section(harvests, "layout")
        merged["spacing"] = {"scale": _merge_spacing_scales(harvests)}
        merged["components"] = _merge_components(harvests)

    return merged


def calculate_confidence(harvests: list) -> dict:
    """Score each token by how many pages it appeared on.

    Returns dict of {section: {key: confidence_float}} where
    confidence = appearances / total_pages.
    """
    if not harvests:
        return {}

    total = len(harvests)
    flat_sections = ("colors", "surfaces", "typography", "geometry", "neutrals", "shadows", "layout")
    result = {}

    for section in flat_sections:
        key_counts = Counter()
        for h in harvests:
            for key in h.get(section, {}):
                key_counts[key] += 1
        if key_counts:
            result[section] = {key: round(count / total, 2) for key, count in key_counts.items()}

    return result


def merge_with_confidence(harvests: list) -> dict:
    """Merge harvests and attach confidence scores."""
    merged = merge_harvests(harvests)
    confidence = calculate_confidence(harvests)
    merged["_confidence"] = confidence
    return merged


def _merge_meta(harvests: list) -> dict:
    """Merge meta from multiple harvests."""
    first_meta = harvests[0].get("meta", {})
    return {
        "url": first_meta.get("url", ""),
        "timestamp": first_meta.get("timestamp", ""),
        "title": first_meta.get("title", ""),
        "page_count": len(harvests),
        "pages": [h.get("meta", {}).get("url", "") for h in harvests],
    }



def _merge_section(harvests: list, section: str) -> dict:
    """Merge a section using most-frequent-value voting."""
    key_values = {}

    for h in harvests:
        for key, val in h.get(section, {}).items():
            if val:
                key_values.setdefault(key, []).append(val)

    merged = {}
    for key, values in key_values.items():
        if isinstance(values[0], dict):
            # Sub-dict: merge recursively by voting
            sub_merged = {}
            for d in values:
                for k, v in d.items():
                    sub_merged.setdefault(k, []).append(v)
            merged[key] = {k: Counter(vs).most_common(1)[0][0] for k, vs in sub_merged.items()}
        else:
            counter = Counter(values)
            merged[key] = counter.most_common(1)[0][0]

    return merged


def _merge_nested(harvests: list, section: str) -> dict:
    """Merge a section that may contain nested dicts (e.g., borders.radius)."""
    merged = {}
    for h in harvests:
        data = h.get(section, {})
        for key, val in data.items():
            if isinstance(val, dict):
                if key not in merged:
                    merged[key] = {}
                for k, v in val.items():
                    merged[key].setdefault(k, []).append(v)
            elif val:
                merged.setdefault(key, []).append(val) if isinstance(merged.get(key), list) else None
                if key not in merged:
                    merged[key] = [val]
                elif isinstance(merged[key], list):
                    merged[key].append(val)

    # Resolve: sub-dicts by voting, scalars by voting
    result = {}
    for key, val in merged.items():
        if isinstance(val, dict):
            result[key] = {k: Counter(vs).most_common(1)[0][0] for k, vs in val.items()}
        elif isinstance(val, list):
            result[key] = Counter(val).most_common(1)[0][0]
        else:
            result[key] = val

    return result


def _merge_spacing_scales(harvests: list) -> list:
    """Union spacing scales from multiple harvests, sorted ascending."""
    all_values = set()
    for h in harvests:
        scale = h.get("spacing", {}).get("scale", [])
        all_values.update(scale)
    return sorted(all_values, key=lambda x: float(x.replace("px", "")) if "px" in x else 0)


def _merge_components(harvests: list) -> dict:
    """Deep merge component blueprints using first-found strategy."""
    merged = {}
    for h in harvests:
        comps = h.get("components", {})
        for comp_name, comp_data in comps.items():
            if comp_name not in merged:
                merged[comp_name] = {}
            if isinstance(comp_data, dict):
                for variant, profile in comp_data.items():
                    if variant not in merged[comp_name]:
                        merged[comp_name][variant] = profile
    return merged


# ============ CLI ============

if __name__ == "__main__":
    import argparse
    import sys

    parser = argparse.ArgumentParser(description="Merge multiple harvest JSON files")
    parser.add_argument("files", nargs="+", help="Harvest JSON files to merge")
    parser.add_argument("--output", "-o", default=None, help="Output merged JSON file")
    parser.add_argument("--confidence", action="store_true", help="Include confidence scores")

    args = parser.parse_args()

    harvests = []
    for fp in args.files:
        with open(fp, "r") as f:
            harvests.append(json.load(f))

    if args.confidence:
        result = merge_with_confidence(harvests)
    else:
        result = merge_harvests(harvests)

    output = json.dumps(result, indent=2, ensure_ascii=False)

    if args.output:
        with open(args.output, "w") as f:
            f.write(output)
        print(f"[OK] Merged {len(harvests)} harvests → {args.output}")
    else:
        print(output)
