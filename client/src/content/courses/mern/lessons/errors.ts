import { box, browser, db, defineLesson, flow, item, link, patch, stack } from '@/content/dsl';
import type { Item, LinkSpec, ScreenLine } from '@/engine/types';

/* ---------- layout: client left; route above the error handler; database and logs on the right ---------- */
const form = (msg?: ScreenLine): ScreenLine[] => [
  { t: 'h', text: 'My todos' },
  { t: 'input', text: 'New todo…', placeholder: true },
  { t: 'btn', text: 'Add', state: 'active' },
  ...(msg ? [msg] : [{ t: 'item', text: 'Buy milk' } as ScreenLine]),
];

const web = browser(130, 300, { w: 210, h: 192, url: 'todo-app.com', screen: form() });
const route = box(440, 160, 'POST /api/todos', { sub: 'route handler', icon: 'express', tone: 'server', w: 220 });
const errH = box(440, 430, 'errorHandler', { sub: '(err, req, res, next)', icon: 'bug', tone: 'danger', w: 236 });
const mongo = db(800, 160, 'MongoDB', { items: ['todos'], w: 140, h: 104 });
const logs = stack(800, 425, 'Server log', [], { w: 300, h: 230, from: 'top', mono: true, icon: 'terminal', empty: 'quiet' });

const base = { web, route, errH, mongo, logs };
const links: LinkSpec[] = [
  link('web', 'route'),
  link('route', 'mongo'),
  link('route', 'errH', { tone: 'danger' }),
  link('errH', 'web', { style: 'dashed' }),
  link('errH', 'logs', { style: 'dashed' }),
];
const log = (...lines: [string, string, Item['tone']?][]) => ({ items: lines.map(([id, text, tone]) => item(id, text, { tone: tone ?? 'neutral' })) });

/** A request that fails at `at` and comes back through the error handler. */
const failing = (label: string, at: 'route' | 'mongo', why: string, status: string, o: Parameters<typeof flow>[1] = {}) =>
  at === 'mongo'
    ? flow(['web', 'route', 'mongo'], { kind: 'data', label: [label, 'insertOne'], back: 'err', returnVia: ['mongo', 'route', 'errH', 'web'], backLabel: [why, 'next(err)', status], every: 5.6, ...o })
    : flow(['web', 'route'], { kind: 'data', label, back: 'err', returnVia: ['route', 'errH', 'web'], backLabel: [why, status], every: 5.6, ...o });

const handlerCode = `app.use((err, req, res, next) => {
  let status = err.status ?? 500;
  if (err.name === 'ValidationError') status = 400; // Mongoose schema
  if (err.name === 'CastError') status = 400;       // malformed ObjectId
  if (err.code === 11000) status = 409;             // duplicate key

  if (status >= 500) logger.error({ err, requestId: req.id });
  res.status(status).json({
    error: {
      message: status >= 500 ? 'Something went wrong' : err.message,
      requestId: req.id,
    },
  });
});`;

