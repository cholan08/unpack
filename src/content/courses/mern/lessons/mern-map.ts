import { actor, box, browser, chip, db, defineLesson, doc, field, flow, link, patch, zone } from '@/content/dsl';
import type { ScreenLine } from '@/engine/types';

/* ---------- layout: three columns, one per place code runs ---------- */
const Y = 345;

const todos: ScreenLine[] = [
  { t: 'h', text: 'My todos' },
  { t: 'item', text: 'Buy milk' },
  { t: 'item', text: 'Learn MERN' },
  { t: 'input', text: 'New todo…', placeholder: true },
  { t: 'btn', text: 'Add' },
];
const emptyTodos: ScreenLine[] = [
  { t: 'h', text: 'My todos' },
  { t: 'text', text: 'Nothing here yet.' },
  { t: 'input', text: 'New todo…', placeholder: true },
  { t: 'btn', text: 'Add' },
];

const zc = zone(170, 320, 300, 540, 'Client', { tone: 'client', icon: 'browser', sub: 'your browser' });
const zs = zone(500, 320, 290, 540, 'Server', { tone: 'server', icon: 'server' });
const zd = zone(830, 320, 300, 540, 'Database', { tone: 'data', icon: 'db', sub: 'MongoDB' });

const you = actor(170, 135, 'You');
const web = browser(170, Y, { url: 'localhost:5173', screen: todos, w: 240, h: 214 });
const srv = box(500, Y, 'Server', { icon: 'server', tone: 'server', sub: 'a computer you control', w: 232 });
const mongo = db(830, Y, 'MongoDB', { items: ['todos', 'users'], w: 160, h: 112 });
const todoDoc = doc(830, 500, 'todos', [
  field('_id', 'ObjectId("6741…a3")'),
  field('text', '"Buy milk"'),
  field('done', 'false'),
  field('createdAt', 'ISODate("2026-11-23")'),
]);
const r1 = chip(500, 440, 'GET /api/todos', { tone: 'server' });
const r2 = chip(500, 482, 'POST /api/todos', { tone: 'server' });

const s1 = { zc, you, web };
const s3 = { ...s1, zs, srv };
const nodeSrv = { icon: 'node', label: 'Node.js', sub: 'runs server.js', badge: { text: ':5000' } } as const;
const expressSrv = { icon: 'express', label: 'Express app', sub: 'on Node.js · :5000', badge: undefined } as const;
const s5 = patch({ ...s3, r1, r2 }, { zs: { sub: 'Node.js' }, srv: expressSrv });
const s7 = { ...s5, zd, mongo, todoDoc };
const s8 = patch(s7, { web: { label: 'React app', icon: 'react' }, zc: { sub: 'React' } });

const linkWS = link('web', 'srv');
const linkSM = link('srv', 'mongo');

const expressCode = `import express from 'express';
const app = express();
app.use(express.json());

app.get('/api/todos', (req, res) => {
  res.json(todos);
});

app.post('/api/todos', (req, res) => {
  todos.push(req.body.text);
  res.status(201).json(todos);
});

app.listen(5000);`;

