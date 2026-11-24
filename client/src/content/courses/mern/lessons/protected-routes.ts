import { box, browser, defineLesson, flow, link, patch } from '@/content/dsl';
import type { LinkSpec, NodeSpec, ScreenLine } from '@/engine/types';

/* ---------- layout: browser · client-side guard · pages · the API ---------- */
const S: Record<string, ScreenLine[]> = {
  dash: [{ t: 'h', text: 'Dashboard' }, { t: 'item', text: 'Buy milk' }, { t: 'item', text: 'Learn MERN' }],
  login: [{ t: 'h', text: 'Log in' }, { t: 'input', text: 'email' }, { t: 'input', text: 'password', placeholder: true }, { t: 'btn', text: 'Log in' }],
  loading: [{ t: 'spinner', text: 'Checking your session…' }],
  flash: [{ t: 'h', text: 'Log in' }, { t: 'error', text: '(flash — you ARE logged in)' }],
};
const web = browser(130, 300, { w: 220, h: 180, url: 'todo-app.com/dashboard', screen: S.dash });
const guard = box(400, 300, '<RequireAuth>', { sub: 'client-side guard', icon: 'shield', tone: 'auth', w: 200 });
const dash = box(650, 180, 'Dashboard', { sub: '/dashboard', icon: 'component', tone: 'client', w: 190 });
const login = box(650, 420, 'Login page', { sub: '/login', icon: 'component', tone: 'client', w: 190 });
const api = box(880, 300, 'Express API', { sub: 'requireAuth', icon: 'express', tone: 'server', w: 180 });

const base: Record<string, NodeSpec> = { web, guard, dash, login, api };
const links: LinkSpec[] = [link('web', 'guard'), link('guard', 'dash'), link('guard', 'login'), link('dash', 'api')];

const guardCode = `function RequireAuth({ children }) {
  const { user, status } = useAuth();        // status: 'loading' | 'ready'
  const location = useLocation();
  if (status === 'loading') return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

<Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />`;

