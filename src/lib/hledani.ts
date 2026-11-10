import type { KauzaZaznam } from './validace';

export type Filtr = { text: string; stitky: string[]; jenOtevrene: boolean };
export type PolozkaHledani = { slug: string; otevrena: boolean; stitky: string[]; text: string };

export function normalizuj(t: string): string {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function vytvorPolozku(z: KauzaZaznam): PolozkaHledani {
  const k = z.kauza;
  const text = [k.nazev, k.shrnuti, k.stitky.join(' '), ...k.udalosti.map(u => `${u.nazev} ${u.popis}`)].join(' ');
  return { slug: z.slug, otevrena: k.do === null, stitky: k.stitky, text: normalizuj(text) };
}

const slova = (t: string) => normalizuj(t).split(/\s+/).filter(Boolean);

export function odpovida(p: PolozkaHledani, f: Filtr): boolean {
  if (f.jenOtevrene && !p.otevrena) return false;
  if (f.stitky.length && !p.stitky.some(s => f.stitky.includes(s))) return false;
  return slova(f.text).every(w => p.text.includes(w));
}

export function jeAktivni(f: Filtr): boolean {
  return f.jenOtevrene || f.stitky.length > 0 || slova(f.text).length > 0;
}
