# Profile README Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the stale GitHub profile README with a monochrome bento of flat smoky SVG cards (profile, three links, a daily-refreshed stat card) that sends visitors to wstech.tech and the blog, and relabel the site's GitHub card to "last 12 months".

**Architecture:** A small TypeScript generator in the profile repo turns one data file into dark and light SVGs. Text is converted to vector outlines with opentype.js from committed Outfit TTFs, and CSS animations are inlined in each SVG. The README is hand-written markdown that places each card in a `<picture>` inside an `<a>`. A daily GitHub Action fetches contribution stats via GraphQL and regenerates only the stat card.

**Tech Stack:** Node ≥ 24 running `.ts` directly (native type stripping, no build step), `opentype.js`, `node:test`, GitHub Actions, GitHub GraphQL API. Playwright is used for the preview only.

**Spec:** `docs/superpowers/specs/2026-11-03-profile-readme-design.md`. Read it before starting.

## Global Constraints

- Repo `WilsonSousajr/WilsonSousajr`, branch `main`, at `/Users/will/src/WilsonSousajr`. **Never push** without Wilson's explicit go-ahead; pushing updates the public profile.
- Links: profile → `https://wstech.tech`, website → `https://wstech.tech`, blog → `https://blog.wstech.tech`, LinkedIn → `https://www.linkedin.com/in/wilsonsousajr`, stat card → `https://github.com/WilsonSousajr`, email → `mailto:wstechnology.br@gmail.com`.
- Copy (exact):
  - Profile pill: "Full Stack Engineer". Name: "Wilson Sousa". Tagline: "Distributed systems & high-performance APIs · Brasília". Chips: Python, FastAPI, Django, PostgreSQL, Go, TypeScript.
  - Link cards (label / title / sub): WEBSITE / wstech.tech / Projects & about · BLOG / Read articles / Engineering notes · LINKEDIN / Connect / Experience & CV.
  - Stat card label: "GITHUB ACTIVITY · LAST 12 MONTHS". Figure captions: "contributions", "day longest streak", "repositories contributed to". Numbers use en-US grouping (`2,625`).
- No "Senior", no Twitter, no shields.io badges, no third-party stats services, no heatmap, no "most used language".
- Every card is emitted as `assets/<name>-dark.svg` and `assets/<name>-light.svg`. Names: `profile`, `link-website`, `link-blog`, `link-linkedin`, `stats`.
- No `<text>` elements in any SVG: all glyphs are `<path>`. No `<image>`, no external references, no `<script>`, no `<foreignObject>`. Each SVG is under 50 KB.
- Theme tokens (dark / light):
  - card gradient `#262626→#141414` / `#f5f5f5→#e7e7e7`
  - rim `rgba(255,255,255,.12)` / `rgba(0,0,0,.10)`
  - top highlight `rgba(255,255,255,.14)` / `rgba(255,255,255,.9)`
  - primary text `#ececec` / `#111111`, secondary `#a0a0a0` / `#444444`, muted label `#8f8f8f` / `#555555`
  - chip border `rgba(255,255,255,.18)` / `rgba(0,0,0,.15)`
  - sweep `rgba(255,255,255,.5)` / `rgba(0,0,0,.22)`
- Card radius 20 (canvas units). Canvas sizes: wide cards 840 wide (`profile` 840×190, `stats` 840×150), link cards 272×150.
- Animations are pure CSS in the SVG's `<style>`:
  - `fade-up`: opacity 0→1, translateY 8→0, 600ms ease-out, `animation-fill-mode: both`. Per-card delays: profile 0ms, website 120ms, blog 240ms, linkedin 360ms, stats 480ms.
  - `sweep`: a rim stroke dash travelling around the card via `stroke-dashoffset`, 9s linear infinite.
  - `@media (prefers-reduced-motion: reduce)` sets `animation: none` on both.
  - Keyframes only define the from-state, so with animations disabled the card renders complete.

## Review Focus

