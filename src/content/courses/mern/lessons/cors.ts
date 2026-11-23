import { box, browser, chip, defineLesson, flow, link, patch, zone } from '@/content/dsl';
import type { ScreenLine } from '@/engine/types';

/* ---------- layout: your browser (with its CORS check) on the left, servers on the right ---------- */
const loaded: ScreenLine[] = [
  { t: 'h', text: 'My todos' },
  { t: 'item', text: 'Buy milk' },
  { t: 'item', text: 'Learn MERN' },
];
const blocked: ScreenLine[] = [
  { t: 'h', text: 'My todos' },
  { t: 'error', text: 'TypeError: Failed to fetch' },
  { t: 'text', text: 'Console: blocked by CORS policy' },
];

const zb = zone(235, 300, 420, 400, 'Your browser', { tone: 'client', icon: 'browser' });
const page = browser(150, 300, { w: 200, h: 180, url: 'localhost:5173', screen: loaded });
const guard = chip(355, 300, 'CORS check', { tone: 'auth', icon: 'shield', w: 132 });
const vite = box(825, 110, 'Vite dev server', { sub: 'localhost:5173', icon: 'bolt', tone: 'client', w: 210 });
const api = box(825, 300, 'Express API', { sub: 'localhost:5000', icon: 'express', tone: 'server', w: 210 });
const evil = box(825, 490, 'evil.example', { sub: 'a tab you opened', icon: 'bug', tone: 'danger', w: 210 });

const base = { zb, page, guard, vite, api };
const links = [link('page', 'guard'), link('guard', 'vite'), link('guard', 'api')];

const rejected = (label = 'GET /api/todos', every = 4.6) => [
  flow(['page', 'guard', 'api'], { label: ['fetch', label], every }),
  flow(['api', 'guard'], { kind: 'res', label: '200 OK · JSON', fail: true, every, offset: 1.95 }),
];

const corsCode = `import cors from 'cors';

app.use(cors({
  origin: ['http://localhost:5173', 'https://todo-app.com'],
  credentials: true, // only if the browser sends cookies
}));`;

