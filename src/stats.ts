// Contribution stats for the stat card: rolling last 12 months, matching what
// wstech.tech's GitHub card shows (jogruber `?y=last`).
export interface Stats {
  contributions: number;
  longestStreak: number;
  repos: number;
}

export interface Day {
  date: string; // YYYY-MM-DD
  count: number;
}

const DAY_MS = 864e5;

/** Longest run of consecutive calendar days with at least one contribution. */
export function longestStreak(days: Day[]): number {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  let best = 0, run = 0, prev = NaN;
  for (const d of sorted) {
    const t = Date.parse(`${d.date}T00:00:00Z`);
    if (d.count > 0) {
      run = t - prev === DAY_MS ? run + 1 : 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
    prev = t;
  }
  return best;
}

const QUERY = `query($login:String!,$from:DateTime!,$to:DateTime!){user(login:$login){contributionsCollection(from:$from,to:$to){contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}} totalRepositoriesWithContributedCommits}}}`;

export async function fetchStats(o: { token: string; login: string; now: Date; fetch?: typeof fetch }): Promise<Stats> {
  const doFetch = o.fetch ?? fetch;
  const variables = {
    login: o.login,
    from: new Date(o.now.getTime() - 365 * DAY_MS).toISOString(),
    to: o.now.toISOString(),
  };
  const res = await doFetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${o.token}`, 'Content-Type': 'application/json', 'User-Agent': 'profile-cards' },
    body: JSON.stringify({ query: QUERY, variables }),
  });
  if (!res.ok) throw new Error(`GitHub GraphQL responded ${res.status}`);
  const json = (await res.json()) as any;
  if (json.errors?.length) throw new Error(`GitHub GraphQL errors: ${JSON.stringify(json.errors)}`);
  const cc = json.data?.user?.contributionsCollection;
  const cal = cc?.contributionCalendar;
  if (!cal || typeof cal.totalContributions !== 'number' || !Array.isArray(cal.weeks)) {
    throw new Error('GitHub GraphQL response has no contributionCalendar');
  }
  const days: Day[] = cal.weeks.flatMap((w: any) =>
    w.contributionDays.map((d: any) => ({ date: d.date, count: d.contributionCount })),
  );
  return {
    contributions: cal.totalContributions,
    longestStreak: longestStreak(days),
    repos: cc.totalRepositoriesWithContributedCommits ?? 0,
  };
}
