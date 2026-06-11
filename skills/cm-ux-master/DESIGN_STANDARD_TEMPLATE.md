# Design System

## Overview
- **Personality:** [e.g. Professional and trustworthy, Playful and vibrant]
- **Density:** [e.g. High density for data-rich dashboards, Spacious for consumer apps]

## Design Dials & Style Mode
- **Style Mode:** [functional | minimalist-editorial | brutalist | soft-premium | marketing-expressive] (default: functional)
- **DESIGN_VARIANCE:** [1-10] (functional baseline 4)
- **MOTION_INTENSITY:** [1-10] (functional baseline 3; >3 requires reduced-motion gating)
- **VISUAL_DENSITY:** [1-10] (functional baseline 6)
*Note: One Style Mode per project. Raising dials never overrides the Anti-Slop rules below.*

## Colors
- **Primary:** [Hex]
- **Secondary:** [Hex]
- **Tertiary:** [Hex]
- **Neutral:** [Hex]
*Note: Use primary colors sparingly for the most important actions. Ensure WCAG AA 4.5:1 contrast.*

## Typography
- **Headlines:** [Font Family]
- **Body:** [Font Family]
- **Labels:** [Font Family]
*Note: Avoid using more than two font weights on a single screen to maintain clarity.*

## Spacing & Shapes
- **Grid:** [e.g. columns, gutters, margins]
- **Shapes:** [e.g. Rounded (8px), Sharp (0px)]
- **Elevation:** [e.g. Flat, Subtle, Deep shadows]
*Note: Do not mix rounded and sharp corners within the same view.*

## Components
- **Buttons:** [Radius, padding, border styles]
- **Inputs:** [Focus states, borders, background variances]
- **Chips/Lists:** [Spacing, icon sizes, heights]

## Do's and Don'ts
- Do: [Action to encourage]
- Don't: [Action to avoid]

### Anti-Slop Rules (every mode, zero tolerance)
- Don't: use em-dashes in any copy (use periods, commas, line breaks, hyphens)
- Don't: use AI purple glow, pure black `#000000`, neon outer glow, or gradient text on large headers
- Don't: ship generic names (John Doe/Acme), fake-precise numbers (99.99%), or startup-slop verbs (Elevate/Seamless/Revolutionize)
- Don't: use three equal-column feature cards, section-number eyebrows, scroll cues, fake `<div>` screenshots, or more than one marquee
- Do: keep one accent (< 80% saturation), `min-h-[100dvh]` not `h-screen`, and gate motion above intensity 3 with `prefers-reduced-motion`

<!-- STITCH_TOKENS_START -->
{
  "version": "1",
  "styleMode": "functional",
  "dials": {
    "variance": 4,
    "motion": 3,
    "density": 6
  },
  "colors": {
    "primary": "",
    "secondary": "",
    "tertiary": "",
    "neutral": ""
  },
  "typography": {
    "headlines": "",
    "body": "",
    "labels": ""
  },
  "shapes": {
    "radius": "",
    "elevation": ""
  }
}
<!-- STITCH_TOKENS_END -->
