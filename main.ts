// main.ts — assemble a STARLING entry into the make.fun dossier output directory.
// Node 22+, standard library only. Pure copy: no timestamps, no absolute paths in the output.

import { mkdirSync, cpSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { buildDossier, type DossierCaps } from './vendor/makefun-game.ts';

// The bounty's scorer caps. Only text_max_bytes shapes the dossier bytes; the rest refuse
// inputs the scorer itself would reject.
const caps: DossierCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });

// Game payload first.
cpSync('game', join(out, 'game'), { recursive: true });

// Rendered evidence second.
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync('screenshots', join(out, 'screenshots'), { recursive: true });

// Canonical dossier last, computed from exactly the bytes we just copied.
const dossier = buildDossier(out, caps);
writeFileSync(join(out, 'dossier.json'), dossier);

const moduleCount = readdirSync(join(out, 'game', 'src')).length;
// Authored locally: report the source-module count and the exact dossier size for the build log.
console.log(
  'starling: copied ' + moduleCount + ' source modules; dossier ' + dossier.byteLength + ' bytes -> ' + out,
);
