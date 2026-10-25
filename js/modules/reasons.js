/* Cambridge: 10 reasons. The card grid and the "plus more" band each get .is-in
   as they scroll into view; the cards, numerals and chips then ease in (pure CSS). */
import { env } from './env.js';

export function initReasons() {
  const blocks = [...document.querySelectorAll('[data-reasons]')];
  if (!blocks.length) return;
  if (env.reduced) { blocks.forEach((b) => b.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -15% 0px' });
  blocks.forEach((b) => io.observe(b));
}
