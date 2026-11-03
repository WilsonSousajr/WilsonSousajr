import { test } from 'node:test';
import assert from 'node:assert/strict';
import { frame, right, at } from '../src/frame.ts';
import { THEMES } from '../src/theme.ts';

for (const theme of THEMES) {
  const svg = frame({ height: 106, theme, delayMs: 240, title: 'A & B', body: '' });

  test(`${theme.name}: fluid root — fills its <img> width at a fixed pixel height, no viewBox`, () => {
    assert.ok(svg.startsWith('<svg'));
    assert.ok(svg.includes('width="100%" height="106"'));
    assert.ok(!svg.includes('viewBox'), 'a viewBox would scale text with the column');
  });

  test(`${theme.name}: card is inset 4px each side via CSS calc`, () => {
    assert.ok(svg.includes('calc(100% - 9px)'));
  });

  test(`${theme.name}: reduced motion turns animation off`, () => {
    assert.ok(svg.includes('@media (prefers-reduced-motion: reduce)'));
    assert.ok(svg.includes('animation: none'));
  });

  test(`${theme.name}: per-card entrance delay`, () => {
    assert.ok(svg.includes('animation-delay: 240ms'));
  });

  test(`${theme.name}: keyframes only define the from-state, so rest is complete`, () => {
    const kf = svg.match(/@keyframes fade-up\s*{([^}]*}[^}]*)}/)?.[1] ?? '';
    assert.ok(kf.includes('from'), 'has a from state');
    assert.ok(!/\bto\b/.test(kf), 'no to-state');
  });

  test(`${theme.name}: nothing GitHub would strip or block`, () => {
    for (const bad of ['<text', '<image', '<script', 'foreignObject', 'href=']) {
      assert.ok(!svg.includes(bad), bad);
    }
  });

  test(`${theme.name}: title is XML-escaped`, () => {
    assert.ok(svg.includes('<title>A &amp; B</title>'));
  });
}

test('right() anchors markup to the right edge; at() to a % of the width', () => {
  assert.equal(right('<g/>'), '<svg x="100%" overflow="visible"><g/></svg>');
  assert.equal(at(33.333, '<g/>'), '<svg x="33.333%" overflow="visible"><g/></svg>');
});
