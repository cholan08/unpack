import { actor, box, chip, db, defineLesson, doc, field, flow, item, link, patch, stack, zone } from '@/content/dsl';
import type { LinkSpec, NodeSpec } from '@/engine/types';

/* ---------- development: everything on your laptop ---------- */
const laptop = zone(500, 300, 900, 360, 'Your laptop · localhost', { tone: 'neutral', icon: 'terminal' });
const vite = box(210, 300, 'Vite dev server', { sub: ':5173 · hot reload', icon: 'bolt', tone: 'client', w: 230 });
const nodeDev = box(500, 300, 'node server.js', { sub: ':5000 · nodemon', icon: 'node', tone: 'server', w: 230 });
const mongod = db(790, 300, 'mongod', { sub: ':27017', w: 150, h: 112 });
const dist = stack(540, 300, 'dist/', [
  item('i', 'index.html          0.5 KB', { tone: 'client' }),
  item('j', 'assets/index-4f9c.js  182 KB', { tone: 'client' }),
  item('c', 'assets/index-91ab.css  12 KB', { tone: 'client' }),
], { w: 330, h: 170, from: 'top', mono: true, icon: 'boxes', tone: 'client' });

/* ---------- production ---------- */
const users = actor(85, 300, 'Users', { tone: 'neutral' });
const cdn = box(385, 150, 'Static host + CDN', { sub: 'serves dist/', icon: 'cloud', tone: 'net', w: 250 });
const api = box(385, 450, 'API server', { sub: 'Node · Express · $PORT', icon: 'node', tone: 'server', w: 250 });
const atlas = zone(790, 300, 330, 480, 'MongoDB Atlas', { tone: 'data', icon: 'mongo', sub: 'replica set' });
const primary = db(790, 200, 'primary', { sub: 'takes writes', w: 150, h: 104 });
const sec1 = db(715, 420, 'secondary', { w: 128, h: 92 });
const sec2 = db(865, 420, 'secondary', { w: 128, h: 92 });

const prod: Record<string, NodeSpec> = { users, cdn, api, atlas, primary, sec1, sec2 };
const prodLinks: LinkSpec[] = [
  link('users', 'cdn'),
  link('users', 'api'),
  link('api', 'primary'),
  link('primary', 'sec1', { style: 'dashed', tone: 'data', arrow: false }),
  link('primary', 'sec2', { style: 'dashed', tone: 'data', arrow: false }),
];
const pageLoad = flow(['users', 'cdn'], { label: 'GET /', back: 'res', backLabel: 'index.html + app.js', every: 5.6 });
const apiCall = flow(['users', 'api', 'primary'], { label: ['GET /api/todos', 'find()'], back: 'res', backLabel: ['docs', 'JSON'], every: 5.6, offset: 2.2 });
const replicate = [
  flow(['primary', 'sec1'], { kind: 'data', label: 'copy', every: 5.6, offset: 3.6 }),
  flow(['primary', 'sec2'], { kind: 'data', label: 'copy', every: 5.6, offset: 3.6 }),
];

const env = doc(385, 235, 'Environment', [
  field('NODE_ENV', '"production"'),
  field('PORT', '10000'),
  field('MONGO_URL', '"mongodb+srv://…"', { hl: true }),
  field('JWT_SECRET', '"••••••••"', { hl: true }),
  field('CLIENT_ORIGIN', '"https://todo-app.com"'),
], { w: 300, icon: 'lock', tone: 'auth', sub: 'set in the dashboard' });

