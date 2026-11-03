import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
import { renderProfile, renderLink } from '../src/cards.ts';
import { LINKS } from '../src/data.ts';
import { THEMES } from '../src/theme.ts';
import { writeStatic } from '../src/build.ts';

for (const t of THEMES) {
  test(`${t.name}: profile card size, title and weight`, () => {
    const svg = renderProfile(t);
    assert.ok(svg.includes('viewBox="0 0 840 190"'));
    const title = svg.match(/<title>(.*?)<\/title>/)![1];
    assert.ok(title.includes('Wilson Sousa') && title.includes('Full Stack Engineer'));
    assert.ok(Buffer.byteLength(svg) < 50_000, `${Buffer.byteLength(svg)} bytes`);
  });

  test(`${t.name}: blog link card size, title and stagger`, () => {
    const svg = renderLink(LINKS[1], t);
    assert.ok(svg.includes('viewBox="0 0 272 150"'));
    assert.ok(svg.match(/<title>(.*?)<\/title>/)![1].includes('Blog'));
    assert.ok(svg.includes('animation-delay: 240ms'));
  });

  test(`${t.name}: link cards carry the ArrowUpRight arrow as a stroked path`, () => {
    for (const l of LINKS) {
      const svg = renderLink(l, t);
      assert.ok(svg.includes('stroke-linecap="round"'));
      assert.ok(svg.includes('M7 7h10v10') && svg.includes('M7 17 17 7'));
    }
  });
}

test('writeStatic writes 4 cards × 2 themes with the agreed names', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cards-'));
  const names = writeStatic(dir).map((p) => basename(p)).sort();
  assert.deepEqual(names, [
    'link-blog-dark.svg', 'link-blog-light.svg',
    'link-linkedin-dark.svg', 'link-linkedin-light.svg',
    'link-website-dark.svg', 'link-website-light.svg',
    'profile-dark.svg', 'profile-light.svg',
  ]);
});