export default defineLesson({
  metrics: [
    { id: 'server', label: 'Server answered' },
    { id: 'read', label: 'JS can read it' },
  ],
  legend: { data: 'preflight' },
  goals: [
    { text: 'Why the request “works” but still fails', step: 2 },
    { text: 'What an origin is', step: 3 },
    { text: 'What the same-origin policy protects', step: 4 },
    { text: 'How the server allows other origins', step: 5 },
    { text: 'What a preflight is', step: 6 },
    { text: 'Skipping CORS with a proxy', step: 7 },
  ],
  steps: [
    {
      short: 'Two servers',
      beat: 'setup',
      title: 'In development, you run two servers',
      body: [
        '**Vite** serves your React app on `localhost:5173`. **Express** serves the API on `localhost:5000`. The browser loads the page from the first one without any trouble.',
        'Then React calls the API on the second one…',
      ],
      metrics: { server: '—', read: '—' },
      scene: {
        nodes: base,
        links,
        flows: [flow(['page', 'guard', 'vite'], { label: 'GET /', back: 'res', backLabel: 'index.html', every: 4 })],
      },
    },
    {
      short: 'Blocked',
      beat: 'problem',
      title: 'Blocked by CORS policy',
      body: [
        'The console turns red. Here’s the surprising part: the request **did** reach Express, and Express **did** answer `200` with your todos.',
        'It’s the *browser* that refuses to hand the response to your JavaScript. That’s why the same URL works in Postman, `curl`, or by pasting it in the address bar.',
      ],
      callout: { kind: 'insight', text: 'CORS errors are enforced by the browser, about reading responses. Changing your fetch code won’t fix them; the server has to opt in.' },
      code: {
        lang: 'text',
        file: 'Console',
        code: `Access to fetch at 'http://localhost:5000/api/todos'
from origin 'http://localhost:5173' has been blocked by
CORS policy: No 'Access-Control-Allow-Origin' header is
present on the requested resource.`,
        err: [1, 2, 3, 4],
      },
      metrics: { server: 'yes', read: 'no' },
      scene: {
        nodes: patch(base, {
          page: { screen: blocked, state: 'error' },
          guard: { state: 'error', badge: { text: 'blocked', tone: 'danger' } },
          api: { state: 'active', badge: { text: '200 sent', tone: 'ok' } },
        }),
        links,
        flows: rejected(),
      },
    },
    {
      short: 'Origins',
      beat: 'technique',
      title: 'Different port, different origin',
      body: [
        'An [[origin]] is three things together: **scheme** (`http`/`https`), **host**, and **port**. Change any one of them and it’s a different origin.',
        'The page came from `:5173`; the API lives on `:5000`. Same machine, but as far as the browser is concerned, two different websites.',
      ],
      code: {
        lang: 'text',
        file: 'page origin → request URL',
        code: `http://localhost:5173 → http://localhost:5173/api   same origin ✓
http://localhost:5173 → http://localhost:5000/api   other port   ✗
http://todo-app.com   → https://todo-app.com/api    other scheme ✗
https://todo-app.com  → https://api.todo-app.com    other host   ✗`,
        hl: [1],
        err: [2],
      },
      metrics: { server: 'yes', read: 'no' },
      scene: {
        nodes: patch(base, {
          o1: chip(150, 450, 'origin  http://localhost:5173', { tone: 'client', w: 230 }),
          o2: chip(825, 400, 'origin  http://localhost:5000', { tone: 'server', w: 230 }),
          api: { state: 'active' },
          guard: { state: 'active', label: '5173 ≠ 5000' },
        }),
        links,
        flows: rejected(),
      },
    },
    {
      short: 'Why?',
      beat: 'insight',
      title: 'Why browsers are so strict',
      body: [
        'Your browser carries your identity: when it talks to a site, it attaches that site’s [[cookie|cookies]] automatically. So imagine *any* page could read *any* response.',
        'You open `evil.example` in another tab. Its JavaScript calls your API — your login cookie goes along — and reads your private data. The [[same-origin-policy|same-origin policy]] stops exactly that: a page can only **read** responses from its own origin, unless that server says otherwise.',
      ],
      metrics: { server: 'yes', read: 'no' },
      scene: {
        nodes: patch({ ...base, evil: { ...evil, state: 'active' } }, {
          page: { url: 'evil.example', screen: [{ t: 'h', text: 'Win a prize!' }, { t: 'btn', text: 'Claim' }], tone: 'danger' },
          guard: { state: 'ok', badge: { text: 'protects you', tone: 'ok' } },
          api: { badge: { text: 'sees your cookie', tone: 'warn' } },
          vite: { state: 'dim' },
        }),
        links: [...links, link('evil', 'page', { route: 'hv', style: 'dashed', label: 'script runs in your tab', tone: 'danger' })],
        flows: [
          flow(['page', 'guard', 'api'], { kind: 'auth', label: ['fetch', 'GET /api/me + cookie'], every: 4.6 }),
          flow(['api', 'guard'], { kind: 'res', label: 'your data', fail: true, every: 4.6, offset: 1.95 }),
        ],
      },
    },
    {
      short: 'Allow it',
      beat: 'solution',
      title: 'The server opts in with a header',
      body: [
        '[[cors|CORS]] is how a server says *“these other origins may read my responses”*. It adds an `Access-Control-Allow-Origin` header naming your front end, and the browser lets the response through.',
        'In Express, the `cors` package adds the headers for you. List your real origins — development and production.',
      ],
      callout: { kind: 'mistake', text: '`origin: \'*\'` lets every website read your API, and it can’t be combined with cookies anyway. Name the origins you actually use.' },
      code: { file: 'server.js', lang: 'js', code: corsCode, hl: [3, 4, 5, 6] },
      changes: ['+ Response header: Access-Control-Allow-Origin: http://localhost:5173'],
      metrics: { server: 'yes', read: 'yes' },
      scene: {
        nodes: patch(base, { guard: { state: 'ok', label: 'allowed ✓' }, api: { badge: { text: '+ CORS headers', tone: 'server' } } }),
        links,
        flows: [flow(['page', 'guard', 'api'], { label: ['fetch', 'GET /api/todos'], back: 'res', backLabel: ['Allow-Origin: :5173', 'todos'], every: 4.6 })],
      },
    },
    {
      short: 'Preflight',
      beat: 'technique',
      title: 'Preflight: asking permission first',
      body: [
        'For requests that could change things — JSON bodies, `PUT`/`DELETE`, an `Authorization` header — the browser first sends an automatic `OPTIONS` [[preflight]]: *“may this origin send a POST with these headers?”*',
        'Only if the answer allows it does the real request go out. The `cors` middleware answers preflights for you.',
      ],
      check: {
        q: 'Which of these makes the browser send a preflight first?',
        options: ['A plain `GET` with no custom headers', 'A `POST` with `Content-Type: application/json`', 'An `<img>` tag loading a picture', 'Clicking an ordinary link'],
        answer: 1,
        explain: 'A JSON content type isn’t one of the few “simple” request types, so the browser checks first. Plain GETs, images and link clicks never preflight.',
      },
      code: {
        lang: 'http',
        file: 'preflight',
        code: `OPTIONS /api/todos HTTP/1.1
Origin: http://localhost:5173
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type

HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET,POST,PUT,DELETE
Access-Control-Allow-Headers: content-type`,
        hl: [1, 6],
      },
      metrics: { server: 'yes', read: 'yes' },
      scene: {
        nodes: patch(base, { guard: { state: 'active', label: 'preflight' } }),
        links,
        flows: [
          flow(['page', 'guard', 'api'], { kind: 'data', label: ['POST?', 'OPTIONS'], back: 'data', backLabel: ['204 allowed', 'ok'], every: 6.4 }),
          flow(['page', 'guard', 'api'], { label: ['fetch', 'POST /api/todos'], back: 'res', backLabel: ['201', '201 Created'], every: 6.4, offset: 3.2 }),
        ],
      },
    },
    {
      short: 'Proxy',
      beat: 'tradeoff',
      title: 'Or avoid cross-origin entirely',
      body: [
        'In development, let Vite **proxy** `/api` to Express. The browser only ever talks to `:5173`, so every request is same-origin: no CORS headers, no preflights.',
        'In production, the same idea: serve the React build and the API from one domain (Express serving the static files, or a reverse proxy routing `/api`). Use CORS when the front end and API genuinely live on different origins.',
      ],
      code: {
        file: 'vite.config.js',
        lang: 'js',
        code: `export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:5000' },
  },
});`,
        hl: [4],
      },
      metrics: { server: 'yes', read: 'yes' },
      scene: {
        nodes: patch(base, { guard: { state: 'ok', label: 'same origin ✓' }, vite: { state: 'active', sub: '/api → :5000' } }),
        links: [...links.filter((l) => l.to !== 'api'), link('vite', 'api'), link('guard', 'api', { state: 'off' })],
        flows: [flow(['page', 'guard', 'vite', 'api'], { label: ['fetch', 'GET /api/todos', 'proxied'], back: 'res', backLabel: ['todos', 'todos', 'todos'], every: 5 })],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'CORS, demystified',
      body: [
        'An {client:origin} is scheme + host + port. Pages may only **read** responses from their own origin.',
        'That rule lives in the {auth:browser} and protects users from other sites riding on their cookies.',
        'Fix it on the {server:server}: send `Access-Control-Allow-Origin` for your real front-end origins (the `cors` package) — or make it same-origin with a proxy.',
      ],
      metrics: { server: 'yes', read: 'yes' },
      scene: {
        nodes: patch(base, { guard: { state: 'ok', label: 'allowed ✓' } }),
        links,
        flows: [flow(['page', 'guard', 'api'], { label: ['fetch', 'GET /api/todos'], back: 'res', backLabel: ['todos', 'Allow-Origin ✓'], every: 4.6 })],
      },
    },
  ],
});
