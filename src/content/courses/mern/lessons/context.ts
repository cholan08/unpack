import { box, browser, defineLesson, flow, link, patch } from '@/content/dsl';
import type { Badge, LinkSpec, NodeSpec, ScreenLine } from '@/engine/types';

/* ---------- part 1 layout: a small tree on the left, the page on the right ---------- */
const screen = (left: string, opts: { wrong?: boolean; added?: boolean } = {}): ScreenLine[] => [
  { t: 'h', text: 'My todos' },
  opts.wrong ? { t: 'error', text: `${left} left — wrong!` } : { t: 'text', text: `${left} left` },
  { t: 'item', text: 'Buy milk' },
  { t: 'item', text: 'Learn MERN' },
  { t: 'item', text: 'Call mom', flash: opts.added },
];
const page = browser(860, 300, { w: 240, h: 240, url: 'todo-app.com', screen: screen('2') });

const cmp = (x: number, y: number, label: string, sub?: string, o: Partial<NodeSpec> = {}): NodeSpec =>
  ({ ...box(x, y, label, { sub, icon: 'component', tone: 'client', w: 190 }), ...o }) as NodeSpec;
const app = cmp(150, 80, 'App', undefined, { w: 160 });
const header = cmp(320, 165, 'Header', 'state: left = 2');
const list = cmp(320, 250, 'TodoList', 'state: todos');
const add = cmp(490, 335, 'AddTodo', 'onAdd');
const items = cmp(490, 420, 'TodoItem × 3', 'todo');

const small = { app, header, list, add, items, page };
const edge = (a: string, b: string): LinkSpec => link(a, b, { route: 'vh', arrow: false });
const smallLinks = [edge('app', 'header'), edge('app', 'list'), edge('list', 'add'), edge('list', 'items')];

/* ---------- part 2 layout: a deep tree where two leaves need the user ---------- */
const PASSING: Badge = { text: 'just passing it on', tone: 'warn' };
const deep: Record<string, NodeSpec> = {
  app: cmp(130, 80, 'App', 'state: user', { w: 170 }),
  layout: cmp(290, 170, 'Layout', 'props: user', { w: 170 }),
  sidebar: cmp(450, 260, 'Sidebar', 'props: user', { w: 170 }),
  menu: cmp(610, 350, 'UserMenu', 'props: user', { w: 170 }),
  avatar: cmp(770, 440, 'Avatar', 'needs user', { w: 170 }),
  greeting: cmp(450, 520, 'Greeting', 'needs user', { w: 170 }),
};
const deepEdges = [edge('app', 'layout'), edge('layout', 'sidebar'), edge('sidebar', 'menu'), edge('menu', 'avatar'), edge('layout', 'greeting')];
const provider = { label: 'AuthProvider', sub: 'value = { user }', icon: 'key', tone: 'auth' } as const;
const viaContext = patch(deep, {
  app: { ...provider, w: 216 },
  layout: { sub: undefined, state: 'dim' },
  sidebar: { sub: undefined, state: 'dim' },
  menu: { sub: undefined, state: 'dim' },
  avatar: { sub: 'useAuth()' },
  greeting: { sub: 'useAuth()' },
});
const contextLinks: LinkSpec[] = [
  ...deepEdges,
  link('app', 'avatar', { route: 'hv', style: 'dashed', tone: 'auth', label: 'context' }),
  link('app', 'greeting', { route: 'under', bend: 26, style: 'dashed', tone: 'auth' }),
];
const broadcast = [
  flow(['app', 'avatar'], { kind: 'auth', label: 'user', every: 4 }),
  flow(['app', 'greeting'], { kind: 'auth', label: 'user', every: 4, offset: 0.2 }),
];

