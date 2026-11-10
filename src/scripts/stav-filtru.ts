/** Výsledek filtrů sdílený mezi osou a mapou. null = filtr ještě neproběhl (vše viditelné). */
let viditelne: string[] | null = null;

export const viditelneKauzy = (): string[] | null => viditelne;

export function nastavViditelne(slugy: string[]): void {
  viditelne = slugy;
  document.dispatchEvent(new CustomEvent('nv:filtr', { detail: slugy }));
}
