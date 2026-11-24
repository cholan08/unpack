import { box, chip, defineLesson, doc, field, flow, link, zone } from '@/content/dsl';
import type { NodeSpec } from '@/engine/types';

/* ---------- layout: Express on the left, collections on the right ---------- */
const api = box(125, 300, 'Express', { sub: 'GET /api/lists/:id', icon: 'express', tone: 'server', w: 222 });

/* the model, as boxes (step 1) */
const eList = box(420, 300, 'List', { sub: 'name', icon: 'tree', tone: 'data', w: 170 });
const eTodo = box(650, 300, 'Todo', { sub: 'text · done', icon: 'file', tone: 'data', w: 170 });
const eUser = box(880, 300, 'User', { sub: 'name · email', icon: 'user', tone: 'data', w: 170 });

/* embedding */
const zl = zone(620, 300, 640, 548, 'lists collection', { tone: 'data', icon: 'mongo' });
const embedded = doc(620, 300, 'lists', [
  field('_id', 'ObjectId("…l1")'),
  field('name', '"Groceries"'),
  field('todos', '['),
  field('', '{ text: "Milk", done: false },', { indent: 1, hl: true }),
  field('', '{ text: "Eggs", done: true },', { indent: 1, hl: true }),
  field('', '{ text: "Bread", done: false }', { indent: 1, hl: true }),
  field('', ']'),
], { w: 380, sub: '1 document' });

const dupDoc = (x: number, name: string, rows: [string, string][]) =>
  doc(x, 300, 'lists', [
    field('name', `"${name}"`),
    field('todos', '['),
    ...rows.map(([t, by]) => field('', `{ text: "${t}", by: "${by}" },`, { indent: 1, hl: by === 'Ana' })),
    field('', ']'),
  ], { w: 292 });
const g1 = dupDoc(465, 'Groceries', [['Milk', 'Ana'], ['Eggs', 'Ben'], ['Bread', 'Ana']]);
const g2 = dupDoc(775, 'Party', [['Cake', 'Ana'], ['Music', 'Cy']]);

const bloated = doc(620, 300, 'lists', [
  field('name', '"Groceries"'),
  field('activity', '['),
  field('', '{ at: …, what: "checked Milk" },', { indent: 1 }),
  field('', '{ at: …, what: "added Eggs" },', { indent: 1 }),
  field('', '… 94,212 more entries', { indent: 1, hl: true, tone: 'danger' }),
  field('', ']'),
], { w: 380, sub: '14.2 MB', state: 'error', badge: { text: 'limit is 16 MB', tone: 'danger' } });

/* referencing */
const zt = zone(620, 160, 640, 268, 'todos collection', { tone: 'data', icon: 'mongo' });
const zu = zone(620, 455, 640, 250, 'users collection', { tone: 'data', icon: 'mongo' });
const t1 = doc(465, 170, 'todo', [field('text', '"Milk"'), field('listId', 'ObjectId("…l1")'), field('assigneeId', 'ObjectId("…a1")', { hl: true })], { w: 292 });
const t2 = doc(775, 170, 'todo', [field('text', '"Eggs"'), field('listId', 'ObjectId("…l1")'), field('assigneeId', 'ObjectId("…b2")', { hl: true })], { w: 292 });
const u1 = doc(465, 462, 'user', [field('_id', 'ObjectId("…a1")', { hl: true }), field('name', '"Ana"'), field('email', '"ana@example.com"')], { w: 292 });
const u2 = doc(775, 462, 'user', [field('_id', 'ObjectId("…b2")', { hl: true }), field('name', '"Ben"'), field('email', '"ben@example.com"')], { w: 292 });
const refNodes: Record<string, NodeSpec> = { api, zt, zu, t1, t2, u1, u2 };
const refLinks = [
  link('api', 't1'),
  link('api', 'u1'),
  link('t1', 'u1', { style: 'dashed', tone: 'data', label: 'assigneeId' }),
  link('t2', 'u2', { style: 'dashed', tone: 'data', label: 'assigneeId' }),
];
const twoQueries = [
  flow(['api', 't1'], { label: 'find({ listId })', back: 'res', backLabel: 'todos', every: 5.6 }),
  flow(['api', 'u1'], { label: 'find({ _id: { $in } })', back: 'res', backLabel: 'users', every: 5.6, offset: 2.4 }),
];

