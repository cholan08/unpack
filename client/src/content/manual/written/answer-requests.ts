/**
 * Chapter: Answer requests (servers & APIs).
 * Follows the model chapter, written/identity.ts.
 */
import type { ChapterWriting } from '../types';

const writing: ChapterWriting = {
  hook: {
    story: [
      'You open a shopping app and tap *My orders*. A list appears. Somewhere, a program you will never see was waiting for exactly that question.',
      'That program is a **server**: code on a machine that listens for requests and answers each one. It has to work out what is being asked, whether the question makes sense, where the data is — and reply in a way the app understands. Thousands of times a second, without mixing anyone up.',
      'What does that program actually look like — and how does it keep so many answers straight?',
    ],
    predict: {
      q: 'One request to your Node server waits two seconds for the database. What happens to everyone else’s requests in the meantime?',
      options: [
        'They queue up until the slow one finishes',
        'They are handled as normal — waiting costs the server almost nothing',
        'Node starts a new thread for each one',
        'They fail with a timeout',
      ],
      answer: 1,
      reveal:
        'They carry on. Node runs your code on one thread, but *waiting* — for a database, a file, another API — doesn’t hold that thread: the operating system watches the connection while Node serves everyone else. That is how one small server answers thousands of people. What *does* stall everybody is heavy work on that thread itself: a huge loop, resizing an image, hashing a password synchronously.',
    },
  },

  idea: {
    lede: 'Every backend — in Node, Python, Go or Java, for a shop or a bank — answers a request with the same five jobs.',
    jobs: [
      {
        title: 'Listen and route',
        text: 'The server listens on a port. Each request has a method and a path (`GET /orders/42`), and a [[route]] decides which code handles it.',
      },
      {
        title: 'Read and check the input',
        text: 'Parse the body, then check it against what you expect. Anything from outside — your form, someone’s script, a bot — can send anything at all.',
      },
      {
        title: 'Do the work',
        text: 'Load or change data, call other services, apply the rules of your product. This is the only part that is really *yours*.',
      },
      {
        title: 'Answer clearly',
        text: 'Reply with a [[status-code|status code]] that tells the truth — `201` created, `400` bad input, `404` not found — and data in a predictable shape, usually [[json|JSON]].',
      },
      {
        title: 'Fail safely',
        text: 'Something will go wrong. Catch it in one place, log the details for yourself, and give the user a clean message — never your stack trace.',
      },
    ],
    picture:
      'A post office counter. Every letter (a request) passes along the same line of desks — open it, check the stamp, check the address ([[middleware]]) — before it reaches the clerk who handles that kind of letter (the route handler). The clerk fetches what is needed from the back room (the database) and sends a reply with a clear stamp on it: delivered, returned, unknown address (the status code). And when something breaks, one supervisor deals with every complaint the same way (the error handler).',
  },

  lessonNotes: {
    'node-runtime': 'What runs your server: one thread, an event loop, and why waiting is free but heavy work isn’t.',
    middleware: 'Jobs 1 and 2: the line of functions every request passes through — and why their order matters.',
    'rest-api': 'Job 4: URLs, methods and status codes designed so any client can guess how your API works.',
    validation: 'Job 2 done properly: check every input against a schema at the edge, and keep only what you asked for.',
    errors: 'Job 5: errors that know their own status, one handler for all of them, and logs that help you at 3 a.m.',
    config: 'The same code on your laptop and in production: settings and secrets come from the environment.',
  },

  options: {
    lede: 'Every option below does the same five jobs. They differ in how much is decided for you, and where your code runs.',
    items: [
      {
        name: 'A minimal framework',
        what: 'A small library that routes requests and runs middleware. You choose everything else: validation, database, folder structure.',
        pickWhen: 'You are learning, or building a small-to-medium API and want to see every moving part.',
        cost: 'Every decision — and keeping it consistent as the app grows — is yours.',
        examples: 'Express (this course), Fastify, Hono; Flask in Python',
        tools: ['express', 'node'],
      },
      {
        name: 'A full, opinionated framework',
        what: 'Structure, conventions and batteries included: routing, validation, database access, auth, often an admin panel.',
        pickWhen: 'A bigger product or a team, where an agreed structure matters more than freedom.',
        cost: 'More to learn up front, and you work the framework’s way.',
        examples: 'NestJS, Django, Ruby on Rails, Laravel, Spring Boot',
        tools: ['nestjs', 'django', 'ruby-on-rails', 'laravel', 'spring-boot'],
      },
      {
        name: 'Server code inside a full-stack framework',
        what: 'API routes and server functions live next to your pages, in the same project, and deploy together.',
        pickWhen: 'A web app whose pages and backend are built by the same people and always ship together.',
        cost: 'The backend is tied to that framework and its hosting; a mobile app may later need a separate API.',
        examples: 'Next.js route handlers and server actions, Nuxt server routes, SvelteKit',
        tools: ['nextjs', 'nuxt'],
      },
      {
        name: 'Serverless functions',
        what: 'You upload single functions; the platform runs one copy per request and scales down to nothing when it is quiet.',
        pickWhen: 'Spiky or low traffic, webhooks, small APIs — when you don’t want to keep a server running.',
        cost: 'Cold starts, time limits and no memory between requests; long or chatty work fits badly.',
        examples: 'AWS Lambda, Vercel Functions, Netlify Functions, Cloudflare Workers',
        tools: ['aws'],
      },
      {
        name: 'A backend-as-a-service',
        what: 'A hosted database with ready-made APIs, auth and file storage. You write access rules instead of most server code.',
        pickWhen: 'Prototypes, and apps whose logic is mostly “store the user’s data and give it back”.',
        cost: 'Business logic gets squeezed into rules and small functions, and leaving later is real work.',
        examples: 'Supabase, Firebase, Appwrite, PocketBase',
      },
    ],
    choose: [
      { when: 'You are learning how backends work', pick: 'Express, by hand. Every job in this chapter stays visible.' },
      { when: 'A small product you are building and shipping yourself', pick: 'Express or Fastify with a schema validator — or a backend-as-a-service if the logic is mostly storing data.' },
      { when: 'A web app whose pages and API ship together', pick: 'The server side of a full-stack framework such as Next.js.' },
      { when: 'Webhooks, or rare and spiky traffic', pick: 'Serverless functions.' },
      { when: 'A large codebase or a team', pick: 'An opinionated framework: NestJS, Django, Rails or Spring Boot.' },
    ],
  },

  modern: {
    lede: 'An AI assistant can write a working CRUD API in a minute. That is exactly why the parts it tends to skip matter: checking input, honest status codes, one place for errors, secrets kept out of the code. They are what separate an API that works in a demo from one that survives real users.',
    defaults: [
      'Validate every body, query string and URL parameter against a schema (Zod, or your framework’s validator) before using it.',
      'Use status codes that tell the truth: `201` created, `400` bad input, `401`/`403` for auth, `404` missing — `500` only for your own bugs.',
      'One error handler for the whole app: log the details with a request id, show the user a short message.',
      'Read settings and secrets from environment variables, and check them once at startup.',
      'Keep the main thread free: no heavy CPU work inside a request — hand it to a background job or a worker.',
      'On Express 5, errors thrown in `async` handlers reach your error handler by themselves; on Express 4, wrap async handlers.',
    ],
    aiGood: [
      'Scaffolding routes, controllers and models from a description',
      'Writing a validation schema from an example request body',
      'Turning a stack trace into a likely cause',
      'Writing API tests — one for every status code a route can return',
      'Generating API documentation (OpenAPI) from your routes',
    ],
    aiWrong: [
      { mistake: 'Saves `req.body` straight into the database.', fix: 'Validate with a schema and save only the fields you expect ([[mass-assignment]]).' },
      { mistake: 'Answers errors with `200` and `{ error }`, or turns every failure into `500`.', fix: 'Pick the status that tells the truth; `500` means *your* bug.' },
      { mistake: 'Sends the stack trace or the database error to the client.', fix: 'Log it on the server; send a short message and a request id.' },
      { mistake: 'Forgets `return` after sending a response, then sends another one.', fix: '`return res.status(400).json(…)` — one request, one answer.' },
      { mistake: 'Writes `async` handlers on Express 4 with no error path, so a rejected promise hangs the request or crashes the process.', fix: 'Use Express 5, or a small `asyncHandler` wrapper that calls `next(err)`.' },
      { mistake: 'Registers `express.json()` or auth middleware after the routes that need it.', fix: 'Middleware runs top to bottom: register it before those routes.' },
      { mistake: 'Hardcodes the database URL or an API key.', fix: 'Environment variables, checked at startup; `.env` in `.gitignore`.' },
      { mistake: 'Uses `GET` for something that changes data.', fix: '`GET` only reads. `POST` creates, `PATCH`/`PUT` change, `DELETE` removes.' },
    ],
  },

  build: {
    title: 'A small bookmarks API',
    brief: 'An API that saves links, lists them and deletes them — with real validation, honest status codes and one error handler. Keep the bookmarks in an array for now; the next chapter, *Remember things*, gives them a database. No frontend needed: your browser and a few commands are enough to talk to it.',
    byHand: [
      { title: 'Start a server', text: '`express()`, `app.use(express.json())`, and a `GET /health` route that returns `{ ok: true }`. Run it and open it in your browser.', see: ['node-runtime', 1] },
      { title: 'Name the resource', text: 'Routes on `/api/bookmarks`: `GET` lists, `POST` creates, `GET /:id` reads one, `DELETE /:id` removes one. Nouns in the URL, verbs in the method.', see: ['rest-api', 3] },
      { title: 'Check the input', text: 'A Zod schema: `url` must be a URL, `title` a string of 1–200 characters, `tags` an optional list of strings. Invalid input gets `400` with a message for each field.', see: ['validation', 3] },
      { title: 'Keep only what you asked for', text: 'Save the parsed result, never `req.body`. A request that also sends `"isAdmin": true` changes nothing.', see: ['validation', 5] },
      { title: 'Answer honestly', text: '`201` with the new bookmark on create, `404` for an unknown id, `204` with no body after a delete.', see: ['rest-api', 4] },
      { title: 'One place for errors', text: 'An `AppError` class that carries a status, and one error handler at the end that logs the details and replies `{ error, requestId }`.', see: ['errors', 5] },
      { title: 'Settings from the environment', text: 'Read `PORT` from `process.env` and check it once at startup: the server refuses to start with a bad value, and says why.', see: ['config', 4] },
    ],
    withAI: {
      lede: 'Now build it again with your AI assistant. The prompt is a **spec**: the endpoints, the rules it must follow, and what you will test. Read every file it gives back before you run it.',
      prompt: `Build "Bookmarks API": an Express 5 server in JavaScript (ES modules). Keep bookmarks in memory for now.

Endpoints
- GET    /health              → 200 { ok: true }
- GET    /api/bookmarks       → 200, the list (optional ?tag= filter)
- POST   /api/bookmarks       → 201, the created bookmark
- GET    /api/bookmarks/:id   → 200, or 404
- DELETE /api/bookmarks/:id   → 204, or 404

Rules
- Validate bodies with Zod: url (a valid URL), title (1–200 characters), tags (optional array of strings).
- Invalid input → 400 with { error, fields: { fieldName: message } }. Save only the parsed fields, never req.body.
- One AppError class with a status code, and one error handler registered last: it logs the error with a request id and replies { error, requestId }. Never send stack traces.
- Read PORT from the environment and validate it at startup.
- Every early response is written as "return res...".

Then list every status code each route can return, with a curl command that triggers each one.`,
    },
    verify: [
      '`GET /health` returns **200** and `{ "ok": true }`.',
      'Create a bookmark with a broken URL: **400**, with a message for the `url` field.',
      'Create one with an extra field `"isAdmin": true`: list it back — the extra field is not there.',
      'Ask for an id that doesn’t exist: **404** — not 200, not 500.',
      'Delete a bookmark: **204**. List again: it’s gone.',
      'Throw an error on purpose inside one route: the client sees a short message and a request id; the stack trace appears only in the server’s log.',
      'Start the server with `PORT=abc`: it refuses to start and tells you why.',
    ],
  },

  breakIt: [
    {
      title: 'Saving the request',
      lang: 'js',
      code: `app.post('/api/users', async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json(user);
});`,
      err: [2],
      answer:
        'Whatever the client sends gets saved — including fields you never meant to accept, like `role: "admin"` or `verified: true`. That is [[mass-assignment]]. Validate with a schema and save only what you expect: `User.create(parsed.data)`.',
      see: ['validation', 5],
    },
    {
      title: 'Not found — but fine',
      lang: 'js',
      code: `app.get('/api/products/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.json({ error: 'Not found' });
  res.json(product);
});`,
      err: [3],
      answer:
        'The body says “not found”, but the status says **200 OK**. Browsers, caches, monitoring and your own `fetch` code all trust the status code, so the error looks like a success. Send `res.status(404).json(…)`.',
      see: ['rest-api', 4],
    },
    {
      title: 'Answering twice',
      lang: 'js',
      code: `app.post('/api/bookmarks', (req, res) => {
  if (!req.body.url) {
    res.status(400).json({ error: 'url is required' });
  }
  bookmarks.push(req.body);
  res.status(201).json(req.body);
});`,
      err: [3],
      answer:
        'Without `return`, the handler carries on after sending the 400: it saves the bad bookmark and tries to answer a second time, and Express throws *Cannot set headers after they are sent*. Write `return res.status(400).json(…)`. (It also saves `req.body` as it arrived — see the first card.)',
    },
    {
      title: 'A helpful error handler',
      lang: 'js',
      code: `app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message, stack: err.stack });
});`,
      err: [2],
      answer:
        'Every failure now shows strangers your file paths, library versions and sometimes database details — a map for attackers, noise for users. And every error becomes a 500, even bad input. Use the error’s own status, log the stack on the server, and send a short message with a request id.',
      see: ['errors', 6],
    },
  ],

  explain: [
    'Explain what a server does with one request, from the moment it arrives to the moment it answers.',
    'Why should a server never trust `req.body` — even when the only client is your own frontend?',
    'Node runs your code on one thread. How does it serve thousands of people at once, and what would make it stop?',
  ],

  deeper: [
    {
      q: 'What is the difference between REST, GraphQL and RPC?',
      a: 'REST names resources and acts on them with HTTP methods. GraphQL exposes one endpoint where the client asks for exactly the fields it wants. RPC (gRPC, tRPC) calls named functions on the server. All of them answer requests; they differ in who decides the shape of the answer.',
    },
    {
      q: 'What is an idempotency key?',
      a: 'A unique id the client sends with a request that must never happen twice, such as a payment. If the network drops and the client retries, the server recognises the key and returns the first result instead of charging again.',
    },
    {
      q: 'How do you change an API without breaking the apps that use it?',
      a: 'Add, don’t remove or rename: new optional fields, new endpoints. When you truly must break something, publish a new version (`/v2`) and keep the old one running until its clients have moved.',
    },
    {
      q: 'What happens to requests in flight when you deploy?',
      a: 'With a graceful shutdown, the old server stops accepting new connections, lets the requests it is handling finish, closes the database connection, and only then exits — so nobody is cut off mid-answer.',
    },
    {
      q: 'Monolith or microservices?',
      a: 'Start with one service with clear folders inside it. Split a piece out only when it needs to scale, deploy or fail on its own. Microservices trade complexity in the code for complexity in the network.',
    },
    {
      q: 'Why do APIs return lists one page at a time?',
      a: 'A list can grow to millions of items. Returning a page at a time — a limit plus a cursor — keeps every response small and fast, and keeps the database calm.',
    },
  ],

  next: [
    { q: 'Where do the bookmarks go when the server restarts?', chapter: 'remember' },
    { q: 'How does the server know who is asking?', chapter: 'identity' },
    { q: 'How do you call someone else’s API from yours?', chapter: 'integrate' },
    { q: 'What happens when ten thousand requests arrive at once?', chapter: 'scale' },
  ],
};

export default writing;
