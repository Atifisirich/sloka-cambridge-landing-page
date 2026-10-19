/* =====================================================================
   "What makes Sloka different": every tile has its own micro-world.
   AI: scrambled code decodes on hover + a typing caret
   STEAM: the photo scatters into WebGL particles and reassembles
   Biz Talk: vinyl spins at the speed of your scroll, ON AIR on hover
   Swimming: water-ripple shader following the cursor
   Skating: tile glides sideways with scroll velocity
   Art & Music: paint-splash mask reveal
   Care Club: one line draws a heart, then a hand holding it
   ===================================================================== */
import { env, clamp, lerp, pointer, whenNear, visibility } from './env.js';
import { scroll } from './smooth.js';
import { program, texture, loadImage, imageQuad, COVER } from './gl.js';

export function initBento() {
  initScramble();
  initTyping();
  initVinyl();
  initGlide();
  initSplash();
  initCare();
  if (env.rich && !env.lowPower) {
    whenNear(document.querySelector('[data-particles]'), () => initParticles(document.querySelector('[data-particles]')));
    whenNear(document.querySelector('[data-ripple]'), () => initRipple(document.querySelector('[data-ripple]')));
  }
}

/* ---------- AI: text scramble ---------- */
const GLYPHS = '01{}[]<>/=+*#$%&_;:ABCDEFabcdef';
function initScramble() {
  const tile = document.querySelector('.tile--ai');
  const title = tile.querySelector('[data-scramble]');
  const final = title.dataset.scramble;
  title.setAttribute('aria-label', final);
  const randomText = () => [...final].map((ch) => (ch === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join('');
  if (env.reduced) return;

  let raf = null;
  const show = (txt) => (title.textContent = txt);
  show(randomText());

  function decode() {
    cancelAnimationFrame(raf);
    const start = performance.now(), dur = 900;
    const step = (now) => {
      const p = clamp((now - start) / dur, 0, 1);
      const reveal = Math.floor(p * final.length);
      show([...final].map((ch, i) => (i < reveal || ch === ' ' ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join(''));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  function scramble() {
    cancelAnimationFrame(raf);
    let n = 0;
    const step = () => { show(randomText()); if (++n < 8) raf = requestAnimationFrame(step); };
    step();
  }
  tile.addEventListener('pointerenter', decode);
  tile.addEventListener('focus', decode);
  tile.addEventListener('pointerleave', scramble);
  tile.addEventListener('blur', scramble);
  // touch: no hover, so decode when it scrolls into view
  if (env.touch) ScrollTrigger.create({ trigger: tile, start: 'top 70%', once: true, onEnter: decode });
}

/* ---------- AI: typing caret ---------- */
function initTyping() {
  const el = document.querySelector('[data-type]');
  if (!el) return;
  const lines = [el.dataset.type, 'train(model, data=my_drawings)', 'print("Hello, Stage 2!")'];
  if (env.reduced) { el.textContent = lines[0]; return; }
  let li = 0, i = 0, deleting = false, timer;
  const tick = () => {
    const line = lines[li];
    el.textContent = line.slice(0, i);
    if (!deleting && i < line.length) { i++; timer = setTimeout(tick, 55 + Math.random() * 60); }
    else if (!deleting) { deleting = true; timer = setTimeout(tick, 1800); }
    else if (i > 0) { i--; timer = setTimeout(tick, 22); }
    else { deleting = false; li = (li + 1) % lines.length; timer = setTimeout(tick, 400); }
  };
  visibility(el, (v) => { clearTimeout(timer); if (v) tick(); });
}

/* ---------- Biz Talk vinyl ---------- */
function initVinyl() {
  const disc = document.querySelector('.vinyl__disc');
  if (!disc || env.reduced) return;
  let rot = 0, visible = false, speed = 0;
  visibility(disc, (v) => (visible = v));
  gsap.ticker.add(() => {
    if (!visible) return;
    speed = lerp(speed, 0.25 + Math.abs(scroll.velocity) * 0.6, 0.08);
    rot = (rot + speed) % 360;
    disc.style.transform = `rotate(${rot}deg)`;
  });
}

/* ---------- Skating glide ---------- */
function initGlide() {
  const el = document.querySelector('[data-glide]');
  if (!el || env.reduced) return;
  const to = gsap.quickTo(el, 'xPercent', { duration: 0.9, ease: 'power3.out' });
  let visible = false;
  visibility(el, (v) => (visible = v));
  gsap.ticker.add(() => { if (visible) to(clamp(scroll.velocity * -0.7, -12, 12)); });
}

/* ---------- Art & Music: paint splash ---------- */
function initSplash() {
  const box = document.querySelector('[data-splash]');
  if (!box || env.reduced) return;
  // splash blobs: x%, y%, radius (fraction of the tile's larger side), start delay
  const blobs = [
    [48, 52, 0.42, 0], [22, 30, 0.22, 0.08], [78, 28, 0.24, 0.12], [26, 78, 0.22, 0.16], [80, 76, 0.26, 0.1],
    [55, 12, 0.14, 0.22], [8, 55, 0.12, 0.26], [92, 50, 0.12, 0.3], [60, 92, 0.13, 0.24],
    [35, 8, 0.05, 0.3], [95, 12, 0.04, 0.34], [5, 92, 0.05, 0.36], [70, 60, 0.3, 0.2]
  ];
  const paint = (p) => {
    const size = Math.max(box.clientWidth, box.clientHeight);
    const g = blobs.map(([x, y, r, d]) => {
      const t = clamp((p - d) / 0.55, 0, 1);
      const rad = size * r * (1 - Math.pow(1 - t, 3));
      return `radial-gradient(circle at ${x}% ${y}%, #000 ${rad * 0.94}px, transparent ${rad + 0.5}px)`;
    });
    box.style.setProperty('--splash', g.join(','));
  };
  paint(0);
  const st = { p: 0 };
  ScrollTrigger.create({
    trigger: box, start: 'top 75%', once: true,
    onEnter: () => gsap.to(st, { p: 1, duration: 1.6, ease: 'power2.out', onUpdate: () => paint(st.p), onComplete: () => box.style.setProperty('--splash', 'none') })
  });
}

/* ---------- Care Club: one line, a heart, then a hand ---------- */
function initCare() {
  const heart = document.querySelector('.care__heart');
  const hand = document.querySelector('.care__hand');
  if (!heart || env.reduced) return;
  [heart, hand].forEach((p) => { const l = p.getTotalLength(); p.style.strokeDasharray = l; p.style.strokeDashoffset = l; });
  ScrollTrigger.create({
    trigger: heart.closest('.tile'), start: 'top 75%', once: true,
    onEnter: () => gsap.timeline()
      .to(heart, { strokeDashoffset: 0, duration: 2.2, ease: 'power1.inOut' })
      .to(hand, { strokeDashoffset: 0, duration: 2.4, ease: 'power1.inOut' }, '-=0.3')
      .to(heart, { scale: 1.06, transformOrigin: '50% 60%', duration: 0.5, yoyo: true, repeat: 3, ease: 'sine.inOut' })
  });
}

/* ---------- STEAM Lab: particle scatter (WebGL points) ---------- */
const P_VERT = `
precision mediump float; // must match the fragment shader for shared uniforms
attribute vec2 aUv;
attribute vec3 aRnd;
uniform float uScatter, uPoint, uTime;
uniform vec2 uMouse, uRes, uImg;
varying vec2 vTex;
${COVER}
void main() {
  vec2 dir = normalize(aRnd.xy - 0.5 + 0.0001);
  float d = distance(aUv, uMouse);
  vec2 off = dir * uScatter * (0.08 + aRnd.z * 0.35);
  off += (aUv - uMouse) * uScatter * 0.25 / (d + 0.25);
  off += vec2(sin(uTime * 2.0 + aRnd.z * 6.28), cos(uTime * 1.7 + aRnd.x * 6.28)) * 0.012 * uScatter;
  vec2 pos = aUv + off;
  gl_Position = vec4(pos.x * 2.0 - 1.0, 1.0 - pos.y * 2.0, 0.0, 1.0);
  gl_PointSize = uPoint * (1.0 - uScatter * 0.4);
  vTex = coverUv(aUv, uRes, uImg);
}`;
const P_FRAG = `
precision mediump float;
uniform sampler2D uTex;
uniform float uScatter;
varying vec2 vTex;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  if (uScatter > 0.04 && dot(c, c) > 0.25) discard;
  gl_FragColor = texture2D(uTex, vTex);
}`;

async function initParticles(box) {
  const imgEl = box.querySelector('img');
  try {
    const img = await loadImage(imgEl.currentSrc || imgEl.src);
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.opacity = '0';
    box.appendChild(canvas);
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) return;
    const prog = program(gl, P_VERT, P_FRAG);
    gl.useProgram(prog);
    texture(gl, img);

    const dpr = Math.min(devicePixelRatio, 1.5);
    let cols = 0, rows = 0, count = 0;
    const uv = gl.createBuffer(), rnd = gl.createBuffer();
    const U = (n) => gl.getUniformLocation(prog, n);
    const aUv = gl.getAttribLocation(prog, 'aUv'), aRnd = gl.getAttribLocation(prog, 'aRnd');

    function build() {
      const w = box.clientWidth, h = box.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
      cols = 130; rows = Math.round((cols * h) / w); count = cols * rows;
      const a = new Float32Array(count * 2), r = new Float32Array(count * 3);
      for (let y = 0, k = 0; y < rows; y++) for (let x = 0; x < cols; x++, k++) {
        a[k * 2] = (x + 0.5) / cols; a[k * 2 + 1] = (y + 0.5) / rows;
        r[k * 3] = Math.random(); r[k * 3 + 1] = Math.random(); r[k * 3 + 2] = Math.random();
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, uv); gl.bufferData(gl.ARRAY_BUFFER, a, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(aUv); gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, rnd); gl.bufferData(gl.ARRAY_BUFFER, r, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(aRnd); gl.vertexAttribPointer(aRnd, 3, gl.FLOAT, false, 0, 0);
      gl.uniform2f(U('uRes'), canvas.width, canvas.height);
      gl.uniform2f(U('uImg'), img.naturalWidth, img.naturalHeight);
      gl.uniform1f(U('uPoint'), (canvas.width / cols) * 1.15);
    }
    build();
    addEventListener('resize', build);

    const state = { s: 0 };
    let running = false, mouse = [0.5, 0.5];
    const t0 = performance.now();
    const draw = () => {
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(U('uScatter'), state.s);
      gl.uniform1f(U('uTime'), (performance.now() - t0) / 1000);
      gl.uniform2f(U('uMouse'), mouse[0], mouse[1]);
      gl.drawArrays(gl.POINTS, 0, count);
    };
    const loop = () => { if (!running) return; draw(); requestAnimationFrame(loop); };

    const tile = box.closest('.tile');
    tile.addEventListener('pointermove', (e) => {
      const r = box.getBoundingClientRect();
      mouse = [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
    });
    tile.addEventListener('pointerenter', () => {
      if (!running) { running = true; loop(); }
      canvas.style.opacity = '1'; imgEl.style.opacity = '0';
      gsap.killTweensOf(state);
      // scatter out, then drift back together while still hovered
      gsap.timeline()
        .to(state, { s: 1, duration: 0.7, ease: 'power3.out' })
        .to(state, { s: 0, duration: 1.6, ease: 'elastic.out(1, .6)', delay: 0.15 });
    });
    tile.addEventListener('pointerleave', () => {
      gsap.killTweensOf(state);
      gsap.to(state, {
        s: 0, duration: 0.6, ease: 'power3.out',
        onComplete: () => { running = false; draw(); imgEl.style.opacity = '1'; canvas.style.opacity = '0'; }
      });
    });
  } catch (e) { console.warn('[bento] particles off', e); }
}

/* ---------- Swimming: ripple shader ---------- */
const RIPPLE = `
precision mediump float;
uniform sampler2D uTex;
uniform vec2 uRes, uImg, uMouse;
uniform float uTime, uStrength;
varying vec2 vUv;
${COVER}
void main() {
  vec2 uv = vUv;
  vec2 aspect = vec2(uRes.x / uRes.y, 1.0);
  vec2 d = (uv - uMouse) * aspect;
  float dist = length(d);
  float wave = sin(dist * 46.0 - uTime * 7.0) * exp(-dist * 4.5) * uStrength;
  vec2 ambient = vec2(sin(uv.y * 18.0 + uTime * 1.3), cos(uv.x * 15.0 + uTime * 1.1)) * 0.0028;
  uv += normalize(d + 0.0001) * wave * 0.022 / aspect + ambient;
  vec3 col = texture2D(uTex, coverUv(uv, uRes, uImg)).rgb + wave * 0.05;
  gl_FragColor = vec4(col, 1.0);
}`;

async function initRipple(box) {
  const imgEl = box.querySelector('img');
  try {
    const img = await loadImage(imgEl.currentSrc || imgEl.src);
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    box.appendChild(canvas);
    const quad = imageQuad(canvas, img, RIPPLE, { dpr: Math.min(devicePixelRatio, 1.5) });
    if (!quad) return;
    let visible = false, strength = 0, target = 0, mx = 0.5, my = 0.5, tx = 0.5, ty = 0.5;
    visibility(box, (v) => (visible = v));
    addEventListener('resize', () => quad.resize());
    const tile = box.closest('.tile');
    tile.addEventListener('pointermove', (e) => {
      const r = box.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width; ty = (e.clientY - r.top) / r.height;
      target = Math.min(1, 0.4 + pointer.speed * 1.5);
    });
    tile.addEventListener('pointerleave', () => (target = 0));
    const t0 = performance.now();
    gsap.ticker.add(() => {
      if (!visible) return;
      mx = lerp(mx, tx, 0.12); my = lerp(my, ty, 0.12);
      strength = lerp(strength, target, 0.06);
      target *= 0.985;
      quad.render({ uTime: (performance.now() - t0) / 1000, uMouse: [mx, my], uStrength: strength });
    });
  } catch (e) { console.warn('[bento] ripple off', e); }
}
