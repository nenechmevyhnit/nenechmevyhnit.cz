import { odpovida, jeAktivni, seradit, normalizuj, PRAZDNY_FILTR, type Filtr, type PolozkaHledani } from '../lib/hledani';
import { pocetNaStranku, pocetStranek, cislaStranek } from '../lib/strankovani';
import { sklonuj } from '../lib/cestina';
import { nastavViditelne } from './stav-filtru';
import { inicializujCipy } from './cipy';

export function inicializujFiltry(): void {
  const panel = document.querySelector<HTMLElement>('.filtry');
  const data = document.getElementById('nv-hledani');
  const graf = document.getElementById('graf');
  if (!panel || !data || !graf) return;
  const polozky: PolozkaHledani[] = JSON.parse(data.textContent || '[]');
  const hledat = panel.querySelector<HTMLInputElement>('.f-hledat input')!;
  const cipy = panel.querySelector<HTMLElement>('.f-cipy')!;
  const jen = panel.querySelector<HTMLInputElement>('[data-jen-otevrene]')!;
  const vybery = [...panel.querySelectorAll<HTMLSelectElement>('select[data-filtr]')];
  const razeniVyber = panel.querySelector<HTMLSelectElement>('select[data-razeni]')!;
  // počítadlo a Zrušit filtry jsou dvakrát: v záhlaví osy (počítač) a v řádku filtrů (mobil), CSS ukáže jen jedno
  const pocty = document.querySelectorAll<HTMLElement>('.pocet');
  const zrusit = document.querySelectorAll<HTMLButtonElement>('.f-zrusit');
  const radky = graf.querySelector<HTMLElement>('.radky')!;
  const prazdno = graf.querySelector<HTMLElement>('.prazdno')!;
  const strankovani = graf.querySelector<HTMLElement>('.strankovani')!;
  const rozsah = strankovani.querySelector<HTMLElement>('.s-rozsah')!;
  const cisla = strankovani.querySelector<HTMLElement>('.s-cisla')!;
  const pred = strankovani.querySelector<HTMLButtonElement>('.s-pred')!;
  const dalsi = strankovani.querySelector<HTMLButtonElement>('.s-dalsi')!;

  const radekPodle = new Map<string, HTMLElement>();
  for (const p of polozky) {
    const r = radky.querySelector<HTMLElement>(`.radek[data-slug="${CSS.escape(p.slug)}"]`);
    if (r) radekPodle.set(p.slug, r);
  }

  const filtr: Filtr = { ...PRAZDNY_FILTR, stitky: [] };
  let razeni = razeniVyber.value;
  let poradi = seradit(polozky, razeni);
  let shoda: PolozkaHledani[] = poradi;
  let strana = 1;
  let naStranku = Infinity; // Infinity = stránkování vypnuté (vše se vejde)
  let posledniVysledek: string | null = null;

  const vybrany = () => graf.dataset.vybrano ?? null;
  const stranaKauzy = (slug: string | null) => {
    const i = slug ? shoda.findIndex(p => p.slug === slug) : -1;
    return i < 0 || !isFinite(naStranku) ? null : Math.floor(i / naStranku) + 1;
  };

  /** Nejvyšší přirozená výška řádku přes všechny kauzy (i skryté), při současné šířce sloupce s názvy. */
  const potrebnaVyskaRadku = () => {
    radky.classList.add('meri');
    let max = 0;
    for (const r of radekPodle.values()) max = Math.max(max, r.getBoundingClientRect().height);
    radky.classList.remove('meri');
    return Math.ceil(max);
  };

  /** Kolik řádků se vejde na výšku osy; zapne stránkování, jen když se všechny kauzy nevejdou. */
  const zmerStranku = () => {
    const prvni = radekPodle.values().next().value;
    if (!prvni) return;
    strankovani.hidden = true;
    radky.classList.remove('strankovane');
    // aspoň 34 px, jinak se popisek let nad pruhem nevejde; a tolik, aby byl celý vidět i dvouřádkový název
    // se stavem a počtem zdrojů (řádky jedné stránky jsou stejně vysoké, rozhoduje nejvyšší obsah)
    const vyskaRadku = Math.max(parseFloat(getComputedStyle(prvni).minHeight) || 0, 34, potrebnaVyskaRadku());
    const bez = pocetNaStranku(radky.clientHeight, vyskaRadku);
    if (polozky.length <= bez) { naStranku = Infinity; return; }
    strankovani.hidden = false;
    radky.classList.add('strankovane');
    // označené pásmo kauzy končí nad lištou stránkování
    graf.style.setProperty('--vyska-strankovani', `${strankovani.offsetHeight}px`);
    naStranku = pocetNaStranku(radky.clientHeight, vyskaRadku);
    // řádky všech stránek stejně vysoké, i na poslední neúplné stránce
    radky.style.setProperty('--vyska-radku', `${radky.clientHeight / naStranku}px`);
  };

  const vykresliStrankovani = () => {
    if (!isFinite(naStranku)) return;
    // prázdný výsledek: hláška se „Zrušit filtry“ stačí, lišta „0 z 0“ s jedinou stránkou by jen mátla
    strankovani.hidden = shoda.length === 0;
    const celkem = pocetStranek(shoda.length, naStranku);
    const od = (strana - 1) * naStranku;
    rozsah.textContent = shoda.length ? `${od + 1}–${Math.min(od + naStranku, shoda.length)} z ${shoda.length}` : '0 z 0';
    pred.disabled = strana <= 1;
    dalsi.disabled = strana >= celkem;
    cisla.replaceChildren(...cislaStranek(strana, celkem).map(c => {
      if (c === null) { const s = document.createElement('span'); s.className = 's-mezera'; s.textContent = '…'; return s; }
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = String(c); b.dataset.strana = String(c);
      b.setAttribute('aria-label', `Stránka ${c}`);
      if (c === strana) b.setAttribute('aria-current', 'page');
      return b;
    }));
  };

  const proved = () => {
    const naTeto = new Set<string>();
    const celkem = pocetStranek(shoda.length, isFinite(naStranku) ? naStranku : shoda.length || 1);
    strana = Math.min(Math.max(1, strana), celkem);
    const od = isFinite(naStranku) ? (strana - 1) * naStranku : 0;
    const konec = isFinite(naStranku) ? od + naStranku : shoda.length;
    shoda.slice(od, konec).forEach(p => naTeto.add(p.slug));
    for (const [slug, r] of radekPodle) r.hidden = !naTeto.has(slug);
    // hledaný text v názvu není: řádek řekne, že se shoduje text kauzy (jinak výsledek vypadá jako omyl)
    const hledane = normalizuj(filtr.text).split(/\s+/).filter(Boolean);
    for (const p of polozky) {
      const r = radekPodle.get(p.slug);
      if (!r) continue;
      const nazev = normalizuj(p.nazev);
      r.toggleAttribute('data-shoda-v-textu', hledane.length > 0 && !hledane.every(w => nazev.includes(w)));
    }
    const n = shoda.length;
    prazdno.hidden = n > 0;
    const text = n === polozky.length ? sklonuj(n, ['kauza', 'kauzy', 'kauz']) : `${n} z ${polozky.length} kauz`;
    pocty.forEach(p => { p.textContent = text; });
    zrusit.forEach(z => { z.hidden = !jeAktivni(filtr); });
    vykresliStrankovani();
    // mapa se překresluje jen při změně výsledku, ne při listování stránkami
    const klic = shoda.map(p => p.slug).join(' ');
    if (klic !== posledniVysledek) { posledniVysledek = klic; nastavViditelne(shoda.map(p => p.slug)); }
  };

  const aplikuj = () => {
    const sPohybem = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || !sPohybem || !document.body.classList.contains('nacteno')) return proved();
    let hotovo = false;
    const jednou = () => { if (!hotovo) { hotovo = true; proved(); } };
    const t = document.startViewTransition(jednou);
    [t.ready, t.finished, t.updateCallbackDone].forEach(p => p.catch(() => {}));
    setTimeout(() => { if (!hotovo) { t.skipTransition(); jednou(); } }, 200);
  };

  /** Nový výsledek filtru: zpět na první stránku. */
  const prefiltruj = () => {
    shoda = poradi.filter(p => odpovida(p, filtr));
    strana = 1;
    aplikuj();
  };

  const preskladej = () => {
    poradi = seradit(polozky, razeni);
    for (const p of poradi) { const r = radekPodle.get(p.slug); if (r) radky.insertBefore(r, prazdno); }
  };

  const reset = () => {
    Object.assign(filtr, PRAZDNY_FILTR, { stitky: [] });
    hledat.value = ''; jen.checked = false;
    vybery.forEach(v => { v.value = ''; });
    cipy.querySelectorAll('button[data-stitek]').forEach(b => b.setAttribute('aria-pressed', 'false'));
    prefiltruj();
    rozvrhniCipy();
  };

  hledat.addEventListener('input', () => { filtr.text = hledat.value; prefiltruj(); });
  jen.addEventListener('change', () => { filtr.jenOtevrene = jen.checked; prefiltruj(); });
  vybery.forEach(v => v.addEventListener('change', () => {
    filtr[v.dataset.filtr as 'stav' | 'trvani' | 'obdobi' | 'castka'] = v.value;
    prefiltruj();
  }));
  razeniVyber.addEventListener('change', () => {
    razeni = razeniVyber.value;
    const sPohybem = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    const zmena = () => { preskladej(); shoda = poradi.filter(p => odpovida(p, filtr)); strana = 1; proved(); };
    if (!document.startViewTransition || !sPohybem || !document.body.classList.contains('nacteno')) return zmena();
    const t = document.startViewTransition(zmena);
    [t.ready, t.finished, t.updateCallbackDone].forEach(p => p.catch(() => {}));
  });
  cipy.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest('button[data-stitek]');
    if (!b) return;
    b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
    filtr.stitky = [...cipy.querySelectorAll<HTMLElement>('[aria-pressed="true"]')].map(x => x.dataset.stitek!);
    prefiltruj();
  });
  zrusit.forEach(z => z.addEventListener('click', reset));
  prazdno.querySelector('[data-zrusit]')!.addEventListener('click', reset);

  // stránkování
  pred.addEventListener('click', () => { strana--; aplikuj(); });
  dalsi.addEventListener('click', () => { strana++; aplikuj(); });
  cisla.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('button[data-strana]');
    if (b) { strana = Number(b.dataset.strana); aplikuj(); }
  });
  // otevřená kauza (detail) musí být na ose vidět: přepni na její stránku
  document.addEventListener('nv:vyber', e => {
    const s = stranaKauzy((e as CustomEvent<string | null>).detail);
    if (s && s !== strana) { strana = s; proved(); }
  });
  // změna velikosti: přepočítat stránku a zůstat u vybrané kauzy, jinak u první kauzy dosavadní stránky
  let posledniVyska = -1;
  const prepocitej = () => {
    // v pohledu mapy jsou řádky osy skryté, měřit se nedají
    if (graf.dataset.pohled === 'mapa') return;
    // i změna šířky: názvy kauz se můžou zalomit jinak a řádek potřebuje jinou výšku
    const v = graf.clientHeight * 100000 + graf.clientWidth;
    if (v === posledniVyska) return;
    posledniVyska = v;
    const kotva = vybrany() ?? (isFinite(naStranku) ? shoda[(strana - 1) * naStranku]?.slug : null) ?? null;
    zmerStranku();
    strana = stranaKauzy(kotva) ?? 1;
    proved();
  };
  new ResizeObserver(prepocitej).observe(graf);
  // po návratu z mapy na osu přepočítat stránkování (velikost grafu se nezměnila, ResizeObserver mlčí)
  document.addEventListener('nv:pohled', () => { posledniVyska = -1; prepocitej(); });
  // po načtení písma mají názvy jinou šířku: změřit znovu
  document.fonts.ready.then(() => { posledniVyska = -1; prepocitej(); });

  // témata v jednom řádku, zbytek pod „+N další“
  const rozvrhniCipy = inicializujCipy(cipy);

  // prohlížeč mohl po návratu na stránku obnovit hodnoty polí: převzít je
  filtr.text = hledat.value; filtr.jenOtevrene = jen.checked;
  vybery.forEach(v => { filtr[v.dataset.filtr as 'stav' | 'trvani' | 'obdobi' | 'castka'] = v.value; });
  if (razeni !== 'zacatek') preskladej();
  shoda = poradi.filter(p => odpovida(p, filtr));
  prepocitej();
}
