import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

// Astro/TS: compile-free check by reading the file as text for required strings,
// then verify cover files exist on disk.
const root = process.cwd();
const src = fs.readFileSync(path.join(root, 'src/data/games.ts'), 'utf8');
const checks = [
  "id: 'graymoth-squad'",
  "id: 'sevendream'",
  "href: '/game/graymoth-squad'",
  "href: '/game/sevendream'",
  "cover: '/assets/game/graymoth-squad/graymoth-squad.jpg'",
  "cover: '/assets/game/sevendream/sevendream-placeholder.jpg'",
];
for (const c of checks) {
  if (!src.includes(c)) {
    console.error('Missing in games.ts:', c);
    process.exit(1);
  }
}

const covers = [
  'public/assets/game/graymoth-squad/graymoth-squad.jpg',
  'public/assets/game/sevendream/sevendream-placeholder.jpg',
];
for (const rel of covers) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p) || fs.statSync(p).size < 1000) {
    console.error('Missing/too-small cover:', rel);
    process.exit(1);
  }
}
console.log('assert-games-data: OK');
