import { rozlozMapu, viditelneUzly, zvyrazneni, idKauzy, kartaUzlu, kartaHrany, kauzaHrany, nadpisHrany, type Graf, type Karta } from '../lib/mapa';
import { svgMapy, kartaHtml } from '../lib/mapa-html';
import { viditelneKauzy } from './stav-filtru';
import { vyberKauzu } from './osa';

const mobil = () => matchMedia('(max-width: 760px)').matches;

export type Pohled = 'osa' | 'mapa';
const graf = () => document.getElementById('graf');
let pohled: Pohled = 'osa';
/** Pohled platí hned po přepnutí, i když View Transition dokončí změnu DOM až později (adresa detailu, zavření). */
export const aktualniPohled = (): Pohled => pohled;

export const pohledZAdresy = (): Pohled => (new URLSearchParams(location.search).get('pohled') === 'mapa' ? 'mapa' : 'osa');

/** Přepne osu a mapu. Adresu mění bez nového záznamu v historii. */
export function nastavPohled(p: Pohled, { zapsat = true } = {}): void {
  const g = graf();
  if (!g?.querySelector('.mapa')) return;
  pohled = p;
  const proved = () => {
    g.dataset.pohled = p;
    document.querySelectorAll<HTMLButtonElement>('.pohled button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.pohled === p)));
    document.dispatchEvent(new CustomEvent('nv:pohled', { detail: p }));
  };
  const sPohybem = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (document.startViewTransition && sPohybem && document.body.classList.contains('nacteno') && g.dataset.pohled !== p) {
    const t = document.startViewTransition(proved);
    [t.ready, t.finished, t.updateCallbackDone].forEach(x => x.catch(() => {}));
  } else proved();
  if (zapsat) {
    const url = new URL(location.href);
    if (p === 'mapa') url.searchParams.set('pohled', 'mapa'); else url.searchParams.delete('pohled');
    url.searchParams.delete('vyber');
    history.replaceState(history.state, '', url.pathname + url.search);
  }
}

export function inicializujMapu(): void {
  const g = graf();
  const obal = g?.querySelector<HTMLElement>('.mapa');
  const data = document.getElementById('nv-mapa');
  if (!g || !obal || !data) return;
  const grafMapy: Graf = JSON.parse(data.textContent || '{}');
  const strom = obal.querySelector<HTMLElement>('.strom')!;
  const prazdno = obal.querySelector<HTMLElement>('.mapa-prazdno')!;
  let svg = obal.querySelector<SVGSVGElement>('.mapa-svg')!;
  const plocha = obal.querySelector<HTMLElement>('.mapa-plocha')!;
  const panel = obal.querySelector<HTMLElement>('.mapa-panel')!;
  const procenta = obal.querySelector<HTMLButtonElement>('.mapa-procenta')!;
  const karta = obal.querySelector<HTMLElement>('.mapa-karta')!;
  const panelNadpis = panel.querySelector<HTMLElement>('.mapa-panel-nadpis')!;
  const panelObsah = panel.querySelector<HTMLElement>('.mapa-panel-obsah')!;
  const hrany = new Map(grafMapy.hrany.map(h => [h.id, h]));
  const uzly = new Map(grafMapy.uzly.map(u => [u.id, u]));
  let vybrano: string | null = g.dataset.vybrano ? idKauzy(g.dataset.vybrano) : null;
  let otvirac: HTMLElement | null = null;
  let panelUzel: string | null = null;

  /** docasne: najetí, fokus a otevřený panel ztlumí zbytek mapy; trvalý výběr kauzy jen zvýrazní cestu
   *  (ztlumený text by neměl dost kontrastu). */
  const zvyrazni = (id: string | null, docasne = false) => oznac(id ? zvyrazneni(grafMapy, id) : null, docasne);
  /** Najetí na čáru zvýrazní jen ji a její dva uzly. */
  const zvyrazniHranu = (id: string) => {
    const h = hrany.get(id)!;
    oznac({ uzly: new Set([h.rodic, h.potomek]), hrany: new Set([id]) }, true);
  };
  const oznac = (z: { uzly: Set<string>; hrany: Set<string> } | null, docasne: boolean) => {
    svg.classList.toggle('ztlumeno', docasne && z !== null);
    svg.querySelectorAll<SVGElement>('[data-uzel]').forEach(el => el.classList.toggle('zvyrazneno', !!z?.uzly.has(el.dataset.uzel!)));
    svg.querySelectorAll<SVGElement>('[data-hrana]').forEach(el => el.classList.toggle('zvyrazneno', !!z?.hrany.has(el.dataset.hrana!)));
    // zvýrazněné čáry navrch: lomené čáry sdílí kmen a šedá sousední by modrou překryla
    svg.querySelectorAll<SVGGElement>('.m-cara.zvyrazneno').forEach(el => el.parentNode!.appendChild(el));
  };
  /** Místo nalevo vedle mapy (mimo ni). null, když je okraj úzký nebo je mapa přes celé okno. */
  const mistoVedle = () => {
    if (g.classList.contains('velka-plocha')) return null;
    const r = g.getBoundingClientRect();
    // 10 px od mapy i od okraje okna; užší než 160 px by byla karta nečitelná
    const sirka = Math.min(320, r.left - 20);
    if (sirka < 160) return null;
    const top = Math.max(8, r.top);
    return { left: r.left - 10 - sirka, top, sirka, vyska: innerHeight - top - 10 };
  };
  const umisti = (el: HTMLElement, m: ReturnType<typeof mistoVedle>) => {
    el.classList.toggle('venku', !!m);
    el.classList.toggle('uzka', !!m && m.sirka < 260);
    for (const k of ['left', 'top', 'width', 'max-height']) el.style.removeProperty(k);
    if (m) Object.assign(el.style, { left: `${m.left}px`, top: `${m.top}px`, width: `${m.sirka}px`, maxHeight: `${m.vyska}px` });
  };
  /** Karta vazeb (místo popisků na mapě): když je místo, nalevo vedle mapy (tam, kde se po kliknutí na aktéra
   *  otevře panel se zdroji), jinak v rohu plochy naproti uzlu nebo čáře, aby je nezakryla. */
  const ukazKartu = (sestav: (max: number) => Karta, kotva: Element | null) => {
    if (mobil() || !panel.hidden || tah?.pohnuto) return;
    const m = mistoVedle();
    umisti(karta, m);
    let vlevo = false;
    if (!m && kotva) {
      const r = kotva.getBoundingClientRect(), o = plocha.getBoundingClientRect();
      vlevo = (r.left + r.right) / 2 - o.left > plocha.clientWidth / 2;
    }
    karta.classList.toggle('vlevo', vlevo);
    karta.hidden = false;
    // vedle mapy smí karta využít celou výšku okna: začne u horního okraje mapy, a když je delší, posune se výš
    if (m) Object.assign(karta.style, { top: '8px', maxHeight: `${innerHeight - 18}px` });
    // seznamy se zkracují, dokud se karta nevejde (zbytek řekne „a N dalších“)
    for (const max of [8, 5, 3, 2, 1, 0]) {
      karta.innerHTML = kartaHtml(sestav(max));
      if (karta.scrollHeight <= karta.clientHeight + 1) break;
    }
    if (m) karta.style.top = `${Math.max(8, Math.min(m.top, innerHeight - 10 - karta.offsetHeight))}px`;
  };
  const skryjKartu = () => { karta.hidden = true; };
  const hlavniHrana = (uzel: string) => strom.querySelector<HTMLElement>(`li[data-uzel="${CSS.escape(uzel)}"][data-hlavni]`)?.dataset.hrana;
  const klid = () => (panelUzel ? zvyrazni(panelUzel, true) : zvyrazni(vybrano));
  const zavriPanel = (vratitFokus = true) => {
    if (panel.hidden) return;
    panel.hidden = true;
    panelUzel = null;
    klid();
    if (vratitFokus) otvirac?.focus();
    otvirac = null;
  };
  /** Panel s vysvětlením vazby u uzlu. Obsah je kopie skrytého .s-vazba ze stromu. */
  const otevriPanel = (hrana: string, odkud: HTMLElement | null) => {
    const zdroj = document.getElementById(`s-vazba-${hrana}`);
    if (!zdroj) return;
    const h = hrany.get(hrana)!;
    panelNadpis.textContent = nadpisHrany(grafMapy, hrana);
    skryjKartu();
    panelObsah.innerHTML = zdroj.innerHTML;
    const role = [h.roleText, h.obdobi].filter(Boolean).join(' · ');
    if (role) {
      const p = document.createElement('p');
      p.className = 'mapa-panel-role';
      p.textContent = role;
      panelObsah.prepend(p);
    }
    panel.hidden = false;
    // když je místo, nalevo vedle mapy; jinak napravo od uzlu uvnitř plochy
    const vedle = mistoVedle();
    umisti(panel, vedle);
    const kotva = vedle ? null : svg.querySelector(`[data-uzel="${CSS.escape(hrany.get(hrana)!.potomek)}"]`);
    if (kotva) {
      // napravo od uzlu, ale celý panel uvnitř viditelné části plochy
      const r = kotva.getBoundingClientRect(), o = plocha.getBoundingClientRect();
      const vlevo = Math.min(r.right - o.left + 8, plocha.clientWidth - panel.offsetWidth - 8);
      const nahore = Math.min(r.top - o.top, plocha.clientHeight - panel.offsetHeight - 8);
      panel.style.left = `${plocha.scrollLeft + Math.max(8, vlevo)}px`;
      panel.style.top = `${plocha.scrollTop + Math.max(8, nahore)}px`;
    }
    panelUzel = h.potomek;
    zvyrazni(panelUzel, true);
    otvirac = odkud;
    panel.querySelector<HTMLElement>('.mapa-panel-zavrit')!.focus();
  };
  const prepni = (b: HTMLButtonElement) => {
    const cil = document.getElementById(b.getAttribute('aria-controls')!);
    if (!cil) return;
    const otevrit = b.getAttribute('aria-expanded') !== 'true';
    b.setAttribute('aria-expanded', String(otevrit));
    cil.hidden = !otevrit;
  };
  const otevriKauzu = (slug: string) => document.dispatchEvent(new CustomEvent('nv:otevri', { detail: slug }));

  /* Měřítko a posouvání. Mapa se zmenšuje změnou rozměrů SVG (viewBox zůstává), takže písmo zůstane ostré
   * a plocha se dál posouvá posuvníky. Dokud uživatel měřítko nezmění, drží se automatické:
   * celá šířka mapy, nejvýš 100 % a ne méně než AUTO_MIN (pod tím by názvy byly špatně čitelné). */
  const MIN = 0.2, MAX = 2, AUTO_MIN = 0.8, KROK = 1.25, PREHLED = 0.6;
  let meritko = 1;
  let automaticke = true;
  const rozmer = () => { const b = svg.viewBox?.baseVal; return { w: b?.width ?? 0, h: b?.height ?? 0 }; };
  const omez = (m: number) => Math.min(MAX, Math.max(MIN, m));
  const pouzijMeritko = () => {
    const { w, h } = rozmer();
    if (automaticke && w > 0 && plocha.clientWidth > 0) meritko = Math.min(1, Math.max(AUTO_MIN, (plocha.clientWidth - 2) / w));
    if (w > 0) { svg.setAttribute('width', String(Math.round(w * meritko))); svg.setAttribute('height', String(Math.round(h * meritko))); }
    const p = `${Math.round(meritko * 100)} %`;
    procenta.textContent = p;
    procenta.setAttribute('aria-label', `Původní velikost, nyní ${p}`);
    obal.querySelector<HTMLButtonElement>('[data-meritko="oddalit"]')!.disabled = meritko <= MIN;
    obal.querySelector<HTMLButtonElement>('[data-meritko="priblizit"]')!.disabled = meritko >= MAX;
    plocha.classList.toggle('prehled', meritko < PREHLED);
  };
  /** Nové měřítko; bod (ox, oy) v souřadnicích viditelné plochy zůstane na místě. */
  const zmenMeritko = (nove: number, ox = plocha.clientWidth / 2, oy = plocha.clientHeight / 2) => {
    const m0 = meritko, m = omez(nove);
    automaticke = false;
    if (m === m0) return;
    // menší mapa je ve ploše vystředěná, proto se počítá od skutečné polohy SVG, ne od posunu plochy
    const o = plocha.getBoundingClientRect(), r0 = svg.getBoundingClientRect();
    const cx = (o.left + ox - r0.left) / m0, cy = (o.top + oy - r0.top) / m0;
    meritko = m;
    zavriPanel(false);
    skryjKartu();
    pouzijMeritko();
    const r1 = svg.getBoundingClientRect();
    plocha.scrollLeft += r1.left - o.left + cx * m - ox;
    plocha.scrollTop += r1.top - o.top + cy * m - oy;
  };
  const celaMapa = () => {
    const { w, h } = rozmer();
    if (!w || !h) return;
    zmenMeritko(Math.min(1, (plocha.clientWidth - 2) / w, (plocha.clientHeight - 2) / h));
    plocha.scrollLeft = 0;
    plocha.scrollTop = 0;
  };
  obal.querySelector('.mapa-meritko')!.addEventListener('click', e => {
    const b = (e.target as Element).closest<HTMLButtonElement>('[data-meritko]');
    if (!b) return;
    const akce = b.dataset.meritko;
    if (akce === 'priblizit') zmenMeritko(meritko * KROK);
    else if (akce === 'oddalit') zmenMeritko(meritko / KROK);
    else if (akce === 'puvodni') zmenMeritko(1);
    else if (akce === 'plocha') velkaPlocha(!g.classList.contains('velka-plocha'));
    else celaMapa();
  });
  const tlacitkoPlochy = obal.querySelector<HTMLButtonElement>('[data-meritko="plocha"]')!;
  const velkaPlocha = (zapnout: boolean) => {
    if (g.classList.contains('velka-plocha') === zapnout) return;
    zavriPanel(false);
    g.classList.toggle('velka-plocha', zapnout);
    tlacitkoPlochy.setAttribute('aria-pressed', String(zapnout));
    tlacitkoPlochy.textContent = zapnout ? 'Zmenšit plochu' : 'Zvětšit plochu';
  };
  document.addEventListener('nv:pohled', e => { if ((e as CustomEvent<Pohled>).detail !== 'mapa') velkaPlocha(false); });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || e.defaultPrevented || !g.classList.contains('velka-plocha')) return;
    if (!panel.hidden || document.querySelector('dialog[open]')) return;
    velkaPlocha(false);
  });
  // Ctrl/⌘ + kolečko (i sevření prstů na touchpadu) přibližuje k ukazateli, samotné kolečko posouvá
  plocha.addEventListener('wheel', e => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const r = plocha.getBoundingClientRect();
    const dy = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
    zmenMeritko(meritko * Math.exp(-dy * 0.0015), e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });
  // v přehledu (malé měřítko) klik na prázdné místo přiblíží to místo na 100 %, jinak přibližuje dvojklik
  const naPrazdno = (e: MouseEvent) => !(e.target as Element).closest('.mapa-panel, .mapa-svg [data-uzel], .mapa-svg .m-cara');
  let priblizenoKlikem = 0;
  plocha.addEventListener('click', e => {
    if (meritko >= PREHLED || !naPrazdno(e)) return;
    const r = plocha.getBoundingClientRect();
    zmenMeritko(1, e.clientX - r.left, e.clientY - r.top);
    priblizenoKlikem = e.timeStamp;
  });
  plocha.addEventListener('dblclick', e => {
    if (!naPrazdno(e) || e.timeStamp - priblizenoKlikem < 600) return;
    const r = plocha.getBoundingClientRect();
    zmenMeritko(meritko * 1.6, e.clientX - r.left, e.clientY - r.top);
  });
  // tažení myší posouvá plochu (dotyk posouvá prohlížeč sám); po tažení se klik neprovede
  let tah: { x: number; y: number; sl: number; st: number; id: number; pohnuto: boolean } | null = null;
  let potlacitKlik = false;
  plocha.addEventListener('pointerdown', e => {
    potlacitKlik = false;
    if (e.button !== 0 || e.pointerType === 'touch' || (e.target as Element).closest('.mapa-panel')) return;
    tah = { x: e.clientX, y: e.clientY, sl: plocha.scrollLeft, st: plocha.scrollTop, id: e.pointerId, pohnuto: false };
  });
  plocha.addEventListener('pointermove', e => {
    if (!tah || e.pointerId !== tah.id) return;
    const dx = e.clientX - tah.x, dy = e.clientY - tah.y;
    if (!tah.pohnuto) {
      if (Math.hypot(dx, dy) < 5) return;
      tah.pohnuto = true;
      skryjKartu();
      plocha.setPointerCapture(e.pointerId);
      plocha.classList.add('tazeni');
    }
    plocha.scrollLeft = tah.sl - dx;
    plocha.scrollTop = tah.st - dy;
  });
  const konecTahu = (e: PointerEvent) => {
    if (!tah || e.pointerId !== tah.id) return;
    if (tah.pohnuto) { potlacitKlik = true; plocha.classList.remove('tazeni'); klid(); }
    tah = null;
  };
  plocha.addEventListener('pointerup', konecTahu);
  plocha.addEventListener('pointercancel', konecTahu);
  plocha.addEventListener('click', e => {
    if (!potlacitKlik) return;
    potlacitKlik = false;
    e.stopImmediatePropagation(); // i posluchače na ploše samotné (při zachycení ukazatele je cílem klepnutí ona)
    e.preventDefault();
  }, true);
  new ResizeObserver(() => { if (automaticke) pouzijMeritko(); }).observe(plocha);
  // karta a panel vedle mapy mají polohu podle okna
  addEventListener('resize', () => { skryjKartu(); zavriPanel(false); });
  /** Posune plochu tak, aby byl uzel vidět (výběr kauzy z detailu nebo z adresy). */
  const ukazUzel = (id: string) => {
    const el = svg.querySelector<SVGGElement>(`[data-uzel="${CSS.escape(id)}"]`);
    if (!el || !plocha.clientHeight) return;
    const r = el.getBoundingClientRect(), o = plocha.getBoundingClientRect();
    if (r.top >= o.top && r.bottom <= o.bottom && r.left >= o.left && r.right <= o.right) return;
    plocha.scrollTop += r.top - o.top - (plocha.clientHeight - r.height) / 2;
    plocha.scrollLeft += r.left - o.left - Math.max(16, (plocha.clientWidth - r.width) / 2);
  };

  /** Překreslí SVG podle výsledku filtrů a ve stromu skryje, co na mapě není. */
  const prekresli = () => {
    const kauzy = viditelneKauzy();
    const vid = viditelneUzly(grafMapy, kauzy);
    const docasny = document.createElement('div');
    docasny.innerHTML = svgMapy(rozlozMapu(grafMapy, kauzy));
    const novy = docasny.firstElementChild as SVGSVGElement;
    svg.replaceWith(novy);
    svg = novy;
    pouzijMeritko();
    strom.querySelectorAll<HTMLElement>('li[data-uzel]').forEach(li => { li.hidden = !vid.has(li.dataset.uzel!); });
    prazdno.hidden = vid.size > 1;
    zavriPanel(false);
    skryjKartu();
    zvyrazni(vybrano && vid.has(vybrano) ? vybrano : null);
  };

  document.querySelectorAll<HTMLButtonElement>('.pohled button').forEach(b =>
    b.addEventListener('click', () => nastavPohled(b.dataset.pohled as Pohled)));
  addEventListener('popstate', () => nastavPohled(pohledZAdresy(), { zapsat: false }));
  document.addEventListener('nv:filtr', prekresli);
  obal.addEventListener('click', e => {
    const t = e.target as Element;
    if (t.closest('.mapa-panel-zavrit')) { zavriPanel(); return; }
    const uzel = t.closest<SVGGElement>('.mapa-svg [data-uzel]');
    if (uzel) {
      const id = uzel.dataset.uzel!;
      if (id.startsWith('k:')) otevriKauzu(id.slice(2));
      else { const h = hlavniHrana(id); if (h) otevriPanel(h, null); }
      return;
    }
    const cara = t.closest<SVGGElement>('.mapa-svg .m-cara');
    if (cara) {
      // čára ke kauze otevře detail kauzy (s časovou osou), vazba mezi aktéry panel se zdroji
      const id = cara.dataset.hrana!, kauza = kauzaHrany(grafMapy, id);
      if (kauza) otevriKauzu(kauza.slice(2));
      else if (hrany.get(id)?.popis) otevriPanel(id, null);
      return;
    }
    const odkaz = t.closest<HTMLAnchorElement>('.strom a[data-slug]');
    if (odkaz) {
      const me = e as MouseEvent;
      if (me.metaKey || me.ctrlKey || me.shiftKey || me.button !== 0) return;
      e.preventDefault();
      otevriKauzu(odkaz.dataset.slug!);
      return;
    }
    const tlacitko = t.closest<HTMLButtonElement>('.strom .s-info, .strom .s-akter');
    const nositel = tlacitko?.closest<HTMLElement>('[data-hrana]');
    if (!tlacitko || !nositel) return;
    // jméno aktéra s větví ji rozbaluje (počítač i mobil); vysvětlení vazby: na počítači panel, na mobilu pod řádkem
    if (tlacitko.classList.contains('s-akter') && tlacitko.hasAttribute('aria-expanded')) { prepni(tlacitko); return; }
    if (!mobil()) { otevriPanel(nositel.dataset.hrana!, tlacitko); return; }
    const i = tlacitko.classList.contains('s-info') ? tlacitko : nositel.querySelector<HTMLButtonElement>(':scope > .s-radek .s-info');
    if (i) prepni(i);
  });
  obal.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !panel.hidden) { e.preventDefault(); e.stopPropagation(); zavriPanel(); }
  });
  obal.addEventListener('pointerover', e => {
    if (tah?.pohnuto) return;
    const t = e.target as Element;
    const u = t.closest<SVGGElement>('.mapa-svg [data-uzel]');
    if (u) { zvyrazni(u.dataset.uzel!, true); ukazKartu(max => kartaUzlu(grafMapy, u.dataset.uzel!, max), u); return; }
    const c = t.closest<SVGGElement>('.mapa-svg .m-cara');
    if (c) { zvyrazniHranu(c.dataset.hrana!); ukazKartu(() => kartaHrany(grafMapy, c.dataset.hrana!), c); }
  });
  obal.addEventListener('pointerout', e => {
    if ((e.target as Element).closest('.mapa-svg [data-uzel], .mapa-svg .m-cara')) { klid(); skryjKartu(); }
  });
  strom.addEventListener('focusin', e => {
    const prvek = e.target as HTMLElement;
    const li = prvek.closest<HTMLElement>('li[data-uzel]');
    svg.querySelectorAll('.fokus').forEach(x => x.classList.remove('fokus'));
    if (!li) return;
    // odkaz „navazuje na“ vede na jinou kauzu: zvýraznit tu, kterou Enter otevře
    const uzel = prvek.matches('.s-navazuje a[data-slug]') ? idKauzy(prvek.dataset.slug!) : li.dataset.uzel!;
    zvyrazni(uzel, true);
    if (mobil()) return;
    // ⓘ vysvětluje vazbu, a proto má fokus na čáře, ne na uzlu
    const nositel = prvek.closest<HTMLElement>('[data-hrana]');
    const cil = prvek.matches('.s-info') && nositel
      ? svg.querySelector<SVGGElement>(`.m-cara[data-hrana="${CSS.escape(nositel.dataset.hrana!)}"]`)
      : svg.querySelector<SVGGElement>(`[data-uzel="${CSS.escape(uzel)}"]`);
    if (cil) { cil.classList.add('fokus'); cil.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
    ukazKartu(max => (prvek.matches('.s-info') && nositel ? kartaHrany(grafMapy, nositel.dataset.hrana!) : kartaUzlu(grafMapy, uzel, max)), cil);
  });
  strom.addEventListener('focusout', () => {
    skryjKartu();
    svg.querySelectorAll('.fokus').forEach(x => x.classList.remove('fokus'));
    klid();
  });
  document.addEventListener('nv:vyber', e => {
    const slug = (e as CustomEvent<string | null>).detail;
    vybrano = slug ? idKauzy(slug) : null;
    klid();
    if (vybrano) ukazUzel(vybrano);
  });

  // výchozí rozbalení: přímí aktéři otevření, hlubší větve sbalené (na počítači to drží rozumný počet zastávek Tab)
  strom.querySelectorAll<HTMLButtonElement>('.s-akter[aria-expanded]').forEach(b => {
    const otevrit = Number(b.closest<HTMLElement>('li')!.dataset.hloubka) <= 1;
    b.setAttribute('aria-expanded', String(otevrit));
    document.getElementById(b.getAttribute('aria-controls')!)!.hidden = !otevrit;
  });
  /** ⓘ na počítači otevírá panel (dialog), na mobilu rozbaluje vysvětlení pod řádkem: tomu odpovídá i ARIA. */
  const nastavInfo = () => strom.querySelectorAll<HTMLButtonElement>('.s-info').forEach(b => {
    const cil = document.getElementById(b.getAttribute('aria-controls')!);
    if (mobil()) { b.removeAttribute('aria-haspopup'); b.setAttribute('aria-expanded', String(!!cil && !cil.hidden)); }
    else { b.removeAttribute('aria-expanded'); b.setAttribute('aria-haspopup', 'dialog'); if (cil) cil.hidden = true; }
  });
  matchMedia('(max-width: 760px)').addEventListener('change', () => { zavriPanel(false); nastavInfo(); });
  nastavInfo();

  nastavPohled(pohledZAdresy(), { zapsat: false });
  prekresli();
  const vyber = new URLSearchParams(location.search).get('vyber');
  if (vyber && uzly.has(idKauzy(vyber))) vyberKauzu(vyber);
}
