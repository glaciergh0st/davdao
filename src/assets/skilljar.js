/*
 * SkillJar interactions — dependency-free, CSP-safe (script-src 'self').
 * Progressive enhancement: the server-rendered page is fully usable without
 * this file. Here we animate the jar fills and overall progress, run the
 * count-ups, and wire the faceted filtering + tag/jar cross-linking.
 */
(function () {
  'use strict';

  var page = document.querySelector('[data-skilljar-page]');
  if (!page) return;

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { /* default to motion on */ }

  /* ---------- Count-ups ---------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-countup'));
    if (!isFinite(target)) return;
    if (reduceMotion) { el.textContent = String(target); return; }
    var start = performance.now();
    var dur = 900;
    function step(now) {
      var t = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - t, 3);
      var val = target * eased;
      el.textContent = Number.isInteger(target) ? String(Math.round(val)) : val.toFixed(1);
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = Number.isInteger(target) ? String(target) : target.toFixed(1);
    }
    requestAnimationFrame(step);
  }

  /* ---------- Fills ---------- */
  function animateBar() {
    var bar = page.querySelector('[data-sj-bar]');
    if (!bar) return;
    var pctTarget = (bar.style.getPropertyValue('--pct') || '0%').trim();
    if (reduceMotion) { bar.style.width = pctTarget; return; }
    bar.style.width = '0%';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { bar.style.width = pctTarget; });
    });
  }

  function animateLiquids() {
    var liquids = Array.prototype.slice.call(page.querySelectorAll('.sj-jar-liquid'));
    if (reduceMotion) return; // inline heights already correct
    liquids.forEach(function (el) { el.style.height = '0%'; });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        liquids.forEach(function (el) { el.style.height = (el.getAttribute('data-fill') || '0') + '%'; });
      });
    });
  }

  // Kick fills when the jar section first scrolls into view (or immediately).
  function whenVisible(el, cb) {
    if (!('IntersectionObserver' in window) || reduceMotion) { cb(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { cb(); io.disconnect(); }
      });
    }, { threshold: 0.15 });
    io.observe(el);
  }

  /* ---------- Filtering ---------- */
  var labs = Array.prototype.slice.call(page.querySelectorAll('.sj-lab'));
  var jars = Array.prototype.slice.call(page.querySelectorAll('.sj-jar'));
  var countEl = page.querySelector('[data-sj-count]');
  var emptyEl = page.querySelector('[data-sj-empty]');
  var searchEl = page.querySelector('[data-sj-search]');
  var catalog = page.querySelector('[data-sj-catalog]');

  var filters = { team: new Set(), platform: new Set(), tag: new Set() };
  var domainFilter = null;
  var searchTerm = '';

  function labMatches(li) {
    var d = li.dataset;
    if (filters.team.size && !filters.team.has(d.team)) return false;
    if (filters.platform.size && !filters.platform.has(d.platform)) return false;
    if (filters.tag.size) {
      var tags = (d.tags || '').split('|');
      var hit = false;
      filters.tag.forEach(function (t) { if (tags.indexOf(t) !== -1) hit = true; });
      if (!hit) return false;
    }
    if (domainFilter && d.domain !== domainFilter) return false;
    if (searchTerm && (d.search || '').indexOf(searchTerm) === -1) return false;
    return true;
  }

  function apply() {
    var shown = 0;
    labs.forEach(function (li) {
      var ok = labMatches(li);
      li.hidden = !ok;
      if (ok) shown += 1;
    });
    if (countEl) countEl.textContent = shown + (shown === 1 ? ' lab' : ' labs');
    if (emptyEl) emptyEl.hidden = shown !== 0;

    // Dim jars outside an active team filter; mark the domain-focused jar.
    jars.forEach(function (jar) {
      var dimmed = filters.team.size > 0 && !filters.team.has(jar.dataset.team);
      jar.classList.toggle('is-dimmed', dimmed);
      jar.classList.toggle('is-active', !!domainFilter && jar.dataset.domain === domainFilter);
    });
  }

  function setChipState(group) {
    var chips = page.querySelectorAll('.sj-chip[data-group="' + group + '"]');
    var set = filters[group];
    Array.prototype.forEach.call(chips, function (chip) {
      var facet = chip.getAttribute('data-facet');
      if (facet === 'all') chip.classList.toggle('is-on', set.size === 0);
      else chip.classList.toggle('is-on', set.has(facet));
    });
  }

  function onChip(chip) {
    var group = chip.getAttribute('data-group');
    var facet = chip.getAttribute('data-facet');
    if (!filters[group]) return;
    if (facet === 'all') filters[group].clear();
    else if (filters[group].has(facet)) filters[group].delete(facet);
    else filters[group].add(facet);
    setChipState(group);
    apply();
  }

  function clearAll() {
    filters.team.clear();
    filters.platform.clear();
    filters.tag.clear();
    domainFilter = null;
    searchTerm = '';
    if (searchEl) searchEl.value = '';
    setChipState('team');
    setChipState('platform');
    setChipState('tag');
    apply();
  }

  // Delegated clicks: facet chips, tag buttons, jar buttons, clear button.
  page.addEventListener('click', function (event) {
    var chip = event.target.closest('.sj-chip');
    if (chip && page.contains(chip)) { onChip(chip); return; }

    var tagBtn = event.target.closest('[data-sj-tag]');
    if (tagBtn && page.contains(tagBtn)) {
      var tag = tagBtn.getAttribute('data-sj-tag');
      if (!filters.tag.has(tag)) filters.tag.add(tag);
      setChipState('tag');
      apply();
      if (catalog) catalog.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      return;
    }

    var jarBtn = event.target.closest('[data-sj-jar]');
    if (jarBtn && page.contains(jarBtn)) {
      var dom = jarBtn.getAttribute('data-sj-jar');
      domainFilter = (domainFilter === dom) ? null : dom;
      apply();
      if (domainFilter && catalog) catalog.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      return;
    }

    var clearBtn = event.target.closest('[data-sj-clear]');
    if (clearBtn && page.contains(clearBtn)) { clearAll(); return; }
  });

  if (searchEl) {
    searchEl.addEventListener('input', function () {
      searchTerm = searchEl.value.trim().toLowerCase();
      apply();
    });
  }

  /* ---------- Boot ---------- */
  function boot() {
    page.querySelectorAll('[data-countup]').forEach(animateCount);
    animateBar();
    var jarSection = page.querySelector('.sj-jars');
    if (jarSection) whenVisible(jarSection, animateLiquids);
    else animateLiquids();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
