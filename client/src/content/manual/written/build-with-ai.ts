/**
 * Chapter: Build with AI (Part III · The builder’s craft).
 * Follows the model chapter, written/identity.ts.
 */
import type { ChapterWriting } from '../types';

const writing: ChapterWriting = {
  hook: {
    story: [
      'You describe an app in a few sentences, and an AI writes a thousand lines of working code in a minute. It feels like the end of learning to code. Then something breaks in a way neither of you understands, each AI fix makes it worse, and the project quietly dies.',
      'AI hasn’t removed the need to understand software; it has moved it. Typing code is now cheap. Knowing what to ask for, reading what comes back, checking that it really works and noticing what it got wrong — that is the job now, and it is what this whole Manual has been building toward.',
      'If AI can write the code, what is left for you to know?',
    ],
    predict: {
      q: 'An AI writes a login system for you, and it works when you try it. What should you do before shipping it?',
      options: [
        'Ship it — it works',
        'Ask the AI whether it is secure, and ship if it says yes',
        'Read it, and check the things AI often gets wrong: where the token lives, how passwords are hashed, whether every route checks ownership',
        'Throw it away and write it yourself',
      ],
      answer: 2,
      reveal:
        '“Works when I try it” only proves the happy path. AI-written code fails where a quick demo never goes — another user’s data, a forged token, a thousand password guesses — and asking “is it secure?” mostly gets reassurance. Check it the way every chapter’s *What AI gets wrong* list shows: read the risky parts, and run the checks yourself.',
    },
  },

  idea: {
    lede: 'Whatever the tool — a chat assistant, an editor copilot or a coding agent working on its own — building well with AI is the same loop.',
    jobs: [
      {
        title: 'Specify',
        text: 'Say what to build, the rules it must follow, what is out of scope and how you will check it. A good prompt is a small spec.',
      },
      {
        title: 'Give it context',
        text: 'The relevant files, your conventions, the exact error, the docs for the version you use. Wherever you leave a gap, AI guesses.',
      },
      {
        title: 'Generate in small steps',
        text: 'One feature, one file, one change at a time — each small enough to read and test before the next.',
      },
      {
        title: 'Read and verify',
        text: 'Read every line you ship. Run it, run the tests, and check the usual weak spots: security, errors, edge cases, invented APIs.',
      },
      {
        title: 'Own the result',
        text: 'You understand it, you can change it, and you would defend it in a review. If you can’t explain a line, it isn’t done.',
      },
    ],
    picture:
      'A head chef with a very fast, very confident new cook. The cook can make anything instantly — but sometimes salts twice, uses an ingredient that has run out, or follows a recipe from another restaurant. The head chef writes clear orders (specify), shows where everything is (context), asks for one dish at a time (small steps), tastes every plate before it leaves the kitchen (verify) — and answers for every plate (own it).',
  },

  options: {
    lede: 'AI tools sit on a spectrum from “answers questions” to “works on its own”. More autonomy saves more time — and needs better specs, better tests and closer review.',
    items: [
      {
        name: 'A chat assistant',
        what: 'You ask; it explains or writes snippets; you take what you need.',
        pickWhen: 'Learning, explaining errors, exploring ideas, small pieces of code.',
        cost: 'Copy-paste without context — it is easy to paste code you don’t understand.',
        examples: 'Claude, ChatGPT, Gemini',
      },
      {
        name: 'An editor assistant',
        what: 'Completions and chat inside your editor, aware of the files you have open.',
        pickWhen: 'Everyday coding: finishing lines, small functions, refactors.',
        cost: 'Suggestions arrive faster than you can judge them.',
        examples: 'GitHub Copilot, Cursor, the AI features of VS Code and JetBrains editors',
      },
      {
        name: 'A coding agent',
        what: 'An AI that reads your codebase, edits many files, runs commands and tests, and keeps going until a task is done.',
        pickWhen: 'Well-defined tasks with a way to check them: features with tests, bug fixes, migrations.',
        cost: 'Large changes to review — and vague tasks lead to confident detours.',
        examples: 'Claude Code, OpenAI Codex, Copilot’s agent mode, Cursor’s agent',
      },
      {
        name: 'An app generator',
        what: 'Describe an app and get a running prototype, often hosted for you.',
        pickWhen: 'Prototypes and demos — testing an idea with real people within a day.',
        cost: 'Generic designs and code you didn’t shape, hard to take to production without understanding it.',
        examples: 'v0, Bolt, Lovable, Replit',
      },
      {
        name: 'Spec and tests first',
        what: 'You write the spec and the tests; the AI writes code until the tests pass; you review.',
        pickWhen: 'Anything that matters — the most reliable way to work with agents.',
        cost: 'Thinking up front that you can’t skip.',
        examples: 'Any of the tools above, with a test suite as the judge',
      },
    ],
    choose: [
      { when: 'You are learning, or stuck on an error', pick: 'A chat assistant — ask it to explain, not only to fix.' },
      { when: 'Everyday coding in a project you know', pick: 'An editor assistant.' },
      { when: 'A well-defined task with tests to prove it', pick: 'A coding agent, with a clear spec and a human review.' },
      { when: 'Testing an idea with people this week', pick: 'An app generator, for a throwaway prototype.' },
      { when: 'Anything that holds real people’s data', pick: 'Spec and tests first, then AI — and read every line.' },
    ],
  },

  modern: {
    lede: 'This chapter *is* the modern way. In short: AI is a brilliant, fast, over-confident collaborator. Every other chapter of this Manual ends its *modern way* with what AI gets wrong in that block — put those lists together, and you have your review checklist.',
    defaults: [
      'Write a short spec before you prompt: what, the rules, what is out of scope, how you will check it.',
      'Keep a project instructions file — conventions, commands, rules — that the AI reads every time.',
      'Work in small, reviewable steps, with a Git commit between them.',
      'Make tests the judge: ask for them first or alongside, and run them yourself.',
      'Read every line that touches money, identity, permissions or personal data.',
      'Check every library call against current docs, and pin your versions.',
    ],
    aiGood: [
      'Boilerplate, scaffolding, and repetitive changes across many files',
      'Explaining unfamiliar code, errors and ideas at your level',
      'Writing tests, and listing edge cases',
      'Translating between languages, frameworks and versions',
      'Reviewing your code for bugs you missed',
    ],
    aiWrong: [
      { mistake: 'Invents functions, options or packages that don’t exist.', fix: 'Check the docs, run it, and look twice at unfamiliar imports and look-alike package names.' },
      { mistake: 'Writes the happy path and skips errors, limits and permissions.', fix: 'Ask for them explicitly — and test them.' },
      { mistake: 'Makes a failing test pass by changing the test.', fix: 'Tell it the tests are the spec, and review test changes separately.' },
      { mistake: 'Makes sweeping changes for a small request.', fix: 'Ask for the smallest change, and review the diff.' },
      { mistake: 'Says code is secure or correct because you asked.', fix: 'Verify it yourself, with checks and tests.' },
      { mistake: 'Uses outdated patterns from older versions.', fix: 'Tell it your versions, and point it at current docs.' },
      { mistake: 'Loses track of the goal in a long session.', fix: 'Restate the spec, and start a fresh session for each new task.' },
    ],
  },

  build: {
    title: 'Ship a feature with an agent — and own it',
    brief: 'Use an AI coding agent to add a real feature to your bookmarks app — sharing a list by link, read-only — the way a professional would: spec first, tests as the judge, small steps, careful review.',
    byHand: [
      { title: 'Write the spec', text: 'One page: what “share by link” means, who can see what, what must never happen (a shared link must never allow editing), what is out of scope, and how you will check it.' },
      { title: 'Give it a project file', text: 'A short instructions file with your stack, conventions and commands (`npm test`, `npm run build`), so the agent starts from your rules.' },
      { title: 'Tests first', text: 'Ask for the tests only: a shared link shows the list; editing through it gets 403; a revoked link gets 404. Read them before any feature code exists.', see: ['testing', 7] },
      { title: 'Small steps', text: 'Model and API first, then the interface. Commit after each step that passes.', see: ['git', 2] },
      { title: 'Read every line', text: 'Especially the permission check and the link token: is it random and long enough? Is it checked on every route?', see: ['authn-authz', 4] },
      { title: 'Check the usual suspects', text: 'Go through the *What AI gets wrong* lists in *Know who the user is* and *Control access and stay safe*.' },
      { title: 'Explain it back', text: 'Write three sentences on how sharing works and why it is safe. If you can’t, you aren’t done.' },
    ],
    withAI: {
      lede: 'This is the prompt shape to reuse for every serious task: read the project rules, here is the spec, tests first, smallest change, don’t touch the tests, report the diff.',
      prompt: `You are working in my bookmarks app (Express + Mongoose API, React + Vite client). Read CLAUDE.md (or my project notes) first and follow its conventions.

Task: "Share a list by link, read-only."

Spec
- The owner can create a share link for a list, and revoke it.
- The link contains a random token (at least 128 bits, from crypto.randomBytes); store only a hash of it.
- Anyone with the link can view that list's bookmarks. Nobody can create, edit or delete through it — those return 403.
- A revoked or unknown token returns 404. The owner's other lists are never visible through a link.

Process
1. First write only the tests (Vitest + Supertest) for every rule above, then stop so I can review them.
2. Then implement the API with the smallest change that passes them. Run the tests and show me the output.
3. Then the React UI: a "Share" button, copy link, revoke.

Don't modify the tests to make them pass. Don't touch unrelated files. After each step, summarise the diff.`,
    },
    verify: [
      'You wrote the spec and the must-never before the agent wrote any code.',
      'You read and approved the tests before any feature code existed.',
      'All tests pass — and you ran them yourself.',
      'Editing through a share link returns **403**; a revoked link returns **404**.',
      'The token is random and long, and only its hash is stored.',
      'The diff touches only files related to sharing.',
      'You can explain the feature, and why it is safe, without looking at the code.',
    ],
  },

  breakIt: [
    {
      title: 'A package that doesn’t exist',
      lang: 'bash',
      code: `$ npm install express-secure-sharelinks
npm ERR! 404 Not Found - GET https://registry.npmjs.org/express-secure-sharelinks`,
      err: [1],
      answer:
        'AI sometimes invents plausible package names. A 404 is the lucky outcome: attackers register commonly hallucinated names with malicious code inside. Before installing anything an AI suggests, check that it exists, who publishes it, how widely it is used and when it was last updated.',
    },
    {
      title: 'Fixing the test',
      lang: 'diff',
      code: `- expect(res.status).toBe(403);
+ expect(res.status).toBe(200); // updated to match current behaviour`,
      err: [2],
      answer:
        'The test said editing through a share link must be forbidden; the code allowed it; and the AI “fixed” the test. Now the bug is locked in. Tests are the spec: when one fails, fix the code — or decide, consciously, that the rule was wrong.',
    },
    {
      title: 'It says it’s secure',
      lang: 'text',
      code: `You: Is this login code secure?
AI:  Yes! This implementation follows security best practices and is production-ready.`,
      err: [2],
      answer:
        'Asked a yes-or-no question, AI tends to reassure. It might be right — or it might not have looked at the token storage, the hashing or the rate limits at all. Ask specific questions (“where is the token stored, and who can read it?”) and run the checks yourself.',
    },
    {
      title: 'The vague request',
      lang: 'text',
      code: `Make the app better and fix any bugs.`,
      err: [1],
      answer:
        'With no goal, no rules and no way to check, an agent makes many plausible changes across many files — some helpful, some harmful, all needing review. Give it one task, a spec, the files that matter, and the test that proves it is done.',
    },
  ],

  explain: [
    'Which parts of building are still yours when AI writes the code?',
    'Why write the tests before asking an AI to write the feature?',
    'Name three things AI often gets wrong — and how you would catch each one.',
  ],

  deeper: [
    {
      q: 'How do coding agents actually work?',
      a: 'A language model in a loop with tools: it reads files, runs commands and tests, looks at the results and decides the next step, until the task is done or it is stuck. Its quality depends heavily on the instructions, context and tests you give it.',
    },
    {
      q: 'What is a context window?',
      a: 'How much text the model can consider at once — your prompt, the files, the conversation so far. In long sessions, earlier details get less attention, so keep tasks focused and restate the rules that matter.',
    },
    {
      q: 'What is prompt injection?',
      a: 'Text hidden in the data an AI reads — a web page, an issue, a file — that tries to give it instructions. Agents that act on what they read need limits on what they are allowed to do.',
    },
    {
      q: 'Will AI replace developers?',
      a: 'It is replacing a lot of typing. Deciding what to build, understanding systems, judging trade-offs, checking correctness and owning the result are becoming *more* valuable — which is exactly what this Manual teaches.',
    },
    {
      q: 'How do I keep learning when AI writes the code?',
      a: 'Ask it to explain, predict before you run, build each block by hand once, and read every line you ship. Use it as a tutor as well as a typist.',
    },
    {
      q: 'What is “vibe coding”?',
      a: 'Building by prompting and accepting whatever works on screen, without reading the code. Fine for throwaway experiments; dangerous for anything with users, data or money.',
    },
  ],

  next: [
    { q: 'How do you know what to ask the AI to build?', chapter: 'plan' },
    { q: 'How do you find a bug in code you didn’t write?', chapter: 'debug' },
    { q: 'How do you find your way around a codebase quickly?', chapter: 'read-code' },
    { q: 'How do you check the AI’s work automatically?', chapter: 'testing' },
  ],
};

export default writing;
