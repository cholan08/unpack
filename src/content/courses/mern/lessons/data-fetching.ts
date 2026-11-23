import { box, browser, defineLesson, dot, flow, link, patch } from '@/content/dsl';
import type { FlowSpec, LinkSpec, NodeSpec, ScreenLine } from '@/engine/types';

/* ---------- layout: page · components · (query cache) · API, left to right ---------- */
const S: Record<string, ScreenLine[]> = {
  ok: [{ t: 'h', text: 'My todos · 3 left' }, { t: 'item', text: 'Buy milk' }, { t: 'item', text: 'Learn MERN' }, { t: 'item', text: 'Call mom' }],
  lie: [{ t: 'h', text: 'My todos' }, { t: 'text', text: 'You have no todos yet.' }, { t: 'error', text: '(still loading…)' }],
  skeleton: [{ t: 'h', text: 'My todos' }, { t: 'skeleton', n: 3 }],
  error: [{ t: 'h', text: 'My todos' }, { t: 'error', text: 'Couldn’t load your todos' }, { t: 'btn', text: 'Try again', state: 'active' }],
  added: [{ t: 'h', text: 'My todos · 4 left' }, { t: 'item', text: 'Buy milk' }, { t: 'item', text: 'Learn MERN' }, { t: 'item', text: 'Call mom' }, { t: 'item', text: 'Pay rent', flash: true }],
};

const page = browser(130, 300, { w: 220, h: 210, url: 'todo-app.com', screen: S.ok });
const list = box(440, 300, 'TodoList', { sub: 'useEffect + fetch', icon: 'component', tone: 'client', w: 196 });
const header = box(440, 150, 'Header', { sub: 'shows “3 left”', icon: 'component', tone: 'client', w: 196 });
const cache = box(665, 300, 'Query cache', { sub: "key ['todos']", icon: 'layers', tone: 'client', w: 180 });
const api = box(880, 300, 'GET /api/todos', { sub: '~300 ms', icon: 'express', tone: 'server', w: 190 });

const loading = dot(380, 480, 'loading', { sub: 'show a skeleton', tone: 'warn' });
const success = dot(560, 430, 'success', { sub: 'empty? say so', tone: 'ok' });
const failed = dot(560, 540, 'error', { sub: 'offer a retry', tone: 'danger' });

const base: Record<string, NodeSpec> = { page, list, api };
const baseLinks: LinkSpec[] = [link('list', 'page', { style: 'dashed', label: 'renders' }), link('list', 'api')];
const withCache: Record<string, NodeSpec> = { page, header: { ...header, sub: 'useTodos()' }, list: { ...list, sub: 'useTodos()' }, cache, api };
const cacheLinks: LinkSpec[] = [
  link('list', 'page', { style: 'dashed' }),
  link('header', 'page', { style: 'dashed' }),
  link('list', 'cache'),
  link('header', 'cache'),
  link('cache', 'api'),
];
const get = (o: Partial<FlowSpec> = {}) => flow(['list', 'api'], { label: 'GET /api/todos', back: 'res', backLabel: 'todos', every: 4.4, ...o });

const naive = `function TodoList() {
  const [todos, setTodos] = useState([]);
  useEffect(() => {
    fetch('/api/todos').then((r) => r.json()).then(setTodos);
  }, []);
  return todos.length === 0
    ? <p>You have no todos yet.</p>     // also shown while loading!
    : <TodoItems todos={todos} />;
}`;

