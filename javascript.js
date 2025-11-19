// ...existing code...
/*
  Elite Euro — Fancy, professional UI kit (vanilla JS)
  Features implemented:
  - sticky/compact header, active nav highlight, mobile toggle
  - hero carousel with indicators and fade effect
  - accordion & tabs (accessible)
  - modal dialog utility
  - gallery + accessible lightbox with keyboard navigation
  - services grid: dynamic load (optional), filter, search, sort
  - animated reveal-on-scroll + counters
  - interactive map loader (Leaflet) if #map present (loads CDN)
  - AJAX form submit + validation + toast notifications
  - scroll progress + back-to-top + prefers-reduced-motion support
*/
(() => {
  'use strict';
  const $ = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from((ctx || document).querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  console.log('Elite Euro — javascript.js loaded');

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initHeader();
    initHeroCarousel();
    initAccordions();
    initTabs();
    initModals();
    initLightbox();
    initServicesGrid();
    initRevealOnScroll();
    initCounters();
    initForms();
    initScrollProgress();
    initBackToTop();
    initMapIfNeeded();
  }

  /* ---------- Header / Nav ---------- */
  function initHeader() {
    const header = $('header');
    if (!header) return;
    // Active nav link
    const page = location.pathname.split('/').pop() || 'index.html';
    $$('nav a', header).forEach(a => {
      const href = (a.getAttribute('href') || '');
      a.classList.toggle('active', href.includes(page));
    });
    // Mobile toggle
    let toggle = $('.nav-toggle', header);
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.className = 'nav-toggle';
      toggle.setAttribute('aria-label', 'Toggle navigation');
      toggle.innerHTML = '<span class="bar"></span><span class="bar"></span><span class="bar"></span>';
      header.prepend(toggle);
    }
    toggle.addEventListener('click', () => header.classList.toggle('nav-open'));
    // Sticky compact behavior
    let lastY = 0;
    window.addEventListener('scroll', () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      header.classList.toggle('sticky', y > 30);
      header.classList.toggle('compact', y > 160);
      header.classList.toggle('scroll-down', y > lastY && y > 120);
      lastY = y;
    }, { passive: true });
  }

  /* ---------- Hero carousel ---------- */
  function initHeroCarousel() {
    const hero = $('.hero');
    if (!hero) return;
    const slides = $$('.hero-slide', hero);
    if (!slides.length) return;
    let idx = 0;
    const indicators = document.createElement('div');
    indicators.className = 'hero-indicators';
    slides.forEach((_, i) => {
      const btn = document.createElement('button');
      btn.className = 'hero-dot';
      btn.setAttribute('aria-label', `Go to slide ${i + 1}`);
      btn.addEventListener('click', () => show(i));
      indicators.appendChild(btn);
    });
    hero.appendChild(indicators);

    slides.forEach((s, i) => s.classList.toggle('active', i === 0));
    indicators.children[0]?.classList.add('active');

    function show(n) {
      if (n === idx) return;
      slides[idx].classList.remove('active');
      indicators.children[idx]?.classList.remove('active');
      idx = n;
      slides[idx].classList.add('active');
      indicators.children[idx]?.classList.add('active');
    }
    if (!reduceMotion) {
      const interval = Math.max(4000, parseInt(hero.dataset.interval || '6000', 10));
      let timer = setInterval(() => show((idx + 1) % slides.length), interval);
      hero.addEventListener('mouseenter', () => clearInterval(timer));
      hero.addEventListener('mouseleave', () => timer = setInterval(() => show((idx + 1) % slides.length), interval));
    }
  }

  /* ---------- Accordions (accessible) ---------- */
  function initAccordions() {
    $$('.accordion').forEach(acc => {
      const items = $$('.accordion-item', acc);
      items.forEach(item => {
        const btn = $('button', item);
        const panel = $('.accordion-panel', item);
        if (!btn || !panel) return;
        btn.setAttribute('aria-expanded', 'false');
        panel.hidden = true;
        btn.addEventListener('click', () => {
          const open = btn.getAttribute('aria-expanded') === 'true';
          // close siblings if single-open
          if (acc.dataset.single === 'true') {
            items.forEach(it => {
              const b = $('button', it);
              const p = $('.accordion-panel', it);
              if (b && p && b !== btn) { b.setAttribute('aria-expanded', 'false'); p.hidden = true; }
            });
          }
          btn.setAttribute('aria-expanded', String(!open));
          panel.hidden = open;
        });
      });
    });
  }

  /* ---------- Tabs (accessible) ---------- */
  function initTabs() {
    $$('.tabs').forEach(tabs => {
      const tablist = $('.tab-list', tabs);
      if (!tablist) return;
      const buttons = $$('button[role="tab"]', tablist);
      const panels = $$('[role="tabpanel"]', tabs);
      buttons.forEach((btn, i) => {
        btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
        btn.addEventListener('click', () => {
          buttons.forEach(b => b.setAttribute('aria-selected', 'false'));
          panels.forEach(p => p.hidden = true);
          btn.setAttribute('aria-selected', 'true');
          panels[i].hidden = false;
        });
      });
    });
  }

  /* ---------- Modal utility ---------- */
  function initModals() {
    // openers: data-modal="#id"
    $$('[data-modal]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const sel = el.dataset.modal;
        const modal = $(sel);
        if (modal) openModal(modal, el);
      });
    });
    // close buttons inside modal: [data-close]
    $$('[data-close]').forEach(b => b.addEventListener('click', () => {
      const modal = b.closest('.modal');
      if (modal) closeModal(modal);
    }));
  }
  function openModal(modal, opener) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // focus trap minimal: focus first focusable
    const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    (focusable || modal).focus();
    modal.addEventListener('click', backdropClose);
    document.addEventListener('keydown', escClose);
    function backdropClose(e) { if (e.target === modal) closeModal(modal); }
    function escClose(e) { if (e.key === 'Escape') closeModal(modal); }
  }
  function closeModal(modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    modal.removeEventListener('click', null);
    document.removeEventListener('keydown', null);
  }

  /* ---------- Lightbox gallery ---------- */
  function initLightbox() {
    const imgs = $$('img.lightbox, .gallery img, .service-figure img').filter(Boolean);
    if (!imgs.length) return;
    const modal = document.createElement('div');
    modal.className = 'ee-lightbox';
    modal.innerHTML = `
      <div class="ee-backdrop" role="dialog" aria-modal="true" tabindex="-1">
        <button class="ee-close" aria-label="Close">×</button>
        <button class="ee-prev" aria-label="Previous">‹</button>
        <div class="ee-stage"><img alt=""><div class="ee-caption"></div></div>
        <button class="ee-next" aria-label="Next">›</button>
      </div>`;
    document.body.appendChild(modal);
    const stageImg = $('.ee-stage img', modal);
    const caption = $('.ee-caption', modal);
    const closeBtn = $('.ee-close', modal);
    const prevBtn = $('.ee-prev', modal);
    const nextBtn = $('.ee-next', modal);
    const nodes = imgs.slice();
    let current = -1;
    function open(i) {
      if (i < 0 || i >= nodes.length) return;
      current = i;
      const src = nodes[i].dataset.large || nodes[i].src;
      stageImg.src = src;
      stageImg.alt = nodes[i].alt || '';
      caption.textContent = nodes[i].dataset.caption || nodes[i].alt || '';
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }
    function close() { modal.classList.remove('open'); document.body.style.overflow = ''; current = -1; }
    function next() { open((current + 1) % nodes.length); }
    function prev() { open((current - 1 + nodes.length) % nodes.length); }
    nodes.forEach((img, i) => img.addEventListener('click', (e) => { e.preventDefault(); open(i); }));
    closeBtn.addEventListener('click', close);
    nextBtn.addEventListener('click', next);
    prevBtn.addEventListener('click', prev);
    modal.addEventListener('click', (e) => { if (e.target === modal || e.target.classList.contains('ee-backdrop')) close(); });
    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    });
  }

  /* ---------- Services grid: dynamic load, filter, search, sort ---------- */
  function initServicesGrid() {
    const grid = $('.services-grid') || $('.services');
    if (!grid) return;

    // If data-src attribute present, try to fetch JSON (services.json)
    const src = grid.dataset.src;
    if (src) {
      fetch(src).then(r => r.json()).then(renderServices).catch(() => console.warn('Could not load services JSON'));
    }

    // Filters
    const filterButtons = $$('.services-filter button');
    filterButtons.forEach(btn => btn.addEventListener('click', () => applyFilter(btn)));
    // Search
    const searchInput = $('.services-search');
    if (searchInput) searchInput.addEventListener('input', () => applySearch(searchInput.value));
    // Sort
    const sortSelect = $('.services-sort');
    if (sortSelect) sortSelect.addEventListener('change', () => applySort(sortSelect.value));

    function renderServices(items) {
      // items: [{id,title,desc,tags:[...],img,price}]
      grid.innerHTML = items.map(it => serviceCardHtml(it)).join('');
      // re-initialize lightbox & reveal behaviors on new content
      initLightbox();
      initRevealOnScroll();
    }

    function serviceCardHtml(it) {
      const tags = (it.tags || []).map(t => `<span class="tag">${t}</span>`).join('');
      return `
        <article class="service-card" data-tags="${(it.tags||[]).join(',')}">
          <figure class="service-figure"><img class="lightbox" src="${it.img}" alt="${it.title}" data-caption="${it.title}"></figure>
          <div class="service-body">
            <h3>${it.title}</h3>
            <p class="desc">${it.desc}</p>
            <div class="meta">${tags}<span class="price">${it.price ? '&#x20A' + it.price : ''}</span></div>
            <a class="btn" href="booking.html">Book</a>
          </div>
        </article>`;
    }

    function applyFilter(btn) {
      const tag = btn.dataset.filter;
      filterButtons.forEach(b => b.classList.toggle('active', b === btn));
      const items = $$('.service-card', grid);
      items.forEach((it, i) => {
        const tags = (it.dataset.tags || '').split(',').map(x => x.trim()).filter(Boolean);
        const match = !tag || tag === 'all' || tags.includes(tag);
        it.style.opacity = match ? '1' : '0';
        it.style.pointerEvents = match ? '' : 'none';
        if (!reduceMotion) it.style.transitionDelay = `${(i % 6) * 40}ms`;
      });
    }

    function applySearch(q) {
      q = (q || '').toLowerCase().trim();
      const items = $$('.service-card', grid);
      items.forEach(it => {
        const txt = (it.textContent || '').toLowerCase();
        const match = !q || txt.includes(q);
        it.style.opacity = match ? '1' : '0';
        it.style.pointerEvents = match ? '' : 'none';
      });
    }

    function applySort(mode) {
      // simple sort by title or price if data-price present
      const items = $$('.service-card', grid).slice();
      items.sort((a, b) => {
        if (mode === 'title') return a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent);
        if (mode === 'price') return (parseFloat(a.dataset.price || 0) - parseFloat(b.dataset.price || 0));
        return 0;
      });
      items.forEach(it => grid.appendChild(it));
    }
  }

  /* ---------- Reveal on scroll (staggered) ---------- */
  function initRevealOnScroll() {
    const items = $$('.reveal, .card, .service-card, .feature, .testimonial');
    if (!items.length) return;
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.classList.add('visible');
          if (!reduceMotion && el.dataset.staggerChildren === 'true') {
            Array.from(el.children).forEach((c, i) => c.style.transitionDelay = `${i * 70}ms`);
          }
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.15 });
    items.forEach(it => { it.classList.add('reveal'); io.observe(it); });
  }

  /* ---------- Counters ---------- */
  function initCounters() {
    const counters = $$('.counter');
    if (!counters.length || reduceMotion) return;
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const to = parseInt(el.dataset.to || el.textContent || '0', 10);
          animateNumber(el, to, 1200);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => io.observe(c));
  }
  function animateNumber(el, to, duration = 1000) {
    const start = 0;
    const t0 = performance.now();
    function step(now) {
      const p = Math.min(1, (now - t0) / duration);
      el.textContent = Math.floor(start + (to - start) * easeOut(p));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  /* ---------- Forms: validation + optional AJAX ---------- */
  function initForms() {
    $$('form').forEach(form => {
      form.addEventListener('submit', async (e) => {
        if (!validateForm(form)) { e.preventDefault(); return; }
        if (form.classList.contains('ajax')) {
          e.preventDefault();
          const data = new FormData(form);
          try {
            showToast('Sending...', { type: 'info', duration: 1200 });
            const res = await fetch(form.action || '.', { method: form.method || 'POST', body: data });
            if (!res.ok) throw new Error('Network');
            const json = await res.json().catch(() => null);
            showToast(json?.message || 'Submitted', { type: 'success' });
            form.reset();
          } catch {
            showToast('Submit failed — try again later', { type: 'error' });
          }
        }
      });
    });
  }
  function validateForm(form) {
    const required = $$('[required]', form);
    for (const el of required) {
      if (!el.value || !el.value.toString().trim()) { el.focus(); showToast('Please complete required fields', { type: 'error' }); return false; }
      if (el.type === 'email' && !/^\S+@\S+\.\S+$/.test(el.value)) { el.focus(); showToast('Please enter a valid email', { type: 'error' }); return false; }
    }
    return true;
  }

  /* ---------- Toast notifications ---------- */
  function showToast(message, { type = 'info', duration = 3500 } = {}) {
    let wrap = $('#ee-toasts');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'ee-toasts';
      wrap.style.cssText = 'position:fixed;right:20px;bottom:24px;z-index:10000;display:flex;flex-direction:column;gap:8px';
      document.body.appendChild(wrap);
    }
    const t = document.createElement('div');
    t.className = `ee-toast ee-${type}`;
    t.textContent = message;
    t.style.cssText = 'padding:10px 14px;border-radius:8px;color:#fff;font-weight:600;box-shadow:0 8px 24px rgba(3,10,30,0.15);opacity:0;transform:translateY(8px);transition:all .28s';
    if (type === 'error') t.style.background = '#c0392b';
    else if (type === 'success') t.style.background = '#27ae60';
    else t.style.background = '#0b1e39';
    wrap.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateY(0)'; });
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(8px)'; setTimeout(() => t.remove(), 300); }, duration);
  }

  /* ---------- Scroll progress ---------- */
  function initScrollProgress() {
    let bar = $('#ee-scroll-progress');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'ee-scroll-progress';
      bar.style.cssText = 'position:fixed;left:0;top:0;height:4px;background:linear-gradient(90deg,#ffd54f,#ff7043);width:0;z-index:9999;transition:width .12s linear';
      document.body.appendChild(bar);
    }
    window.addEventListener('scroll', () => {
      const doc = document.documentElement;
      const percent = (doc.scrollTop) / (doc.scrollHeight - doc.clientHeight) || 0;
      bar.style.width = `${Math.max(0, Math.min(100, percent * 100))}%`;
    }, { passive: true });
  }

  /* ---------- Back to top ---------- */
  function initBackToTop() {
    let btn = $('.ee-back-to-top');
    if (!btn) {
      btn = document.createElement('button');
      btn.className = 'ee-back-to-top';
      btn.title = 'Back to top';
      btn.innerHTML = '↑';
      btn.style.cssText = 'position:fixed;right:18px;bottom:18px;padding:10px 12px;border-radius:8px;border:none;background:#0b1e39;color:#fff;display:none;z-index:9999;box-shadow:0 6px 18px rgba(8,12,20,.18)';
      document.body.appendChild(btn);
    }
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
    window.addEventListener('scroll', () => btn.style.display = window.scrollY > 420 ? 'block' : 'none', { passive: true });
  }

  /* ---------- Optional: interactive map loader (Leaflet) ---------- */
  function initMapIfNeeded() {
    const mapEl = $('#map');
    if (!mapEl) return;
    // load Leaflet CSS + JS dynamically, then init map
    if (!window.L) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(css);
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      s.onload = () => createMap(mapEl);
      document.body.appendChild(s);
    } else {
      createMap(mapEl);
    }
  }
  function createMap(el) {
    try {
      const L = window.L;
      const lat = parseFloat(el.dataset.lat || '-26.2') || -26.2;
      const lng = parseFloat(el.dataset.lng || '28.0') || 28.0;
      const zoom = parseInt(el.dataset.zoom || '12', 10);
      const map = L.map(el).setView([lat, lng], zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(map);
      L.marker([lat, lng]).addTo(map).bindPopup('Elite Euro Auto Services').openPopup();
    } catch (e) {
      console.warn('Map init failed', e);
    }
  }

  /* ---------- Utility: small debounce ---------- */
  function debounce(fn, wait = 120) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
  }

})();