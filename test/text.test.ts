import { test } from 'node:test';
import assert from 'node:assert/strict';
import { textPath, measure } from '../src/text.ts';

test('textPath emits a single outlined path, never <text>', () => {
  const { svg } = textPath('Wilson', { x: 0, y: 40, size: 32, weight: 700, fill: '#fff' });
  assert.match(svg, /^<path d="M[^"]+" fill="#fff"\/>$/);
  assert.ok(!svg.includes('<text'));
});

test('measure grows with font size', () => {
  assert.ok(measure('Wilson', 32, 700) > measure('Wilson', 16, 700));
});

test('letter spacing adds spacing*size after every glyph, like CSS', () => {
  const plain = measure('ABC', 10, 600);
  const spaced = measure('ABC', 10, 600, 0.15);
  assert.ok(Math.abs(spaced - (plain + 3 * 0.15 * 10)) < 0.01, `${spaced} vs ${plain}`);
});

test("anchor 'end' places the right edge at x", () => {
  const r = textPath('A', { x: 100, y: 20, size: 20, weight: 400, fill: '#000', anchor: 'end' });
  assert.ok(Math.abs(r.width - measure('A', 20, 400)) < 0.01);
  const firstX = Number(r.svg.match(/d="M(-?[\d.]+)/)![1]);
  assert.ok(firstX < 100);
});