export default defineLesson({
  metrics: [
    { id: 'requests', label: 'Requests for the same data', better: 'lower' },
    { id: 'honest', label: 'Screen tells the truth' },
    { id: 'spinner', label: 'Spinner when you come back' },
  ],
  legend: { event: 'cache hit / invalidate' },
  goals: [
    { text: 'Server state vs UI state', step: 1 },
    { text: 'Loading, error, empty and success', step: 3 },
    { text: 'Why components shouldn’t each fetch their own copy', step: 5 },
    { text: 'What a query cache does for you', step: 6 },
    { text: 'Stale-while-revalidate', step: 7 },
    { text: 'Refreshing data after a change', step: 8 },
  ],
  steps: [
    {
      short: 'Server state',
      beat: 'setup',
      title: 'Your component shows data it doesn’t own',
      body: [
        'The todos live in MongoDB. The browser only ever has a **copy**, fetched over the network, that can be missing, late, failed, or out of date. That’s [[server-state|server state]] — a different beast from UI state like “is this menu open”.',
        'Every screen that shows server data has to handle more than the happy path. Let’s see what the naive version gets wrong.',
      ],
      metrics: { requests: 1, honest: 'yes', spinner: 'yes' },
      scene: { nodes: base, links: baseLinks, flows: [get()] },
    },
    {
      short: 'Happy path only',
      beat: 'problem',
      title: 'Only the happy path, and the screen lies',
      body: [
        'The classic first attempt: start with an empty array, fetch in an effect, render the list. While the request is in flight the array is empty — so the page proudly says **“You have no todos yet.”** Users panic.',
        'And if the request fails, nothing is caught: the message stays forever, and nobody can tell “empty” from “broken”.',
      ],
      code: { file: 'TodoList.jsx', lang: 'jsx', code: naive, err: [6, 7] },
      metrics: { requests: 1, honest: 'no', spinner: 'yes' },
      scene: {
        nodes: patch(base, { page: { screen: S.lie, state: 'error' }, list: { badge: { text: 'todos = [] …still', tone: 'danger' } }, api: { state: 'busy' } }),
        links: baseLinks,
        flows: [get({ dwell: 1.6, every: 5.2 })],
      },
    },
    {
      short: 'Every state',
      beat: 'solution',
      title: 'Model the request as states, render each one',
      body: [
        'A request is always in one of three states: **loading**, **error** or **success** — and a success can be **empty**. Keep that status in state alongside the data, and render something honest for each.',
        'A skeleton while loading, a message with a retry button on error, a friendly hint when the list is genuinely empty.',
      ],
      code: {
        file: 'TodoList.jsx',
        lang: 'jsx',
        code: `const [status, setStatus] = useState('loading'); // 'loading' | 'error' | 'success'
const [todos, setTodos] = useState([]);

if (status === 'loading') return <TodoSkeleton />;
if (status === 'error')   return <ErrorBox onRetry={load} />;
if (todos.length === 0)   return <EmptyState />;   // empty ≠ broken
return <TodoItems todos={todos} />;`,
        hl: [1, 4, 5, 6],
      },
      metrics: { requests: 1, honest: 'yes', spinner: 'yes' },
      scene: {
        nodes: { ...patch(base, { page: { screen: S.skeleton } }), loading: { ...loading, state: 'active' }, success, failed },
        links: [...baseLinks, link('loading', 'success', { tone: 'ok' }), link('loading', 'failed', { tone: 'danger' })],
        flows: [
          get({ every: 6 }),
          flow(['loading', 'success'], { kind: 'res', label: 'data', every: 6, offset: 2.4 }),
          flow(['loading', 'failed'], { kind: 'err', label: 'network error', every: 12, offset: 8.4 }),
        ],
      },
    },
    {
      short: 'Errors',
      beat: 'technique',
      title: 'Failures are a state, not an exception',
      body: [
        'Networks drop, servers restart, sessions expire. When the request fails, keep the screen useful: say what happened in plain words and offer **Try again**, which simply runs the same load again.',
        'Remember from the promises lesson: `fetch` doesn’t reject on `500`. Check `res.ok`, or a server error will be treated as data.',
      ],
      code: {
        file: 'TodoList.jsx',
        lang: 'jsx',
        code: `async function load() {
  setStatus('loading');
  try {
    const res = await fetch('/api/todos');
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    setTodos(await res.json());
    setStatus('success');
  } catch {
    setStatus('error');
  }
}`,
        hl: [5, 9],
      },
      metrics: { requests: 1, honest: 'yes', spinner: 'yes' },
      scene: {
        nodes: patch(base, { page: { screen: S.error }, api: { state: 'error', badge: { text: '503', tone: 'danger' } } }),
        links: baseLinks,
        flows: [get({ back: 'err', backLabel: '503 → status = error', every: 4 })],
      },
    },
    {
      short: 'Duplicates',
      beat: 'problem',
      title: 'Every component fetches its own copy',
      body: [
        'Now the header needs the todos too (to count them). With fetch-in-an-effect, it makes its **own** identical request. Two components, two requests, two copies that can disagree.',
        'Navigate away and back, and both fetch again from scratch — with spinners — even though you saw the data two seconds ago.',
      ],
      metrics: { requests: 2, honest: 'yes', spinner: 'yes' },
      scene: {
        nodes: { ...base, header: { ...header, sub: 'useEffect + fetch', state: 'error', badge: { text: 'duplicate request', tone: 'danger' } } },
        links: [...baseLinks, link('header', 'page', { style: 'dashed' }), link('header', 'api')],
        flows: [get({ every: 4.6 }), flow(['header', 'api'], { label: 'GET /api/todos (again)', back: 'res', every: 4.6, offset: 0.3 })],
      },
    },
    {
      short: 'Query cache',
      beat: 'solution',
      title: 'A shared cache for server state',
      body: [
        'A data-fetching library such as **TanStack Query** keeps a [[query-cache|query cache]] keyed by what you asked for — here `[\'todos\']`. Every component asking for the same key shares one request and one copy of the result.',
        'It also tracks loading and error states, retries failed requests, and cancels outdated ones — the races from the useEffect lesson are handled for you.',
      ],
      code: {
        file: 'useTodos.js',
        lang: 'jsx',
        code: `// once, at the root:  <QueryClientProvider client={queryClient}>

export function useTodos() {
  return useQuery({ queryKey: ['todos'], queryFn: api.getTodos });
}

// in Header and in TodoList — one request, one shared result
const { data: todos, isPending, isError } = useTodos();`,
        hl: [4, 8],
      },
      changes: ['+ Query cache between components and the API', '- Hand-written loading/error state in every component'],
      metrics: { requests: 1, honest: 'yes', spinner: 'yes' },
      scene: {
        nodes: patch(withCache, { cache: { state: 'active', badge: { text: '1 request, 2 readers', tone: 'ok' } } }),
        links: cacheLinks,
        flows: [
          flow(['list', 'cache'], { kind: 'event', label: "['todos']", every: 5 }),
          flow(['header', 'cache'], { kind: 'event', label: "['todos']", every: 5, offset: 0.2 }),
          flow(['cache', 'api'], { label: 'GET /api/todos', back: 'res', backLabel: 'todos', every: 5, offset: 0.9 }),
        ],
      },
    },
    {
      short: 'Stale, then fresh',
      beat: 'technique',
      title: 'Show what you have, then refresh quietly',
      body: [
        'Come back to the page and the cache answers **instantly** with the data it already has, while a background request checks for changes. If anything changed, the screen updates; if not, nothing visible happens. That’s [[swr|stale-while-revalidate]].',
        '`staleTime` says how long data counts as fresh. Within it, there’s no background request at all.',
      ],
      code: {
        file: 'useTodos.js',
        lang: 'jsx',
        code: `useQuery({
  queryKey: ['todos'],
  queryFn: api.getTodos,
  staleTime: 30_000, // fresh for 30 s: no refetch; after that, refetch in the background
});`,
        hl: [4],
      },
      metrics: { requests: 1, honest: 'yes', spinner: 'no' },
      scene: {
        nodes: patch(withCache, { cache: { state: 'ok', badge: { text: 'cached · shown instantly', tone: 'ok' } } }),
        links: cacheLinks,
        flows: [
          flow(['list', 'cache'], { kind: 'event', label: 'cached todos', back: 'res', backLabel: 'instantly', every: 5, speed: 1.6 }),
          flow(['cache', 'api'], { label: 'background refetch', back: 'res', backLabel: 'unchanged', every: 5, offset: 1.4 }),
        ],
      },
    },
    {
      short: 'Mutations',
      beat: 'technique',
      title: 'After a change, invalidate the query',
      body: [
        'Adding a todo is a **mutation**: a `POST` to the API. When it succeeds, tell the cache that `[\'todos\']` is out of date — [[invalidate|invalidate]] it. The cache refetches, and every component reading it updates together.',
        'For instant feedback you can also write the new todo into the cache optimistically, then let the refetch confirm it.',
      ],
      check: {
        q: 'A `POST /api/todos` succeeds. How should the list and the header find out about the new todo?',
        options: ['Reload the whole page', 'Each component refetches on a timer', 'Invalidate the [\'todos\'] query so the cache refetches it once', 'Push the todo into each component’s state by hand'],
        answer: 2,
        explain: 'Invalidating the shared query triggers one refetch, and everything reading that query re-renders with fresh data — no manual syncing.',
      },
      code: {
        file: 'AddTodo.jsx',
        lang: 'jsx',
        code: `const queryClient = useQueryClient();

const addTodo = useMutation({
  mutationFn: (text) => api.createTodo(text),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
});

addTodo.mutate('Pay rent');`,
        hl: [5],
      },
      metrics: { requests: 1, honest: 'yes', spinner: 'no' },
      scene: {
        nodes: patch(withCache, { page: { screen: S.added }, cache: { state: 'busy', badge: { text: 'invalidated', tone: 'warn' } }, header: { sub: 'shows “4 left”' } }),
        links: cacheLinks,
        flows: [
          flow(['list', 'cache', 'api'], { kind: 'data', label: ['mutate', 'POST /api/todos'], back: 'res', backLabel: ['201', 'invalidate'], every: 6.4 }),
          flow(['cache', 'api'], { label: 'GET (refetch)', back: 'res', backLabel: '4 todos', every: 6.4, offset: 3 }),
          flow(['cache', 'header'], { kind: 'data', label: '4 left', every: 6.4, offset: 5.2 }),
        ],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Fetching data, honestly',
      body: [
        'API data is {net:server state}: a copy that can be loading, failed, empty or stale.',
        'Render {warn:loading}, {danger:error} (with retry), {neutral:empty} and {ok:success} separately — never let “loading” look like “empty”.',
        'Use a {client:query cache} (TanStack Query, SWR or your framework’s loader) to share requests, show cached data instantly, and invalidate after mutations.',
      ],
      metrics: { requests: 1, honest: 'yes', spinner: 'no' },
      scene: {
        nodes: withCache,
        links: cacheLinks,
        flows: [
          flow(['list', 'cache'], { kind: 'event', label: "['todos']", every: 5 }),
          flow(['header', 'cache'], { kind: 'event', label: "['todos']", every: 5, offset: 0.2 }),
          flow(['cache', 'api'], { label: 'GET /api/todos', back: 'res', every: 5, offset: 0.9 }),
        ],
      },
    },
  ],
});
