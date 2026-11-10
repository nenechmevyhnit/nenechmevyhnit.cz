import { sklonuj } from './cestina';

export const ROK_OD = 1980;
export const rokDo = (dnes: Date = new Date()): number => dnes.getFullYear();

export function rokCislo(datum: string): number {
  const [r, m, d] = datum.split('-').map(Number);
  if (!m) return r + 0.5;
  if (!d) return r + (m - 1 + 0.5) / 12;
  return r + (m - 1 + (d - 1) / 31) / 12;
}

export function naProcenta(rok: number, od: number, doRok: number): number {
  const p = ((rok - od) / (doRok - od)) * 100;
  return Math.min(100, Math.max(0, p));
}

export function rozsahText(od: number, doRok: number | null): string {
  if (doRok === null) return `${od} – dosud`;
  return od === doRok ? String(od) : `${od}–${doRok}`;
}

export function delkaText(od: number, doRok: number | null, dnes: Date = new Date()): string {
  const n = (doRok ?? rokDo(dnes)) - od;
  if (n <= 0) return 'méně než rok';
  return sklonuj(n, ['rok', 'roky', 'let']) + (doRok === null ? ' a dál' : '');
}

const MESICE = ['leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'];
export function datumText(datum: string): string {
  const [r, m, d] = datum.split('-');
  if (d) return `${Number(d)}. ${Number(m)}. ${r}`;
  if (m) return `${MESICE[Number(m) - 1]} ${r}`;
  return r;
}

export function znackyOsy(od: number, doRok: number): { rok: number; hlavni: boolean }[] {
  const z: { rok: number; hlavni: boolean }[] = [];
  for (let r = Math.ceil(od / 5) * 5; r < doRok; r += 5) z.push({ rok: r, hlavni: r % 10 === 0 });
  z.push({ rok: doRok, hlavni: true });
  return z;
}

/** Kauza trvá do konce roku „do“; otevřená kauza do konce letošního roku. */
export const konecRok = (doRok: number | null, dnes: Date = new Date()): number => (doRok ?? rokDo(dnes)) + 1;

/** Poloha události uvnitř pruhu kauzy v procentech (0–100). */
export function polohaVKauze(datum: string, od: number, doRok: number | null, dnes: Date = new Date()): number {
  return naProcenta(rokCislo(datum), od, konecRok(doRok, dnes));
}
