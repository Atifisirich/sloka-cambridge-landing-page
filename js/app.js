/* =====================================================================
   Sloka Manneguda landing page: entry point.
   Order matters: config → mandalas → smooth scroll → sections (pins are
   created top-to-bottom) → global motion → loader → hero intro.
   ===================================================================== */
import { env } from './modules/env.js';
import { buildMandalas } from './modules/mandala.js';
import { initSmooth } from './modules/smooth.js';
import { runLoader } from './modules/loader.js';
import { spark } from './modules/spark.js';
import { initHero, heroIntro } from './modules/hero.js';
import { initCompasses } from './modules/compass.js';
import { initSeven } from './modules/seven.js';
import { initApproach } from './modules/approach.js';
import { initPathway } from './modules/pathway.js';
import { initResults } from './modules/results.js';
import { initVoice } from './modules/voice.js';
import { initBento } from './modules/bento.js';
import { initPrism } from './modules/prism.js';
import { initLetter } from './modules/letter.js';
import { initStories } from './modules/stories.js';
import { initOrbitMap } from './modules/orbit-map.js';
import { initBgMorph, initTextReveals, initImageReveals, initSkew, initChrome, initFooter } from './modules/motion.js';

const root = document.documentElement;

/* Fill contact details, links and the year from js/config.js */
function applyConfig() {
  const c = window.SLOKA_SITE || {};
  const set = (sel, fn) => document.querySelectorAll(sel).forEach(fn);
  set('[data-config="address"]', (el) => (el.textContent = c.ADDRESS));
  set('[data-config="phone"]', (el) => (el.textContent = c.PHONE_DISPLAY));
  set('[data-config="email"]', (el) => (el.textContent = c.EMAIL));
  set('[data-config="phone2"]', (el) => (el.textContent = c.PHONE2_DISPLAY));
  set('[data-config="email2"]', (el) => (el.textContent = c.EMAIL2));
  set('[data-config="hours"]', (el) => (el.textContent = c.OFFICE_HOURS));
  set('[data-config-href="tel2"]', (el) => (el.href = `tel:${c.PHONE2_E164}`));
  set('[data-config-href="mailto2"]', (el) => (el.href = `mailto:${c.EMAIL2}`));
  set('[data-config-href="tel"]', (el) => (el.href = `tel:${c.PHONE_E164}`));
  set('[data-config-href="mailto"]', (el) => (el.href = `mailto:${c.EMAIL}`));
  set('[data-config-href="directions"]', (el) => (el.href = c.DIRECTIONS_URL));
  set('[data-whatsapp]', (el) => (el.href = `https://wa.me/${c.WHATSAPP_NUMBER}?text=${encodeURIComponent(c.WHATSAPP_TEXT || '')}`));
  set('[data-social]', (el) => { const u = c.SOCIAL?.[el.dataset.social]; if (u) el.href = u; });
  set('[data-cambridge-link]', (el) => (el.href = c.CAMBRIDGE_FIT_URL));
  set('[data-year]', (el) => (el.textContent = new Date().getFullYear()));
}

applyConfig();
buildMandalas();

if (!env.hasLibs) {
  // CDN blocked or offline: keep a fully readable static page
  console.warn('[sloka] GSAP not available; running without motion.');
  document.querySelector('.loader')?.remove();
  document.querySelectorAll('.station').forEach((s) => s.classList.add('is-open'));
  root.classList.add('is-ready');
} else {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  if (env.touch) root.classList.add('is-touch');

  // First paint only needs the hero and the loader...
  initSmooth();
  const hero = initHero();
  const intro = heroIntro(hero);
  initCompasses();

  // ...everything below the fold is set up once the loader opens, so a phone's
  // CPU is free for the first seconds. Order matters: pins are created top-to-bottom.
  let setUp = false;
  const setUpPage = () => {
    if (setUp) return;
    setUp = true;
    initSeven();
    initApproach();
    initPathway();          // pin #1
    initResults();
    initVoice();
    initBento();
    initPrism();            // pin #2
    initLetter();           // pin #3 (laptops/desktops)
    initStories();
    initOrbitMap();
    initImageReveals();
    initSkew();
    initChrome();
    initFooter();

    // line-based effects need final font metrics
    const fontsReady = document.fonts ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]) : Promise.resolve();
    fontsReady.then(() => {
      initTextReveals();
      initBgMorph();
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    });
  };

  root.classList.add('is-ready');
  runLoader().then(() => { intro.play(); setTimeout(setUpPage, 0); });
  setTimeout(setUpPage, 6000); // safety net if the loader never resolves

  // the spark celebrates a sent enquiry (event from js/enquiry-form.js)
  document.addEventListener('sloka:enquiry-sent', () => spark.bloom(2));

  // late-loading images change layout heights → refresh pins once everything is in
  addEventListener('load', () => ScrollTrigger.refresh());
}
