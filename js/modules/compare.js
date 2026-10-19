/* Curriculum guide (CBSE vs Cambridge): each pathway card gets .is-in as it
   scrolls into view, and its points ease in one by one (pure CSS). */
import { env } from './env.js';

export function initCompare() {
  const cards = [...document.querySelectorAll('[data-curric]')];
  if (!cards.length) return;
  if (env.reduced) { cards.forEach((c) => c.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -15% 0px' });
  cards.forEach((c) => io.observe(c));
}
