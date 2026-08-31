import { chromium } from 'playwright';
const out = process.argv[2] ?? '.apercu';
const base = process.env.APERCU_URL ?? 'http://localhost:3000';
const b = await chromium.launch();
const errs = [];
const track = p => { p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type()==='error') errs.push(m.text()); }); };

const p = await b.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 2 });
track(p);
await p.goto(base + '/', { waitUntil: 'networkidle' });
await p.waitForTimeout(800);
await p.screenshot({ path: `${out}/1-haut.png` });
await p.locator('#flux svg[role=img]').screenshot({ path: `${out}/2-sankey.png` });
for (const [nom, sel] of [['3-detail','#detail'],['4-administrations','#administrations'],['5-trajectoire','#trajectoire'],['6-administration','#administration'],['7-pouvoirs','#pouvoirs'],['8-retenir','#retenir']]) {
  await p.locator(sel).scrollIntoViewIfNeeded();
  await p.waitForTimeout(250);
  await p.locator(sel).screenshot({ path: `${out}/${nom}.png` });
}
await p.screenshot({ path: `${out}/0-page.png`, fullPage: true });

// Unité « par habitant », puis retour en haut
await p.getByRole('button', { name: 'Par habitant' }).click();
await p.waitForTimeout(300);
await p.locator('#detail').scrollIntoViewIfNeeded();
await p.locator('#detail').screenshot({ path: `${out}/9-par-habitant.png` });

// Vérification arithmétique dans le navigateur
const check = await p.evaluate(async () => {
  const d = await (await fetch('/data/apu-2024.json')).json();
  const s = a => a.reduce((x,y)=>x+y.montant,0);
  return {
    recettes: [s(d.recettes), d.agregats.recettes],
    fonctions: [s(d.fonctions), d.agregats.depenses],
    natures: [s(d.natures), d.agregats.depenses],
  };
});
console.log('CHECK', JSON.stringify(check));

// Méthode
await p.goto(base + '/methodologie', { waitUntil: 'networkidle' });
await p.screenshot({ path: `${out}/10-methode.png`, fullPage: true });

// Mobile
const m = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
track(m);
await m.goto(base + '/', { waitUntil: 'networkidle' });
await m.waitForTimeout(700);
await m.screenshot({ path: `${out}/m1-haut.png` });
await m.locator('#detail').scrollIntoViewIfNeeded();
await m.waitForTimeout(250);
await m.screenshot({ path: `${out}/m2-detail.png` });
await m.locator('#administrations').scrollIntoViewIfNeeded();
await m.waitForTimeout(250);
await m.screenshot({ path: `${out}/m3-admin.png` });
for (const [nom, sel] of [['m4-administration','#administration'],['m5-pouvoirs','#pouvoirs']]) {
  await m.locator(sel).scrollIntoViewIfNeeded();
  await m.waitForTimeout(250);
  await m.screenshot({ path: `${out}/${nom}.png` });
}
const scrollX = await m.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
console.log('PAGE SCROLLS HORIZONTALLY:', scrollX);

console.log('ERRORS:', errs.length ? errs.join('\n') : 'none');
await b.close();
