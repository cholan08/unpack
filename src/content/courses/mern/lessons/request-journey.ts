import { box, browser, db, defineLesson, doc, field, flow, link, patch, zone } from '@/content/dsl';
import type { NodeSpec, ScreenLine } from '@/engine/types';

/* ---------- layout: four zones, left to right ---------- */
const before: ScreenLine[] = [
  { t: 'h', text: 'My todos' },
  { t: 'input', text: 'Call mom' },
  { t: 'btn', text: 'Add', state: 'active' },
  { t: 'item', text: 'Buy milk' },
  { t: 'item', text: 'Learn MERN' },
];
const after = (flash = true): ScreenLine[] => [
  { t: 'h', text: 'My todos' },
  { t: 'input', text: 'New todo…', placeholder: true },
  { t: 'btn', text: 'Add' },
  { t: 'item', text: 'Buy milk' },
  { t: 'item', text: 'Learn MERN' },
  { t: 'item', text: 'Call mom', flash },
];

const zc = zone(150, 300, 270, 548, 'Browser', { tone: 'client', icon: 'browser' });
const zn = zone(385, 300, 160, 548, 'Network', { tone: 'net', icon: 'globe' });
const zs = zone(625, 300, 270, 548, 'Express server', { tone: 'server', icon: 'server' });
const zd = zone(880, 300, 210, 548, 'MongoDB', { tone: 'data', icon: 'mongo' });

const page = browser(150, 205, { w: 226, h: 212, url: 'todo-app.com', screen: before });
const react = box(150, 440, 'React', { sub: 'TodoList state', icon: 'react', tone: 'client', w: 210 });
const net = box(385, 260, 'Internet', { sub: '~40 ms', icon: 'globe', tone: 'net', w: 136 });
const mw = box(625, 150, 'Middleware', { sub: 'json · auth · validate', icon: 'filter', tone: 'server', w: 236 });
const ctrl = box(625, 270, 'POST /api/todos', { sub: 'controller', icon: 'express', tone: 'server', w: 236 });
const model = box(625, 390, 'Todo model', { sub: 'Mongoose', icon: 'boxes', tone: 'server', w: 236 });
const mongo = db(880, 390, 'todos', { sub: 'collection', w: 150, h: 112 });
const saved = doc(880, 185, 'new document', [
  field('_id', 'ObjectId("…f9")', { hl: true }),
  field('userId', 'ObjectId("…a1")'),
  field('text', '"Call mom"'),
  field('done', 'false'),
  field('createdAt', 'ISODate(…)'),
], { w: 196 });

const all: Record<string, NodeSpec> = { zc, zn, zs, zd, page, react, net, mw, ctrl, model, mongo };
const links = [
  link('page', 'net'),
  link('net', 'mw'),
  link('mw', 'ctrl'),
  link('ctrl', 'model'),
  link('model', 'mongo'),
  link('ctrl', 'net', { style: 'dashed' }),
  link('page', 'react'),
];
/** Dim everything except the nodes in focus. */
const focus = (ids: string[], extra: Record<string, Partial<NodeSpec>> = {}) =>
  patch(
    all,
    Object.fromEntries(
      Object.keys(all)
        .filter((id) => !id.startsWith('z'))
        .map((id) => [id, { state: ids.includes(id) ? 'active' : 'dim', ...(extra[id] ?? {}) }]),
    ),
  );

const roundTrip = flow(['page', 'net', 'mw', 'ctrl', 'model', 'mongo'], {
  kind: 'data',
  label: ['POST /api/todos', 'POST /api/todos', 'req.user · req.body', 'Todo.create()', 'insertOne'],
  back: 'res',
  returnVia: ['mongo', 'model', 'ctrl', 'net', 'page'],
  backLabel: ['ack', 'saved doc', '201 + JSON', '201 + JSON'],
  every: 7,
});

