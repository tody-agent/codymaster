#!/bin/bash
# Generate comprehensive test projects for UX-Master
# Creates projects with different languages, stacks, and configurations

set -e

BASE_DIR="test-projects-generated"
LANGS=("en" "vi" "ja" "fr" "de" "es" "it" "pt" "ko" "zh")
STACKS=("react" "vue" "nextjs" "svelte" "angular" "html" "nuxt" "astro")
CATEGORIES=("landing" "dashboard" "mobile" "ecommerce")

# Language names for content
declare -A LANG_NAMES=(
    ["en"]="English"
    ["vi"]="Vietnamese"
    ["ja"]="Japanese"
    ["fr"]="French"
    ["de"]="German"
    ["es"]="Spanish"
    ["it"]="Italian"
    ["pt"]="Portuguese"
    ["ko"]="Korean"
    ["zh"]="Chinese"
)

# Sample content per language
declare -A CONTENT=(
    ["en"]="Welcome to our platform. Get started today."
    ["vi"]="Chào mừng đến với nền tảng của chúng tôi. Bắt đầu ngay hôm nay."
    ["ja"]="私たちのプラットフォームへようこそ。今日から始めましょう。"
    ["fr"]="Bienvenue sur notre plateforme. Commencez dès aujourd'hui."
    ["de"]="Willkommen auf unserer Plattform. Beginnen Sie noch heute."
    ["es"]="Bienvenido a nuestra plataforma. Comience hoy."
    ["it"]="Benvenuto nella nostra piattaforma. Inizia oggi."
    ["pt"]="Bem-vindo à nossa plataforma. Comece hoje."
    ["ko"]="우리 플랫폼에 오신 것을 환영합니다. 오늘 시작하세요."
    ["zh"]="欢迎使用我们的平台。今天就开始吧。"
)

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║   UX-Master Test Project Generator                            ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "Generating test projects..."
echo "  Languages: ${#LANGS[@]}"
echo "  Stacks: ${#STACKS[@]}"
echo "  Categories: ${#CATEGORIES[@]}"
echo ""

# Clean and create base directory
rm -rf "${BASE_DIR}"
mkdir -p "${BASE_DIR}"

TOTAL_PROJECTS=0

# Generate landing page projects
for lang in "${LANGS[@]}"; do
    for stack in "${STACKS[@]}"; do
        project_dir="${BASE_DIR}/landing/${lang}-${stack}"
        mkdir -p "${project_dir}/components"
        
        # Generate HTML
        cat > "${project_dir}/index.html" << EOF
