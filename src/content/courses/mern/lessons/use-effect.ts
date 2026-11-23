import { box, browser, defineLesson, flow, item, link, patch, stack, zone } from '@/content/dsl';
import type { Item, LinkSpec, ScreenLine } from '@/engine/types';

/* ---------- layout: the component, its timeline and the page on the left; the API on the right ---------- */
const sel = (who: string): ScreenLine => ({ t: 'input', text: `User: ${who} ▾` });
const ana: ScreenLine[] = [sel('Ana'), { t: 'item', text: 'Buy milk' }, { t: 'item', text: 'Learn MERN' }];
const ben: ScreenLine[] = [sel('Ben'), { t: 'item', text: 'Fix bike' }, { t: 'item', text: 'Call mom' }];
const loading: ScreenLine[] = [sel('Ana'), { t: 'spinner', text: 'Loading todos…' }];
const wrong: ScreenLine[] = [sel('Ben'), { t: 'item', text: 'Buy milk', flash: true }, { t: 'item', text: 'Learn MERN', flash: true }, { t: 'error', text: 'These are Ana’s todos!' }];

const zc = zone(300, 300, 580, 560, 'Browser', { tone: 'client', icon: 'browser' });
const zs = zone(830, 300, 260, 560, 'Server', { tone: 'server', icon: 'server' });
const comp = box(430, 140, 'TodoList', { sub: 'props: userId = 1', icon: 'component', tone: 'client', w: 230 });
const page = browser(150, 330, { w: 230, h: 200, url: 'todo-app.com', screen: loading });
const timeline = stack(445, 392, 'Timeline', [], { w: 250, h: 292, from: 'top', mono: true, icon: 'clock', tone: 'client', empty: 'nothing yet' });
const api = box(830, 140, 'Express API', { sub: 'GET /api/todos', icon: 'express', tone: 'server', w: 220 });

const base = { zc, zs, comp, page, timeline, api };
const links: LinkSpec[] = [link('comp', 'api'), link('comp', 'page', { route: 'hv', style: 'dashed', label: 'commit' })];

/* timeline entries */
const T = {
  render: (id: string, text = 'render') => item(id, text, { tone: 'client' }),
  commit: (id: string, text = 'commit → DOM') => item(id, text, { tone: 'client', state: 'dim' }),
  effect: (id: string, text: string) => item(id, text, { tone: 'warn', state: 'active' }),
  cleanup: (id: string, text: string) => item(id, text, { tone: 'danger' }),
  bad: (id: string, text: string) => item(id, text, { tone: 'danger', state: 'error' }),
};
const tl = (...items: Item[]) => ({ items });

const effectCode = `function TodoList({ userId }) {
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    fetch(\`/api/todos?user=\${userId}\`)
      .then((r) => r.json())
      .then(setTodos);
  }, [userId]);

  return <List items={todos} />;
}`;

