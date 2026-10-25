/* =====================================================================
   ExtraaEdge enquiry widget: glue for <div id="ee-form-8">.
   The widget itself (fields, validation, submission) belongs to the CRM
   vendor and is never modified here. This file only:
   1. Starts the widget manually if their loader didn't (safety net, once).
   2. Keeps smooth scrolling off the widget's own pop-ups and option lists.
   3. Detects a REAL successful submission (the widget's success pop-up,
      ".ee-form-widget-feedback.success"; errors use ".failure") and then
      plays the ticket's RECEIVED stamp and pushes conversion events.
   ===================================================================== */
(() => {
  const SITE = 'sloka', FORM = 'form-8', CONTAINER = 'ee-form-8';
  const box = document.getElementById(CONTAINER);
  if (!box) return;
  const ticket = box.closest('[data-ticket]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Init safety net ----------
     Their widget.js waits for DOMContentLoaded, loads its library, then calls
     _eeFormWidget.init(). It is loaded with "defer", so that normally just works.
     If the form still hasn't appeared well after page load, start it ourselves,
     exactly once, and only if it hasn't started already. */
  let manualInit = false;
  function ensureRendered() {
    if (box.childElementCount || manualInit) return;
    try {
      if (window._eeFormWidget && typeof window._eeFormWidget.init === 'function') {
        manualInit = true;
        window._eeFormWidget.init(SITE, FORM, CONTAINER);
      } else if (typeof eeFormWidget === 'function') { // their library class (global)
        manualInit = true;
        window._eeFormWidget = new eeFormWidget(); // eslint-disable-line no-undef
        window._eeFormWidget.init(SITE, FORM, CONTAINER);
      }
    } catch (e) { console.warn('[enquiry] widget init fallback failed', e); }
  }
  if (document.readyState === 'complete') setTimeout(ensureRendered, 4000);
  else addEventListener('load', () => setTimeout(ensureRendered, 4000), { once: true });

  /* ---------- 2 + 3. Watch the widget's pop-ups ---------- */
  const handled = new WeakSet();
  function check(node) {
    if (node.nodeType !== 1) return;
    const sel = '.ee-form-widget, .select2-container, .select2-results__options, .iti__country-list';
    const found = node.matches(sel) ? [node] : [];
    node.querySelectorAll && found.push(...node.querySelectorAll(sel));
    found.forEach((el) => {
      // Lenis stays off only what really scrolls on its own: the pop-ups the widget
      // opens outside our container, and its option lists (country codes, dropdowns).
      // The form itself scrolls with the page, so the glide never breaks at its edge.
      if (!box.contains(el) || el.matches('.select2-results__options, .iti__country-list')) el.setAttribute('data-lenis-prevent', '');
      if (el.matches('.ee-form-widget-feedback.success') && !handled.has(el)) {
        handled.add(el);
        onSuccess();
      }
    });
  }
  new MutationObserver((muts) => muts.forEach((m) => m.addedNodes.forEach(check)))
    .observe(document.body, { childList: true, subtree: true });
  check(box); // in case the widget rendered before this script ran

  function onSuccess() {
    // conversion events: real success only
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'enquiry_submitted' });
    if (typeof window.fbq === 'function') window.fbq('track', 'Lead');
    document.dispatchEvent(new CustomEvent('sloka:enquiry-sent')); // the page's spark blooms
    celebrate();
  }

  /* ---------- the ticket: stub tears off, RECEIVED stamp thumps down ---------- */
  function celebrate() {
    if (!ticket) return;
    const stub = ticket.querySelector('.ticket__stub');
    const perf = ticket.querySelector('.ticket__perf');
    const stamp = ticket.querySelector('.ticket__stamp');
    const torn = ticket.classList.contains('is-sent');
    ticket.classList.add('is-sent');
    const g = window.gsap;
    if (!g || reduced) {
      stub.style.visibility = 'hidden';
      perf.style.visibility = 'hidden';
      stamp.style.cssText = 'opacity:.92;transform:rotate(-12deg)';
      return;
    }
    const vertical = matchMedia('(max-width: 899px)').matches;
    const tl = g.timeline();
    if (!torn) {
      tl.to(stub, { x: vertical ? 0 : 6, y: vertical ? 6 : 0, rotate: vertical ? 1 : 2, duration: 0.08, repeat: 3, yoyo: true, ease: 'power1.inOut', transformOrigin: '0% 0%' })
        .to(perf, { opacity: 0, duration: 0.2 })
        .to(stub, { x: vertical ? 120 : 260, y: vertical ? 420 : 380, rotate: vertical ? 24 : 38, opacity: 0, duration: 0.95, ease: 'power2.in', transformOrigin: '0% 0%' }, '<');
    }
    tl.fromTo(stamp, { opacity: 0, scale: 2.6, rotate: -30 }, { opacity: 0.92, scale: 1, rotate: -12, duration: 0.32, ease: 'power4.in' }, torn ? 0 : '-=0.5')
      .to(ticket.querySelector('.ticket__main'), { y: 5, duration: 0.07, yoyo: true, repeat: 1, ease: 'power1.out' });
  }
})();