1. **The GraphQL fetch fails or returns partial data** (rate limit, token scope, API change). Expected: the generator exits non-zero, writes nothing, and the old stat SVGs stay. Task 4 test `fetch failure leaves existing files untouched`.
2. **The streak spans the window edge or today has 0 contributions so far.** Expected: the longest streak counts consecutive days with count > 0 anywhere in the window, and today being 0 doesn't zero it. Task 4 tests in `longestStreak`.
3. **Light theme legibility.** Expected: every card readable on GitHub light (#ffffff) and dark (#0d1117) with the tokens above. Task 6 preview screenshots both themes.
4. **Narrow (mobile) README width.** Expected: the link cards shrink proportionally (`width="32%"`) and their text stays legible at a 390px viewport. Task 6 mobile screenshot.
5. **Big numbers overflow the stat card** (e.g. `12,345` contributions). Expected: the figures fit their third of the card. Task 4 test `renders five-digit figures within bounds`.

---

## File Structure

```
package.json                  — type: module; scripts build, build:stats, test, preview; dep opentype.js
fonts/Outfit-{Regular,Medium,SemiBold,Bold}.ttf + fonts/OFL.txt
src/theme.ts                  — Theme type + DARK/LIGHT tokens
src/text.ts                   — text → outlined path (opentype.js)
src/frame.ts                  — card frame: background, rim, highlight, sweep, animation CSS, <svg> wrapper
src/cards.ts                  — renderProfile / renderLink / renderStats (layout only)
src/data.ts                   — all copy and links
src/stats.ts                  — GraphQL fetch + longestStreak (pure)
src/build.ts                  — CLI: writes assets/*.svg (all, or --stats only)
test/*.test.ts                — node:test
assets/*.svg                  — generated, committed
README.md                     — hand-written markdown
.github/workflows/stats.yml   — daily stat refresh
scripts/preview.ts            — renders README via GitHub's markdown API, screenshots (dev only)
```

### Task 1: Project scaffold, fonts and outlined text

**Files:**
- Create: `package.json`, `.gitignore` (`node_modules/`, `preview/`), `fonts/*`, `src/text.ts`, `test/text.test.ts`

**Interfaces:**
- Produces: `type Weight = 400 | 500 | 600 | 700`; `textPath(text: string, o: { x: number; y: number; size: number; weight: Weight; fill: string; letterSpacing?: number /* em */; anchor?: 'start' | 'end' }): { svg: string; width: number }`. `y` is the baseline. `svg` is a single `<path d=… fill=…/>`. `measure(text, size, weight, letterSpacing?) → number`.

- [ ] **Step 1:** Download the static TTFs from `https://raw.githubusercontent.com/Outfitio/Outfit-Fonts/main/fonts/ttf/Outfit-{Regular,Medium,SemiBold,Bold}.ttf` and `OFL.txt` from the same repo root into `fonts/`. Create `package.json` (`"type": "module"`, `"engines": {"node": ">=24"}`, scripts `"test": "node --test test/"`, `"build": "node src/build.ts"`, `"build:stats": "node src/build.ts --stats"`, `"preview": "node scripts/preview.ts"`). Install `opentype.js` and `@types/opentype.js`.
- [ ] **Step 2: Write failing tests** in `test/text.test.ts`:
  - `textPath('Wilson', {x:0,y:40,size:32,weight:700,fill:'#fff'}).svg` matches `/^<path d="M[^"]+" fill="#fff"\/>$/` and contains no `<text`.
  - `measure('Wilson',32,700) > measure('Wilson',16,700)`.
  - letter spacing: `measure('ABC',10,600,0.15) ≈ measure('ABC',10,600) + 3*0.15*10` (±0.01). Spacing is applied after every glyph, matching CSS.
  - `anchor:'end'` shifts the path so its right edge sits at `x`: `textPath('A',{x:100,…,anchor:'end'}).width` equals `measure`, and the path's first move-to x is < 100.
- [ ] **Step 3:** Run `npm test`. Expected: FAIL (module missing).
- [ ] **Step 4:** Implement `src/text.ts`. Load the fonts once with `opentype.parse(readFileSync(...))`, lay out glyph by glyph with `font.charToGlyph` + `getPath(x, y, size)` (kerning via `font.getKerningValue`), and join the path data. Use `toPathData(2)` to keep files small.
- [ ] **Step 5:** Run `npm test`. Expected: PASS.
- [ ] **Step 6:** Commit `feat: scaffold card generator with outlined Outfit text`.

### Task 2: Card frame, themes and animation

**Files:**
- Create: `src/theme.ts`, `src/frame.ts`, `test/frame.test.ts`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: `interface Theme { name: 'dark'|'light'; cardFrom; cardTo; rim; highlight; primary; secondary; muted; chipBorder; sweep: string }`, `DARK`, `LIGHT`, `THEMES = [DARK, LIGHT]`; `frame(o: { width: number; height: number; theme: Theme; delayMs: number; title: string; body: string }): string`. Returns a full standalone `<svg xmlns=… viewBox="0 0 W H" width=W height=H role="img">` with `<title>`, the `<style>` (keyframes plus reduced-motion), a `<g class="card">` holding the gradient rect (radius 20), 1px rim, top highlight line, sweep rect, then `body`.

- [ ] **Step 1: Write failing tests** in `test/frame.test.ts`, for both themes:
  - Output starts with `<svg` and contains `viewBox="0 0 272 150"` for a 272×150 frame.
  - It contains `@media (prefers-reduced-motion: reduce)` and `animation: none`.
  - It contains `animation-delay: 240ms` when `delayMs: 240`.
  - The `@keyframes fade-up` block contains `from` and no `to` with opacity < 1 (the resting state is complete).
  - It contains none of `<text`, `<image`, `<script`, `foreignObject`, `href=`.
  - The `<title>` text is XML-escaped (`'A & B'` → `A &amp; B`).
- [ ] **Step 2:** Run `npm test`. Expected: the new tests fail.
- [ ] **Step 3:** Implement `theme.ts` and `frame.ts` using the Global Constraints tokens and timings. Sweep: a rect inset 0.5 with `rx` 20, `stroke` = theme.sweep, `fill:none`, `pathLength="100"`, `stroke-dasharray: 12 88`, and keyframes moving `stroke-dashoffset` 0→-100 over 9s linear infinite. Ids inside each SVG are prefixed with the theme name, so a gradient id never collides even if GitHub inlines things.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit `feat: add flat smoky card frame with themes and subtle animation`.

### Task 3: Profile and link cards, data, build CLI

**Files:**
- Create: `src/data.ts`, `src/cards.ts`, `src/build.ts`, `test/cards.test.ts`, `assets/` (generated)

**Interfaces:**
- Consumes: `textPath`, `measure` (Task 1); `frame`, `THEMES`, `Theme` (Task 2).
- Produces:
  - `data.ts`: `PROFILE = { pill, name, tagline, chips: string[] }`; `LINKS: { id: 'website'|'blog'|'linkedin'; label; title; sub; href; delayMs }[]`; `STATS_META = { label, captions: [string,string,string], delayMs: 480 }`.
  - `cards.ts`: `renderProfile(t: Theme): string`; `renderLink(l: (typeof LINKS)[number], t: Theme): string`; `renderStats(s: Stats, t: Theme): string`, where `Stats = { contributions: number; longestStreak: number; repos: number }`. `renderStats` is written in Task 4.
  - `build.ts`: `writeStatic(outDir: string): string[]` (returns written paths); `writeStats(outDir: string, s: Stats): string[]`; CLI `node src/build.ts` writes static cards, and `--stats` runs Task 4's fetch, then `writeStats`.

- [ ] **Step 1: Write failing tests** in `test/cards.test.ts`, for both themes:
  - `renderProfile(t)` has `viewBox="0 0 840 190"`, `<title>` contains "Wilson Sousa" and "Full Stack Engineer", and is under 50_000 bytes.
  - `renderLink(LINKS[1], t)` has `viewBox="0 0 272 150"`, its title contains "Blog", and it contains `animation-delay: 240ms`.
  - Each link card contains the ↗ arrow as a stroked path (`stroke-linecap="round"`), drawn as Lucide `ArrowUpRight` (`M7 7h10v10`, `M7 17 17 7`) scaled to 16px at the top-right, inset 16.
  - `writeStatic(tmp)` returns exactly 8 paths (4 cards × 2 themes) named per the Global Constraints.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement `data.ts` with the exact copy from Global Constraints. Implement `renderProfile` to mirror the site's ProfileCard: padding 24, pill (rounded-full outline, 11px Medium) at top, name 30px Bold, tagline 14px Regular in `secondary`, chips row (10px Medium, outline pills, gap 6) at the bottom. Implement `renderLink` to mirror NavCard: label 10px SemiBold uppercase, letterSpacing 0.15 in `muted`, title 18px SemiBold `primary`, sub 13px Regular `secondary`, bottom-aligned with padding 20. Implement `writeStatic`.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Run `npm run build` and open `assets/profile-dark.svg` and `assets/link-blog-light.svg` in a browser. Check that the text is placed inside the card, nothing is clipped, and the animation plays once.
- [ ] **Step 6:** Commit `feat: generate profile and link cards` (including `assets/`).

### Task 4: Stats fetch and stat card

**Files:**
- Create: `src/stats.ts`, `test/stats.test.ts`
- Modify: `src/cards.ts` (add `renderStats`), `src/build.ts` (`--stats` path)

**Interfaces:**
- Consumes: `frame`, `textPath`, `STATS_META`, `Stats`.
- Produces: `longestStreak(days: { date: string; count: number }[]): number`; `fetchStats(o: { token: string; login: string; now: Date; fetch?: typeof fetch }): Promise<Stats>`. It throws on a non-200 response, GraphQL `errors`, or a missing `contributionCalendar`.

- [ ] **Step 1: Write failing tests** in `test/stats.test.ts`:
  - `longestStreak([])` → 0. `[1,1,0,1,1,1,0]` (counts, consecutive dates) → 3. A run at the very end ending with today = 0 → the run before today still counts. Unsorted input is sorted by date first.
  - `fetchStats` with a stub `fetch` returning a canned GraphQL payload (2 weeks of days, `totalContributions: 2625`, `totalRepositoriesWithContributedCommits: 14`) → `{ contributions: 2625, longestStreak: <expected>, repos: 14 }`. The request body's variables have `from` = now − 365 days, `to` = now (ISO), and `login: 'WilsonSousajr'`.
  - `fetchStats` rejects when the stub returns `{ errors: [...] }`, and when it returns a 502.
  - `fetch failure leaves existing files untouched`: write sentinel `assets/stats-*.svg` in a temp dir, run the `--stats` code path with a failing fetch, then assert the file contents are unchanged and the process exit code is non-zero (call the exported `main(argv, deps)` rather than spawning).
  - `renders five-digit figures within bounds`: `renderStats({contributions:12345,longestStreak:365,repos:120}, DARK)` has `viewBox="0 0 840 150"`. Measure each figure with `measure` and assert it is narrower than one third of the card minus padding (840−48)/3. Its title contains "12,345 contributions".
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement `stats.ts`. The query:
  ```graphql
  query($login:String!,$from:DateTime!,$to:DateTime!){user(login:$login){contributionsCollection(from:$from,to:$to){contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}} totalRepositoriesWithContributedCommits}}}
  ```
  POST it to `https://api.github.com/graphql` with `Authorization: bearer <token>`. Implement `renderStats`: label at top-left (10px SemiBold uppercase, 0.15 spacing, `muted`), then three equal columns, each with a figure (28px Bold, `primary`, `toLocaleString('en-US')`) over a caption (12px Regular, `secondary`). Use `delayMs` 480. Wire `--stats` in `build.ts` to read `GITHUB_TOKEN` (fall back to `gh auth token` locally), then `fetchStats`, then `writeStats`. Validate everything before writing either file, so both files are written together or neither is.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Run `npm run build:stats` locally. Expected: writes `assets/stats-{dark,light}.svg`. Compare the contributions figure with the site's GitHub card total on wstech.tech: they should match within today's activity. If GitHub's figure is clearly lower, record it as the private-contributions gap (the spec's PAT follow-up). Don't change the code to hide it.
