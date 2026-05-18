// ════════════════════════════════════════════════════════════════
// DATA — officer-level inputs, market overlays, scope aggregation
//
// Hierarchy: Region → Market (Houston/Dallas) → Officer
//
// Two data sources:
//   1. `officers[]` — officer-attributable lines (comm loan II, balance,
//      yield, TM, PCARD). Each officer has a `share` of the regional
//      commercial book and an `adj` performance multiplier.
//   2. `marketOverlay` — non-officer-attributable lines (consumer II,
//      deposit IE/balance/cost, allocations, merchant/service/other fees),
//      split between Houston and Dallas.
//
// `buildRaw(scope)` produces the same shape as the original `raw` object
// used by the rest of the dashboard, aggregated to the requested scope.
// ════════════════════════════════════════════════════════════════

// ── Base aggregate (regional totals used to derive officer shares) ──
const BASE = {
  commII_b:   [14.3, 14.6, 14.7, 15.0, 15.3, 15.5, 15.7, 15.9, 16.2, 16.4, 16.7, 16.9],
  commBal_b:  [2410, 2445, 2470, 2500, 2535, 2560, 2590, 2620, 2650, 2680, 2710, 2740],
  commYld_b:  [7.12, 7.15, 7.15, 7.20, 7.22, 7.25, 7.28, 7.30, 7.32, 7.35, 7.38, 7.40],
  tm_b:       [0.8,  0.9,  0.9,  0.9,  1.0,  1.0,  1.0,  1.0,  1.1,  1.1,  1.1,  1.2],
  pc_b:       [0.3,  0.3,  0.3,  0.4,  0.4,  0.4,  0.4,  0.4,  0.4,  0.4,  0.5,  0.5],
};

// ── Officer roster ─────────────────────────────────────────────
// share: portion of regional commercial book (Σ share = 1.00)
// adj:   actual-vs-plan multiplier; 1.00 = on plan, >1 ahead, <1 behind
const officers = [
  // Houston (4 officers)
  { id: 'h-reyes',    name: 'M. Reyes',    market: 'Houston', tenure: 12, share: 0.19, adj: 0.97 },
  { id: 'h-patel',    name: 'D. Patel',    market: 'Houston', tenure: 7,  share: 0.14, adj: 1.05 },
  { id: 'h-tran',     name: 'A. Tran',     market: 'Houston', tenure: 9,  share: 0.13, adj: 1.00 },
  { id: 'h-williams', name: 'K. Williams', market: 'Houston', tenure: 4,  share: 0.07, adj: 0.82 },
  // Dallas (3 officers)
  { id: 'd-chen',     name: 'R. Chen',     market: 'Dallas',  tenure: 15, share: 0.21, adj: 1.01 },
  { id: 'd-garcia',   name: 'S. Garcia',   market: 'Dallas',  tenure: 6,  share: 0.16, adj: 0.91 },
  { id: 'd-foster',   name: 'B. Foster',   market: 'Dallas',  tenure: 3,  share: 0.10, adj: 1.00 },
];

const markets = ['Houston', 'Dallas'];

// Precompute each officer's monthly arrays from BASE + their share/adj
officers.forEach(o => {
  o.raw = {};
  ['commII', 'commBal', 'tm', 'pc'].forEach(k => {
    o.raw[`${k}_b`] = BASE[`${k}_b`].map(v => v * o.share);
    o.raw[`${k}_a`] = BASE[`${k}_b`].slice(0, ACT).map((v, i) => {
      // Storyline lift: Q1 soft, May/June recovering (matches v1 narrative)
      const storyline = [0.985, 0.987, 0.985, 0.992, 1.000, 1.005][i];
      return v * o.share * o.adj * storyline;
    });
  });
  // Yields: small variation by performance (rates don't scale by share)
  const yldDelta = (o.adj - 1) * 0.4;
  o.raw.commYld_b = BASE.commYld_b.slice();
  o.raw.commYld_a = BASE.commYld_b.slice(0, ACT).map((v, i) => {
    const storyline = [0.995, 0.997, 0.991, 0.998, 1.003, 1.005][i];
    return v * storyline + yldDelta;
  });
});