export default defineLesson({
  metrics: [
    { id: 'places', label: 'Places code runs' },
    { id: 'survives', label: 'Survives a refresh' },
    { id: 'shared', label: 'Same list on your phone' },
  ],
  legend: { event: 'user action' },
  goals: [
    { text: 'Why a web app needs a server and a database', step: 2 },
    { text: 'What Node.js and Express each do', step: 4 },
    { text: 'How MongoDB stores data as documents', step: 7 },
    { text: 'How React turns data into a screen', step: 8 },
    { text: 'Follow one click through the whole stack', step: 10 },
    { text: 'Why the browser never talks to the database', step: 11 },
  ],
  steps: [
    {
      short: 'The app',
      beat: 'setup',
      title: 'Meet the app we’ll build',
      body: [
        'Throughout this course we’ll build one app: a **to-do list**. You type a todo, press *Add*, and it shows up in the list.',
        'Right now it’s just a web page running inside your browser. In web-speak the browser is the [[client]] — the side the user touches.',
      ],
      metrics: { places: 1, survives: 'no', shared: 'no' },
      scene: {
        nodes: s1,
        links: [link('you', 'web')],
        flows: [flow(['you', 'web'], { kind: 'event', label: 'click', every: 3.2 })],
      },
    },
    {
      short: 'Refresh',
      beat: 'problem',
      title: 'Refresh the page, and the list is gone',
      body: [
        'The todos lived in the page’s memory, inside that one browser tab. Refresh, close the tab, or open the app on your phone — they’re gone.',
        'The browser can save a little data for itself (`localStorage`), but only on *this* device. Your phone would still see an empty list.',
      ],
      callout: { kind: 'warn', text: 'Data that only lives in the browser dies with the tab — and never reaches your other devices.' },
      metrics: { places: 1, survives: 'no', shared: 'no' },
      scene: {
        nodes: patch(s1, { web: { screen: emptyTodos, state: 'error', badge: { text: 'refreshed', tone: 'danger' } } }),
        links: [link('you', 'web')],
        flows: [flow(['you', 'web'], { kind: 'event', label: 'refresh', every: 3.2 })],
      },
    },
    {
      short: 'Server',
      beat: 'solution',
      title: 'Keep the data on a server',
      body: [
        'Every web app solves this the same way: keep the data on another computer — a [[server]] — and have the page ask for it whenever it loads.',
        'The page sends a [[request]] (*“give me my todos”*) and the server sends back a [[response]] with the data. Any device, any time, same list.',
      ],
      changes: ['+ A server that holds the todos', '~ The page asks the server for them on load'],
      metrics: { places: 2, survives: 'yes', shared: 'yes' },
      scene: {
        nodes: s3,
        links: [link('you', 'web'), linkWS],
        flows: [flow(['web', 'srv'], { label: 'GET /todos', back: 'res', backLabel: '["Buy milk", …]', every: 3.4 })],
      },
    },
    {
      short: 'N · Node',
      beat: 'technique',
      title: 'N is for Node.js: JavaScript on the server',
      body: [
        'JavaScript was born inside browsers. **Node.js** takes the same engine ([[v8|V8]]) out of the browser and runs it on a server — so you can write the back end in the language you already use for the front end.',
        'A Node server is just a program that keeps running, listens on a port (here, `5000`) and answers each request that arrives.',
      ],
      code: {
        file: 'server.js',
        lang: 'js',
        code: `// start it with:  node server.js
import http from 'node:http';

const todos = ['Buy milk', 'Learn MERN'];

http.createServer((req, res) => {
  res.end(JSON.stringify(todos));
}).listen(5000);`,
        hl: [6, 7, 8],
      },
      changes: ['~ The server is a Node.js program listening on port 5000'],
      metrics: { places: 2, survives: 'yes', shared: 'yes' },
      scene: {
        nodes: patch(s3, { srv: nodeSrv, zs: { sub: 'Node.js' } }),
        links: [link('you', 'web'), linkWS],
        flows: [flow(['web', 'srv'], { label: 'GET /', back: 'res', backLabel: '["Buy milk", …]', every: 3.4 })],
      },
    },
    {
      short: 'E · Express',
      beat: 'technique',
      title: 'E is for Express: routes, not one giant if-statement',
      body: [
        'Plain Node hands you every request and leaves the rest to you. **Express** is a small library on top of Node that adds structure: you declare [[route|routes]] — a method plus a path — and the function that answers each one.',
        '`GET /api/todos` returns the list; `POST /api/todos` adds to it. Together, routes like these are your app’s [[api|API]].',
      ],
      code: { file: 'server.js', lang: 'js', code: expressCode, hl: [5, 6, 7] },
      changes: ['+ Express on top of Node', '+ Two routes: GET and POST /api/todos'],
      metrics: { places: 2, survives: 'yes', shared: 'yes' },
      scene: {
        nodes: patch(s5, { r1: { state: 'active' } }),
        links: [link('you', 'web'), linkWS],
        flows: [flow(['web', 'srv'], { label: 'GET /api/todos', back: 'res', backLabel: '200 OK · JSON', every: 3.4 })],
      },
    },
    {
      short: 'Restart',
      beat: 'problem',
      title: 'Restart the server… and the list is empty again',
      body: [
        'Our todos are a JavaScript array, so they live in the server’s memory. Deploy a fix, hit a crash, or reboot the machine, and memory is wiped.',
        'We moved the problem instead of solving it. Memory is fast but temporary; we need storage that survives restarts and can keep growing.',
      ],
      callout: { kind: 'warn', text: 'Never keep data you care about only in a server’s memory.' },
      code: { file: 'server.js', lang: 'js', code: `const todos = ['Buy milk', 'Learn MERN']; // lives in RAM\n\n// process restarts → todos is [] again`, hl: [1] },
      metrics: { places: 2, survives: 'no', shared: 'yes' },
      scene: {
        nodes: patch(s5, {
          srv: { state: 'error', badge: { text: 'restarted', tone: 'danger' } },
          web: { screen: emptyTodos },
        }),
        links: [link('you', 'web'), linkWS],
        flows: [flow(['web', 'srv'], { label: 'GET /api/todos', back: 'res', backLabel: '[ ] empty', every: 3.4 })],
      },
    },
    {
      short: 'M · MongoDB',
      beat: 'solution',
      title: 'M is for MongoDB: data that survives',
      body: [
        'A database keeps data safely on disk and finds it fast. **MongoDB** stores each todo as a [[document]] — an object with fields, very much like the JavaScript objects you already write.',
        'Documents of one kind live together in a [[collection]] (here, `todos`). The server asks MongoDB, MongoDB answers, and the server passes the result on.',
      ],
      code: {
        file: 'server.js',
        lang: 'js',
        code: `import mongoose from 'mongoose';
await mongoose.connect(process.env.MONGO_URL);

const Todo = mongoose.model('Todo', { text: String, done: Boolean });

app.get('/api/todos', async (req, res) => {
  const todos = await Todo.find();
  res.json(todos);
});`,
        hl: [6, 7, 8],
      },
      changes: ['+ MongoDB with a todos collection', '~ Express reads from the database instead of an array'],
      metrics: { places: 3, survives: 'yes', shared: 'yes' },
      scene: {
        nodes: s7,
        links: [link('you', 'web'), linkWS, linkSM],
        flows: [
          flow(['web', 'srv', 'mongo'], {
            label: ['GET /api/todos', 'find()'],
            back: 'res',
            backLabel: ['3 documents', '200 · JSON'],
            every: 4.6,
          }),
        ],
      },
    },
    {
      short: 'R · React',
      beat: 'technique',
      title: 'R is for React: from data to screen',
      body: [
        'The last piece draws the screen. With **React** you write [[component|components]] — functions that take data and return what the UI should look like.',
        '`TodoList` fetches the todos once, keeps them in [[state]], and turns each one into a list item. When the data changes, React updates the page for you; you never edit the [[dom|DOM]] by hand.',
      ],
      code: {
        file: 'TodoList.jsx',
        lang: 'jsx',
        code: `function TodoList() {
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    fetch('/api/todos')
      .then((res) => res.json())
      .then(setTodos);
  }, []);

  return (
    <ul>
      {todos.map((t) => <li key={t._id}>{t.text}</li>)}
    </ul>
  );
}`,
        hl: [4, 5, 6, 7, 12],
      },
      changes: ['~ The page is now a React app'],
      metrics: { places: 3, survives: 'yes', shared: 'yes' },
      scene: {
        nodes: patch(s8, { web: { state: 'active' } }),
        links: [link('you', 'web'), linkWS, linkSM],
        flows: [
          flow(['web', 'srv', 'mongo'], {
            label: ['fetch /api/todos', 'find()'],
            back: 'res',
            backLabel: ['3 documents', 'JSON → setTodos'],
            every: 4.6,
          }),
        ],
      },
    },
    {
      short: 'One language',
      beat: 'insight',
      title: 'One language, one shape of data',
      body: [
        'Look at what travels. A todo is a [[document]] in MongoDB (stored as [[bson|BSON]]), [[json|JSON]] on the wire, and a plain JavaScript object in Express and in React.',
        'It’s JavaScript from the database to the screen — no translating between languages and data formats at every boundary. That’s the big appeal of MERN.',
      ],
      callout: { kind: 'insight', text: 'The same field names go end to end: `todo.text` in React is the `text` field in MongoDB.' },
      metrics: { places: 3, survives: 'yes', shared: 'yes' },
      scene: {
        nodes: patch(s8, { todoDoc: { fields: todoDoc.fields.map((f) => (f.k === 'text' ? { ...f, hl: true } : f)) } }),
        links: [link('you', 'web'), link('web', 'srv', { label: 'JSON' }), link('srv', 'mongo', { label: 'BSON' })],
        flows: [
          flow(['web', 'srv', 'mongo'], {
            label: ['GET', 'find()'],
            back: 'res',
            backLabel: ['{ text: "Buy milk" }', '{ "text": "Buy milk" }'],
            every: 4.8,
          }),
        ],
      },
    },
    {
      short: 'One click',
      beat: 'technique',
      title: 'Follow one click through all four',
      body: [
        'You type *Call mom* and press **Add**. React sends `POST /api/todos` with the text in the body.',
        'Express matches the route and asks MongoDB to insert a document. MongoDB saves it and hands it back with a fresh `_id`. Express replies `201 Created`, and React adds the item to the list.',
        'Every feature you’ll ever build in MERN is some version of this round trip.',
      ],
      code: {
        file: 'server.js',
        lang: 'js',
        code: `app.post('/api/todos', async (req, res) => {
  const todo = await Todo.create({ text: req.body.text });
  res.status(201).json(todo);
});`,
        hl: [1, 2, 3],
      },
      metrics: { places: 3, survives: 'yes', shared: 'yes' },
      scene: {
        nodes: patch(s8, {
          web: { screen: [...todos.slice(0, 3), { t: 'item', text: 'Call mom', flash: true }, { t: 'input', text: 'New todo…', placeholder: true }, { t: 'btn', text: 'Add', state: 'active' }] },
          todoDoc: {
            fields: [field('_id', 'ObjectId("6741…f9")', { hl: true }), field('text', '"Call mom"', { hl: true }), field('done', 'false'), field('createdAt', 'ISODate("2026-11-23")')],
          },
          r2: { state: 'active' },
        }),
        links: [link('you', 'web'), linkWS, linkSM],
        flows: [
          flow(['you', 'web'], { kind: 'event', label: 'click “Add”', every: 5, dwell: 0 }),
          flow(['web', 'srv', 'mongo'], {
            offset: 0.75,
            every: 5,
            kind: 'data',
            label: ['POST /api/todos', 'insertOne()'],
            back: 'res',
            backLabel: ['{ _id, text }', '201 Created'],
          }),
        ],
      },
    },
    {
      short: 'Why a server?',
      beat: 'tradeoff',
      title: 'Why can’t React just talk to MongoDB?',
      body: [
        'It feels like a shortcut: skip the server, let the page query the database. But everything that runs in the browser is public. Anyone can open [[devtools|DevTools]], read your JavaScript and run their own.',
        'If React held the database password, every visitor would have it — and could read or delete everyone’s todos. The server is the gatekeeper: it checks *who you are* and *what you may do* before touching any data.',
      ],
      callout: { kind: 'mistake', text: 'Never put database URLs, API secrets or permission checks only in front-end code.' },
      metrics: { places: 3, survives: 'yes', shared: 'yes' },
      scene: {
        nodes: patch(s8, {
          r1: null,
          r2: null,
          gate: chip(500, 440, 'who are you? allowed?', { tone: 'auth', icon: 'shield' }),
          mongo: { state: 'active' },
        }),
        links: [
          link('you', 'web'),
          linkWS,
          linkSM,
          link('web', 'mongo', { route: 'over', bend: 58, state: 'error', label: 'no direct access' }),
        ],
        flows: [
          flow(['web', 'mongo'], { kind: 'err', label: 'mongodb://admin:…', fail: true, every: 4.2 }),
          flow(['web', 'srv', 'mongo'], { offset: 2.1, every: 4.2, label: ['GET /api/todos', 'find()'], back: 'res' }),
        ],
      },
    },
    {
      short: 'The map',
      beat: 'recap',
      title: 'The MERN map',
      body: [
        '{client:React} runs in the browser and turns data into UI.',
        '{server:Express} on {server:Node.js} runs on your server: it defines routes, checks every request, and talks to the database.',
        '{data:MongoDB} stores your data as documents, safely on disk.',
        'Every other lesson zooms into one part of this map. Whenever you write code, ask: *where does this run?*',
      ],
      callout: { kind: 'tip', text: 'The colours stay the same in every lesson: blue runs in the browser, orange on the server, green is data.' },
      metrics: { places: 3, survives: 'yes', shared: 'yes' },
      scene: {
        nodes: patch(s8, {
          todoDoc: null,
          r1: null,
          r2: null,
          lr: chip(170, 520, 'R · React', { tone: 'client', icon: 'react' }),
          le: chip(500, 440, 'E · Express', { tone: 'server', icon: 'express' }),
          ln: chip(500, 486, 'N · Node.js', { tone: 'server', icon: 'node' }),
          lm: chip(830, 470, 'M · MongoDB', { tone: 'data', icon: 'mongo' }),
        }),
        links: [link('you', 'web'), linkWS, linkSM],
        flows: [
          flow(['you', 'web'], { kind: 'event', every: 5.6, dwell: 0 }),
          flow(['web', 'srv', 'mongo'], { offset: 0.6, every: 5.6, back: 'res' }),
        ],
      },
    },
  ],
});
