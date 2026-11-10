import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

describe('kostra', () => {
  it('CNAME obsahuje doménu', () => {
    expect(readFileSync('public/CNAME', 'utf8').trim()).toBe('nenechmevyhnit.cz');
  });
});