<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${CONTENT[$lang]}</title>
    <style>
        :root {
            /* Color System */
            --color-primary: #0064FA;
            --color-primary-hover: #0052CC;
            --color-secondary: #4ECDC4;
            --color-success: #10B981;
            --color-warning: #F59E0B;
            --color-danger: #EF4444;
            --color-info: #3B82F6;
            
            /* Neutral Scale */
            --color-white: #FFFFFF;
            --color-gray-50: #F9FAFB;
            --color-gray-100: #F3F4F6;
            --color-gray-200: #E5E7EB;
            --color-gray-300: #D1D5DB;
            --color-gray-400: #9CA3AF;
            --color-gray-500: #6B7280;
            --color-gray-600: #4B5563;
            --color-gray-700: #374151;
            --color-gray-800: #1F2937;
            --color-gray-900: #111827;
            --color-black: #000000;
            
            /* Spacing System (4px base) */
            --spacing-unit: 4px;
            --spacing-0: 0;
            --spacing-1: calc(var(--spacing-unit) * 1);   /* 4px */
            --spacing-2: calc(var(--spacing-unit) * 2);   /* 8px */
            --spacing-3: calc(var(--spacing-unit) * 3);   /* 12px */
            --spacing-4: calc(var(--spacing-unit) * 4);   /* 16px */
            --spacing-5: calc(var(--spacing-unit) * 5);   /* 20px */
            --spacing-6: calc(var(--spacing-unit) * 6);   /* 24px */
            --spacing-8: calc(var(--spacing-unit) * 8);   /* 32px */
            --spacing-10: calc(var(--spacing-unit) * 10); /* 40px */
            --spacing-12: calc(var(--spacing-unit) * 12); /* 48px */
            --spacing-16: calc(var(--spacing-unit) * 16); /* 64px */
            
            /* Typography */
            --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            --font-size-xs: 12px;
            --font-size-sm: 14px;
            --font-size-base: 16px;
            --font-size-lg: 18px;
            --font-size-xl: 20px;
            --font-size-2xl: 24px;
            --font-size-3xl: 30px;
            --font-size-4xl: 36px;
            
            /* Border Radius */
            --radius-none: 0;
            --radius-sm: 3px;
            --radius-md: 6px;
            --radius-lg: 8px;
            --radius-xl: 12px;
            --radius-full: 9999px;
            
            /* Shadows */
            --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: var(--font-family);
            font-size: var(--font-size-base);
            line-height: 1.5;
            color: var(--color-gray-900);
            background: var(--color-white);
        }
        
        /* Hero Section */
        .hero {
            padding: var(--spacing-16) var(--spacing-8);
            text-align: center;
            background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
            color: var(--color-white);
        }
        
        .hero h1 {
            font-size: var(--font-size-4xl);
            font-weight: 700;
            margin-bottom: var(--spacing-6);
            line-height: 1.2;
        }
        
        .hero p {
            font-size: var(--font-size-xl);
            margin-bottom: var(--spacing-8);
            opacity: 0.9;
        }
        
        /* Typography Hierarchy */
        h1 { font-size: var(--font-size-4xl); font-weight: 700; line-height: 1.2; margin-bottom: var(--spacing-6); }
        h2 { font-size: var(--font-size-3xl); font-weight: 600; line-height: 1.3; margin-bottom: var(--spacing-4); }
        h3 { font-size: var(--font-size-2xl); font-weight: 600; line-height: 1.4; margin-bottom: var(--spacing-4); }
        h4 { font-size: var(--font-size-xl); font-weight: 600; line-height: 1.4; margin-bottom: var(--spacing-3); }
        
        /* Button Component */
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-3) var(--spacing-6);
            font-size: var(--font-size-base);
            font-weight: 500;
            line-height: 1.5;
            border-radius: var(--radius-md);
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
            min-height: 44px; /* Fitts's Law */
        }
        
        .btn-primary {
            background: var(--color-primary);
            color: var(--color-white);
        }
        
        .btn-primary:hover {
            background: var(--color-primary-hover);
        }
        
        .btn-secondary {
            background: var(--color-gray-100);
            color: var(--color-gray-900);
        }
        
        .btn-lg {
            padding: var(--spacing-4) var(--spacing-8);
            font-size: var(--font-size-lg);
            min-height: 52px;
        }
        
        /* Card Component */
        .card {
            background: var(--color-white);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-md);
            padding: var(--spacing-6);
        }
        
        /* Form Components */
        .input {
            width: 100%;
            padding: var(--spacing-3) var(--spacing-4);
            font-size: var(--font-size-base);
            border: 1px solid var(--color-gray-300);
            border-radius: var(--radius-md);
            min-height: 44px;
        }
        
        .input:focus {
            outline: none;
            border-color: var(--color-primary);
            box-shadow: 0 0 0 3px rgba(0, 100, 250, 0.1);
        }
        
        /* Layout */
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 var(--spacing-6);
        }
        
        .grid {
            display: grid;
            gap: var(--spacing-6);
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        }
        
        /* Features Section */
        .features {
            padding: var(--spacing-16) 0;
        }
        
        .feature-card {
            padding: var(--spacing-6);
            text-align: center;
        }
        
        .feature-icon {
            width: 64px;
            height: 64px;
            margin: 0 auto var(--spacing-4);
            background: var(--color-primary);
            border-radius: var(--radius-xl);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--color-white);
            font-size: var(--font-size-2xl);
        }
        
        /* CTA Section */
        .cta {
            padding: var(--spacing-16) 0;
            background: var(--color-gray-50);
            text-align: center;
        }
        
        .cta h2 {
            margin-bottom: var(--spacing-6);
        }
        
        .cta-form {
            display: flex;
            gap: var(--spacing-4);
            justify-content: center;
            max-width: 500px;
            margin: 0 auto;
        }
        
        /* Footer */
        footer {
            padding: var(--spacing-12) 0;
            background: var(--color-gray-900);
            color: var(--color-gray-400);
            text-align: center;
        }
        
        /* Accessibility */
        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        }
        
        /* Focus styles */
        :focus-visible {
            outline: 2px solid var(--color-primary);
            outline-offset: 2px;
        }
        
        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        }
    </style>
</head>
<body>
    <!-- Hero Section -->
    <section class="hero" role="banner">
        <div class="container">
            <h1>${CONTENT[$lang]}</h1>
            <p>Build better products with our platform. ${CONTENT[$lang]}</p>
            <button class="btn btn-primary btn-lg">Get Started</button>
            <button class="btn btn-secondary btn-lg">Learn More</button>
        </div>
    </section>

    <!-- Features Section -->
    <section class="features" aria-labelledby="features-heading">
        <div class="container">
            <h2 id="features-heading">Features</h2>
            <div class="grid">
                <div class="feature-card card">
                    <div class="feature-icon">⚡</div>
                    <h3>Fast</h3>
                    <p>Lightning fast performance</p>
                </div>
                <div class="feature-card card">
                    <div class="feature-icon">🔒</div>
                    <h3>Secure</h3>
                    <p>Enterprise-grade security</p>
                </div>
                <div class="feature-card card">
                    <div class="feature-icon">🎨</div>
                    <h3>Beautiful</h3>
                    <p>Stunning design system</p>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="cta" aria-labelledby="cta-heading">
        <div class="container">
            <h2 id="cta-heading">Ready to start?</h2>
            <form class="cta-form" onsubmit="return false;">
                <label for="email" class="sr-only">Email address</label>
                <input type="email" id="email" class="input" placeholder="Enter your email" required>
                <button type="submit" class="btn btn-primary btn-lg">Sign Up</button>
            </form>
        </div>
    </section>

    <!-- Footer -->
    <footer>
        <div class="container">
            <p>&copy; 2024 Company. ${CONTENT[$lang]}</p>
        </div>
    </footer>
