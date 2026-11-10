import { describe, it, expect } from 'vitest';
import { kauzaSchema, rokZData } from '../../src/lib/schema';
import { popisekStavu, STAVY } from '../../src/lib/stavy';
import { platnaKauza } from './ukazka';

const chyby = (data: unknown) => {
  const r = kauzaSchema.safeParse(data);
  return r.success ? [] : r.error.issues.map(i => i.message);
};

describe('kauzaSchema', () => {
  it('přijme platnou kauzu', () => expect(chyby(platnaKauza())).toEqual([]));

  it('převede datum z YAML (Date) na text', () => {
    const k = { ...platnaKauza(), overeno: new Date('2026-11-09T00:00:00Z') };
    const r = kauzaSchema.parse(k);
    expect(r.overeno).toBe('2026-11-09');
  });

  it('odmítne neznámý stav', () => expect(chyby({ ...platnaKauza(), stav: 'vinen' }).length).toBeGreaterThan(0));
  it('odmítne kauzu bez zdrojů', () => expect(chyby({ ...platnaKauza(), zdroje: [] }).length).toBeGreaterThan(0));
  it('odmítne událost bez zdroje', () => {
    const k = platnaKauza(); (k.udalosti as any)[0].zdroje = [];
    expect(chyby(k).join(' ')).toMatch(/aspoň jeden zdroj/);
  });
  it('odmítne chybějící stanovisko', () => {
    const k = platnaKauza(); delete k.stanovisko;
    expect(chyby(k).length).toBeGreaterThan(0);
  });
  it('odmítne chybějící datum ověření', () => {
    const k = platnaKauza(); delete k.overeno;
    expect(chyby(k).length).toBeGreaterThan(0);
  });
  it('odmítne duplicitní id zdroje', () => {
    const k = platnaKauza(); (k.zdroje as any)[1].id = 1;
    expect(chyby(k).join(' ')).toMatch(/Duplicitní id zdroje 1/);
  });
  it('odmítne odkaz události na neexistující zdroj', () => {
    const k = platnaKauza(); (k.udalosti as any)[0].zdroje = [7];
    expect(chyby(k).join(' ')).toMatch(/neexistující zdroj 7/);
  });
  it('odmítne odkaz stanoviska na neexistující zdroj', () => {
    const k = platnaKauza(); (k.stanovisko as any).zdroje = [9];
    expect(chyby(k).join(' ')).toMatch(/neexistující zdroj 9/);
  });
  it('odmítne do < od', () => expect(chyby({ ...platnaKauza(), do: 2005 }).join(' ')).toMatch(/Rok konce/));
  it('stav "jine" vyžaduje poznámku', () => {
    const k = { ...platnaKauza(), stav: 'jine' }; delete (k as any).stavPoznamka;
    expect(chyby(k).join(' ')).toMatch(/poznámk/);
  });
  it('odmítne událost mimo rozsah kauzy', () => {
    const k = { ...platnaKauza(), do: 2011 };
    expect(chyby(k).join(' ')).toMatch(/mimo rozsah/);
  });
  it('odmítne zdroj bez URL', () => {
    const k = platnaKauza(); delete (k.zdroje as any)[0].url;
    expect(chyby(k).length).toBeGreaterThan(0);
  });
  it('odmítne zdroj s jiným než http(s) odkazem', () => {
    const k = platnaKauza(); (k.zdroje as any)[0].url = 'ftp://example.com/x';
    expect(chyby(k).length).toBeGreaterThan(0);
  });
});

describe('rokZData a stavy', () => {
  it('rokZData', () => {
    expect(rokZData('2008')).toBe(2008);
    expect(rokZData('2008-03')).toBe(2008);
    expect(rokZData('2008-03-15')).toBe(2008);
  });
  it('každý stav má popisek', () => {
    for (const s of STAVY) expect(popisekStavu(s).length).toBeGreaterThan(0);
  });
});

describe('kauzaSchema — integrita dat (závěrečná kontrola)', () => {
  const zitra = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  it('odmítne neexistující datum', () => {
    const k = platnaKauza(); (k.udalosti as any)[1].datum = '2012-13-45';
    expect(chyby(k).join(' ')).toMatch(/neexistující datum/);
  });
  it('odmítne neexistující měsíc', () => {
    const k = platnaKauza(); (k.udalosti as any)[0].datum = '2010-13';
    expect(chyby(k).join(' ')).toMatch(/neexistující datum/);
  });
  it('odmítne událost v budoucnosti', () => {
    const k = platnaKauza(); (k.udalosti as any)[1].datum = zitra;
    expect(chyby(k).join(' ')).toMatch(/v budoucnosti/);
  });
  it('odmítne datum ověření v budoucnosti', () => {
    expect(chyby({ ...platnaKauza(), overeno: zitra }).join(' ')).toMatch(/v budoucnosti/);
  });
  it('odmítne události mimo časové pořadí', () => {
    const k = platnaKauza(); (k.udalosti as any).reverse();
    expect(chyby(k).join(' ')).toMatch(/pořadí/);
  });
  it('odmítne archivní odkaz s jiným než http(s) schématem', () => {
    const k = platnaKauza(); (k.zdroje as any)[0].archiv = 'javascript:alert(1)';
    expect(chyby(k).length).toBeGreaterThan(0);
  });
  it('odmítne neznámý klíč (překlep by tiše zahodil opravu)', () => {
    expect(chyby({ ...platnaKauza(), oprava: [{ datum: '2026-11-01', popis: 'x' }] }).length).toBeGreaterThan(0);
  });
  it('odmítne název ze samých mezer', () => {
    expect(chyby({ ...platnaKauza(), nazev: '   ' }).length).toBeGreaterThan(0);
  });
  it('název smí mít nejvýš 36 znaků, aby byl na ose celý vidět', () => {
    expect(chyby({ ...platnaKauza(), nazev: 'x'.repeat(36) })).toEqual([]);
    expect(chyby({ ...platnaKauza(), nazev: 'x'.repeat(37) }).join(' ')).toMatch(/36 znaků/);
  });
});
