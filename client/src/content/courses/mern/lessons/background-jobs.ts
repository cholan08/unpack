import { box, browser, chip, db, defineLesson, flow, item, link, patch, queue } from '@/content/dsl';
import type { LinkSpec, NodeSpec, ScreenLine } from '@/engine/types';

/* ---------- layout: the page (left) → your API (middle) → queue → workers and data (right) ---------- */
const waiting: ScreenLine[] = [{ t: 'h', text: 'Upload video' }, { t: 'spinner', text: 'Uploading…' }];
const timedOut: ScreenLine[] = [{ t: 'h', text: 'Upload video' }, { t: 'error', text: 'Request timed out' }];
const accepted: ScreenLine[] = [{ t: 'h', text: 'Upload video' }, { t: 'ok', text: 'Uploaded' }, { t: 'text', text: 'Processing…' }];
const ready: ScreenLine[] = [{ t: 'h', text: 'My videos' }, { t: 'item', text: 'Holiday.mp4 · ready' }];

const web = browser(150, 300, { url: 'myvideos.app/upload', screen: waiting, w: 240, h: 190 });
const api = box(470, 300, 'Your API', { sub: 'POST /api/videos', icon: 'server', tone: 'server', w: 210 });
const store = db(830, 230, 'MongoDB', { items: ['videos'], tone: 'data' });
const jobs = (items: ReturnType<typeof item>[]) => queue(470, 480, 'Job queue', items, { w: 300, tone: 'warn', sub: 'Redis · BullMQ', mono: true, empty: 'empty' });
const worker = box(830, 460, 'Worker', { sub: 'separate process', icon: 'cpu', tone: 'server', w: 200 });
const mail = box(830, 340, 'Email service', { sub: 'sends emails', icon: 'mail', tone: 'net', w: 200 });

const queued: Record<string, NodeSpec> = { web: { ...web, screen: accepted }, api, store, jobs: jobs([item('j42', 'transcode #42')]), worker };
const queuedLinks: LinkSpec[] = [link('web', 'api'), link('api', 'jobs'), link('jobs', 'worker'), link('worker', 'store'), link('api', 'store')];

const producerCode = `import { Queue } from 'bullmq';
const videoJobs = new Queue('video', { connection: redis });

app.post('/api/videos', requireAuth, upload, async (req, res) => {
  const video = await Video.create({ owner: req.user.id, key: req.file.key, status: 'processing' });
  await videoJobs.add('transcode', { videoId: video.id });
  res.status(202).json(video); // "accepted — working on it"
});`;

const workerCode = `import { Worker } from 'bullmq';

new Worker('video', async (job) => {
  const video = await Video.findById(job.data.videoId);
  await transcode(video.key);          // minutes of CPU work
  await makeThumbnail(video.key);
  await Video.updateOne({ _id: video.id }, { status: 'ready' });
}, { connection: redis, concurrency: 2 });`;

