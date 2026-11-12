import { describe, it, expect } from 'vitest';
import { akterSchema, akterSchemaKoncepty, kauzaSchema } from '../../src/lib/schema';
import { popisekRole, ROLE_VZTAHU, ROLE_V_KAUZE, ROLE_NAVAZNOSTI, STRED } from '../../src/lib/role';
import { platnaKauza, platnyAkter } from './ukazka';

const chyby = (schema: { safeParse: (d: unknown) => any }, data: unknown): string[] => {
  const r = schema.safeParse(data);
  return r.success ? [] : r.error.issues.map((i: { message: string }) => i.message);
};
const sVztahem = (zmena: Record<string, unknown>) => {
  const a = platnyAkter(); (a.vztahy as any)[0] = { ...(a.vztahy as any)[0], ...zmena }; return a;
};

describe('slovník rolí', () => {
  it('každá role má lidský popisek', () => {
    for (const r of [...ROLE_VZTAHU, ...ROLE_V_KAUZE, ...ROLE_NAVAZNOSTI]) expect(popisekRole(r)).toMatch(/\S/);
    expect(popisekRole('prijemce-dotace')).toBe('příjemce dotace');
    expect(popisekRole('vychazi-z')).toBe('vychází z');
  });
  it('střed mapy', () => expect(STRED).toEqual({ id: 'babis', nazev: 'Andrej Babiš' }));
});

describe('akterSchema', () => {
  it('přijme platného aktéra', () => expect(chyby(akterSchema, platnyAkter())).toEqual([]));
  it('odmítne aktéra bez vztahů', () => expect(chyby(akterSchema, { ...platnyAkter(), vztahy: [] }).join(' ')).toMatch(/aspoň jeden vztah/));
  it('odmítne vztah bez zdroje', () => expect(chyby(akterSchema, sVztahem({ zdroje: [] })).join(' ')).toMatch(/Vztah musí mít aspoň jeden zdroj/));
  it('odmítne roli, která není pro vztah', () => expect(chyby(akterSchema, sVztahem({ role: 'prijemce-dotace' })).length).toBeGreaterThan(0));
  it('odmítne konec vztahu před začátkem', () => expect(chyby(akterSchema, sVztahem({ od: 2010, do: 2004 })).join(' ')).toMatch(/Rok konce vztahu 2004/));
  it('odmítne příliš dlouhý název', () => expect(chyby(akterSchema, { ...platnyAkter(), nazev: 'x'.repeat(29) }).join(' ')).toMatch(/28 znaků/));
  it('odmítne neznámý druh', () => expect(chyby(akterSchema, { ...platnyAkter(), druh: 'urad' }).length).toBeGreaterThan(0));
  it('odmítne popis delší než 200 znaků', () => expect(chyby(akterSchema, sVztahem({ popis: 'a'.repeat(201) })).join(' ')).toMatch(/200 znaků/));
  it('ve veřejném režimu vyžaduje ověření, v konceptech ne', () => {
    expect(chyby(akterSchema, { ...platnyAkter(), overeno: null }).length).toBeGreaterThan(0);
    expect(chyby(akterSchemaKoncepty, { ...platnyAkter(), overeno: null })).toEqual([]);
  });
});

describe('vazby v kauze', () => {
  const vazba = { id: 'firma-alfa', role: 'prijemce-dotace', popis: 'Firma Alfa žádala o dotaci.', zdroje: [2] };
  const navaznost = { kauza: 'jina-kauza', role: 'vychazi-z', popis: 'Vychází ze zjištění jiné kauzy.', zdroje: [1] };
  it('pole jsou nepovinná a mají výchozí prázdný seznam', () => {
    const k = kauzaSchema.parse(platnaKauza());
    expect(k.akteri).toEqual([]);
    expect(k.navazuje).toEqual([]);
  });
  it('přijme platnou vazbu i návaznost', () => expect(chyby(kauzaSchema, { ...platnaKauza(), akteri: [vazba], navazuje: [navaznost] })).toEqual([]));
  it('odmítne vazbu bez zdroje', () => expect(chyby(kauzaSchema, { ...platnaKauza(), akteri: [{ ...vazba, zdroje: [] }] }).join(' ')).toMatch(/Vazba na aktéra musí mít aspoň jeden zdroj/));
  it('odmítne odkaz na neexistující zdroj', () => expect(chyby(kauzaSchema, { ...platnaKauza(), akteri: [{ ...vazba, zdroje: [9] }] }).join(' ')).toMatch(/Vazba na aktéra „firma-alfa“ odkazuje na neexistující zdroj 9/));
  it('odmítne roli vztahu u aktéra v kauze', () => expect(chyby(kauzaSchema, { ...platnaKauza(), akteri: [{ ...vazba, role: 'vlastni' }] }).length).toBeGreaterThan(0));
  it('odmítne dvakrát téhož aktéra', () => expect(chyby(kauzaSchema, { ...platnaKauza(), akteri: [vazba, vazba] }).join(' ')).toMatch(/je u kauzy uvedena dvakrát/));
  it('odmítne návaznost bez zdroje a s neznámou rolí', () => {
    expect(chyby(kauzaSchema, { ...platnaKauza(), navazuje: [{ ...navaznost, zdroje: [] }] }).join(' ')).toMatch(/Návaznost musí mít aspoň jeden zdroj/);
    expect(chyby(kauzaSchema, { ...platnaKauza(), navazuje: [{ ...navaznost, role: 'prijemce-dotace' }] }).length).toBeGreaterThan(0);
  });
});
