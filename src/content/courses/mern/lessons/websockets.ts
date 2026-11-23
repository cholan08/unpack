import { box, browser, db, defineLesson, flow, link, patch } from '@/content/dsl';
import type { LinkSpec, NodeSpec, ScreenLine } from '@/engine/types';

/* ---------- layout: three people’s browsers on the left, server(s) in the middle, data on the right ---------- */
const list = (extra?: string): ScreenLine[] => [
  { t: 'h', text: 'Groceries' },
  { t: 'item', text: 'Milk' },
  ...(extra ? [{ t: 'item', text: extra, flash: true } as ScreenLine] : []),
];
const tab = (y: number, who: string, extra?: string) => browser(115, y, { w: 190, h: 140, url: `${who} · todo-app.com`, screen: list(extra) });
const tabs = { ana: tab(135, 'Ana', 'Eggs'), ben: tab(300, 'Ben', 'Eggs'), cy: tab(465, 'Cy', 'Eggs') };
const server = box(470, 300, 'Express + Socket.IO', { sub: 'one process', icon: 'server', tone: 'server', w: 230 });
const mongo = db(840, 300, 'MongoDB', { items: ['todos'], w: 150, h: 110 });
const base: Record<string, NodeSpec> = { ...tabs, server, mongo };
const lines: LinkSpec[] = [
  link('ana', 'server', { style: 'dashed', arrow: false }),
  link('ben', 'server', { style: 'dashed', arrow: false }),
  link('cy', 'server', { style: 'dashed', arrow: false }),
  link('server', 'mongo'),
];
const live = (o: Parameters<typeof flow>[1] = {}) => [
  flow(['ana', 'server', 'mongo'], { kind: 'data', label: ['add “Eggs”', 'insert'], every: 5.4, ...o }),
  flow(['server', 'ben'], { kind: 'event', label: 'todo:added', every: 5.4, offset: 2, ...o }),
  flow(['server', 'cy'], { kind: 'event', label: 'todo:added', every: 5.4, offset: 2.1, ...o }),
];

