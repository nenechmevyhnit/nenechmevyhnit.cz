import { describe, it, expect } from 'vitest';
import { sklonuj } from '../../src/lib/cestina';

const LET: [string, string, string] = ['rok', 'roky', 'let'];

describe('sklonuj', () => {
  it.each([[1, '1 rok'], [2, '2 roky'], [4, '4 roky'], [5, '5 let'], [12, '12 let'], [0, '0 let']])('%i → %s', (n, ocekavano) => {
    expect(sklonuj(n, LET)).toBe(ocekavano);
  });
});
