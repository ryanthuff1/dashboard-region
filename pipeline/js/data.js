// ════════════════════════════════════════════════════════════════
// DATA — officer roster, deal generation, scope filtering
//
// Hierarchy: Region → Market (Houston/Dallas) → Officer (mirror of /region/)
//
// Deals are deterministically fabricated from each officer's `adj` and
// `share` so the storyline matches the financials dashboard:
//   • Houston is slightly behind plan; Dallas closer
//   • K. Williams (adj 0.82) has the thinnest, most stuck pipeline
//   • D. Patel (adj 1.05) leads on coverage
// ════════════════════════════════════════════════════════════════

const officers = [
  { id: 'h-reyes',    name: 'M. Reyes',    market: 'Houston', tenure: 12, share: 0.19, adj: 0.97 },
  { id: 'h-patel',    name: 'D. Patel',    market: 'Houston', tenure: 7,  share: 0.14, adj: 1.05 },
  { id: 'h-tran',     name: 'A. Tran',     market: 'Houston', tenure: 9,  share: 0.13, adj: 1.00 },
  { id: 'h-williams', name: 'K. Williams', market: 'Houston', tenure: 4,  share: 0.07, adj: 0.82 },
  { id: 'd-chen',     name: 'R. Chen',     market: 'Dallas',  tenure: 15, share: 0.21, adj: 1.01 },
  { id: 'd-garcia',   name: 'S. Garcia',   market: 'Dallas',  tenure: 6,  share: 0.16, adj: 0.91 },
  { id: 'd-foster',   name: 'B. Foster',   market: 'Dallas',  tenure: 3,  share: 0.10, adj: 1.00 },
];

const markets = ['Houston', 'Dallas'];

// Revenue gap to close from pipeline (annual $ M). Mirrors financials
// storyline: region is off plan, needs ~$3.8M of pipeline to convert.
const REGION_GAP_REV_M = 3.8;

// ── Seeded RNG (mulberry32) so deals are stable across page loads ──
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0; return h; }

// Customer name pool — picked deterministically by deal index.
const CUSTOMER_POOL = [
  'Acme Holdings', 'Beacon Industries', 'Cypress Group', 'Delta Manufacturing',
  'Evergreen Realty', 'Fairfield Energy', 'Galleon Logistics', 'Harbor Partners',
  'Ironwood Capital', 'Juniper Foods', 'Keystone Steel', 'Lakeside Medical',
  'Mason & Co.', 'Northstar Tech', 'Oakridge Auto', 'Pacific Imports',
  'Quartz Mining', 'Redwood Construction', 'Summit Hospitality', 'Trinity Pharma',
  'Union Distributors', 'Vanguard Plastics', 'Westfield Retail', 'Xander Aviation',
  'Yellowstone Ranch', 'Zenith Software', 'Alamo Equipment', 'Brazos Petroleum',
  'Cedar Cabinetry', 'Driftwood Hotels',
];

// ── Stage distribution by officer adj ──────────────────────────
// Weaker officers concentrate in early stages; stronger officers carry
// late-stage deals. Returns [Lead, Qualified, Proposal, Commit, Closed]
// weights (normalized to 1).
function stageWeightsFor(adj) {
  if (adj < 0.90)     return [0.36, 0.30, 0.18, 0.10, 0.06];  // weak
  if (adj < 0.99)     return [0.28, 0.27, 0.22, 0.14, 0.09];  // below plan
  if (adj < 1.03)     return [0.22, 0.24, 0.24, 0.18, 0.12];  // on plan
  return                     [0.16, 0.20, 0.28, 0.22, 0.14];  // ahead
}

function pickWeighted(rng, options, weights) {
  const r = rng();
  let acc = 0;
  for (let i = 0; i < options.length; i++) {
    acc += weights[i];
    if (r < acc) return options[i];
  }
  return options[options.length - 1];
}

// ── Deal generation ────────────────────────────────────────────
function generateDealsForOfficer(o) {
  const rng = mulberry32(hashStr(o.id));
  // Deal count: 8-15, scaled by adj. Strong officers carry more deals.
  const numDeals = Math.round(8 + rng() * 6 + (o.adj - 1) * 8);
  const sWeights = stageWeightsFor(o.adj);
  const pWeights = [0.40, 0.25, 0.20, 0.15];  // CommLoan, Deposits, TM, Other

  const deals = [];
  for (let i = 0; i < numDeals; i++) {
    const product = pickWeighted(rng, PRODUCTS, pWeights);
    const stage   = pickWeighted(rng, STAGES, sWeights);

    // Amount distribution (log-ish) by product.
    let amount;
    if (product === 'CommLoan') {
      // $500K to $20M, log-uniform
      amount = Math.exp(Math.log(0.5e6) + rng() * (Math.log(20e6) - Math.log(0.5e6)));
    } else if (product === 'Deposits') {
      amount = Math.exp(Math.log(0.5e6) + rng() * (Math.log(10e6) - Math.log(0.5e6)));
    } else if (product === 'TM') {
      amount = 10e3 + rng() * 290e3;
    } else {  // Other
      amount = 2e3 + rng() * 78e3;
    }

    // Probability: stage default ± 5%
    const probability = Math.max(0.05, Math.min(1.0,
      STAGE_PROB[stage] + (rng() - 0.5) * 0.10
    ));

    // Days in stage: typically 10-90, but weak officers get more 90+ stuck deals.
    const stuckBoost = o.adj < 0.95 ? rng() * 80 : 0;
    const daysInStage = Math.round(10 + rng() * 80 + stuckBoost);

    // Total age: stage index contributes a baseline, plus daysInStage.
    const stageIdx = STAGES.indexOf(stage);
    const ageDays = stageIdx * 30 + daysInStage + Math.round(rng() * 30);

    // Expected close: days remaining decreases as stage advances.
    const daysToClose = Math.max(7, Math.round((4 - stageIdx) * 30 + rng() * 60));
    const expectedClose = new Date(AS_OF.getTime() + daysToClose * 86400000);

    const customerIdx = (hashStr(o.id + i) >>> 0) % CUSTOMER_POOL.length;
    const customer = CUSTOMER_POOL[customerIdx];

    deals.push({
      id: `${o.id}-${i}`,
      officerId: o.id,
      market: o.market,
      customer,
      product,
      stage,
      amount,
      probability,
      daysInStage,
      ageDays,
      expectedClose,
      // Pre-computed: annual revenue this deal represents (un-weighted).
      revAnnual: amount * REV_RATIO[product],
    });
  }
  return deals;
}

