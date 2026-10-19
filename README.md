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
| **Cambridge badge** `cambridge-partner-badge.png` | `assets/brand/cambridge-partner-badge.png` |
| **Cambridge Fit link** | `js/config.js` → `CAMBRIDGE_FIT_URL` (applies to all 4 compass buttons) |
| Phone, WhatsApp, email, address, socials | `js/config.js` → `SLOKA_SITE` (also update the JSON-LD block in `index.html`) |
| CRM | `js/config.js` → `SLOKA_ENQUIRY_CONFIG` (see below) |
| Canonical URL / schema URLs | `index.html` `<head>` (currently `example.com`) |
| Google Analytics / Meta Pixel IDs | commented blocks in `index.html` `<head>` |
| Photos still missing | `swimming`, `art-music`, `students-group`, `principal`, `senior-students` (placeholders in `assets/img/`) |
| Principal's signature | Done. `assets/brand/principal-signature.png` (ink lifted from the scan). In `index.html`, a wide "pen" path (`.signature__pen`) traces the stroke order as a mask so it signs live. Ink colour is the `flood-color` in `#sigInk` (maroon; use `#1F7A5C` for her original green) |
| **Drive times on the map** | `js/config.js` → `LOCALITIES[].mins`. These are rough estimates; have the admissions or transport team check and correct them |
| Privacy policy | `privacy.html` is a placeholder |

### Photos

Each photo exists as `name-800.webp` and `name-1600.webp`. To replace one, export both widths in WebP with the same names (landscape shots 16:9, `principal` and `senior-students` 4:5, `swimming` and `art-music` 4:3). If you change an aspect ratio, update the `width`/`height` attributes on the `<img>`.

Currently mapped from the supplied photos: `hero-campus` (building), `sports` (basketball), `debate` (Dealathon), `classroom` (flipped teaching), `early-years` (blocks), `assembly-speaking` (SPIN podcast), `skating-karate` (skating), `steam-lab` (robotics).

## CRM integration

The form is one isolated component: `<section id="enquiry-form">` + `js/enquiry-form.js`, configured only through `window.SLOKA_ENQUIRY_CONFIG` in `js/config.js`:

- **Form action URL (no secret):** set `CRM_ENDPOINT` to the URL and `ENCODING: 'form'`.
- **API with a key:** set `CRM_ENDPOINT: '/api/enquiry'` and deploy `api/enquiry.js` as a serverless function (Vercel/Netlify-style handler). Put `CRM_API_URL`, `CRM_API_KEY` and `ALLOWED_ORIGIN` in the host's environment variables. **Never put the key in front-end code.**
- **Embed widget:** paste the vendor markup into `EMBED_HTML`; it replaces the form fields inside the ticket.
- `FIELD_MAP` renames our fields to the CRM's names. `EXTRA_FIELDS` adds constants such as campus and lead source.
- Hidden fields `utm_source`, `utm_medium`, `utm_campaign` and `page_url` are filled from the URL. UTMs are remembered for the session.
- While `CRM_ENDPOINT` is empty, submissions are logged to the console and are not sent anywhere.
- On success the page fires `sloka:enquiry-sent`, plus `gtag('event','generate_lead')` and `fbq('track','Lead')` if those are installed.

## Structure

```
index.html              all sections, semantic markup, SEO + schema
css/style.css           tokens, layouts, mobile, reduced motion
js/config.js            site + CRM config (edit me)
js/app.js               orchestrator
js/enquiry-form.js      isolated form component
js/modules/
  env.js                device flags, pointer, lazy helpers
  mandala.js            SVG mandala builder + bloom / pulse
  smooth.js             Lenis + GSAP ticker, scroll velocity, anchors
  motion.js             colour morph, text and mask reveals, velocity skew, header, footer
  loader.js  spark.js  hero.js  compass.js  seven.js  approach.js
  pathway.js results.js voice.js bento.js prism.js letter.js
  stories.js orbit-map.js
  gl.js                 ~2 KB WebGL helper (hero breathing, swim ripple, particles)
api/enquiry.js          serverless CRM proxy
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
- Lighthouse has not been run yet. Run it against the deployed build with real photos and logo in place.
