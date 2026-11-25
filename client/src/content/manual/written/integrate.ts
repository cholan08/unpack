/**
 * Chapter: Talk to other systems (APIs & integrations).
 * Follows the model chapter, written/identity.ts.
 */
import type { ChapterWriting } from '../types';

const writing: ChapterWriting = {
  hook: {
    story: [
      'A small shop’s website takes card payments, shows a map to the store, sends a text when your order ships, and lets you sign in with Google. Its two developers built none of those things.',
      'They *connected* to them. Almost every product today sits in a web of other systems — payment providers, maps, email, AI models, a weather feed, a company’s old stock database. Each one speaks over an API, and each one can be slow, down, over its limit, or simply say no.',
      'How does your app talk to systems it doesn’t own — and keep working when they misbehave?',
    ],
    predict: {
      q: 'Your React app on `localhost:5173` calls your API on `localhost:5000` and gets “blocked by CORS policy”. Which side has to change?',
      options: [
        'The React code — add a header to the fetch',
        'The API server — it must say that this origin is allowed',
        'The browser — turn off its security',
        'Neither — CORS errors only happen in development',
      ],
      answer: 1,
      reveal:
        'The server. A different port is a different [[origin]], and the browser won’t hand a cross-origin response to your page unless the *server* says that origin is allowed (`Access-Control-Allow-Origin`). Nothing you add to `fetch` can grant it — the rule exists precisely so pages can’t help themselves to other sites’ data. Or avoid the question entirely: one origin, with a dev proxy locally.',
    },
  },

  idea: {
    lede: 'Calling a payment provider, a map, an AI model or your own backend — every integration does the same five jobs.',
    jobs: [
      {
        title: 'Know the contract',
        text: 'Read the API’s documentation: its endpoints and methods, the shape of requests and replies, and the status codes and errors it can return.',
      },
      {
        title: 'Prove who is calling',
        text: 'APIs want credentials: an API key or an OAuth token. Keys live on your server, in environment variables — never in the browser.',
      },
      {
        title: 'Expect failure',
        text: 'Networks drop, services go down, limits kick in. Every call needs a timeout, error handling, and sometimes a careful retry.',
      },
      {
        title: 'Listen as well as ask',
        text: 'Some systems call *you*: a [[webhook]] tells your server that a payment cleared or a file finished. Check that it is genuine, and cope if it arrives twice.',
      },
      {
        title: 'Keep it in one place',
        text: 'Wrap each outside service in a small module of your own. The rest of your app never depends on its quirks, and replacing it later touches one file.',
      },
    ],
    picture:
      'A travel agent. They don’t fly planes, run hotels or drive taxis — they talk to the airline, the hotel and the taxi firm, each in its own way. They keep your passport safe (credentials), assume any flight can be delayed (failure), wait for the hotel to call back with a confirmation (webhooks), and you only ever deal with the agent (one module), never with all of them.',
  },

  lessonNotes: {
    cors: 'Why the browser blocks calls between origins, how the server opts in — and how to avoid the question altogether.',
    'api-from-react': 'Job 5 on the frontend: one small API client with a base URL, errors turned into exceptions, and cancellation.',
    'data-fetching': 'Job 3 on screen: loading, error and empty states, and a shared cache for data from the server.',
    'rest-api': 'Job 1 from the other side: what a well-designed contract looks like, so you recognise one when you read the docs.',
  },

  options: {
    lede: 'Systems talk to each other in a handful of ways. Most products use several, chosen by who starts the conversation and how soon the answer is needed.',
    items: [
      {
        name: 'Call the API directly',
        what: 'Your server sends an HTTP request (REST or GraphQL) with its credentials and waits for the answer.',
        pickWhen: 'You need the answer now: create a charge, look up an address, ask an AI model.',
        cost: 'Errors, timeouts, rate limits and API changes are all yours to handle.',
        examples: '`fetch` on your server; GraphQL for APIs such as GitHub’s or Shopify’s',
        tools: ['node'],
      },
      {
        name: 'An official SDK',
        what: 'A library from the provider that wraps its API with types, retries and helpers.',
        pickWhen: 'The provider offers one — usually the safest and quickest route.',
        cost: 'A dependency to keep updated, with its own way of doing things.',
        examples: 'The Stripe, Twilio, AWS, OpenAI and Anthropic SDKs',
      },
      {
        name: 'Webhooks',
        what: 'You give the service a URL, and it sends your server a request when something happens.',
        pickWhen: 'Events that happen later: a payment cleared, a document was signed, a build finished.',
        cost: 'Your endpoint must be public, verify signatures, and handle duplicates and odd ordering.',
        examples: 'Stripe, GitHub and Slack webhooks',
      },
      {
        name: 'A message queue',
        what: 'Systems post messages to a queue; others pick them up in their own time.',
        pickWhen: 'Your own services — or partners — exchanging lots of events reliably.',
        cost: 'Another piece of infrastructure, and thinking in events instead of calls.',
        examples: 'RabbitMQ, Kafka, Amazon SQS',
        tools: ['rabbitmq', 'kafka', 'amazon-sqs'],
      },
      {
        name: 'An integration platform',
        what: 'Connect services with ready-made blocks instead of code: when *this* happens there, do *that* here.',
        pickWhen: 'Internal workflows and quick automations between tools your team already uses.',
        cost: 'Harder to test and version — and the bill grows with volume.',
        examples: 'n8n, Zapier, Make',
      },
    ],
    choose: [
      { when: 'You need the answer right now', pick: 'A direct API call — through the official SDK if there is one.' },
      { when: 'Something finishes later (a payment, a signature)', pick: 'A webhook, verified, and safe to receive twice.' },
      { when: 'Your own services exchanging lots of events', pick: 'A queue: RabbitMQ, SQS or Kafka.' },
      { when: 'Gluing your team’s tools together', pick: 'An integration platform such as n8n.' },
      { when: 'Your React app calling your own API', pick: 'One API client module, one origin (or a proxy) in development, and TanStack Query for the data.' },
    ],
  },

  modern: {
    lede: 'AI has read the documentation of nearly every popular API, so it can wire up an integration in minutes — sometimes against a version of the API that no longer exists. And it almost always writes the happy path: no timeout, no retry plan, the key in the wrong place. Integrations break at their edges; the edges are your job.',
    defaults: [
      'Keep every third-party key on the server, in environment variables, with the smallest permissions the provider offers.',
      'Wrap each service in one module of your own; the rest of the app calls your module.',
      'Put a timeout on every outgoing call, and retry only what is safe to repeat — with backoff, and an idempotency key for anything that charges or sends.',
      'Verify webhook signatures, answer `2xx` quickly, and do the slow work in a background job.',
      'Check the provider’s current docs and pin the API version you use.',
      'Use test mode and sandbox keys until you are ready for real money and real messages.',
    ],
    aiGood: [
      'Writing a typed client from an API’s docs or OpenAPI file',
      'Mapping between their data shapes and yours',
      'Writing a webhook handler and its signature check',
      'Mocking a third-party API for tests',
      'Explaining a CORS error or a provider’s 401',
    ],
    aiWrong: [
      { mistake: 'Calls a third-party API from the browser with the secret key.', fix: 'Browser → your server → the provider. The key never leaves the server.' },
      { mistake: 'Uses endpoints or parameters that were removed — or never existed.', fix: 'Check every call against the current docs, and pin the API version.' },
      { mistake: 'No timeout, so one slow provider freezes your requests.', fix: 'A timeout on every call, e.g. `signal: AbortSignal.timeout(5000)`.' },
      { mistake: 'Retries a payment or an email on any error.', fix: 'Retry only what is safe to repeat, with an idempotency key.' },
      { mistake: 'Acts on a webhook without checking its signature.', fix: 'Verify it with the provider’s secret before doing anything.' },
      { mistake: 'Silences a CORS error by allowing every origin.', fix: 'Allow your frontend’s origin on your own API — or use one origin.' },
      { mistake: 'Scatters calls to the provider all over the codebase.', fix: 'One wrapper module, so changing providers touches one file.' },
    ],
  },

  build: {
    title: 'Weather for any city',
    brief: 'Your app shows the weather for any city using Open-Meteo, a free public weather API that needs no key — called through your own server, with a timeout, a cache, honest error states, and one module that owns the integration.',
    byHand: [
      { title: 'Read the contract', text: 'In the Open-Meteo docs, find the two calls you need: geocoding turns a city name into coordinates; the forecast call returns the weather there. Note their parameters and the shape of each reply.', see: ['rest-api', 1] },
      { title: 'One module owns it', text: '`weather.js` on your server exports `getWeather(city)`. Nothing else in the app knows Open-Meteo exists.', see: ['api-from-react', 2] },
      { title: 'Never wait forever', text: 'Every outgoing `fetch` gets `signal: AbortSignal.timeout(5000)`. A slow provider becomes a clean error, not a frozen request.' },
      { title: 'Your own endpoint', text: '`GET /api/weather?city=Lisbon` validates the city, calls `getWeather`, and returns only the fields your page needs. Unknown city: 404. Provider down: 502.' },
      { title: 'Remember answers for a while', text: 'Cache each city’s result for 10 minutes (in memory, or Redis), so a hundred visitors cost one call.', see: ['caching', 4] },
      { title: 'One origin in development', text: 'Point Vite’s dev proxy at your API, so the page calls `/api/weather` with no CORS setup at all.', see: ['cors', 7] },
      { title: 'Honest states on screen', text: 'The page shows loading, the weather, “city not found”, or “weather unavailable right now” — never a blank box.', see: ['data-fetching', 3] },
    ],
    withAI: {
      lede: 'Now let your AI assistant build it. The spec pins down the edges it usually skips — and the last line makes it show its sources, so you can check the API calls really exist.',
      prompt: `Add a weather feature to my Express API and React (Vite) app using the Open-Meteo API (no key needed).

Server
- A module server/weather.js exports getWeather(city). It is the only file that talks to Open-Meteo: geocode the city, then fetch the current temperature and conditions.
- Every outgoing fetch uses AbortSignal.timeout(5000).
- Cache results per city for 10 minutes (in memory, behind a small interface I can swap for Redis).
- GET /api/weather?city= validates city with Zod (1–80 characters) and returns only { city, country, temperatureC, description, updatedAt }.
- Unknown city → 404. Provider timeout or error → 502 with a short message. Never forward the provider's raw error.

Client
- A Vite dev proxy for /api, so no CORS setup is needed.
- A useWeather(city) hook with TanStack Query; the page shows loading, success, "city not found" and "weather unavailable" states.

Then list the Open-Meteo endpoints and parameters you used, with links to their docs pages.`,
    },
    verify: [
      'Search for a real city: the weather appears, and the Network tab shows the page calling only your own `/api/weather`.',
      'Search for a made-up city: “city not found”, from a **404**.',
      'Point `weather.js` at a wrong address: the page says the weather is unavailable, from a **502**, within about five seconds.',
      'Search the same city twice: the second answer is instant, and your server logged only one call to the provider.',
      'The response holds only your five fields, not the provider’s whole reply.',
      'Open the docs pages the AI linked: those endpoints and parameters really exist.',
      'Search the codebase: only `weather.js` mentions Open-Meteo.',
    ],
  },

  breakIt: [
    {
      title: 'A key in the browser',
      lang: 'jsx',
      code: `const res = await fetch(
  \`https://api.maps.example/geocode?q=\${city}&key=\${import.meta.env.VITE_MAPS_KEY}\`
);`,
      err: [2],
      answer:
        'The key is in the JavaScript bundle and in every request URL, so anyone can copy it and run up your bill. Call your own server instead; it adds the key from its environment and calls the provider. (And encode user input in URLs: `encodeURIComponent(city)`.)',
      see: ['config', 5],
    },
    {
      title: 'Waiting for the rates',
      lang: 'js',
      code: `app.get('/api/rates', async (req, res) => {
  const r = await fetch('https://rates.example/latest');
  res.json(await r.json());
});`,
      err: [2, 3],
      answer:
        'No timeout and no error handling. If the rates service hangs, every request to this route hangs with it; if it returns an error page, `r.json()` throws and the user gets a 500. Add `signal: AbortSignal.timeout(5000)`, check `r.ok`, and answer 502 with a clear message — or serve the last good rates from a cache.',
    },
    {
      title: 'Payment received',
      lang: 'js',
      code: `app.post('/webhooks/payments', express.json(), async (req, res) => {
  if (req.body.type === 'payment.succeeded') {
    await Order.updateOne({ _id: req.body.orderId }, { paid: true });
  }
  res.sendStatus(200);
});`,
      err: [2, 3],
      answer:
        'Anyone who finds this URL can post `{ "type": "payment.succeeded" }` and mark any order as paid. Verify the provider’s signature on the raw request body before acting — and make the handler safe to run twice, because providers retry.',
    },
    {
      title: 'The CORS fix',
      lang: 'js',
      code: `// the browser said "blocked by CORS policy", so…
app.use(cors({ origin: '*' }));`,
      err: [2],
      answer:
        'The error goes away because every website may now call your API from its visitors’ browsers. It also breaks cookie-based logins: browsers refuse to send credentials when the allowed origin is `*`. Allow your own frontend — `cors({ origin: \'https://myapp.com\', credentials: true })` — or serve both from one origin.',
      see: ['cors', 5],
    },
  ],

  explain: [
    'Why can’t your React code fix a CORS error on its own?',
    'Why must a third-party API key never be in the browser — not even “just for now”?',
    'What is a webhook, and why do you have to verify it?',
  ],

  deeper: [
    {
      q: 'What is OAuth, really?',
      a: 'A way for a user to let your app act for them at another service — read their calendar, post to their repository — without giving you their password. The service hands your app a limited, revocable token instead.',
    },
    {
      q: 'How do you live with rate limits?',
      a: 'Providers cap how many calls you can make per second or per day, and answer 429 when you go over. Cache answers, batch requests, wait as long as they tell you before retrying, and watch your usage.',
    },
    {
      q: 'What is MCP?',
      a: 'The Model Context Protocol: an open standard for connecting AI assistants to tools and data. A service builds one MCP server, and any AI app that speaks MCP can use it — integrations for the AI era.',
    },
    {
      q: 'What is an OpenAPI file?',
      a: 'A machine-readable description of an API: every endpoint, parameter and response. Tools generate typed clients, docs and mocks from it — and it is the best thing to hand an AI assistant before it writes an integration.',
    },
    {
      q: 'Why do webhooks arrive twice, or out of order?',
      a: 'Providers retry until you answer `2xx`, and networks don’t promise order. Store each event’s id and skip ones you have seen; when order matters, fetch the latest state from the provider.',
    },
    {
      q: 'What happens when an API changes?',
      a: 'Good providers version their APIs and announce what they will remove. Pin a version, follow their changelog, and keep the integration in one module, so an upgrade is one focused change.',
    },
  ],

  next: [
    { q: 'What happens in the two seconds after you tap Pay?', chapter: 'payments' },
    { q: 'How does an app send you an email or a notification?', chapter: 'notify' },
    { q: 'How do you do the slow part of an integration later?', chapter: 'background' },
    { q: 'How do you find out an integration broke at 3 a.m.?', chapter: 'observe' },
  ],
};

export default writing;
