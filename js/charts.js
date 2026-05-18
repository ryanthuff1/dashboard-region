// ════════════════════════════════════════════════════════════════
// CHART BUILDERS — one function per card
// HTML cards take a container <div>; chart cards take a <canvas>
// and must return the Chart instance for cleanup on rerender.
// ════════════════════════════════════════════════════════════════

// ── ① Scorecard ──────────────────────────────────────────────────
function buildScorecard(container) {
  const lines = [
    { label: 'FL Revenue',      a: sum(actM,'flRev'),    b: sum(actM,'bRev'),     fy: sum(monthly,'bRev') },
    { label: 'FL NII',          a: sum(actM,'flNII'),    b: sum(actM,'bNII'),     fy: sum(monthly,'bNII') },
    { label: 'FL NIOI',         a: sum(actM,'flNIOI'),   b: sum(actM,'bNIOI'),    fy: sum(monthly,'bNIOI') },
    { label: 'Comm Loan II',    a: sum(actM,'commII'),   b: sum(actM,'commII_b'), fy: sum(monthly,'commII_b') },
    { label: 'Consumer II',     a: sum(actM,'consII'),   b: sum(actM,'consII_b'), fy: sum(monthly,'consII_b') },
    { label: 'Deposit IE',      a: sum(actM,'depIE'),    b: sum(actM,'depIE_b'),  fy: sum(monthly,'depIE_b'),  inv: true },
    { label: 'Treasury Mgmt',   a: sum(actM,'tm'),       b: sum(actM,'tm_b'),     fy: sum(monthly,'tm_b') },
    { label: 'PCARD',           a: sum(actM,'pc'),       b: sum(actM,'pc_b'),     fy: sum(monthly,'pc_b') },
    { label: 'Service Charges', a: sum(actM,'sv'),       b: sum(actM,'sv_b'),     fy: sum(monthly,'sv_b') },
  ].map(d => {
    const v = d.a - d.b;
    const vp = (v / d.b) * 100;
    const ev = d.inv ? -vp : vp;       // effective variance (inv flips sign for cost lines)
    const rr = (d.a / ACT) * 12;       // annualized run rate
    const need = (d.fy - d.a) / (12 - ACT);
    const avg = d.a / ACT;
    const step = ((need - avg) / avg) * 100;
    const st = ev >= -0.5 ? 'g' : ev >= -3 ? 'a' : 'r';
    return { ...d, v, ev, rr, need, avg, step, st };
  });

  const sc = s => s === 'g' ? COL.green   : s === 'a' ? COL.amber   : COL.red;
  const sb = s => s === 'g' ? COL.greenBg : s === 'a' ? COL.amberBg : COL.redBg;
  const si = s => s === 'g' ? '●' : s === 'a' ? '▲' : '▼';

  let html = `<table class="sc-table"><thead><tr>
    <th></th><th></th><th>YTD Act</th><th>YTD Bgt</th><th>Var $</th><th>Var %</th>
    <th>Run Rate</th><th>Avg/Mo</th><th>Need/Mo</th><th>Step-Up</th>
  </tr></thead><tbody>`;

  lines.forEach(d => {
    const rowClass = d.st === 'r' ? ' class="red-row"' : '';
    const stepHtml = d.step > 2
      ? `<span style="color:${COL.red};font-weight:700">+${d.step.toFixed(0)}%</span>`
      : d.step < -2
      ? `<span style="color:${COL.green};font-weight:700">${d.step.toFixed(0)}%</span>`
      : '<span style="color:#78716c">—</span>';

    html += `<tr${rowClass}>
      <td style="color:${sc(d.st)}">${si(d.st)}</td>
      <td>${d.label}</td>
      <td>$${d.a.toFixed(1)}</td>
      <td style="color:#78716c">$${d.b.toFixed(1)}</td>
      <td style="color:${sc(d.st)};font-weight:700">${d.v >= 0 ? '+' : ''}${d.v.toFixed(2)}</td>
      <td><span class="var-badge" style="background:${sb(d.st)};color:${sc(d.st)}">${d.ev >= 0 ? '+' : ''}${d.ev.toFixed(1)}%</span></td>
      <td style="color:#78716c">$${d.rr.toFixed(1)}</td>
      <td style="color:#78716c">$${d.avg.toFixed(2)}</td>
      <td style="color:#78716c">$${d.need.toFixed(2)}</td>
      <td>${stepHtml}</td>
    </tr>`;
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}

// ── ② Gap to Plan ────────────────────────────────────────────────
function buildGapChart(canvas) {
  const gaps = [
    { l: 'Treasury Mgmt', g: sum(actM,'tm')     - sum(actM,'tm_b') },
    { l: 'Comm Loan II',  g: sum(actM,'commII') - sum(actM,'commII_b') },
    { l: 'PCARD',         g: sum(actM,'pc')     - sum(actM,'pc_b') },
    { l: 'Deposit IE*',   g: -(sum(actM,'depIE') - sum(actM,'depIE_b')) },  // inverted
    { l: 'Merchant',      g: sum(actM,'me')     - sum(actM,'me_b') },
    { l: 'Consumer II',   g: sum(actM,'consII') - sum(actM,'consII_b') },
    { l: 'Service Chg',   g: sum(actM,'sv')     - sum(actM,'sv_b') },
    { l: 'Other Fees',    g: sum(actM,'ot')     - sum(actM,'ot_b') },
  ].sort((a, b) => a.g - b.g);

  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: gaps.map(d => d.l),
      datasets: [{
        data: gaps.map(d => d.g),
        backgroundColor: gaps.map(d => d.g >= 0 ? COL.green + 'cc' : COL.red + 'cc'),
        borderRadius: 4, barThickness: 16,
      }]
    },
    options: {
      indexAxis: 'y',
      scales: {
        x: { grid: { color: '#eee', drawBorder: false }, ticks: { callback: v => (v >= 0 ? '+' : '') + v.toFixed(1) } },
        y: { grid: { display: false }, ticks: { font: { weight: 600, size: 11 } } }
      },
      plugins: { vertLine: false }
    }
  });
}

