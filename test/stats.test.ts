import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { longestStreak, fetchStats } from '../src/stats.ts';
import { renderStats } from '../src/cards.ts';
import { DARK } from '../src/theme.ts';
import { measure } from '../src/text.ts';
import { main } from '../src/build.ts';

const days = (counts: number[], start = '2026-01-01') =>
  counts.map((count, i) => {
    const d = new Date(`${start}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + i);
    return { date: d.toISOString().slice(0, 10), count };
  });

test('longestStreak: empty is 0', () => {
  assert.equal(longestStreak([]), 0);
});

test('longestStreak: longest run of consecutive non-zero days', () => {
  assert.equal(longestStreak(days([1, 1, 0, 1, 1, 1, 0])), 3);
});

test('longestStreak: today being 0 does not erase the run before it', () => {
  assert.equal(longestStreak(days([0, 2, 3, 4, 5, 0])), 4);
});

test('longestStreak: sorts by date first', () => {
  assert.equal(longestStreak(days([1, 1, 1, 0, 1]).reverse()), 3);
});

test('longestStreak: a gap in dates breaks the run', () => {
  const d = days([1, 1, 1, 1]);
  d.splice(2, 1); // missing date between index 1 and 2
  assert.equal(longestStreak(d), 2);
});

function payload(counts: number[]) {
  const all = days(counts).map((d) => ({ date: d.date, contributionCount: d.count }));
  const weeks = [{ contributionDays: all.slice(0, 7) }, { contributionDays: all.slice(7) }];
  return {
    data: { user: { contributionsCollection: {
      contributionCalendar: { totalContributions: 2625, weeks },
      totalRepositoriesWithContributedCommits: 14,
    } } },
  };
}

const stubFetch = (status: number, body: unknown, seen?: { body?: any; headers?: any }) =>
  (async (_url: string, init: RequestInit) => {
    if (seen) { seen.body = JSON.parse(String(init.body)); seen.headers = init.headers; }
    return new Response(JSON.stringify(body), { status });
  }) as unknown as typeof fetch;

test('fetchStats: maps the GraphQL calendar to Stats over the last 365 days', async () => {
  const seen: { body?: any; headers?: any } = {};
  const now = new Date('2026-11-03T12:00:00Z');
  const s = await fetchStats({
    token: 't0k', login: 'WilsonSousajr', now,
    fetch: stubFetch(200, payload([1, 1, 0, 2, 2, 2, 2, 0, 3, 0, 0, 1, 1, 1]), seen),
  });
  assert.deepEqual(s, { contributions: 2625, longestStreak: 4, repos: 14 });
  assert.equal(seen.body.variables.login, 'WilsonSousajr');
  assert.equal(seen.body.variables.to, now.toISOString());
  assert.equal(seen.body.variables.from, new Date(now.getTime() - 365 * 864e5).toISOString());
  assert.equal(seen.headers.Authorization, 'bearer t0k');
});

test('fetchStats: rejects on GraphQL errors', async () => {
  await assert.rejects(fetchStats({ token: 't', login: 'x', now: new Date(), fetch: stubFetch(200, { errors: [{ message: 'nope' }] }) }));
});

test('fetchStats: rejects on a 502', async () => {
  await assert.rejects(fetchStats({ token: 't', login: 'x', now: new Date(), fetch: stubFetch(502, {}) }));
});

test('fetch failure leaves existing files untouched', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'stats-'));
  for (const th of ['dark', 'light']) writeFileSync(join(dir, `stats-${th}.svg`), `sentinel-${th}`);
  const code = await main(['--stats'], { outDir: dir, token: 't', now: new Date(), fetch: stubFetch(502, {}) });
  assert.notEqual(code, 0);
  for (const th of ['dark', 'light']) assert.equal(readFileSync(join(dir, `stats-${th}.svg`), 'utf8'), `sentinel-${th}`);
});

test('--stats writes both stat cards on success', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'stats-'));
  const code = await main(['--stats'], { outDir: dir, token: 't', now: new Date('2026-11-03T00:00:00Z'), fetch: stubFetch(200, payload([1, 1])) });
  assert.equal(code, 0);
  assert.ok(readFileSync(join(dir, 'stats-light.svg'), 'utf8').includes('2,625 contributions'));
});

test('renders five-digit figures within bounds', () => {
  const svg = renderStats({ contributions: 12345, longestStreak: 365, repos: 120 }, DARK);
  assert.ok(svg.includes('viewBox="0 0 600 116"'));
  const col = (592 - 40) / 3;
  for (const fig of ['12,345', '365', '120']) assert.ok(measure(fig, 24, 700) < col - 16, fig);
  assert.ok(svg.match(/<title>(.*?)<\/title>/)![1].includes('12,345 contributions'));
});

test('fetchStats: rejects when the repositories figure is missing (no silent 0)', async () => {
  const body = payload([1, 1]);
  delete (body.data.user.contributionsCollection as any).totalRepositoriesWithContributedCommits;
  await assert.rejects(fetchStats({ token: 't', login: 'x', now: new Date(), fetch: stubFetch(200, body) }), /totalRepositoriesWithContributedCommits/);
});
