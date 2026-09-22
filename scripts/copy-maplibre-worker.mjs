// MapLibre GL JS v6 loads its rendering worker from a URL that it cannot
// reliably resolve through Vite (dev) or esbuild (production), so the
// worker file — and the sibling chunk it imports internally — must be
// served as a static asset instead. This script copies both, straight
// from the installed package, into public/, where Angular serves anything
// verbatim in both `ng serve` and `ng build`. Runs automatically before
// `npm start` and `npm run build` (see package.json), so it always
// matches whatever maplibre-gl version is installed.
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const projectRoot = path.dirname(fileURLToPath(new URL('.', import.meta.url)));
const maplibreDist = path.join(path.dirname(require.resolve('maplibre-gl/package.json')), 'dist');
const dest = path.join(projectRoot, 'public');

mkdirSync(dest, { recursive: true });
for (const file of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) {
  copyFileSync(path.join(maplibreDist, file), path.join(dest, file));
}
