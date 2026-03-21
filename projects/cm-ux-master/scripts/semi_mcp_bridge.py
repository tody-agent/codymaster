#!/usr/bin/env python3
"""
Semi MCP Bridge — Maps harvested UI to Semi Design components via MCP.

Connects the CSSOM harvester output to Semi Design's component ecosystem:
1. Detects UI patterns from harvest data (sidebar, dashboard, form, table)
2. Maps patterns to Semi Design components
3. Generates MCP tool call instructions for AI
4. Produces React component templates with proper imports

Usage:
    from semi_mcp_bridge import build_harvest_bundle
    bundle = build_harvest_bundle(harvest_data, semi_tokens)
"""
import json
import re


# ============ UI PATTERN DETECTION ============

# Keywords that signal specific UI patterns
PATTERN_SIGNALS = {
    "sidebar-layout": {
        "surface_keys": ["sidebar_bg"],
        "title_keywords": ["admin", "dashboard", "management", "console", "panel", "backend"],
    },
    "dashboard": {
        "surface_keys": [],
        "title_keywords": ["dashboard", "analytics", "overview", "statistics", "report", "monitoring"],
    },
    "table": {
        "surface_keys": [],
        "title_keywords": ["order", "list", "inventory", "product", "customer", "transaction", "log"],
    },
    "form": {
        "surface_keys": [],
        "title_keywords": ["create", "edit", "new", "add", "setting", "config", "profile", "register"],
    },
    "card-grid": {
        "surface_keys": ["card_bg"],
        "title_keywords": ["catalog", "gallery", "store", "shop", "collection"],
    },
}


def detect_ui_patterns(harvest: dict) -> list:
    """Detect UI layout patterns from harvest data (surfaces + meta title)."""
    patterns = []
    surfaces = harvest.get("surfaces", {})
    title = harvest.get("meta", {}).get("title", "").lower()
    url = harvest.get("meta", {}).get("url", "").lower()
    combined_text = f"{title} {url}"

    for pattern_name, signals in PATTERN_SIGNALS.items():
        score = 0

        # Check surface keys
        for key in signals["surface_keys"]:
            if key in surfaces and surfaces[key]:
                score += 2

        # Check title keywords
        for kw in signals["title_keywords"]:
            if kw in combined_text:
                score += 1

        if score > 0:
            patterns.append(pattern_name)

    # Default fallback
    if not patterns:
        patterns.append("dashboard")

    return patterns


# ============ COMPONENT MAPPING ============

# Semi Design components for each UI pattern
PATTERN_COMPONENTS = {
    "sidebar-layout": ["Layout", "Nav", "Button", "Avatar", "Dropdown"],
    "dashboard": ["Card", "Table", "Tag", "Badge", "Descriptions", "Button", "Typography"],
    "table": ["Table", "Button", "Tag", "Pagination", "Input", "Select", "Modal"],
    "form": ["Form", "Input", "Select", "DatePicker", "Upload", "Button", "Toast"],
    "card-grid": ["Card", "Row", "Col", "Image", "Tag", "Button", "Typography"],
}

# Icon imports per pattern
PATTERN_ICONS = {
    "sidebar-layout": ["IconHome", "IconUser", "IconSetting", "IconList"],
    "dashboard": ["IconArrowUp", "IconArrowDown", "IconSearch", "IconFilter"],
    "table": ["IconSearch", "IconPlus", "IconDelete", "IconEdit", "IconMore"],
    "form": ["IconUpload", "IconSave", "IconClose"],
    "card-grid": ["IconSearch", "IconHeart", "IconShoppingCart"],
}


def map_patterns_to_components(patterns: list) -> list:
    """Map detected UI patterns to Semi Design components (deduplicated)."""
    seen = set()
    components = []

    for pattern in patterns:
        for comp in PATTERN_COMPONENTS.get(pattern, []):
            if comp not in seen:
                seen.add(comp)
                components.append(comp)

    return components


def _get_icons_for_patterns(patterns: list) -> list:
    """Get deduplicated icon list for patterns."""
    seen = set()
    icons = []
    for pattern in patterns:
        for icon in PATTERN_ICONS.get(pattern, []):
            if icon not in seen:
                seen.add(icon)
                icons.append(icon)
    return icons


# ============ MCP QUERY GENERATION ============

def generate_mcp_queries(components: list) -> list:
    """Generate MCP tool call instructions for AI to fetch Semi component docs."""
    queries = []

    for comp in components:
        # Primary: get doc for understanding API
        queries.append({
            "tool": "get_semi_document",
            "args": {"componentName": comp},
            "purpose": f"Get {comp} component documentation and API reference"
        })

    return queries


# ============ REACT TEMPLATE GENERATION ============

