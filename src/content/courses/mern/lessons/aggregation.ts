import { box, db, defineLesson, doc, field, flow, link, patch } from '@/content/dsl';
import type { Badge, LinkSpec, NodeSpec } from '@/engine/types';

/* ---------- layout: the collection, then the stages as a conveyor belt, then the result ---------- */
const src = db(95, 300, 'todos', { sub: '10,000 docs', w: 130, h: 112 });
const st = (x: number, label: string, sub: string) => box(x, 300, label, { sub, icon: 'filter', tone: 'data', w: 158 });
const count = (text: string, tone: Badge['tone'] = 'data'): Partial<NodeSpec> => ({ badge: { text, tone } });
const stages: Record<string, NodeSpec> = {
  match: st(270, '$match', 'done: false'),
  group: st(450, '$group', 'by userId'),
  sort: st(630, '$sort', 'open: -1'),
  limit: st(810, '$limit', '3'),
};
const result = doc(630, 490, 'result', [field('', '{ name: "Ana", open: 41 }'), field('', '{ name: "Ben", open: 37 }'), field('', '{ name: "Cy",  open: 29 }')], { w: 300 });
const chain: LinkSpec[] = [link('src', 'match'), link('match', 'group'), link('group', 'sort'), link('sort', 'limit')];
const belt = (to: string[], labels: string[], o: Parameters<typeof flow>[1] = {}) => flow(['src', ...to], { kind: 'data', label: labels, every: 5.2, dwell: 0.35, ...o });

const pipelineCode = `const top = await Todo.aggregate([
  { $match: { done: false } },                          // 10,000 → 6,200
  { $group: { _id: '$userId', open: { $sum: 1 } } },    // → 120 (one per user)
  { $sort: { open: -1 } },
  { $limit: 3 },                                        // → 3
]);`;

