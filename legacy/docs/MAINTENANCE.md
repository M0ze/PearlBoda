# PearlBoda UI Maintenance Guide

## Architecture Overview

PearlBoda uses a vanilla JavaScript frontend with Express/Node.js backend and SQLite storage.

```
public/
├── css/
│   ├── design-system.css   # Shared tokens, nav, footer, buttons
│   ├── landing.css         # Landing page sections
│   ├── about.css           # About page layout
│   └── order.css           # Order form & map preview
├── js/
│   ├── shared.js           # Nav, dark mode, reveal animations
│   ├── landing.js          # Three.js hero + GSAP scroll triggers
│   ├── about.js            # Light 3D, counters, FAQ accordion
│   └── order.js            # Multi-step form, map preview, Socket.IO
├── landing.html            # Home page (/)
├── about.html              # About page (/about)
├── order.html              # Order page (/order)
└── driver.html             # Driver dashboard (/driver)
```

## Design System

CSS custom properties in `design-system.css`:

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#e65100` | CTAs, accents |
| `--color-secondary` | `#2e7d32` | Trust, nature |
| `--color-accent` | `#ffc107` | Safety, highlights |
| `--color-charcoal` | `#1a1a2e` | Headlines, dark bg |

Typography: **Poppins** (headlines), **Inter** (body) via Google Fonts.

## 3D Assets

All 3D models are **procedural** (built from Three.js primitives) — no external GLTF/OBJ files to maintain.

- **Landing hero**: Stylized motorcycle, road plane, floating particles
- **About hero**: Connected city nodes (Hioma, Kampala, Fort Portal)
- **Order preview**: Grid map with location pins and rotating bike icon

To replace with external models later, load via `THREE.GLTFLoader` and swap the `createMotorcycle()` function in `landing.js`.

## Adding a New City

1. Add city name to the `/api/cities` array in `server.js`
2. Add `CITY_COORDS` entry in `public/js/order.js`
3. Add a city card in `landing.html` and node in `about.js` `initAboutScene()`

## Performance Tips

- Three.js and GSAP load from CDN with `defer`
- 3D scenes respect `prefers-reduced-motion` (static fallback)
- Pixel ratio capped at 2× on retina displays
- Loading skeleton hides until Three.js scene initializes

## Accessibility

- WCAG AA color contrast on text/buttons
- `aria-label`, `aria-expanded`, `role="dialog"` on interactive elements
- Keyboard-focusable FAQ accordion and form controls
- `prefers-reduced-motion` disables animations and 3D

## Running Locally

```bash
npm install
npm start
# Visit http://localhost:3000
```

## Dark Mode

Toggle persists in `localStorage` key `pearlboda-theme`. Values: `light` | `dark`.

## Socket.IO Events

| Event | Direction | Purpose |
|-------|-----------|---------|
| `join_ride` | Client → Server | Join ride room for updates |
| `new_ride` | Server → Drivers | New ride available |
| `ride_accepted` | Server → Customer | Driver accepted |
| `location_update` | Server → Customer | Driver location |
| `ride_completed` | Server → Customer | Ride finished |

## Lighthouse Target

Aim for 80+ by:
- Keeping CDN scripts deferred
- Using procedural 3D (no large asset downloads)
- Semantic HTML with meta tags for SEO
