import { test } from 'node:test';
import assert from 'node:assert/strict';
import { frame } from '../src/frame.ts';
import { THEMES } from '../src/theme.ts';

for (const theme of THEMES) {
  const svg = frame({ width: 272, height: 150, theme, delayMs: 240, title: 'A & B', body: '' });

  test(`${theme.name}: standalone svg with the right viewBox`, () => {
    assert.ok(svg.startsWith('<svg'));
    assert.ok(svg.includes('viewBox="0 0 280 150"'), 'card width + 2×4px inset');
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
