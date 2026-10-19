/* =====================================================================
   Global motion rules
   - Background colour morphs between cream / yellow / maroon as sections cross
   - Line-by-line text reveals (rise + slight rotation, staggered)
   - Image reveals with shape masks: mandala-bloom, paper-tear, ink-wipe
   - Scroll-velocity skew on images
   - Header + mobile bar behaviour, footer bloom
   ===================================================================== */
import { env, clamp } from './env.js';
import { scroll } from './smooth.js';
import { splitLines } from './split.js';
import { bloomTimeline, pulse } from './mandala.js';
import { spark } from './spark.js';

// rgb() strings (not hex) so gsap.utils.interpolate can blend them
const COLORS = { cream: 'rgb(251,245,233)', yellow: 'rgb(249,194,18)', maroon: 'rgb(151,27,30)' };
const GRAIN = { cream: 0.5, yellow: 0.42, maroon: 0.18 };

/* ---------- Background morph ---------- */
export function initBgMorph() {
  const stage = document.querySelector('.bg-stage');
  const grain = document.querySelector('.grain');
  // not 'main > [data-bg]': pinned sections end up inside pin-spacers
  const sections = [...document.querySelectorAll('main [data-bg]')];
  document.documentElement.classList.add('bg-morph');

  // Each section's natural top, measured from layout. A pinned section is
  // measured by its pin-spacer, which keeps its place in the flow.
  let tops = [];
  const measure = () => {
    tops = sections.map((sec) => {
      const box = sec.parentElement.classList.contains('pin-spacer') ? sec.parentElement : sec;
      return box.getBoundingClientRect().top + scrollY;
    });
  };

  // A single painter blends section colours in page order: the colour
  // crosses over while a section's top travels from 85% to 35% of the viewport.
  // Computed from scroll position alone, so fast jumps never leave a stale colour.
  const mix = gsap.utils.interpolate;
  const bloomed = new Set();
  let lastY = -1;
  const paint = (force) => {
    const y = scrollY;
    if (!force && y === lastY) return;
    lastY = y;
    const vh = innerHeight;
    let c = COLORS[sections[0].dataset.bg], g = GRAIN[sections[0].dataset.bg];
    for (let i = 1; i < sections.length; i++) {
      const p = clamp((y + vh * 0.85 - tops[i]) / (vh * 0.5), 0, 1);
      if (p <= 0) break;
      c = mix(c, COLORS[sections[i].dataset.bg], p);
      g = mix(g, GRAIN[sections[i].dataset.bg], p);
      // the spark gives a small bloom as each new section arrives
      if (p > 0.6 && !bloomed.has(i)) { bloomed.add(i); spark.bloom(); }
    }
    stage.style.backgroundColor = c;
    grain.style.opacity = g;
  };
  measure();
  gsap.ticker.add(() => paint(false));
  ScrollTrigger.addEventListener('refresh', () => { measure(); paint(true); });
  paint(true);
}

