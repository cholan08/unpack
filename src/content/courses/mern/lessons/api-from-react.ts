import { box, defineLesson, flow, link, patch } from '@/content/dsl';
import type { LinkSpec, NodeSpec } from '@/engine/types';

/* ---------- layout: components on the left → (the API client) → the server ---------- */
const comp = (y: number, label: string) => box(150, y, label, { icon: 'component', tone: 'client', w: 190 });
const comps: Record<string, NodeSpec> = { c1: comp(140, 'TodoList'), c2: comp(300, 'AddTodo'), c3: comp(460, 'Profile') };
const client = box(480, 300, 'api.js', { sub: 'one API client', icon: 'code', tone: 'client', w: 200 });
const server = box(830, 300, 'Express API', { sub: '/api/*', icon: 'express', tone: 'server', w: 200 });
const refresh = box(830, 470, 'POST /api/refresh', { sub: 'new session', icon: 'key', tone: 'auth', w: 210 });

const direct: LinkSpec[] = [link('c1', 'server'), link('c2', 'server'), link('c3', 'server')];
const via: LinkSpec[] = [link('c1', 'client'), link('c2', 'client'), link('c3', 'client'), link('client', 'server')];
const calls = (o: Parameters<typeof flow>[1] = {}) => [
  flow(['c1', 'client', 'server'], { label: ['api.todos.list()', 'GET /api/todos'], back: 'res', backLabel: ['JSON', 'todos'], every: 5, ...o }),
  flow(['c2', 'client', 'server'], { kind: 'data', label: ['api.todos.create()', 'POST'], back: 'res', every: 5, offset: 1.6, ...o }),
];

const clientCode = `const BASE = import.meta.env.VITE_API_URL ?? '/api';

async function request(path, { method = 'GET', body, signal } = {}) {
  const res = await fetch(BASE + path, {
    method,
    signal,
    credentials: 'include',                          // send the session cookie
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => null));
  return res.status === 204 ? null : res.json();
}

export const api = {
  todos: {
    list: (opts) => request('/todos', opts),
    create: (text) => request('/todos', { method: 'POST', body: { text } }),
  },
};`;

