/* =====================================================================
   The Sloka mandala ("the spark"), rebuilt as SVG so every petal can move.
   Layers, inside → out: core dot, ring, 8 yellow inner petals,
   8 orange outer petals, 16 maroon diamond points, 16 orange dots.
   Petal paths point "up" (−y) inside a rotated <g>, so animating a path's
   local y moves it outward and scaling from its bottom grows it from the centre.
   ===================================================================== */

const INNER = 'M0-15C10-23 12-36 0-46C-12-36-10-23 0-15Z';
const OUTER = 'M0-22C18-33 21-56 0-72C-21-56-18-33 0-22Z';
const DIAMOND = 'M0-76L4.5-83L0-90L-4.5-83Z';

function ringOf(count, offset, make) {
  let out = '';
  for (let i = 0; i < count; i++) out += `<g transform="rotate(${(i * 360) / count + offset})">${make(i)}</g>`;
  return out;
}

export function mandalaMarkup() {
  return `<svg viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">
  <g class="m-rot">
    <circle class="m-halo" r="97"/>
    <g class="m-dot-g">${ringOf(16, 11.25, () => '<circle class="m-dot" cy="-88" r="3.2"/>')}</g>
    <g class="m-dia-g">${ringOf(16, 0, () => `<path class="m-dia" d="${DIAMOND}"/>`)}</g>
    <g class="m-out-g">${ringOf(8, 22.5, () => `<path class="m-out" d="${OUTER}"/>`)}</g>
    <g class="m-in-g">${ringOf(8, 0, () => `<path class="m-in" d="${INNER}"/>`)}</g>
    <circle class="m-ring" r="13"/>
    <circle class="m-core" r="7.5"/>
  </g>
</svg>`;
}

/* Fill every [data-mandala] placeholder. data-mandala="dark" | "stamp" adds a variant. */
export function buildMandalas(root = document) {
  root.querySelectorAll('[data-mandala]').forEach((el) => {
    if (el.firstElementChild) return;
    el.innerHTML = mandalaMarkup();
    const variant = el.getAttribute('data-mandala');
    if (variant) el.classList.add(`mandala--${variant}`);
  });
}

export const parts = (el) => ({
  rot: el.querySelector('.m-rot'),
  core: el.querySelector('.m-core'),
  ring: el.querySelector('.m-ring'),
  inner: el.querySelectorAll('.m-in'),
  outer: el.querySelectorAll('.m-out'),
  dia: el.querySelectorAll('.m-dia'),
  dots: el.querySelectorAll('.m-dot'),
  halo: el.querySelector('.m-halo')
});

/* Hide all petals so a bloom can grow them back. */
export function closeMandala(el) {
  const p = parts(el);
  gsap.set([p.core, p.ring], { scale: 0, transformOrigin: '50% 50%' });
  gsap.set([...p.inner, ...p.outer], { scale: 0, transformOrigin: '50% 100%' });
  gsap.set([...p.dia, ...p.dots], { scale: 0, opacity: 0, transformOrigin: '50% 50%' });
  return p;
}

/* Bloom timeline: centre → inner petals → outer petals → points & dots. */
export function bloomTimeline(el, { speed = 1 } = {}) {
  const p = closeMandala(el);
  const tl = gsap.timeline({ defaults: { ease: 'back.out(1.8)' } });
  tl.to(p.core, { scale: 1, duration: 0.45 / speed })
    .to(p.ring, { scale: 1, duration: 0.4 / speed }, '<0.1')
    .to(p.inner, { scale: 1, duration: 0.55 / speed, stagger: { each: 0.06 / speed, from: 'start' } }, '<0.1')
    .to(p.outer, { scale: 1, duration: 0.6 / speed, stagger: { each: 0.06 / speed } }, '<0.25')
    .to(p.dia, { scale: 1, opacity: 1, duration: 0.35 / speed, stagger: 0.02 / speed, ease: 'power2.out' }, '<0.3')
    .to(p.dots, { scale: 1, opacity: 1, duration: 0.3 / speed, stagger: 0.02 / speed, ease: 'power2.out' }, '<0.1');
  return tl;
}

/* A quick "pulse" bloom: petals swell outward and settle. Used on key moments. */
export function pulse(el, strength = 1) {
  if (!el || !window.gsap) return;
  const p = parts(el);
  gsap.timeline()
    .to(p.outer, { y: -6 * strength, scale: 1 + 0.15 * strength, transformOrigin: '50% 100%', duration: 0.35, ease: 'power2.out', stagger: 0.015 })
    .to(p.inner, { scale: 1 + 0.2 * strength, transformOrigin: '50% 100%', duration: 0.3, ease: 'power2.out' }, 0)
    .to(p.halo, { opacity: 0.9, scale: 1.15, transformOrigin: '50% 50%', duration: 0.3 }, 0)
    .to([...p.outer, ...p.inner], { y: 0, scale: 1, duration: 0.8, ease: 'elastic.out(1, .45)' }, 0.35)
    .to(p.halo, { opacity: 0, scale: 1, duration: 0.6 }, 0.35);
}
