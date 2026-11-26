/**
 * Chapter: Design the system (Part III · The builder’s craft).
 * Follows the model chapter, written/identity.ts.
 */
import type { ChapterWriting } from '../types';

const writing: ChapterWriting = {
  hook: {
    story: [
      'Someone asks you to build a chat app. You could open your editor and start typing — and two weeks later discover that messages are stored in a way that makes “load older messages” impossible, and that the app only works on one server.',
      'Designing first doesn’t mean weeks of diagrams. It means an hour answering the right questions — who uses it, how much, what must never go wrong — and sketching where every piece of data lives and travels, before code makes those decisions for you by accident.',
      'Before you build a chat app, how would you sketch where every message goes?',
    ],
    predict: {
      q: 'You are designing a todo app. Which question should you answer first?',
      options: [
        'MongoDB or PostgreSQL?',
        'Which framework is most popular right now?',
        'Who uses it, what do they do most, and roughly how many of them are there?',
        'How many microservices it needs',
      ],
      answer: 2,
      reveal:
        'The requirements and the numbers. “Each person has up to a few thousand todos, reads far more than writes, and wants them on phone and laptop” decides almost everything else: the data model, the indexes, whether you need real-time, what it will cost. Tools come last — chosen to fit the problem, not the other way round.',
    },
  },

  idea: {
    lede: 'From a todo app to a payments platform, designing a system follows the same five steps.',
    jobs: [
      {
        title: 'Pin down the problem',
        text: 'Who uses it, what they do most, what must never go wrong — and rough numbers: users, requests per second, how much data.',
      },
      {
        title: 'Shape the data',
        text: 'The things involved and how they relate, modelled for how they are *read*: embed or reference, and an index for every frequent query.',
      },
      {
        title: 'Draw the flows',
        text: 'Every important request, end to end — browser, API, database, back. Where does it wait, what can fail, what must happen all-or-nothing?',
      },
      {
        title: 'Choose the building blocks',
        text: 'From Part II of this Manual — auth, files, real-time, search, queues — pick only the ones the requirements need.',
      },
      {
        title: 'Name the trade-offs',
        text: 'Every choice gives something up. Write down what you chose, what you rejected and why, so future you — and your AI — can follow it.',
      },
    ],
    picture:
      'An architect designing a house. First: who will live there, how many, what they do all day (requirements). Then the rooms and how they connect (the data model). Then how people move through it — front door to kitchen, kitchen to table (the flows). Then which systems it needs: plumbing, heating, maybe solar (building blocks). And notes on every compromise — a smaller garden for a bigger kitchen — before a single brick is laid (trade-offs).',
  },

  lessonNotes: {
    'request-journey': 'Step 3 for one click: the whole round trip through the stack, and where the 99 ms go.',
    'design-todo': 'The method on a small product: requirements and numbers, data model, API, security and shipping.',
    'design-cart': 'When money is involved: server-side prices, atomic stock, idempotent orders, payment webhooks.',
    'design-chat': 'When it is live: messages modelled for reading, history paging, presence, many servers.',
  },

  options: {
    lede: 'Architecture styles are answers to the size of your team and your problem, not badges. Start simple, and change shape when the requirements — not the fashion — say so.',
    items: [
      {
        name: 'A modular monolith',
        what: 'One deployable app, organised into clear modules (auth, bookmarks, billing) with boundaries between them.',
        pickWhen: 'Almost every new product — and most teams under a few dozen engineers.',
        cost: 'Discipline to keep the modules apart, and everything deploys together.',
        examples: 'One Express or Next.js app with a folder per feature',
        tools: ['express', 'nextjs'],
      },
      {
        name: 'Backend-as-a-service plus a frontend',
        what: 'A hosted database, auth and storage, with your frontend and a few functions on top.',
        pickWhen: 'Prototypes, and data-centred apps where speed of building matters most.',
        cost: 'Complex business rules get awkward, and you are bound to the platform.',
        examples: 'Supabase, Firebase',
      },
      {
        name: 'Separate services',
        what: 'A separate app per area, each with its own data, talking over APIs or events.',
        pickWhen: 'Several teams who must deploy independently, or parts with very different scaling needs.',
        cost: 'Network calls, failures spread across services, keeping data consistent — and much more to run.',
        examples: 'Services on containers or serverless, an API gateway, a message bus',
      },
      {
        name: 'Event-driven',
        what: 'Parts react to events (“order placed”) published to a queue or stream, instead of calling each other directly.',
        pickWhen: 'Workflows with many steps and side effects: orders, notifications, analytics.',
        cost: 'Harder to follow what happens, and events must be designed and versioned with care.',
        examples: 'RabbitMQ, Kafka, SQS — or webhooks between products',
        tools: ['rabbitmq', 'kafka'],
      },
      {
        name: 'Serverless and edge',
        what: 'The platform runs your functions per request, sometimes at the edge, close to users.',
        pickWhen: 'Spiky traffic, small teams, users spread around the world.',
        cost: 'Limits on run time and connections, and local development and debugging are harder.',
        examples: 'Vercel, Netlify and Cloudflare functions; AWS Lambda',
        tools: ['aws'],
      },
    ],
    choose: [
      { when: 'A new product, built by you or a small team', pick: 'A modular monolith on a PaaS, with a managed database.' },
      { when: 'A prototype to test an idea fast', pick: 'A backend-as-a-service and a frontend.' },
      { when: 'Many teams stepping on each other', pick: 'Split out services along team and data boundaries.' },
      { when: 'Long workflows with many side effects', pick: 'Events and a queue — inside your monolith first.' },
    ],
  },

  modern: {
    lede: 'AI can produce a polished architecture diagram in seconds — usually a fashionable one, with microservices, Kafka and Kubernetes, for an app with forty users. Its designs are only as good as the requirements you give it. Your job is the part it can’t guess: the real users, the real numbers, and the things that must never go wrong.',
    defaults: [
      'Write the requirements and rough numbers on one page before any code.',
      'Design the data model for your most frequent reads, and list the indexes.',
      'Sketch the main flows end to end, marking what must be atomic or safe to repeat.',
      'Start with a modular monolith; split only along real team or scaling boundaries.',
      'Record decisions in short notes (architecture decision records) next to the code.',
      'Use AI to challenge your design — “what breaks first at 100× the users?” — not to choose it.',
    ],
    aiGood: [
      'Turning your requirements into a first data model and API outline',
      'Listing failure cases and edge cases for a flow',
      'Drawing diagrams (Mermaid, Excalidraw) from a description',
      'Estimating load and storage from your numbers',
      'Arguing against your design to find its weak spots',
    ],
    aiWrong: [
      { mistake: 'Starts from tools (“use Kafka and Kubernetes”) instead of requirements.', fix: 'Give it the users, numbers and must-nevers first, and make it justify every component.' },
      { mistake: 'Designs microservices for a small app.', fix: 'A modular monolith until a measured reason appears.' },
      { mistake: 'Models the data like the screens look, without checking the reads.', fix: 'List your top queries and model for them.' },
      { mistake: 'Trusts prices, totals or permissions sent by the client.', fix: 'The server decides money and access.' },
      { mistake: 'Ignores what happens when a step fails halfway.', fix: 'For every multi-step flow: if step 2 fails, retry, undo, or make it safe to repeat?' },
      { mistake: 'Leaves no record of *why*.', fix: 'Write down the decision, the alternatives and the reason.' },
    ],
  },

  build: {
    title: 'Design before you build',
    brief: 'Design a small booking app for a hair salon — clients book a slot, the owner sees the day, nobody is ever double-booked. On paper first; then defend your design against your AI assistant.',
    byHand: [
      { title: 'Requirements and numbers', text: 'Who books, who manages, what happens most (looking at free slots), what must never happen (two bookings for one slot). Rough numbers: 3 stylists, 40 bookings a day.', see: ['design-todo', 1] },
      { title: 'The data model', text: 'Stylists, services, bookings: which fields, which references, which index answers “free slots on Tuesday”?', see: ['design-todo', 2] },
      { title: 'The API', text: 'The routes, their inputs and outputs, and their status codes.', see: ['design-todo', 3] },
      { title: 'The dangerous moment', text: 'Two clients pick the same slot in the same second. How does the database guarantee one wins? (A unique index on stylist + start time, or an atomic update.)', see: ['design-cart', 4] },
      { title: 'The building blocks', text: 'Which Part II chapters does it need — auth for the owner, notifications for reminders, perhaps payments for deposits — and which doesn’t it?' },
      { title: 'Draw it', text: 'One diagram: browser, API, database and any outside services, with the booking flow drawn across it.', see: ['request-journey', 1] },
      { title: 'Write the trade-offs', text: 'Five lines: what you chose, what you didn’t, and why.' },
    ],
    withAI: {
      lede: 'Now let your AI assistant review the design — as a reviewer, not a replacement. Tell it not to redesign from scratch, and not to add technology your numbers don’t need.',
      prompt: `I designed a booking app for a hair salon. Act as a senior engineer reviewing my design — don't redesign it from scratch.

[paste your requirements, numbers, data model, API list and diagram]

1. Ask me up to 5 questions about requirements I may have missed.
2. Find the 3 most likely ways it fails: double bookings, time zones, cancellations, no-shows, someone abusing the booking form.
3. For each, suggest the smallest change to my design that prevents it.
4. Tell me what I could remove, if anything is more than the requirements need.

Don't introduce new technologies unless my numbers require them.`,
    },
    verify: [
      'Your requirements fit on one page, with real numbers.',
      'Every screen’s main query is backed by an index in your model.',
      'You can show exactly how two simultaneous bookings for one slot end: one success, one clear error.',
      'Your API lists the status codes for every route.',
      'You can name the Part II chapters your app needs — and one it doesn’t.',
      'The AI review found something you missed, and you changed the design because of it.',
      'Your trade-offs note lets someone else understand your choices in two minutes.',
    ],
  },

  breakIt: [
    {
      title: 'The price is right?',
      lang: 'js',
      code: `app.post('/api/orders', requireAuth, async (req, res) => {
  const { items, total } = req.body; // total worked out in the browser
  const order = await Order.create({ user: req.user.id, items, total });
  res.status(201).json(order);
});`,
      err: [2],
      answer:
        'The browser decides how much it pays — anyone can send `total: 1`. The client sends only product ids and quantities; the server looks up the prices and works out the total itself.',
      see: ['design-cart', 3],
    },
    {
      title: 'Check, then book',
      lang: 'js',
      code: `const taken = await Booking.exists({ stylist, start });
if (taken) return res.status(409).json({ error: 'Slot taken' });
await Booking.create({ stylist, start, client: req.user.id });`,
      err: [1, 3],
      answer:
        'Two requests can both see the slot as free, and both create a booking. Let the database decide: a unique index on `{ stylist: 1, start: 1 }` makes the second `create` fail with a duplicate-key error, which you turn into a `409`.',
      see: ['design-cart', 4],
    },
    {
      title: 'A design that starts with tools',
      lang: 'text',
      code: `Architecture: React → API gateway → 6 microservices (users, bookings,
stylists, payments, notifications, search) → Kafka → 6 databases.
Expected users: one salon.`,
      err: [1, 3],
      answer:
        'Six services, a message bus and six databases for one salon: dozens of moving parts, each of which can fail, for a problem one small app solves. Start from the requirements — a modular monolith with one database — and split only when real numbers demand it.',
    },
    {
      title: 'Half done',
      lang: 'js',
      code: `await payments.charge(order.total, card);
await Order.updateOne({ _id: order.id }, { status: 'paid' });
await Stock.decrement(order.items);`,
      err: [1, 2, 3],
      answer:
        'If the server crashes after the charge but before the order is marked paid, the customer pays and gets nothing — and a retry may charge again. Design the failure cases: reserve stock first, charge with an idempotency key, confirm through the provider’s webhook, and make every step safe to repeat.',
      see: ['design-cart', 5],
    },
  ],

  explain: [
    'Why do requirements and numbers come before choosing tools?',
    'How do you design data for the way it is read?',
    'Why start with a monolith — and what would make you split it?',
  ],

  deeper: [
    {
      q: 'What is an architecture decision record?',
      a: 'A short note — the context, the decision, the alternatives, the consequences — stored with the code. It answers “why is it like this?” long after the people who decided have forgotten.',
    },
    {
      q: 'What is back-of-the-envelope estimation?',
      a: 'Quick sums with round numbers: 10,000 users × 20 requests a day is about 2–3 requests per second on average. It tells you whether you have a scaling problem at all — usually you don’t.',
    },
    {
      q: 'What is domain-driven design?',
      a: 'Designing software around the language and boundaries of the business — orders, invoices, shipments — so the code’s modules match the way its users think.',
    },
    {
      q: 'How do system design interviews relate to real design?',
      a: 'They practise the same steps — requirements, numbers, data, flows, trade-offs — at a much larger imagined scale. Real design is usually smaller, messier, and more about the people involved.',
    },
    {
      q: 'What is a C4 diagram?',
      a: 'A way of drawing architecture at four zoom levels — context, containers, components, code — so each diagram answers one question for one audience.',
    },
    {
      q: 'How do you design for failure?',
      a: 'Assume every network call can be slow, fail, or happen twice. Add timeouts, retries with backoff, idempotency and fallbacks — and decide what the user sees when each part is down.',
    },
  ],

  next: [
    { q: 'How do you turn a vague request into requirements in the first place?', chapter: 'plan' },
    { q: 'How are three real apps designed?', chapter: 'design-studies' },
    { q: 'What changes at ten thousand users?', chapter: 'scale' },
    { q: 'How do you build it with AI without losing control?', chapter: 'build-with-ai' },
  ],
};

export default writing;