def generate_react_template(patterns: list, tokens: dict, meta: dict = None) -> str:
    """Generate a React component template using Semi UI + harvested theme tokens."""
    meta = meta or {}
    source_url = meta.get("url", "unknown")
    source_title = meta.get("title", "Harvested App")

    components = map_patterns_to_components(patterns)
    icons = _get_icons_for_patterns(patterns)

    # Build import statement
    comp_import = ", ".join(components)
    icon_import = ", ".join(icons) if icons else ""

    # Determine primary layout
    has_sidebar = "sidebar-layout" in patterns
    has_table = "table" in patterns or "dashboard" in patterns
    has_form = "form" in patterns

    lines = [
        f"/**",
        f" * Auto-generated by MasterDesign Agent — Semi-Sync Harvester Protocol",
        f" * Source: {source_url}",
        f" * Title: {source_title}",
        f" *",
        f" * This component uses @douyinfe/semi-ui and inherits the",
        f" * harvested theme via semi-theme-override.css.",
        f" */",
        f"import React from 'react';",
        f"import {{ {comp_import} }} from '@douyinfe/semi-ui';",
    ]

    if icon_import:
        lines.append(f"import {{ {icon_import} }} from '@douyinfe/semi-icons';")

    lines.append(f"import './semi-theme-override.css';")
    lines.append("")

    # Extract primary color for comments
    primary = tokens.get("--semi-color-primary", "#0077FA")

    # Component name from title
    comp_name = "".join(
        w.capitalize() for w in re.sub(r'[^a-zA-Z0-9\s]', '', source_title).split()
    ) or "HarvestedDashboard"

    lines.append(f"const {comp_name} = () => {{")

    # Build JSX based on patterns
    if has_sidebar:
        dq = '"'  # double quote helper
        lines.extend([
            "  return (",
            "    <Layout style={{ height: '100vh' }}>",
            "      <Layout.Sider style={{ width: 240 }}>",
            "        <Nav",
            "          style={{ height: '100%' }}",
            f"          defaultSelectedKeys={{[{dq}home{dq}]}}",
            "          items={[",
            "            { itemKey: 'home', text: 'Home', icon: <IconHome /> },",
            "            { itemKey: 'list', text: 'List', icon: <IconList /> },",
            "            { itemKey: 'settings', text: 'Settings', icon: <IconSetting /> },",
            "          ]}",
            "          footer={{ collapseButton: true }}",
            "        />",
            "      </Layout.Sider>",
            "      <Layout.Content style={{ padding: 24 }}>",
        ])
        if has_table:
            _append_table_jsx(lines, tokens, indent=8)
        else:
            lines.append(f"        <Card title='{source_title}'>")
            lines.append(f"          {{/* Content here */}}")
            lines.append(f"        </Card>")
        lines.extend([
            f"      </Layout.Content>",
            f"    </Layout>",
            f"  );",
        ])
    elif has_form:
        lines.extend([
            f"  return (",
            f"    <div style={{ {{ maxWidth: 600, margin: '40px auto', padding: 24 }} }}>",
            f"      <Card title='{source_title}'>",
            f"        <Form layout='vertical' onSubmit={{(values) => console.log(values)}}>",
            f"          <Form.Input field='name' label='Name' placeholder='Enter name' />",
            f"          <Form.Select field='category' label='Category' placeholder='Select'>",
            f"            <Form.Select.Option value='a'>Option A</Form.Select.Option>",
            f"            <Form.Select.Option value='b'>Option B</Form.Select.Option>",
            f"          </Form.Select>",
            f"          <Form.DatePicker field='date' label='Date' />",
            f"          <Button theme='solid' type='primary' htmlType='submit'>Submit</Button>",
            f"        </Form>",
            f"      </Card>",
            f"    </div>",
            f"  );",
        ])
    elif has_table:
        lines.extend([
            f"  return (",
            f"    <div style={{ {{ padding: 24 }} }}>",
        ])
        _append_table_jsx(lines, tokens, indent=6)
        lines.extend([
            f"    </div>",
            f"  );",
        ])
    else:
        lines.extend([
            f"  return (",
            f"    <div style={{ {{ padding: 24 }} }}>",
            f"      <Card title='{source_title}'>",
            f"        {{/* Content — inherits harvested theme from CSS override */}}",
            f"        <Button theme='solid' type='primary'>Primary Action</Button>",
            f"      </Card>",
            f"    </div>",
            f"  );",
        ])

    lines.append(f"}};")
    lines.append("")
    lines.append(f"export default {comp_name};")
    lines.append("")

    return "\n".join(lines)


