import { approx, box, choice, defineLesson, defineSandbox, flow, fmt, item, link, practice, range, stack, toggle } from '@/content/dsl';
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

/* ---------- sandbox: dig deep, change the page size, let new todos arrive ---------- */
const sandbox = defineSandbox({
  intro: 'Jump deep into the list, change the page size, and let a new todo arrive while you read. Then switch the paging style.',
  controls: [
    choice('mode', 'Paging style', [['offset', 'skip / limit'], ['cursor', 'cursor']]),
    range('page', 'Page number', { min: 1, max: 2500, value: 2, log: true, format: fmt }),
    choice('size', 'Page size', [['10', '10'], ['20', '20'], ['50', '50'], ['100', '100']], '20'),
    toggle('added', 'A new todo arrives while you read'),
  ],
  compute: (v) => {
    const cursor = v.mode === 'cursor';
    const size = Number(v.size);
    const last = Math.ceil(50000 / size);
    const pg = Math.min(Number(v.page), last);
    const skip = (pg - 1) * size;
    const scanned = cursor ? size : skip + size;
    const added = v.added === true;
    const dupes = !cursor && added && pg > 1;
    // 10 rows stand in for 50,000: the first `k` rows are what comes before this page
    const k = pg === 1 ? 0 : Math.max(1, Math.min(7, Math.round(Math.log10(skip) * 1.6)));
    const mm = String(59 - (k - 1)).padStart(2, '0');
    const items = rows((i) => (i === 0 && added ? 'ok' : i < k ? (cursor ? (i === k - 1 ? 'ok' : undefined) : 'dim') : i < k + 3 ? (dupes && i === k ? 'error' : 'active') : undefined), added ? 'todo #50,001' : undefined).map(
      (it, i) => (cursor && i === k - 1 ? { ...it, text: `${it.text} ← cursor` } : it),
    );
    const dwell = 0.18 + Math.min(1.8, scanned / 25000);
    const deep = scanned > 5000;
    const nodes: Record<string, NodeSpec> = {
      ...base(items, cursor ? (pg === 1 ? 'GET /api/todos' : `?before=10:${mm}`) : `?page=${fmt(pg)}`),
      coll: { ...coll(items), badge: cursor ? { text: `reads ${size}`, tone: 'ok' } : { text: `walks ${approx(scanned)}`, tone: deep ? 'warn' : 'neutral' }, state: deep && !cursor ? 'busy' : undefined },
    };
    const flows = cursor
      ? [page(pg === 1 ? 'first page' : `?before=10:${mm}`, `${size} todos`)]
      : [flow(['client', 'api', 'coll'], { label: [`?page=${fmt(pg)}`, `skip ${fmt(skip)}`], back: dupes ? 'err' : 'res', backLabel: [dupes ? 'has a repeat' : `${size} todos`, `${size} todos`], every: 4.4 + dwell, dwell })];
    const note = cursor
      ? `\`createdAt < cursor\` jumps straight to the right place in the index and reads just **${size}** entries — on page 1 or page ${fmt(pg)}.${added ? ' The new todo lands above your cursor, so nothing shifts.' : ''}`
      : `\`skip(${fmt(skip)})\` walks over **${fmt(skip)}** entries and throws them away, then returns ${size}.` +
        (deep ? ` Page ${fmt(pg)} pays for every page before it.` : pg === 1 ? ' Page 1 is cheap — the trouble starts deeper.' : ' Still cheap this close to the top.') +
        (dupes ? ' And the new todo pushed everything down one, so this page **starts with a repeat**.' : '') +
        (Number(v.page) > last ? ` (At ${size} per page there are only ${fmt(last)} pages.)` : '');
    return {
      scene: { nodes, links, flows },
      metrics: { payload: `${size / 4} KB`, scanned, dupes: dupes ? 'yes' : 'no' },
      tone: dupes ? 'danger' : deep && !cursor ? 'warn' : 'ok',
      note,
    };
  },
});

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
    { text: 'Dig deep with both styles', step: 8 },
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
      short: 'Try it',
      beat: 'try',
      title: 'Page 1, page 500, page 2,500',
      body: ['Same 50,000 todos, two ways to page through them. Push both until one of them breaks.'],
      sandbox,
    },
    {
      short: 'Practice',
      beat: 'try',
      title: 'Practice: Calculate offset pagination parameters',
      body: [
        'When writing offset-based endpoints, the backend must calculate how many documents to skip, the total number of pages, and whether adjacent pages exist.',
        'Implement `getPagination(page, limit, totalItems)` that returns an object `{ skip, totalPages, hasNext, hasPrev }`. Note that `page` is 1-indexed (page 1 skips 0).',
      ],
      practice: practice(
        'Return { skip, totalPages, hasNext, hasPrev } for 1-based page, limit, and totalItems.',
        `function getPagination(page, limit, totalItems) {\n  // Compute skip, totalPages, hasNext, hasPrev\n}`,
        `function getPagination(page, limit, totalItems) {\n  const skip = (page - 1) * limit;\n  const totalPages = Math.ceil(totalItems / limit);\n  return {\n    skip,\n    totalPages,\n    hasNext: page < totalPages,\n    hasPrev: page > 1,\n  };\n}`,
        [
          { label: 'calculates skip correctly for page 2', run: 'getPagination(2, 10, 35).skip === 10' },
          { label: 'calculates totalPages using ceiling', run: 'getPagination(1, 10, 35).totalPages === 4' },
          { label: 'sets hasNext and hasPrev for first page', run: '(() => { const p = getPagination(1, 10, 35); return p.hasNext === true && p.hasPrev === false; })()' },
          { label: 'sets hasNext false on last page', run: 'getPagination(4, 10, 35).hasNext === false' },
        ],
        [
          'Calculate skip as (page - 1) * limit.',
          'Calculate totalPages as Math.ceil(totalItems / limit).',
          'hasNext is true when page < totalPages; hasPrev is true when page > 1.',
        ],
      ),
      metrics: { payload: '5 KB', scanned: 10, dupes: 'no' },
      scene: { nodes: base(rows((i) => (i < 3 ? 'ok' : undefined)), '?page=2&limit=10'), links },
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
