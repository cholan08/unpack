/**
 * Chapter: Debug anything (Part III · The builder’s craft).
 * Follows the model chapter, written/identity.ts.
 */
import type { ChapterWriting } from '../types';

const writing: ChapterWriting = {
  hook: {
    story: [
      'The app shows a blank page. Or “Something went wrong.” Or it works for you and not for her. Beginners stare at the code and change things until it works; experienced developers follow a method — and usually find it in minutes.',
      'Debugging isn’t a talent. It is a loop: notice exactly what is wrong, read what the machine is telling you, narrow down where it happens, form a guess, test the guess, and fix the cause — not the symptom.',
      'The app just says “something went wrong.” Where do you even start?',
    ],
    predict: {
      q: 'A React page crashes with “Cannot read properties of undefined (reading \'map\')”. What is the most useful first move?',
      options: [
        'Rewrite the component',
        'Ask an AI to fix it without reading the error',
        'Read the stack trace to find the exact line, then check what that value is at that moment',
        'Wrap everything in try/catch',
      ],
      answer: 2,
      reveal:
        'Read the error — it tells you nearly everything. *Cannot read properties of undefined (reading \'map\')* means the thing you called `.map` on is `undefined`, and the [[stack-trace|stack trace]] names the file and line. Then ask *why* it is undefined at that moment — usually data that hasn’t loaded yet. Reading the message first turns a mystery into a question with one answer.',
    },
  },

  idea: {
    lede: 'Whether the bug lives in a browser, a server, a database or someone else’s API, debugging is the same five-step loop.',
    jobs: [
      {
        title: 'Reproduce it',
        text: 'Find the exact steps that make it happen — every time. A bug you can’t reproduce is a bug you can’t prove you fixed.',
      },
      {
        title: 'Read what you are told',
        text: 'The error message, the stack trace, the Network tab’s status and response, the server log for that [[request-id|request id]]. The answer is often already on screen.',
      },
      {
        title: 'Narrow it down',
        text: 'Browser, network, server or database? Cut the problem in half, again and again, until only one place is left.',
      },
      {
        title: 'Guess — then test the guess',
        text: 'Form one specific hypothesis and check it with a breakpoint, a log line or a smaller example. Change one thing at a time.',
      },
      {
        title: 'Fix the cause, and keep it fixed',
        text: 'Fix *why* it happened, not where it showed up — then add a test, so it can’t quietly come back.',
      },
    ],
    picture:
      'A doctor with a patient who “feels unwell”. First: when does it happen, and can it be triggered again (reproduce)? Then the patient’s own words and the test results (read the error). Then rule out whole systems — heart, lungs, stomach (narrow it down). Then one specific diagnosis, checked with one more test (the hypothesis). And a treatment for the cause, not just a painkiller for the symptom — with a follow-up visit (fix and test).',
  },

  lessonNotes: {
    errors: 'The server side of debugging: errors that know their status, one handler, and logs with a reference the user can quote.',
    observability: 'Debugging in production: the logs, metrics and traces that tell you where and when.',
  },

  options: {
    lede: 'Each tool answers a different question. The skill is knowing which question you are asking, and reaching for the tool that answers it.',
    items: [
      {
        name: 'Browser DevTools',
        what: 'The Console, Network, Elements, Sources, Performance and Application tabs — plus React DevTools.',
        pickWhen: 'Anything that happens in the browser: errors, failed requests, wrong layout, slow pages, cookies.',
        cost: 'It only sees one browser and one session.',
        examples: 'Chrome, Edge and Firefox DevTools; React DevTools',
      },
      {
        name: 'Breakpoints and a debugger',
        what: 'Pause code at a line, inspect every variable, and step through it.',
        pickWhen: 'You know roughly where the problem is, but not why.',
        cost: 'Slower than a log line for quick checks, and awkward for timing bugs.',
        examples: 'The VS Code debugger for Node; `debugger;` in the browser; `node --inspect`',
        tools: ['node'],
      },
      {
        name: 'Logs',
        what: 'Lines your code writes as it runs.',
        pickWhen: 'Quick checks on your machine — and the main source of truth in production.',
        cost: 'They only show what you thought to log.',
        examples: '`console.log` locally; structured logs (pino) in production',
      },
      {
        name: 'Error tracking and traces',
        what: 'Production errors with stack traces and the user’s last steps; traces showing where a request spent its time.',
        pickWhen: 'Bugs that only happen in production, for some users.',
        cost: 'They must be set up *before* the bug happens.',
        examples: 'Sentry, OpenTelemetry',
      },
      {
        name: 'API and database tools',
        what: 'Send requests directly; inspect and query the data.',
        pickWhen: 'Deciding whether the bug is in the frontend, the API or the data.',
        cost: 'Easy to forget an auth header — or to test against the wrong environment.',
        examples: 'curl, Bruno or Postman, MongoDB Compass, `explain()`',
        tools: ['mongodb'],
      },
    ],
    choose: [
      { when: 'Something looks wrong on screen', pick: 'DevTools: the Console for errors, the Network tab for failed requests.' },
      { when: 'The API returns the wrong thing', pick: 'Call it directly with curl or Bruno, then read the server log.' },
      { when: 'You know where, but not why', pick: 'A breakpoint, and step through.' },
      { when: 'It only happens in production', pick: 'Error tracking, logs by request id, traces.' },
      { when: 'It used to work', pick: '`git bisect`, to find the commit that broke it.' },
    ],
  },

  modern: {
    lede: 'AI is a superb debugging partner and a terrible debugging replacement. Paste an error with no context and it will confidently guess, change five things, and perhaps hide the symptom. Give it the exact message, the stack trace, the steps to reproduce and what you have ruled out, and it often finds the cause first time. The method is yours; AI speeds up each step.',
    defaults: [
      'Read the whole error message, and the first lines of *your* code in the stack trace, before anything else.',
      'Reproduce first, and write the steps down.',
      'For any frontend bug involving data, check the Network tab: status code and response body.',
      'Change one thing at a time, and undo changes that didn’t help.',
      'Give AI the full error, the relevant code, the steps and what you have already ruled out.',
      'Finish every fix with a test that would have caught it.',
    ],
    aiGood: [
      'Explaining an error message or a stack trace',
      'Suggesting hypotheses, most likely first',
      'Writing a minimal reproduction',
      'Adding targeted log lines or breakpoints',
      'Explaining how an unfamiliar library behaves',
    ],
    aiWrong: [
      { mistake: 'Changes many things at once until the error disappears.', fix: 'One change at a time — and understand why it worked.' },
      { mistake: 'Hides errors with `try/catch`, `?.` or `|| []` everywhere.', fix: 'Find why the value is wrong; guard only where it can legitimately be missing.' },
      { mistake: 'Guesses without seeing the error.', fix: 'Paste the exact message, the stack trace and the steps.' },
      { mistake: 'Fixes the line that crashed, not the cause further up.', fix: 'Keep asking “why is this value wrong here?” until you reach the source.' },
      { mistake: 'Suggests upgrading or downgrading packages at random.', fix: 'Read the changelog for the version that broke, and confirm with a minimal example.' },
      { mistake: 'Declares it fixed without re-running the original steps.', fix: 'Repeat the exact steps — and add a test.' },
    ],
  },

  build: {
    title: 'Five planted bugs',
    brief: 'Your bookmarks app with five realistic bugs planted in different layers — browser, network, server, database, timing. Find each one with the right tool, write down how you found it, and fix the cause.',
    byHand: [
      { title: 'Describe the symptom precisely', text: 'Not “it’s broken”, but “adding a bookmark shows a spinner forever in Firefox, since this morning”.' },
      { title: 'Reproduce it', text: 'Find the shortest steps that trigger it every time, and write them down.' },
      { title: 'Read the Console and Network tabs', text: 'Errors in red; the failing request’s status, response and timing.', see: ['errors', 8] },
      { title: 'Read the server log', text: 'Find that request by its id, and read the error and its stack trace.', see: ['errors', 6] },
      { title: 'Cut it in half', text: 'Call the API directly with curl. Wrong there too? It’s the backend. Right there? It’s the frontend.' },
      { title: 'Test one hypothesis', text: 'A breakpoint or a single log line at the suspected spot. Confirm before you change anything.' },
      { title: 'Fix the cause, add a test', text: 'Fix it where it starts, then add a test that fails without your fix.', see: ['testing', 7] },
    ],
    withAI: {
      lede: 'Here, AI plays a different role: it plants the bugs and checks your reasoning — it never hands you the answer.',
      prompt: `Help me practise debugging. Take my bookmarks app (I'll paste the code) and plant exactly 5 bugs, one in each layer:
1. React (state or an effect), 2. the network (wrong URL, CORS or status handling), 3. Express (middleware order or a missing return),
4. MongoDB (a query or index problem), 5. timing (a race or a missing await).

Rules
- Make each bug realistic — the kind a real developer writes. No syntax errors.
- Give me the modified files and a one-line symptom for each bug, but do NOT tell me where the bugs are.
- When I report a bug as found, check my explanation of the cause and tell me whether I fixed the cause or only the symptom.`,
    },
    verify: [
      'For each bug you wrote down the symptom, the steps, the tool that found it, and the cause.',
      'You found at least one bug from the error message alone.',
      'At least once, the Network tab told you whether to look at the frontend or the backend.',
      'You confirmed every hypothesis before changing code.',
      'Every fix is at the cause, not where the error appeared.',
      'Each fix has a test that fails without it.',
      'The AI agreed that you fixed causes, not symptoms.',
    ],
  },

  breakIt: [
    {
      title: 'The “safe” fix',
      lang: 'jsx',
      code: `function TodoList({ todos }) {
  return <ul>{(todos || []).map((t) => <li key={t.id}>{t.text}</li>)}</ul>;
}`,
      err: [2],
      answer:
        'The crash is gone — and so is the information. If `todos` is undefined because the request failed or the API changed shape, the user now sees an empty list with no explanation. Find out why it is undefined: show a loading state while fetching and an error state when it fails, and fix the API if it returns the wrong shape.',
      see: ['data-fetching', 2],
    },
    {
      title: 'Swallowed',
      lang: 'js',
      code: `app.post('/api/bookmarks', async (req, res) => {
  try {
    const b = await Bookmark.create(req.body);
    res.status(201).json(b);
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});`,
      err: [5, 6],
      answer:
        'Every failure — bad input, a duplicate, a database outage — becomes the same vague 500, and nothing is logged. You have thrown away the one clue you had. Pass the error on (`next(err)`) to the error handler, which logs it with a request id and turns validation errors into 400s.',
      see: ['errors', 5],
    },
    {
      title: 'Changed everything',
      lang: 'text',
      code: `Bug: login fails.
Tried: upgraded express, changed the cookie options, rewrote the auth middleware,
cleared the database, switched to localStorage. Now it works.`,
      err: [2, 3],
      answer:
        'Five changes at once: you don’t know which one fixed it, at least one made things worse (tokens in localStorage are easier to steal), and the real cause may still be there. Undo, reproduce, test one hypothesis at a time — and start by reading the error the login request actually returned.',
    },
    {
      title: 'Due today',
      lang: 'js',
      code: `const today = new Date().toISOString().slice(0, 10);
const dueToday = todos.filter((t) => t.due === today);`,
      err: [1],
      answer:
        '`toISOString()` is in UTC, so for people far from UTC “today” flips at the wrong hour — the bug appears only for some users, at some times of day. Reproduce it by changing the time zone (DevTools → Sensors, or your computer’s settings), then compare dates in the user’s own time zone.',
    },
  ],

  explain: [
    'What are the five steps of debugging, and why does reproducing come first?',
    'How do you decide whether a bug is in the frontend or the backend?',
    'Why is hiding an error (`|| []`, an empty `catch`) worse than letting it crash?',
  ],

  deeper: [
    {
      q: 'What is `git bisect`?',
      a: 'A Git command that finds the commit that introduced a bug by binary search: you mark one good and one bad commit, and it checks out the one in the middle — narrowing thousands of commits to one in a dozen steps.',
    },
    {
      q: 'What is rubber-duck debugging?',
      a: 'Explaining your code, line by line, to someone — or something — that knows nothing about it. Saying aloud what each line *should* do often reveals the one that doesn’t. AI makes a very talkative duck.',
    },
    {
      q: 'Why do some bugs vanish when you add a log line?',
      a: 'Timing bugs depend on the exact order things happen, and logging changes that order slightly. Find them by reasoning about order and concurrency, not just by watching.',
    },
    {
      q: 'What is a minimal reproduction?',
      a: 'The smallest piece of code that still shows the bug. Making one often reveals the cause on the way — and it is exactly what library maintainers and AI need to help you.',
    },
    {
      q: 'How do you find a memory leak?',
      a: 'Take heap snapshots before and after repeating an action, and compare what grew — usually listeners, timers or caches that are never cleaned up.',
    },
    {
      q: 'How do you debug something you can’t reproduce?',
      a: 'Add logging and error tracking around the suspected area, ship it, and wait for it to happen again — this time with the evidence.',
    },
  ],

  next: [
    { q: 'How do you stop the same bug from coming back?', chapter: 'testing' },
    { q: 'How do you see what is happening in production?', chapter: 'observe' },
    { q: 'How do you find your way around code you didn’t write?', chapter: 'read-code' },
    { q: 'How do you use AI without losing understanding?', chapter: 'build-with-ai' },
  ],
};

export default writing;
