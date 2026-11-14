import { describe, it, expect } from 'vitest';
import {
  DRUHY_PRAVIDEL, DUVODY, popisekDuvodu, napovedaDuvodu, DRUHY_ZNAKU, popisekDruhuZnaku, KONTROLNI_INSTITUCE, popisekInstituce,
  popisekZnaku, UPOZORNOVATELE, upozornovatel, popisekTypuUpozornovatele,
  cestyProDruh, popisekCesty, vynechaneKontroly, popisekKomu, popisekZaveru, popisekProspechu,
  OBLASTI, oblast, TYPY_HODNOCENI, popisekTypuHodnoceni,
} from '../../src/lib/pravidla-slovnik';
import { krokyProDruh, popisekKroku, stavPravidla, vProjednavani, prubeh, KROKY, UKONCUJICI } from '../../src/lib/pravidla-stavy';

describe('slovník pravidel', () => {
  it('cesty patří k druhům', () => {
    expect(cestyProDruh('zakon')).toEqual(['vladni-navrh', 'poslanecky-navrh', 'senatni-navrh', 'pozmenovaci-navrh']);
    expect(cestyProDruh('narizeni-vlady')).toEqual(['narizeni-vlady']);
    expect(cestyProDruh('vyhlaska')).toEqual(['vyhlaska-ministerstva']);
    expect(cestyProDruh('pravidla-programu')).toEqual(['pravidla-programu']);
  });
  it('popisky cest', () => {
    expect(popisekCesty('poslanecky-navrh')).toBe('Poslanecký návrh zákona');
    expect(popisekCesty('pozmenovaci-navrh')).toBe('Pozměňovací návrh');
    expect(popisekCesty('pravidla-programu')).toBe('Pravidla dotačního programu');
  });
  it('vynechané kontroly podle cesty', () => {
    expect(vynechaneKontroly('vladni-navrh')).toEqual([]);
    expect(vynechaneKontroly('narizeni-vlady')).toEqual([]);
    expect(vynechaneKontroly('poslanecky-navrh')).toEqual(['bez meziresortního připomínkového řízení', 'bez hodnocení dopadů regulace (RIA)']);
    expect(vynechaneKontroly('senatni-navrh')).toEqual(vynechaneKontroly('poslanecky-navrh'));
    expect(vynechaneKontroly('pozmenovaci-navrh')).toEqual([
      'bez meziresortního připomínkového řízení', 'bez hodnocení dopadů regulace (RIA)', 'bez stanoviska vlády', 'bez prvního čtení',
    ]);
  });
  it('komu a závěr', () => {
    expect(popisekKomu(['agrofert', 'babis'])).toBe('Andrej Babiš, Agrofert');
    expect(popisekKomu(['agrofert'])).toBe('Agrofert');
    expect(popisekZaveru('dolozen')).toBe('doložený prospěch');
    expect(popisekZaveru('pravdepodobny')).toBe('pravděpodobný prospěch');
  });
  it('závěr s tím, komu prospěch jde, čte se jako věta (4. pád, pořadí Babiš, Agrofert)', () => {
    expect(popisekProspechu('pravdepodobny', ['agrofert', 'babis'])).toBe('pravděpodobný prospěch pro Andreje Babiše a Agrofert');
    expect(popisekProspechu('dolozen', ['babis'])).toBe('doložený prospěch pro Andreje Babiše');
    expect(popisekProspechu('dolozen', ['agrofert'])).toBe('doložený prospěch pro Agrofert');
  });
});

describe('kroky a stav', () => {
  it('kroky podle druhu', () => {
    expect(krokyProDruh('zakon')).toContain('schvaleno-snemovnou');
    expect(krokyProDruh('zakon')).not.toContain('schvaleno');
    expect(krokyProDruh('narizeni-vlady')).toEqual(['pripominkove-rizeni', 'schvaleno', 'vyhlaseno', 'zruseno', 'zruseno-us']);
    for (const k of [...krokyProDruh('zakon'), ...krokyProDruh('vyhlaska')]) expect(KROKY).toContain(k);
  });
  it('každý krok má popisek', () => {
    for (const k of KROKY) expect(popisekKroku(k).length).toBeGreaterThan(0);
    expect(popisekKroku('zruseno-us')).toBe('Zrušeno Ústavním soudem');
  });
  it('stav je krok poslední události s krokem', () => {
    expect(stavPravidla([{ krok: 'predlozeno' }, {}, { krok: 'schvaleno-snemovnou' }, {}])).toBe('schvaleno-snemovnou');
  });
  it('stav bez kroku je chyba programu', () => {
    expect(() => stavPravidla([{}])).toThrow();
  });
  it('v projednávání', () => {
    expect(vProjednavani('schvaleno-snemovnou')).toBe(true);
    expect(vProjednavani('pripominkove-rizeni')).toBe(true);
    expect(vProjednavani('vyhlaseno')).toBe(false);
    for (const k of UKONCUJICI) expect(vProjednavani(k)).toBe(false);
  });
});

