// The card shell every SVG shares: smoky gradient, hairline rim, top highlight,
// a slow light sweep along the rim, and a staggered fade-up entrance.
// Keyframes only define the from-state, so with animation disabled (reduced
// motion, or a renderer that ignores CSS) the card rests fully drawn.
import type { Theme } from './theme.ts';

export const RADIUS = 20;
/** Transparent side margin baked into every canvas: cards in a row sit 2×INSET apart,
 * and three link canvases always add up to one wide canvas (desktop 3×200 = 600, mobile 3×120 = 360). */
export const INSET = 4;

export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export interface FrameOptions {
  width: number;
  height: number;
  theme: Theme;
  delayMs: number;
  /** Accessible name; also what GitHub shows on hover. */
  title: string;
  /** Inner SVG markup (paths) drawn on top of the card. */
  body: string;
  /** Display size relative to the canvas (sets the width/height attributes the README shows). */
  scale?: number;
}

export function frame({ width: w, height: h, theme: t, delayMs, title, body, scale = 1 }: FrameOptions): string {
  const cw = w + INSET * 2;
  const r1 = (n: number) => Math.round(n * 10) / 10;
  const id = `${t.name}-bg`;
  const style = `
.card { animation: fade-up 600ms ease-out both; animation-delay: ${delayMs}ms; }
.sweep { stroke-dasharray: 12 88; animation: sweep 9s linear infinite; animation-delay: ${delayMs + 600}ms; }
@keyframes fade-up { from { opacity: 0; transform: translateY(8px); } }
@keyframes sweep { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -100; } }
@media (prefers-reduced-motion: reduce) { .card, .sweep { animation: none; } .sweep { opacity: 0; } }`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cw} ${h}" width="${r1(cw * scale)}" height="${r1(h * scale)}" role="img">`,
    `<title>${esc(title)}</title>`,
    `<style>${style}</style>`,
    `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">`,
    `<stop offset="0" stop-color="${t.cardFrom}"/><stop offset="1" stop-color="${t.cardTo}"/>`,
    `</linearGradient></defs>`,
    // The inset lives on a wrapper: .card's CSS transform (fade-up) would override a transform attribute.
    `<g transform="translate(${INSET} 0)">`,
    `<g class="card">`,
    `<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="${RADIUS - 0.5}" fill="url(#${id})" stroke="${t.rim}"/>`,
    `<line x1="${RADIUS}" y1="1" x2="${w - RADIUS}" y2="1" stroke="${t.highlight}"/>`,
    `<rect class="sweep" x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="${RADIUS - 0.5}" fill="none" stroke="${t.sweep}" pathLength="100"/>`,
    body,
    `</g>`,
    `</g>`,
    `</svg>`,
  ].join('');
}
