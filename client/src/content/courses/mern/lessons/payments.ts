import { box, browser, db, defineLesson, flow, link, patch } from '@/content/dsl';
import type { LinkSpec, NodeSpec, ScreenLine } from '@/engine/types';

/* ---------- layout: the shop page (left) → your server and orders (middle) → the provider and the bank (right) ---------- */
const cart: ScreenLine[] = [{ t: 'h', text: 'Checkout' }, { t: 'item', text: 'Lamp × 1 · ₹2,499' }, { t: 'btn', text: 'Pay' }];
const cardForm: ScreenLine[] = [{ t: 'h', text: 'Card details' }, { t: 'input', text: '4242 4242 4242 4242' }, { t: 'btn', text: 'Pay' }];
const hosted: ScreenLine[] = [{ t: 'h', text: 'Secure checkout' }, { t: 'input', text: 'Card · UPI · Wallet' }, { t: 'btn', text: 'Pay ₹2,499' }];
const thanks: ScreenLine[] = [{ t: 'h', text: 'Thank you!' }, { t: 'ok', text: 'Order #1042 paid' }];

const web = browser(150, 300, { url: 'myshop.app/checkout', screen: cart, w: 240, h: 190 });
const api = box(470, 300, 'Your server', { sub: 'orders · prices', icon: 'server', tone: 'server', w: 210 });
const prov = box(820, 300, 'Payment provider', { sub: 'Stripe · Razorpay · PayPal', icon: 'lock', tone: 'auth', w: 280 });
const bank = box(820, 490, 'Card network & bank', { sub: 'approve or decline', icon: 'shield', tone: 'neutral', w: 280 });
const orders = db(470, 490, 'Orders', { items: ['orders'], tone: 'data' });

const all: Record<string, NodeSpec> = { web, api, prov, bank, orders };
const allLinks: LinkSpec[] = [link('web', 'api'), link('api', 'prov'), link('prov', 'bank'), link('api', 'orders'), link('web', 'prov', { route: 'over', style: 'dashed' })];

const sessionCode = `app.post('/api/checkout', requireAuth, async (req, res) => {
  const order = await createPendingOrder(req.user.id, req.body.items); // prices from YOUR database

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: order.items.map((i) => ({ price: i.stripePriceId, quantity: i.qty })),
    success_url: \`https://myshop.app/thanks?order=\${order.id}\`,
    cancel_url: 'https://myshop.app/cart',
    metadata: { orderId: order.id },
  }, { idempotencyKey: \`checkout-\${order.id}\` });

  res.json({ url: session.url }); // the browser goes to the provider's page
});`;

const webhookCode = `app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return res.sendStatus(400);                         // not really from Stripe
  }
  if (event.type === 'checkout.session.completed') {
    const { orderId } = event.data.object.metadata;
    await Order.updateOne({ _id: orderId, status: 'pending' }, { status: 'paid' }); // safe twice
  }
  res.sendStatus(200);
});`;

