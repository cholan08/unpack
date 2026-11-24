import { box, code, db, defineLesson, flow, item, link, patch, stack } from '@/content/dsl';
import type { Item, LinkSpec, NodeSpec } from '@/engine/types';

/* ---------- layout: Dockerfile → image (layers) → running containers ---------- */
const DOCKERFILE = `FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
USER node
EXPOSE 5000
CMD ["node", "src/server.js"]`;
const dockerfile = code(185, 280, DOCKERFILE, { file: 'Dockerfile', lang: 'docker', w: 300, tone: 'server', icon: 'file' });
const layers = (cached = false): Item[] => [
  item('l4', 'COPY src  (your code)', { tone: 'server', state: cached ? 'active' : undefined, sub: cached ? 'rebuilt · 2 s' : undefined }),
  item('l3', 'RUN npm ci  (deps)', { tone: 'server', state: cached ? 'ok' : undefined, sub: cached ? 'cached ✓' : undefined }),
  item('l2', 'COPY package*.json', { tone: 'server', state: cached ? 'ok' : undefined, sub: cached ? 'cached ✓' : undefined }),
  item('l1', 'node:22-slim  (base)', { tone: 'neutral', state: cached ? 'ok' : undefined, sub: cached ? 'cached ✓' : undefined }),
];
const image = stack(530, 300, 'Image · todo-api:1.4', layers(), { w: 260, h: 300, mono: true, icon: 'boxes', tone: 'server' });
const ctr = (y: number, n: number) => box(860, y, `container ${n}`, { sub: 'todo-api:1.4', icon: 'server', tone: 'server', w: 180 });
const containers: Record<string, NodeSpec> = { c1: ctr(170, 1), c2: ctr(300, 2), c3: ctr(430, 3) };
const base: Record<string, NodeSpec> = { dockerfile, image, ...containers };
const links: LinkSpec[] = [link('dockerfile', 'image', { label: 'docker build' }), link('image', 'c1'), link('image', 'c2'), link('image', 'c3')];
const runs = ['c1', 'c2', 'c3'].map((c, i) => flow(['image', c], { kind: 'data', label: i === 0 ? 'docker run' : undefined, every: 4, offset: i * 0.3 }));

