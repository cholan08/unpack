import { box, defineLesson, flow, item, link, stack } from '@/content/dsl';
import type { Item, LinkSpec, NodeSpec } from '@/engine/types';

/* ---------- layout: the client asks Express; the collection is a long list, newest first ---------- */
const N = 10; // visible rows standing in for 50,000
type RowState = Item['state'];
const rows = (state: (i: number) => RowState = () => undefined, top?: string): Item[] =>
  Array.from({ length: N }, (_, i) => {
    const n = 50000 - i;
    const label = i === 0 && top ? `${top} · just added` : `todo #${n.toLocaleString('en-US')} · 10:${String(59 - i).padStart(2, '0')}`;
    return item(`r${i}`, label, { tone: 'data', state: state(i) });
  });
const coll = (items: Item[], label = 'todos · newest first') => stack(640, 300, label, items, { w: 300, h: 540, from: 'top', mono: true, icon: 'mongo', tone: 'data' });
const client = box(140, 300, 'React', { sub: 'infinite list', icon: 'react', tone: 'client', w: 180 });
const api = box(380, 300, 'Express', { sub: 'GET /api/todos', icon: 'express', tone: 'server', w: 200 });
const base = (items: Item[], apiSub = 'GET /api/todos'): Record<string, NodeSpec> => ({ client, api: { ...api, sub: apiSub }, coll: coll(items) });
const links: LinkSpec[] = [link('client', 'api'), link('api', 'coll')];
const page = (label: string, back: string, o: Parameters<typeof flow>[1] = {}) =>
  flow(['client', 'api', 'coll'], { label: [label, 'find'], back: 'res', backLabel: [back, back], every: 4.4, ...o });

