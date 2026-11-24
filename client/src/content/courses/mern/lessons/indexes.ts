import { box, chip, defineLesson, defineSandbox, doc, field, flow, fmt, humanTime, link, range, toggle, zone } from '@/content/dsl';
import type { NodeSpec } from '@/engine/types';

/* ---------- 20 documents stand in for 10 million ---------- */
const USER_IDS = [17, 58, 3, 91, 42, 77, 23, 8, 65, 30, 12, 84, 42, 51, 36, 99, 5, 70, 27, 61];
const COLS = [555, 665, 775, 885];
const ROWS = [120, 210, 300, 390, 480];
const ids = USER_IDS.map((_, i) => `d${i}`);
const matches = ids.filter((_, i) => USER_IDS[i] === 42); // d4, d12

function docs(state: (i: number) => NodeSpec['state'] = () => undefined): Record<string, NodeSpec> {
  return Object.fromEntries(
    USER_IDS.map((u, i) => [
      `d${i}`,
      chip(COLS[i % 4], ROWS[Math.floor(i / 4)], `user ${u}`, { tone: 'data', state: state(i), w: 86 }),
    ]),
  );
}
const isMatch = (i: number) => USER_IDS[i] === 42;

const coll = zone(720, 300, 470, 500, 'todos collection', { tone: 'data', icon: 'mongo', sub: '10,000,000 docs' });
const api = box(100, 300, 'Express', { sub: 'Todo.find(…)', icon: 'express', tone: 'server', w: 170 });

const sorted = [...USER_IDS].sort((a, b) => a - b);
const index = (hl = false) =>
  doc(
    315,
    300,
    'index on userId',
    sorted.map((u) => field(String(u).padStart(2, ' '), '→ ●', { hl: hl && u === 42 })),
    { icon: 'search', w: 150, tone: 'data' },
  );

const scanFlow = flow(['api', ...ids], {
  label: 'userId = 42 ?',
  speed: 2.4,
  dwell: 0.02,
  back: 'res',
  returnVia: [ids[ids.length - 1], 'api'],
  backLabel: '2 docs',
  every: 6.4,
});
const idxLinks = [link('api', 'idx'), ...matches.map((m) => link('idx', m, { style: 'dashed', tone: 'data' }))];
const idxFlows = [
  flow(['api', 'idx'], { label: 'userId = 42', every: 3.6, dwell: 0.35 }),
  ...matches.map((m, i) => flow(['idx', m], { kind: 'data', label: 'fetch', every: 3.6, offset: 1.15 + i * 0.25 })),
];

/* ---------- sandbox: grow the collection, add or drop the index ---------- */
const NS_PER_DOC = 214; // a scan checks ~4.7 million docs a second (matches the 2.1 s above)
const sandbox = defineSandbox({
  intro: 'Drag the collection size and flip the index on and off. Watch **docs examined** and **query time** — and notice which one the index makes stop caring about size.',
  controls: [
    range('docs', 'Todos in the collection', { min: 1000, max: 100_000_000, value: 10_000_000, log: true, format: fmt }),
    toggle('indexed', 'Index on userId'),
  ],
  compute: (v) => {
    const n = Number(v.docs);
    const indexed = v.indexed === true;
    const depth = Math.max(1, Math.ceil(Math.log(n) / Math.log(200))); // ~200 keys per B-tree page
    const ms = indexed ? 1 : Math.max(1, Math.round((n * NS_PER_DOC) / 1e6));
    const slow: 'danger' | 'warn' | 'ok' = ms >= 1000 ? 'danger' : ms >= 100 ? 'warn' : 'ok';
    const nodes: Record<string, NodeSpec> = {
      coll: { ...coll, sub: `${fmt(n)} docs`, state: indexed ? undefined : ('active' as const) },
      api: { ...api, state: !indexed && slow !== 'ok' ? ('busy' as const) : undefined, badge: { text: humanTime(ms / 1000), tone: slow } },
      ...docs((i) => (isMatch(i) ? 'ok' : indexed ? 'dim' : undefined)),
      ...(indexed ? { idx: { ...index(true), state: 'active' as const, badge: { text: `${depth} level${depth > 1 ? 's' : ''} deep`, tone: 'data' as const } } } : {}),
    };
    return {
      scene: indexed ? { nodes, links: idxLinks, flows: idxFlows } : { nodes, flows: [{ ...scanFlow, speed: n > 1e6 ? 1.6 : 2.4 }] },
      metrics: { examined: indexed ? 2 : n, returned: 2, ms },
      tone: indexed ? 'ok' : slow,
      note: indexed
        ? `{data:IXSCAN}: ${depth} B-tree step${depth > 1 ? 's' : ''} to reach \`42\`, then 2 documents. Still about **1 ms** — at ${fmt(n)} todos or a hundred times more.`
        : ms < 100
          ? `A {danger:COLLSCAN} of ${fmt(n)} docs takes **${humanTime(ms / 1000)}** — nobody notices. That’s why missing indexes hide in development and bite in production.`
          : `{danger:COLLSCAN}: every request reads all **${fmt(n)}** docs to return 2 — **${humanTime(ms / 1000)}** each. At 50 requests a second the database can’t keep up.`,
    };
  },
});

