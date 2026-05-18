# Texas Region — RP Dashboard

Static HTML dashboard. Chart.js from CDN, no build step, no package.json.
Drop this folder into any GitHub repo, enable Pages, done.

## Structure

```
texas-rp-dashboard/
├── index.html          # Shell — header, nav, grid containers, script tags
├── css/
│   └── styles.css      # All styles
└── js/
    ├── config.js       # Colors, constants (MONTHS, ACT), Chart.js defaults, vertLine plugin
    ├── data.js         # Raw monthly inputs + monthly[] transformation + helpers
    ├── charts.js       # All 10 chart builder functions
    └── main.js         # KPI strip, card registry, render loop, nav
```

Script load order is fixed in `index.html`:
**Chart.js CDN → config → data → charts → main**.
Each step depends on globals defined above it.

## Common edits

**Swap in real numbers** → `js/data.js`, edit the `raw` object only.
Actuals end in `_a` (length = `ACT`), budgets end in `_b` (length = 12).

**Close another month** → `js/config.js`, bump `ACT` (e.g. `6` → `7`) and add the
seventh actual value to each `_a` array in `data.js`.

**Retheme** → `js/config.js`, edit the `COL` object.

**Add a chart** →
1. Write `function buildXxx(canvas) { ... return new Chart(...) }` in `charts.js`
2. Append a row to the `cards` array in `main.js`

**Remove or reorder charts** → delete or reorder rows in the `cards` array in `main.js`.

## Deploy on GitHub Pages

```
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

Then: repo Settings → Pages → Source = `main` / `/ (root)` → Save.
First deploy takes ~1 min. Watch the Actions tab for `pages-build-deployment`.

## Local preview

Either open `index.html` directly in a browser (works because Chart.js loads
from CDN — no module imports = no CORS issues), or:

```
cd texas-rp-dashboard
python3 -m http.server 8000
# then visit http://localhost:8000
```
