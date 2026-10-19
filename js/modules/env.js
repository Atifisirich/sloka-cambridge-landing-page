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

/* Pointer position, tracked once for everyone. A finger counts as "active" only
   while it is on the screen, so touch effects relax when it lifts. */
export const pointer = { x: innerWidth / 2, y: innerHeight / 2, vx: 0, vy: 0, speed: 0, active: false, touch: false };
let lastT = performance.now();
const track = (e) => {
  const now = performance.now();
  const dt = Math.max(8, now - lastT);
  pointer.vx = (e.clientX - pointer.x) / dt;
  pointer.vy = (e.clientY - pointer.y) / dt;
  pointer.speed = Math.hypot(pointer.vx, pointer.vy); // px per ms
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  pointer.active = true;
  pointer.touch = e.pointerType === 'touch';
  lastT = now;
};
window.addEventListener('pointermove', track, { passive: true });
window.addEventListener('pointerdown', (e) => { lastT = performance.now(); pointer.x = e.clientX; pointer.y = e.clientY; track(e); }, { passive: true });
const lift = (e) => { if (e.pointerType === 'touch') { pointer.active = false; pointer.speed = 0; } };
window.addEventListener('pointerup', lift, { passive: true });
window.addEventListener('pointercancel', lift, { passive: true });

/* Phone tilt + compass heading (DeviceOrientation). Android starts straight away;
   iPhone needs permission, which is asked on the visitor's first tap. */
export const tilt = { x: 0, y: 0, heading: null, active: false };
let tiltOn = false;
function onOrient(e) {
  if (e.gamma == null) return;
  tilt.active = true;
  tilt.x = clamp(e.gamma / 35, -1, 1);           // left/right
  tilt.y = clamp((e.beta - 45) / 35, -1, 1);      // forward/back from a natural holding angle
  if (typeof e.webkitCompassHeading === 'number') tilt.heading = e.webkitCompassHeading; // iPhone
  else if (e.absolute && e.alpha != null) tilt.heading = 360 - e.alpha;                  // Android
}
function startTilt() {
  if (tiltOn) return;
  tiltOn = true;
  addEventListener('deviceorientationabsolute', onOrient, { passive: true });
  addEventListener('deviceorientation', onOrient, { passive: true });
}
if (env.touch && typeof DeviceOrientationEvent !== 'undefined') {
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    addEventListener('pointerup', function ask() {
      removeEventListener('pointerup', ask);
      DeviceOrientationEvent.requestPermission().then((s) => s === 'granted' && startTilt()).catch(() => {});
    });
  } else {
    startTilt();
  }
}

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
