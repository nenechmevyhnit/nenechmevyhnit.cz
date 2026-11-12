import { escapujHtml as e } from './html';
import { ROZMERY, type Graf, type Hrana, type Karta, type Rozlozeni } from './mapa';
import { STRED } from './role';
import { datumText } from './casova-osa';

/** Obrázek mapy. Je skrytý pro čtečky, ovládá se přes strom (stromMapy). */
export function svgMapy(r: Rozlozeni): string {
  if (r.uzly.length === 0) return '<svg class="mapa-svg" aria-hidden="true" focusable="false" width="0" height="0"></svg>';
  const v = ROZMERY.vyskaUzlu;
  const cary = r.cary.map(c =>
    `<g class="m-cara m-cara-${c.druh}${c.hlavni ? '' : ' m-vedlejsi'}" data-hrana="${c.id}"><path class="m-viditelna" d="${c.d}"/><path class="m-zasah" d="${c.dz}"/></g>`).join('');
  const uzly = r.uzly.map(u =>
    `<g class="m-uzel m-${u.typ}" data-uzel="${e(u.id)}" transform="translate(${u.x} ${u.y})"><rect x="0" y="${-v / 2}" width="${u.w}" height="${v}" rx="3"/><text x="${ROZMERY.odsazeniTextu}" y="4.5">${e(u.nazev)}</text></g>`).join('');
  return `<svg class="mapa-svg" xmlns="http://www.w3.org/2000/svg" width="${r.sirka}" height="${r.vyska}" viewBox="0 0 ${r.sirka} ${r.vyska}" aria-hidden="true" focusable="false">`
    + `<g class="m-cary">${cary}</g><g class="m-uzly">${uzly}</g></svg>`;
}

/** Obsah karty vazeb (je jen vizuální, aria-hidden: totéž čtečka najde ve stromu). */
export function kartaHtml(k: Karta): string {
  const skupiny = k.skupiny.map(s => `<p class="k-skupina">${e(s.nadpis)}</p><ul>${s.polozky.map(p =>
    `<li><span class="k-nazev">${e(p.nazev)}</span>${p.role ? `<span class="k-role">${e(p.role)}</span>` : ''}</li>`).join('')}${s.dalsich ? `<li class="k-dalsi">${s.polozky.length ? `a ${s.dalsich} dalších` : `celkem ${s.dalsich}`}</li>` : ''}</ul>`).join('');
  return `<p class="k-nadpis">${e(k.nazev)}</p>${k.podnadpis ? `<p class="k-podnadpis">${e(k.podnadpis)}</p>` : ''}`
    + `${k.text ? `<p class="k-text">${e(k.text)}</p>` : ''}${skupiny}${k.akce ? `<p class="k-akce">${e(k.akce)}</p>` : ''}`;
}

/** Přístupná podoba mapy: vnořené seznamy. Na mobilu je vidět, na počítači je vizuálně skrytá,
 *  ale ovládá se přes ni klávesnicí a čte ji čtečka. Kauza je pod každým svým aktérem,
 *  podstrom aktéra jen pod hlavním nadřazeným (jinde je jen řádek s rolí a obdobím). */
export function stromMapy(graf: Graf): string {
  const podle = new Map(graf.uzly.map(u => [u.id, u]));
  const vychozi = new Map<string, Hrana[]>();
  const navaznosti = new Map<string, Hrana[]>();
  for (const h of graf.hrany) {
    const [mapa, klic] = h.druh === 'navaznost' ? [navaznosti, h.potomek] : [vychozi, h.rodic];
    if (!mapa.has(klic)) mapa.set(klic, []);
    mapa.get(klic)!.push(h);
  }
  const poradi = (rodic: string): Hrana[] => {
    const hl = graf.deti[rodic] ?? [];
    return (vychozi.get(rodic) ?? []).slice().sort((a, b) =>
      Number(!a.hlavni) - Number(!b.hlavni)
      || (a.hlavni ? hl.indexOf(a.potomek) - hl.indexOf(b.potomek) : 0)
      || podle.get(a.potomek)!.nazev.localeCompare(podle.get(b.potomek)!.nazev, 'cs'));
  };
  const role = (h: Hrana) => {
    const t = [h.roleText, h.obdobi].filter(Boolean).join(' · ');
    return t ? ` <span class="s-role">${e(t)}</span>` : '';
  };
  const info = (h: Hrana, nazev: string) => h.popis
    ? ` <button type="button" class="s-info" aria-expanded="false" aria-controls="s-vazba-${h.id}" aria-label="Vazba: ${e(nazev)}">ⓘ</button>` : '';
  const vazba = (h: Hrana) => h.popis
    ? `<div class="s-vazba" id="s-vazba-${h.id}" hidden><p>${e(h.popis)}</p><ul class="s-zdroje">${h.zdroje.map(z =>
      `<li><a href="${e(z.url)}" rel="noopener noreferrer" target="_blank">${e(z.vydavatel)}: ${e(z.titulek)} (${e(datumText(z.datum))})</a></li>`).join('')}</ul></div>` : '';
  let n = 0;
  const polozka = (h: Hrana): string => {
    const u = podle.get(h.potomek)!;
    const spol = `data-uzel="${e(u.id)}" data-hrana="${h.id}"${h.hlavni ? ' data-hlavni' : ''}`;
    if (u.typ === 'kauza') {
      const nav = h.hlavni ? (navaznosti.get(u.id) ?? []).map(x => {
        const cil = podle.get(x.rodic)!;
        return `<div class="s-navazuje" data-hrana="${x.id}">navazuje na: <a href="/kauzy/${e(cil.slug!)}/" data-slug="${e(cil.slug!)}">${e(cil.nazev)}</a>${role(x)}${info(x, cil.nazev)}${vazba(x)}</div>`;
      }).join('') : '';
      return `<li class="s-kauza" ${spol} data-slug="${e(u.slug!)}"><div class="s-radek"><a href="/kauzy/${e(u.slug!)}/" data-slug="${e(u.slug!)}">${e(u.nazev)}</a> <span class="s-roky">${e(u.roky!)}</span>${role(h)}${info(h, u.nazev)}</div>${vazba(h)}${nav}</li>`;
    }
    const pod = h.hlavni ? poradi(u.id).map(polozka).join('') : '';
    const idPod = `s-pod-${++n}`;
    const tlacitko = pod
      ? `<button type="button" class="s-akter" aria-expanded="true" aria-controls="${idPod}">${e(u.nazev)}</button>`
      : `<button type="button" class="s-akter">${e(u.nazev)}</button>`;
    return `<li class="s-akter-polozka" ${spol} data-hloubka="${u.hloubka}"><div class="s-radek">${tlacitko}${role(h)}${info(h, u.nazev)}</div>${vazba(h)}${pod ? `<ul id="${idPod}">${pod}</ul>` : ''}</li>`;
  };
  return `<ul class="strom"><li class="s-stred" data-uzel="${STRED.id}"><span class="s-nazev">${e(STRED.nazev)}</span><ul>${poradi(STRED.id).map(polozka).join('')}</ul></li></ul>`;
}