// All deals (computed once at load).
const allDeals = officers.flatMap(generateDealsForOfficer);

// ── Scope filtering ────────────────────────────────────────────
function dealsInScope(scope) {
  if (scope.level === 'region') return allDeals;
  if (scope.level === 'market') return allDeals.filter(d => d.market === scope.market);
  return allDeals.filter(d => d.officerId === scope.officerId);
}

// Revenue gap for the current scope (annual $ M).
// Region gap is fixed; market/officer scale by share.
function gapForScope(scope) {
  if (scope.level === 'region') return REGION_GAP_REV_M;
  const officersInScope = scope.level === 'market'
    ? officers.filter(o => o.market === scope.market)
    : officers.filter(o => o.id === scope.officerId);
  // Weaker officers carry a larger share of the gap.
  const weight = officersInScope.reduce((s, o) => s + o.share / o.adj, 0);
  const total  = officers.reduce((s, o) => s + o.share / o.adj, 0);
  return REGION_GAP_REV_M * (weight / total);
}

// ── Aggregations ───────────────────────────────────────────────
function pipelineMetrics(deals) {
  const open    = deals.filter(d => OPEN_STAGES.includes(d.stage));
  const closed  = deals.filter(d => d.stage === 'Closed');
  const totalBal     = open.reduce((s, d) => s + d.amount, 0);
  const totalRev     = open.reduce((s, d) => s + d.revAnnual, 0);
  const weightedRev  = open.reduce((s, d) => s + d.revAnnual * d.probability, 0);
  const closedRev    = closed.reduce((s, d) => s + d.revAnnual, 0);
  const avgDays      = open.length ? open.reduce((s, d) => s + d.daysInStage, 0) / open.length : 0;
  return {
    openCount: open.length, closedCount: closed.length,
    totalBal, totalRev, weightedRev, closedRev, avgDaysInStage: avgDays,
  };
}

function countByStage(deals) {
  const out = {};
  STAGES.forEach(s => out[s] = 0);
  deals.forEach(d => out[d.stage]++);
  return out;
}

function sumRevByStage(deals, weighted = false) {
  const out = {};
  STAGES.forEach(s => out[s] = 0);
  deals.forEach(d => {
    out[d.stage] += weighted ? d.revAnnual * d.probability : d.revAnnual;
  });
  return out;
}

function metricsByProduct(deals) {
  const open = deals.filter(d => OPEN_STAGES.includes(d.stage));
  const closed = deals.filter(d => d.stage === 'Closed');
  return PRODUCTS.map(p => {
    const pOpen   = open.filter(d => d.product === p);
    const pClosed = closed.filter(d => d.product === p);
    return {
      product: p,
      count:        pOpen.length,
      balance:      pOpen.reduce((s, d) => s + d.amount, 0),
      revAnnual:    pOpen.reduce((s, d) => s + d.revAnnual, 0),
      weightedRev:  pOpen.reduce((s, d) => s + d.revAnnual * d.probability, 0),
      closedRev:    pClosed.reduce((s, d) => s + d.revAnnual, 0),
      avgProb:      pOpen.length ? pOpen.reduce((s, d) => s + d.probability, 0) / pOpen.length : 0,
    };
  });
}

function agingBuckets(deals) {
  const open = deals.filter(d => OPEN_STAGES.includes(d.stage));
  return AGING_BUCKETS.map(b => ({
    label: b.label,
    count: open.filter(d => d.daysInStage >= b.min && d.daysInStage <= b.max).length,
    revWeighted: open
      .filter(d => d.daysInStage >= b.min && d.daysInStage <= b.max)
      .reduce((s, d) => s + d.revAnnual * d.probability, 0),
  }));
}

function rankByOfficer(deals) {
  return officers.map(o => {
    const oDeals = deals.filter(d => d.officerId === o.id);
    const open   = oDeals.filter(d => OPEN_STAGES.includes(d.stage));
    return {
      ...o,
      openCount:   open.length,
      weightedRev: open.reduce((s, d) => s + d.revAnnual * d.probability, 0),
      totalRev:    open.reduce((s, d) => s + d.revAnnual, 0),
    };
  }).filter(r => r.openCount > 0)
    .sort((a, b) => b.weightedRev - a.weightedRev);
}

function topDeals(deals, n = 10) {
  return deals
    .filter(d => OPEN_STAGES.includes(d.stage))
    .map(d => ({ ...d, weightedRev: d.revAnnual * d.probability }))
    .sort((a, b) => b.weightedRev - a.weightedRev)
    .slice(0, n);
}
