// Interactive/futuristic layer: animated hero field, drag-to-rotate skills graph,
// count-up metrics, and scroll reveals. All effects respect reduced-motion and
// degrade to static content if anything is unavailable.
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const raf = window.requestAnimationFrame.bind(window);

  // ---- Animated hero field: drifting nodes with proximity links ------------------
  function heroField() {
    const canvas = document.querySelector('[data-hero-field]');
    if (!canvas || reduce) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), nodes = [], raf1 = 0;
    const pointer = { x: -999, y: -999 };
    function resize() {
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(70, Math.round((w * h) / 16000));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      }));
    }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
          if (d < 120) {
            ctx.strokeStyle = `rgba(120,160,255,${(1 - d / 120) * 0.16})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        const pd = Math.hypot(a.x - pointer.x, a.y - pointer.y);
        const near = pd < 150;
        ctx.fillStyle = near ? 'rgba(130,230,180,0.9)' : 'rgba(140,170,240,0.5)';
        ctx.beginPath(); ctx.arc(a.x, a.y, near ? 2.4 : 1.6, 0, Math.PI * 2); ctx.fill();
      }
      raf1 = raf(frame);
    }
    const onMove = (e) => { const r = canvas.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; };
    const onLeave = () => { pointer.x = -999; pointer.y = -999; };
    resize();
    window.addEventListener('resize', resize);
    canvas.parentElement.addEventListener('pointermove', onMove);
    canvas.parentElement.addEventListener('pointerleave', onLeave);
    // pause when offscreen
    const io = new IntersectionObserver((ents) => {
      if (ents[0].isIntersecting) { if (!raf1) raf1 = raf(frame); }
      else { cancelAnimationFrame(raf1); raf1 = 0; }
    });
    io.observe(canvas);
  }

  // ---- Count-up on the headline metric -------------------------------------------
  function countUps() {
    const els = [...document.querySelectorAll('[data-countup]')];
    if (!els.length) return;
    const run = (el) => {
      const text = el.textContent;
      const match = text.match(/[\d.,]+/);
      if (!match || reduce) { el.classList.add('is-counted'); return; }
      const target = parseFloat(match[0].replace(/,/g, ''));
      const suffix = text.slice(match.index + match[0].length);
      const prefix = text.slice(0, match.index);
      const decimals = (match[0].split('.')[1] || '').length;
      const dur = 900; const start = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = (target * eased).toFixed(decimals);
        el.textContent = prefix + Number(val).toLocaleString() + suffix;
        if (p < 1) raf(step); else el.textContent = prefix + target.toLocaleString() + suffix;
      };
      raf(step);
    };
    const io = new IntersectionObserver((ents, obs) => {
      for (const e of ents) if (e.isIntersecting) { run(e.target); obs.unobserve(e.target); }
    }, { rootMargin: '0px 0px -12% 0px' });
    els.forEach((el) => io.observe(el));
  }

  // ---- Scroll reveals -------------------------------------------------------------
  function reveals() {
    if (reduce) return;
    const targets = document.querySelectorAll('[data-reveal], .section-heading, .result-card, .facts-grid, .project-card, .featured-layout, .route-hop, .blog-card, .credential, .tool-category');
    if (!targets.length) return;
    const io = new IntersectionObserver((ents, obs) => {
      for (const e of ents) if (e.isIntersecting) { e.target.classList.add('is-revealed'); obs.unobserve(e.target); }
    }, { rootMargin: '0px 0px -8% 0px' });
    targets.forEach((t, i) => {
      if (t.getBoundingClientRect().top < window.innerHeight) { t.classList.add('is-revealed'); return; }
      t.classList.add('reveal-init');
      t.style.setProperty('--reveal-delay', `${(i % 6) * 45}ms`);
      io.observe(t);
    });
  }

  // ---- Drag-to-rotate 3D skills graph --------------------------------------------
  function skillsGraph() {
    const stage = document.querySelector('[data-skills]');
    if (!stage) return;
    const nodes = [...stage.querySelectorAll('.skill-node')];
    if (nodes.length < 3) return;
    stage.classList.add('is-3d');
    const N = nodes.length;
    const radius = () => Math.min(stage.clientWidth, 520) * 0.42;
    // Fibonacci sphere distribution
    const pts = nodes.map((_, i) => {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / N);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      return { x: Math.sin(phi) * Math.cos(theta), y: Math.sin(phi) * Math.sin(theta), z: Math.cos(phi) };
    });
    let ax = 0.2, ay = 0, vax = -0.0016, vay = 0.004, dragging = false, lastX = 0, lastY = 0, raf2 = 0;
    function render() {
      const r = radius();
      const cosX = Math.cos(ax), sinX = Math.sin(ax), cosY = Math.cos(ay), sinY = Math.sin(ay);
      for (let i = 0; i < N; i++) {
        const p = pts[i];
        // rotate around Y then X
        let x = p.x * cosY - p.z * sinY;
        let z = p.x * sinY + p.z * cosY;
        let y = p.y * cosX - z * sinX;
        z = p.y * sinX + z * cosX;
        const scale = (z + 1.6) / 2.6;
        const el = nodes[i];
        el.style.transform = `translate(-50%, -50%) translate3d(${(x * r).toFixed(1)}px, ${(y * r).toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
        el.style.opacity = (0.35 + scale * 0.65).toFixed(3);
        el.style.zIndex = String(Math.round(scale * 100));
      }
    }
    function tick() {
      if (!dragging && !reduce) { ay += vay; ax += vax; }
      render();
      raf2 = raf(tick);
    }
    const down = (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; stage.setPointerCapture?.(e.pointerId); };
    const move = (e) => {
      if (!dragging) return;
      ay += (e.clientX - lastX) * 0.006;
      ax -= (e.clientY - lastY) * 0.006;
      ax = Math.max(-1.2, Math.min(1.2, ax));
      lastX = e.clientX; lastY = e.clientY;
      if (reduce) render();
    };
    const up = () => { dragging = false; };
    stage.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    // highlight a category on node click/focus
    nodes.forEach((el) => {
      el.addEventListener('click', () => {
        const cat = el.getAttribute('data-cat');
        const on = stage.getAttribute('data-active') === cat;
        stage.setAttribute('data-active', on ? '' : cat);
        nodes.forEach((n) => n.classList.toggle('is-dim', !on && n.getAttribute('data-cat') !== cat));
        document.querySelectorAll('.skills-legend [data-legend]').forEach((l) => l.classList.toggle('is-on', !on && l.getAttribute('data-legend') === cat));
      });
    });
    // legend hover highlights
    document.querySelectorAll('.skills-legend [data-legend]').forEach((l) => {
      const cat = l.getAttribute('data-legend');
      l.addEventListener('pointerenter', () => nodes.forEach((n) => n.classList.toggle('is-dim', n.getAttribute('data-cat') !== cat)));
      l.addEventListener('pointerleave', () => { if (!stage.getAttribute('data-active')) nodes.forEach((n) => n.classList.remove('is-dim')); });
    });
    if (reduce) { render(); } else { tick(); }
    window.addEventListener('resize', render);
  }

  function start() { heroField(); countUps(); reveals(); skillsGraph(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
