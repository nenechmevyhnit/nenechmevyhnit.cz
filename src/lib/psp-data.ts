import { Document, isMap, isScalar, isSeq } from 'yaml';
import { idSnimku, nesouladySouctu, ID_HLASOVANI, type Hlas, type Snimek } from './schema-hlasovani';

/** Chyba v datech PSP nebo v požadovaném hlasování. Skript ji vypíše a snímek nezapíše. */
export class ChybaPsp extends Error {}

/** Rok v názvu archivu hl-<rok>ps.zip podle volebního období. */
export const ROK_OBDOBI: Readonly<Record<number, number>> = { 10: 2025 };

export type CilHlasovani = { obdobi: number; schuze: number; cislo: number };

/** Tabulky otevřených dat PSP jako řádky rozdělené na sloupce (viz ctiUnl). */
export type VstupPsp = {
  hlasovani: string[][]; // hl<rok>s.unl
  hlasy: string[][];     // hl<rok>h1.unl
  omluvy: string[][];    // omluvy.unl
  zmatecne: string[][];  // zmatecne.unl
  osoby: string[][];     // osoby.unl
  poslanci: string[][];  // poslanec.unl
  organy: string[][];    // organy.unl
  zarazeni: string[][];  // zarazeni.unl
};

/** Soubory otevřených dat PSP jsou v kódování windows-1250. */
export const dekodujUnl = (data: Uint8Array): string => new TextDecoder('windows-1250').decode(data);

/** Řádky .unl: sloupce oddělené svislítkem, řádek končí svislítkem. Prázdné řádky vynechá. */
export function ctiUnl(text: string): string[][] {
  return text.split(/\r?\n/).filter(r => r.trim() !== '').map(r => {
    const sloupce = r.split('|').map(s => s.trim());
    if (sloupce.length > 1 && sloupce[sloupce.length - 1] === '') sloupce.pop();
    return sloupce;
  });
}

