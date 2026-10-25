# Sloka International School, Manneguda: admissions landing page

Single-page, static site (HTML + CSS + vanilla JS modules). No build step.

**Concept:** "Every child is born with a unique spark." The Sloka mandala is rebuilt as an SVG with separately animated petals. It blooms in the loader, travels with the visitor as the spark companion, rides the metro line as the train, sits at the centre of the map and fully blooms in the footer.

## Run locally

```bash
node scripts/serve.mjs
```

Open http://localhost:5173. ES modules need a server; opening `index.html` from disk will not run the JS.

## Before launch: checklist

| What | Where |
|---|---|
| Logo | Done. `assets/brand/sloka-logo.png` (640px web copy) and `sloka-logo-original.png` (full size). Only the black JPEG corners outside the pill were made transparent |
| Cambridge logo | Done. `assets/brand/cambridge-international-school-*.webp` (original kept as PNG), shown unaltered on a white plate in the hero and pathway |
| Cambridge Fit link | Done: `js/config.js` → `CAMBRIDGE_FIT_URL` (Google Form, used by all 4 compass buttons) |
| Phone, WhatsApp, email, address, socials | Done, from slokainternational.com/contact-us (Manneguda campus). Edit in `js/config.js` → `SLOKA_SITE` and the JSON-LD block in `index.html` |
| CRM | Done: ExtraaEdge widget (see below) |
| Canonical URL / schema URLs | `index.html` `<head>` (currently `example.com`) |
| Google Analytics / Meta Pixel IDs | commented blocks in `index.html` `<head>` |
| Photos | All in. Only the principal portrait placeholder remains, and it is no longer used |
| Principal's signature | Done. `assets/brand/principal-signature.png` (ink lifted from the scan). In `index.html`, a wide "pen" path (`.signature__pen`) traces the stroke order as a mask so it signs live. Ink colour is the `flood-color` in `#sigInk` (maroon; use `#1F7A5C` for her original green) |
| **Drive times on the map** | `js/config.js` → `LOCALITIES[].mins`. These are rough estimates; have the admissions or transport team check and correct them |
| Privacy policy | `privacy.html` is a placeholder |

### Photos

Each photo exists as `name-800.webp` and `name-1600.webp`. To replace one, export both widths in WebP with the same names (landscape shots 16:9, `principal` and `senior-students` 4:5, `swimming` and `art-music` 4:3). If you change an aspect ratio, update the `width`/`height` attributes on the `<img>`.

Currently mapped from the supplied photos: `hero-campus` (building), `sports` (basketball), `debate` (Dealathon), `classroom` (flipped teaching), `early-years` (blocks), `assembly-speaking` (SPIN podcast), `skating-karate` (skating), `steam-lab` (robotics).

## Enquiry form (ExtraaEdge CRM widget)

The enquiry form is the school's **ExtraaEdge** widget, shown inside the admission-ticket frame in `<section id="enquiry-form">`:

- Container: `<div id="ee-form-8" data-lenis-prevent>` in `index.html`. Loader: ExtraaEdge's `widget.js`, loaded **once** with `defer` (it waits for DOMContentLoaded, then builds the form).
- `js/enquiry-widget.js` is our glue only: a one-time init fallback, keeping smooth scrolling off the widget's pop-ups/dropdowns, and success detection. It never changes the widget's fields or behaviour.
- **Success detection:** the widget opens `.ee-form-widget-feedback.success` after a lead is saved (errors/duplicates use `.failure`). On success only: the ticket's RECEIVED stamp, `dataLayer.push({event: "enquiry_submitted"})`, `fbq("track", "Lead")` if the Meta Pixel exists, and the page event `sloka:enquiry-sent`.
- **UTM:** captured by the widget itself. Its live config maps `utm_source` → LeadSource, `utm_medium` → LeadMedium, `utm_campaign` → LeadCampaign, added to the add-lead request; it also remembers the URL for 30 days.
- **Styling:** `css/style.css`, section *ExtraaEdge enquiry widget*, scoped to `#ee-form-8` (plus the widget's own dropdown/pop-up classes, which it attaches to `<body>`).
- **Accessibility/speed notes (vendor code):** the widget loads ~700 KB (jQuery, lodash, phone and date pickers, its 266 KB library, master data) and has a few ARIA issues in its own markup (unnamed dropdowns, "Register Now" label on a "Submit" button). Only ExtraaEdge can change these.

## Structure

```
index.html              all sections, semantic markup, SEO + schema
css/style.css           tokens, layouts, mobile, reduced motion
js/config.js            site + CRM config (edit me)
js/app.js               orchestrator
js/enquiry-widget.js    ExtraaEdge widget glue (init fallback, success → stamp + conversion events)
js/modules/
  env.js                device flags, pointer, lazy helpers
  mandala.js            SVG mandala builder + bloom / pulse
  smooth.js             Lenis + GSAP ticker, scroll velocity, anchors
  motion.js             colour morph, text and mask reveals, velocity skew, header, footer
  loader.js  spark.js  hero.js  compass.js  seven.js  approach.js
  pathway.js results.js voice.js bento.js reasons.js prism.js letter.js
  stories.js orbit-map.js
  gl.js                 ~2 KB WebGL helper (hero breathing, swim ripple, particles)
scripts/serve.mjs       local static server
```

## Libraries (CDN, pinned)

GSAP 3.12.5 + ScrollTrigger, Lenis 1.1.13, SplitType 0.3.4, Matter.js 0.19.0 (lazy-loaded, desktop only).

For WebGL I used a small hand-written helper (`gl.js`) instead of Three.js/OGL. The three effects (breathing zoom, ripple, particle scatter) each need a single shader, so a 3D engine would add about 150 KB for no visual gain on a 4G phone.

## Performance and accessibility notes

- Hero image is preloaded with `srcset`; everything else is `loading="lazy"`.
- Heavy toys initialise only when near the viewport, and their render loops pause off-screen.
- Mobile and touch devices get no WebGL hovers and no physics (tokens drop into a CSS grid). The spark rides the scroll position, and the voice waveform reacts to scroll speed.
- `prefers-reduced-motion`: no loader bloom, no smooth scroll, no pinning effects. The prism lays flat, every station is open and reveals become simple fades.
- If the CDN fails, the page stays fully readable with no motion. The form still works on its own.
- Every toy has static content in the DOM: the slider has a text summary, the physics section has its headline and a token grid, and the map has a hidden list of areas.
- **Mobile Lighthouse** (local, gzip on, simulated slow 4G + mid-range phone): Performance 96, Accessibility 100, Best Practices 96, SEO 100. LCP 2.6–2.7 s, CLS 0.02, TBT ≈ 0 ms. Measured before the ExtraaEdge widget was added; with the widget, mobile Performance is about 76–78 (see Enquiry form notes). Re-run on the live URL.
- Phones get: 480px images, WebP logo/signature, non-blocking fonts, a quicker loader, below-the-fold set-up deferred until the loader opens, a stacked memorise/understand split, an elliptical map with collision-free labels, ≥44px tap targets and ≥12px text.
