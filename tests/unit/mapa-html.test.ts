import { describe, it, expect } from 'vitest';
import { overAdresar } from '../../src/lib/validace';
import { sestavGraf, rozlozMapu } from '../../src/lib/mapa';
import { svgMapy, stromMapy, kartaHtml } from '../../src/lib/mapa-html';
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
    expect(svg.match(/class="m-cara m-cara-navaznost m-vedlejsi"/g)).toHaveLength(2);
    // hlavní strom bez m-vedlejsi; vedlejší vazby (druhý aktér, další vztah) se kreslí slaběji
    const r = rozlozMapu(graf, null);
    expect(svg.match(/class="m-cara m-cara-[a-z]+"/g)).toHaveLength(r.cary.filter(c => c.hlavni).length);
    const lomena = r.cary.find(c => c.hlavni && c.dz !== c.d)!;
    expect(svg).toContain(`<path class="m-zasah" d="${lomena.dz}"/>`);
    // role a období na mapě nejsou, ukazuje je karta vazeb
    expect(svg).not.toContain('m-popisek');
    expect(svg).not.toContain('vlastní · 1995–2017');
  });
  it('escapuje názvy', () => {
    const r = { sirka: 100, vyska: 50, uzly: [{ id: 'k:x', typ: 'kauza' as const, nazev: '<script>', x: 0, y: 20, w: 50 }], cary: [] };
    expect(svgMapy(r)).toContain('&lt;script&gt;');
  });
  it('prázdné rozložení = prázdné SVG', () => expect(svgMapy(rozlozMapu(graf, []))).toBe('<svg class="mapa-svg" aria-hidden="true" focusable="false" width="0" height="0"></svg>'));
});

describe('kartaHtml', () => {
  it('nadpis, podnadpis, skupiny s rolemi, zbytek a akce; vše escapované', () => {
    const html = kartaHtml({
      nazev: '<b>Kauza</b>', podnadpis: '2018 – dosud', text: null, akce: 'Kliknutím otevřete detail kauzy.',
      skupiny: [{ nadpis: 'Aktéři v kauze', polozky: [{ nazev: 'A & B', role: 'příjemce dotace' }, { nazev: 'C', role: null }], dalsich: 3 }],
    });
    expect(html).toContain('<p class="k-nadpis">&lt;b&gt;Kauza&lt;/b&gt;</p>');
    expect(html).toContain('<li><span class="k-nazev">A &amp; B</span><span class="k-role">příjemce dotace</span></li>');
    expect(html).toContain('<li><span class="k-nazev">C</span></li>');
    expect(html).toContain('<li class="k-dalsi">a 3 dalších</li>');
    expect(html).toContain('<p class="k-akce">Kliknutím otevřete detail kauzy.</p>');
  });
  it('bez vypsaných položek řekne jen počet', () => {
    expect(kartaHtml({ nazev: 'X', podnadpis: null, text: null, akce: null, skupiny: [{ nadpis: 'V kauzách', polozky: [], dalsich: 4 }] }))
      .toContain('<li class="k-dalsi">celkem 4</li>');
  });
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

describe('strom: kauza pod každým svým aktérem', () => {
  it('Žeta je pod Holdingem (hlavní) i pod Firmou Alfa (vedlejší řádek)', () => {
    const html = stromMapy(graf);
    expect(html.match(/<li class="s-kauza" data-uzel="k:zeta-stret" data-hrana="h\d+" data-hlavni/g)).toHaveLength(1);
    expect(html.match(/<li class="s-kauza" data-uzel="k:zeta-stret" data-hrana="h\d+" data-slug/g)).toHaveLength(1);
  });
});