export default defineLesson({
  metrics: [
    { id: 'places', label: 'Places that know the API details', better: 'lower' },
    { id: 'errors', label: 'Errors handled consistently' },
  ],
  legend: { auth: 'session refresh' },
  goals: [
    { text: 'Why scattered fetch calls hurt', step: 1 },
    { text: 'A small API client module', step: 2 },
    { text: 'Errors with status and body', step: 4 },
    { text: 'Handling an expired session once', step: 5 },
    { text: 'Cancelling requests', step: 6 },
  ],
  steps: [
    {
      short: 'fetch everywhere',
      beat: 'problem',
      title: 'Every component talks to the API its own way',
      body: [
        'Each component calls `fetch` directly, so each one repeats the base URL, the JSON headers, `credentials`, and the `res.ok` check — or forgets it.',
        'Move the API to a new domain, change the error format, or add auth headers, and you’re editing twenty files. One of them will be missed.',
      ],
      code: {
        file: 'three components',
        lang: 'jsx',
        code: `fetch('http://localhost:5000/api/todos', { credentials: 'include' })     // TodoList
fetch('/api/todos', { method: 'POST', body: JSON.stringify({ text }) })   // AddTodo — no Content-Type!
fetch('http://localhost:5000/api/me').then((r) => r.json())               // Profile — no res.ok check`,
        err: [2, 3],
      },
      metrics: { places: 3, errors: 'no' },
      scene: {
        nodes: { ...patch(comps, { c2: { state: 'error', badge: { text: 'forgot Content-Type', tone: 'danger' } }, c3: { state: 'error', badge: { text: 'ignores 401', tone: 'danger' } } }), server },
        links: direct,
        flows: [
          flow(['c1', 'server'], { label: 'fetch(…full URL…)', back: 'res', every: 4.8 }),
          flow(['c2', 'server'], { kind: 'data', label: 'POST (text/plain)', back: 'err', backLabel: '400', every: 4.8, offset: 1.6 }),
          flow(['c3', 'server'], { label: 'GET /api/me', back: 'err', backLabel: '401 (ignored)', every: 4.8, offset: 3.2 }),
        ],
      },
    },
    {
      short: 'API client',
      beat: 'solution',
      title: 'One small module that knows how to talk to the API',
      body: [
        'Put all of it in one [[api-client|API client]]: a `request()` helper that adds the base URL, JSON headers and credentials, checks `res.ok`, and parses the response — plus named functions like `api.todos.list()`.',
        'Components now say **what** they want, not **how** to get it.',
      ],
      code: { file: 'api.js', lang: 'js', code: clientCode, hl: [3, 7, 11, 15, 16, 17] },
      changes: ['+ api.js owns URLs, headers, credentials and errors', '~ Components call api.todos.list() instead of fetch'],
      metrics: { places: 1, errors: 'yes' },
      scene: { nodes: { ...comps, client: { ...client, state: 'active' }, server }, links: via, flows: calls() },
    },
    {
      short: 'Base URL',
      beat: 'technique',
      title: 'One base URL, set per environment',
      body: [
        'In development, Vite proxies `/api` to Express, so the base is just `/api`. In production the API might live on `api.todo-app.com`. Read it from `VITE_API_URL` — one setting, no code changes.',
        '`credentials: \'include\'` sends the session cookie to the API even when it’s on another origin (which then also needs CORS with `credentials: true`).',
      ],
      code: { file: '.env.production', lang: 'bash', code: `VITE_API_URL=https://api.todo-app.com/api   # public: it's just a URL`, hl: [1] },
      metrics: { places: 1, errors: 'yes' },
      scene: { nodes: { ...comps, client: { ...client, sub: 'VITE_API_URL' }, server: { ...server, sub: 'api.todo-app.com' } }, links: via, flows: calls() },
    },
    {
      short: 'Errors',
      beat: 'technique',
      title: 'Failures become exceptions with details',
      body: [
        'When `res.ok` is false, the client throws an `ApiError` carrying the status and the server’s error body. Every component handles failures the same way: `try/catch`, or the `error` from a query hook.',
        'Forms can show `error.body.errors` next to fields; a `404` can show “not found”; a `5xx` a generic retry message.',
      ],
      code: {
        file: 'api.js',
        lang: 'js',
        code: `export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error?.message ?? \`Request failed (\${status})\`);
    this.status = status;
    this.body = body;
  }
}`,
        hl: [3, 4],
      },
      metrics: { places: 1, errors: 'yes' },
      scene: {
        nodes: { ...patch(comps, { c2: { badge: { text: 'shows field errors', tone: 'client' } } }), client, server },
        links: via,
        flows: [flow(['c2', 'client', 'server'], { kind: 'data', label: ['create("")', 'POST'], back: 'err', backLabel: ['400 + errors', 'ApiError(400)'], every: 4.6 })],
      },
    },
    {
      short: 'Expired session',
      beat: 'technique',
      title: 'Handle an expired session in one place',
      body: [
        'Sessions and access tokens expire. Instead of every component noticing `401`, the client does it once: on `401`, call the refresh endpoint and retry the original request; if that fails too, send the user to the login page.',
        'Components never know it happened.',
      ],
      check: {
        q: 'Ten components call the API, and the session can expire at any moment. Where should the 401 be handled?',
        options: ['In each component’s catch block', 'In the API client, once for every request', 'On the server, by never returning 401', 'In a timer that refreshes every minute'],
        answer: 1,
        explain: 'The client sees every response, so one check there covers all ten components — and any added later.',
      },
      code: {
        file: 'api.js',
        lang: 'js',
        code: `if (res.status === 401 && !retried) {
  const ok = await fetch(BASE + '/refresh', { method: 'POST', credentials: 'include' });
  if (ok.ok) return request(path, { ...options, retried: true }); // try once more
  window.location.assign('/login');
}`,
        hl: [1, 3, 4],
      },
      metrics: { places: 1, errors: 'yes' },
      scene: {
        nodes: { ...comps, client: { ...client, badge: { text: '401 → refresh → retry', tone: 'auth' } }, server, refresh },
        links: [...via, link('client', 'refresh')],
        flows: [
          flow(['c1', 'client', 'server'], { label: ['list()', 'GET'], back: 'err', backLabel: ['401', 'expired'], every: 7 }),
          flow(['client', 'refresh'], { kind: 'auth', label: 'refresh', back: 'auth', backLabel: 'new cookie', every: 7, offset: 2.6 }),
          flow(['client', 'server'], { label: 'retry GET', back: 'res', backLabel: 'todos', every: 7, offset: 4.6 }),
        ],
      },
    },
    {
      short: 'Cancel',
      beat: 'technique',
      title: 'Let callers cancel what they no longer need',
      body: [
        'Pass an `AbortSignal` through the client to `fetch`. When a component unmounts, or a search query changes before the last one answered, the old request is cancelled instead of racing the new one.',
        'Query libraries hand you a `signal` for exactly this — the client just forwards it.',
      ],
      code: {
        file: 'TodoList.jsx',
        lang: 'jsx',
        code: `useQuery({
  queryKey: ['todos'],
  queryFn: ({ signal }) => api.todos.list({ signal }), // cancelled if no longer needed
});`,
        hl: [3],
      },
      metrics: { places: 1, errors: 'yes' },
      scene: {
        nodes: { ...patch(comps, { c1: { badge: { text: 'unmounted', tone: 'neutral' }, state: 'dim' } }), client, server },
        links: via,
        flows: [flow(['c1', 'client', 'server'], { label: ['list({ signal })', 'GET'], fail: true, every: 4, speed: 0.6 }), calls()[1]],
      },
    },
    {
      short: 'With a cache',
      beat: 'insight',
      title: 'The client and the query cache are a pair',
      body: [
        'The API client knows **how** to talk to the server; the query cache (TanStack Query) knows **when**, and what to keep. `queryFn: api.todos.list` is all the glue you need.',
        'Going further, a shared folder of Zod schemas can validate the same shapes on both sides — the server’s input checks and the client’s form checks from one definition.',
      ],
      metrics: { places: 1, errors: 'yes' },
      scene: {
        nodes: { ...comps, cache: box(480, 140, 'Query cache', { sub: "['todos']", icon: 'layers', tone: 'client', w: 190 }), client, server },
        links: [link('c1', 'cache'), link('cache', 'client'), link('c2', 'client'), link('c3', 'client'), link('client', 'server')],
        flows: [flow(['c1', 'cache', 'client', 'server'], { label: ['useTodos()', 'queryFn', 'GET'], back: 'res', every: 5 })],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Talking to your API, cleanly',
      body: [
        'Components shouldn’t know URLs, headers or status codes. One {client:API client} module owns them: base URL from env, credentials, JSON, `res.ok`.',
        'Failures become `ApiError`s with status and body; 401s are refreshed-and-retried (or sent to login) in one place; signals flow through for cancellation.',
        'Pair it with a query cache, and consider sharing validation schemas with the server.',
      ],
      metrics: { places: 1, errors: 'yes' },
      scene: { nodes: { ...comps, client, server }, links: via, flows: calls() },
    },
  ],
});
