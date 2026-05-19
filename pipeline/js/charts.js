// ════════════════════════════════════════════════════════════════
// CHART BUILDERS — one function per card. Read `deals` and `scope`
// globals (set by recompute() in main.js before each render).
// ════════════════════════════════════════════════════════════════

const fmt$M = v => '$' + (v / 1e6).toFixed(2) + 'M';
const fmt$K = v => '$' + (v / 1e3).toFixed(0) + 'K';
const fmt$  = v => Math.abs(v) >= 1e6 ? fmt$M(v) : Math.abs(v) >= 1e3 ? fmt$K(v) : '$' + v.toFixed(0);
const fmtPct = v => (v * 100).toFixed(0) + '%';

// ── ① Scorecard ──────────────────────────────────────────────────
function buildScorecard(container) {
  const rows = metricsByProduct(deals);
  const m    = pipelineMetrics(deals);
  const gap  = gapForScope(scope) * 1e6;  // gap in $ (input is $M)
  const coverage = gap > 0 ? m.weightedRev / gap : 0;
  const covCol = coverage >= COVERAGE_TARGET ? COL.green : coverage >= COVERAGE_WARN ? COL.amber : COL.red;
  const covBg  = coverage >= COVERAGE_TARGET ? COL.greenBg : coverage >= COVERAGE_WARN ? COL.amberBg : COL.redBg;

  let html = `<table class="sc-table"><thead><tr>
    <th>Product</th><th># Open</th><th>Balance / Annual</th><th>Annual Rev</th>
    <th>Weighted Rev</th><th>Avg Prob</th><th>Closed YTD</th>
  </tr></thead><tbody>`;

  rows.forEach(r => {
    const isFee = r.product === 'TM' || r.product === 'Other';
    html += `<tr>
      <td style="color:${PRODUCT_COL[r.product]};font-weight:700">${PRODUCT_LABEL[r.product]}</td>
      <td>${r.count}</td>
      <td style="color:#78716c">${isFee ? fmt$(r.balance) + '/yr' : fmt$(r.balance)}</td>
      <td>${fmt$(r.revAnnual)}</td>
      <td style="font-weight:700">${fmt$(r.weightedRev)}</td>
      <td style="color:#78716c">${fmtPct(r.avgProb)}</td>
      <td style="color:${COL.green}">${fmt$(r.closedRev)}</td>
    </tr>`;
  });

  html += `<tr style="border-top:2px solid #212529;font-weight:700">
    <td>TOTAL</td>
    <td>${m.openCount}</td>
    <td style="color:#78716c">—</td>
    <td>${fmt$(m.totalRev)}</td>
    <td>${fmt$(m.weightedRev)}</td>
    <td style="color:#78716c">—</td>
    <td style="color:${COL.green}">${fmt$(m.closedRev)}</td>
  </tr>`;
  html += '</tbody></table>';

  html += `<div class="coverage-strip">
    <div class="cov-block">
      <div class="cov-label">Revenue Gap to Budget</div>
      <div class="cov-val">${fmt$(gap)}</div>
    </div>
    <div class="cov-block">
      <div class="cov-label">Weighted Pipeline</div>
      <div class="cov-val">${fmt$(m.weightedRev)}</div>
    </div>
    <div class="cov-block">
      <div class="cov-label">Coverage Ratio</div>
      <div class="cov-val" style="color:${covCol}">${coverage.toFixed(2)}x</div>
      <div class="cov-sub" style="background:${covBg};color:${covCol}">target ≥ ${COVERAGE_TARGET.toFixed(1)}x</div>
    </div>
  </div>`;

  container.innerHTML = html;
}

