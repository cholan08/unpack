/**
 * Chapter: Turn a problem into a plan (Part III · The builder’s craft).
 * Follows the model chapter, written/identity.ts.
 */
import type { ChapterWriting } from '../types';

const writing: ChapterWriting = {
  hook: {
    story: [
      'A shop owner tells you: “I need an app for my shop.” A beginner opens the editor that night. Three weeks later they proudly show an app with accounts, a cart and a chatbot — and the owner says: “But I only wanted customers to know when new stock arrives.”',
      'The most expensive mistake in building is solving the wrong problem well. Before any code, a builder’s job is to find the real problem, who has it, how they deal with it today, and the smallest thing that would make their life better — and to agree on what “done” means.',
      'Someone says “I need an app for my shop.” What do you ask before writing a single line?',
    ],
    predict: {
      q: 'A clinic owner asks for “an app for appointments”. What is the most useful first question?',
      options: [
        'Do you want it on iPhone or Android?',
        'Which colours do you like?',
        'Walk me through how a patient books today — and where it goes wrong',
        'Should we use React or Vue?',
      ],
      answer: 2,
      reveal:
        'Ask about *today*. How bookings happen now — phone calls, a paper diary, WhatsApp messages — and exactly where it hurts (double bookings? no-shows? a receptionist drowning in calls?) tells you what to build. Maybe it is online booking; maybe it is just text reminders, which could cut no-shows within a week. Platforms and frameworks come later, and are rarely the client’s decision.',
    },
  },

  idea: {
    lede: 'Whether the client is a shop, a clinic, your own company or you, turning a vague wish into a plan takes the same five steps.',
    jobs: [
      {
        title: 'Find the real problem',
        text: 'Ask how things work today and where it hurts. The request (“an app”) is a guess at a solution; the pain is the problem.',
      },
      {
        title: 'Know who it is for',
        text: 'Who will use it, what they are trying to get done, what they use now, and what they would stop using if yours worked.',
      },
      {
        title: 'Define success',
        text: 'A measurable outcome — “no-shows drop from 20% to 10%”, “every order answered within an hour” — not a list of features.',
      },
      {
        title: 'Cut to a first version',
        text: 'The smallest thing that delivers that outcome: often one screen, one flow, no accounts. Everything else goes on a “later” list.',
      },
      {
        title: 'Write it down and agree',
        text: 'A one-page brief — problem, users, success measure, first version, out of scope, risks — that both sides sign off before building.',
      },
    ],
    picture:
      'A doctor, not a pharmacist. A patient who walks in saying “I need antibiotics” doesn’t get antibiotics just for asking: the doctor asks about the symptoms, examines, and perhaps prescribes rest. A builder treats “I need an app” the same way — listen to the symptoms, diagnose the real problem, then prescribe the smallest treatment that works.',
  },

  options: {
    lede: 'These techniques aren’t rival methods. Use the lightest ones that answer your questions.',
    items: [
      {
        name: 'Problem interviews',
        what: 'Short conversations with the people who have the problem, about what they actually do today — not about your idea.',
        pickWhen: 'Always, first. Five conversations reveal most of what matters.',
        cost: 'Time — and the discipline not to pitch your solution.',
        examples: '“Tell me about the last time you…” — the approach of *The Mom Test* by Rob Fitzpatrick',
      },
      {
        name: 'Watching the work',
        what: 'Sit with the people doing the job and observe the real process, the workarounds and the spreadsheets.',
        pickWhen: 'Internal tools and business processes.',
        cost: 'Access, and time on site or on a screen share.',
        examples: 'An hour beside a receptionist',
      },
      {
        name: 'User stories and jobs to be done',
        what: 'Write needs as “As a [person], I want [action] so that [outcome]”, or as the job someone is “hiring” the product to do.',
        pickWhen: 'Turning what you learned into a list you and the client both understand.',
        cost: 'Easy to write too many; prioritise hard.',
        examples: '“As a receptionist, I want reminders sent automatically so that I stop calling every patient.”',
      },
      {
        name: 'A throwaway prototype',
        what: 'Clickable screens or a fake version — even a form plus a spreadsheet — to test the idea before building it.',
        pickWhen: 'You are not sure people will use the solution.',
        cost: 'People may mistake it for the real thing.',
        examples: 'Figma, a Google Form, a no-code tool, an AI-generated mock-up',
      },
      {
        name: 'Scoping frameworks',
        what: 'Simple ways to choose: must / should / could / won’t (MoSCoW), or impact versus effort.',
        pickWhen: 'The wish list is longer than the time you have.',
        cost: 'Only as good as the honesty of the scoring.',
        examples: 'MoSCoW, an impact–effort grid',
      },
    ],
    choose: [
      { when: 'You don’t yet understand the problem', pick: 'Problem interviews, and watching the work.' },
      { when: 'You understand it, but the list is long', pick: 'User stories, then MoSCoW to cut.' },
      { when: 'You are unsure people will use the solution', pick: 'A throwaway prototype first.' },
      { when: 'Everyone agrees, and you are about to build', pick: 'A one-page brief, signed off.' },
    ],
  },

  modern: {
    lede: 'AI makes building so fast that the bottleneck has moved. It is no longer “can we build it?” but “should we — and what exactly?”. A builder who can turn a vague wish into a sharp brief is worth more than ever, and a sharp brief is exactly what an AI needs to build the right thing.',
    defaults: [
      'Start every project with five conversations about how things work today.',
      'Write success as a measurable outcome, not a feature list.',
      'Cut the first version until it feels too small — then ship it.',
      'Keep an explicit “not now” list, so new ideas have somewhere to go.',
      'Turn the brief into the prompt: problem, users, rules, out of scope, how you will check it.',
      'Show something real within a week, and plan the next step from what people actually do.',
    ],
    aiGood: [
      'Drafting interview questions that don’t lead people',
      'Summarising interview notes into themes',
      'Turning findings into user stories and acceptance criteria',
      'Spotting gaps and contradictions in a brief',
      'Making a quick clickable mock-up to test an idea',
    ],
    aiWrong: [
      { mistake: 'Jumps straight to features and tech stacks.', fix: 'Ask it for questions to ask the client first.' },
      { mistake: 'Invents user needs that sound plausible.', fix: 'Needs come from real conversations; AI only organises them.' },
      { mistake: 'Plans a giant first version with every feature.', fix: 'Ask for the smallest version that moves one measurable outcome.' },
      { mistake: 'Writes vague success criteria such as “easy to use”.', fix: 'Make them measurable and checkable.' },
      { mistake: 'Agrees with whatever you suggest.', fix: 'Ask it to argue against your plan.' },
    ],
  },

  build: {
    title: 'Brief a real problem',
    brief: 'Find a real person with a real problem — a shopkeeper, a teacher, a relative running a small business — and turn their wish into a one-page brief you would be happy to build from.',
    byHand: [
      { title: 'Find someone', text: 'Someone you can talk to for 30 minutes: a family business, a club, a teacher, a friend’s side project.' },
      { title: 'Ask about today', text: '“Walk me through the last time you…”. Note what they do, which tools they use and where it hurts. Don’t mention your ideas.' },
      { title: 'Find the pain', text: 'Mark the moments of frustration, wasted time or lost money. Ask “how often?” and “what does that cost you?”.' },
      { title: 'Define success', text: 'Agree on one measurable outcome: “no-shows halve”, “orders answered within an hour”.' },
      { title: 'Cut the first version', text: 'List everything that could help, then mark each must, should, could or won’t. The first version is the musts only.' },
      { title: 'Write the brief', text: 'One page: the problem, the users, today’s process, the success measure, the first version, the “not now” list, the risks.' },
      { title: 'Check it back', text: 'Show the brief to the person. Do they recognise their problem? Would the first version help this month?' },
    ],
    withAI: {
      lede: 'Then let your AI assistant help you organise what *you* heard — and argue against your plan before reality does.',
      prompt: `Help me turn a client conversation into a one-page project brief. Don't propose any technology yet.

Here are my raw notes from a 30-minute conversation: [paste notes]

1. Summarise the real problem in two sentences, separating what they asked for from what actually hurts.
2. List the users, and what each one is trying to get done.
3. Propose one measurable success outcome, plus two alternatives.
4. Sort possible features into Must / Should / Could / Won't for a first version that could ship in two weeks.
5. List the questions I still need to ask them, and the biggest risks.
6. Finally, argue against this plan: what is the strongest reason it might not work?`,
    },
    verify: [
      'Your brief names a real person or role, not just “users”.',
      'The problem is described in their words, not as a feature.',
      'Success is a number you could measure within a month.',
      'The first version has three must-haves or fewer.',
      'There is a written “not now” list.',
      'The person read the brief and said “yes, that’s it” — or corrected it.',
      'You could hand the brief to an AI as a prompt, and it would build the right thing.',
    ],
  },

  breakIt: [
    {
      title: 'A leading question',
      lang: 'text',
      code: `"Wouldn't it be great if your customers could book online with an app?"`,
      err: [1],
      answer:
        'Nearly everyone says yes to a question like this — it is polite, hypothetical and costs nothing. It tells you nothing about whether they would use it. Ask about the past instead: “How did your last ten bookings reach you? Did any of them go wrong?”',
    },
    {
      title: 'Success, as features',
      lang: 'text',
      code: `Success criteria:
- User accounts
- A dashboard
- Dark mode`,
      err: [2, 3, 4],
      answer:
        'These are features, not outcomes — you could build all three and change nothing for the client. Success is what changes in their world: “staff spend under 30 minutes a day on bookings”, “no-shows below 10%”.',
    },
    {
      title: 'The first version',
      lang: 'text',
      code: `Version 1: online booking, payments, loyalty points, reviews, a mobile app,
an admin dashboard, text reminders, multi-language support, an AI chatbot.`,
      err: [1, 2],
      answer:
        'Nine features is months of work before anyone learns whether the core idea helps. Pick the one that moves the success number most — maybe just text reminders — ship it in a week, and let real use decide what comes next.',
    },
    {
      title: 'A prompt with no problem in it',
      lang: 'text',
      code: `Build me a full-stack booking app with React, Node and MongoDB.`,
      err: [1],
      answer:
        'An AI will happily build *a* booking app — the generic one from its training data, not your client’s. Give it the brief: who books, what must never happen, the success measure, what is out of scope, and how you will check it.',
    },
  ],

  explain: [
    'What is the difference between what a client asks for and the problem they actually have?',
    'Why ask about what happened last time, rather than whether they would like your idea?',
    'Why should the first version feel too small?',
  ],

  deeper: [
    {
      q: 'What is *The Mom Test*?',
      a: 'A short book by Rob Fitzpatrick about asking questions even your mum can’t lie to you about: talk about their life and past behaviour, not your idea, and listen for commitment — time, money, introductions — rather than compliments.',
    },
    {
      q: 'What does “jobs to be done” mean?',
      a: 'The idea that people “hire” a product to make progress in a situation. A gym member doesn’t want an app; they want to get fit without the hassle of booking. Design for the job, not the feature request.',
    },
    {
      q: 'What is an MVP, really?',
      a: 'A minimum viable product is the smallest thing that tests your riskiest assumption with real people — sometimes not software at all, but a form, a spreadsheet and you doing the work by hand.',
    },
    {
      q: 'How do I estimate how long it will take?',
      a: 'Break the first version into tasks no bigger than a day, estimate each, then add a generous margin for the unknown. Estimates get better as the scope gets smaller and the tasks get more concrete.',
    },
    {
      q: 'What is a forward-deployed engineer?',
      a: 'An engineer who works directly with a client, inside their problem — discovering, building and shipping solutions on the spot. The skills in this chapter are the heart of that job.',
    },
    {
      q: 'How do I say no to a client’s feature?',
      a: 'Tie it to the goal: “That would help, but it doesn’t move the no-show number. Let’s put it on the later list and decide after we see the first month’s results.”',
    },
  ],

  next: [
    { q: 'Once you know the problem, how do you design the system?', chapter: 'design' },
    { q: 'How do you build it with AI?', chapter: 'build-with-ai' },
    { q: 'You launched. Nobody signed up. Now what?', chapter: 'iterate' },
    { q: 'Could you solve a real client’s problem from start to finish?', chapter: 'briefs' },
  ],
};

export default writing;
