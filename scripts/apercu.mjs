import { chromium } from 'playwright';
const out = process.argv[2];
const b = await chromium.launch();
const errs = [];
const track = p => { p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type()==='error') errs.push(m.text()); }); };

const p = await b.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 2 });
track(p);
await p.goto('http://localhost:4310/', { waitUntil: 'networkidle' });
await p.waitForTimeout(700);
await p.locator('svg[role=img]').screenshot({ path: `${out}/a-sankey.png` });
await p.screenshot({ path: `${out}/2-full.png`, fullPage: true });

// Vérification arithmétique dans le navigateur
const check = await p.evaluate(async () => {
  const d = await (await fetch('/data/apu-2024.json')).json();
  const s = a => a.reduce((x,y)=>x+y.montant,0);
  return {
    recettes: [s(d.recettes), d.agregats.recettes],
    fonctions: [s(d.fonctions), d.agregats.depenses],
    natures: [s(d.natures), d.agregats.depenses],
    sousPostes: d.fonctions.map(f => [f.libelle, +(s(f.postes||[])-f.montant).toFixed(1)]),
  };
});
console.log('CHECK', JSON.stringify(check, null, 1));

// Mobile
const m = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
track(m);
await m.goto('http://localhost:4310/', { waitUntil: 'networkidle' });
await m.waitForTimeout(600);
await m.screenshot({ path: `${out}/m-mobile.png`, fullPage: false });
const scrollX = await m.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
console.log('PAGE SCROLLS HORIZONTALLY:', scrollX);

console.log('ERRORS:', errs.length ? errs.join('\n') : 'none');
await b.close();
