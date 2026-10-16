/* ==========================================================
   ACowork landing — interactions
   ========================================================== */

(function () {
  'use strict';

  // --- Nav scroll state ---
  const nav = document.getElementById('nav');
  const onScroll = () => {
    if (!nav) return;
    if (window.scrollY > 8) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // --- Mobile menu toggle ---
  const toggle = document.getElementById('nav-toggle');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-menu-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    // Close menu on link tap
    nav.querySelectorAll('.nav__links a').forEach((a) => {
      a.addEventListener('click', () => {
        nav.classList.remove('is-menu-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // --- Year stamp ---
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // --- GitHub stars (graceful) ---
  // Pulls stars count via GitHub's public REST API. If the call fails
  // (rate limit, offline, CORS), the badge quietly falls back to a dash.
  const starsEl = document.getElementById('stars-badge');
  const REPO = 'tranxon/ACowork'; // upstream source repo
  if (starsEl) {
    fetch('https://api.github.com/repos/' + REPO, { headers: { Accept: 'application/vnd.github+json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data.stargazers_count === 'number') {
          const n = data.stargazers_count;
          starsEl.textContent = n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n);
        }
      })
      .catch(() => { /* keep placeholder */ });
  }

  // --- Smooth-scroll for in-page anchors (fallback for browsers without :focus-visible support) ---
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#' || href === '#top') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // --- Platform tabs (macOS / Windows / Linux) ---
  // Multiple .ptabs on the page can share a single platform state by
  // declaring the same data-ptabs-group. Switching Windows in the
  // Download block also switches Windows in every Get Started mode
  // card, so the user picks the OS once. Implemented with event
  // delegation on document + a one-time group index.
  const tabGroups = new Map();
  document.querySelectorAll('[data-ptabs-group]').forEach((el) => {
    const g = el.dataset.tabsGroup;
    if (!tabGroups.has(g)) tabGroups.set(g, []);
    tabGroups.get(g).push(el);
  });

  const activateTab = (group, target) => {
    const members = tabGroups.get(group);
    if (!members) return;
    members.forEach((root) => {
      root.querySelectorAll('[data-ptab]').forEach((btn) => {
        const on = btn.dataset.ptab === target;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-selected', String(on));
      });
      root.querySelectorAll('[data-ptab-pane]').forEach((pane) => {
        const on = pane.dataset.ptabPane === target;
        pane.classList.toggle('is-active', on);
        if (on) pane.removeAttribute('hidden');
        else pane.setAttribute('hidden', '');
      });
    });
  };

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-ptab]');
    if (!btn) return;
    const root = btn.closest('[data-ptabs-group]');
    if (!root) return;
    activateTab(root.dataset.tabsGroup, btn.dataset.ptab);
  });

  // Arrow-key navigation between tab buttons (W3C ARIA tab pattern,
  // light version: just left/right wrap, no Home/End).
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const btn = e.target.closest('[data-ptab]');
    if (!btn) return;
    const root = btn.closest('[data-ptabs-group]');
    if (!root) return;
    e.preventDefault();
    const all = Array.from(root.querySelectorAll('[data-ptab]'));
    const i = all.indexOf(btn);
    const next = all[(i + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length];
    activateTab(root.dataset.tabsGroup, next.dataset.ptab);
    next.focus();
  });
})();
