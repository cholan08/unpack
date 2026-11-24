import { actor, box, db, defineLesson, flow, item, link, patch, stack } from '@/content/dsl';
import type { LinkSpec, NodeSpec } from '@/engine/types';

/* ---------- layout: users → the API (and its DB) → three windows into it: logs, metrics, traces ---------- */
const users = actor(85, 300, 'Users', { sub: 'some say it’s slow', icon: 'user' });
const api = box(360, 300, 'Express API', { sub: 'GET /api/lists/:id', icon: 'express', tone: 'server', w: 220 });
const mongo = db(360, 500, 'MongoDB', { w: 140, h: 96 });
const logs = stack(790, 140, 'Logs', [], { w: 330, h: 170, from: 'top', mono: true, icon: 'terminal', tone: 'neutral', empty: 'console.log("here")…' });
const metrics = box(790, 330, 'Metrics', { sub: 'rate · errors · duration', icon: 'gauge', tone: 'net', w: 250 });
const traces = stack(790, 482, 'Trace · one request', [], { w: 330, h: 200, from: 'top', mono: true, icon: 'waypoints', tone: 'net', empty: 'no traces yet' });

const base: Record<string, NodeSpec> = { users, api, mongo, logs, metrics, traces };
const links: LinkSpec[] = [link('users', 'api'), link('api', 'mongo'), link('api', 'logs', { style: 'dashed' }), link('api', 'metrics', { style: 'dashed' }), link('api', 'traces', { style: 'dashed' })];
const traffic = [
  flow(['users', 'api', 'mongo'], { label: ['GET', 'find'], back: 'res', every: 3, dwell: 0.1 }),
  flow(['users', 'api', 'mongo'], { kind: 'err', label: ['GET (slow)', 'find…'], back: 'res', every: 6, offset: 1.4, dwell: 1.2 }),
];
const logLines = [
  item('l1', '{"lvl":"info","ms":42,"req":"8f2c"}', { tone: 'neutral' }),
  item('l2', '{"lvl":"warn","ms":1870,"req":"91ab"}', { tone: 'warn', state: 'active' }),
  item('l3', '{"lvl":"error","err":"ValidationError"}', { tone: 'danger' }),
];
const spans = [
  item('s1', 'GET /api/lists/:id ······ 1,912 ms', { tone: 'server' }),
  item('s2', '  requireAuth ··············· 4 ms', { tone: 'auth' }),
  item('s3', '  List.findById ············ 6 ms', { tone: 'data' }),
  item('s4', '  Todo.find({ listId }) · 1,880 ms', { tone: 'danger', state: 'error' }),
];

