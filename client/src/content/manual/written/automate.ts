/**
 * Chapter: Automate the busywork (automation & workflows).
 * Follows the model chapter, written/identity.ts.
 */
import type { ChapterWriting } from '../types';

const writing: ChapterWriting = {
  hook: {
    story: [
      'A small business gets forty enquiries a day. Someone copies each one into a spreadsheet, adds it to the CRM, pings the sales chat and writes a reply. It takes hours — and on busy days, some enquiries slip through.',
      'Most of the software that runs a business isn’t one app. It is a dozen tools that don’t talk to each other, held together by people copying and pasting. Connecting them so work flows by itself is one of the quickest ways to make a real difference for a real client.',
      'How do businesses connect forms, sheets, email and AI so that work gets done while nobody is clicking?',
    ],
    predict: {
      q: 'A shop wants every new order added to a spreadsheet, posted to the warehouse chat, and followed by a thank-you email. What is usually the quickest reliable solution?',
      options: [
        'Build a custom app with its own database',
        'Hire someone to copy the orders',
        'A workflow that triggers on each new order and runs those three actions',
        'Ask customers to email the warehouse',
      ],
      answer: 2,
      reveal:
        'A workflow. One trigger (“new order”) and three actions are exactly what workflow tools are built for: ready-made connections, logins stored once, a diagram the shop owner can read, and a history of every run. Write custom code when the logic is complex or central to your product — not for gluing tools together.',
    },
  },

  idea: {
    lede: 'Whether it is n8n, Zapier, a script on a schedule or an AI agent, every automation does the same five jobs.',
    jobs: [
      {
        title: 'Something starts it',
        text: 'A trigger: a form submitted, a [[webhook]] from another service, a new row, a schedule (a [[cron]] expression).',
      },
      {
        title: 'It decides',
        text: 'Filters and conditions: only orders over ₹5,000, only urgent messages, never test data.',
      },
      {
        title: 'It reshapes',
        text: 'Turn one tool’s data into what the next one needs — renamed fields, formatted dates, an AI summary or category added.',
      },
      {
        title: 'It acts',
        text: 'Create, update or send in other tools: a row, a lead, a message, an email, a task.',
      },
      {
        title: 'It is watched',
        text: 'Every run logged, failures alerted, duplicates skipped — because nobody is watching it run.',
      },
    ],
    picture:
      'A line of dominoes set up by someone careful. The first push starts it (the trigger); some branches fall only if a condition is met (decide); each domino passes the motion on in the shape the next one needs (reshape); the last ones ring bells in other rooms (act). And a camera records every run, so when one stops halfway, somebody knows (watched).',
  },

  lessonNotes: {
    automation: 'All five jobs: triggers, workflow tools versus code, AI steps with a human in the loop, loops and duplicates, and making automations reliable.',
    'llm-apps': 'The AI inside the workflow: calling models, output you can check, and tools with limits.',
  },

  options: {
    lede: 'From no-code to full code. The right choice depends on who will maintain it, how complex the logic is, and how much volume it handles.',
    items: [
      {
        name: 'Hosted no-code tools',
        what: 'Build workflows in the browser from ready-made connections to hundreds of apps.',
        pickWhen: 'Business teams automating their own processes, quickly.',
        cost: 'Per-task pricing grows with volume, and complex logic and testing are limited.',
        examples: 'Zapier, Make, Microsoft Power Automate',
      },
      {
        name: 'Self-hostable workflow tools',
        what: 'Visual workflows you can run on your own server, with code steps when you need them.',
        pickWhen: 'Developers building automations for clients, data that must stay in-house, or high volume.',
        cost: 'You host, update and back it up.',
        examples: 'n8n, Node-RED, Activepieces, Windmill',
        tools: ['docker'],
      },
      {
        name: 'Scripts on a schedule or a webhook',
        what: 'Small pieces of code triggered by a schedule or an incoming webhook.',
        pickWhen: 'Simple, well-defined jobs that developers own.',
        cost: 'Retries, logging and alerting are yours to build.',
        examples: 'A Node script with node-cron; serverless functions; GitHub Actions on a schedule',
        tools: ['node', 'github-actions'],
      },
      {
        name: 'AI agents with tools',
        what: 'A model decides which actions to take, using only the tools you allow.',
        pickWhen: 'Messy, varied inputs — emails, documents — that need judgement before routing.',
        cost: 'Less predictable; needs limits, logs and human approval for anything that matters.',
        examples: 'Agent steps in n8n and Zapier; agent frameworks; assistants connected through MCP',
      },
      {
        name: 'Built into your product',
        what: 'Your app offers webhooks and an API, so customers can automate with it.',
        pickWhen: 'Your users will want to connect you to their other tools.',
        cost: 'Designing, documenting and supporting a public API.',
        examples: 'Outgoing webhooks, a public REST API, your own n8n or Zapier integration',
      },
    ],
    choose: [
      { when: 'A business team’s own process', pick: 'A hosted no-code tool.' },
      { when: 'You are building automations for a client', pick: 'n8n, self-hosted or in their cloud.' },
      { when: 'A simple job that developers own', pick: 'A script on a schedule or a webhook.' },
      { when: 'Unstructured input that needs judgement', pick: 'An AI step — with a person approving what matters.' },
      { when: 'Customers want to connect your product to theirs', pick: 'Outgoing webhooks and an API.' },
    ],
  },

  modern: {
    lede: 'AI has turned automation from “move this field there” into “read this, decide, and draft a response”. That is powerful — and it means mistakes happen faster and at scale. The modern pattern: let AI read, sort and draft; let rules and people decide anything that costs money, touches customers or can’t be undone.',
    defaults: [
      'Start from the process people follow today, written down step by step — and simplify it before automating it.',
      'Verify every trigger (a signature or shared secret), and filter out test records and records the workflow made itself.',
      'Carry a record id through every step, and skip ids already handled.',
      'AI steps return structured output, and anything customer-facing waits for a person to approve.',
      'An error workflow that alerts a person, and run history kept for weeks.',
      'Export or version workflows, name an owner for each, and keep credentials in the tool’s vault.',
    ],
    aiGood: [
      'Turning a described process into a workflow outline',
      'Writing code steps and data mappings',
      'Classifying, extracting and summarising messy text',
      'Drafting replies for a person to approve',
      'Explaining a failed run from its logs',
    ],
    aiWrong: [
      { mistake: 'Builds a workflow that triggers itself.', fix: 'Write somewhere else, or tag and skip records the workflow created.' },
      { mistake: 'Lets AI send customer emails or issue refunds on its own.', fix: 'Draft, then a person approves.' },
      { mistake: 'Ignores duplicate triggers.', fix: 'Deduplicate by record id.' },
      { mistake: 'Hardcodes API keys in code steps.', fix: 'Use the tool’s credential store.' },
      { mistake: 'Leaves failures silent.', fix: 'An error path that alerts a person.' },
      { mistake: 'Automates a broken process exactly as it is.', fix: 'Simplify the process first, then automate it.' },
    ],
  },

  build: {
    title: 'Automate a real business process',
    brief: 'Pick a real, repetitive process — enquiries for a small business, sign-ups for a club, bookings for a class — and automate it end to end with n8n: a trigger, AI classification, actions in three tools, human approval for replies, and an alert when anything fails.',
    byHand: [
      { title: 'Write down today’s process', text: 'Every step a person does now, in order, with the tools involved.', see: ['automation', 1] },
      { title: 'Run n8n', text: 'Start n8n with Docker on your machine (or use its cloud trial), and connect each tool once, as a credential.', see: ['automation', 4] },
      { title: 'The trigger', text: 'A webhook node that your form or app calls, with a shared secret checked in the very first step.', see: ['automation', 3] },
      { title: 'Dedupe and filter', text: 'Skip records already handled (by id), and drop test submissions.', see: ['automation', 7] },
      { title: 'An AI step', text: 'Classify the message and draft a reply as JSON, and validate it in the next node.', see: ['automation', 5] },
      { title: 'Actions and approval', text: 'Add a row, create a lead, and post to the team chat with the draft and Approve / Reject buttons. Send only on approval.' },
      { title: 'Failures shout', text: 'An error workflow that posts to a chat channel with a link to the failed run.', see: ['automation', 7] },
    ],
    withAI: {
      lede: 'Let your AI assistant design the workflow with you — and make it list how the design prevents loops and double runs.',
      prompt: `Help me automate this process with n8n: [describe today's steps, e.g. "website enquiries are copied to a Google Sheet, added to HubSpot, posted in Slack, and answered by email"].

1. Turn it into an n8n workflow: Webhook trigger (check a shared-secret header) → dedupe by enquiry id → filter out test data → AI classification node returning JSON { category, urgent, draft } → validation → Google Sheets row → CRM lead → Slack message with the draft and Approve/Reject → send the email only on Approve.
2. Give me the configuration of each node, and any Code-node JavaScript.
3. Add an Error Trigger workflow that posts failures to Slack with the execution link.
4. List everything that could make this workflow run twice or loop, and how the design prevents it.
5. Tell me how to export and version the workflow, and where the credentials must live.`,
    },
    verify: [
      'A test enquiry appears in all three tools within a minute.',
      'Sending the same enquiry twice creates nothing new the second time.',
      'A submission marked as a test is ignored.',
      'No customer email goes out until someone clicks Approve.',
      'Breaking one action (wrong credentials) posts an alert with a link to the failed run.',
      'The workflow can’t trigger itself.',
      'The process owner can read the workflow diagram and explain it back to you.',
    ],
  },

  breakIt: [
    {
      title: 'An open door',
      lang: 'text',
      code: `Webhook URL: https://automations.myshop.app/webhook/new-order
(no secret, no signature check)`,
      err: [1, 2],
      answer:
        'Anyone who finds this URL can post fake orders into your sheet, CRM and warehouse chat. Check a shared secret or a signature in the very first step, and reject everything else.',
    },
    {
      title: 'Straight to the customer',
      lang: 'text',
      code: `Trigger: new support email → AI: write a reply → Send the email to the customer`,
      err: [1],
      answer:
        'The AI’s reply goes out unseen — including the one that promises a refund you don’t offer, or answers a phishing email. Let the AI draft; route the draft to a person who approves or edits it before anything is sent.',
    },
    {
      title: 'The self-feeding sheet',
      lang: 'text',
      code: `Trigger: new row in the "Leads" sheet → enrich with AI → add a row to the "Leads" sheet`,
      err: [1],
      answer:
        'Every row the workflow adds is a new row — which triggers the workflow again, forever. Write the enriched data to another sheet, update the same row instead of adding one, or skip rows the workflow created.',
      see: ['automation', 6],
    },
    {
      title: 'A key in the code step',
      lang: 'js',
      code: `// n8n Code node
const res = await fetch('https://api.crm.example/leads', {
  method: 'POST',
  headers: { Authorization: 'Bearer sk_live_9f8e7d…' },
});`,
      err: [4],
      answer:
        'The key now lives in the workflow export, its history and every copy someone shares. Store it as a credential in the tool’s vault and reference it there — so it can be rotated in one place.',
    },
  ],

  explain: [
    'Name the trigger, the steps and the actions of a workflow you know.',
    'Why should an AI step draft rather than send?',
    'How can a workflow end up running twice, or looping — and how do you prevent it?',
  ],

  deeper: [
    {
      q: 'When should I write code instead of using a workflow tool?',
      a: 'When the logic is complex, needs proper tests, runs at high volume, or is part of your product. Workflow tools are best for glue between tools that changes often.',
    },
    {
      q: 'What is iPaaS?',
      a: 'Integration platform as a service: hosted tools that connect business applications. Zapier and Make are examples; enterprise versions add governance and connectors to systems inside a company network.',
    },
    {
      q: 'What is RPA?',
      a: 'Robotic process automation: software that clicks through other programs’ screens like a person. Useful for old systems with no API — but it breaks whenever the screens change.',
    },
    {
      q: 'Where do AI agents fit into automation?',
      a: 'In the steps that need judgement — reading an email, deciding what it is about, drafting a reply — inside a workflow whose other steps stay predictable.',
    },
    {
      q: 'How do I price automation work for a client?',
      a: 'By the value of the time and errors it removes — hours saved each week, enquiries no longer missed — plus a small monthly fee for hosting and upkeep.',
    },
    {
      q: 'How do I test webhooks on my laptop?',
      a: 'With a tunnel or webhook relay (ngrok, Cloudflare Tunnel, smee.io) that gives your machine a temporary public URL and forwards requests to it.',
    },
  ],

  next: [
    { q: 'How do you add AI that answers from a business’s own documents?', chapter: 'ai' },
    { q: 'How do you run the slow parts reliably?', chapter: 'background' },
    { q: 'How do you call other systems’ APIs from your own code?', chapter: 'integrate' },
    { q: 'Could you solve a real client’s problem from start to finish?', chapter: 'briefs' },
  ],
};

export default writing;
