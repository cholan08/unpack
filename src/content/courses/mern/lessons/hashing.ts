import { actor, box, browser, chip, defineLesson, doc, field, flow, link } from '@/content/dsl';
import type { Field, LinkSpec, ScreenLine } from '@/engine/types';

/* ---------- layout: sign-up form → server → users collection; the attacker waits below ---------- */
const signup: ScreenLine[] = [
  { t: 'h', text: 'Create account' },
  { t: 'input', text: 'ana@ex.com' },
  { t: 'input', text: 'hunter2' },
  { t: 'btn', text: 'Sign up', state: 'active' },
];

const web = browser(130, 290, { w: 210, h: 180, url: 'todo-app.com/signup', screen: signup });
const route = box(420, 150, 'POST /signup', { sub: 'Express', icon: 'express', tone: 'server', w: 210 });
const hasher = box(420, 300, 'hash()', { sub: 'SHA-256', icon: 'fingerprint', tone: 'auth', w: 210 });
const salt = chip(420, 225, 'salt = random()', { tone: 'auth', icon: 'bolt', w: 160 });
const attacker = actor(790, 500, 'Attacker', { icon: 'bug', tone: 'danger' });

const rows = (vals: [string, string, string], hl: boolean[] = []): Field[] =>
  ['ana@ex.com', 'ben@ex.com', 'cy@ex.com'].map((email, i) => field(email, vals[i], { hl: hl[i] }));
const users = (vals: [string, string, string], hl?: boolean[]) => doc(790, 290, 'users collection', rows(vals, hl), { w: 330, sub: 'email: stored password' });

const PLAIN: [string, string, string] = ['"hunter2"', '"password123"', '"password123"'];
const SHA: [string, string, string] = ['"f52fbd32b2b3b86f…"', '"ef92b778bafe771e…"', '"ef92b778bafe771e…"'];
const SALTED: [string, string, string] = ['"x9Qz$1b7f9e02…"', '"k2Lm$c04e11a8…"', '"pR8t$5aa1d0c3…"'];
const BCRYPT: [string, string, string] = ['"$2b$12$x9QzT1Lp…"', '"$2b$12$k2LmVv0a…"', '"$2b$12$pR8tQq7n…"'];

const table = doc(450, 495, 'attacker’s lookup table', [
  field('"123456"', '8d969eef6eca…'),
  field('"password123"', 'ef92b778bafe…', { hl: true }),
  field('"hunter2"', 'f52fbd32b2b3…'),
], { w: 300, tone: 'danger', icon: 'book' });

const plainLinks: LinkSpec[] = [link('web', 'route'), link('route', 'users')];
const hashLinks: LinkSpec[] = [link('web', 'route'), link('route', 'hasher'), link('hasher', 'users')];
const saltLinks: LinkSpec[] = [link('web', 'route'), link('route', 'salt'), link('salt', 'hasher'), link('hasher', 'users')];
const leak = link('users', 'attacker', { style: 'dashed', state: 'error', label: 'leaked backup' });

const bcryptCode = `import bcrypt from 'bcrypt';

// sign-up: a random salt is generated and stored inside the result
const passwordHash = await bcrypt.hash(password, 12); // cost 12 = 2¹² rounds
// → '$2b$12$' + 22-char salt + 31-char hash

await User.create({ email, passwordHash });`;

