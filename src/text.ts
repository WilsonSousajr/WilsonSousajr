// Text → outlined SVG path. GitHub shows README SVGs as <img>, which can't load
// web fonts, so every glyph is baked into path data from the Outfit TTFs.
import { readFileSync } from 'node:fs';
import opentype from 'opentype.js';

export type Weight = 400 | 500 | 600 | 700;

const FILES: Record<Weight, string> = {
  400: 'Outfit-Regular.ttf',
  500: 'Outfit-Medium.ttf',
  600: 'Outfit-SemiBold.ttf',
  700: 'Outfit-Bold.ttf',
};

const cache = new Map<Weight, opentype.Font>();
function font(weight: Weight): opentype.Font {
  let f = cache.get(weight);
  if (!f) {
    const buf = readFileSync(new URL(`../fonts/${FILES[weight]}`, import.meta.url));
    f = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
    cache.set(weight, f);
  }
  return f;
}

/** Glyph origins (x offsets) and total advance, CSS-style: spacing follows every glyph. */
function layout(text: string, size: number, weight: Weight, letterSpacing = 0) {
  const f = font(weight);
  const scale = size / f.unitsPerEm;
  const glyphs = f.stringToGlyphs(text);
  const offsets: number[] = [];
  let x = 0;
  glyphs.forEach((g, i) => {
    offsets.push(x);
    x += (g.advanceWidth ?? 0) * scale + letterSpacing * size;
    const next = glyphs[i + 1];
    if (next) x += f.getKerningValue(g, next) * scale;
  });
  return { glyphs, offsets, width: x };
}

export function measure(text: string, size: number, weight: Weight, letterSpacing = 0): number {
  return layout(text, size, weight, letterSpacing).width;
}

export interface TextOptions {
  x: number;
  /** Baseline. */
  y: number;
  size: number;
  weight: Weight;
  fill: string;
  /** In em, like CSS `letter-spacing: 0.15em`. */
  letterSpacing?: number;
  anchor?: 'start' | 'end';
}

export function textPath(text: string, o: TextOptions): { svg: string; width: number } {
  const { glyphs, offsets, width } = layout(text, o.size, o.weight, o.letterSpacing);
  const x0 = o.anchor === 'end' ? o.x - width : o.x;
  const commands = glyphs.flatMap((g, i) => g.getPath(x0 + offsets[i], o.y, o.size).commands);
  return { svg: `<path d="${compact(commands)}" fill="${o.fill}"/>`, width };
}

const r1 = (n: number) => Math.round(n * 10) / 10;
/** Join numbers with the fewest separators: "-" and a leading "." already separate. */
function nums(values: number[]): string {
  let out = '';
  for (const v of values) {
    let s = String(v);
    if (s.startsWith('0.')) s = s.slice(1);
    else if (s.startsWith('-0.')) s = '-' + s.slice(2);
    const needsSep = out !== '' && !s.startsWith('-') && !(s.startsWith('.') && /\.\d*$/.test(out));
    out += (needsSep ? ' ' : '') + s;
  }
  return out;
}

/**
 * Path data with one absolute move per contour and relative segments after it,
 * rounded to 0.1px on absolute positions (so error never accumulates). Relative
 * numbers are short, which keeps outlined-text cards under the 50 KB budget.
 */
function compact(cmds: opentype.PathCommand[]): string {
  let d = '';
  let cx = 0, cy = 0;
  for (const c of cmds) {
    if (c.type === 'Z') { d += 'z'; continue; }
    if (c.type === 'M') {
      cx = r1(c.x); cy = r1(c.y);
      d += 'M' + nums([cx, cy]);
      continue;
    }
    const pts: number[] = [];
    const rel = (x: number, y: number) => { pts.push(r1(r1(x) - cx), r1(r1(y) - cy)); };
    if (c.type === 'Q') rel(c.x1, c.y1);
    if (c.type === 'C') { rel(c.x1, c.y1); rel(c.x2, c.y2); }
    rel(c.x, c.y);
    d += c.type.toLowerCase() + nums(pts);
    cx = r1(c.x); cy = r1(c.y);
  }
  return d;
}
