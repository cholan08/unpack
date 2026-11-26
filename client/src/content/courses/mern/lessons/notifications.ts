import { box, chip, db, defineLesson, flow, link, patch } from '@/content/dsl';
import type { LinkSpec, NodeSpec } from '@/engine/types';

/* ---------- layout: your app (left) → a notify job (middle) → the delivery services (right) ---------- */
const app = box(170, 300, 'Your app', { sub: 'order #1042 shipped', icon: 'server', tone: 'server', w: 210 });
const job = box(470, 300, 'Notify job', { sub: 'background worker', icon: 'cpu', tone: 'server', w: 200 });
const emailP = box(800, 140, 'Email provider', { sub: 'Resend · Postmark · SES', icon: 'mail', tone: 'net', w: 240 });
const pushS = box(800, 300, 'Push service', { sub: 'APNs · FCM · Web Push', icon: 'phone', tone: 'net', w: 240 });
const sms = box(800, 460, 'SMS provider', { sub: 'Twilio · Vonage', icon: 'inbox', tone: 'net', w: 240 });
const inbox = db(470, 480, 'Notifications', { items: ['unread'], tone: 'data' });

const all: Record<string, NodeSpec> = { app, job, emailP, pushS, sms };
const allLinks: LinkSpec[] = [link('app', 'job'), link('job', 'emailP'), link('job', 'pushS'), link('job', 'sms')];

const sendCode = `// worker.js — runs in the background, never inside the request
import { email } from './email.js'; // one module wraps the provider's SDK

new Worker('notify', async (job) => {
  const order = await Order.findById(job.data.orderId).populate('customer');
  if (order.shippedEmailAt) return;                   // safe to run twice
  await email.send({
    to: order.customer.email,
    subject: \`Order \${order.number} is on its way\`,
    html: renderTemplate('shipped', { order }),
  });
  await Order.updateOne({ _id: order.id }, { shippedEmailAt: new Date() });
}, { connection: redis });`;

