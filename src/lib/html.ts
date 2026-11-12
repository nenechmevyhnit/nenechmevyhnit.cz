/** JSON bezpečný pro vložení do <script type="application/json">: znak < se zapíše jako <,
 *  takže text z obsahu nemůže ukončit skript (</script>) ani otevřít komentář (<!--). */
export function jsonDoSkriptu(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/** Text bezpečný pro vložení do HTML i do hodnoty atributu v uvozovkách. */
export function escapujHtml(t: string): string {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