export default defineLesson({
  metrics: [
    { id: 'reqs', label: 'Requests per minute', better: 'lower' },
    { id: 'delay', label: 'Others see the change after', unit: 's', better: 'lower' },
  ],
  legend: { event: 'pushed message', data: 'write' },
  goals: [
    { text: 'Why polling wastes work', step: 1 },
    { text: 'How a WebSocket connection works', step: 2 },
    { text: 'Broadcasting to a room', step: 3 },
    { text: 'Authenticating sockets', step: 4 },
    { text: 'Scaling sockets across servers', step: 6 },
  ],
  steps: [
    {
      short: 'Polling',
      beat: 'problem',
      title: 'HTTP can only answer — so we keep asking',
      body: [
        'Ana, Ben and Cy share a grocery list. With plain HTTP the server can’t tell Ben that Ana added *Eggs*; it can only answer requests. So every tab asks “anything new?” every two seconds — [[polling]].',
        'That’s 90 requests a minute for three people, almost all answered “no”, and changes still arrive up to two seconds late.',
      ],
      metrics: { reqs: 90, delay: 2 },
      scene: {
        nodes: patch(base, { ben: { screen: list() }, cy: { screen: list() } }),
        links: [link('ana', 'server'), link('ben', 'server'), link('cy', 'server'), link('server', 'mongo')],
        flows: ['ana', 'ben', 'cy'].map((t, i) => flow([t, 'server'], { label: 'anything new?', back: 'res', backLabel: 'no', every: 2, offset: i * 0.6 })),
      },
    },
    {
      short: 'WebSocket',
      beat: 'solution',
      title: 'A WebSocket: one open line, both directions',
      body: [
        'A [[websocket|WebSocket]] starts as an ordinary HTTP request asking to **upgrade**. The server answers `101 Switching Protocols`, and the connection stays open. From then on either side can send a message whenever it likes.',
        'No more asking: the server pushes the moment something happens. Socket.IO adds reconnection, rooms and fallbacks on top.',
      ],
      code: { lang: 'http', file: 'the handshake', code: `GET /socket.io/?transport=websocket HTTP/1.1\nUpgrade: websocket\nConnection: Upgrade\n\nHTTP/1.1 101 Switching Protocols`, hl: [2, 5] },
      metrics: { reqs: 0, delay: 0.05 },
      scene: {
        nodes: patch(base, { server: { state: 'active', badge: { text: '3 open connections', tone: 'server' } } }),
        links: lines,
        flows: ['ana', 'ben', 'cy'].map((t, i) => flow([t, 'server'], { kind: 'event', label: i === 0 ? 'ping' : undefined, back: 'event', backLabel: 'pong', every: 4, offset: i * 0.4 })),
      },
    },
    {
      short: 'Rooms',
      beat: 'technique',
      title: 'Broadcast a change to everyone in the room',
      body: [
        'Ana adds *Eggs* (still a normal API call, or a socket message). The server saves it, then **emits** `todo:added` to the [[room]] `list:42` — every socket viewing that list.',
        'Ben’s and Cy’s screens update within milliseconds. Users viewing other lists hear nothing.',
      ],
      code: {
        file: 'socket.js',
        lang: 'js',
        code: `io.on('connection', (socket) => {
  socket.on('list:join', (listId) => socket.join(\`list:\${listId}\`));
});

// after saving a todo (e.g. in the POST route)
io.to(\`list:\${todo.listId}\`).emit('todo:added', todo);`,
        hl: [2, 6],
      },
      metrics: { reqs: 1, delay: 0.05 },
      scene: { nodes: patch(base, { server: { badge: { text: 'room list:42', tone: 'server' } } }), links: lines, flows: live() },
    },
    {
      short: 'Auth',
      beat: 'technique',
      title: 'Check who’s connecting',
      body: [
        'A socket connection is a long-lived door into your server, so authenticate it like a request: read the session cookie or token in the handshake, verify it in a socket middleware, and attach the user.',
        'Then check permissions before joining rooms — Ben may only join lists he’s a member of.',
      ],
      code: {
        file: 'socket.js',
        lang: 'js',
        code: `io.use(async (socket, next) => {
  const user = await userFromCookie(socket.handshake.headers.cookie);
  if (!user) return next(new Error('unauthorized'));
  socket.data.user = user;
  next();
});`,
        hl: [2, 3],
      },
      metrics: { reqs: 0, delay: 0.05 },
      scene: {
        nodes: patch(base, { cy: { url: 'stranger · ???', screen: [{ t: 'error', text: 'unauthorized' }], state: 'error' }, server: { badge: { text: 'io.use(auth)', tone: 'auth' } } }),
        links: lines,
        flows: [flow(['ana', 'server'], { kind: 'auth', label: 'cookie ✓', back: 'event', backLabel: 'connected', every: 4 }), flow(['cy', 'server'], { kind: 'auth', label: 'no cookie', back: 'err', backLabel: 'rejected', every: 4, offset: 1.5 })],
      },
    },
    {
      short: 'Two servers',
      beat: 'problem',
      title: 'Two servers, and the room is split in half',
      body: [
        'Traffic grows and you run two servers. Ana’s socket lands on Server A, Ben’s on Server B. When A emits to `list:42`, it only knows **its own** sockets — Ben never hears about the eggs.',
        'Each server’s rooms live in its own memory, just like in-memory sessions.',
      ],
      metrics: { reqs: 0, delay: 'never' },
      scene: {
        nodes: {
          ana: tabs.ana,
          ben: { ...tabs.ben, screen: list(), state: 'error', badge: { text: 'never updated', tone: 'danger' } },
          cy: tabs.cy,
          sA: box(470, 190, 'Server A', { sub: 'Ana, Cy', icon: 'server', tone: 'server', w: 200 }),
          sB: box(470, 420, 'Server B', { sub: 'Ben', icon: 'server', tone: 'server', w: 200 }),
        },
        links: [link('ana', 'sA', { style: 'dashed', arrow: false }), link('cy', 'sA', { style: 'dashed', arrow: false }), link('ben', 'sB', { style: 'dashed', arrow: false })],
        flows: [flow(['ana', 'sA'], { kind: 'data', label: 'add “Eggs”', every: 5 }), flow(['sA', 'cy'], { kind: 'event', label: 'todo:added', every: 5, offset: 1.6 })],
      },
    },
    {
      short: 'Redis adapter',
      beat: 'solution',
      title: 'Share broadcasts through Redis pub/sub',
      body: [
        'The Socket.IO Redis adapter connects the servers with [[pubsub|pub/sub]]: when Server A emits to a room, it also **publishes** the message to Redis; every server subscribes and delivers it to its own sockets in that room.',
        'Now it doesn’t matter which server anyone is connected to.',
      ],
      code: { file: 'socket.js', lang: 'js', code: `import { createAdapter } from '@socket.io/redis-adapter';\nio.adapter(createAdapter(pubClient, subClient));`, hl: [2] },
      metrics: { reqs: 0, delay: 0.06 },
      scene: {
        nodes: {
          ...tabs,
          sA: box(470, 190, 'Server A', { sub: 'Ana, Cy', icon: 'server', tone: 'server', w: 200 }),
          sB: box(470, 420, 'Server B', { sub: 'Ben', icon: 'server', tone: 'server', w: 200 }),
          redis: box(790, 300, 'Redis', { sub: 'pub/sub', icon: 'bolt', tone: 'data', w: 170, state: 'active' }),
        },
        links: [link('ana', 'sA', { style: 'dashed', arrow: false }), link('cy', 'sA', { style: 'dashed', arrow: false }), link('ben', 'sB', { style: 'dashed', arrow: false }), link('sA', 'redis'), link('redis', 'sB')],
        flows: [
          flow(['ana', 'sA', 'redis', 'sB', 'ben'], { kind: 'event', label: ['add', 'publish', 'deliver', 'todo:added'], every: 5.6 }),
          flow(['sA', 'cy'], { kind: 'event', label: 'todo:added', every: 5.6, offset: 1.2 }),
        ],
      },
    },
    {
      short: 'Trade-offs',
      beat: 'tradeoff',
      title: 'Connections drop — the database stays the truth',
      body: [
        'Phones go through tunnels, laptops sleep, servers redeploy. A socket can miss messages while it’s away. So treat socket messages as **hints**: keep MongoDB as the source of truth, and on reconnect, refetch the list (or ask for “changes since” a timestamp).',
        'If updates only flow server → browser (notifications, progress), Server-Sent Events are a simpler alternative over plain HTTP.',
      ],
      check: {
        q: 'Ben’s laptop slept for ten minutes. Socket.IO reconnects automatically. What should the app do?',
        options: ['Nothing — Socket.IO replays missed messages', 'Refetch the list from the API (or ask for changes since last seen)', 'Ask Ana to re-add her items', 'Reload the page every ten minutes'],
        answer: 1,
        explain: 'Messages sent while Ben was disconnected are gone. The database has the real state, so refetch on reconnect.',
      },
      metrics: { reqs: 1, delay: 0.05 },
      scene: {
        nodes: patch(base, { ben: { badge: { text: 'reconnected → refetch', tone: 'warn' } } }),
        links: lines,
        flows: [flow(['ben', 'server', 'mongo'], { label: ['GET /api/lists/42', 'find'], back: 'res', backLabel: ['todos', 'fresh list'], every: 4.4 })],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Real-time, in short',
      body: [
        'Polling asks constantly and is still late. A {server:WebSocket} keeps one connection open so the server can push the moment something changes.',
        'Put sockets in {server:rooms} and emit after saving; authenticate the handshake and check room access.',
        'With several servers, share broadcasts through {data:Redis pub/sub}. Sockets are hints — refetch from the database on reconnect.',
      ],
      metrics: { reqs: 1, delay: 0.05 },
      scene: { nodes: base, links: lines, flows: live() },
    },
  ],
});
