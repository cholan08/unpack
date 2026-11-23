import { box, browser, db, defineLesson, doc, field, flow, link, patch } from '@/content/dsl';
import type { LinkSpec, NodeSpec, ScreenLine } from '@/engine/types';

/* ---------- layout: two members’ browsers · chat server · MongoDB and Redis ---------- */
const chat = (extra?: string, typing = false): ScreenLine[] => [
  { t: 'h', text: '#weekend-trip' },
  { t: 'text', text: 'Ana: who brings snacks?' },
  ...(extra ? [{ t: 'item', text: extra, flash: true } as ScreenLine] : []),
  ...(typing ? [{ t: 'spinner', text: 'Ben is typing…' } as ScreenLine] : []),
];
const ana = browser(120, 175, { w: 210, h: 160, url: 'Ana · chat.app', screen: chat() });
const ben = browser(120, 445, { w: 210, h: 160, url: 'Ben · chat.app', screen: chat() });
const server = box(450, 310, 'Chat server', { sub: 'Express + Socket.IO', icon: 'server', tone: 'server', w: 210 });
const mongo = db(810, 170, 'MongoDB', { items: ['rooms', 'messages'], w: 180, h: 120 });
const redis = box(810, 450, 'Redis', { sub: 'presence, pubsub', icon: 'bolt', tone: 'data', w: 190 });
const msgDoc = doc(810, 170, 'messages', [field('roomId', 'ObjectId(…)', { hl: true }), field('senderId', 'ObjectId(…)'), field('text', '"I’ll bring chips"'), field('createdAt', 'ISODate(…)', { hl: true })], { w: 270, sub: 'idx roomId+createdAt' });

const base: Record<string, NodeSpec> = { ana, ben, server, mongo };
const links: LinkSpec[] = [link('ana', 'server', { style: 'dashed', arrow: false }), link('ben', 'server', { style: 'dashed', arrow: false }), link('server', 'mongo')];
const send = (o: Parameters<typeof flow>[1] = {}) => [
  flow(['ben', 'server', 'mongo'], { kind: 'data', label: ['message:send', 'insertOne'], every: 5.4, ...o }),
  flow(['server', 'ana'], { kind: 'event', label: 'message:new', every: 5.4, offset: 2.2, ...o }),
];

