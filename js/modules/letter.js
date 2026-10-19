/* =====================================================================
   Principal's message: a tri-folded letter that opens in 3D with scroll.
   Lines then appear left-to-right as if being written, and the signature
   is drawn live before the name settles in.

   Laptop / desktop ("fit" mode): the section is held on screen and the
   letter is scaled to fit the viewport, so the whole letter unfolds in
   view at once. Phones: the letter is too tall to fit readably, so each
   flap opens as it scrolls into view instead.
   ===================================================================== */
import { env } from './env.js';
import { splitLines } from './split.js';

export function initLetter() {
  const letter = document.querySelector('[data-letter]');
  if (!letter || env.reduced) return;
  const section = letter.closest('.principal');
  const scene = letter.closest('.letter-scene');
  const top = letter.querySelector('.letter__panel--top');
  const mid = letter.querySelector('.letter__panel--mid');
  const bot = letter.querySelector('.letter__panel--bot');
  const pen = letter.querySelector('.signature__pen');
  const sigImage = letter.querySelector('.signature image');
  const sign = letter.querySelector('.letter__sign');
  const fit = !env.mobile && innerHeight >= 560;

  // folded state: top flap folds down over the middle, bottom flap folds up
  gsap.set(top, { rotateX: -172, z: 2 });
  gsap.set(bot, { rotateX: 172, z: 1 });

  // ---------- handwriting-like reveal, panel by panel ----------
  const written = new Map(); // panel → play() once
  const linesReady = (document.fonts?.ready || Promise.resolve()).then(() => {
    [top, mid, bot].forEach((panel) => {
      const lines = [];
      panel.querySelectorAll('.letter__line').forEach((p) => {
        if (splitLines(p)) lines.push(...p.querySelectorAll('.line'));
      });
      gsap.set(lines, { clipPath: 'inset(0 100% 0 0)' });
      let done = false;
      written.set(panel, (delay = 0) => {
        if (done) return;
        done = true;
        gsap.to(lines, { clipPath: 'inset(0 0% 0 0)', duration: 0.8, ease: 'power1.inOut', stagger: 0.32, delay });
      });
    });
    // line masks change the letter's height slightly: re-measure every trigger
    ScrollTrigger.refresh();
  });
  const write = (panel, delay) => linesReady.then(() => written.get(panel)(delay));

  // ---------- signature signed live (pen mask follows her stroke order) ----------
  const len = pen.getTotalLength();
  gsap.set(pen, { strokeDasharray: len, strokeDashoffset: len });
  gsap.set(sign, { opacity: 0, y: 8 });
  let signed = false;
  const signLetter = (delay) => {
    if (signed) return;
    signed = true;
    gsap.timeline({ delay })
      .to(pen, { strokeDashoffset: 0, duration: 2.6, ease: 'power1.inOut' })
      // drop the mask once signed, so every bit of the real ink shows
      .add(() => sigImage.removeAttribute('mask'))
      .to(sign, { opacity: 1, y: 0, duration: 0.7 });
  };

  if (fit) {
    section.classList.add('is-fit');
    // scale the whole letter so it always fits between the header and the bottom edge
    const fitScale = () => {
      gsap.set(scene, { scale: 1 });
      const room = innerHeight - 40;
      gsap.set(scene, { scale: Math.min(1, room / letter.offsetHeight) });
    };

    // timeline (in scroll "seconds"): open top flap → open bottom flap → hold to read
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section, pin: true, start: 'top top', end: () => `+=${innerHeight * 1.6}`,
        scrub: 0.8, invalidateOnRefresh: true,
        onRefreshInit: fitScale,
        onUpdate: (st) => {
          const p = st.progress;
          // writing is time-based (it should feel like a pen), started as each flap opens
          if (p > 0.04) write(top, 0.2);
          if (p > 0.2) write(mid, 0);
          if (p > 0.42) write(bot, 0.2);
          if (p > 0.5) signLetter(0.9);
        }
      }
    });
    tl.to(top, { rotateX: 0, ease: 'power2.inOut', duration: 1 })
      .to(bot, { rotateX: 0, ease: 'power2.inOut', duration: 1 }, '-=0.25')
      .to({}, { duration: 1.1 }); // hold the open letter on screen while it's read
    fitScale();
    return;
  }

  // ---------- phones: each flap opens as it comes into view ----------
  gsap.to(top, { rotateX: 0, ease: 'power2.inOut', scrollTrigger: { trigger: top, start: 'top 85%', end: 'top 35%', scrub: 0.8 } });
  gsap.to(bot, { rotateX: 0, ease: 'power2.inOut', scrollTrigger: { trigger: mid, start: 'bottom 85%', end: 'bottom 40%', scrub: 0.8 } });
  ScrollTrigger.create({ trigger: top, start: 'top 60%', once: true, onEnter: () => write(top, 0.3) });
  ScrollTrigger.create({ trigger: mid, start: 'top 70%', once: true, onEnter: () => write(mid, 0) });
  ScrollTrigger.create({ trigger: mid, start: 'bottom 55%', once: true, onEnter: () => write(bot, 0.3) });
  ScrollTrigger.create({ trigger: mid, start: 'bottom 35%', once: true, onEnter: () => signLetter(1.2) });
}
