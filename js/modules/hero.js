/* =====================================================================
   Hero: WebGL "breathing" photo + headline letters that behave like iron
   filings near a magnet (each letter turns toward the cursor and leans in).
   ===================================================================== */
import { env, pointer, lerp, visibility } from './env.js';
import { splitChars } from './split.js';
import { imageQuad, loadImage, COVER } from './gl.js';
import { spark } from './spark.js';

const FRAG = `
precision mediump float;
uniform sampler2D uTex;
uniform vec2 uRes, uImg, uMouse;
uniform float uTime, uScroll;
varying vec2 vUv;
${COVER}
void main() {
  vec2 uv = coverUv(vUv, uRes, uImg);
  float breathe = 0.93 - 0.025 * sin(uTime * 0.32) - uScroll * 0.06;   // slow inhale / exhale
  vec2 c = uv - 0.5;
  uv = c * breathe + 0.5 + uMouse * 0.012;
  uv += c * dot(c, c) * 0.05 * sin(uTime * 0.32 + 1.2);                 // soft lens swell
  gl_FragColor = vec4(texture2D(uTex, uv).rgb, 1.0);
}`;

export function initHero() {
  const hero = document.querySelector('.hero');
  const title = hero.querySelector('.hero__title');
  const chars = splitChars(title);

  // ----- WebGL breathing (desktop). Mobile keeps the CSS breathing on the <img>.
  if (env.rich && !env.lowPower) initGL(hero);

  // ----- magnet letters
  if (env.rich) {
    let inView = true, rects = [];
    const state = chars.map(() => ({ r: 0, x: 0, y: 0 }));
    const measure = () => {
      chars.forEach((c) => (c.style.transform = ''));
      rects = chars.map((c) => {
        const b = c.getBoundingClientRect();
        return { x: b.left + b.width / 2, y: b.top + b.height / 2 + scrollY };
      });
    };
    measure();
    addEventListener('resize', measure);
    document.fonts?.ready.then(measure);
    visibility(hero, (v) => (inView = v));

    const R = 220;
    gsap.ticker.add(() => {
      if (!inView) return;
      for (let i = 0; i < chars.length; i++) {
        const dx = pointer.x - rects[i].x, dy = pointer.y - (rects[i].y - scrollY);
        const d = Math.hypot(dx, dy);
        const f = pointer.active && d < R ? (1 - d / R) ** 2 : 0;
        // align the letter's vertical axis with the field line toward the cursor
        let ang = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
        if (ang > 90) ang -= 180;
        if (ang < -90) ang += 180;
        const s = state[i];
        s.r = lerp(s.r, ang * 0.32 * f, 0.14);
        s.x = lerp(s.x, (dx / (d || 1)) * 9 * f, 0.14);
        s.y = lerp(s.y, (dy / (d || 1)) * 9 * f, 0.14);
        if (Math.abs(s.r) + Math.abs(s.x) + Math.abs(s.y) > 0.01 || f > 0) {
          chars[i].style.transform = `translate(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px) rotate(${s.r.toFixed(2)}deg)`;
        }
      }
    });
  }
  return { chars };
}

/* Entrance after the loader (returned paused; from() states apply immediately
   so nothing flashes while the loader opens): letters rise, underline draws, then a small
   spark detaches from the word "spark." and becomes the companion. */
export function heroIntro({ chars }) {
  const hero = document.querySelector('.hero');
  const pencil = hero.querySelector('.pencil-line path');
  const sparkWord = hero.querySelector('.hero__spark-word');
  const items = hero.querySelectorAll('.eyebrow, .hero__sub, .hero__ctas > *, .hero__badge, .hero__note');

  if (env.reduced) {
    return gsap.timeline({ paused: true }).from([...chars, ...items], { opacity: 0, duration: 0.6 });
  }
  const len = pencil.getTotalLength();
  gsap.set(pencil, { strokeDasharray: len, strokeDashoffset: len });

  return gsap.timeline({ paused: true })
    .from(chars, { yPercent: 110, rotate: 8, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.018 })
    .from(items, { y: 24, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08 }, '-=0.7')
    .to(pencil, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, '-=0.6')
    .add(() => {
      const r = sparkWord.getBoundingClientRect();
      spark.release(r.right - 10, r.top + r.height * 0.3);
    }, '-=0.2');
}

async function initGL(hero) {
  const canvas = hero.querySelector('.hero__gl');
  const imgEl = hero.querySelector('.hero__img');
  try {
    await (imgEl.complete ? Promise.resolve() : new Promise((r) => imgEl.addEventListener('load', r, { once: true })));
    const img = await loadImage(imgEl.currentSrc || imgEl.src);
    const quad = imageQuad(canvas, img, FRAG);
    if (!quad) return;
    hero.classList.add('gl-on');
    setTimeout(() => (imgEl.style.visibility = 'hidden'), 1100);
    let inView = true, mx = 0, my = 0;
    visibility(hero, (v) => (inView = v));
    addEventListener('resize', () => quad.resize());
    const t0 = performance.now();
    gsap.ticker.add(() => {
      if (!inView) return;
      mx = lerp(mx, (pointer.x / innerWidth - 0.5), 0.05);
      my = lerp(my, (pointer.y / innerHeight - 0.5), 0.05);
      quad.render({
        uTime: (performance.now() - t0) / 1000,
        uMouse: [mx, my],
        uScroll: Math.min(1, scrollY / innerHeight)
      });
    });
  } catch (e) {
    console.warn('[hero] WebGL unavailable, using CSS breathing.', e);
  }
}
