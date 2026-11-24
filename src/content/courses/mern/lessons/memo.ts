import { box, browser, chip, choice, defineLesson, defineSandbox, flow, fmt, link, patch, range, toggle } from '@/content/dsl';
import type { LinkSpec, NodeSpec } from '@/engine/types';

/* ---------- layout: component tree on the left, the page on the right ---------- */
const cmp = (x: number, y: number, label: string, sub?: string, w = 200): NodeSpec => box(x, y, label, { sub, icon: 'component', tone: 'client', w });
const tree: Record<string, NodeSpec> = {
  app: cmp(150, 85, 'App', 'state: query', 170),
  search: cmp(330, 175, 'SearchBox', 'value = query'),
  list: cmp(330, 270, 'TodoList', '1,000 todos'),
  items: cmp(520, 365, 'TodoItem × 1,000'),
  page: browser(860, 300, { w: 230, h: 210, url: 'todo-app.com', screen: [{ t: 'input', text: 'mil|' }, { t: 'item', text: 'Buy milk' }, { t: 'item', text: 'Learn MERN' }, { t: 'item', text: '… 998 more' }] }),
};
const e = (a: string, b: string): LinkSpec => link(a, b, { route: 'vh', arrow: false });
const links = [e('app', 'search'), e('app', 'list'), e('list', 'items')];
const RENDERED = { state: 'busy', badge: { text: 're-rendered', tone: 'warn' } } as const;
const SKIPPED = { state: 'dim', badge: { text: 'skipped', tone: 'ok' } } as const;
const keystroke = (o: Parameters<typeof flow>[1] = {}) => flow(['page', 'search', 'app'], { kind: 'event', label: ['type “k”', 'setQuery'], every: 3.6, ...o });
const linksWithPage = [...links, link('page', 'search', { style: 'dashed' })];

/* ---------- sandbox: grow the list, then apply the fixes one by one ---------- */
const sandbox = defineSandbox({
  intro: 'Grow the list, then try the fixes one at a time. Smooth typing needs about **16 ms** or less per keystroke.',
  controls: [
    range('count', 'Todos in the list', { min: 10, max: 10_000, value: 1000, log: true, format: fmt }),
    toggle('memo', 'Wrap TodoList in memo'),
    choice('handler', 'onToggle prop', [['inline', 'inline arrow'], ['stable', 'useCallback']]),
    toggle('virtual', 'Virtualize the list'),
  ],
  compute: (v) => {
    const count = Number(v.count);
    const memo = v.memo === true;
    const stable = v.handler === 'stable';
    const virtual = v.virtual === true;
    const skipped = memo && stable;
    const shown = virtual ? Math.min(20, count) : count;
    const items = skipped ? 0 : shown;
    const ms = Math.max(1, Math.round(2 + items * 0.118));
    const rendered = 2 + (skipped ? 0 : 1 + items);
    const tone = ms <= 16 ? 'ok' : ms <= 50 ? 'warn' : 'danger';
    const nodes = patch(tree, {
      app: RENDERED,
      search: RENDERED,
      list: skipped
        ? { ...SKIPPED, sub: 'memo · props equal' }
        : memo
          ? { state: 'error', sub: 'memo: new onToggle', badge: { text: 're-rendered anyway', tone: 'danger' } }
          : { ...RENDERED, sub: `${fmt(count)} todos`, badge: { text: `re-rendered · ${ms} ms`, tone } },
      items: { label: `TodoItem × ${fmt(shown)}`, w: 220, ...(skipped ? { state: 'dim', badge: undefined } : RENDERED), ...(virtual && !skipped ? { badge: { text: 'virtualized', tone: 'ok' } } : {}) },
      page: { screen: [{ t: 'input', text: 'mil|' }, { t: 'item', text: 'Buy milk' }, { t: 'item', text: 'Learn MERN' }, { t: 'item', text: `… ${fmt(Math.max(0, count - 2))} more` }] },
    });
    const flows = [
      keystroke(),
      ...(skipped
        ? []
        : memo
          ? [flow(['app', 'list'], { kind: 'err', label: 'new onToggle', every: 3.6, offset: 1.3 }), flow(['list', 'items'], { kind: 'data', label: `render × ${fmt(items)}`, every: 3.6, offset: 2.1 })]
          : [flow(['app', 'list', 'items'], { kind: 'data', label: ['render', `render × ${fmt(items)}`], every: 3.6, offset: 1.3 })]),
    ];
    const why = skipped
      ? `\`memo\` compares props: \`todos\` is the same array and \`toggle\` the same function, so React skips the whole list.`
      : memo
        ? `\`memo\` runs its check — but an inline \`onToggle\` is a brand-new function each render, so the props never match and ${fmt(items)} items re-render anyway.`
        : stable
          ? '`useCallback` alone changes nothing: without `memo`, React re-renders children whether or not their props changed.'
          : `Every keystroke re-renders \`App\`, so every child renders too: ${fmt(rendered)} components.`;
    const cost = ms <= 16 ? ` **${ms} ms** — inside the 16 ms budget.` : ` **${ms} ms** per keystroke — over the 16 ms budget, so typing stutters.`;
    return {
      scene: { nodes, links: linksWithPage, flows },
      metrics: { ms, rendered },
      tone,
      note: why + cost + (virtual && !skipped ? ' Virtualization keeps it to the ~20 rows on screen.' : ''),
    };
  },
});

