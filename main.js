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

  // --- Install method tabs (Get Started) ---
  // Accessible tablist: click + ArrowLeft/Right + Home/End, roving tabindex,
  // ARIA state synced between tab buttons and tab panels.
  const tablist = document.querySelector('.install-tabs');
  if (tablist) {
    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
    const panels = tabs.map((t) => document.getElementById(t.getAttribute('aria-controls')));
    const activate = (idx, focus) => {
      tabs.forEach((tab, i) => {
        const active = i === idx;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.setAttribute('tabindex', active ? '0' : '-1');
        panels[i].hidden = !active;
      });
      if (focus) tabs[idx].focus();
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => activate(i, false));
      tab.addEventListener('keydown', (e) => {
        let next = -1;
        if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = tabs.length - 1;
        if (next !== -1) {
          e.preventDefault();
          activate(next, true);
        }
      });
    });
  }
})();

