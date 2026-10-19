/* =====================================================================
   Cambridge Fit compass button.
   Idle: the needle swings loosely. Cursor approaches: the badge is pulled
   toward it (magnetic) and the needle locks onto the cursor.
   Click: needle snaps to N, the badge ripples, then the link opens in a new tab.
   ===================================================================== */
import { env, pointer, lerp } from './env.js';

const DIAL = `
<svg viewBox="-50 -50 100 100">
  <circle r="47" fill="#F9C212"/>
  <circle r="47" fill="none" stroke="#971B1E" stroke-width="2.5"/>
  <circle r="38" fill="none" stroke="#971B1E" stroke-width="1" stroke-dasharray="1.2 4.8"/>
  <g fill="#971B1E" font-family="Gloock, Georgia, serif" font-size="12" text-anchor="middle">
    <text y="-26">N</text><text x="29" y="4.5" font-size="9">E</text><text y="34" font-size="9">S</text><text x="-29" y="4.5" font-size="9">W</text>
  </g>
  <g class="compass__needle">
    <path d="M0-30 L6 0 L0 4 L-6 0Z" fill="#971B1E"/>
    <path d="M0 30 L6 0 L0-4 L-6 0Z" fill="#E87724"/>
    <circle r="3.5" fill="#FBF5E9" stroke="#971B1E" stroke-width="1.5"/>
  </g>
</svg>`;

export function initCompasses() {
  const url = window.SLOKA_SITE?.CAMBRIDGE_FIT_URL || '';
  const items = [...document.querySelectorAll('.compass')].map((el, i) => {
    el.querySelector('.compass__dial').innerHTML = DIAL;
    if (el.hasAttribute('data-cambridge-link')) el.href = url;
    const needle = el.querySelector('.compass__needle');
    const c = { el, needle, angle: 0, vel: 0, x: 0, y: 0, seed: i * 1.7, visible: false, locked: false };
    el.addEventListener('click', (e) => onClick(e, c));
    new IntersectionObserver(([en]) => (c.visible = en.isIntersecting)).observe(el);
    return c;
  });
  if (env.reduced) return;

  const R = 200;
  gsap.ticker.add((time) => {
    for (const c of items) {
      if (!c.visible || c.locked) continue;
      const dial = c.el.querySelector('.compass__dial').getBoundingClientRect();
      const cx = dial.left + dial.width / 2 - c.x, cy = dial.top + dial.height / 2 - c.y; // untranslated centre
      const dx = pointer.x - cx, dy = pointer.y - cy;
      const d = Math.hypot(dx, dy);
      const near = !env.touch && pointer.active && d < R;
      let target;
      if (near) {
        target = (Math.atan2(dy, dx) * 180) / Math.PI + 90; // needle's N end points at the cursor
        const f = 1 - d / R;
        c.x = lerp(c.x, dx * 0.28 * f, 0.15);
        c.y = lerp(c.y, dy * 0.28 * f, 0.15);
      } else {
        // loose idle swing: a wandering target with springy needle physics
        target = Math.sin(time * 0.6 + c.seed) * 70 + Math.sin(time * 1.7 + c.seed) * 25;
        c.x = lerp(c.x, 0, 0.1);
        c.y = lerp(c.y, 0, 0.1);
      }
      let diff = ((target - c.angle + 540) % 360) - 180;
      c.vel = c.vel * (near ? 0.6 : 0.9) + diff * (near ? 0.12 : 0.012);
      c.angle += c.vel;
      c.needle.style.transform = `rotate(${c.angle.toFixed(2)}deg)`;
      c.el.style.transform = `translate(${c.x.toFixed(2)}px, ${c.y.toFixed(2)}px)`;
    }
  });
}

function onClick(e, c) {
  const href = c.el.getAttribute('href') || '';
  if (env.reduced || !window.gsap) {
    if (href.includes('[PASTE')) { e.preventDefault(); console.warn('[compass] Set SLOKA_SITE.CAMBRIDGE_FIT_URL in js/config.js'); }
    return; // let the link open normally
  }
  e.preventDefault();
  c.locked = true;
  const north = Math.round(c.angle / 360) * 360; // nearest N without a wild spin
  const ripple = document.createElement('span');
  ripple.className = 'compass__ripple';
  c.el.appendChild(ripple);
  gsap.timeline({ onComplete: () => { ripple.remove(); c.locked = false; c.angle = north; } })
    .to(c.needle, { rotate: north, duration: 0.45, ease: 'elastic.out(1.2, .4)', onUpdate() { c.angle = gsap.getProperty(c.needle, 'rotate'); } })
    .fromTo(ripple, { scale: 1, opacity: 0.9 }, { scale: 2.6, opacity: 0, duration: 0.7, ease: 'power2.out' }, 0.15)
    .add(() => {
      if (href.includes('[PASTE')) { console.warn('[compass] Set SLOKA_SITE.CAMBRIDGE_FIT_URL in js/config.js'); return; }
      window.open(href, '_blank', 'noopener');
    }, 0.42);
}
