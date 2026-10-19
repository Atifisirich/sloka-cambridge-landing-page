/* "Seven years": the outlined 7 fills with ink from the bottom like a glass
   of water. A wavy clip path rises with scroll while it ripples sideways. */
import { env } from './env.js';

export function initSeven() {
  const wave = document.querySelector('.seven__wave');
  if (!wave) return;
  if (env.reduced) { gsap.set(wave, { y: -60 }); return; }

  gsap.fromTo(wave, { y: 520 }, {
    y: -60, ease: 'none',
    scrollTrigger: { trigger: '.seven', start: 'top 70%', end: 'bottom 45%', scrub: 0.8 }
  });
  // the water surface keeps moving (one wave period = 200 units)
  const slosh = gsap.to(wave, { x: 200, duration: 2.6, ease: 'none', repeat: -1 });
  ScrollTrigger.create({ trigger: '.seven', start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? slosh.play() : slosh.pause()) });
}
