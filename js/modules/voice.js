/* =====================================================================
   "Every child finds their voice." The headline behaves like an audio
   waveform. With the mic on, letters bounce to the visitor's voice.
   Without it: cursor speed (desktop) or scroll speed (touch) makes ripples.
   ===================================================================== */
import { env, pointer, lerp, visibility } from './env.js';
import { scroll } from './smooth.js';
import { splitChars } from './split.js';

export function initVoice() {
  const section = document.querySelector('.voice');
  const title = section.querySelector('[data-wave]');
  const btn = section.querySelector('[data-mic]');
  const chars = splitChars(title);
  const N = chars.length;

  if (env.reduced) { btn.closest('.voice__mic').hidden = true; return; }

  let visible = false, amp = 0, t = 0;
  let analyser = null, bins = null, stream = null, ctx = null;
  const ys = new Float32Array(N), ss = new Float32Array(N);
  visibility(section, (v) => (visible = v));

  // pointer-speed energy only counts while the cursor is over the section
  let over = false;
  section.addEventListener('pointerenter', () => (over = true));
  section.addEventListener('pointerleave', () => (over = false));

  gsap.ticker.add(() => {
    if (!visible) return;
    t += 0.016;
    if (analyser) {
      analyser.getByteFrequencyData(bins);
      for (let i = 0; i < N; i++) {
        // spread the voice band (roughly 80 Hz to 3 kHz) across the letters, mirrored from the centre
        const k = Math.abs(i - N / 2) / (N / 2);
        const level = bins[Math.floor(2 + k * (bins.length * 0.45))] / 255;
        ys[i] = lerp(ys[i], -level * 46, 0.35);
        ss[i] = lerp(ss[i], 1 + level * 0.45, 0.35);
      }
    } else {
      const energy = env.touch ? Math.abs(scroll.velocity) * 0.9 : over ? pointer.speed * 22 : 0;
      amp = lerp(amp, Math.min(34, Math.max(amp * 0.94, energy)), 0.12);
      for (let i = 0; i < N; i++) {
        const w = Math.sin(t * 7 - i * 0.45) * Math.sin(t * 2.3 + i * 0.13);
        ys[i] = lerp(ys[i], -amp * w, 0.25);
        ss[i] = lerp(ss[i], 1 + Math.abs(w) * amp * 0.012, 0.25);
      }
    }
    for (let i = 0; i < N; i++) chars[i].style.transform = `translateY(${ys[i].toFixed(2)}px) scaleY(${ss[i].toFixed(3)})`;
  });

  // ----- microphone toggle (only with permission, nothing is recorded)
  if (!navigator.mediaDevices?.getUserMedia) { btn.hidden = true; return; }
  btn.setAttribute('aria-pressed', 'false');
  const label = btn.querySelector('span');
  btn.addEventListener('click', async () => {
    if (stream) { stopMic(); return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.6;
      bins = new Uint8Array(analyser.frequencyBinCount);
      ctx.createMediaStreamSource(stream).connect(analyser);
      btn.setAttribute('aria-pressed', 'true');
      label.textContent = 'Listening… tap to stop';
    } catch (e) {
      label.textContent = 'Mic is off. Move your cursor instead';
      stream = null;
    }
  });
  function stopMic() {
    stream.getTracks().forEach((tr) => tr.stop());
    ctx?.close();
    stream = analyser = ctx = null;
    btn.setAttribute('aria-pressed', 'false');
    label.textContent = 'Say hello to Sloka';
  }
  // never leave the mic running off-screen
  visibility(section, (v) => { if (!v && stream) stopMic(); });
}