export default defineLesson({
  metrics: [
    { id: 'queries', label: 'Queries per page', better: 'lower' },
    { id: 'copies', label: 'Copies of Ana’s name', better: 'lower' },
    { id: 'size', label: 'Biggest document' },
  ],
  goals: [
    { text: 'What embedding gives you', step: 2 },
    { text: 'The cost of copying shared data', step: 3 },
    { text: 'Why arrays must not grow forever', step: 4 },
    { text: 'Referencing, populate() and $lookup', step: 5 },
    { text: 'A rule of thumb for choosing', step: 7 },
  ],
  steps: [
    {
      short: 'The model',
      beat: 'setup',
      title: 'Lists, todos, and the people they’re for',
      body: [
        'Our app grows up: todos now live in **lists** (Groceries, Party), and each todo can be **assigned** to a user.',
        'In SQL you’d make three tables and join them. MongoDB gives you a choice for every relationship: [[embed|embed]] the related data inside the document, or [[reference|reference]] it by id.',
      ],
      metrics: { queries: null, copies: null, size: null },
      scene: {
        nodes: { api, eList, eTodo, eUser },
        links: [link('eList', 'eTodo', { label: 'has many' }), link('eTodo', 'eUser', { label: 'assigned to' })],
      },
    },
    {
      short: 'Embed',
      beat: 'technique',
      title: 'Embed: keep the todos inside the list',
      body: [
        'Store the todos as an **array inside** the list document. Opening a list is then a single read: one document, everything needed for the screen.',
        'Writes are simple too — a list and its todos are saved together, atomically, in one operation.',
      ],
      code: {
        file: 'models/List.js',
        lang: 'js',
        code: `const listSchema = new Schema({
  name: String,
  todos: [{ text: String, done: Boolean }], // embedded
});

const list = await List.findById(id); // one read: list + its todos`,
        hl: [3, 6],
      },
      metrics: { queries: 1, copies: '—', size: '1 KB' },
      scene: {
        nodes: { api, zl, embedded },
        links: [link('api', 'embedded')],
        flows: [flow(['api', 'embedded'], { label: 'findById(id)', back: 'res', backLabel: 'list + todos', every: 3.8 })],
      },
    },
    {
      short: 'Copies',
      beat: 'problem',
      title: 'Embed shared data, and you get copies to keep in sync',
      body: [
        'Embedding the assignee’s name in each todo looks handy — no extra lookup to show “Milk · Ana”. But Ana appears in many lists, so now her name is **copied** everywhere she has a todo.',
        'When Ana renames herself to Anna, you have to find and update every copy. Miss one and the app shows two different names for the same person. That’s the cost of [[denormalize|denormalising]].',
      ],
      code: {
        file: 'rename Ana',
        lang: 'js',
        code: `// every list where Ana has a todo, every matching todo inside it
await List.updateMany(
  { 'todos.by': 'Ana' },
  { $set: { 'todos.$[t].by': 'Anna' } },
  { arrayFilters: [{ 't.by': 'Ana' }] },
);`,
        hl: [2, 3, 4, 5],
      },
      metrics: { queries: 1, copies: 3, size: '1 KB' },
      scene: {
        nodes: { api, zl, g1, g2, rename: chip(620, 492, 'Ana → Anna: update 3 copies', { tone: 'warn', icon: 'search', state: 'active' }) },
        links: [link('api', 'g1'), link('g1', 'g2', { style: 'dashed', arrow: false })],
        flows: [flow(['api', 'g1', 'g2'], { kind: 'data', label: ['updateMany', 'and here…'], every: 4.4 })],
      },
    },
    {
      short: 'Growing arrays',
      beat: 'problem',
      title: 'Arrays that grow forever break the document',
      body: [
        'Now someone embeds an **activity log** in each list: every check, edit and rename appends an entry. Busy lists collect tens of thousands of them.',
        'Every read drags the whole log along even when you only need the name, every write rewrites a huge document, and MongoDB refuses any document over **16 MB**. Unbounded arrays don’t belong inside a document.',
      ],
      callout: { kind: 'warn', text: 'If an array can grow without a limit (comments, logs, messages, orders), put the items in their own collection.' },
      metrics: { queries: 1, copies: 3, size: '14 MB' },
      scene: {
        nodes: { api, zl, bloated },
        links: [link('api', 'bloated')],
        flows: [flow(['api', 'bloated'], { label: 'findById(id)', back: 'res', backLabel: '14 MB to show a name', every: 4.4, speed: 0.55 })],
      },
    },
    {
      short: 'Reference',
      beat: 'solution',
      title: 'Reference: store the id, keep one copy',
      body: [
        'Move todos and users into their own collections. A todo stores only the **id** of its list and of its assignee — like a foreign key in SQL.',
        'Ana’s name now lives in exactly one document, so renaming her is one tiny update. The price: showing a list takes **two** queries — the todos, then the users they point to.',
      ],
      code: {
        file: 'models/Todo.js',
        lang: 'js',
        code: `const todoSchema = new Schema({
  listId:     { type: Schema.Types.ObjectId, ref: 'List', index: true },
  text:       String,
  assigneeId: { type: Schema.Types.ObjectId, ref: 'User' }, // just the id
});

const todos = await Todo.find({ listId });                    // query 1
const ids = todos.map((t) => t.assigneeId);
const users = await User.find({ _id: { $in: ids } });         // query 2`,
        hl: [4, 7, 9],
      },
      changes: ['+ todos and users in their own collections', '~ todos keep only ids', '~ renaming Ana is one update'],
      metrics: { queries: 2, copies: 1, size: '1 KB' },
      scene: { nodes: refNodes, links: refLinks, flows: twoQueries },
    },
    {
      short: 'populate()',
      beat: 'technique',
      title: 'Let Mongoose or MongoDB do the joining',
      body: [
        'You don’t have to stitch results together by hand. Mongoose’s [[populate|populate()]] runs the second query for you and swaps each id for the document it points to.',
        'Or join inside the database with an aggregation [[lookup|$lookup]] stage. Either way, keep an index on the field you join on.',
      ],
      code: {
        file: 'routes/lists.js',
        lang: 'js',
        code: `// Mongoose sends the second query for you
const todos = await Todo.find({ listId }).populate('assigneeId', 'name');

// or join inside MongoDB
const rows = await Todo.aggregate([
  { $match: { listId } },
  { $lookup: { from: 'users', localField: 'assigneeId',
               foreignField: '_id', as: 'assignee' } },
]);`,
        hl: [2, 7],
      },
      metrics: { queries: 2, copies: 1, size: '1 KB' },
      scene: {
        nodes: { ...refNodes, api: { ...api, sub: 'find().populate()', state: 'active' } },
        links: refLinks,
        flows: [
          flow(['api', 't1'], { label: 'find({ listId })', back: 'res', backLabel: 'todos', every: 5.6 }),
          flow(['api', 'u1'], { label: 'populate → users', back: 'res', backLabel: 'names', every: 5.6, offset: 2.4 }),
        ],
      },
    },
    {
      short: 'Rule of thumb',
      beat: 'insight',
      title: 'Embed what you own, reference what you share',
      body: [
        '**Embed** when the data belongs to one parent, is almost always read together with it, and stays small — “one-to-few”: a user’s addresses, a list’s handful of tags.',
        '**Reference** when the data is shared by many documents, changes on its own, or can grow without limit — users, products, comments, orders.',
        'Design around your queries: what does each screen need to read, and how often does each piece change?',
      ],
      check: {
        q: 'A blog post can collect thousands of comments, and the page shows the newest 20. How should you store comments?',
        options: ['Embed every comment in the post document', 'In their own collection, each with a postId', 'Store the post inside every comment', 'Keep them only in the browser'],
        answer: 1,
        explain: 'Comments are unbounded and paged, so give them their own collection with an index on `{ postId, createdAt }`. (A common refinement embeds just the latest few in the post for speed — the “subset pattern”.)',
      },
      metrics: { queries: 2, copies: 1, size: '1 KB' },
      scene: { nodes: refNodes, links: refLinks, flows: twoQueries },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Choosing between embed and reference',
      body: [
        '{data:Embed}: one read, atomic writes — for small, owned data read together with its parent.',
        '{danger:Watch out} for copies of shared data and for arrays that grow without limit (16 MB cap).',
        '{data:Reference}: one copy, flexible — at the cost of a second query (`populate()` / `$lookup`). Index the ids you join on.',
      ],
      metrics: { queries: 2, copies: 1, size: '1 KB' },
      scene: { nodes: refNodes, links: refLinks, flows: twoQueries },
    },
  ],
});
