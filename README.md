# Texas Region — RP Dashboard (v2: Officer Drill-Down)

Static HTML dashboard with three-level drill-down: **Region → Market → Officer**.
Chart.js from CDN, no build step, no package.json. Drop into any GitHub repo,
enable Pages, done.

## What v2 added over v1

- **Three-level scope hierarchy** with breadcrumb + sibling-button navigation
- **Officer-level data** for the lines that genuinely attribute to LOs
  (commercial loan II, balance, yield, TM fees, PCARD fees)
- **Market overlays** for the lines that don't (consumer II, deposit IE/balance/cost,
  allocations, merchant/service/other fees), split between Houston and Dallas
- **Card #11: Officer Ranking** — clickable bars at market level; click an
  officer to drill straight into their view
- **Adaptive y-axes** on time-series charts so values render correctly when
  scope changes the magnitude (region ~$15M/mo on comm II → officer ~$1-3M/mo)
- **Charts auto-hide at levels where they don't apply**:
  Deposits and NIOI Detail show at region/market only; Officer Ranking shows
  at market only

## Structure

```
texas-rp-dashboard-v2/
├── index.html          # Shell — header, drill row, nav, grid
├── css/
│   └── styles.css      # All styles (now includes .drill / .crumb / .child)
├── js/
│   ├── config.js       # Colors, constants (MONTHS, ACT), Chart.js defaults
│   ├── data.js         # Officer roster, market overlays, buildRaw(scope), recompute()
│   ├── charts.js       # 11 chart builders, scope-aware
│   └── main.js         # scope state, breadcrumb, render loop, drill flow
└── test-data.js        # Node test harness — verifies region = H+D, officers sum to market, etc.
```

Script load order is fixed: **Chart.js CDN → config → data → charts → main**.

## How the data layer works

The single source of truth is the officer roster + the market overlays in `data.js`:

- **`officers[]`** — 7 officers (4 Houston, 3 Dallas), each with a `share` of
  the regional commercial book and a performance `adj` multiplier
  (>1 ahead of plan, <1 behind).
- **`marketOverlay`** — Houston and Dallas slices of the non-attributable lines.

When scope changes, `recompute(scope)` calls `buildRaw(scope)` which aggregates
officers and market overlays appropriately, then `buildMonthly(raw)` produces
the same shape every chart consumed in v1. The chart functions don't know about
scope — they just read `monthly` / `actM` / `remM`.

## Common edits

**Swap in real officer data** → edit the `officers` array in `data.js`.
Add/remove rows freely; each officer needs `id`, `name`, `market`, `tenure`,
`share`, `adj`. Shares should sum to ~1.00 for the region totals to match.

**Re-tune market splits** → `MARKET_SHARE` and `MARKET_ADJ` in `data.js`.

**Adjust storyline (Q1 soft / May-Jun recovering)** → `storyline` arrays in
the officer/market precompute loops in `data.js`. Replace with your real
month-by-month actuals.

**Close another month** → bump `ACT` in `config.js` from 6 to 7 (and extend
your actuals).

**Change which cards show at which level** → edit the `levels: [...]` field
on each card in the `cards` array in `main.js`.

**Add a new card** → write `buildXxx` in `charts.js`, append a row to `cards`.

## Verify the data layer

```bash
node test-data.js
```

Runs region/market/officer scope assertions: that markets sum to region,
that officers sum to their market, that K. Williams shows ~-18% to plan,
and that officer-level overlay lines are zero.

## Deploy on GitHub Pages

```
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

Settings → Pages → Source = `main` / `/ (root)` → Save.

## Local preview

Open `index.html` directly, or:

```
python3 -m http.server 8000
# visit http://localhost:8000
```
