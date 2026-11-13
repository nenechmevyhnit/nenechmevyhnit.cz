/** Po doběhnutí úvodních animací označí tělo stránky třídou `nacteno` (při omezeném pohybu hned). */
export function oznacNacteno(ms: number): void {
  const bezPohybu = matchMedia('(prefers-reduced-motion: reduce)').matches;
  setTimeout(() => document.body.classList.add('nacteno'), bezPohybu ? 0 : ms);
}
