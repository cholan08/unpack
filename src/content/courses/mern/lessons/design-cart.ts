import { box, browser, chip, db, defineLesson, doc, field, flow, link, patch } from '@/content/dsl';
import type { LinkSpec, NodeSpec, ScreenLine } from '@/engine/types';

/* ---------- layout: shopper’s browser · API · database; payment provider on the right ---------- */
const cartScreen = (items: [string, string][], total: string): ScreenLine[] => [
  { t: 'h', text: 'Your cart' },
  ...items.map(([n, p]) => ({ t: 'item', text: `${n} · ${p}` }) as ScreenLine),
  { t: 'text', text: `Total ${total}` },
  { t: 'btn', text: 'Checkout', state: 'active' },
];
const web = browser(130, 300, { w: 220, h: 200, url: 'shop.example', screen: cartScreen([['Desk lamp', '$40'], ['Mug × 2', '$24']], '$64') });
const local = chip(130, 470, 'localStorage cart', { tone: 'client', icon: 'disk', w: 190 });
const api = box(450, 300, 'Express', { sub: 'carts · orders', icon: 'express', tone: 'server', w: 200 });
const mongo = db(450, 500, 'MongoDB', { items: ['products', 'carts', 'orders'], w: 190, h: 120 });
const stripe = box(820, 300, 'Payment provider', { sub: 'hosted checkout', icon: 'shield', tone: 'net', w: 210 });
const cartDoc = (fields: [string, string, boolean?][]) => doc(820, 135, 'carts', fields.map(([k, v, hl]) => field(k, v, { hl })), { w: 270 });

const base: Record<string, NodeSpec> = { web, api, mongo };
const links: LinkSpec[] = [link('web', 'api'), link('api', 'mongo')];

