import { describe, it, expect } from 'vitest';
import { pravidloSchema, pravidloSchemaKoncepty } from '../../src/lib/schema-pravidla';
import { platnePravidlo } from './ukazka';

const chyby = (data: unknown, schema = pravidloSchema) => {
  const r = schema.safeParse(data);
  return r.success ? [] : r.error.issues.map(i => i.message);
};
const cesty = (data: unknown, schema = pravidloSchema) => {
  const r = schema.safeParse(data);
  return r.success ? [] : r.error.issues.map(i => i.path.join('.'));
};
const s = (upravy: (p: any) => void) => { const p: any = platnePravidlo(); upravy(p); return p; };

describe('pravidloSchema', () => {
  it('přijme platné pravidlo a doplní výchozí hodnoty', () => {
    expect(chyby(platnePravidlo())).toEqual([]);
    const p = pravidloSchema.parse(platnePravidlo());
    expect(p.vyhrady).toEqual([]);
    expect(p.kauzy).toEqual([]);
    expect(p.opravy).toEqual([]);
    expect(p.prospech.retezec[0].odhad).toBe(false);
  });
  it('převede data z YAML (Date) na text, i účinnost v budoucnosti', () => {
    const p = pravidloSchema.parse({ ...platnePravidlo(), overeno: new Date('2026-11-09T00:00:00Z'), ucinnostOd: new Date('2099-01-01T00:00:00Z') });
    expect(p.overeno).toBe('2026-11-09');
    expect(p.ucinnostOd).toBe('2099-01-01');
  });
  it('odmítne neexistující datum účinnosti', () => expect(chyby({ ...platnePravidlo(), ucinnostOd: '2027-02-30' }).join(' ')).toMatch(/Datum účinnosti neexistuje/));
  it('odmítne událost v budoucnosti', () => expect(chyby(s(p => { p.udalosti[0].datum = '2099-01-01'; })).join(' ')).toMatch(/leží v budoucnosti/));
  it('odmítne název delší než 60 znaků', () => expect(chyby({ ...platnePravidlo(), nazev: 'x'.repeat(61) }).join(' ')).toMatch(/nejvýš 60 znaků/));
  it('odmítne chybějící stanovisko', () => expect(cesty(s(p => { delete p.stanovisko; }))).toEqual(['stanovisko']));
  it('odmítne prázdné zdroje', () => expect(chyby(s(p => { p.zdroje = []; })).join(' ')).toMatch(/aspoň jeden zdroj/));
  it('odmítne prázdné události', () => expect(chyby(s(p => { p.udalosti = []; })).join(' ')).toMatch(/aspoň jednu událost/));
  it('odmítne chybějící prospěch', () => expect(cesty(s(p => { delete p.prospech; }))).toEqual(['prospech']));
  it('odmítne chybějící ověření mimo režim konceptů, v konceptech smí být null', () => {
    expect(chyby(s(p => { delete p.overeno; })).length).toBeGreaterThan(0);
    expect(chyby(s(p => { p.overeno = null; }), pravidloSchemaKoncepty)).toEqual([]);
  });
  it('odmítne neznámou vlastnost', () => expect(chyby({ ...platnePravidlo(), typ: 'kauza' }).length).toBeGreaterThan(0));

  describe('řetězec a závěr', () => {
    it('řetězec musí mít aspoň 2 kroky', () => expect(chyby(s(p => { p.prospech.retezec.pop(); })).join(' ')).toMatch(/aspoň 2 kroky/));
    it('doložený prospěch nesmí mít odhad', () => expect(chyby(s(p => { p.prospech.retezec[1].odhad = true; })).join(' ')).toMatch(/nesmí mít krok s odhadem/));
    it('pravděpodobný prospěch musí mít odhad', () => expect(chyby(s(p => { p.prospech.zaver = 'pravdepodobny'; })).join(' ')).toMatch(/vyžaduje aspoň jeden krok s odhadem/));
    it('pravděpodobný prospěch s odhadem projde', () => expect(chyby(s(p => { p.prospech.zaver = 'pravdepodobny'; p.prospech.retezec[1].odhad = true; }))).toEqual([]));
    it('první krok musí mít primární zdroj', () => expect(chyby(s(p => { p.prospech.retezec[0].zdroje = [2]; })).join(' ')).toMatch(/První krok řetězce .* primární zdroj/));
    it('komu musí být neprázdné a bez opakování', () => {
      expect(chyby(s(p => { p.prospech.komu = []; })).join(' ')).toMatch(/aspoň k jednomu z: babis, agrofert/);
      expect(chyby(s(p => { p.prospech.komu = ['babis', 'babis']; })).join(' ')).toMatch(/dvakrát/);
      expect(cesty(s(p => { p.prospech.komu = ['zemedelci']; }))).toEqual(['prospech.komu.0']);
    });
  });

  describe('cesta a kroky', () => {
    it('pozměňovací návrh vyžaduje pripojenoK', () => expect(chyby(s(p => { p.cesta = 'pozmenovaci-navrh'; })).join(' ')).toMatch(/ke kterému zákonu/));
    it('pozměňovací návrh s pripojenoK projde', () => expect(chyby(s(p => { p.cesta = 'pozmenovaci-navrh'; p.pripojenoK = { nazev: 'Fiktivní zákon', zdroje: [1] }; }))).toEqual([]));
    it('pripojenoK u jiné cesty je chyba', () => expect(chyby(s(p => { p.pripojenoK = { nazev: 'Fiktivní zákon', zdroje: [1] }; })).join(' ')).toMatch(/patří jen k pozměňovacímu návrhu/));
    it('cesta musí patřit k druhu', () => expect(chyby(s(p => { p.druh = 'narizeni-vlady'; })).join(' ')).toMatch(/nepatří k druhu/));
    it('aspoň jedna událost musí mít krok', () => expect(chyby(s(p => { delete p.udalosti[0].krok; })).join(' ')).toMatch(/krok projednávání/));
    it('krok musí patřit k druhu', () => expect(chyby(s(p => { p.udalosti[0].krok = 'schvaleno'; })).join(' ')).toMatch(/Krok „schvaleno“ .* nepatří k druhu „zakon“/));
    it('neznámý krok je chyba', () => expect(cesty(s(p => { p.udalosti[0].krok = 'odhlasovano'; }))).toEqual(['udalosti.0.krok']));
  });

  describe('odkazy a pořadí', () => {
    it('duplicitní id zdroje', () => expect(chyby(s(p => { p.zdroje[1].id = 1; })).join(' ')).toMatch(/Duplicitní id zdroje 1/));
    it.each([
      ['událost', (p: any) => { p.udalosti[0].zdroje = [9]; }, /Událost 1 \(„Návrh podán“\) odkazuje na neexistující zdroj 9/],
      ['připojení k zákonu', (p: any) => { p.cesta = 'pozmenovaci-navrh'; p.pripojenoK = { nazev: 'Fiktivní zákon', zdroje: [9] }; }, /Připojení k zákonu odkazuje na neexistující zdroj 9/],
      ['stanovisko', (p: any) => { p.stanovisko.zdroje = [9]; }, /Stanovisko odkazuje na neexistující zdroj 9/],
      ['krok řetězce', (p: any) => { p.prospech.retezec[1].zdroje = [9]; }, /Krok řetězce 2 odkazuje na neexistující zdroj 9/],
      ['další dotčení', (p: any) => { p.prospech.dalsiDotceni = { text: 'Velké podniky.', zdroje: [9] }; }, /Další dotčení odkazuje na neexistující zdroj 9/],
      ['výhrada', (p: any) => { p.vyhrady = [{ kdo: 'Fiktivní rada', text: 'Výhrada.', zdroje: [9] }]; }, /Výhrada \(„Fiktivní rada“\) odkazuje na neexistující zdroj 9/],
      ['vazba na kauzu', (p: any) => { p.kauzy = [{ kauza: 'kauza-a', popis: 'Souvisí.', zdroje: [9] }]; }, /Vazba na kauzu „kauza-a“ odkazuje na neexistující zdroj 9/],
    ])('neexistující zdroj: %s', (_, uprava, hlaska) => expect(chyby(s(uprava)).join(' ')).toMatch(hlaska));
    it('vazba na kauzu dvakrát', () => expect(chyby(s(p => { p.kauzy = [{ kauza: 'a', popis: 'x', zdroje: [2] }, { kauza: 'a', popis: 'y', zdroje: [2] }]; })).join(' ')).toMatch(/Vazba na kauzu „a“ je uvedena dvakrát/));
    it('události musí jít chronologicky', () => {
      const p = s(p => { p.udalosti.push({ datum: '2026-05-01', nazev: 'Dřívější', popis: 'x', zdroje: [1] }); });
      expect(chyby(p).join(' ')).toMatch(/nejsou v časovém pořadí/);
    });
  });
});