// ── ③ Cumulative Revenue ─────────────────────────────────────────
function buildCumulative(canvas) {
  let cA = 0, cB = 0;
  const cumAct = [], cumBgt = [], runProj = [];
  monthly.forEach((d, i) => {
    cB += d.bRev;
    cumBgt.push(cB);
    if (d.isA) {
      cA += d.flRev;
      cumAct.push(cA);
      runProj.push(null);
    } else {
      cumAct.push(null);
      runProj.push(cA + (cA / ACT) * (i - ACT + 1));
    }
  });

  return new Chart(canvas, {
    type: 'line',
    data: {
      labels: MONTHS,
      datasets: [
        { label: 'Budget',   data: cumBgt,  borderColor: COL.budget, backgroundColor: '#f1f3f5',     fill: true,  borderWidth: 2,   pointRadius: 0, tension: 0.1 },
        { label: 'Actual',   data: cumAct,  borderColor: COL.green,  backgroundColor: COL.green+'22', fill: true,  borderWidth: 3,   pointRadius: 5, pointBackgroundColor: COL.green, spanGaps: false, tension: 0.1 },
        { label: 'Run Rate', data: runProj, borderColor: COL.amber,                                    fill: false, borderWidth: 2.5, borderDash: [8,4], pointRadius: 0, spanGaps: false, tension: 0.1 },
      ]
    },
    options: {
      scales: {
        y: { min: 0, max: 115, grid: { color: '#eee', drawBorder: false }, ticks: { callback: v => '$' + v } },
        x: { grid: { display: false } }
      }
    }
  });
}