// ── Market overlay (non-officer-attributable lines) ────────────
const MARKET_SHARE = { Houston: 0.58, Dallas: 0.42 };

// Performance vs plan for overlay lines
const MARKET_ADJ = {
  Houston: { vol: 0.97, costAdd: 0.04 },   // behind on balances, paying ~4bp over plan
  Dallas:  { vol: 0.99, costAdd: 0.02 },   // closer to plan
};

const NON_OFFICER_BASE = {
  consII_b:  [4.3, 4.3, 4.4, 4.4, 4.5, 4.5, 4.6, 4.6, 4.7, 4.7, 4.8, 4.8],
  depIE_b:   [11.0, 11.2, 11.2, 11.3, 11.3, 11.3, 11.3, 11.3, 11.3, 11.4, 11.4, 11.4],
  depBal_b:  [3840, 3870, 3900, 3930, 3960, 3990, 4020, 4050, 4080, 4110, 4140, 4170],
  depCost_b: [3.44, 3.46, 3.45, 3.44, 3.42, 3.40, 3.38, 3.36, 3.34, 3.32, 3.30, 3.28],
  alloc_b:   [2.1, 2.1, 2.2, 2.2, 2.2, 2.3, 2.3, 2.3, 2.4, 2.4, 2.4, 2.5],
  me_b:      [0.2, 0.2, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.4],
  sv_b:      [0.5, 0.5, 0.5, 0.5, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.7, 0.7],
  ot_b:      [0.4, 0.3, 0.4, 0.4, 0.4, 0.5, 0.4, 0.5, 0.5, 0.5, 0.5, 0.6],
};

function buildMarketOverlay(market) {
  const share = MARKET_SHARE[market];
  const { vol, costAdd } = MARKET_ADJ[market];
  const o = {};
  ['consII', 'depIE', 'depBal', 'alloc', 'me', 'sv', 'ot'].forEach(k => {
    o[`${k}_b`] = NON_OFFICER_BASE[`${k}_b`].map(v => v * share);
    o[`${k}_a`] = NON_OFFICER_BASE[`${k}_b`].slice(0, ACT).map(v => v * share * vol);
  });
  o.depCost_b = NON_OFFICER_BASE.depCost_b.slice();
  o.depCost_a = NON_OFFICER_BASE.depCost_b.slice(0, ACT).map(v => v + costAdd);
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
// scope = { level: 'region' | 'market' | 'officer', market?, officerId? }
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

  ['commII', 'commBal', 'tm', 'pc'].forEach(k => {
    raw[`${k}_b`] = officersInScope.length
      ? sumArr(officersInScope.map(o => o.raw[`${k}_b`]))
      : Array(12).fill(0);
    raw[`${k}_a`] = officersInScope.length
      ? sumArr(officersInScope.map(o => o.raw[`${k}_a`]))
      : Array(ACT).fill(0);
  });

  raw.commYld_b = officersInScope.length
    ? weightedAvg(officersInScope.map(o => o.raw.commYld_b), officersInScope.map(o => o.raw.commBal_b), 12)
    : Array(12).fill(0);
  raw.commYld_a = officersInScope.length
    ? weightedAvg(officersInScope.map(o => o.raw.commYld_a), officersInScope.map(o => o.raw.commBal_a), ACT)
    : Array(ACT).fill(0);

  ['consII', 'depIE', 'depBal', 'alloc', 'me', 'sv', 'ot'].forEach(k => {
    raw[`${k}_b`] = marketKeys.length
      ? sumArr(marketKeys.map(m => marketOverlay[m][`${k}_b`]))
      : Array(12).fill(0);
    raw[`${k}_a`] = marketKeys.length
      ? sumArr(marketKeys.map(m => marketOverlay[m][`${k}_a`]))
      : Array(ACT).fill(0);
  });

  raw.depCost_b = marketKeys.length
    ? weightedAvg(marketKeys.map(m => marketOverlay[m].depCost_b), marketKeys.map(m => marketOverlay[m].depBal_b), 12)
    : Array(12).fill(0);
  raw.depCost_a = marketKeys.length
    ? weightedAvg(marketKeys.map(m => marketOverlay[m].depCost_a), marketKeys.map(m => marketOverlay[m].depBal_a), ACT)
    : Array(ACT).fill(0);

  raw.commSpd_b = raw.commYld_b.map((y, i) => y - raw.depCost_b[i]);
  raw.commSpd_a = raw.commYld_a.map((y, i) => y - raw.depCost_a[i]);

  return raw;
}

