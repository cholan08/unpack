import { actor, box, defineLesson, doc, field, flow, link, zone } from '@/content/dsl';
import type { LinkSpec, NodeSpec } from '@/engine/types';

/* ---------- layout: buyers → the order route → two collections that must stay consistent ---------- */
const api = box(400, 300, 'POST /api/orders', { sub: 'place an order', icon: 'express', tone: 'server', w: 220 });
const product = (stock: string, o: Partial<NodeSpec> = {}) =>
  ({ ...doc(780, 160, 'products', [field('name', '"Desk lamp"'), field('stock', stock, { hl: true })], { w: 300 }), ...o }) as NodeSpec;
const orders = (rows: string[], o: Partial<NodeSpec> = {}) =>
  ({ ...doc(780, 430, 'orders', rows.length ? rows.map((r) => field('', r)) : [field('', '(none)')], { w: 300 }), ...o }) as NodeSpec;
const ana = actor(110, 190, 'Ana', { icon: 'user', tone: 'client' });
const ben = actor(110, 420, 'Ben', { icon: 'user', tone: 'client' });

const links: LinkSpec[] = [link('ana', 'api'), link('api', 'product'), link('api', 'orders')];
const twoWrites = (o: Parameters<typeof flow>[1] = {}) => [
  flow(['ana', 'api', 'product'], { kind: 'data', label: ['buy lamp', 'stock − 1'], every: 5.4, ...o }),
  flow(['api', 'orders'], { kind: 'data', label: 'insert order', every: 5.4, offset: 2.2, ...o }),
];

