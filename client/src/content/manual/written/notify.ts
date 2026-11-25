/**
 * Chapter: Reach people (notifications).
 * Follows the model chapter, written/identity.ts.
 */
import type { ChapterWriting } from '../types';

const writing: ChapterWriting = {
  hook: {
    story: [
      'Your password-reset email never arrives. The delivery app tells you the rider is outside — three minutes after they left. Another app buzzes forty times a day until you switch it off forever. Notifications done badly are worse than none.',
      'Reaching people outside your app — by email, push, SMS or a badge inside the app — means handing messages to services that specialise in delivery, sending the right message at the right moment, and respecting people’s attention and choices.',
      'How does an app reach you when it isn’t even open?',
    ],
    predict: {
      q: 'Your password-reset emails land in spam. What is the most likely cause?',
      options: [
        'The emails are too long',
        'Your domain isn’t verified for sending (no SPF, DKIM, DMARC) — or you send from a server with no reputation',
        'Users typed their addresses wrong',
        'Spam filters block every reset email',
      ],
      answer: 1,
      reveal:
        'Mailbox providers decide by reputation and proof. Sending from your own server’s address, or from a domain without SPF, DKIM and DMARC records, looks exactly like spam. A reputable email provider plus a verified domain fixes most of it — and sending only mail people expect keeps it fixed.',
    },
  },

  idea: {
    lede: 'Email, push, SMS, in-app badges — every notification system does the same five jobs.',
    jobs: [
      {
        title: 'Decide what’s worth sending',
        text: 'Messages people expect — receipts, resets, “your order shipped” — versus everything else. When in doubt, don’t.',
      },
      {
        title: 'Hand it to a specialist',
        text: 'Email providers, the phone’s own push service, SMS gateways: they have the reputation and the infrastructure. Your server calls them with keys it keeps.',
      },
      {
        title: 'Send in the background',
        text: 'From a job, never inside the request — retried if the provider is slow, and safe to run twice.',
      },
      {
        title: 'Respect the person',
        text: 'Consent, preferences per channel and topic, unsubscribe links, quiet hours — checked before every send.',
      },
      {
        title: 'Group and limit',
        text: 'Turn bursts into one message, send digests for low-priority updates, and rate-limit per person.',
      },
    ],
    picture:
      'A good assistant who passes on your messages. They know what matters enough to interrupt you (decide), use the post office and the phone company instead of delivering by hand (specialists), don’t keep you waiting at your desk while they do it (background), follow your rules about when not to disturb you (respect), and bring one note about fifty small things instead of fifty interruptions (group).',
  },

  lessonNotes: {
    notifications: 'All five jobs: why email goes through a provider, sending from a job, how push reaches a closed app, consent and preferences, and avoiding storms.',
  },

  options: {
    lede: 'Each channel has its strengths. Most products use two or three, chosen per message — urgent and personal, or routine and skippable.',
    items: [
      {
        name: 'Email',
        what: 'Sent through a provider’s API, from a verified domain.',
        pickWhen: 'Receipts, resets, summaries — anything people may want to keep or search.',
        cost: 'Deliverability work (SPF, DKIM, DMARC, bounces), and no instant attention.',
        examples: 'Resend, Postmark, Amazon SES, SendGrid, Mailgun',
      },
      {
        name: 'Push notifications',
        what: 'Through Apple’s (APNs), Google’s (FCM) or the browser’s push service, to an app or site the person allowed.',
        pickWhen: 'Timely updates for people who installed your app: deliveries, messages, reminders.',
        cost: 'Needs permission, is easy to overuse, and device tokens must be kept fresh.',
        examples: 'FCM, APNs, Web Push, Expo Notifications, OneSignal',
        tools: ['react-native', 'pwa'],
      },
      {
        name: 'SMS and WhatsApp',
        what: 'Texts through a gateway; WhatsApp through its business platform, with approved templates.',
        pickWhen: 'Codes, critical alerts — and countries where people live in WhatsApp.',
        cost: 'A price per message, sender registration rules per country, and SMS codes can be intercepted.',
        examples: 'Twilio, Vonage, MessageBird, the WhatsApp Business Platform',
      },
      {
        name: 'In-app notifications',
        what: 'A list and an unread badge inside your app, from your own database.',
        pickWhen: 'Always — it is the record every other channel points back to.',
        cost: 'Only seen when people open the app.',
        examples: 'Your own collection with live updates; Knock or Novu as a service',
      },
      {
        name: 'A notification platform',
        what: 'One API that routes each message to the right channels, with templates, preferences and digests.',
        pickWhen: 'Many kinds of notification across many channels, without building the routing yourself.',
        cost: 'Another vendor, priced per message.',
        examples: 'Knock, Novu, Courier, OneSignal',
      },
    ],
    choose: [
      { when: 'Receipts, resets, anything to keep', pick: 'Email through a provider.' },
      { when: 'Time-sensitive updates in a mobile app', pick: 'Push — with permission asked at the right moment.' },
      { when: 'One-time codes or urgent alerts', pick: 'SMS or WhatsApp, sparingly.' },
      { when: 'Every notification', pick: 'An in-app record as well.' },
      { when: 'Many types across many channels', pick: 'A notification platform.' },
    ],
  },

  modern: {
    lede: 'AI makes it trivial to send more — personalised emails, generated digests, a nudge for every event. That makes restraint the modern skill: send less, make each message earn its interruption, and let people choose. The technical rules haven’t changed: verified domains, background jobs, consent.',
    defaults: [
      'A verified sending domain (SPF, DKIM, DMARC) with a reputable provider.',
      'All sending from background jobs that are safe to run twice.',
      'One notification record in your database, fanned out to channels by preference.',
      'Consent, and an unsubscribe link, for anything that isn’t transactional.',
      'Batching, digests, quiet hours and per-person rate limits.',
      'Bounce and complaint webhooks handled — stop sending to addresses that fail.',
    ],
    aiGood: [
      'Writing short, clear notification and email copy',
      'Building email templates that work in every mail app',
      'Wiring providers, webhooks and preference checks',
      'Designing a digest from many events',
      'Explaining a deliverability problem from headers or reports',
    ],
    aiWrong: [
      { mistake: 'Sends email from inside the request handler.', fix: 'Queue it, and send from a job.' },
      { mistake: 'Sends through your own mail server, or a free mailbox account.', fix: 'A provider and a verified domain.' },
      { mistake: 'Sends a notification for every event.', fix: 'Group, digest and rate-limit.' },
      { mistake: 'Skips preference checks “because it’s transactional”, then drifts into marketing.', fix: 'Classify each message, and check preferences before every send.' },
      { mistake: 'Asks for push permission on the first screen.', fix: 'Ask when the benefit is obvious.' },
      { mistake: 'Puts codes or personal details in push text, visible on the lock screen.', fix: 'Keep notifications short; show details inside the app.' },
    ],
  },

  build: {
    title: 'Updates on every channel',
    brief: 'When a bookmark list someone follows changes — or, for a shop, when an order ships — notify them by email, push and in-app, according to their preferences, never twice and never in a flood.',
    byHand: [
      { title: 'One notification record', text: 'A `Notification` collection — user, type, data, read, createdAt — the source of truth for the in-app list.', see: ['notifications', 7] },
      { title: 'Verified email', text: 'Sign up with an email provider, add the SPF, DKIM and DMARC records to your domain, and keep the key in `.env`.', see: ['notifications', 3] },
      { title: 'Send from a job', text: 'Create the record, then queue a job that picks the channels and sends — checking `sentAt` first.', see: ['notifications', 3] },
      { title: 'Preferences', text: 'A preferences screen per channel and topic, with quiet hours, which the job respects.', see: ['notifications', 5] },
      { title: 'Push', text: 'Add Web Push (or Expo for a mobile app): ask permission after the person follows something, store device tokens, remove the ones the service rejects.', see: ['notifications', 4] },
      { title: 'Group bursts', text: 'If more than three events arrive within ten minutes, send one summary instead.', see: ['notifications', 6] },
      { title: 'Listen back', text: 'Handle bounce and unsubscribe webhooks, and stop sending to those addresses.' },
    ],
    withAI: {
      lede: 'Let your AI assistant build the system — with the rules that keep people from muting you written into the spec.',
      prompt: `Add notifications to my Express + Mongoose + React app.

Data
- Notification { user, type, data, readAt, createdAt } and NotificationPrefs { user, email: {topics}, push: {topics}, quietHours }.

Sending
- Creating a notification queues a BullMQ job. The worker loads the prefs, skips channels the user turned off, delays until morning during quiet hours, and sends email (through my email.js wrapper around the provider) and Web Push (the web-push library, VAPID keys from env).
- Every send is idempotent: check and set sentAt per channel.
- Batching: if a user has more than 3 notifications of the same type within 10 minutes, send one summary instead.

Client
- An in-app bell with an unread count and a list; mark as read.
- Ask for push permission only after the user follows something, with a short explanation first.
- A preferences page.

Webhooks
- Handle the provider's bounce/complaint webhook (verify its signature) and stop emailing those addresses.`,
    },
    verify: [
      'A test email lands in your inbox, not spam — and its headers show SPF and DKIM passing.',
      'Turning off email for a topic stops those emails, while the in-app list still shows them.',
      'A push arrives with the app closed — and only after you granted permission.',
      'Ten quick events produce one summary, not ten messages.',
      'Kill the worker right after sending: the retry doesn’t send again.',
      'Quiet hours hold messages until morning.',
      'A bounced address is marked, and never emailed again.',
    ],
  },

  breakIt: [
    {
      title: 'Email in the request',
      lang: 'js',
      code: `app.post('/api/signup', async (req, res) => {
  const user = await User.create(req.body);
  await email.send({ to: user.email, subject: 'Welcome!' });
  res.status(201).json(user);
});`,
      err: [3],
      answer:
        'Sign-up now waits for the email provider — and fails if it is down, even though the account was created. Queue the welcome email and answer straight away; the job retries while the provider struggles.',
      see: ['notifications', 3],
    },
    {
      title: 'A buzz for every like',
      lang: 'js',
      code: `post.on('liked', (by) => push.send(post.author, \`\${by.name} liked your post\`));`,
      err: [1],
      answer:
        'Fifty likes, fifty buzzes — and the person turns off your notifications for good. Collect events for a few minutes and send one: “Ana and 49 others liked your post”.',
      see: ['notifications', 6],
    },
    {
      title: 'A code on the lock screen',
      lang: 'js',
      code: `push.send(user, 'Your one-time login code is 482913');`,
      err: [1],
      answer:
        'Push messages appear on the lock screen, readable by anyone holding the phone, and pass through other companies’ services. Keep sensitive details out of notification text: say “You have a new sign-in request” and show the code inside the app.',
    },
    {
      title: 'Everyone, everything',
      lang: 'js',
      code: `async function notifyAll(users, message) {
  for (const u of users) await email.send({ to: u.email, ...message });
}`,
      err: [2],
      answer:
        'Everyone gets every message, whatever they chose — including people who unsubscribed, which can break anti-spam laws and ruin your sending reputation. Load preferences and check them before each send, and put an unsubscribe link in anything that isn’t transactional.',
      see: ['notifications', 5],
    },
  ],

  explain: [
    'Why do emails sent from your own server land in spam?',
    'How does a push notification reach an app that isn’t running?',
    'Why are grouping and preferences as important as delivery itself?',
  ],

  deeper: [
    {
      q: 'What do SPF, DKIM and DMARC actually do?',
      a: 'SPF lists which servers may send for your domain; DKIM signs each message so it can’t be altered unnoticed; DMARC tells receivers what to do when those checks fail. Together they prove your mail is really yours.',
    },
    {
      q: 'What is “deliverability”?',
      a: 'Whether your emails reach the inbox. It depends on your domain’s reputation: authentication, low bounce and complaint rates, and sending mail people expect.',
    },
    {
      q: 'How do SMS codes get stolen?',
      a: 'Through SIM-swap attacks and intercepted messages. For sign-in, authenticator apps and passkeys are safer; keep SMS as a fallback.',
    },
    {
      q: 'What is a digest?',
      a: 'A single message summarising many low-priority events over a period — daily or weekly — instead of one message for each.',
    },
    {
      q: 'Do I need permission for every channel?',
      a: 'Push needs the operating system’s permission; marketing email and SMS need consent under most laws; transactional messages are expected, but should still be honest and minimal.',
    },
    {
      q: 'How do big apps decide what to notify?',
      a: 'They score each possible notification by how likely it is to matter to that person, send only the top few, and measure whether people engage — or switch notifications off.',
    },
  ],

  next: [
    { q: 'How do you run the sending in the background?', chapter: 'background' },
    { q: 'How does a chat update live while the app is open?', chapter: 'realtime' },
    { q: 'How do you take a payment and send the receipt?', chapter: 'payments' },
    { q: 'How do you connect your app to a business’s other tools?', chapter: 'automate' },
  ],
};

export default writing;
