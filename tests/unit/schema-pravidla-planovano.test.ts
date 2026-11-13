import { describe, it, expect } from 'vitest';
import { pravidloSchema } from '../../src/lib/schema-pravidla';
import { platnePravidlo } from './ukazka';

const chyby = (data: unknown) => {
  const r = pravidloSchema.safeParse(data);
  return r.success ? [] : r.error.issues.map(i => i.message);
};
const s = (planovano: unknown) => ({ ...platnePravidlo(), planovano });
const PLATNE = { stavK: '2026-11-13', text: '1. čtení je navrženo na pořad schůze od 24. 11. 2099.', zdroje: [1] };

describe('planovano (nejbližší plánovaný krok)', () => {
  it('je volitelné', () => expect(chyby(platnePravidlo())).toEqual([]));
  it('přijme stav k datu, text s budoucím termínem a zdroj', () => {
    expect(chyby(s(PLATNE))).toEqual([]);
    expect(pravidloSchema.parse(s({ ...PLATNE, stavK: new Date('2026-11-13T00:00:00Z') })).planovano!.stavK).toBe('2026-11-13');
  });
  it('odmítne stav k datu v budoucnosti', () => expect(chyby(s({ ...PLATNE, stavK: '2099-01-01' })).join(' ')).toMatch(/leží v budoucnosti/));
  it('odmítne nepřesné datum stavu', () => expect(chyby(s({ ...PLATNE, stavK: '2026-11' })).join(' ')).toMatch(/RRRR-MM-DD/));
  it('odmítne prázdný text', () => expect(chyby(s({ ...PLATNE, text: ' ' })).join(' ')).toMatch(/nesmí být prázdný/));
  it('musí mít zdroj a ten musí existovat', () => {
    expect(chyby(s({ ...PLATNE, zdroje: [] })).join(' ')).toMatch(/Plánovaný krok musí mít aspoň jeden zdroj/);
    expect(chyby(s({ ...PLATNE, zdroje: [99] })).join(' ')).toMatch(/Plánovaný krok odkazuje na neexistující zdroj 99/);
  });
  it('odmítne neznámou vlastnost', () => expect(chyby(s({ ...PLATNE, datum: '2099-01-01' })).length).toBeGreaterThan(0));
});