// ── ④ Run Rate Gauges ────────────────────────────────────────────
function buildGauges(container) {
  const lines = [
    { label: 'FL Revenue',    ytd: sum(actM,'flRev'),  fy: sum(monthly,'bRev') },
    { label: 'FL NII',        ytd: sum(actM,'flNII'),  fy: sum(monthly,'bNII') },
    { label: 'FL NIOI',       ytd: sum(actM,'flNIOI'), fy: sum(monthly,'bNIOI') },
    { label: 'Comm Loan II',  ytd: sum(actM,'commII'), fy: sum(monthly,'commII_b') },
    { label: 'Consumer II',   ytd: sum(actM,'consII'), fy: sum(monthly,'consII_b') },
    { label: 'Treasury Mgmt', ytd: sum(actM,'tm'),     fy: sum(monthly,'tm_b') },
  ].map(d => {
    const rr = (d.ytd / ACT) * 12;
    const pct = (rr / d.fy) * 100;
    const need = (d.fy - d.ytd) / (12 - ACT);
    const avg = d.ytd / ACT;
    const step = ((need - avg) / avg) * 100;
    return { ...d, rr, pct, need, avg, step, ok: pct >= 98 };
  });

  let html = '';
  lines.forEach(d => {
    const col = d.ok ? COL.green : COL.red;
    const bg = d.ok ? COL.greenBg : COL.redBg;
    const needCol = d.step > 2 ? COL.red : COL.green;
    html += `<div class="gauge">
      <div class="gauge-header">
        <span class="gauge-label">${d.label}</span>
        <div class="gauge-stats">
          <span>Avg/mo: <strong>$${d.avg.toFixed(2)}</strong></span>
          <span>Need/mo: <strong style="color:${needCol}">$${d.need.toFixed(2)}</strong></span>
          <span class="pct-badge" style="color:${col};background:${bg}">${d.pct.toFixed(1)}%</span>
        </div>
      </div>
      <div class="gauge-bar">
        <div class="gauge-fill" style="width:${Math.min(d.pct, 105)}%;background:${col}"></div>
        <div class="gauge-mark"></div>
      </div>
    </div>`;
  });
  container.innerHTML = html;
}

// ── ⑤ Commercial Loan Interest Income ────────────────────────────
function buildCommLoans(canvas) {
  const actData = monthly.map(d => d.isA ? d.commII : null);
  const bgtData = monthly.map(d => d.commII_b);
  const rollData = monthly.map((d, i) => {
    if (!d.isA) return null;
    if (i >= 2) return (monthly[i].commII + monthly[i-1].commII + monthly[i-2].commII) / 3;
    if (i === 1) return (monthly[0].commII + monthly[1].commII) / 2;
    return monthly[0].commII;
  });
  const actColors = monthly.map(d => d.isA ? COL.actual + 'cc' : 'transparent');
  const bgtColors = monthly.map(d => d.isA ? COL.budget + '33' : COL.budget + '1a');

  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: MONTHS,
      datasets: [
        { label: 'Budget',         data: bgtData,  backgroundColor: bgtColors, borderRadius: 3, barPercentage: 0.5, order: 2 },
        { label: 'Actual',         data: actData,  backgroundColor: actColors, borderRadius: 3, barPercentage: 0.5, order: 1 },
        { label: 'Budget Line',    data: bgtData,  type: 'line', borderColor: COL.budget, borderWidth: 1.5, pointRadius: 0, fill: false, order: 0 },
        { label: '3-Mo Rolling',   data: rollData, type: 'line', borderColor: COL.amber,  borderWidth: 2.5, borderDash: [6,3], pointRadius: 4, pointBackgroundColor: COL.amber, fill: false, spanGaps: false, order: 0 },
      ]
    },
    options: {
      scales: {
        y: { min: 13, max: 17.5, grid: { color: '#eee', drawBorder: false } },
        x: { grid: { display: false } }
      }
    }
  });
}

