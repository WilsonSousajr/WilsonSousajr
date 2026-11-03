// Dev only: render README.md through GitHub's own markdown API (real sanitizer),
// then screenshot it dark/light at desktop and phone widths into preview/.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = `${root}preview/`;
mkdirSync(out, { recursive: true });

const html = execFileSync(
  'gh',
  ['api', 'markdown', '-f', 'mode=gfm', '-f', 'context=WilsonSousajr/WilsonSousajr', '-F', `text=@${root}README.md`],
  { encoding: 'utf8' },
);
writeFileSync(`${out}rendered.html`, html);

const page = (scheme: 'dark' | 'light') => `<!doctype html><html><head><meta charset="utf-8">
<base href="${pathToFileURL(root).href}">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5.8.1/github-markdown-${scheme}.css">
<style>body{margin:0;background:${scheme === 'dark' ? '#0d1117' : '#ffffff'}}
.markdown-body{box-sizing:border-box;max-width:830px;margin:0 auto;padding:24px 16px}</style>
</head><body><article class="markdown-body">${html}</article></body></html>`;

const browser = await chromium.launch({ channel: 'chrome' });
const problems: string[] = [];
for (const scheme of ['dark', 'light'] as const) {
  const file = `${out}page-${scheme}.html`;
  writeFileSync(file, page(scheme));
  for (const width of [1280, 700, 390]) {
    const p = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: scheme, deviceScaleFactor: 2 });
    await p.goto(pathToFileURL(file).href, { waitUntil: 'networkidle' });
    await p.waitForTimeout(2000);
    const broken = await p.$$eval('img', (imgs) =>
      imgs.filter((i) => !(i as HTMLImageElement).complete || (i as HTMLImageElement).naturalWidth === 0).map((i) => i.getAttribute('src')),
    );
    if (broken.length) problems.push(`${scheme}@${width}: broken ${broken.join(', ')}`);
    const shot = `${out}${scheme}-${width}.png`;
    await p.screenshot({ path: shot, fullPage: true });
    console.log('shot', shot);
    await p.close();
  }
}
await browser.close();

const pictures = (html.match(/<picture>/g) ?? []).length;
const sources = (html.match(/<source /g) ?? []).length;
console.log(`sanitized HTML keeps ${pictures} <picture> and ${sources} <source>`);
if (problems.length || pictures !== 5 || sources !== 15) {
  console.error(problems.join('\n') || 'picture/source tags were stripped');
  process.exitCode = 1;
}