export default defineLesson({
  metrics: [
    { id: 'renders', label: 'Renders' },
    { id: 'requests', label: 'Requests sent' },
    { id: 'shown', label: 'List shows' },
  ],
  legend: { event: 'user action', data: 'DOM update' },
  goals: [
    { text: 'Why fetching during render loops forever', step: 2 },
    { text: 'When an effect runs', step: 3 },
    { text: 'What the dependency array controls', step: 4 },
    { text: 'Stale data from missing dependencies', step: 5 },
    { text: 'Races, and how cleanup fixes them', step: 7 },
    { text: 'When you don’t need an effect at all', step: 8 },
  ],
  steps: [
    {
      short: 'Pure render',
      beat: 'setup',
      title: 'Rendering should only describe the screen',
      body: [
        'React calls your component to find out what the UI should look like. That call should be [[pure|pure]]: take props and state, return JSX, change nothing else.',
        'But real components need to reach outside React — load data, start timers, subscribe to a socket, set the page title. Those are [[side-effect|side effects]], and they need a proper place to live.',
      ],
      code: {
        file: 'TodoList.jsx',
        lang: 'jsx',
        code: `function TodoList({ userId }) {
  const [todos, setTodos] = useState([]);
  // where does "load this user's todos" go?
  return <List items={todos} />;
}`,
        hl: [3],
      },
      metrics: { renders: 1, requests: 0, shown: '—' },
      scene: {
        nodes: patch(base, { timeline: tl(T.render('r1', 'render (userId 1)'), T.commit('c1', 'commit → empty list')) }),
        links,
        flows: [flow(['comp', 'page'], { kind: 'data', label: 'empty list', every: 3.4 })],
      },
    },
    {
      short: 'Fetch in render',
      beat: 'problem',
      title: 'Fetch in the render body, and it never stops',
      body: [
        'Put the `fetch` straight in the component body and it runs on **every** render. The response calls `setTodos`, which triggers a render, which fetches again, which calls `setTodos`…',
        'The page flickers, the network tab fills up, and your API gets hammered by one browser tab.',
      ],
      code: {
        file: 'TodoList.jsx',
        lang: 'jsx',
        code: `function TodoList({ userId }) {
  const [todos, setTodos] = useState([]);

  // ❌ runs during every render
  fetch(\`/api/todos?user=\${userId}\`)
    .then((r) => r.json())
    .then(setTodos); // → re-render → fetch again → …

  return <List items={todos} />;
}`,
        err: [5, 6, 7],
      },
      metrics: { renders: '∞', requests: '∞', shown: 'flicker' },
      scene: {
        nodes: patch(base, {
          comp: { state: 'error', badge: { text: 'render #48', tone: 'danger' } },
          api: { state: 'busy', meter: 0.96, badge: { text: 'flooded', tone: 'danger' } },
          page: { screen: loading },
          timeline: tl(
            T.render('r1'),
            T.bad('f1', 'fetch'),
            T.bad('s1', 'setTodos → render'),
            T.bad('f2', 'fetch'),
            T.bad('s2', 'setTodos → render'),
            T.bad('f3', 'fetch …'),
          ),
        }),
        links,
        flows: [
          flow(['comp', 'api'], { label: 'GET /api/todos', back: 'res', every: 0.9, dwell: 0.05 }),
        ],
      },
    },
    {
      short: 'useEffect',
      beat: 'solution',
      title: 'useEffect: run it after the screen updates',
      body: [
        '`useEffect` tells React: *after you’ve put this render on the screen, run this code.* That’s an [[effect]]. Rendering stays pure; the fetch happens afterwards.',
        'So the first render shows an empty list (or a spinner) straight away. When the data arrives, `setTodos` triggers one more render — and the effect doesn’t run again, because `userId` didn’t change.',
      ],
      code: { file: 'TodoList.jsx', lang: 'jsx', code: effectCode, hl: [4, 5, 6, 7, 8] },
      changes: ['~ The fetch moved into useEffect', '+ Runs after commit, and only when userId changes'],
      metrics: { renders: 2, requests: 1, shown: 'Ana’s ✓' },
      scene: {
        nodes: patch(base, {
          page: { screen: ana },
          comp: { state: 'active' },
          timeline: tl(
            T.render('r1', 'render (todos: [])'),
            T.commit('c1', 'commit → spinner'),
            T.effect('e1', 'effect: fetch user 1'),
            T.render('r2', 'render (3 todos)'),
            T.commit('c2', 'commit → list'),
          ),
        }),
        links,
        flows: [
          flow(['comp', 'api'], { label: 'GET ?user=1', back: 'res', backLabel: 'Ana’s todos', every: 4.6 }),
          flow(['comp', 'page'], { kind: 'data', label: 'list', every: 4.6, offset: 2.4 }),
        ],
      },
    },
    {
      short: 'Dependencies',
      beat: 'technique',
      title: 'The dependency array decides when it re-runs',
      body: [
        'The second argument is the [[deps|dependency array]]: the values the effect uses from the component. After each render React compares them with last time and re-runs the effect only if one changed.',
        'Pick Ben from the dropdown: `userId` becomes 2, React re-renders, sees the change, and fetches Ben’s todos.',
      ],
      code: {
        file: 'three ways to call it',
        lang: 'jsx',
        code: `useEffect(fn);            // after every render
useEffect(fn, []);        // once, after the first render (mount)
useEffect(fn, [userId]);  // after mount, and whenever userId changes`,
        hl: [3],
      },
      metrics: { renders: 4, requests: 2, shown: 'Ben’s ✓' },
      scene: {
        nodes: patch(base, {
          page: { screen: ben },
          comp: { sub: 'props: userId = 2', state: 'active', badge: { text: 'userId changed', tone: 'warn' } },
          timeline: tl(
            T.render('r3', 'render (userId 2)'),
            T.commit('c3'),
            T.effect('e2', 'effect: fetch user 2'),
            T.render('r4', 'render (Ben’s todos)'),
            T.commit('c4'),
          ),
        }),
        links,
        flows: [
          flow(['page', 'comp'], { kind: 'event', label: 'select Ben', every: 5 }),
          flow(['comp', 'api'], { label: 'GET ?user=2', back: 'res', backLabel: 'Ben’s todos', every: 5, offset: 1.2 }),
        ],
      },
    },
    {
      short: 'Stale data',
      beat: 'problem',
      title: 'Forget a dependency, and the data goes stale',
      body: [
        'A very common slip: the effect uses `userId`, but the array is `[]`. The effect ran once, for Ana — and React has no idea it should run again.',
        'Switch to Ben and the heading changes, but the list still shows Ana’s todos.',
      ],
      check: {
        q: 'The effect reads `userId` but its dependency array is `[]`. You switch from Ana to Ben. What does the list show?',
        options: ['Ben’s todos', 'Still Ana’s todos', 'An empty list', 'React throws an error'],
        answer: 1,
        explain: 'With `[]` the effect only ran after the first render. Every value from the component that the effect uses belongs in the array — the `react-hooks/exhaustive-deps` lint rule flags the ones you miss.',
      },
      code: {
        file: 'TodoList.jsx',
        lang: 'jsx',
        code: `useEffect(() => {
  fetch(\`/api/todos?user=\${userId}\`)
    .then((r) => r.json())
    .then(setTodos);
}, []); // ❌ uses userId, but doesn't list it`,
        err: [5],
      },
      metrics: { renders: 3, requests: 1, shown: 'Ana’s ✗' },
      scene: {
        nodes: patch(base, {
          page: { screen: wrong, state: 'error' },
          comp: { sub: 'props: userId = 2', state: 'error', badge: { text: 'effect skipped', tone: 'danger' } },
          api: { state: 'dim' },
          timeline: tl(T.render('r3', 'render (userId 2)'), T.commit('c3', 'commit → still Ana’s')),
        }),
        links,
        flows: [
          flow(['page', 'comp'], { kind: 'event', label: 'select Ben', every: 4 }),
          flow(['comp', 'page'], { kind: 'data', label: 'Ana’s list', every: 4, offset: 1.3 }),
        ],
      },
    },
    {
      short: 'Race',
      beat: 'problem',
      title: 'Switch fast, and an old answer can win',
      body: [
        'With the dependency fixed, click Ana, then Ben, quickly. Two requests are in flight. Ana’s happens to be slow; Ben’s comes back first and the list shows Ben’s todos…',
        '…until Ana’s late response lands and `setTodos` overwrites it. The dropdown says Ben; the list is Ana’s. That’s a [[race-condition|race condition]].',
      ],
      metrics: { renders: 5, requests: 2, shown: 'Ana’s ✗' },
      scene: {
        nodes: patch(base, {
          page: { screen: wrong, state: 'error' },
          comp: { sub: 'props: userId = 2', badge: { text: 'last write wins', tone: 'danger' } },
          timeline: tl(
            T.effect('e1', 'effect: fetch user 1'),
            T.effect('e2', 'effect: fetch user 2'),
            T.render('s2', 'setTodos(Ben’s)'),
            T.bad('s1', 'setTodos(Ana’s) ← late'),
          ),
        }),
        links,
        flows: [
          flow(['comp', 'api'], { label: '?user=1', back: 'res', backLabel: 'Ana’s (slow)', every: 6, dwell: 1.5 }),
          flow(['comp', 'api'], { label: '?user=2', back: 'res', backLabel: 'Ben’s', every: 6, offset: 0.45, dwell: 0.1 }),
        ],
      },
    },
    {
      short: 'Cleanup',
      beat: 'solution',
      title: 'Cleanup: cancel what the old effect started',
      body: [
        'An effect can return a [[cleanup]] function. React calls it **before** running the effect again, and when the component [[mount|unmounts]].',
        'Here the cleanup aborts the previous request. When `userId` changes to Ben, Ana’s fetch is cancelled, so it can never overwrite the newer answer. The same pattern clears timers and closes subscriptions.',
      ],
      callout: { kind: 'tip', text: 'In development, Strict Mode mounts, cleans up and mounts every component again on purpose. If that breaks something, a cleanup is missing.' },
      code: {
        file: 'TodoList.jsx',
        lang: 'jsx',
        code: `useEffect(() => {
  const controller = new AbortController();

  fetch(\`/api/todos?user=\${userId}\`, { signal: controller.signal })
    .then((r) => r.json())
    .then(setTodos)
    .catch((err) => { if (err.name !== 'AbortError') throw err; });

  return () => controller.abort(); // cleanup: cancel the old request
}, [userId]);`,
        hl: [2, 4, 9],
      },
      metrics: { renders: 4, requests: 2, shown: 'Ben’s ✓' },
      scene: {
        nodes: patch(base, {
          page: { screen: ben, state: 'ok' },
          comp: { sub: 'props: userId = 2', state: 'active' },
          timeline: tl(
            T.effect('e1', 'effect: fetch user 1'),
            T.cleanup('x1', 'cleanup: abort user 1'),
            T.effect('e2', 'effect: fetch user 2'),
            T.render('s2', 'setTodos(Ben’s) ✓'),
          ),
        }),
        links,
        flows: [
          flow(['comp', 'api'], { label: '?user=1 (aborted)', fail: true, every: 6, speed: 0.7 }),
          flow(['comp', 'api'], { label: '?user=2', back: 'res', backLabel: 'Ben’s', every: 6, offset: 0.9, dwell: 0.1 }),
        ],
      },
    },
    {
      short: 'Not needed',
      beat: 'tradeoff',
      title: 'You might not need an effect',
      body: [
        'Effects are for syncing with things **outside** React. A lot of code that ends up in effects doesn’t need one: values you can compute from props and state should just be computed while rendering, and work caused by a click belongs in the click handler.',
        'For data fetching in real apps, a library such as TanStack Query or SWR (or your framework’s data loading) handles caching, deduplication, retries and races for you.',
      ],
      code: {
        file: 'TodoList.jsx',
        lang: 'jsx',
        code: `// ❌ extra state, an effect, and an extra render
const [visible, setVisible] = useState([]);
useEffect(() => setVisible(todos.filter((t) => !t.done)), [todos]);

// ✅ just compute it while rendering
const visible = todos.filter((t) => !t.done);`,
        err: [2, 3],
        hl: [6],
      },
      metrics: { renders: 1, requests: '—', shown: '—' },
      scene: {
        nodes: patch(base, {
          page: { screen: ana },
          api: { state: 'dim' },
          comp: { sub: 'filters inline' },
          timeline: tl(T.render('r1', 'render (filters inline)'), T.commit('c1', 'commit → list')),
        }),
        links,
        flows: [flow(['comp', 'page'], { kind: 'data', label: 'list', every: 3.4 })],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'The effect lifecycle',
      body: [
        '{client:Render} must stay pure — no fetching or subscribing in the component body.',
        '{warn:Effects} run after the commit, and again only when a value in the dependency array changes. List every value the effect uses.',
        '{danger:Cleanup} runs before the next effect and on unmount: cancel requests, clear timers, unsubscribe.',
        'Compute derived data during render, and reach for a data-fetching library in real apps.',
      ],
      metrics: { renders: 4, requests: 2, shown: 'Ben’s ✓' },
      scene: {
        nodes: patch(base, {
          page: { screen: ben },
          comp: { sub: 'props: userId = 2' },
          timeline: tl(
            T.render('r3', 'render'),
            T.commit('c3', 'commit'),
            T.cleanup('x1', 'cleanup (previous)'),
            T.effect('e2', 'effect (new deps)'),
          ),
        }),
        links,
        flows: [
          flow(['comp', 'api'], { label: 'GET ?user=2', back: 'res', every: 4.6 }),
          flow(['comp', 'page'], { kind: 'data', label: 'list', every: 4.6, offset: 2.4 }),
        ],
      },
    },
  ],
});
