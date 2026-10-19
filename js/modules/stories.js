/* =====================================================================
   Parent stories as letters on a desk. Drag them around; click / Enter
   lifts one toward you and opens it in full. Key phrases get a marker
   highlight as they come into view.
   ===================================================================== */
import { env } from './env.js';

export function initStories() {
  const desk = document.querySelector('[data-desk]');
  const dialog = document.getElementById('noteDialog');
  if (!desk || !dialog) return;
  const body = dialog.querySelector('.note-dialog__body');
  const paper = dialog.querySelector('.note-dialog__paper');
  const notes = [...desk.querySelectorAll('.note')];
  let z = 5;

  notes.forEach((note) => {
    const pos = { x: 0, y: 0 };
    let start = null, moved = false;

    note.addEventListener('pointerdown', (e) => {
      if (env.mobile) return;
      start = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y };
      moved = false;
      note.setPointerCapture(e.pointerId);
      note.style.zIndex = ++z;
    });
    note.addEventListener('pointermove', (e) => {
      if (!start) return;
      const dx = e.clientX - start.px, dy = e.clientY - start.py;
      if (!moved && Math.hypot(dx, dy) < 5) return;
      moved = true;
      note.classList.add('is-dragging');
      // keep the note on the desk
      const d = desk.getBoundingClientRect(), n = note.getBoundingClientRect();
      const nx = start.x + dx, ny = start.y + dy;
      const minX = pos.x - (n.left - d.left) - n.width * 0.4, maxX = pos.x + (d.right - n.right) + n.width * 0.4;
      const minY = pos.y - (n.top - d.top), maxY = pos.y + (d.bottom - n.bottom) + n.height * 0.3;
      pos.x = Math.min(maxX, Math.max(minX, nx));
      pos.y = Math.min(maxY, Math.max(minY, ny));
      note.style.translate = `${pos.x}px ${pos.y}px`;
    });
    const up = () => {
      if (!start) return;
      start = null;
      note.classList.remove('is-dragging');
      if (!moved) open(note);
    };
    note.addEventListener('pointerup', up);
    note.addEventListener('pointercancel', () => { start = null; note.classList.remove('is-dragging'); });
    note.addEventListener('click', () => { if (env.mobile) open(note); });
    note.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(note); }
    });
  });

  function open(note) {
    body.innerHTML = '';
    body.appendChild(note.querySelector('template').content.cloneNode(true));
    dialog.showModal();
    if (!env.reduced && window.gsap) {
      // lift: the letter rises from where it lay on the desk
      const n = note.getBoundingClientRect(), p = paper.getBoundingClientRect();
      gsap.from(paper, {
        x: n.left + n.width / 2 - (p.left + p.width / 2),
        y: n.top + n.height / 2 - (p.top + p.height / 2),
        scale: n.width / p.width, rotate: parseFloat(getComputedStyle(note).getPropertyValue('--r')) || 0,
        duration: 0.7, ease: 'expo.out'
      });
    }
    setTimeout(() => body.querySelectorAll('mark').forEach((m, i) => setTimeout(() => m.classList.add('is-marked'), i * 450)), env.reduced ? 0 : 500);
  }
  dialog.querySelector('.note-dialog__close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

  // marker highlights on the desk
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-marked'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -25% 0px' });
  desk.querySelectorAll(':scope > .note mark').forEach((m) => io.observe(m));

  if (!env.reduced && window.gsap) {
    gsap.from(notes, {
      y: 80, opacity: 0, rotate: (i) => (i % 2 ? 14 : -12), duration: 1, ease: 'power3.out', stagger: 0.15,
      scrollTrigger: { trigger: desk, start: 'top 75%', once: true }
    });
  }
}
