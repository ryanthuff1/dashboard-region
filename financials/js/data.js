// ════════════════════════════════════════════════════════════════
// DATA — Financial performance metrics for South Central Region
//
// Hierarchy: Region → Market (Houston/Dallas) → Officer
//
// Data structure:
//   - Regional base numbers allocated to officers by share
//   - Market overlay for non-officer lines (consumer, deposits, etc.)
//   - First 6 months = actual (Jan-Jun 2026)
//   - Last 6 months = forecast (Jul-Dec 2026)
//
// Storyline:
//   - Started year soft (Q1 behind plan ~2-3%)
//   - Recovering in Q2 (May/Jun at or above plan)
//   - Forecast: gradual improvement through H2
//   - Houston slightly behind Dallas (officer mix + execution)
// ════════════════════════════════════════════════════════════════

// ── Regional base (starting point for officer allocation) ──────
const BASE = {
  // Commercial loan interest income ($ millions)
  commII:     [14.3, 14.6, 14.7, 15.0, 15.3, 15.5, 15.7, 15.9, 16.2, 16.4, 16.7, 16.9],
  // Commercial loan balances ($ millions)
  commBal:    [2410, 2445, 2470, 2500, 2535, 2560, 2590, 2620, 2650, 2680, 2710, 2740],
  // Commercial loan yield (%)
  commYld:    [7.12, 7.15, 7.15, 7.20, 7.22, 7.25, 7.28, 7.30, 7.32, 7.35, 7.38, 7.40],
  // Treasury management fees
  tm:         [0.8,  0.9,  0.9,  0.9,  1.0,  1.0,  1.0,  1.0,  1.1,  1.1,  1.1,  1.2],
  // P-card fees
  pcard:      [0.3,  0.3,  0.3,  0.4,  0.4,  0.4,  0.4,  0.4,  0.4,  0.4,  0.5,  0.5],
};

// ── Officer roster ─────────────────────────────────────────────
const officers = [
  // Houston (4 officers) — 53% of commercial book
  { id: 'h-reyes',    name: 'M. Reyes',    market: 'Houston', share: 0.19, adj: 0.97 },  // slightly behind
  { id: 'h-patel',    name: 'D. Patel',    market: 'Houston', share: 0.14, adj: 1.05 },  // ahead of plan
  { id: 'h-tran',     name: 'A. Tran',     market: 'Houston', share: 0.13, adj: 1.00 },  // on plan
  { id: 'h-williams', name: 'K. Williams', market: 'Houston', share: 0.07, adj: 0.82 },  // behind plan

  // Dallas (3 officers) — 47% of commercial book
  { id: 'd-chen',     name: 'R. Chen',     market: 'Dallas',  share: 0.21, adj: 1.01 },  // slightly ahead
  { id: 'd-garcia',   name: 'S. Garcia',   market: 'Dallas',  share: 0.16, adj: 0.91 },  // behind
  { id: 'd-foster',   name: 'B. Foster',   market: 'Dallas',  share: 0.10, adj: 1.00 },  // on plan
];

const markets = ['Houston', 'Dallas'];

// Precompute officer-level monthly arrays
officers.forEach(o => {
  o.raw = {};

  // Commercial interest income, balances, TM, P-card scale by officer share
  ['commII', 'commBal', 'tm', 'pcard'].forEach(k => {
    // Forecast (months 7-12)
    o.raw[`${k}_f`] = BASE[k].slice(ACT).map(v => v * o.share);

    // Actual (months 1-6) — apply performance adj + storyline
    o.raw[`${k}_a`] = BASE[k].slice(0, ACT).map((v, i) => {
      // Storyline: Q1 soft (98.5%), April recovery (99.2%), May/Jun at/above (100%, 100.5%)
      const storyline = [0.985, 0.987, 0.985, 0.992, 1.000, 1.005][i];
      return v * o.share * o.adj * storyline;
    });
  });

  // Yield doesn't scale by share (it's a rate), but varies by performance
  const yldDelta = (o.adj - 1) * 0.4;  // ±40bp for each ±1.00 of adj
  o.raw.commYld_f = BASE.commYld.slice(ACT).map(v => v + yldDelta);
  o.raw.commYld_a = BASE.commYld.slice(0, ACT).map((v, i) => {
    const storyline = [0.995, 0.997, 0.991, 0.998, 1.003, 1.005][i];
    return (v * storyline) + yldDelta;
  });
});

