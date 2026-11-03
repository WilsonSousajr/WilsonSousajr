// The card shell every SVG shares: smoky gradient, hairline rim, top highlight,
// a slow light sweep along the rim, and a staggered fade-up entrance.
//
// Fluid: the root is width="100%" with a fixed pixel height and NO viewBox, so
// the card stretches to whatever width the README gives its <img> while text
// stays at its real pixel size (a viewBox would scale text with the column).
// Shapes that depend on the width use CSS calc(); anything pinned to the right
// edge or a fraction of the width goes through right() / at().
//
// Keyframes only define the from-state, so with animation disabled (reduced
// motion, or a renderer that ignores CSS) the card rests fully drawn.
import type { Theme } from './theme.ts';

export const RADIUS = 20;
/** Transparent side margin inside every image: neighbouring cards sit 2×INSET apart. */
export const INSET = 4;

export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Places markup relative to the card's right edge (use negative x inside). */
export const right = (markup: string) => `<svg x="100%" overflow="visible">${markup}</svg>`;
/** Places markup at a percentage of the card's width. */
export const at = (pct: number, markup: string) => `<svg x="${pct}%" overflow="visible">${markup}</svg>`;

export interface FrameOptions {
  height: number;
  theme: Theme;
  delayMs: number;
  /** Accessible name; also what GitHub shows on hover. */
  title: string;
  /** Inner markup, in px from the image's top-left (the card starts at x = INSET). */
  body: string;
}

export function frame({ height: h, theme: t, delayMs, title, body }: FrameOptions): string {
  const id = `${t.name}-bg`;
  const style = `
.shape { width: calc(100% - ${INSET * 2 + 1}px); height: ${h - 1}px; }
.hl { width: calc(100% - ${(INSET + RADIUS) * 2}px); }
.card { animation: fade-up 600ms ease-out both; animation-delay: ${delayMs}ms; }
.sweep { stroke-dasharray: 12 88; animation: sweep 9s linear infinite; animation-delay: ${delayMs + 600}ms; }
@keyframes fade-up { from { opacity: 0; transform: translateY(8px); } }
@keyframes sweep { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -100; } }
@media (prefers-reduced-motion: reduce) { .card, .sweep { animation: none; } .sweep { opacity: 0; } }`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="${h}" role="img">`,
    `<title>${esc(title)}</title>`,
    `<style>${style}</style>`,
    `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">`,
    `<stop offset="0" stop-color="${t.cardFrom}"/><stop offset="1" stop-color="${t.cardTo}"/>`,
    `</linearGradient></defs>`,
    `<g class="card">`,
    `<rect class="shape" x="${INSET + 0.5}" y=".5" rx="${RADIUS - 0.5}" fill="url(#${id})" stroke="${t.rim}"/>`,
    `<rect class="hl" x="${INSET + RADIUS}" y=".5" height="1" fill="${t.highlight}"/>`,
    `<rect class="shape sweep" x="${INSET + 0.5}" y=".5" rx="${RADIUS - 0.5}" fill="none" stroke="${t.sweep}" pathLength="100"/>`,
    body,
    `</g>`,
    `</svg>`,
  ].join('');
}
