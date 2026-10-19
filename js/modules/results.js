/* =====================================================================
   Results: 12 yellow A* medallions and 24 maroon A tiles fall into a pit
   (Matter.js). Grab, throw and stack them; a counter ticks as they land.
   Fallback (mobile / reduced motion / no Matter): a neat stacked grid.
   ===================================================================== */
import { env, whenNear, loadScript, visibility } from './env.js';
import { spark } from './spark.js';

const STARS = 12, AS = 24;
const MATTER_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js';

export function initResults() {
  const section = document.querySelector('.results');
  const pit = section.querySelector('[data-physics]');
  const counter = section.querySelector('[data-count-total]');

  if (!env.rich) { fallbackGrid(section, pit); return; }

  counter.textContent = '0';
  whenNear(pit, async () => {
    try {
      await loadScript(MATTER_SRC);
      ScrollTrigger.create({ trigger: pit, start: 'top 75%', once: true, onEnter: () => startPhysics(pit, counter) });
    } catch (e) {
      counter.textContent = String(STARS + AS);
      fallbackGrid(section, pit);
    }
  }, '600px');
}

function fallbackGrid(section, pit) {
  section.classList.add('physics-off');
  const ul = pit.querySelector('.results__grid');
  const star = medallionSVG();
  let html = '';
  for (let i = 0; i < STARS + AS; i++) {
    html += i < STARS
      ? `<li class="token token--star" style="--i:${i}">${star}<b>A*</b></li>`
      : `<li class="token token--a" style="--i:${i}">A</li>`;
  }
  ul.innerHTML = html;
  ul.querySelectorAll('li').forEach((li) => li.setAttribute('aria-hidden', 'true'));
  if (env.reduced) { ul.classList.add('tokens-in'); return; }
  new IntersectionObserver((en, io) => {
    if (en[0].isIntersecting) { ul.classList.add('tokens-in'); io.disconnect(); }
  }, { threshold: 0.3 }).observe(ul);
}

function medallionSVG() {
  let petals = '';
  for (let i = 0; i < 8; i++) petals += `<ellipse cx="0" cy="-30" rx="11" ry="17" transform="rotate(${i * 45})" fill="#E87724"/>`;
  for (let i = 0; i < 8; i++) petals += `<ellipse cx="0" cy="-26" rx="9" ry="14" transform="rotate(${i * 45 + 22.5})" fill="#F9C212"/>`;
  return `<svg viewBox="-50 -50 100 100" aria-hidden="true">${petals}<circle r="27" fill="#F9C212" stroke="#971B1E" stroke-width="2"/></svg>`;
}

/* Pre-render token sprites once; drawing images is far cheaper than paths per frame */
function sprite(size, draw) {
  const dpr = Math.min(devicePixelRatio, 2);
  const c = document.createElement('canvas');
  c.width = c.height = size * dpr;
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.translate(size / 2, size / 2);
  draw(ctx);
  return c;
}

