/* Fadi Awwad — Portfolio interactions */
(() => {
  const doc = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- Fit big type to its container width ---------- */
  function fit() {
    $$('[data-fit]').forEach(el => {
      const box = el.parentElement;
      const target = box.clientWidth * parseFloat(el.dataset.fit || 1);
      el.style.fontSize = '100px';
      const w = el.scrollWidth || 1, h = el.offsetHeight || 1;
      let size = 100 * target / w;
      if (el.dataset.fitH && innerWidth > 900) size = Math.min(size, 100 * (innerHeight * parseFloat(el.dataset.fitH)) / h);
      el.style.fontSize = size + 'px';
    });
  }

  /* ---------- Intro ---------- */
  const count = $('.intro__count');
  let n = 0;
  const finish = () => { doc.classList.add('is-loaded'); setTimeout(() => $('.intro')?.remove(), 1400); };
  if (reduce || !count) { finish(); }
  else {
    const t0 = performance.now();
    const tick = now => {
      n = Math.min(100, Math.round(((now - t0) / 1100) * 100));
      count.textContent = String(n).padStart(3, '0');
      if (n < 100) requestAnimationFrame(tick); else setTimeout(finish, 150);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Smooth scroll (Lenis if available) ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    try {
      lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    } catch (e) { lenis = null; }
  }

  /* ---------- Always open a page at the top (unless a #hash is given) ---------- */
  if (!location.hash) {
    try { history.scrollRestoration = 'manual'; } catch (e) {}
    const toTop = () => {
      window.scrollTo(0, 0);
      if (lenis) lenis.scrollTo(0, { immediate: true });
      try { document.body.scrollIntoView({ block: 'start' }); } catch (e) {} // also resets an embedding frame
    };
    toTop();
    window.addEventListener('load', toTop, { once: true });
  }
  const scrollToEl = (el, offset = 0) => {
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset });
    else window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + offset, behavior: reduce ? 'auto' : 'smooth' });
  };

  /* ---------- Menu ---------- */
  const menuBtn = $('.menu-btn');
  const setMenu = open => {
    doc.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    $('.menu-btn__text').textContent = open ? 'Close' : 'Menu';
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  menuBtn.addEventListener('click', () => setMenu(!doc.classList.contains('menu-open')));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { setMenu(false); closeLightbox(); } });

  /* ---------- In-page links ---------- */
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const el = $(id);
    if (!el) return;
    e.preventDefault();
    setMenu(false);
    setTimeout(() => scrollToEl(el, 0), doc.classList.contains('menu-open') ? 450 : 0);
  }));

  /* ---------- Hero card stack ---------- */
  const cards = $$('.stack__card');
  const stack = $('.stack');
  const hero = $('.hero');
  const front = Math.min(1, cards.length - 1); // Oreo on top of the closed pile
  let spread = 0;
  const mix = (a, b, t) => a + (b - a) * t;
  const layout = () => {
    if (!stack) return;
    const w = stack.offsetWidth, n = cards.length;
    const e = 1 - Math.pow(1 - spread, 3); // ease-out
    cards.forEach((c, i) => {
      const k = (i - front + n) % n; // 0 = front of the pile
      // closed pile
      const rot = [0, -7, 6, -12, 10, -4][k] || 0;
      const x = [0, -18, 20, -30, 28, -8][k] || 0;
      const y = [0, 10, -8, 16, -14, 6][k] || 0;
      const sc = 1 - k * 0.035;
      // open fan: each card gets a fixed slot left → right
      const slot = i - (n - 1) / 2;                 // -2.5 … 2.5
      const fx = slot * w * 0.62;
      const fy = Math.abs(slot) * Math.abs(slot) * w * 0.035 - w * 0.04;
      const fr = slot * 5.5;
      const fs = 0.86;
      c.style.zIndex = spread > 0.5 ? String(n - Math.round(Math.abs(slot) * 2)) : String(n - k);
      c.style.transform = `translate(${mix(x, fx, e)}px, ${mix(y, fy, e)}px) rotate(${mix(rot, fr, e)}deg) scale(${mix(sc, fs, e)})`;
      c.style.opacity = k > 4 && spread < 0.05 ? 0 : 1;
    });
  };
  stack?.addEventListener('click', () => scrollToEl($('#work')));
  if (cards.length) {
    layout();
    if (!reduce && hero) {
      let ticking = false;
      const onHeroScroll = () => {
        if (ticking) return; ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
          const p = Math.min(1, Math.max(0, scrollY / (hero.offsetHeight * 0.6)));
          if (Math.abs(p - spread) < 0.002) return;
          spread = p;
          stack.classList.toggle('is-spreading', p > 0);
          layout();
        });
      };
      window.addEventListener('scroll', onHeroScroll, { passive: true });
      window.addEventListener('resize', onHeroScroll);
      onHeroScroll();
    }
  }

  /* ---------- Cursor ---------- */
  const cursor = $('.cursor');
  const label = $('.cursor__label');
  const icons = {
    view: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',
    zoom: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  };
  let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
  if (finePointer && cursor && !reduce) {
    doc.classList.add('has-cursor');
    let shown = false, last = performance.now();
    addEventListener('pointermove', e => {
      mx = e.clientX; my = e.clientY;
      if (!shown) { cx = mx; cy = my; shown = true; }
      if (!cursor.classList.contains('is-big')) {           // small dot: stick to the pointer, no lag
        cx = mx; cy = my;
        cursor.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      }
    }, { passive: true });
    document.addEventListener('mouseleave', () => cursor.classList.add('is-hidden'));
    document.addEventListener('mouseenter', () => cursor.classList.remove('is-hidden'));
    const loop = now => {
      const dt = Math.min(64, now - last); last = now;
      if (cursor.classList.contains('is-big')) {           // big circle: gentle, frame-rate independent easing
        const k = 1 - Math.pow(1 - 0.35, dt / 16.67);
        cx = lerp(cx, mx, k); cy = lerp(cy, my, k);
        cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    document.addEventListener('mouseover', e => {
      const t = e.target.closest('[data-cursor], a, button');
      cursor.classList.remove('is-big', 'is-link');
      const dark = e.target.closest('[data-dark]');
      cursor.classList.toggle('on-dark', !!dark);
      if (!t) return;
      const mode = t.dataset.cursor;
      if (mode) {
        let m = mode;
        if (m === 'play' && t.querySelector('video') && !t.querySelector('video').paused) m = 'pause';
        const text = t.dataset.cursorText || '';
        label.innerHTML = (icons[m] || '') + (text ? `<span>${text}</span>` : '');
        cursor.classList.add('is-big');
      } else {
        cursor.classList.add('is-link');
      }
    });
  } else if (cursor) { cursor.remove(); }

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -10% 0px' });
  $$('.reveal, .fade').forEach(el => io.observe(el));

  /* ---------- Statement word highlight ---------- */
  const stmt = $('.statement__text');
  if (stmt) {
    const words = stmt.textContent.trim().split(/\s+/);
    const acc = (stmt.dataset.accent || '').toLowerCase().split(/\s+/).filter(Boolean);
    stmt.innerHTML = words.map(w => `<span class="w${acc.includes(w.toLowerCase().replace(/[^\p{L}]/gu, '')) ? ' acc' : ''}">${w}</span>`).join(' ');
  }
  const stmtWords = stmt ? $$('.w', stmt) : [];

  /* ---------- Videos: autoplay when visible ---------- */
  const vio = new IntersectionObserver(entries => {
    entries.forEach(en => {
      const v = en.target;
      if (en.isIntersecting) { if (v.dataset.src && !v.src) { v.src = v.dataset.src; } if (!v.dataset.paused) v.play().catch(() => {}); }
      else v.pause();
    });
  }, { threshold: 0.25 });
  $$('video[data-auto]').forEach(v => vio.observe(v));
  $$('[data-cursor="play"]').forEach(box => box.addEventListener('click', () => {
    const v = box.querySelector('video'); if (!v) return;
    if (v.paused) { delete v.dataset.paused; v.play(); } else { v.dataset.paused = 1; v.pause(); }
    label.innerHTML = icons[v.paused ? 'play' : 'pause'];
  }));

  /* ---------- Big words (sticky image mask) ---------- */
  const wordBlocks = [];
  /* ---------- Big words: auto carousel ---------- */
  $$('.wcar').forEach(car => {
    const slides = $$('.word', car), dots = $$('.wcar__dot', car);
    const bar = $('.wcar__bar i', car), counter = $('.wcar__counter b', car);
    const SLIDE = 6400; let cur = 0, t0 = performance.now(), paused = false, inView = false;
    const go = i => {
      cur = (i + slides.length) % slides.length; t0 = performance.now();
      slides.forEach((s, k) => s.classList.toggle('is-on', k === cur));
      dots.forEach((d, k) => d.classList.toggle('is-on', k === cur));
      if (counter) counter.textContent = String(cur + 1).padStart(2, '0');
    };
    dots.forEach(d => d.addEventListener('click', () => go(+d.dataset.go)));
    let sx = null;
    car.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    car.addEventListener('touchend', e => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 45) go(cur + (dx < 0 ? 1 : -1)); sx = null; });
    new IntersectionObserver(([en]) => { inView = en.isIntersecting; if (inView) t0 = performance.now(); }, { threshold: 0.25 }).observe(car);
    document.addEventListener('visibilitychange', () => { paused = document.hidden; t0 = performance.now(); });
    const tick = now => {
      if (inView && !paused) {
        const p = Math.min(1, (now - t0) / SLIDE);
        const layers = $$('.word__layer', slides[cur]);
        const li = Math.min(layers.length - 1, Math.floor(p * layers.length));
        layers.forEach((l, k) => {
          l.classList.toggle('is-on', k === li);
          if (!reduce) l.style.backgroundPosition = `50% ${20 + p * 60}%`;
        });
        if (bar) bar.style.transform = `scaleX(${p})`;
        if (p >= 1) go(cur + 1);
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });


  /* ---------- Cursor-driven work wall ---------- */
  const wall = $('.wall');
  if (wall) {
    const track = $('.wall__track', wall);
    const cols = $$('.wall__col', wall);
    let inView = false, wx = 0, wy = 0, tx = 0, ty = 0, lastX = 0, skew = 0;
    new IntersectionObserver(([en]) => { inView = en.isIntersecting; }, { threshold: 0 }).observe(wall);
    if (finePointer && !reduce) {
      let last = performance.now();
      const step = now => {
        const dt = Math.min(64, now - last); last = now;
        if (inView) {
          const vw = innerWidth, vh = wall.offsetHeight;
          const maxX = Math.max(0, track.scrollWidth - vw);
          const maxY = Math.max(0, track.offsetHeight - vh);
          const nx = clamp(mx / vw, 0, 1), ny = clamp(my / innerHeight, 0, 1);
          tx = -nx * maxX; ty = (0.5 - ny) * maxY;
          const k = 1 - Math.pow(1 - 0.075, dt / 16.67);
          wx = lerp(wx, tx, k); wy = lerp(wy, ty, k);
          const v = wx - lastX; lastX = wx;
          skew = lerp(skew, clamp(v * 0.06, -4, 4), 0.12);
          track.style.transform = `translate3d(${wx}px, ${wy}px, 0) skewX(${skew}deg)`;
          cols.forEach(c => {
            const d = parseFloat(c.dataset.depth) - 1;
            c.style.transform = `translate3d(${(nx - 0.5) * d * -140}px, ${(ny - 0.5) * d * -90}px, 0)`;
          });
        }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }

  /* ---------- Outline type over cut-out ---------- */
  const ol = $('.ol');
  function olLayout() {
    if (!ol) return;
    const sticky = $('.ol__sticky', ol), solid = $('.ol__solid .ol__word', ol), stroke = $('.ol__stroke .ol__word', ol);
    const box = $('.ol__solid', ol);
    solid.style.fontSize = '100px';
    const size = 100 * box.clientWidth / (solid.scrollWidth || 1);
    solid.style.fontSize = stroke.style.fontSize = size + 'px';
    const img = $('.ol__subject', ol), mask = $('.ol__mask', ol), inner = $('.ol__inner', ol);
    const sr = sticky.getBoundingClientRect(), ir = img.getBoundingClientRect();
    const L = ir.left - sr.left, T = ir.top - sr.top;
    Object.assign(mask.style, { left: L + 'px', top: T + 'px', width: ir.width + 'px', height: ir.height + 'px' });
    Object.assign(inner.style, { left: -L + 'px', top: -T + 'px', width: sr.width + 'px', height: sr.height + 'px' });
    olScroll();

  }
  function olScroll() {
    if (!ol) return;
    const r = ol.getBoundingClientRect(), vh = innerHeight;
    const p = clamp(-r.top / (r.height - vh), 0, 1);
    const y = reduce ? vh * 0.3 : lerp(vh * 0.4, vh * 0.04, p);
    $$('.ol__text', ol).forEach(t => { t.style.transform = `translate3d(0, ${y}px, 0)`; });
  }
  if (ol) { const im = $('.ol__subject', ol); if (im.complete) olLayout(); else im.addEventListener('load', olLayout); }

  /* ---------- Parallax + scroll-driven bits ---------- */
  const para = $$('[data-speed]');
  const pimgs = $$('.parallax > img, .parallax > video');
  const reel = $('.reel__frame');
  function onScroll() {
    const vh = innerHeight;
    olScroll();
    // What I do: pinned list, statements fade per item
    $$('.caps2').forEach(c => {
      const r = c.getBoundingClientRect(); const total = r.height - vh;
      if (total <= 0) return;
      const p = clamp(-r.top / total, 0, 0.9999);
      const items = $$('.caps2__item', c), panels = $$('.caps2__panel', c);
      const i = Math.floor(p * panels.length);
      items.forEach((b, k) => b.classList.toggle('is-on', k === i));
      panels.forEach((b, k) => b.classList.toggle('is-on', k === i));
      const bar = $('.caps2__progress i', c); if (bar) bar.style.transform = `scaleX(${p})`;
    });
    // Nivea film: rows slide opposite ways, frame grows a touch
    $$('.film').forEach(f => {
      const r = f.getBoundingClientRect(); const p = clamp(-r.top / (r.height - vh), 0, 1);
      const a = $('.film__row--a', f), b = $('.film__row--b', f), fr = $('.film__frame', f);
      if (!reduce) {
        a.style.transform = `translate3d(${-p * 45}%, 0, 0)`;
        b.style.transform = `translate3d(${-45 + p * 45}%, 0, 0)`;
        fr.style.transform = `scale(${0.86 + p * 0.3})`;
      }
    });
    // Brands: title dims, logos rise
    $$('.brands').forEach(br => {
      const r = br.getBoundingClientRect(); const p = clamp(-r.top / Math.max(1, r.height - vh), 0, 1);
      br.classList.toggle('is-dim', p > 0.22 || innerWidth <= 900);
      const t = $('.brands__title', br);
      if (!reduce && innerWidth > 900) t.style.transform = `scale(${1 + p * 0.12})`;
      $$('.logo-cell', br).forEach((c, i) => { c.style.transitionDelay = br.classList.contains('is-dim') ? (i * 0.04) + 's' : '0s'; });
    });
    // Expanding images: grow from a small frame on the left to full-bleed
    $$('.expand').forEach(ex => {
      if (innerWidth <= 900) { $('.expand__img', ex).style.clipPath = ''; $('.expand__img img', ex).style.transform = ''; ex.classList.add('is-full'); return; }
      const r = ex.getBoundingClientRect(); const p = clamp(-r.top / (r.height - vh), 0, 1);
      const q = reduce ? 1 : clamp(p / 0.7, 0, 1);
      const ease = 1 - Math.pow(1 - q, 3);
      const pad = parseFloat(getComputedStyle(doc).getPropertyValue('--pad')) || 24;
      const vw = innerWidth;
      const mobile = vw <= 900;
      const t = (1 - ease) * vh * (mobile ? 0.32 : 0.3), bt = t;
      const l = (1 - ease) * pad, rr = (1 - ease) * vw * (mobile ? 0.3 : 0.62);
      $('.expand__img', ex).style.clipPath = `inset(${t}px ${rr}px ${bt}px ${l}px)`;
      $('.expand__img img', ex).style.transform = `scale(${1.25 - ease * 0.25})`;
      ex.classList.toggle('is-full', ease > 0.96);
    });
    if (!reduce) {
      para.forEach(el => {
        const r = el.getBoundingClientRect();
        const c = r.top + r.height / 2 - vh / 2;
        el.style.transform = `translate3d(0, ${c * parseFloat(el.dataset.speed)}px, 0)`;
      });
      pimgs.forEach(img => {
        const r = img.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const p = (r.top + r.height / 2 - vh / 2) / (vh + r.height);
        img.style.transform = `translate3d(0, ${p * -14}%, 0) scale(1.15)`;
      });
      if (reel) {
        const r = reel.getBoundingClientRect();
        const p = clamp(1 - (r.top / vh), 0, 1);
        reel.style.transform = `scale(${0.82 + p * 0.18})`;
        reel.style.borderRadius = `${(1 - p) * 24}px`;
      }
    }
    if (stmtWords.length) {
      const r = stmt.getBoundingClientRect();
      const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0, 1);
      const on = Math.round(p * stmtWords.length);
      stmtWords.forEach((w, i) => w.classList.toggle('on', i < on));
    }
    wordBlocks.forEach(b => {
      const r = b.el.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) return;
      const p = clamp((vh - r.top) / (r.height + vh), 0, 1);
      const i = Math.min(b.layers.length - 1, Math.floor(p * b.layers.length));
      if (i !== b.idx) {
        b.layers.forEach((l, k) => l.classList.toggle('is-on', k === i));
        if (b.counter) b.counter.textContent = String(i + 1).padStart(2, '0');
        b.idx = i;
      }
      if (b.bar) b.bar.style.transform = `scaleX(${p})`;
      if (!reduce) b.layers.forEach(l => { l.style.backgroundPosition = `50% ${15 + p * 70}%`; });
    });
  }
  /* ---------- Cycling covers ---------- */
  $$('[data-cycle]').forEach(c => {
    const imgs = $$('img', c); if (imgs.length < 2 || reduce) return;
    let i = 0, vis = false;
    new IntersectionObserver(([en]) => { vis = en.isIntersecting; }).observe(c);
    setInterval(() => { if (!vis || document.hidden) return; imgs[i].classList.remove('is-on'); i = (i + 1) % imgs.length; imgs[i].classList.add('is-on'); }, 3200);
  });

  /* Mobile header: solid bar once you scroll, dark over dark sections */
  const hdr = $('.header');
  const hdrState = () => {
    if (!hdr) return;
    hdr.classList.toggle('is-scrolled', scrollY > 40);
    const el = document.elementFromPoint(innerWidth / 2, (hdr.offsetHeight || 56) + 4);
    hdr.classList.toggle('is-dark', !!(el && el.closest('.contact, .expand, .menu')));
  };
  addEventListener('scroll', () => requestAnimationFrame(hdrState), { passive: true });
  hdrState();
  if (lenis) lenis.on('scroll', onScroll); else addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { fit(); olLayout(); onScroll(); });

  /* ---------- What I do: click an item to jump to it ---------- */
  /* ---------- What I do: mobile carousel dots ---------- */
  $$('.caps2').forEach(c => {
    const track = $('.caps2__right', c), dots = $$('.caps2__dots i', c);
    if (!track || !dots.length) return;
    const sync = () => {
      const i = Math.round(track.scrollLeft / Math.max(1, track.scrollWidth / dots.length));
      dots.forEach((d, k) => d.classList.toggle('is-on', k === Math.min(i, dots.length - 1)));
    };
    track.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
    dots.forEach((d, k) => d.addEventListener('click', () => track.scrollTo({ left: track.children[k].offsetLeft - track.offsetLeft, behavior: 'smooth' })));
    sync();
  });

  $$('.caps2__item').forEach(b => b.addEventListener('click', () => {
    const c = b.closest('.caps2'), n = $$('.caps2__item', c).length, i = +b.dataset.i;
    const top = c.getBoundingClientRect().top + scrollY + (c.offsetHeight - innerHeight) * ((i + 0.5) / n);
    if (lenis) lenis.scrollTo(top); else scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  }));

  /* ---------- Work: filters ---------- */
  $$('.chip').forEach(chip => chip.addEventListener('click', () => {
    $$('.chip').forEach(c => c.classList.toggle('is-on', c === chip));
    const f = chip.dataset.filter;
    $$('.card').forEach(c => c.classList.toggle('is-hidden', f !== 'all' && !c.dataset.cat.includes(f)));
  }));

  /* ---------- Project viewer ---------- */
  const viewer = $('.viewer');
  const vScroll = $('.viewer__scroll', viewer);
  const articles = $$('.pv', viewer);
  let current = -1;
  const gio = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); gio.unobserve(en.target); } }), { root: vScroll, rootMargin: '0px 0px -8% 0px' });
  const vvio = new IntersectionObserver(es => es.forEach(en => {
    const v = en.target;
    if (en.isIntersecting) { if (v.dataset.src && !v.src) v.src = v.dataset.src; if (!v.dataset.paused) v.play().catch(() => {}); } else v.pause();
  }), { root: vScroll, threshold: 0.25 });
  function showProject(i) {
    i = (i + articles.length) % articles.length;
    articles.forEach((a, k) => { a.hidden = k !== i; if (k !== i) $$('video', a).forEach(v => v.pause()); });
    const art = articles[i];
    $$('img[data-src]', art).forEach(img => { img.src = img.dataset.src; img.removeAttribute('data-src'); });
    $$('.g', art).forEach(g => { g.classList.remove('in'); gio.observe(g); });
    $$('video[data-auto]', art).forEach(v => vvio.observe(v));
    $('.viewer__count b', viewer).textContent = String(i + 1).padStart(2, '0');
    vScroll.scrollTop = 0;
    current = i;
    try { history.replaceState(null, '', '#' + art.id); } catch (e) {}
  }
  function openProject(id) {
    const idx = articles.findIndex(a => a.id === 'project-' + id);
    if (idx < 0) return;
    viewer.hidden = false;
    showProject(idx);
    doc.classList.add('viewer-open');
    if (lenis) lenis.stop();
    requestAnimationFrame(() => requestAnimationFrame(() => viewer.classList.add('is-on')));
    setTimeout(() => $('.viewer__close', viewer).focus({ preventScroll: true }), 300);
  }
  function closeProject() {
    if (viewer.hidden) return;
    viewer.classList.remove('is-on');
    doc.classList.remove('viewer-open');
    if (lenis) lenis.start();
    $$('video', viewer).forEach(v => v.pause());
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    setTimeout(() => { viewer.hidden = true; }, 900);
  }
  $$('[data-open]').forEach(b => b.addEventListener('click', () => openProject(b.dataset.open)));
  $$('[data-goto]', viewer).forEach(b => b.addEventListener('click', () => openProject(b.dataset.goto)));
  $('.viewer__close', viewer).addEventListener('click', closeProject);
  $('.viewer__prev', viewer).addEventListener('click', () => showProject(current - 1));
  $('.viewer__next', viewer).addEventListener('click', () => showProject(current + 1));
  document.addEventListener('keydown', e => {
    if (viewer.hidden || lb.classList.contains('is-on')) return;
    if (e.key === 'Escape') closeProject();
    if (e.key === 'ArrowRight') showProject(current + 1);
    if (e.key === 'ArrowLeft') showProject(current - 1);
  });
  if (location.hash.startsWith('#project-')) setTimeout(() => openProject(location.hash.slice(9)), 1400);

  /* ---------- Lightbox ---------- */
  const lb = $('.lightbox');
  const lbImg = $('img', lb);
  let group = [], gi = 0;
  const show = () => { lbImg.src = group[gi].dataset.full || group[gi].currentSrc || group[gi].src; lbImg.alt = group[gi].alt; $('.lightbox__count', lb).textContent = `${gi + 1} / ${group.length}`; };
  function closeLightbox() { if (!lb.classList.contains('is-on')) return; lb.classList.remove('is-on'); if (lenis && viewer.hidden) lenis.start(); }
  $$('.gallery').forEach(gal => {
    const imgs = $$('.g[data-cursor="zoom"] img', gal);
    imgs.forEach((im, i) => im.parentElement.addEventListener('click', () => {
      group = imgs; gi = i; show(); lb.classList.add('is-on'); if (lenis) lenis.stop();
    }));
  });
  $('.lightbox__close', lb).addEventListener('click', closeLightbox);
  $('.lightbox__prev', lb).addEventListener('click', e => { e.stopPropagation(); gi = (gi - 1 + group.length) % group.length; show(); });
  $('.lightbox__next', lb).addEventListener('click', e => { e.stopPropagation(); gi = (gi + 1) % group.length; show(); });
  lb.addEventListener('click', e => { if (e.target === lb || e.target === lbImg) closeLightbox(); });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('is-on')) return;
    if (e.key === 'ArrowRight') $('.lightbox__next', lb).click();
    if (e.key === 'ArrowLeft') $('.lightbox__prev', lb).click();
  });

  /* ---------- Copy email ---------- */
  $$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    const note = $('.copy-note');
    try { await navigator.clipboard.writeText(b.dataset.copy); note.textContent = 'Copied ✓'; }
    catch (e) { note.textContent = b.dataset.copy; }
    setTimeout(() => { note.textContent = ''; }, 2400);
  }));

  /* ---------- Local time ---------- */
  const clock = $('[data-clock]');
  const tickClock = () => { if (clock) clock.textContent = new Intl.DateTimeFormat('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Toronto' }).format(new Date()) + ' EST'; };
  tickClock(); setInterval(tickClock, 30000);

  /* ---------- Init ---------- */
  const ready = () => { fit(); olLayout(); onScroll(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(ready); else ready();
  addEventListener('load', ready);
  ready();
})();