- [ ] **Step 6:** Commit `feat: add stat card with GitHub contribution stats`.

### Task 5: README and daily Action

**Files:**
- Create: `README.md` (replace), `.github/workflows/stats.yml`

**Interfaces:**
- Consumes: the asset filenames from Task 3 and Task 4; `npm run build:stats`.

- [ ] **Step 1:** Write `README.md`. Each card is `<a href="LINK"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/NAME-dark.svg"><img src="assets/NAME-light.svg" alt="ALT" width="W"></picture></a>`. The wide cards use `width="100%"`. The three link cards sit inside one `<p align="center">` with `width="32%"`, separated by single spaces. The alt text spells out each card's full copy, e.g. profile: "Wilson Sousa, Full Stack Engineer. Distributed systems & high-performance APIs, Brasília. Python, FastAPI, Django, PostgreSQL, Go, TypeScript." Stat alt: "GitHub activity over the last 12 months". Under the grid goes one markdown line: `<p align="center"><a href="mailto:wstechnology.br@gmail.com">wstechnology.br@gmail.com</a></p>`. Nothing else.
- [ ] **Step 2:** Write `.github/workflows/stats.yml`:
  - Triggers: `schedule: cron '17 6 * * *'`, `workflow_dispatch`, and `push` to `main` with paths `src/**`, `package*.json`, `fonts/**`.
  - `permissions: contents: write`.
  - Steps: checkout, setup-node 24 with npm cache, `npm ci`, `npm run build`, `npm run build:stats` with `GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}`.
  - Then commit only if `git status --porcelain assets` is non-empty, as `github-actions[bot]`, with message `chore: refresh stat card`.
  - The `push` trigger plus the bot's own commit doesn't loop, because commits made with `GITHUB_TOKEN` don't trigger workflows.
