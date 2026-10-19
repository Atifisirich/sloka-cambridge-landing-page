/* =====================================================================
   "Every child finds their voice." The headline behaves like an audio
   waveform: cursor speed (desktop) or scroll speed (phones) makes it ripple,
   and a tap on the headline sends a big wave through the letters.
   ===================================================================== */
import { env, pointer, lerp, visibility } from './env.js';
import { scroll } from './smooth.js';
import { splitChars } from './split.js';

export function initVoice() {
  const section = document.querySelector('.voice');
  const title = section.querySelector('[data-wave]');
  const chars = splitChars(title);
  const N = chars.length;

  if (env.reduced) return;

  let visible = false, amp = 0, t = 0, kick = 0;
  const ys = new Float32Array(N), ss = new Float32Array(N);
  visibility(section, (v) => (visible = v));

  // pointer-speed energy only counts while the cursor is over the section
  let over = false;
  section.addEventListener('pointerenter', () => (over = true));
  section.addEventListener('pointerleave', () => (over = false));

  gsap.ticker.add(() => {
    if (!visible) return;
    t += 0.016;
    kick *= 0.95; // a tap on the headline sends a big wave that fades out
    const energy = Math.max(kick, env.touch ? Math.abs(scroll.velocity) * 0.9 : over ? pointer.speed * 22 : 0);
    amp = lerp(amp, Math.min(34, Math.max(amp * 0.94, energy)), 0.12);
    for (let i = 0; i < N; i++) {
      const w = Math.sin(t * 7 - i * 0.45) * Math.sin(t * 2.3 + i * 0.13);
      ys[i] = lerp(ys[i], -amp * w, 0.25);
      ss[i] = lerp(ss[i], 1 + Math.abs(w) * amp * 0.012, 0.25);
    }
    for (let i = 0; i < N; i++) chars[i].style.transform = `translateY(${ys[i].toFixed(2)}px) scaleY(${ss[i].toFixed(3)})`;
  });

  title.addEventListener('pointerdown', () => { kick = 40; });
}
