import { actor, box, db, defineLesson, flow, item, link, patch, stack, zone } from '@/content/dsl';
import type { LinkSpec, NodeSpec } from '@/engine/types';

/* ---------- layout: clients · the Node process (main thread, OS I/O, thread pool) · resources ---------- */
const proc = zone(470, 300, 600, 540, 'Node process', { tone: 'server', icon: 'node' });
const clients = actor(80, 300, 'Clients', { sub: '10,000 open', icon: 'user' });
const main = box(320, 200, 'Main thread', { sub: 'your JS + event loop', icon: 'cpu', tone: 'server', w: 220 });
const osio = box(620, 200, 'OS async I/O', { sub: 'sockets, no threads', icon: 'network', tone: 'net', w: 210 });
const pool = stack(470, 440, 'libuv thread pool', [item('t1', 'thread 1', { tone: 'net' }), item('t2', 'thread 2', { tone: 'net' }), item('t3', 'thread 3', { tone: 'net' }), item('t4', 'thread 4', { tone: 'net' })], { w: 300, h: 204, from: 'top', mono: true, icon: 'layers', tone: 'net' });
const mongo = db(880, 200, 'MongoDB', { sub: 'over the network', w: 150, h: 110 });
const disk = box(880, 440, 'Disk · crypto', { sub: 'fs, bcrypt, zlib', icon: 'disk', tone: 'neutral', w: 190 });

const base: Record<string, NodeSpec> = { proc, clients, main, osio, pool, mongo, disk };
const links: LinkSpec[] = [link('clients', 'main'), link('main', 'osio'), link('osio', 'mongo'), link('main', 'pool'), link('pool', 'disk')];
const requests = (n = 3) =>
  Array.from({ length: n }, (_, i) => flow(['clients', 'main', 'osio', 'mongo'], { label: i === 0 ? ['request', 'query', 'wait…'] : undefined, back: 'res', every: 3.6, offset: i * 0.5, dwell: 0.15 }));