export default defineLesson({
  metrics: [
    { id: 'stock', label: 'Lamps in stock' },
    { id: 'orders', label: 'Orders recorded' },
    { id: 'ok', label: 'Data consistent' },
  ],
  legend: { data: 'write', err: 'failed / conflicting write' },
  goals: [
    { text: 'Why some writes must happen together', step: 1 },
    { text: 'Single-document writes are atomic', step: 3 },
    { text: 'Two buyers, one item: overselling', step: 4 },
    { text: 'Conditional updates', step: 5 },
    { text: 'Multi-document transactions', step: 6 },
  ],
  steps: [
    {
      short: 'Two writes',
      beat: 'setup',
      title: 'An order is two writes',
      body: [
        'Ana buys the last desk lamp. The server must do two things: decrease the product’s `stock`, and insert an `orders` document.',
        'They only make sense **together**. Stock down without an order is a lost lamp; an order without the stock change is a lamp sold twice.',
      ],
      metrics: { stock: 0, orders: 1, ok: 'yes' },
      scene: { nodes: { ana, api, product: product('0'), orders: orders(['{ user: "Ana", item: "Desk lamp" }']) }, links, flows: twoWrites() },
    },
    {
      short: 'Crash',
      beat: 'problem',
      title: 'A crash between the two writes',
      body: [
        'The first write succeeds — stock is now 0. Then the server crashes, or the second write fails validation, or the network drops. The order is never inserted.',
        'Now the data contradicts itself: a lamp is gone from stock, and nobody bought it. Nothing in the code will notice.',
      ],
      metrics: { stock: 0, orders: 0, ok: 'no' },
      scene: {
        nodes: { ana, api: { ...api, state: 'error', badge: { text: 'crashed after write 1', tone: 'danger' } }, product: product('0', { state: 'error' }), orders: orders([], { state: 'dim' }) },
        links,
        flows: [
          flow(['ana', 'api', 'product'], { kind: 'data', label: ['buy lamp', 'stock − 1 ✓'], every: 5.4 }),
          flow(['api', 'orders'], { kind: 'err', label: 'insert order', fail: true, every: 5.4, offset: 2.2 }),
        ],
      },
    },
    {
      short: 'Atomic docs',
      beat: 'technique',
      title: 'One document is always all-or-nothing',
      body: [
        'MongoDB guarantees that a write to a **single document** is [[atomic]]: every field change in it lands together, or none do — even nested arrays.',
        'So the first tool is design: if things must change together, can they live in one document? (An order with its line items embedded, for example.) Many apps need transactions far less often than they think.',
      ],
      code: {
        file: 'orders.js',
        lang: 'js',
        code: `// one document, one atomic write: status, items and total change together
await Order.updateOne({ _id }, {
  $set: { status: 'paid', paidAt: new Date() },
  $push: { history: { at: new Date(), event: 'paid' } },
});`,
        hl: [2, 3, 4],
      },
      metrics: { stock: 1, orders: 0, ok: 'yes' },
      scene: {
        nodes: { ana, api, product: product('1'), orders: orders(['{ status: "paid", items: [ … ] }'], { state: 'ok', badge: { text: 'one atomic write', tone: 'ok' } }) },
        links,
        flows: [flow(['ana', 'api', 'orders'], { kind: 'data', label: ['pay', '$set + $push'], every: 4 })],
      },
    },
    {
      short: 'Last lamp',
      beat: 'problem',
      title: 'Two buyers, one lamp',
      body: [
        'Ana and Ben click **Buy** in the same millisecond. Each request reads the product (stock 1), checks “in stock? yes”, then writes `stock = 0` and creates an order.',
        'Both checks passed before either write happened. Two orders, one lamp, stock wrong. That’s a race condition on the server.',
      ],
      code: {
        file: 'orders.js',
        lang: 'js',
        code: `const lamp = await Product.findById(id);        // both read stock: 1
if (lamp.stock < 1) throw new AppError(409, 'SOLD_OUT');
lamp.stock -= 1;
await lamp.save();                               // both write stock: 0
await Order.create({ user, item: id });          // two orders 😱`,
        err: [1, 5],
      },
      metrics: { stock: 0, orders: 2, ok: 'no' },
      scene: {
        nodes: { ana, ben, api, product: product('0  (sold twice)', { state: 'error' }), orders: orders(['{ user: "Ana", … }', '{ user: "Ben", … }'], { state: 'error', badge: { text: 'oversold', tone: 'danger' } }) },
        links: [...links, link('ben', 'api')],
        flows: [
          flow(['ana', 'api', 'product'], { kind: 'data', label: ['buy', 'read: 1'], back: 'res', every: 5, dwell: 0.6 }),
          flow(['ben', 'api', 'product'], { kind: 'data', label: ['buy', 'read: 1'], back: 'res', every: 5, offset: 0.15, dwell: 0.6 }),
          flow(['api', 'orders'], { kind: 'err', label: '2 orders', every: 5, offset: 3.2 }),
        ],
      },
    },
    {
      short: 'Conditional',
      beat: 'solution',
      title: 'Check and change in one atomic step',
      body: [
        'Move the check **into** the write: “decrement stock only if it’s at least 1”. The database evaluates the condition and applies the change atomically, so only one of the two requests can match.',
        'The loser gets `null` back and answers “sold out” — no transaction needed for this part.',
      ],
      check: {
        q: 'Ana’s and Ben’s requests both run `findOneAndUpdate({ _id, stock: { $gte: 1 } }, { $inc: { stock: -1 } })` at the same moment. What happens?',
        options: ['Both succeed; stock becomes −1', 'One succeeds; the other matches nothing and gets null', 'Both fail with an error', 'Both succeed; stock stays 0'],
        answer: 1,
        explain: 'Single-document updates are atomic. After the first decrement, stock is 0, so the second filter no longer matches anything.',
      },
      code: {
        file: 'orders.js',
        lang: 'js',
        code: `const lamp = await Product.findOneAndUpdate(
  { _id: id, stock: { $gte: 1 } },   // only if still in stock…
  { $inc: { stock: -1 } },           // …take one, atomically
  { new: true },
);
if (!lamp) throw new AppError(409, 'SOLD_OUT');`,
        hl: [2, 3, 6],
      },
      metrics: { stock: 0, orders: 1, ok: 'yes' },
      scene: {
        nodes: { ana, ben: { ...ben, badge: { text: 'sold out', tone: 'warn' } }, api, product: product('0', { state: 'ok' }), orders: orders(['{ user: "Ana", item: "Desk lamp" }'], { state: 'ok' }) },
        links: [...links, link('ben', 'api')],
        flows: [
          flow(['ana', 'api', 'product'], { kind: 'data', label: ['buy', 'stock ≥ 1 → −1'], back: 'res', backLabel: ['lamp', '201'], every: 5 }),
          flow(['ben', 'api', 'product'], { kind: 'err', label: ['buy', 'stock ≥ 1?'], back: 'err', backLabel: ['null', '409 sold out'], every: 5, offset: 0.2 }),
        ],
      },
    },
    {
      short: 'Transactions',
      beat: 'solution',
      title: 'Multi-document transactions: all or nothing',
      body: [
        'When writes really must span documents — the stock **and** the order — wrap them in a [[transaction]]. Inside it, either every write commits, or on any error all of them are rolled back as if nothing happened.',
        'Mongoose’s `withTransaction` also retries automatically on temporary conflicts. Transactions need a replica set — Atlas clusters always are one.',
      ],
      code: {
        file: 'orders.js',
        lang: 'js',
        code: `const session = await mongoose.startSession();
await session.withTransaction(async () => {
  const lamp = await Product.findOneAndUpdate(
    { _id: id, stock: { $gte: 1 } }, { $inc: { stock: -1 } }, { session, new: true });
  if (!lamp) throw new AppError(409, 'SOLD_OUT');      // aborts: nothing changes
  await Order.create([{ user, item: id }], { session });
});                                                    // both commit together
await session.endSession();`,
        hl: [2, 4, 6, 7],
      },
      metrics: { stock: 0, orders: 1, ok: 'yes' },
      scene: {
        nodes: {
          tx: zone(780, 295, 330, 500, 'transaction', { tone: 'ok', icon: 'lock', state: 'active' }),
          ana,
          api: { ...api, sub: 'withTransaction()' },
          product: product('0', { state: 'ok' }),
          orders: orders(['{ user: "Ana", item: "Desk lamp" }'], { state: 'ok' }),
        },
        links,
        flows: [...twoWrites(), flow(['api', 'product'], { kind: 'res', label: 'commit both', every: 5.4, offset: 4 })],
      },
    },
    {
      short: 'Costs',
      beat: 'tradeoff',
      title: 'Transactions aren’t free',
      body: [
        'Transactions hold locks on what they touch, so they’re slower and can conflict with each other — which means retries. Long transactions make it worse.',
        'Keep them short, do slow work (emails, payments) **outside** them, and prefer an atomic single-document design or a conditional update when it can do the job.',
      ],
      metrics: { stock: 0, orders: 1, ok: 'yes' },
      scene: {
        nodes: {
          ana,
          ben,
          api: { ...api, badge: { text: 'write conflict → retry', tone: 'warn' } },
          product: product('0'),
          orders: orders(['{ user: "Ana", item: "Desk lamp" }']),
        },
        links: [...links, link('ben', 'api')],
        flows: [...twoWrites(), flow(['ben', 'api', 'product'], { kind: 'err', label: ['buy', 'conflict'], back: 'err', backLabel: ['retry', 'retry'], every: 5.4, offset: 0.5 })],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Keeping writes consistent',
      body: [
        'Writes to {data:one document} are atomic — design so related changes share a document when you can.',
        'Put the check inside the write (`findOneAndUpdate` with a condition) to beat races like the last item in stock.',
        'When several documents must change together, use a {ok:transaction}: all commit or none do. Keep it short and retry-friendly.',
      ],
      metrics: { stock: 0, orders: 1, ok: 'yes' },
      scene: {
        nodes: { tx: zone(780, 295, 330, 500, 'transaction', { tone: 'ok', icon: 'lock' }), ana, api, product: product('0', { state: 'ok' }), orders: orders(['{ user: "Ana", item: "Desk lamp" }'], { state: 'ok' }) },
        links,
        flows: twoWrites(),
      },
    },
  ],
});
