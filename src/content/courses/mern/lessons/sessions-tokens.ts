import { box, browser, chip, db, defineLesson, flow, link, patch } from '@/content/dsl';
import type { LinkSpec, ScreenLine } from '@/engine/types';

/* ---------- layout: browser + its cookie on the left, server in the middle, session store on the right ---------- */
const todos: ScreenLine[] = [{ t: 'h', text: 'Ana’s todos' }, { t: 'item', text: 'Buy milk' }, { t: 'item', text: 'Learn MERN' }];
const denied: ScreenLine[] = [{ t: 'h', text: 'My todos' }, { t: 'error', text: '401 · Please log in' }];
const loginForm: ScreenLine[] = [{ t: 'h', text: 'Log in' }, { t: 'input', text: 'ana@ex.com' }, { t: 'input', text: '••••••••' }, { t: 'btn', text: 'Log in', state: 'active' }];

const web = browser(125, 290, { w: 200, h: 170, url: 'todo-app.com', screen: denied });
const cookie = chip(125, 445, 'cookie: sid=a8f3', { tone: 'auth', icon: 'cookie', w: 190 });
const srv = box(520, 290, 'Express', { sub: 'express-session', icon: 'express', tone: 'server', w: 220 });
const store = db(850, 290, 'Session store', { sub: 'Redis', items: ['a8f3 → Ana'], w: 170, h: 124 });

const base = { web, srv, store };
const links: LinkSpec[] = [link('web', 'srv'), link('srv', 'store')];

const sessionCode = `app.use(session({
  store: sessionStore,               // e.g. Redis via connect-redis
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 7 * 864e5 },
}));

app.post('/api/login', async (req, res) => {
  const user = await checkPassword(req.body);   // bcrypt.compare
  req.session.userId = user.id;                 // creates session + cookie
  res.json({ name: user.name });
});`;