export default defineLesson({
  metrics: [
    { id: 'cardsAway', label: 'Card numbers kept off your server' },
    { id: 'truth', label: '“Paid” decided by' },
    { id: 'charges', label: 'Charges for one order', better: 'lower' },
  ],
  legend: { auth: 'payment / card data', event: 'webhook' },
  goals: [
    { text: 'Why you never handle card numbers yourself', step: 2 },
    { text: 'Hosted checkout with prices from your server', step: 3 },
    { text: 'Why the browser can’t say “paid”', step: 5 },
    { text: 'Verified webhooks', step: 6 },
    { text: 'Never charging twice', step: 7 },
  ],
  steps: [
    {
      short: 'Tap Pay',
      beat: 'setup',
      title: 'What happens after you tap Pay',
      body: [
        'Behind a two-second payment are four parties: the **customer**, **your server** (which knows the order and the price), a **payment provider** (which takes the card, UPI or wallet details), and the **card network and bank** (which approve or decline).',
        'Your job is everything except touching the money details: decide the amount, start the payment, and find out — reliably — whether it succeeded.',
      ],
      metrics: { cardsAway: 'yes', truth: '—', charges: 1 },
      scene: {
        nodes: all,
        links: allLinks,
        flows: [
          flow(['web', 'api', 'prov', 'bank'], { kind: 'req', label: ['Pay', 'start payment', 'authorise'], back: 'res', backLabel: ['paid', 'approved', 'approved'], every: 6 }),
        ],
      },
    },
    {
      short: 'Card numbers',
      beat: 'problem',
      title: 'Card numbers on your server: don’t',
      body: [
        'Build your own card form, post the number to your API and pass it on — and every server, log and backup that sees it becomes a target. Handling card data brings you under strict industry rules (**PCI DSS**) with audits, and one leak can end a small business.',
        'There is no reason to take that risk: providers will collect the card details on their own page or form, and your server never sees them.',
      ],
      metrics: { cardsAway: 'no', truth: '—', charges: 1 },
      scene: {
        nodes: {
          web: { ...web, screen: cardForm, state: 'error' },
          api: { ...api, state: 'error', badge: { text: 'card in logs & backups', tone: 'danger' } },
          prov,
          orders,
        },
        links: [link('web', 'api', { state: 'error' }), link('api', 'prov'), link('api', 'orders')],
        flows: [flow(['web', 'api', 'prov'], { kind: 'auth', label: ['4242 4242…', 'card number'], every: 4.6 })],
      },
    },
    {
      short: 'Hosted checkout',
      beat: 'solution',
      title: 'Let the provider take the card',
      body: [
        'Your server creates a **checkout session**: which items, how many, where to send the customer afterwards. The provider replies with a URL, and the browser goes to the provider’s own secure page (or an embedded form that talks only to the provider). Card, UPI and wallet details go straight to them.',
        'The amount comes from **your database**, never from the browser — the client only sends product ids and quantities.',
      ],
      code: { file: 'routes/checkout.js', lang: 'js', code: sessionCode, hl: [2, 6, 10] },
      changes: ['- Your own card form', '+ A checkout session on the provider', '+ Prices looked up on the server'],
      metrics: { cardsAway: 'yes', truth: '—', charges: 1 },
      scene: {
        nodes: patch(all, { web: { screen: hosted, url: 'checkout.provider.com' }, prov: { state: 'active' } }),
        links: allLinks,
        flows: [
          flow(['web', 'api', 'prov'], { kind: 'req', label: ['items + qty', 'create session'], back: 'res', backLabel: ['redirect', 'session URL'], every: 6 }),
          flow(['web', 'prov'], { kind: 'auth', label: 'card · UPI', every: 6, offset: 3 }),
        ],
      },
    },
    {
      short: 'Your prices',
      beat: 'technique',
      title: 'The amount is decided on the server',
      body: [
        'If the browser sends `total: 2499`, someone will send `total: 1`. Your server looks up each product’s price, applies discounts it has checked itself, works out tax and shipping, and stores the order as **pending** before the payment starts.',
        'Then the order in your database and the payment at the provider always agree on what was bought and what it cost.',
      ],
      code: { file: 'orders.js', lang: 'js', code: `async function createPendingOrder(userId, items) {
  const products = await Product.find({ _id: { $in: items.map((i) => i.id) } });
  const lines = items.map((i) => {
    const p = products.find((x) => x.id === i.id);
    return { product: p.id, qty: i.qty, price: p.price, stripePriceId: p.stripePriceId };
  });
  const total = lines.reduce((sum, l) => sum + l.price * l.qty, 0); // in paise / cents
  return Order.create({ user: userId, items: lines, total, status: 'pending' });
}`, hl: [5, 7] },
      metrics: { cardsAway: 'yes', truth: '—', charges: 1 },
      scene: {
        nodes: patch(all, { api: { state: 'active', badge: { text: 'prices from DB', tone: 'ok' } }, orders: { state: 'active' } }),
        links: allLinks,
        flows: [flow(['api', 'orders'], { kind: 'data', label: 'order #1042 · pending', every: 4.6 })],
      },
    },
    {
      short: 'Paid?',
      beat: 'problem',
      title: 'The browser says “paid” — believe it?',
      body: [
        'After paying, the provider sends the customer back to your `/thanks` page. It is tempting to mark the order paid when that page loads. But anyone can open `/thanks?order=1042` without paying — and a real customer may close the tab before it loads.',
        'The browser is the least trustworthy party in the payment. The truth has to come from the provider, directly to your server.',
      ],
      check: {
        q: 'After paying, the customer closes the tab before your “thank you” page loads. How does your shop find out the order was paid?',
        options: ['It can’t — the order stays unpaid', 'The provider calls your server with a webhook', 'The bank emails you', 'The browser retries later'],
        answer: 1,
        explain: 'Payment providers send a webhook to your server when a payment succeeds — whatever the browser does. That webhook, verified, is what marks the order paid.',
      },
      metrics: { cardsAway: 'yes', truth: 'the browser', charges: 1 },
      scene: {
        nodes: patch(all, { web: { screen: thanks, state: 'error', badge: { text: 'anyone can open /thanks', tone: 'danger' } } }),
        links: allLinks,
        flows: [flow(['web', 'api', 'orders'], { kind: 'err', label: ['GET /thanks?order=1042', 'mark paid?'], every: 4.6 })],
      },
    },
    {
      short: 'Webhook',
      beat: 'solution',
      title: 'The provider tells your server — and you check it',
      body: [
        'When a payment succeeds, the provider sends a [[webhook]] to your server. Before believing it, verify its **signature** with your webhook secret — on the raw request body — so nobody can fake one. Then mark the order paid, start fulfilment, and answer `200` quickly.',
        'Providers retry webhooks until you answer, so the same event can arrive twice: update only orders that are still *pending*, and the second delivery changes nothing.',
      ],
      code: { file: 'routes/webhooks.js', lang: 'js', code: webhookCode, hl: [4, 10] },
      changes: ['- “Paid” decided by the browser', '+ A signed webhook from the provider', '+ An update that is safe to receive twice'],
      metrics: { cardsAway: 'yes', truth: 'webhook', charges: 1 },
      scene: {
        nodes: patch(all, { web: { screen: thanks }, orders: { state: 'ok' }, prov: { state: 'active' } }),
        links: allLinks,
        flows: [
          flow(['prov', 'api'], { kind: 'event', label: 'signed: payment succeeded', every: 5 }),
          flow(['api', 'orders'], { kind: 'data', label: 'pending → paid', every: 5, offset: 1.2 }),
        ],
      },
    },
    {
      short: 'Never twice',
      beat: 'technique',
      title: 'Two clicks, one charge',
      body: [
        'A slow network, an impatient double click, a retry after a timeout — and your server asks the provider to charge again. Send every create request with an [[idempotency-key|idempotency key]] (here, built from the order id): the provider recognises the repeat and returns the first result instead of charging twice.',
        'On your side, disable the Pay button after the first click — but never rely on that alone.',
      ],
      metrics: { cardsAway: 'yes', truth: 'webhook', charges: 1 },
      scene: {
        nodes: patch(all, { prov: { badge: { text: 'same key → same session', tone: 'ok' } } }),
        links: allLinks,
        flows: [
          flow(['web', 'api', 'prov'], { kind: 'req', label: ['Pay', 'key: checkout-1042'], back: 'res', backLabel: ['redirect', 'session'], every: 4.4 }),
          flow(['web', 'api', 'prov'], { kind: 'req', label: ['Pay (again)', 'key: checkout-1042'], back: 'res', backLabel: ['same', 'same session'], every: 4.4, offset: 1.4 }),
        ],
      },
    },
    {
      short: 'After the sale',
      beat: 'technique',
      title: 'Refunds, subscriptions and disputes',
      body: [
        'A payment has a life after checkout: **refunds** (started from your admin, confirmed by webhook), **disputes** (a customer challenges a charge with their bank), and **subscriptions**, where the provider charges every month and tells you by webhook when a renewal succeeds or fails.',
        'Model the order as a set of states — pending, paid, refunded, disputed — and let verified webhooks move it between them. Let the provider handle the billing calendar and retries; your app grants or removes access when the state changes.',
      ],
      callout: { kind: 'tip', text: 'Use the provider’s test mode and test cards for every flow — success, decline, 3-D Secure, refund — before you take real money.' },
      metrics: { cardsAway: 'yes', truth: 'webhook', charges: 1 },
      scene: {
        nodes: patch(all, { orders: { items: ['pending', 'paid', 'refunded'], state: 'active' } }),
        links: allLinks,
        flows: [
          flow(['prov', 'api'], { kind: 'event', label: 'renewal failed', every: 5 }),
          flow(['api', 'orders'], { kind: 'data', label: 'access paused', every: 5, offset: 1.2 }),
        ],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Taking money, safely',
      body: [
        '{auth:Card details} go only to the provider; {server:your server} decides the amount from its own prices and starts the payment with an {ok:idempotency key}.',
        '{warn:The browser} is never trusted to say “paid”; a {net:signed webhook} is, and handling it twice changes nothing. Refunds, disputes and subscriptions are just more states, moved by more webhooks.',
      ],
      metrics: { cardsAway: 'yes', truth: 'webhook', charges: 1 },
      scene: {
        nodes: patch(all, { web: { screen: thanks } }),
        links: allLinks,
        flows: [
          flow(['web', 'api', 'prov'], { kind: 'req', label: ['Pay', 'session'], back: 'res', backLabel: ['redirect', 'URL'], every: 6 }),
          flow(['prov', 'api'], { kind: 'event', label: 'webhook', every: 6, offset: 2.6 }),
          flow(['api', 'orders'], { kind: 'data', label: 'paid', every: 6, offset: 3.4 }),
        ],
      },
    },
  ],
});
