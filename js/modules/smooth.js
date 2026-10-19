/* Lenis smooth scrolling wired into GSAP's ticker, plus a shared scroll velocity
   (px per frame, smoothed) that the skew, vinyl and skating effects read. */
import { env } from './env.js';

export const scroll = { velocity: 0, lenis: null };

export function initSmooth() {
  if (!env.reduced && window.Lenis) {
    const lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    scroll.lenis = lenis;
  }

  // Velocity from scroll position deltas works with or without Lenis
  let last = window.scrollY;
  gsap.ticker.add(() => {
    const y = window.scrollY;
    scroll.velocity += ((y - last) - scroll.velocity) * 0.2;
    last = y;
  });

  // In-page anchors go through Lenis so they glide (and land under the header)
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = id === '#top' ? 0 : id.length > 1 && document.querySelector(id);
    if (target === false || target === null) return;
    e.preventDefault();
    if (scroll.lenis) scroll.lenis.scrollTo(target, { offset: target === 0 ? 0 : -10, duration: 1.4 });
    else window.scrollTo({ top: target === 0 ? 0 : target.getBoundingClientRect().top + scrollY - 10, behavior: env.reduced ? 'auto' : 'smooth' });
    if (target !== 0) {
      // Move focus for keyboard and screen-reader users
      const field = target.querySelector('form input:not([type="hidden"])');
      if (!field && !target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      setTimeout(() => (field || target).focus({ preventScroll: true }), env.reduced ? 0 : 1300);
    }
  });
}

export function stopScroll(stop) {
  if (scroll.lenis) stop ? scroll.lenis.stop() : scroll.lenis.start();
  document.documentElement.classList.toggle('is-loading', stop);
}
