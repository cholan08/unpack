import { box, browser, code, defineLesson, flow, link, patch } from '@/content/dsl';
import type { NodeSpec } from '@/engine/types';

/* ---------- layout: browser ↔ server, the request above the wire, the response below ---------- */
const web = browser(120, 300, { w: 200, h: 170, url: 'todo-app.com', screen: [{ t: 'h', text: 'My todos' }, { t: 'item', text: 'Buy milk' }, { t: 'item', text: 'Learn MERN' }] });
const srv = box(880, 300, 'Server', { sub: 'todo-app.com', icon: 'server', tone: 'server', w: 190 });
const REQ = `POST /api/todos HTTP/1.1
Host: todo-app.com
Content-Type: application/json
Cookie: sid=a8f3…

{"text":"Buy milk"}`;
const RES = `HTTP/1.1 201 Created
Content-Type: application/json
Set-Cookie: theme=dark; Path=/
Cache-Control: no-store

{"_id":"6b04…","text":"Buy milk","done":false}`;
const req = (src = REQ, hl: number[] = []) => code(500, 148, src, { lang: 'http', file: 'request', w: 380, tone: 'client', icon: 'browser', hl });
const res = (src = RES, hl: number[] = []) => code(500, 458, src, { lang: 'http', file: 'response', w: 380, tone: 'server', icon: 'server', hl });

const base = (q: NodeSpec, r: NodeSpec): Record<string, NodeSpec> => ({ web, srv, req: q, res: r });
const links = [link('web', 'srv')];
const trip = (label = 'POST /api/todos', backLabel = '201 Created', o: Parameters<typeof flow>[1] = {}) =>
  flow(['web', 'srv'], { kind: 'data', label, back: 'res', backLabel, every: 3.8, ...o });

