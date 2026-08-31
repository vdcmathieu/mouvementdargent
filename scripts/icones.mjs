/**
 * Fabrique les icônes dérivées de src/app/icon.svg, qui reste la seule source
 * de vérité du dessin :
 *   - src/app/icon.png        96 px, la roue de secours des navigateurs qui
 *                             ignorent les favicons SVG (Safari ancien)
 *   - src/app/apple-icon.png  180 px, carré plein (iOS applique son propre masque)
 * Le SVG est déclaré après le PNG dans le <head>, donc il gagne partout où il
 * est compris. Lancer après toute retouche du dessin : `pnpm run icones`.
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';

const svg = readFileSync('src/app/icon.svg', 'utf8');
const b = await chromium.launch();

/** Rend le SVG dans une page exactement carrée et renvoie le PNG. */
async function png(source, taille, fond) {
  const p = await b.newPage({ viewport: { width: taille, height: taille } });
  const data = 'data:image/svg+xml;base64,' + Buffer.from(source).toString('base64');
  await p.setContent(
    `<style>html,body{margin:0;background:${fond}}img{display:block;width:${taille}px;height:${taille}px}</style>` +
      `<img src="${data}">`
  );
  const buf = await p.screenshot({ omitBackground: fond === 'transparent' });
  await p.close();
  return buf;
}

writeFileSync('src/app/icon.png', await png(svg, 96, 'transparent'));
// Le masque d'iOS arrondit déjà : le carré doit être plein, sinon les coins
// se cumulent et laissent du vide.
writeFileSync('src/app/apple-icon.png', await png(svg.replace('rx="7"', 'rx="0"'), 180, '#fbfaf7'));

await b.close();
console.log('icônes écrites : icon.png (96), apple-icon.png (180)');
