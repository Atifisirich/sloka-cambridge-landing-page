/* =====================================================================
   Close to home: neighbourhood names orbit the glowing mandala (Sloka,
   Manneguda). Type where you live and the orbit settles back to true
   bearings, your area lights up and a route line draws to the school,
   tagged with an APPROXIMATE drive time (LOCALITIES[].mins in js/config.js,
   rough estimates for the school to verify).
   ===================================================================== */
import { env, lerp, visibility } from './env.js';
import { pulse } from './mandala.js';

const RINGS = [200, 300, 400];
const SIZES = [30, 26, 22];
const NS = 'http://www.w3.org/2000/svg';
const norm = (s) => s.toLowerCase().replace(/[^a-z]/g, '');

export function initOrbitMap() {
  const wrap = document.querySelector('[data-orbit]');
  const list = window.SLOKA_SITE?.LOCALITIES || [];
  if (!wrap || !list.length) return;
  const g = wrap.querySelector('.orbit-map__labels');
  const route = wrap.querySelector('.orbit-map__route');
  const mandala = wrap.querySelector('.orbit-map__mandala');
  const input = document.getElementById('whereInput');
  const result = document.querySelector('.location__result');
  const note = document.querySelector('.location__note');

  // time tag that sits at the middle of the route line
  const eta = document.createElementNS(NS, 'g');
  eta.setAttribute('class', 'orbit-map__eta');
  eta.innerHTML = '<rect height="44" rx="22"/><text text-anchor="middle" dominant-baseline="central"></text>';
  route.after(eta);
  const etaRect = eta.querySelector('rect'), etaText = eta.querySelector('text');
  const minsLabel = (m) => (m ? `~${m[0]}–${m[1]} min` : '');

  // accessible list + datalist suggestions
  wrap.querySelector('[data-locality-list]').innerHTML = list.map((l) => `<li>${l.name}</li>`).join('');
  document.getElementById('localityList').innerHTML = list.map((l) => `<option value="${l.name}"></option>`).join('');

  const items = list.map((l) => {
    const dot = document.createElementNS(NS, 'circle');
    dot.setAttribute('r', 4);
    dot.setAttribute('class', 'loc-dot');
    const text = document.createElementNS(NS, 'text');
    text.setAttribute('class', 'loc');
    text.setAttribute('font-size', SIZES[l.ring]);
    text.textContent = l.name;
    g.append(dot, text);
    return { ...l, dot, text, x: 0, y: 0, key: norm(l.name) };
  });

  let spin = 0, spinSpeed = env.reduced ? 0 : 0.02, t = 0, visible = false, hit = null;

  function place() {
    items.forEach((it, i) => {
      const breathe = env.reduced ? 0 : Math.sin(t * 0.8 + it.ring * 1.4) * 8;
      const r = RINGS[it.ring] + breathe;
      const a = ((it.angle + spin) * Math.PI) / 180;
      it.x = Math.sin(a) * r;
      it.y = -Math.cos(a) * r;
      const right = Math.sin(a) >= 0;
      it.dot.setAttribute('cx', it.x.toFixed(1));
      it.dot.setAttribute('cy', it.y.toFixed(1));
      it.text.setAttribute('x', (it.x + (right ? 10 : -10)).toFixed(1));
      it.text.setAttribute('y', (it.y + SIZES[it.ring] * 0.33).toFixed(1));
      it.text.setAttribute('text-anchor', right ? 'start' : 'end');
    });
  }
  place();

  visibility(wrap, (v) => (visible = v));
  if (!env.reduced) {
    gsap.ticker.add(() => {
      if (!visible) return;
      t += 0.016;
      if (hit) spin = lerp(spin, Math.round(spin / 360) * 360, 0.06); // settle to true bearings
      else spin += spinSpeed;
      place();
      if (hit) drawRoute(hit, false);
    });
  }

  function drawRoute(it, animate) {
    // a gentle curve from the area to the school
    const mx = it.x / 2 - it.y * 0.18, my = it.y / 2 + it.x * 0.18;
    route.setAttribute('d', `M${it.x.toFixed(1)} ${it.y.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} 0 0`);
    // midpoint of the quadratic curve (its end point is the school at 0,0)
    const ex = 0.25 * it.x + 0.5 * mx, ey = 0.25 * it.y + 0.5 * my;
    eta.setAttribute('transform', `translate(${ex.toFixed(1)} ${ey.toFixed(1)})`);
    if (animate) {
      const len = route.getTotalLength();
      route.style.strokeDasharray = `${len}`;
      route.style.strokeDashoffset = `${len}`;
      route.getBoundingClientRect();
      route.style.transition = env.reduced ? 'none' : 'stroke-dashoffset 1.4s cubic-bezier(.65,0,.35,1)';
      route.style.strokeDashoffset = '0';
    } else {
      route.style.strokeDasharray = 'none';
      route.style.strokeDashoffset = '0';
    }
  }

  let settleTimer;
  input.addEventListener('input', () => {
    const q = norm(input.value);
    const match = q.length >= 2 ? items.find((it) => it.key.startsWith(q)) || items.find((it) => it.key.includes(q)) : null;
    items.forEach((it) => {
      it.text.classList.toggle('is-hit', it === match);
      it.text.classList.toggle('is-dim', !!match && it !== match);
    });
    if (match && match !== hit) {
      hit = match;
      clearTimeout(settleTimer);
      route.setAttribute('d', '');
      // wait for the orbit to settle, then draw the route
      eta.classList.remove('is-on');
      etaText.textContent = minsLabel(match.mins);
      const w = etaText.getComputedTextLength() + 40;
      etaRect.setAttribute('x', -w / 2);
      etaRect.setAttribute('y', -22);
      etaRect.setAttribute('width', w);
      settleTimer = setTimeout(() => {
        drawRoute(match, true);
        pulse(mandala, 1.5);
        // the time tag lands once the line has been drawn
        if (match.mins) setTimeout(() => eta.classList.add('is-on'), env.reduced ? 0 : 1100);
      }, env.reduced ? 0 : 600);
      result.textContent = match.mins
        ? `${match.name} → Sloka, Manneguda: about ${match.mins[0]}–${match.mins[1]} minutes by car.`
        : `${match.name} → Sloka, Manneguda. Come and see us.`;
      note.hidden = !match.mins;
      // pre-select the same area in the enquiry form
      const sel = document.querySelector('[data-area-select]');
      if (sel && [...sel.options].some((o) => o.value === match.name)) sel.value = match.name;
    } else if (!match) {
      hit = null;
      clearTimeout(settleTimer);
      route.setAttribute('d', '');
      eta.classList.remove('is-on');
      note.hidden = true;
      result.textContent = q.length >= 2 ? 'Not on our little map yet. Tell us in the enquiry form and we will share directions.' : '';
    }
  });
}