export default defineLesson({
  metrics: [
    { id: 'copies', label: 'Copies of the data', better: 'lower' },
    { id: 'through', label: 'Components a prop passes through', better: 'lower' },
  ],
  legend: { data: 'props (down)', event: 'events (up)', auth: 'context value' },
  goals: [
    { text: 'Why two copies of state drift apart', step: 1 },
    { text: 'Lifting state to the closest common parent', step: 2 },
    { text: 'What Context is for', step: 5 },
    { text: 'A provider + custom hook pattern', step: 6 },
    { text: 'The re-render cost of Context', step: 7 },
    { text: 'Choosing where state should live', step: 8 },
  ],
  steps: [
    {
      short: 'Two copies',
      beat: 'problem',
      title: 'Two components, two copies, two answers',
      body: [
        'The header shows how many todos are left; the list shows the todos. Each keeps its own [[state]]: `Header` counts, `TodoList` stores the array.',
        'Add *Call mom* and the list updates — but the header still says 2. Two copies of the same fact always drift apart eventually.',
      ],
      code: {
        file: 'App.jsx',
        lang: 'jsx',
        code: `function Header() {
  const [left, setLeft] = useState(2);          // one copy…
  return <h1>My todos · {left} left</h1>;
}

function TodoList() {
  const [todos, setTodos] = useState(initial);  // …and another
  …
}`,
        err: [2, 7],
      },
      metrics: { copies: 2, through: 0 },
      scene: {
        nodes: patch(small, {
          header: { state: 'error', badge: { text: 'says 2', tone: 'danger' } },
          list: { badge: { text: 'has 3', tone: 'client' } },
          page: { screen: screen('2', { wrong: true, added: true }), state: 'error' },
        }),
        links: smallLinks,
        flows: [flow(['add', 'list'], { kind: 'event', label: 'add “Call mom”', every: 3.6 })],
      },
    },
    {
      short: 'Lift it up',
      beat: 'solution',
      title: 'Lift the state up to the closest common parent',
      body: [
        'Keep **one** copy, in the nearest component that contains everyone who needs it — here, `App`. That’s [[lift-state|lifting state up]].',
        '`App` passes the todos down to the list, and a count derived from them to the header. Neither child owns the data any more; both just display it.',
      ],
      code: {
        file: 'App.jsx',
        lang: 'jsx',
        code: `function App() {
  const [todos, setTodos] = useState(initial);    // the only copy
  const add = (text) => setTodos([...todos, { id: crypto.randomUUID(), text, done: false }]);
  return (
    <>
      <Header left={todos.filter((t) => !t.done).length} />
      <TodoList todos={todos} onAdd={add} />
    </>
  );
}`,
        hl: [2, 6, 7],
      },
      changes: ['~ todos moved from TodoList up to App', '- Header’s own count', '+ Header receives `left`, computed from todos'],
      metrics: { copies: 1, through: 0 },
      scene: {
        nodes: patch(small, {
          app: { sub: 'state: todos', state: 'active' },
          header: { sub: 'props: left' },
          list: { sub: 'todos, onAdd' },
          page: { screen: screen('2') },
        }),
        links: smallLinks,
        flows: [
          flow(['app', 'header'], { kind: 'data', label: 'left', every: 3.6 }),
          flow(['app', 'list'], { kind: 'data', label: 'todos', every: 3.6, offset: 0.3 }),
        ],
      },
    },
    {
      short: 'One truth',
      beat: 'technique',
      title: 'One update, and everyone agrees',
      body: [
        'Now adding a todo travels **up** as an event (`onAdd`) to the owner, `App` updates its state, and the new data flows **down** to both children in the same render.',
        'With a [[source-of-truth|single source of truth]], the header and the list can’t disagree — there’s nothing to keep in sync.',
      ],
      check: {
        q: '`Header` and `TodoList` both need the todos. Where should the `todos` state live?',
        options: ['In `Header`', 'In `TodoList`', 'In their closest common parent, `App`', 'A copy in each, kept in sync with effects'],
        answer: 2,
        explain: 'State belongs in the closest component that contains every user of it. Syncing copies with effects is exactly the bug we started with.',
      },
      metrics: { copies: 1, through: 0 },
      scene: {
        nodes: patch(small, {
          app: { sub: 'state: todos', state: 'active', badge: { text: 'setTodos', tone: 'client' } },
          header: { sub: 'props: left', state: 'ok' },
          list: { sub: 'todos, onAdd' },
          page: { screen: screen('3', { added: true }) },
        }),
        links: smallLinks,
        flows: [
          flow(['add', 'list', 'app'], { kind: 'event', label: ['onAdd(text)', 'onAdd(text)'], every: 5 }),
          flow(['app', 'header'], { kind: 'data', label: '3 left', every: 5, offset: 2.1 }),
          flow(['app', 'list'], { kind: 'data', label: 'todos', every: 5, offset: 2.3 }),
        ],
      },
    },
    {
      short: 'Deep trees',
      beat: 'problem',
      title: 'When the data is needed far, far below',
      body: [
        'Lifting works until the common parent is a long way up. The logged-in `user` lives in `App`, but `Avatar` and `Greeting` are buried several levels deep.',
        '`Layout`, `Sidebar` and `UserMenu` must accept and pass on a prop they never use. That’s [[prop-drilling|prop drilling]]: noisy, and every new consumer means editing the whole path.',
      ],
      metrics: { copies: 1, through: 3 },
      scene: {
        nodes: patch(deep, {
          layout: { badge: PASSING },
          sidebar: { badge: PASSING },
          menu: { badge: PASSING },
          avatar: { state: 'ok' },
          greeting: { state: 'ok' },
        }),
        links: deepEdges,
        flows: [
          flow(['app', 'layout', 'sidebar', 'menu', 'avatar'], { kind: 'data', label: 'user', every: 5, dwell: 0.3 }),
          flow(['app', 'layout', 'greeting'], { kind: 'data', label: 'user', every: 5, offset: 0.6, dwell: 0.3 }),
        ],
      },
    },
    {
      short: 'Context',
      beat: 'solution',
      title: 'Context: make a value available to the whole subtree',
      body: [
        '[[context|Context]] lets a component provide a value to **everything** rendered inside it. Any descendant reads it with `useContext` — no props in between.',
        'The components in the middle stop knowing about `user` at all. Add a new consumer anywhere below the [[provider]] and it just works.',
      ],
      code: {
        file: 'auth.jsx',
        lang: 'jsx',
        code: `const AuthContext = createContext(null);

// near the top of the tree
<AuthContext.Provider value={{ user }}>
  <Layout />
</AuthContext.Provider>

// anywhere below, at any depth
function Avatar() {
  const { user } = useContext(AuthContext);
  return <img src={user.avatarUrl} alt={user.name} />;
}`,
        hl: [1, 4, 10],
      },
      changes: ['+ AuthContext provided at the top', '- user prop on Layout, Sidebar, UserMenu'],
      metrics: { copies: 1, through: 0 },
      scene: { nodes: viaContext, links: contextLinks, flows: broadcast },
    },
    {
      short: 'Provider + hook',
      beat: 'technique',
      title: 'Wrap it in a provider component and a hook',
      body: [
        'In practice the context holds state **and** the functions that change it. An `AuthProvider` component owns the state; a small `useAuth()` hook hides `useContext` and fails loudly if it’s used outside the provider.',
        'A consumer calling `logout()` updates the provider’s state, and every consumer gets the new value.',
      ],
      code: {
        file: 'auth.jsx',
        lang: 'jsx',
        code: `export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const login = async (email, password) => setUser(await api.login(email, password));
  const logout = () => { api.logout(); setUser(null); };
  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}`,
        hl: [2, 5, 10],
      },
      metrics: { copies: 1, through: 0 },
      scene: {
        nodes: patch(viaContext, { app: { sub: 'user, login, logout', state: 'active' }, avatar: { badge: { text: 'logout()', tone: 'auth' } } }),
        links: contextLinks,
        flows: [
          flow(['avatar', 'app'], { kind: 'event', label: 'logout()', every: 5 }),
          flow(['app', 'avatar'], { kind: 'auth', label: 'user: null', every: 5, offset: 2.3 }),
          flow(['app', 'greeting'], { kind: 'auth', label: 'user: null', every: 5, offset: 2.5 }),
        ],
      },
    },
    {
      short: 'Re-renders',
      beat: 'tradeoff',
      title: 'Every consumer re-renders when the value changes',
      body: [
        'When a provider’s `value` changes, **every** component using that context re-renders. Writing `value={{ user, login, logout }}` inline creates a brand-new object on each render of the provider — so all consumers re-render even when nothing in it changed.',
        'Memoise the value, and split unrelated data into separate contexts (auth, theme, locale) so a theme switch doesn’t re-render everything that reads the user.',
      ],
      check: {
        q: 'The provider renders `value={{ user, logout }}` inline. It re-renders for an unrelated reason; `user` is unchanged. What happens to the consumers?',
        options: ['Nothing — the user didn’t change', 'They all re-render: the value is a new object', 'Only the first consumer re-renders', 'React throws a warning and skips them'],
        answer: 1,
        explain: 'React compares context values by reference. A new object literal is a new reference every time, so every consumer re-renders. `useMemo` keeps the same object until `user` really changes.',
      },
      code: {
        file: 'auth.jsx',
        lang: 'jsx',
        code: `// ❌ new object every render → every consumer re-renders
<AuthContext.Provider value={{ user, login, logout }}>

// ✅ same object until user actually changes
const value = useMemo(() => ({ user, login, logout }), [user]);
<AuthContext.Provider value={value}>`,
        err: [2],
        hl: [5, 6],
      },
      metrics: { copies: 1, through: 0 },
      scene: {
        nodes: patch(viaContext, {
          app: { state: 'busy', badge: { text: 'new value object', tone: 'warn' } },
          avatar: { state: 'busy', badge: { text: 're-rendered', tone: 'warn' } },
          greeting: { state: 'busy', badge: { text: 're-rendered', tone: 'warn' } },
        }),
        links: contextLinks,
        flows: broadcast,
      },
    },
    {
      short: 'Which tool?',
      beat: 'insight',
      title: 'Where should this state live?',
      body: [
        'Start small and move up only when you must: **local state** for one component; **lift it** when a few siblings share it; **Context** for app-wide values that change rarely — the current user, theme, language.',
        'Data that comes from your API is [[server-state|server state]]: it belongs in a data-fetching cache (next lesson). Big, fast-changing client state — an editor, a complex form — may deserve a store library.',
      ],
      metrics: { copies: 1, through: 0 },
      scene: {
        nodes: {
          s1: box(130, 300, 'useState', { sub: 'one component', icon: 'component', tone: 'client', w: 190 }),
          s2: box(370, 300, 'Lift it up', { sub: 'a few siblings', icon: 'tree', tone: 'client', w: 190 }),
          s3: box(610, 300, 'Context', { sub: 'app-wide data', icon: 'key', tone: 'auth', w: 210 }),
          s4: box(860, 300, 'Query cache', { sub: 'data from your API', icon: 'layers', tone: 'net', w: 200 }),
        },
        links: [link('s1', 's2'), link('s2', 's3'), link('s3', 's4')],
        flows: [flow(['s1', 's2', 's3', 's4'], { kind: 'data', label: ['grows', 'grows', 'grows'], every: 5, dwell: 0.5 })],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Sharing state in React',
      body: [
        'Keep {client:one copy} of each piece of data. When siblings need it, {client:lift it up} to their closest common parent.',
        'When far-away components need it, {auth:Context} provides it to the whole subtree — no drilling. Wrap it in a provider component and a `useX()` hook.',
        'Every consumer re-renders when the value changes: memoise the value and split unrelated contexts. API data belongs in a query cache.',
      ],
      metrics: { copies: 1, through: 0 },
      scene: { nodes: viaContext, links: contextLinks, flows: broadcast },
    },
  ],
});
