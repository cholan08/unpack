import { box, browser, chip, db, defineLesson, doc, field, flow, link, patch, zone } from '@/content/dsl';
import type { ScreenLine } from '@/engine/types';

/* ---------- layout: browser left, server routes in a column, data + token anatomy right ---------- */
const loginForm: ScreenLine[] = [
  { t: 'h', text: 'Log in' },
  { t: 'input', text: 'ana@example.com' },
  { t: 'input', text: '••••••••••' },
  { t: 'btn', text: 'Log in', state: 'active' },
];
const todos: ScreenLine[] = [
  { t: 'h', text: 'Ana’s todos' },
  { t: 'item', text: 'Buy milk' },
  { t: 'item', text: 'Learn MERN' },
];
const denied: ScreenLine[] = [{ t: 'h', text: 'My todos' }, { t: 'error', text: '401 · Please log in' }];

const zs = zone(505, 300, 280, 560, 'Express server', { tone: 'server', icon: 'server' });
const page = browser(150, 270, { w: 220, h: 180, url: 'todo-app.com', screen: denied });
const login = box(505, 135, 'POST /api/login', { sub: 'check password · sign', icon: 'key', tone: 'auth', w: 240 });
const auth = box(505, 290, 'requireAuth', { sub: 'verify signature', icon: 'shield', tone: 'auth', w: 240 });
const route = box(505, 440, 'GET /api/todos', { sub: 'route handler', icon: 'express', tone: 'server', w: 240 });
const secret = chip(505, 548, 'JWT_SECRET', { tone: 'auth', icon: 'lock' });
const mongo = db(850, 440, 'MongoDB', { items: ['users', 'todos'], w: 160, h: 112 });
const token = chip(150, 455, 'token', { tone: 'auth', icon: 'key', w: 150 });
const jwt = doc(850, 175, 'decoded token', [
  field('alg', '"HS256"', { tone: 'net' }),
  field('sub', '"6740…a1"', { tone: 'auth' }),
  field('name', '"Ana"', { tone: 'auth' }),
  field('exp', '1732356000', { tone: 'auth' }),
  field('signature', 'HMAC(…, secret)', { tone: 'ok' }),
], { w: 250, icon: 'key', sub: 'header · payload · sig' });

const base = { zs, page, login, auth, route, secret, mongo };
const links = [
  link('page', 'login'),
  link('page', 'auth'),
  link('auth', 'route'),
  link('route', 'mongo'),
  link('login', 'mongo', { route: 'hv' }),
  link('route', 'page', { style: 'dashed' }),
];

/** Without the login → DB elbow, which would cut through the token card. */
const linksNoDb = links.filter((l) => !(l.from === 'login' && l.to === 'mongo'));

const verifyCode = `export function requireAuth(req, res, next) {
  const token = req.cookies.token;           // or the Authorization header
  if (!token) return res.status(401).json({ error: 'Not logged in' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET); // checks signature + exp
    req.user = { id: payload.sub, name: payload.name };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}`;