describe('průběh', () => {
  it('zákon: hotové fáze s datem a odkazem na událost', () => {
    const { faze, konec } = prubeh('zakon', [
      { datum: '2026-06-10', krok: 'predlozeno' },
      { datum: '2026-07-01' },
      { datum: '2026-09-20', krok: 'schvaleno-snemovnou' },
    ]);
    expect(faze.map(f => f.nazev)).toEqual(['Podáno', 'Sněmovna', 'Senát', 'Podpis', 'Vyhlášeno']);
    expect(faze.map(f => f.hotovo)).toEqual([true, true, false, false, false]);
    expect(faze[1]).toMatchObject({ datum: '2026-09-20', udalost: 2, poznamka: null });
    expect(faze[2]).toMatchObject({ datum: null, udalost: null });
    expect(konec).toBeNull();
  });
  it('vrácení Senátem a veto se přehlasováním nejsou hotové fáze', () => {
    const { faze, konec } = prubeh('zakon', [
      { datum: '2026-01-10', krok: 'predlozeno' },
      { datum: '2026-03-01', krok: 'schvaleno-snemovnou' },
      { datum: '2026-03-25', krok: 'vraceno-senatem' },
      { datum: '2026-04-10', krok: 'schvaleno-snemovnou' },
      { datum: '2026-04-20', krok: 'vetovano' },
      { datum: '2026-05-05', krok: 'schvaleno-snemovnou' },
      { datum: '2026-05-20', krok: 'vyhlaseno' },
    ]);
    expect(faze.find(f => f.id === 'snemovna')).toMatchObject({ hotovo: true, datum: '2026-05-05', udalost: 5 });
    expect(faze.find(f => f.id === 'senat')).toMatchObject({ hotovo: false, poznamka: 'Vráceno Senátem', udalost: 2 });
    expect(faze.find(f => f.id === 'podpis')).toMatchObject({ hotovo: false, poznamka: 'Vráceno prezidentem', udalost: 4 });
    expect(faze.find(f => f.id === 'vyhlaseno')).toMatchObject({ hotovo: true, udalost: 6 });
    expect(konec).toBeNull();
  });
  it('ukončující krok uzavře průběh', () => {
    const { konec } = prubeh('zakon', [{ datum: '2026-04-02', krok: 'predlozeno' }, { datum: '2026-05-14', krok: 'zamitnuto' }]);
    expect(konec).toEqual({ krok: 'zamitnuto', datum: '2026-05-14', udalost: 1 });
  });
  it('nařízení má vlastní fáze', () => {
    const { faze } = prubeh('narizeni-vlady', [{ datum: '2026-02-01', krok: 'pripominkove-rizeni' }, { datum: '2026-03-01', krok: 'schvaleno' }]);
    expect(faze.map(f => [f.nazev, f.hotovo])).toEqual([['Připomínky', true], ['Schváleno', true], ['Vyhlášeno', false]]);
  });
});

