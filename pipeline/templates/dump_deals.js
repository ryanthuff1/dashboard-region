// Dump the dashboard's synthetic deals to JSON for the workbook builder.
// Run from repo root:  node pipeline/templates/dump_deals.js > pipeline/templates/deals.json

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

const ctx = {
  Chart: {
    defaults: { font: {}, color: '', plugins: { legend: {}, tooltip: {} } },
    register: () => {},
  },
  console, Math, Date, JSON, Object, Array, process,
};
vm.createContext(ctx);

const jsDir = path.join(__dirname, '..', 'js');
const src = [
  fs.readFileSync(path.join(jsDir, 'config.js'), 'utf8'),
  fs.readFileSync(path.join(jsDir, 'data.js'),   'utf8'),
  // Top-level const/let in a vm script aren't exposed on the context
  // — so we serialize from inside the same script.
  `
  const out = allDeals.map(d => Object.assign({}, d, {
    expectedClose: d.expectedClose.toISOString().slice(0, 10),
  }));
  process.stdout.write(JSON.stringify(out, null, 2));
  `,
].join('\n\n');

vm.runInContext(src, ctx);
