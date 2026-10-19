/* Learner outcomes: a five-sided CSS 3D prism. The section pins and each
   stretch of scroll turns the prism exactly one face (snap). Reduced motion
   or no 3D support: the faces lay flat as a simple grid. */
import { env, whenNear } from './env.js';
import { spark } from './spark.js';

export function initPrism() {
  const section = document.querySelector('.outcomes');
  const prism = section?.querySelector('[data-prism]');
  if (!prism) return;
  const faces = [...prism.children];
  const index = [...section.querySelectorAll('.outcomes__index li')];
  faces.forEach((f, i) => f.style.setProperty('--i', i));
  // native lazy-loading never fires for faces turned away in 3D: load them as the section nears
  whenNear(section, () => prism.querySelectorAll('img').forEach((img) => (img.loading = 'eager')), '900px');

  const supports3d = CSS.supports('transform-style', 'preserve-3d');
  if (env.reduced || !supports3d) {
    prism.classList.add('prism--flat');
    index.forEach((li) => li.classList.add('is-on'));
    return;
  }

  let current = -1;
  const setActive = (i) => {
    if (i === current) return;
    current = i;
    index.forEach((li, k) => li.classList.toggle('is-on', k === i));
    faces.forEach((f, k) => f.setAttribute('aria-hidden', k === i ? 'false' : 'true'));
    spark.bloom(0.5);
  };
  setActive(0);

  gsap.set(prism, { rotateX: -7 });
  gsap.to(prism, {
    rotateY: -72 * (faces.length - 1), ease: 'none',
    scrollTrigger: {
      trigger: section, pin: true, start: 'top top', end: () => `+=${innerHeight * 2.6}`,
      scrub: 0.6,
      snap: { snapTo: 1 / (faces.length - 1), duration: { min: 0.25, max: 0.6 }, delay: 0.05, ease: 'power2.inOut' },
      onUpdate: (st) => setActive(Math.round(st.progress * (faces.length - 1)))
    }
  });
}
