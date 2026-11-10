import { describe, it, expect } from 'vitest';
import { jsonDoSkriptu } from '../../src/lib/html';

describe('jsonDoSkriptu', () => {
  it('nedovolí ukončit <script> ani otevřít komentář a data zůstanou stejná', () => {
    const data = [{ text: 'a</script><script>alert(1)</script> <!-- x' }];
    const vystup = jsonDoSkriptu(data);
    expect(vystup).not.toMatch(/<\/script|<!--/i);
    expect(JSON.parse(vystup)).toEqual(data);
  });
});
