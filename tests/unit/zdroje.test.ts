import { describe, it, expect } from 'vitest';
import { skupinaZdroje } from '../../src/lib/zdroje';

const primarni = (vydavatel: string, titulek = 'Dokument') => skupinaZdroje({ druh: 'primarni', vydavatel, titulek });

describe('skupinaZdroje', () => {
  it('média a stanovisko dotčené strany zůstávají podle druhu', () => {
    expect(skupinaZdroje({ druh: 'media', vydavatel: 'Ústavní soud', titulek: 'x' })).toBe('media');
    expect(skupinaZdroje({ druh: 'stanovisko', vydavatel: 'Agrofert', titulek: 'x' })).toBe('stanovisko');
  });
  it.each([
    'Ústavní soud', 'Nejvyšší správní soud', 'Krajský soud v Praze (rozhodnuti.justice.cz)',
    'Vrchní soud v Praze (usnesení zveřejněné Ministerstvem spravedlnosti)', 'Tribunál EU (rozsudek, EUR-Lex)',
    'Soudní dvůr EU (tisková zpráva Tribunálu č. 162/22)',
  ])('soud: %s', v => expect(primarni(v)).toBe('soud'));
  it('Úřední věstník EU s žalobou nebo usnesením Tribunálu je soud', () => {
    expect(primarni('Úřední věstník EU (C 163/39)', 'Žaloba podaná dne 5. února 2021 – Primagra v. Komise (Věc T-101/21)')).toBe('soud');
    expect(primarni('Úřední věstník EU (C 463/44)', 'Usnesení Tribunálu ze dne 14. září 2022 – Primagra a Mlékárna Hlinsko v. Komise (Spojené věci T-101/21 a T-213/21)')).toBe('soud');
  });
  it.each([
    'Poslanecká sněmovna PČR (stenozáznam)', 'Evropský parlament (Legislative Observatory)',
    'Evropský parlament (Úřední věstník EU, C 362/37, EUR-Lex)', 'Sbírka zákonů (epravo.cz)',
  ])('parlament: %s', v => expect(primarni(v)).toBe('parlament'));
  it.each([
    'Ministerstvo spravedlnosti ČR (obchodní rejstřík)', 'Evropská komise (DG REGIO, DG EMPL)',
    'Úřad evropského veřejného žalobce (EPPO)', 'Protimonopolný úrad SR (tisková zpráva)', 'Ministerstvo financí, Auditní orgán',
  ])('úřad: %s', v => expect(primarni(v)).toBe('urad'));
  it.each([
    ['AGROFERT HOLDING, a.s. (Obchodní věstník)', 'Výroční zpráva 2005 / Annual Report'],
    ['AGROFERT, a.s.', 'Výroční zpráva konsolidovaná 2025'],
    ['Fiktivní firma, s.r.o.', 'Notářský zápis'],
  ])('firemní dokument: %s', (v, t) => expect(primarni(v, t)).toBe('firma'));
});
