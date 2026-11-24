import { box, browser, defineLesson, flow, link, patch } from '@/content/dsl';
import type { LinkSpec, NodeSpec, ScreenLine } from '@/engine/types';

/* ---------- layout: browser → router → route table; the static host below ---------- */
const scr = (lines: ScreenLine[]) => lines;
const listScreen = scr([{ t: 'h', text: 'My todos' }, { t: 'item', text: 'Buy milk' }, { t: 'item', text: 'Learn MERN' }]);
const detailScreen = scr([{ t: 'h', text: 'Buy milk' }, { t: 'text', text: 'due Friday · priority 2' }, { t: 'btn', text: '← Back' }]);
const web = browser(140, 270, { w: 230, h: 190, url: 'todo-app.com/todos', screen: listScreen });
const router = box(430, 270, 'React Router', { sub: 'URL → component', icon: 'signpost', tone: 'client', w: 200 });
const route = (y: number, label: string, path: string) => box(735, y, label, { sub: path, icon: 'component', tone: 'client', w: 220 });
const routes: Record<string, NodeSpec> = {
  r1: route(110, 'Home', '/'),
  r2: route(220, 'TodoList', '/todos'),
  r3: route(330, 'TodoDetail', '/todos/:id'),
  r4: route(440, 'NotFound', '*'),
};
const host = box(430, 500, 'Static host', { sub: 'index.html + assets', icon: 'cloud', tone: 'net', w: 220 });
const base: Record<string, NodeSpec> = { web, router, ...routes };
const links: LinkSpec[] = [link('web', 'router'), ...['r1', 'r2', 'r3', 'r4'].map((r) => link('router', r, { arrow: false }))];
const go = (to: string, label: string, back: string, o: Parameters<typeof flow>[1] = {}) =>
  flow(['web', 'router', to], { kind: 'event', label: [label, 'match'], back: 'data', backLabel: ['render', back], every: 4.4, ...o });