// ── ② Coverage Bar ───────────────────────────────────────────────
// Horizontal bar: weighted pipeline vs target multiples of gap.
function buildCoverage(canvas) {
  const m = pipelineMetrics(deals);
  const gap = gapForScope(scope) * 1e6;
  const target1x = gap;
  const target3x = gap * COVERAGE_TARGET;

  const xMax = Math.max(target3x * 1.10, m.weightedRev * 1.10);

  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ['Weighted Pipeline'],
      datasets: [{
        data: [m.weightedRev],
        backgroundColor: m.weightedRev >= target3x ? COL.green + 'cc'
                       : m.weightedRev >= target1x * COVERAGE_WARN ? COL.amber + 'cc'
                       : COL.red + 'cc',
        borderRadius: 4,
        barThickness: 36,
      }],
    },
    options: {
      indexAxis: 'y',
      scales: {
        x: {
          min: 0, max: xMax,
          grid: { color: '#eee', drawBorder: false },
          ticks: { callback: v => fmt$(v) },
        },
        y: { grid: { display: false } },
      },
      plugins: {
        vertLine: false,
        tooltip: { callbacks: {
          label: ctx => `Weighted: ${fmt$(ctx.parsed.x)}  ·  Coverage: ${(ctx.parsed.x / gap).toFixed(2)}x`,
        }},
        // Inline annotation via afterDraw plugin
        annot: false,
      },
    },
    plugins: [{
      id: 'covTargets',
      afterDatasetsDraw(chart) {
        const { ctx, chartArea, scales } = chart;
        const drawLine = (x, color, label) => {
          const px = scales.x.getPixelForValue(x);
          if (px < chartArea.left || px > chartArea.right) return;
          ctx.save();
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.moveTo(px, chartArea.top);
          ctx.lineTo(px, chartArea.bottom);
          ctx.stroke();
          ctx.fillStyle = color;
          ctx.font = '600 10px system-ui';
          ctx.fillText(label, px + 4, chartArea.top + 12);
          ctx.restore();
        };
        drawLine(target1x, COL.amber, '1x (gap)');
        drawLine(target3x, COL.green, `${COVERAGE_TARGET.toFixed(1)}x (target)`);
      },
    }],
  });
}

// ── ③ Stage Funnel — $ at each stage ─────────────────────────────
function buildStageFunnel(canvas) {
  const rev      = sumRevByStage(deals, false);
  const revW     = sumRevByStage(deals, true);
  const counts   = countByStage(deals);
  const labels   = OPEN_STAGES;
  const revArr   = labels.map(s => rev[s]);
  const revWArr  = labels.map(s => revW[s]);
  const colors   = labels.map(s => STAGE_COL[s]);

  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Annual Rev', data: revArr,
          backgroundColor: colors.map(c => c + '55'),
          borderRadius: 4, barPercentage: 0.7,
        },
        {
          label: 'Weighted', data: revWArr,
          backgroundColor: colors.map(c => c + 'cc'),
          borderRadius: 4, barPercentage: 0.7,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      scales: {
        x: { grid: { color: '#eee', drawBorder: false }, ticks: { callback: v => fmt$(v) } },
        y: { grid: { display: false }, ticks: { font: { weight: 600 } } },
      },
      plugins: {
        vertLine: false,
        tooltip: { callbacks: {
          afterLabel: ctx => `${counts[ctx.label]} deals`,
        }},
      },
    },
  });
}

// ── ④ Aging Buckets ──────────────────────────────────────────────
function buildAging(canvas) {
  const buckets = agingBuckets(deals);
  const bucketCol = ['#2b8a3e', '#94d82d', '#e67700', '#c92a2a'];

  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: buckets.map(b => b.label + ' days'),
      datasets: [
        {
          label: 'Deals',
          data: buckets.map(b => b.count),
          backgroundColor: bucketCol.map(c => c + 'cc'),
          borderRadius: 4, barPercentage: 0.65,
          yAxisID: 'y',
        },
        {
          label: 'Weighted Rev',
          data: buckets.map(b => b.revWeighted),
          type: 'line',
          borderColor: COL.actual,
          backgroundColor: COL.actual + '22',
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: COL.actual,
          fill: false,
          yAxisID: 'y1',
        },
      ],
    },
    options: {
      scales: {
        x: { grid: { display: false }, ticks: { font: { weight: 600 } } },
        y:  { position: 'left',  grid: { color: '#eee', drawBorder: false }, ticks: { stepSize: 1, callback: v => v + ' deals' } },
        y1: { position: 'right', grid: { display: false }, ticks: { callback: v => fmt$(v), color: COL.actual } },
      },
      plugins: { vertLine: false },
    },
  });
}

