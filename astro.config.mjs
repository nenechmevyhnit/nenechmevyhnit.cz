import { defineConfig } from 'astro/config';
import { resolve } from 'node:path';

const obsah = resolve(process.env.NV_OBSAH ?? 'obsah');

/** Ve vývoji: po změně souboru v adresáři obsahu se stránka v prohlížeči sama obnoví
 *  (kauzy se čtou přes fs, takže o nich Vite jinak neví). */
const obnovPriZmeneObsahu = {
  name: 'nv-obnov-pri-zmene-obsahu',
  configureServer(server) {
    server.watcher.add(obsah);
    const obnov = (soubor) => { if (resolve(soubor).startsWith(obsah)) server.ws.send({ type: 'full-reload' }); };
    for (const udalost of ['add', 'change', 'unlink']) server.watcher.on(udalost, obnov);
  },
};

export default defineConfig({
  site: 'https://posudtesami.cz',
  trailingSlash: 'always',
  outDir: process.env.NV_VYSTUP ?? 'dist',
  build: { format: 'directory' },
  vite: { plugins: [obnovPriZmeneObsahu] },
});