</body>
</html>
EOF

        # Generate design tokens JSON
        cat > "${project_dir}/design-system.json" << EOF
{
    "_version": 4,
    "project": {
        "name": "Landing-${lang}-${stack}",
        "language": "${lang}",
        "stack": "${stack}",
        "type": "landing-page"
    },
    "meta": {
        "pageType": "landing",
        "language": "${lang}",
        "framework": "${stack}",
        "created": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    },
    "visualAnalysis": {
        "colors": {
            "semantic": {
                "primary": {
                    "base": "#0064FA",
                    "hover": "#0052CC",
                    "psychology": {
                        "h": 220,
                        "emotion": "professional, reliable, calm",
                        "useCase": "primary actions, links"
                    }
                },
                "secondary": {
                    "base": "#4ECDC4",
                    "psychology": {
                        "emotion": "fresh, modern"
                    }
                },
                "success": {"base": "#10B981"},
                "warning": {"base": "#F59E0B"},
                "danger": {"base": "#EF4444"},
                "info": {"base": "#3B82F6"}
            },
            "neutrals": {
                "50": "#F9FAFB",
                "100": "#F3F4F6",
                "200": "#E5E7EB",
                "300": "#D1D5DB",
                "400": "#9CA3AF",
                "500": "#6B7280",
                "600": "#4B5563",
                "700": "#374151",
                "800": "#1F2937",
                "900": "#111827"
            }
        },
        "typography": {
            "fontFamily": {
                "base": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                "heading": "Inter, system-ui, sans-serif"
            },
            "scale": {
                "xs": "12px",
                "sm": "14px",
                "base": "16px",
                "lg": "18px",
                "xl": "20px",
                "2xl": "24px",
                "3xl": "30px",
                "4xl": "36px"
            },
            "weights": {
                "normal": 400,
                "medium": 500,
                "semibold": 600,
                "bold": 700
            },
            "hierarchy": {
                "h1": {"size": "36px", "weight": "700", "lineHeight": "1.2"},
                "h2": {"size": "30px", "weight": "600", "lineHeight": "1.3"},
                "h3": {"size": "24px", "weight": "600", "lineHeight": "1.4"},
                "h4": {"size": "20px", "weight": "600", "lineHeight": "1.4"}
            }
        },
        "spacing": {
            "unit": "4px",
            "scale": [4, 8, 12, 16, 20, 24, 32, 40, 48, 64],
            "base": 4
        },
        "borders": {
            "radius": {
                "none": "0",
                "sm": "3px",
                "md": "6px",
                "lg": "8px",
                "xl": "12px",
                "full": "9999px"
            }
        },
        "shadows": {
            "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            "md": "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
        }
    },
    "components": {
        "blueprints": {
            "button": {
                "count": 4,
                "variants": ["primary", "secondary", "ghost", "danger"],
                "sizes": ["sm", "md", "lg"],
                "representative": {
                    "styles": {
                        "borderRadius": "6px",
                        "fontWeight": "500",
                        "padding": "12px 24px"
                    },
                    "dimensions": {
                        "width": 120,
                        "height": 48
                    }
                }
            },
            "input": {
                "count": 1,
                "representative": {
                    "dimensions": {
                        "width": 300,
                        "height": 44
                    }
                }
            },
            "card": {
                "count": 3,
                "representative": {
                    "styles": {
                        "borderRadius": "8px",
                        "padding": "24px"
                    }
                }
            }
        }
    },
    "quality": {
        "accessibility": {
            "contrastIssues": [],
            "missingLabels": [],
            "missingFocus": [],
            "ariaIssues": []
        }
    }
}
EOF

        TOTAL_PROJECTS=$((TOTAL_PROJECTS + 1))
    done
done

# Summary
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "                      GENERATION COMPLETE                      "
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  Total Projects: ${TOTAL_PROJECTS}"
echo "  Location: ${BASE_DIR}/"
echo ""
echo "  Structure:"
echo "    ${BASE_DIR}/"
echo "    └── landing/"
echo "        ├── ${LANGS[0]}-${STACKS[0]}/"
echo "        ├── ${LANGS[1]}-${STACKS[1]}/"
echo "        ├── ..."
echo ""
echo "  Sample Commands:"
echo "    uxm validate ${BASE_DIR}/landing/en-react/index.html --suite mobile"
echo "    uxm validate ${BASE_DIR}/landing/vi-vue/index.html --suite all"
echo "    uxm validate ${BASE_DIR}/landing/ja-html/index.html --format html"
echo ""
echo "═══════════════════════════════════════════════════════════════"
