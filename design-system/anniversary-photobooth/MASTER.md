# Anniversary Photobooth — Design System (Override)

> **Direction:** Antique · Elegant · Vintage Analog  
> **Updated:** 2026-07-17  
> **Note:** Overrides the pink Aurora recipe. Prefer this file over gift-pink tokens.

## Style

- **Name:** Vintage Analog / Classic Elegant
- **Keywords:** parchment, sepia, antique gold, film grain, hairline frames, restrained motion
- **Avoid:** pink accents, neon, playful rounded pills, aurora orbs

## Colors

| Role | Hex | Notes |
|------|-----|-------|
| Primary / Ink | `#1C1917` | Espresso / stone |
| On Primary | `#FAF6F0` | Ivory text on dark |
| Secondary / Gold | `#A16207` | Antique gold accents |
| Accent | `#8B6914` | Aged brass |
| Background | `#F5EFE4` | Warm parchment |
| Surface | `#FAF6F0` | Panel ivory |
| Muted | `#EDE6D9` | Soft taupe fill |
| Border | `#D4C9B5` | Aged paper edge |
| Foreground muted | `#57534E` | Body secondary |

## Typography

- **Display / Brand:** Playfair Display
- **Body / UI:** Source Sans 3
- **Mood:** editorial, timeless, literary

## Components

- Buttons: sharp `rounded-sm`, uppercase tracking, charcoal fill + gold border on hover
- Frames: double hairline gold inset (`.antique-frame`)
- Grain: subtle SVG noise overlay on `.antique-stage`
- Motion: fade-up only; respect `prefers-reduced-motion`
