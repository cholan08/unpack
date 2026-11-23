import { box, defineLesson, flow, link, zone } from '@/content/dsl';
import type { Badge, FlowSpec, NodeSpec } from '@/engine/types';

/* ---------- a 3 × 3 grid of todos inside the collection, Express on the left ---------- */
interface Todo { id: string; text: string; done: boolean; p: number }
const TODOS: Todo[] = [
  { id: 't1', text: 'Buy milk', done: false, p: 1 },
  { id: 't2', text: 'Learn MERN', done: false, p: 3 },
  { id: 't3', text: 'Call mom', done: true, p: 2 },
  { id: 't4', text: 'Fix bike', done: false, p: 2 },
  { id: 't5', text: 'Pay rent', done: true, p: 3 },
  { id: 't6', text: 'Book dentist', done: false, p: 1 },
  { id: 't7', text: 'Water plants', done: true, p: 1 },
  { id: 't8', text: 'Read docs', done: false, p: 2 },
  { id: 't9', text: 'Gym', done: false, p: 3 },
];
const NEW: Todo = { id: 't10', text: 'Pay taxes', done: false, p: 3 };
const COLS = [440, 625, 810];
const ROWS = [150, 265, 380, 495];
const pos = (i: number) => ({ x: COLS[i % 3], y: ROWS[Math.floor(i / 3)] });

const sub = (t: Todo) => `${t.done ? '✓ done' : 'open'} · priority ${t.p}`;
type Look = { state?: NodeSpec['state']; badge?: Badge; done?: boolean };

/** All todos (optionally with the new one), each styled by `look`. */
function grid(look: (t: Todo) => Look = () => ({}), withNew = true): Record<string, NodeSpec> {
  const all = withNew ? [...TODOS, NEW] : TODOS;
  return Object.fromEntries(
    all.map((t, i) => {
      const l = look(t);
      const shown = l.done === undefined ? t : { ...t, done: l.done };
      return [t.id, box(pos(i).x, pos(i).y, t.text, { sub: sub(shown), tone: 'data', w: 172, state: l.state, badge: l.badge })];
    }),
  );
}

const coll = zone(625, 322, 610, 536, 'todos collection', { tone: 'data', icon: 'mongo' });
const api = (call: string) => box(140, 300, 'Express', { sub: call, icon: 'express', tone: 'server', w: 236 });
const scene = (call: string, nodes: Record<string, NodeSpec>, flows: FlowSpec[] = []) => ({
  nodes: { coll, api: api(call), ...nodes },
  links: [link('api', 'coll')],
  flows,
});
/** Packets from Express to each affected todo, slightly staggered. */
const hits = (ids: string[], label: string, kind: FlowSpec['kind'] = 'req', back?: FlowSpec['kind']) =>
  ids.map((id, i) => flow(['api', id], { kind, label: i === 0 ? label : undefined, back, every: 4.6, offset: i * 0.18, speed: 1.4 }));

const open = [...TODOS, NEW].filter((t) => !t.done);
const ids = (ts: Todo[]) => ts.map((t) => t.id);
const MATCH: Look = { state: 'ok' };
const MISS: Look = { state: 'dim' };

