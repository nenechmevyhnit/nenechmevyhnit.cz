import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://nenechmevyhnit.cz',
  trailingSlash: 'always',
  outDir: process.env.NV_VYSTUP ?? 'dist',
  build: { format: 'directory' },
});
