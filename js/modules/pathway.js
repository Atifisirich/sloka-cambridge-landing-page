/* =====================================================================
   The Cambridge Pathway as a metro line.
   Desktop: the section pins and vertical scroll drives a horizontal ride.
   The mandala is the train, rolling (rotating) as it travels; each station
   it reaches opens into a card and the train blooms one ring larger.
   Mobile: the same line runs vertically.
   ===================================================================== */
import { env, clamp } from './env.js';
import { pulse, parts } from './mandala.js';
import { spark } from './spark.js';

export function initPathway() {
  const section = document.querySelector('.pathway');
  if (!section) return;
  const track = section.querySelector('.pathway__track');
  const rail = section.querySelector('.pathway__rail');
  const line = rail.querySelector('.pathway__rail-line');
  const done = rail.querySelector('.pathway__rail-done');
  const train = section.querySelector('.pathway__train');
  const stations = [...section.querySelectorAll('[data-station]')];
  const vertical = env.mobile;

  if (env.reduced) { stations.forEach((s) => s.classList.add('is-open')); train.style.display = 'none'; return; }

  let opened = 0, centres = [], railLen = 0;
  const trainParts = parts(train);
  gsap.set(trainParts.halo, { opacity: 0 });

  function measure() {
    // layout offsets (not bounding boxes) so the track's own transform never skews the maths
    const list = track.querySelector('.stations');
    centres = stations.map((s) => {
      const dot = s.querySelector('.station__dot');
      return vertical
        ? list.offsetTop + s.offsetTop + dot.offsetTop + dot.offsetHeight / 2
        : list.offsetLeft + s.offsetLeft + dot.offsetLeft + dot.offsetWidth / 2;
    });
    // rail geometry
    if (vertical) {
      railLen = track.scrollHeight;
      rail.setAttribute('viewBox', `0 0 12 ${railLen}`);
      line.setAttribute('d', `M6 ${centres[0]} V ${centres[centres.length - 1]}`);
    } else {
      railLen = track.scrollWidth;
      rail.style.width = `${railLen}px`;
      rail.setAttribute('viewBox', `0 0 ${railLen} 12`);
      line.setAttribute('d', `M${centres[0]} 6 H ${centres[centres.length - 1]}`);
    }
    done.setAttribute('d', line.getAttribute('d'));
    const l = line.getTotalLength();
    done.style.strokeDasharray = `0 ${l + 10}`;
  }

  function update(progress) {
    const first = centres[0], last = centres[centres.length - 1];
    const pos = first + (last - first) * progress;
    const radius = (vertical ? 26 : 36);
    const roll = (pos / radius) * (180 / Math.PI);
    const scale = 1 + opened * 0.09;
    train.style.transform = vertical
      ? `translate3d(0, ${pos - 26}px, 0) rotate(${roll}deg) scale(${scale})`
      : `translate3d(${pos}px, 0, 0) rotate(${roll}deg) scale(${scale})`;
    done.style.strokeDasharray = `${pos - first} ${railLen}`;

    let count = 0;
    stations.forEach((s, i) => {
      const open = pos >= centres[i] - 4;
      if (open) count++;
      if (open !== s.classList.contains('is-open')) s.classList.toggle('is-open', open);
    });
    if (count > opened) {
      // reaching a new station: the train blooms a ring larger, the spark answers
      gsap.to(trainParts.halo, { opacity: Math.min(1, 0.25 * count), duration: 0.4 });
      pulse(train, 1.2);
      spark.bloom(0.6);
    }
    opened = count;
  }

  measure();

  if (vertical) {
    ScrollTrigger.create({
      trigger: track, start: 'top 65%', end: 'bottom 65%', scrub: 0.5,
      onRefresh: measure,
      onUpdate: (st) => update(st.progress)
    });
    update(0);
    return;
  }

  const distance = () => Math.max(0, track.scrollWidth - innerWidth);
  gsap.to(track, {
    x: () => -distance(), ease: 'none',
    scrollTrigger: {
      trigger: section, pin: true, start: 'top top',
      end: () => `+=${distance() * 1.15}`,
      scrub: 0.7, invalidateOnRefresh: true,
      onRefresh: measure,
      onUpdate: (st) => update(clamp(st.progress * 1.04, 0, 1))
    }
  });
  update(0);
}