export default defineLesson({
  metrics: [
    { id: 'docs', label: 'Documents still flowing', better: 'lower' },
    { id: 'sent', label: 'Sent to Express', better: 'lower' },
  ],
  legend: { data: 'documents' },
  goals: [
    { text: 'Why find() isn’t enough for summaries', step: 1 },
    { text: 'Stages in a pipeline', step: 2 },
    { text: 'Grouping and counting', step: 4 },
    { text: 'Joining with $lookup', step: 6 },
    { text: 'Why stage order matters', step: 7 },
  ],
  steps: [
    {
      short: 'The question',
      beat: 'problem',
      title: '“Who has the most open todos?”',
      body: [
        'Your admin dashboard wants the three users with the most unfinished todos. With `find()` you’d download **every** open todo to Express and count them in JavaScript.',
        'That’s 6,200 documents over the network and into memory, to produce three lines. The database could have done the counting itself.',
      ],
      code: {
        file: 'routes/admin.js',
        lang: 'js',
        code: `const open = await Todo.find({ done: false });        // 6,200 documents
const counts = {};
for (const t of open) counts[t.userId] = (counts[t.userId] ?? 0) + 1;
// …then sort, slice, look up names…`,
        err: [1],
      },
      metrics: { docs: 6200, sent: 6200 },
      scene: {
        nodes: { src, api: box(560, 300, 'Express', { sub: 'counting in JS', icon: 'express', tone: 'server', w: 210, state: 'busy', meter: 0.9 }) },
        links: [link('src', 'api')],
        flows: [flow(['src', 'api'], { kind: 'data', label: '6,200 docs', every: 1.2, speed: 1.4 })],
      },
    },
    {
      short: 'Pipeline',
      beat: 'solution',
      title: 'An aggregation pipeline: stages in a row',
      body: [
        'An [[aggregation|aggregation pipeline]] is a list of stages MongoDB runs in order. Documents flow through like items on a conveyor belt; each stage filters, reshapes, groups or sorts what it receives and passes the result on.',
        'Only the final output leaves the database — here, three small documents.',
      ],
      code: { file: 'routes/admin.js', lang: 'js', code: pipelineCode, hl: [1, 2, 3, 4, 5] },
      metrics: { docs: 3, sent: 3 },
      scene: {
        nodes: { src, ...stages, result },
        links: [...chain, link('limit', 'result', { route: 'vh' })],
        flows: [belt(['match', 'group', 'sort', 'limit', 'result'], ['10,000', '6,200', '120', '120', '3'])],
      },
    },
    {
      short: '$match',
      beat: 'technique',
      title: '$match: filter first',
      body: [
        '`$match` takes the same filter as `find()` and keeps only matching documents. Put it **first**: everything after it handles fewer documents, and at the start of a pipeline it can use an index.',
      ],
      metrics: { docs: 6200, sent: 0 },
      scene: {
        nodes: patch({ src, ...stages }, { match: { ...count('10,000 → 6,200'), state: 'active' }, group: { state: 'dim' }, sort: { state: 'dim' }, limit: { state: 'dim' } }),
        links: chain,
        flows: [belt(['match'], ['10,000 in'])],
      },
    },
    {
      short: '$group',
      beat: 'technique',
      title: '$group: buckets and totals',
      body: [
        '[[group-stage|$group]] collects documents into buckets by a key — here `userId` — and computes something per bucket with accumulators like `$sum`, `$avg`, `$max`, `$push`.',
        '6,200 todos become 120 documents, one per user: `{ _id: userId, open: 41 }`. `$sum: 1` simply counts.',
      ],
      code: { file: 'stage', lang: 'js', code: `{ $group: { _id: '$userId', open: { $sum: 1 } } }`, hl: [1] },
      metrics: { docs: 120, sent: 0 },
      scene: {
        nodes: patch({ src, ...stages }, { match: count('6,200'), group: { ...count('6,200 → 120'), state: 'active' }, sort: { state: 'dim' }, limit: { state: 'dim' } }),
        links: chain,
        flows: [belt(['match', 'group'], ['10,000', '6,200'])],
      },
    },
    {
      short: '$sort · $limit',
      beat: 'technique',
      title: '$sort and $limit: just the top three',
      body: [
        '`$sort` orders the 120 user totals by `open`, highest first; `$limit` keeps three. MongoDB is smart about a sort followed by a limit: it only tracks the current top three instead of sorting everything.',
      ],
      metrics: { docs: 3, sent: 3 },
      scene: {
        nodes: { ...patch({ src, ...stages }, { match: count('6,200'), group: count('120'), sort: { ...count('120 sorted'), state: 'active' }, limit: { ...count('→ 3'), state: 'active' } }), result: patch({ result }, { result: { fields: [field('', '{ _id: "6740…a1", open: 41 }'), field('', '{ _id: "6740…b2", open: 37 }'), field('', '{ _id: "6740…c3", open: 29 }')] } }).result },
        links: [...chain, link('limit', 'result', { route: 'vh' })],
        flows: [belt(['match', 'group', 'sort', 'limit', 'result'], ['10,000', '6,200', '120', '120', '3'])],
      },
    },
    {
      short: '$lookup',
      beat: 'technique',
      title: '$lookup and $project: names, not ids',
      body: [
        'The totals carry only user ids. `$lookup` joins the `users` collection (like `populate()`, but inside the database), and `$project` shapes the final output — keep the name and count, drop the rest.',
        'Joining **after** `$limit` means three lookups instead of 120.',
      ],
      code: {
        file: 'routes/admin.js',
        lang: 'js',
        code: `{ $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
{ $project: { _id: 0, name: { $first: '$user.name' }, open: 1 } },`,
        hl: [1, 2],
      },
      metrics: { docs: 3, sent: 3 },
      scene: {
        nodes: {
          ...patch({ src, ...stages }, { match: count('6,200'), group: count('120'), sort: count('120'), limit: count('3') }),
          users: db(810, 485, 'users', { w: 130, h: 104, state: 'active' }),
          result: { ...result, x: 450, state: 'ok' },
        },
        links: [...chain, link('limit', 'users', { label: '$lookup' }), link('users', 'result')],
        flows: [belt(['match', 'group', 'sort', 'limit', 'users', 'result'], ['10,000', '6,200', '120', '120', '3', '+ names'])],
      },
    },
    {
      short: 'Order matters',
      beat: 'tradeoff',
      title: 'Stage order is performance',
      body: [
        'The same stages in a different order can give the same answer at very different cost. Filter early, limit before expensive joins, and project away big fields you don’t need.',
        '`.explain()` works on pipelines too: check that the first `$match` uses an index.',
      ],
      check: {
        q: 'A pipeline does `$lookup` (join users) on every todo, then `$match: { done: false }`. What’s the better order?',
        options: ['Keep it — joins should come first', '$match first, so only open todos get joined', 'It doesn’t matter; MongoDB reorders everything', 'Replace $match with a JavaScript filter'],
        answer: 1,
        explain: 'Filtering first shrinks the stream before the expensive join (and lets the match use an index). The optimiser moves some stages, but don’t rely on it.',
      },
      metrics: { docs: 6200, sent: 3 },
      scene: {
        nodes: patch({ src, ...stages }, { match: { ...count('first: uses index', 'ok'), state: 'ok' }, group: count('120'), sort: count('120'), limit: count('3') }),
        links: chain,
        flows: [belt(['match', 'group', 'sort', 'limit'], ['10,000', '6,200', '120', '120'])],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Aggregation, in short',
      body: [
        'When you need {data:totals, groups, rankings or joins}, compute them in the database with an aggregation pipeline instead of shipping documents to Express.',
        'Stages run in order: `$match` → `$group` → `$sort` → `$limit` → `$lookup` → `$project`, each feeding the next.',
        'Filter and limit early; join and reshape late; verify with `.explain()`.',
      ],
      metrics: { docs: 3, sent: 3 },
      scene: {
        nodes: { src, ...patch(stages, { match: count('6,200'), group: count('120'), sort: count('120'), limit: count('3') }), result: { ...result, state: 'ok' } },
        links: [...chain, link('limit', 'result', { route: 'vh' })],
        flows: [belt(['match', 'group', 'sort', 'limit', 'result'], ['10,000', '6,200', '120', '120', '3'])],
      },
    },
  ],
});
