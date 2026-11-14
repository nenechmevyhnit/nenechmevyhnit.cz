// Jednorázově stáhne Redaction 10 a tučné rozpadlé řezy Redaction 20/35/50/70 (nadpis stránky 404) (latin + latin-ext) z Google Fonts do public/fonty
// a vytvoří src/styles/fonty.css. Za běhu webu se Google Fonts nepoužívají.
import { mkdirSync, writeFileSync } from 'node:fs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const RODINY = [
  'family=Redaction+10:ital,wght@0,400;0,700;1,400',
  // rozpadlé řezy: slovo „zapadla“ v nadpisu stránky 404 se během čtení drolí.
  // Jen skutečná tučná váha: uměle ztučněné pixelové tvary jsou nečitelné. Řezy 100 a silnější se nedají přečíst.
  'family=Redaction+20:wght@700',
  'family=Redaction+35:wght@700',
  'family=Redaction+50:wght@700',
  'family=Redaction+70:wght@700',
];
mkdirSync('public/fonty', { recursive: true });
let vystup = '/* Vygenerováno nastroje/stahni-fonty.mjs — písma jsou hostovaná lokálně (OFL). */\n';
for (const r of RODINY) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?${r}&display=swap`, { headers: { 'User-Agent': UA } })).text();
  for (const blok of css.split('@font-face').slice(1)) {
    const podmnozina = (blok.match(/\/\*\s*([\w-]+)\s*\*\//) ?? [])[1];
    // komentář s podmnožinou je PŘED blokem, proto ho hledáme v předchozím textu
    const predchozi = css.slice(0, css.indexOf(blok)).split('/*').at(-1) ?? '';
    const sada = (predchozi.match(/^\s*([\w-]+)\s*\*\//) ?? [])[1] ?? podmnozina;
    if (sada !== 'latin' && sada !== 'latin-ext') continue;
    const rodina = blok.match(/font-family:\s*'([^']+)'/)[1];
    const styl = blok.match(/font-style:\s*(\w+)/)[1];
    const vaha = blok.match(/font-weight:\s*(\d+)/)[1];
    const url = blok.match(/url\(([^)]+)\)/)[1];
    const rozsah = blok.match(/unicode-range:\s*([^;]+);/)[1];
    const soubor = `${rodina.replace(/\s+/g, '')}-${vaha}${styl === 'italic' ? 'i' : ''}-${sada}.woff2`;
    writeFileSync(`public/fonty/${soubor}`, Buffer.from(await (await fetch(url)).arrayBuffer()));
    vystup += `@font-face { font-family: "${rodina}"; font-style: ${styl}; font-weight: ${vaha}; font-display: swap; src: url(/fonty/${soubor}) format("woff2"); unicode-range: ${rozsah}; }\n`;
  }
}
writeFileSync('src/styles/fonty.css', vystup);
console.log('Hotovo: src/styles/fonty.css');
