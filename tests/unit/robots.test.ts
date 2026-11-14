import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { WEB } from '../../src/lib/web';

describe('robots.txt', () => {
  const text = () => readFileSync('public/robots.txt', 'utf8');

  it('nikomu nic nezakazuje', () => {
    expect(text()).toMatch(/^Disallow:\s*$/m);
    expect(text()).not.toMatch(/^Disallow:\s*\//m);
  });

  it('odkazuje na sitemapu na vlastní doméně', () => {
    expect(text()).toContain(`Sitemap: ${WEB.domena}/sitemap.xml`);
  });
});
