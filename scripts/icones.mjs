/**
 * Fabrique les icônes dérivées de src/app/icon.svg, qui reste la seule source
 * de vérité du dessin :
 *   - src/app/favicon.ico   16, 32 et 48 px, coins arrondis, fond transparent
 *   - src/app/apple-icon.png 180 px, carré plein (iOS applique son propre masque)
 * Lancer après toute retouche du SVG : `pnpm run icones`.
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

// Le masque d'iOS arrondit déjà : le carré doit être plein, sinon les coins
// se cumulent et laissent du vide.
writeFileSync('src/app/apple-icon.png', await png(svg.replace('rx="7"', 'rx="0"'), 180, '#fbfaf7'));

const tailles = [16, 32, 48];
const images = [];
for (const t of tailles) images.push(await png(svg, t, 'transparent'));
await b.close();

// En-tête ICO : un répertoire de 6 octets, puis une entrée de 16 par image.
const entete = Buffer.alloc(6 + 16 * images.length);
entete.writeUInt16LE(0, 0);
entete.writeUInt16LE(1, 2); // type icône
entete.writeUInt16LE(images.length, 4);
let position = entete.length;
images.forEach((img, i) => {
  const o = 6 + 16 * i;
  entete.writeUInt8(tailles[i] === 256 ? 0 : tailles[i], o);
  entete.writeUInt8(tailles[i] === 256 ? 0 : tailles[i], o + 1);
  entete.writeUInt16LE(1, o + 4); // plans
  entete.writeUInt16LE(32, o + 6); // bits par pixel
  entete.writeUInt32LE(img.length, o + 8);
  entete.writeUInt32LE(position, o + 12);
  position += img.length;
});
writeFileSync('src/app/favicon.ico', Buffer.concat([entete, ...images]));

console.log('icônes écrites : favicon.ico (%s), apple-icon.png (180)', tailles.join(', '));