export default defineLesson({
  metrics: [
    { id: 'status', label: 'Status' },
    { id: 'user', label: 'User sees' },
    { id: 'logged', label: 'Logged for you' },
  ],
  goals: [
    { text: 'Why stack traces must not reach users', step: 2 },
    { text: 'Operational errors vs bugs', step: 3 },
    { text: 'Errors that carry their own status', step: 4 },
    { text: 'One handler that maps every error', step: 5 },
    { text: 'When the process should crash', step: 7 },
    { text: 'Handling errors in React', step: 8 },
  ],
  steps: [
    {
      short: 'Happy path',
      beat: 'setup',
      title: 'Every request can fail',
      body: [
        'So far we’ve mostly followed requests that work. In production, plenty don’t: empty input, a todo that was already deleted, a duplicate email, a database that times out, and plain bugs in our code.',
        'For each one we need to decide: what does the **user** see, and what do **we** get to debug it?',
      ],
      metrics: { status: '201', user: 'Saved ✓', logged: '—' },
      scene: {
        nodes: base,
        links,
        flows: [flow(['web', 'route', 'mongo'], { kind: 'data', label: ['POST { text }', 'insertOne'], back: 'res', backLabel: ['saved', '201'], every: 4.4 })],
      },
    },
    {
      short: 'Stack trace',
      beat: 'problem',
      title: 'The default: your internals, on the user’s screen',
      body: [
        'Throw without handling it and Express’s built-in handler answers `500` — in development with the full [[stack-trace|stack trace]]: file paths, line numbers, library names.',
        'Users can’t act on it, and attackers learn how your server is built. Meanwhile every kind of failure looks the same: “500”, whether the user typed nothing or the database is on fire.',
      ],
      callout: { kind: 'mistake', text: 'Never send stack traces or raw error messages to clients in production. Log them; send a short, safe message.' },
      code: {
        lang: 'http',
        file: 'what the browser got',
        code: `HTTP/1.1 500 Internal Server Error

TypeError: Cannot read properties of undefined (reading 'text')
    at createTodo (/app/src/routes/todos.js:14:32)
    at Layer.handle (/app/node_modules/express/lib/router/layer.js:95:5)`,
        err: [3, 4, 5],
      },
      metrics: { status: '500', user: 'a stack trace', logged: 'no' },
      scene: {
        nodes: patch(base, {
          route: { state: 'error', badge: { text: 'TypeError', tone: 'danger' } },
          errH: { state: 'dim', label: 'Express default' },
          web: { screen: form({ t: 'error', text: 'TypeError at routes/todos.js:14:32' }), state: 'error' },
        }),
        links,
        flows: [flow(['web', 'route'], { kind: 'data', label: 'POST { }', back: 'err', backLabel: '500 + stack trace', every: 4 })],
      },
    },
    {
      short: 'Two kinds',
      beat: 'insight',
      title: 'Two kinds of errors',
      body: [
        '**[[operational-error|Operational errors]]** are expected: invalid input, not logged in, no such todo, duplicate email, a timeout. They aren’t bugs — answer with the right 4xx (or 503) and a message the user can act on.',
        '**Programmer errors** are bugs: `undefined` is not a function, a forgotten `await`. The user gets a generic `500`; *you* get the details, an alert, and a fix to write.',
      ],
      metrics: { status: '400 · 500', user: 'a clear message', logged: 'bugs only' },
      scene: {
        nodes: patch(base, {
          logs: log(['l1', '400 text is required', 'warn'], ['l2', '500 TypeError: …todos.js:14', 'danger'], ['l3', '    stack trace …', 'danger']),
          errH: { state: 'active' },
        }),
        links,
        flows: [
          failing('POST { text: "" }', 'route', 'invalid input', '400 Text is required', { offset: 0 }),
          failing('POST { text }', 'route', 'TypeError (bug)', '500 Something went wrong', { offset: 2.8 }),
        ],
      },
    },
    {
      short: 'AppError',
      beat: 'technique',
      title: 'Errors that know their own status',
      body: [
        'Make operational errors carry everything the response needs: an HTTP status, a stable code for the front end, and a human message. A small `AppError` class does it.',
        'Routes just `throw` it. In Express 5, a throw — or a rejected `await` — inside a handler goes straight to your error handler.',
      ],
      code: {
        file: 'errors.js',
        lang: 'js',
        code: `export class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;   // 404
    this.code = code;       // 'TODO_NOT_FOUND'
  }
}

// in a route
const todo = await Todo.findById(req.params.id);
if (!todo) throw new AppError(404, 'TODO_NOT_FOUND', 'That todo no longer exists');`,
        hl: [4, 5, 11],
      },
      metrics: { status: '404', user: 'That todo no longer exists', logged: 'no (expected)' },
      scene: {
        nodes: patch(base, {
          route: { label: 'PATCH /api/todos/:id', badge: { text: 'throw AppError(404)', tone: 'warn' } },
          errH: { state: 'active' },
          web: { screen: form({ t: 'error', text: 'That todo no longer exists' }) },
        }),
        links,
        flows: [
          flow(['web', 'route', 'mongo'], {
            kind: 'data',
            label: ['PATCH /api/todos/99', 'findById'],
            back: 'err',
            returnVia: ['mongo', 'route', 'errH', 'web'],
            backLabel: ['null', 'AppError(404)', '404'],
            every: 5.6,
          }),
        ],
      },
    },
    {
      short: 'One handler',
      beat: 'technique',
      title: 'One handler turns any error into a response',
      body: [
        'The error handler is the single place that decides responses. It reads the status from `AppError`s and translates library errors too: a Mongoose `ValidationError` becomes `400`, a malformed id `400`, a duplicate key `409`.',
        'Anything it doesn’t recognise is a bug: `500`, a generic message, and a full log entry.',
      ],
      code: { file: 'middleware/errorHandler.js', lang: 'js', code: handlerCode, hl: [3, 4, 5, 10] },
      metrics: { status: '400 · 409 · 500', user: 'a clear message', logged: 'bugs only' },
      scene: {
        nodes: patch(base, {
          errH: { state: 'active', badge: { text: 'maps errors → status', tone: 'danger' } },
          logs: log(['l1', '500 req_8f2c TypeError …', 'danger']),
        }),
        links,
        flows: [
          failing('POST { text: "" }', 'mongo', 'ValidationError', '400', { offset: 0 }),
          failing('POST { email }', 'mongo', 'E11000 duplicate', '409', { offset: 1.9, label: ['POST /signup', 'insertOne'] }),
          failing('POST { text }', 'route', 'TypeError', '500', { offset: 3.8 }),
        ],
      },
    },
    {
      short: 'Request ids',
      beat: 'technique',
      title: 'Log the details, give the user a reference',
      body: [
        'Give every request an id (middleware can generate one) and put it in **both** the log line and the error response. The user sees “Something went wrong (ref req_8f2c)”; you search the logs for `req_8f2c` and find the exact stack trace.',
        'Log as structured JSON — time, level, request id, route, user id — so you can filter and alert on it later.',
      ],
      code: {
        file: 'middleware/requestId.js',
        lang: 'js',
        code: `import { randomUUID } from 'node:crypto';

export function requestId(req, res, next) {
  req.id = req.headers['x-request-id'] ?? randomUUID().slice(0, 8);
  res.setHeader('x-request-id', req.id);
  next();
}`,
        hl: [4, 5],
      },
      metrics: { status: '500', user: 'Something went wrong (ref req_8f2c)', logged: 'yes, with ref' },
      scene: {
        nodes: patch(base, {
          web: { screen: form({ t: 'error', text: 'Something went wrong (ref req_8f2c)' }) },
          logs: log(
            ['l1', '{ level: "error",', 'danger'],
            ['l2', '  requestId: "req_8f2c",', 'danger'],
            ['l3', '  route: "POST /api/todos",', 'danger'],
            ['l4', '  err: "TypeError …:14:32" }', 'danger'],
          ),
          errH: { state: 'active' },
        }),
        links,
        flows: [
          failing('POST { text }', 'route', 'TypeError', '500 · ref req_8f2c'),
          flow(['errH', 'logs'], { kind: 'err', label: 'stack + req_8f2c', every: 5.6, offset: 1.9 }),
        ],
      },
    },
    {
      short: 'Crashes',
      beat: 'problem',
      title: 'Errors nobody catches crash the process',
      body: [
        'Some errors happen outside any request: a timer callback that throws, a background job with an [[unhandled-rejection|unhandled rejection]]. There’s no route and no error handler to catch them, and Node exits.',
        'That’s actually the safe choice — after an unknown error, the process may be in a broken state. Log it, exit, and let your platform or process manager start a fresh one in a second.',
      ],
      callout: { kind: 'tip', text: 'Run Node under something that restarts it: your hosting platform, Docker’s restart policy, or a process manager. Then crashes cost a second, not an outage.' },
      code: {
        file: 'server.js',
        lang: 'js',
        code: `process.on('unhandledRejection', (err) => {
  logger.fatal({ err }, 'unhandled rejection');
  process.exit(1); // the platform restarts a clean process
});`,
        hl: [2, 3],
      },
      metrics: { status: '502 (briefly)', user: 'retry in a moment', logged: 'yes, fatal' },
      scene: {
        nodes: patch(base, {
          route: { state: 'error', label: 'process exited', sub: 'restarting…', badge: { text: 'crash', tone: 'danger' } },
          errH: { state: 'dim' },
          mongo: { state: 'dim' },
          logs: log(['l1', 'FATAL unhandled rejection', 'danger'], ['l2', 'process exited (code 1)', 'danger'], ['l3', 'restarted in 1.2 s ✓', 'ok']),
        }),
        links,
        flows: [flow(['web', 'route'], { kind: 'data', label: 'POST', fail: true, every: 3.2 })],
      },
    },
    {
      short: 'In React',
      beat: 'technique',
      title: 'On the client: expect failure',
      body: [
        '`fetch` only rejects when the network fails. A `400` or `500` **resolves** normally, so always check `res.ok`, then read the error body and show its message next to the form.',
        'Keep what the user typed, disable the button while saving, and offer a retry for network errors and `5xx` — never for a `400`, which will just fail again.',
      ],
      check: {
        q: '`await fetch(\'/api/todos\', …)` gets a `500` response. What happens?',
        options: ['The promise rejects with an Error', 'It resolves; `res.ok` is `false`', 'It returns `null`', 'React shows an error boundary'],
        answer: 1,
        explain: 'An HTTP error is still a successful round trip. `fetch` resolves with a Response whose `ok` is false and `status` is 500 — checking it is up to you.',
      },
      code: {
        file: 'AddTodo.jsx',
        lang: 'jsx',
        code: `const res = await fetch('/api/todos', { method: 'POST', headers, body });
if (!res.ok) {
  const { error } = await res.json();
  setMessage(error.message);   // "Text is required"
  return;                      // keep the user's input
}`,
        hl: [2, 3, 4],
      },
      metrics: { status: '400', user: 'Text is required', logged: 'no (expected)' },
      scene: {
        nodes: patch(base, { web: { screen: form({ t: 'error', text: 'Text is required' }), state: 'active' }, errH: { state: 'active' } }),
        links,
        flows: [failing('POST { text: "" }', 'route', 'AppError(400)', '400 · error.message')],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Handling errors end to end',
      body: [
        '{warn:Operational errors} get the right 4xx and a message users can act on; {danger:bugs} get a generic 500 and a detailed log.',
        'Throw `AppError`s in routes; let {danger:one error handler} map every error (including Mongoose ones) to a response. Never leak stack traces.',
        'Tag requests with an id for logs and support. Let unknown crashes restart the process. In React, check `res.ok` and show the message.',
      ],
      metrics: { status: '4xx / 500', user: 'a clear message', logged: 'bugs, with ref' },
      scene: {
        nodes: patch(base, { errH: { state: 'active' }, logs: log(['l1', '500 req_8f2c TypeError …', 'danger']) }),
        links,
        flows: [failing('POST { text: "" }', 'route', 'AppError(400)', '400'), failing('POST { text }', 'route', 'TypeError', '500 · ref', { offset: 2.8 })],
      },
    },
  ],
});