export function datumZPsp(d: string): string {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(d);
  if (!m) throw new ChybaPsp(`Neznámý tvar data „${d}“ (čekám DD.MM.RRRR)`);
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/** Převod kódu hlasu PSP (spec hlasování, oddíl 3). Nepřihlášený (@) s omluvou na čas hlasování je omluven. */
export function hlasZKodu(kod: string, omluven: boolean): Hlas {
  switch (kod) {
    case 'A': return 'pro';
    case 'B': case 'N': return 'proti';
    case 'C': return 'zdrzel';
    case 'F': return 'nehlasoval';
    case 'K': return 'zdrzel-nehlasoval';
    case 'M': return 'omluven';
    case '@': return omluven ? 'omluven' : 'neprihlasen';
    default: throw new ChybaPsp(`Neznámý kód hlasu „${kod}“`);
  }
}

/** Zařazení má přesnost na hodinu ('RRRR-MM-DD HH'), okamžik hlasování na minutu ('RRRR-MM-DD HH:MM'). */
const naMinuty = (t: string): string => (t.length === 13 ? `${t}:00` : t);

/** Zkratka klubu, jehož byl poslanec členem v okamžiku hlasování, nebo null (nezařazený).
 *  kluby: id orgánu → zkratka; clenstvi: řádky zarazeni.unl. */
export function klubVDobe(idOsoba: string, okamzik: string, kluby: ReadonlyMap<string, string>, clenstvi: string[][]): string | null {
  let platne: string[] | undefined;
  for (const z of clenstvi) {
    if (z[0] !== idOsoba || z[2] !== '0' || !kluby.has(z[1])) continue;
    const od = naMinuty(z[3]);
    const doKdy = z[4] ? naMinuty(z[4]) : '';
    if (od > okamzik || (doKdy !== '' && okamzik >= doKdy)) continue;
    if (!platne || od > naMinuty(platne[3])) platne = z;
  }
  return platne ? kluby.get(platne[1])! : null;
}

const abeceda = new Intl.Collator('cs');
type Razeni = { prijmeni: string; jmeno: string; id: number };
const poradiPoslancu = (a: Razeni, b: Razeni): number =>
  abeceda.compare(a.prijmeni, b.prijmeni) || abeceda.compare(a.jmeno, b.jmeno) || a.id - b.id;

/** Snímek jednoho hlasování z tabulek PSP (spec hlasování, oddíly 3–5). Při jakékoli nesrovnalosti vyhodí ChybaPsp. */
export function sestavSnimek(v: VstupPsp, cil: CilHlasovani, stazeno: string): Snimek {
  const id = idSnimku({ komora: 'psp', ...cil });
  const radky = v.hlasovani.filter(r => Number(r[2]) === cil.schuze && Number(r[3]) === cil.cislo);
  if (radky.length === 0) throw new ChybaPsp(`${id}: hlasování v datech PSP není`);
  if (radky.length > 1) throw new ChybaPsp(`${id}: v datech PSP je víc hlasování se stejnou schůzí a číslem`);
  const h = radky[0];
  const idHlasovani = h[0];
  const idOrganu = h[1];
  if (v.organy.find(o => o[0] === idOrganu)?.[3] !== `PSP${cil.obdobi}`) throw new ChybaPsp(`${id}: hlasování nepatří do ${cil.obdobi}. volebního období`);
  if (v.zmatecne.some(z => z[0] === idHlasovani)) throw new ChybaPsp(`${id}: hlasování je prohlášené za zmatečné`);
  if (h[13] !== 'N') throw new ChybaPsp(`${id}: nejde o běžné hlasování (druh „${h[13]}“), jmenovité hlasy chybí`);
  const vysledek = h[14] === 'A' ? 'prijato' : h[14] === 'R' ? 'zamitnuto' : undefined;
  if (!vysledek) throw new ChybaPsp(`${id}: neznámý výsledek hlasování „${h[14]}“`);
  const datum = datumZPsp(h[5]);
  const cas = h[6];
  // čas se s časy omluv porovnává jako text, proto musí mít hodiny i minuty vždy dvě číslice
  if (!/^\d{2}:\d{2}$/.test(cas)) throw new ChybaPsp(`${id}: čas hlasování „${cas}“ není ve tvaru HH:MM`);
  const okamzik = `${datum} ${cas}`;

  // PSP vede nezařazené poslance jako pseudoklub „Nezařaz“; ve snímku mají klub null.
  const klubyObdobi = v.organy.filter(o => o[1] === idOrganu && o[2] === '1' && o[3] !== 'Nezařaz');
  const kluby = new Map(klubyObdobi.map(o => [o[0], o[3]] as const));
  const nazvyKlubu = new Map(klubyObdobi.map(o => [o[3], o[4]] as const));
  const clenstvi = v.zarazeni.filter(z => z[2] === '0' && kluby.has(z[1]));
  const osobaPoslance = new Map(v.poslanci.map(p => [p[0], p[1]] as const));
  const osoby = new Map(v.osoby.map(o => [o[0], o] as const));

  const hlasy = v.hlasy.filter(r => r[1] === idHlasovani);
  if (hlasy.length !== 200) throw new ChybaPsp(`${id}: v datech je ${hlasy.length} jmenovitých hlasů místo 200`);
  const omluven = (idPoslance: string) => v.omluvy.some(o => o[0] === idOrganu && o[1] === idPoslance && o[2] === h[5]
    && (!o[3] || o[3] <= cas) && (!o[4] || cas <= o[4]));
  const poslanci = hlasy.map(r => {
    const idPoslance = r[0];
    const idOsoba = osobaPoslance.get(idPoslance);
    const osoba = idOsoba === undefined ? undefined : osoby.get(idOsoba);
    if (idOsoba === undefined || !osoba) throw new ChybaPsp(`${id}: poslanec ${idPoslance} chybí v poslanci.zip`);
    return {
      id: Number(idOsoba),
      jmeno: osoba[3],
      prijmeni: osoba[2],
      klub: klubVDobe(idOsoba, okamzik, kluby, clenstvi),
      hlas: hlasZKodu(r[2], omluven(idPoslance)),
    };
  }).sort(poradiPoslancu);

  const pouziteKluby = [...new Set(poslanci.flatMap(p => (p.klub === null ? [] : [p.klub])))].sort();
  const snimek: Snimek = {
    komora: 'psp', obdobi: cil.obdobi, schuze: cil.schuze, cislo: cil.cislo, idPsp: Number(idHlasovani),
    datum, cas, nazevPsp: h[15] || h[16] || '', vysledek, kvorum: Number(h[12]),
    souhrn: { pro: Number(h[7]), proti: Number(h[8]), zdrzel: Number(h[9]), nehlasoval: Number(h[10]), prihlaseno: Number(h[11]) },
    kluby: Object.fromEntries(pouziteKluby.map(k => [k, nazvyKlubu.get(k)!])),
    poslanci,
    stazeno,
  };
  const nesoulad = nesouladySouctu(snimek);
  if (nesoulad.length) throw new ChybaPsp(`${id}: součty nesedí (${nesoulad.join('; ')})`);
  return snimek;
}

/** YAML snímku: hlavička s upozorněním a odkazem k ověření (lychee ho v CI zkontroluje), poslanec na jednom řádku. */
export function snimekNaYaml(s: Snimek): string {
  const doc = new Document(s);
  doc.commentBefore = ` Vygenerováno skriptem scripts/stahni-hlasovani.ts z otevřených dat PSP. Ručně neupravovat.\n Ověřit: https://www.psp.cz/sqw/hlasy.sqw?g=${s.idPsp}`;
  // čas v uvozovkách: parser YAML 1.1 (gray-matter) by 17:14 přečetl jako šedesátkové číslo
  const cas = doc.get('cas', true);
  if (isScalar(cas)) cas.type = 'QUOTE_SINGLE';
  const souhrn = doc.get('souhrn', true);
  if (isMap(souhrn)) souhrn.flow = true;
  const poslanci = doc.get('poslanci', true);
  if (isSeq(poslanci)) for (const p of poslanci.items) if (isMap(p)) p.flow = true;
  return doc.toString({ lineWidth: 0 });
}

/** Pro porovnání starého a nového snímku: samotné datum stažení není změna dat. */
export const bezDataStazeni = (yaml: string): string => yaml.replace(/^stazeno: .*$/m, '');

/** Id hlasování ze všech událostí pravidla (front matter načtený gray-matter, bez validace schématem). */
export function idHlasovaniZPravidla(data: unknown): string[] {
  const udalosti = (data as { udalosti?: unknown } | null)?.udalosti;
  if (!Array.isArray(udalosti)) return [];
  return udalosti.flatMap(u => {
    const hl = (u as { hlasovani?: unknown } | null)?.hlasovani;
    if (!Array.isArray(hl)) return [];
    return hl.flatMap(x => {
      const id = (x as { id?: unknown } | null)?.id;
      return typeof id === 'string' ? [id] : [];
    });
  });
}

export function rozeberIdHlasovani(id: string): CilHlasovani {
  const m = ID_HLASOVANI.exec(id);
  if (!m) throw new ChybaPsp(`Id hlasování „${id}“ nemá tvar psp-<období>-<schůze>-<číslo>`);
  return { obdobi: Number(m[1]), schuze: Number(m[2]), cislo: Number(m[3]) };
}