export default defineLesson({
  metrics: [
    { id: 'lookups', label: 'Store lookups / request', better: 'lower' },
    { id: 'revoke', label: 'Kick out a stolen login' },
    { id: 'servers', label: 'Works across servers' },
  ],
  legend: { auth: 'cookie / token' },
  goals: [
    { text: 'How a session cookie works', step: 2 },
    { text: 'Why logout is instant with sessions', step: 4 },
    { text: 'Why sessions need a shared store', step: 5 },
    { text: 'What tokens trade away', step: 7 },
    { text: 'CSRF, and how SameSite stops it', step: 8 },
  ],
  steps: [
    {
      short: 'Who are you?',
      beat: 'setup',
      title: 'After login, the server forgets you',
      body: [
        'HTTP is [[stateless]]: each request arrives on its own, with no memory of the last. Ana logged in a second ago, but her next `GET /api/todos` looks exactly like a stranger’s.',
        'There are two families of solutions. Either the **server remembers** (sessions), or the **client carries proof** (tokens).',
      ],
      metrics: { lookups: null, revoke: '—', servers: '—' },
      scene: {
        nodes: patch(base, { store: { state: 'dim' }, srv: { badge: { text: 'who is this?', tone: 'danger' } } }),
        links,
        flows: [flow(['web', 'srv'], { label: 'GET /api/todos', back: 'err', backLabel: '401', every: 3.6 })],
      },
    },
    {
      short: 'Sessions',
      beat: 'technique',
      title: 'Sessions: the server keeps a note',
      body: [
        'At login, the server creates a [[session]] — a small record like `{ userId: Ana }` — in a [[session-store|session store]], under a long random id. It sends only that id back, in an [[http-only|httpOnly]] cookie.',
        'The cookie holds no information about Ana at all. It’s a coat-check ticket: meaningless without the server’s list.',
      ],
      code: { file: 'server.js', lang: 'js', code: sessionCode, hl: [2, 6, 11] },
      metrics: { lookups: 1, revoke: '—', servers: '—' },
      scene: {
        nodes: patch({ ...base, cookie: { ...cookie, state: 'active', badge: { text: 'new', tone: 'ok' } } }, {
          web: { screen: loginForm },
          store: { state: 'active', badge: { text: '+ a8f3', tone: 'ok' } },
        }),
        links,
        flows: [
          flow(['web', 'srv', 'store'], {
            kind: 'auth',
            label: ['POST /login', 'save { userId: Ana }'],
            back: 'auth',
            backLabel: ['id a8f3', 'Set-Cookie: sid=a8f3'],
            every: 5.2,
          }),
        ],
      },
    },
    {
      short: 'Each request',
      beat: 'technique',
      title: 'Every request: look the ticket up',
      body: [
        'From now on the browser sends the cookie with every request automatically. The session middleware reads the id, fetches the record from the store, and hands you `req.session.userId`.',
        'That’s one extra lookup per request — a fraction of a millisecond in Redis, but it means every server needs the store.',
      ],
      code: {
        file: 'routes/todos.js',
        lang: 'js',
        code: `app.get('/api/todos', async (req, res) => {
  if (!req.session.userId) return res.sendStatus(401);
  res.json(await Todo.find({ userId: req.session.userId }));
});`,
        hl: [2, 3],
      },
      metrics: { lookups: 1, revoke: '—', servers: 'with a shared store' },
      scene: {
        nodes: patch({ ...base, cookie }, { web: { screen: todos }, srv: { badge: { text: 'req.session.userId = Ana', tone: 'server' } } }),
        links,
        flows: [
          flow(['web', 'srv', 'store'], { kind: 'auth', label: ['cookie sid=a8f3', 'get a8f3'], back: 'res', backLabel: ['{ userId: Ana }', 'Ana’s todos'], every: 5 }),
        ],
      },
    },
    {
      short: 'Logout',
      beat: 'technique',
      title: 'Logging out is deleting a row',
      body: [
        'To end a session, delete its record. The cookie still exists in the browser, but it now points at nothing — the next request is a stranger again.',
        'The same works for a **stolen** cookie, and for “log me out on every device”: delete all of Ana’s sessions and every copy dies instantly.',
      ],
      code: {
        file: 'routes/auth.js',
        lang: 'js',
        code: `app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.sendStatus(204);
  });
});`,
        hl: [2, 3],
      },
      metrics: { lookups: 1, revoke: 'instant', servers: 'with a shared store' },
      scene: {
        nodes: patch({ ...base, cookie: { ...cookie, state: 'ghost' } }, {
          web: { screen: denied },
          store: { items: [], badge: { text: 'a8f3 deleted', tone: 'danger' } },
        }),
        links,
        flows: [flow(['web', 'srv', 'store'], { kind: 'auth', label: ['POST /logout', 'destroy a8f3'], back: 'res', backLabel: ['ok', '204'], every: 4.6 })],
      },
    },
    {
      short: 'Many servers',
      beat: 'problem',
      title: 'Many servers, and the note is on the wrong one',
      body: [
        'Traffic grows and you run three copies of the server behind a load balancer. If sessions live in each server’s **memory** (the default store!), Ana’s session exists only on Server A.',
        'Her next request lands on Server B, which has never heard of her: `401`. That’s why real deployments keep sessions in a shared store like [[redis|Redis]] that every server can reach.',
      ],
      callout: { kind: 'warn', text: 'express-session’s default MemoryStore is for development only: it forgets everyone on restart and can’t be shared between servers.' },
      metrics: { lookups: 1, revoke: 'instant', servers: 'no (memory)' },
      scene: {
        nodes: {
          web: { ...web, screen: denied, state: 'error' },
          cookie,
          lb: box(350, 290, 'Load balancer', { icon: 'network', tone: 'net', w: 184 }),
          sA: box(610, 145, 'Server A', { sub: 'memory: a8f3 → Ana', icon: 'server', tone: 'server', w: 210 }),
          srv: { ...srv, x: 610, label: 'Server B', sub: 'memory: (empty)', w: 210, state: 'error', badge: { text: 'who?', tone: 'danger' } },
          sC: box(610, 435, 'Server C', { sub: 'memory: (empty)', icon: 'server', tone: 'server', w: 210 }),
        },
        links: [link('web', 'lb'), link('lb', 'sA'), link('lb', 'srv'), link('lb', 'sC')],
        flows: [
          flow(['web', 'lb', 'sA'], { kind: 'auth', label: ['POST /login', 'to A'], back: 'auth', backLabel: ['sid=a8f3', 'cookie'], every: 6 }),
          flow(['web', 'lb', 'srv'], { kind: 'auth', label: ['GET + sid=a8f3', 'to B'], back: 'err', backLabel: ['unknown sid', '401'], every: 6, offset: 3 }),
        ],
      },
    },
    {
      short: 'Tokens',
      beat: 'technique',
      title: 'Tokens: carry the proof yourself',
      body: [
        'With a [[jwt|JWT]], the cookie holds the signed facts themselves: *“user Ana, valid until 10:15”*. Any server with the secret can verify the signature and trust it — no store, no lookup.',
        'That makes tokens attractive when many services or servers must check identity, or for mobile apps and third-party APIs.',
      ],
      metrics: { lookups: 0, revoke: '—', servers: 'yes' },
      scene: {
        nodes: patch({ ...base, cookie: { ...cookie, label: 'cookie: token=eyJ…', state: 'active' } }, {
          web: { screen: todos },
          srv: { sub: 'jwt.verify(token)', state: 'ok' },
          store: { state: 'dim', badge: { text: 'not needed', tone: 'neutral' } },
        }),
        links: [link('web', 'srv'), link('srv', 'store', { state: 'off' })],
        flows: [flow(['web', 'srv'], { kind: 'auth', label: 'token=eyJ…', back: 'res', backLabel: 'verified ✓', every: 3.6 })],
      },
    },
    {
      short: 'Trade-offs',
      beat: 'tradeoff',
      title: 'What tokens give up: taking them back',
      body: [
        'Because nothing is stored, a token can’t be cancelled. A stolen JWT keeps working until it expires; “log out everywhere” needs extra machinery (short expiry + refresh tokens, or a deny-list — which is a store again).',
        'Rule of thumb: for a typical web app with its own API on one domain, **sessions in an httpOnly cookie** are simple and easy to revoke. Reach for tokens when identity must cross many services or clients. Many apps combine both.',
      ],
      check: {
        q: 'A user’s laptop is stolen and they must be logged out of every device *right now*. Which design makes that simple?',
        options: ['Sessions — delete their session records', 'JWTs — they expire eventually', 'Either — both are instant', 'Neither — you must change the server secret'],
        answer: 0,
        explain: 'Sessions live on the server, so deleting them ends every login at once. A JWT stays valid until it expires unless you add a revocation list.',
      },
      metrics: { lookups: '1 vs 0', revoke: 'sessions: instant · JWT: at expiry', servers: 'both, with care' },
      scene: {
        nodes: patch({ ...base, cookie }, {
          web: { screen: todos },
          store: { items: [], state: 'ok', badge: { text: 'delete Ana’s sessions ✓', tone: 'ok' } },
          srv: { sub: 'sessions or JWT?' },
        }),
        links,
        flows: [flow(['web', 'srv', 'store'], { kind: 'auth', label: ['stolen sid', 'get sid'], back: 'err', backLabel: ['not found', '401 ✓'], every: 4.6 })],
      },
    },
    {
      short: 'CSRF',
      beat: 'insight',
      title: 'Cookies go everywhere — even where you didn’t send them',
      body: [
        'Browsers attach cookies to requests your site *receives*, no matter which site started them. So `evil.example` can auto-submit a hidden form to your API and Ana’s cookie rides along. That’s [[csrf|CSRF]], and it affects session cookies and cookie-stored JWTs alike.',
        'The modern defence is the [[same-site|SameSite]] cookie setting: with `Lax` or `Strict`, the browser leaves the cookie off cross-site `POST`s. Add CSRF tokens for older browsers or `SameSite=None` setups.',
      ],
      code: {
        file: 'server.js',
        lang: 'js',
        code: `cookie: {
  httpOnly: true,   // JavaScript can't read it (XSS)
  secure: true,     // HTTPS only
  sameSite: 'lax',  // not sent on cross-site POSTs (CSRF)
}`,
        hl: [4],
      },
      metrics: { lookups: 1, revoke: 'instant', servers: 'with a shared store' },
      scene: {
        nodes: {
          ...base,
          cookie,
          web: { ...web, url: 'evil.example', screen: [{ t: 'h', text: 'You won a prize!' }, { t: 'btn', text: 'Claim' }] },
          evil: box(520, 500, 'evil.example', { sub: 'hidden auto-submit form', icon: 'bug', tone: 'danger', w: 240 }),
          srv: { ...srv, state: 'ok', badge: { text: 'no cookie → 401', tone: 'ok' } },
        },
        links: [...links, link('evil', 'web', { style: 'dashed', tone: 'danger', label: 'runs in Ana’s tab' })],
        flows: [
          flow(['evil', 'web'], { kind: 'err', label: 'submit form', every: 5 }),
          flow(['web', 'srv'], { kind: 'err', label: 'POST /api/todos/delete-all (cookie blocked)', back: 'err', backLabel: '401', every: 5, offset: 1.3 }),
        ],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Choosing how to remember users',
      body: [
        '{auth:Sessions}: a random id in an httpOnly cookie; the server looks up the record. Instant logout and revocation; needs a shared store when you scale.',
        '{auth:Tokens}: the cookie (or header) carries signed claims; any server can verify without a lookup. Easy to scale across services; hard to revoke — keep them short-lived.',
        'Either way: `httpOnly`, `secure`, `sameSite` cookies, HTTPS everywhere, and never trust anything the client could forge.',
      ],
      metrics: { lookups: 1, revoke: 'instant', servers: 'with a shared store' },
      scene: {
        nodes: patch({ ...base, cookie }, { web: { screen: todos } }),
        links,
        flows: [flow(['web', 'srv', 'store'], { kind: 'auth', label: ['cookie sid=a8f3', 'get a8f3'], back: 'res', backLabel: ['Ana', 'todos'], every: 5 })],
      },
    },
  ],
});
