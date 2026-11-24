import { box, browser, chip, db, defineLesson, flow, link, patch } from '@/content/dsl';
import type { LinkSpec, NodeSpec, ScreenLine } from '@/engine/types';

/* ---------- layout: client → router → a column of routes → database ---------- */
const screen: ScreenLine[] = [{ t: 'h', text: 'My todos' }, { t: 'item', text: 'Buy milk' }, { t: 'item', text: 'Learn MERN' }];
const web = browser(130, 300, { w: 210, h: 170, url: 'todo-app.com', screen });
const router = box(400, 300, 'Express router', { sub: 'method + path', icon: 'signpost', tone: 'server', w: 216 });
const store = db(915, 300, 'MongoDB', { items: ['todos'], w: 130, h: 104 });

const ROW = [110, 205, 300, 395, 490];
const routeChip = (i: number, label: string, tone: NodeSpec['tone'] = 'server') => chip(690, ROW[i], label, { tone, w: 262 });

const bad = {
  r1: routeChip(0, 'POST /getTodos', 'warn'),
  r2: routeChip(1, 'POST /createTodo', 'warn'),
  r3: routeChip(2, 'POST /updateTodo', 'warn'),
  r4: routeChip(3, 'POST /deleteTodo?id=3', 'warn'),
  r5: routeChip(4, 'POST /getTodosByUser', 'warn'),
};
/** Method and path in an aligned mono column (non-breaking spaces survive HTML). */
const col = (method: string, path: string) => (method.padEnd(7) + path).padEnd(21).replace(/ /g, '\u00a0');
const good = {
  r1: routeChip(0, col('GET', '/api/todos')),
  r2: routeChip(1, col('POST', '/api/todos')),
  r3: routeChip(2, col('GET', '/api/todos/:id')),
  r4: routeChip(3, col('PATCH', '/api/todos/:id')),
  r5: routeChip(4, col('DELETE', '/api/todos/:id')),
};

const fan: LinkSpec[] = [link('web', 'router'), ...['r1', 'r2', 'r3', 'r4', 'r5'].map((r) => link('router', r, { arrow: false }))];
const toDb = (...rs: string[]) => rs.map((r) => link(r, 'store', { style: 'dashed' }));
const call = (route: string, label: string, backLabel: string, o: Parameters<typeof flow>[1] = {}) =>
  flow(['web', 'router', route, 'store'], { label: [label, label, 'query'], back: 'res', backLabel: ['rows', backLabel, backLabel], every: 5.2, ...o });

const routerCode = `const router = express.Router();

router.get('/todos', listTodos);          // read the collection
router.post('/todos', createTodo);        // add to it
router.get('/todos/:id', getTodo);        // read one
router.patch('/todos/:id', updateTodo);   // change part of one
router.delete('/todos/:id', deleteTodo);  // remove one

app.use('/api', router);`;

