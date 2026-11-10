/** Kolik celých řádků se vejde do dané výšky (aspoň jeden). */
export function pocetNaStranku(vyska: number, vyskaRadku: number): number {
  if (!(vyskaRadku > 0)) return 1;
  // drobná tolerance kvůli zaokrouhlení subpixelových výšek
  return Math.max(1, Math.floor((vyska + 0.5) / vyskaRadku));
}

export function pocetStranek(n: number, naStranku: number): number {
  return Math.max(1, Math.ceil(n / Math.max(1, naStranku)));
}

/** Čísla stránek pro ovládání; null = vynechané stránky („…“). Nejvýš 7 položek. */
export function cislaStranek(aktualni: number, celkem: number): (number | null)[] {
  if (celkem <= 7) return Array.from({ length: celkem }, (_, i) => i + 1);
  if (aktualni <= 4) return [1, 2, 3, 4, 5, null, celkem];
  if (aktualni >= celkem - 3) return [1, null, celkem - 4, celkem - 3, celkem - 2, celkem - 1, celkem];
  return [1, null, aktualni - 1, aktualni, aktualni + 1, null, celkem];
}
