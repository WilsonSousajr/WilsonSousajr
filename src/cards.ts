// Card layouts. Sizes and type scale mirror wstech.tech's ProfileCard / NavCard.
import { frame } from './frame.ts';
import { textPath, measure } from './text.ts';
import { PROFILE, STATS_META, type LinkCard } from './data.ts';
import type { Stats } from './stats.ts';
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

export type Variant = 'desktop' | 'mobile';

/**
 * Desktop cards are drawn for an ~830px README column; mobile cards for a phone
 * column (~342px), so they render near 1:1 instead of shrinking to ~0.41.
 * Canvas = card + 2×INSET: desktop 840 / 280, mobile 360 / 120 (always 3 links = 1 wide).
 */
export function renderProfile(t: Theme, v: Variant = 'desktop'): string {
  const title = `${PROFILE.name}, ${PROFILE.pill}. ${PROFILE.tagline}. ${PROFILE.chips.join(', ')}.`;
  const parts: string[] = [];
  if (v === 'desktop') {
    const W = 832, H = 190;
    parts.push(pill(PROFILE.pill, PAD, PAD, 24, 11, 10, t).svg);
    parts.push(textPath(PROFILE.name, { x: PAD, y: 88, size: 30, weight: 700, fill: t.primary }).svg);
    parts.push(textPath(PROFILE.tagline, { x: PAD, y: 114, size: 14, weight: 400, fill: t.secondary }).svg);
    let x = PAD;
    for (const chip of PROFILE.chips) {
      const c = pill(chip, x, H - PAD - 22, 22, 10, 9, t);
      parts.push(c.svg);
      x += c.width + 6;
    }
    return frame({ width: W, height: H, theme: t, delayMs: 0, title, body: parts.join('') });
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
    const w = measure(chip, 10, 500) + 16;
    if (x + w > W - P) { x = P; y += 26; }
    const c = pill(chip, x, y, 20, 10, 8, t);
    parts.push(c.svg);
    x += c.width + 6;
  }
  return frame({ width: W, height: y + 20 + P, theme: t, delayMs: 0, title, body: parts.join('') });
}

/** Lucide ArrowUpRight in the top-right corner. */
function arrow(W: number, size: number, pad: number, t: Theme): string {
  const s = size / 24;
  return `<g transform="translate(${W - pad - size} ${pad}) scale(${s.toFixed(4)})" fill="none" stroke="${t.muted}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></g>`;
}

export function renderLink(l: LinkCard, t: Theme, v: Variant = 'desktop'): string {
  const title = `${l.label}: ${l.title} (${l.sub})`;
  if (v === 'desktop') {
    const W = 272, H = 150, P = 20;
    const body = [
      arrow(W, 16, 20, t),
      textPath(l.label.toUpperCase(), { x: P, y: 80, size: 10, weight: 600, fill: t.muted, letterSpacing: 0.15 }).svg,
      textPath(l.title, { x: P, y: 104, size: 18, weight: 600, fill: t.primary }).svg,
      textPath(l.sub, { x: P, y: H - P - 4, size: 13, weight: 400, fill: t.secondary }).svg,
    ].join('');
    return frame({ width: W, height: H, theme: t, delayMs: l.delayMs, title, body });
  }
  // Phone: label + title only; the sub line would be unreadably small.
  const W = 112, H = 96, P = 12;
  const body = [
    arrow(W, 14, P, t),
    textPath(l.label.toUpperCase(), { x: P, y: 62, size: 9, weight: 600, fill: t.muted, letterSpacing: 0.12 }).svg,
    textPath(l.title, { x: P, y: 82, size: 13, weight: 600, fill: t.primary }).svg,
  ].join('');
  return frame({ width: W, height: H, theme: t, delayMs: l.delayMs, title, body });
}

export function renderStats(s: Stats, t: Theme, v: Variant = 'desktop'): string {
  const figures = [s.contributions, s.longestStreak, s.repos].map((n) => n.toLocaleString('en-US'));
  const title = `GitHub activity over the last 12 months: ${figures
    .map((f, i) => `${f} ${STATS_META.captions[i]}`)
    .join(', ')}`;
  const m = v === 'mobile';
  const W = m ? 352 : 832, H = m ? 128 : 150, P = m ? 20 : PAD;
  const captions = m ? STATS_META.mobileCaptions : STATS_META.captions;
  const col = (W - P * 2) / 3;
  const parts = [
    textPath(STATS_META.label.toUpperCase(), { x: P, y: P + (m ? 9 : 10), size: m ? 9 : 10, weight: 600, fill: t.muted, letterSpacing: m ? 0.12 : 0.15 }).svg,
  ];
  figures.forEach((fig, i) => {
    const x = P + i * col;
    parts.push(textPath(fig, { x, y: m ? 80 : 92, size: m ? 24 : 28, weight: 700, fill: t.primary }).svg);
    parts.push(textPath(captions[i], { x, y: m ? 100 : 118, size: m ? 11 : 12, weight: 400, fill: t.secondary }).svg);
  });
  return frame({ width: W, height: H, theme: t, delayMs: STATS_META.delayMs, title, body: parts.join('') });
}
