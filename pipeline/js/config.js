// ════════════════════════════════════════════════════════════════
// CONFIG — pipeline stages, products, colors, Chart.js defaults
// Loaded first. Everything below is in global scope.
// ════════════════════════════════════════════════════════════════

// Five-stage funnel. Probability defaults are baseline; deal-level prob
// can vary ±5% (set in data.js).
const STAGES = ['Lead', 'Qualified', 'Proposal', 'Commit', 'Closed'];
const OPEN_STAGES = ['Lead', 'Qualified', 'Proposal', 'Commit'];  // exclude Closed
const STAGE_PROB = { Lead: 0.10, Qualified: 0.25, Proposal: 0.50, Commit: 0.80, Closed: 1.00 };

const PRODUCTS = ['CommLoan', 'Deposits', 'TM', 'Other'];
const PRODUCT_LABEL = {
  CommLoan: 'Comm Loan',
  Deposits: 'Deposits',
  TM:       'Treasury Mgmt',
  Other:    'Other Fees',
};

// Conversion: deal "amount" → annual revenue contribution.
// CommLoan/Deposits: amount is balance, rev = balance × spread.
// TM/Other: amount IS annual fee revenue.
const REV_RATIO = { CommLoan: 0.034, Deposits: 0.005, TM: 1.0, Other: 1.0 };

// Aging buckets (days in current stage) — green/amber/red thresholds.
const AGING_BUCKETS = [
  { label: '0-30',  min: 0,  max: 30  },
  { label: '31-60', min: 31, max: 60  },
  { label: '61-90', min: 61, max: 90  },
  { label: '90+',   min: 91, max: 9999 },
];

// Color palette (mirrors /region/ for consistency).
const COL = {
  actual:  '#1864ab',
  budget:  '#adb5bd',
  green:   '#2b8a3e',
  red:     '#c92a2a',
  amber:   '#e67700',
  purple:  '#7048e8',
  teal:    '#0c8599',
  greenBg: '#d3f9d8',
  redBg:   '#ffe3e3',
  amberBg: '#fff3bf',
};

// Stage-specific colors (Lead = cool gray, ramping warmer toward Closed).
const STAGE_COL = {
  Lead:      '#adb5bd',
  Qualified: '#1864ab',
  Proposal:  '#0c8599',
  Commit:    '#2b8a3e',
  Closed:    '#1e6e2d',
};

const PRODUCT_COL = {
  CommLoan: '#1864ab',
  Deposits: '#7048e8',
  TM:       '#0c8599',
  Other:    '#e67700',
};

// Pipeline coverage targets (multiples of weighted pipeline ÷ revenue gap).
// 1.0x = exactly enough; banks usually want ≥3x for safety.
const COVERAGE_TARGET = 3.0;
const COVERAGE_WARN   = 1.5;

// As-of date for the snapshot. In a real ingestion pipeline this would
// come from the upload. For the prototype we anchor to mid-2026.
const AS_OF = new Date(2026, 5, 30);  // Jun 30, 2026

// Chart.js global defaults.
Chart.defaults.font.family = "-apple-system, 'Segoe UI', system-ui, sans-serif";
Chart.defaults.font.size = 11;
Chart.defaults.color = '#78716c';
Chart.defaults.plugins.legend.display = false;
Chart.defaults.plugins.tooltip.backgroundColor = '#fff';
Chart.defaults.plugins.tooltip.titleColor = '#1864ab';
Chart.defaults.plugins.tooltip.bodyColor = '#212529';
Chart.defaults.plugins.tooltip.borderColor = '#dee2e6';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.padding = 10;
Chart.defaults.plugins.tooltip.cornerRadius = 6;

const chartInstances = {};
