import { box, browser, db, defineLesson, flow, link, patch, zone } from '@/content/dsl';
import type { ScreenLine } from '@/engine/types';

/* ---------- layout: client on the left, the pipeline as a column, database on the right ---------- */
const X = 500;
const loaded: ScreenLine[] = [
  { t: 'h', text: 'My todos' },
  { t: 'item', text: 'Buy milk' },
  { t: 'item', text: 'Learn MERN' },
];
const loading: ScreenLine[] = [{ t: 'h', text: 'My todos' }, { t: 'spinner', text: 'Loading…' }];

const app = zone(X, 312, 300, 568, 'Express app', { tone: 'server', icon: 'server' });
const web = browser(140, 300, { w: 210, h: 170, url: 'localhost:5173', screen: loaded });
const json = box(X, 95, 'express.json()', { sub: 'parse JSON bodies', icon: 'json', tone: 'server', w: 236 });
const log = box(X, 195, 'logger', { sub: 'log method + path', icon: 'terminal', tone: 'server', w: 236 });
const auth = box(X, 295, 'requireAuth', { sub: 'check the token', icon: 'shield', tone: 'auth', w: 236 });
const route = box(X, 395, 'GET /api/todos', { sub: 'route handler', icon: 'express', tone: 'server', w: 236 });
const errH = box(X, 527, 'errorHandler', { sub: '(err, req, res, next)', icon: 'bug', tone: 'danger', w: 236 });
const mongo = db(855, 395, 'MongoDB', { items: ['todos'], w: 150, h: 112 });

const pipeline = { app, web, json, log, auth, route, mongo };
const chain = [link('web', 'json'), link('json', 'log'), link('log', 'auth'), link('auth', 'route'), link('route', 'mongo'), link('route', 'web', { style: 'dashed' })];
const fullTrip = (o: Partial<Parameters<typeof flow>[1]> = {}) =>
  flow(['web', 'json', 'log', 'auth', 'route', 'mongo'], {
    label: ['GET /api/todos', 'GET /api/todos', 'GET /api/todos', 'GET /api/todos', 'find()'],
    back: 'res',
    returnVia: ['mongo', 'route', 'web'],
    backLabel: ['todos', '200 OK'],
    every: 5.2,
    ...o,
  });

const useCode = `const app = express();

app.use(express.json());   // 1 · parse JSON bodies
app.use(logger);           // 2 · log every request
app.use(requireAuth);      // 3 · turn strangers away

app.get('/api/todos', async (req, res) => {
  res.json(await Todo.find());   // 4 · just the real work
});`;

