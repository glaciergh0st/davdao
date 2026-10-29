// Turns each "At a glance" step strip into an interactive stepper: pick a step to
// open its detail, with keyboard arrows and progress dots. Without JS the strip keeps
// its inline cards, so nothing is lost.
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let seq = 0;
  document.querySelectorAll('.process-flow').forEach(setup);

  function setup(flow) {
    const steps = [...flow.querySelectorAll('.process-step')];
    if (steps.length < 2) return;
    const data = steps.map((s, i) => ({
      label: (s.querySelector('strong')?.textContent || `Step ${i + 1}`).trim(),
      detail: (s.querySelector('p')?.textContent || '').trim(),
    }));

    const gid = `stp${++seq}`;
    const wrap = document.createElement('div');
    wrap.className = 'stepper';
    flow.parentNode.insertBefore(wrap, flow);
    wrap.appendChild(flow);

    const panel = document.createElement('div');
    panel.className = 'stepper-panel';
    panel.id = `${gid}-panel`;
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-live', 'polite');
    wrap.appendChild(panel);

    const dots = document.createElement('div');
    dots.className = 'stepper-dots';
    dots.setAttribute('aria-hidden', 'true');
    data.forEach(() => dots.appendChild(document.createElement('span')).className = 'stepper-dot');
    wrap.appendChild(dots);

    flow.classList.add('is-stepper');
    flow.setAttribute('role', 'tablist');
    flow.setAttribute('aria-label', 'Steps');
    steps.forEach((s, i) => {
      s.setAttribute('role', 'tab');
      s.setAttribute('tabindex', i === 0 ? '0' : '-1');
      s.setAttribute('aria-selected', 'false');
      s.setAttribute('aria-controls', panel.id);
      const p = s.querySelector('p');
      if (p) p.hidden = true; // detail now lives in the shared panel
      s.addEventListener('click', () => select(i, false));
      s.addEventListener('keydown', onKey);
    });

    let cur = -1;
    function select(i, focus) {
      if (i === cur) { if (focus) steps[i].focus(); return; }
      cur = i;
      steps.forEach((s, j) => {
        const on = j === i;
        s.setAttribute('aria-selected', on ? 'true' : 'false');
        s.setAttribute('tabindex', on ? '0' : '-1');
        s.classList.toggle('is-active', on);
        s.classList.toggle('is-dim', !on);
      });
      const count = document.createElement('p');
      count.className = 'stepper-count';
      count.textContent = `Step ${i + 1} of ${data.length}`;
      const label = document.createElement('p');
      label.className = 'stepper-label';
      label.textContent = data[i].label;
      const detail = document.createElement('p');
      detail.className = 'stepper-detail';
      detail.textContent = data[i].detail;
      panel.replaceChildren(count, label, detail);
      [...dots.children].forEach((d, j) => d.classList.toggle('on', j <= i));
      if (focus) steps[i].focus();
      steps[i].scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    }
    function onKey(e) {
      const n = steps.length;
      const i = cur < 0 ? 0 : cur;
      const go = (t) => { e.preventDefault(); select((t + n) % n, true); };
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(i + 1);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') go(i - 1);
      else if (e.key === 'Home') go(0);
      else if (e.key === 'End') go(n - 1);
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(i, true); }
    }
    select(0, false);
  }
})();
