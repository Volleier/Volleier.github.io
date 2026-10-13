import fs from 'node:fs';
import path from 'node:path';

const p = path.join(process.cwd(), 'src/scripts/emerge-reveal.ts');
if (!fs.existsSync(p)) {
  console.error('missing emerge-reveal.ts');
  process.exit(1);
}
const src = fs.readFileSync(p, 'utf8');
const must = [
  'export async function createEmergeReveal',
  'play(): Promise<void>',
  'setProgress',
  'destroy()',
  'rimWidth = 0.035',
  'fillAlpha = 0.35',
  'OES_standard_derivatives',
  'u_progress',
  'u_fill',
];
for (const m of must) {
  if (!src.includes(m)) {
    console.error('emerge-reveal.ts missing:', m);
    process.exit(1);
  }
}
console.log('assert-emerge-api: OK');
