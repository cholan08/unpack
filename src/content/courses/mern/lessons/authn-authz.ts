import { actor, box, db, defineLesson, doc, field, flow, link, patch } from '@/content/dsl';
import type { LinkSpec, NodeSpec } from '@/engine/types';

/* ---------- layout: two users · requireAuth · the route · data with owners ---------- */
const ana = actor(90, 180, 'Ana', { icon: 'user', tone: 'client' });
const ben = actor(90, 420, 'Ben', { icon: 'user', tone: 'client' });
const authn = box(320, 300, 'requireAuth', { sub: 'who are you?', icon: 'shield', tone: 'auth', w: 190 });
const route = box(575, 300, 'GET /api/todos/:id', { sub: 'route handler', icon: 'express', tone: 'server', w: 230 });
const mongo = db(860, 300, 'todos', { sub: 'collection', w: 140, h: 104 });
const anaTodo = (o: Partial<NodeSpec> = {}) =>
  ({ ...doc(860, 480, 'todo 123', [field('text', '"Ana’s medical appt"'), field('userId', '"ana"', { hl: true })], { w: 260 }), ...o }) as NodeSpec;

const base: Record<string, NodeSpec> = { ana, ben, authn, route, mongo };
const links: LinkSpec[] = [link('ana', 'authn'), link('ben', 'authn'), link('authn', 'route'), link('route', 'mongo')];
const get = (who: 'ana' | 'ben', o: Parameters<typeof flow>[1] = {}) =>
  flow([who, 'authn', 'route', 'mongo'], { label: ['GET /todos/123', `req.user = ${who}`, 'findById(123)'], back: 'res', every: 5, ...o });