export default defineLesson({
  metrics: [
    { id: 'secure', label: 'Data actually protected' },
    { id: 'ux', label: 'Smooth for users' },
  ],
  legend: { event: 'navigation', auth: 'session check' },
  goals: [
    { text: 'Which protection is security and which is UX', step: 1 },
    { text: 'Protecting endpoints on the server', step: 2 },
    { text: 'A guard component in React', step: 3 },
    { text: 'Avoiding the login-page flash', step: 4 },
    { text: 'Returning users to where they were', step: 5 },
  ],
  steps: [
    {
      short: 'Two layers',
      beat: 'setup',
      title: 'Two kinds of “protected”',
      body: [
        'A logged-out visitor shouldn’t see the dashboard. That needs two things: the **API** must refuse to send the data, and the **React app** should send them to the login page instead of showing an empty, broken dashboard.',
        'Only the first is security. The second is user experience — and both are needed.',
      ],
      metrics: { secure: '—', ux: '—' },
      scene: { nodes: base, links, flows: [flow(['web', 'guard', 'dash', 'api'], { kind: 'event', label: ['/dashboard', 'allowed', 'GET /api/todos'], back: 'res', every: 5.4 })] },
    },
    {
      short: 'The real gate',
      beat: 'technique',
      title: 'The server is the real gate',
      body: [
        'Every `/api` route that touches user data runs `requireAuth`, and checks ownership. Without a valid session the answer is `401`, whatever the browser does.',
        'Someone can delete your guard component, edit the JavaScript, or skip React entirely with curl — and still get nothing. That’s the part that keeps data safe.',
      ],
      code: { file: 'server.js', lang: 'js', code: `app.use('/api/todos', requireAuth, todosRouter);\napp.use('/api/admin', requireAuth, requireRole('admin'), adminRouter);`, hl: [1, 2] },
      metrics: { secure: 'yes', ux: 'no' },
      scene: {
        nodes: patch(base, { guard: { state: 'dim' }, api: { state: 'ok', badge: { text: '401 without session', tone: 'ok' } }, web: { screen: [{ t: 'h', text: 'Dashboard' }, { t: 'error', text: 'Request failed: 401' }] } }),
        links,
        flows: [flow(['web', 'guard', 'dash', 'api'], { kind: 'event', label: ['/dashboard', 'no guard', 'GET (no cookie)'], back: 'err', backLabel: ['401', 'broken page', 'error'], every: 5.4 })],
      },
    },
    {
      short: 'Guard',
      beat: 'technique',
      title: 'A guard component sends visitors to log in',
      body: [
        'Wrap protected routes in a `<RequireAuth>` component. It reads the current user from your auth context: no user → `<Navigate to="/login">`, remembering where they wanted to go; user → render the page.',
        'Visitors now get a login form instead of a broken dashboard full of 401 errors.',
      ],
      code: { file: 'RequireAuth.jsx', lang: 'jsx', code: guardCode, hl: [5, 9] },
      metrics: { secure: 'yes', ux: 'yes' },
      scene: {
        nodes: patch(base, { web: { url: 'todo-app.com/login', screen: S.login }, guard: { state: 'active', badge: { text: 'no user → /login', tone: 'auth' } }, login: { state: 'active' }, dash: { state: 'dim' } }),
        links,
        flows: [flow(['web', 'guard', 'login'], { kind: 'event', label: ['/dashboard', 'redirect'], every: 4 })],
      },
    },
    {
      short: 'No flash',
      beat: 'problem',
      title: 'Don’t decide before you know',
      body: [
        'On a page refresh, the app starts with **no** user in memory, then asks `GET /api/me` whether the session cookie is valid. If the guard decides immediately, logged-in users get bounced to the login page for a moment — or for good.',
        'Track a `status`: while it’s `loading`, show a spinner; decide only once the answer is back.',
      ],
      check: {
        q: 'On refresh, `user` is `null` until `/api/me` answers. What should `RequireAuth` render during that time?',
        options: ['Redirect to /login — user is null', 'The protected page', 'A loading state, until the session check finishes', 'An error message'],
        answer: 2,
        explain: '`null` is ambiguous until the check completes: “not logged in” and “not known yet” look the same. Keep a loading status to tell them apart.',
      },
      metrics: { secure: 'yes', ux: 'yes' },
      scene: {
        nodes: patch(base, { web: { screen: S.loading }, guard: { state: 'busy', badge: { text: 'status: loading', tone: 'warn' } }, dash: { state: 'dim' }, login: { state: 'dim' } }),
        links: [...links, link('guard', 'api', { style: 'dashed', label: 'GET /api/me' })],
        flows: [flow(['guard', 'api'], { kind: 'auth', label: 'GET /api/me', back: 'auth', backLabel: '{ name: "Ana" }', every: 4 })],
      },
    },
    {
      short: 'Come back',
      beat: 'technique',
      title: 'After login, go back where they were',
      body: [
        'The guard stored the original location in navigation state. After a successful login, send the user there — not always to the home page.',
        '`replace: true` keeps the login page out of the history, so the back button doesn’t return to it.',
      ],
      code: {
        file: 'LoginPage.jsx',
        lang: 'jsx',
        code: `const location = useLocation();
const navigate = useNavigate();
const from = location.state?.from?.pathname ?? '/dashboard';

async function onSubmit(values) {
  await login(values.email, values.password);
  navigate(from, { replace: true });
}`,
        hl: [3, 7],
      },
      metrics: { secure: 'yes', ux: 'yes' },
      scene: {
        nodes: patch(base, { web: { screen: S.dash }, login: { state: 'ok' }, dash: { state: 'active' } }),
        links: [...links, link('login', 'dash', { style: 'dashed', label: 'back to from' })],
        flows: [flow(['login', 'dash'], { kind: 'event', label: 'navigate(from)', every: 3.6 })],
      },
    },
    {
      short: 'Roles',
      beat: 'technique',
      title: 'Roles in the UI, enforced on the server',
      body: [
        'The same pattern guards admin pages: `<RequireRole role="admin">`, and hide admin links from normal users. Nice UX — but remember the authorization lesson: the matching API routes must check the role too.',
        'If the server doesn’t check, hiding the link protects nothing.',
      ],
      metrics: { secure: 'yes', ux: 'yes' },
      scene: {
        nodes: patch(base, { guard: { label: '<RequireRole>', sub: 'role: admin' }, dash: { label: 'Admin panel', sub: '/admin' }, api: { sub: 'role: admin', state: 'ok' } }),
        links,
        flows: [flow(['web', 'guard', 'dash', 'api'], { kind: 'event', label: ['/admin', 'admin ✓', 'GET /api/admin/users'], back: 'res', every: 5.4 })],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Protecting routes, front and back',
      body: [
        'The {server:API} is the security boundary: `requireAuth` + ownership/role checks on every protected endpoint.',
        'The {auth:React guard} is UX: wait for the session check, redirect to login with the original location, and send users back after logging in.',
        'Hide what users can’t use, but never rely on hiding.',
      ],
      metrics: { secure: 'yes', ux: 'yes' },
      scene: { nodes: patch(base, { guard: { state: 'active' } }), links, flows: [flow(['web', 'guard', 'dash', 'api'], { kind: 'event', label: ['/dashboard', 'allowed', 'GET /api/todos'], back: 'res', every: 5.4 })] },
    },
  ],
});
