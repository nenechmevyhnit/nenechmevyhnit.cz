const escapuj = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function doplnArchiv(text: string, url: string, archiv: string): string {
  const u = escapuj(url);
  // řádkový zápis { ..., url: "x", ... }
  const radek = new RegExp(`(\\{[^}\\n]*url:\\s*["']?${u}["']?)(?![^}\\n]*archiv:)([^}\\n]*\\})`);
  if (radek.test(text)) return text.replace(radek, `$1, archiv: "${archiv}"$2`);
  // blokový zápis
  const radky = text.split('\n');
  const i = radky.findIndex(r => new RegExp(`^(\\s*)url:\\s*["']?${u}["']?\\s*$`).test(r));
  if (i === -1) return text;
  const odsazeni = radky[i].match(/^(\s*)/)![1];
  for (let j = i + 1; j < radky.length; j++) {
    const r = radky[j];
    const odsJ = r.match(/^(\s*)/)![1];
    if (r.trim() === '' || odsJ.length < odsazeni.length || r.trimStart().startsWith('- ')) break;
    if (r.trimStart().startsWith('archiv:')) return text;
  }
  radky.splice(i + 1, 0, `${odsazeni}archiv: ${archiv}`);
  return radky.join('\n');
}

export async function ziskejArchiv(url: string, fetchFn: typeof fetch = fetch): Promise<string | null> {
  try {
    const o = await fetchFn(`https://web.archive.org/save/${url}`, { redirect: 'follow' });
    if (!o.ok) return null;
    if (o.url.includes('/web/')) return o.url;
    const umisteni = o.headers.get('content-location');
    return umisteni ? `https://web.archive.org${umisteni}` : null;
  } catch {
    return null;
  }
}