export default defineLesson({
  metrics: [
    { id: 'elapsed', label: 'Elapsed', unit: 'ms', better: 'lower' },
    { id: 'where', label: 'Now in' },
  ],
  legend: { data: 'request + body', event: 'state update' },
  goals: [
    { text: 'What fetch() actually sends', step: 3 },
    { text: 'What middleware does with the request', step: 4 },
    { text: 'Why the controller never trusts the client', step: 5 },
    { text: 'What Mongoose adds on top of MongoDB', step: 6 },
    { text: 'Where the time really goes', step: 10 },
  ],
  steps: [
    {
      short: 'Overview',
      beat: 'setup',
      title: 'One click, start to finish',
      body: [
        'This lesson stitches together everything so far. You type *Call mom*, press **Add**, and a moment later it’s in the list — saved for good.',
        'We’ll follow that one request through every layer, from the click to the database and back to the screen, timing each hop.',
      ],
      metrics: { elapsed: 0, where: '—' },
      scene: { nodes: all, links, flows: [roundTrip] },
    },
    {
      short: 'React',
      beat: 'technique',
      title: 'React turns the click into a fetch',
      body: [
        'The form’s submit handler stops the browser’s default page reload and calls [[fetch|fetch()]] with the method, a JSON content type and the body.',
        '`credentials: \'include\'` tells the browser to attach the login cookie. The `await` means the component simply waits for the answer — the page stays responsive meanwhile.',
      ],
      code: {
        file: 'AddTodo.jsx',
        lang: 'jsx',
        code: `async function handleSubmit(e) {
  e.preventDefault();               // no full page reload
  const res = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',         // send the auth cookie
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(\`Save failed: \${res.status}\`);
  onAdded(await res.json());
}`,
        hl: [3, 4, 5, 6, 7],
      },
      metrics: { elapsed: 1, where: 'React' },
      scene: {
        nodes: focus(['page', 'net']),
        links,
        flows: [flow(['page', 'net'], { kind: 'data', label: 'POST /api/todos', every: 3 })],
      },
    },
    {
      short: 'Network',
      beat: 'technique',
      title: 'Across the network',
      body: [
        'The browser turns the call into an HTTP message. Because it already has an open, encrypted connection to the server, there’s no new handshake — just one trip across the internet.',
        'Here’s what actually goes over the wire:',
      ],
      code: {
        lang: 'http',
        file: 'HTTP request',
        code: `POST /api/todos HTTP/1.1
Host: todo-app.com
Content-Type: application/json
Cookie: token=eyJhbGciOiJIUzI1NiJ9…

{"text":"Call mom"}`,
        hl: [1, 4, 6],
      },
      metrics: { elapsed: 41, where: 'Network' },
      scene: {
        nodes: focus(['net', 'mw']),
        links,
        flows: [flow(['page', 'net', 'mw'], { kind: 'data', label: 'POST /api/todos', every: 3.6 })],
      },
    },
    {
      short: 'Middleware',
      beat: 'technique',
      title: 'Middleware prepares the request',
      body: [
        'Express runs the request down the [[middleware]] line: the JSON body becomes `req.body`, the cookie’s token is verified and becomes `req.user`, and a validator rejects bad input with a `400` before any real work happens.',
        'By the time the controller runs, the request is parsed, authenticated and known to be well-formed.',
      ],
      code: {
        file: 'server.js',
        lang: 'js',
        code: `app.use(express.json());                 // body   → req.body
app.use(cookieParser());                 // cookie → req.cookies
app.use('/api', requireAuth);            // token  → req.user
app.post('/api/todos', validate(todoInput), createTodo);`,
        hl: [1, 3, 4],
      },
      metrics: { elapsed: 44, where: 'Middleware' },
      scene: {
        nodes: focus(['mw'], { mw: { badge: { text: 'req.user = Ana', tone: 'auth' } } }),
        links,
        flows: [flow(['net', 'mw', 'ctrl'], { kind: 'data', label: ['POST', 'req.body · req.user'], every: 3.4, dwell: 0.5 })],
      },
    },
    {
      short: 'Controller',
      beat: 'technique',
      title: 'The controller does the actual work',
      body: [
        'The route’s controller is short: build the todo from **trusted** pieces and hand it to the model.',
        'Notice where `userId` comes from: `req.user`, which middleware derived from a verified token — never from the request body, which the user controls completely.',
      ],
      callout: { kind: 'mistake', text: 'Never take ownership or permission fields (`userId`, `role`, `price`…) from the request body. Anyone can send anything.' },
      code: {
        file: 'controllers/todos.js',
        lang: 'js',
        code: `export async function createTodo(req, res) {
  const todo = await Todo.create({
    userId: req.user.id,   // from the verified token
    text: req.body.text,   // validated by middleware
  });
  res.status(201).json(todo);
}`,
        hl: [3],
      },
      metrics: { elapsed: 45, where: 'Controller' },
      scene: {
        nodes: focus(['ctrl']),
        links,
        flows: [flow(['mw', 'ctrl', 'model'], { kind: 'data', label: ['req', 'Todo.create()'], every: 3.2 })],
      },
    },
    {
      short: 'Mongoose',
      beat: 'technique',
      title: 'Mongoose checks the shape, then saves',
      body: [
        '[[mongoose|Mongoose]] compares the data with the schema: casts types, applies defaults (`done: false`), trims text, enforces `required` and `maxlength`, adds timestamps, and generates the `_id`.',
        'Bad data fails here with a `ValidationError` — a second safety net behind your input validation.',
      ],
      code: {
        file: 'models/Todo.js',
        lang: 'js',
        code: `const todoSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  text:   { type: String, required: true, trim: true, maxlength: 200 },
  done:   { type: Boolean, default: false },
}, { timestamps: true });

export const Todo = model('Todo', todoSchema);`,
        hl: [2, 3, 4, 5],
      },
      metrics: { elapsed: 47, where: 'Mongoose' },
      scene: {
        nodes: focus(['model']),
        links,
        flows: [flow(['ctrl', 'model', 'mongo'], { kind: 'data', label: ['Todo.create()', 'insertOne'], every: 3.2, dwell: 0.45 })],
      },
    },
    {
      short: 'MongoDB',
      beat: 'technique',
      title: 'MongoDB writes the document',
      body: [
        'MongoDB stores the [[document]] in the `todos` [[collection]], adds an entry to each [[index]] (including the one on `userId`), records the write in its journal so a crash can’t lose it, and acknowledges.',
        'The saved document comes back to Mongoose, which returns it to the controller.',
      ],
      metrics: { elapsed: 55, where: 'MongoDB' },
      scene: {
        nodes: { ...focus(['mongo']), saved: { ...saved, state: 'active' } },
        links: [...links, link('mongo', 'saved', { style: 'dashed', tone: 'data' })],
        flows: [flow(['model', 'mongo'], { kind: 'data', label: 'insertOne', back: 'res', backLabel: 'acknowledged', every: 3 })],
      },
    },
    {
      short: 'Response',
      beat: 'technique',
      title: 'The answer travels back',
      body: [
        'The controller replies `201 Created` with the saved todo as [[json|JSON]] — including the `_id` and timestamps the client didn’t have yet.',
        'The response goes straight back over the same connection: one more trip across the internet.',
      ],
      code: {
        lang: 'http',
        file: 'HTTP response',
        code: `HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{"_id":"6741c0…f9","text":"Call mom","done":false,
 "createdAt":"2026-11-23T10:04:12.000Z"}`,
        hl: [1],
      },
      metrics: { elapsed: 95, where: 'Network' },
      scene: {
        nodes: focus(['ctrl', 'net', 'page']),
        links,
        flows: [flow(['ctrl', 'net', 'page'], { kind: 'res', label: '201 + JSON', every: 3.2 })],
      },
    },
    {
      short: 'Re-render',
      beat: 'technique',
      title: 'React updates the screen',
      body: [
        '`await res.json()` resolves, the component calls `setTodos` with a **new** array, and React does its trigger → render → commit cycle. One `<li>` is added to the DOM.',
        'About a tenth of a second after the click, *Call mom* is on screen — and in the database.',
      ],
      code: {
        file: 'TodoList.jsx',
        lang: 'jsx',
        code: `function TodoList() {
  const [todos, setTodos] = useState([]);
  const handleAdded = (todo) => setTodos((prev) => [...prev, todo]);
  …
}`,
        hl: [3],
      },
      metrics: { elapsed: 99, where: 'React' },
      scene: {
        nodes: focus(['page', 'react'], { page: { screen: after() } }),
        links,
        flows: [
          flow(['page', 'react'], { kind: 'event', label: 'setTodos', every: 3 }),
          flow(['react', 'page'], { kind: 'data', label: 'commit', every: 3, offset: 1.1 }),
        ],
      },
    },
    {
      short: 'Where time goes',
      beat: 'insight',
      title: '80 of the 99 ms were spent travelling',
      body: [
        'All our code — React, middleware, controller, Mongoose — took a few milliseconds. MongoDB took about eight. **The network took eighty.**',
        'That’s typical, and it’s why apps feel fast when they avoid waiting on the network: *optimistic updates* show the new item immediately and quietly roll back if the save fails.',
      ],
      code: {
        file: 'useTodos.js',
        lang: 'js',
        code: `async function addTodo(text) {
  const temp = { _id: crypto.randomUUID(), text, pending: true };
  setTodos((prev) => [...prev, temp]);              // show it now
  try {
    const saved = await api.createTodo(text);
    setTodos((prev) => prev.map((t) => (t._id === temp._id ? saved : t)));
  } catch {
    setTodos((prev) => prev.filter((t) => t._id !== temp._id)); // roll back
  }
}`,
        hl: [3, 8],
      },
      metrics: { elapsed: 1, where: 'screen (optimistic)' },
      scene: {
        nodes: patch(all, { net: { state: 'active', badge: { text: '80 ms', tone: 'warn' } }, page: { screen: after() } }),
        links,
        flows: [
          flow(['page', 'react'], { kind: 'event', label: 'show now', every: 7 }),
          { ...roundTrip, offset: 0.6 },
        ],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'The whole stack, in one round trip',
      body: [
        '{client:React} handles the click and calls `fetch` with JSON.',
        '{net:The network} carries an HTTP request (and the cookie) to the server.',
        '{server:Express middleware} parses, authenticates and validates; the {server:controller} builds the todo from trusted data; {server:Mongoose} enforces the schema.',
        '{data:MongoDB} writes the document and its index entries, durably.',
        'The response retraces the path and React re-renders. Most of the time is network — design to wait less.',
      ],
      metrics: { elapsed: 99, where: 'done' },
      scene: { nodes: patch(all, { page: { screen: after(false) } }), links, flows: [roundTrip] },
    },
  ],
});
