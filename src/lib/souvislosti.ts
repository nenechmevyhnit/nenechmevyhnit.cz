const POZNAMKA = /\[\^(\d+)\]/g;

export function rozdelOdstavce(telo: string): string[] {
  return telo.trim() === '' ? [] : telo.trim().split(/\n\s*\n/).map(o => o.trim()).filter(Boolean);
}

export function poznamkyVOdstavci(odstavec: string): number[] {
  return [...odstavec.matchAll(POZNAMKA)].map(m => Number(m[1]));
}

const escapuj = (t: string) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function odstavecNaHtml(odstavec: string): string {
  return escapuj(odstavec)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // stejná značka zdroje jako všude jinde v detailu (číslo v rámečku), ne horní index v hranatých závorkách
    .replace(POZNAMKA, (_, n) => `<span class="chipy"><a class="pozn" href="#zdroj-${n}" data-zdroj="${n}" aria-label="Zdroj ${n}">${n}</a></span>`);
}
