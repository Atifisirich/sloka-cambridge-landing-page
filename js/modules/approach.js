/* =====================================================================
   Memorise vs Understand.
   Drag right (the knob, the stage or the range input) and the cramped grey
   "Memorise" grid is squeezed smaller while a tree of questions grows from
   the same fact on the "Understand" side.
   ===================================================================== */
import { env, clamp } from './env.js';
import { pulse } from './mandala.js';

const FACT = 'Plants make food from sunlight. ';

// Tree: [id, parent, x, y, label, size, appearsAt]
const NODES = [
  ['root', null, 300, 405, 'plants make food', 26, 0],
  ['why', 'root', 150, 300, 'Why?', 38, 0.18],
  ['whatif', 'root', 455, 290, 'What if?', 38, 0.28],
  ['connect', 'root', 305, 215, 'How does it connect?', 28, 0.42],
  ['green', 'why', 125, 170, 'Why are leaves green?', 23, 0.55],
  ['nosun', 'whatif', 455, 160, 'What if there were no sun?', 23, 0.6],
  ['eat', 'connect', 215, 95, 'Is my lunch sunlight?', 24, 0.72],
  ['test', 'connect', 440, 72, 'Can we test it?', 26, 0.82],
  ['oxygen', 'green', 165, 38, 'Where does the oxygen go?', 22, 0.9]
];

export function initApproach() {
  const root = document.querySelector('[data-split-slider]');
  if (!root) return;
  const grid = root.querySelector('.split__grid');
  const svg = root.querySelector('.split__tree');
  const range = root.querySelector('.split__range');
  const stage = root.querySelector('.split__stage');
  const knob = root.querySelector('.split__knob');

  // cramped, repeated "memorise" text
  grid.innerHTML = Array.from({ length: 34 }, (_, i) => `<span>${String(i + 1).padStart(2, '0')}  ${FACT.repeat(3)}</span>`).join('');

  // build the tree
  const NS = 'http://www.w3.org/2000/svg';
  const byId = Object.fromEntries(NODES.map((n) => [n[0], n]));
  const branches = [], leaves = [];
  NODES.forEach(([id, parent, x, y, label, size, at]) => {
    if (parent) {
      const p = byId[parent];
      const path = document.createElementNS(NS, 'path');
      const midY = (p[3] + y) / 2;
      path.setAttribute('d', `M${p[2]} ${p[3] - 14} C ${p[2]} ${midY}, ${x} ${midY + 20}, ${x} ${y + 10}`);
      path.setAttribute('class', 'branch');
      svg.appendChild(path);
      branches.push({ path, at, len: 0 });
    }
    const g = document.createElementNS(NS, 'g');
    g.innerHTML = `<circle class="bud" cx="${x}" cy="${y + 10}" r="${parent ? 5 : 0}"/><text class="leaf${parent ? '' : ' leaf--root'}" x="${x}" y="${y}" text-anchor="middle" font-size="${size}">${label}</text>`;
    svg.appendChild(g);
    leaves.push({ g, at, text: g.querySelector('text'), x, size });
  });

  // Keep every question fully inside the panel: measure the real rendered width
  // (phones may use bigger text sizes or different font metrics), shrink a label
  // that is too long, then nudge it inward from the edges.
  const VB_W = 600, PAD = 10;
  function fitLeaves() {
    leaves.forEach((l) => {
      l.text.setAttribute('font-size', l.size);
      let w = l.text.getComputedTextLength();
      if (!w) return;
      if (w > VB_W - PAD * 2) {
        l.text.setAttribute('font-size', (l.size * (VB_W - PAD * 2)) / w);
        w = l.text.getComputedTextLength();
      }
      const half = w / 2;
      l.text.setAttribute('x', clamp(l.x, PAD + half, VB_W - PAD - half).toFixed(1));
    });
  }
  fitLeaves();
  document.fonts?.load('24px Gloock').then(fitLeaves).catch(() => {});
  document.fonts?.addEventListener?.('loadingdone', fitLeaves);
  let fitTimer;
  addEventListener('resize', () => { clearTimeout(fitTimer); fitTimer = setTimeout(fitLeaves, 200); });
  branches.forEach((b) => { b.len = b.path.getTotalLength(); b.path.style.strokeDasharray = b.len; });

  let v = 0.15;
  function render() {
    root.style.setProperty('--v', v.toFixed(3));
    branches.forEach((b) => {
      const t = clamp((v - b.at + 0.12) / 0.14, 0, 1);
      b.path.style.strokeDashoffset = b.len * (1 - t);
    });
    leaves.forEach((l) => {
      const t = clamp((v - l.at) / 0.1, 0, 1);
      l.g.style.opacity = l.at === 0 ? 1 : t;
      l.g.style.transform = `translateY(${(1 - t) * 8}px)`;
    });
    if (knob.firstElementChild) knob.firstElementChild.style.transform = `rotate(${v * 540}deg)`;
  }
  leaves.forEach((l) => (l.g.style.transition = 'opacity .35s, transform .35s'));

  let lastBloom = 0;
  function set(next, fromInput) {
    const prev = v;
    v = clamp(next, 0, 1);
    if (!fromInput) range.value = Math.round(v * 100);
    // a little bloom of the knob each time a new question appears
    const crossed = NODES.some((n) => n[6] > 0 && prev < n[6] && v >= n[6]);
    if (crossed && performance.now() - lastBloom > 250) { pulse(knob, 0.8); lastBloom = performance.now(); }
    render();
  }

  range.addEventListener('input', () => set(range.value / 100, true));

  // drag anywhere on the stage: moving right grows understanding
  let dragging = false, startX = 0, startV = 0;
  stage.style.touchAction = 'pan-y';
  stage.style.cursor = 'ew-resize';
  stage.addEventListener('pointerdown', (e) => { dragging = true; startX = e.clientX; startV = v; stage.setPointerCapture(e.pointerId); });
  stage.addEventListener('pointermove', (e) => { if (dragging) set(startV + (e.clientX - startX) / (stage.clientWidth * 0.6)); });
  const end = () => (dragging = false);
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);

  render();

  // first time it scrolls into view, nudge it to show it's alive
  if (!env.reduced && window.ScrollTrigger) {
    ScrollTrigger.create({
      trigger: stage, start: 'top 70%', once: true,
      onEnter: () => {
        const o = { v };
        gsap.timeline().to(o, { v: 0.45, duration: 1.4, ease: 'power2.inOut', onUpdate: () => set(o.v) })
          .to(o, { v: 0.3, duration: 0.8, ease: 'power2.inOut', onUpdate: () => set(o.v) });
      }
    });
  } else {
    set(1);
  }
}
