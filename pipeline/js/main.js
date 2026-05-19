// ════════════════════════════════════════════════════════════════
// MAIN — scope state, breadcrumb, drill controls, render loop
//
// Scope shape:
//   { level: 'region' }
//   { level: 'market',  market: 'Houston' | 'Dallas' }
//   { level: 'officer', market: 'Houston', officerId: 'h-reyes' }
// ════════════════════════════════════════════════════════════════

let scope = { level: 'region' };
let selected = null;
let deals = [];  // deals in current scope, rebuilt by recompute()

function recompute(newScope) {
  deals = dealsInScope(newScope);
}

onOfficerClick = (officerId) => {
  const o = officers.find(x => x.id === officerId);
  if (!o) return;
  setScope({ level: 'officer', market: o.market, officerId: o.id });
};

function setScope(newScope) {
  scope = newScope;
  selected = null;
  recompute(scope);
  renderAll();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Card Registry ────────────────────────────────────────────────
const cards = [
  { id: 1, l: 'Scorecard',   t: '① Pipeline Scorecard',                  type: 'html',  build: buildScorecard,  levels: ['region', 'market', 'officer'] },
  { id: 2, l: 'Coverage',    t: '② Pipeline Coverage vs Revenue Gap',    type: 'chart', build: buildCoverage,   levels: ['region', 'market', 'officer'] },
  { id: 3, l: 'Funnel',      t: '③ Stage Funnel — Annual & Weighted ($)', type: 'chart', build: buildStageFunnel, levels: ['region', 'market', 'officer'] },
  { id: 4, l: 'Aging',       t: '④ Aging by Days in Stage',              type: 'chart', build: buildAging,      levels: ['region', 'market', 'officer'] },
  { id: 5, l: 'By Product',  t: '⑤ Weighted Pipeline by Product',        type: 'chart', build: buildByProduct,  levels: ['region', 'market', 'officer'] },
  { id: 6, l: 'RM Rank',     t: '⑥ RM Ranking — Weighted Pipeline',      type: 'chart', build: buildRMRanking,  levels: ['region', 'market'] },
  { id: 7, l: 'Top Deals',   t: '⑦ Top 10 Deals (by Weighted Rev)',      type: 'html',  build: buildTopDeals,   levels: ['region', 'market', 'officer'] },
];

// ── Scope label helpers ──────────────────────────────────────────
function scopeTitle() {
  if (scope.level === 'region') return 'West Region · Pipeline';
  if (scope.level === 'market') return scope.market + ' · Pipeline';
  const o = officers.find(x => x.id === scope.officerId);
  return o ? `${o.name} · ${o.market} · Pipeline` : '?';
}

function scopeBadge() {
  const d = AS_OF;
  const mo = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  return `AS OF ${mo} ${d.getDate()}, ${d.getFullYear()}`;
}

// ── KPI Strip ────────────────────────────────────────────────────
function renderKpis() {
  const m   = pipelineMetrics(deals);
  const gap = gapForScope(scope) * 1e6;
  const coverage = gap > 0 ? m.weightedRev / gap : 0;
  const covCol = coverage >= COVERAGE_TARGET ? COL.green : coverage >= COVERAGE_WARN ? COL.amber : COL.red;
  const stuck  = deals.filter(d => OPEN_STAGES.includes(d.stage) && d.daysInStage > 90).length;

  const kpis = [
    { l: 'Open Deals',        v: m.openCount.toString() },
    { l: 'Total Annual Rev',  v: fmt$(m.totalRev) },
    { l: 'Weighted Rev',      v: fmt$(m.weightedRev) },
    { l: 'Coverage',          v: coverage.toFixed(2) + 'x', c: covCol },
    { l: 'Stuck (>90d)',      v: stuck.toString(), c: stuck > 0 ? COL.red : '#78716c' },
    { l: 'Closed YTD',        v: fmt$(m.closedRev), c: COL.green },
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

function renderHeader() {
  document.getElementById('scopeTitle').textContent = scopeTitle();
  document.getElementById('scopeBadge').textContent = scopeBadge();
}

// ── Breadcrumb + drill controls ──────────────────────────────────
function renderDrill() {
  const el = document.getElementById('drill');
  el.innerHTML = '';

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
    s.className = 'crumb-sep'; s.textContent = '›';
    el.appendChild(s);
  };
  const addDivider = () => {
    const d = document.createElement('span');
    d.className = 'drill-divider'; d.textContent = '|';
    el.appendChild(d);
  };
  const addChildBtn = (label, onClick) => {
    const b = document.createElement('button');
    b.className = 'child'; b.textContent = label; b.onclick = onClick;
    el.appendChild(b);
  };

  if (scope.level === 'region') {
    addCrumb('West Region', null, true);
    addDivider();
    markets.forEach(m => addChildBtn(m, () => setScope({ level: 'market', market: m })));
  } else if (scope.level === 'market') {
    addCrumb('West Region', () => setScope({ level: 'region' }), false);
    addSep();
    addCrumb(scope.market, null, true);
    addDivider();
    officers.filter(o => o.market === scope.market).forEach(o => {
      addChildBtn(o.name, () => setScope({ level: 'officer', market: o.market, officerId: o.id }));
    });
  } else {
    const o = officers.find(x => x.id === scope.officerId);
    addCrumb('West Region', () => setScope({ level: 'region' }), false);
    addSep();
    addCrumb(scope.market, () => setScope({ level: 'market', market: scope.market }), false);
    addSep();
    addCrumb(o ? o.name : '?', null, true);
    addDivider();
    officers.filter(x => x.market === scope.market && x.id !== scope.officerId).forEach(other => {
      addChildBtn(other.name, () => setScope({ level: 'officer', market: other.market, officerId: other.id }));
    });
  }
}

// ── Charts grid render ───────────────────────────────────────────
function renderGrid() {
  Object.values(chartInstances).forEach(c => c.destroy());
  Object.keys(chartInstances).forEach(k => delete chartInstances[k]);

  const grid = document.getElementById('grid');
  grid.className = selected ? 'grid single' : 'grid';
  grid.innerHTML = '';

  const levelFiltered = cards.filter(c => c.levels.includes(scope.level));
  const visible = selected
    ? levelFiltered.filter(c => c.id === selected)
    : levelFiltered;

  visible.forEach(c => {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.onclick = (e) => {
      if (e.target.tagName === 'CANVAS') return;
      // Don't isolate when clicking inside scrollable tables / tags
      if (e.target.closest('table')) return;
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
    renderGrid(); renderNav();
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
      renderGrid(); renderNav();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    nav.appendChild(btn);
  });
}

function renderAll() {
  renderHeader();
  renderKpis();
  renderDrill();
  renderNav();
  renderGrid();
}

recompute(scope);
renderAll();
