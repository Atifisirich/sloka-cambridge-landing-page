/* =====================================================================
   Loader: on maroon, the mandala blooms petal by petal from its centre dot,
   spins once, then its petals fly outward like a curtain opening while a
   hole widens in the maroon screen. The logo flies up into the header.
   Repeat visits in the same session get a shorter version.
   ===================================================================== */
import { env } from './env.js';
import { bloomTimeline, parts } from './mandala.js';
import { stopScroll } from './smooth.js';

export function runLoader() {
  const loader = document.querySelector('.loader');
  const headerLogo = document.querySelector('.site-header__logo img');
  if (!loader) return Promise.resolve();

  const done = () => { loader.remove(); stopScroll(false); };

  if (env.reduced) {
    return new Promise((res) => {
      gsap.to(loader, { opacity: 0, duration: 0.4, onComplete: () => { done(); res(); } });
    });
  }

  let seen = false;
  try { seen = sessionStorage.getItem('sloka-seen') === '1'; sessionStorage.setItem('sloka-seen', '1'); } catch (e) { /* storage blocked */ }
  const speed = seen ? 2.4 : 1;

  stopScroll(true);
  scrollTo(0, 0);
  const mandalaEl = loader.querySelector('.loader__mandala');
  const logo = loader.querySelector('.loader__logo');
  gsap.set(headerLogo, { opacity: 0 });

  return new Promise((resolve) => {
    const p = parts(mandalaEl);
    const tl = gsap.timeline({ onComplete: () => { done(); } });

    tl.add(bloomTimeline(mandalaEl, { speed }))
      .to(logo, { opacity: 1, duration: 0.5 / speed }, '-=0.4')
      .to(p.rot, { rotate: 360, transformOrigin: '50% 50%', duration: 1.1 / speed, ease: 'power3.inOut' }, '-=0.2')
      // the curtain: petals fly outward, the maroon screen opens from the centre
      .addLabel('open')
      .to(p.dots, { y: -420, opacity: 0, duration: 0.9, ease: 'power3.in' }, 'open')
      .to(p.dia, { y: -380, opacity: 0, duration: 0.9, ease: 'power3.in' }, 'open+=0.04')
      .to(p.outer, { y: -340, scaleY: 1.6, opacity: 0, duration: 0.95, ease: 'power3.in', stagger: 0.02 }, 'open+=0.08')
      .to(p.inner, { y: -300, scaleY: 1.5, opacity: 0, duration: 0.95, ease: 'power3.in', stagger: 0.02 }, 'open+=0.14')
      .to([p.core, p.ring], { scale: 0, duration: 0.5, ease: 'power2.in' }, 'open+=0.3')
      .to(loader, { '--hole': '150vmax', duration: 1.25, ease: 'power3.in' }, 'open+=0.35')
      .add(() => resolve(), 'open+=0.9');

    // logo FLIP into the header
    tl.add(() => {
      if (!headerLogo || !logo.naturalWidth) { gsap.set(headerLogo, { opacity: 1 }); return; }
      const a = logo.getBoundingClientRect(), b = headerLogo.getBoundingClientRect();
      gsap.to(logo, {
        x: b.left + b.width / 2 - (a.left + a.width / 2),
        y: b.top + b.height / 2 - (a.top + a.height / 2),
        scale: b.height / a.height, duration: 0.9, ease: 'expo.inOut',
        onComplete: () => { gsap.set(headerLogo, { opacity: 1 }); gsap.set(logo, { opacity: 0 }); }
      });
    }, 'open');
  });
}