export default defineLesson({
  metrics: [
    { id: 'p50', label: 'Median (p50)', unit: 'ms', better: 'lower' },
    { id: 'p95', label: 'p95', unit: 'ms', better: 'lower' },
    { id: 'know', label: 'Can explain it' },
  ],
  legend: { err: 'slow / failed request' },
  goals: [
    { text: 'Structured logs with request ids', step: 2 },
    { text: 'RED metrics and percentiles', step: 3 },
    { text: 'Traces: where the time went', step: 4 },
    { text: 'Alerts worth waking up for', step: 5 },
  ],
  steps: [
    {
      short: '“It’s slow”',
      beat: 'problem',
      title: '“It’s slow for some people”',
      body: [
        'Support says some users find list pages slow. On your machine it’s instant. Is it every user, or a few? Every list, or big ones? Since when? Your only evidence is a few `console.log("here")` lines scattered through the code.',
        'Observability is building in the tools to answer those questions **from production**, without guessing.',
      ],
      metrics: { p50: '?', p95: '?', know: 'no' },
      scene: { nodes: base, links: links.slice(0, 2), flows: traffic },
    },
    {
      short: 'Logs',
      beat: 'technique',
      title: 'Structured logs: one JSON line per event',
      body: [
        'Log JSON objects with the same fields every time — level, request id, route, duration, user id — instead of free-form text. That’s [[structured-log|structured logging]], e.g. with `pino`.',
        'A log platform can then search and filter: “all `warn` lines for `GET /api/lists/:id` slower than 1 s, since Tuesday”.',
      ],
      code: {
        file: 'server.js',
        lang: 'js',
        code: `import pinoHttp from 'pino-http';

app.use(pinoHttp({ genReqId: (req) => req.headers['x-request-id'] ?? randomUUID() }));
// every request logs: { level, time, req: { id, method, url }, res: { statusCode }, responseTime }`,
        hl: [3],
      },
      metrics: { p50: '?', p95: '?', know: 'clues' },
      scene: { nodes: patch(base, { logs: { items: logLines, state: 'active' } }), links: [...links.slice(0, 3)], flows: [...traffic, flow(['api', 'logs'], { kind: 'data', label: '{ json }', every: 1.5 })] },
    },
    {
      short: 'Metrics',
      beat: 'technique',
      title: 'Metrics: rate, errors, duration — in percentiles',
      body: [
        'For every route, track [[red|RED]]: **R**ate (requests/s), **E**rrors (failure %), **D**uration. Look at duration as [[percentile|percentiles]], not averages: the average hides the slow tail.',
        'Here the median is 45 ms — fine — but **p95 is 1.8 s**: one request in twenty is painfully slow. Those are the users complaining.',
      ],
      metrics: { p50: 45, p95: 1800, know: 'who, how many' },
      scene: { nodes: patch(base, { metrics: { state: 'active', badge: { text: 'p95 1.8 s on GET /lists/:id', tone: 'warn' } } }), links: [...links.slice(0, 2), links[3]], flows: [...traffic, flow(['api', 'metrics'], { kind: 'data', label: 'duration', every: 1.5 })] },
    },
    {
      short: 'Traces',
      beat: 'technique',
      title: 'Traces: where did the 1.9 seconds go?',
      body: [
        '[[tracing|Tracing]] records the timed steps (spans) inside one request: middleware, each database call, calls to other services. Tools like OpenTelemetry add them with little code.',
        'The trace for a slow request answers instantly: auth 4 ms, loading the list 6 ms, `Todo.find({ listId })` **1,880 ms** — a query with no index on `listId`, slow only for big lists.',
      ],
      check: {
        q: 'p95 is 1.8 s and the trace shows 1,880 ms inside `Todo.find({ listId })`. What’s the most likely fix?',
        options: ['Buy a bigger server', 'Add an index on listId (check with explain())', 'Add more logging', 'Cache the whole page in the browser'],
        answer: 1,
        explain: 'Slow only for big lists + time spent in one find = a collection scan. An index on `listId` turns it into an index scan.',
      },
      metrics: { p50: 45, p95: 1800, know: 'yes — missing index' },
      scene: { nodes: patch(base, { traces: { items: spans, state: 'active' } }), links: [...links.slice(0, 2), links[4]], flows: [...traffic, flow(['api', 'traces'], { kind: 'data', label: 'spans', every: 2 })] },
    },
    {
      short: 'Alerts',
      beat: 'technique',
      title: 'Alerts on symptoms users feel',
      body: [
        'Don’t wait for support tickets. Alert on what users experience: error rate above 2% for five minutes, p95 above one second, the `/healthz` check failing. Those deserve waking someone up.',
        'Avoid alerting on causes (“CPU at 80%”) that may not hurt anyone — noisy alerts get ignored, and then the important one is missed too.',
      ],
      metrics: { p50: 45, p95: 60, know: 'yes' },
      scene: {
        nodes: patch(base, { metrics: { state: 'ok', badge: { text: 'alert: p95 > 1 s — resolved', tone: 'ok' } }, mongo: { badge: { text: 'index added', tone: 'ok' } } }),
        links: [...links.slice(0, 2), links[3]],
        flows: [flow(['users', 'api', 'mongo'], { label: ['GET', 'IXSCAN'], back: 'res', every: 2 }), flow(['api', 'metrics'], { kind: 'data', label: 'p95 60 ms', every: 2 })],
      },
    },
    {
      short: 'Front end',
      beat: 'technique',
      title: 'The front end needs eyes too',
      body: [
        'Plenty of failures never reach your server: a JavaScript error on one browser, a slow page load on mobile networks. Front-end error tracking captures exceptions with the source-mapped stack trace, browser and route.',
        'Real-user performance metrics (Core Web Vitals: loading, interactivity, layout shift) show what pages actually feel like for people — not just on your fast laptop.',
      ],
      metrics: { p50: 45, p95: 60, know: 'yes' },
      scene: {
        nodes: patch(base, { users: { sub: 'errors + vitals reported' }, logs: { label: 'Front-end errors', items: [item('e1', 'TypeError: todo.tags is undefined', { tone: 'danger', state: 'active' }), item('e2', 'at TodoItem.jsx:27 · Safari 17', { tone: 'neutral' })] } }),
        links: [link('users', 'api'), link('api', 'mongo'), link('users', 'logs', { route: 'over', bend: 30, style: 'dashed' })],
        flows: [flow(['users', 'logs'], { kind: 'err', label: 'error report', every: 3.6 })],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Seeing inside production',
      body: [
        '{neutral:Logs}: structured JSON with a request id — search and correlate.',
        '{net:Metrics}: rate, errors and duration per route, as percentiles. {net:Traces}: the timed steps inside one request.',
        'Alert on user-visible symptoms, track front-end errors and vitals, and you can answer “why is it slow?” with evidence.',
      ],
      metrics: { p50: 45, p95: 60, know: 'yes' },
      scene: {
        nodes: patch(base, { logs: { items: logLines.slice(0, 1) }, traces: { items: spans.slice(0, 3) }, mongo: { badge: { text: 'indexed', tone: 'ok' } } }),
        links,
        flows: [flow(['users', 'api', 'mongo'], { label: ['GET', 'find'], back: 'res', every: 3 }), flow(['api', 'logs'], { kind: 'data', every: 3 }), flow(['api', 'metrics'], { kind: 'data', every: 3, offset: 0.3 }), flow(['api', 'traces'], { kind: 'data', every: 3, offset: 0.6 })],
      },
    },
  ],
});