export default defineLesson({
  metrics: [
    { id: 'latency', label: 'Message delivered in', unit: 'ms', better: 'lower' },
    { id: 'history', label: 'Loading history scans', better: 'lower' },
  ],
  legend: { data: 'write', event: 'pushed to clients' },
  goals: [
    { text: 'A message data model built for its queries', step: 2 },
    { text: 'Sending: save, then broadcast', step: 3 },
    { text: 'History with cursors', step: 4 },
    { text: 'Presence and typing', step: 5 },
    { text: 'Scaling to many servers', step: 7 },
  ],
  steps: [
    {
      short: 'Requirements',
      beat: 'setup',
      title: 'What a chat app needs',
      body: [
        'Rooms with members. Messages appear for everyone in the room instantly. Scrolling up loads older history. You can see who’s online and typing, and how many messages you haven’t read.',
        'Every piece maps to something from this course: WebSockets, cursor pagination, indexes, Redis, and scaling across servers.',
      ],
      metrics: { latency: '—', history: '—' },
      scene: { nodes: { ...base, redis }, links: [...links, link('server', 'redis')], flows: send() },
    },
    {
      short: 'Data model',
      beat: 'technique',
      title: 'Model messages for how they’re read',
      body: [
        'Messages are unbounded — a busy room has millions — so each message is its own document in a `messages` collection, **referencing** its room and sender. Rooms keep a small `members` array (bounded, read together).',
        'The one query that matters: “latest messages in this room”. So index `{ roomId: 1, createdAt: -1 }`.',
      ],
      code: {
        file: 'models/Message.js',
        lang: 'js',
        code: `const messageSchema = new Schema({
  roomId:   { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text:     { type: String, required: true, maxlength: 4000 },
}, { timestamps: true });
messageSchema.index({ roomId: 1, createdAt: -1 });`,
        hl: [6],
      },
      metrics: { latency: '—', history: 50 },
      scene: { nodes: { ...base, mongo: msgDoc }, links, flows: [flow(['server', 'mongo'], { label: 'find({ roomId })', back: 'res', every: 3.6 })] },
    },
    {
      short: 'Send',
      beat: 'technique',
      title: 'Sending: validate, save, then broadcast',
      body: [
        'Ben’s client emits `message:send`. The server checks he’s a member of the room, validates the text, **saves** the message, and only then emits `message:new` to the room — so nobody sees a message that wasn’t stored.',
        'The saved document (with its `_id` and timestamp) is what everyone receives, Ben included, so all screens agree.',
      ],
      code: {
        file: 'chat.js',
        lang: 'js',
        code: `socket.on('message:send', async ({ roomId, text }, ack) => {
  if (!(await isMember(roomId, socket.data.user.id))) return ack({ error: 'forbidden' });
  const msg = await Message.create({ roomId, senderId: socket.data.user.id, text });
  io.to(\`room:\${roomId}\`).emit('message:new', msg);
  ack({ ok: true, id: msg._id });
});`,
        hl: [2, 3, 4],
      },
      metrics: { latency: 60, history: 50 },
      scene: { nodes: patch(base, { ana: { screen: chat('Ben: I’ll bring chips') } }), links, flows: send() },
    },
    {
      short: 'History',
      beat: 'technique',
      title: 'History: load the latest, then page backwards',
      body: [
        'Opening a room loads the newest 50 messages. Scrolling up asks for “50 older than the oldest I have” — cursor pagination on `createdAt`, served straight from the index, as fast for message 1,000,000 as for message 50.',
        'Offset paging would break here: new messages arriving constantly would shift every page.',
      ],
      code: { file: 'routes/messages.js', lang: 'js', code: `Message.find({ roomId, createdAt: { $lt: before } })\n  .sort({ createdAt: -1 })\n  .limit(50);`, hl: [1] },
      metrics: { latency: 60, history: 50 },
      scene: { nodes: { ...base, mongo: msgDoc }, links, flows: [flow(['ana', 'server', 'mongo'], { label: ['scroll up', 'before: 10:02'], back: 'res', backLabel: ['50 older', '50 msgs'], every: 4 })] },
    },
    {
      short: 'Presence',
      beat: 'technique',
      title: 'Presence and typing: short-lived, in Redis',
      body: [
        '“Online” and “typing…” change constantly and don’t matter tomorrow. Writing them to MongoDB would be wasteful. Keep [[presence]] in Redis with short expiries: a heartbeat every 20 s refreshes `online:<userId>` (TTL 30 s); a typing event sets `typing:<room>:<user>` for 5 s.',
        'If a phone loses signal, the key simply expires and the user goes offline — no cleanup code.',
      ],
      metrics: { latency: 60, history: 50 },
      scene: {
        nodes: { ...patch(base, { ana: { screen: chat(undefined, true) } }), redis: { ...redis, state: 'active', badge: { text: 'typing:room:ben EX 5', tone: 'data' } } },
        links: [...links, link('server', 'redis')],
        flows: [flow(['ben', 'server', 'redis'], { kind: 'event', label: ['typing', 'SET EX 5'], every: 3.4 }), flow(['server', 'ana'], { kind: 'event', label: 'ben is typing', every: 3.4, offset: 1.5 })],
      },
    },
    {
      short: 'Unread',
      beat: 'technique',
      title: 'Unread counts from one timestamp',
      body: [
        'Don’t store a “read” flag per message per user — that’s millions of writes. Store one `lastReadAt` per member per room. Unread count = messages in the room created after it, which the same index answers quickly.',
        'Opening the room updates `lastReadAt`; that’s a single small write.',
      ],
      check: {
        q: 'How should the app know which messages Ana hasn’t read?',
        options: ['A readBy array on every message', 'One lastReadAt timestamp per member per room', 'Count everything client-side after downloading the whole room', 'Re-send all messages on every login'],
        answer: 1,
        explain: 'One timestamp per member turns “unread” into an indexed range count: `{ roomId, createdAt: { $gt: lastReadAt } }`. Per-message read flags grow with members × messages.',
      },
      metrics: { latency: 60, history: 50 },
      scene: {
        nodes: { ...base, mongo: doc(810, 170, 'rooms.members', [field('userId', '"ana"'), field('lastReadAt', 'ISODate("…10:04")', { hl: true })], { w: 270 }) },
        links,
        flows: [flow(['ana', 'server', 'mongo'], { label: ['open room', 'count after lastReadAt'], back: 'res', backLabel: ['3 unread', '3'], every: 4 })],
      },
    },
    {
      short: 'Scale',
      beat: 'tradeoff',
      title: 'Many servers: Redis links the rooms',
      body: [
        'With several chat servers behind a load balancer, Ana and Ben may be connected to different ones. The Socket.IO **Redis adapter** relays each room broadcast through Redis pub/sub so every server delivers it to its own sockets.',
        'Also configure the load balancer for WebSockets (and sticky sessions if clients may fall back to long-polling), and keep MongoDB as the source of truth so reconnecting clients can catch up.',
      ],
      metrics: { latency: 70, history: 50 },
      scene: {
        nodes: {
          ana,
          ben,
          s1: box(450, 175, 'Chat server A', { icon: 'server', tone: 'server', w: 200 }),
          s2: box(450, 445, 'Chat server B', { icon: 'server', tone: 'server', w: 200 }),
          redis: { ...redis, y: 310, sub: 'pub/sub adapter', state: 'active' },
          mongo,
        },
        links: [link('ana', 's1', { style: 'dashed', arrow: false }), link('ben', 's2', { style: 'dashed', arrow: false }), link('s1', 'redis'), link('s2', 'redis'), link('s1', 'mongo'), link('s2', 'mongo', { route: 'right', bend: 20, style: 'dashed' })],
        flows: [flow(['ben', 's2', 'redis', 's1', 'ana'], { kind: 'event', label: ['send', 'publish', 'deliver', 'message:new'], every: 5.4 })],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Chat, designed',
      body: [
        '{data:Messages} are their own documents, indexed by `{ roomId, createdAt }`; rooms hold members and each member’s `lastReadAt`.',
        '{server:Sockets}: check membership, save, then broadcast to the room. History loads with cursors. {data:Presence and typing} live in Redis with TTLs.',
        'Scale out with the Redis adapter, and let reconnecting clients catch up from the database.',
      ],
      metrics: { latency: 60, history: 50 },
      scene: { nodes: { ...base, redis }, links: [...links, link('server', 'redis')], flows: send() },
    },
  ],
});
