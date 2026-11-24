import { actor, box, choice, db, defineLesson, defineSandbox, flow, fmt, humanTime, item, link, patch, range, stack, toggle } from '@/content/dsl';
import type { Item, LinkSpec, NodeSpec } from '@/engine/types';

/* ---------- layout: a person and a bot → the limiter (with its bucket) → the login route → the DB ---------- */
const ana = actor(90, 170, 'Ana', { sub: '2 tries', icon: 'user', tone: 'client' });
const bot = actor(90, 430, 'Bot', { sub: '10,000 tries/min', icon: 'bug', tone: 'danger' });
const limiter = box(380, 300, 'rateLimit', { sub: '10 per 15 min', icon: 'gauge', tone: 'auth', w: 190 });
const route = box(650, 300, 'POST /api/login', { sub: 'bcrypt.compare', icon: 'key', tone: 'server', w: 200 });
const users = db(895, 300, 'users', { w: 130, h: 100 });
const tokens = (n: number): Item[] => Array.from({ length: n }, (_, i) => item(`t${i}`, '● token', { tone: 'auth' }));
const bucket = (n: number, o: Partial<NodeSpec> = {}) =>
  ({ ...stack(380, 505, 'bot’s bucket', tokens(n), { w: 190, h: 170, mono: true, icon: 'gauge', tone: 'auth', empty: 'empty → 429' }), ...o }) as NodeSpec;

const base: Record<string, NodeSpec> = { ana, bot, limiter, route, users };
const links: LinkSpec[] = [link('ana', 'limiter'), link('bot', 'limiter'), link('limiter', 'route'), link('route', 'users')];
const anaTry = flow(['ana', 'limiter', 'route', 'users'], { kind: 'auth', label: ['login', 'ok', 'find'], back: 'res', every: 4.8 });
const botFlood = (blocked: boolean) =>
  [0, 0.3, 0.6, 0.9].map((o) =>
    blocked
      ? flow(['bot', 'limiter'], { kind: 'err', label: o === 0 ? 'guess #4,812' : undefined, back: 'err', backLabel: o === 0 ? '429' : undefined, every: 1.6, offset: o })
      : flow(['bot', 'limiter', 'route', 'users'], { kind: 'err', label: o === 0 ? ['guess', 'pass', 'find'] : undefined, every: 1.6, offset: o }),
  );

/* ---------- sandbox: the limit, the bot's speed, how many servers count ---------- */
const COMMON = 10000; // the attacker's list of most common passwords
const sandbox = defineSandbox({
  intro: 'Set the limit (per 15 minutes), make the bot faster, and add servers. How long until the bot has tried the **10,000 most common passwords** on Ana’s account?',
  controls: [
    range('limit', 'Attempts allowed per 15 min', { min: 1, max: 100, value: 10 }),
    range('bot', 'Bot tries per minute', { min: 1, max: 100_000, value: 10_000, log: true, format: fmt }),
    choice('servers', 'Servers', [['1', '1'], ['3', '3'], ['10', '10']]),
    toggle('shared', 'Counters shared in Redis'),
  ],
  compute: (v) => {
    const limit = Number(v.limit);
    const bot = Number(v.bot);
    const servers = Number(v.servers);
    const shared = v.shared === true;
    const allowed = (limit / 15) * (shared ? 1 : servers); // per minute; the load balancer spreads the bot over servers
    const through = Math.min(bot, allowed);
    const blocked = bot > allowed;
    const minutes = COMMON / through;
    const anaOk = limit >= 2; // Ana mistypes once, then gets it right
    const rate = through < 10 ? String(Math.round(through * 10) / 10) : fmt(through);
    const counters = servers > 1 && !shared;
    const nodes: Record<string, NodeSpec> = {
      ...patch(base, {
        bot: { sub: `${fmt(bot)} tries/min` },
        ana: anaOk ? {} : { sub: 'typo → locked out', badge: { text: '429', tone: 'danger' } },
        limiter: {
          label: servers > 1 ? `rateLimit × ${servers}` : 'rateLimit',
          sub: `${limit} per 15 min`,
          state: 'active',
          badge: counters ? { text: `${servers} separate counters`, tone: 'warn' } : blocked ? { text: '429 for the bot', tone: 'auth' } : { text: 'bot under the limit', tone: 'warn' },
        },
        route: { state: blocked ? undefined : 'busy' },
      }),
      ...(shared ? { redis: box(650, 150, 'Redis', { sub: 'shared count', icon: 'bolt', tone: 'data', w: 180, state: 'active' }) } : {}),
    };
    const flows = [
      ...botFlood(blocked).slice(0, bot < 10 ? 1 : 4),
      anaOk ? anaTry : flow(['ana', 'limiter'], { kind: 'auth', label: '2nd try', back: 'err', backLabel: '429', every: 4.8 }),
    ];
    const note =
      `The bot gets **${rate}** guesses a minute past the limiter, so 10,000 common passwords take **${humanTime(minutes * 60)}**.` +
      (counters ? ` Each of the ${servers} servers counts on its own, so the bot gets ${servers}× the limit — share the counters in Redis.` : '') +
      (!blocked ? ' The bot is under the limit, so nothing slows it down at all.' : '') +
      (!anaOk ? ' But Ana mistypes once and is locked out for 15 minutes — too strict hurts real people.' : '');
    return {
      scene: { nodes, links: [...links, ...(shared ? [link('limiter', 'redis', { style: 'dashed' })] : [])], flows },
      metrics: { guesses: Math.round(through * 10) / 10, ana: anaOk ? 'yes' : 'locked out' },
      tone: minutes < 24 * 60 ? 'danger' : !anaOk || minutes < 7 * 24 * 60 ? 'warn' : 'ok',
      note,
    };
  },
});

