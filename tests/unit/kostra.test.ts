import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Projekt se 13. 11. 2026 přejmenoval z „Nenechme vyhnít“ (nenechmevyhnit.cz) na „Posuďte sami“ (posudtesami.cz).
// Nesmí se vrátit stará doména, starý repozitář (nenechmevyhnit/nenechmevyhnit.cz) ani adresy starého
// GitHub účtu nenechmevyhnit (dnes posudtesami/posudtesami.cz). Kontaktní e-mail zatím nese starý název
// a starou noreply adresu potřebuje kontrola identity commitů, proto je test nehlídá.
const STARY_NAZEV = /nenechme\s+vyhn/i;
const STARA_DOMENA = /nenechmevyhnit\.cz|github\.com\/nenechmevyhnit|nenechmevyhnit\.github\.io/;
const BINARNI = /\.(png|webp|jpe?g|gif|ico|woff2?|ttf|otf|pdf)$/i;

const soubory = (cesta: string): string[] => statSync(cesta).isFile()
  ? [cesta]
  : readdirSync(cesta, { recursive: true, encoding: 'utf8' }).map(f => join(cesta, f)).filter(f => statSync(f).isFile());

describe('kostra', () => {
  it('CNAME obsahuje doménu', () => {
    expect(readFileSync('public/CNAME', 'utf8').trim()).toBe('posudtesami.cz');
  });

  it('starý název projektu ani stará doména nikde nezůstaly', () => {
    const nalezy = ['src', 'public', 'tests', 'nastroje', 'scripts', '.github', 'astro.config.mjs', 'package.json']
      .flatMap(soubory)
      .filter(f => !BINARNI.test(f) && !f.endsWith('kostra.test.ts'))
      .filter(f => { const text = readFileSync(f, 'utf8'); return STARY_NAZEV.test(text) || STARA_DOMENA.test(text); });
    expect(nalezy).toEqual([]);
  });
});