export default defineLesson({
  metrics: [
    { id: 'requests', label: 'Server requests per click', better: 'lower' },
    { id: 'reload', label: 'Full page reload' },
  ],
  legend: { event: 'navigation', data: 'render', req: 'request to server' },
  goals: [
    { text: 'Multi-page vs single-page apps', step: 1 },
    { text: 'How a router maps URLs to components', step: 2 },
    { text: 'Links that don’t reload the page', step: 3 },
    { text: 'URL params and search params', step: 4 },
    { text: 'Why refresh 404s — and the fallback fix', step: 5 },
  ],
  steps: [
    {
      short: 'MPA vs SPA',
      beat: 'setup',
      title: 'Many pages, or one page that changes?',
      body: [
        'A classic website asks the server for a whole new HTML page on every click: a flash of white, everything reloaded. A React [[spa|single-page app]] loads **one** HTML page once; after that, JavaScript swaps what’s on screen.',
        'But users still expect real URLs: a back button that works, links they can share, a refresh that keeps them where they were. That’s the router’s job.',
      ],
      metrics: { requests: 1, reload: 'yes (classic site)' },
      scene: {
        nodes: { web, host: { ...host, y: 270, x: 735, sub: 'new page per click' } },
        links: [link('web', 'host')],
        flows: [flow(['web', 'host'], { kind: 'req', label: 'GET /todos/42', back: 'res', backLabel: 'whole new page', every: 3.6 })],
      },
    },
    {
      short: 'The router',
      beat: 'technique',
      title: 'The router maps URLs to components',
      body: [
        'A router keeps a table of paths and the component each one shows. When the URL changes, it finds the matching row and renders that component — no server involved.',
        '`:id` is a placeholder that matches any segment; `*` catches everything else for a “not found” screen.',
      ],
      code: {
        file: 'App.jsx',
        lang: 'jsx',
        code: `<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/todos" element={<TodoList />} />
    <Route path="/todos/:id" element={<TodoDetail />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
</BrowserRouter>`,
        hl: [5],
      },
      metrics: { requests: 0, reload: 'no' },
      scene: {
        nodes: patch(base, { web: { url: 'todo-app.com/todos/42', screen: detailScreen }, r3: { state: 'active', badge: { text: 'id = 42', tone: 'client' } } }),
        links,
        flows: [go('r3', '/todos/42', 'TodoDetail')],
      },
    },
    {
      short: '<Link>',
      beat: 'technique',
      title: 'Links that change the URL without a request',
      body: [
        'Use `<Link to="/todos/42">`, not `<a href>`. It updates the address bar with the browser’s [[history-api|History API]] and lets the router render the new screen — no network request, no reload, state preserved.',
        'Back and forward work too: the browser tells the router the URL changed, and it re-renders.',
      ],
      code: {
        file: 'TodoItem.jsx',
        lang: 'jsx',
        code: `<Link to={\`/todos/\${todo._id}\`}>{todo.text}</Link>   // ✅ no reload
<a href={\`/todos/\${todo._id}\`}>{todo.text}</a>        // ❌ full page reload

const navigate = useNavigate();
navigate('/todos');   // after saving a form, for example`,
        hl: [1, 5],
        err: [2],
      },
      metrics: { requests: 0, reload: 'no' },
      scene: {
        nodes: patch(base, { web: { url: 'todo-app.com/todos/42', screen: detailScreen }, r3: { state: 'active' }, host: { ...host, state: 'dim', badge: { text: 'not contacted', tone: 'ok' } } }),
        links: [...links, link('web', 'host', { state: 'off' })],
        flows: [go('r3', 'click <Link>', 'TodoDetail')],
      },
    },
    {
      short: 'Params',
      beat: 'technique',
      title: 'Read the URL: params and search params',
      body: [
        'Inside the matched component, `useParams()` gives you the placeholders (`id = "42"`) and `useSearchParams()` the query string (`?done=false&sort=due`).',
        'Keeping filters and the selected item **in the URL** makes them shareable and bookmarkable, and the back button undoes them — for free.',
      ],
      code: {
        file: 'TodoList.jsx',
        lang: 'jsx',
        code: `const { id } = useParams();                       // "/todos/:id" → "42"
const [params, setParams] = useSearchParams();    // "?done=false"
const done = params.get('done');                  // "false"
setParams({ done: 'true' });                      // URL → ?done=true`,
        hl: [1, 2],
      },
      metrics: { requests: 0, reload: 'no' },
      scene: {
        nodes: patch(base, { web: { url: '…/todos?done=false', screen: listScreen }, r2: { state: 'active', badge: { text: 'done = false', tone: 'client' } } }),
        links,
        flows: [go('r2', '?done=false', 'filtered list')],
      },
    },
    {
      short: 'Refresh 404',
      beat: 'problem',
      title: 'Refresh a deep link, and production says 404',
      body: [
        'Everything works while you click around. Then you **refresh** on `/todos/42` — and get a 404. A refresh is a real request: the browser asks the static host for a file at `/todos/42`, and there is no such file. Only `index.html` exists.',
        'It worked in development because Vite’s dev server already falls back to `index.html`. Production hosts need to be told.',
      ],
      check: {
        q: 'Users refresh `/todos/42` in production and get a 404. Where’s the problem?',
        options: ['The router config — the route is wrong', 'The static host — it has no file at that path', 'The browser cache', 'The API — todo 42 doesn’t exist'],
        answer: 1,
        explain: 'The router never even runs: the host answers first, with 404, because it looks for a real file. The fix is a host-level fallback to index.html.',
      },
      metrics: { requests: 1, reload: 'yes (refresh)' },
      scene: {
        nodes: { ...patch(base, { web: { url: 'todo-app.com/todos/42', screen: [{ t: 'h', text: '404' }, { t: 'error', text: 'Not Found' }], state: 'error' } }), host: { ...host, state: 'error', badge: { text: 'no file /todos/42', tone: 'danger' } } },
        links: [...links, link('web', 'host')],
        flows: [flow(['web', 'host'], { kind: 'req', label: 'refresh: GET /todos/42', back: 'err', backLabel: '404', every: 3.8 })],
      },
    },
    {
      short: 'Fallback',
      beat: 'solution',
      title: 'Fallback: every unknown path gets index.html',
      body: [
        'Configure the host with an [[spa-fallback|SPA fallback]]: if no real file matches, serve `index.html`. The app loads, the router reads the URL, and `/todos/42` renders as if you’d clicked there.',
        'Real files (`/assets/app-4f9c.js`) are still served normally. Every host has a setting for this.',
      ],
      code: {
        file: 'vercel.json',
        lang: 'json',
        code: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }

// Express serving the build itself:
// app.get('*', (req, res) => res.sendFile(path.resolve('dist/index.html')));`,
        hl: [1],
      },
      changes: ['+ Host rewrites unknown paths to /index.html'],
      metrics: { requests: 1, reload: 'only on refresh' },
      scene: {
        nodes: { ...patch(base, { web: { url: 'todo-app.com/todos/42', screen: detailScreen }, r3: { state: 'active' } }), host: { ...host, state: 'ok', badge: { text: 'fallback → index.html', tone: 'ok' } } },
        links: [...links, link('web', 'host')],
        flows: [
          flow(['web', 'host'], { kind: 'req', label: 'GET /todos/42', back: 'res', backLabel: 'index.html', every: 5.4 }),
          go('r3', '/todos/42', 'TodoDetail', { every: 5.4, offset: 2.4 }),
        ],
      },
    },
    {
      short: 'Nested',
      beat: 'technique',
      title: 'Nested layouts and lazy pages',
      body: [
        'Routes can nest: a parent layout (header, sidebar) renders an `<Outlet />` where the matched child appears, so shared chrome isn’t repeated in every page.',
        'Pages can also load lazily — `lazy(() => import(\'./Settings\'))` — so each route ships only its own code. Protected routes (only for logged-in users) get their own lesson.',
      ],
      code: {
        file: 'App.jsx',
        lang: 'jsx',
        code: `<Route element={<AppLayout />}>          {/* header + sidebar + <Outlet /> */}
  <Route path="/todos" element={<TodoList />} />
  <Route path="/todos/:id" element={<TodoDetail />} />
  <Route path="/settings" element={<Settings />} />   {/* lazy-loaded */}
</Route>`,
        hl: [1],
      },
      metrics: { requests: 0, reload: 'no' },
      scene: {
        nodes: patch(base, { router: { sub: 'layout + <Outlet/>' }, r2: { state: 'active' }, r3: { state: 'active' } }),
        links,
        flows: [go('r2', '/todos', 'TodoList')],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Client-side routing',
      body: [
        'An SPA loads one HTML page; the {client:router} maps the URL to a component and re-renders on change.',
        'Navigate with `<Link>` / `useNavigate` (no reload), read the URL with `useParams` / `useSearchParams`, and keep shareable state in it.',
        'In production, give the {net:host} an SPA fallback to `index.html`, or deep links and refreshes 404.',
      ],
      metrics: { requests: 0, reload: 'no' },
      scene: { nodes: patch(base, { web: { url: 'todo-app.com/todos/42', screen: detailScreen }, r3: { state: 'active' } }), links, flows: [go('r3', '/todos/42', 'TodoDetail')] },
    },
  ],
});
