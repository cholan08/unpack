/**
 * Chapter: Ship, listen, improve (Part III · The builder’s craft).
 * Follows the model chapter, written/identity.ts.
 */
import type { ChapterWriting } from '../types';

const writing: ChapterWriting = {
  hook: {
    story: [
      'You launched. You told your friends, posted it online, and waited. A few people signed up; most never came back. Nobody complained — they just left.',
      'Launching isn’t the end of building; it is the start of learning. The first version is a question you ask the real world: did this solve the problem? The answer comes from watching what people actually do and talking to them — then changing the product, again and again, in small steps.',
      'You launched. Nobody signed up. Now what?',
    ],
    predict: {
      q: 'Your new app has 200 sign-ups, but only 10 people used it a second time. What should you do first?',
      options: [
        'Add more features, so there is more to do',
        'Spend money on ads to get more sign-ups',
        'Talk to some of the 190 who didn’t come back, and look at where they stopped',
        'Redesign the logo',
      ],
      answer: 2,
      reveal:
        'Find out why they left. More sign-ups pour more people into a leaking bucket, and more features add more places to get lost. Seeing where people stop (analytics) tells you *where*; talking to a few of them tells you *why*. Fix the biggest leak, measure again — that loop is how products get good.',
    },
  },

  idea: {
    lede: 'A startup, an internal tool or one feature in a big product — improving after launch follows the same loop.',
    jobs: [
      {
        title: 'Ship small and early',
        text: 'Get a real version in front of real people as soon as it solves one problem — then improve it in small, frequent releases.',
      },
      {
        title: 'Measure what matters',
        text: 'One or two numbers tied to the problem — people who come back, tasks completed, time saved. Not page views.',
      },
      {
        title: 'Watch and listen',
        text: 'See where people get stuck (analytics, and with consent, session recordings) and ask them why (short conversations, a feedback button).',
      },
      {
        title: 'Decide what is next',
        text: 'Pick the change most likely to move your number. Say no to the rest — for now.',
      },
      {
        title: 'Change safely',
        text: 'Release behind feature flags, try changes on a few people first, and roll back fast if the number gets worse.',
      },
    ],
    picture:
      'A new restaurant’s first month. The chef doesn’t print a permanent menu on day one. She serves a few dishes (ship small), counts which plates come back empty (measure), watches faces and asks tables how it was (listen), changes one dish at a time (decide), and tries new dishes as specials before adding them to the menu (change safely).',
  },

  options: {
    lede: 'Numbers tell you *what* is happening; people tell you *why*. Use both — and keep the tools as light as the stage you are at.',
    items: [
      {
        name: 'Talking to users',
        what: 'Short calls or messages with people who stayed — and people who left.',
        pickWhen: 'Always, and especially early, when you have few users.',
        cost: 'Time — and a few voices may not represent everyone.',
        examples: 'A 15-minute call; an email asking a single question',
      },
      {
        name: 'Product analytics',
        what: 'Events for key actions — signed up, created a first item, came back — and funnels showing where people drop off.',
        pickWhen: 'As soon as you have users. Track a handful of events, not everything.',
        cost: 'Privacy and consent — and it is easy to drown in dashboards.',
        examples: 'PostHog, Plausible, Mixpanel, Amplitude',
      },
      {
        name: 'Feedback inside the product',
        what: 'A simple way to report a problem or an idea without leaving the app.',
        pickWhen: 'From launch day.',
        cost: 'You mostly hear from the loudest people.',
        examples: 'A feedback button, a one-question in-app survey',
      },
      {
        name: 'Experiments',
        what: 'Show a change to some people and compare their behaviour with everyone else’s (A/B tests).',
        pickWhen: 'Enough users for the difference to be real, and one clear number to compare.',
        cost: 'Needs traffic, and care not to draw false conclusions.',
        examples: 'Feature flags with experiments: PostHog, LaunchDarkly, GrowthBook',
      },
      {
        name: 'Release controls',
        what: 'Feature flags, gradual rollouts and quick rollbacks.',
        pickWhen: 'Every release of something people depend on.',
        cost: 'Old flags to clean up afterwards.',
        examples: 'Feature flags, preview deployments, one-click rollback',
      },
    ],
    choose: [
      { when: 'Your very first users', pick: 'Talk to them — every one you can.' },
      { when: 'You know where people drop off, but not why', pick: 'Conversations, and session recordings with consent.' },
      { when: 'You want to know whether a change helped', pick: 'Measure before and after — an A/B test once traffic allows.' },
      { when: 'A risky change', pick: 'Release it behind a flag to a few people first.' },
    ],
  },

  modern: {
    lede: 'AI has made building so quick that you can try ideas faster than ever — which makes listening the bottleneck. The builders who win aren’t the ones who ship the most features; they are the ones who learn fastest what to change. Use AI to build experiments quickly and to sort through feedback — but keep talking to people yourself.',
    defaults: [
      'Pick one “north star” number tied to the problem you solve, and look at it every week.',
      'Track a handful of key events — with consent, and with no personal data you don’t need.',
      'Talk to a few users every week, including people who left.',
      'Ship small changes often, behind feature flags, with rollbacks ready.',
      'Keep a public changelog, and tell people what you changed because of them.',
      'Remove features nobody uses — less is easier to learn and to maintain.',
    ],
    aiGood: [
      'Grouping feedback and support messages into themes',
      'Drafting interview questions and survey wording',
      'Building quick experiments and variants',
      'Writing event tracking and analysis queries',
      'Summarising a release for the changelog',
    ],
    aiWrong: [
      { mistake: 'Suggests tracking every click “just in case”.', fix: 'Track a few events tied to decisions — and respect privacy.' },
      { mistake: 'Treats feature requests as the plan.', fix: 'Look for the problem behind each request, and weigh it against your number.' },
      { mistake: 'Declares a winner from a tiny test.', fix: 'Wait for enough people, and prefer clear, large effects.' },
      { mistake: 'Proposes more features to fix people leaving.', fix: 'First find where — and why — they leave.' },
      { mistake: 'Fills a report with made-up user feedback.', fix: 'Only real people’s words count.' },
    ],
  },

  build: {
    title: 'Run one improvement loop',
    brief: 'Take something you have shipped — your bookmarks app, or anything with a few real users — and run one full loop: measure, listen, change one thing behind a flag, and measure again.',
    byHand: [
      { title: 'Choose the number', text: 'One number tied to the problem — for example, “people who save at least three bookmarks in their first week”.' },
      { title: 'Track it', text: 'Add three to five events (signed up, saved a first bookmark, came back) with a privacy-friendly analytics tool.', see: ['observability', 6] },
      { title: 'Find the leak', text: 'Build a funnel — sign up, first bookmark, third bookmark, came back. Where is the biggest drop?' },
      { title: 'Ask why', text: 'Message five people who dropped there, with one question: “What were you hoping to do, and what got in the way?”' },
      { title: 'Change one thing', text: 'Pick the change most likely to fix that drop — perhaps importing bookmarks from the browser — and ship it behind a feature flag.' },
      { title: 'Roll it out carefully', text: 'Turn it on for half of new users, and keep the other half as they were.' },
      { title: 'Measure and decide', text: 'After two weeks, compare the number. Keep, change or remove it — and write down what you learned.' },
    ],
    withAI: {
      lede: 'Let your AI assistant set up the tracking and help you read the results — anchored to your real data, never to guesses.',
      prompt: `Help me run one product improvement loop on my app. Here is what it does and who uses it: [describe].

1. Suggest one "north star" number that reflects people getting real value, and 3–5 events that measure it (no personal data).
2. Give me the tracking code for those events with PostHog (or Plausible), and the funnel to build.
3. I'll paste the funnel results and five user replies. Group the replies into themes and point out where the biggest drop-off is.
4. Propose three possible changes, ranked by expected effect on the number versus effort, and how to test the best one behind a feature flag.

Base everything on my data. If you are guessing, say so.`,
    },
    verify: [
      'You chose one number, and can say why it reflects real value.',
      'Only a handful of events are tracked, with no unnecessary personal data.',
      'You found the biggest drop in your funnel.',
      'You heard, from real people, why they stopped.',
      'Your change went out behind a flag, to part of your users.',
      'You compared the number before and after, and wrote down a decision.',
      'You told people what you changed because of their feedback.',
    ],
  },

  breakIt: [
    {
      title: 'Track everything',
      lang: 'js',
      code: `document.addEventListener('click', (e) => {
  analytics.track('click', { target: e.target.outerHTML, user: currentUser });
});`,
      err: [2],
      answer:
        'This records every click, with the element’s whole HTML and the full user object — personal data you don’t need, in a pile too big to answer any question. Track a few named events tied to decisions (`bookmark_saved`), with an anonymous id, and only after consent where the law requires it.',
    },
    {
      title: 'Good news!',
      lang: 'text',
      code: `Weekly report: 12,400 page views (+30%)! 1,200 sign-ups!`,
      err: [1],
      answer:
        'Page views and sign-ups can rise while nobody gets any value — a viral post brings visitors who leave within seconds. Report the number that shows the product working: people who saved bookmarks and came back.',
    },
    {
      title: 'The loudest request',
      lang: 'text',
      code: `3 users asked for dark mode   → build dark mode this month.
190 users left after signing up → (no action)`,
      err: [1, 2],
      answer:
        'Requests from a few happy users are easy to hear; the silent majority who left are the real problem. Fix the biggest leak first — dark mode can wait.',
    },
    {
      title: 'Everyone, all at once',
      lang: 'text',
      code: `Friday 6 pm: new onboarding released to 100% of users. No flag, no rollback plan.`,
      err: [1],
      answer:
        'If it breaks or makes things worse, everyone is affected — over the weekend, with no quick way back. Release it to a small share first, behind a flag, during working hours, with a rollback ready.',
    },
  ],

  explain: [
    'Why is launching the start of learning rather than the end of building?',
    'What is the difference between a vanity number and one that shows real value?',
    'Why talk to the people who left, not only the ones who stayed?',
  ],

  deeper: [
    {
      q: 'What is product–market fit?',
      a: 'When a product solves a problem well enough that people keep using it and would be disappointed to lose it. You see it when retention levels off instead of falling to zero.',
    },
    {
      q: 'What is retention, and why does it matter most?',
      a: 'The share of people who come back after a day, a week, a month. Growth without retention is filling a leaking bucket; retention is the bucket.',
    },
    {
      q: 'How many users does an A/B test need?',
      a: 'It depends on how big the difference is: large effects show with hundreds of people, small ones need many thousands. With few users, talk to people and make bold changes instead.',
    },
    {
      q: 'What is a changelog for?',
      a: 'Telling people what changed and why — especially the changes they asked for. It builds trust, and brings people back to try what is new.',
    },
    {
      q: 'How should I handle harsh feedback?',
      a: 'Thank them, ask what they were trying to do, and look for the problem behind the complaint. People who write to you angrily still care; the ones who leave silently don’t.',
    },
    {
      q: 'When should I stop and try something else?',
      a: 'When several honest loops won’t move the key number, the problem may not hurt enough — or not for these people. Go back to *Turn a problem into a plan* and look again.',
    },
  ],

  next: [
    { q: 'How do you find the real problem in the first place?', chapter: 'plan' },
    { q: 'How do you see what is happening inside your app?', chapter: 'observe' },
    { q: 'How do you release changes safely?', chapter: 'ship' },
    { q: 'Could you solve a real client’s problem from start to finish?', chapter: 'briefs' },
  ],
};

export default writing;