export default defineLesson({
  metrics: [
    { id: 'ran', label: 'Functions that ran' },
    { id: 'status', label: 'Response' },
  ],
  goals: [
    { text: 'Why copy-pasted chores don’t scale', step: 2 },
    { text: 'What middleware is and how next() works', step: 4 },
    { text: 'Why the order of app.use() matters', step: 5 },
    { text: 'How middleware can stop a request', step: 6 },
    { text: 'How errors reach the error handler', step: 7 },
  ],
  steps: [
    {
      short: 'One handler',
      beat: 'setup',
      title: 'A request meets a route handler',
      body: [
        'So far, every request went straight to a [[route]] handler: Express matches `GET /api/todos`, the handler asks MongoDB, and the answer goes back.',
        'Real apps have dozens of routes, though — and every one of them needs more than its “real work”.',
      ],
      code: {
        file: 'server.js',
        lang: 'js',
        code: `app.get('/api/todos', async (req, res) => {
  const todos = await Todo.find();
  res.json(todos);
});`,
        hl: [1, 2, 3],
      },
      metrics: { ran: 1, status: '200' },
      scene: {
        nodes: { app, web, route, mongo },
        links: [link('web', 'route'), link('route', 'mongo')],
        flows: [flow(['web', 'route', 'mongo'], { label: ['GET /api/todos', 'find()'], back: 'res', backLabel: ['todos', '200 OK'], every: 4 })],
      },
    },
    {
      short: 'Chores',
      beat: 'problem',
      title: 'Every route repeats the same chores',
      body: [
        'Log the request. Check the user is logged in. Parse the JSON body. Almost every route needs these, so they get copy-pasted into every handler.',
        'Twenty routes means twenty copies to keep in sync — and the one where someone forgets the login check becomes a security hole.',
      ],
      code: {
        file: 'server.js',
        lang: 'js',
        code: `app.get('/api/todos', async (req, res) => {
  console.log(req.method, req.url);                  // log
  if (!isLoggedIn(req)) return res.sendStatus(401);  // auth
  res.json(await Todo.find());
});

app.post('/api/todos', async (req, res) => {
  console.log(req.method, req.url);                  // log, again
  if (!isLoggedIn(req)) return res.sendStatus(401);  // auth, again
  const body = JSON.parse(await readBody(req));      // parse
  res.status(201).json(await Todo.create(body));
});`,
        hl: [2, 3, 8, 9, 10],
      },
      metrics: { ran: 1, status: '200' },
      scene: {
        nodes: patch({ app, web, route, mongo }, { route: { sub: 'chores + real work', state: 'busy', badge: { text: '× 20 routes', tone: 'danger' } } }),
        links: [link('web', 'route'), link('route', 'mongo')],
        flows: [flow(['web', 'route', 'mongo'], { label: ['GET /api/todos', 'find()'], back: 'res', backLabel: ['todos', '200 OK'], every: 4, dwell: 0.6 })],
      },
    },
    {
      short: 'Middleware',
      beat: 'solution',
      title: 'Middleware: one line of functions for every request',
      body: [
        '[[middleware|Middleware]] are functions that Express runs **in order**, for every request, before it reaches your route. You add them with `app.use()`.',
        'Each one does a single chore. The route handlers shrink back to just the real work, and the chores live in exactly one place.',
      ],
      code: { file: 'server.js', lang: 'js', code: useCode, hl: [3, 4, 5] },
      changes: ['+ Three middleware in front of every route', '~ Route handlers only do their own work'],
      metrics: { ran: 4, status: '200' },
      scene: { nodes: pipeline, links: chain, flows: [fullTrip()] },
    },
    {
      short: 'next()',
      beat: 'technique',
      title: 'next() passes the request down the line',
      body: [
        'Every middleware receives the same three things: `req`, `res` and [[next|next]]. When it has done its chore, it calls `next()` and Express moves on to the next function in line.',
        'It’s the **same** `req` object all the way down, so a middleware can attach data for later ones — that’s how `req.user` and `req.body` appear in your routes.',
      ],
      callout: { kind: 'warn', text: 'If a middleware neither sends a response nor calls `next()`, the request just hangs until the browser gives up.' },
      code: {
        file: 'middleware/logger.js',
        lang: 'js',
        code: `export function logger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    console.log(req.method, req.url, res.statusCode, \`\${Date.now() - start}ms\`);
  });
  next(); // ← hand the request to the next function
}`,
        hl: [6],
      },
      metrics: { ran: 4, status: '200' },
      scene: {
        nodes: patch(pipeline, { log: { state: 'active', badge: { text: 'next()', tone: 'server' } } }),
        links: chain,
        flows: [fullTrip({ dwell: 0.45, every: 6 })],
      },
    },
    {
      short: 'Order',
      beat: 'technique',
      title: 'Order matters: the line runs top to bottom',
      body: [
        'Middleware only runs for requests that reach it. Here `express.json()` was registered **after** the route — so the route answers first, with nobody having parsed the body.',
        'Rule of thumb: parsers and security first, routes in the middle, error handlers last.',
      ],
      check: {
        q: '`express.json()` is registered after the POST route. Inside the route, what is `req.body`?',
        options: ['The parsed object `{ text: "Call mom" }`', 'The raw JSON text', '`undefined`', 'Express refuses to start'],
        answer: 2,
        explain: 'Nothing has parsed the body by the time the route runs, so `req.body` is `undefined` — and `req.body.text` throws a TypeError. Move `app.use(express.json())` above your routes.',
      },
      code: {
        file: 'server.js',
        lang: 'js',
        code: `app.use(logger);
app.use(requireAuth);

app.post('/api/todos', async (req, res) => {
  const todo = await Todo.create({ text: req.body.text }); // 💥
  res.status(201).json(todo);
});

app.use(express.json()); // too late: the route above already ran`,
        err: [5],
        hl: [9],
      },
      metrics: { ran: 3, status: '500' },
      scene: {
        nodes: patch(pipeline, {
          log: { y: 95 },
          auth: { y: 195 },
          route: { y: 295, label: 'POST /api/todos', state: 'error', badge: { text: 'req.body is undefined', tone: 'danger' } },
          json: { y: 395, state: 'dim' },
          mongo: { y: 295, state: 'dim' },
        }),
        links: [link('web', 'log'), link('log', 'auth'), link('auth', 'route'), link('route', 'json', { state: 'off' }), link('route', 'mongo', { state: 'off' }), link('route', 'web', { style: 'dashed' })],
        flows: [flow(['web', 'log', 'auth', 'route'], { kind: 'data', label: 'POST { text }', back: 'err', returnVia: ['route', 'web'], backLabel: '500 TypeError', every: 4.4 })],
      },
    },
    {
      short: 'Stop early',
      beat: 'technique',
      title: 'Middleware can end the request',
      body: [
        'A middleware doesn’t have to call `next()`. It can send a response itself — and then the line stops right there.',
        'That’s exactly how `requireAuth` works: no valid token, no entry. The route handler and the database never even see the request.',
      ],
      code: {
        file: 'middleware/requireAuth.js',
        lang: 'js',
        code: `export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Not logged in' }); // ends here
  }
  req.user = verifyToken(token); // attach for the handlers below
  next();
}`,
        hl: [3, 4, 5],
      },
      metrics: { ran: 3, status: '401' },
      scene: {
        nodes: patch(pipeline, {
          auth: { state: 'error', badge: { text: '401', tone: 'danger' } },
          route: { state: 'dim' },
          mongo: { state: 'dim' },
          web: { screen: [{ t: 'h', text: 'My todos' }, { t: 'error', text: '401 · Please log in' }] },
        }),
        links: [link('web', 'json'), link('json', 'log'), link('log', 'auth'), link('auth', 'route', { state: 'off' }), link('route', 'mongo', { state: 'off' }), link('auth', 'web', { style: 'dashed', state: 'error' })],
        flows: [
          flow(['web', 'json', 'log', 'auth'], { label: 'GET (no token)', back: 'err', returnVia: ['auth', 'web'], backLabel: '401 Unauthorized', every: 4 }),
        ],
      },
    },
    {
      short: 'next(err)',
      beat: 'technique',
      title: 'next(err) jumps straight to the error handler',
      body: [
        'When something fails — here, the database times out — the route calls `next(err)`. Passing an argument switches Express into *error mode*: it skips every normal middleware and jumps to the first one with **four** parameters.',
        'One error handler at the bottom means one place to log failures and one consistent error response for the client.',
      ],
      code: {
        file: 'server.js',
        lang: 'js',
        code: `app.get('/api/todos', async (req, res, next) => {
  try {
    res.json(await Todo.find());
  } catch (err) {
    next(err); // skip ahead to the error handler
  }
});

// four parameters = error handler. Register it last.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});`,
        hl: [5, 10, 11, 12],
      },
      changes: ['+ An error handler at the end of the line'],
      metrics: { ran: 5, status: '500' },
      scene: {
        nodes: patch({ ...pipeline, errH }, {
          mongo: { state: 'error', badge: { text: 'timeout', tone: 'danger' } },
          errH: { state: 'active' },
          web: { screen: [{ t: 'h', text: 'My todos' }, { t: 'error', text: 'Something went wrong' }] },
        }),
        links: [...chain.slice(0, 5), link('route', 'errH', { tone: 'danger' }), link('errH', 'web', { style: 'dashed', state: 'error' })],
        flows: [
          flow(['web', 'json', 'log', 'auth', 'route', 'mongo'], {
            label: ['GET /api/todos', 'GET /api/todos', 'GET /api/todos', 'GET /api/todos', 'find()'],
            back: 'err',
            returnVia: ['mongo', 'route', 'errH', 'web'],
            backLabel: ['timeout', 'next(err)', '500'],
            every: 5.6,
          }),
        ],
      },
    },
    {
      short: 'Async trap',
      beat: 'tradeoff',
      title: 'The async trap: errors nobody catches',
      body: [
        'In **Express 4**, if an `async` handler throws (or a promise rejects), Express never hears about it. No `next(err)` is called, no response is sent, and the browser spins until it times out.',
        '**Express 5** fixed this: rejected promises from handlers are forwarded to your error handler automatically.',
      ],
      callout: { kind: 'tip', text: 'On Express 4, wrap async handlers in try/catch (or a tiny `asyncHandler` helper) and call `next(err)`. On Express 5, just throw.' },
      code: {
        file: 'server.js',
        lang: 'js',
        code: `// Express 4: this rejection is NOT caught
app.get('/api/todos', async (req, res) => {
  const todos = await Todo.find(); // throws → unhandled rejection
  res.json(todos);                 // never runs; the browser waits forever
});`,
        err: [3],
      },
      metrics: { ran: 4, status: '— (hangs)' },
      scene: {
        nodes: patch({ ...pipeline, errH }, {
          route: { state: 'busy', badge: { text: 'pending…', tone: 'warn' } },
          errH: { state: 'dim' },
          mongo: { state: 'error' },
          web: { screen: loading, state: 'busy' },
        }),
        links: [...chain.slice(0, 5), link('route', 'errH', { state: 'off' })],
        flows: [
          flow(['web', 'json', 'log', 'auth', 'route', 'mongo'], {
            label: ['GET /api/todos', 'GET /api/todos', 'GET /api/todos', 'GET /api/todos', 'find()'],
            fail: true,
            every: 4.6,
          }),
        ],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'The pipeline, in one picture',
      body: [
        'Every request walks the same line, top to bottom, in the order you called `app.use()`.',
        'Each function can **pass it on** with `next()`, **answer it** with `res.send()`/`res.json()`, or **fail it** with `next(err)` — which jumps to the error handler.',
        'Typical order: body parsers → logging → security → routes → 404 → error handler.',
      ],
      metrics: { ran: 4, status: '200' },
      scene: {
        nodes: { ...pipeline, errH: { ...errH, state: 'dim' } },
        links: [...chain, link('route', 'errH', { style: 'dashed' })],
        flows: [fullTrip()],
      },
    },
  ],
});