export default defineLesson({
  metrics: [
    { id: 'trips', label: 'Round trips' },
    { id: 'bytes', label: 'Response body', unit: 'KB', better: 'lower' },
  ],
  goals: [
    { text: 'The anatomy of a request and a response', step: 1 },
    { text: 'What headers are for', step: 3 },
    { text: 'Why Content-Type matters', step: 4 },
    { text: 'Caching with ETag and 304', step: 5 },
    { text: 'What HTTP/2 changed', step: 7 },
  ],
  steps: [
    {
      short: 'Plain text',
      beat: 'setup',
      title: 'A conversation in plain text',
      body: [
        'Under every `fetch` is HTTP: a short, human-readable message. The [[request]] starts with a line saying **what** you want (method + path), then headers, a blank line, and an optional body.',
        'The [[response]] mirrors it: a **status line**, headers, a blank line, and the body. That’s the whole protocol you build your API on.',
      ],
      metrics: { trips: 1, bytes: 0.1 },
      scene: { nodes: base(req(REQ, [1]), res(RES, [1])), links, flows: [trip()] },
    },
    {
      short: 'Methods',
      beat: 'technique',
      title: 'The method says what you want done',
      body: [
        'The first word is the [[http-method|method]]: `GET` to read, `POST` to create, `PUT`/`PATCH` to change, `DELETE` to remove. Servers route on method **and** path, so `GET /api/todos` and `POST /api/todos` are different endpoints.',
        '`GET` must never change anything — browsers prefetch links, crawlers follow them, and caches replay them.',
      ],
      code: {
        lang: 'http',
        file: 'same path, different meaning',
        code: `GET    /api/todos      → list
POST   /api/todos      → create
PATCH  /api/todos/42   → update part
DELETE /api/todos/42   → remove`,
      },
      metrics: { trips: 4, bytes: 0.1 },
      scene: {
        nodes: base(req(`GET /api/todos HTTP/1.1\nHost: todo-app.com`, [1]), res(`HTTP/1.1 200 OK\nContent-Type: application/json\n\n[{"text":"Buy milk"}, …]`, [1])),
        links,
        flows: [
          trip('GET', '200', { kind: 'req', every: 6 }),
          trip('POST', '201', { every: 6, offset: 1.5 }),
          trip('PATCH', '200', { every: 6, offset: 3 }),
          trip('DELETE', '204', { kind: 'req', every: 6, offset: 4.5 }),
        ],
      },
    },
    {
      short: 'Headers',
      beat: 'technique',
      title: 'Headers: metadata in both directions',
      body: [
        '[[http-header|Headers]] carry everything that isn’t the content itself: what format the body is in, what the client accepts, who you are (`Cookie`, `Authorization`), how long to cache, where to go next (`Location`).',
        'Your Express code reads them from `req.headers` and sets them with `res.set()` / `res.cookie()`. Middleware like CORS and auth is mostly header handling.',
      ],
      metrics: { trips: 1, bytes: 0.1 },
      scene: { nodes: base(req(REQ, [2, 3, 4]), res(RES, [2, 3, 4])), links, flows: [trip('headers →', '← headers')] },
    },
    {
      short: 'Bodies',
      beat: 'technique',
      title: 'Bodies come with a Content-Type',
      body: [
        'A body is just bytes. The [[content-type|Content-Type]] header tells the receiver how to read them: `application/json`, a classic form (`application/x-www-form-urlencoded`), or `multipart/form-data` for file uploads.',
        'Servers parse **according to that header**. `express.json()` only touches requests that say they’re JSON.',
      ],
      check: {
        q: 'You `fetch` with `body: JSON.stringify(todo)` but no `Content-Type` header. With `app.use(express.json())`, what is `req.body`?',
        options: ['The parsed todo object', 'Empty — the parser skipped it', 'The raw JSON string', 'A 415 error is sent automatically'],
        answer: 1,
        explain: 'Without a header, fetch labels a string body `text/plain`, so `express.json()` ignores it and `req.body` stays empty (`undefined` in Express 5). Always send `Content-Type: application/json`.',
      },
      metrics: { trips: 1, bytes: 0.1 },
      scene: {
        nodes: patch(base(req(`POST /api/todos HTTP/1.1\nContent-Type: text/plain;charset=UTF-8\n\n{"text":"Buy milk"}`, [2]), res(`HTTP/1.1 400 Bad Request\n\n{"error":"text is required"}`, [1])), {
          srv: { state: 'error', badge: { text: 'req.body is empty', tone: 'danger' } },
        }),
        links,
        flows: [trip('POST (text/plain)', '400', { back: 'err' })],
      },
    },
    {
      short: 'Caching',
      beat: 'technique',
      title: 'Caching: “has it changed?” costs almost nothing',
      body: [
        'A response can carry an [[etag|ETag]] — a fingerprint of its content. Next time, the browser sends it back as `If-None-Match`. If nothing changed, the server replies **`304 Not Modified`** with no body at all, and the browser reuses its copy.',
        '`Cache-Control` goes further: `max-age=60` lets the browser skip asking entirely for a minute.',
      ],
      metrics: { trips: 1, bytes: 0 },
      scene: {
        nodes: base(
          req(`GET /api/todos HTTP/1.1\nIf-None-Match: "a1f3"`, [2]),
          res(`HTTP/1.1 304 Not Modified\nETag: "a1f3"\nCache-Control: max-age=0, must-revalidate\n\n(no body — use your copy)`, [1, 5]),
        ),
        links,
        flows: [trip('If-None-Match: "a1f3"', '304 (no body)', { kind: 'req', speed: 1.3 })],
      },
    },
    {
      short: 'Cookies',
      beat: 'technique',
      title: 'Cookies: the server asks, the browser remembers',
      body: [
        'A response can include `Set-Cookie`. The browser stores it and attaches it as a `Cookie` header to **every later request** to that site — automatically, until it expires.',
        'That’s how sessions and auth cookies work, and why flags like `HttpOnly`, `Secure` and `SameSite` matter so much (see the auth lessons).',
      ],
      metrics: { trips: 2, bytes: 0.1 },
      scene: {
        nodes: base(req(`GET /api/me HTTP/1.1\nCookie: sid=a8f3…; theme=dark`, [2]), res(`HTTP/1.1 200 OK\nSet-Cookie: sid=a8f3…; HttpOnly; SameSite=Lax\n\n{"name":"Ana"}`, [2])),
        links,
        flows: [trip('POST /login', 'Set-Cookie', { kind: 'auth', every: 5 }), trip('Cookie: sid=…', '200', { kind: 'auth', every: 5, offset: 2.5 })],
      },
    },
    {
      short: 'HTTP/2',
      beat: 'insight',
      title: 'HTTP/1.1, HTTP/2 and HTTP/3',
      body: [
        'HTTP/1.1 sends one request at a time per connection, so browsers opened ~6 connections per site and queued the rest. [[http2|HTTP/2]] keeps the same methods and headers but **multiplexes** many requests over one connection at once, with compressed headers.',
        'HTTP/3 runs the same idea over QUIC (on UDP), so one lost packet no longer stalls every stream. Your Express code doesn’t change — the host or CDN usually handles it.',
      ],
      metrics: { trips: 1, bytes: 182 },
      scene: {
        nodes: patch(base(req(`GET /assets/app.js\nGET /assets/app.css\nGET /api/todos\nGET /api/me\nGET /logo.svg`, []), res(`HTTP/2 200  (stream 1)\nHTTP/2 200  (stream 3)\nHTTP/2 200  (stream 5)\n… all on one connection`, [])), {
          srv: { label: 'HTTP/2 server', sub: 'one connection' },
        }),
        links,
        flows: ['app.js', 'app.css', '/api/todos', '/api/me', 'logo.svg'].map((l, i) => flow(['web', 'srv'], { kind: 'req', label: l, back: 'res', every: 3.6, offset: i * 0.22 })),
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'HTTP, in one picture',
      body: [
        'A {client:request} is a method + path, headers and an optional body; a {server:response} is a status line, headers and a body.',
        'Headers do the heavy lifting: `Content-Type` decides how bodies are parsed, `ETag`/`Cache-Control` avoid re-downloading, `Set-Cookie`/`Cookie` carry identity.',
        'HTTP/2 and 3 change the wire, not the meaning — your API stays the same.',
      ],
      metrics: { trips: 1, bytes: 0.1 },
      scene: { nodes: base(req(REQ, [1, 3]), res(RES, [1, 2])), links, flows: [trip()] },
    },
  ],
});
