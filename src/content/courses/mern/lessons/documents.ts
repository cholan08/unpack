import { box, chip, code, db, defineLesson, doc, field, flow, link, zone } from '@/content/dsl';

/* ---------- reusable pieces ---------- */
const OID = '6b040fa04f2a9d1e7b0c3a51';
const api = box(130, 300, 'Express', { sub: 'Todo.findById(id)', icon: 'express', tone: 'server', w: 200 });

const fullDoc = doc(590, 300, 'todos · one document', [
  field('_id', `ObjectId("${OID}")`),
  field('text', '"Buy milk"'),
  field('done', 'false'),
  field('tags', '[ "errand", "home" ]', { hl: true }),
  field('assignee', '{', { hl: true }),
  field('name', '"Ana"', { indent: 1, hl: true }),
  field('email', '"ana@example.com"', { indent: 1, hl: true }),
  field('', '}', { hl: true }),
  field('createdAt', 'ISODate("2026-11-23T10:04:16Z")'),
], { w: 400 });

export default defineLesson({
  goals: [
    { text: 'How documents differ from table rows', step: 1 },
    { text: 'Databases, collections and documents', step: 2 },
    { text: 'Nested objects and arrays', step: 3 },
    { text: 'What’s inside an ObjectId', step: 4 },
    { text: 'BSON types and why they matter', step: 5 },
    { text: 'The upside and danger of a flexible schema', step: 6 },
  ],
  steps: [
    {
      short: 'Rows vs docs',
      beat: 'setup',
      title: 'From rows in tables to documents',
      body: [
        'A SQL database stores data in **tables**: fixed columns, one row per record. Anything list-like — a todo’s tags — needs a second table and a join to put it back together.',
        'MongoDB stores each record as a [[document]]: a JSON-like object that can hold arrays and nested objects directly. The todo and its tags are one thing, stored as one thing.',
      ],
      scene: {
        nodes: {
          sql: code(260, 250, ` id │ text        │ done │ user_id
────┼─────────────┼──────┼────────
  1 │ Buy milk    │ f    │ 42
  2 │ Learn MERN  │ f    │ 42
  3 │ Call mom    │ t    │ 7`, { file: 'SQL · todos table', lang: 'text', w: 380, tone: 'neutral', icon: 'db' }),
          tags: code(260, 470, ` todo_id │ tag
─────────┼────────
       1 │ errand
       1 │ home`, { file: 'SQL · todo_tags table', lang: 'text', w: 380, tone: 'neutral', icon: 'db' }),
          d1: doc(760, 200, 'todos', [field('text', '"Buy milk"'), field('done', 'false'), field('userId', '42'), field('tags', '[ "errand", "home" ]', { hl: true })], { w: 300 }),
          d2: doc(760, 420, 'todos', [field('text', '"Learn MERN"'), field('done', 'false'), field('userId', '42')], { w: 300 }),
        },
        links: [link('sql', 'd1', { style: 'dashed', label: 'same data' }), link('tags', 'd1', { style: 'dashed', label: 'no join needed' })],
      },
    },
    {
      short: 'Hierarchy',
      beat: 'technique',
      title: 'Server → database → collections → documents',
      body: [
        'One MongoDB server (or cluster) holds several **databases** — usually one per app. A database holds [[collection|collections]], one per kind of thing: `todos`, `users`. Collections hold the documents.',
        'There’s no “create table” step: a collection springs into existence the first time you insert into it.',
      ],
      code: {
        lang: 'text',
        file: 'mongosh',
        code: `> use todo_app
> show collections
todos
users
> db.todos.countDocuments()
3`,
        hl: [1, 2],
      },
      scene: {
        nodes: {
          srv: db(120, 320, 'MongoDB', { sub: 'server / cluster', w: 150, h: 124 }),
          zdb: zone(610, 320, 680, 500, 'database: todo_app', { tone: 'data', icon: 'db' }),
          zt: zone(450, 345, 300, 390, 'collection: todos', { tone: 'data', icon: 'boxes' }),
          zu: zone(770, 345, 300, 390, 'collection: users', { tone: 'data', icon: 'boxes' }),
          t1: chip(450, 230, '{ text: "Buy milk", … }', { tone: 'data', w: 250 }),
          t2: chip(450, 300, '{ text: "Learn MERN", … }', { tone: 'data', w: 250 }),
          t3: chip(450, 370, '{ text: "Call mom", … }', { tone: 'data', w: 250 }),
          u1: chip(770, 230, '{ name: "Ana", … }', { tone: 'data', w: 250 }),
          u2: chip(770, 300, '{ name: "Ben", … }', { tone: 'data', w: 250 }),
        },
        links: [link('srv', 'zdb')],
        flows: [flow(['srv', 'zdb'], { kind: 'data', label: 'use todo_app', every: 4 })],
      },
    },
    {
      short: 'A document',
      beat: 'technique',
      title: 'Inside a document',
      body: [
        'A document is a set of field–value pairs, like a JavaScript object. Values can be strings, numbers, booleans and dates — but also **arrays** (`tags`) and **embedded objects** (`assignee`), nested as deep as you need.',
        'One read returns the whole shape, exactly as your React component wants to display it. Every document also has an `_id` that is unique within its collection.',
      ],
      scene: {
        nodes: { api, full: fullDoc },
        links: [link('api', 'full')],
        flows: [flow(['api', 'full'], { label: 'findById', back: 'res', backLabel: 'the whole document', every: 4 })],
      },
    },
    {
      short: '_id',
      beat: 'technique',
      title: 'Every document’s name: _id and ObjectId',
      body: [
        'If you don’t provide an `_id`, the driver generates an [[objectid|ObjectId]]: 12 bytes shown as 24 hex characters. The first 4 bytes are the **creation time**, the rest are random plus a counter.',
        'So ids can be made on any machine without asking the database (no shared counter to wait for), they’re unique in practice, and sorting by `_id` roughly sorts by creation time.',
      ],
      code: {
        file: 'node',
        lang: 'js',
        code: `const id = new ObjectId();
id.toHexString();  // '6b040fa04f2a9d1e7b0c3a51'
id.getTimestamp(); // 2026-11-23T10:04:16.000Z — the creation time is built in`,
        hl: [3],
      },
      scene: {
        nodes: {
          d: doc(600, 200, 'todos', [field('_id', `ObjectId("${OID}")`, { hl: true }), field('text', '"Buy milk"'), field('done', 'false')], { w: 420 }),
          ts: chip(380, 420, 'timestamp 6b040fa0', { tone: 'net', icon: 'clock', w: 200, badge: { text: '2026-11-23 10:04:16 UTC', tone: 'net' } }),
          rnd: chip(600, 420, 'random 4f2a9d1e7b', { tone: 'neutral', icon: 'bolt', w: 200 }),
          ctr: chip(820, 420, 'counter 0c3a51', { tone: 'neutral', icon: 'loop', w: 200 }),
        },
        links: [
          link('d', 'ts', { style: 'dashed', arrow: false }),
          link('d', 'rnd', { style: 'dashed', arrow: false }),
          link('d', 'ctr', { style: 'dashed', arrow: false }),
        ],
      },
    },
    {
      short: 'BSON',
      beat: 'technique',
      title: 'JSON on the wire, BSON on disk',
      body: [
        'MongoDB stores documents as [[bson|BSON]] — binary JSON with **more types**: real dates, ObjectIds, 32- and 64-bit integers, exact decimals for money, binary data.',
        'JSON has no date type, so a date arrives from the browser as a string. Store it as a string and `$lt: new Date()` silently matches nothing; let Mongoose cast it to a real `Date` and range queries and sorting just work.',
      ],
      code: {
        file: 'queries.js',
        lang: 'js',
        code: `// works because dueAt is stored as a Date, not a string
const overdue = await Todo.find({ dueAt: { $lt: new Date() } });

// BSON types JSON doesn't have:
// Date · ObjectId · Int32 · Int64 · Decimal128 · Binary`,
        hl: [2],
      },
      scene: {
        nodes: {
          json: doc(215, 300, 'JSON from the browser', [field('"text"', '"Buy milk"'), field('"dueAt"', '"2026-12-01T09:00:00Z"', { hl: true }), field('"priority"', '2')], { w: 330, tone: 'client', icon: 'browser' }),
          mid: box(500, 300, 'Mongoose', { sub: 'casts types', icon: 'boxes', tone: 'server', w: 190 }),
          bson: doc(785, 300, 'BSON in MongoDB', [field('_id', 'ObjectId("6b04…3a51")'), field('text', '"Buy milk"'), field('dueAt', 'ISODate("2026-12-01T09:00Z")', { hl: true }), field('priority', '2')], { w: 330 }),
        },
        links: [link('json', 'mid'), link('mid', 'bson')],
        flows: [flow(['json', 'mid', 'bson'], { kind: 'data', label: ['string date', 'real Date'], every: 4.4 })],
      },
    },
    {
      short: 'Flexible',
      beat: 'tradeoff',
      title: 'A flexible schema cuts both ways',
      body: [
        'MongoDB doesn’t force documents in a collection to share a shape. That’s handy: add a field to new documents without migrating old ones.',
        'It also means nothing stops a typo. One document says `done`, another `isDone`, a third has `title` instead of `text` and `done: "no"` as a string. Your React list shows a blank row and the filter `{ done: false }` misses two of them. Enforce the shape in your app (Mongoose schemas), or in the database itself with a JSON Schema validator.',
      ],
      check: {
        q: 'You insert `{ titel: "Call mom" }` (a typo) into `todos`. What does MongoDB do by default?',
        options: ['Rejects it: unknown field', 'Saves it exactly as given', 'Corrects it to `title`', 'Saves it without the unknown field'],
        answer: 1,
        explain: 'With no validator, MongoDB stores whatever you send. Shape is your job — Mongoose schemas or a `$jsonSchema` validator on the collection.',
      },
      code: {
        file: 'mongosh',
        lang: 'js',
        code: `db.createCollection('todos', {
  validator: { $jsonSchema: {
    required: ['text', 'done'],
    properties: { text: { bsonType: 'string' }, done: { bsonType: 'bool' } },
  } },
});`,
        hl: [3, 4],
      },
      scene: {
        nodes: {
          zt: zone(500, 300, 880, 310, 'collection: todos', { tone: 'data', icon: 'boxes' }),
          a: doc(220, 315, 'todos', [field('text', '"Buy milk"'), field('done', 'false')], { w: 250, state: 'ok' }),
          b: doc(500, 315, 'todos', [field('text', '"Learn MERN"'), field('isDone', 'true', { hl: true })], { w: 250, badge: { text: 'isDone?', tone: 'warn' } }),
          c: doc(780, 315, 'todos', [field('title', '"Call mom"', { hl: true }), field('done', '"no"', { hl: true })], { w: 250, state: 'error', badge: { text: 'no text, string bool', tone: 'danger' } }),
        },
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'MongoDB’s building blocks',
      body: [
        'A {data:server} holds databases; a {data:database} holds collections (one per kind of thing); a {data:collection} holds documents. Collections appear on first insert.',
        'A {data:document} is a JSON-like object with nested objects and arrays, stored as BSON with real dates and numbers. Every one has a unique `_id` — by default an ObjectId with its creation time built in.',
        'The schema is flexible, so consistency is up to you: Mongoose schemas or a collection validator.',
      ],
      scene: { nodes: { api, full: fullDoc }, links: [link('api', 'full')], flows: [flow(['api', 'full'], { label: 'findById', back: 'res', every: 4 })] },
    },
  ],
});