describe('slovník kontroly moci', () => {
  it('nové druhy mají vlastní cestu bez vynechaných kontrol a kroky jako ostatní nezákonné druhy', () => {
    expect(DRUHY_PRAVIDEL).toContain('usneseni-vlady');
    expect(DRUHY_PRAVIDEL).toContain('pokyn-ministerstva');
    expect(cestyProDruh('usneseni-vlady')).toEqual(['usneseni-vlady']);
    expect(cestyProDruh('pokyn-ministerstva')).toEqual(['pokyn-ministerstva']);
    expect(popisekCesty('usneseni-vlady')).toBe('Usnesení vlády');
    expect(popisekCesty('pokyn-ministerstva')).toBe('Pokyn ministerstva');
    expect(vynechaneKontroly('usneseni-vlady')).toEqual([]);
    expect(vynechaneKontroly('pokyn-ministerstva')).toEqual([]);
    expect(krokyProDruh('usneseni-vlady')).toEqual(krokyProDruh('narizeni-vlady'));
    expect(prubeh('pokyn-ministerstva', [{ datum: '2026-01-01', krok: 'vyhlaseno' }]).faze.map(f => f.nazev)).toEqual(['Připomínky', 'Schváleno', 'Vyhlášeno']);
  });
  it('důvody zařazení', () => {
    expect(DUVODY).toEqual(['prospech', 'kontrola-moci']);
    expect(popisekDuvodu('prospech')).toBe('Prospěch');
    expect(napovedaDuvodu('prospech')).toBe('Změny, které podle rozboru zdrojů prospívají Babišovi nebo Agrofertu');
    expect(napovedaDuvodu('kontrola-moci')).toBe('Změny, které mění kontrolu moci a instituce na to upozornily');
    expect(popisekDuvodu('kontrola-moci')).toBe('Kontrola moci');
  });
  it('každý druh znaku, instituce a upozorňovatel má neprázdný popisek', () => {
    for (const d of DRUHY_ZNAKU) expect(popisekDruhuZnaku(d).length).toBeGreaterThan(0);
    for (const i of KONTROLNI_INSTITUCE) {
      expect(popisekInstituce(i).length).toBeGreaterThan(0);
      expect(popisekInstituce(i, 'plne').length).toBeGreaterThanOrEqual(popisekInstituce(i).length);
    }
    for (const u of UPOZORNOVATELE) {
      expect(upozornovatel(u).nazev.length).toBeGreaterThan(0);
      expect(['instituce', 'profesni-organizace']).toContain(upozornovatel(u).typ);
    }
  });
  it('uzavřené seznamy odpovídají specifikaci', () => {
    expect(DRUHY_ZNAKU).toEqual(['instituce', 'prilepek', 'legislativni-nouze', 'prvni-cteni', 'zpetna-ucinnost']);
    expect(KONTROLNI_INSTITUCE).toEqual(['soudy', 'statni-zastupitelstvi', 'nku', 'uohs', 'ombudsman', 'policie', 'media-verejne-sluzby', 'dohled-strany', 'cnb', 'pristup-k-informacim', 'registr-smluv', 'rozpoctova-rada', 'rozpoctova-pravidla', 'statni-sluzba', 'statni-podniky', 'neziskove-organizace']);
    expect(UPOZORNOVATELE.filter(u => upozornovatel(u).typ === 'instituce')).toEqual(['ustavni-soud', 'legislativni-rada-vlady', 'ombudsman', 'nku', 'evropska-komise', 'benatska-komise', 'nejvyssi-soud', 'nejvyssi-statni-zastupitelstvi', 'legislativni-odbor-snemovny', 'narodni-rozpoctova-rada']);
    expect(UPOZORNOVATELE.filter(u => upozornovatel(u).typ === 'profesni-organizace')).toEqual(['soudcovska-unie', 'unie-statnich-zastupcu', 'ceska-advokatni-komora', 'syndikat-novinaru']);
  });
  it('popisky znaků a typů', () => {
    expect(popisekZnaku({ druh: 'instituce', instituce: 'soudy' })).toBe('soudy');
    expect(popisekZnaku({ druh: 'zpetna-ucinnost' })).toBe('zpětná účinnost');
    expect(popisekZnaku({ druh: 'prilepek' })).toBe('přílepek');
    expect(popisekInstituce('dohled-strany')).toBe('dohled nad financováním stran');
    expect(popisekInstituce('dohled-strany', 'plne')).toBe('Úřad pro dohled nad hospodařením politických stran a politických hnutí');
    expect(upozornovatel('soudcovska-unie')).toEqual({ nazev: 'Soudcovská unie ČR', typ: 'profesni-organizace' });
    expect(popisekTypuUpozornovatele('profesni-organizace')).toBe('profesní organizace');
    expect(popisekTypuUpozornovatele('instituce')).toBe('instituce');
    expect(popisekDruhuZnaku('instituce')).toBe('mění instituci nebo pravidla státu');
    expect(popisekInstituce('statni-sluzba')).toBe('státní služba');
    expect(popisekInstituce('rozpoctova-pravidla', 'plne')).toBe('pravidla rozpočtové odpovědnosti (limity dluhu a schodku, schvalování schodku Sněmovnou)');
    expect(upozornovatel('narodni-rozpoctova-rada')).toEqual({ nazev: 'Národní rozpočtová rada', typ: 'instituce' });
  });
});

describe('slovník oblastí', () => {
  it('osm oblastí v pořadí specifikace (pořadí karet)', () => {
    expect(OBLASTI).toEqual(['dotace-stret-zajmu', 'zemedelstvi-potraviny', 'soudy-policie', 'kontrolni-urady', 'verejne-finance', 'verejnopravni-media', 'statni-sprava', 'obcanska-spolecnost']);
  });
  it('názvy a popisky', () => {
    expect(oblast('dotace-stret-zajmu')).toEqual({ nazev: 'Dotace a střet zájmů', popisek: 'Kdo dostane peníze z dotací a kdo to hlídá' });
    expect(oblast('soudy-policie').nazev).toBe('Soudy, státní zastupitelství a policie');
    for (const o of OBLASTI) {
      expect(oblast(o).nazev.length).toBeGreaterThan(0);
      expect(oblast(o).popisek.length).toBeGreaterThan(0);
    }
  });
  it('popisky nepojmenovávají vládu ani konkrétní osobu či firmu', () => {
    for (const o of OBLASTI) expect(`${oblast(o).nazev} ${oblast(o).popisek}`).not.toMatch(/babiš|agrofert|vlád/i);
  });
  it('typy hodnocení v pořadí zobrazení', () => {
    expect(TYPY_HODNOCENI).toEqual(['vlada', 'instituce', 'odbornik']);
    expect(popisekTypuHodnoceni('vlada')).toBe('Stanovisko vlády');
    expect(popisekTypuHodnoceni('instituce')).toBe('Instituce');
    expect(popisekTypuHodnoceni('odbornik')).toBe('Odborníci');
  });
});
