/* =====================================================================
   The spark companion: a small mandala that detaches from the hero and
   follows the visitor. Desktop: trails the cursor with a soft glow.
   Touch: rides the right edge at the reader's scroll position.
   Other modules call spark.bloom() on key moments.
   ===================================================================== */
import { env, pointer, lerp } from './env.js';
import { pulse, parts } from './mandala.js';

const el = document.querySelector('.spark');
const m = el?.querySelector('.spark__m');
const glow = el?.querySelector('.spark__glow');

const pos = { x: -100, y: -100, gx: -100, gy: -100, rot: 0, scale: 1, targetScale: 1 };
let running = false;

export const spark = {
  ready: false,
  bloom(strength = 1) { if (this.ready) pulse(m, strength); },

  /* Fly out from a point (the hero's "spark." word) and start following */
  release(fromX, fromY) {
    if (!el || env.reduced) return;
    pos.x = pos.gx = fromX; pos.y = pos.gy = fromY;
    if (env.touch || env.mobile) document.documentElement.classList.add('is-touch');
    gsap.to(el, { opacity: 1, duration: 0.4 });
    const p = parts(m);
    gsap.from([...p.inner, ...p.outer], { scale: 0, transformOrigin: '50% 100%', duration: 0.7, stagger: 0.03, ease: 'back.out(2)' });
    this.ready = true;
    if (!running) { running = true; gsap.ticker.add(tick); }
    if (!env.touch) bindHover();
  }
};

function tick() {
  let tx, ty;
  if (env.touch || env.mobile) {
    // scroll rider: hugs the right edge and travels with reading progress
    const max = document.documentElement.scrollHeight - innerHeight;
    const prog = max > 0 ? scrollY / max : 0;
    tx = innerWidth - 22;
    ty = 90 + prog * (innerHeight - 200);
    pos.rot = scrollY * 0.25;
  } else {
    tx = pointer.active ? pointer.x + 22 : pos.x;
    ty = pointer.active ? pointer.y + 22 : pos.y;
    pos.rot += 0.4 + pointer.speed * 6;
  }
  pos.x = lerp(pos.x, tx, 0.18);
  pos.y = lerp(pos.y, ty, 0.18);
  pos.gx = lerp(pos.gx, tx, 0.07);
  pos.gy = lerp(pos.gy, ty, 0.07);
  pos.scale = lerp(pos.scale, pos.targetScale, 0.15);
  m.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) rotate(${pos.rot}deg) scale(${pos.scale})`;
  glow.style.transform = `translate3d(${pos.gx}px, ${pos.gy}px, 0)`;
}

function bindHover() {
  const sel = 'a, button, input, select, label, [role="button"], .tile, canvas';
  document.addEventListener('pointerover', (e) => { if (e.target.closest(sel)) pos.targetScale = 1.6; });
  document.addEventListener('pointerout', (e) => { if (e.target.closest(sel)) pos.targetScale = 1; });
  document.addEventListener('pointerleave', () => gsap.to(el, { opacity: 0, duration: 0.3 }));
  document.addEventListener('pointerenter', () => gsap.to(el, { opacity: 1, duration: 0.3 }));
}
