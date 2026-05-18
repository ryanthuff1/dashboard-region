// ════════════════════════════════════════════════════════════════
// MAIN — KPI strip, card registry, render loop, nav, entry point
// ════════════════════════════════════════════════════════════════

// ── KPI Strip ────────────────────────────────────────────────────
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
  { l: '% Complete',   v: ((ytdRev / fyBgt) * 100).toFixed(1) + '%', c: COL.actual },
];

const kpiEl = document.getElementById('kpiStrip');
kpis.forEach(k => {
  const d = document.createElement('div');
  d.className = 'kpi';
  d.innerHTML = `<div class="kpi-label">${k.l}</div>
                 <div class="kpi-val" style="color:${k.c || '#212529'}">${k.v}</div>`;
  kpiEl.appendChild(d);
});

// ── Card Registry ────────────────────────────────────────────────
// Add a new card: define a buildXxx in charts.js, then append here.
const cards = [
  { id: 1,  l: 'Scorecard',   t: '① YTD Scorecard',                       type: 'html',  build: buildScorecard },
  { id: 2,  l: 'Gap to Plan', t: '② YTD Variance to Budget ($M)',         type: 'chart', build: buildGapChart },
  { id: 3,  l: 'Cumulative',  t: '③ Cumulative FL Revenue ($M)',          type: 'chart', build: buildCumulative },
  { id: 4,  l: 'Run Rate',    t: '④ Run Rate vs Full Year Budget',        type: 'html',  build: buildGauges },
  { id: 5,  l: 'Comm Loans',  t: '⑤ Comm Loan Interest Income ($M)',      type: 'chart', build: buildCommLoans },
  { id: 6,  l: 'Deposits',    t: '⑥ Deposits — Avg Balance & Cost',       type: 'chart', build: buildDeposits },
  { id: 7,  l: 'Comm B/S',    t: '⑦ Comm Loans — Balance, Yield & Spread', type: 'chart', build: buildCommBS },
  { id: 8,  l: 'NIOI Detail', t: '⑧ FL NIOI — Fee Components ($M)',       type: 'chart', build: buildNIOI },
  { id: 9,  l: 'Revenue Mix', t: '⑨ FL Revenue — NII + NIOI ($M)',        type: 'chart', build: buildRevMix },
  { id: 10, l: 'FY Stack',    t: '⑩ Full Year — YTD + Remaining ($M)',    type: 'chart', build: buildFYStack },
];

// ── Render Loop ──────────────────────────────────────────────────
let selected = null;

function render() {
  // Destroy existing Chart instances before rerendering — prevents memory leaks
  // and the "this canvas is already in use" error.
  Object.values(chartInstances).forEach(c => c.destroy());
  Object.keys(chartInstances).forEach(k => delete chartInstances[k]);

  const grid = document.getElementById('grid');
  grid.className = selected ? 'grid single' : 'grid';
  grid.innerHTML = '';

  const visible = selected ? cards.filter(c => c.id === selected) : cards;

  visible.forEach(c => {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.onclick = () => {
      selected = selected === c.id ? null : c.id;
      render();
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

  // Nav buttons
  const nav = document.getElementById('nav');
  nav.innerHTML = '';

  const allBtn = document.createElement('button');
  allBtn.textContent = 'All';
  allBtn.className = selected === null ? 'active' : '';
  allBtn.onclick = (e) => {
    e.stopPropagation();
    selected = null;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  nav.appendChild(allBtn);

  cards.forEach(c => {
    const btn = document.createElement('button');
    btn.textContent = c.l;
    btn.className = selected === c.id ? 'active' : '';
    btn.onclick = (e) => {
      e.stopPropagation();
      selected = c.id;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    nav.appendChild(btn);
  });
}

render();
