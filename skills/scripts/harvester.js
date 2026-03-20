/**
 * Semi-Sync Harvester — CSSOM Deep Extraction Engine
 * 
 * Inject this script into browser console to extract visual DNA
 * from any rendered web page. Returns JSON with computed styles.
 * 
 * Usage: Copy-paste into DevTools console, or inject via AI browser tool.
 * Output: JSON string → feed into token_mapper.py
 * 
 * PRIVACY: Extracts ONLY CSS visual properties. No PII, no data content,
 * no auth tokens. Only colors, fonts, radii, shadows.
 */
(() => {
    "use strict";

    // === Helpers ===

    const gs = (el) => el ? getComputedStyle(el) : null;

    const q = (sel) => document.querySelector(sel);
    const qa = (sel) => [...document.querySelectorAll(sel)];

    const safe = (fn, fallback = null) => {
        try { return fn(); } catch { return fallback; }
    };

    // Try multiple selectors, return first match
    const qFirst = (...sels) => {
        for (const s of sels) {
            const el = q(s);
            if (el) return el;
        }
        return null;
    };

    // === Color Extraction ===

    function extractColors() {
        const colors = {};

        // Primary: buttons, links, accent elements
        const primaryEl = qFirst(
            '[class*="primary"]',
            '[class*="btn-primary"]',
            'button[type="submit"]',
            '[class*="accent"]',
            'a[class*="active"]',
            '.ant-btn-primary',
            '.el-button--primary',
            '[data-testid*="primary"]'
        );
        if (primaryEl) {
            const s = gs(primaryEl);
            colors.primary = s.backgroundColor;
            colors.primary_text = s.color;
        }

        // Success
        const successEl = qFirst(
            '[class*="success"]', '.text-green', '.badge-success',
            '[class*="positive"]', '.ant-tag-green'
        );
        if (successEl) {
            const s = gs(successEl);
            colors.success = s.backgroundColor !== "rgba(0, 0, 0, 0)" ? s.backgroundColor : s.color;
        }

        // Warning
        const warningEl = qFirst(
            '[class*="warning"]', '.text-orange', '.badge-warning',
            '[class*="caution"]', '.ant-tag-orange'
        );
        if (warningEl) {
            const s = gs(warningEl);
            colors.warning = s.backgroundColor !== "rgba(0, 0, 0, 0)" ? s.backgroundColor : s.color;
        }

        // Danger
        const dangerEl = qFirst(
            '[class*="danger"]', '[class*="error"]', '[class*="destructive"]',
            '.text-red', '.badge-danger', '.ant-tag-red', 'button[class*="delete"]'
        );
        if (dangerEl) {
            const s = gs(dangerEl);
            colors.danger = s.backgroundColor !== "rgba(0, 0, 0, 0)" ? s.backgroundColor : s.color;
        }

        // Fallback: scan all buttons for primary color
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

    // === Surface Extraction ===

    function extractSurfaces() {
        const surfaces = {};

        // App background
        const bodyStyle = gs(document.body);
        if (bodyStyle) {
            surfaces.app_bg = bodyStyle.backgroundColor;
        }
        // Fallback: check html or main element
        if (!surfaces.app_bg || surfaces.app_bg === "rgba(0, 0, 0, 0)") {
            const main = qFirst("main", "#app", "#root", ".app", ".main-content");
            if (main) surfaces.app_bg = gs(main).backgroundColor;
        }

        // Card surface
        const card = qFirst(
            ".card", "[class*='card']", "[class*='panel']",
            ".ant-card", ".el-card", "[class*='surface']"
        );
        if (card) {
            surfaces.card_bg = gs(card).backgroundColor;
        }

        // Sidebar
        const sidebar = qFirst(
            "aside", "nav[class*='side']", "[class*='sidebar']",
            "[class*='navigation']", ".ant-layout-sider"
        );
        if (sidebar) {
            surfaces.sidebar_bg = gs(sidebar).backgroundColor;
        }

        // Border color
        const bordered = qFirst(
            ".card", "table", "input", "[class*='border']",
            ".ant-table", ".el-input"
        );
        if (bordered) {
            const bc = gs(bordered).borderColor;
            if (bc && bc !== "rgb(0, 0, 0)") {
                surfaces.border = bc;
            }
        }

        return surfaces;
    }

    // === Typography Extraction ===

    function extractTypography() {
        const typo = {};

        // Font family from body
        const bodyStyle = gs(document.body);
        if (bodyStyle) {
            typo.font_family = bodyStyle.fontFamily;
            typo.body_size = bodyStyle.fontSize;
            typo.body_line_height = bodyStyle.lineHeight;
            typo.body_color = bodyStyle.color;
        }

        // Heading sizes
        const h1 = q("h1");
        if (h1) {
            const s = gs(h1);
            typo.heading_size = s.fontSize;
            typo.title_color = s.color;
        }

        // Muted text
        const muted = qFirst(
            ".text-muted", "[class*='muted']", "[class*='secondary']",
            ".text-gray-400", ".text-gray-500", "small", ".caption"
        );
        if (muted) {
            typo.muted_color = gs(muted).color;
        }

        return typo;
    }

    // === Geometry Extraction ===

    function extractGeometry() {
        const geo = {};

        // Button radius
        const btn = qFirst("button", ".btn", "[role='button']", "a.btn");
        if (btn) {
            const s = gs(btn);
            geo.button_radius = s.borderRadius;
            geo.button_padding = s.padding;
        }

        // Card radius & shadow
        const card = qFirst(".card", "[class*='card']", ".ant-card", ".el-card");
        if (card) {
            const s = gs(card);
            geo.card_radius = s.borderRadius;
            geo.card_shadow = s.boxShadow;
        }

        // Input radius
        const input = qFirst("input[type='text']", "input", ".ant-input", ".el-input__inner");
        if (input) {
            geo.input_radius = gs(input).borderRadius;
        }

        return geo;
    }

    // === Main ===

    const result = {
        meta: {
            url: window.location.href,
            timestamp: new Date().toISOString(),
            title: document.title
        },
        colors: extractColors(),
        surfaces: extractSurfaces(),
        typography: extractTypography(),
        geometry: extractGeometry()
    };

    // Output as JSON string for AI to capture
    const output = JSON.stringify(result, null, 2);
    console.log("=== SEMI-SYNC HARVESTER OUTPUT ===");
    console.log(output);
    console.log("=== END HARVESTER OUTPUT ===");

    // Also return for programmatic access
    return output;
})();
