// Reading aids for blog articles: progress bar, contents with the current section,
// a back-to-top control and gentle reveals. Loaded only on article pages.
(() => {
  'use strict';

  const page = document.querySelector('[data-blog-page]');
  const body = page?.querySelector('.blog-prose');
  if (!page || !body) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const svg = (viewBox, parts) => {
    const ns = 'http://www.w3.org/2000/svg';
    const root = document.createElementNS(ns, 'svg');
    root.setAttribute('viewBox', viewBox);
    root.setAttribute('aria-hidden', 'true');
    for (const [tag, attrs] of parts) {
      const node = document.createElementNS(ns, tag);
      for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
      root.append(node);
    }
    return root;
  };

  // ---- Progress bar and status chip -------------------------------------------------
  const bar = make('div', 'reading-progress');
  bar.setAttribute('aria-hidden', 'true');
  const fill = make('span', 'reading-progress-fill');
  bar.append(fill);
  document.body.prepend(bar);

  const status = make('div', 'reading-status');
  status.setAttribute('aria-hidden', 'true');
  const statusText = make('span', 'reading-status-text', '');
  status.append(statusText);
  const top = make('button', 'reading-top');
  top.type = 'button';
  top.setAttribute('aria-label', 'Back to top');
  top.append(svg('0 0 36 36', [
    ['circle', { class: 'ring-track', cx: '18', cy: '18', r: '16' }],
    ['circle', { class: 'ring-fill', cx: '18', cy: '18', r: '16' }],
    ['path', { class: 'ring-arrow', d: 'M18 24V12M12.5 17.5 18 12l5.5 5.5' }],
  ]));
  const ring = top.querySelector('.ring-fill');
  const circumference = 2 * Math.PI * 16;
  ring.style.strokeDasharray = `${circumference}`;
  top.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    document.querySelector('.blog-back')?.focus({ preventScroll: true });
  });
  document.body.append(status, top);

  const totalMinutes = () => {
    const match = /(\d+)/.exec(document.querySelector('[data-bind="blog.readingTime"]')?.textContent || '');
    return match ? Number(match[1]) : Math.max(1, Math.round(body.textContent.split(/\s+/).length / 220));
  };

  // ---- Contents ----------------------------------------------------------------------
  const toc = make('nav', 'article-toc');
  toc.setAttribute('aria-label', 'On this page');
  const tocHead = make('button', 'article-toc-toggle');
  tocHead.type = 'button';
  tocHead.setAttribute('aria-expanded', 'false');
  const tocCurrent = make('span', 'article-toc-current');
  tocHead.append(make('span', 'article-toc-label', 'On this page'), tocCurrent, svg('0 0 16 16', [['path', { d: 'M4 6l4 4 4-4' }]]));
  const tocList = make('ol', 'article-toc-list');
  toc.append(tocHead, tocList);
  body.before(toc);
  tocHead.addEventListener('click', () => {
    const open = toc.classList.toggle('is-open');
    tocHead.setAttribute('aria-expanded', String(open));
  });
  tocList.addEventListener('click', (event) => {
    if (event.target.closest('a') && window.matchMedia('(max-width: 1399px)').matches) {
      toc.classList.remove('is-open');
      tocHead.setAttribute('aria-expanded', 'false');
    }
  });

  let headings = [];
  let links = new Map();
  let revealObserver;

  const slugify = (text, used) => {
    const base = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'section';
    let slug = base;
    for (let n = 2; used.has(slug) || document.getElementById(slug); n += 1) slug = `${base}-${n}`;
    used.add(slug);
    return slug;
  };

  function build() {
    const used = new Set();
    headings = [...body.querySelectorAll('h2, h3')];
    links = new Map();
    tocList.replaceChildren();
    let currentGroup = null;
    for (const heading of headings) {
      const label = heading.textContent.trim();
      if (!heading.id) heading.id = slugify(label, used);
      else used.add(heading.id);
      const item = make('li', heading.tagName === 'H2' ? 'toc-h2' : 'toc-h3');
      const link = make('a', '', label);
      link.href = `#${heading.id}`;
      item.append(link);
      if (heading.tagName === 'H2') {
        tocList.append(item);
        currentGroup = null;
        const sub = make('ol', 'toc-sub');
        item.append(sub);
        currentGroup = sub;
      } else if (currentGroup) currentGroup.append(item);
      else tocList.append(item);
      links.set(heading, link);
    }
    tocList.querySelectorAll('.toc-sub:empty').forEach((node) => node.remove());
    toc.hidden = headings.length < 3;

    // Reveal blocks as they scroll in; content stays visible if this never runs.
    revealObserver?.disconnect();
    if (!reduceMotion.matches && 'IntersectionObserver' in window) {
      revealObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
        }
      }, { rootMargin: '0px 0px -8% 0px' });
      const blocks = body.querySelectorAll(':scope > h2, :scope > .terminal-block, :scope > .table-scroll, :scope > ul, :scope > ol, :scope > blockquote');
      const fold = window.innerHeight;
      blocks.forEach((node) => {
        if (node.getBoundingClientRect().top < fold) return;
        node.classList.add('reveal');
        revealObserver.observe(node);
      });
    }
    update();
  }

  // ---- Scroll state -------------------------------------------------------------------
  let active = null;
  let ticking = false;
  function update() {
    ticking = false;
    const rect = body.getBoundingClientRect();
    const view = window.innerHeight;
    const span = Math.max(1, rect.height - view * 0.6);
    const progress = Math.min(1, Math.max(0, (view * 0.25 - rect.top) / span));
    fill.style.transform = `scaleX(${progress})`;
    ring.style.strokeDashoffset = `${circumference * (1 - progress)}`;

    const started = rect.top < view * 0.35;
    const left = Math.max(0, Math.ceil(totalMinutes() * (1 - progress)));
    statusText.textContent = progress >= 0.995 ? 'Finished' : `${Math.round(progress * 100)}% · ${left} min left`;
    status.classList.toggle('is-shown', started && progress < 1);
    top.classList.toggle('is-shown', window.scrollY > view * 0.8);
    toc.classList.toggle('is-docked', started);

    let current = null;
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top <= 110) current = heading;
      else break;
    }
    if (current !== active) {
      links.get(active)?.removeAttribute('aria-current');
      links.get(active)?.closest('.toc-h2')?.classList.remove('is-active');
      active = current;
      const link = links.get(active);
      if (link) {
        link.setAttribute('aria-current', 'location');
        (active.tagName === 'H2' ? link.parentElement : link.closest('.toc-h2'))?.classList.add('is-active');
        let section = active;
        if (section.tagName !== 'H2') section = headings.slice(0, headings.indexOf(active)).reverse().find((h) => h.tagName === 'H2') || active;
        tocCurrent.textContent = links.get(section)?.textContent || '';
        if (toc.classList.contains('is-docked') && window.matchMedia('(min-width: 1400px)').matches) {
          const box = tocList.getBoundingClientRect();
          const where = link.getBoundingClientRect();
          if (where.top < box.top || where.bottom > box.bottom) tocList.scrollTop += where.top - box.top - box.height / 3;
        }
      } else tocCurrent.textContent = '';
    }
  }
  const schedule = () => { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);

  // content.js may replace the article body with fresh content after load; rebuild then.
  new MutationObserver(() => build()).observe(body, { childList: true });
  build();
  if (location.hash) {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) target.scrollIntoView();
  }
})();
