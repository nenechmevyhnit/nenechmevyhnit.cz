/** Vrátí "n tvar" podle českého skloňování: 1 → tvary[0], 2–4 → tvary[1], ostatní → tvary[2]. */
export function sklonuj(n: number, tvary: [string, string, string]): string {
  const tvar = n === 1 ? tvary[0] : n >= 2 && n <= 4 ? tvary[1] : tvary[2];
  return `${n} ${tvar}`;
}
