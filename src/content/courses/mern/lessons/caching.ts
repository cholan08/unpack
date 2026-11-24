import { box, browser, db, defineLesson, defineSandbox, flow, fmt, humanTime, link, patch, range, toggle } from '@/content/dsl';
import type { LinkSpec, NodeSpec } from '@/engine/types';

/* ---------- layout: browser · CDN (above) · Express · Redis (above) and MongoDB (below) ---------- */
const web = browser(110, 300, { w: 190, h: 140, url: 'todo-app.com', screen: [{ t: 'h', text: 'Popular lists' }, { t: 'item', text: 'Groceries' }, { t: 'item', text: 'Weekend' }] });
const cdn = box(340, 140, 'CDN edge', { sub: 'public data', icon: 'cloud', tone: 'net', w: 180 });
const api = box(510, 300, 'Express', { sub: 'GET …/popular', icon: 'express', tone: 'server', w: 220 });
const redis = box(820, 140, 'Redis', { sub: 'in memory', icon: 'bolt', tone: 'data', w: 180 });
const mongo = db(820, 450, 'MongoDB', { sub: 'aggregation · 400 ms', w: 170, h: 116 });

const base: Record<string, NodeSpec> = { web, cdn, api, redis, mongo };
const links: LinkSpec[] = [link('web', 'cdn'), link('web', 'api'), link('api', 'redis'), link('api', 'mongo')];
const hit = (o: Parameters<typeof flow>[1] = {}) => flow(['web', 'api', 'redis'], { label: ['GET popular', 'GET popular:v1'], back: 'res', backLabel: ['hit · 1 ms', '200 · 6 ms'], every: 4, ...o });
const miss = (o: Parameters<typeof flow>[1] = {}) => [
  flow(['web', 'api', 'redis'], { label: ['GET popular', 'GET key'], back: 'err', backLabel: ['miss', ''], every: 6.4, ...o }),
  flow(['api', 'mongo'], { kind: 'req', label: 'aggregate', back: 'res', backLabel: '400 ms', every: 6.4, offset: 2.2, ...o }),
  flow(['api', 'redis'], { kind: 'data', label: 'SET key EX 60', every: 6.4, offset: 4.4, ...o }),
];

const asideCode = `async function getPopularLists() {
  const cached = await redis.get('popular:v1');
  if (cached) return JSON.parse(cached);                    // hit: ~1 ms

  const lists = await List.aggregate(popularPipeline);      // miss: ~400 ms
  await redis.set('popular:v1', JSON.stringify(lists), { EX: 60 }); // keep 60 s
  return lists;
}`;

/* ---------- sandbox: cache on/off, how long entries live, how busy the site is ---------- */
const DB_CAPACITY = 12000; // aggregations per minute MongoDB can run before queuing
const sandbox = defineSandbox({
  intro: 'Switch the Redis cache on and off, change how long entries live, and turn the traffic up. Watch the **database load** and how **fresh** the data is.',
  controls: [
    toggle('cache', 'Redis cache (cache-aside)', true),
    range('ttl', 'Entries live for (EX)', { min: 1, max: 3600, value: 60, log: true, format: (s) => humanTime(s) }),
    range('rpm', 'Requests per minute', { min: 10, max: 100_000, value: 6000, log: true, format: fmt }),
  ],
  compute: (v) => {
    const on = v.cache === true;
    const ttl = Number(v.ttl);
    const rpm = Number(v.rpm);
    const misses = on ? Math.min(rpm, 60 / ttl) : rpm; // one refill per TTL
    const hitRate = 1 - misses / rpm;
    const load = misses / DB_CAPACITY;
    const dbMs = Math.round(400 * (1 + Math.max(0, load - 0.5) * 6)); // queries queue once it's busy
    const latency = on ? Math.round(hitRate * 6 + (1 - hitRate) * (dbMs + 6)) : dbMs + 20;
    const perMin = misses < 1 ? misses.toFixed(2) : fmt(misses);
    const pct = hitRate >= 0.9995 ? '99.9+' : String(Math.round(hitRate * 1000) / 10);
    const nodes = patch(base, {
      cdn: { state: 'dim' },
      api: { badge: { text: `${fmt(latency)} ms`, tone: latency < 100 ? 'ok' : latency < 1000 ? 'warn' : 'danger' } },
      redis: on ? { state: 'active', sub: `${pct}% hits` } : { state: 'ghost', sub: 'off' },
      mongo: { state: load > 1 ? 'error' : load > 0.5 ? 'busy' : undefined, sub: `${perMin} queries/min` },
    });
    const flows = !on
      ? [0, 1.2, 2.4].slice(0, rpm > 1000 ? 3 : 1).map((o) => flow(['web', 'api', 'mongo'], { label: o ? undefined : ['GET popular', 'aggregate'], back: 'res', backLabel: o ? undefined : [`${fmt(dbMs)} ms`, `${fmt(latency)} ms`], every: 3.6, offset: o, dwell: load > 0.5 ? 1.2 : 0.4 }))
      : hitRate >= 0.5
        ? [hit({ every: 2.4 }), ...miss({ every: 9.6, offset: 1.2 })]
        : [...miss(), hit({ every: 6.4, offset: 3.2 })];
    const note = on
      ? `**${pct}%** of requests are answered from Redis in ~6 ms; MongoDB runs the query ${misses < 1 ? `once every ${humanTime(ttl)}` : `${perMin} times a minute`}. The price: data can be up to **${humanTime(ttl)}** old.` +
        (hitRate < 0.5 ? ' With this little traffic, entries expire before anyone reuses them — the cache barely helps.' : '') +
        (load > 0.5 ? ' Even the misses alone are too many for the database — cache for longer.' : '')
      : `Every request runs the 400 ms aggregation: **${fmt(rpm)} queries a minute** on MongoDB.` +
        (load > 1 ? ' That’s more than it can handle — requests queue up and start timing out.' : load > 0.5 ? ' It’s straining, so responses slow down as queries queue.' : '');
    return {
      scene: { nodes, links, flows },
      metrics: { latency, dbload: misses < 1 ? Number(misses.toFixed(2)) : Math.round(misses), fresh: on ? `≤ ${humanTime(ttl)} old` : 'yes' },
      tone: latency >= 1000 ? 'danger' : latency >= 100 || hitRate < 0.5 ? 'warn' : 'ok',
      note,
    };
  },
});