// ── buildMonthly(raw): same shape as v1 ────────────────────────
const pick = (a_arr, b_arr, i) => i < ACT ? a_arr[i] : b_arr[i];

function buildMonthly(raw) {
  return MONTHS.map((m, i) => {
    const isA = i < ACT;
    const commII = pick(raw.commII_a, raw.commII_b, i);
    const consII = pick(raw.consII_a, raw.consII_b, i);
    const depIE  = pick(raw.depIE_a,  raw.depIE_b,  i);
    const alloc  = pick(raw.alloc_a,  raw.alloc_b,  i);
    const flNII  = commII + consII - depIE - alloc;

    const tm = pick(raw.tm_a, raw.tm_b, i);
    const pc = pick(raw.pc_a, raw.pc_b, i);
    const me = pick(raw.me_a, raw.me_b, i);
    const sv = pick(raw.sv_a, raw.sv_b, i);
    const ot = pick(raw.ot_a, raw.ot_b, i);
    const flNIOI = tm + pc + me + sv + ot;

    const bNII  = raw.commII_b[i] + raw.consII_b[i] - raw.depIE_b[i] - raw.alloc_b[i];
    const bNIOI = raw.tm_b[i] + raw.pc_b[i] + raw.me_b[i] + raw.sv_b[i] + raw.ot_b[i];

    return {
      month: m, isA,
      commII, consII, depIE, alloc, flNII,
      tm, pc, me, sv, ot, flNIOI,
      flRev: flNII + flNIOI,
      bNII, bNIOI, bRev: bNII + bNIOI,
      commII_b: raw.commII_b[i], consII_b: raw.consII_b[i], depIE_b: raw.depIE_b[i],
      tm_b: raw.tm_b[i], pc_b: raw.pc_b[i], me_b: raw.me_b[i], sv_b: raw.sv_b[i], ot_b: raw.ot_b[i],
      depBal:  isA ? raw.depBal_a[i]  : raw.depBal_b[i],  depBal_b:  raw.depBal_b[i],
      depCost: isA ? raw.depCost_a[i] : raw.depCost_b[i], depCost_b: raw.depCost_b[i],
      commBal: isA ? raw.commBal_a[i] : raw.commBal_b[i], commBal_b: raw.commBal_b[i],
      commYld: isA ? raw.commYld_a[i] : raw.commYld_b[i], commYld_b: raw.commYld_b[i],
      commSpd: isA ? raw.commSpd_a[i] : raw.commSpd_b[i], commSpd_b: raw.commSpd_b[i],
    };
  });
}

// ── Mutable state — rebuilt by recompute() when scope changes ──
let monthly = [];
let actM = [];
let remM = [];

function recompute(scope) {
  const raw = buildRaw(scope);
  monthly = buildMonthly(raw);
  actM = monthly.filter(d => d.isA);
  remM = monthly.filter(d => !d.isA);
}

const sum = (arr, k) => arr.reduce((s, d) => s + (d[k] || 0), 0);

// Initial compute at region level
recompute({ level: 'region' });