/* ---------- Text reveals ---------- */
export function initTextReveals() {
  document.querySelectorAll('[data-split]').forEach((el) => {
    if (env.reduced) {
      gsap.from(el, { opacity: 0, duration: 0.8, scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
      return;
    }
    const split = splitLines(el);
    if (!split) return;
    const lines = el.querySelectorAll('.line');
    gsap.set(lines, { yPercent: 105, rotate: 3.5 });
    ScrollTrigger.create({
      trigger: el, start: 'top 85%', once: true,
      onEnter: () => gsap.to(lines, {
        yPercent: 0, rotate: 0, duration: 1.1, ease: 'expo.out', stagger: 0.09,
        // restore natural text flow afterwards so resizing never breaks lines
        onComplete: () => split.revert()
      })
    });
  });

  document.querySelectorAll('[data-reveal-text]').forEach((el) => {
    gsap.from(el, { opacity: 0, y: env.reduced ? 0 : 24, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
}

/* ---------- Image reveals ---------- */
function tearPolygon(p) {
  // a jagged paper edge sweeping left → right; p in 0..1
  const edge = -12 + p * 124; // percentage of width
  const pts = ['0% 0%'];
  const teeth = 14;
  for (let i = 0; i <= teeth; i++) {
    const y = (i / teeth) * 100;
    const jag = (i % 2 ? 3.5 : -2.5) + Math.sin(i * 2.7) * 2;
    pts.push(`${edge + jag}% ${y}%`);
  }
  pts.push('0% 100%');
  return `polygon(${pts.join(',')})`;
}

export function initImageReveals() {
  document.querySelectorAll('[data-reveal]').forEach((fig) => {
    const type = fig.dataset.reveal;
    const img = fig.querySelector('img');
    if (env.reduced) { fig.classList.add('is-revealed'); return; }
    const state = { p: 0 };
    if (type === 'tear') img.style.clipPath = tearPolygon(0);
    ScrollTrigger.create({
      trigger: fig, start: 'top 82%', once: true,
      onEnter: () => gsap.to(state, {
        p: 1, duration: type === 'bloom' ? 1.6 : 1.3, ease: type === 'bloom' ? 'power2.inOut' : 'power3.inOut',
        onUpdate: () => {
          if (type === 'tear') img.style.clipPath = tearPolygon(state.p);
          else fig.style.setProperty('--p', state.p.toFixed(4));
        },
        onComplete: () => { fig.classList.add('is-revealed'); img.style.clipPath = ''; }
      })
    });
  });
}

/* ---------- Scroll-velocity skew ---------- */
export function initSkew() {
  if (env.reduced) return;
  const imgs = [...document.querySelectorAll('[data-skew]')];
  const setters = imgs.map((img) => gsap.quickTo(img, 'skewY', { duration: 0.5, ease: 'power3.out' }));
  const scaleSet = imgs.map((img) => gsap.quickSetter(img, 'scale'));
  imgs.forEach((_, i) => scaleSet[i](1.06)); // slight overscan so skewed edges never show gaps
  let lastSkew = 0;
  gsap.ticker.add(() => {
    const skew = clamp(scroll.velocity * -0.12, -5, 5);
    if (Math.abs(skew - lastSkew) < 0.02) return;
    lastSkew = skew;
    setters.forEach((s) => s(skew));
  });
}

/* ---------- Header / mobile bar ---------- */
export function initChrome() {
  const header = document.querySelector('.site-header');
  const bar = document.querySelector('.mobile-bar');
  const hero = document.querySelector('.hero');
  let lastY = scrollY;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: () => {
      const y = scrollY;
      const pastHero = y > hero.offsetHeight - 80;
      header.classList.toggle('is-solid', pastHero && !isOverDark(header));
      header.classList.toggle('is-hidden', pastHero && y > lastY + 2);
      if (y < lastY - 2) header.classList.remove('is-hidden');
      lastY = y;
    }
  });
  // header over a dark section stays transparent with light links
  function isOverDark(h) {
    const el = document.elementsFromPoint(innerWidth / 2, h.offsetHeight + 4).find((n) => n.matches?.('[data-bg]'));
    return el ? el.dataset.bg === 'maroon' : false;
  }

  // Hide the sticky "Enquire Now" bar when the form or footer is on screen
  if (bar) {
    const targets = [document.getElementById('enquiry-form'), document.querySelector('.footer')];
    const seen = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)));
      bar.classList.toggle('is-hidden', seen.size > 0);
    }, { threshold: 0.15 });
    targets.forEach((t) => t && io.observe(t));
  }
}

/* ---------- Footer: the spark keeps growing ---------- */
export function initFooter() {
  const m = document.querySelector('.footer__mandala');
  const line = document.querySelector('.footer__line path');
  if (!m) return;
  if (env.reduced) return;
  const tl = gsap.timeline({ paused: true });
  tl.from(line.ownerSVGElement, { clipPath: 'inset(0 100% 0 0)', duration: 1.4, ease: 'power2.inOut' })
    .add(bloomTimeline(m, { speed: 1.2 }), '-=0.4')
    .to(m.querySelector('.m-rot'), { rotate: 360, transformOrigin: '50% 50%', duration: 2, ease: 'power2.inOut' }, '<')
    .from('.footer__grow-note', { opacity: 0, y: 10, duration: 0.6 }, '-=0.8');
  ScrollTrigger.create({ trigger: '.footer', start: 'top 80%', once: true, onEnter: () => tl.play() });
  m.addEventListener('pointerenter', () => pulse(m, 1.4));
}