export default defineLesson({
  metrics: [
    { id: 'who', label: 'Server knows you' },
    { id: 'dbHits', label: 'DB lookups to check you', better: 'lower' },
  ],
  legend: { auth: 'credentials / token' },
  goals: [
    { text: 'Why HTTP needs a way to remember you', step: 1 },
    { text: 'How login creates a signed token', step: 3 },
    { text: 'What is (and isn’t) inside a JWT', step: 4 },
    { text: 'Why a tampered token is rejected', step: 6 },
    { text: 'Where to store the token safely', step: 7 },
    { text: 'Expiry and refresh tokens', step: 8 },
  ],
  steps: [
    {
      short: 'Strangers',
      beat: 'problem',
      title: 'Every request arrives as a stranger',
      body: [
        'HTTP has no memory. Each request stands alone, so the server can’t tell whether this `GET /api/todos` comes from Ana, from Ben, or from a bot.',
        'Sending the email and password with every request would work — but it means storing the password in the browser and running slow password checks hundreds of times. We want to log in **once**.',
      ],
      metrics: { who: 'no', dbHits: null },
      scene: {
        nodes: patch(base, { auth: { state: 'error', badge: { text: 'who are you?', tone: 'danger' } }, route: { state: 'dim' } }),
        links,
        flows: [flow(['page', 'auth'], { label: 'GET /api/todos', back: 'err', backLabel: '401', every: 3.6 })],
      },
    },
    {
      short: 'Log in',
      beat: 'technique',
      title: 'Log in once with your password',
      body: [
        'The login form posts the email and password over HTTPS. The server finds the user and checks the password against the stored **hash** with `bcrypt.compare` — passwords themselves are never stored.',
        'This is [[authentication]]: proving who you are. Now the server needs a way to remember the answer.',
      ],
      code: {
        file: 'routes/auth.js',
        lang: 'js',
        code: `app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) return res.status(401).json({ error: 'Wrong email or password' });
  // …next: issue a token
});`,
        hl: [3, 4],
      },
      metrics: { who: 'no', dbHits: 1 },
      scene: {
        nodes: patch(base, { page: { screen: loginForm }, login: { state: 'active' } }),
        links,
        flows: [
          flow(['page', 'login', 'mongo'], { kind: 'auth', label: ['email + password', 'findOne({ email })'], back: 'res', backLabel: ['user + hash', '✓ match'], every: 5 }),
        ],
      },
    },
    {
      short: 'Sign',
      beat: 'technique',
      title: 'The server signs a token',
      body: [
        'Instead of a session stored on the server, it creates a [[jwt|JSON Web Token]]: a small JSON payload (*“this is user 6740…a1, until 10:15”*) plus a [[signature]] made with a secret only the server knows.',
        'The token goes back to the browser, which will present it with every request from now on.',
      ],
      code: {
        file: 'routes/auth.js',
        lang: 'js',
        code: `const token = jwt.sign(
  { sub: user.id, name: user.name },   // payload: who
  process.env.JWT_SECRET,              // only the server knows this
  { expiresIn: '15m' },                // and until when
);
res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'lax' });
res.json({ name: user.name });`,
        hl: [1, 2, 3, 4],
      },
      metrics: { who: 'yes', dbHits: null },
      scene: {
        nodes: patch({ ...base, token: { ...token, state: 'active', badge: { text: 'new', tone: 'ok' } }, jwt }, {
          page: { screen: todos },
          login: { state: 'active' },
          secret: { state: 'active' },
        }),
        links: [...linksNoDb, link('login', 'jwt', { style: 'dashed', tone: 'auth' })],
        flows: [flow(['login', 'page'], { kind: 'auth', label: 'Set-Cookie: token=eyJ…', every: 3.4 })],
      },
    },
    {
      short: 'Anatomy',
      beat: 'insight',
      title: 'Inside a JWT: readable, not secret',
      body: [
        'A JWT is three base64url chunks joined by dots: a **header** (which algorithm), a **payload** (the claims), and a **signature**. The first two are only *encoded*, not encrypted — anyone holding the token can decode them.',
        'What makes it trustworthy is the signature: a [[hash]] of header + payload mixed with the secret. Without the secret, nobody can produce a valid one.',
      ],
      callout: { kind: 'warn', text: 'Never put passwords, secrets or private data in a JWT payload — paste any token into a decoder and it’s plain to see.' },
      code: {
        lang: 'text',
        file: 'token',
        code: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9         ← header
.eyJzdWIiOiI2NzQwYTEiLCJuYW1lIjoiQW5hIn0      ← payload
.k7Q8vL0mN2hX5aT1rF9sW3eY6uB4cD0gH8jK2pZ1xQ  ← signature`,
        hl: [3],
      },
      metrics: { who: 'yes', dbHits: null },
      scene: {
        nodes: patch({ ...base, token, jwt: { ...jwt, state: 'active' } }, { page: { screen: todos }, secret: { state: 'active' } }),
        links: [...linksNoDb, link('login', 'jwt', { style: 'dashed', tone: 'auth' })],
      },
    },
    {
      short: 'Verify',
      beat: 'technique',
      title: 'Every request carries the token',
      body: [
        'The browser sends the cookie automatically. `requireAuth` re-computes the signature with the secret: if it matches and the token hasn’t expired, the payload is trustworthy and becomes `req.user`.',
        'No database lookup is needed to know who you are — that’s the big appeal of tokens. The route then loads only *your* todos.',
      ],
      code: { file: 'middleware/requireAuth.js', lang: 'js', code: verifyCode, hl: [5, 6, 7] },
      metrics: { who: 'yes', dbHits: 0 },
      scene: {
        nodes: patch({ ...base, token }, { page: { screen: todos }, auth: { state: 'ok', badge: { text: 'req.user = Ana', tone: 'ok' } } }),
        links,
        flows: [
          flow(['page', 'auth', 'route', 'mongo'], {
            kind: 'auth',
            label: ['GET + token', 'req.user', 'find({ userId })'],
            back: 'res',
            returnVia: ['mongo', 'route', 'page'],
            backLabel: ['2 todos', '200 · JSON'],
            every: 5.2,
          }),
        ],
      },
    },
    {
      short: 'Tampering',
      beat: 'problem',
      title: 'What if someone edits the token?',
      body: [
        'Ben decodes his own token, changes `sub` to Ana’s id, re-encodes it and sends it. The payload now *claims* to be Ana.',
        'But the signature was computed over the **original** payload. `jwt.verify` recomputes it, the two don’t match, and the request is rejected before it reaches any route.',
      ],
      check: {
        q: 'Ben edits the payload’s `sub` to Ana’s id and keeps the original signature. What happens?',
        options: ['He sees Ana’s todos', 'The server rejects it: the signature no longer matches', 'It works until the token expires', 'The server re-signs it for him'],
        answer: 1,
        explain: 'Any change to the header or payload changes what the signature should be. Without the secret, Ben can’t compute the new one — so `jwt.verify` throws and he gets a 401.',
      },
      metrics: { who: 'no', dbHits: 0 },
      scene: {
        nodes: patch({ ...base, token: { ...token, label: 'edited token', state: 'error' } }, {
          page: { screen: denied, url: 'todo-app.com (Ben)' },
          auth: { state: 'error', badge: { text: 'invalid signature', tone: 'danger' } },
          route: { state: 'dim' },
          mongo: { state: 'dim' },
        }),
        links,
        flows: [flow(['page', 'auth'], { kind: 'auth', label: 'sub: "Ana" (forged)', back: 'err', backLabel: '401', every: 3.6 })],
      },
    },
    {
      short: 'Storage',
      beat: 'tradeoff',
      title: 'Where should the browser keep it?',
      body: [
        '**localStorage** is easy, but any JavaScript on the page can read it — so a single XSS bug (an injected script) can steal the token and use it from anywhere.',
        'An [[http-only|httpOnly]] **cookie** can’t be read by JavaScript at all; the browser just sends it. Add `secure` (HTTPS only) and `sameSite` (not sent on most cross-site requests) to blunt CSRF.',
      ],
      code: {
        file: 'routes/auth.js',
        lang: 'js',
        code: `// ❌ readable by any script on the page
localStorage.setItem('token', token);

// ✅ invisible to JavaScript, sent automatically
res.cookie('token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAge: 15 * 60 * 1000,
});`,
        err: [2],
        hl: [5, 6, 7, 8],
      },
      metrics: { who: 'yes', dbHits: 0 },
      scene: {
        nodes: patch(
          {
            ...base,
            ls: chip(150, 430, 'localStorage', { tone: 'danger', icon: 'key', w: 170, state: 'error', badge: { text: 'XSS can read', tone: 'danger' } }),
            token: { ...token, y: 500, label: 'httpOnly cookie', icon: 'cookie', w: 170, state: 'ok', badge: { text: 'JS can’t read', tone: 'ok' } },
          },
          { page: { screen: todos } },
        ),
        links,
        flows: [flow(['page', 'auth', 'route'], { kind: 'auth', label: ['cookie sent automatically', 'req.user'], every: 4 })],
      },
    },
    {
      short: 'Expiry',
      beat: 'tradeoff',
      title: 'Tokens can’t be taken back — so keep them short',
      body: [
        'The server doesn’t store tokens, so it can’t “delete” one: a stolen token works until it expires. Logging out just removes it from *this* browser.',
        'The usual answer: a short-lived **access token** (minutes) plus a long-lived **refresh token** in an httpOnly cookie, which the server *does* track and can revoke. When the access token expires, the app quietly asks for a new one.',
      ],
      code: {
        file: 'api.js',
        lang: 'js',
        code: `async function api(path, options) {
  let res = await fetch(path, { credentials: 'include', ...options });
  if (res.status === 401) {
    await fetch('/api/refresh', { method: 'POST', credentials: 'include' });
    res = await fetch(path, { credentials: 'include', ...options }); // retry once
  }
  return res;
}`,
        hl: [3, 4, 5],
      },
      metrics: { who: 'yes', dbHits: 1 },
      scene: {
        nodes: patch({ ...base, token: { ...token, label: 'token (expired)', state: 'error' } }, {
          page: { screen: todos },
          login: { label: 'POST /api/refresh', sub: 'verify · re-sign', state: 'active' },
        }),
        links,
        flows: [
          flow(['page', 'auth'], { kind: 'auth', label: 'expired token', back: 'err', backLabel: '401', every: 6.4 }),
          flow(['page', 'login', 'mongo'], { kind: 'auth', label: ['refresh', 'is it revoked?'], back: 'auth', backLabel: ['no', 'new token'], every: 6.4, offset: 2.1 }),
        ],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'JWT auth, end to end',
      body: [
        '{auth:Log in once}: check the password hash, then sign a token with a server-only secret.',
        '{client:The browser} sends the token with every request — ideally as an httpOnly, secure, sameSite cookie.',
        '{server:requireAuth} verifies the signature and expiry and sets `req.user`; routes trust only that.',
        'Payloads are readable, never secret. Keep tokens short-lived and use refresh tokens you can revoke.',
      ],
      metrics: { who: 'yes', dbHits: 0 },
      scene: {
        nodes: patch({ ...base, token: { ...token, label: 'httpOnly cookie', icon: 'cookie', state: 'ok' } }, { page: { screen: todos }, auth: { state: 'ok' } }),
        links,
        flows: [
          flow(['page', 'auth', 'route', 'mongo'], {
            kind: 'auth',
            label: ['GET + token', 'req.user', 'find'],
            back: 'res',
            returnVia: ['mongo', 'route', 'page'],
            backLabel: ['todos', '200'],
            every: 5.2,
          }),
        ],
      },
    },
  ],
});
