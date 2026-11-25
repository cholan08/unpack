/**
 * Chapter: Serve more people (scaling).
 * Follows the model chapter, written/identity.ts.
 */
import type { ChapterWriting } from '../types';

const writing: ChapterWriting = {
  hook: {
    story: [
      'Your app has ten users and runs happily on one small server. Then a post about it goes viral. Within an hour there are fifty thousand people, pages take twenty seconds, the database sits at 100%, and the server restarts every few minutes.',
      'Scaling isn’t one trick. It is a set of moves — make each request cheaper, spread requests over more machines, stop any single part becoming the bottleneck, protect yourself from floods — and every move has a price.',
      'What has to change when your app goes from ten users to ten million?',
    ],
    predict: {
      q: 'Your API runs on one overloaded server. You add two more behind a load balancer — and now users get logged out at random. Why?',
      options: [
        'The load balancer deletes cookies',
        'Sessions were kept in the first server’s memory, and the other servers have never heard of them',
        'Three servers can’t share one database',
        'The new servers are misconfigured',
      ],
      answer: 1,
      reveal:
        'The servers weren’t [[stateless]]. Each kept logged-in sessions in its own memory, so when your next request lands on a different server, it doesn’t know you. Before you can add servers, shared state has to move out of them — sessions into Redis or signed tokens, files into object storage — so that any server can answer any request.',
    },
  },

  idea: {
    lede: 'From a few hundred users to millions, scaling comes down to the same five moves — usually in this order.',
    jobs: [
      {
        title: 'Make each request cheaper',
        text: 'Indexes, pagination, caching and smaller responses. The cheapest server is the one you never need.',
      },
      {
        title: 'Make servers interchangeable',
        text: 'Keep no user state in a server’s memory or disk — sessions, uploads and jobs live in shared services — so any server can answer any request.',
      },
      {
        title: 'Add more of them',
        text: 'Run several copies behind a load balancer, and add or remove them with demand (scaling *out*), instead of only buying a bigger machine (scaling *up*).',
      },
      {
        title: 'Take load off the database',
        text: 'Caches for repeated reads, [[replica-set|replicas]] for more reads, queues for slow writes — and, much later, splitting data across machines.',
      },
      {
        title: 'Protect what you have',
        text: '[[rate-limit|Rate limits]], timeouts and back-pressure, so one client or one slow dependency can’t take everything down.',
      },
    ],
    picture:
      'A popular food truck becoming a restaurant chain. First, simplify the menu and prep ahead so each order is quick (cheaper requests). Then make every cook able to make every dish, with the recipes on the wall instead of in one cook’s head (stateless servers). Hire more cooks and a host who seats people evenly (a load balancer). Have the storeroom send common ingredients ready-portioned (caches and replicas). And when a coachload of a hundred arrives, take names and seat them in turn instead of letting everyone into the kitchen (rate limits and queues).',
  },

  lessonNotes: {
    'rate-limiting': 'Job 5: limiting each client with a token bucket, answering 429 — and why counters must be shared across servers.',
    caching: 'Jobs 1 and 4: caching at every layer, and the stale data and stampedes that come with it.',
    'sessions-tokens': 'Job 2: why sessions in one server’s memory break with three servers, and the two ways out.',
  },

  options: {
    lede: 'Every move costs money, complexity or consistency. Make the cheap ones first — most products never need the last one.',
    items: [
      {
        name: 'Scale up',
        what: 'Give the server more CPU and memory.',
        pickWhen: 'First — and often for a long time, especially for the database.',
        cost: 'There is a biggest machine, and one machine is still one point of failure.',
        examples: 'A bigger instance on your host or cloud',
      },
      {
        name: 'Scale out',
        what: 'Several identical, stateless app servers behind a load balancer, added and removed automatically.',
        pickWhen: 'Traffic outgrows one server, or one server failing must not take the app down.',
        cost: 'Every piece of shared state has to move into a shared service first.',
        examples: 'Nginx or a cloud load balancer; autoscaling on a PaaS, Cloud Run or Kubernetes',
        tools: ['nginx', 'kubernetes'],
      },
      {
        name: 'Cache',
        what: 'Answer repeated questions from memory or the edge instead of working them out again.',
        pickWhen: 'Reads far outnumber writes.',
        cost: 'Stale data, and invalidation to get right.',
        examples: 'A CDN; Redis',
        tools: ['redis'],
      },
      {
        name: 'Queue the slow work',
        what: 'Accept the request, put the heavy part on a queue, and let background workers process it at a steady pace.',
        pickWhen: 'Emails, image processing, reports, imports — anything that needn’t finish before the response.',
        cost: 'The work finishes later, and needs retries and monitoring.',
        examples: 'BullMQ on Redis, RabbitMQ, Amazon SQS, Kafka',
        tools: ['rabbitmq', 'amazon-sqs', 'kafka'],
      },
      {
        name: 'Split the database',
        what: 'Read replicas for reads; sharding, or separate databases per area, when one primary can’t keep up with writes.',
        pickWhen: 'The database is still the bottleneck after indexes, caching and a bigger machine.',
        cost: 'The most complex move: replication lag, queries across shards, choosing a shard key.',
        examples: 'MongoDB replica sets and sharding; PostgreSQL replicas, Citus',
        tools: ['mongodb', 'postgresql'],
      },
    ],
    choose: [
      { when: 'Already slow, with few users', pick: 'Not a scaling problem: profile, index, paginate, cache.' },
      { when: 'One server is maxed out', pick: 'Scale up first; make servers stateless; then scale out.' },
      { when: 'Spikes from slow background work', pick: 'Queue it, and process it with workers.' },
      { when: 'The database is the bottleneck', pick: 'Indexes and caching, then a bigger machine, then read replicas — sharding last.' },
      { when: 'One client hammers the API', pick: 'Rate limits per client, with shared counters.' },
    ],
  },

  modern: {
    lede: 'Cloud platforms turn “add servers” into a slider, and AI loves to suggest microservices, Kubernetes and Kafka. Most products never need them. The honest modern default is one well-built service, stateless, on a platform that autoscales, with a managed database — and measurements that tell you when that stops being enough.',
    defaults: [
      'Measure before scaling: know your slowest endpoints, your database load and your p95 response time.',
      'Stateless app servers from day one: sessions, files and jobs in shared services.',
      'Autoscaling on your platform, with at least two instances for anything that must stay up.',
      'A managed database, made bigger before it is split, with read replicas before sharding.',
      'Queues for slow work, rate limits on public endpoints, timeouts on every outgoing call.',
      'Load-test before a launch — not during it.',
    ],
    aiGood: [
      'Writing a load test (k6, Artillery) and reading its results',
      'Finding the state that stops you running several servers',
      'Moving slow work into a background queue',
      'Estimating capacity: requests per second, storage, cost',
      'Explaining scaling trade-offs for your real numbers',
    ],
    aiWrong: [
      { mistake: 'Proposes microservices or Kubernetes for a small app.', fix: 'One service, until a measured need says otherwise.' },
      { mistake: 'Keeps sessions, uploads or caches in one server’s memory or disk.', fix: 'Shared services: Redis, object storage, the database.' },
      { mistake: 'Uses in-memory rate-limit counters with several servers.', fix: 'Shared counters in Redis, or limits at the load balancer.' },
      { mistake: 'Retries failed calls immediately, forever.', fix: 'A few retries with exponential [[backoff]] and jitter.' },
      { mistake: 'Reads your own writes back from a replica.', fix: 'Read-after-write from the primary — replicas can lag.' },
      { mistake: 'Treats more servers as the fix for a slow query.', fix: 'More servers can’t help a database that scans everything.' },
    ],
  },

  build: {
    title: 'Load-test, then scale',
    brief: 'Find the breaking point of your bookmarks API with a load test, then raise it step by step — cheaper requests, stateless servers, more instances, a queue — measuring after every change.',
    byHand: [
      { title: 'Find the breaking point', text: 'A k6 or Artillery script that lists and creates bookmarks. Add virtual users until p95 passes one second or errors appear, and write that number down.' },
      { title: 'Make requests cheaper', text: 'Apply the fixes from *Make it fast* — index, paginate, cache the tag counts — and test again.', see: ['caching', 4] },
      { title: 'Hunt for state', text: 'Find everything kept in one server’s memory or disk: sessions, uploads, in-memory caches, rate-limit counters.', see: ['sessions-tokens', 5] },
      { title: 'Share it', text: 'Move sessions and rate-limit counters into Redis, and files into object storage.', see: ['rate-limiting', 5] },
      { title: 'Run three', text: 'Start three instances behind Nginx (or your platform’s scaling) and test again. Do you stay logged in on every request?' },
      { title: 'Queue the slow part', text: 'Move thumbnail creation into a background queue, so the upload request returns at once.' },
      { title: 'Protect it', text: 'Rate-limit each user and set timeouts on outgoing calls. Test a burst: the API stays up, and the abuser gets 429s.', see: ['rate-limiting', 2] },
    ],
    withAI: {
      lede: 'Let your AI assistant run the load test and hunt for hidden state with you — and forbid the fashionable answers, so it fixes what your numbers show.',
      prompt: `Help me find and raise the limits of my bookmarks API (Express + MongoDB + React).

1. Write a k6 load test: 70% GET /api/bookmarks (paginated), 20% GET /api/tags/counts, 10% POST /api/bookmarks, ramping from 10 to 500 virtual users over 5 minutes. Report p50, p95, error rate and requests per second.
2. Review my server code (I'll paste it) and list everything that would break with more than one instance: in-memory sessions, local files, in-memory caches or rate-limit counters, timers.
3. For each, give me the smallest change that works across instances (Redis, object storage, a queue).
4. Give me an nginx config (or Render/Railway settings) to run 3 instances behind a load balancer.

After each change, tell me which load-test number it should improve, and roughly by how much. Do not suggest microservices or Kubernetes.`,
    },
    verify: [
      'You know your breaking point before any change: users, requests per second, p95.',
      'Every change is in a before-and-after table with real numbers.',
      'Nothing user-specific lives in one server’s memory or disk.',
      'With three instances you stay logged in, whichever server answers.',
      'Uploads return quickly; thumbnails appear a moment later, from the queue.',
      'A burst from one client gets **429**s while everyone else carries on.',
      'Your final breaking point is several times higher than the first.',
    ],
  },

  breakIt: [
    {
      title: 'Sessions in memory',
      lang: 'js',
      code: `app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  // no store: sessions live in this process's memory
}));`,
      err: [5],
      answer:
        'express-session’s default memory store keeps sessions inside one process. With two instances, someone logged in on one is a stranger to the other — and every restart logs everyone out. (Its own documentation says the memory store is not for production.) Use a shared store such as `connect-redis`.',
      see: ['sessions-tokens', 5],
    },
    {
      title: 'A limit per server',
      lang: 'js',
      code: `const limiter = rateLimit({ windowMs: 60_000, limit: 100 }); // in-memory store
app.use('/api', limiter);
// …running 4 instances`,
      err: [1],
      answer:
        'Each instance counts on its own, so a client gets 100 requests a minute *per server* — 400 in total — and the real limit changes every time you scale. Share the counters in Redis (`rate-limit-redis`), or enforce the limit at the load balancer.',
      see: ['rate-limiting', 5],
    },
    {
      title: 'Retry until it works',
      lang: 'js',
      code: `async function charge(body) {
  while (true) {
    try { return await payments.charge(body); }
    catch { /* try again */ }
  }
}`,
      err: [2, 3, 4],
      answer:
        'When the payment service struggles, every request retries instantly and forever — piling load onto a service that is already down (a retry storm), and possibly charging twice. Retry a few times with exponential backoff and jitter, only for errors that are safe to retry, and with an idempotency key.',
    },
    {
      title: 'Read your own write',
      lang: 'js',
      code: `await User.updateOne({ _id: id }, { name });
const user = await User.findById(id).read('secondary');
res.json(user); // sometimes shows the old name`,
      err: [2],
      answer:
        'Replicas copy changes from the primary a moment later, so reading from one straight after a write can return the old data — the user sees their change “undone”. Read your own writes from the primary; send only reads that may be slightly stale to secondaries.',
    },
  ],

  explain: [
    'Why must servers be stateless before you can add more of them?',
    'What is the difference between scaling up and scaling out — and which would you try first?',
    'How can retrying failed requests make an outage worse, and how do you retry safely?',
  ],

  deeper: [
    {
      q: 'What exactly does a load balancer do?',
      a: 'It spreads incoming requests across several app servers, checks their health, and stops sending traffic to ones that fail. Many also handle HTTPS.',
    },
    {
      q: 'What does p95 mean?',
      a: 'The response time that 95% of requests beat. Averages hide the slow tail; p95 and p99 show what your unluckiest users feel. See [[percentile]].',
    },
    {
      q: 'What is the CAP theorem?',
      a: 'When a network split cuts a distributed database in two, it must choose between staying available and staying consistent. Real systems choose per operation — and when there is no split, they can usually have both.',
    },
    {
      q: 'When do microservices make sense?',
      a: 'When separate teams need to deploy independently, or one part needs very different scaling or reliability. Before that, one well-structured service is faster to build, test and run.',
    },
    {
      q: 'What is back-pressure?',
      a: 'Telling callers to slow down when you are full — queue limits, 429s, 503s — instead of accepting work until you collapse.',
    },
    {
      q: 'How do big sites survive a sudden spike?',
      a: 'CDNs and caches absorb most reads, autoscaling adds servers, queues smooth out writes, and non-essential features are switched off (graceful degradation) so the core keeps working.',
    },
  ],

  next: [
    { q: 'How would you know you are near the breaking point before users do?', chapter: 'observe' },
    { q: 'How do you do slow work later, reliably?', chapter: 'background' },
    { q: 'Why is each request slow in the first place?', chapter: 'fast' },
    { q: 'How would you design for millions from the start?', chapter: 'design' },
  ],
};

export default writing;