export default defineLesson({
  metrics: [
    { id: 'leak', label: 'If the database leaks' },
    { id: 'guesses', label: 'Attacker guesses / second', better: 'lower' },
    { id: 'crack', label: 'Crack an 8-char password' },
  ],
  legend: { auth: 'password', err: 'stolen data / guess' },
  goals: [
    { text: 'Why plain-text passwords are a disaster', step: 2 },
    { text: 'What a hash is (and why not encryption)', step: 3 },
    { text: 'How lookup tables crack plain hashes', step: 4 },
    { text: 'What a salt does', step: 5 },
    { text: 'Why the hash must be slow — bcrypt', step: 7 },
    { text: 'Checking a password at login', step: 8 },
  ],
  steps: [
    {
      short: 'Sign-up',
      beat: 'setup',
      title: 'A user signs up',
      body: [
        'Ana creates an account with her email and a password. The easy thing is to store exactly what she typed, so that at login we can compare.',
        'Ben and Cy sign up too — and, like millions of people, both pick `password123`.',
      ],
      code: {
        file: 'routes/auth.js',
        lang: 'js',
        code: `app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  await User.create({ email, password }); // stored as typed
  res.status(201).end();
});`,
        hl: [3],
      },
      metrics: { leak: 'passwords in plain text', guesses: null, crack: '0 s' },
      scene: {
        nodes: { web, route, users: users(PLAIN) },
        links: plainLinks,
        flows: [flow(['web', 'route', 'users'], { kind: 'auth', label: ['ana@ex.com + hunter2', 'insertOne'], back: 'res', backLabel: ['ok', '201'], every: 4.4 })],
      },
    },
    {
      short: 'Leaks',
      beat: 'problem',
      title: 'Databases leak',
      body: [
        'Not *if* — *when*. A backup left in a public bucket, a database exposed to the internet, an injection bug, a laptop stolen from a developer. Breaches like this are reported every week.',
        'With plain text, the attacker can log in as every user. Worse, people reuse passwords, so they can also try Ana’s email account, her bank, her work login.',
      ],
      callout: { kind: 'mistake', text: 'Never store passwords in plain text — or in any form you can turn back into the password.' },
      metrics: { leak: 'passwords in plain text', guesses: null, crack: '0 s' },
      scene: {
        nodes: { web, route, users: { ...users(PLAIN, [true, true, true]), state: 'error' }, attacker: { ...attacker, state: 'active' } },
        links: [...plainLinks, leak],
        flows: [flow(['users', 'attacker'], { kind: 'err', label: 'every password', every: 3 })],
      },
    },
    {
      short: 'Hash',
      beat: 'solution',
      title: 'Store a hash, not the password',
      body: [
        'A [[hash]] function turns any input into a fixed-length fingerprint. The same input always gives the same output, a one-character change gives a completely different one, and there is no way to run it backwards.',
        'Store only the hash. At login, hash what the user typed and compare the two fingerprints. The server never needs to know the password itself.',
      ],
      callout: { kind: 'insight', text: 'Why not encrypt instead? [[encryption|Encryption]] is reversible by design, and the key has to live on the same server the attacker just broke into.' },
      code: {
        file: 'try it in node',
        lang: 'js',
        code: `import { createHash } from 'node:crypto';
const sha256 = (s) => createHash('sha256').update(s).digest('hex');

sha256('hunter2');  // 'f52fbd32b2b3b86ff88ef6c4…'
sha256('hunter3');  // a completely different string
// there is no unsha256()`,
        hl: [4, 5],
      },
      changes: ['+ hash() between the route and the database', '~ users now stores fingerprints'],
      metrics: { leak: 'hashes', guesses: null, crack: '?' },
      scene: {
        nodes: { web, route, hasher: { ...hasher, state: 'active' }, users: users(SHA) },
        links: hashLinks,
        flows: [flow(['web', 'route', 'hasher', 'users'], { kind: 'auth', label: ['hunter2', 'hunter2', 'f52fbd32…'], every: 4.4 })],
      },
    },
    {
      short: 'Lookup tables',
      beat: 'problem',
      title: 'Same password, same hash — and attackers keep lists',
      body: [
        'Look at Ben and Cy: identical hashes. The leak tells the attacker they share a password — and since the hash never changes, attackers simply precompute hashes for millions of common passwords.',
        'With a [[rainbow-table|lookup table]], cracking `ef92b778…` is a search, not a calculation. Every common password in the leak falls instantly.',
      ],
      metrics: { leak: 'hashes', guesses: null, crack: 'instant if common' },
      scene: {
        nodes: {
          web,
          route,
          hasher,
          users: users(SHA, [false, true, true]),
          attacker: { ...attacker, state: 'active', badge: { text: 'password123 ✓', tone: 'danger' } },
          table: { ...table, state: 'active' },
        },
        links: [...hashLinks, leak, link('attacker', 'table', { style: 'dashed', tone: 'danger' })],
        flows: [
          flow(['users', 'attacker'], { kind: 'err', label: 'ef92b778…', every: 4.4 }),
          flow(['attacker', 'table'], { kind: 'err', label: 'look up ef92b778…', back: 'err', backLabel: '"password123"', every: 4.4, offset: 1.6 }),
        ],
      },
    },
    {
      short: 'Salt',
      beat: 'solution',
      title: 'Salt: make every hash unique',
      body: [
        'Before hashing, generate a random [[salt]] for each user and mix it in: `hash(salt + password)`. Store the salt next to the hash — it isn’t a secret, it just has to be unique.',
        'Now Ben’s and Cy’s hashes look nothing alike, and a precomputed table is useless: the attacker would need a separate table for every possible salt.',
      ],
      check: {
        q: 'Ben and Cy both use `password123`. With a random salt per user, their stored hashes are…',
        options: ['Identical, as before', 'Different, because their salts differ', 'Empty until they log in', 'Reversible with the salt'],
        answer: 1,
        explain: 'Different salts make different inputs, so the hashes differ. Knowing the salt doesn’t reverse the hash; it only forces the attacker to attack each user separately.',
      },
      metrics: { leak: 'salted hashes', guesses: null, crack: 'no shortcuts' },
      scene: {
        nodes: {
          web,
          route,
          salt: { ...salt, state: 'active' },
          hasher,
          users: users(SALTED, [false, true, true]),
          attacker,
          table: { ...table, state: 'dim', badge: { text: 'useless now', tone: 'ok' } },
        },
        links: [...saltLinks, leak, link('attacker', 'table', { style: 'dashed', state: 'off' })],
        flows: [flow(['web', 'route', 'salt', 'hasher', 'users'], { kind: 'auth', label: ['password123', 'password123', 'k2Lm + password123', 'k2Lm$c04e…'], every: 5 })],
      },
    },
    {
      short: 'Too fast',
      beat: 'problem',
      title: 'Fast hashes fall to brute force',
      body: [
        'SHA-256 was designed to be **fast** — great for checking file downloads, terrible for passwords. A single gaming GPU computes around ten billion of them per second.',
        'So the attacker just tries every password, one salt at a time. Every 8-character password made of lowercase letters and digits can be tried in about five minutes. That’s [[brute-force|brute force]].',
      ],
      metrics: { leak: 'salted SHA-256', guesses: 10000000000, crack: '≈ 5 minutes' },
      scene: {
        nodes: {
          web,
          route,
          salt,
          hasher,
          users: { ...users(SALTED), state: 'error' },
          attacker: { ...attacker, state: 'busy', badge: { text: 'GPU · 10 billion/s', tone: 'danger' } },
        },
        links: [...saltLinks, leak],
        flows: [flow(['attacker', 'users'], { kind: 'err', label: 'guess #8,312,004,117', every: 0.7, speed: 2.4, fail: true })],
      },
    },
    {
      short: 'bcrypt',
      beat: 'solution',
      title: 'Slow on purpose: bcrypt',
      body: [
        'Password hashes should be **deliberately slow**. [[bcrypt]] runs its core thousands of times; the *cost* factor sets how many (each +1 doubles it). Cost 12 takes about a quarter of a second.',
        'A quarter of a second is nothing for one login — and crushing for an attacker making trillions of guesses. bcrypt also generates and stores the salt for you.',
      ],
      callout: { kind: 'tip', text: 'Argon2id is the newer recommendation (it also uses lots of memory, which GPUs hate). bcrypt is still a solid choice. Never invent your own scheme.' },
      code: { file: 'routes/auth.js', lang: 'js', code: bcryptCode, hl: [4, 5] },
      metrics: { leak: 'bcrypt hashes', guesses: 1500, crack: '≈ 60 years' },
      scene: {
        nodes: {
          web,
          route,
          hasher: { ...hasher, label: 'bcrypt.hash()', sub: 'cost 12 · ~250 ms', state: 'busy' },
          users: users(BCRYPT),
          attacker: { ...attacker, state: 'dim', badge: { text: '~1,500 guesses/s', tone: 'ok' } },
        },
        links: [...hashLinks, leak],
        flows: [
          flow(['web', 'route', 'hasher', 'users'], { kind: 'auth', label: ['hunter2', 'hunter2', '$2b$12$x9Qz…'], every: 5, dwell: 0.6 }),
          flow(['attacker', 'users'], { kind: 'err', label: 'guess', every: 5, speed: 0.4, fail: true }),
        ],
      },
    },
    {
      short: 'Login',
      beat: 'technique',
      title: 'Checking a password at login',
      body: [
        'At login, find the user by email, then let `bcrypt.compare` do the rest: it reads the salt and cost from the stored hash, hashes the attempt the same way, and compares in constant time.',
        'Send the **same** error whether the email or the password was wrong, so attackers can’t use your login form to discover who has an account.',
      ],
      code: {
        file: 'routes/auth.js',
        lang: 'js',
        code: `app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) return res.status(401).json({ error: 'Wrong email or password' });
  // …issue a session or token (see JWT Auth)
});`,
        hl: [4, 5],
      },
      metrics: { leak: 'bcrypt hashes', guesses: 1500, crack: '≈ 60 years' },
      scene: {
        nodes: {
          web: { ...web, url: 'todo-app.com/login', screen: [{ t: 'h', text: 'Log in' }, { t: 'input', text: 'ana@ex.com' }, { t: 'input', text: '••••••••' }, { t: 'btn', text: 'Log in', state: 'active' }] },
          route: { ...route, label: 'POST /login' },
          hasher: { ...hasher, label: 'bcrypt.compare()', sub: 'reads salt + cost', state: 'ok' },
          users: users(BCRYPT, [true, false, false]),
        },
        links: [...hashLinks, link('route', 'users', { style: 'dashed' })],
        flows: [
          flow(['web', 'route', 'users'], { kind: 'auth', label: ['email + password', 'findOne({ email })'], back: 'res', backLabel: ['$2b$12$x9Qz…', 'user'], every: 6.4 }),
          flow(['route', 'hasher'], { kind: 'auth', label: 'compare', back: 'res', backLabel: 'true ✓', every: 6.4, offset: 3.2 }),
        ],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Storing passwords safely',
      body: [
        'Never store passwords, or anything reversible like encrypted passwords.',
        '{auth:Hash} them — a one-way fingerprint you compare at login.',
        '{auth:Salt} each one, so equal passwords look different and lookup tables are useless.',
        'Use a {ok:slow, purpose-built hash}: bcrypt (cost ≥ 12) or Argon2id. They salt for you. Give the same error for a wrong email and a wrong password.',
      ],
      metrics: { leak: 'bcrypt hashes', guesses: 1500, crack: '≈ 60 years' },
      scene: {
        nodes: { web, route, hasher: { ...hasher, label: 'bcrypt.hash()', sub: 'salted · slow' }, users: users(BCRYPT), attacker: { ...attacker, state: 'dim' } },
        links: [...hashLinks, leak],
        flows: [flow(['web', 'route', 'hasher', 'users'], { kind: 'auth', label: ['password', 'password', '$2b$12$…'], every: 5 })],
      },
    },
  ],
});
