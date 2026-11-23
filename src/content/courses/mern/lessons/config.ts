import { actor, box, defineLesson, doc, field, flow, link, patch } from '@/content/dsl';
import type { LinkSpec, NodeSpec } from '@/engine/types';

/* ---------- layout: where settings come from (left) → the app → where they can leak (right) ---------- */
const src = (y: number, label: string, sub: string, icon: NodeSpec['icon']) => box(165, y, label, { sub, icon, tone: 'neutral', w: 230 });
const base: Record<string, NodeSpec> = {
  dev: src(130, 'Laptop', '.env (git-ignored)', 'terminal'),
  ci: src(300, 'CI', 'repository secrets', 'workflow'),
  prod: src(470, 'Hosting dashboard', 'environment variables', 'cloud'),
  app: box(500, 300, 'server.js', { sub: 'reads process.env', icon: 'node', tone: 'server', w: 210 }),
};
const links: LinkSpec[] = [link('dev', 'app'), link('ci', 'app'), link('prod', 'app')];
const feed = [
  flow(['dev', 'app'], { kind: 'auth', label: 'MONGO_URL=localhost', every: 5 }),
  flow(['ci', 'app'], { kind: 'auth', label: 'test DB', every: 5, offset: 1.4 }),
  flow(['prod', 'app'], { kind: 'auth', label: 'Atlas URL', every: 5, offset: 2.8 }),
];
const github = box(835, 170, 'GitHub', { sub: 'public repo', icon: 'globe', tone: 'danger', w: 210 });
const bots = actor(835, 420, 'Scanning bots', { sub: 'find keys in minutes', icon: 'bug', tone: 'danger' });

const envCode = `import { z } from 'zod';

const Env = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().default(5000),
  MONGO_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  CLIENT_ORIGIN: z.string().url(),
});

export const env = Env.parse(process.env); // crashes at startup if anything is wrong`;