export default defineLesson({
  metrics: [
    { id: 'env', label: 'Environment' },
    { id: 'https', label: 'HTTPS' },
    { id: 'restarts', label: 'Restarts on crash' },
  ],
  goals: [
    { text: 'What “building” the front end produces', step: 2 },
    { text: 'Serving static files with the right caching', step: 3 },
    { text: 'Running the API on a platform', step: 4 },
    { text: 'A managed MongoDB cluster', step: 5 },
    { text: 'Keeping config and secrets in the environment', step: 6 },
    { text: 'Redeploying without downtime', step: 8 },
  ],
  steps: [
    {
      short: 'Localhost',
      beat: 'setup',
      title: 'It works on my machine',
      body: [
        'In development, three programs run on your laptop: Vite serves React with hot reload, `node` runs Express, and a local `mongod` holds the data. Everything talks over `localhost`.',
        'None of that exists on the internet. Production needs a different shape — each piece where it runs best.',
      ],
      metrics: { env: 'development', https: 'no', restarts: 'no' },
      scene: {
        nodes: { laptop, vite, nodeDev, mongod },
        links: [link('vite', 'nodeDev', { label: 'proxy /api' }), link('nodeDev', 'mongod')],
        flows: [flow(['vite', 'nodeDev', 'mongod'], { label: ['/api/todos', 'find()'], back: 'res', every: 4.4 })],
      },
    },
    {
      short: 'Build',
      beat: 'technique',
      title: 'Build the front end into static files',
      body: [
        'Browsers don’t need Vite in production. `npm run build` compiles your JSX and imports into a handful of optimised [[static-files|static files]] in `dist/`: one HTML page, one JS bundle, one CSS file. That’s the [[build]].',
        'Notice the hashes in the file names (`index-4f9c.js`). They change whenever the content changes — which makes caching easy, as we’ll see.',
      ],
      code: {
        lang: 'bash',
        file: 'Terminal',
        code: `$ npm run build
dist/index.html                  0.5 kB
dist/assets/index-4f9c.js      182.0 kB │ gzip: 58 kB
dist/assets/index-91ab.css      12.1 kB
✓ built in 2.1s`,
        hl: [1, 3],
      },
      metrics: { env: 'development', https: 'no', restarts: 'no' },
      scene: {
        nodes: { laptop, vite, dist: { ...dist, state: 'active' } },
        links: [link('vite', 'dist', { label: 'npm run build' })],
        flows: [flow(['vite', 'dist'], { kind: 'data', label: 'compile + bundle', every: 3.6 })],
      },
    },
    {
      short: 'Static host',
      beat: 'technique',
      title: 'Static files go to a CDN',
      body: [
        'Upload `dist/` to a static host (Vercel, Netlify, Cloudflare Pages, Render…). It copies the files to a [[cdn|CDN]] near your users and gives you HTTPS for free. No server code runs to serve them.',
        'Cache the hashed assets **forever** — a new build means new names. Never cache `index.html`, so users always pick up the latest bundle names. And route every unknown path to `index.html`, so React Router’s URLs work on refresh.',
      ],
      code: {
        lang: 'http',
        file: 'cache headers',
        code: `# index.html — always check for a newer version
Cache-Control: no-cache

# assets/index-4f9c.js — the name changes when the content does
Cache-Control: public, max-age=31536000, immutable`,
        hl: [2, 5],
      },
      metrics: { env: 'production', https: 'yes', restarts: '—' },
      scene: {
        nodes: { users, cdn: { ...cdn, state: 'active' } },
        links: [link('users', 'cdn')],
        flows: [pageLoad],
      },
    },
    {
      short: 'The API',
      beat: 'technique',
      title: 'The API runs as a long-lived process',
      body: [
        'Express is a program that must keep running, so it goes on a server — easiest on a [[paas|PaaS]] like Render, Railway or Fly.io. Connect your repo; the platform installs, runs `npm start`, gives you HTTPS, and restarts the process if it crashes.',
        'Two rules: listen on the port the platform gives you in `process.env.PORT`, and don’t store anything on the server’s disk — instances get replaced.',
      ],
      code: {
        file: 'server.js',
        lang: 'js',
        code: `const port = process.env.PORT ?? 5000;   // the platform picks the port
app.listen(port, () => console.log(\`API listening on :\${port}\`));

// package.json
// "scripts": { "start": "node server.js" }  ← what the platform runs`,
        hl: [1, 5],
      },
      metrics: { env: 'production', https: 'yes', restarts: 'yes' },
      scene: {
        nodes: { users, cdn, api: { ...api, state: 'active' } },
        links: [link('users', 'cdn'), link('users', 'api')],
        flows: [pageLoad, flow(['users', 'api'], { label: 'GET /api/todos', back: 'res', backLabel: 'JSON', every: 5.6, offset: 2.2 })],
      },
    },
    {
      short: 'Database',
      beat: 'technique',
      title: 'A managed database cluster',
      body: [
        '[[atlas|MongoDB Atlas]] runs the database for you as a [[replica-set|replica set]]: a primary that takes writes and secondaries that keep live copies. If the primary dies, a secondary is promoted in seconds. Backups and monitoring are built in.',
        'You get a connection string (`mongodb+srv://…`) to give the API — a secret. Restrict network access so only your API’s servers can connect.',
      ],
      metrics: { env: 'production', https: 'yes', restarts: 'yes' },
      scene: {
        nodes: patch(prod, { primary: { state: 'active' } }),
        links: prodLinks,
        flows: [pageLoad, apiCall, ...replicate],
      },
    },
    {
      short: 'Config',
      beat: 'technique',
      title: 'Config and secrets live in the environment',
      body: [
        'The same code runs on your laptop and in production; only settings differ. Keep them in [[env-var|environment variables]]: a git-ignored `.env` file locally, the platform’s dashboard in production.',
        'Read them in one place at startup and **fail fast** if one is missing — a crash on deploy beats a mystery error at 3 am.',
      ],
      callout: { kind: 'mistake', text: 'Never commit `.env` or paste secrets into code. If a secret ever reached Git, rotate it — history is forever.' },
      check: {
        q: 'Where should the production `JWT_SECRET` live?',
        options: ['In the React code, so both sides share it', 'In a `.env` file committed to Git', 'In the hosting platform’s environment variables', 'Hard-coded in `server.js`'],
        answer: 2,
        explain: 'Secrets belong in the server’s environment, set in the platform dashboard (or a secrets manager). Anything in the front end or in Git should be considered public.',
      },
      code: {
        file: 'config.js',
        lang: 'js',
        code: `const required = ['MONGO_URL', 'JWT_SECRET', 'CLIENT_ORIGIN'];
for (const key of required) {
  if (!process.env[key]) throw new Error(\`Missing env var: \${key}\`);
}

export const config = {
  mongoUrl: process.env.MONGO_URL,
  jwtSecret: process.env.JWT_SECRET,
  clientOrigin: process.env.CLIENT_ORIGIN,
};`,
        hl: [1, 2, 3],
      },
      metrics: { env: 'production', https: 'yes', restarts: 'yes' },
      scene: {
        nodes: patch(prod, { cdn: null, env: { ...env, state: 'active' } }),
        links: [link('users', 'api'), link('env', 'api', { style: 'dashed', tone: 'auth', label: 'process.env' }), ...prodLinks.slice(2)],
        flows: [flow(['env', 'api'], { kind: 'auth', label: 'MONGO_URL, JWT_SECRET…', every: 4.6 }), apiCall],
      },
    },
    {
      short: 'Domains',
      beat: 'technique',
      title: 'Domains, HTTPS and CORS',
      body: [
        'Point your domains at the two hosts: `todo-app.com` → the static site, `api.todo-app.com` → the API. Both platforms issue HTTPS certificates automatically.',
        'They’re now different [[origin|origins]], so the API must allow the front end with CORS — or skip CORS by having the static host forward `/api/*` to the API, so the browser only ever sees one origin.',
      ],
      code: {
        file: 'server.js',
        lang: 'js',
        code: `app.use(cors({
  origin: config.clientOrigin,   // "https://todo-app.com"
  credentials: true,
}));

// front end: talk to the API through one variable
// const API = import.meta.env.VITE_API_URL; // "https://api.todo-app.com"`,
        hl: [2],
      },
      metrics: { env: 'production', https: 'yes', restarts: 'yes' },
      scene: {
        nodes: patch(prod, {
          cdn: { label: 'todo-app.com', sub: 'static host · CDN' },
          api: { label: 'api.todo-app.com', sub: 'CORS: todo-app.com ✓' },
          lock: chip(240, 300, 'HTTPS ✓', { tone: 'auth', icon: 'lock' }),
        }),
        links: prodLinks,
        flows: [pageLoad, { ...apiCall, label: ['GET api.todo-app.com/…', 'find()'] }],
      },
    },
    {
      short: 'Ship again',
      beat: 'insight',
      title: 'Shipping again, without downtime',
      body: [
        'Each push to `main` triggers a deploy. A good platform starts the **new** version next to the old one, calls its [[health-check|health check]] until it answers, *then* switches traffic over and lets the old one finish its requests.',
        'If the new version never becomes healthy, traffic simply stays on the old one. Add a `/healthz` route that checks what the app needs — like the database connection.',
      ],
      code: {
        file: 'routes/health.js',
        lang: 'js',
        code: `app.get('/healthz', async (req, res) => {
  const dbOk = mongoose.connection.readyState === 1;
  res.status(dbOk ? 200 : 503).json({ ok: dbOk, version: process.env.GIT_SHA });
});`,
        hl: [2, 3],
      },
      metrics: { env: 'production', https: 'yes', restarts: 'yes' },
      scene: {
        nodes: {
          ...prod,
          api: { ...api, x: 300, w: 180, label: 'API v1', sub: 'draining', state: 'dim' },
          api2: box(490, 450, 'API v2', { sub: 'new deploy', icon: 'node', tone: 'server', w: 180, state: 'ok', badge: { text: '/healthz 200', tone: 'ok' } }),
          platform: chip(385, 310, 'platform: deploy on push', { tone: 'net', icon: 'cloud', w: 230 }),
        },
        links: [link('users', 'cdn'), link('users', 'api2'), link('platform', 'api2', { style: 'dashed' }), link('api2', 'primary'), ...prodLinks.slice(3)],
        flows: [
          flow(['platform', 'api2'], { kind: 'event', label: 'GET /healthz', back: 'res', backLabel: '200 ok', every: 5 }),
          flow(['users', 'api2', 'primary'], { label: ['traffic → v2', 'find()'], back: 'res', every: 5, offset: 2.2 }),
        ],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'A MERN app in production',
      body: [
        '{client:React} is built into static files and served from a {net:CDN}: hashed assets cached forever, `index.html` never.',
        '{server:Express} runs as a long-lived process on a platform that restarts it, reading its port and secrets from environment variables.',
        '{data:MongoDB Atlas} runs a replicated, backed-up cluster; only the API can reach it.',
        'Domains + HTTPS on both, CORS (or one origin via a rewrite), health checks, and deploys on every push.',
      ],
      metrics: { env: 'production', https: 'yes', restarts: 'yes' },
      scene: { nodes: prod, links: prodLinks, flows: [pageLoad, apiCall, ...replicate] },
    },
  ],
});
