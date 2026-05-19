// ════════════════════════════════════════════════════════════════
// CHART BUILDERS — Financial dashboard visualizations
// ════════════════════════════════════════════════════════════════

const fmt = v => v.toFixed(1);
const fmtPct = v => v.toFixed(2) + '%';

// ── ① Scorecard Table ──────────────────────────────────────────
function buildScorecard(container) {
  const ytdA = sum(actM, 'totalRev');
  const fyF = sum(monthly, 'totalRev');

  const lines = [
    { lbl: 'Total Revenue',     ytd: ytdA,                  fy: fyF },
    { lbl: 'Net Interest Inc',  ytd: sum(actM, 'netII'),   fy: sum(monthly, 'netII') },
    { lbl: 'Net Fee Income',    ytd: sum(actM, 'netFee'),  fy: sum(monthly, 'netFee') },
    { lbl: '  Comm Loan II',    ytd: sum(actM, 'commII'),  fy: sum(monthly, 'commII'), indent: true },
    { lbl: '  Consumer II',     ytd: sum(actM, 'consII'),  fy: sum(monthly, 'consII'), indent: true },
    { lbl: '  Deposit IE',      ytd: sum(actM, 'depIE'),   fy: sum(monthly, 'depIE'),  indent: true, inv: true },
    { lbl: '  Treasury Mgmt',   ytd: sum(actM, 'tm'),      fy: sum(monthly, 'tm'),     indent: true },
    { lbl: '  P-Card',          ytd: sum(actM, 'pcard'),   fy: sum(monthly, 'pcard'),  indent: true },
    { lbl: '  Merchant',        ytd: sum(actM, 'merchant'),fy: sum(monthly, 'merchant'), indent: true },
    { lbl: '  Service',         ytd: sum(actM, 'service'), fy: sum(monthly, 'service'), indent: true },
    { lbl: '  Other',           ytd: sum(actM, 'other'),   fy: sum(monthly, 'other'),  indent: true },
  ].filter(d => Math.abs(d.ytd) > 0.001 || Math.abs(d.fy) > 0.001);

  let html = `<table class="sc-table"><thead><tr>
    <th></th><th style="text-align:left">Metric</th>
    <th>YTD Act<br>(6 mo)</th><th>Full Year<br>Fcast</th>
    <th>Run Rate</th><th>Avg/Mo</th><th>Need/Mo</th>
  </tr></thead><tbody>`;

  lines.forEach(d => {
    const runRate = (d.ytd / ACT) * 12;
    const avgMo = d.ytd / ACT;
    const needMo = (d.fy - d.ytd) / (12 - ACT);
    const gap = runRate - d.fy;
    const gapPct = (gap / d.fy) * 100;
    const status = gapPct > -2 ? 'g' : gapPct > -5 ? 'a' : 'r';
    const statusColor = status === 'g' ? COL.green : status === 'a' ? COL.amber : COL.red;
    const icon = status === 'g' ? '●' : status === 'a' ? '▲' : '▼';

    const lblPadding = d.indent ? 'padding-left:20px' : '';
    const rowClass = status === 'r' ? ' class="red-row"' : '';

    html += `<tr${rowClass}>
      <td style="color:${statusColor}">${icon}</td>
      <td style="${lblPadding}">${d.lbl}</td>
      <td>$${fmt(d.ytd)}M</td>
      <td style="color:#78716c">$${fmt(d.fy)}M</td>
      <td style="color:${statusColor};font-weight:700">$${fmt(runRate)}M</td>
      <td style="color:#78716c">$${fmt(avgMo)}M</td>
      <td style="color:#78716c">$${fmt(needMo)}M</td>
    </tr>`;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

// ── ② Revenue Trend (Actual + Forecast) ───────────────────────
function buildRevenueTrend(canvas) {
  return new Chart(canvas, {
    type: 'line',
    data: {
      labels: MONTHS,
      datasets: [
        {
          label: 'Actual',
          data: monthly.map(d => d.isA ? d.totalRev : null),
          borderColor: COL.actual,
          backgroundColor: COL.actualFade,
          pointRadius: 4,
          pointBackgroundColor: COL.actual,
          borderWidth: 3,
          fill: true,
          tension: 0.3,
        },
        {
          label: 'Forecast',
          data: monthly.map(d => !d.isA ? d.totalRev : null),
          borderColor: COL.forecast,
          backgroundColor: COL.forecastFade,
          pointRadius: 4,
          pointBackgroundColor: COL.forecast,
          borderWidth: 2,
          borderDash: [5, 5],
          fill: true,
          tension: 0.3,
        }
      ]
    },
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: $${ctx.parsed.y.toFixed(1)}M`,
          }
        },
        legend: { display: true, position: 'top', align: 'end' }
      },
      scales: {
        y: { beginAtZero: false, title: { display: true, text: '$ Millions' } }
      }
    }
  });
}

// ── ③ Net Interest Income vs Fee Income ───────────────────────
function buildIncomeComparison(canvas) {
  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: MONTHS,
      datasets: [
        {
          label: 'Net Interest Income',
          data: monthly.map(d => d.netII),
          backgroundColor: COL.actual + 'dd',
          borderRadius: 4,
        },
        {
          label: 'Net Fee Income',
          data: monthly.map(d => d.netFee),
          backgroundColor: COL.purple + 'dd',
          borderRadius: 4,
        }
      ]
    },
    options: {
      plugins: {
        legend: { display: true, position: 'top' },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: $${ctx.parsed.y.toFixed(1)}M`
          }
        }
      },
      scales: {
        x: { stacked: true },
        y: { stacked: true, title: { display: true, text: '$ Millions' } }
      }
    }
  });
}

