// ════════════════════════════════════════════════════════════════
// MAIN — scope state, breadcrumb, drill controls, render loop
//
// Scope shape:
//   { level: 'region' }
//   { level: 'market',  market: 'Houston' | 'Dallas' }
//   { level: 'officer', market: 'Houston', officerId: 'h-reyes' }
//
// When scope changes, we call recompute(scope) from data.js, which rebuilds
// the monthly/actM/remM globals. Then renderAll() rebuilds every visible
// chart from those new values.
// ════════════════════════════════════════════════════════════════

let scope = { level: 'region' };
let selected = null;  // selected card id (for "isolate" view)

// Wire the officer-click handler from buildOfficerRanking back to setScope
onOfficerClick = (officerId) => {
  const o = officers.find(x => x.id === officerId);
  if (!o) return;
  setScope({ level: 'officer', market: o.market, officerId: o.id });
};

function setScope(newScope) {
  scope = newScope;
  selected = null;  // clear card isolation when scope changes
  recompute(scope);
  renderAll();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Card Registry ────────────────────────────────────────────────
// `levels`: which scope levels this card appears at
const cards = [
  { id: 1,  l: 'Scorecard',     t: '① YTD Scorecard',                        type: 'html',  build: buildScorecard,     levels: ['region', 'market', 'officer'] },
  { id: 2,  l: 'Gap to Plan',   t: '② YTD Variance to Budget ($M)',          type: 'chart', build: buildGapChart,      levels: ['region', 'market', 'officer'] },
  { id: 3,  l: 'Cumulative',    t: '③ Cumulative FL Revenue ($M)',           type: 'chart', build: buildCumulative,    levels: ['region', 'market', 'officer'] },
  { id: 4,  l: 'Run Rate',      t: '④ Run Rate vs Full Year Budget',         type: 'html',  build: buildGauges,        levels: ['region', 'market', 'officer'] },
  { id: 5,  l: 'Comm Loans',    t: '⑤ Comm Loan Interest Income ($M)',       type: 'chart', build: buildCommLoans,     levels: ['region', 'market', 'officer'] },
  { id: 6,  l: 'Deposits',      t: '⑥ Deposits — Avg Balance & Cost',        type: 'chart', build: buildDeposits,      levels: ['region', 'market'] },
  { id: 7,  l: 'Comm B/S',      t: '⑦ Comm Loans — Balance, Yield & Spread', type: 'chart', build: buildCommBS,        levels: ['region', 'market', 'officer'] },
  { id: 8,  l: 'NIOI Detail',   t: '⑧ FL NIOI — Fee Components ($M)',        type: 'chart', build: buildNIOI,          levels: ['region', 'market'] },
  { id: 9,  l: 'Revenue Mix',   t: '⑨ FL Revenue — NII + NIOI ($M)',         type: 'chart', build: buildRevMix,        levels: ['region', 'market', 'officer'] },
  { id: 10, l: 'FY Stack',      t: '⑩ Full Year — YTD + Remaining ($M)',     type: 'chart', build: buildFYStack,       levels: ['region', 'market', 'officer'] },
  { id: 11, l: 'Officer Rank',  t: '⑪ Officer Ranking (click to drill in)',  type: 'chart', build: buildOfficerRanking, levels: ['market'] },
];

// ── Scope label helpers ──────────────────────────────────────────
function scopeTitle() {
  if (scope.level === 'region') return 'Texas Region';
  if (scope.level === 'market') return scope.market;
  const o = officers.find(x => x.id === scope.officerId);
  return o ? `${o.name} · ${o.market}` : '?';
}

function scopeBadge() {
  return `JUN 2026 — 6 ACTUAL + 6 BUDGET`;
}

// ── KPI Strip ────────────────────────────────────────────────────
function renderKpis() {
  const ytdRev = sum(actM, 'flRev');
  const fyBgt  = sum(monthly, 'bRev');
  const ytdBgt = sum(actM, 'bRev');
  const rr     = (ytdRev / ACT) * 12;
  const gap    = ytdRev - ytdBgt;

  const kpis = [
    { l: 'YTD Revenue',  v: '$' + ytdRev.toFixed(1) + 'M' },
    { l: 'YTD Budget',   v: '$' + ytdBgt.toFixed(1) + 'M', c: '#78716c' },
    { l: 'YTD Variance', v: (gap >= 0 ? '+' : '') + '$' + gap.toFixed(1) + 'M', c: gap >= 0 ? COL.green : COL.red },
    { l: 'Run Rate',     v: '$' + rr.toFixed(1) + 'M', c: rr >= fyBgt ? COL.green : COL.amber },
    { l: 'FY Budget',    v: '$' + fyBgt.toFixed(1) + 'M', c: '#78716c' },
    { l: '% Complete',   v: fyBgt > 0 ? ((ytdRev / fyBgt) * 100).toFixed(1) + '%' : '—', c: COL.actual },
  ];

  const el = document.getElementById('kpiStrip');
  el.innerHTML = '';
  kpis.forEach(k => {
    const d = document.createElement('div');
    d.className = 'kpi';
    d.innerHTML = `<div class="kpi-label">${k.l}</div>
                   <div class="kpi-val" style="color:${k.c || '#212529'}">${k.v}</div>`;
    el.appendChild(d);
  });
}

// ── Header (title + badge update when scope changes) ─────────────
function renderHeader() {
  document.getElementById('scopeTitle').textContent = scopeTitle();
  document.getElementById('scopeBadge').textContent = scopeBadge();
}

// ── Breadcrumb + drill controls ──────────────────────────────────
function renderDrill() {
  const el = document.getElementById('drill');
  el.innerHTML = '';

  // Breadcrumb segment helpers
  const addCrumb = (label, onClick, active) => {
    const b = document.createElement('button');
    b.className = 'crumb' + (active ? ' active' : '');
    b.textContent = label;
    if (onClick && !active) b.onclick = onClick;
    if (active) b.disabled = true;
    el.appendChild(b);
  };
  const addSep = () => {
    const s = document.createElement('span');
    s.className = 'crumb-sep';
    s.textContent = '›';
    el.appendChild(s);
  };
  const addDivider = () => {
    const d = document.createElement('span');
    d.className = 'drill-divider';
    d.textContent = '|';
    el.appendChild(d);
  };
  const addChildBtn = (label, onClick) => {
    const b = document.createElement('button');
    b.className = 'child';
    b.textContent = label;
    b.onclick = onClick;
    el.appendChild(b);
  };

  // Build breadcrumb based on current level
  if (scope.level === 'region') {
    addCrumb('Region', null, true);
    addDivider();
    markets.forEach(m => addChildBtn(m, () => setScope({ level: 'market', market: m })));
  } else if (scope.level === 'market') {
    addCrumb('Region', () => setScope({ level: 'region' }), false);
    addSep();
    addCrumb(scope.market, null, true);
    addDivider();
    officers.filter(o => o.market === scope.market).forEach(o => {
      addChildBtn(o.name, () => setScope({ level: 'officer', market: o.market, officerId: o.id }));
    });
  } else {  // officer
    const o = officers.find(x => x.id === scope.officerId);
    addCrumb('Region', () => setScope({ level: 'region' }), false);
    addSep();
    addCrumb(scope.market, () => setScope({ level: 'market', market: scope.market }), false);
    addSep();
    addCrumb(o ? o.name : '?', null, true);
    // Lateral nav: show other officers in same market for quick switching
    addDivider();
    officers.filter(x => x.market === scope.market && x.id !== scope.officerId).forEach(other => {
      addChildBtn(other.name, () => setScope({ level: 'officer', market: other.market, officerId: other.id }));
    });
  }
}

// ── Charts grid render ───────────────────────────────────────────
function renderGrid() {
  // Destroy existing Chart instances
  Object.values(chartInstances).forEach(c => c.destroy());
  Object.keys(chartInstances).forEach(k => delete chartInstances[k]);

  const grid = document.getElementById('grid');
  grid.className = selected ? 'grid single' : 'grid';
  grid.innerHTML = '';

  // Filter cards by current scope level, then by selected (if isolating)
  const levelFiltered = cards.filter(c => c.levels.includes(scope.level));
  const visible = selected
    ? levelFiltered.filter(c => c.id === selected)
    : levelFiltered;

  visible.forEach(c => {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.onclick = (e) => {
      // Don't isolate when clicking inside a Chart.js canvas (let chart handle it)
      if (e.target.tagName === 'CANVAS') return;
      selected = selected === c.id ? null : c.id;
      renderGrid();
      renderNav();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const titleDiv = document.createElement('div');
    titleDiv.className = 'card-title';
    titleDiv.innerHTML = `<span>${c.t.charAt(0)}</span>${c.t.slice(1)}`;
    cardDiv.appendChild(titleDiv);

    if (c.type === 'chart') {
      const wrap = document.createElement('div');
      wrap.className = 'chart-wrap';
      const canvas = document.createElement('canvas');
      wrap.appendChild(canvas);
      cardDiv.appendChild(wrap);
      grid.appendChild(cardDiv);
      chartInstances[c.id] = c.build(canvas);
    } else {
      const content = document.createElement('div');
      cardDiv.appendChild(content);
      grid.appendChild(cardDiv);
      c.build(content);
    }
  });
}

// ── Chart nav (the "All / Scorecard / Gap..." button row) ────────
function renderNav() {
  const levelFiltered = cards.filter(c => c.levels.includes(scope.level));
  const nav = document.getElementById('nav');
  nav.innerHTML = '';

  const allBtn = document.createElement('button');
  allBtn.textContent = 'All';
  allBtn.className = selected === null ? 'active' : '';
  allBtn.onclick = (e) => {
    e.stopPropagation();
    selected = null;
    renderGrid();
    renderNav();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  nav.appendChild(allBtn);

  levelFiltered.forEach(c => {
    const btn = document.createElement('button');
    btn.textContent = c.l;
    btn.className = selected === c.id ? 'active' : '';
    btn.onclick = (e) => {
      e.stopPropagation();
      selected = c.id;
      renderGrid();
      renderNav();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    nav.appendChild(btn);
  });
}

// ── Top-level render ─────────────────────────────────────────────
function renderAll() {
  renderHeader();
  renderKpis();
  renderDrill();
  renderNav();
  renderGrid();
}

renderAll();
