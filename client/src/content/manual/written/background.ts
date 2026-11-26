/**
 * Chapter: Do work later (background jobs & queues).
 * Follows the model chapter, written/identity.ts.
 */
import type { ChapterWriting } from '../types';

const writing: ChapterWriting = {
  hook: {
    story: [
      'You upload a video and close the tab. Later, a notification: “Your video is ready.” You place an order; the receipt arrives a minute later. A report you asked for lands in your inbox overnight. None of it happened while you waited.',
      'Some work is too slow, too unreliable or too badly timed to do while someone waits for a page: converting files, sending emails, calling shaky services, nightly jobs. Doing it later — safely — is one of the most common building blocks in real products.',
      'When you upload a video, why can you close the page while it is still being processed?',
    ],
    predict: {
      q: 'Your API sends the welcome email inside the sign-up request, and today the email provider takes 8 seconds. What do new users experience?',
      options: [
        'Nothing — emails are instant',
        'Sign-up takes 8+ seconds — and fails completely if the provider is down',
        'The email is skipped',
        'The browser sends the email instead',
      ],
      answer: 1,
      reveal:
        'The whole sign-up waits for the slowest thing it touches, and if the provider is down, sign-up fails — for a feature that could easily have waited a minute. Put the email on a [[job-queue|queue]]: sign-up answers in milliseconds, and a [[worker]] sends the email, retrying while the provider struggles.',
    },
  },

  idea: {
    lede: 'Video processing, emails, reports, imports, AI summaries — doing work later always takes the same five jobs.',
    jobs: [
      {
        title: 'Answer now, promise later',
        text: 'Save what you need, put a job on a queue, and answer straight away — often with `202 Accepted`.',
      },
      {
        title: 'Keep the jobs safe',
        text: 'The queue lives outside your web process — in Redis, a database or a cloud queue — so jobs survive restarts and deploys.',
      },
      {
        title: 'Do the work elsewhere',
        text: 'Workers, running as separate processes, take jobs and do them at their own pace — and you scale them on their own.',
      },
      {
        title: 'Expect failure',
        text: 'Retry with backoff, give up after a few attempts, and keep failed jobs where a person can see them (a [[dead-letter|dead-letter queue]]).',
      },
      {
        title: 'Be safe to repeat',
        text: 'Queues deliver *at least* once, so every job checks before acting and records what it did.',
      },
    ],
    picture:
      'A restaurant’s order rail. The waiter takes your order and tells you it is coming (answer now), clips the ticket on the rail where it won’t get lost (the queue), and the cooks take tickets one by one (workers). A burnt dish is remade (a retry); a ticket nobody can make goes to the manager (the dead-letter queue). And a cook glances at the ticket to check it isn’t already done before starting it again (safe to repeat).',
  },

  lessonNotes: {
    'background-jobs': 'All five jobs: 202 Accepted, queues and workers, retries with backoff, jobs that are safe to run twice, and schedules.',
  },

  options: {
    lede: 'Choose by how much you need: a little delayed work, a real job system, or events flowing between many services.',
    items: [
      {
        name: 'A Redis-backed job library',
        what: 'A library that keeps jobs in Redis, with workers written in your own codebase.',
        pickWhen: 'Most Node apps: emails, processing, scheduled jobs.',
        cost: 'Redis to run, and workers to deploy beside your API.',
        examples: 'BullMQ (Node), Sidekiq (Ruby), Celery (Python)',
        tools: ['redis'],
      },
      {
        name: 'A database-backed queue',
        what: 'Jobs stored in the database you already have.',
        pickWhen: 'Modest volume, when you would rather not add Redis.',
        cost: 'More load on your database, and lower throughput.',
        examples: 'Agenda (MongoDB); pg-boss and Graphile Worker (PostgreSQL)',
        tools: ['mongodb', 'postgresql'],
      },
      {
        name: 'A managed cloud queue',
        what: 'The provider runs the queue; your workers poll it, or are triggered by it.',
        pickWhen: 'You are already on that cloud, or want no queue servers to manage.',
        cost: 'Tied to the provider; local development needs an emulator.',
        examples: 'Amazon SQS, Google Cloud Tasks, Azure Queue Storage',
        tools: ['amazon-sqs', 'aws'],
      },
      {
        name: 'A background-job platform',
        what: 'A hosted service that runs your job functions, with retries, schedules and a dashboard.',
        pickWhen: 'Serverless apps without long-running workers.',
        cost: 'Another vendor, priced per run.',
        examples: 'Inngest, Trigger.dev; scheduled functions on Vercel or Netlify',
      },
      {
        name: 'An event stream',
        what: 'An ordered, replayable log of events that many services read at their own pace.',
        pickWhen: 'Large systems where many consumers need the same events.',
        cost: 'Significant design and operations effort.',
        examples: 'Kafka, Redpanda, Amazon Kinesis',
        tools: ['kafka'],
      },
    ],
    choose: [
      { when: 'A Node app that needs emails and processing in the background', pick: 'BullMQ on Redis.' },
      { when: 'Low volume, and no Redis', pick: 'A database-backed queue.' },
      { when: 'Serverless hosting', pick: 'A background-job platform, or your cloud’s own queue.' },
      { when: 'Many services consuming the same events', pick: 'An event stream such as Kafka — rarely needed early.' },
    ],
  },

  modern: {
    lede: 'Background work is where hidden bugs live: the job that runs twice, the email at 3 a.m., the retry storm against a struggling provider. AI writes queue code easily, but it rarely makes jobs safe to repeat, or decides what happens after the last retry, unless you ask.',
    defaults: [
      'Anything slower than about a second, or calling an unreliable service, becomes a background job.',
      'Jobs carry ids, not whole objects; the worker loads fresh data.',
      'Retries with exponential backoff, a maximum number of attempts, and a failed list someone checks.',
      'Every job is safe to run twice: check, act, record.',
      'Scheduled jobs fire once, from one place, and simply add jobs to the queue.',
      'Watch queue length and failures, and alert when they grow.',
    ],
    aiGood: [
      'Setting up queues, workers and schedules',
      'Splitting slow request code into a producer and a job',
      'Choosing retry and backoff settings',
      'Making a job safe to repeat',
      'Building a small admin view of failed jobs',
    ],
    aiWrong: [
      { mistake: 'Runs slow work with `setTimeout`, or an un-awaited promise, inside the web process.', fix: 'A real queue — work in the web process is lost on every restart.' },
      { mistake: 'Puts whole documents in the job.', fix: 'Pass ids; load fresh data in the worker.' },
      { mistake: 'Retries forever, immediately.', fix: 'Backoff, a maximum, then the failed list.' },
      { mistake: 'Assumes each job runs exactly once.', fix: 'Check before acting, record after.' },
      { mistake: 'Schedules cron on every server instance.', fix: 'One scheduler — or the queue’s own scheduling.' },
      { mistake: 'Never looks at failed jobs.', fix: 'Alert on failures and on a growing queue.' },
    ],
  },

  build: {
    title: 'Move the slow parts out',
    brief: 'Find everything in your bookmarks app that makes a request slow or fragile — screenshots, emails, AI summaries — and move it into background jobs that retry, never run twice by accident, and tell the user when they are done.',
    byHand: [
      { title: 'Find the slow parts', text: 'Time your routes. Anything over a second, or calling an outside service, is a candidate.', see: ['background-jobs', 1] },
      { title: 'A queue and a worker', text: 'Add Redis and BullMQ: a `jobs` queue, and a separate `worker.js` process.', see: ['background-jobs', 4] },
      { title: 'Answer at once', text: 'The routes now save, add a job carrying just an id, and answer `202`.', see: ['background-jobs', 3] },
      { title: 'Retries', text: 'Five attempts with exponential backoff, and failed jobs kept for inspection.', see: ['background-jobs', 5] },
      { title: 'Safe twice', text: 'Each job checks a `doneAt` field before acting, and sets it afterwards.', see: ['background-jobs', 6] },
      { title: 'Tell the user', text: 'A `status` field the page checks (or gets live) until it says *ready*.', see: ['background-jobs', 7] },
      { title: 'A nightly job', text: 'Every night at 03:00, delete screenshots of deleted bookmarks — scheduled once, not on every server.', see: ['background-jobs', 8] },
    ],
    withAI: {
      lede: 'Let your AI assistant do the moving — and make it explain, for every job, what happens if the worker dies halfway.',
      prompt: `Move slow work in my Express + Mongoose app into background jobs with BullMQ and Redis.

1. Look at these routes (I'll paste them) and list every slow or fragile operation (over 1 s, or calling an external service).
2. For each: the route saves state, adds a job carrying only ids, and responds 202 with a status field.
3. A worker.js process handles the jobs with attempts: 5, exponential backoff starting at 2 s, removeOnComplete, and failed jobs kept.
4. Every job is idempotent: check a doneAt/sentAt field before acting, set it after.
5. One scheduled job (03:00 daily) for clean-up, registered once — not on every API instance.
6. A small, protected admin route listing failed jobs with a retry button.

For each job, explain what happens if the worker crashes halfway through.`,
    },
    verify: [
      'The routes you moved now answer in under 200 ms.',
      'Stop the worker, make some requests, start it again: the jobs run then — nothing is lost.',
      'Make the outside service fail: the job retries with growing delays, then lands in the failed list.',
      'Kill the worker right after an email is sent: the retry doesn’t send a second one.',
      'The page shows *processing*, then *ready*, without you refreshing.',
      'With two API instances running, the 03:00 job still runs once.',
      'You can see the failed jobs, and retry one.',
    ],
  },

  breakIt: [
    {
      title: 'Later, in memory',
      lang: 'js',
      code: `app.post('/api/videos', async (req, res) => {
  const video = await Video.create(req.body);
  setTimeout(() => transcode(video), 0); // do it later
  res.status(202).json(video);
});`,
      err: [3],
      answer:
        'The work still runs inside the web process: it competes with requests, and if the server restarts or redeploys mid-transcode, it is gone — no record, no retry. Put a job on a real queue that lives outside the process.',
      see: ['background-jobs', 3],
    },
    {
      title: 'A job full of data',
      lang: 'js',
      code: `await jobs.add('send-invoice', { order: order.toObject(), customer: user.toObject() });`,
      err: [1],
      answer:
        'The job carries a snapshot. If the order changes before the worker runs, the invoice is wrong — and the queue fills up with large, possibly private data. Pass ids (`{ orderId }`) and let the worker load fresh data.',
    },
    {
      title: 'Try, try, try again',
      lang: 'js',
      code: `await jobs.add('sync-crm', { leadId }, { attempts: 1000, backoff: { type: 'fixed', delay: 100 } });`,
      err: [1],
      answer:
        'When the CRM is down, every job hammers it ten times a second for minutes — a retry storm that can keep it down. Use a few attempts with exponential backoff, and let hopeless jobs go to the failed list.',
      see: ['background-jobs', 5],
    },
    {
      title: 'A schedule per server',
      lang: 'js',
      code: `// server.js — runs on each of 3 instances
cron.schedule('0 9 * * 1', () => sendWeeklyDigest());`,
      err: [2],
      answer:
        'Three instances, three schedules: every user gets the weekly digest three times. Run schedules in one place — a single scheduler process, the queue’s own scheduling, or your host’s cron — and make the job safe to run twice anyway.',
      see: ['background-jobs', 8],
    },
  ],

  explain: [
    'Why does slow work belong in a background job rather than in the request?',
    'What does “at least once” delivery mean for how you write a job?',
    'What should happen to a job that keeps failing?',
  ],

  deeper: [
    {
      q: 'What is the outbox pattern?',
      a: 'Save the database change and the message to send in the same transaction (an “outbox” table); a relay then pushes it to the queue. You never save without queuing, or queue without saving.',
    },
    {
      q: 'How do I give some jobs priority?',
      a: 'Use separate queues — urgent (password resets) and bulk (newsletters) — each with its own workers, so a big batch never delays an urgent email.',
    },
    {
      q: 'What does concurrency mean for a worker?',
      a: 'How many jobs one worker runs at the same time. Jobs that mostly wait (emails, API calls) can run many at once; CPU-heavy jobs (video) should run about one per CPU core.',
    },
    {
      q: 'How do multi-step workflows survive crashes?',
      a: 'Chain jobs (step one adds step two), or use a durable workflow engine that records each step’s result, so a crash resumes where it stopped — Temporal and Inngest work this way.',
    },
    {
      q: 'Why not use serverless functions for everything?',
      a: 'They have time limits and no long-running process. Minutes-long work like video conversion needs a worker, a dedicated service, or a platform built for long jobs.',
    },
    {
      q: 'How do I test background jobs?',
      a: 'Call the job’s function directly in unit tests; in integration tests, run a worker against a test Redis and wait for the job’s result.',
    },
  ],

  next: [
    { q: 'How do you tell people when the work is done?', chapter: 'notify' },
    { q: 'What happens when thousands of jobs arrive at once?', chapter: 'scale' },
    { q: 'How do you take a payment and fulfil the order afterwards?', chapter: 'payments' },
    { q: 'How do you notice failed jobs before users do?', chapter: 'observe' },
  ],
};

export default writing;
