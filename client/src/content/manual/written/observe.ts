/**
 * Chapter: Know what’s happening (logging & monitoring).
 * Follows the model chapter, written/identity.ts.
 */
import type { ChapterWriting } from '../types';

const writing: ChapterWriting = {
  hook: {
    story: [
      'Your app is live. One morning a user writes: “Checkout didn’t work last night.” Which user? Which request? Was it everyone or just them, for a minute or for hours? Without records, you are guessing — and they have already left.',
      'Once your code runs on servers you can’t watch, the only way to know what it is doing is to have it tell you: what happened (logs), how much and how fast (metrics), where the time went (traces), and a tap on the shoulder when something is wrong (alerts).',
      'Your app breaks at 3 a.m. for one user on the other side of the world. How would you even find out?',
    ],
    predict: {
      q: 'Your average response time is a healthy 120 ms, yet users say the app is slow. How can both be true?',
      options: [
        'The users are wrong',
        'An average hides the slow tail — a few very slow requests barely move it',
        'The monitoring is broken',
        'Their internet connection is slow',
      ],
      answer: 1,
      reveal:
        'Averages hide pain. If most requests take 50 ms and one in twenty takes 3 seconds, the average still looks comfortable — while one request in twenty is awful. That is why teams watch [[percentile|percentiles]]: p95 and p99 show what the unluckiest users feel. Often they are your most valuable users — the ones with the most data.',
    },
  },

  idea: {
    lede: 'From a hobby app to a bank, knowing what your software is doing comes down to five jobs.',
    jobs: [
      {
        title: 'Record what happened',
        text: '[[structured-log|Structured logs]]: one JSON line per event with a time, a level, a [[request-id|request id]] and the facts — never passwords or tokens.',
      },
      {
        title: 'Count what matters',
        text: 'Metrics: how many requests, how many errors, how long they took (the [[red|RED]] method) — as percentiles, not averages.',
      },
      {
        title: 'Follow one request',
        text: '[[tracing|Traces]] stitch together every step of a single request — server, database, other services — so you can see where the time went.',
      },
      {
        title: 'Get told, not surprised',
        text: 'Alerts on symptoms users feel — error rate, slow p95, checkout failing — not on every blip of CPU.',
      },
      {
        title: 'Watch the browser too',
        text: 'Front-end errors and real users’ page speed — many failures never reach your server at all.',
      },
    ],
    picture:
      'A hospital ward. Each patient’s chart has a timed entry for everything that happened (logs). Monitors show heart rate and blood pressure as trends (metrics). When a patient moves between departments, a file travels with them so every doctor sees the whole story (traces). Alarms ring for dangerous readings, not every small wobble (alerts). And nurses still ask patients how they feel (front-end monitoring).',
  },

  lessonNotes: {
    observability: 'All five jobs: structured logs, RED metrics as percentiles, traces, alerts on symptoms, and eyes on the front end.',
  },

  options: {
    lede: 'You can assemble open-source tools or pay a platform to do it all. The signals are the same either way — logs, metrics, traces, errors — and they are most useful when they share a request id.',
    items: [
      {
        name: 'Your host’s logs and graphs',
        what: 'Most platforms show logs, CPU, memory and request counts out of the box.',
        pickWhen: 'Day one, and small apps.',
        cost: 'Short history, limited search, no traces.',
        examples: 'The Render, Railway, Vercel and Netlify dashboards',
      },
      {
        name: 'Error tracking',
        what: 'Captures exceptions from the server and the browser, with stack traces, the user’s last steps and the release they came from.',
        pickWhen: 'Every app with users — the most useful tool to add first.',
        cost: 'A small monthly fee, and care to keep personal data out.',
        examples: 'Sentry, Bugsnag, Rollbar',
      },
      {
        name: 'An open-source stack',
        what: 'Collect metrics, logs and traces with open tools you run yourself — or rent managed.',
        pickWhen: 'Teams that want control and no per-seat pricing.',
        cost: 'Setup and upkeep.',
        examples: 'OpenTelemetry to collect; Prometheus and Grafana for metrics; Loki or the ELK stack for logs; Jaeger or Tempo for traces',
        tools: ['prometheus', 'grafana', 'elk'],
      },
      {
        name: 'An all-in-one platform',
        what: 'One product for logs, metrics, traces, dashboards and alerts, all linked together.',
        pickWhen: 'Growing teams that want everything correlated without running it.',
        cost: 'Bills that grow quickly with the amount of data.',
        examples: 'Datadog, New Relic, Grafana Cloud, Honeycomb',
      },
      {
        name: 'Product analytics and real-user monitoring',
        what: 'What people actually do and experience: page speed in real browsers, funnels, which features get used.',
        pickWhen: 'Deciding what to fix or build next.',
        cost: 'Privacy: ask for consent, and collect no more than you need.',
        examples: 'PostHog, Plausible, the web-vitals library',
      },
    ],
    choose: [
      { when: 'A new app with its first users', pick: 'Your host’s logs, plus error tracking such as Sentry.' },
      { when: 'Slow requests you can’t explain, or several services', pick: 'OpenTelemetry traces sent to Grafana, Honeycomb or Datadog.' },
      { when: 'Dashboards and alerts under your control', pick: 'Prometheus and Grafana.' },
      { when: '“What should we build next?”', pick: 'Product analytics — with consent.' },
    ],
  },

  modern: {
    lede: 'AI is very good at reading logs and traces — if they exist and make sense. A stack trace with a request id, the user’s last steps and the release number can be diagnosed in minutes; a log that says `error: something went wrong` can’t be diagnosed by anyone. Make your app tell its story in a form you and your AI can read.',
    defaults: [
      'Structured JSON logs with a request id on every line — and no secrets or personal data.',
      'Error tracking on the server and in the browser, tagged with the release, with source maps uploaded.',
      'RED metrics per endpoint — rate, errors, and duration as p95 and p99 — on one dashboard.',
      'OpenTelemetry traces as soon as one request touches more than one service.',
      'A few alerts on symptoms users feel, each with a note on what to check first.',
      'A health check, plus an outside uptime monitor that calls it from another region.',
    ],
    aiGood: [
      'Adding structured logging and request ids to an app',
      'Reading a stack trace or a slow trace and proposing a cause',
      'Writing queries for logs and dashboards',
      'Drafting alert rules and the notes that go with them',
      'Turning logs into an incident timeline',
    ],
    aiWrong: [
      { mistake: 'Logs whole request bodies, passwords and tokens included.', fix: 'Log ids and facts; redact secrets and personal data.' },
      { mistake: 'Uses `console.log` strings everywhere.', fix: 'A structured logger (such as pino) with levels and fields.' },
      { mistake: 'Alerts on every single error, or on high CPU.', fix: 'Alert on symptoms users feel; review the rest on dashboards.' },
      { mistake: 'Reports averages.', fix: 'Percentiles: p95 and p99.' },
      { mistake: 'Swallows errors with an empty `catch`.', fix: 'Handle or rethrow — and report it.' },
      { mistake: 'Forgets the browser exists.', fix: 'Front-end error tracking and real-user metrics.' },
    ],
  },

  build: {
    title: 'Give the app eyes',
    brief: 'Make your bookmarks app observable: logs you can search, a request id that ties everything together, error tracking on server and browser, a small dashboard — and an alert that wakes you only when users are actually hurting.',
    byHand: [
      { title: 'Log like a machine', text: 'Replace `console.log` with pino: JSON lines with time, level, method, path, status and duration.', see: ['observability', 2] },
      { title: 'One id per request', text: 'Middleware gives each request an id (or reuses the load balancer’s), puts it on every log line and in the response headers.', see: ['observability', 2] },
      { title: 'Catch errors everywhere', text: 'Add Sentry (or similar) to the server and the React app, tag events with the release, and upload source maps.', see: ['observability', 6] },
      { title: 'Count what matters', text: 'Expose request rate, error rate and duration per route (for example with `prom-client`), and chart p95.', see: ['observability', 3] },
      { title: 'Follow a slow request', text: 'Add OpenTelemetry auto-instrumentation, and find the database call inside one slow request’s trace.', see: ['observability', 4] },
      { title: 'Alert on symptoms', text: 'One alert: error rate above 2% for 5 minutes, or p95 above 1 second. Write what to check first inside the alert.', see: ['observability', 5] },
      { title: 'Watch from outside', text: 'An uptime monitor that calls `/health` every minute from another region.' },
    ],
    withAI: {
      lede: 'Let your AI assistant wire it all up. The spec says exactly what to record — and, just as important, what must never be recorded.',
      prompt: `Add observability to my Express + MongoDB + React app.

Server
- Replace console.log with pino: JSON logs with time, level, requestId, method, path, status, durationMs. Redact authorization headers, cookies, passwords and tokens.
- Middleware that assigns a requestId (reusing x-request-id if present), adds it to every log line and to the response headers.
- Sentry for errors, with the release from an environment variable; the error handler reports the error and replies { error, requestId }.
- prom-client metrics: total requests, total errors, and a duration histogram labelled by route and status; expose /metrics.
- OpenTelemetry auto-instrumentation for Express and MongoDB, exporting over OTLP to an endpoint from an environment variable.

Client
- Sentry for React, with source maps uploaded at build time; web-vitals reported to my API.

Also write two alert rules (error rate > 2% for 5 minutes; p95 > 1 s for 10 minutes), each with a short "check this first" note.`,
    },
    verify: [
      'Every log line is JSON and carries a `requestId`.',
      'An error shown to a user includes a request id — and searching your logs for it finds the whole story.',
      'No password, token or cookie appears in any log.',
      'A deliberate error in the React app shows up in error tracking with a readable stack trace.',
      'Your dashboard shows p95 per route, not only averages.',
      'One slow request’s trace shows which database call took the time.',
      'The uptime monitor alerts you when you stop the server — and stays quiet otherwise.',
    ],
  },

  breakIt: [
    {
      title: 'Log everything',
      lang: 'js',
      code: `app.use((req, res, next) => {
  console.log('request', req.method, req.url, req.headers, req.body);
  next();
});`,
      err: [2],
      answer:
        'Every password, token and cookie that passes through now sits in your logs — read by many people, kept for months. And plain strings can’t be searched by field. Use a structured logger, record the method, path, status and request id, and redact anything sensitive.',
      see: ['observability', 2],
    },
    {
      title: 'The silent catch',
      lang: 'js',
      code: `try {
  await sendReceipt(order);
} catch (e) {}`,
      err: [3],
      answer:
        'If receipts start failing, nobody will ever know — not the customer, not you. Handle the error (retry, or queue it for later), or at least log and report it with the order id, so a pattern of failures shows up.',
    },
    {
      title: 'Alert on anything',
      lang: 'yaml',
      code: `- alert: AnyError
  expr: increase(http_errors_total[1m]) > 0
- alert: HighCpu
  expr: cpu_usage > 0.7`,
      err: [2, 4],
      answer:
        'These fire all day — one bot’s bad request, one busy minute — so people learn to ignore them, and then miss the real one. Alert on what users feel, sustained: an error *rate* above a few percent for several minutes, p95 too slow, checkout failing.',
      see: ['observability', 5],
    },
    {
      title: 'Speed, on average',
      lang: 'js',
      code: `const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
dashboard.show('Response time', \`\${avg.toFixed(0)} ms\`);`,
      err: [1],
      answer:
        'An average hides the slow tail — a few 5-second requests barely move it. Show percentiles instead: p50 for the typical user, p95 and p99 for the unlucky ones, usually from a histogram.',
      see: ['observability', 3],
    },
  ],

  explain: [
    'What are logs, metrics and traces each good for?',
    'Why do teams watch p95 rather than the average?',
    'Why should alerts fire on symptoms users feel, rather than on every error?',
  ],

  deeper: [
    {
      q: 'What is OpenTelemetry?',
      a: 'An open standard and set of libraries for collecting traces, metrics and logs from any language and sending them to any backend. Instrument once, and change tools without changing your code.',
    },
    {
      q: 'What is an SLO?',
      a: 'A service level objective: a target such as “99.9% of checkout requests succeed within a second, over 30 days”. It turns reliability into a number you can budget — and tells you when to stop shipping features and fix things.',
    },
    {
      q: 'What is an error budget?',
      a: 'What your SLO leaves over: 99.9% allows about 43 minutes of failure a month. Spend it on risky releases; when it is gone, slow down and stabilise.',
    },
    {
      q: 'How do teams handle an incident?',
      a: 'One person leads, one communicates, and everyone writes in one channel. Fix or roll back first, investigate later. Afterwards, a blameless review asks what in the *system* let it happen.',
    },
    {
      q: 'What is sampling?',
      a: 'Keeping only some traces — say one in ten, plus every error and every slow one — so you see the patterns without paying to store everything.',
    },
    {
      q: 'How can AI help during an incident?',
      a: 'By summarising logs and traces, spotting what changed (a deploy, a setting) and drafting the timeline. It can only work with the signals you collected — one more reason to log well.',
    },
  ],

  next: [
    { q: 'How do teams change code every day without breaking it?', chapter: 'testing' },
    { q: 'Once you know a bug exists, how do you find it?', chapter: 'debug' },
    { q: 'What do you do when the problem is too many users?', chapter: 'scale' },
    { q: 'How do you roll back a bad release?', chapter: 'ship' },
  ],
};

export default writing;
