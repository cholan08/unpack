import { actor, box, defineLesson, flow, link, patch } from '@/content/dsl';
import type { LinkSpec, NodeSpec } from '@/engine/types';

/* ---------- layout: the trigger (left) → the workflow (middle) → the tools it updates (right) ---------- */
const form = box(160, 300, 'Contact form', { sub: 'on your website', icon: 'browser', tone: 'client', w: 200 });
const wf = box(470, 300, 'Workflow', { sub: 'n8n · Zapier · Make', icon: 'workflow', tone: 'ai', w: 220 });
const sheet = box(820, 120, 'Spreadsheet', { sub: 'new row', icon: 'file', tone: 'data', w: 210 });
const mail = box(820, 250, 'Email', { sub: 'reply to customer', icon: 'mail', tone: 'net', w: 210 });
const chat = box(820, 380, 'Team chat', { sub: 'alert #sales', icon: 'inbox', tone: 'net', w: 210 });
const crm = box(820, 510, 'CRM', { sub: 'new lead', icon: 'user', tone: 'neutral', w: 210 });
const ai = box(470, 480, 'AI step', { sub: 'classify · draft reply', icon: 'cpu', tone: 'ai', w: 220 });
const person = actor(160, 480, 'Ops person', { sub: 'copy & paste', icon: 'user' });

const tools: Record<string, NodeSpec> = { sheet, mail, chat, crm };
const all: Record<string, NodeSpec> = { form, wf, ...tools };
const allLinks: LinkSpec[] = [link('form', 'wf'), link('wf', 'sheet'), link('wf', 'mail'), link('wf', 'chat'), link('wf', 'crm')];

const triggerCode = `// your API forwards each new enquiry to the workflow's webhook
app.post('/api/contact', async (req, res) => {
  const enquiry = await Enquiry.create(ContactInput.parse(req.body));
  await fetch(process.env.WORKFLOW_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-signature': sign(enquiry.id) },
    body: JSON.stringify({ id: enquiry.id, name: enquiry.name, message: enquiry.message }),
    signal: AbortSignal.timeout(5000),
  });
  res.status(201).json({ ok: true });
});`;

