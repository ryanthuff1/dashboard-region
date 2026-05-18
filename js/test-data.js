global.Chart = {
  defaults: { font: {}, color: '', plugins: { legend: {}, tooltip: {} } },
  register: () => {},
};

const fs = require('fs');
const path = require('path');

const testCode = `
console.log('═══ Region scope ═══');
recompute({ level: 'region' });
const regionYTD = sum(actM, 'flRev');
const regionCommII = sum(actM, 'commII');
const regionTM = sum(actM, 'tm');
const regionDepIE = sum(actM, 'depIE');
const regionPC = sum(actM, 'pc');
console.log('  YTD FL Revenue:    $' + regionYTD.toFixed(2) + 'M');
console.log('  YTD Comm Loan II:  $' + regionCommII.toFixed(2) + 'M');
console.log('  YTD TM:            $' + regionTM.toFixed(2) + 'M');
console.log('  YTD PCARD:         $' + regionPC.toFixed(2) + 'M');
console.log('  YTD Deposit IE:    $' + regionDepIE.toFixed(2) + 'M');

console.log('\\n═══ Houston scope ═══');
recompute({ level: 'market', market: 'Houston' });
const hYTD = sum(actM, 'flRev');
const hCommII = sum(actM, 'commII');
const hTM = sum(actM, 'tm');
const hDepIE = sum(actM, 'depIE');
console.log('  YTD FL Revenue:    $' + hYTD.toFixed(2) + 'M');
console.log('  YTD Comm Loan II:  $' + hCommII.toFixed(2) + 'M');
console.log('  YTD TM:            $' + hTM.toFixed(2) + 'M');
console.log('  YTD Deposit IE:    $' + hDepIE.toFixed(2) + 'M');

console.log('\\n═══ Dallas scope ═══');
recompute({ level: 'market', market: 'Dallas' });
const dYTD = sum(actM, 'flRev');
const dCommII = sum(actM, 'commII');
const dTM = sum(actM, 'tm');
const dDepIE = sum(actM, 'depIE');
console.log('  YTD FL Revenue:    $' + dYTD.toFixed(2) + 'M');
console.log('  YTD Comm Loan II:  $' + dCommII.toFixed(2) + 'M');
console.log('  YTD TM:            $' + dTM.toFixed(2) + 'M');
console.log('  YTD Deposit IE:    $' + dDepIE.toFixed(2) + 'M');

console.log('\\n═══ Sanity: Houston + Dallas vs Region ═══');
const fmt = (v) => (v >= 0 ? '+' : '') + v.toFixed(4);
console.log('  Comm II:    H+D=' + (hCommII+dCommII).toFixed(2) + ' vs R=' + regionCommII.toFixed(2) + ' (diff: ' + fmt((hCommII+dCommII)-regionCommII) + ')');
console.log('  TM:         H+D=' + (hTM+dTM).toFixed(2) + ' vs R=' + regionTM.toFixed(2) + ' (diff: ' + fmt((hTM+dTM)-regionTM) + ')');
console.log('  Deposit IE: H+D=' + (hDepIE+dDepIE).toFixed(2) + ' vs R=' + regionDepIE.toFixed(2) + ' (diff: ' + fmt((hDepIE+dDepIE)-regionDepIE) + ')');
console.log('  FL Revenue: H+D=' + (hYTD+dYTD).toFixed(2) + ' vs R=' + regionYTD.toFixed(2) + ' (diff: ' + fmt((hYTD+dYTD)-regionYTD) + ')');

console.log('\\n═══ Officer level: K. Williams (Houston, weakest @ adj=0.82) ═══');
recompute({ level: 'officer', market: 'Houston', officerId: 'h-williams' });
const wCommII = sum(actM, 'commII');
const wCommIIb = sum(actM, 'commII_b');
const wDepIE = sum(actM, 'depIE');
console.log('  YTD Comm Loan II: $' + wCommII.toFixed(2) + 'M (budget $' + wCommIIb.toFixed(2) + 'M)');
console.log('  Variance: ' + (((wCommII - wCommIIb) / wCommIIb) * 100).toFixed(1) + '%  (expect ~ -18% with storyline lift)');
console.log('  YTD Deposit IE: $' + wDepIE.toFixed(2) + 'M  (expect 0 — no officer-level overlays)');

console.log('\\n═══ Sanity: sum of Houston officers vs Houston market ═══');
const hOfficers = officers.filter(o => o.market === 'Houston');
let officerCommSum = 0, officerTMSum = 0, officerPCSum = 0;
hOfficers.forEach(o => {
  recompute({ level: 'officer', market: 'Houston', officerId: o.id });
  officerCommSum += sum(actM, 'commII');
  officerTMSum += sum(actM, 'tm');
  officerPCSum += sum(actM, 'pc');
});
recompute({ level: 'market', market: 'Houston' });
console.log('  Comm II: Σofficers=' + officerCommSum.toFixed(4) + ' vs Houston=' + sum(actM, 'commII').toFixed(4) + ' (diff: ' + fmt(officerCommSum - sum(actM, 'commII')) + ')');
console.log('  TM:      Σofficers=' + officerTMSum.toFixed(4) + ' vs Houston=' + sum(actM, 'tm').toFixed(4) + ' (diff: ' + fmt(officerTMSum - sum(actM, 'tm')) + ')');
console.log('  PCARD:   Σofficers=' + officerPCSum.toFixed(4) + ' vs Houston=' + sum(actM, 'pc').toFixed(4) + ' (diff: ' + fmt(officerPCSum - sum(actM, 'pc')) + ')');

console.log('\\n═══ Roster check: total share = 1.00 ═══');
const totalShare = officers.reduce((s, o) => s + o.share, 0);
console.log('  Σ share = ' + totalShare.toFixed(4) + '  (expect 1.0000)');

console.log('\\n✓ All scopes computed without error');
`;

const sources = [
  fs.readFileSync(path.join(__dirname, 'js/config.js'), 'utf8'),
  fs.readFileSync(path.join(__dirname, 'js/data.js'), 'utf8'),
  testCode,
].join('\n');

eval(sources);
