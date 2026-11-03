// Every word and link on the cards lives here. Edit this, then `npm run build`.
export const PROFILE = {
  pill: 'Full Stack Engineer',
  name: 'Wilson Sousa',
  tagline: 'Distributed systems & high-performance APIs · Brasília',
  chips: ['Python', 'FastAPI', 'Django', 'PostgreSQL', 'Go', 'TypeScript'],
  href: 'https://wstech.tech',
};

export interface LinkCard {
  id: 'website' | 'blog' | 'linkedin';
  label: string;
  title: string;
  sub: string;
  href: string;
  delayMs: number;
}

export const LINKS: LinkCard[] = [
  { id: 'website', label: 'Website', title: 'wstech.tech', sub: 'Projects & about', href: 'https://wstech.tech', delayMs: 120 },
  { id: 'blog', label: 'Blog', title: 'Read articles', sub: 'Engineering notes', href: 'https://blog.wstech.tech', delayMs: 240 },
  { id: 'linkedin', label: 'LinkedIn', title: 'Connect', sub: 'Experience & CV', href: 'https://www.linkedin.com/in/wilsonsousajr', delayMs: 360 },
];

export const STATS_META = {
  label: 'GitHub activity · last 12 months',
  captions: ['contributions', 'day longest streak', 'repositories contributed to'] as [string, string, string],
  /** Phone stat card: a third of a ~342px column. */
  mobileCaptions: ['contributions', 'day streak', 'repos'] as [string, string, string],
  href: 'https://github.com/WilsonSousajr',
  delayMs: 480,
};