// ── ⑥ Deposits — Balance & Cost ──────────────────────────────────
function buildDeposits(canvas) {
  const balAct  = monthly.map(d => d.isA ? d.depBal : null);
  const balBgt  = monthly.map(d => d.depBal_b);
  const costAct = monthly.map(d => d.isA ? d.depCost : null);
  const costBgt = monthly.map(d => d.depCost_b);
  const barColors = monthly.map(d => d.isA ? COL.actual + 'b3' : 'transparent');

  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: MONTHS,
      datasets: [
        { label: 'Bal Actual',  data: balAct,  backgroundColor: barColors, borderRadius: 3, barPercentage: 0.45, yAxisID: 'y',  order: 2 },
        { label: 'Bal Budget',  data: balBgt,  type: 'line', borderColor: COL.budget, borderWidth: 2,   borderDash: [6,3], pointRadius: 0, fill: false, yAxisID: 'y',  order: 1 },
        { label: 'Cost Actual', data: costAct, type: 'line', borderColor: COL.red,    borderWidth: 2.5,                       pointRadius: 4, pointBackgroundColor: COL.red, fill: false, yAxisID: 'y1', spanGaps: false, order: 0 },
        { label: 'Cost Budget', data: costBgt, type: 'line', borderColor: COL.budget, borderWidth: 1.5, borderDash: [4,3], pointRadius: 0, fill: false, yAxisID: 'y1', order: 0 },
      ]
    },
    options: {
      scales: {
        y:  { min: 3700, max: 4300, position: 'left',  grid: { color: '#eee', drawBorder: false }, ticks: { callback: v => (v/1000).toFixed(1) + 'B' } },
        y1: { min: 3.2,  max: 3.6,  position: 'right', grid: { display: false },                    ticks: { callback: v => v + '%', color: COL.red } },
        x:  { grid: { display: false } }
      }
    }
  });
}

// ── ⑦ Commercial Loans — Balance, Yield, Spread ──────────────────
function buildCommBS(canvas) {
  const balAct = monthly.map(d => d.isA ? d.commBal : null);
  const balBgt = monthly.map(d => d.commBal_b);
  const yldAct = monthly.map(d => d.isA ? d.commYld : null);
  const yldBgt = monthly.map(d => d.commYld_b);
  const spdAct = monthly.map(d => d.isA ? d.commSpd : null);
  const spdBgt = monthly.map(d => d.commSpd_b);
  const barColors = monthly.map(d => d.isA ? COL.actual + '99' : 'transparent');

  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: MONTHS,
      datasets: [
        { label: 'Avg Bal',        data: balAct, backgroundColor: barColors, borderRadius: 3, barPercentage: 0.45, yAxisID: 'y',  order: 5 },
        { label: 'Bal Budget',     data: balBgt, type: 'line', borderColor: COL.budget,     borderWidth: 2,   borderDash: [6,3], pointRadius: 0, fill: false, yAxisID: 'y',  order: 4 },
        { label: 'Yield',          data: yldAct, type: 'line', borderColor: COL.teal,       borderWidth: 2.5,                       pointRadius: 4, pointBackgroundColor: COL.teal,   fill: false, yAxisID: 'y1', spanGaps: false, order: 0 },
        { label: 'Yield Budget',   data: yldBgt, type: 'line', borderColor: COL.teal+'66',  borderWidth: 1.5, borderDash: [4,3], pointRadius: 0, fill: false, yAxisID: 'y1', order: 1 },
        { label: 'Spread',         data: spdAct, type: 'line', borderColor: COL.purple,     borderWidth: 2.5,                       pointRadius: 4, pointBackgroundColor: COL.purple, fill: false, yAxisID: 'y1', spanGaps: false, order: 2 },
        { label: 'Spread Budget',  data: spdBgt, type: 'line', borderColor: COL.purple+'66',borderWidth: 1.5, borderDash: [4,3], pointRadius: 0, fill: false, yAxisID: 'y1', order: 3 },
      ]
    },
    options: {
      scales: {
        y:  { min: 2200, max: 2850, position: 'left',  grid: { color: '#eee', drawBorder: false } },
        y1: { min: 3.2,  max: 7.8,  position: 'right', grid: { display: false }, ticks: { callback: v => v + '%', color: COL.teal } },
        x:  { grid: { display: false } }
      }
    }
  });
}