export default defineLesson({
  metrics: [
    { id: 'ms', label: 'Upload response', unit: 'ms', better: 'lower' },
    { id: 'survives', label: 'Work survives a restart' },
    { id: 'dupes', label: 'Duplicate emails', better: 'lower' },
  ],
  legend: { data: 'job', event: 'worker takes a job' },
  goals: [
    { text: 'Why slow work doesn’t belong in a request', step: 2 },
    { text: 'Queues and the 202 Accepted pattern', step: 3 },
    { text: 'Workers, retries and backoff', step: 4 },
    { text: 'Jobs that are safe to run twice', step: 6 },
    { text: 'Scheduled jobs', step: 8 },
  ],
  steps: [
    {
      short: 'Slow work',
      beat: 'setup',
      title: 'Some work takes minutes',
      body: [
        'A user uploads a video. Before it can be watched, it must be converted into several sizes, given a thumbnail, and the user should get an email when it is ready. That is minutes of work.',
        'The first version does all of it inside the upload request — and the browser waits.',
      ],
      metrics: { ms: 45000, survives: 'no', dupes: 0 },
      scene: {
        nodes: { web, api: { ...api, state: 'busy', sub: 'transcoding…', meter: 0.95 }, store },
        links: [link('web', 'api'), link('api', 'store')],
        flows: [flow(['web', 'api'], { kind: 'req', label: 'upload 300 MB', every: 6, dwell: 2 })],
      },
    },
    {
      short: 'Timed out',
      beat: 'problem',
      title: 'The request times out, and the work is lost',
      body: [
        'Proxies and hosts cut requests off after 30–60 seconds. The browser shows an error, the user clicks *Upload* again — and now two copies are being processed. If the server restarts mid-way (a deploy, a crash), the work simply vanishes.',
        'And while it grinds, that server answers everyone else more slowly.',
      ],
      metrics: { ms: 60000, survives: 'no', dupes: 0 },
      scene: {
        nodes: { web: { ...web, screen: timedOut, state: 'error' }, api: { ...api, state: 'error', sub: 'busy for 45 s', badge: { text: 'restart = work lost', tone: 'danger' } }, store },
        links: [link('web', 'api', { state: 'error' }), link('api', 'store')],
        flows: [flow(['web', 'api'], { kind: 'req', label: 'upload (again)', back: 'err', backLabel: '504 timeout', every: 5 })],
      },
    },
    {
      short: 'Queue it',
      beat: 'solution',
      title: 'Answer now, do the work later',
      body: [
        'Split it in two. The request saves the video record with `status: \'processing\'`, puts a **job** on a [[job-queue|queue]], and answers at once with **202 Accepted**. The slow part happens elsewhere.',
        'The queue lives in Redis (or a managed service), so jobs survive restarts: if nothing is running, they simply wait.',
      ],
      code: { file: 'routes/videos.js', lang: 'js', code: producerCode, hl: [5, 6, 7] },
      changes: ['- Transcoding inside the request', '+ A job on a queue', '+ 202 Accepted in milliseconds'],
      metrics: { ms: 120, survives: 'yes', dupes: 0 },
      scene: {
        nodes: queued,
        links: queuedLinks,
        flows: [
          flow(['web', 'api'], { kind: 'req', label: 'upload', back: 'res', backLabel: '202 Accepted', every: 5 }),
          flow(['api', 'jobs'], { kind: 'data', label: 'transcode #42', every: 5, offset: 0.9 }),
        ],
      },
    },
    {
      short: 'Workers',
      beat: 'technique',
      title: 'Workers drain the queue',
      body: [
        'A [[worker]] is a separate process that takes jobs from the queue one by one (or a few at a time) and does them. Your API stays fast because it never does the heavy lifting.',
        'Busy day? Run more workers. Quiet night? Fewer. The queue absorbs the spikes, and the work proceeds at a steady pace.',
      ],
      code: { file: 'worker.js', lang: 'js', code: workerCode, hl: [3, 5, 8] },
      metrics: { ms: 120, survives: 'yes', dupes: 0 },
      scene: {
        nodes: {
          ...queued,
          jobs: jobs([item('j42', '#42', { state: 'active' }), item('j43', '#43'), item('j44', '#44')]),
          worker: { ...worker, y: 430, state: 'busy' },
          worker2: box(830, 540, 'Worker 2', { sub: 'same code', icon: 'cpu', tone: 'server', w: 200, state: 'busy' }),
        },
        links: [...queuedLinks, link('jobs', 'worker2')],
        flows: [
          flow(['jobs', 'worker'], { kind: 'event', label: 'take #42', every: 4.4 }),
          flow(['jobs', 'worker2'], { kind: 'event', label: 'take #43', every: 4.4, offset: 2.2 }),
        ],
      },
    },
    {
      short: 'Retries',
      beat: 'technique',
      title: 'Failures: retry with backoff, then park it',
      body: [
        'Jobs fail — a storage hiccup, an email provider timing out. A queue retries them for you, waiting longer each time (**exponential backoff**: 2 s, 4 s, 8 s…) so a struggling service gets room to recover.',
        'After the last attempt, the job goes to a **failed list** (a [[dead-letter|dead-letter queue]]) where you can inspect and re-run it — instead of retrying forever or losing it silently.',
      ],
      code: { file: 'routes/videos.js', lang: 'js', code: `await videoJobs.add('transcode', { videoId }, {
  attempts: 5,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: true,
});`, hl: [2, 3] },
      metrics: { ms: 120, survives: 'yes', dupes: 0 },
      scene: {
        nodes: patch(queued, {
          jobs: jobs([item('j42', '#42 retry 2', { state: 'error' }), item('j43', '#43')]),
          worker: { state: 'error', badge: { text: 'storage timeout', tone: 'danger' } },
        }),
        links: queuedLinks,
        flows: [flow(['jobs', 'worker'], { kind: 'event', label: '#42 attempt 2', back: 'err', backLabel: 'failed — retry in 4 s', every: 4.6 })],
      },
    },
    {
      short: 'Twice',
      beat: 'problem',
      title: 'A job can run twice',
      body: [
        'Queues promise *at least once*, not *exactly once*. If a worker sends the “your video is ready” email and then crashes before the job is marked done, the job is retried — and the email goes out again.',
        'So every job must be **safe to run twice**: check before you act, and record what you did.',
      ],
      check: {
        q: 'A worker sends the welcome email, then crashes before the job is marked complete. The queue retries the job. What happens?',
        options: ['Nothing — the queue knows the email was sent', 'The email is sent a second time', 'The job is deleted', 'The queue stops'],
        answer: 1,
        explain: 'The queue only knows the job didn’t finish. Unless the job checks first (e.g. `if (video.emailSentAt) return`), the email goes out again.',
      },
      code: { file: 'worker.js', lang: 'js', code: `// ✅ safe to run twice
const video = await Video.findById(job.data.videoId);
if (video.emailSentAt) return;                     // already done
await email.send(video.owner, 'Your video is ready');
await Video.updateOne({ _id: video.id }, { emailSentAt: new Date() });`, hl: [3, 5] },
      metrics: { ms: 120, survives: 'yes', dupes: 1 },
      scene: {
        nodes: { jobs: jobs([item('j42', 'email #42 again', { state: 'error' })]), worker: { ...worker, state: 'error', badge: { text: 'crashed after send', tone: 'danger' } }, mail, store },
        links: [link('jobs', 'worker'), link('worker', 'mail'), link('worker', 'store')],
        flows: [
          flow(['jobs', 'worker'], { kind: 'event', label: 'retry #42', every: 4.8 }),
          flow(['worker', 'mail'], { kind: 'err', label: 'same email, again', every: 4.8, offset: 1.2 }),
        ],
      },
    },
    {
      short: 'Tell the user',
      beat: 'technique',
      title: 'Let the user know when it’s done',
      body: [
        'The job updates the record — `processing` → `ready` (or `failed`). The page can **poll** `GET /api/videos/42` every few seconds, get a live update over a WebSocket, or the user can get an email or a notification.',
        'Whatever you choose, the database is the truth: reload the page and it still says *ready*.',
      ],
      metrics: { ms: 120, survives: 'yes', dupes: 0 },
      scene: {
        nodes: patch(queued, { web: { screen: ready, state: 'ok' }, jobs: jobs([]), worker: { state: 'ok' } }),
        links: queuedLinks,
        flows: [
          flow(['worker', 'store'], { kind: 'data', label: 'status: ready', every: 5 }),
          flow(['web', 'api', 'store'], { kind: 'req', label: ['GET /api/videos/42', 'find'], back: 'res', backLabel: ['ready', 'ready'], every: 5, offset: 1.4 }),
        ],
      },
    },
    {
      short: 'Schedules',
      beat: 'technique',
      title: 'Jobs on a schedule',
      body: [
        'Some work runs on a clock, not on a click: a nightly report, deleting abandoned uploads, renewing subscriptions. A [[cron]] expression says when: `0 3 * * *` means every day at 03:00.',
        'With several servers, make sure each schedule fires **once** — let the queue own the schedule, or use your host’s cron jobs — and have it simply add a job to the queue like everything else.',
      ],
      code: { file: 'schedule.js', lang: 'js', code: `import cron from 'node-cron';

// every day at 03:00 — run this in ONE process only
cron.schedule('0 3 * * *', () => {
  maintenanceJobs.add('delete-abandoned-uploads', {});
});`, hl: [4, 5] },
      metrics: { ms: 120, survives: 'yes', dupes: 0 },
      scene: {
        nodes: {
          clock: chip(470, 150, '0 3 * * *', { icon: 'clock', tone: 'warn' }),
          jobs: jobs([item('c1', 'cleanup')]),
          worker,
          store,
        },
        links: [link('clock', 'jobs'), link('jobs', 'worker'), link('worker', 'store')],
        flows: [flow(['clock', 'jobs', 'worker', 'store'], { kind: 'data', label: ['03:00', 'take job', 'delete old uploads'], every: 5 })],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Doing work later, safely',
      body: [
        '{server:The request} answers fast with 202; {warn:the queue} holds the job, even through restarts; {server:workers} do the slow part at their own pace and scale on their own.',
        'Failures are {ok:retried with backoff} and parked when hopeless; every job is {auth:safe to run twice}; and {data:the database} tells the user when it’s done.',
      ],
      metrics: { ms: 120, survives: 'yes', dupes: 0 },
      scene: {
        nodes: { ...queued, worker: { ...worker, y: 470 }, mail: { ...mail, y: 350 } },
        links: [...queuedLinks, link('worker', 'mail')],
        flows: [
          flow(['web', 'api'], { kind: 'req', label: 'upload', back: 'res', backLabel: '202', every: 6 }),
          flow(['api', 'jobs', 'worker'], { kind: 'data', label: ['job', 'take'], every: 6, offset: 1 }),
          flow(['worker', 'mail'], { kind: 'event', label: 'ready!', every: 6, offset: 3 }),
        ],
      },
    },
  ],
});