// ── ⑤ Weighted Pipeline by Product ───────────────────────────────
function buildByProduct(canvas) {
  const rows = metricsByProduct(deals).filter(r => r.weightedRev > 0);
  return new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: rows.map(r => PRODUCT_LABEL[r.product]),
      datasets: [{
        data: rows.map(r => r.weightedRev),
        backgroundColor: rows.map(r => PRODUCT_COL[r.product] + 'd9'),
        borderColor: '#fff',
        borderWidth: 2,
      }],
    },
    options: {
      cutout: '55%',
      plugins: {
        vertLine: false,
        legend: {
          display: true, position: 'right',
          labels: { boxWidth: 12, padding: 8, font: { size: 11 } },
        },
        tooltip: { callbacks: {
          label: ctx => `${ctx.label}: ${fmt$(ctx.parsed)}`,
        }},
      },
    },
  });
}

// ── ⑥ RM Ranking (region/market only) ────────────────────────────
let onOfficerClick = null;

function buildRMRanking(canvas) {
  // At region scope: rank all officers. At market scope: only that market.
  const filterFn = scope.level === 'market'
    ? (r => r.market === scope.market)
    : (() => true);
  const rows = rankByOfficer(deals).filter(filterFn);

  const ch = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: rows.map(r => `${r.name}  ·  ${r.market}`),
      datasets: [
        {
          label: 'Weighted Rev',
          data: rows.map(r => r.weightedRev),
          backgroundColor: COL.actual + 'cc',
          borderRadius: 4, barPercentage: 0.7,
        },
        {
          label: 'Total Annual Rev',
          data: rows.map(r => r.totalRev),
          backgroundColor: COL.budget + '55',
          borderRadius: 4, barPercentage: 0.7,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      onClick: (e, els) => {
        if (els.length && onOfficerClick) onOfficerClick(rows[els[0].index].id);
      },
      onHover: (e, els) => {
        e.native.target.style.cursor = els.length ? 'pointer' : 'default';
      },
      scales: {
        x: { grid: { color: '#eee', drawBorder: false }, ticks: { callback: v => fmt$(v) } },
        y: { grid: { display: false }, ticks: { font: { weight: 600 } } },
      },
      plugins: {
        vertLine: false,
        tooltip: { callbacks: {
          afterLabel: ctx => {
            if (ctx.datasetIndex === 0) {
              const r = rows[ctx.dataIndex];
              return [`${r.openCount} open deals`, 'Click to drill into officer →'];
            }
            return null;
          },
        }},
      },
    },
  });
  return ch;
}

// ── ⑦ Top Deals table ────────────────────────────────────────────
function buildTopDeals(container) {
  const rows = topDeals(deals, 10);
  if (rows.length === 0) {
    container.innerHTML = '<p style="color:#78716c;font-size:11px;padding:8px">No open deals in scope.</p>';
    return;
  }

  let html = `<table class="deals-table"><thead><tr>
    <th>Customer</th><th>RM</th><th>Product</th><th>Stage</th>
    <th>Balance</th><th>Prob</th><th>Weighted Rev</th><th>Days</th>
  </tr></thead><tbody>`;

  rows.forEach(d => {
    const rm = officers.find(o => o.id === d.officerId);
    const daysCol = d.daysInStage > 90 ? COL.red : d.daysInStage > 60 ? COL.amber : '#78716c';
    html += `<tr>
      <td style="font-weight:600">${d.customer}</td>
      <td style="color:#78716c">${rm ? rm.name : '?'}</td>
      <td><span class="prod-tag" style="background:${PRODUCT_COL[d.product]}22;color:${PRODUCT_COL[d.product]}">${PRODUCT_LABEL[d.product]}</span></td>
      <td><span class="stage-tag" style="background:${STAGE_COL[d.stage]}22;color:${STAGE_COL[d.stage]}">${d.stage}</span></td>
      <td style="color:#78716c">${fmt$(d.amount)}</td>
      <td style="color:#78716c">${fmtPct(d.probability)}</td>
      <td style="font-weight:700">${fmt$(d.weightedRev)}</td>
      <td style="color:${daysCol};font-weight:${d.daysInStage > 90 ? 700 : 400}">${d.daysInStage}</td>
    </tr>`;
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}
