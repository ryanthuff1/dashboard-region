// ════════════════════════════════════════════════════════════════
// CONFIG — constants, colors, Chart.js defaults, plugins
// Loaded first. Everything below is in global scope.
// ════════════════════════════════════════════════════════════════

// Month labels and the count of actual (vs budgeted) months YTD.
// Bump ACT to 7 when July closes, etc.
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const ACT = 6;

// Color palette. Adjust here to retheme the whole dashboard.
const COL = {
  actual:     '#1864ab',
  budget:     '#adb5bd',
  green:      '#2b8a3e',
  red:        '#c92a2a',
  amber:      '#e67700',
  purple:     '#7048e8',
  teal:       '#0c8599',
  greenBg:    '#d3f9d8',
  redBg:      '#ffe3e3',
  amberBg:    '#fff3bf',
  actualFade: 'rgba(24,100,171,0.25)',
  budgetFade: 'rgba(173,181,189,0.15)',
};

// Chart.js global defaults so every chart inherits consistent styling.
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

// Holds live Chart instances so render() can destroy them on rerender.
const chartInstances = {};

// Vertical divider between actuals and budget on time-series charts.
const vertLinePlugin = {
  id: 'vertLine',
  afterDraw(chart) {
    const meta = chart.getDatasetMeta(0);
    if (!meta || !meta.data || meta.data.length < ACT) return;
    if (!meta.data[ACT]) return;
    const x = (meta.data[ACT - 1].x + meta.data[ACT].x) / 2;
    const ctx = chart.ctx;
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#1864ab';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, chart.chartArea.top);
    ctx.lineTo(x, chart.chartArea.bottom);
    ctx.stroke();
    ctx.restore();
  }
};
Chart.register(vertLinePlugin);