export default defineLesson({
  metrics: [
    { id: 'conns', label: 'Connections handled' },
    { id: 'p99', label: 'Slowest requests (p99)', unit: 'ms', better: 'lower' },
    { id: 'mem', label: 'Memory', unit: 'MB', better: 'lower' },
  ],
  legend: { req: 'request', data: 'background work' },
  goals: [
    { text: 'What Node is made of', step: 1 },
    { text: 'How one thread serves thousands of connections', step: 2 },
    { text: 'What the thread pool does', step: 3 },
    { text: 'Streams instead of loading everything', step: 5 },
    { text: 'Shutting down gracefully', step: 6 },
  ],
  steps: [
    {
      short: 'Inside Node',
      beat: 'setup',
      title: 'JavaScript outside the browser',
      body: [
        'Node is Chrome’s [[v8|V8]] engine plus [[libuv]], a C library for doing I/O without waiting, plus JavaScript APIs for files, networking, crypto and processes.',
        'There’s no `window` or DOM. Instead you get `process`, `fs`, `http` — and the same single-threaded event loop you met in the browser.',
      ],
      metrics: { conns: 3, p99: 40, mem: 60 },
      scene: { nodes: base, links, flows: requests() },
    },
    {
      short: 'Network I/O',
      beat: 'technique',
      title: 'Waiting is free: the OS watches the sockets',
      body: [
        'When your code sends a database query or reads from a socket, Node hands the waiting to the **operating system** and moves on. The OS notifies the event loop when data arrives, and your callback (or `await`) continues.',
        'Nobody is blocked while waiting, so one thread can keep **thousands** of connections in flight — as long as each bit of JavaScript is quick.',
      ],
      metrics: { conns: 10000, p99: 45, mem: 120 },
      scene: { nodes: patch(base, { osio: { state: 'active', badge: { text: '10,000 sockets', tone: 'net' } }, main: { sub: 'never waits on I/O' } }), links, flows: requests(5) },
    },
    {
      short: 'Thread pool',
      beat: 'technique',
      title: 'The thread pool takes the heavy lifting',
      body: [
        'Some operations can’t be done asynchronously by the OS: most file system calls, `bcrypt`/`crypto`, `zlib` compression, DNS lookups. libuv runs those on a small [[thread-pool|thread pool]] — 4 threads by default — and reports back to the event loop.',
        'That’s why `await bcrypt.hash()` doesn’t freeze your server, while `bcrypt.hashSync()` does: the sync version runs on the main thread.',
      ],
      metrics: { conns: 10000, p99: 45, mem: 120 },
      scene: {
        nodes: patch(base, { pool: { state: 'active', items: [item('t1', 'bcrypt.hash', { tone: 'net', state: 'active' }), item('t2', 'fs.readFile', { tone: 'net', state: 'active' }), item('t3', 'zlib.gzip', { tone: 'net', state: 'active' }), item('t4', 'idle', { tone: 'net', state: 'dim' })] } }),
        links,
        flows: [flow(['main', 'pool', 'disk'], { kind: 'data', label: ['hash password', 'on a worker'], back: 'res', every: 3.6 }), ...requests(2)],
      },
    },
    {
      short: 'CPU blocks',
      beat: 'problem',
      title: 'CPU work on the main thread stalls everyone',
      body: [
        'Async I/O only helps with **waiting**. Real computation — parsing a 50 MB JSON file, resizing an image in JS, a big synchronous loop — runs on the main thread, and every other request waits behind it.',
        'For CPU-heavy jobs use `worker_threads`, a separate job queue/service, or a library that does the work in native code off the main thread.',
      ],
      code: {
        file: 'routes/reports.js',
        lang: 'js',
        code: `app.get('/api/report', (req, res) => {
  const data = JSON.parse(fs.readFileSync('big.json', 'utf8')); // ❌ 2 s of CPU + blocking read
  res.json(summarise(data));
});`,
        err: [2],
      },
      metrics: { conns: 10000, p99: 2100, mem: 480 },
      scene: {
        nodes: patch(base, { main: { state: 'error', badge: { text: 'busy for 2 s', tone: 'danger' } }, clients: { badge: { text: 'all waiting', tone: 'danger' } } }),
        links,
        flows: [flow(['clients', 'main'], { label: 'request', fail: true, every: 1.2 })],
      },
    },
    {
      short: 'Streams',
      beat: 'technique',
      title: 'Streams: handle data piece by piece',
      body: [
        '`fs.readFile` loads the entire file into memory before you can use it. For a 2 GB video or export that’s 2 GB of RAM per request. A [[stream]] reads it in small chunks and passes each one on as it arrives.',
        'Memory stays flat no matter how big the file, and the first bytes reach the user immediately.',
      ],
      code: {
        file: 'routes/export.js',
        lang: 'js',
        code: `// ❌ whole file in memory
res.send(await fs.promises.readFile('export.csv'));

// ✅ 64 KB at a time, straight to the response
import { pipeline } from 'node:stream/promises';
await pipeline(fs.createReadStream('export.csv'), res);`,
        err: [2],
        hl: [6],
      },
      metrics: { conns: 10000, p99: 60, mem: 70 },
      scene: {
        nodes: patch(base, { main: { meter: 0.15, sub: 'memory flat' }, disk: { label: 'export.csv', sub: '2 GB file', badge: { text: '64 KB chunks', tone: 'ok' } } }),
        links,
        flows: [flow(['disk', 'pool', 'main', 'clients'], { kind: 'data', label: ['chunk', 'chunk', 'chunk'], every: 0.8, dwell: 0.02, speed: 1.6 })],
      },
    },
    {
      short: 'Shutdown',
      beat: 'technique',
      title: 'Shutting down gracefully',
      body: [
        'Platforms stop your process on every deploy by sending [[sigterm|SIGTERM]] — a polite request. Handle it: stop accepting new connections, let in-flight requests finish, close the database connection, then exit.',
        'Ignore it and the platform kills the process after a timeout, cutting off whatever was mid-request.',
      ],
      check: {
        q: 'During a deploy your process receives SIGTERM. What should it do?',
        options: ['Exit immediately with process.exit(0)', 'Ignore it — the new version will take over', 'Stop taking new requests, finish current ones, close the DB, then exit', 'Restart itself'],
        answer: 2,
        explain: 'Graceful shutdown means no request is cut off midway. `server.close()` stops new connections and waits for open ones.',
      },
      code: {
        file: 'server.js',
        lang: 'js',
        code: `const server = app.listen(port);

process.on('SIGTERM', () => {
  server.close(async () => {        // stop new connections, wait for open ones
    await mongoose.disconnect();
    process.exit(0);
  });
});`,
        hl: [3, 4, 5],
      },
      metrics: { conns: 12, p99: 45, mem: 120 },
      scene: {
        nodes: patch(base, { main: { badge: { text: 'SIGTERM · draining', tone: 'warn' }, state: 'busy' }, clients: { sub: 'finishing 12' } }),
        links,
        flows: [flow(['main', 'clients'], { kind: 'res', label: 'last responses', every: 2.4 })],
      },
    },
    {
      short: 'Scale out',
      beat: 'insight',
      title: 'One thread per process — so run several',
      body: [
        'A Node process uses one CPU core for your JavaScript. To use a 4-core machine, run four processes (Node’s `cluster` module, PM2) — or, more commonly today, run several containers/instances behind a load balancer.',
        'That only works if the processes share nothing in memory: sessions in Redis, files in object storage, data in MongoDB.',
      ],
      metrics: { conns: 40000, p99: 45, mem: 480 },
      scene: {
        nodes: {
          clients,
          lb: box(270, 300, 'Load balancer', { icon: 'network', tone: 'net', w: 180 }),
          n1: box(530, 140, 'Node · core 1', { icon: 'node', tone: 'server', w: 190 }),
          n2: box(530, 250, 'Node · core 2', { icon: 'node', tone: 'server', w: 190 }),
          n3: box(530, 360, 'Node · core 3', { icon: 'node', tone: 'server', w: 190 }),
          n4: box(530, 470, 'Node · core 4', { icon: 'node', tone: 'server', w: 190 }),
          mongo: { ...mongo, y: 300, sub: 'shared state' },
        },
        links: [link('clients', 'lb'), ...['n1', 'n2', 'n3', 'n4'].flatMap((n) => [link('lb', n), link(n, 'mongo')])],
        flows: ['n1', 'n2', 'n3', 'n4'].map((n, i) => flow(['clients', 'lb', n, 'mongo'], { back: 'res', every: 4, offset: i * 0.5 })),
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'How Node does so much with one thread',
      body: [
        'Node = {server:V8} + {net:libuv} + APIs. Network waiting is handed to the OS; file, crypto and zlib work runs on a small {net:thread pool}.',
        'Your JavaScript runs on one main thread: keep each piece short, move CPU-heavy work off it, and stream big data instead of loading it.',
        'Handle SIGTERM gracefully, and scale out with more processes that share nothing in memory.',
      ],
      metrics: { conns: 10000, p99: 45, mem: 120 },
      scene: { nodes: base, links, flows: [...requests(3), flow(['main', 'pool', 'disk'], { kind: 'data', label: ['bcrypt', 'worker'], back: 'res', every: 3.6, offset: 1 })] },
    },
  ],
});
