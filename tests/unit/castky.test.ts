import { describe, it, expect } from 'vitest';
import { castkaText, castkaKratce, popisekDruhu, castkaProRazeni, hlavniCastka, DRUHY_CASTEK } from '../../src/lib/castky';

const NB = ' ';
const c = (castka: number, extra: Record<string, unknown> = {}) =>
  ({ castka, mena: 'CZK' as const, druh: 'dotace' as const, popis: 'x', zdroje: [1], ...extra });

describe('castkaText', () => {
  it('miliardy', () => expect(castkaText(c(19_000_000_000))).toBe(`19${NB}mld.${NB}Kč`));
  it('miliony s desetinnou čárkou', () => expect(castkaText(c(52_800_000))).toBe(`52,8${NB}mil.${NB}Kč`));
  it('nezaokrouhluje na jedno místo, když by se změnila hodnota', () => expect(castkaText(c(52_850_000))).toBe(`52,85${NB}mil.${NB}Kč`));
  it('miliardy s desetinami', () => expect(castkaText(c(1_500_000_000))).toBe(`1,5${NB}mld.${NB}Kč`));
  it('pod milion celé číslo s mezerami po tisících', () => expect(castkaText(c(500_000))).toBe(`500${NB}000${NB}Kč`));
  it('malé částky bez oddělovače', () => expect(castkaText(c(950))).toBe(`950${NB}Kč`));
  it('eura', () => expect(castkaText(c(15_000_000, { mena: 'EUR' }))).toBe(`15${NB}mil.${NB}eur`));
  it('přes', () => expect(castkaText(c(19_000_000_000, { presnost: 'pres' }))).toBe(`přes${NB}19${NB}mld.${NB}Kč`));
  it('téměř', () => expect(castkaText(c(5_600_000_000, { presnost: 'temer' }))).toBe(`téměř${NB}5,6${NB}mld.${NB}Kč`));
  it('dolary', () => expect(castkaText(c(22_000_000, { mena: 'USD' }))).toBe(`22${NB}mil.${NB}USD`));
  it('asi', () => expect(castkaText(c(2_600_000, { presnost: 'asi' }))).toBe(`asi${NB}2,6${NB}mil.${NB}Kč`));
});

describe('castkaKratce (seznam na ose)', () => {
  it('stovky milionů bez desetin', () => expect(castkaKratce(c(285_230_000))).toBe(`285${NB}mil.${NB}Kč`));
  it('desítky milionů na jedno desetinné místo', () => expect(castkaKratce(c(52_850_000))).toBe(`52,9${NB}mil.${NB}Kč`));
  it('jednotky na dvě desetinná místa', () => expect(castkaKratce(c(7_250_000_000))).toBe(`7,25${NB}mld.${NB}Kč`));
  it('celé číslo zůstane celé', () => expect(castkaKratce(c(13_000_000))).toBe(`13${NB}mil.${NB}Kč`));
  it('pod milion beze změny', () => expect(castkaKratce(c(30_000))).toBe(`30${NB}000${NB}Kč`));
  it('„přes“ zaokrouhlí dolů, aby pořád platilo', () => expect(castkaKratce(c(285_990_000, { presnost: 'pres' }))).toBe(`přes${NB}285${NB}mil.${NB}Kč`));
  it('„téměř“ zaokrouhlí nahoru, aby pořád platilo', () => expect(castkaKratce(c(5_541_000_000, { presnost: 'temer' }))).toBe(`téměř${NB}5,55${NB}mld.${NB}Kč`));
  it('zaokrouhlení na tisíc milionů přejde na miliardy', () => expect(castkaKratce(c(999_700_000))).toBe(`1${NB}mld.${NB}Kč`));
  it('desetinná čísla bez chyby plovoucí čárky', () => expect(castkaKratce(c(1_290_000_000, { presnost: 'pres' }))).toBe(`přes${NB}1,29${NB}mld.${NB}Kč`));
});

describe('druhy částek', () => {
  it('každý druh má popisek', () => DRUHY_CASTEK.forEach(d => expect(popisekDruhu(d).length).toBeGreaterThan(0)));
  it('objem výslovně není škoda', () => expect(popisekDruhu('objem')).toMatch(/objem/i));
});

describe('hlavniCastka', () => {
  it('přeskočí objem, protože sám o sobě neříká, že někdo o peníze přišel', () =>
    expect(hlavniCastka([c(19e9, { druh: 'objem' }), c(13.2e6, { druh: 'pokuta' })])?.druh).toBe('pokuta'));
  it('kauza jen s objemem hlavní částku nemá', () => expect(hlavniCastka([c(19e9, { druh: 'objem' })])).toBeUndefined());
});

describe('castkaProRazeni', () => {
  it('koruny beze změny', () => expect(castkaProRazeni(c(1000))).toBe(1000));
  it('eura přibližně přepočítá jen kvůli pořadí', () => expect(castkaProRazeni(c(1000, { mena: 'EUR' }))).toBe(25_000));
});