export default defineLesson({
  metrics: [
    { id: 'matched', label: 'Documents matched' },
    { id: 'changed', label: 'Documents changed' },
    { id: 'total', label: 'Todos in the collection' },
  ],
  legend: { data: 'write', err: 'deleted' },
  goals: [
    { text: 'The four operations and their HTTP partners', step: 1 },
    { text: 'Filters and query operators', step: 4 },
    { text: 'Projection, sort and limit', step: 5 },
    { text: 'Updating with $set, $inc and $push', step: 6 },
    { text: 'The empty filter that deletes everything', step: 8 },
  ],
  steps: [
    {
      short: 'Four verbs',
      beat: 'setup',
      title: 'Four operations run every app',
      body: [
        'Almost everything an app does to its data is one of four things: **C**reate, **R**ead, **U**pdate, **D**elete — [[crud|CRUD]]. Each maps neatly onto a MongoDB method and an HTTP method from the REST lesson.',
        'Here are nine todos in a collection. Let’s run each operation against them and watch exactly which documents it touches.',
      ],
      code: {
        lang: 'text',
        file: 'CRUD ↔ MongoDB ↔ HTTP',
        code: `Create   insertOne / create        POST
Read     find / findOne            GET
Update   updateOne / updateMany    PATCH
Delete   deleteOne / deleteMany    DELETE`,
      },
      metrics: { matched: null, changed: null, total: 9 },
      scene: scene('Todo.*', grid(() => ({}), false)),
    },
    {
      short: 'Create',
      beat: 'technique',
      title: 'Create: insert a document',
      body: [
        '`Todo.create()` (Mongoose) or `insertOne()` (driver) adds a document. MongoDB gives it an `_id`, Mongoose fills in defaults like `done: false` and timestamps, and you get the saved document back — ready to send to the client with `201`.',
      ],
      code: {
        file: 'routes/todos.js',
        lang: 'js',
        code: `const todo = await Todo.create({ text: 'Pay taxes', priority: 3, userId });
// → { _id: ObjectId("…"), text: 'Pay taxes', done: false, priority: 3, createdAt: … }`,
        hl: [1],
      },
      metrics: { matched: null, changed: 1, total: 10 },
      scene: scene('Todo.create({ … })', grid((t) => (t.id === 't10' ? { state: 'ok', badge: { text: 'new', tone: 'ok' } } : {})), hits(['t10'], 'insertOne', 'data')),
    },
    {
      short: 'Read',
      beat: 'technique',
      title: 'Read: find what matches a filter',
      body: [
        'A query takes a **filter** — an object describing the documents you want. `{ done: false }` means “every todo whose `done` field equals `false`”. `find` returns all matches as an array; `findOne` returns the first or `null`.',
        'Seven of the ten match. The other three are never returned.',
      ],
      code: {
        file: 'routes/todos.js',
        lang: 'js',
        code: `const open = await Todo.find({ done: false });       // every match
const gym  = await Todo.findOne({ text: 'Gym' });     // first match, or null
const one  = await Todo.findById(req.params.id);     // by _id, or null`,
        hl: [1],
      },
      metrics: { matched: 7, changed: 0, total: 10 },
      scene: scene('find({ done: false })', grid((t) => (t.done ? MISS : MATCH)), hits(ids(open), '{ done: false }', 'req', 'res')),
    },
    {
      short: 'Operators',
      beat: 'technique',
      title: 'Query operators: more than “equals”',
      body: [
        'For conditions other than equality, use a [[query-operator|query operator]] — a `$` keyword inside the filter. Several fields in one filter must **all** match (an implicit AND).',
        'Here: open **and** priority 2 or higher. Five match.',
      ],
      code: {
        file: 'queries.js',
        lang: 'js',
        code: `Todo.find({ done: false, priority: { $gte: 2 } });   // both must hold
Todo.find({ priority: { $in: [1, 3] } });
Todo.find({ text: { $regex: /^b/i } });               // starts with "b"
Todo.find({ $or: [{ done: true }, { priority: 1 }] });
// $eq $ne $gt $gte $lt $lte $in $nin $exists $regex $or $and $not`,
        hl: [1],
      },
      metrics: { matched: 5, changed: 0, total: 10 },
      scene: scene('priority: { $gte: 2 }', grid((t) => (!t.done && t.p >= 2 ? MATCH : MISS)), hits(ids(open.filter((t) => t.p >= 2)), 'priority ≥ 2', 'req', 'res')),
    },
    {
      short: 'Shape results',
      beat: 'technique',
      title: 'Ask only for what you’ll show',
      body: [
        'A [[projection]] (`select`) returns only the fields you need instead of whole documents. `sort` orders the matches; `limit` caps how many come back. Together they turn “every open todo, every field” into “the top three, two fields each”.',
        'Smaller results mean less to read, less to send, and faster screens. A sort on an indexed field is cheap; on an unindexed one, MongoDB sorts in memory.',
      ],
      code: {
        file: 'queries.js',
        lang: 'js',
        code: `const top = await Todo.find({ done: false })
  .select('text priority')   // only these fields come back
  .sort({ priority: -1 })    // highest first
  .limit(3);`,
        hl: [2, 3, 4],
      },
      metrics: { matched: 7, changed: 0, total: 10 },
      scene: scene(
        '.sort().limit(3)',
        grid((t) => {
          const rank = ['t2', 't9', 't10'].indexOf(t.id);
          if (rank >= 0) return { state: 'ok', badge: { text: `#${rank + 1}`, tone: 'ok' } };
          return t.done ? MISS : {};
        }),
        hits(['t2', 't9', 't10'], 'top 3', 'req', 'res'),
      ),
    },
    {
      short: 'Update',
      beat: 'technique',
      title: 'Update: change fields with operators',
      body: [
        '`updateOne(filter, update)` changes the first match. The update uses operators too: `$set` writes fields, `$inc` adds to a number, `$push` appends to an array. Everything you don’t mention is left alone.',
        'The result tells you what happened: how many documents matched and how many actually changed. `findByIdAndUpdate(id, update, { new: true })` returns the updated document instead.',
      ],
      callout: { kind: 'warn', text: 'Replacing is different from updating: `replaceOne` swaps in your object and drops every field you didn’t include.' },
      code: {
        file: 'routes/todos.js',
        lang: 'js',
        code: `await Todo.updateOne({ _id: id }, { $set: { done: true } });
// → { acknowledged: true, matchedCount: 1, modifiedCount: 1 }

await Todo.updateOne({ _id: id }, { $inc: { priority: 1 } });
await Todo.updateOne({ _id: id }, { $push: { tags: 'urgent' } });`,
        hl: [1, 2],
      },
      metrics: { matched: 1, changed: 1, total: 10 },
      scene: scene('updateOne + $set', grid((t) => (t.id === 't1' ? { state: 'ok', done: true, badge: { text: '$set done: true', tone: 'ok' } } : {})), hits(['t1'], '$set { done: true }', 'data', 'res')),
    },
    {
      short: 'Delete',
      beat: 'technique',
      title: 'Delete: remove what matches',
      body: [
        '`deleteOne` removes the first match, `deleteMany` removes every match. “Clear completed” is a single `deleteMany({ done: true, userId })` — scoped to the current user, of course.',
        'The result’s `deletedCount` tells you how many went. There’s no undo.',
      ],
      code: {
        file: 'routes/todos.js',
        lang: 'js',
        code: `await Todo.deleteOne({ _id: id, userId });
const { deletedCount } = await Todo.deleteMany({ done: true, userId }); // 3`,
        hl: [2],
      },
      metrics: { matched: 3, changed: 3, total: 7 },
      scene: scene('deleteMany({ done })', grid((t) => (t.done ? { state: 'ghost', badge: { text: 'deleted', tone: 'danger' } } : {})), hits(['t3', 't5', 't7'], 'deleteMany', 'err')),
    },
    {
      short: 'Empty filter',
      beat: 'problem',
      title: 'The empty filter matches everything',
      body: [
        'An empty filter `{}` matches **every** document. That’s what you want for `find({})`, and a disaster for `deleteMany({})` or `updateMany({}, …)`.',
        'It usually happens by accident: a filter built from optional query parameters, where the parameter is missing. Always scope destructive queries by the user (`userId`), and refuse to run them with an empty filter.',
      ],
      check: {
        q: 'The client calls `DELETE /api/todos` but forgot `?done=true`. With the code shown, what gets deleted?',
        options: ['Nothing — the filter is incomplete', 'Only the done todos', 'Every todo in the collection, for every user', 'Mongoose throws a validation error'],
        answer: 2,
        explain: 'No `done` parameter means `filter` stays `{}`, which matches everything. `deleteMany({})` runs happily. Scope by `userId` and guard against empty filters.',
      },
      code: {
        file: 'routes/todos.js',
        lang: 'js',
        code: `const filter = {};
if (req.query.done) filter.done = req.query.done === 'true';
await Todo.deleteMany(filter); // no ?done= → filter is {} → deletes EVERYTHING

// ✅ always scope, and refuse empty filters
await Todo.deleteMany({ userId: req.user.id, done: true });`,
        err: [3],
        hl: [6],
      },
      metrics: { matched: 10, changed: 10, total: 0 },
      scene: scene('deleteMany({})', grid(() => ({ state: 'error' })), hits(ids([...TODOS, NEW]), 'deleteMany({})', 'err')),
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'CRUD in one screen',
      body: [
        '{data:Create} with `create`/`insertOne`; {data:read} with `find`/`findOne` and a filter object; {data:update} with `$set`, `$inc`, `$push`; {data:delete} with `deleteOne`/`deleteMany`.',
        'Use query operators for ranges and lists, `select` + `sort` + `limit` to fetch only what you show.',
        'Check `matchedCount`/`modifiedCount`/`deletedCount`, scope every write by user, and never let a filter end up empty by accident.',
      ],
      metrics: { matched: 7, changed: 0, total: 10 },
      scene: scene('find({ done: false })', grid((t) => (t.done ? MISS : MATCH)), hits(ids(open), '{ done: false }', 'req', 'res')),
    },
  ],
});