export default defineLesson({
  metrics: [
    { id: 'latency', label: 'Response time', unit: 'ms', better: 'lower' },
    { id: 'dbload', label: 'Database queries / min', better: 'lower' },
    { id: 'fresh', label: 'Data fresh' },
  ],
  legend: { data: 'cache write', err: 'cache miss' },
  goals: [
    { text: 'The layers of caching', step: 1 },
    { text: 'Browser and CDN caching', step: 2 },
    { text: 'Cache-aside with Redis', step: 4 },
    { text: 'Invalidating stale data', step: 5 },
    { text: 'Avoiding cache stampedes', step: 6 },
    { text: 'Tune a cache: TTL vs. traffic vs. freshness', step: 8 },
  ],
  steps: [
    {
      short: 'Layers',
      beat: 'setup',
      title: 'Every layer can remember an answer',
      body: [
        'The “popular lists” page runs a 400 ms aggregation, and thousands of people load it every minute — getting the same answer. Computing it once and reusing it is caching.',
        'You can cache at every layer: the **browser**, a **CDN** in front of everything, your **app** (Redis), and the database’s own memory. Each layer you hit early saves all the work behind it.',
      ],
      metrics: { latency: 420, dbload: 6000, fresh: 'yes' },
      scene: { nodes: base, links, flows: [flow(['web', 'api', 'mongo'], { label: ['GET popular', 'aggregate'], back: 'res', backLabel: ['400 ms', '420 ms'], every: 3.2 })] },
    },
    {
      short: 'Browser & CDN',
      beat: 'technique',
      title: 'Browser and CDN caches: don’t even reach the server',
      body: [
        'A `Cache-Control: public, max-age=60` header lets the browser reuse the response for a minute **and** lets a CDN edge store it and answer everyone nearby — the request never reaches your server.',
        'Perfect for public data that’s the same for everyone. Never for per-user data: mark that `Cache-Control: private` (or `no-store`) so shared caches don’t serve Ana’s todos to Ben.',
      ],
      code: { file: 'routes/lists.js', lang: 'js', code: `res.set('Cache-Control', 'public, max-age=60');   // popular lists: same for everyone\nres.set('Cache-Control', 'private, no-store');     // anything per user`, hl: [1], err: [] },
      metrics: { latency: 15, dbload: 60, fresh: '≤ 60 s old' },
      scene: { nodes: patch(base, { cdn: { state: 'active', badge: { text: 'HIT', tone: 'ok' } } }), links: [...links, link('cdn', 'api', { style: 'dashed' })], flows: [flow(['web', 'cdn'], { label: 'GET popular', back: 'res', backLabel: 'from edge · 15 ms', every: 2.4 })] },
    },
    {
      short: 'Redis',
      beat: 'technique',
      title: 'An app cache: Redis in front of the database',
      body: [
        'When responses differ per user or the CDN can’t help, cache inside your app. [[redis|Redis]] keeps data in memory and answers in about a millisecond — far faster than recomputing an aggregation.',
        'Each entry gets a [[ttl|TTL]] so it expires on its own.',
      ],
      metrics: { latency: 6, dbload: 1, fresh: '≤ 60 s old' },
      scene: { nodes: patch(base, { redis: { state: 'active', badge: { text: 'popular:v1', tone: 'data' } } }), links, flows: [hit()] },
    },
    {
      short: 'Cache-aside',
      beat: 'technique',
      title: 'Cache-aside: check, miss, fill',
      body: [
        'The common pattern is [[cache-aside|cache-aside]]: look in the cache first. On a **hit**, return it. On a **miss**, query the database, store the result with a TTL, then return it — so the next request hits.',
        'One slow request per minute; thousands of fast ones.',
      ],
      code: { file: 'services/lists.js', lang: 'js', code: asideCode, hl: [2, 3, 6] },
      metrics: { latency: 6, dbload: 1, fresh: '≤ 60 s old' },
      scene: { nodes: patch(base, { redis: { state: 'active' } }), links, flows: [...miss(), hit({ offset: 1.2, every: 6.4 })] },
    },
    {
      short: 'Stale',
      beat: 'problem',
      title: 'Stale data: the database changed, the cache didn’t',
      body: [
        'Ana renames her list. The database updates instantly — but the cached “popular lists” still has the old name for up to 60 seconds. For some data that’s fine; for a user’s own changes it looks broken.',
        'Fix it on the write path: after updating the database, **delete (invalidate)** the affected cache key. The next read misses and refills with fresh data.',
      ],
      check: {
        q: 'After saving a change to the database, what’s the simplest reliable way to keep the cached copy from going stale?',
        options: ['Wait for the TTL to expire', 'Delete the cache key right after the write', 'Update the cache before the database', 'Turn off the cache'],
        answer: 1,
        explain: 'Deleting the key after the write means the next read refetches from the database. Updating the cache first risks caching a change that then fails to save.',
      },
      code: { file: 'routes/lists.js', lang: 'js', code: `await List.updateOne({ _id, ownerId: req.user.id }, { $set: { name } });\nawait redis.del('popular:v1');   // next read refills with fresh data`, hl: [2] },
      metrics: { latency: 6, dbload: 2, fresh: 'yes' },
      scene: {
        nodes: patch(base, { redis: { badge: { text: 'DEL popular:v1', tone: 'warn' }, state: 'busy' }, web: { screen: [{ t: 'h', text: 'Popular lists' }, { t: 'item', text: 'Groceries 🥕', flash: true }, { t: 'item', text: 'Weekend' }] } }),
        links,
        flows: [flow(['web', 'api', 'mongo'], { kind: 'data', label: ['rename list', 'updateOne'], every: 5 }), flow(['api', 'redis'], { kind: 'err', label: 'DEL key', every: 5, offset: 2.2 })],
      },
    },
    {
      short: 'Stampede',
      beat: 'problem',
      title: 'Stampede: everyone misses at once',
      body: [
        'The key expires at 12:00:00. In that instant 800 requests all miss, and all 800 run the 400 ms aggregation at the same moment. The database falls over just when the cache was supposed to protect it — a [[stampede|cache stampede]].',
        'Defences: let only **one** request recompute while the others wait or get the stale value (a lock / “single flight”), refresh popular keys in the background before they expire, and add random jitter to TTLs so keys don’t expire together.',
      ],
      metrics: { latency: 3200, dbload: 800, fresh: 'yes' },
      scene: {
        nodes: patch(base, { redis: { badge: { text: 'expired', tone: 'danger' } }, mongo: { state: 'error', meter: 0.98, badge: { text: '800 identical queries', tone: 'danger' } } }),
        links,
        flows: [0, 0.15, 0.3, 0.45, 0.6].map((o) => flow(['web', 'api', 'mongo'], { kind: 'err', label: o === 0 ? ['miss!', 'aggregate'] : undefined, every: 2.4, offset: o })),
      },
    },
    {
      short: 'What not',
      beat: 'tradeoff',
      title: 'What not to cache',
      body: [
        'Caching trades freshness for speed. Don’t cache what must always be exact (account balances, stock at checkout), don’t put per-user data in shared caches, and include every input that changes the answer in the key (`todos:user:42:page:2`).',
        'Measure first: an index or a better query often removes the need for a cache — and the cache-invalidation bugs that come with it.',
      ],
      metrics: { latency: 6, dbload: 1, fresh: '≤ 60 s old' },
      scene: { nodes: patch(base, { redis: { sub: 'per-user keys' } }), links, flows: [hit()] },
    },
    {
      short: 'Try it',
      beat: 'try',
      title: 'Tune the cache yourself',
      body: ['One popular endpoint, one slow aggregation. Three dials decide how hard the database works and how stale the answers get.'],
      sandbox,
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Caching layers, in short',
      body: [
        '{client:Browser} and {net:CDN} caches (Cache-Control) stop requests before they reach you — public data only.',
        '{data:Redis} cache-aside: check, miss → query → set with TTL. Delete keys when the data changes.',
        'Guard popular keys against stampedes, keep per-user data private, and cache only after measuring.',
      ],
      metrics: { latency: 6, dbload: 1, fresh: '≤ 60 s old' },
      scene: { nodes: base, links, flows: [flow(['web', 'cdn'], { label: 'public', back: 'res', every: 4.8 }), hit({ offset: 1.6, every: 4.8 })] },
    },
  ],
});