// ── ④ Commercial Loan Balances ────────────────────────────────
function buildLoanBalances(canvas) {
  return new Chart(canvas, {
    type: 'line',
    data: {
      labels: MONTHS,
      datasets: [
        {
          label: 'Actual',
          data: monthly.map(d => d.isA ? d.commBal : null),
          borderColor: COL.actual,
          backgroundColor: COL.actualFade,
          pointRadius: 4,
          borderWidth: 3,
          fill: true,
          tension: 0.3,
        },
        {
          label: 'Forecast',
          data: monthly.map(d => !d.isA ? d.commBal : null),
          borderColor: COL.forecast,
          backgroundColor: COL.forecastFade,
          pointRadius: 4,
          borderWidth: 2,
          borderDash: [5, 5],
          fill: true,
          tension: 0.3,
        }
      ]
    },
    options: {
      plugins: {
        legend: { display: true, position: 'top', align: 'end' },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: $${ctx.parsed.y.toFixed(0)}M`
          }
        }
      },
      scales: {
        y: { beginAtZero: false, title: { display: true, text: '$ Millions' } }
      }
    }
  });
}

// ── ⑤ Deposit Balances ─────────────────────────────────────────
function buildDepositBalances(canvas) {
  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: MONTHS,
      datasets: [
        {
          label: 'Deposits',
          data: monthly.map(d => d.depBal),
          backgroundColor: monthly.map(d => d.isA ? COL.teal + 'dd' : COL.teal + '77'),
          borderRadius: 4,
        }
      ]
    },
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => `Deposits: $${ctx.parsed.y.toFixed(0)}M`
          }
        }
      },
      scales: {
        y: { beginAtZero: false, title: { display: true, text: '$ Millions' } }
      }
    }
  });
}

// ── ⑥ Loan Yield and Deposit Cost ─────────────────────────────
function buildRates(canvas) {
  return new Chart(canvas, {
    type: 'line',
    data: {
      labels: MONTHS,
      datasets: [
        {
          label: 'Loan Yield',
          data: monthly.map(d => d.commYld),
          borderColor: COL.green,
          backgroundColor: COL.green + '33',
          pointRadius: 4,
          borderWidth: 3,
          yAxisID: 'y',
          tension: 0.3,
        },
        {
          label: 'Deposit Cost',
          data: monthly.map(d => d.depCost),
          borderColor: COL.red,
          backgroundColor: COL.red + '33',
          pointRadius: 4,
          borderWidth: 3,
          yAxisID: 'y',
          tension: 0.3,
        },
        {
          label: 'Spread',
          data: monthly.map(d => d.commSpd),
          borderColor: COL.actual,
          backgroundColor: COL.actualFade,
          pointRadius: 5,
          pointStyle: 'rect',
          borderWidth: 2,
          yAxisID: 'y',
          tension: 0.3,
        }
      ]
    },
    options: {
      plugins: {
        legend: { display: true, position: 'top' },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}%`
          }
        }
      },
      scales: {
        y: {
          type: 'linear',
          position: 'left',
          title: { display: true, text: 'Rate (%)' },
          ticks: { callback: v => v.toFixed(2) + '%' }
        }
      }
    }
  });
}