// ── Market overlay (non-officer-attributable lines) ────────────
const MARKET_SHARE = { Houston: 0.58, Dallas: 0.42 };

const MARKET_ADJ = {
  Houston: { vol: 0.97, costAdd: 0.04 },  // volumes 3% behind, deposit cost 4bp over plan
  Dallas:  { vol: 0.99, costAdd: 0.02 },  // closer to plan
};

const NON_OFFICER_BASE = {
  // Consumer loan interest income
  consII:   [4.3, 4.3, 4.4, 4.4, 4.5, 4.5, 4.6, 4.6, 4.7, 4.7, 4.8, 4.8],
  // Deposit interest expense
  depIE:    [11.0, 11.2, 11.2, 11.3, 11.3, 11.3, 11.3, 11.3, 11.3, 11.4, 11.4, 11.4],
  // Deposit balances
  depBal:   [3840, 3870, 3900, 3930, 3960, 3990, 4020, 4050, 4080, 4110, 4140, 4170],
  // Deposit cost (%)
  depCost:  [3.44, 3.46, 3.45, 3.44, 3.42, 3.40, 3.38, 3.36, 3.34, 3.32, 3.30, 3.28],
  // Allocations (overhead, FTP, etc.)
  alloc:    [2.1, 2.1, 2.2, 2.2, 2.2, 2.3, 2.3, 2.3, 2.4, 2.4, 2.4, 2.5],
  // Merchant fees
  merchant: [0.2, 0.2, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.4],
  // Service charges
  service:  [0.5, 0.5, 0.5, 0.5, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.7, 0.7],
  // Other fees
  other:    [0.4, 0.3, 0.4, 0.4, 0.4, 0.5, 0.4, 0.5, 0.5, 0.5, 0.5, 0.6],
};

function buildMarketOverlay(market) {
  const share = MARKET_SHARE[market];
  const { vol, costAdd } = MARKET_ADJ[market];
  const o = {};

  ['consII', 'depIE', 'depBal', 'alloc', 'merchant', 'service', 'other'].forEach(k => {
    o[`${k}_f`] = NON_OFFICER_BASE[k].slice(ACT).map(v => v * share);
    o[`${k}_a`] = NON_OFFICER_BASE[k].slice(0, ACT).map(v => v * share * vol);
  });

  // Deposit cost is a rate, add basis points
  o.depCost_f = NON_OFFICER_BASE.depCost.slice(ACT).map(v => v + costAdd);
  o.depCost_a = NON_OFFICER_BASE.depCost.slice(0, ACT).map(v => v + costAdd);

  return o;
}

const marketOverlay = {
  Houston: buildMarketOverlay('Houston'),
  Dallas:  buildMarketOverlay('Dallas'),
};

// ── Aggregation helpers ────────────────────────────────────────
const sumArr = (arrs) => arrs[0].map((_, i) => arrs.reduce((s, a) => s + a[i], 0));

function weightedAvg(valsArr, weightsArr, length) {
  const out = [];
  for (let i = 0; i < length; i++) {
    let wsum = 0, vsum = 0;
    for (let j = 0; j < valsArr.length; j++) {
      wsum += weightsArr[j][i];
      vsum += valsArr[j][i] * weightsArr[j][i];
    }
    out.push(wsum > 0 ? vsum / wsum : 0);
  }
  return out;
}

