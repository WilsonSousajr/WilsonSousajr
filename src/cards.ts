// Card layouts. Sizes and type scale mirror wstech.tech's ProfileCard / NavCard.
//
// The README shows every card at 100% of its column (link cards at 33.33%), so
// each variant is drawn for the column width it will fill, keeping text near 1:1:
//   desktop  viewport ≥ 768   column ~650–980   canvas 876 (links 292)
//   compact  561–767          column ~530–735   canvas 600 (links 200)
//   mobile   ≤ 560            column ~330–530   canvas 360 (links 120)
// Canvas = card + 2×INSET, and three link canvases always equal one wide canvas.
import { frame } from './frame.ts';
import { textPath, measure } from './text.ts';
import { PROFILE, STATS_META, type LinkCard } from './data.ts';
import type { Stats } from './stats.ts';
import type { Theme } from './theme.ts';

export type Variant = 'desktop' | 'compact' | 'mobile';
export const VARIANTS: readonly Variant[] = ['desktop', 'compact', 'mobile'];

/** Outline pill with centered text; returns markup and its width. */
function pill(text: string, x: number, y: number, h: number, size: number, padX: number, t: Theme) {
  const w = measure(text, size, 500) + padX * 2;
  const label = textPath(text, { x: x + padX, y: y + h / 2 + size * 0.36, size, weight: 500, fill: t.secondary });
  return {
    svg: `<rect x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${h}" rx="${h / 2}" fill="none" stroke="${t.chipBorder}"/>${label.svg}`,
    width: w,
  };
}

const chipWidth = (chip: string) => measure(chip, 10, 500) + 16;

export function renderProfile(t: Theme, v: Variant = 'desktop'): string {
  const title = `${PROFILE.name}, ${PROFILE.pill}. ${PROFILE.tagline}. ${PROFILE.chips.join(', ')}.`;
  const parts: string[] = [];
  const done = (W: number, H: number) => frame({ width: W, height: H, theme: t, delayMs: 0, title, body: parts.join('') });

  if (v === 'desktop') {
    // Wide and short: chips share the tagline's row, right-aligned.
    const W = 868, H = 124, P = 24;
    parts.push(pill(PROFILE.pill, P, 20, 22, 10, 9, t).svg);
    parts.push(textPath(PROFILE.name, { x: P, y: 78, size: 26, weight: 700, fill: t.primary }).svg);
    parts.push(textPath(PROFILE.tagline, { x: P, y: 101, size: 13, weight: 400, fill: t.secondary }).svg);
    const gap = 6;
    let x = W - P - PROFILE.chips.reduce((sum, c) => sum + chipWidth(c) + gap, -gap);
    for (const chip of PROFILE.chips) {
      parts.push(pill(chip, x, 84, 20, 10, 8, t).svg);
      x += chipWidth(chip) + gap;
    }
    return done(W, H);
  }

  if (v === 'compact') {
    const W = 592, H = 150, P = 20;
    parts.push(pill(PROFILE.pill, P, P, 22, 10, 9, t).svg);
    parts.push(textPath(PROFILE.name, { x: P, y: 76, size: 26, weight: 700, fill: t.primary }).svg);
    parts.push(textPath(PROFILE.tagline, { x: P, y: 98, size: 13, weight: 400, fill: t.secondary }).svg);
    let x = P;
    for (const chip of PROFILE.chips) {
      parts.push(pill(chip, x, H - P - 20, 20, 10, 8, t).svg);
      x += chipWidth(chip) + 6;
    }
    return done(W, H);
  }

  const W = 352, P = 20;
  parts.push(pill(PROFILE.pill, P, P, 22, 10, 9, t).svg);
  parts.push(textPath(PROFILE.name, { x: P, y: 80, size: 26, weight: 700, fill: t.primary }).svg);
  // The tagline splits at its "·" so each half fits the narrow card.
  PROFILE.tagline.split(' · ').forEach((line, i) => {
    parts.push(textPath(line, { x: P, y: 104 + i * 18, size: 13, weight: 400, fill: t.secondary }).svg);
  });
  let x = P, y = 140;
  for (const chip of PROFILE.chips) {
    if (x + chipWidth(chip) > W - P) { x = P; y += 26; }
    parts.push(pill(chip, x, y, 20, 10, 8, t).svg);
    x += chipWidth(chip) + 6;
  }
  return done(W, y + 20 + P);
}

/** Lucide ArrowUpRight in the top-right corner. */
function arrow(W: number, size: number, pad: number, t: Theme): string {
  const s = size / 24;
  return `<g transform="translate(${W - pad - size} ${pad}) scale(${s.toFixed(4)})" fill="none" stroke="${t.muted}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></g>`;
}

export function renderLink(l: LinkCard, t: Theme, v: Variant = 'desktop'): string {
  const title = `${l.label}: ${l.title} (${l.sub})`;
  const label = (P: number, y: number) =>
    textPath(l.label.toUpperCase(), { x: P, y, size: 9, weight: 600, fill: t.muted, letterSpacing: 0.12 }).svg;
  let W: number, H: number, body: string;
  if (v === 'mobile') {
    // Phone: label + title only; the sub line would be unreadably small.
    W = 112; H = 96;
    body = arrow(W, 14, 12, t) + label(12, 62) + textPath(l.title, { x: 12, y: 82, size: 13, weight: 600, fill: t.primary }).svg;
  } else {
    const P = v === 'desktop' ? 18 : 16;
    W = v === 'desktop' ? 284 : 192;
    H = v === 'desktop' ? 106 : 112;
    body = [
      arrow(W, 14, P, t),
      label(P, H - P - 36),
      textPath(l.title, { x: P, y: H - P - 16, size: 15, weight: 600, fill: t.primary }).svg,
      textPath(l.sub, { x: P, y: H - P, size: 11, weight: 400, fill: t.secondary }).svg,
    ].join('');
  }
  return frame({ width: W, height: H, theme: t, delayMs: l.delayMs, title, body });
}

export function renderStats(s: Stats, t: Theme, v: Variant = 'desktop'): string {
  const figures = [s.contributions, s.longestStreak, s.repos].map((n) => n.toLocaleString('en-US'));
  const title = `GitHub activity over the last 12 months: ${figures
    .map((f, i) => `${f} ${STATS_META.captions[i]}`)
    .join(', ')}`;
  const L = {
    desktop: { W: 868, H: 104, P: 24, fig: 66, cap: 84 },
    compact: { W: 592, H: 116, P: 20, fig: 72, cap: 92 },
    mobile: { W: 352, H: 128, P: 20, fig: 80, cap: 100 },
  }[v];
  const captions = v === 'mobile' ? STATS_META.mobileCaptions : STATS_META.captions;
  const col = (L.W - L.P * 2) / 3;
  const parts = [
    textPath(STATS_META.label.toUpperCase(), { x: L.P, y: L.P + 9, size: 9, weight: 600, fill: t.muted, letterSpacing: 0.12 }).svg,
  ];
  figures.forEach((fig, i) => {
    const x = L.P + i * col;
    parts.push(textPath(fig, { x, y: L.fig, size: 24, weight: 700, fill: t.primary }).svg);
    parts.push(textPath(captions[i], { x, y: L.cap, size: 11, weight: 400, fill: t.secondary }).svg);
  });
  return frame({ width: L.W, height: L.H, theme: t, delayMs: STATS_META.delayMs, title, body: parts.join('') });
}