export default defineLesson({
  metrics: [
    { id: 'guesses', label: 'Bot guesses reaching the DB / min', better: 'lower' },
    { id: 'ana', label: 'Ana can log in' },
  ],
  legend: { auth: 'login attempt', err: 'abusive request' },
  goals: [
    { text: 'Why APIs need limits', step: 1 },
    { text: 'Limits per key and 429 responses', step: 2 },
    { text: 'How a token bucket works', step: 3 },
    { text: 'Limits across several servers', step: 5 },
    { text: 'Handling 429 as a client', step: 6 },
    { text: 'Tune a limiter against a real attack', step: 7 },
  ],
  steps: [
    {
      short: 'Unlimited',
      beat: 'problem',
      title: 'One client can hammer your API',
      body: [
        'A bot tries 10,000 passwords a minute against `/api/login`. Each attempt costs a database lookup and a deliberately slow bcrypt check — so the bot burns your CPU *and* has a real chance of guessing weak passwords.',
        'The same applies to scrapers, runaway retry loops in your own front end, and a single heavy user slowing everyone else down.',
      ],
      metrics: { guesses: 10000, ana: 'slowly' },
      scene: { nodes: patch(base, { route: { state: 'busy', meter: 0.97 }, users: { state: 'busy' } }), links, flows: [...botFlood(false), anaTry] },
    },
    {
      short: 'Limit',
      beat: 'solution',
      title: 'Limit requests per client, answer 429',
      body: [
        'A [[rate-limit|rate limiter]] counts requests per key (an IP, a user, an API key) in a time window. Over the limit, it answers `429 Too Many Requests` with a `Retry-After` header — **before** any expensive work happens.',
        'Ten login attempts per 15 minutes is invisible to a real person and ruinous for a guessing bot.',
      ],
      code: {
        file: 'server.js',
        lang: 'js',
        code: `import { rateLimit } from 'express-rate-limit';

app.use('/api/login', rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  limit: 10,                  // per key (IP by default)
  standardHeaders: true,      // RateLimit-* and Retry-After headers
}));`,
        hl: [4, 5],
      },
      metrics: { guesses: 0.7, ana: 'yes' },
      scene: { nodes: patch(base, { limiter: { state: 'active', badge: { text: '429 for the bot', tone: 'auth' } } }), links, flows: [...botFlood(true), anaTry] },
    },
    {
      short: 'Token bucket',
      beat: 'technique',
      title: 'How a token bucket works',
      body: [
        'Many limiters use a [[token-bucket|token bucket]]. Each client has a bucket holding up to N tokens that refills at a steady rate. Every request takes a token; no token, no entry.',
        'It allows short bursts (a full bucket) while capping the long-run rate (the refill speed) — friendlier than a hard window that resets all at once.',
      ],
      metrics: { guesses: 0.7, ana: 'yes' },
      scene: {
        nodes: { ...patch(base, { limiter: { state: 'active' } }), bucket: bucket(2) },
        links: [...links, link('limiter', 'bucket', { style: 'dashed', label: 'take 1' })],
        flows: [flow(['bot', 'limiter', 'bucket'], { kind: 'err', label: ['request', 'take token'], back: 'auth', backLabel: ['', 'ok (1 left)'], every: 2.4 })],
      },
    },
    {
      short: 'Empty bucket',
      beat: 'technique',
      title: 'Empty bucket: wait for the refill',
      body: [
        'The bot burns through its tokens in a second; from then on it gets `429` until tokens trickle back — one every 90 seconds here. Ana has her own bucket, full, and never notices.',
        'Choosing the **key** matters: per IP is easy, but many people can share one office IP. For logins, limiting per account *and* per IP works well.',
      ],
      metrics: { guesses: 0.7, ana: 'yes' },
      scene: {
        nodes: { ...patch(base, { limiter: { state: 'active' } }), bucket: bucket(0, { state: 'error' }) },
        links: [...links, link('limiter', 'bucket', { style: 'dashed' })],
        flows: [...botFlood(true).slice(0, 2), anaTry],
      },
    },
    {
      short: 'Many servers',
      beat: 'problem',
      title: 'Three servers, three separate counters',
      body: [
        'The default limiter counts in **each process’s memory**. Run three servers behind a load balancer and the bot simply gets three times the limit — or more as you scale out.',
        'Keep the counters in a shared store everyone can see, typically Redis, so the limit holds across all instances.',
      ],
      code: { file: 'server.js', lang: 'js', code: `rateLimit({ windowMs, limit: 10, store: new RedisStore({ sendCommand: (...a) => redis.sendCommand(a) }) });`, hl: [1] },
      metrics: { guesses: 2.1, ana: 'yes' },
      scene: {
        nodes: {
          bot,
          l1: box(380, 170, 'server 1 counter', { sub: 'bot: 10/10', icon: 'gauge', tone: 'auth', w: 200 }),
          l2: box(380, 300, 'server 2 counter', { sub: 'bot: 10/10', icon: 'gauge', tone: 'auth', w: 200 }),
          l3: box(380, 430, 'server 3 counter', { sub: 'bot: 10/10', icon: 'gauge', tone: 'auth', w: 200 }),
          redis: box(700, 300, 'Redis', { sub: 'shared count', icon: 'bolt', tone: 'data', w: 180, state: 'active' }),
        },
        links: [link('bot', 'l1'), link('bot', 'l2'), link('bot', 'l3'), link('l1', 'redis', { style: 'dashed' }), link('l2', 'redis', { style: 'dashed' }), link('l3', 'redis', { style: 'dashed' })],
        flows: ['l1', 'l2', 'l3'].map((l, i) => flow(['bot', l, 'redis'], { kind: 'err', label: i === 0 ? ['guess', 'INCR'] : undefined, every: 3, offset: i * 0.4 })),
      },
    },
    {
      short: 'Good clients',
      beat: 'technique',
      title: 'Handling 429 as a client',
      body: [
        'Your own front end will hit limits too (double-clicks, retries). On `429`, don’t retry immediately: wait for `Retry-After` if given, otherwise back off **exponentially** with some randomness — 1 s, 2 s, 4 s, plus jitter — so thousands of clients don’t retry in lockstep.',
        'Show the user something useful (“Too many attempts — try again in a minute”) instead of a generic error.',
      ],
      check: {
        q: 'Your app gets `429` with `Retry-After: 30`. What should it do?',
        options: ['Retry immediately, in a loop, until it works', 'Wait about 30 seconds (or back off), then retry', 'Log the user out', 'Switch to a different API endpoint'],
        answer: 1,
        explain: 'The server told you when it will accept you again. Hammering it only extends the block and adds load. That’s [[backoff|exponential backoff]] when no hint is given.',
      },
      metrics: { guesses: 0.7, ana: 'yes' },
      scene: {
        nodes: patch(base, { ana: { sub: 'too many tries', badge: { text: 'waits 30 s', tone: 'warn' } }, limiter: { state: 'active' } }),
        links,
        flows: [flow(['ana', 'limiter'], { kind: 'auth', label: 'login', back: 'err', backLabel: '429 Retry-After: 30', every: 4 }), flow(['ana', 'limiter', 'route', 'users'], { kind: 'auth', label: ['after 30 s', 'ok', 'find'], back: 'res', every: 8, offset: 4 })],
      },
    },
    {
      short: 'Try it',
      beat: 'try',
      title: 'Tune the limiter',
      body: ['One bot, one account, a list of the 10,000 most common passwords. Find a limit that stops the bot without locking Ana out.'],
      sandbox,
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Rate limiting, in short',
      body: [
        'Limit requests {auth:per key} — IP, user, account — and answer `429` with `Retry-After` before doing expensive work. Login, signup and password reset first.',
        'Token buckets allow bursts but cap the rate. With several servers, keep counters in {data:Redis}.',
        'Clients should back off exponentially and tell the user what’s happening.',
      ],
      metrics: { guesses: 0.7, ana: 'yes' },
      scene: { nodes: patch(base, { limiter: { state: 'active' } }), links, flows: [...botFlood(true).slice(0, 2), anaTry] },
    },
  ],
});
