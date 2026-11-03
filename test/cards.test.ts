import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
import { renderProfile, renderLink, renderStats, LAYOUT } from '../src/cards.ts';
import { LINKS, PROFILE, STATS_META } from '../src/data.ts';
import { THEMES, DARK } from '../src/theme.ts';
import { writeStatic, writeStats } from '../src/build.ts';
import { measure } from '../src/text.ts';

const STATS = { contributions: 12345, longestStreak: 365, repos: 120 };
const height = (svg: string) => Number(svg.match(/^<svg[^>]* height="(\d+)"/)![1]);

for (const t of THEMES) {
  test(`${t.name}: every card is fluid and under 50 KB`, () => {
    for (const v of ['desktop', 'mobile'] as const) {
      for (const svg of [renderProfile(t, v), renderLink(LINKS[1], t, v), renderStats(STATS, t, v)]) {
        assert.ok(svg.includes('width="100%"'));
        assert.ok(Buffer.byteLength(svg) < 50_000, `${Buffer.byteLength(svg)} bytes`);
      }
    }
  });

  test(`${t.name}: titles carry the real content`, () => {
    const title = (svg: string) => svg.match(/<title>(.*?)<\/title>/)![1];
    assert.ok(title(renderProfile(t)).includes('Wilson Sousa') && title(renderProfile(t)).includes('Full Stack Engineer'));
    assert.ok(title(renderLink(LINKS[1], t)).includes('Blog'));
    assert.ok(title(renderStats(STATS, t)).includes('12,345 contributions'));
  });

  test(`${t.name}: link cards carry the ArrowUpRight arrow, anchored right, and stagger`, () => {
    for (const l of LINKS) {
      const svg = renderLink(l, t);
      assert.ok(svg.includes('<svg x="100%" overflow="visible">'));
      assert.ok(svg.includes('M7 7h10v10') && svg.includes('M7 17 17 7'));
    }
    assert.ok(renderLink(LINKS[1], t).includes('animation-delay: 240ms'));
  });
}

test('cards in a row share a height; the desktop row is compact', () => {
  for (const v of ['desktop', 'mobile'] as const) {
    const hs = LINKS.map((l) => height(renderLink(l, DARK, v)));
    assert.equal(new Set(hs).size, 1, v);
  }
  assert.ok(height(renderProfile(DARK)) <= 150);
  assert.ok(height(renderLink(LINKS[0], DARK)) <= 106);
  assert.ok(height(renderStats(STATS, DARK)) <= 110);
});

test('stat columns sit at thirds of the card width', () => {
  const svg = renderStats(STATS, DARK);
  assert.ok(svg.includes('<svg x="33.333%" overflow="visible">'));
  assert.ok(svg.includes('<svg x="66.667%" overflow="visible">'));
});

// Text never scales, so it must fit the narrowest column each layout serves.
test('desktop content fits a 530px column (viewport 561)', () => {
  const card = 530 / 3 - 8 - LAYOUT.desktop.linkPad * 2;
  for (const l of LINKS) {
    assert.ok(measure(l.title, 15, 600) < card - 16, l.title); // leave room for the arrow
    assert.ok(measure(l.sub, 11, 400) < card, l.sub);
  }
  const chips = PROFILE.chips.reduce((s, c) => s + measure(c, 10, 500) + 16 + 6, 0);
  assert.ok(chips < 530 - 8 - 40, `chips ${chips}`);
  const col = (530 - 8) / 3 - 8;
  for (const c of STATS_META.captions) assert.ok(measure(c, 11, 400) < col, c);
  assert.ok(measure('12,345', 24, 700) < col);
});

test('mobile content fits a 343px column (iPhone SE-class)', () => {
  const card = 343 / 3 - 8 - LAYOUT.mobile.linkPad * 2;
  for (const l of LINKS) assert.ok(measure(l.title, LAYOUT.mobile.linkTitle, 600) < card, l.title);
  const col = (343 - 8) / 3 - 8;
  for (const c of STATS_META.mobileCaptions) assert.ok(measure(c, 11, 400) < col, c);
  assert.ok(measure('12,345', 24, 700) < col);
});

test('writeStatic + writeStats emit desktop and mobile variants per theme', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cards-'));
  const names = [...writeStatic(dir), ...writeStats(dir, STATS)].map((p) => basename(p)).sort();
  const expected: string[] = [];
  for (const th of ['dark', 'light']) {
    for (const n of ['profile', 'link-website', 'link-blog', 'link-linkedin', 'stats']) {
      expected.push(`${n}-${th}.svg`, `${n}-mobile-${th}.svg`);
    }
  }
  assert.deepEqual(names, expected.sort());
});
