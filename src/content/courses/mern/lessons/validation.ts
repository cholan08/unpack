import { box, browser, db, defineLesson, doc, field, flow, link, patch } from '@/content/dsl';
import type { Field, LinkSpec, NodeSpec, ScreenLine } from '@/engine/types';

/* ---------- layout: two kinds of client on the left → the edge → controller → database ---------- */
const form: ScreenLine[] = [
  { t: 'h', text: 'New todo' },
  { t: 'input', text: 'Buy milk' },
  { t: 'input', text: 'Priority: 2' },
  { t: 'btn', text: 'Add', state: 'active' },
];
const fieldErrors: ScreenLine[] = [
  { t: 'h', text: 'New todo' },
  { t: 'input', text: 'Text', placeholder: true },
  { t: 'error', text: 'Text is required' },
  { t: 'input', text: 'Priority: 9' },
  { t: 'error', text: 'Priority is 1–5' },
];

const web = browser(120, 205, { w: 200, h: 200, url: 'todo-app.com', screen: form });
const cli = box(120, 470, 'curl / scripts', { sub: 'skip your form', icon: 'terminal', tone: 'neutral', w: 200 });
const edge = box(400, 340, 'POST /api/todos', { sub: 'route', icon: 'express', tone: 'server', w: 214 });
const ctrl = box(640, 340, 'createTodo', { sub: 'controller', icon: 'express', tone: 'server', w: 190 });
const mongo = db(875, 340, 'todos', { sub: 'collection', w: 140, h: 104 });
const payload = (fields: Field[], label = 'req.body') => doc(400, 130, label, fields, { w: 290, tone: 'client', icon: 'json' });
const clean = (fields: Field[]) => doc(690, 130, 'what gets saved', fields, { w: 240 });

const base: Record<string, NodeSpec> = { web, cli, edge, ctrl, mongo };
const links: LinkSpec[] = [
  link('web', 'edge'),
  link('cli', 'edge'),
  link('edge', 'ctrl'),
  link('ctrl', 'mongo'),
  link('payload', 'edge', { style: 'dashed', arrow: false }),
  link('clean', 'ctrl', { style: 'dashed', arrow: false }),
];
const validator = { label: 'validate(TodoInput)', sub: 'zod schema', icon: 'shield', tone: 'auth' } as const;
const goodPost = flow(['web', 'edge', 'ctrl', 'mongo'], { kind: 'data', label: ['POST { text }', 'clean data', 'insertOne'], back: 'res', returnVia: ['mongo', 'ctrl', 'edge', 'web'], backLabel: ['saved', '201', '201'], every: 5.6 });
const badPost = (label: string, back: string) =>
  flow(['cli', 'edge'], { kind: 'err', label, back: 'err', backLabel: back, every: 5.6, offset: 2.6 });

const schemaCode = `import { z } from 'zod';

export const TodoInput = z.object({
  text: z.string().trim().min(1, 'Text is required').max(200, 'Keep it under 200 characters'),
  priority: z.coerce.number().int().min(1).max(5, 'Priority is 1–5').default(3),
  dueAt: z.coerce.date().optional(),
}); // keys not listed here (userId, role…) are stripped

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return res.status(400).json({ errors });
  }
  req.body = result.data; // clean, typed, only known fields
  next();
};`;

