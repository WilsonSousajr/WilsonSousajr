// Writes the card SVGs into assets/. `node src/build.ts` → static cards.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderProfile, renderLink } from './cards.ts';
import { LINKS } from './data.ts';
import { THEMES } from './theme.ts';

export const ASSETS = fileURLToPath(new URL('../assets', import.meta.url));

function write(outDir: string, files: [string, string][]): string[] {
  mkdirSync(outDir, { recursive: true });
  return files.map(([name, svg]) => {
    const p = join(outDir, name);
    writeFileSync(p, svg);
    return p;
  });
}

export function writeStatic(outDir: string): string[] {
  const files: [string, string][] = [];
  for (const t of THEMES) {
    files.push([`profile-${t.name}.svg`, renderProfile(t)]);
    for (const l of LINKS) files.push([`link-${l.id}-${t.name}.svg`, renderLink(l, t)]);
  }
  return write(outDir, files);
}

if (import.meta.main) {
  for (const p of writeStatic(ASSETS)) console.log('wrote', p);
}
