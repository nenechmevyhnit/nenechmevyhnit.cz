import { describe, it, expect } from 'vitest';
import { overAdresar } from '../../src/lib/validace';
import { sestavGraf, rozlozMapu } from '../../src/lib/mapa';
import { svgMapy, stromMapy } from '../../src/lib/mapa-html';
import { escapujHtml } from '../../src/lib/html';

const { zaznamy, akteri } = overAdresar('tests/fixtures/obsah');
const graf = sestavGraf(zaznamy, akteri);

describe('escapujHtml', () => {
  it('zneškodní znaky HTML', () => expect(escapujHtml('<a href="x">&</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;'));
});

describe('svgMapy', () => {
  const svg = svgMapy(rozlozMapu(graf, null));
  it('je skryté pro čtečky a má rozměry rozložení', () => {
    expect(svg).toMatch(/^<svg class="mapa-svg"[^>]* aria-hidden="true"/);
    const r = rozlozMapu(graf, null);
    expect(svg).toContain(`viewBox="0 0 ${r.sirka} ${r.vyska}"`);
  });
  it('uzly, čáry a popisky nesou data-atributy', () => {
    expect(svg.match(/class="m-uzel m-kauza"/g)).toHaveLength(6);
    expect(svg.match(/class="m-uzel m-akter"/g)).toHaveLength(3);
    expect(svg).toContain('data-uzel="k:alfa-dotace"');
    expect(svg.match(/class="m-cara m-cara-navaznost"/g)).toHaveLength(2);
    expect(svg).toContain('>vlastní · 1995–2017</text>');
  });
  it('escapuje názvy', () => {
    const r = { sirka: 100, vyska: 50, uzly: [{ id: 'k:x', typ: 'kauza' as const, nazev: '<script>', x: 0, y: 20, w: 50 }], cary: [] };
    expect(svgMapy(r)).toContain('&lt;script&gt;');
  });
  it('prázdné rozložení = prázdné SVG', () => expect(svgMapy(rozlozMapu(graf, []))).toBe('<svg class="mapa-svg" aria-hidden="true" focusable="false" width="0" height="0"></svg>'));
});

describe('stromMapy', () => {
  const html = stromMapy(graf);
  it('kořenem je střed', () => expect(html.startsWith('<ul class="strom"><li class="s-stred" data-uzel="babis"><span class="s-nazev">Andrej Babiš</span>')).toBe(true));
  it('aktér s podstromem má rozbalovací tlačítko a hloubku', () => {
    expect(html).toMatch(/<li class="s-akter-polozka" data-uzel="a:fond-sigma" data-hrana="h\d+" data-hlavni data-hloubka="1">/);
    expect(html).toMatch(/<button type="button" class="s-akter" aria-expanded="true" aria-controls="s-pod-\d+">Fond Sigma<\/button>/);
  });
  it('vedlejší vztah aktéra je jen odkazový řádek bez podstromu', () => {
    const vedlejsi = html.match(/<li class="s-akter-polozka" data-uzel="a:holding-omega" data-hrana="h\d+" data-hloubka="2">.*?<\/li>/)![0];
    expect(vedlejsi).toContain('<button type="button" class="s-akter">Holding Omega</button>');
    expect(vedlejsi).toContain('vlastní · 1995–2017');
    expect(vedlejsi).not.toContain('<ul id="s-pod');
  });
  it('kauza je odkaz s roky, rolí a vysvětlením vazby se zdrojem', () => {
    expect(html).toMatch(/<li class="s-kauza" data-uzel="k:alfa-dotace" data-hrana="(h\d+)" data-hlavni data-slug="alfa-dotace"><div class="s-radek"><a href="\/kauzy\/alfa-dotace\/" data-slug="alfa-dotace">Testovací kauza Alfa<\/a>/);
    expect(html).toContain('<span class="s-role">příjemce dotace</span>');
    expect(html).toMatch(/<div class="s-vazba" id="s-vazba-h\d+" hidden><p>Firma Alfa žádala o fiktivní dotaci pro malé podniky\.<\/p><ul class="s-zdroje"><li><a href="https:\/\/example\.com\/alfa\/clanek"/);
  });
  it('návaznost je u navazující kauzy jako odkaz', () => {
    expect(html).toMatch(/<div class="s-navazuje" data-hrana="h\d+">navazuje na: <a href="\/kauzy\/alfa-dotace\/" data-slug="alfa-dotace">Testovací kauza Alfa<\/a>/);
  });
  it('kauza bez aktérů visí pod středem bez role a bez ⓘ', () => {
    const beta = html.match(/<li class="s-kauza" data-uzel="k:beta-archiv".*?<\/li>/)![0];
    expect(beta).not.toContain('s-role');
    expect(beta).not.toContain('s-info');
  });
});
