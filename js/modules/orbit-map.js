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

  // Phones: the orbit becomes a tall ellipse (narrow x, stretched y) with larger
  // names, so every label fits the width of the screen and stays readable.
  const SX = env.mobile ? 0.6 : 1, SY = env.mobile ? 1.1 : 1;
  const sizes = env.mobile ? [42, 38, 35] : SIZES;
  if (env.mobile) {
    wrap.querySelector('.orbit-map__svg').setAttribute('viewBox', '-500 -620 1000 1240');
    wrap.querySelector('.orbit-map__roads').setAttribute('transform', `scale(${SX} ${SY})`);
  }

  // time tag that sits at the middle of the route line
  const eta = document.createElementNS(NS, 'g');
  eta.setAttribute('class', 'orbit-map__eta');
  const ETA_H = env.mobile ? 74 : 44; // phones: the map is drawn smaller, so the tag is drawn bigger
  eta.innerHTML = `<rect height="${ETA_H}" rx="${ETA_H / 2}"/><text text-anchor="middle" dominant-baseline="central" font-size="${env.mobile ? 40 : 24}"></text>`;
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
    text.setAttribute('font-size', sizes[l.ring]);
    text.textContent = l.name;
    g.append(dot, text);
    return { ...l, dot, text, x: 0, y: 0, key: norm(l.name) };
  });

  // Phones keep the names still (an ellipse doesn't rotate rigidly, so names would
  // drift into each other); they "breathe" in and out instead. Larger screens orbit.
  let spin = 0, spinSpeed = env.reduced || env.mobile ? 0 : 0.02, t = 0, visible = false, hit = null;

  /* Nudge each name around its ring (closest free angle) until it overlaps
     no other name and stays clear of the centre and the edges. Runs once fonts
     are ready so text widths are real. Bearings stay roughly true ("not to scale"). */
  // phones keep a wider safety margin: their fonts/text-size settings can make names wider
  const LIMIT_X = env.mobile ? 455 : 490, LIMIT_Y = env.mobile ? 600 : 490;
  function boxAt(it, angle, radius) {
    const a = (angle * Math.PI) / 180;
    const x = Math.sin(a) * radius * SX, y = -Math.cos(a) * radius * SY;
    const size = sizes[it.ring], w = it.w || it.name.length * size * 0.5;
    const right = Math.sin(a) >= 0;
    const x0 = right ? x - 6 : x - 14 - w, x1 = right ? x + 14 + w : x + 6;
    return { x0, x1, y0: y - size * 0.72, y1: y + size * 0.42 };
  }
  const hits = (p, q, pad = 8) => p.x0 < q.x1 + pad && q.x0 < p.x1 + pad && p.y0 < q.y1 + pad && q.y0 < p.y1 + pad;
  function layout() {
    items.forEach((it) => { it.w = it.text.getComputedTextLength() || 0; });
    // keep clear of the mandala and the "Sloka, Manneguda" pin (drawn larger, relatively, on phones)
    const centre = env.mobile ? { x0: -225, x1: 225, y0: -150, y1: 160 } : { x0: -150, x1: 150, y0: -140, y1: 200 };
    const placed = [];
    [...items].sort((p, q) => p.ring - q.ring).forEach((it) => {
      const home = RINGS[it.ring];
      // closest free spot: same ring first, then slightly in/out, up to ±92° around
      for (const radius of [home, home + 55, home - 55, home + 100]) {
        for (let step = 0; step <= 46; step++) {
          const d = step === 0 ? 0 : Math.ceil(step / 2) * 4 * (step % 2 ? 1 : -1);
          const box = boxAt(it, it.baseAngle + d, radius);
          const inside = box.x0 > -LIMIT_X && box.x1 < LIMIT_X && box.y0 > -LIMIT_Y && box.y1 < LIMIT_Y;
          if (inside && !hits(box, centre) && !placed.some((b) => hits(box, b))) {
            it.angle = it.baseAngle + d;
            it.radius = radius;
            placed.push(box);
            return;
          }
        }
      }
      it.radius = home; // no free slot anywhere: keep its bearing
      placed.push(boxAt(it, it.angle, home));
    });
  }
  items.forEach((it) => { it.baseAngle = it.angle; it.radius = RINGS[it.ring]; });

  function place() {
    items.forEach((it, i) => {
      const breathe = env.reduced || env.mobile ? 0 : Math.sin(t * 0.8 + it.ring * 1.4) * 8;
      const r = it.radius + breathe;
      const a = ((it.angle + spin) * Math.PI) / 180;
      it.x = Math.sin(a) * r * SX;
      it.y = -Math.cos(a) * r * SY;
      const right = Math.sin(a) >= 0;
      it.dot.setAttribute('cx', it.x.toFixed(1));
      it.dot.setAttribute('cy', it.y.toFixed(1));
      it.text.setAttribute('x', (it.x + (right ? 10 : -10)).toFixed(1));
      it.text.setAttribute('y', (it.y + sizes[it.ring] * 0.33).toFixed(1));
      it.text.setAttribute('text-anchor', right ? 'start' : 'end');
    });
  }
  // Lay out again whenever real text widths may have changed: once the display
  // font has actually loaded (it loads lazily, after fonts.ready can already have
  // resolved), when any font finishes loading, and on resize/rotation.
  const relayout = () => { layout(); place(); if (hit) drawRoute(hit, false); };
  layout();
  place();
  document.fonts?.load(`${sizes[0]}px Gloock`).then(relayout).catch(() => {});
  document.fonts?.addEventListener?.('loadingdone', relayout);
  let resizeTimer;
  addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(relayout, 200); });

  // Phones: names are placed once and never re-drawn per frame (some phone GPUs
  // leave unpainted strips when many SVG texts move every frame). The "breathing"
  // is a single GPU-composited scale on the whole map instead (see .orbit-map--still).
  if (env.mobile && !env.reduced) wrap.classList.add('orbit-map--still');

  visibility(wrap, (v) => (visible = v));
  if (!env.reduced && !env.mobile) {
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
      const w = etaText.getComputedTextLength() + ETA_H;
      etaRect.setAttribute('x', -w / 2);
      etaRect.setAttribute('y', -ETA_H / 2);
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
