import { odpovida, jeAktivni, type Filtr, type PolozkaHledani } from '../lib/hledani';
import { sklonuj } from '../lib/cestina';

export function inicializujFiltry(): void {
  const panel = document.querySelector<HTMLElement>('.filtry');
  const data = document.getElementById('nv-hledani');
  if (!panel || !data) return;
  const polozky: PolozkaHledani[] = JSON.parse(data.textContent || '[]');
  const hledat = panel.querySelector<HTMLInputElement>('.f-hledat input')!;
  const cipy = panel.querySelector<HTMLElement>('.f-cipy')!;
  const jen = panel.querySelector<HTMLInputElement>('[data-jen-otevrene]')!;
  const pocet = document.getElementById('pocet')!;
  const zrusit = panel.querySelector<HTMLButtonElement>('.f-zrusit')!;
  const prazdno = document.querySelector<HTMLElement>('#graf .prazdno')!;
  const filtr: Filtr = { text: '', stitky: [], jenOtevrene: false };

  const proved = () => {
    let n = 0;
    for (const p of polozky) {
      const radek = document.querySelector<HTMLElement>(`.radek[data-slug="${CSS.escape(p.slug)}"]`);
      if (!radek) continue;
      const ok = odpovida(p, filtr);
      radek.hidden = !ok;
      if (ok) n++;
    }
    prazdno.hidden = n > 0;
    pocet.textContent = n === polozky.length ? sklonuj(n, ['kauza', 'kauzy', 'kauz']) : `Zobrazeno ${n} z ${polozky.length} kauz`;
    zrusit.hidden = !jeAktivni(filtr);
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

  const reset = () => {
    filtr.text = ''; filtr.stitky = []; filtr.jenOtevrene = false;
    hledat.value = ''; jen.checked = false;
    cipy.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', 'false'));
    aplikuj();
  };

  hledat.addEventListener('input', () => { filtr.text = hledat.value; aplikuj(); });
  jen.addEventListener('change', () => { filtr.jenOtevrene = jen.checked; aplikuj(); });
  cipy.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest('button');
    if (!b) return;
    b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
    filtr.stitky = [...cipy.querySelectorAll<HTMLElement>('[aria-pressed="true"]')].map(x => x.dataset.stitek!);
    aplikuj();
  });
  zrusit.addEventListener('click', reset);
  prazdno.querySelector('[data-zrusit]')!.addEventListener('click', reset);

  // šipky u čipů (bez viditelného posuvníku)
  const obal = cipy.parentElement!, vl = obal.querySelector<HTMLButtonElement>('.vlevo')!, vp = obal.querySelector<HTMLButtonElement>('.vpravo')!;
  const sipky = () => {
    const max = cipy.scrollWidth - cipy.clientWidth, x = cipy.scrollLeft;
    const vlevo = max > 2 && x > 2, vpravo = max > 2 && x < max - 2;
    vl.hidden = !vlevo; vp.hidden = !vpravo;
    obal.classList.toggle('mizi-vlevo', vlevo); obal.classList.toggle('mizi-vpravo', vpravo);
  };
  vl.addEventListener('click', () => cipy.scrollBy({ left: -220, behavior: 'smooth' }));
  vp.addEventListener('click', () => cipy.scrollBy({ left: 220, behavior: 'smooth' }));
  cipy.addEventListener('scroll', sipky);
  addEventListener('resize', sipky);
  document.fonts.ready.then(sipky);
  proved();
}