export default defineLesson({
  metrics: [
    { id: 'who', label: 'Server knows who' },
    { id: 'may', label: 'Server checks what' },
    { id: 'leak', label: 'Ben sees Ana’s todo' },
  ],
  goals: [
    { text: 'Authentication vs authorization', step: 1 },
    { text: 'The IDOR bug', step: 3 },
    { text: 'Scoping queries by owner', step: 4 },
    { text: 'Roles: 401 vs 403', step: 5 },
    { text: 'Why hiding buttons isn’t security', step: 6 },
  ],
  steps: [
    {
      short: 'Two questions',
      beat: 'setup',
      title: 'Who are you — and what may you do?',
      body: [
        '[[authentication|Authentication]] (authN) answers **who are you?** — you logged in, the session or token proves it. [[authorization|Authorization]] (authZ) answers **may you do this?** — is this your todo, are you an admin?',
        'They sound alike and live close together in the code, which is exactly why one so often gets forgotten.',
      ],
      metrics: { who: '—', may: '—', leak: '—' },
      scene: { nodes: base, links, flows: [get('ana')] },
    },
    {
      short: 'AuthN',
      beat: 'technique',
      title: 'Authentication: requireAuth sets req.user',
      body: [
        'The `requireAuth` middleware checks the session or token on every request. No valid one: `401 Unauthorized`. Valid: it attaches `req.user`, and the request continues.',
        'After this point the route knows **who** is asking. It doesn’t yet know whether they’re **allowed**.',
      ],
      metrics: { who: 'yes', may: 'no', leak: '—' },
      scene: { nodes: patch(base, { authn: { state: 'active', badge: { text: 'req.user = ana', tone: 'auth' } } }), links, flows: [get('ana', { backLabel: ['todo', 'todo', '200'] })] },
    },
    {
      short: 'IDOR',
      beat: 'problem',
      title: 'Logged in isn’t the same as allowed',
      body: [
        'Ben is logged in, so `requireAuth` lets him through. He changes the URL from his own todo’s id to `123` — Ana’s. The route does `Todo.findById(123)` and happily returns it.',
        'This is [[idor|IDOR]] (insecure direct object reference), one of the most common real-world API bugs: authenticated, never authorized.',
      ],
      check: {
        q: 'The route is `requireAuth` + `Todo.findById(req.params.id)`. Ben requests Ana’s todo id. What happens?',
        options: ['401 — Ben isn’t Ana', '403 — requireAuth checks ownership', '200 — he gets Ana’s todo', '404 — ids are per user'],
        answer: 2,
        explain: 'requireAuth only proves Ben is *a* user. Nothing checked that todo 123 belongs to him, so it’s returned.',
      },
      code: { file: 'routes/todos.js', lang: 'js', code: `app.get('/api/todos/:id', requireAuth, async (req, res) => {\n  res.json(await Todo.findById(req.params.id)); // ❌ anyone's todo\n});`, err: [2] },
      metrics: { who: 'yes', may: 'no', leak: 'yes' },
      scene: {
        nodes: { ...patch(base, { ben: { state: 'error', badge: { text: 'id = 123 (Ana’s)', tone: 'danger' } } }), todo: anaTodo({ state: 'error' }) },
        links: [...links, link('mongo', 'todo', { style: 'dashed', arrow: false })],
        flows: [get('ben', { kind: 'err', backLabel: ['Ana’s todo', 'Ana’s todo', '200 😱'] })],
      },
    },
    {
      short: 'Scope by owner',
      beat: 'solution',
      title: 'Scope every query by its owner',
      body: [
        'Put the ownership check **into the query**: find the todo with this id **and** this user. For Ben, no document matches, so he gets `404` — he can’t even learn that todo 123 exists.',
        'Make it a habit: every query on user data includes `userId: req.user.id`. Updates and deletes too.',
      ],
      code: {
        file: 'routes/todos.js',
        lang: 'js',
        code: `app.get('/api/todos/:id', requireAuth, async (req, res) => {
  const todo = await Todo.findOne({ _id: req.params.id, userId: req.user.id });
  if (!todo) throw new AppError(404, 'TODO_NOT_FOUND', 'No such todo');
  res.json(todo);
});`,
        hl: [2, 3],
      },
      metrics: { who: 'yes', may: 'yes', leak: 'no' },
      scene: {
        nodes: { ...patch(base, { route: { sub: 'findOne(_id, userId)', state: 'ok' } }), todo: anaTodo() },
        links: [...links, link('mongo', 'todo', { style: 'dashed', arrow: false })],
        flows: [get('ben', { label: ['GET /todos/123', 'req.user = ben', '{ _id: 123, userId: ben }'], back: 'err', backLabel: ['no match', 'null', '404'] })],
      },
    },
    {
      short: 'Roles',
      beat: 'technique',
      title: 'Roles, and 401 vs 403',
      body: [
        'Some routes depend on **what kind** of user you are: only admins may list every user. Store a role on the user and check it in a small middleware — [[rbac|role-based access]].',
        'Status codes differ: `401` means “I don’t know who you are — log in”; `403` means “I know who you are, and you may not”.',
      ],
      code: {
        file: 'middleware/requireRole.js',
        lang: 'js',
        code: `export const requireRole = (role) => (req, res, next) =>
  req.user.role === role ? next() : res.status(403).json({ error: 'Forbidden' });

app.get('/api/admin/users', requireAuth, requireRole('admin'), listUsers);`,
        hl: [2, 4],
      },
      metrics: { who: 'yes', may: 'yes', leak: 'no' },
      scene: {
        nodes: patch(base, { route: { label: 'GET /api/admin/users', sub: 'requireRole("admin")' }, ben: { badge: { text: 'role: user', tone: 'neutral' } }, ana: { badge: { text: 'role: admin', tone: 'auth' } } }),
        links,
        flows: [
          flow(['ana', 'authn', 'route', 'mongo'], { label: ['GET', 'ana · admin', 'find'], back: 'res', backLabel: ['users', 'users', '200'], every: 5.4 }),
          flow(['ben', 'authn', 'route'], { label: ['GET', 'ben · user'], back: 'err', backLabel: ['403', '403 Forbidden'], every: 5.4, offset: 2.4 }),
        ],
      },
    },
    {
      short: 'UI isn’t security',
      beat: 'insight',
      title: 'Hiding a button is not authorization',
      body: [
        'The React app hides the **Delete** button on todos you don’t own and the admin menu for normal users. That’s good UX — and zero security. Anyone can call the API directly with curl.',
        'Every rule must be enforced on the server. The UI only mirrors those rules so people don’t click things that would fail.',
      ],
      metrics: { who: 'yes', may: 'yes', leak: 'no' },
      scene: {
        nodes: patch(base, { ben: { label: 'Ben (curl)', icon: 'terminal', badge: { text: 'no button needed', tone: 'warn' } }, route: { label: 'DELETE /todos/123', sub: 'checks owner ✓', state: 'ok' } }),
        links,
        flows: [flow(['ben', 'authn', 'route', 'mongo'], { kind: 'err', label: ['curl -X DELETE', 'ben', '{ _id, userId: ben }'], back: 'err', backLabel: ['0 deleted', '404', '404'], every: 5 })],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Two checks, every time',
      body: [
        '{auth:Authentication}: who are you? `requireAuth` → `req.user`, or `401`.',
        '{auth:Authorization}: may you do this? Scope queries by owner (`userId: req.user.id`) and check roles (`403`).',
        'Enforce both on the server for every route — the UI only reflects the rules.',
      ],
      metrics: { who: 'yes', may: 'yes', leak: 'no' },
      scene: {
        nodes: { ...patch(base, { route: { sub: 'findOne(_id, userId)', state: 'ok' } }), todo: anaTodo() },
        links: [...links, link('mongo', 'todo', { style: 'dashed', arrow: false })],
        flows: [get('ana', { backLabel: ['todo', 'todo', '200'] }), get('ben', { offset: 2.5, back: 'err', backLabel: ['no match', 'null', '404'] })],
      },
    },
  ],
});
