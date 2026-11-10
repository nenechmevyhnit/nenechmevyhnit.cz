import { describe, it, expect } from 'vitest';
import { rozdelOdstavce, poznamkyVOdstavci, odstavecNaHtml } from '../../src/lib/souvislosti';

describe('souvislosti', () => {
  it('rozdělí tělo na odstavce podle prázdných řádků', () => {
    expect(rozdelOdstavce('\nPrvní.[^1]\n\n\nDruhý\nřádek.[^2]\n')).toEqual(['První.[^1]', 'Druhý\nřádek.[^2]']);
  });
  it('prázdné tělo nemá odstavce', () => expect(rozdelOdstavce('  \n ')).toEqual([]));
  it('najde čísla poznámek', () => expect(poznamkyVOdstavci('A.[^1] B.[^12][^3]')).toEqual([1, 12, 3]));
  it('převede poznámku na odkaz na zdroj', () => {
    expect(odstavecNaHtml('Text.[^4]')).toBe('Text.<sup><a class="pozn" href="#zdroj-4" data-zdroj="4">[4]</a></sup>');
  });
  it('escapuje HTML a zachová tučné a kurzívu', () => {
    expect(odstavecNaHtml('<b>x</b> **tučně** a *kurzíva* & "uvozovky"'))
      .toBe('&lt;b&gt;x&lt;/b&gt; <strong>tučně</strong> a <em>kurzíva</em> &amp; &quot;uvozovky&quot;');
  });
});
