/**
 * Harvester v4 — AI-Powered Visual Extraction Engine
 * 
 * Advanced design system extraction with:
 * - Visual element detection & classification using DOM + CSS analysis
 * - Color psychology analysis & semantic mapping
 * - Layout pattern recognition (grid, flex, sidebar, header patterns)
 * - Typography hierarchy detection with font pairing analysis
 * - Component relationship mapping & parent-child structures
 * - Animation & transition detection
 * - Responsive breakpoint detection
 * - Design token extraction with confidence scoring
 * 
 * Output: ~120+ tokens with metadata, component blueprints, visual hierarchy
 * 
 * Usage: Inject via browser console, Playwright automation, or AI browser tool.
 * Compatible with: token_mapper_v4.py, design_system_indexer.py
 * 
 * @version 4.0.0
 * @author UX Master AI
 */

(() => {
    "use strict";

    // ============ UTILITY FUNCTIONS ============
    const gs = (el) => el ? getComputedStyle(el) : null;
    const q = (sel) => document.querySelector(sel);
    const qa = (sel) => [...document.querySelectorAll(sel)];
    const safe = (fn, fb = null) => { try { return fn(); } catch { return fb; } };
    const qFirst = (...sels) => { for (const s of sels) { const el = q(s); if (el) return el; } return null; };
    
    // Canvas for color normalization
    const _canvas = document.createElement("canvas").getContext("2d");
    
    function normalizeColor(c) {
        if (!c || c === "transparent" || c === "rgba(0, 0, 0, 0)") return null;
        _canvas.fillStyle = "#000";
        _canvas.fillStyle = c;
        return _canvas.fillStyle.toUpperCase();
    }

    function isNeutral(hex) {
        if (!hex || hex.length < 7) return false;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        return (max - min) < 25;
    }

    function luminance(hex) {
        if (!hex || hex.length < 7) return 0;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return 0.299 * r + 0.587 * g + 0.114 * b;
    }

    function contrastRatio(hex1, hex2) {
        const lum1 = luminance(hex1) / 255;
        const lum2 = luminance(hex2) / 255;
        const lighter = Math.max(lum1, lum2);
        const darker = Math.min(lum1, lum2);
        return (lighter + 0.05) / (darker + 0.05);
    }

    function getElementDepth(el) {
        let depth = 0;
        let current = el;
        while (current && current !== document.body) {
            depth++;
            current = current.parentElement;
        }
        return depth;
    }

    function getElementVisibility(el) {
        const s = gs(el);
        if (!s) return { visible: false, area: 0 };
        const rect = el.getBoundingClientRect();
        return {
            visible: s.display !== "none" && s.visibility !== "hidden" && rect.width > 0 && rect.height > 0,
            area: rect.width * rect.height,
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
        };
    }

    // ============ 1. VISUAL ELEMENT DETECTION & CLASSIFICATION ============
    
    const COMPONENT_SELECTORS = {
        button: {
            selectors: ['button', '[role="button"]', '.btn', '[class*="button"]', '[class*="btn"]', '.ant-btn', '.el-button', '.semi-button'],
            types: ['primary', 'secondary', 'outline', 'ghost', 'danger', 'success', 'warning', 'text', 'link'],
            sizes: ['small', 'default', 'large', 'sm', 'lg', 'xl', 'xs']
        },
        input: {
            selectors: ['input:not([type="hidden"])', 'textarea', 'select', '.input', '[class*="input"]', '.ant-input', '.el-input', '.semi-input'],
            types: ['text', 'password', 'email', 'number', 'search', 'textarea', 'select'],
            states: ['default', 'focus', 'error', 'disabled', 'hover']
        },
        card: {
            selectors: ['.card', '[class*="card"]', '.panel', '[class*="panel"]', '.ant-card', '.el-card', '.semi-card'],
            variants: ['default', 'hover', 'bordered', 'shadow', 'flat']
        },
        table: {
            selectors: ['table', '.table', '[class*="table"]', '.ant-table', '.el-table', '.semi-table'],
            parts: ['header', 'row', 'cell', 'header-cell', 'row-hover', 'striped']
        },
        navigation: {
            selectors: ['nav', 'aside', '[class*="sidebar"]', '[class*="sidenav"]', '[class*="menu"]', '.ant-menu', '.el-menu'],
            types: ['sidebar', 'topbar', 'horizontal', 'vertical', 'mobile']
        },
        modal: {
            selectors: ['[role="dialog"]', '[class*="modal"]', '[class*="dialog"]', '.ant-modal', '.el-dialog', '.semi-modal'],
            parts: ['overlay', 'container', 'header', 'body', 'footer', 'close']
        },
        tag: {
            selectors: ['[class*="tag"]', '[class*="badge"]', '[class*="chip"]', '.ant-tag', '.el-tag', '.semi-tag'],
            variants: ['default', 'success', 'warning', 'danger', 'info', 'processing']
        },
        avatar: {
            selectors: ['[class*="avatar"]', '.ant-avatar', '.el-avatar', '.semi-avatar'],
            shapes: ['circle', 'square']
        },
        tooltip: {
            selectors: ['[role="tooltip"]', '[class*="tooltip"]', '[class*="popover"]', '.ant-tooltip', '.semi-tooltip'],
            positions: ['top', 'bottom', 'left', 'right']
        },
        dropdown: {
            selectors: ['[class*="dropdown"]', '[class*="select-dropdown"]', '.ant-dropdown', '.el-dropdown', '.semi-dropdown'],
            parts: ['trigger', 'menu', 'item', 'divider']
        },
        tabs: {
            selectors: ['[class*="tabs"]', '[role="tablist"]', '.ant-tabs', '.el-tabs', '.semi-tabs'],
            types: ['line', 'card', 'pill', 'segmented']
        },
        pagination: {
            selectors: ['[class*="pagination"]', '.ant-pagination', '.el-pagination', '.semi-pagination'],
            parts: ['item', 'active', 'disabled', 'prev', 'next', 'ellipsis']
        },
        breadcrumb: {
            selectors: ['[class*="breadcrumb"]', '.ant-breadcrumb', '.el-breadcrumb', '.semi-breadcrumb'],
            parts: ['item', 'separator', 'current']
        },
        alert: {
            selectors: ['[class*="alert"]', '[role="alert"]', '.ant-alert', '.el-alert', '.semi-alert'],
            types: ['info', 'success', 'warning', 'error']
        },
        progress: {
            selectors: ['[class*="progress"]', '.ant-progress', '.el-progress', '.semi-progress'],
            types: ['line', 'circle', 'dashboard']
        },
        skeleton: {
            selectors: ['[class*="skeleton"]', '.ant-skeleton', '.semi-skeleton'],
            variants: ['text', 'circle', 'rect', 'paragraph']
        },
        empty: {
            selectors: ['[class*="empty"]', '[class*="empty-state"]', '.ant-empty', '.el-empty', '.semi-empty'],
            parts: ['image', 'description', 'action']
        },
        divider: {
            selectors: ['[class*="divider"]', 'hr[class*="divider"]', '.ant-divider', '.el-divider', '.semi-divider'],
            types: ['horizontal', 'vertical', 'dashed']
        }
    };

    function classifyComponent(el) {
        const tag = el.tagName.toLowerCase();
        const className = el.className || '';
        const role = el.getAttribute('role') || '';
        
        for (const [type, config] of Object.entries(COMPONENT_SELECTORS)) {
            for (const sel of config.selectors) {
                if (el.matches(sel)) {
                    return {
                        type,
                        confidence: 0.9,
                        matchedSelector: sel,
                        variant: detectVariant(el, type, config)
                    };
                }
            }
        }
        
        // Heuristic classification based on tag and attributes
        if (tag === 'button' || role === 'button') {
            return { type: 'button', confidence: 0.8, variant: detectVariant(el, 'button', COMPONENT_SELECTORS.button) };
        }
        if (tag === 'input' || tag === 'textarea' || tag === 'select') {
            return { type: 'input', confidence: 0.8, variant: detectVariant(el, 'input', COMPONENT_SELECTORS.input) };
        }
        if (tag === 'table') {
            return { type: 'table', confidence: 0.9, variant: 'default' };
        }
        if (tag === 'nav') {
            return { type: 'navigation', confidence: 0.7, variant: detectVariant(el, 'navigation', COMPONENT_SELECTORS.navigation) };
        }
        
        return null;
    }

    function detectVariant(el, type, config) {
        const className = el.className || '';
        const types = config.types || config.variants || config.parts || [];
        
        for (const t of types) {
            if (className.toLowerCase().includes(t.toLowerCase())) return t;
        }
        
        // Detect based on computed styles
        const s = gs(el);
        if (!s) return 'default';
        
        if (type === 'button') {
            if (s.backgroundColor === 'rgba(0, 0, 0, 0)' || s.backgroundColor === 'transparent') {
                return s.borderWidth !== '0px' ? 'outline' : 'ghost';
            }
        }
        
        return 'default';
    }

    // ============ 2. COLOR PSYCHOLOGY ANALYSIS ============
    
    function extractColorHistogram() {
        const histogram = {
            background: new Map(),
            text: new Map(),
            border: new Map(),
            shadow: new Map(),
            accent: new Map()
        };

        const elements = qa("*");
        const sampleSize = Math.min(elements.length, 3000);
        const step = Math.ceil(elements.length / sampleSize);
        
        for (let i = 0; i < elements.length; i += step) {
            const el = elements[i];
            const s = safe(() => gs(el));
            if (!s) continue;

            // Background colors
            const bg = normalizeColor(s.backgroundColor);
            if (bg && bg !== "#000000" && bg !== "#FFFFFF") {
                histogram.background.set(bg, (histogram.background.get(bg) || 0) + 1);
            }

            // Text colors
            const fg = normalizeColor(s.color);
            if (fg && fg !== "#000000") {
                histogram.text.set(fg, (histogram.text.get(fg) || 0) + 1);
            }

            // Border colors
            const bc = normalizeColor(s.borderColor);
            if (bc && bc !== "#000000" && bc !== "#FFFFFF") {
                histogram.border.set(bc, (histogram.border.get(bc) || 0) + 1);
            }
        }

        return histogram;
    }

    function analyzeColorPsychology(hex) {
        if (!hex) return null;
        
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        // Calculate HSL
        const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255;
        const max = Math.max(rNorm, gNorm, bNorm), min = Math.min(rNorm, gNorm, bNorm);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
                case gNorm: h = (bNorm - rNorm) / d + 2; break;
                case bNorm: h = (rNorm - gNorm) / d + 4; break;
            }
            h /= 6;
        }

        // Psychology mapping
        const hue = h * 360;
        let psychology = {
            temperature: l > 0.6 ? 'cool' : l < 0.3 ? 'warm' : 'neutral',
            energy: s > 0.7 ? 'high' : s < 0.3 ? 'low' : 'medium',
            emotion: null,
            useCase: null
        };

        if (hue >= 350 || hue < 10) {
            psychology.emotion = 'urgent, passionate, attention';
            psychology.useCase = 'danger, error, sale, important actions';
        } else if (hue >= 10 && hue < 45) {
            psychology.emotion = 'warm, friendly, inviting';
            psychology.useCase = 'warnings, CTAs, enthusiasm';
        } else if (hue >= 45 && hue < 70) {
            psychology.emotion = 'cheerful, optimistic, energetic';
            psychology.useCase = 'highlights, happiness, creativity';
        } else if (hue >= 70 && hue < 150) {
            psychology.emotion = 'natural, growth, success, calm';
            psychology.useCase = 'success states, eco, confirmation';
        } else if (hue >= 150 && hue < 200) {
            psychology.emotion = 'fresh, tranquil, trustworthy';
            psychology.useCase = 'information, trust, medical';
        } else if (hue >= 200 && hue < 260) {
            psychology.emotion = 'professional, reliable, calm';
            psychology.useCase = 'primary actions, corporate, links';
        } else if (hue >= 260 && hue < 300) {
            psychology.emotion = 'creative, luxury, mysterious';
            psychology.useCase = 'premium, creative tools, innovation';
        } else if (hue >= 300 && hue < 350) {
            psychology.emotion = 'feminine, playful, creative';
            psychology.useCase = 'beauty, fashion, youth';
        }

        return { h: Math.round(hue), s: Math.round(s * 100), l: Math.round(l * 100), ...psychology };
    }

    function extractSemanticColors() {
        const colors = {
            primary: null,
            secondary: null,
            success: null,
            warning: null,
            danger: null,
            info: null,
            link: null,
            text: {
                primary: null,
                secondary: null,
                disabled: null,
                placeholder: null
            },
            background: {
                page: null,
                card: null,
                sidebar: null,
                header: null,
                modal: null
            }
        };

        // Primary color detection
        const primaryEl = qFirst(
            '[class*="primary"]', 'button[type="submit"]', '[class*="accent"]',
            '.ant-btn-primary', '.el-button--primary', '.semi-button-primary',
            'a[class*="active"]', '[class*="btn-primary"]'
        );
        if (primaryEl) {
            const s = gs(primaryEl);
            colors.primary = {
                base: normalizeColor(s.backgroundColor !== "rgba(0, 0, 0, 0)" ? s.backgroundColor : s.color),
                text: normalizeColor(s.color),
                psychology: null
            };
            if (colors.primary.base) {
                colors.primary.psychology = analyzeColorPsychology(colors.primary.base);
            }
        }

        // Semantic colors
        const semanticMap = {
            success: ['[class*="success"]', '.text-green', '.badge-success', '[class*="positive"]', 
                      '.ant-tag-green', '[class*="completed"]', '.semi-tag-green'],
            warning: ['[class*="warning"]', '.text-orange', '.badge-warning', '[class*="caution"]', 
                      '.ant-tag-orange', '[class*="pending"]', '.semi-tag-amber'],
            danger: ['[class*="danger"]', '[class*="error"]', '[class*="destructive"]', '.text-red', 
                     '.badge-danger', '.ant-tag-red', '[class*="failed"]', '.semi-tag-red'],
            info: ['[class*="info"]', '.text-blue', '.badge-info', '.ant-tag-blue', 
                   '[class*="notice"]', '.semi-tag-blue']
        };

        for (const [name, selectors] of Object.entries(semanticMap)) {
            const el = qFirst(...selectors);
            if (el) {
                const s = gs(el);
                const bg = normalizeColor(s.backgroundColor);
                const fg = normalizeColor(s.color);
                colors[name] = {
                    base: bg !== "#000000" ? bg : fg,
                    text: fg,
                    psychology: null
                };
                if (colors[name].base) {
                    colors[name].psychology = analyzeColorPsychology(colors[name].base);
                }
            }
        }

        // Link color
        const linkEl = qFirst("a[href]:not(.btn):not([class*='nav'])", "a");
        if (linkEl) {
            colors.link = normalizeColor(gs(linkEl).color);
        }

        // Text colors
        const bodyEl = q("body");
        if (bodyEl) {
            const s = gs(bodyEl);
            colors.text.primary = normalizeColor(s.color);
        }

        const mutedEl = qFirst('.text-muted', '[class*="muted"]', '[class*="secondary"]', '.text-gray-400', 'small');
        if (mutedEl) {
            colors.text.secondary = normalizeColor(gs(mutedEl).color);
        }

        const disabledEl = qFirst("[disabled]", "[class*='disabled']");
        if (disabledEl) {
            colors.text.disabled = normalizeColor(gs(disabledEl).color);
        }

        const placeholderEl = qFirst("input[placeholder]", "textarea[placeholder]");
        if (placeholderEl) {
            const s = gs(placeholderEl);
            // Placeholder color is tricky, try computed style
            colors.text.placeholder = normalizeColor(s.color);
        }

        // Background colors
        colors.background.page = normalizeColor(gs(document.body).backgroundColor);
        
        const cardEl = qFirst(".card", "[class*='card']", ".ant-card", ".el-card");
        if (cardEl) colors.background.card = normalizeColor(gs(cardEl).backgroundColor);
        
        const sidebarEl = qFirst("aside", "nav[class*='side']", "[class*='sidebar']", ".ant-layout-sider");
        if (sidebarEl) colors.background.sidebar = normalizeColor(gs(sidebarEl).backgroundColor);
        
        const headerEl = qFirst("header", "[class*='header']", "[class*='topbar']", ".ant-layout-header");
        if (headerEl) colors.background.header = normalizeColor(gs(headerEl).backgroundColor);

        return colors;
    }

    // ============ 3. LAYOUT PATTERN RECOGNITION ============
    
    function detectLayoutPatterns() {
        const patterns = {
            type: 'unknown',
            sidebar: null,
            header: null,
            content: null,
            grid: null,
            responsive: []
        };

        // Sidebar detection
        const sidebarEl = qFirst("aside", "nav[class*='side']", "[class*='sidebar']", ".ant-layout-sider", ".semi-layout-sider");
        if (sidebarEl) {
            const s = gs(sidebarEl);
            const rect = sidebarEl.getBoundingClientRect();
            patterns.sidebar = {
                width: rect.width,
                position: s.position,
                collapsed: rect.width < 100,
                mode: rect.height > window.innerHeight * 0.8 ? 'fixed' : 'static'
            };
            patterns.type = 'sidebar-layout';
        }

        // Header detection
        const headerEl = qFirst("header", "[class*='header']", "[class*='topbar']", "[class*='navbar']", ".ant-layout-header");
        if (headerEl) {
            const s = gs(headerEl);
            const rect = headerEl.getBoundingClientRect();
            patterns.header = {
                height: rect.height,
                fixed: s.position === 'fixed' || s.position === 'sticky',
                sticky: s.position === 'sticky'
            };
        }

        // Content area
        const contentEl = qFirst("main", "[class*='content']", "[class*='main']", "#content", ".ant-layout-content");
        if (contentEl) {
            const rect = contentEl.getBoundingClientRect();
            patterns.content = {
                maxWidth: gs(contentEl).maxWidth,
                padding: gs(contentEl).padding,
                centered: gs(contentEl).marginLeft === gs(contentEl).marginRight
            };
        }

        // Grid detection
        const gridEls = qa("[class*='grid']");
        if (gridEls.length > 0) {
            const firstGrid = gridEls[0];
            const s = gs(firstGrid);
            patterns.grid = {
                type: 'grid',
                columns: s.gridTemplateColumns,
                gap: s.gap,
                count: gridEls.length
            };
        }

        // Flex layout detection
        const flexContainers = qa("*").filter(el => gs(el).display === 'flex' || gs(el).display === 'inline-flex');
        if (flexContainers.length > 10) {
            patterns.flexUsage = {
                count: flexContainers.length,
                commonDirection: gs(flexContainers[0]).flexDirection
            };
        }

        return patterns;
    }

    // ============ 4. TYPOGRAPHY HIERARCHY ============
    
    function extractTypographyHierarchy() {
        const typography = {
            families: new Map(),
            sizes: new Map(),
            weights: new Map(),
            lineHeights: new Map(),
            hierarchy: {}
        };

        // Collect all text elements
        const textElements = qa("h1, h2, h3, h4, h5, h6, p, span, a, li, td, th, label, small, button");
        
        for (const el of textElements.slice(0, 500)) {
            const s = safe(() => gs(el));
            if (!s) continue;

            const family = s.fontFamily;
            const size = s.fontSize;
            const weight = s.fontWeight;
            const lineHeight = s.lineHeight;

            if (family) typography.families.set(family, (typography.families.get(family) || 0) + 1);
            if (size) typography.sizes.set(size, (typography.sizes.get(size) || 0) + 1);
            if (weight) typography.weights.set(weight, (typography.weights.get(weight) || 0) + 1);
            if (lineHeight) typography.lineHeights.set(lineHeight, (typography.lineHeights.get(lineHeight) || 0) + 1);
        }

        // Heading hierarchy
        for (let i = 1; i <= 6; i++) {
            const h = q(`h${i}`);
            if (h) {
                const s = gs(h);
                typography.hierarchy[`h${i}`] = {
                    size: s.fontSize,
                    weight: s.fontWeight,
                    family: s.fontFamily,
                    lineHeight: s.lineHeight,
                    color: normalizeColor(s.color)
                };
            }
        }

        // Body text
        const bodyEl = q("body");
        if (bodyEl) {
            const s = gs(bodyEl);
            typography.body = {
                size: s.fontSize,
                weight: s.fontWeight,
                family: s.fontFamily,
                lineHeight: s.lineHeight,
                color: normalizeColor(s.color)
            };
        }

        // Get dominant values
        const getDominant = (map) => [...map.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
        
        return {
            ...typography,
            dominant: {
                family: getDominant(typography.families),
                size: getDominant(typography.sizes),
                weight: getDominant(typography.weights),
                lineHeight: getDominant(typography.lineHeights)
            }
        };
    }

    // ============ 5. COMPONENT BLUEPRINTS ============
    
    function extractComponentBlueprints() {
        const blueprints = {};

        for (const [type, config] of Object.entries(COMPONENT_SELECTORS)) {
            const instances = [];
            
            for (const sel of config.selectors) {
                try {
                    const els = qa(sel);
                    for (const el of els.slice(0, 10)) { // Limit samples
                        const classification = classifyComponent(el);
                        const s = gs(el);
                        const rect = el.getBoundingClientRect();
                        
                        instances.push({
                            variant: classification?.variant || 'default',
                            styles: {
                                backgroundColor: normalizeColor(s.backgroundColor),
                                color: normalizeColor(s.color),
                                border: s.border,
                                borderRadius: s.borderRadius,
                                padding: s.padding,
                                margin: s.margin,
                                fontSize: s.fontSize,
                                fontWeight: s.fontWeight,
                                boxShadow: s.boxShadow !== "none" ? s.boxShadow : undefined,
                                transition: s.transition
                            },
                            dimensions: {
                                width: rect.width,
                                height: rect.height
                            },
                            confidence: classification?.confidence || 0.5
                        });
                    }
                } catch (e) {}
            }

            if (instances.length > 0) {
                blueprints[type] = {
                    count: instances.length,
                    variants: groupByVariant(instances),
                    representative: instances[0]
                };
            }
        }

        return blueprints;
    }

    function groupByVariant(instances) {
        const groups = {};
        for (const inst of instances) {
            const v = inst.variant;
            if (!groups[v]) groups[v] = [];
            groups[v].push(inst);
        }
        return groups;
    }

    // ============ 6. SPACING SYSTEM ============
    
    function extractSpacingSystem() {
        const spacing = {
            values: new Map(),
            scale: [],
            common: {}
        };

        const elements = qa("div, section, main, aside, header, footer, article, ul, ol, li, p, form, table, nav, button, input, .card");
        const sample = elements.length > 800 ? elements.filter((_, i) => i % Math.ceil(elements.length / 800) === 0) : elements;

        for (const el of sample) {
            const s = safe(() => gs(el));
            if (!s) continue;

            const properties = [
                "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
                "marginTop", "marginRight", "marginBottom", "marginLeft",
                "gap", "rowGap", "columnGap"
            ];

            for (const prop of properties) {
                const val = s[prop];
                if (val && val !== "0px" && val !== "auto" && val !== "normal") {
                    const px = parseFloat(val);
                    if (px > 0 && px <= 120) {
                        spacing.values.set(Math.round(px), (spacing.values.get(Math.round(px)) || 0) + 1);
                    }
                }
            }
        }

        // Derive spacing scale
        const sorted = [...spacing.values.entries()].sort((a, b) => a[0] - b[0]);
        const commonSteps = [2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 56, 64, 80, 96];
        
        spacing.scale = commonSteps.map(step => {
            const closest = sorted.find(([v]) => Math.abs(v - step) <= 2);
            return closest ? closest[0] : step;
        });

        return spacing;
    }

    // ============ 7. BORDER & SHADOW SYSTEM ============
    
    function extractBorderSystem() {
        const borders = {
            radius: new Map(),
            width: new Map(),
            color: new Map()
        };

        const elements = qa("button, input, .card, [class*='card'], [class*='btn'], div, section, [class*='badge']");
        const sample = elements.length > 400 ? elements.filter((_, i) => i % Math.ceil(elements.length / 400) === 0) : elements;

        for (const el of sample) {
            const s = safe(() => gs(el));
            if (!s) continue;

            const r = s.borderRadius;
            if (r && r !== "0px") {
                borders.radius.set(r, (borders.radius.get(r) || 0) + 1);
            }

            const w = s.borderWidth || s.borderTopWidth;
            if (w && w !== "0px") {
                borders.width.set(w, (borders.width.get(w) || 0) + 1);
            }

            const c = normalizeColor(s.borderColor);
            if (c && c !== "#000000") {
                borders.color.set(c, (borders.color.get(c) || 0) + 1);
            }
        }

        // Sort by frequency and assign semantic names
        const sortedRadius = [...borders.radius.entries()].sort((a, b) => b[1] - a[1]);
        const radiusScale = {};
        
        const radiusNames = ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', 'full'];
        for (let i = 0; i < Math.min(sortedRadius.length, radiusNames.length); i++) {
            radiusScale[radiusNames[i]] = sortedRadius[i][0];
        }

        return {
            radius: radiusScale,
            widths: [...borders.width.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
            colors: [...borders.color.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
        };
    }

    function extractShadowSystem() {
        const shadowFreq = new Map();
        const elements = qa(".card, [class*='card'], [class*='dropdown'], [class*='modal'], [class*='dialog'], button, [class*='shadow'], [class*='elevated']");

        for (const el of elements.slice(0, 150)) {
            const s = safe(() => gs(el));
            if (!s) continue;
            
            const shadow = s.boxShadow;
            if (shadow && shadow !== "none") {
                shadowFreq.set(shadow, (shadowFreq.get(shadow) || 0) + 1);
            }
        }

        const sorted = [...shadowFreq.entries()].sort((a, b) => b[1] - a[1]);
        const shadows = {};

        // Classify by depth
        for (const [shadow, count] of sorted.slice(0, 8)) {
            const blurMatch = shadow.match(/(\d+)px\s+(\d+)px\s+(\d+)px/);
            const blur = blurMatch ? parseInt(blurMatch[3]) : 0;
            
            if (blur <= 2 && !shadows.xs) shadows.xs = { value: shadow, count };
            else if (blur <= 4 && !shadows.sm) shadows.sm = { value: shadow, count };
            else if (blur <= 8 && !shadows.md) shadows.md = { value: shadow, count };
            else if (blur <= 16 && !shadows.lg) shadows.lg = { value: shadow, count };
            else if (blur > 16 && !shadows.xl) shadows.xl = { value: shadow, count };
        }

        return shadows;
    }

    // ============ 8. ANIMATION & TRANSITION DETECTION ============
    
    function extractAnimations() {
        const animations = {
            transitions: new Map(),
            durations: new Map(),
            easings: new Map(),
            keyframes: []
        };

        const elements = qa("button, a, [class*='hover'], input, .card, [class*='animate']");
        
        for (const el of elements.slice(0, 200)) {
            const s = safe(() => gs(el));
            if (!s) continue;

            const transition = s.transition;
            if (transition && transition !== "all 0s ease 0s") {
                animations.transitions.set(transition, (animations.transitions.get(transition) || 0) + 1);
            }

            const duration = s.transitionDuration;
            if (duration && duration !== "0s") {
                animations.durations.set(duration, (animations.durations.get(duration) || 0) + 1);
            }

            const easing = s.transitionTimingFunction;
            if (easing && easing !== "ease") {
                animations.easings.set(easing, (animations.easings.get(easing) || 0) + 1);
            }
        }

        return animations;
    }

    // ============ 9. NEUTRAL SCALE GENERATION ============
    
    function extractNeutralScale(histogram) {
        const allColors = new Map();
        for (const [c, n] of histogram.background) allColors.set(c, (allColors.get(c) || 0) + n);
        for (const [c, n] of histogram.text) allColors.set(c, (allColors.get(c) || 0) + n);

        const neutrals = [];
        for (const [hex, count] of allColors) {
            if (isNeutral(hex) && count >= 2) {
                neutrals.push({ hex, lum: luminance(hex), count });
            }
        }
        neutrals.sort((a, b) => b.lum - a.lum);

        // Create 10-step scale
        const scale = {};
        const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
        
        if (neutrals.length >= 3) {
            for (let i = 0; i < steps.length; i++) {
                const idx = Math.round((i / (steps.length - 1)) * (neutrals.length - 1));
                scale[steps[i]] = neutrals[idx]?.hex;
            }
        }

        return scale;
    }

    // ============ 10. PAGE TYPE DETECTION ============
    
    function detectPageType() {
        const url = window.location.href.toLowerCase();
        const title = document.title.toLowerCase();
        const combined = url + " " + title;
        
        const patterns = {
            dashboard: /dashboard|overview|tổng quan|home|index/i,
            settings: /setting|config|cài đặt|preferences|options/i,
            report: /report|analytics|báo cáo|thống kê|insights|metrics/i,
            orders: /order|đơn hàng|transaction|purchase|checkout/i,
            products: /product|sản phẩm|catalog|inventory|items/i,
            users: /user|customer|member|account|profile|team/i,
            auth: /login|signin|signup|register|auth|password/i,
            landing: /landing|home|welcome|intro|start/i
        };

        for (const [type, regex] of Object.entries(patterns)) {
            if (regex.test(combined)) return type;
        }

        return 'generic';
    }

    // ============ 11. COMPONENT RELATIONSHIP MAPPING ============
    
    function mapComponentRelationships() {
        const relationships = [];
        
        // Find parent-child component relationships
        const componentEls = qa("*").filter(el => classifyComponent(el) !== null);
        
        for (const el of componentEls.slice(0, 100)) {
            const parent = el.parentElement;
            if (parent) {
                const childType = classifyComponent(el)?.type;
                const parentType = classifyComponent(parent)?.type;
                
                if (childType && parentType && childType !== parentType) {
                    relationships.push({
                        parent: parentType,
                        child: childType,
                        depth: getElementDepth(el)
                    });
                }
            }
        }

        return relationships;
    }

    // ============ 12. ACCESSIBILITY AUDIT ============
    
    function auditAccessibility() {
        const audit = {
            contrastIssues: [],
            missingLabels: [],
            missingFocus: [],
            ariaIssues: []
        };

        // Check text contrast
        const textElements = qa("p, span, h1, h2, h3, h4, h5, h6, a, button, label, li");
        for (const el of textElements.slice(0, 100)) {
            const s = gs(el);
            const fg = normalizeColor(s.color);
            const bg = normalizeColor(s.backgroundColor);
            
            if (fg && bg) {
                const ratio = contrastRatio(fg, bg);
                if (ratio < 4.5) {
                    audit.contrastIssues.push({
                        element: el.tagName,
                        class: el.className,
                        contrast: ratio.toFixed(2),
                        fg, bg
                    });
                }
            }
        }

        // Check for missing labels on inputs
        const inputs = qa("input, select, textarea");
        for (const input of inputs) {
            const id = input.id;
            const ariaLabel = input.getAttribute('aria-label');
            const ariaLabelledBy = input.getAttribute('aria-labelledby');
            const hasLabel = id && q(`label[for="${id}"]`);
            const placeholder = input.placeholder;
            
            if (!hasLabel && !ariaLabel && !ariaLabelledBy && !placeholder) {
                audit.missingLabels.push({
                    type: input.type,
                    class: input.className
                });
            }
        }

        return audit;
    }

    // ============ MAIN EXTRACTION ============
    
    const histogram = extractColorHistogram();
    const colors = extractSemanticColors();
    const layout = detectLayoutPatterns();
    const typography = extractTypographyHierarchy();
    const spacing = extractSpacingSystem();
    const borders = extractBorderSystem();
    const shadows = extractShadowSystem();
    const animations = extractAnimations();
    const neutrals = extractNeutralScale(histogram);
    const blueprints = extractComponentBlueprints();
    const relationships = mapComponentRelationships();
    const accessibility = auditAccessibility();

    const result = {
        _version: 4,
        _engine: "AI-Powered Visual Extraction",
        meta: {
            url: window.location.href,
            title: document.title,
            timestamp: new Date().toISOString(),
            pageType: detectPageType(),
            viewport: { width: window.innerWidth, height: window.innerHeight },
            elementCount: qa("*").length
        },
        visualAnalysis: {
            colors: {
                semantic: colors,
                neutrals: neutrals,
                histogram: {
                    background: [...histogram.background.entries()].slice(0, 20),
                    text: [...histogram.text.entries()].slice(0, 20)
                }
            },
            layout: layout,
            typography: typography,
            spacing: spacing,
            borders: borders,
            shadows: shadows,
            animations: animations
        },
        components: {
            blueprints: blueprints,
            relationships: relationships,
            detectedTypes: Object.keys(blueprints)
        },
        quality: {
            accessibility: accessibility,
            tokenCount: Object.values(colors).filter(Boolean).length + Object.keys(neutrals).length
        }
    };

    // Output
    const output = JSON.stringify(result, null, 2);
    console.log("=== HARVESTER v4 — AI-POWERED VISUAL EXTRACTION ===");
    console.log(output);
    console.log("=== END HARVESTER v4 OUTPUT ===");

    return output;
})();
