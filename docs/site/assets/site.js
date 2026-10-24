// Trusted Mobile Care — site behaviour (preview build by MT Tec)
(function () {
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} },
  };

  /* ---------- Theme: system → light → dark ---------- */
  const root = document.documentElement;
  const themeBtn = document.querySelector('[data-theme-btn]');
  const ICONS = { system: '◐', light: '☀', dark: '☾' };
  function applyTheme(t) {
    if (t === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', t);
    store.set('tmc-theme', t === 'system' ? null : t);
    if (themeBtn) { themeBtn.textContent = ICONS[t]; themeBtn.setAttribute('aria-label', 'Colour theme: ' + t); themeBtn.dataset.t = t; }
  }
  applyTheme(store.get('tmc-theme') || 'system');
  themeBtn?.addEventListener('click', () => {
    const order = ['system', 'light', 'dark'];
    applyTheme(order[(order.indexOf(themeBtn.dataset.t) + 1) % 3]);
  });

  /* ---------- Logos (watermarked previews, switchable) ---------- */
  const LOGOS = window.TMC_LOGOS || [];
  let uid = 0;
  // Unique ids per copy so gradients/patterns never clash when one logo appears several times.
  function logoEl(svg, icon) {
    const u = 'k' + (++uid);
    const s = svg.replace(/id="([^"]+)"/g, (m, id) => `id="${id}-${u}"`).replace(/url\(#([^)]+)\)/g, (m, id) => `url(#${id}-${u})`);
    const t = document.createElement('template'); t.innerHTML = s.trim();
    const el = t.content.firstElementChild;
    el.removeAttribute('width'); el.removeAttribute('height');
    if (icon) {
      el.setAttribute('viewBox', '8 4 228 228');
      el.querySelectorAll('text').forEach(n => { if (!n.closest('pattern') && !n.closest('.shield')) n.remove(); });
    }
    return el;
  }
  function renderLogos(i) {
    const L = LOGOS[i]; if (!L) return;
    document.querySelectorAll('[data-logo]').forEach(slot => {
      slot.replaceChildren(logoEl(L.svg, slot.dataset.logo === 'icon'));
      if (slot.dataset.logo === 'icon') slot.firstChild.classList.add('play-hover');
    });
    document.querySelectorAll('.logo-pick button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.i === i)));
  }
  const pick = document.querySelector('.logo-pick');
  if (pick && LOGOS.length) {
    LOGOS.forEach((L, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.dataset.i = i; b.textContent = L.n; b.title = L.name; b.setAttribute('aria-label', 'Show logo concept ' + L.n + ': ' + L.name);
      b.addEventListener('click', () => { store.set('tmc-logo', String(i)); renderLogos(i); });
      pick.appendChild(b);
    });
  }
  const saved = parseInt(store.get('tmc-logo'), 10);
  renderLogos(Number.isInteger(saved) && LOGOS[saved] ? saved : 1);

  /* ---------- Mobile menu ---------- */
  const menuBtn = document.querySelector('.menu-btn');
  const mnav = document.getElementById('mobile-nav');
  menuBtn?.addEventListener('click', () => {
    const open = menuBtn.getAttribute('aria-expanded') === 'true';
    menuBtn.setAttribute('aria-expanded', String(!open));
    mnav.hidden = open;
    menuBtn.textContent = open ? 'Menu' : 'Close';
  });

  /* ---------- Toast ---------- */
  const toastEl = document.createElement('div');
  toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite');
  document.body.appendChild(toastEl);
  function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => toastEl.classList.remove('show'), 2400); }
  document.querySelectorAll('[data-placeholder-link]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); toast('Placeholder: the real phone/email goes here'); }));

  /* ---------- Pre-select a service from ?service= ---------- */
  const want = new URLSearchParams(location.search).get('service');
  if (want) document.querySelectorAll('select[name="service"]').forEach(s => {
    const opt = [...s.options].find(o => o.value === want); if (opt) s.value = want;
  });

  /* ---------- Demo forms: validate, then show a preview-only result ---------- */
  document.querySelectorAll('form[data-demo]').forEach(form => {
    form.setAttribute('novalidate', '');
    form.addEventListener('submit', e => {
      e.preventDefault();
      let first = null;
      form.querySelectorAll('[required]').forEach(f => {
        const ok = f.type === 'checkbox' ? f.checked : f.value.trim() !== '' && f.checkValidity();
        f.setAttribute('aria-invalid', String(!ok));
        const msg = form.querySelector(`[data-err-for="${f.id}"]`);
        if (msg) msg.textContent = ok ? '' : (f.dataset.msg || 'Please fill this in.');
        if (!ok && !first) first = f;
      });
      const out = form.querySelector('.result');
      if (first) { first.focus(); out?.classList.remove('show'); return; }
      out.textContent = form.dataset.demo;
      out.classList.add('show');
      out.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    form.addEventListener('input', e => {
      if (e.target.getAttribute('aria-invalid') === 'true') {
        e.target.setAttribute('aria-invalid', 'false');
        const msg = form.querySelector(`[data-err-for="${e.target.id}"]`); if (msg) msg.textContent = '';
      }
    });
  });

  /* ---------- Service-area check (example ZIP list until the real area is known) ---------- */
  document.querySelectorAll('[data-zip]').forEach(box => {
    const input = box.querySelector('input'), out = box.querySelector('.zip-out');
    box.querySelector('button').addEventListener('click', () => {
      const z = input.value.trim();
      if (!/^\d{5}$/.test(z)) { out.textContent = 'Please enter a 5-digit ZIP code.'; return; }
      out.textContent = `Preview: ZIP ${z} would be checked against the real service area here. Call us to confirm in the meantime.`;
    });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); box.querySelector('button').click(); } });
  });

  /* Year in footer */
  document.querySelectorAll('[data-year]').forEach(n => { n.textContent = new Date().getFullYear(); });
})();