export default defineLesson({
  metrics: [
    { id: 'minutes', label: 'Human minutes per enquiry', unit: 'min', better: 'lower' },
    { id: 'missed', label: 'Enquiries missed per week', better: 'lower' },
    { id: 'watched', label: 'Failures noticed' },
  ],
  legend: { data: 'record', event: 'trigger' },
  goals: [
    { text: 'Trigger → steps → actions', step: 3 },
    { text: 'Workflow tools versus code', step: 4 },
    { text: 'AI steps with a human in the loop', step: 5 },
    { text: 'Loops, duplicates and silent failures', step: 6 },
  ],
  steps: [
    {
      short: 'Busywork',
      beat: 'setup',
      title: 'Work nobody should do by hand',
      body: [
        'Every enquiry from the website goes the same way: someone copies it into a spreadsheet, adds the person to the CRM, posts a heads-up in the sales chat, and emails the customer back. Five minutes each, forty times a day.',
        'It is repetitive, it is slow — and on a busy Friday, some enquiries simply never get copied.',
      ],
      metrics: { minutes: 5, missed: 6, watched: 'no' },
      scene: {
        nodes: { form, person: { ...person, state: 'busy' }, ...tools },
        links: [link('form', 'person'), link('person', 'sheet'), link('person', 'mail'), link('person', 'chat'), link('person', 'crm')],
        flows: [
          flow(['form', 'person'], { kind: 'data', label: 'new enquiry', every: 5 }),
          flow(['person', 'sheet'], { kind: 'data', label: 'copy', every: 5, offset: 1.4 }),
          flow(['person', 'crm'], { kind: 'data', label: 'copy again', every: 5, offset: 2.6 }),
        ],
      },
    },
    {
      short: 'Glue',
      beat: 'problem',
      title: 'Copying between tools doesn’t scale',
      body: [
        'Done by hand, steps get skipped and typos creep in. Done by writing a custom script for each connection, you end up maintaining glue code for five different APIs — each with its own login, limits and changes.',
        'What you want is one place that says: *when this happens, do these things* — visible, editable, and watched.',
      ],
      metrics: { minutes: 5, missed: 6, watched: 'no' },
      scene: {
        nodes: { form, person: { ...person, state: 'error', badge: { text: 'missed 6 this week', tone: 'danger' } }, ...tools, crm: { ...crm, state: 'error' } },
        links: [link('form', 'person'), link('person', 'sheet'), link('person', 'mail'), link('person', 'chat'), link('person', 'crm', { state: 'error' })],
        flows: [flow(['form', 'person'], { kind: 'err', label: 'Friday, 5 pm', every: 4 })],
      },
    },
    {
      short: 'Workflow',
      beat: 'solution',
      title: 'Trigger → steps → actions',
      body: [
        'A **workflow** starts with a **trigger** — a form submitted, a [[webhook]] received, a schedule — runs a few **steps** (filter, reshape, look something up), and ends in **actions** in other tools: add a row, send an email, post a message, create a lead.',
        'Your app’s only job is to fire the trigger. Everything after it is visible as a diagram that someone who isn’t a developer can read and change.',
      ],
      code: { file: 'routes/contact.js', lang: 'js', code: triggerCode, hl: [3, 4, 6] },
      changes: ['- Copying by hand', '+ One trigger from your app', '+ Actions in every tool, automatically'],
      metrics: { minutes: 0.5, missed: 0, watched: 'no' },
      scene: {
        nodes: patch(all, { wf: { state: 'active' } }),
        links: allLinks,
        flows: [
          flow(['form', 'wf'], { kind: 'event', label: 'new enquiry', every: 6 }),
          flow(['wf', 'sheet'], { kind: 'data', label: 'add row', every: 6, offset: 1 }),
          flow(['wf', 'mail'], { kind: 'data', label: 'reply', every: 6, offset: 1.3 }),
          flow(['wf', 'chat'], { kind: 'data', label: 'alert', every: 6, offset: 1.6 }),
          flow(['wf', 'crm'], { kind: 'data', label: 'new lead', every: 6, offset: 1.9 }),
        ],
      },
    },
    {
      short: 'Tools',
      beat: 'technique',
      title: 'Workflow tools — or code?',
      body: [
        'Workflow tools come with hundreds of ready-made connections and keep each service’s login safely in one place. **n8n** can run on your own server; **Zapier** and **Make** are hosted. They shine for business processes that change often.',
        'Write code instead when the logic is complex, must be tested like the rest of your app, runs at high volume, or *is* your product. Many teams use both: the app emits events, and the workflow tool handles the office glue.',
      ],
      callout: { kind: 'picture', text: 'A workflow tool is a switchboard: every service is plugged in once, and a recipe card on the wall says which calls go where.' },
      metrics: { minutes: 0.5, missed: 0, watched: 'no' },
      scene: {
        nodes: patch(all, { wf: { state: 'active', badge: { text: 'logins stored once', tone: 'ok' } } }),
        links: allLinks,
        flows: [flow(['form', 'wf', 'crm'], { kind: 'event', label: ['trigger', 'create lead'], every: 4.6 })],
      },
    },
    {
      short: 'AI steps',
      beat: 'technique',
      title: 'AI inside a workflow — with a human in the loop',
      body: [
        'Add an AI step: read the message, **classify** it (sales, support, refund, spam), pick its urgency, and **draft** a reply. Urgent refunds go straight to the support chat; spam is dropped.',
        'Let AI prepare, and people decide: drafts wait for a human to approve before anything is sent to a customer, and anything unusual is routed to a person.',
      ],
      code: { file: 'AI step · instructions', lang: 'text', code: `Classify the enquiry as one of: sales, support, refund, spam.
Return JSON: { "category": "...", "urgent": true|false, "draft": "..." }.
Never promise refunds, prices or dates — leave that to a person.`, hl: [3] },
      metrics: { minutes: 0.3, missed: 0, watched: 'no' },
      scene: {
        nodes: { ...all, ai: { ...ai, state: 'active' } },
        links: [...allLinks, link('wf', 'ai')],
        flows: [
          flow(['wf', 'ai'], { kind: 'req', label: 'classify + draft', back: 'res', backLabel: 'refund · urgent', every: 5.4 }),
          flow(['wf', 'chat'], { kind: 'data', label: 'approve draft?', every: 5.4, offset: 2.2 }),
        ],
      },
    },
    {
      short: 'Gone wrong',
      beat: 'problem',
      title: 'When automation goes wrong, it goes wrong fast',
      body: [
        'A workflow runs whenever its trigger fires — including when *it* caused the trigger. One that adds a row whenever a row is added loops forever. A trigger delivered twice creates two leads and two emails. And a step that fails quietly at 2 a.m. means enquiries vanish with nobody noticing.',
        'Automations need the same care as code: no loops, safe to run twice, and failures that shout.',
      ],
      check: {
        q: 'A workflow is triggered by “new row in the Leads sheet”, and its action adds a row to the same sheet. What happens?',
        options: ['It runs once', 'It loops — each new row triggers another', 'The sheet blocks it', 'Nothing, the tool detects it'],
        answer: 1,
        explain: 'Its own action fires its own trigger. Guard against it: write to a different place, mark rows the workflow created, or filter them out at the start.',
      },
      metrics: { minutes: 0.3, missed: 3, watched: 'no' },
      scene: {
        nodes: patch(all, { wf: { state: 'error', badge: { text: 'loop · duplicates', tone: 'danger' } }, sheet: { state: 'error' } }),
        links: [...allLinks.filter((l) => l.to !== 'sheet'), link('wf', 'sheet', { state: 'error' })],
        flows: [flow(['wf', 'sheet'], { kind: 'err', label: 'add row', back: 'err', backLabel: 'new row → trigger', every: 2.4 })],
      },
    },
    {
      short: 'Reliable',
      beat: 'technique',
      title: 'Make it reliable',
      body: [
        '**Check it’s real:** verify the trigger’s signature or secret. **Safe twice:** carry the record’s id through every step and skip ids you have already handled. **Failures shout:** add an error workflow that alerts a person, and keep the run history.',
        '**Treat it like code:** test with sample data, export or version your workflows, keep credentials in the tool’s vault, and write down who owns each one.',
      ],
      metrics: { minutes: 0.3, missed: 0, watched: 'yes' },
      scene: {
        nodes: patch(all, { wf: { state: 'ok', badge: { text: 'dedupe · alerts · history', tone: 'ok' } } }),
        links: allLinks,
        flows: [
          flow(['form', 'wf'], { kind: 'event', label: 'enquiry #881 (again)', every: 5 }),
          flow(['wf', 'chat'], { kind: 'data', label: 'skipped: already done', every: 5, offset: 1.4 }),
        ],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Automating the busywork',
      body: [
        'A {client:trigger} from your app starts a {warn:workflow} that runs the same steps every time and updates {data:every tool} — no copying, nothing forgotten.',
        '{neutral:AI steps} classify and draft while {ok:people approve}; and every workflow is {auth:verified, safe to run twice, and loud when it fails}.',
      ],
      metrics: { minutes: 0.3, missed: 0, watched: 'yes' },
      scene: {
        nodes: { ...all, ai },
        links: [...allLinks, link('wf', 'ai')],
        flows: [
          flow(['form', 'wf'], { kind: 'event', label: 'trigger', every: 6 }),
          flow(['wf', 'ai'], { kind: 'req', label: 'classify', back: 'res', backLabel: 'sales', every: 6, offset: 1 }),
          flow(['wf', 'crm'], { kind: 'data', label: 'lead', every: 6, offset: 2.6 }),
          flow(['wf', 'mail'], { kind: 'data', label: 'reply', every: 6, offset: 2.9 }),
        ],
      },
    },
  ],
});
