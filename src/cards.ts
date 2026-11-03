// Card layouts. Sizes and type scale mirror wstech.tech's ProfileCard / NavCard.
//
// Cards are fluid (see frame.ts): they fill the README column (link cards a
// third of it) while text stays at its real pixel size. Two layouts, picked by
// the README's <picture> media queries:
//   desktop  viewport > 560   column ≥ ~530
//   mobile   viewport ≤ 560   column ~330–530
// Text never scales, so tests check it fits the narrowest column of each.
import { frame, right, at, INSET } from './frame.ts';
import { textPath, measure } from './text.ts';
import { PROFILE, STATS_META, type LinkCard } from './data.ts';
import type { Stats } from './stats.ts';
import type { Theme } from './theme.ts';

export type Variant = 'desktop' | 'mobile';
export const VARIANTS: readonly Variant[] = ['desktop', 'mobile'];

export const LAYOUT = {
  desktop: { linkPad: 16, linkTitle: 15 },
  mobile: { linkPad: 12, linkTitle: 13 },
} as const;

/** Card content starts here (px from the image edge). */
const X = INSET + 20;

/** Outline pill with centered text; returns markup and its width. */
function pill(text: string, x: number, y: number, h: number, size: number, padX: number, t: Theme) {
  const w = measure(text, size, 500) + padX * 2;
  const label = textPath(text, { x: x + padX, y: y + h / 2 + size * 0.36, size, weight: 500, fill: t.secondary });
  return {
    svg: `<rect x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${h}" rx="${h / 2}" fill="none" stroke="${t.chipBorder}"/>${label.svg}`,
    width: w,
  };
}

export function renderProfile(t: Theme, v: Variant = 'desktop'): string {
  const title = `${PROFILE.name}, ${PROFILE.pill}. ${PROFILE.tagline}. ${PROFILE.chips.join(', ')}.`;
  const parts: string[] = [];
  parts.push(pill(PROFILE.pill, X, 20, 22, 10, 9, t).svg);
  parts.push(textPath(PROFILE.name, { x: X, y: 76, size: 26, weight: 700, fill: t.primary }).svg);

  let chipsY: number;
  if (v === 'desktop') {
    parts.push(textPath(PROFILE.tagline, { x: X, y: 98, size: 13, weight: 400, fill: t.secondary }).svg);
    chipsY = 110;
  } else {
    // The tagline splits at its "·" so each half fits a phone column.
    PROFILE.tagline.split(' · ').forEach((line, i) => {
      parts.push(textPath(line, { x: X, y: 98 + i * 18, size: 13, weight: 400, fill: t.secondary }).svg);
    });
    chipsY = 128;
  }
  // Chips wrap at the narrowest column the layout serves (530 desktop, 330 mobile).
  const maxX = (v === 'desktop' ? 530 : 330) - X;
  let x = X, y = chipsY;
  for (const chip of PROFILE.chips) {
    const w = measure(chip, 10, 500) + 16;
    if (x + w > maxX) { x = X; y += 26; }
    parts.push(pill(chip, x, y, 20, 10, 8, t).svg);
    x += w + 6;
  }
  return frame({ height: y + 20 + 20, theme: t, delayMs: 0, title, body: parts.join('') });
}

/** Lucide ArrowUpRight, pinned to the card's top-right corner. */
function arrow(size: number, pad: number, t: Theme): string {
  const s = size / 24;
  return right(
    `<g transform="translate(${-(INSET + pad + size)} ${pad}) scale(${s.toFixed(4)})" fill="none" stroke="${t.muted}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></g>`,
  );
}

export function renderLink(l: LinkCard, t: Theme, v: Variant = 'desktop'): string {
  const title = `${l.label}: ${l.title} (${l.sub})`;
  const { linkPad: P, linkTitle } = LAYOUT[v];
  const x = INSET + P;
  const label = (y: number) =>
    textPath(l.label.toUpperCase(), { x, y, size: 9, weight: 600, fill: t.muted, letterSpacing: 0.12 }).svg;
  let H: number, body: string;
  if (v === 'mobile') {
    // Phone: label + title only; a sub line would not fit a third of the column.
    H = 88;
    body = arrow(14, P, t) + label(H - P - 22) + textPath(l.title, { x, y: H - P - 2, size: linkTitle, weight: 600, fill: t.primary }).svg;
  } else {
    H = 104;
    body = [
      arrow(14, P, t),
      label(H - P - 36),
      textPath(l.title, { x, y: H - P - 16, size: linkTitle, weight: 600, fill: t.primary }).svg,
      textPath(l.sub, { x, y: H - P, size: 11, weight: 400, fill: t.secondary }).svg,
    ].join('');
  }
  return frame({ height: H, theme: t, delayMs: l.delayMs, title, body });
}

export function renderStats(s: Stats, t: Theme, v: Variant = 'desktop'): string {
  const figures = [s.contributions, s.longestStreak, s.repos].map((n) => n.toLocaleString('en-US'));
  const title = `GitHub activity over the last 12 months: ${figures
    .map((f, i) => `${f} ${STATS_META.captions[i]}`)
    .join(', ')}`;
  const captions = v === 'mobile' ? STATS_META.mobileCaptions : STATS_META.captions;
  const H = 108;
  const parts = [
    textPath(STATS_META.label.toUpperCase(), { x: X, y: 29, size: 9, weight: 600, fill: t.muted, letterSpacing: 0.12 }).svg,
  ];
  // Column i starts at i/3 of the width, offset by the card's left padding.
  const pcts = [0, 33.333, 66.667];
  figures.forEach((fig, i) => {
    const col =
      textPath(fig, { x: X, y: 70, size: 24, weight: 700, fill: t.primary }).svg +
      textPath(captions[i], { x: X, y: 88, size: 11, weight: 400, fill: t.secondary }).svg;
    parts.push(i === 0 ? col : at(pcts[i], col));
  });
  return frame({ height: H, theme: t, delayMs: STATS_META.delayMs, title, body: parts.join('') });
}