export default defineLesson({
  metrics: [
    { id: 'ms', label: 'Render per keystroke', unit: 'ms', better: 'lower' },
    { id: 'rendered', label: 'Components rendered', better: 'lower' },
  ],
  legend: { event: 'keystroke / state change' },
  goals: [
    { text: 'Measure before optimising', step: 1 },
    { text: 'Moving state down', step: 3 },
    { text: 'React.memo', step: 4 },
    { text: 'Why new functions break memo', step: 5 },
    { text: 'useCallback and useMemo', step: 6 },
    { text: 'When not to bother', step: 8 },
    { text: 'Find the fix that actually works', step: 9 },
  ],
  steps: [
    {
      short: 'Measure',
      beat: 'setup',
      title: 'Renders are usually cheap — measure first',
      body: [
        'React re-renders a lot, and that’s normally fine: calling a few functions and diffing is fast. Most “performance work” on renders is wasted effort.',
        'So start with React DevTools’ **Profiler**: record an interaction, and it shows which components rendered and how long each took. Only optimise what it shows is slow.',
      ],
      metrics: { ms: 4, rendered: 3 },
      scene: { nodes: patch(tree, { items: { sub: 'cheap so far' } }), links: linksWithPage, flows: [keystroke()] },
    },
    {
      short: 'Slow typing',
      beat: 'problem',
      title: 'Typing in the search box lags',
      body: [
        '`query` lives in `App`, so every keystroke re-renders `App` — and by default **all its children**, including `TodoList` and its 1,000 items, even though the list doesn’t use `query` at all.',
        'The Profiler shows ~120 ms per keystroke. Anything over ~16 ms drops frames; the input feels sticky.',
      ],
      code: {
        file: 'App.jsx',
        lang: 'jsx',
        code: `function App() {
  const [query, setQuery] = useState('');
  return (
    <>
      <SearchBox value={query} onChange={setQuery} />
      <TodoList todos={todos} />      {/* re-renders on every keystroke */}
    </>
  );
}`,
        err: [6],
      },
      metrics: { ms: 120, rendered: 1003 },
      scene: {
        nodes: patch(tree, { app: RENDERED, search: RENDERED, list: { ...RENDERED, badge: { text: 're-rendered · 118 ms', tone: 'danger' } }, items: RENDERED }),
        links: linksWithPage,
        flows: [keystroke(), flow(['app', 'list', 'items'], { kind: 'data', label: ['render', 'render × 1000'], every: 3.6, offset: 1.3 })],
      },
    },
    {
      short: 'State down',
      beat: 'solution',
      title: 'Cheapest fix: move the state down',
      body: [
        'Ask first: who actually needs `query`? Only the search box. Move the state **into** `SearchBox`, and a keystroke re-renders just that small component. The list never hears about it.',
        'No memoisation, no extra hooks — just state living where it’s used. Always try this first.',
      ],
      code: {
        file: 'SearchBox.jsx',
        lang: 'jsx',
        code: `function SearchBox() {
  const [query, setQuery] = useState('');   // only this re-renders
  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}`,
        hl: [2],
      },
      metrics: { ms: 1, rendered: 1 },
      scene: {
        nodes: patch(tree, { app: { sub: undefined }, search: { sub: 'state: query', state: 'busy', badge: { text: 're-rendered', tone: 'warn' } }, list: SKIPPED, items: { state: 'dim' } }),
        links: linksWithPage,
        flows: [flow(['page', 'search'], { kind: 'event', label: 'type “k”', every: 3.6 })],
      },
    },
    {
      short: 'React.memo',
      beat: 'solution',
      title: 'When the state must stay up: React.memo',
      body: [
        'Sometimes the parent really needs the state (say, `App` also shows “3 results”). Then wrap the expensive child in [[react-memo|React.memo]]: before re-rendering it, React compares the new props with the old ones and **skips** it if they’re the same.',
        '`todos` didn’t change, so `TodoList` and its 1,000 items are skipped.',
      ],
      code: {
        file: 'TodoList.jsx',
        lang: 'jsx',
        code: `const TodoList = memo(function TodoList({ todos }) {
  return todos.map((t) => <TodoItem key={t.id} todo={t} />);
});`,
        hl: [1],
      },
      metrics: { ms: 2, rendered: 2 },
      scene: {
        nodes: patch(tree, { app: RENDERED, search: RENDERED, list: { ...SKIPPED, sub: 'memo: same props' }, items: { state: 'dim' } }),
        links: linksWithPage,
        flows: [keystroke()],
      },
    },
    {
      short: 'Broken memo',
      beat: 'problem',
      title: 'A new function every render defeats memo',
      body: [
        'Now you pass a handler: `onToggle={(id) => toggle(id)}`. That arrow function is created **fresh on every render**, so its reference is different each time — and `memo` sees “props changed”.',
        'The memo still runs its comparison, finds a difference, and re-renders anyway. Same for inline objects and arrays (`style={{…}}`, `options={[…]}`).',
      ],
      check: {
        q: '`TodoList` is wrapped in `memo`. `App` renders `<TodoList todos={todos} onToggle={(id) => toggle(id)} />`. You type in the search box. Does `TodoList` re-render?',
        options: ['No — todos didn’t change', 'Yes — onToggle is a new function each render', 'Only the first time', 'Only if toggle changed'],
        answer: 1,
        explain: 'Props are compared by reference. A new arrow function is never `===` the previous one, so memo can’t skip.',
      },
      metrics: { ms: 120, rendered: 1003 },
      scene: {
        nodes: patch(tree, { app: RENDERED, search: RENDERED, list: { state: 'error', sub: 'memo: new onToggle', badge: { text: 're-rendered anyway', tone: 'danger' } }, items: RENDERED }),
        links: linksWithPage,
        flows: [keystroke(), flow(['app', 'list'], { kind: 'err', label: 'new onToggle', every: 3.6, offset: 1.3 })],
      },
    },
    {
      short: 'Stable refs',
      beat: 'solution',
      title: 'useCallback and useMemo keep references stable',
      body: [
        '[[usecallback|useCallback]] returns the **same** function between renders until its dependencies change; `useMemo` does the same for a computed value. Pass those to the memoised child and its props stay equal.',
        'A functional state update (`setTodos((prev) => …)`) means the callback doesn’t depend on `todos`, so it can stay stable forever.',
      ],
      code: {
        file: 'App.jsx',
        lang: 'jsx',
        code: `const toggle = useCallback((id) => {
  setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
}, []);                               // same function every render

<TodoList todos={todos} onToggle={toggle} />`,
        hl: [1, 3],
      },
      metrics: { ms: 2, rendered: 2 },
      scene: {
        nodes: patch(tree, { app: RENDERED, search: RENDERED, list: { ...SKIPPED, sub: 'memo · props equal' }, items: { state: 'dim' } }),
        links: linksWithPage,
        flows: [keystroke()],
      },
    },
    {
      short: 'useMemo',
      beat: 'technique',
      title: 'useMemo for genuinely expensive calculations',
      body: [
        'If a component filters and sorts 10,000 todos on every render, `useMemo` caches the result and recomputes only when its inputs change — not when an unrelated piece of state does.',
        'Don’t wrap cheap expressions in it: the bookkeeping costs more than `a + b`.',
      ],
      code: {
        file: 'TodoList.jsx',
        lang: 'jsx',
        code: `const visible = useMemo(
  () => todos.filter((t) => matches(t, filter)).sort(byDueDate), // 40 ms
  [todos, filter],                                                // only then
);`,
        hl: [1, 3],
      },
      metrics: { ms: 3, rendered: 2 },
      scene: {
        nodes: { ...patch(tree, { list: { sub: 'useMemo sort', state: 'ok' } }), cache: chip(560, 200, 'cached result', { tone: 'ok', icon: 'layers', w: 170, state: 'active' }) },
        links: [...linksWithPage, link('list', 'cache', { style: 'dashed' })],
        flows: [flow(['list', 'cache'], { kind: 'res', label: 'reuse', back: 'res', every: 3.2 })],
      },
    },
    {
      short: 'Don’t overdo it',
      beat: 'tradeoff',
      title: 'Don’t memo everything',
      body: [
        'Memoisation adds code, memory and comparisons — and one forgotten dependency gives you stale data. Use it where the Profiler points, not by default. The **React Compiler** can now add this memoisation automatically at build time, which makes hand-written `useMemo`/`useCallback` rarer still.',
        'For really long lists, the bigger win is [[virtualization]]: render only the 20 rows on screen instead of 1,000 (libraries like TanStack Virtual).',
      ],
      metrics: { ms: 2, rendered: 22 },
      scene: {
        nodes: patch(tree, { items: { label: 'TodoItem × 20', sub: 'only visible rows', state: 'ok', badge: { text: 'virtualized', tone: 'ok' } }, list: { sub: '20 of 1,000 shown' } }),
        links: linksWithPage,
        flows: [flow(['list', 'items'], { kind: 'data', label: 'render 20', every: 3.2 })],
      },
    },
    {
      short: 'Try it',
      beat: 'try',
      title: 'Make typing smooth again',
      body: ['1,000 todos and a laggy search box. Which fixes help on their own, which only work together, and which do nothing?'],
      sandbox,
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Making React fast, in order',
      body: [
        '**Measure** with the Profiler. Most renders are cheap; fix only what’s slow.',
        '**Move state down** to where it’s used. Then `React.memo` the expensive child, with stable props via `useCallback` / `useMemo` (or let the React Compiler do it).',
        '`useMemo` for expensive calculations; virtualization for long lists.',
      ],
      metrics: { ms: 1, rendered: 1 },
      scene: {
        nodes: patch(tree, { app: { sub: undefined }, search: { sub: 'state: query', state: 'busy' }, list: SKIPPED, items: { state: 'dim' } }),
        links: linksWithPage,
        flows: [flow(['page', 'search'], { kind: 'event', label: 'type', every: 3.6 })],
      },
    },
  ],
});