export default defineLesson({
  metrics: [
    { id: 'status', label: 'Response status' },
    { id: 'honest', label: 'Status tells the truth' },
    { id: 'urls', label: 'URLs to learn', better: 'lower' },
  ],
  goals: [
    { text: 'Why verbs in URLs get messy', step: 2 },
    { text: 'Resources as nouns, methods as verbs', step: 3 },
    { text: 'Choosing the right status code', step: 4 },
    { text: 'Filtering, sorting and paging', step: 5 },
    { text: 'Which requests are safe to retry', step: 6 },
  ],
  steps: [
    {
      short: 'The contract',
      beat: 'setup',
      title: 'An API is a contract',
      body: [
        'Your React app and your Express server only agree on one thing: the [[api|API]] — which URLs exist, what to send, and what comes back. Mobile apps, scripts and teammates will rely on it too.',
        'Ours grew one feature at a time, with a new URL for every action. Let’s look at what that costs.',
      ],
      metrics: { status: '200', honest: '—', urls: 5 },
      scene: {
        nodes: { web, router, store, ...bad },
        links: [...fan, ...toDb('r1')],
        flows: [call('r1', 'POST /getTodos', '200 OK')],
      },
    },
    {
      short: 'Verbs in URLs',
      beat: 'problem',
      title: 'A new URL for every action, and always “200 OK”',
      body: [
        'Every feature invents a URL — `/getTodos`, `/deleteTodo`, `/getTodosByUser` — so nobody can guess the next one without reading the code. Everything is `POST`, so browsers and caches can’t tell reading from changing.',
        'Worst of all, errors come back as `200 OK` with `success: false` inside. The client must parse every body to find out whether it worked, and your monitoring sees nothing but green.',
      ],
      code: {
        lang: 'http',
        file: 'request → response',
        code: `POST /deleteTodo?id=99 HTTP/1.1

HTTP/1.1 200 OK
Content-Type: application/json

{ "success": false, "error": "Todo not found" }`,
        err: [3, 6],
      },
      metrics: { status: '200 (but failed)', honest: 'no', urls: 5 },
      scene: {
        nodes: patch({ web, router, store, ...bad }, { r4: { state: 'error', badge: { text: '200 + error', tone: 'danger' } } }),
        links: [...fan, ...toDb('r4')],
        flows: [call('r4', 'POST /deleteTodo?id=99', '200 {success:false}')],
      },
    },
    {
      short: 'Nouns + verbs',
      beat: 'solution',
      title: 'URLs name things; methods say what to do',
      body: [
        '[[rest|REST]] splits the job in two. The URL names a [[resource]] — a noun: `/api/todos` is the collection, `/api/todos/42` is one todo. The [[http-method|HTTP method]] is the verb: `GET` reads, `POST` creates, `PATCH` updates, `DELETE` removes.',
        'Two URL shapes now cover five operations, and anyone who knows one resource can guess the rest.',
      ],
      code: { file: 'routes/todos.js', lang: 'js', code: routerCode, hl: [3, 4, 5, 6, 7] },
      changes: ['~ Five verb-URLs became one resource with five methods', '+ Mounted under /api'],
      metrics: { status: '200', honest: 'yes', urls: 2 },
      scene: {
        nodes: patch({ web, router, store, ...good }, { r1: { state: 'active' } }),
        links: [...fan, ...toDb('r1')],
        flows: [call('r1', 'GET /api/todos', '200 · todos')],
      },
    },
    {
      short: 'Status codes',
      beat: 'technique',
      title: 'Status codes tell the client what happened',
      body: [
        'The [[status-code|status code]] is the first thing a client reads. Pick the one that matches what happened, and the client can react without digging through the body: show validation messages on `400`, redirect to login on `401`, a “not found” page on `404`.',
        '2xx means it worked, 4xx means the client should change something, 5xx means the server broke.',
      ],
      code: {
        lang: 'text',
        file: 'the ones you’ll use daily',
        code: `200 OK            read or update worked
201 Created       POST made something new
204 No Content    worked, nothing to return (DELETE)
400 Bad Request   the input is invalid
401 Unauthorized  not logged in
403 Forbidden     logged in, but not allowed
404 Not Found     no such resource
409 Conflict      clashes with existing data
500 Server Error  our bug, not theirs`,
        hl: [2, 3, 4, 7],
      },
      metrics: { status: '400 · 404 · 204', honest: 'yes', urls: 2 },
      scene: {
        nodes: patch({ web, router, store, ...good }, {
          r2: { badge: { text: '400', tone: 'danger' } },
          r3: { badge: { text: '404', tone: 'danger' } },
          r5: { badge: { text: '204', tone: 'ok' } },
        }),
        links: [...fan, ...toDb('r3', 'r5')],
        flows: [
          flow(['web', 'router', 'r2'], { kind: 'data', label: 'POST { text: "" }', back: 'err', backLabel: '400 text is required', every: 6.6 }),
          flow(['web', 'router', 'r3', 'store'], { label: ['GET /api/todos/99', 'GET /api/todos/99', 'findById'], back: 'err', backLabel: ['null', '404', '404 Not Found'], every: 6.6, offset: 2.2 }),
          flow(['web', 'router', 'r5', 'store'], { label: ['DELETE /api/todos/7', 'DELETE', 'deleteOne'], back: 'res', backLabel: ['ok', '204', '204'], every: 6.6, offset: 4.4 }),
        ],
      },
    },
    {
      short: 'Query strings',
      beat: 'technique',
      title: 'Filter, sort and page with the query string',
      body: [
        'The path says *which* resource; the [[query-string|query string]] narrows down a collection: which ones, in what order, and how many. `GET /api/todos?done=false&sort=-createdAt&limit=20&page=2`.',
        'Always cap `limit` on the server. A client asking for a million todos shouldn’t be able to take your database down.',
      ],
      code: {
        file: 'controllers/todos.js',
        lang: 'js',
        code: `export async function listTodos(req, res) {
  const { done, sort = '-createdAt', page = 1 } = req.query;
  const limit = Math.min(Number(req.query.limit) || 20, 100); // cap it
  const filter = { userId: req.user.id };
  if (done !== undefined) filter.done = done === 'true';

  const todos = await Todo.find(filter)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);
  res.json(todos);
}`,
        hl: [2, 3, 5],
      },
      metrics: { status: '200', honest: 'yes', urls: 2 },
      scene: {
        nodes: patch({ web, router, store, ...good }, { r1: { state: 'active', badge: { text: '?done=false&limit=20', tone: 'server' } } }),
        links: [...fan, ...toDb('r1')],
        flows: [call('r1', 'GET /api/todos?done=false', '200 · 20 todos')],
      },
    },
    {
      short: 'Retries',
      beat: 'insight',
      title: 'Which requests are safe to send twice?',
      body: [
        'Networks fail, and clients retry. `GET` is *safe* — it changes nothing. `PUT` and `DELETE` are [[idempotent]]: sending them twice leaves the same result as sending them once.',
        '`POST` is neither. A retried “create” makes a **second** todo. That’s why “Add” buttons get disabled while saving, and why payment APIs accept an idempotency key.',
      ],
      check: {
        q: 'The network hiccups and the client automatically retries. Which request can leave you with a duplicate?',
        options: ['`GET /api/todos`', '`PUT /api/todos/7`', '`DELETE /api/todos/7`', '`POST /api/todos`'],
        answer: 3,
        explain: 'Each POST creates a new resource, so a retry creates another. The others end in the same state no matter how many times they run.',
      },
      metrics: { status: '201 · 201', honest: 'yes', urls: 2 },
      scene: {
        nodes: patch({ web, router, store, ...good }, {
          r2: { state: 'error', badge: { text: 'sent twice', tone: 'danger' } },
          store: { badge: { text: '2 × "Buy milk"', tone: 'danger' } },
          web: { screen: [{ t: 'h', text: 'My todos' }, { t: 'item', text: 'Buy milk' }, { t: 'item', text: 'Buy milk', flash: true }] },
        }),
        links: [...fan, ...toDb('r2')],
        flows: [
          flow(['web', 'router', 'r2', 'store'], { kind: 'data', label: ['POST /api/todos', 'POST', 'insertOne'], back: 'res', backLabel: ['ok', '201', '201'], every: 5.2 }),
          flow(['web', 'router', 'r2', 'store'], { kind: 'data', label: ['retry POST', 'POST', 'insertOne'], back: 'res', backLabel: ['ok', '201', '201'], every: 5.2, offset: 0.9 }),
        ],
      },
    },
    {
      short: 'Consistency',
      beat: 'tradeoff',
      title: 'Boring and consistent beats clever',
      body: [
        'Pick conventions once and use them everywhere: plural nouns, camelCase JSON, ISO dates, and **one error shape** so the front end can handle every failure the same way.',
        'Put a version in the path from day one (`/api/v1`). When you need a breaking change, `v2` can ship next to it without breaking apps people already installed.',
      ],
      code: {
        file: 'middleware/errors.js',
        lang: 'js',
        code: `// one error shape, for every route
res.status(404).json({
  error: { code: 'TODO_NOT_FOUND', message: 'No todo with id 99' },
});

// versioned from day one
app.use('/api/v1', router);`,
        hl: [2, 3, 4, 7],
      },
      metrics: { status: '404', honest: 'yes', urls: 2 },
      scene: {
        nodes: patch({ web, router: { ...router, label: 'router · /api/v1' }, store, ...good }, { r3: { state: 'active' } }),
        links: [...fan, ...toDb('r3')],
        flows: [flow(['web', 'router', 'r3', 'store'], { label: ['GET /api/v1/todos/99', 'GET', 'findById'], back: 'err', backLabel: ['null', '404', '{ error: { code, message } }'], every: 5.2 })],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'A REST API in five rules',
      body: [
        '{server:URLs are nouns}: `/api/todos` and `/api/todos/:id`.',
        '{server:Methods are verbs}: GET reads, POST creates, PATCH updates, DELETE removes.',
        '{ok:Status codes are honest}: 2xx worked, 4xx fix your request, 5xx our fault.',
        'Query strings filter, sort and page — with server-side limits. Only GET, PUT and DELETE are safe to blindly retry.',
        'One error shape, one naming style, and a version in the path.',
      ],
      metrics: { status: '200', honest: 'yes', urls: 2 },
      scene: {
        nodes: { web, router, store, ...good },
        links: [...fan, ...toDb('r1', 'r2')],
        flows: [call('r1', 'GET /api/todos', '200'), { ...call('r2', 'POST /api/todos', '201'), kind: 'data', offset: 2.6 }],
      },
    },
  ],
});