function startPhysics(pit, counter) {
  const { Engine, Bodies, Composite, Mouse, MouseConstraint, Events, Body } = window.Matter;
  const canvas = pit.querySelector('.results__canvas');
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(devicePixelRatio, 2);
  let W = pit.clientWidth, H = pit.clientHeight;

  const R = W < 1100 ? 30 : 36;              // medallion radius
  const S = R * 1.65;                        // tile size

  const starImg = sprite(R * 2.6, (c) => {
    const k = R / 36;
    for (let i = 0; i < 8; i++) { c.save(); c.rotate((i * Math.PI) / 4); c.fillStyle = '#E87724'; c.beginPath(); c.ellipse(0, -30 * k, 10 * k, 15 * k, 0, 0, Math.PI * 2); c.fill(); c.restore(); }
    for (let i = 0; i < 8; i++) { c.save(); c.rotate((i * Math.PI) / 4 + Math.PI / 8); c.fillStyle = '#F9C212'; c.beginPath(); c.ellipse(0, -27 * k, 8 * k, 13 * k, 0, 0, Math.PI * 2); c.fill(); c.restore(); }
    c.fillStyle = '#F9C212'; c.strokeStyle = '#971B1E'; c.lineWidth = 2.5 * k;
    c.beginPath(); c.arc(0, 0, 26 * k, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = '#971B1E'; c.font = `${22 * k}px Gloock, Georgia, serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('A*', 1 * k, 2 * k);
  });
  const aImg = sprite(S + 4, (c) => {
    c.fillStyle = '#971B1E';
    c.beginPath(); c.roundRect(-S / 2, -S / 2, S, S, S * 0.16); c.fill();
    c.fillStyle = '#FBF5E9'; c.font = `${S * 0.5}px Gloock, Georgia, serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('A', 0, S * 0.04);
  });

  const engine = Engine.create({ gravity: { y: 1.1 } });
  const wallOpts = { isStatic: true, label: 'wall', render: { visible: false } };
  const ground = Bodies.rectangle(W / 2, H + 40, W * 3, 80, { ...wallOpts, label: 'ground' });
  const left = Bodies.rectangle(-40, H / 2 - 400, 80, H * 3, wallOpts);
  const right = Bodies.rectangle(W + 40, H / 2 - 400, 80, H * 3, wallOpts);
  Composite.add(engine.world, [ground, left, right]);

  function size() {
    W = pit.clientWidth; H = pit.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    Body.setPosition(ground, { x: W / 2, y: H + 40 });
    Body.setPosition(left, { x: -40, y: H / 2 - 400 });
    Body.setPosition(right, { x: W + 40, y: H / 2 - 400 });
  }
  size();
  addEventListener('resize', size);

  // drop tokens in a shuffled order
  const kinds = [...Array(STARS).fill('star'), ...Array(AS).fill('a')].sort(() => Math.random() - 0.5);
  const tokens = [];
  kinds.forEach((kind, i) => {
    setTimeout(() => {
      const x = W * 0.15 + Math.random() * W * 0.7;
      const opts = { restitution: 0.45, friction: 0.3, frictionAir: 0.008, density: 0.002 };
      const body = kind === 'star'
        ? Bodies.circle(x, -60 - Math.random() * 120, R, { ...opts, label: 'star' })
        : Bodies.rectangle(x, -60 - Math.random() * 120, S, S, { ...opts, label: 'a', chamfer: { radius: S * 0.16 } });
      Body.setAngle(body, Math.random() * Math.PI);
      Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.2);
      body.landed = false;
      tokens.push(body);
      Composite.add(engine.world, body);
    }, i * 85);
  });

  // count a token the first time it touches the floor or the pile
  let landed = 0;
  Events.on(engine, 'collisionStart', (ev) => {
    ev.pairs.forEach(({ bodyA, bodyB }) => {
      [[bodyA, bodyB], [bodyB, bodyA]].forEach(([t, other]) => {
        if (t.landed || (t.label !== 'star' && t.label !== 'a')) return;
        if (other.label === 'ground' || other.landed) {
          t.landed = true;
          landed++;
          counter.textContent = landed;
          if (landed === STARS + AS) spark.bloom(1.5);
        }
      });
    });
  });

  // grab & throw
  const mouse = Mouse.create(canvas);
  mouse.pixelRatio = 1;
  // let the page keep scrolling over the canvas
  mouse.element.removeEventListener('wheel', mouse.mousewheel);
  mouse.element.removeEventListener('mousewheel', mouse.mousewheel);
  mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel);
  const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2, render: { visible: false } } });
  Composite.add(engine.world, mc);

  let visible = true;
  visibility(pit, (v) => (visible = v), '100px');

  gsap.ticker.add(() => {
    if (!visible) return;
    Engine.update(engine, 1000 / 60);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (const b of tokens) {
      const img = b.label === 'star' ? starImg : aImg;
      const s = b.label === 'star' ? R * 2.6 : S + 4;
      ctx.save();
      ctx.translate(b.position.x, b.position.y);
      ctx.rotate(b.angle);
      ctx.drawImage(img, -s / 2, -s / 2, s, s);
      ctx.restore();
    }
  });
}
