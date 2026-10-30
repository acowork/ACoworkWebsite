/* ==========================================================
   ACowork Agent Library — client-side browse
   ==========================================================
   No backend by design (PRD D1/D2): the whole index ships as a
   generated static JSON and every interaction happens here.

   All manifest-derived strings are inserted via textContent — a
   community PR must not be able to inject markup through a
   description field.
   ========================================================== */

(function () {
  'use strict';

  var DATA_URL = 'data/agents.json';

  var doc = null;            // parsed agents.json
  var state = { q: '', cat: 'all', sort: 'name' };

  var $ = function (id) { return document.getElementById(id); };

  var grid = $('ah-grid');
  var skeleton = $('ah-skeleton');
  var emptyBox = $('ah-empty');
  var errorBox = $('ah-error');
  var statusEl = $('ah-status');
  var qInput = $('ah-q');
  var clearBtn = $('ah-clear');
  var sortSel = $('ah-sort');
  var resetBtn = $('ah-reset');
  var catsEl = $('ah-cats');
  var detail = $('ah-detail');

  /* ---------- tiny DOM helpers ---------- */

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = String(text);
    return n;
  }

  function add(parent, tag, cls, text) {
    var n = el(tag, cls, text);
    parent.appendChild(n);
    return n;
  }

  function formatBytes(n) {
    if (!n && n !== 0) return '';
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KB';
    return (n / 1048576).toFixed(1) + ' MB';
  }

  function prettyKey(s) {
    return String(s).replace(/[_-]+/g, ' ').replace(/\b\w/g, function (c) {
      return c.toUpperCase();
    });
  }

  /* ---------- search ---------- */

  function haystack(a) {
    var parts = [
      a.agent_id, a.name, a.display_name, a.role, a.description, a.author,
      a.category_label
    ];
    (a.capabilities || []).forEach(function (c) {
      parts.push(c.key, prettyKey(c.key), c.description);
    });
    (a.skills || []).forEach(function (s) { parts.push(s, prettyKey(s)); });
    (a.permissions || []).forEach(function (p) { parts.push(p); });
    return parts.join(' \u0001 ').toLowerCase();
  }

  function matches(a, tokens) {
    if (!tokens.length) return true;
    var hay = a._hay || (a._hay = haystack(a));
    return tokens.every(function (t) { return hay.indexOf(t) !== -1; });
  }

  function filtered() {
    var tokens = state.q.toLowerCase().split(/\s+/).filter(Boolean);
    var list = (doc.agents || []).filter(function (a) {
      if (state.cat !== 'all' && a.category !== state.cat) return false;
      return matches(a, tokens);
    });

    var byName = function (x, y) {
      return x.display_name.toLowerCase().localeCompare(y.display_name.toLowerCase());
    };

    if (state.sort === 'name') {
      list.sort(byName);
    } else if (state.sort === 'category') {
      list.sort(function (x, y) {
        return (x.category_label || '').localeCompare(y.category_label || '') || byName(x, y);
      });
    } else if (state.sort === 'size') {
      list.sort(function (x, y) {
        return (x.package.size_bytes || 0) - (y.package.size_bytes || 0);
      });
    } else {
      list.sort(byName);
    }
    return list;
  }

  /* ---------- rendering ---------- */

  function avatarInto(host, a) {
    if (a.avatar) {
      var img = el('img', 'ah-card__avatar');
      img.src = a.avatar;
      img.alt = '';
      img.width = 44;
      img.height = 44;
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
      // Missing avatar must degrade to the initials tile, not a broken icon.
      img.addEventListener('error', function () {
        var t = el('span', 'ah-card__avatar ah-card__avatar--initial',
          (a.display_name || a.name || '?').trim().charAt(0).toUpperCase());
        host.replaceChild(t, img);
      });
      host.appendChild(img);
    } else {
      host.appendChild(el('span', 'ah-card__avatar ah-card__avatar--initial',
        (a.display_name || a.name || '?').trim().charAt(0).toUpperCase()));
    }
  }

  function permissionChips(container, a) {
    (a.permissions || []).forEach(function (p) {
      var risky = (a.high_risk_permissions || []).indexOf(p) !== -1;
      var chip = add(container, 'span', 'ah-perm' + (risky ? ' ah-perm--risk' : ''), p);
      chip.title = risky
        ? p + ' — high-impact permission: this agent can affect files or run commands on your machine'
        : p;
      if (risky) add(chip, 'span', 'ah-perm__mark', '!');
    });
  }

  function card(a) {
    var c = el('article', 'ah-card');
    c.setAttribute('data-agent', a.agent_id);

    var head = add(c, 'div', 'ah-card__head');
    var av = add(head, 'div', 'ah-card__av');
    avatarInto(av, a);

    var id = add(head, 'div', 'ah-card__id');
    var titleRow = add(id, 'div', 'ah-card__titlerow');
    add(titleRow, 'h3', 'ah-card__name', a.display_name || a.name);
    add(id, 'p', 'ah-card__role', a.role + ' · ' + a.category_label);

    add(c, 'p', 'ah-card__desc', a.description);

    var caps = add(c, 'div', 'ah-caps');
    var list = a.capabilities || [];
    list.slice(0, 3).forEach(function (cap) {
      add(caps, 'span', 'ah-cap', prettyKey(cap.key));
    });
    if (list.length > 3) add(caps, 'span', 'ah-cap ah-cap--more', '+' + (list.length - 3));

    var perms = add(c, 'div', 'ah-perms');
    add(perms, 'span', 'ah-perms__label', 'Permissions');
    permissionChips(perms, a);

    var foot = add(c, 'div', 'ah-card__foot');
    var meta = add(foot, 'div', 'ah-card__meta');
    add(meta, 'span', null, 'v' + a.version);
    add(meta, 'span', 'ah-card__dot', '·');
    add(meta, 'span', null, formatBytes(a.package.size_bytes));
    // Author comes from the manifest — an attribution fact, not a trust claim.
    add(meta, 'span', 'ah-card__dot', '·');
    add(meta, 'span', 'ah-card__author', 'by ' + a.author);

    var actions = add(foot, 'div', 'ah-card__actions');
    var more = el('button', 'btn btn--ghost btn--sm');
    more.type = 'button';
    more.textContent = 'Details';
    more.addEventListener('click', function () { openDetail(a, true); });
    actions.appendChild(more);

    var dl = el('a', 'btn btn--primary btn--sm');
    dl.href = a.package.file;
    dl.setAttribute('download', '');
    dl.textContent = 'Download';
    dl.addEventListener('click', function () { openDetail(a, false); });
    actions.appendChild(dl);

    return c;
  }

  function render() {
    var list = filtered();

    grid.textContent = '';
    var frag = document.createDocumentFragment();
    list.forEach(function (a) { frag.appendChild(card(a)); });
    grid.appendChild(frag);

    grid.hidden = list.length === 0;
    emptyBox.hidden = list.length !== 0;

    var total = (doc.agents || []).length;
    statusEl.textContent = list.length === total
      ? total + (total === 1 ? ' agent' : ' agents')
      : list.length + ' of ' + total + ' agents';

    var filteredOn = state.q || state.cat !== 'all' || state.sort !== 'name';
    resetBtn.hidden = !filteredOn;
    clearBtn.hidden = !state.q;

    // Facet counts reflect the query but ignore the category filter, so the
    // numbers answer "if I switched to this category, what would I see".
    var tokens = state.q.toLowerCase().split(/\s+/).filter(Boolean);
    var counts = {};
    var facetTotal = 0;
    (doc.agents || []).forEach(function (a) {
      if (matches(a, tokens)) {
        counts[a.category] = (counts[a.category] || 0) + 1;
        facetTotal++;
      }
    });

    Array.prototype.forEach.call(catsEl.children, function (btn) {
      var key = btn.dataset.cat;
      var n = key === 'all' ? facetTotal : (counts[key] || 0);
      var badge = btn.querySelector('.ah-chip__n');
      if (badge) badge.textContent = n;
      btn.classList.toggle('is-active', key === state.cat);
      btn.classList.toggle('is-empty', n === 0 && key !== state.cat);
      btn.disabled = n === 0 && key !== state.cat;
    });
  }

  /* ---------- detail dialog ---------- */

  function section(parent, titleText, cls) {
    var s = add(parent, 'div', 'ah-detail__section' + (cls ? ' ' + cls : ''));
    add(s, 'h4', null, titleText);
    return s;
  }

  function openDetail(a, doShow) {
    if (!a) return;
    if (doShow === undefined) doShow = true;

    var body = $('ah-detail-body');
    body.textContent = '';

    add(body, 'p', 'ah-detail__desc', a.description);

    var perms = section(body, 'Requested permissions');
    var risky = a.high_risk_permissions || [];
    if (risky.length) {
      var warn = add(perms, 'p', 'ah-detail__warn');
      add(warn, 'strong', null, 'High-impact: ' + risky.join(', ') + '.');
      add(warn, null, null,
        ' This agent can modify files and run commands on the machine it is installed on.');
    }
    var chips = add(perms, 'div', 'ah-perms ah-perms--plain');
    permissionChips(chips, a);

    var caps = section(body, 'Capabilities');
    var ul = add(caps, 'ul', 'ah-detail__caps');
    (a.capabilities || []).forEach(function (c) {
      var li = add(ul, 'li');
      add(li, 'span', 'ah-detail__capkey', prettyKey(c.key));
      add(li, 'p', null, c.description);
    });

    if ((a.skills || []).length) {
      var sk = section(body, 'Bundled skills');
      var row = add(sk, 'div', 'ah-caps');
      a.skills.forEach(function (s) { add(row, 'span', 'ah-cap ah-cap--skill', s); });
    }

    var meta = section(body, 'Package');
    var dl = add(meta, 'dl', 'ah-detail__meta');
    [
      ['agent_id', a.agent_id],
      ['version', a.version],
      ['author', a.author],
      ['runtime', 'ACowork ' + a.runtime_version],
      ['file', a.package.file.replace('downloads/', '')],
      ['size', formatBytes(a.package.size_bytes)],
      ['sha-256', a.package.sha256]
    ].forEach(function (kv) {
      add(dl, 'dt', null, kv[0]);
      add(dl, 'dd', kv[0] === 'sha-256' ? 'ah-mono ah-mono--wrap' : 'ah-mono', kv[1]);
    });

    $('ah-detail-title').textContent = a.display_name || a.name;
    $('ah-detail-role').textContent = a.role + ' · by ' + a.author;

    // Never replace the node — the dialog is reused across agents, so swapping
    // elements would leave the next openDetail() holding a detached reference.
    var avImg = $('ah-detail-avatar');
    var avInit = $('ah-detail-initial');
    var letter = (a.display_name || a.name || '?').trim().charAt(0).toUpperCase();
    avInit.textContent = letter;
    avInit.hidden = true;
    avImg.style.display = '';
    if (a.avatar) {
      avImg.onerror = function () { avImg.style.display = 'none'; avInit.hidden = false; };
      avImg.src = a.avatar;
    } else {
      avImg.removeAttribute('src');
      avImg.onerror = null;
      avImg.style.display = 'none';
      avInit.hidden = false;
    }

    var dlBtn = $('ah-detail-download');
    dlBtn.href = a.package.file;
    dlBtn.setAttribute('download', '');
    dlBtn.dataset.url = new URL(a.package.file, location.href).href;

    if (history.replaceState) {
      var u = new URL(location.href);
      u.searchParams.set('open', a.agent_id);
      history.replaceState({}, '', u);
    }

    if (doShow && typeof detail.showModal === 'function') {
      detail.showModal();
    } else if (doShow) {
      detail.setAttribute('open', '');
    }
  }

  function closeDetail() {
    if (typeof detail.close === 'function') detail.close();
    else detail.removeAttribute('open');
    var u = new URL(location.href);
    u.searchParams.delete('open');
    if (history.replaceState) history.replaceState({}, '', u);
  }

  /* ---------- url state ---------- */

  var SORTS = ['name', 'category', 'size'];

  function readUrl() {
    var p = new URLSearchParams(location.search);
    if (p.get('q')) state.q = p.get('q');
    if (p.get('cat')) state.cat = p.get('cat');
    // Ignore unknown sort values (e.g. a stale ?sort=featured link) so the
    // dropdown always reflects a real option.
    if (SORTS.indexOf(p.get('sort')) !== -1) state.sort = p.get('sort');
  }

  function writeUrl() {
    if (!history.replaceState) return;
    var u = new URL(location.href);
    state.q ? u.searchParams.set('q', state.q) : u.searchParams.delete('q');
    state.cat !== 'all' ? u.searchParams.set('cat', state.cat) : u.searchParams.delete('cat');
    state.sort !== 'name' ? u.searchParams.set('sort', state.sort) : u.searchParams.delete('sort');
    history.replaceState({}, '', u);
  }

  /* ---------- controls ---------- */

  function buildChips() {
    catsEl.textContent = '';
    var mk = function (key, label) {
      var b = el('button', 'ah-chip');
      b.type = 'button';
      b.dataset.cat = key;
      add(b, 'span', 'ah-chip__label', label);
      add(b, 'span', 'ah-chip__n', '0');
      b.addEventListener('click', function () {
        state.cat = key;
        render();
        writeUrl();
      });
      catsEl.appendChild(b);
    };
    mk('all', 'All');
    (doc.categories || []).forEach(function (c) { mk(c.key, c.label); });
  }

  function bindControls() {
    var t = null;
    qInput.addEventListener('input', function () {
      state.q = qInput.value.trim();
      clearTimeout(t);
      t = setTimeout(function () { render(); writeUrl(); }, 60);
    });
    clearBtn.addEventListener('click', function () {
      qInput.value = '';
      state.q = '';
      render();
      writeUrl();
      qInput.focus();
    });
    sortSel.addEventListener('change', function () {
      state.sort = sortSel.value;
      render();
      writeUrl();
    });
    var reset = function () {
      state.q = '';
      state.cat = 'all';
      state.sort = 'name';
      qInput.value = '';
      sortSel.value = 'name';
      render();
      writeUrl();
    };
    resetBtn.addEventListener('click', reset);
    $('ah-empty-reset').addEventListener('click', reset);

    $('ah-detail-close').addEventListener('click', closeDetail);
    $('ah-retry').addEventListener('click', load);

    $('ah-detail-copy').addEventListener('click', function (e) {
      var url = $('ah-detail-download').dataset.url;
      var btn = e.currentTarget;
      var done = function (ok) {
        btn.textContent = ok ? 'Copied' : 'Copy failed';
        setTimeout(function () { btn.textContent = 'Copy download link'; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { done(true); }, function () { done(false); });
      } else {
        done(false);
      }
    });

    // click on the backdrop closes the dialog
    detail.addEventListener('click', function (e) {
      if (e.target === detail) closeDetail();
    });
  }

  /* ---------- load ---------- */

  function showError(msg) {
    skeleton.hidden = true;
    grid.hidden = true;
    emptyBox.hidden = true;
    errorBox.hidden = false;
    if (msg) $('ah-error-detail').textContent = msg;
    statusEl.textContent = '';
  }

  /* ---------- data sources ----------

     Preferred: fetch data/agents.json (always current over HTTP).
     Fallback : the snapshot embedded in this page by
                dev/common/sync-agent-hub.py. It exists so the page still
                works when opened straight off disk (file://), where fetch of
                a local file is blocked by the browser's CORS rules. Both
                copies are generated from the same manifests. */

  function embeddedData() {
    var node = document.getElementById('ah-data');
    if (!node) return null;
    try {
      var data = JSON.parse(node.textContent);
      return (data && Array.isArray(data.agents) && data.agents.length) ? data : null;
    } catch (e) {
      return null;
    }
  }

  function showNotice(text) {
    var n = $('ah-notice');
    if (!n) return;
    if (!text) { n.hidden = true; return; }
    n.textContent = text;
    n.hidden = false;
  }

  function applyData(data, fromSnapshot) {
    if (!data || !Array.isArray(data.agents)) throw new Error('index has no agents array');
    doc = data;
    skeleton.hidden = true;

    $('ah-count-total').textContent = doc.agents.length;

    readUrl();
    qInput.value = state.q;
    sortSel.value = state.sort;
    if (!(doc.categories || []).some(function (c) { return c.key === state.cat; })) {
      state.cat = 'all';
    }

    buildChips();
    render();

    if (fromSnapshot) {
      showNotice(
        'Offline snapshot — this page was opened from disk, so the live index ' +
        'could not be fetched. Run a local server (e.g. python -m http.server) ' +
        'or publish the site to get the current list.'
      );
    }

    var openId = new URLSearchParams(location.search).get('open');
    if (openId) {
      var a = doc.agents.filter(function (x) { return x.agent_id === openId; })[0];
      if (a) openDetail(a, true);
    }
  }

  function load() {
    errorBox.hidden = true;
    skeleton.hidden = false;
    grid.hidden = true;
    emptyBox.hidden = true;
    statusEl.textContent = 'Loading the agent index…';

    fetch(DATA_URL, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        applyData(data, false);
      })
      .catch(function (err) {
        var snap = embeddedData();
        if (snap) {
          applyData(snap, true);
        } else {
          showError('The library index was unreachable (' + err.message + '). ' +
            'Check that data/agents.json was generated by dev/common/sync-agent-hub.py.');
        }
      });
  }

  bindControls();
  load();
})();
