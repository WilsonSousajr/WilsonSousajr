// Writes the card SVGs into assets/.
//   node src/build.ts          → static cards (profile + links)
//   node src/build.ts --stats  → fetch GitHub stats, rewrite the stat card
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderProfile, renderLink, renderStats, type Variant } from './cards.ts';
import { fetchStats, type Stats } from './stats.ts';
import { LINKS } from './data.ts';
import { THEMES } from './theme.ts';

const VARIANTS: Variant[] = ['desktop', 'mobile'];

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
    for (const v of VARIANTS) {
      const sfx = v === 'mobile' ? `mobile-${t.name}` : t.name;
      files.push([`profile-${sfx}.svg`, renderProfile(t, v)]);
      for (const l of LINKS) files.push([`link-${l.id}-${sfx}.svg`, renderLink(l, t, v)]);
    }
  }
  return write(outDir, files);
}

/** Renders both themes before writing, so both files change together or not at all. */
export function writeStats(outDir: string, s: Stats): string[] {
  const files = THEMES.flatMap((t) =>
    VARIANTS.map((v): [string, string] => [`stats-${v === 'mobile' ? `mobile-${t.name}` : t.name}.svg`, renderStats(s, t, v)]),
  );
  return write(outDir, files);
}

export interface Deps {
  outDir?: string;
  token?: string;
  now?: Date;
  fetch?: typeof fetch;
}

function localToken(): string {
  return execFileSync('gh', ['auth', 'token'], { encoding: 'utf8' }).trim();
}

/** Returns the process exit code. On any stats failure nothing is written. */
export async function main(argv: string[], deps: Deps = {}): Promise<number> {
  const outDir = deps.outDir ?? ASSETS;
  if (!argv.includes('--stats')) {
    for (const p of writeStatic(outDir)) console.log('wrote', p);
    return 0;
  }
  try {
    const token = deps.token ?? process.env.GITHUB_TOKEN ?? localToken();
    const stats = await fetchStats({ token, login: 'WilsonSousajr', now: deps.now ?? new Date(), fetch: deps.fetch });
    for (const p of writeStats(outDir, stats)) console.log('wrote', p);
    console.log('stats', JSON.stringify(stats));
    return 0;
  } catch (err) {
    console.error('stat card not updated:', err instanceof Error ? err.message : err);
    return 1;
  }
}

if (import.meta.main) {
  process.exitCode = await main(process.argv.slice(2));
}
