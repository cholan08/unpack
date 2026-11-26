/**
 * Chapter: Take money (payments).
 * Follows the model chapter, written/identity.ts.
 */
import type { ChapterWriting } from '../types';

const writing: ChapterWriting = {
  hook: {
    story: [
      'You tap Pay. Two seconds later: “Payment successful.” In between, your card or UPI details travelled to a payment company, through a card network to your bank, which checked your balance and perhaps asked you to approve — and the shop learned the result through a message it had to verify.',
      'Taking money is where small mistakes become expensive: a price changed in the browser, a double charge, an order marked paid that wasn’t, card numbers sitting in a log. The good news: payment providers have solved the hard parts. Your job is to use them correctly.',
      'What really happens in the two seconds after you tap Pay?',
    ],
    predict: {
      q: 'Where should the total a customer pays be worked out?',
      options: [
        'In the browser, so it updates instantly',
        'On your server, from your own prices — the browser only sends items and quantities',
        'By the payment provider, from whatever you send it',
        'It doesn’t matter, as long as the connection is HTTPS',
      ],
      answer: 1,
      reveal:
        'On your server. HTTPS protects data on the way, but the person sending it can still change it — `total: 1` is one edit in DevTools. Your server looks up each price, applies only discounts it has checked, and tells the provider the amount. The browser may *display* a total; it never *decides* one.',
    },
  },

  idea: {
    lede: 'A shop, a subscription app, a booking deposit — taking money always comes down to five jobs.',
    jobs: [
      {
        title: 'Never touch card details',
        text: 'A payment provider collects card, UPI or wallet details on its own page or form. Your server never sees them.',
      },
      {
        title: 'Decide the amount yourself',
        text: 'Prices from your database, discounts you have checked, tax and shipping you have calculated — and a pending order saved first.',
      },
      {
        title: 'Hear the result from the provider',
        text: 'A signed [[webhook]] tells your server that a payment succeeded or failed. The browser’s redirect is a courtesy, not proof.',
      },
      {
        title: 'Never charge twice',
        text: '[[idempotency-key|Idempotency keys]] on every create call, and handlers that change an order only from the state they expect.',
      },
      {
        title: 'Handle life after the sale',
        text: 'Refunds, disputes, subscriptions and failed renewals — all states, all moved by verified webhooks.',
      },
    ],
    picture:
      'A shop with a sealed till run by a security company. You tell the till how much (the amount); the customer pays at the till, never into your hand (no card details); the till phones you to confirm (the webhook) — you don’t take the customer’s word for it. Pressing the button twice rings up once (idempotency). And returns, chargebacks and monthly memberships all go through the same till.',
  },

  lessonNotes: {
    payments: 'All five jobs: hosted checkout, prices from your server, why the browser can’t say “paid”, signed webhooks, idempotency, and life after the sale.',
    'design-cart': 'The same ideas inside a whole shop: guest carts, stock reserved atomically, idempotent orders and payment webhooks.',
  },

  options: {
    lede: 'Providers differ by country, payment methods and how much they handle for you. Choose by where your customers are and what you sell.',
    items: [
      {
        name: 'Hosted checkout',
        what: 'Redirect to the provider’s ready-made, secure payment page.',
        pickWhen: 'Most products — the fastest to build and the least to secure.',
        cost: 'Less control over the look, and a short trip away from your site.',
        examples: 'Stripe Checkout, Razorpay Checkout, PayPal Checkout',
      },
      {
        name: 'Embedded payment forms',
        what: 'The provider’s secure fields inside your page, sending details straight to the provider.',
        pickWhen: 'You want checkout to feel like part of your app.',
        cost: 'More frontend work — though you still never touch card numbers.',
        examples: 'Stripe Payment Element, Razorpay’s embedded checkout, Adyen Drop-in',
      },
      {
        name: 'Merchant of record',
        what: 'The provider sells on your behalf and handles sales tax, VAT and invoices worldwide.',
        pickWhen: 'A small team selling software or digital goods internationally.',
        cost: 'Higher fees, and less control over the customer relationship.',
        examples: 'Paddle, Lemon Squeezy',
      },
      {
        name: 'Subscriptions and billing',
        what: 'The provider charges on a schedule, retries failed cards, and tells you by webhook.',
        pickWhen: 'Monthly or yearly plans.',
        cost: 'Plan changes, partial periods and failed-payment states to model.',
        examples: 'Stripe Billing, Razorpay Subscriptions, Chargebee',
      },
      {
        name: 'Local payment methods',
        what: 'UPI, wallets, bank transfers and “pay later” — offered through your provider.',
        pickWhen: 'Always check what your customers actually use: in India, UPI dominates.',
        cost: 'Each method confirms on its own timing, so pending states must be handled.',
        examples: 'UPI and wallets through Razorpay, Stripe or Cashfree; iDEAL, Pix or SEPA elsewhere',
      },
    ],
    choose: [
      { when: 'Your first paid product', pick: 'Hosted checkout.' },
      { when: 'Checkout must feel native to your app', pick: 'Embedded payment forms.' },
      { when: 'A small team selling digital products worldwide', pick: 'A merchant of record.' },
      { when: 'Monthly plans', pick: 'The provider’s subscription billing, driven by webhooks.' },
      { when: 'Customers in India', pick: 'A provider with strong UPI support.' },
    ],
  },

  modern: {
    lede: 'AI can integrate a payment provider in minutes, and it usually gets the happy path right. Money is lost on the other paths — the faked success page, the duplicate charge, the unverified webhook, the price from the browser. Every one of them is on this chapter’s checklist, and every one deserves a test.',
    defaults: [
      'Card details only ever go to the provider, through hosted or embedded checkout — never to your server or logs.',
      'Prices and totals worked out on the server; orders saved as pending before payment starts.',
      'Verified webhooks are the only proof of payment, and handlers are safe to receive twice.',
      'An idempotency key on every create call.',
      'Test mode and test cards for success, decline, extra authentication and refunds before going live.',
      'Secret keys on the server only, restricted, and rotated if they ever leak.',
    ],
    aiGood: [
      'Wiring the provider’s SDK, checkout and webhook routes',
      'Modelling order and subscription states',
      'Writing tests for declines, duplicates and webhooks',
      'Explaining provider error codes',
      'Building the admin refund flow',
    ],
    aiWrong: [
      { mistake: 'Takes the amount from the request body.', fix: 'Work it out on the server, from your own prices.' },
      { mistake: 'Marks orders paid on the success page.', fix: 'Only a verified webhook marks an order paid.' },
      { mistake: 'Parses the webhook with `express.json()` before verifying it.', fix: 'Signature checks need the raw body — use `express.raw()` on that route.' },
      { mistake: 'Leaves out idempotency keys.', fix: 'One per create call, built from your order id.' },
      { mistake: 'Logs whole webhook payloads or customer details.', fix: 'Log event ids and types only.' },
      { mistake: 'Uses live keys while developing.', fix: 'Test keys until launch, and separate keys per environment.' },
    ],
  },

  build: {
    title: 'A paid plan for your app',
    brief: 'Add a paid “Pro” plan to your bookmarks app with the provider’s subscription billing: hosted checkout, access granted only by verified webhooks, safe to receive twice — and a clean experience when a renewal fails.',
    byHand: [
      { title: 'Test mode', text: 'Create a provider account in test mode, add a product with a monthly price, and keep the keys in `.env`.' },
      { title: 'Start checkout', text: '`POST /api/billing/checkout` creates a subscription checkout session for the logged-in user, with an idempotency key.', see: ['payments', 3] },
      { title: 'Nothing from the browser', text: 'The client sends only the plan’s name; the server picks the price.', see: ['payments', 4] },
      { title: 'The webhook', text: '`/webhooks/billing` verifies the signature on the raw body, then grants Pro when the subscription is paid.', see: ['payments', 6] },
      { title: 'Safe twice', text: 'Store processed event ids; a repeated event changes nothing.', see: ['payments', 6] },
      { title: 'When renewals fail', text: 'On a failed-payment webhook, show a banner and keep access for a grace period; remove it when the subscription is cancelled.', see: ['payments', 8] },
      { title: 'Test every path', text: 'Test cards for success, decline and extra authentication; replay a webhook; cancel and refund from the dashboard.' },
    ],
    withAI: {
      lede: 'Let your AI assistant wire the billing — with the money rules spelled out, and tests for the paths that lose money.',
      prompt: `Add a paid "Pro" plan to my Express + Mongoose + React app using Stripe Billing (or Razorpay Subscriptions — tell me which differences matter).

Server
- POST /api/billing/checkout { plan }: requireAuth; look up the price id on the server from the plan name; create a subscription Checkout Session with the customer's email and metadata.userId; use an idempotency key derived from userId + plan + a client-generated attempt id.
- POST /webhooks/billing with express.raw: verify the signature; handle checkout.session.completed, invoice.paid, invoice.payment_failed and customer.subscription.deleted.
- Store processed event ids (unique index) so repeats are ignored.
- The user has plan: 'pro' | 'free', proUntil and a paymentProblem flag — changed ONLY by webhooks.

Client
- A pricing page with an Upgrade button (no prices sent to the server), a banner when paymentProblem is true, and a link to the provider's customer portal.

Tests
- Bad webhook signature → 400; duplicate event → no change; failed renewal → banner, with access until proUntil.

Use test-mode keys from environment variables only.`,
    },
    verify: [
      'Upgrading with a test card grants Pro — but only once the webhook arrives.',
      'Opening the success URL without paying grants nothing.',
      'A webhook with a wrong signature gets **400**.',
      'Replaying the same webhook changes nothing.',
      'A declined test card leaves you on Free, with a clear message.',
      'A failed renewal shows the banner; cancelling removes Pro at the end of the period.',
      'No card number or secret key appears in your logs, database or browser bundle.',
    ],
  },

  breakIt: [
    {
      title: 'The price, from the browser',
      lang: 'js',
      code: `const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  line_items: [{ price_data: { currency: 'inr', unit_amount: req.body.amount, product_data: { name: 'Lamp' } }, quantity: 1 }],
  success_url, cancel_url,
});`,
      err: [3],
      answer:
        'The amount comes straight from the request, so anyone can buy the lamp for ₹1. Look the product up on the server and use its stored price — or a price id created in the provider’s dashboard.',
      see: ['payments', 4],
    },
    {
      title: 'Paid on arrival',
      lang: 'js',
      code: `app.get('/thanks', async (req, res) => {
  await Order.updateOne({ _id: req.query.order }, { status: 'paid' });
  res.render('thanks');
});`,
      err: [2],
      answer:
        'Anyone can open `/thanks?order=…` without paying, and customers who close the tab never get here at all. Only a verified webhook marks an order paid; the thank-you page just shows the current status.',
      see: ['payments', 5],
    },
    {
      title: 'Verify after parsing',
      lang: 'js',
      code: `app.use(express.json());
app.post('/webhooks/stripe', (req, res) => {
  const event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], secret);
  // …
});`,
      err: [1, 3],
      answer:
        'The signature is computed over the exact raw bytes. Once `express.json()` has parsed the body, verification fails — and the tempting “fix” is to skip it. Use `express.raw({ type: \'application/json\' })` on the webhook route, ahead of any JSON parser.',
      see: ['payments', 6],
    },
    {
      title: 'The double click',
      lang: 'js',
      code: `payButton.onclick = () => fetch('/api/checkout', { method: 'POST', body: cartJson });`,
      err: [1],
      answer:
        'Two clicks send two requests, and without an idempotency key the server may create two orders and two payments. Disable the button while waiting — and, what actually protects you, send an idempotency key that the server passes on to the provider.',
      see: ['payments', 7],
    },
  ],

  explain: [
    'Why must the amount be worked out on the server, even over HTTPS?',
    'Why is the webhook — not the success page — the proof of payment?',
    'What does an idempotency key protect against?',
  ],

  deeper: [
    {
      q: 'What is PCI DSS?',
      a: 'The card industry’s security standard for anyone who handles card data. Hosted checkout or embedded fields keep card data off your systems, and keep your compliance work small.',
    },
    {
      q: 'What is 3-D Secure?',
      a: 'An extra check by the card’s bank — a code, or approval in the bank’s app — required in many countries. The provider handles it inside checkout; your code just waits for the final result.',
    },
    {
      q: 'What is a chargeback?',
      a: 'A customer disputes a charge with their bank, which takes the money back while you respond with evidence. Clear descriptions, receipts and easy refunds prevent most of them.',
    },
    {
      q: 'How do refunds work?',
      a: 'You request one through the provider’s API or dashboard; it reaches the customer within days. Update your order when the refund webhook confirms it.',
    },
    {
      q: 'Why do some UPI payments stay pending?',
      a: 'Some methods confirm asynchronously: the customer approves in another app, and the result arrives seconds or minutes later. Keep the order pending, and let the webhook settle it.',
    },
    {
      q: 'What is a merchant of record?',
      a: 'The company that legally sells to the customer. With a provider such as Paddle in that role, they handle sales tax and invoices around the world, and you receive payouts.',
    },
  ],

  next: [
    { q: 'How do you send the receipt without slowing checkout?', chapter: 'notify' },
    { q: 'How do you do the slow parts after payment?', chapter: 'background' },
    { q: 'How would you design a whole shop around this?', chapter: 'design-studies' },
    { q: 'How do you protect the rest of the app?', chapter: 'protect' },
  ],
};

export default writing;
