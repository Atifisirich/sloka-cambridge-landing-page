/* =====================================================================
   Principal's message: a tri-folded letter that opens in 3D with scroll.
   Lines then appear left-to-right as if being written, and the signature
   is drawn live before the name settles in.
   ===================================================================== */
import { env } from './env.js';
import { splitLines } from './split.js';

export function initLetter() {
  const letter = document.querySelector('[data-letter]');
  if (!letter || env.reduced) return;
  const top = letter.querySelector('.letter__panel--top');
  const bot = letter.querySelector('.letter__panel--bot');
  const pen = letter.querySelector('.signature__pen');
  const sigImage = letter.querySelector('.signature image');
  const sign = letter.querySelector('.letter__sign');

  // folded state: top flap folds down over the middle, bottom flap folds up
  gsap.set(top, { rotateX: -172, z: 2 });
  gsap.set(bot, { rotateX: 172, z: 1 });

  gsap.timeline({
    scrollTrigger: { trigger: letter, start: 'top 85%', end: 'top 20%', scrub: 0.8 }
  })
    .to(top, { rotateX: 0, ease: 'power2.inOut' })
    .to(bot, { rotateX: 0, ease: 'power2.inOut' }, '-=0.35');

  // handwriting-like reveal, panel by panel
  document.fonts?.ready.then(() => {
    letter.querySelectorAll('.letter__panel').forEach((panel) => {
      const lines = [];
      panel.querySelectorAll('.letter__line').forEach((p) => {
        const split = splitLines(p);
        if (split) lines.push(...p.querySelectorAll('.line'));
      });
      gsap.set(lines, { clipPath: 'inset(0 100% 0 0)' });
      ScrollTrigger.create({
        trigger: panel, start: 'top 72%', once: true,
        onEnter: () => gsap.to(lines, { clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'power1.inOut', stagger: 0.45, delay: panel === top ? 0.3 : 0.1 })
      });
    });
  });

  // signature signed live (the pen mask follows her stroke order), then the name
  const len = pen.getTotalLength();
  gsap.set(pen, { strokeDasharray: len, strokeDashoffset: len });
  gsap.set(sign, { opacity: 0, y: 8 });
  ScrollTrigger.create({
    trigger: bot, start: 'top 45%', once: true,
    onEnter: () => gsap.timeline({ delay: 1.2 })
      .to(pen, { strokeDashoffset: 0, duration: 2.8, ease: 'power1.inOut' })
      // drop the mask once signed, so every bit of the real ink shows
      .add(() => sigImage.removeAttribute('mask'))
      .to(sign, { opacity: 1, y: 0, duration: 0.7 })
  });
}
