// ════════════════════════════════════════════════════════════════
// MAIN — scope management, navigation, render orchestration
// ════════════════════════════════════════════════════════════════

let currentScope = { level: 'region' };
let selectedCard = null;

function drillTo(newScope) {
  currentScope = newScope;
  selectedCard = null;
  recompute(currentScope);
  renderAll();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Card Registry ──────────────────────────────────────────────
const cards = [
  { id: 1,  l: 'Scorecard',      t: '① Financial Scorecard',                  type: 'html',  build: buildScorecard,        levels: ['region', 'market', 'officer'] },
  { id: 2,  l: 'Revenue',        t: '② Total Revenue Trend',                  type: 'chart', build: buildRevenueTrend,     levels: ['region', 'market', 'officer'] },
  { id: 3,  l: 'Income',         t: '③ Net Interest vs Fee Income',          type: 'chart', build: buildIncomeComparison, levels: ['region', 'market', 'officer'] },
  { id: 4,  l: 'Loan Bal',       t: '④ Commercial Loan Balances',            type: 'chart', build: buildLoanBalances,     levels: ['region', 'market', 'officer'] },
  { id: 5,  l: 'Deposits',       t: '⑤ Deposit Balances',                    type: 'chart', build: buildDepositBalances,  levels: ['region', 'market'] },
  { id: 6,  l: 'Rates',          t: '⑥ Loan Yield, Deposit Cost & Spread',   type: 'chart', build: buildRates,            levels: ['region', 'market', 'officer'] },
  { id: 7,  l: 'Fees',           t: '⑦ Fee Income Breakdown (YTD)',          type: 'chart', build: buildFeeBreakdown,     levels: ['region', 'market'] },
  { id: 8,  l: 'Comm II',        t: '⑧ Commercial Loan Interest Income',     type: 'chart', build: buildCommII,           levels: ['region', 'market', 'officer'] },
  { id: 9,  l: 'Officers',       t: '⑨ Officer Performance (click to drill)',type: 'chart', build: buildOfficerComparison,levels: ['region', 'market'] },
  { id: 10, l: 'Markets',        t: '⑩ Market Comparison (click to drill)',  type: 'chart', build: buildMarketComparison, levels: ['region'] },
  { id: 11, l: 'Run Rate',       t: '⑪ Run Rate vs Forecast',                type: 'html',  build: buildRunRateGauges,    levels: ['region', 'market', 'officer'] },
];

// ── Scope label helpers ────────────────────────────────────────
function scopeTitle() {
  if (currentScope.level === 'region') return 'West Region — Financial Performance';
  if (currentScope.level === 'market') return `${currentScope.market} Market — Financial Performance`;
  const o = officers.find(x => x.id === currentScope.officerId);
  return o ? `${o.name} · ${o.market} — Financial Performance` : 'Officer Performance';
}

// ── KPI Strip ──────────────────────────────────────────────────
function renderKpis() {
  const ytdRev = sum(actM, 'totalRev');
  const fyFct  = sum(monthly, 'totalRev');
  const runRate = (ytdRev / ACT) * 12;
  const gap = runRate - fyFct;
  const gapPct = (gap / fyFct) * 100;

  const kpis = [
    { l: 'YTD Revenue',     v: '$' + ytdRev.toFixed(1) + 'M' },
    { l: 'FY Forecast',     v: '$' + fyFct.toFixed(1) + 'M', c: '#78716c' },
    { l: 'Run Rate',        v: '$' + runRate.toFixed(1) + 'M', c: gap >= 0 ? COL.green : COL.red },
    { l: 'vs Forecast',     v: (gap >= 0 ? '+' : '') + '$' + gap.toFixed(1) + 'M', c: gap >= 0 ? COL.green : COL.red },
    { l: '% Complete',      v: ((ytdRev / fyFct) * 100).toFixed(1) + '%', c: COL.actual },
    { l: 'Avg Mo Needed',   v: '$' + ((fyFct - ytdRev) / 6).toFixed(1) + 'M', c: COL.amber },
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

// ── Header update ──────────────────────────────────────────────
function renderHeader() {
  document.getElementById('scopeTitle').textContent = scopeTitle();
  document.getElementById('scopeBadge').textContent = 'JUN 2026 YTD — 6 ACTUAL + 6 FORECAST';
}

// ── Breadcrumb + drill navigation ──────────────────────────────
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

  const addChild = (label, onClick) => {
    const b = document.createElement('button');
    b.className = 'child';
    b.textContent = label;
    b.onclick = onClick;
    el.appendChild(b);
  };

  if (currentScope.level === 'region') {
    addCrumb('South Central Region', null, true);
    addDivider();
    markets.forEach(m => addChild(m, () => drillTo({ level: 'market', market: m })));
  } else if (currentScope.level === 'market') {
    addCrumb('South Central Region', () => drillTo({ level: 'region' }), false);
    addSep();
    addCrumb(currentScope.market, null, true);
    addDivider();
    officers.filter(o => o.market === currentScope.market).forEach(o => {
      addChild(o.name, () => drillTo({ level: 'officer', market: o.market, officerId: o.id }));
    });
  } else {  // officer
    const o = officers.find(x => x.id === currentScope.officerId);
    addCrumb('South Central Region', () => drillTo({ level: 'region' }), false);
    addSep();
    addCrumb(currentScope.market, () => drillTo({ level: 'market', market: currentScope.market }), false);
    addSep();
    addCrumb(o ? o.name : '?', null, true);
    addDivider();
    officers.filter(x => x.market === currentScope.market && x.id !== currentScope.officerId).forEach(other => {
      addChild(other.name, () => drillTo({ level: 'officer', market: other.market, officerId: other.id }));
    });
  }
}

// ── Chart navigation bar ───────────────────────────────────────
function renderNav() {
  const levelFiltered = cards.filter(c => c.levels.includes(currentScope.level));
  const nav = document.getElementById('nav');
  nav.innerHTML = '';

  const allBtn = document.createElement('button');
  allBtn.textContent = 'All';
  allBtn.className = selectedCard === null ? 'active' : '';
  allBtn.onclick = () => {
    selectedCard = null;
    renderGrid();
    renderNav();
  };
  nav.appendChild(allBtn);

  levelFiltered.forEach(c => {
    const btn = document.createElement('button');
    btn.textContent = c.l;
    btn.className = selectedCard === c.id ? 'active' : '';
    btn.onclick = () => {
      selectedCard = c.id;
      renderGrid();
      renderNav();
    };
    nav.appendChild(btn);
  });
}

// ── Charts grid ────────────────────────────────────────────────
function renderGrid() {
  // Destroy existing Chart instances
  Object.values(chartInstances).forEach(c => c.destroy());
  Object.keys(chartInstances).forEach(k => delete chartInstances[k]);

  const grid = document.getElementById('grid');
  grid.className = selectedCard ? 'grid single' : 'grid';
  grid.innerHTML = '';

  const levelFiltered = cards.filter(c => c.levels.includes(currentScope.level));
  const visible = selectedCard
    ? levelFiltered.filter(c => c.id === selectedCard)
    : levelFiltered;

  visible.forEach(c => {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.onclick = (e) => {
      if (e.target.tagName === 'CANVAS') return;  // Let chart handle clicks
      selectedCard = selectedCard === c.id ? null : c.id;
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
      const chart = c.build(canvas);
      if (chart) chartInstances[c.id] = chart;
    } else {
      const content = document.createElement('div');
      cardDiv.appendChild(content);
      grid.appendChild(cardDiv);
      c.build(content);
    }
  });
}

// ── Main render loop ───────────────────────────────────────────
function renderAll() {
  renderHeader();
  renderKpis();
  renderDrill();
  renderNav();
  renderGrid();
}

// Initialize
renderAll();
