// ════════════════════════════════════════════════════════════════
// DATA — raw inputs and monthly transformation
// To swap in real numbers, edit only the `raw` object.
// Arrays ending in _b are full-year budget (12 entries).
// Arrays ending in _a are YTD actuals (ACT entries, currently 6).
// ════════════════════════════════════════════════════════════════

const raw = {
  // Commercial loan interest income
  commII_b:   [14.3, 14.6, 14.7, 15.0, 15.3, 15.5, 15.7, 15.9, 16.2, 16.4, 16.7, 16.9],
  commII_a:   [14.0, 14.1, 14.1, 14.4, 15.1, 15.3],

  // Consumer interest income
  consII_b:   [4.3, 4.3, 4.4, 4.4, 4.5, 4.5, 4.6, 4.6, 4.7, 4.7, 4.8, 4.8],
  consII_a:   [4.4, 4.4, 4.5, 4.5, 4.6, 4.7],

  // Deposit interest expense
  depIE_b:    [11.0, 11.2, 11.2, 11.3, 11.3, 11.3, 11.3, 11.3, 11.3, 11.4, 11.4, 11.4],
  depIE_a:    [11.1, 11.3, 11.2, 11.2, 11.2, 11.2],

  // Deposit average balance ($M)
  depBal_b:   [3840, 3870, 3900, 3930, 3960, 3990, 4020, 4050, 4080, 4110, 4140, 4170],
  depBal_a:   [3780, 3790, 3810, 3830, 3850, 3870],

  // Deposit blended cost (%)
  depCost_b:  [3.44, 3.46, 3.45, 3.44, 3.42, 3.40, 3.38, 3.36, 3.34, 3.32, 3.30, 3.28],
  depCost_a:  [3.52, 3.55, 3.54, 3.50, 3.48, 3.46],

  // Commercial loan average balance ($M)
  commBal_b:  [2410, 2445, 2470, 2500, 2535, 2560, 2590, 2620, 2650, 2680, 2710, 2740],
  commBal_a:  [2380, 2395, 2410, 2420, 2510, 2540],

  // Commercial loan yield (%)
  commYld_b:  [7.12, 7.15, 7.15, 7.20, 7.22, 7.25, 7.28, 7.30, 7.32, 7.35, 7.38, 7.40],
  commYld_a:  [7.08, 7.10, 7.05, 7.12, 7.18, 7.22],

  // Commercial loan spread (%)
  commSpd_b:  [3.68, 3.69, 3.70, 3.76, 3.80, 3.85, 3.90, 3.94, 3.98, 4.03, 4.08, 4.12],
  commSpd_a:  [3.56, 3.55, 3.51, 3.62, 3.70, 3.76],

  // NII allocations
  alloc_b:    [2.1, 2.1, 2.2, 2.2, 2.2, 2.3, 2.3, 2.3, 2.4, 2.4, 2.4, 2.5],
  alloc_a:    [2.1, 2.2, 2.2, 2.3, 2.2, 2.3],

  // Treasury management fees
  tm_b:       [0.8, 0.9, 0.9, 0.9, 1.0, 1.0, 1.0, 1.0, 1.1, 1.1, 1.1, 1.2],
  tm_a:       [0.6, 0.7, 0.7, 0.8, 0.8, 0.8],

  // PCARD fees
  pc_b:       [0.3, 0.3, 0.3, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.5, 0.5],
  pc_a:       [0.2, 0.3, 0.3, 0.3, 0.3, 0.3],

  // Merchant fees
  me_b:       [0.2, 0.2, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.4],
  me_a:       [0.2, 0.2, 0.2, 0.3, 0.3, 0.3],

  // Service charges
  sv_b:       [0.5, 0.5, 0.5, 0.5, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.7, 0.7],
  sv_a:       [0.5, 0.5, 0.6, 0.5, 0.6, 0.6],

  // Other fees
  ot_b:       [0.4, 0.3, 0.4, 0.4, 0.4, 0.5, 0.4, 0.5, 0.5, 0.5, 0.5, 0.6],
  ot_a:       [0.4, 0.4, 0.4, 0.4, 0.4, 0.5],
};

// Pick actual if month index is within ACT, else fall back to budget.
const pick = (a_arr, b_arr, i) => i < ACT ? a_arr[i] : b_arr[i];

// Build the monthly array — single source of truth for all charts.
const monthly = MONTHS.map((m, i) => {
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

  // Budget-only equivalents for variance comparisons
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
    depBal:   isA ? raw.depBal_a[i]   : raw.depBal_b[i],   depBal_b:   raw.depBal_b[i],
    depCost:  isA ? raw.depCost_a[i]  : raw.depCost_b[i],  depCost_b:  raw.depCost_b[i],
    commBal:  isA ? raw.commBal_a[i]  : raw.commBal_b[i],  commBal_b:  raw.commBal_b[i],
    commYld:  isA ? raw.commYld_a[i]  : raw.commYld_b[i],  commYld_b:  raw.commYld_b[i],
    commSpd:  isA ? raw.commSpd_a[i]  : raw.commSpd_b[i],  commSpd_b:  raw.commSpd_b[i],
  };
});

const actM = monthly.filter(d => d.isA);
const remM = monthly.filter(d => !d.isA);

// Sum helper used everywhere downstream.
const sum = (arr, k) => arr.reduce((s, d) => s + (d[k] || 0), 0);
