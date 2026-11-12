/** Vrátí "n tvar" podle českého skloňování: 1 → tvary[0], 2–4 → tvary[1], ostatní → tvary[2]. */
export function sklonuj(n: number, tvary: [string, string, string]): string {
  const tvar = n === 1 ? tvary[0] : n >= 2 && n <= 4 ? tvary[1] : tvary[2];
  return `${n} ${tvar}`;
}

/* Česká sazba: jednopísmenná předložka nebo spojka (k, s, v, z, o, u, a, i) nesmí zůstat na konci řádku,
   proto ji s následujícím slovem spojí nezlomitelná mezera. Nesahá na písmena uvnitř slov ani na zkratky („s.r.o.“, „A.“). */
const NB = ' ';
const JEDNOPISMENNE = String.raw`(?<![\p{L}\p{N}.])[ksvzouaiKSVZOUAI][ \t\r\n]+(?=\S)`;
const VLNKA_TEXT = new RegExp(JEDNOPISMENNE, 'gu');
// značky, skripty, styly a textarea se nechávají beze změny; atributy v uvozovkách smějí obsahovat „>“
const VLNKA_HTML = new RegExp(String.raw`(<script\b[\s\S]*?</script>|<style\b[\s\S]*?</style>|<textarea\b[\s\S]*?</textarea>|<!--[\s\S]*?-->|<(?:[^>"']|"[^"]*"|'[^']*')*>)|` + JEDNOPISMENNE, 'gu');

const navazJednopismenne = (shoda: string) => shoda.trimEnd() + NB;

/** Vloží nezlomitelné mezery za jednopísmenná slova v prostém textu. */
export function vlnky(text: string): string {
  return text.replace(VLNKA_TEXT, navazJednopismenne);
}

/** Totéž pro hotové HTML: mění jen text mezi značkami. */
export function vlnkyVHtml(html: string): string {
  return html.replace(VLNKA_HTML, (shoda, chranene: string | undefined) => chranene ?? navazJednopismenne(shoda));
}
