/** Nejvýš tolik kauz na jedné stránce osy, i když by se jich na výšku vešlo víc. */
export const NEJVIC_NA_STRANKU = 10;

/** Kolik celých řádků se vejde do dané výšky (aspoň jeden, nejvýš `max`). */
export function pocetNaStranku(vyska: number, vyskaRadku: number, max: number = NEJVIC_NA_STRANKU): number {
  if (!(vyskaRadku > 0)) return 1;
  // drobná tolerance kvůli zaokrouhlení subpixelových výšek
  return Math.max(1, Math.min(max, Math.floor((vyska + 0.5) / vyskaRadku)));
}

export function pocetStranek(n: number, naStranku: number): number {
  return Math.max(1, Math.ceil(n / Math.max(1, naStranku)));
}

/** Čísla stránek pro ovládání; null = vynechané stránky („…“). Nejvýš `max` položek: 7 na počítači,
 *  5 na mobilu (úzká lišta s tlačítky pro prst). První, aktuální a poslední stránka jsou vidět vždy. */
export function cislaStranek(aktualni: number, celkem: number, max: 5 | 7 = 7): (number | null)[] {
  if (celkem <= max) return Array.from({ length: celkem }, (_, i) => i + 1);
  // kolem aktuální stránky: na počítači i sousední, na mobilu jen ona sama
  const okoli = max === 7 ? 1 : 0;
  const kraj = max - 2; // kolik čísel zbude u kraje vedle „…“ a poslední (první) stránky
  if (aktualni + okoli <= kraj) return [...Array.from({ length: kraj }, (_, i) => i + 1), null, celkem];
  if (aktualni - okoli >= celkem - kraj + 1) return [1, null, ...Array.from({ length: kraj }, (_, i) => celkem - kraj + 1 + i)];
  return [1, null, ...Array.from({ length: 2 * okoli + 1 }, (_, i) => aktualni - okoli + i), null, celkem];
}