def _append_table_jsx(lines: list, tokens: dict, indent: int = 6):
    """Append table JSX snippet."""
    pad = " " * indent
    lines.extend([
        f"{pad}<Card",
        f"{pad}  title='Data Overview'",
        f"{pad}  headerExtraContent={{<Button theme='solid' type='primary' icon={{<IconSearch />}}>Search</Button>}}",
        f"{pad}>",
        f"{pad}  <Table",
        f"{pad}    columns={{[",
        f"{pad}      {{ title: 'ID', dataIndex: 'id', width: 80 }},",
        f"{pad}      {{ title: 'Name', dataIndex: 'name' }},",
        f"{pad}      {{ title: 'Status', dataIndex: 'status', render: (text) => <Tag color='green'>{{text}}</Tag> }},",
        f"{pad}      {{ title: 'Date', dataIndex: 'date' }},",
        f"{pad}    ]}}",
        f"{pad}    dataSource={{[",
        f"{pad}      {{ key: '1', id: '001', name: 'Sample Item', status: 'Active', date: '2025-02-25' }},",
        f"{pad}    ]}}",
        f"{pad}    pagination={{{{ pageSize: 10 }}}}",
        f"{pad}  />",
        f"{pad}</Card>",
    ])


# ============ THEME PROVIDER ============

def generate_theme_provider(tokens: dict) -> str:
    """Generate CSS theme import and provider setup code."""
    lines = [
        "/**",
        " * Theme Provider — Semi-Sync Harvester",
        " *",
        " * Import this file in your app entry point (index.tsx / App.tsx)",
        " * to apply the harvested theme to all Semi Design components.",
        " */",
        "",
        "// 1. Import Semi Design base styles",
        "import '@douyinfe/semi-ui/dist/css/semi.min.css';",
        "",
        "// 2. Import harvested theme override (must come AFTER base)",
        "import './semi-theme-override.css';",
        "",
        "// The CSS variables in semi-theme-override.css will",
        "// automatically override Semi Design defaults.",
        "// No additional JavaScript configuration needed.",
        "",
        f"// Theme contains {len(tokens)} custom tokens.",
    ]
    return "\n".join(lines)


# ============ FULL PIPELINE ============

def build_harvest_bundle(harvest: dict, tokens: dict) -> dict:
    """Build complete output bundle from harvest data + compiled tokens."""
    meta = harvest.get("meta", {})

    # 1. Detect UI patterns
    patterns = detect_ui_patterns(harvest)

    # 2. Map to Semi components
    components = map_patterns_to_components(patterns)

    # 3. Generate MCP queries
    mcp_queries = generate_mcp_queries(components)

    # 4. Generate React template
    react_template = generate_react_template(patterns, tokens, meta)

    # 5. Generate theme provider
    theme_provider = generate_theme_provider(tokens)

    return {
        "patterns": patterns,
        "components": components,
        "mcp_queries": mcp_queries,
        "react_template": react_template,
        "theme_provider": theme_provider,
        "meta": meta,
    }


# ============ REPORT FORMATTER ============

def format_bundle_report(bundle: dict) -> str:
    """Format bundle as markdown report for AI/user consumption."""
    lines = [
        "# Semi-Sync Harvest — MCP Bridge Report",
        "",
        f"**Source:** {bundle['meta'].get('url', 'N/A')}",
        f"**Detected Patterns:** {', '.join(bundle['patterns'])}",
        f"**Semi Components:** {', '.join(bundle['components'])}",
        "",
        "## MCP Queries (for AI to execute)",
        "",
    ]

    for i, q in enumerate(bundle["mcp_queries"], 1):
        lines.append(f"{i}. `{q['tool']}` → `{q['args']['componentName']}` — {q['purpose']}")

    lines.extend([
        "",
        "## React Component",
        "",
        "```tsx",
        bundle["react_template"],
        "```",
        "",
        "## Theme Provider Setup",
        "",
        "```tsx",
        bundle["theme_provider"],
        "```",
    ])

    return "\n".join(lines)


# ============ CLI ============

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Semi MCP Bridge")
    parser.add_argument("--harvest", "-i", help="Input harvest JSON file")
    parser.add_argument("--tokens", "-t", help="Input tokens JSON (from token_mapper)")
    parser.add_argument("--demo", action="store_true", help="Run with demo data")

    args = parser.parse_args()

    if args.demo:
        demo_harvest = {
            "meta": {"url": "https://demo.app/admin", "title": "Demo Admin Dashboard"},
            "colors": {"primary": "rgb(23,92,211)"},
            "surfaces": {"sidebar_bg": "rgb(31,41,55)", "card_bg": "rgb(255,255,255)"},
            "typography": {"font_family": "Inter"},
            "geometry": {"button_radius": "4px"}
        }
        demo_tokens = {
            "--semi-color-primary": "#175CD3",
            "--semi-color-bg-0": "#F4F6F8",
            "--semi-color-bg-1": "#FFFFFF",
            "--semi-color-text-0": "#0F172A",
            "--semi-font-family-regular": "Inter, sans-serif",
            "--semi-border-radius-medium": "4px",
        }
        bundle = build_harvest_bundle(demo_harvest, demo_tokens)
        print(format_bundle_report(bundle))
    elif args.harvest and args.tokens:
        with open(args.harvest) as f:
            harvest = json.load(f)
        with open(args.tokens) as f:
            tokens = json.load(f)
        bundle = build_harvest_bundle(harvest, tokens)
        print(format_bundle_report(bundle))
    else:
        parser.print_help()