- [ ] **Step 3:** Validate the workflow syntax with `npx --yes action-validator .github/workflows/stats.yml` (or `actionlint` if installed). Expected: no errors.
- [ ] **Step 4:** Commit `feat: new bento profile README with daily stat refresh`.

### Task 6: Preview before push

**Files:**
- Create: `scripts/preview.ts` (dev only; `preview/` output is gitignored)

- [ ] **Step 1:** Implement `scripts/preview.ts`:
  - Render `README.md` through GitHub's real sanitizer with `gh api markdown -f mode=gfm -f context=WilsonSousajr/WilsonSousajr -f text=@README.md`.
  - Wrap the result in an HTML page with `github-markdown-css@5.8.1` from cdnjs/jsdelivr, an 830px `.markdown-body` column, and `<base href>` pointing at the local repo, so `assets/` resolve.
  - With Playwright, screenshot four shots to `preview/`: dark (#0d1117, `colorScheme: 'dark'`) and light, at 1280px and 390px wide. Wait 2s so the animations settle.
- [ ] **Step 2:** Run `npm run preview` and look at all four screenshots. Expected:
  - The grid looks like the approved mockup (full bento, flat smoky).
  - Both themes are legible, the link cards stay readable at 390px, and the emitted HTML has no broken images.
  - The sanitized HTML still contains the `<picture>` and `<source>` tags.
- [ ] **Step 3:** Show the screenshots to Wilson. **Stop here.** Push to `main` only after his explicit go-ahead. After the push, run the Action once with `gh workflow run stats.yml` and confirm it ends green.

### Task 7: Relabel the site's GitHub card (wstech repo)

**Files:**
- Modify: `/Users/will/src/wstech/src/components/home/GitHubHeatmap.tsx:38,102,156`, `/Users/will/src/wstech/src/i18n/en.json:31-33`, `/Users/will/src/wstech/src/i18n/pt-br.json:31-33`

- [ ] **Step 1:** Replace `home.activitiesIn` with `home.activitiesLast12` — en `"{{count}} activities in the last 12 months"`, pt-br `"{{count}} atividades nos últimos 12 meses"`. Add `home.githubPeriod` — en `"Last 12 months"`, pt-br `"Últimos 12 meses"`.
- [ ] **Step 2:** In `GitHubHeatmap.tsx`, remove `year`. The header becomes `{t('home.github')} • {t('home.githubPeriod')}`, and the footer becomes `{t('home.activitiesLast12', { count: total.toLocaleString(i18n.language) })}`.
- [ ] **Step 3:** Run `npm run build && npm test` in `/Users/will/src/wstech`. Expected: build OK and 27 tests passing. Also `grep -rn activitiesIn src` should return nothing.
- [ ] **Step 4:** Commit in `wstech`: `fix(github): label the activity card as the last 12 months`. Push only on Wilson's go-ahead.
- [ ] **Step 5:** Delete this plan file once all tasks are done.