const query = `// GET /api/todos — only the logged-in user's todos
const todos = await Todo.find({ userId: req.user.id });`;

export default defineLesson({
  metrics: [
    { id: 'examined', label: 'Docs examined', better: 'lower' },
    { id: 'returned', label: 'Docs returned' },
    { id: 'ms', label: 'Query time', unit: 'ms', better: 'lower' },
  ],
  legend: { data: 'document fetch' },
  goals: [
    { text: 'What a collection scan costs', step: 2 },
    { text: 'What an index actually is', step: 3 },
    { text: 'How an index scan finds matches', step: 4 },
    { text: 'What indexes cost you', step: 5 },
    { text: 'How to check a query with explain()', step: 6 },
    { text: 'Feel the difference at any scale', step: 7 },
  ],
  steps: [
    {
      short: 'The query',
      beat: 'setup',
      title: 'Every user wants only their own todos',
      body: [
        'Our app took off. The `todos` collection now holds **10 million** documents — the 20 here stand in for them.',
        'Every page load runs the same query: find the todos whose `userId` matches the logged-in user. User 42 has just two.',
      ],
      code: { file: 'routes/todos.js', lang: 'js', code: query, hl: [2] },
      metrics: { examined: null, returned: null, ms: null },
      scene: { nodes: { coll, api, ...docs() } },
    },
    {
      short: 'COLLSCAN',
      beat: 'problem',
      title: 'Without help, MongoDB reads everything',
      body: [
        'MongoDB has no idea where user 42’s todos are, so it does the only thing it can: read **every** document and check its `userId`. That’s a [[collscan|collection scan]].',
        'It finds 2 matches — after examining all 10 million. The cost grows with the size of the collection, not with the size of the answer.',
      ],
      code: {
        lang: 'js',
        file: 'mongosh',
        code: `db.todos.find({ userId: 42 }).explain('executionStats')

{ stage: 'COLLSCAN',
  nReturned: 2,
  totalDocsExamined: 10000000,
  executionTimeMillis: 2140 }`,
        err: [3, 5],
      },
      metrics: { examined: 10000000, returned: 2, ms: 2140 },
      scene: {
        nodes: { coll: { ...coll, state: 'active' }, api: { ...api, state: 'busy', badge: { text: '2.1 s', tone: 'danger' } }, ...docs((i) => (isMatch(i) ? 'ok' : undefined)) },
        flows: [scanFlow],
      },
    },
    {
      short: 'An index',
      beat: 'solution',
      title: 'An index: the field, sorted, with pointers',
      body: [
        'An [[index]] is a separate structure that keeps the values of one field **in sorted order**, each with a pointer back to its document — like the index at the back of a book.',
        'You create it once. MongoDB keeps it up to date on every write from then on.',
      ],
      code: {
        file: 'models/Todo.js',
        lang: 'js',
        code: `const todoSchema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  text: String,
  done: Boolean,
});

todoSchema.index({ userId: 1 }); // 1 = ascending`,
        hl: [7],
      },
      changes: ['+ An index on userId, sorted ascending'],
      metrics: { examined: null, returned: null, ms: null },
      scene: { nodes: { coll, api, idx: index(), ...docs() }, links: [link('api', 'idx')] },
    },
    {
      short: 'IXSCAN',
      beat: 'technique',
      title: 'Index scan: jump straight to 42',
      body: [
        'Because the keys are sorted, MongoDB can home in on `42` in a few steps (indexes are [[b-tree|B-trees]]), read the two matching entries, and follow their pointers. That’s an [[ixscan|index scan]].',
        'Two documents examined, two returned. The other 9,999,998 are never touched.',
      ],
      check: {
        q: 'The collection doubles from 10 million to 20 million todos. What happens to this indexed lookup?',
        options: ['It gets twice as slow', 'Barely changes — maybe one extra step', 'It becomes a collection scan', 'It gets faster'],
        answer: 1,
        explain: 'A B-tree lookup grows with the *logarithm* of the size: doubling the data adds about one level at most. That’s why indexed queries stay fast as you grow.',
      },
      code: {
        lang: 'js',
        file: 'mongosh',
        code: `{ stage: 'FETCH',
  inputStage: { stage: 'IXSCAN', keyPattern: { userId: 1 } },
  nReturned: 2,
  totalDocsExamined: 2,
  executionTimeMillis: 1 }`,
        hl: [2, 4, 5],
      },
      metrics: { examined: 2, returned: 2, ms: 1 },
      scene: {
        nodes: { coll, api: { ...api, badge: { text: '1 ms', tone: 'ok' } }, idx: { ...index(true), state: 'active' }, ...docs((i) => (isMatch(i) ? 'ok' : 'dim')) },
        links: idxLinks,
        flows: idxFlows,
      },
    },
    {
      short: 'The cost',
      beat: 'tradeoff',
      title: 'Indexes aren’t free',
      body: [
        'Every insert, update and delete now writes twice: the document **and** each index on the collection. Indexes also take disk space and, to be fast, memory.',
        'So don’t index every field. Index the fields your frequent queries **filter** and **sort** by — and drop the ones nothing uses.',
      ],
      metrics: { examined: null, returned: null, ms: 3 },
      scene: {
        nodes: {
          coll,
          api: { ...api, sub: 'Todo.create(…)' },
          idx: { ...index(true), state: 'busy', badge: { text: 'updated on write', tone: 'warn' } },
          ...docs(),
          d4: chip(COLS[0], ROWS[1], 'user 42', { tone: 'data', w: 86, state: 'ok', badge: { text: 'new', tone: 'ok' } }),
        },
        links: [link('api', 'idx'), link('idx', 'd4', { style: 'dashed', tone: 'data' })],
        flows: [
          flow(['api', 'idx'], { kind: 'data', label: 'insert key 42', every: 3.4 }),
          flow(['idx', 'd4'], { kind: 'data', label: 'write doc', every: 3.4, offset: 1.1 }),
        ],
      },
    },
    {
      short: 'Sort + explain',
      beat: 'technique',
      title: 'Match your queries — and check with explain()',
      body: [
        'Real queries filter on several fields and sort. A **compound index** can serve all of it at once, if its fields come in the right order: **E**quality fields first, then **S**ort, then **R**ange (the ESR rule).',
        'Never guess: run `.explain(\'executionStats\')`. You want `IXSCAN`, and `totalDocsExamined` close to `nReturned`.',
      ],
      code: {
        file: 'models/Todo.js',
        lang: 'js',
        code: `// "user 42's open todos, newest first"
Todo.find({ userId: 42, done: false }).sort({ createdAt: -1 });

// equality, equality, sort  →  one index serves it all
todoSchema.index({ userId: 1, done: 1, createdAt: -1 });`,
        hl: [5],
      },
      callout: { kind: 'tip', text: 'MongoDB Atlas and Compass flag slow queries for you; the Performance Advisor even suggests indexes to create.' },
      metrics: { examined: 2, returned: 2, ms: 1 },
      scene: {
        nodes: { coll, api, idx: { ...index(true), label: 'compound index', state: 'active' }, ...docs((i) => (isMatch(i) ? 'ok' : 'dim')) },
        links: idxLinks,
        flows: idxFlows,
      },
    },
    {
      short: 'Try it',
      beat: 'try',
      title: 'Grow the data, flip the index',
      body: ['Same query, same two results. Only two things change here: how much data there is, and whether an index exists.'],
      sandbox,
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Indexes, in one breath',
      body: [
        'Without an index, a query reads the whole collection — {danger:COLLSCAN}, cost grows with your data.',
        'An index keeps one or more fields sorted with pointers to documents — {data:IXSCAN}, cost grows with the answer.',
        'Each index slows writes a little and uses memory, so index what you filter and sort on, and verify with `explain()`.',
      ],
      metrics: { examined: 2, returned: 2, ms: 1 },
      scene: { nodes: { coll, api, idx: index(true), ...docs((i) => (isMatch(i) ? 'ok' : undefined)) }, links: idxLinks, flows: idxFlows },
    },
  ],
});
