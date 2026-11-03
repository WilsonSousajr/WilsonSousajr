// Card layouts. Sizes and type scale mirror wstech.tech's ProfileCard / NavCard.
import { frame } from './frame.ts';
import { textPath, measure } from './text.ts';
import { PROFILE, type LinkCard } from './data.ts';
import type { Theme } from './theme.ts';

const PAD = 24;

/** Outline pill with centered text; returns markup and its width. */
function pill(text: string, x: number, y: number, h: number, size: number, padX: number, t: Theme) {
  const w = measure(text, size, 500) + padX * 2;
  const label = textPath(text, { x: x + padX, y: y + h / 2 + size * 0.36, size, weight: 500, fill: t.secondary });
  return {
    svg: `<rect x="${x}" y="${y}" width="${w.toFixed(1)}" height="${h}" rx="${h / 2}" fill="none" stroke="${t.chipBorder}"/>${label.svg}`,
    width: w,
  };
}

export function renderProfile(t: Theme): string {
  const W = 840, H = 190;
  const parts: string[] = [];
  parts.push(pill(PROFILE.pill, PAD, PAD, 24, 11, 10, t).svg);
  parts.push(textPath(PROFILE.name, { x: PAD, y: 88, size: 30, weight: 700, fill: t.primary }).svg);
  parts.push(textPath(PROFILE.tagline, { x: PAD, y: 114, size: 14, weight: 400, fill: t.secondary }).svg);
  let x = PAD;
  for (const chip of PROFILE.chips) {
    const c = pill(chip, x, H - PAD - 22, 22, 10, 9, t);
    parts.push(c.svg);
    x += c.width + 6;
  }
  const title = `${PROFILE.name}, ${PROFILE.pill}. ${PROFILE.tagline}. ${PROFILE.chips.join(', ')}.`;
  return frame({ width: W, height: H, theme: t, delayMs: 0, title, body: parts.join('') });
}

/** Lucide ArrowUpRight, 16px, top-right corner. */
function arrow(W: number, t: Theme): string {
  const s = 16 / 24;
  return `<g transform="translate(${W - 20 - 16} 20) scale(${s.toFixed(4)})" fill="none" stroke="${t.muted}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></g>`;
}

export function renderLink(l: LinkCard, t: Theme): string {
  const W = 272, H = 150, P = 20;
  const body = [
    arrow(W, t),
    textPath(l.label.toUpperCase(), { x: P, y: 80, size: 10, weight: 600, fill: t.muted, letterSpacing: 0.15 }).svg,
    textPath(l.title, { x: P, y: 104, size: 18, weight: 600, fill: t.primary }).svg,
    textPath(l.sub, { x: P, y: H - P - 4, size: 13, weight: 400, fill: t.secondary }).svg,
  ].join('');
  return frame({ width: W, height: H, theme: t, delayMs: l.delayMs, title: `${l.label}: ${l.title} (${l.sub})`, body });
}
