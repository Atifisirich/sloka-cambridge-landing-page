/* Environment flags shared by every module. */

const mq = (q) => window.matchMedia(q).matches;

export const env = {
  reduced: mq('(prefers-reduced-motion: reduce)'),
  touch: mq('(hover: none), (pointer: coarse)'),
  mobile: mq('(max-width: 899px)'),
  // Rough low-power guess: few cores or little memory → lighter effects
  lowPower: (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4,
  hasLibs: typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined'
};

// Rich desktop effects (WebGL hovers, physics, cursor magnet)
env.rich = !env.reduced && !env.touch && !env.mobile;

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;

/* Pointer position, tracked once for everyone */
export const pointer = { x: innerWidth / 2, y: innerHeight / 2, vx: 0, vy: 0, speed: 0, active: false };
let lastT = performance.now();
window.addEventListener('pointermove', (e) => {
  const now = performance.now();
  const dt = Math.max(8, now - lastT);
  pointer.vx = (e.clientX - pointer.x) / dt;
  pointer.vy = (e.clientY - pointer.y) / dt;
  pointer.speed = Math.hypot(pointer.vx, pointer.vy); // px per ms
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  pointer.active = true;
  lastT = now;
}, { passive: true });

/* Run `fn` once when `el` comes near the viewport (lazy init for heavy toys). */
export function whenNear(el, fn, margin = '300px') {
  if (!el) return;
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); fn(); }
  }, { rootMargin: margin });
  io.observe(el);
}

/* Track visibility to pause rAF loops when off-screen. */
export function visibility(el, cb, margin = '0px') {
  const io = new IntersectionObserver((entries) => entries.forEach((e) => cb(e.isIntersecting)), { rootMargin: margin });
  io.observe(el);
  return io;
}

/* Load a script once (used for Matter.js) */
const loaded = {};
export function loadScript(src) {
  if (!loaded[src]) {
    loaded[src] = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.async = true; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  return loaded[src];
}