export default defineLesson({
  metrics: [
    { id: 'payload', label: 'Response size', better: 'lower' },
    { id: 'scanned', label: 'Docs the DB walks over', better: 'lower' },
    { id: 'dupes', label: 'Duplicates / gaps' },
  ],
  goals: [
    { text: 'Why “return everything” fails', step: 1 },
    { text: 'Offset pagination with skip/limit', step: 2 },
    { text: 'Why deep pages get slow', step: 3 },
    { text: 'Why items shift between pages', step: 4 },
    { text: 'Cursor pagination', step: 5 },
  ],
  steps: [
    {
      short: 'Everything',
      beat: 'problem',
      title: 'Returning every todo at once',
      body: [
        '`GET /api/todos` returns all of them. Fine with 20 todos; with 50,000 it’s a 12 MB response that takes seconds to query, send, parse and render — to show the first screenful.',
        'Lists that can grow need to be fetched a **page** at a time.',
      ],
      metrics: { payload: '12 MB', scanned: 50000, dupes: '—' },
      scene: { nodes: base(rows(() => 'active')), links, flows: [page('GET /api/todos', '50,000 docs', { speed: 0.5 })] },
    },
    {
      short: 'Offset',
      beat: 'technique',
      title: 'Offset pagination: skip and limit',
      body: [
        'The simplest paging: page *n* of size 20 means **skip** the first `(n − 1) × 20` and **limit** to 20. The client asks for `?page=2`; the response is 20 todos (plus, often, a total count for page numbers).',
        'Always sort by something stable (and indexed) so pages are predictable.',
      ],
      code: {
        file: 'routes/todos.js',
        lang: 'js',
        code: `const page = Number(req.query.page) || 1;
const todos = await Todo.find({ userId })
  .sort({ createdAt: -1 })
  .skip((page - 1) * 20)
  .limit(20);`,
        hl: [4, 5],
      },
      metrics: { payload: '5 KB', scanned: 40, dupes: 'no' },
      scene: { nodes: base(rows((i) => (i < 3 ? 'dim' : i < 6 ? 'active' : undefined)), '?page=2'), links, flows: [page('?page=2', '20 todos')] },
    },
    {
      short: 'Deep pages',
      beat: 'problem',
      title: 'Deep pages get slower and slower',
      body: [
        '`skip(10000)` doesn’t jump: the database still walks over the first 10,000 matching entries and throws them away. Page 500 takes hundreds of times longer than page 1.',
        'For “page 2 of 5” that’s irrelevant; for an infinite feed people scroll deep into, it adds up.',
      ],
      metrics: { payload: '5 KB', scanned: 10020, dupes: 'no' },
      scene: {
        nodes: base(rows((i) => (i < 8 ? 'dim' : 'active')), '?page=501'),
        links,
        flows: [flow(['client', 'api', 'coll'], { label: ['?page=501', 'skip 10,000'], back: 'res', backLabel: ['slow', '20 todos'], every: 5, dwell: 1.4 })],
      },
    },
    {
      short: 'Shifting',
      beat: 'problem',
      title: 'New items shift every page',
      body: [
        'You read page 1. Meanwhile a new todo is added at the top. Everything moves down by one, so page 2 now starts with the last item you already saw on page 1 — a **duplicate**. Deletions do the opposite and you **skip** one.',
        'Positions are a moving target when data changes under you.',
      ],
      metrics: { payload: '5 KB', scanned: 40, dupes: 'yes' },
      scene: {
        nodes: base(rows((i) => (i === 0 ? 'ok' : i === 3 ? 'error' : i > 3 && i < 6 ? 'active' : 'dim'), 'todo #50,001'), '?page=2'),
        links,
        flows: [page('?page=2', 'starts with a repeat', { back: 'err' })],
      },
    },
    {
      short: 'Cursor',
      beat: 'solution',
      title: 'Cursor pagination: “after this one”',
      body: [
        'Instead of a position, remember the **last item you saw** — its `createdAt` (plus `_id` to break ties). The next page is “the 20 items older than that”. That’s [[cursor-pagination|cursor pagination]].',
        'With an index on `{ userId, createdAt }` the database jumps straight to the cursor, so page 500 is as fast as page 1 — and new items at the top can’t shift what comes after your cursor.',
      ],
      code: {
        file: 'routes/todos.js',
        lang: 'js',
        code: `const filter = { userId };
if (req.query.before) filter.createdAt = { $lt: new Date(req.query.before) };

const todos = await Todo.find(filter).sort({ createdAt: -1 }).limit(20);
const nextCursor = todos.length === 20 ? todos.at(-1).createdAt : null;
res.json({ todos, nextCursor });`,
        hl: [2, 5],
      },
      changes: ['- ?page=N', '+ ?before=<createdAt of the last item>', '+ index { userId: 1, createdAt: -1 }'],
      metrics: { payload: '5 KB', scanned: 20, dupes: 'no' },
      scene: {
        nodes: base(rows((i) => (i === 0 ? 'ok' : i < 4 ? 'dim' : i < 7 ? 'active' : undefined), 'todo #50,001'), '?before=10:56'),
        links,
        flows: [page('?before=10:56', '20 older todos')],
      },
    },
    {
      short: 'Infinite scroll',
      beat: 'technique',
      title: 'Infinite scroll and “Load more”',
      body: [
        'Cursors fit infinite lists perfectly: each response carries `nextCursor`, and the client asks for the next page with it when the user nears the bottom (or presses **Load more**). When `nextCursor` is `null`, you’ve reached the end.',
        'TanStack Query’s `useInfiniteQuery` manages the pages and cursors for you.',
      ],
      code: {
        file: 'TodoFeed.jsx',
        lang: 'jsx',
        code: `const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['todos'],
  queryFn: ({ pageParam }) => api.todos.list({ before: pageParam }),
  initialPageParam: undefined,
  getNextPageParam: (last) => last.nextCursor ?? undefined,
});`,
        hl: [3, 5],
      },
      metrics: { payload: '5 KB', scanned: 20, dupes: 'no' },
      scene: { nodes: base(rows((i) => (i < 3 ? 'ok' : i < 6 ? 'active' : undefined)), '?before=…'), links, flows: [page('next page', '20 + nextCursor'), page('next page', '20 + nextCursor', { offset: 2.2 })] },
    },
    {
      short: 'Which?',
      beat: 'tradeoff',
      title: 'Offset or cursor?',
      body: [
        '**Offset** lets people jump to “page 7 of 12” and show totals — good for admin tables and search results that are small or rarely change.',
        '**Cursor** is fast at any depth and stable while data changes — the right choice for feeds, chat history, activity logs and infinite scroll. Many APIs offer both.',
      ],
      check: {
        q: 'A chat app loads older messages as you scroll up, while new messages keep arriving. Which pagination fits?',
        options: ['Offset: ?page=N', 'Cursor: ?before=<oldest loaded message>', 'Load all messages once', 'Random sampling'],
        answer: 1,
        explain: 'New messages would shift offsets constantly, and conversations get long. A cursor anchored to the oldest loaded message is stable and stays fast.',
      },
      metrics: { payload: '5 KB', scanned: 20, dupes: 'no' },
      scene: { nodes: base(rows((i) => (i < 4 ? 'dim' : i < 7 ? 'active' : undefined)), '?before=…'), links, flows: [page('?before=…', '20 todos')] },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Paging through big lists',
      body: [
        'Never return an unbounded list. Cap page sizes on the server.',
        '{server:Offset} (`skip/limit`) is simple and supports page numbers, but slows with depth and shifts when data changes.',
        '{data:Cursor} (`createdAt < last seen`, indexed) is fast at any depth and stable — use it for feeds and infinite scroll.',
      ],
      metrics: { payload: '5 KB', scanned: 20, dupes: 'no' },
      scene: { nodes: base(rows((i) => (i < 4 ? 'dim' : i < 7 ? 'active' : undefined)), '?before=…'), links, flows: [page('?before=…', '20 todos')] },
    },
  ],
});
