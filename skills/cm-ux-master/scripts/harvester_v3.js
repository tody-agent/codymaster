/**
 * Semi-Sync Harvester v3 — Comprehensive Design System Extraction Engine
 * 
 * Full-DOM scan with:
 * - Color histogram (frequency-sorted)
 * - Neutral scale detection (gray ramp)
 * - Spacing inference (padding/margin/gap → scale)
 * - Shadow collection (sm/md/lg)
 * - Border radius collection (sm/md/lg/xl/full)
 * - Layout metrics (sidebar, header, content)
 * - Component blueprints (button, input, table, card, nav, tag)
 * - Typography scale (heading + body families, size scale)
 *
 * Output: ~80+ tokens in expanded JSON schema
 * 
 * Usage: Inject via browser console or AI browser tool.
 * Compatible with token_mapper.py v3 pipeline.
 */
(() => {
    "use strict";

    const gs = (el) => el ? getComputedStyle(el) : null;
    const q = (sel) => document.querySelector(sel);
    const qa = (sel) => [...document.querySelectorAll(sel)];
    const safe = (fn, fb = null) => { try { return fn(); } catch { return fb; } };
    const qFirst = (...sels) => { for (const s of sels) { const el = q(s); if (el) return el; } return null; };

    // === Utility: Parse color to normalized rgb string ===
    const _canvas = document.createElement("canvas").getContext("2d");
    function normalizeColor(c) {
        if (!c || c === "transparent" || c === "rgba(0, 0, 0, 0)") return null;
        _canvas.fillStyle = "#000"; // reset
        _canvas.fillStyle = c;
        return _canvas.fillStyle; // returns normalized hex
    }

    function isNeutral(hex) {
        if (!hex || hex.length < 7) return false;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        return (max - min) < 25; // low saturation = neutral
    }

    function luminance(hex) {
        if (!hex || hex.length < 7) return 0;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return 0.299 * r + 0.587 * g + 0.114 * b;
    }

    // === 1. Color Histogram ===
    function extractColorHistogram() {
        const bgMap = new Map();
        const fgMap = new Map();
        const borderMap = new Map();

        const elements = qa("*");
        const sample = elements.length > 2000
            ? elements.filter((_, i) => i % Math.ceil(elements.length / 2000) === 0)
            : elements;

        for (const el of sample) {
            const s = safe(() => gs(el));
            if (!s) continue;

            const bg = normalizeColor(s.backgroundColor);
            if (bg && bg !== "#000000" && bg !== "#ffffff") {
                bgMap.set(bg, (bgMap.get(bg) || 0) + 1);
            }

            const fg = normalizeColor(s.color);
            if (fg) {
                fgMap.set(fg, (fgMap.get(fg) || 0) + 1);
            }

            const bc = normalizeColor(s.borderColor || s.borderTopColor);
            if (bc && bc !== "#000000") {
                borderMap.set(bc, (borderMap.get(bc) || 0) + 1);
            }
        }

        return { bgMap, fgMap, borderMap };
    }

    // === 2. Semantic Color Detection ===
    function extractColors() {
        const colors = {};

        // Primary: buttons, links, accent elements
        const primaryEl = qFirst(
            '[class*="primary"]', 'button[type="submit"]', '[class*="accent"]',
            '.ant-btn-primary', '.el-button--primary', 'a[class*="active"]',
            '[class*="btn-primary"]', '[data-testid*="primary"]'
        );
        if (primaryEl) {
            const s = gs(primaryEl);
            colors.primary = s.backgroundColor;
            colors.primary_text = s.color;
        }

        // Semantic colors
        const semanticMap = {
            success: ['[class*="success"]', '.text-green', '.badge-success', '[class*="positive"]', '.ant-tag-green', '[class*="completed"]'],
            warning: ['[class*="warning"]', '.text-orange', '.badge-warning', '[class*="caution"]', '.ant-tag-orange', '[class*="pending"]'],
            danger: ['[class*="danger"]', '[class*="error"]', '[class*="destructive"]', '.text-red', '.badge-danger', '.ant-tag-red', '[class*="failed"]'],
            info: ['[class*="info"]', '.text-blue', '.badge-info', '.ant-tag-blue', '[class*="notice"]']
        };

        for (const [name, selectors] of Object.entries(semanticMap)) {
            const el = qFirst(...selectors);
            if (el) {
                const s = gs(el);
                colors[name] = s.backgroundColor !== "rgba(0, 0, 0, 0)" ? s.backgroundColor : s.color;
            }
        }

        // Link color
        const link = qFirst("a[href]:not(.btn):not([class*='nav'])", "a");
        if (link) colors.link = gs(link).color;

        // Disabled
        const disabled = qFirst("[disabled]", "[class*='disabled']", "button:disabled");
        if (disabled) {
            const s = gs(disabled);
            colors.disabled_bg = s.backgroundColor;
            colors.disabled_text = s.color;
        }

        // Fallback: scan buttons for primary
        if (!colors.primary) {
            const btns = qa("button, [role='button'], a.btn, .btn");
            for (const btn of btns) {
                const s = gs(btn);
                const bg = s.backgroundColor;
                if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "rgb(255, 255, 255)" && bg !== "transparent") {
                    colors.primary = bg;
                    colors.primary_text = s.color;
                    break;
                }
            }
        }

        return colors;
    }

    // === 3. Neutral Scale Detection ===
    function extractNeutrals(bgMap, fgMap) {
        const allColors = new Map();
        for (const [c, n] of bgMap) allColors.set(c, (allColors.get(c) || 0) + n);
        for (const [c, n] of fgMap) allColors.set(c, (allColors.get(c) || 0) + n);

        // Filter neutrals and sort by luminance
        const neutrals = [];
        for (const [hex, count] of allColors) {
            if (isNeutral(hex) && count >= 2) {
                neutrals.push({ hex, lum: luminance(hex), count });
            }
        }
        neutrals.sort((a, b) => b.lum - a.lum); // lightest first

        // Pick ~10 evenly spaced
        const scale = {};
        const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
        if (neutrals.length >= 3) {
            for (let i = 0; i < steps.length; i++) {
                const idx = Math.round((i / (steps.length - 1)) * (neutrals.length - 1));
                scale[steps[i]] = neutrals[idx].hex;
            }
        }

        return scale;
    }

    // === 4. Surface Extraction (expanded) ===
    function extractSurfaces() {
        const surfaces = {};

        const bodyStyle = gs(document.body);
        if (bodyStyle) surfaces.app_bg = bodyStyle.backgroundColor;
        if (!surfaces.app_bg || surfaces.app_bg === "rgba(0, 0, 0, 0)") {
            const main = qFirst("main", "#app", "#root", ".app", ".main-content");
            if (main) surfaces.app_bg = gs(main).backgroundColor;
        }

        const cardEl = qFirst(".card", "[class*='card']", "[class*='panel']", ".ant-card", ".el-card", "[class*='surface']");
        if (cardEl) surfaces.card_bg = gs(cardEl).backgroundColor;

        const sidebar = qFirst("aside", "nav[class*='side']", "[class*='sidebar']", "[class*='navigation']", ".ant-layout-sider");
        if (sidebar) surfaces.sidebar_bg = gs(sidebar).backgroundColor;

        const header = qFirst("header", "[class*='header']", "[class*='topbar']", "[class*='navbar']", ".ant-layout-header");
        if (header) surfaces.header_bg = gs(header).backgroundColor;

        // Modal/dialog bg
        const modal = qFirst("[class*='modal']", "[class*='dialog']", "[role='dialog']", ".ant-modal", ".el-dialog");
        if (modal) surfaces.modal_bg = gs(modal).backgroundColor;

        // Hover bg (from table rows, list items)
        const hoverEl = qFirst("[class*='hover']", "tr:hover", "[class*='highlight']");
        if (hoverEl) surfaces.hover_bg = gs(hoverEl).backgroundColor;

        // Selected bg
        const selectedEl = qFirst("[class*='selected']", "[class*='active']", "[aria-selected='true']", "[class*='current']");
        if (selectedEl) surfaces.selected_bg = gs(selectedEl).backgroundColor;

        // Input bg
        const input = qFirst("input[type='text']", "input:not([type='hidden'])", "textarea", ".ant-input", ".el-input__inner");
        if (input) surfaces.input_bg = gs(input).backgroundColor;

        // Border color
        const bordered = qFirst(".card", "table", "input", "[class*='border']", ".ant-table", ".el-input");
        if (bordered) {
            const bc = gs(bordered).borderColor;
            if (bc && bc !== "rgb(0, 0, 0)") surfaces.border = bc;
        }

        return surfaces;
    }

    // === 5. Typography Scale ===
    function extractTypography() {
        const typo = {};
        const sizeMap = new Map();

        const bodyStyle = gs(document.body);
        if (bodyStyle) {
            typo.body_family = bodyStyle.fontFamily;
            typo.body_size = bodyStyle.fontSize;
            typo.body_line_height = bodyStyle.lineHeight;
            typo.body_color = bodyStyle.color;
        }

        // Heading family (may differ from body)
        const h1 = q("h1");
        const h2 = q("h2");
        const headingEl = h1 || h2;
        if (headingEl) {
            const s = gs(headingEl);
            typo.heading_family = s.fontFamily;
            typo.heading_size = s.fontSize;
            typo.heading_weight = s.fontWeight;
            typo.heading_color = s.color;
        }

        // Muted text
        const muted = qFirst(".text-muted", "[class*='muted']", "[class*='secondary']", ".text-gray-400", ".text-gray-500", "small", ".caption");
        if (muted) typo.muted_color = gs(muted).color;

        // Collect all font sizes for scale
        const textEls = qa("h1, h2, h3, h4, h5, h6, p, span, a, li, td, th, label, small, .text-xs, .text-sm, .text-base, .text-lg, .text-xl, .text-2xl");
        for (const el of textEls.slice(0, 500)) {
            const size = safe(() => gs(el).fontSize);
            if (size) sizeMap.set(size, (sizeMap.get(size) || 0) + 1);
        }

        // Weight collection
        const weightMap = new Map();
        for (const el of textEls.slice(0, 200)) {
            const w = safe(() => gs(el).fontWeight);
            if (w) weightMap.set(w, (weightMap.get(w) || 0) + 1);
        }

        // Sort sizes and pick scale
        const sortedSizes = [...sizeMap.entries()]
            .filter(([_, count]) => count >= 2)
            .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));

        if (sortedSizes.length >= 3) {
            const sizeNames = ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl"];
            const step = Math.max(1, Math.floor(sortedSizes.length / sizeNames.length));
            typo.sizes = {};
            for (let i = 0; i < sizeNames.length && i * step < sortedSizes.length; i++) {
                typo.sizes[sizeNames[i]] = sortedSizes[i * step][0];
            }
        }

        // Weights
        const topWeights = [...weightMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
        if (topWeights.length > 0) {
            typo.weights = {};
            const weightNames = ["regular", "medium", "semibold", "bold"];
            const sortedW = topWeights.map(w => w[0]).sort((a, b) => parseInt(a) - parseInt(b));
            sortedW.forEach((w, i) => { if (i < weightNames.length) typo.weights[weightNames[i]] = w; });
        }

        return typo;
    }

    // === 6. Spacing Inference ===
    function extractSpacing() {
        const spacingFreq = new Map();
        const elements = qa("div, section, main, aside, header, footer, article, ul, ol, li, p, form, table, nav");
        const sample = elements.length > 500 ? elements.filter((_, i) => i % Math.ceil(elements.length / 500) === 0) : elements;

        for (const el of sample) {
            const s = safe(() => gs(el));
            if (!s) continue;

            // Collect padding and margin values
            for (const prop of ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
                "marginTop", "marginRight", "marginBottom", "marginLeft", "gap"]) {
                const val = s[prop];
                if (val && val !== "0px" && val !== "auto" && val !== "normal") {
                    const px = parseFloat(val);
                    if (px > 0 && px <= 96) {
                        // Round to nearest common value
                        const rounded = Math.round(px);
                        spacingFreq.set(rounded, (spacingFreq.get(rounded) || 0) + 1);
                    }
                }
            }
        }

        // Get top spacing values, sort ascending
        const sorted = [...spacingFreq.entries()]
            .filter(([_, count]) => count >= 3)
            .sort((a, b) => a[0] - b[0]);

        // Derive 8-step scale from actual usage
        const scale = [];
        const common = [2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 56, 64];
        for (const target of common) {
            // Find closest real value within ±2px
            const match = sorted.find(([v, _]) => Math.abs(v - target) <= 2);
            if (match) scale.push(match[0] + "px");
        }

        return { scale: [...new Set(scale)].slice(0, 12) };
    }

    // === 7. Border System ===
    function extractBorders() {
        const radiusFreq = new Map();
        const widthFreq = new Map();
        const borders = {};

        const elements = qa("button, input, .card, [class*='card'], [class*='btn'], div, section, [class*='badge'], [class*='tag'], [class*='chip'], select, textarea, [class*='avatar'], img");
        const sample = elements.length > 300 ? elements.filter((_, i) => i % Math.ceil(elements.length / 300) === 0) : elements;

        for (const el of sample) {
            const s = safe(() => gs(el));
            if (!s) continue;

            const r = s.borderRadius;
            if (r && r !== "0px") {
                radiusFreq.set(r, (radiusFreq.get(r) || 0) + 1);
            }

            const w = s.borderWidth || s.borderTopWidth;
            if (w && w !== "0px") {
                widthFreq.set(w, (widthFreq.get(w) || 0) + 1);
            }
        }

        // Border color from surfaces
        const bordered = qFirst(".card", "table", "input", "[class*='border']");
        if (bordered) {
            const bc = gs(bordered).borderColor;
            if (bc && bc !== "rgb(0, 0, 0)") borders.color = bc;
        }

        // Most common border width
        const topWidth = [...widthFreq.entries()].sort((a, b) => b[1] - a[1]);
        if (topWidth.length > 0) borders.width = topWidth[0][0];

        // Sort radii by size, assign sm/md/lg/xl/full
        const sortedRadii = [...radiusFreq.entries()]
            .filter(([_, count]) => count >= 2)
            .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));

        borders.radius = {};
        if (sortedRadii.length >= 1) borders.radius.sm = sortedRadii[0][0];
        if (sortedRadii.length >= 2) borders.radius.md = sortedRadii[Math.floor(sortedRadii.length * 0.33)][0];
        if (sortedRadii.length >= 3) borders.radius.lg = sortedRadii[Math.floor(sortedRadii.length * 0.66)][0];
        if (sortedRadii.length >= 4) borders.radius.xl = sortedRadii[sortedRadii.length - 1][0];

        // Detect "full" (9999px or 50%)
        for (const [r, _] of sortedRadii) {
            if (parseFloat(r) >= 9999 || r.includes("50%") || r === "100%") {
                borders.radius.full = r;
                break;
            }
        }

        return borders;
    }

    // === 8. Shadow System ===
    function extractShadows() {
        const shadowFreq = new Map();
        const elements = qa(".card, [class*='card'], [class*='dropdown'], [class*='popover'], [class*='modal'], [class*='dialog'], [class*='tooltip'], [class*='menu'], [class*='panel'], button, [class*='shadow']");

        for (const el of elements.slice(0, 200)) {
            const s = safe(() => gs(el));
            if (!s) continue;
            const shadow = s.boxShadow;
            if (shadow && shadow !== "none") {
                shadowFreq.set(shadow, (shadowFreq.get(shadow) || 0) + 1);
            }
        }

        const sorted = [...shadowFreq.entries()].sort((a, b) => b[1] - a[1]);
        const shadows = {};

        // Classify by "depth" (approximate from blur values)
        for (const [shadow, _] of sorted.slice(0, 6)) {
            const blurMatch = shadow.match(/(\d+)px\s+(\d+)px\s+(\d+)px/);
            const blur = blurMatch ? parseInt(blurMatch[3]) : 0;

            if (blur <= 3 && !shadows.sm) shadows.sm = shadow;
            else if (blur <= 10 && !shadows.md) shadows.md = shadow;
            else if (blur > 10 && !shadows.lg) shadows.lg = shadow;
        }

        // Fallback: assign in order
        if (sorted.length === 1 && !shadows.md) shadows.md = sorted[0][0];

        return shadows;
    }

    // === 9. Layout Metrics ===
    function extractLayout() {
        const layout = {};

        const sidebar = qFirst("aside", "nav[class*='side']", "[class*='sidebar']", ".ant-layout-sider");
        if (sidebar) layout.sidebar_width = gs(sidebar).width;

        const header = qFirst("header", "[class*='header']", "[class*='topbar']", "[class*='navbar']", ".ant-layout-header");
        if (header) layout.header_height = gs(header).height;

        const content = qFirst("main", "[class*='content']", "[class*='main']", "#content", ".ant-layout-content");
        if (content) {
            layout.content_max_width = gs(content).maxWidth;
            layout.content_padding = gs(content).paddingLeft;
        }

        // Grid/flex gap
        const gridEl = qFirst("[class*='grid']", "[class*='row']", "[class*='flex']", "[class*='container']");
        if (gridEl) {
            const gap = gs(gridEl).gap;
            if (gap && gap !== "normal") layout.grid_gap = gap;
        }

        return layout;
    }

    // === 10. Component Blueprints ===
    function extractComponents() {
        const components = {};

        // --- Button ---
        components.button = {};
        const btnPrimary = qFirst('[class*="primary"]', 'button[type="submit"]', '.ant-btn-primary', '.el-button--primary');
        if (btnPrimary) components.button.primary = _extractProfile(btnPrimary);

        const btnSecondary = qFirst('[class*="secondary"]', '[class*="default"]', '.ant-btn-default', '.el-button--default', 'button:not([class*="primary"])');
        if (btnSecondary) components.button.secondary = _extractProfile(btnSecondary);

        const btnOutline = qFirst('[class*="outline"]', '[class*="ghost"]', '.ant-btn-ghost', '.el-button--text');
        if (btnOutline) components.button.outline = _extractProfile(btnOutline);

        const btnDanger = qFirst('[class*="danger"]', '[class*="destructive"]', '.ant-btn-dangerous');
        if (btnDanger) components.button.danger = _extractProfile(btnDanger);

        // Button sizes
        const btnSm = qFirst('[class*="btn-sm"]', '[class*="small"]', '.ant-btn-sm', '.el-button--small');
        const btnLg = qFirst('[class*="btn-lg"]', '[class*="large"]', '.ant-btn-lg', '.el-button--large');
        if (btnSm || btnLg) {
            components.button.sizes = {};
            if (btnSm) components.button.sizes.sm = _extractProfile(btnSm);
            if (btnPrimary) components.button.sizes.md = _extractProfile(btnPrimary);
            if (btnLg) components.button.sizes.lg = _extractProfile(btnLg);
        }

        // --- Input ---
        components.input = {};
        const inputEl = qFirst("input[type='text']", "input:not([type='hidden']):not([type='checkbox']):not([type='radio'])", ".ant-input", ".el-input__inner");
        if (inputEl) {
            components.input.default = _extractProfile(inputEl);
            // Focus state (try to read if available)
            components.input.focus = { border_color: "inherit", box_shadow: "inherit" };
        }

        const inputError = qFirst("[class*='error'] input", "input[class*='error']", ".ant-input-status-error", ".is-error input");
        if (inputError) components.input.error = _extractProfile(inputError);

        const selectEl = qFirst("select", ".ant-select", ".el-select");
        if (selectEl) components.input.select = _extractProfile(selectEl);

        const textareaEl = q("textarea");
        if (textareaEl) components.input.textarea = _extractProfile(textareaEl);

        // --- Card ---
        const cardEl = qFirst(".card", "[class*='card']", ".ant-card", ".el-card");
        if (cardEl) {
            components.card = { default: _extractProfile(cardEl) };
        }

        // --- Table ---
        components.table = {};
        const thead = q("thead, .ant-table-thead");
        if (thead) components.table.header = _extractProfile(thead);

        const tbody_tr = qFirst("tbody tr", ".ant-table-tbody tr");
        if (tbody_tr) components.table.row = _extractProfile(tbody_tr);

        const td = qFirst("td", ".ant-table-cell");
        if (td) components.table.cell = _extractProfile(td);

        const th = qFirst("th", ".ant-table-thead th");
        if (th) components.table.header_cell = _extractProfile(th);

        // --- Nav Item ---
        components.nav_item = {};
        const navItem = qFirst("[class*='nav'] a", "[class*='sidebar'] a", "[class*='menu-item']", ".ant-menu-item", "[class*='nav-item']");
        if (navItem) components.nav_item.default = _extractProfile(navItem);

        const navActive = qFirst("[class*='nav'] a[class*='active']", "[class*='menu-item'][class*='active']", ".ant-menu-item-selected", "[class*='current']", "[aria-current='page']");
        if (navActive) components.nav_item.active = _extractProfile(navActive);

        // --- Tag / Badge ---
        components.tag = {};
        const tagEl = qFirst("[class*='tag']", "[class*='badge']", "[class*='chip']", ".ant-tag", ".el-tag");
        if (tagEl) components.tag.default = _extractProfile(tagEl);

        // Tag variants by color
        const tagVariants = {};
        const tagEls = qa("[class*='tag'], [class*='badge'], .ant-tag, .el-tag").slice(0, 20);
        for (const t of tagEls) {
            const s = gs(t);
            const bg = normalizeColor(s.backgroundColor);
            if (bg && !tagVariants[bg]) {
                tagVariants[bg] = { bg: s.backgroundColor, color: s.color, border_radius: s.borderRadius, padding: s.padding, font_size: s.fontSize };
            }
        }
        if (Object.keys(tagVariants).length > 0) {
            components.tag.variants = Object.values(tagVariants).slice(0, 6);
        }

        return components;
    }

    function _extractProfile(el) {
        const s = gs(el);
        if (!s) return {};
        return {
            bg: s.backgroundColor,
            color: s.color,
            border: s.border,
            border_color: s.borderColor,
            border_radius: s.borderRadius,
            padding: s.padding,
            margin: s.margin,
            font_size: s.fontSize,
            font_weight: s.fontWeight,
            font_family: s.fontFamily,
            line_height: s.lineHeight,
            box_shadow: s.boxShadow !== "none" ? s.boxShadow : undefined,
            height: s.height,
            min_height: s.minHeight !== "auto" ? s.minHeight : undefined,
            transition: s.transition !== "all 0s ease 0s" ? s.transition : undefined,
            opacity: s.opacity !== "1" ? s.opacity : undefined,
        };
    }

    // === Detect page type ===
    function detectPageType() {
        const title = (document.title || "").toLowerCase();
        const url = (window.location.href || "").toLowerCase();
        const combined = title + " " + url;

        if (/dashboard|overview|tổng quan|home/i.test(combined)) return "dashboard";
        if (/setting|config|cài đặt|preferences/i.test(combined)) return "settings";
        if (/report|analytics|báo cáo|thống kê/i.test(combined)) return "report";
        if (/order|đơn hàng|transaction/i.test(combined)) return "orders";
        if (/product|sản phẩm|catalog/i.test(combined)) return "products";
        return "generic";
    }

    // === MAIN ===
    const { bgMap, fgMap, borderMap } = extractColorHistogram();

    const result = {
        _version: 3,
        meta: {
            url: window.location.href,
            timestamp: new Date().toISOString(),
            title: document.title,
            page_type: detectPageType(),
        },
        colors: extractColors(),
        neutrals: extractNeutrals(bgMap, fgMap),
        surfaces: extractSurfaces(),
        typography: extractTypography(),
        spacing: extractSpacing(),
        borders: extractBorders(),
        shadows: extractShadows(),
        layout: extractLayout(),
        components: extractComponents(),
        // Legacy compat — keep geometry for backward compat
        geometry: {
            button_radius: safe(() => gs(qFirst("button", ".btn")).borderRadius),
            card_radius: safe(() => gs(qFirst(".card", "[class*='card']")).borderRadius),
            card_shadow: safe(() => gs(qFirst(".card", "[class*='card']")).boxShadow),
            input_radius: safe(() => gs(qFirst("input")).borderRadius),
            button_padding: safe(() => gs(qFirst("button", ".btn")).padding),
        },
    };

    // Output
    const output = JSON.stringify(result, null, 2);
    console.log("=== SEMI-SYNC HARVESTER v3 OUTPUT ===");
    console.log(output);
    console.log("=== END HARVESTER v3 OUTPUT ===");

    return output;
})();
