# UX Master Examples 🚀

Real-world examples and use cases for Harvester v4.

## Quick Start Examples

### 1. Extract & Use (30 seconds)

```bash
# Extract from any website
python wizard.py --url https://stripe.com --name "StripeClone"

# Check output
ls output/StripeClone/
# → design-system.css
# → figma-tokens.json
# → DESIGN.md
# → screenshot-desktop.png
```

### 2. Generate Components

```bash
# Generate all components
python component_generator.py \
  --input output/StripeClone/design-system.json \
  --all --output ./my-components
```

### 3. Figma Integration

```bash
# Export to Figma
python figma_bridge.py export \
  --input output/StripeClone/design-system.json \
  --name "StripeClone"
```

---

## Use Case Examples

### SaaS Dashboard

```bash
python wizard.py --url https://app.vercel.com --name "Dashboard"
python stitch_integration.py batch \
  --input output/Dashboard/design-system.json \
  --screens dashboard settings profile
```

### E-commerce

```bash
python wizard.py --url https://shopify.com --name "Ecommerce"
python component_generator.py \
  --input output/Ecommerce/design-system.json \
  --all --framework semi
```

---

See full documentation in the main README.
