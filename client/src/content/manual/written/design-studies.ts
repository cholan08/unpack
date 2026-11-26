/**
 * Chapter: Design three real apps (Part IV · Build products).
 * Follows the model chapter, written/identity.ts.
 */
import type { ChapterWriting } from '../types';

const writing: ChapterWriting = {
  hook: {
    story: [
      'A todo app, a shopping cart and a chat app look like three different worlds. Underneath, they are built from the same blocks — users, data, an API, sign-in — combined differently, because each has a different thing that must never go wrong.',
      'For the todo app, it is losing someone’s list. For the cart, it is charging the wrong amount or selling stock you don’t have. For the chat, it is a message arriving late, twice, or in the wrong room. Those “must nevers” shape every design decision.',
      'How would you design a todo app, a shopping cart and a chat app — and why differently?',
    ],
    predict: {
      q: 'Which of these most needs a “create” that is safe to send twice?',
      options: [
        'Adding a todo — a duplicate is annoying',
        'The cart’s “Place order” — a double click must never charge twice',
        'The chat’s typing indicator',
        'None of them',
      ],
      answer: 1,
      reveal:
        'Placing an order. A double click, a retry after a timeout or a shaky network can send the same request twice — and with money, “twice” means charging twice. An [[idempotency-key|idempotency key]] lets the server recognise the repeat and return the first result. A duplicate todo is a nuisance; a duplicate charge is a refund, an angry customer and lost trust.',
    },
  },

  idea: {
    lede: 'Studying finished designs is how architects and engineers learn. Each study here applies the same method to a different product — and shows how one “must never” changes everything.',
    jobs: [
      {
        title: 'Start from what must never happen',
        text: 'Losing data (todo), charging wrongly (cart), dropping or duplicating messages (chat). That one sentence steers the whole design.',
      },
      {
        title: 'Same blocks, different weights',
        text: 'All three need identity, data and an API. The cart leans on transactions and payments; the chat on real-time and history; the todo on staying simple.',
      },
      {
        title: 'Model for the main read',
        text: 'Todos by owner, a cart with its items, a room’s messages newest first — each model and index follows the screen people use most.',
      },
      {
        title: 'Make the risky step safe',
        text: 'Atomic stock, idempotent orders, verified webhooks, save-then-broadcast: the dangerous moment gets the most care.',
      },
      {
        title: 'Compare — and borrow',
        text: 'Once you have seen three, you will recognise their parts in every product you use, and reuse them in your own.',
      },
    ],
    picture:
      'A cookbook with three recipes that share one pantry. Flour, eggs and butter (sign-in, data, an API) appear in all three — but cake, bread and pasta each need their own technique, timing and the one step you can’t get wrong: the cake that won’t rise, the dough that won’t prove. Cook all three, and you understand the pantry.',
  },

  lessonNotes: {
    'design-todo': 'The baseline: requirements and numbers, data model, API, backend pipeline, frontend structure, security, shipping.',
    'design-cart': 'Money changes everything: prices from the server, atomic stock, idempotent orders, payment webhooks, abandoned checkouts.',
    'design-chat': 'Live changes everything: messages modelled for reading, save then broadcast, paging history, presence, many servers.',
  },

  options: {
    lede: 'Work through them in order — each adds one hard problem to the last. Then design the fourth and fifth yourself.',
    items: [
      {
        name: 'A todo app',
        what: 'Users, lists and todos: create, read, update and delete with sign-in, on one database.',
        pickWhen: 'First — it is the baseline every other product builds on.',
        cost: 'Easy to over-engineer: resist queues, caches and real-time until they are needed.',
        examples: 'The shape of Todoist, Microsoft To Do, Google Keep',
      },
      {
        name: 'A shopping cart and checkout',
        what: 'Products, carts, orders, stock and payments.',
        pickWhen: 'Second — it adds money, concurrency and an outside service.',
        cost: 'Every mistake costs real money or trust: transactions, idempotency and webhooks are required.',
        examples: 'Any online shop’s checkout',
      },
      {
        name: 'A chat app',
        what: 'Rooms, messages, presence, unread counts and live delivery.',
        pickWhen: 'Third — it adds real-time and several servers.',
        cost: 'Message order, delivery guarantees, and scaling many open connections.',
        examples: 'The shape of WhatsApp, Slack, Discord',
      },
      {
        name: 'Your fourth: a booking system',
        what: 'Time slots, resources and reservations — the cart’s concurrency with the todo’s simplicity.',
        pickWhen: 'After the three, as your own design.',
        cost: 'Time zones, and never double-booking.',
        examples: 'Bookings for a salon, a clinic, a gym',
      },
      {
        name: 'Your fifth: an assistant over documents',
        what: 'Uploads, search by meaning, and a language model answering with sources.',
        pickWhen: 'Once you have read *Make it smart*.',
        cost: 'Answer quality, the cost per question, and keeping private documents private.',
        examples: 'Help-centre assistants, “ask your documents” tools',
      },
    ],
    choose: [
      { when: 'You have never designed an app', pick: 'Start with the todo app.' },
      { when: 'You are comfortable with CRUD and sign-in', pick: 'The shopping cart.' },
      { when: 'You want live features', pick: 'The chat app.' },
      { when: 'You have done all three', pick: 'Design a booking system yourself, then compare it with an AI review.' },
    ],
  },

  modern: {
    lede: 'AI can generate a complete todo, cart or chat app in an afternoon — they are among the most common apps in its training data. That makes these studies more valuable, not less: once you know where each design’s danger lives, you can tell in minutes whether generated code handled it — or quietly didn’t.',
    defaults: [
      'For every product, write the “must never” sentence first.',
      'Prices, totals and permissions are decided on the server, always.',
      'Stock, bookings and anything limited change atomically.',
      'Anything that charges or sends gets an idempotency key.',
      'Save first, then broadcast or notify.',
      'When AI generates one of these apps, review exactly those risky steps first.',
    ],
    aiGood: [
      'Generating a first version of a well-known app shape',
      'Listing the risky steps of a design',
      'Comparing two designs and their trade-offs',
      'Writing tests for the “must never” cases',
      'Explaining how a real product probably solves a problem',
    ],
    aiWrong: [
      { mistake: 'Works out cart totals in the browser and sends them to the server.', fix: 'The client sends ids and quantities; the server prices them.' },
      { mistake: 'Checks stock, then decrements it in a separate step.', fix: 'One conditional, atomic update.' },
      { mistake: 'Makes “Place order” a plain POST that is unsafe to repeat.', fix: 'An idempotency key from the client, stored with the order.' },
      { mistake: 'Broadcasts chat messages before saving them.', fix: 'Save, then broadcast the saved message.' },
      { mistake: 'Loads a chat’s entire history at once.', fix: 'The latest page first, then page backwards with a cursor.' },
      { mistake: 'Stores presence and typing in the main database.', fix: 'Short-lived data in Redis, with an expiry.' },
    ],
  },

  build: {
    title: 'Design the fourth app yourself',
    brief: 'Work through the three studies, then design a fourth on your own — a class-booking app for a gym — with the same method. Compare your design with the studies, then with an AI review.',
    byHand: [
      { title: 'Work the three studies', text: 'Go through the todo, cart and chat lessons, and write each one’s “must never” in a single sentence.', see: ['design-todo', 1] },
      { title: 'Your must-never', text: 'For the gym: “a class must never have more bookings than places.” Write yours.' },
      { title: 'Requirements and numbers', text: 'Members, classes, places, bookings, waiting lists — and rough numbers per day.' },
      { title: 'Model and indexes', text: 'Which collections, which references, and which index answers “classes this week with free places”?', see: ['design-todo', 2] },
      { title: 'Make the risky step safe', text: 'Booking the last place: an atomic update with a condition on free places — the cart’s stock pattern.', see: ['design-cart', 4] },
      { title: 'Live, or not?', text: 'Does the class list need live updates, or is a refresh enough? Decide, and say why.', see: ['design-chat', 1] },
      { title: 'Draw and defend', text: 'One diagram, five lines of trade-offs, and the list of Part II chapters it uses.' },
    ],
    withAI: {
      lede: 'Then ask your AI assistant to attack your design — especially your must-never — and to improve it rather than replace it.',
      prompt: `I designed a class-booking app for a gym after studying todo, cart and chat designs. Review it like a senior engineer.

[paste: the must-never sentence, requirements and numbers, data model with indexes, API, the booking flow, the diagram, the trade-offs]

1. Which parts did I borrow from the todo, cart and chat designs — and did I apply them correctly?
2. Try to break the must-never: simultaneous bookings for the last place, cancellations, waiting lists, time zones, someone booking with a script.
3. What is more complex than my numbers need?
4. Which single test would best prove the must-never holds?

Don't redesign it; improve it.`,
    },
    verify: [
      'You wrote the must-never for all three studies and for your own app.',
      'Your gym design reuses at least one pattern from each study — and you can say which.',
      'Booking the last place is atomic: two simultaneous requests can’t both succeed.',
      'Your main screen’s query has a matching index.',
      'You decided about live updates with a reason, not by default.',
      'The AI review found a weak spot, and you fixed it in the design.',
      'You can pass the *Build It* gate.',
    ],
  },

  breakIt: [
    {
      title: 'The double-clicked order',
      lang: 'js',
      code: `app.post('/api/orders', requireAuth, async (req, res) => {
  const order = await createOrderAndCharge(req.user.id, req.body.items);
  res.status(201).json(order);
});`,
      err: [2],
      answer:
        'A double click, or a retry after a timeout, creates two orders and two charges. Have the client send an idempotency key, store it with the order under a unique index, and when the same key arrives again, return the first order instead of creating another.',
      see: ['design-cart', 5],
    },
    {
      title: 'All of the history',
      lang: 'js',
      code: `socket.on('room:open', async (roomId) => {
  const messages = await Message.find({ roomId }).sort({ createdAt: 1 });
  socket.emit('room:history', messages);
});`,
      err: [2],
      answer:
        'A busy room has hundreds of thousands of messages, and this loads and sends every one of them each time someone opens it. Load the latest 50 — newest first, with an index on `{ roomId: 1, createdAt: -1 }` — and page backwards as the user scrolls up.',
      see: ['design-chat', 4],
    },
    {
      title: 'The last place',
      lang: 'js',
      code: `const cls = await Class.findById(id);
if (cls.booked >= cls.capacity) return res.status(409).json({ error: 'Full' });
cls.booked += 1;
await cls.save();`,
      err: [1, 4],
      answer:
        'Two members can both read `booked: 19` of 20 at the same moment, and both get the last place. Make it one atomic step: `Class.findOneAndUpdate({ _id: id, $expr: { $lt: [\'$booked\', \'$capacity\'] } }, { $inc: { booked: 1 } }, { new: true })` — `null` means it is full.',
      see: ['design-cart', 4],
    },
    {
      title: 'Typing, saved forever',
      lang: 'js',
      code: `socket.on('typing', async ({ roomId }) => {
  await User.updateOne({ _id: userId }, { typingIn: roomId, typingAt: new Date() });
});`,
      err: [2],
      answer:
        'Typing events fire several times a second per person. Writing each one to the main database adds heavy load for data that is worthless a few seconds later. Keep presence and typing in Redis with a short expiry — or simply broadcast them without storing anything.',
      see: ['design-chat', 5],
    },
  ],

  explain: [
    'What is each study’s “must never”, and how does it shape the design?',
    'Which patterns from the cart would you reuse in a booking app, and why?',
    'Why does a chat app load messages newest first, a page at a time?',
  ],

  deeper: [
    {
      q: 'How do real shops handle a payment that fails halfway?',
      a: 'They treat checkout as a set of states — pending, paid, failed, refunded — moved along by the payment provider’s webhooks, with stock reserved for a few minutes and released if the payment never arrives.',
    },
    {
      q: 'How do chat apps keep messages in order?',
      a: 'Usually the server gives each message a sequence number (or timestamp) per room as it saves it; clients sort by that, and ask for any missing numbers to fill gaps.',
    },
    {
      q: 'What changes with end-to-end encryption?',
      a: 'Messages are encrypted on the sender’s device and decrypted only on the recipients’; the server stores and forwards text it cannot read. That rules out server-side search and makes key management central to the design.',
    },
    {
      q: 'How would a todo app work offline?',
      a: 'Save changes on the device first (in IndexedDB), show them immediately, and sync with the server when back online — resolving conflicts if the same todo changed in two places.',
    },
    {
      q: 'What is a saga?',
      a: 'A way to run a multi-step process across services without one big transaction: each step has an undo step that runs if a later step fails — reserve, charge, ship; or release, refund, cancel.',
    },
    {
      q: 'Where can I study more real designs?',
      a: 'Engineering blogs of companies you admire, system design write-ups, and the code of open-source apps. Read each with this method: what must never happen — and how did they prevent it?',
    },
  ],

  next: [
    { q: 'How do you get from a vague client request to requirements?', chapter: 'plan' },
    { q: 'Can you build a full app from an empty folder?', chapter: 'taskflow' },
    { q: 'How do payments work in detail?', chapter: 'payments' },
    { q: 'Could you solve a real client’s problem?', chapter: 'briefs' },
  ],
};

export default writing;