export default defineLesson({
  metrics: [
    { id: 'bad', label: 'Bad writes possible' },
    { id: 'status', label: 'Response' },
  ],
  legend: { data: 'valid input', err: 'bad / malicious input' },
  goals: [
    { text: 'Why browser-side checks protect nothing', step: 1 },
    { text: 'Validating at the edge with a schema', step: 3 },
    { text: 'Errors a form can display', step: 4 },
    { text: 'Mass assignment, and keeping only known fields', step: 5 },
    { text: 'NoSQL injection — and how types stop it', step: 6 },
    { text: 'Validation in layers', step: 8 },
  ],
  steps: [
    {
      short: 'Any client',
      beat: 'setup',
      title: 'Your API talks to more than your form',
      body: [
        'The form has `required` and `maxlength`, and React checks the input before sending. That’s great for users — instant feedback — but it protects nothing.',
        'Anyone can send requests straight to your API with curl, Postman or a script, with any body at all. The server is the only place you control.',
      ],
      metrics: { bad: 'yes', status: '201' },
      scene: {
        nodes: patch(base, { web: { badge: { text: 'checks in the browser', tone: 'client' } }, cli: { badge: { text: 'no checks at all', tone: 'warn' } } }),
        links: links.slice(0, 4),
        flows: [goodPost, flow(['cli', 'edge', 'ctrl', 'mongo'], { kind: 'err', label: ['POST { anything }', 'anything', 'insertOne'], every: 5.6, offset: 2.6 })],
      },
    },
    {
      short: 'Trusting the body',
      beat: 'problem',
      title: 'Saving req.body as it arrived',
      body: [
        '`Todo.create(req.body)` saves whatever the client sent. An empty text, a priority of `"high"`, a 10 MB string — and worse, fields you never meant to accept.',
        'Send `userId` and the todo lands in **someone else’s** account. Send `role: "admin"` to a user-update route and you’ve promoted yourself. That’s [[mass-assignment|mass assignment]].',
      ],
      code: {
        file: 'routes/todos.js',
        lang: 'js',
        code: `app.post('/api/todos', async (req, res) => {
  const todo = await Todo.create(req.body); // ❌ trusts every field
  res.status(201).json(todo);
});`,
        err: [2],
      },
      metrics: { bad: 'yes', status: '201 (bad data)' },
      scene: {
        nodes: {
          ...patch(base, { mongo: { state: 'error', badge: { text: 'saved as sent', tone: 'danger' } } }),
          payload: payload([field('text', '""', { hl: true }), field('priority', '"high"', { hl: true }), field('userId', '"6740…b2"  (not you!)', { hl: true }), field('role', '"admin"', { hl: true })]),
        },
        links: links.slice(0, 5),
        flows: [flow(['cli', 'edge', 'ctrl', 'mongo'], { kind: 'err', label: ['POST { …anything }', 'req.body', 'insertOne'], back: 'res', returnVia: ['mongo', 'ctrl', 'edge', 'cli'], backLabel: ['ok', '201', '201'], every: 5.6 })],
      },
    },
    {
      short: 'Validate',
      beat: 'solution',
      title: 'Validate at the edge, against a schema',
      body: [
        'Describe the input you accept once — with a library like [[zod|Zod]] — and check every request against it **before** any real work. Bad input is turned away with `400`; good input continues as a clean, typed object.',
        'The schema also coerces types (`"2"` → 2), trims strings, applies defaults, and **drops every key it doesn’t list**.',
      ],
      code: { file: 'validation/todo.js', lang: 'js', code: schemaCode, hl: [3, 4, 5, 6, 10, 15] },
      changes: ['+ validate(TodoInput) runs before the controller', '~ Bad input stops at the edge with 400'],
      metrics: { bad: 'no', status: '400' },
      scene: {
        nodes: { ...patch(base, { edge: { ...validator, state: 'active' } }), payload: payload([field('text', '""', { hl: true }), field('priority', '"high"', { hl: true })]) },
        links: links.slice(0, 5),
        flows: [goodPost, badPost('POST { text: "" }', '400 Text is required')],
      },
    },
    {
      short: 'Field errors',
      beat: 'technique',
      title: 'Errors the form can show next to each field',
      body: [
        'A `400` is only useful if the client can act on it. Return **which field** failed and **why**, in a consistent shape. The form maps each error onto its input, so the user knows exactly what to fix.',
        'Write messages for humans in the schema (“Text is required”), not the library’s defaults.',
      ],
      code: {
        lang: 'http',
        file: 'response',
        code: `HTTP/1.1 400 Bad Request

{ "errors": [
    { "field": "text",     "message": "Text is required" },
    { "field": "priority", "message": "Priority is 1–5" } ] }`,
        hl: [1, 4, 5],
      },
      metrics: { bad: 'no', status: '400 + field errors' },
      scene: {
        nodes: { ...patch(base, { edge: validator, web: { screen: fieldErrors, state: 'error' } }), payload: payload([field('text', '""', { hl: true }), field('priority', '9', { hl: true })]) },
        links: links.slice(0, 5),
        flows: [flow(['web', 'edge'], { kind: 'data', label: 'POST { text: "", priority: 9 }', back: 'err', backLabel: '400 · 2 field errors', every: 4.4 })],
      },
    },
    {
      short: 'Known fields',
      beat: 'technique',
      title: 'Keep only what you asked for',
      body: [
        'Because the schema lists the allowed fields, `userId` and `role` simply vanish from the validated body. Ownership then comes from the **session**, never from the request: `userId: req.user.id`.',
        'Rule: the client may suggest *content* (text, priority); the server decides *ownership, roles, prices and permissions*.',
      ],
      code: {
        file: 'controllers/todos.js',
        lang: 'js',
        code: `// req.body was already validated and stripped by validate(TodoInput)
export async function createTodo(req, res) {
  const todo = await Todo.create({ ...req.body, userId: req.user.id });
  res.status(201).json(todo);
}`,
        hl: [3],
      },
      metrics: { bad: 'no', status: '201' },
      scene: {
        nodes: {
          ...patch(base, { edge: validator }),
          payload: payload([field('text', '"Buy milk"'), field('priority', '"2"'), field('userId', '"6740…b2"', { hl: true }), field('role', '"admin"', { hl: true })]),
          clean: clean([field('text', '"Buy milk"'), field('priority', '2'), field('userId', 'req.user.id', { hl: true })]),
        },
        links,
        flows: [flow(['cli', 'edge', 'ctrl', 'mongo'], { kind: 'data', label: ['4 fields', '2 fields', 'insertOne'], back: 'res', returnVia: ['mongo', 'ctrl', 'edge', 'cli'], backLabel: ['saved', '201', '201'], every: 5.6 })],
      },
    },
    {
      short: 'Injection',
      beat: 'problem',
      title: 'NoSQL injection: when input becomes a query',
      body: [
        'JSON can carry objects, not just strings. If input goes straight into a filter, a client can send a **query operator** instead of a value. `{ "userId": { "$ne": null } }` turns “todos of this user” into “todos of every user whose id isn’t null” — everyone.',
        'That’s [[nosql-injection|NoSQL injection]], and it needs no special characters at all — just a body shaped like a filter.',
      ],
      code: {
        file: 'routes/todos.js',
        lang: 'js',
        code: `app.post('/api/todos/search', async (req, res) => {
  res.json(await Todo.find({ userId: req.body.userId })); // ❌
});

// attacker sends:  { "userId": { "$ne": null } }
// the filter becomes { userId: { $ne: null } } → every user's todos`,
        err: [2, 6],
      },
      metrics: { bad: 'data leak', status: '200 (all users!)' },
      scene: {
        nodes: {
          ...patch(base, { edge: { label: 'POST /todos/search', sub: 'no validation' }, ctrl: { label: 'searchTodos' }, mongo: { state: 'error', badge: { text: 'matched every user', tone: 'danger' } } }),
          payload: payload([field('userId', '{ "$ne": null }', { hl: true })]),
        },
        links: links.slice(0, 5),
        flows: [flow(['cli', 'edge', 'ctrl', 'mongo'], { kind: 'err', label: ['{ "$ne": null }', 'find(filter)', '{ $ne: null }'], back: 'res', returnVia: ['mongo', 'ctrl', 'edge', 'cli'], backLabel: ['ALL todos', 'ALL todos', 'everyone’s data'], every: 5.6 })],
      },
    },
    {
      short: 'Types stop it',
      beat: 'solution',
      title: 'Types shut the door',
      body: [
        'Injection works because the code expected a string and got an object. A schema that says “`userId` is a string” rejects the object with `400` before it gets near the database. Better still, don’t accept the id at all: search **your** todos with `req.user.id`.',
        'As a safety net, Mongoose’s `sanitizeFilter` option neutralises `$` operators that arrive inside filter values.',
      ],
      check: {
        q: 'The search route runs `Todo.find({ userId: req.body.userId })`. Which change actually stops `{ "$ne": null }`?',
        options: ['Checking that `req.body.userId` is truthy', 'Requiring a string — or ignoring it and using `req.user.id`', 'Trimming the input', 'Using `findOne` instead of `find`'],
        answer: 1,
        explain: 'An object is truthy and survives trimming, and `findOne` would still leak a stranger’s todo. Only the type check (or not trusting the client for ownership at all) removes the attack.',
      },
      code: {
        file: 'routes/todos.js',
        lang: 'js',
        code: `const Search = z.object({ q: z.string().max(100) });

app.post('/api/todos/search', validate(Search), async (req, res) => {
  const pattern = escapeRegex(req.body.q); // treat the search text literally
  res.json(await Todo.find({ userId: req.user.id, text: { $regex: pattern, $options: 'i' } }));
});

mongoose.set('sanitizeFilter', true); // safety net for every query`,
        hl: [1, 5, 8],
      },
      metrics: { bad: 'no', status: '400' },
      scene: {
        nodes: { ...patch(base, { edge: { ...validator, label: 'validate(Search)', state: 'ok' } }), payload: payload([field('userId', '{ "$ne": null }', { hl: true })]) },
        links: links.slice(0, 5),
        flows: [badPost('{ "$ne": null }', '400 Expected string'), goodPost],
      },
    },
    {
      short: 'Layers',
      beat: 'insight',
      title: 'Validate in layers, each for its own reason',
      body: [
        '**Browser**: instant feedback, purely for user experience. **Edge** (the validate middleware): security and shape — the real gate. **Mongoose schema**: keeps documents consistent whichever route writes them. **Database**: unique indexes and validators for rules that must never break.',
        'Each layer catches what the others can’t. Only the browser layer is optional for safety — never the server ones.',
      ],
      metrics: { bad: 'no', status: '201' },
      scene: {
        nodes: patch(base, {
          web: { badge: { text: '1 · UX only', tone: 'client' } },
          edge: { ...validator, badge: { text: '2 · security + shape', tone: 'auth' } },
          ctrl: { label: 'Mongoose schema', sub: 'document shape', icon: 'boxes', w: 214, badge: { text: '3 · consistency', tone: 'server' } },
          mongo: { badge: { text: '4 · unique index', tone: 'data' } },
        }),
        links: links.slice(0, 4),
        flows: [goodPost, badPost('POST { role: "admin" }', '400')],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Never trust the request',
      body: [
        'Browser checks are for {client:users}; the {auth:server} is the only gate you control.',
        'Validate every body (and query string) against a {auth:schema} at the edge: coerce types, enforce limits, strip unknown keys, answer `400` with per-field messages.',
        'Take ownership and permissions from the session, never the body — that stops mass assignment and most NoSQL injection. Back it up with Mongoose schemas and database constraints.',
      ],
      metrics: { bad: 'no', status: '201' },
      scene: {
        nodes: { ...patch(base, { edge: validator }), clean: clean([field('text', '"Buy milk"'), field('priority', '2'), field('userId', 'req.user.id')]) },
        links: [...links.slice(0, 4), link('clean', 'ctrl', { style: 'dashed', arrow: false })],
        flows: [goodPost, badPost('POST { …bad }', '400')],
      },
    },
  ],
});