// ── buildRaw(scope) ────────────────────────────────────────────
function buildRaw(scope) {
  let officersInScope, marketKeys;

  if (scope.level === 'region') {
    officersInScope = officers;
    marketKeys = markets;
  } else if (scope.level === 'market') {
    officersInScope = officers.filter(o => o.market === scope.market);
    marketKeys = [scope.market];
  } else {  // officer
    const o = officers.find(o => o.id === scope.officerId);
    officersInScope = o ? [o] : [];
    marketKeys = [];
  }

  const raw = {};

  // Officer-attributable lines
  ['commII', 'commBal', 'tm', 'pcard'].forEach(k => {
    raw[`${k}_f`] = officersInScope.length ? sumArr(officersInScope.map(o => o.raw[`${k}_f`])) : Array(6).fill(0);
    raw[`${k}_a`] = officersInScope.length ? sumArr(officersInScope.map(o => o.raw[`${k}_a`])) : Array(6).fill(0);
  });

  raw.commYld_f = officersInScope.length
    ? weightedAvg(officersInScope.map(o => o.raw.commYld_f), officersInScope.map(o => o.raw.commBal_f), 6)
    : Array(6).fill(0);
  raw.commYld_a = officersInScope.length
    ? weightedAvg(officersInScope.map(o => o.raw.commYld_a), officersInScope.map(o => o.raw.commBal_a), 6)
    : Array(6).fill(0);

  // Market overlay lines
  ['consII', 'depIE', 'depBal', 'alloc', 'merchant', 'service', 'other'].forEach(k => {
    raw[`${k}_f`] = marketKeys.length ? sumArr(marketKeys.map(m => marketOverlay[m][`${k}_f`])) : Array(6).fill(0);
    raw[`${k}_a`] = marketKeys.length ? sumArr(marketKeys.map(m => marketOverlay[m][`${k}_a`])) : Array(6).fill(0);
  });

  raw.depCost_f = marketKeys.length
    ? weightedAvg(marketKeys.map(m => marketOverlay[m].depCost_f), marketKeys.map(m => marketOverlay[m].depBal_f), 6)
    : Array(6).fill(0);
  raw.depCost_a = marketKeys.length
    ? weightedAvg(marketKeys.map(m => marketOverlay[m].depCost_a), marketKeys.map(m => marketOverlay[m].depBal_a), 6)
    : Array(6).fill(0);

  // Spread = Loan Yield - Deposit Cost
  raw.commSpd_f = raw.commYld_f.map((y, i) => y - raw.depCost_f[i]);
  raw.commSpd_a = raw.commYld_a.map((y, i) => y - raw.depCost_a[i]);

  return raw;
}

// ── buildMonthly(raw) ──────────────────────────────────────────
const pick = (a_arr, f_arr, i) => i < ACT ? a_arr[i] : f_arr[i - ACT];

function buildMonthly(raw) {
  return MONTHS.map((m, i) => {
    const isA = i < ACT;
    const suffix = isA ? '_a' : '_f';
    const idx = isA ? i : i - ACT;

    const commII = pick(raw.commII_a, raw.commII_f, i);
    const consII = pick(raw.consII_a, raw.consII_f, i);
    const depIE  = pick(raw.depIE_a,  raw.depIE_f,  i);
    const alloc  = pick(raw.alloc_a,  raw.alloc_f,  i);
    const netII  = commII + consII - depIE - alloc;  // Net Interest Income

    const tm       = pick(raw.tm_a,       raw.tm_f,       i);
    const pcard    = pick(raw.pcard_a,    raw.pcard_f,    i);
    const merchant = pick(raw.merchant_a, raw.merchant_f, i);
    const service  = pick(raw.service_a,  raw.service_f,  i);
    const other    = pick(raw.other_a,    raw.other_f,    i);
    const netFee   = tm + pcard + merchant + service + other;  // Non-Interest Income

    return {
      month: m,
      isA,
      // Income statement components
      commII, consII, depIE, alloc, netII,
      tm, pcard, merchant, service, other, netFee,
      totalRev: netII + netFee,
      // Balance sheet
      commBal:  pick(raw.commBal_a,  raw.commBal_f,  i),
      depBal:   pick(raw.depBal_a,   raw.depBal_f,   i),
      // Rates
      commYld:  pick(raw.commYld_a,  raw.commYld_f,  i),
      depCost:  pick(raw.depCost_a,  raw.depCost_f,  i),
      commSpd:  pick(raw.commSpd_a,  raw.commSpd_f,  i),
    };
  });
}

// ── Mutable state ──────────────────────────────────────────────
let monthly = [];
let actM = [];
let fctM = [];

function recompute(scope) {
  const raw = buildRaw(scope);
  monthly = buildMonthly(raw);
  actM = monthly.filter(d => d.isA);
  fctM = monthly.filter(d => !d.isA);
}

const sum = (arr, k) => arr.reduce((s, d) => s + (d[k] || 0), 0);
const avg = (arr, k) => sum(arr, k) / arr.length;

// Initialize at region level
recompute({ level: 'region' });
