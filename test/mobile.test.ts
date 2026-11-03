import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
import { renderProfile, renderLink, renderStats } from '../src/cards.ts';
import { LINKS, STATS_META } from '../src/data.ts';
import { THEMES, DARK } from '../src/theme.ts';
import { writeStatic, writeStats } from '../src/build.ts';
import { measure } from '../src/text.ts';

// A phone README column is ~342px wide. Mobile canvases are 360 wide (links
// 120 = 360/3), so they render at ~0.95 scale instead of ~0.41.
const vbW = (svg: string) => Number(svg.match(/viewBox="0 0 (\d+) /)![1]);
const STATS = { contributions: 12345, longestStreak: 365, repos: 120 };

test('mobile canvases: 360 wide, three link canvases add up to one wide canvas', () => {
  const t = DARK;
  assert.equal(vbW(renderProfile(t, 'mobile')), 360);
  assert.equal(vbW(renderStats(STATS, t, 'mobile')), 360);
  assert.equal(vbW(renderLink(LINKS[0], t, 'mobile')) * 3, 360);
});

test('mobile link titles fit the 112px card (12px padding each side)', () => {
  for (const l of LINKS) assert.ok(measure(l.title, 13, 600) <= 112 - 24, l.title);
});

test('mobile tagline wraps onto two lines inside the card', () => {
  const svg = renderProfile(DARK, 'mobile');
  // name + 2 tagline lines + pill + 6 chips = 10 text paths
  const textPaths = svg.match(/<path d="M[^"]+" fill="[^"]+"\/>/g)!.length;
  assert.equal(textPaths, 10);
});

test('mobile stat captions are short enough for a third of the card', () => {
  const col = (352 - 40) / 3;
  assert.equal(STATS_META.mobileCaptions.length, 3);
  for (const c of STATS_META.mobileCaptions) assert.ok(measure(c, 11, 400) < col - 8, c);
  for (const f of ['12,345', '365', '120']) assert.ok(measure(f, 24, 700) < col - 8, f);
});

test('writeStatic and writeStats also emit mobile variants', () => {
  const dir = mkdtempSync(join(tmpdir(), 'mobile-'));
  const names = [...writeStatic(dir), ...writeStats(dir, STATS)].map((p) => basename(p));
  for (const th of THEMES.map((t) => t.name)) {
    for (const n of ['profile', 'link-website', 'link-blog', 'link-linkedin', 'stats']) {
      assert.ok(names.includes(`${n}-mobile-${th}.svg`), `${n}-mobile-${th}.svg`);
    }
  }
  assert.equal(names.length, 20);
});

test('mobile cards display at 336 wide (links 112), fitting a 343px phone column', () => {
  assert.ok(renderProfile(DARK, 'mobile').includes('width="336"'));
  assert.ok(renderStats(STATS, DARK, 'mobile').includes('width="336"'));
  assert.ok(renderLink(LINKS[0], DARK, 'mobile').includes('width="112"'));
});