// ── ⑦ Fee Income Breakdown ─────────────────────────────────────
function buildFeeBreakdown(canvas) {
  const fees = [
    { label: 'Treasury Mgmt', value: sum(actM, 'tm'), color: COL.actual },
    { label: 'P-Card', value: sum(actM, 'pcard'), color: COL.purple },
    { label: 'Merchant', value: sum(actM, 'merchant'), color: COL.teal },
    { label: 'Service', value: sum(actM, 'service'), color: COL.amber },
    { label: 'Other', value: sum(actM, 'other'), color: COL.forecast },
  ].filter(d => Math.abs(d.value) > 0.001);

  return new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: fees.map(d => d.label),
      datasets: [{
        data: fees.map(d => d.value),
        backgroundColor: fees.map(d => d.color + 'dd'),
        borderWidth: 2,
        borderColor: '#fff',
      }]
    },
    options: {
      plugins: {
        legend: { display: true, position: 'right' },
        tooltip: {
          callbacks: {
            label: ctx => {
              const total = fees.reduce((s, f) => s + f.value, 0);
              const pct = (ctx.parsed / total * 100).toFixed(1);
              return `${ctx.label}: $${ctx.parsed.toFixed(2)}M (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

// ── ⑧ Commercial Loan Interest Income ─────────────────────────
function buildCommII(canvas) {
  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: MONTHS,
      datasets: [{
        label: 'Comm Loan II',
        data: monthly.map(d => d.commII),
        backgroundColor: monthly.map(d => d.isA ? COL.green + 'dd' : COL.green + '77'),
        borderRadius: 4,
      }]
    },
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => `Comm II: $${ctx.parsed.y.toFixed(1)}M`
          }
        }
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: '$ Millions' } }
      }
    }
  });
}

// ── ⑨ Officer Comparison (if market/region) ───────────────────
function buildOfficerComparison(canvas) {
  const scope = currentScope;
  let compareOfficers = [];

  if (scope.level === 'region') {
    compareOfficers = officers;
  } else if (scope.level === 'market') {
    compareOfficers = officers.filter(o => o.market === scope.market);
  } else {
    return null;  // No comparison at officer level
  }

  const data = compareOfficers.map(o => {
    recompute({ level: 'officer', officerId: o.id });
    const ytd = sum(actM, 'totalRev');
    recompute(scope);  // restore
    return { name: o.name, ytd, adj: o.adj };
  }).sort((a, b) => b.ytd - a.ytd);

  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: data.map(d => d.name),
      datasets: [{
        label: 'YTD Revenue',
        data: data.map(d => d.ytd),
        backgroundColor: data.map(d => {
          if (d.adj >= 1.00) return COL.green + 'dd';
          if (d.adj >= 0.95) return COL.amber + 'dd';
          return COL.red + 'dd';
        }),
        borderRadius: 4,
      }]
    },
    options: {
      indexAxis: 'y',
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.label}: $${ctx.parsed.x.toFixed(1)}M YTD`
          }
        }
      },
      scales: {
        x: { title: { display: true, text: '$ Millions YTD' } }
      },
      onClick: (evt, elems) => {
        if (elems.length > 0) {
          const idx = elems[0].index;
          const officer = compareOfficers.find(o => o.name === data[idx].name);
          if (officer) drillTo({ level: 'officer', officerId: officer.id, officerName: officer.name, market: officer.market });
        }
      }
    }
  });
}

// ── ⑩ Market Comparison (if region level) ─────────────────────
function buildMarketComparison(canvas) {
  if (currentScope.level !== 'region') return null;

  const marketData = markets.map(m => {
    recompute({ level: 'market', market: m });
    const ytd = sum(actM, 'totalRev');
    recompute(currentScope);  // restore
    return { market: m, ytd };
  });

  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels: marketData.map(d => d.market),
      datasets: [{
        label: 'YTD Revenue',
        data: marketData.map(d => d.ytd),
        backgroundColor: [COL.actual + 'dd', COL.teal + 'dd'],
        borderRadius: 4,
      }]
    },
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.label}: $${ctx.parsed.y.toFixed(1)}M YTD`
          }
        }
      },
      scales: {
        y: { title: { display: true, text: '$ Millions YTD' } }
      },
      onClick: (evt, elems) => {
        if (elems.length > 0) {
          const idx = elems[0].index;
          const market = marketData[idx].market;
          drillTo({ level: 'market', market });
        }
      }
    }
  });
}

// ── ⑪ Run Rate Gauges ──────────────────────────────────────────
function buildRunRateGauges(container) {
  const metrics = [
    { label: 'Total Revenue', actual: sum(actM, 'totalRev'), forecast: sum(monthly, 'totalRev') },
    { label: 'Net Interest Income', actual: sum(actM, 'netII'), forecast: sum(monthly, 'netII') },
    { label: 'Net Fee Income', actual: sum(actM, 'netFee'), forecast: sum(monthly, 'netFee') },
  ];

  let html = '';
  metrics.forEach(m => {
    const runRate = (m.actual / ACT) * 12;
    const gap = runRate - m.forecast;
    const gapPct = (gap / m.forecast) * 100;
    const pct = (runRate / m.forecast) * 100;
    const fillPct = Math.min(pct, 120);
    const color = gapPct >= -2 ? COL.green : gapPct >= -5 ? COL.amber : COL.red;
    const badge = gapPct >= -2 ? 'On Track' : gapPct >= -5 ? 'Warning' : 'Behind';
    const badgeBg = gapPct >= -2 ? COL.greenBg : gapPct >= -5 ? COL.amberBg : COL.redBg;

    html += `<div class="gauge">
      <div class="gauge-header">
        <div class="gauge-label">${m.label}</div>
        <div class="gauge-stats">
          <span>Run Rate: <strong>$${runRate.toFixed(1)}M</strong></span>
          <span>vs Fcast: <strong style="color:${color}">${gap >= 0 ? '+' : ''}$${gap.toFixed(1)}M</strong></span>
          <span class="pct-badge" style="background:${badgeBg};color:${color}">${badge}</span>
        </div>
      </div>
      <div class="gauge-bar">
        <div class="gauge-fill" style="width:${fillPct}%;background:${color}"></div>
        <div class="gauge-mark"></div>
      </div>
    </div>`;
  });

  container.innerHTML = html;
}