export default defineLesson({
  metrics: [
    { id: 'price', label: 'Price decided by' },
    { id: 'double', label: 'Double charge possible' },
    { id: 'oversell', label: 'Oversell possible' },
  ],
  legend: { data: 'cart / order', auth: 'payment', event: 'webhook' },
  goals: [
    { text: 'Guest carts and merging on login', step: 2 },
    { text: 'Why prices come from the server', step: 3 },
    { text: 'Reserving stock at checkout', step: 4 },
    { text: 'Idempotent order creation', step: 5 },
    { text: 'Payments and webhooks', step: 6 },
  ],
  steps: [
    {
      short: 'Requirements',
      beat: 'setup',
      title: 'A cart that handles real money',
      body: [
        'Shoppers add items without an account, log in at checkout, and pay. Stock is limited, prices change, networks retry, and people double-click **Pay**.',
        'Every one of those is a way to lose money or anger customers. The design is about making each one boring.',
      ],
      metrics: { price: '—', double: '—', oversell: '—' },
      scene: { nodes: { ...base, stripe }, links: [...links, link('api', 'stripe')], flows: [flow(['web', 'api', 'mongo'], { kind: 'data', label: ['add to cart', 'save'], every: 4 })] },
    },
    {
      short: 'Guest cart',
      beat: 'technique',
      title: 'Guest carts, merged on login',
      body: [
        'Guests’ carts live in the browser (`localStorage`) — no account needed to start shopping. After login, the browser sends that cart to the server, which **merges** it with any cart saved from a previous visit and stores the result in a `carts` document.',
        'From then on the server cart is the source of truth, so it follows the user across devices.',
      ],
      metrics: { price: '—', double: '—', oversell: '—' },
      scene: {
        nodes: { ...base, local: { ...local, state: 'active' }, cart: cartDoc([['userId', 'ObjectId(…)'], ['items', '[ lamp ×1, mug ×2 ]', true]]) },
        links: [...links, link('web', 'local', { style: 'dashed', arrow: false }), link('api', 'cart', { style: 'dashed' })],
        flows: [flow(['local', 'web', 'api'], { kind: 'data', label: ['guest cart', 'POST /cart/merge'], every: 4.4 }), flow(['api', 'cart'], { kind: 'data', label: 'merged', every: 4.4, offset: 2 })],
      },
    },
    {
      short: 'Server prices',
      beat: 'technique',
      title: 'The client sends ids and quantities — never prices',
      body: [
        'The cart stores only `productId` and `quantity`. At checkout the **server** looks up current prices, applies discounts, and computes the total. Anything price-like coming from the browser is ignored.',
        'Otherwise anyone can open DevTools, change `price: 40` to `price: 0.01`, and buy a lamp for a cent.',
      ],
      check: {
        q: 'The checkout request includes `{ productId, quantity, price }`. What should the server do with `price`?',
        options: ['Trust it — the client showed it to the user', 'Ignore it and look up the current price itself', 'Average it with the database price', 'Reject orders where it differs by more than 10%'],
        answer: 1,
        explain: 'The client is controlled by the user. Prices, discounts and totals are always computed on the server from your own data.',
      },
      code: {
        file: 'checkout.js',
        lang: 'js',
        code: `const products = await Product.find({ _id: { $in: cart.items.map((i) => i.productId) } });
const total = cart.items.reduce((sum, i) =>
  sum + products.find((p) => p._id.equals(i.productId)).price * i.quantity, 0);
// req.body.price is never read`,
        hl: [1, 2, 3],
      },
      metrics: { price: 'server', double: '—', oversell: '—' },
      scene: {
        nodes: patch(base, { web: { screen: cartScreen([['Desk lamp', '$0.01 (edited!)'], ['Mug × 2', '$24']], '$24.01') }, api: { state: 'ok', badge: { text: 'recomputes: $64', tone: 'ok' } } }),
        links,
        flows: [flow(['web', 'api', 'mongo'], { kind: 'err', label: ['price: 0.01', 'find prices'], back: 'res', backLabel: ['$40', 'total $64'], every: 4.4 })],
      },
    },
    {
      short: 'Stock',
      beat: 'technique',
      title: 'Reserve stock atomically',
      body: [
        'Two shoppers, one lamp left — the transactions lesson in real life. Decrement stock with a **conditional** update (`stock ≥ quantity`), and create the pending order in the same transaction. If any item is out of stock, nothing is reserved.',
        'Reserve when payment starts, not when items enter the cart, or one person’s abandoned cart blocks everyone.',
      ],
      code: {
        file: 'checkout.js',
        lang: 'js',
        code: `await session.withTransaction(async () => {
  for (const i of cart.items) {
    const ok = await Product.updateOne(
      { _id: i.productId, stock: { $gte: i.quantity } },
      { $inc: { stock: -i.quantity } }, { session });
    if (!ok.modifiedCount) throw new AppError(409, 'OUT_OF_STOCK');
  }
  await Order.create([{ userId, items, total, status: 'pending' }], { session });
});`,
        hl: [4, 6, 8],
      },
      metrics: { price: 'server', double: '—', oversell: 'no' },
      scene: { nodes: patch(base, { mongo: { state: 'active', badge: { text: 'transaction', tone: 'ok' } } }), links, flows: [flow(['web', 'api', 'mongo'], { kind: 'data', label: ['checkout', 'reserve + order'], back: 'res', backLabel: ['ok', 'pending order'], every: 4.4 })] },
    },
    {
      short: 'Idempotency',
      beat: 'technique',
      title: 'Idempotent orders: two clicks, one order',
      body: [
        'Shoppers double-click, phones retry on flaky networks. A plain `POST /orders` would create **two** orders. The client generates an [[idempotency-key|idempotency key]] when checkout starts and sends it with every attempt; the server stores it with a **unique index** and returns the existing order for a repeat key.',
        'Payment providers support the same idea, so retries never charge twice.',
      ],
      code: {
        file: 'orders.js',
        lang: 'js',
        code: `// Order schema: idempotencyKey: { type: String, unique: true }
const existing = await Order.findOne({ idempotencyKey: req.get('Idempotency-Key') });
if (existing) return res.status(200).json(existing);   // a retry: same answer, no new order`,
        hl: [2, 3],
      },
      metrics: { price: 'server', double: 'no', oversell: 'no' },
      scene: {
        nodes: patch(base, { api: { badge: { text: 'key k-7f2 seen → same order', tone: 'ok' } } }),
        links,
        flows: [
          flow(['web', 'api', 'mongo'], { kind: 'data', label: ['POST /orders (k-7f2)', 'create'], back: 'res', backLabel: ['order #881', '201'], every: 5 }),
          flow(['web', 'api'], { kind: 'data', label: 'retry (k-7f2)', back: 'res', backLabel: '200 #881', every: 5, offset: 0.4 }),
        ],
      },
    },
    {
      short: 'Payment',
      beat: 'technique',
      title: 'Payments: a provider, and a webhook you verify',
      body: [
        'Never handle card numbers yourself. Redirect to the provider’s hosted checkout with the pending order’s id and server-computed total. When payment succeeds, the provider calls your [[webhook]] — server to server.',
        'Mark the order **paid only in the webhook**, after verifying its signature. A browser redirect saying “success” can be faked; the signed webhook can’t.',
      ],
      code: {
        file: 'webhooks.js',
        lang: 'js',
        code: `app.post('/webhooks/payments', express.raw({ type: 'application/json' }), async (req, res) => {
  const event = provider.verify(req.body, req.get('Signature'), process.env.WEBHOOK_SECRET);
  if (event.type === 'payment.succeeded') {
    await Order.updateOne({ _id: event.orderId, status: 'pending' }, { $set: { status: 'paid' } });
  }
  res.sendStatus(200);
});`,
        hl: [2, 4],
      },
      metrics: { price: 'server', double: 'no', oversell: 'no' },
      scene: {
        nodes: { ...base, stripe: { ...stripe, state: 'active' } },
        links: [...links, link('web', 'stripe', { route: 'over', bend: 40, label: 'redirect to pay' }), link('stripe', 'api', { label: 'webhook (signed)' })],
        flows: [
          flow(['web', 'stripe'], { kind: 'auth', label: 'pay $64', every: 6 }),
          flow(['stripe', 'api', 'mongo'], { kind: 'event', label: ['payment.succeeded', 'status → paid'], every: 6, offset: 2.2 }),
        ],
      },
    },
    {
      short: 'Abandoned',
      beat: 'tradeoff',
      title: 'Abandoned checkouts must release stock',
      body: [
        'Reserved stock for a payment that never completes would be stuck forever. Give pending orders an expiry: a scheduled job (or a TTL-driven check) cancels orders still unpaid after 30 minutes and returns their stock in a transaction.',
        'Handle the race too: a payment webhook arriving after cancellation must be refunded or re-checked, not silently marked paid.',
      ],
      metrics: { price: 'server', double: 'no', oversell: 'no' },
      scene: {
        nodes: { ...patch(base, { web: { screen: [{ t: 'h', text: 'Checkout' }, { t: 'text', text: '(tab closed…)' }], state: 'dim' } }), job: box(820, 470, 'expire job', { sub: 'every minute', icon: 'clock', tone: 'warn', w: 190 }) },
        links: [...links, link('job', 'mongo')],
        flows: [flow(['job', 'mongo'], { kind: 'data', label: 'cancel unpaid > 30 min · stock += qty', every: 4 })],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Carts and checkout, safely',
      body: [
        '{client:Guest cart} in the browser, merged into a {data:server cart} on login. The client sends ids and quantities; the {server:server} computes every price.',
        'Reserve stock with conditional updates in a transaction; make order creation idempotent; mark orders paid only from a verified {net:webhook}; expire abandoned reservations.',
      ],
      metrics: { price: 'server', double: 'no', oversell: 'no' },
      scene: {
        nodes: { ...base, stripe },
        links: [...links, link('web', 'stripe', { route: 'over', bend: 40 }), link('stripe', 'api')],
        flows: [flow(['web', 'api', 'mongo'], { kind: 'data', label: ['checkout', 'reserve'], every: 6 }), flow(['stripe', 'api', 'mongo'], { kind: 'event', label: ['webhook', 'paid'], every: 6, offset: 3 })],
      },
    },
  ],
});