// ── ⑧ NIOI Components ────────────────────────────────────────────
function buildNIOI(canvas) {
  const mkDs = (key, label, color) => ({
    label,
    data: monthly.map(d => d[key]),
    backgroundColor: monthly.map(d => d.isA ? color + 'dd' : color + '40'),
    borderRadius: 0,
    barPercentage: 0.7,
  });
  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: MONTHS,
      datasets: [
        mkDs('tm', 'Treasury Mgmt', '#1864ab'),
        mkDs('pc', 'PCARD',         '#2b8a3e'),
        mkDs('me', 'Merchant',      '#e67700'),
        mkDs('sv', 'Service Chg',   '#7048e8'),
        mkDs('ot', 'Other',         '#c92a2a'),
      ]
    },
    options: {
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, max: 3.5, grid: { color: '#eee', drawBorder: false } }
      }
    }
  });
}

// ── ⑨ Revenue Mix (NII + NIOI) ───────────────────────────────────
function buildRevMix(canvas) {
  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: MONTHS,
      datasets: [
        { label: 'FL NII',  data: monthly.map(d => d.flNII),  backgroundColor: monthly.map(d => d.isA ? COL.actual + 'dd' : COL.actual + '40'), barPercentage: 0.6 },
        { label: 'FL NIOI', data: monthly.map(d => d.flNIOI), backgroundColor: monthly.map(d => d.isA ? COL.purple + 'dd' : COL.purple + '40'), borderRadius: { topLeft: 3, topRight: 3 }, barPercentage: 0.6 },
        { label: 'Budget',  data: monthly.map(d => d.bRev),   type: 'line', borderColor: COL.budget, borderWidth: 2, borderDash: [6,3], pointRadius: 0, fill: false },
      ]
    },
    options: {
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, max: 12, grid: { color: '#eee', drawBorder: false } }
      }
    }
  });
}

// ── ⑩ Full Year Stack — YTD + Remaining ──────────────────────────
function buildFYStack(canvas) {
  const lines = [
    { l: 'FL Revenue',    y: sum(actM,'flRev'),  r: sum(remM,'bRev') },
    { l: 'FL NII',        y: sum(actM,'flNII'),  r: sum(remM,'bNII') },
    { l: 'FL NIOI',       y: sum(actM,'flNIOI'), r: sum(remM,'bNIOI') },
    { l: 'Comm II',       y: sum(actM,'commII'), r: sum(remM,'commII_b') },
    { l: 'Consumer II',   y: sum(actM,'consII'), r: sum(remM,'consII_b') },
    { l: 'Treasury Mgmt', y: sum(actM,'tm'),     r: sum(remM,'tm_b') },
  ];
  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: lines.map(d => d.l),
      datasets: [
        { label: 'YTD Actual', data: lines.map(d => d.y), backgroundColor: COL.actual + 'cc', borderRadius: 0, barPercentage: 0.55 },
        { label: 'Remaining',  data: lines.map(d => d.r), backgroundColor: COL.budget + '55', borderRadius: { topLeft: 4, topRight: 4 }, barPercentage: 0.55 },
      ]
    },
    options: {
      indexAxis: 'y',
      scales: {
        x: { stacked: true, grid: { color: '#eee', drawBorder: false } },
        y: { stacked: true, grid: { display: false }, ticks: { font: { weight: 600 } } }
      },
      plugins: { vertLine: false }
    }
  });
}
