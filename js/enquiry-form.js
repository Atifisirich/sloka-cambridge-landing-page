/* =====================================================================
   ENQUIRY FORM: isolated component for <section id="enquiry-form">.
   Reads window.SLOKA_ENQUIRY_CONFIG (js/config.js). Independent of the
   rest of the page: if every other script fails, this still validates and
   submits. Swap the CRM by editing config only.

   Emits: document "sloka:enquiry-sent" (detail = payload) on success, and
   calls gtag / fbq "Lead" events if those are installed.
   ===================================================================== */
(() => {
  const section = document.getElementById('enquiry-form');
  if (!section) return;
  const cfg = window.SLOKA_ENQUIRY_CONFIG || {};
  const ticket = section.querySelector('[data-ticket]');
  const form = section.querySelector('form[data-enquiry]');
  const status = form.querySelector('.ticket__status');
  const submitBtn = form.querySelector('[type="submit"]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Vendor embed widget instead of our form ---------- */
  if (cfg.EMBED_HTML) {
    form.innerHTML = cfg.EMBED_HTML;
    // vendor <script> tags inside innerHTML don't run; re-create them
    form.querySelectorAll('script').forEach((old) => {
      const s = document.createElement('script');
      [...old.attributes].forEach((a) => s.setAttribute(a.name, a.value));
      s.text = old.text;
      old.replaceWith(s);
    });
    return;
  }

  /* ---------- Area dropdown from the shared locality list ---------- */
  const areaSelect = form.querySelector('[data-area-select]');
  const areas = (window.SLOKA_SITE?.LOCALITIES || []).map((l) => l.name).sort((a, b) => a.localeCompare(b));
  areaSelect.insertAdjacentHTML('beforeend', [...areas, 'Other'].map((a) => `<option>${a}</option>`).join(''));

  /* ---------- Hidden tracking fields ---------- */
  const params = new URLSearchParams(location.search);
  ['utm_source', 'utm_medium', 'utm_campaign'].forEach((k) => {
    let v = params.get(k);
    try {
      // remember UTMs for the session, so they survive in-page navigation
      if (v) sessionStorage.setItem(k, v); else v = sessionStorage.getItem(k);
    } catch (e) { /* storage blocked */ }
    form.elements[k].value = v || '';
  });
  form.elements.page_url.value = location.href;

  /* ---------- Validation ---------- */
  const PHONE = /^(?:\+?91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}$/;   // Indian mobile
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const rules = {
    parentName: (v) => (v.trim().length >= 2 ? '' : 'Please enter your name.'),
    phone: (v) => (PHONE.test(v.trim()) ? '' : 'Please enter a 10-digit Indian mobile number.'),
    email: (v) => (!v.trim() || EMAIL.test(v.trim()) ? '' : 'That email doesn’t look right.'),
    grade: (v) => (v ? '' : 'Please choose a grade.'),
    area: (v) => (v ? '' : 'Please choose your area.'),
    consent: (_, el) => (el.checked ? '' : 'Please agree so we can contact you.')
  };

  function check(name) {
    const el = form.elements[name];
    const msg = rules[name](el.value, el);
    const field = el.closest('.field');
    field.setAttribute('aria-invalid', msg ? 'true' : 'false');
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    field.querySelector('.field__err').textContent = msg;
    return !msg;
  }
  Object.keys(rules).forEach((name) => {
    const el = form.elements[name];
    el.addEventListener('blur', () => { if (el.value || el.type === 'checkbox') check(name); });
    el.addEventListener('input', () => { if (el.getAttribute('aria-invalid') === 'true') check(name); });
  });

  /* ---------- Payload & sending ---------- */
  function payload() {
    const data = {};
    const map = cfg.FIELD_MAP || {};
    Object.entries(map).forEach(([ours, theirs]) => {
      const el = form.elements[ours];
      if (!el) return;
      let v = el.type === 'checkbox' ? (el.checked ? 'yes' : 'no') : el.value.trim();
      if (ours === 'phone') v = '+91' + v.replace(/\D/g, '').slice(-10);
      data[theirs] = v;
    });
    return { ...data, ...(cfg.EXTRA_FIELDS || {}) };
  }

  async function send(data) {
    if (!cfg.CRM_ENDPOINT) {
      console.info('[enquiry] CRM_ENDPOINT not set; this submission was not sent:', data);
      await new Promise((r) => setTimeout(r, 600));
      return;
    }
    const json = cfg.ENCODING !== 'form';
    const res = await fetch(cfg.CRM_ENDPOINT, {
      method: cfg.METHOD || 'POST',
      headers: { 'Content-Type': json ? 'application/json' : 'application/x-www-form-urlencoded', ...(cfg.HEADERS || {}) },
      body: json ? JSON.stringify(data) : new URLSearchParams(data).toString()
    });
    if (!res.ok) throw new Error(`CRM responded ${res.status}`);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ok = Object.keys(rules).map(check).every(Boolean);
    if (!ok) {
      form.querySelector('[aria-invalid="true"] input, [aria-invalid="true"] select')?.focus();
      status.textContent = 'Please check the highlighted fields.';
      return;
    }
    const data = payload();
    submitBtn.disabled = true;
    status.textContent = 'Sending…';
    try {
      await send(data);
      status.textContent = '';
      celebrate();
      document.dispatchEvent(new CustomEvent('sloka:enquiry-sent', { detail: data }));
      window.gtag?.('event', 'generate_lead', { form: 'admission_ticket' });
      window.fbq?.('track', 'Lead');
    } catch (err) {
      console.error('[enquiry]', err);
      const phone = window.SLOKA_SITE?.PHONE_DISPLAY || '';
      status.textContent = `Sorry, that didn’t go through. Please try again${phone ? ` or call us on ${phone}` : ''}.`;
      submitBtn.disabled = false;
    }
  });

  /* ---------- Ticket tears, stub flies, RECEIVED stamp thumps ---------- */
  function celebrate() {
    const stub = ticket.querySelector('.ticket__stub');
    const perf = ticket.querySelector('.ticket__perf');
    const stamp = ticket.querySelector('.ticket__stamp');
    const thanks = ticket.querySelector('.ticket__thanks');
    const done = () => { ticket.classList.add('is-sent'); thanks.focus(); };
    const g = window.gsap;
    if (!g || reduced) {
      stub.style.visibility = 'hidden';
      perf.style.visibility = 'hidden';
      stamp.style.cssText = 'opacity:.92;transform:rotate(-12deg)';
      done();
      return;
    }
    const vertical = matchMedia('(max-width: 899px)').matches;
    g.timeline()
      // the rip: a few small tugs along the perforation
      .to(stub, { x: vertical ? 0 : 6, y: vertical ? 6 : 0, rotate: vertical ? 1 : 2, duration: 0.08, repeat: 3, yoyo: true, ease: 'power1.inOut', transformOrigin: vertical ? '0% 0%' : '0% 0%' })
      .to(perf, { opacity: 0, duration: 0.2 })
      .to(stub, {
        x: vertical ? 120 : 260, y: vertical ? 420 : 380, rotate: vertical ? 24 : 38, opacity: 0,
        duration: 0.95, ease: 'power2.in', transformOrigin: '0% 0%'
      }, '<')
      .add(done, '-=0.4')
      .fromTo(stamp, { opacity: 0, scale: 2.6, rotate: -30 }, { opacity: 0.92, scale: 1, rotate: -12, duration: 0.32, ease: 'power4.in' }, '-=0.2')
      .to(ticket.querySelector('.ticket__main'), { y: 5, duration: 0.07, yoyo: true, repeat: 1, ease: 'power1.out' })
      .from(thanks.children, { y: 16, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' });
  }
})();