export default defineLesson({
  metrics: [
    { id: 'inbox', label: 'Lands in the inbox' },
    { id: 'perHour', label: 'Messages per person per hour', better: 'lower' },
    { id: 'consent', label: 'Respects preferences' },
  ],
  legend: { event: 'notification', data: 'saved record' },
  goals: [
    { text: 'Why you send email through a provider', step: 2 },
    { text: 'Sending from a background job', step: 3 },
    { text: 'How push notifications reach a closed app', step: 4 },
    { text: 'Consent, preferences and unsubscribe', step: 5 },
    { text: 'Avoiding notification storms', step: 6 },
  ],
  steps: [
    {
      short: 'Reach out',
      beat: 'setup',
      title: 'Reaching people outside your app',
      body: [
        'An order ships. The customer isn’t looking at your site — they are at work, asleep, on another app. To tell them, you need channels that reach people where they are: **email**, a **push notification** on their phone, an **SMS**, and a badge waiting in the app.',
        'Each channel is delivered by a service that specialises in it. Your job is deciding *what* to send, *to whom*, *when* — and doing it reliably.',
      ],
      metrics: { inbox: 'yes', perHour: 1, consent: 'yes' },
      scene: {
        nodes: all,
        links: allLinks,
        flows: [
          flow(['app', 'job'], { kind: 'data', label: 'order shipped', every: 6 }),
          flow(['job', 'emailP'], { kind: 'event', label: 'email', every: 6, offset: 1 }),
          flow(['job', 'pushS'], { kind: 'event', label: 'push', every: 6, offset: 1.4 }),
        ],
      },
    },
    {
      short: 'Own mail server',
      beat: 'problem',
      title: 'Sending email yourself lands in spam',
      body: [
        'You could send email straight from your server. But big inboxes trust senders by reputation: a new server’s IP address has none, often sits in a range known for spam, and lacks the DNS records that prove it may send for your domain. Your receipts land in spam — or nowhere.',
        'And sending inside the request makes checkout wait on a slow mail server.',
      ],
      metrics: { inbox: 'no', perHour: 1, consent: 'yes' },
      scene: {
        nodes: {
          app,
          smtp: box(470, 300, 'Your own mail server', { sub: 'new IP, no reputation', icon: 'server', tone: 'danger', w: 230, state: 'error' }),
          spam: chip(800, 300, 'Spam folder', { icon: 'ban', tone: 'danger' }),
        },
        links: [link('app', 'smtp'), link('smtp', 'spam', { state: 'error' })],
        flows: [flow(['app', 'smtp', 'spam'], { kind: 'err', label: ['send receipt', 'rejected / spam'], every: 4.6 })],
      },
    },
    {
      short: 'Provider + job',
      beat: 'solution',
      title: 'Use a provider — and send from a job',
      body: [
        'An email provider has the reputation, the infrastructure and the tools: you verify your domain once by adding **SPF**, **DKIM** and **DMARC** records to your DNS, then call their API with a key that stays on your server.',
        'Send from a **background job**, not the request: checkout answers instantly, a slow provider never blocks a customer, and failed sends are retried. Make the job safe to run twice, so a retry never sends two receipts.',
      ],
      code: { file: 'worker.js', lang: 'js', code: sendCode, hl: [6, 7, 12] },
      changes: ['- Your own mail server', '+ A provider with a verified domain', '+ Sending from a retried, safe-to-repeat job'],
      metrics: { inbox: 'yes', perHour: 1, consent: 'yes' },
      scene: {
        nodes: { app, job: { ...job, state: 'active' }, emailP: { ...emailP, state: 'ok', badge: { text: 'SPF · DKIM · DMARC', tone: 'ok' } } },
        links: [link('app', 'job'), link('job', 'emailP')],
        flows: [
          flow(['app', 'job'], { kind: 'data', label: 'job: order-shipped', every: 5 }),
          flow(['job', 'emailP'], { kind: 'event', label: 'send', back: 'res', backLabel: 'queued', every: 5, offset: 1 }),
        ],
      },
    },
    {
      short: 'Push',
      beat: 'technique',
      title: 'Push: how a closed app gets a message',
      body: [
        'A closed app holds no connection to your server. Instead, the phone’s operating system keeps one connection to its own **push service** — Apple’s APNs, Google’s FCM, or the browser’s Web Push service — and wakes the right app when a message arrives.',
        'So: the user grants permission, the app gives your server a **device token**, and to notify them your server sends the message *with that token* to the push service. Tokens change and expire — remove the ones the service rejects.',
      ],
      callout: { kind: 'picture', text: 'Your server can’t knock on the user’s door. It hands a letter to the postman who already visits that house every day — the phone’s push service.' },
      metrics: { inbox: 'yes', perHour: 1, consent: 'yes' },
      scene: {
        nodes: { app, job, pushS: { ...pushS, state: 'active' }, phone: chip(800, 450, 'Ana’s phone', { icon: 'phone', tone: 'client' }) },
        links: [link('app', 'job'), link('job', 'pushS'), link('pushS', 'phone')],
        flows: [flow(['job', 'pushS', 'phone'], { kind: 'event', label: ['token + “Shipped!”', 'wake app'], every: 4.6 })],
      },
    },
    {
      short: 'Consent',
      beat: 'technique',
      title: 'Ask first, and let people choose',
      body: [
        '**Transactional** messages — receipts, password resets, “your order shipped” — are expected. **Marketing** messages need consent, an easy unsubscribe link in every email, and respect for the laws where your users live.',
        'Store each person’s preferences (which channels, which topics, quiet hours) and check them before every send. Ask for push permission at a moment it obviously helps — not on the first screen.',
      ],
      code: { file: 'notify.js', lang: 'js', code: `const prefs = await Preferences.findOne({ user: userId });
const channels = ['email', 'push', 'sms'].filter((c) => prefs.allows(c, topic));
if (prefs.isQuietHours(now)) return queueForMorning(userId, message);`, hl: [2, 3] },
      metrics: { inbox: 'yes', perHour: 1, consent: 'yes' },
      scene: {
        nodes: patch(all, {
          prefs: db(470, 480, 'Preferences', { items: ['channels', 'quiet hours'], tone: 'data' }),
          sms: { state: 'dim', badge: { text: 'opted out', tone: 'neutral' } },
        }),
        links: [...allLinks, link('job', 'prefs')],
        flows: [
          flow(['job', 'prefs'], { kind: 'req', label: 'allowed?', back: 'data', backLabel: 'email + push', every: 5.4 }),
          flow(['job', 'emailP'], { kind: 'event', label: 'email', every: 5.4, offset: 1.8 }),
        ],
      },
    },
    {
      short: 'Storms',
      beat: 'problem',
      title: 'Fifty likes, fifty buzzes',
      body: [
        'A post goes viral. Every like sends a push: fifty buzzes in ten minutes. The user doesn’t feel delighted — they turn off notifications for your app, forever, and you have lost the channel.',
        'Group events instead: one *“Ana and 49 others liked your post”*, a daily **digest** for low-priority updates, rate limits per person, and quiet hours.',
      ],
      check: {
        q: 'Your app sends a push for every single like. A post gets 50 likes in ten minutes. What is the most likely result?',
        options: ['The user is thrilled', 'The user turns off your notifications — maybe for good', 'The push service merges them automatically', 'Nothing — phones limit it'],
        answer: 1,
        explain: 'Notification fatigue is the main way apps lose the push channel. Batch, summarise and rate-limit before you send.',
      },
      metrics: { inbox: 'yes', perHour: 50, consent: 'no' },
      scene: {
        nodes: { app: { ...app, sub: '50 likes in 10 min' }, job: { ...job, state: 'busy' }, pushS, phone: chip(800, 450, 'Ana’s phone', { icon: 'phone', tone: 'danger', state: 'error' }) },
        links: [link('app', 'job'), link('job', 'pushS'), link('pushS', 'phone', { state: 'error' })],
        flows: [
          flow(['app', 'job', 'pushS', 'phone'], { kind: 'event', label: ['like', 'push', 'buzz'], every: 1.2 }),
        ],
      },
    },
    {
      short: 'One record',
      beat: 'technique',
      title: 'One notification, many channels',
      body: [
        'Save every notification once, in your own database: who, what, when, read or not. That record feeds the **in-app** list and its unread badge, and the job decides which outside channels to use for it.',
        'Delivery services call you back with **webhooks** — delivered, bounced, unsubscribed. Mark addresses that bounce, and stop sending to them; mailbox providers judge you by how often you do.',
      ],
      metrics: { inbox: 'yes', perHour: 2, consent: 'yes' },
      scene: {
        nodes: { ...all, inbox: { ...inbox, state: 'active' } },
        links: [...allLinks, link('job', 'inbox')],
        flows: [
          flow(['job', 'inbox'], { kind: 'data', label: 'save notification', every: 6 }),
          flow(['job', 'emailP'], { kind: 'event', label: 'email', every: 6, offset: 1.2 }),
          flow(['emailP', 'job'], { kind: 'event', label: 'webhook: bounced', every: 6, offset: 3 }),
        ],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Reaching people, respectfully',
      body: [
        '{server:A background job} decides who gets what; {net:specialist providers} deliver email, push and SMS — with a verified domain and keys kept on the server.',
        'Every notification is {data:saved once} and feeds the in-app list; {ok:preferences and consent} are checked before each send; and events are {warn:grouped and rate-limited} so people never mute you.',
      ],
      metrics: { inbox: 'yes', perHour: 2, consent: 'yes' },
      scene: {
        nodes: { ...all, inbox },
        links: [...allLinks, link('job', 'inbox')],
        flows: [
          flow(['app', 'job'], { kind: 'data', label: 'event', every: 6 }),
          flow(['job', 'inbox'], { kind: 'data', label: 'save', every: 6, offset: 0.9 }),
          flow(['job', 'emailP'], { kind: 'event', label: 'email', every: 6, offset: 1.6 }),
          flow(['job', 'pushS'], { kind: 'event', label: 'push', every: 6, offset: 2.1 }),
        ],
      },
    },
  ],
});