export default defineLesson({
  metrics: [
    { id: 'exposed', label: 'Secrets exposed', better: 'lower' },
    { id: 'change', label: 'Changing a setting needs' },
  ],
  legend: { auth: 'setting / secret', err: 'leak' },
  goals: [
    { text: 'Why config lives outside the code', step: 1 },
    { text: 'How committed secrets leak', step: 2 },
    { text: 'Environment variables and .env files', step: 3 },
    { text: 'Validating config at startup', step: 4 },
    { text: 'Why front-end “secrets” are public', step: 5 },
  ],
  steps: [
    {
      short: 'Same code',
      beat: 'setup',
      title: 'Same code, different settings',
      body: [
        'Your app runs in several places: your laptop, the CI machine running tests, and production. The **code** is identical everywhere; the **settings** differ — database URL, port, allowed origins, API keys.',
        'So settings shouldn’t be in the code. Each place should hand them to the app when it starts.',
      ],
      metrics: { exposed: 0, change: 'a restart' },
      scene: { nodes: base, links, flows: feed },
    },
    {
      short: 'Hard-coded',
      beat: 'problem',
      title: 'Secrets in code end up in Git history — forever',
      body: [
        'Paste the production database URL into `server.js`, commit, push. Even if you delete it in the next commit, it’s still in the **history**, and anyone who can see the repo can read it.',
        'For public repos it’s worse: automated bots scan new commits for keys and passwords within minutes. Changing a setting also now needs a code change and a redeploy.',
      ],
      code: { file: 'server.js', lang: 'js', code: `await mongoose.connect('mongodb+srv://admin:Hunter2@cluster0.mongodb.net/todos'); // ❌\nconst JWT_SECRET = 'my-secret';                                               // ❌`, err: [1, 2] },
      metrics: { exposed: 2, change: 'a code change' },
      scene: {
        nodes: { app: { ...base.app, state: 'error', sub: 'secrets inside', badge: { text: 'committed', tone: 'danger' } }, github, bots: { ...bots, state: 'active' } },
        links: [link('app', 'github', { label: 'git push' }), link('github', 'bots', { style: 'dashed', state: 'error' })],
        flows: [flow(['app', 'github'], { kind: 'data', label: 'commit a1f3', every: 4.4 }), flow(['github', 'bots'], { kind: 'err', label: 'mongodb+srv://admin:…', every: 4.4, offset: 1.6 })],
      },
    },
    {
      short: 'Env vars',
      beat: 'solution',
      title: 'Read settings from the environment',
      body: [
        'Read every setting from [[env-var|environment variables]]: `process.env.MONGO_URL`. Locally, keep them in a `.env` file loaded at startup (`node --env-file=.env`, or the `dotenv` package) — and add `.env` to `.gitignore`.',
        'Commit a `.env.example` with the names and fake values, so teammates know what to set.',
      ],
      code: {
        file: '.env  (never committed)',
        lang: 'bash',
        code: `# .env
MONGO_URL=mongodb://localhost:27017/todos
JWT_SECRET=dev-only-change-me-please-32-chars
CLIENT_ORIGIN=http://localhost:5173

# .gitignore
.env`,
        hl: [7],
      },
      changes: ['- Secrets in server.js', '+ .env locally, dashboard in production', '+ .env.example committed'],
      metrics: { exposed: 0, change: 'a restart' },
      scene: { nodes: patch(base, { app: { sub: 'process.env', state: 'active' } }), links, flows: feed },
    },
    {
      short: 'Validate',
      beat: 'technique',
      title: 'Validate config once, at startup',
      body: [
        'A missing variable usually shows up as a confusing crash an hour later (“cannot read properties of undefined”). Instead, check everything **when the app starts**, with the same schema tools you use for requests.',
        'Then the rest of the code imports a typed `env` object instead of reading `process.env` all over the place.',
      ],
      code: { file: 'config.js', lang: 'js', code: envCode, hl: [3, 11] },
      metrics: { exposed: 0, change: 'a restart' },
      scene: {
        nodes: patch(base, { prod: { state: 'error', badge: { text: 'JWT_SECRET missing', tone: 'danger' } }, app: { state: 'error', sub: 'refuses to start', badge: { text: 'clear error at boot', tone: 'ok' } } }),
        links,
        flows: [flow(['prod', 'app'], { kind: 'auth', label: 'env (incomplete)', back: 'err', backLabel: 'Invalid: JWT_SECRET', every: 4 })],
      },
    },
    {
      short: 'Front end',
      beat: 'problem',
      title: 'There are no secrets in the front end',
      body: [
        'Vite exposes variables starting with `VITE_` to your React code — by **pasting their values into the JavaScript bundle**. Anyone can open DevTools and read them.',
        'So `VITE_API_URL` is fine; a payment secret key or database URL is not. Secrets stay on the server; the browser asks your API to use them.',
      ],
      check: {
        q: 'You set `VITE_STRIPE_SECRET_KEY` and read it in React. Who can see it?',
        options: ['Only your server', 'Only logged-in users', 'Anyone who loads the site — it’s in the JS bundle', 'Nobody — Vite encrypts it'],
        answer: 2,
        explain: 'Build-time env vars are replaced with their literal values in the bundle. Treat everything shipped to the browser as public.',
      },
      metrics: { exposed: 1, change: 'a rebuild' },
      scene: {
        nodes: {
          bundle: doc(470, 260, 'dist/assets/index-4f9c.js', [field('API_URL', '"https://api.todo-app.com"'), field('STRIPE_SECRET', '"sk_live_51H…"', { hl: true })], { w: 360, tone: 'client', icon: 'file', state: 'error' }),
          user: actor(130, 260, 'Any visitor', { sub: 'DevTools → Sources', icon: 'user' }),
          bots,
        },
        links: [link('user', 'bundle', { style: 'dashed', label: 'view source' }), link('bundle', 'bots', { style: 'dashed', state: 'error' })],
        flows: [flow(['user', 'bundle'], { kind: 'req', label: 'GET index-4f9c.js', back: 'err', backLabel: 'sk_live_…', every: 4.4 })],
      },
    },
    {
      short: 'In production',
      beat: 'technique',
      title: 'Handling secrets in production',
      body: [
        'Set production values in your platform’s dashboard (or a secrets manager), not in files on the server. Give each secret **least privilege**: the app’s database user can read and write its own database, not drop others.',
        'If a secret ever leaks — committed, logged, pasted in a chat — **rotate** it: issue a new one and revoke the old. Deleting the commit isn’t enough.',
      ],
      metrics: { exposed: 0, change: 'a restart' },
      scene: {
        nodes: patch(base, { prod: { state: 'ok', badge: { text: 'least privilege · rotated', tone: 'ok' } }, app: { state: 'ok' } }),
        links,
        flows: feed,
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Config and secrets',
      body: [
        'Code is the same everywhere; {auth:settings} come from the environment: `.env` locally (git-ignored), the dashboard in production, CI secrets for tests.',
        'Validate all config at startup and fail fast. Commit a `.env.example`, never `.env`.',
        'Anything in the front-end bundle is public. Keep secrets on the server, give them least privilege, and rotate any that leak.',
      ],
      metrics: { exposed: 0, change: 'a restart' },
      scene: { nodes: base, links, flows: feed },
    },
  ],
});