export default defineLesson({
  metrics: [
    { id: 'build', label: 'Rebuild after a code change', better: 'lower' },
    { id: 'same', label: 'Same everywhere' },
  ],
  legend: { data: 'image / layer' },
  goals: [
    { text: 'Images vs containers', step: 2 },
    { text: 'Writing a Dockerfile', step: 3 },
    { text: 'Layer caching', step: 4 },
    { text: 'Running the stack with compose', step: 5 },
    { text: 'Containers are disposable', step: 6 },
  ],
  steps: [
    {
      short: 'My machine',
      beat: 'problem',
      title: '“It works on my machine” — again',
      body: [
        'Your API works locally on Node 22. The server has Node 18; a teammate’s laptop lacks an image library; CI uses a different OS. Each environment is subtly different, and bugs live in the differences.',
        'What if you could ship the **environment** along with the code?',
      ],
      metrics: { build: '—', same: 'no' },
      scene: {
        nodes: {
          a: box(250, 170, 'Your laptop', { sub: 'Node 22 · works ✓', icon: 'terminal', tone: 'ok', w: 220 }),
          b: box(250, 430, 'Teammate', { sub: 'Node 20 · missing lib', icon: 'terminal', tone: 'danger', w: 220, state: 'error' }),
          c: box(740, 300, 'Server', { sub: 'Node 18 · crashes', icon: 'server', tone: 'danger', w: 220, state: 'error' }),
        },
        links: [link('a', 'b', { style: 'dashed', label: 'git clone' }), link('a', 'c', { style: 'dashed', label: 'deploy' })],
      },
    },
    {
      short: 'Image & container',
      beat: 'solution',
      title: 'An image packages everything; containers run it',
      body: [
        'A [[docker-image|container image]] is a snapshot of a filesystem: a minimal OS, the exact Node version, your dependencies and your code. A [[container]] is a running instance of an image — isolated, but sharing the host’s kernel, so it starts in a second.',
        'Build the image once and the same bytes run on your laptop, in CI and in production. Need more capacity? Start more containers from the same image.',
      ],
      metrics: { build: '—', same: 'yes' },
      scene: { nodes: base, links, flows: [flow(['dockerfile', 'image'], { kind: 'data', label: 'build', every: 4 }), ...runs] },
    },
    {
      short: 'Dockerfile',
      beat: 'technique',
      title: 'A Dockerfile for the API',
      body: [
        'A Dockerfile is the recipe: start **FROM** an official Node image, set a working directory, copy and install dependencies, copy the source, and say what command to run.',
        'Small details matter: `npm ci` installs exactly the lockfile; `--omit=dev` skips test tools; `USER node` avoids running as root.',
      ],
      code: { file: 'Dockerfile', lang: 'docker', code: DOCKERFILE, hl: [1, 4, 6, 8] },
      metrics: { build: '90 s', same: 'yes' },
      scene: { nodes: patch(base, { dockerfile: { hl: [1, 4, 6, 8] } }), links, flows: [flow(['dockerfile', 'image'], { kind: 'data', label: 'docker build', every: 3.6 })] },
    },
    {
      short: 'Layers',
      beat: 'technique',
      title: 'Layers and the build cache',
      body: [
        'Each instruction produces a **layer**, and Docker reuses a layer if nothing it depends on changed. That’s why the Dockerfile copies `package.json` and runs `npm ci` **before** copying the source.',
        'Change a line of code and only the final layer rebuilds — two seconds instead of a full reinstall.',
      ],
      check: {
        q: 'You put `COPY . .` before `RUN npm ci`. You edit one line in `server.js`. What happens on the next build?',
        options: ['Only the source layer rebuilds', 'npm ci runs again — the copy changed, so every layer after it is rebuilt', 'Nothing — Docker ignores code changes', 'The base image is downloaded again'],
        answer: 1,
        explain: 'A changed layer invalidates every layer after it. Copy dependency manifests and install first; copy the frequently-changing source last.',
      },
      metrics: { build: '2 s', same: 'yes' },
      scene: { nodes: patch(base, { image: { items: layers(true) }, dockerfile: { hl: [5] } }), links, flows: [flow(['dockerfile', 'image'], { kind: 'data', label: 'src changed', every: 3.4 })] },
    },
    {
      short: 'compose',
      beat: 'technique',
      title: 'docker compose: the whole stack, one command',
      body: [
        'Your API needs MongoDB (and maybe Redis). [[compose|docker compose]] describes all the services in one file — images, ports, environment, volumes — and `docker compose up` starts them together on a private network where they find each other by name.',
        'New teammates go from clone to running app with one command.',
      ],
      code: {
        file: 'compose.yaml',
        lang: 'yaml',
        code: `services:
  api:
    build: .
    ports: ["5000:5000"]
    environment:
      MONGO_URL: mongodb://mongo:27017/todos   # "mongo" = the service name
    depends_on: [mongo]
  mongo:
    image: mongo:8
    volumes: [mongo-data:/data/db]             # data survives restarts
volumes:
  mongo-data:`,
        hl: [6, 10],
      },
      metrics: { build: '2 s', same: 'yes' },
      scene: {
        nodes: {
          dockerfile: code(185, 280, `$ docker compose up\n✔ mongo  Started\n✔ api    Started`, { file: 'Terminal', lang: 'bash', w: 300, tone: 'neutral' }),
          c1: box(560, 300, 'api', { sub: 'todo-api · :5000', icon: 'server', tone: 'server', w: 210 }),
          m: db(840, 300, 'mongo', { sub: 'mongo:8', w: 150, h: 110 }),
          vol: box(840, 480, 'volume', { sub: 'mongo-data', icon: 'disk', tone: 'neutral', w: 160 }),
        },
        links: [link('dockerfile', 'c1'), link('c1', 'm', { label: 'mongo:27017' }), link('m', 'vol', { style: 'dashed' })],
        flows: [flow(['c1', 'm'], { label: 'find()', back: 'res', every: 3.6 })],
      },
    },
    {
      short: 'Disposable',
      beat: 'tradeoff',
      title: 'Containers are disposable — keep state outside',
      body: [
        'Containers get replaced on every deploy, scaled up and down, restarted on failure. Anything written inside one — uploaded files, sessions in memory, logs on disk — vanishes with it.',
        'Keep state in services built for it: the database, object storage, Redis, a log collector. Then any container can serve any request.',
      ],
      check: {
        q: 'Your API saves uploaded photos to `/app/uploads` inside the container. What happens on the next deploy?',
        options: ['They’re copied to the new container', 'They’re lost with the old container', 'Docker backs them up automatically', 'They move into the image'],
        answer: 1,
        explain: 'A new container starts from the image, which doesn’t include files written at runtime. Use object storage (or a volume) for anything that must survive.',
      },
      metrics: { build: '2 s', same: 'yes' },
      scene: {
        nodes: patch(base, { c1: { state: 'ghost', label: 'old container', badge: { text: 'replaced · files lost', tone: 'danger' } }, c2: { label: 'new container', state: 'ok' } }),
        links,
        flows: [flow(['image', 'c2'], { kind: 'data', label: 'new deploy', every: 3.6 })],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Containers in one picture',
      body: [
        'A {server:Dockerfile} builds an {server:image} — OS, runtime, deps and code — that runs identically everywhere as {server:containers}.',
        'Order instructions for layer caching (deps before source), run as a non-root user, and use compose to start the whole stack locally.',
        'Containers are cattle, not pets: keep state in databases, object storage and volumes.',
      ],
      metrics: { build: '2 s', same: 'yes' },
      scene: { nodes: base, links, flows: [flow(['dockerfile', 'image'], { kind: 'data', label: 'build', every: 4 }), ...runs] },
    },
  ],
});
