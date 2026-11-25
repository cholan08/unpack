/**
 * Chapter: Read docs and other people’s code (Part III · The builder’s craft).
 * Follows the model chapter, written/identity.ts.
 */
import type { ChapterWriting } from '../types';

const writing: ChapterWriting = {
  hook: {
    story: [
      'You join a project with ten thousand files. Or you install a library and its examples don’t match your case. Or an AI agent has just changed forty files in your app. Each time, the same skill decides whether you are useful within a day or lost for a month: reading code you didn’t write.',
      'Experienced developers don’t read a codebase front to back. They start from a question, find the entry points, follow one request through, and use tools — search, “go to definition”, tests, Git history — to read only what matters.',
      'How do you find your way around ten thousand files you didn’t write?',
    ],
    predict: {
      q: 'You need to change how a big app saves a user’s profile. Where do you start?',
      options: [
        'Read every file, from the top of the folder tree',
        'Search for the API route or the button’s text, then follow that one request through the code',
        'Rewrite the profile feature from scratch',
        'Ask the team to explain the whole codebase',
      ],
      answer: 1,
      reveal:
        'Start from something visible and follow it. Search for the URL (`/api/profile`) or the button’s text, find where it is handled, and trace the request: route, handler, service, database. You will read twenty files instead of ten thousand, and understand exactly the part you need. Everything else can stay a mystery until a question leads you there.',
    },
  },

  idea: {
    lede: 'A library’s documentation, a teammate’s module, an open-source project, an AI’s pull request — reading code you didn’t write follows the same five moves.',
    jobs: [
      {
        title: 'Start from a question',
        text: '“Where is the profile saved?” beats “how does this codebase work?”. A question tells you what you can skip.',
      },
      {
        title: 'Find the entry points',
        text: 'The README, the `package.json` scripts, the routes file, the main component — the places where everything begins.',
      },
      {
        title: 'Follow one path',
        text: 'Trace a single request or click from start to finish with search and “go to definition”, writing down each file on the way.',
      },
      {
        title: 'Read the tests and the history',
        text: 'Tests show how code is meant to be used; `git log` and blame show why each line exists.',
      },
      {
        title: 'Check your understanding',
        text: 'Predict what a change will do, make it, and see. Run it, debug it, or ask someone — or an AI — to confirm.',
      },
    ],
    picture:
      'Arriving in a new city. You don’t walk every street. You start from where you need to go (a question), find the main station and the big roads (entry points), follow one route on the map (one path), read the street signs and the little history plaques (tests and Git history), and check you were right by actually getting there (running it).',
  },

  lessonNotes: {},

  options: {
    lede: 'Use the tool that answers your question fastest. Most of reading code is searching well.',
    items: [
      {
        name: 'Official documentation',
        what: 'Guides, API references and examples from the library’s own authors — for the version you use.',
        pickWhen: 'Learning a library, and checking how something is meant to be used.',
        cost: 'It can be out of date, or thin on edge cases.',
        examples: 'react.dev, MDN, nodejs.org, mongoosejs.com',
        tools: ['react', 'node'],
      },
      {
        name: 'Search and navigation',
        what: 'Full-text search, “go to definition”, “find all references” and symbol search in your editor.',
        pickWhen: 'Finding where something is defined, used or changed.',
        cost: 'Dynamic code — names built from strings — can hide connections.',
        examples: 'VS Code search, ripgrep, GitHub code search',
      },
      {
        name: 'Tests and examples',
        what: 'The project’s own tests and example folders show real usage.',
        pickWhen: 'Understanding what a function is supposed to do, and its edge cases.',
        cost: 'Not every project has good tests.',
        examples: '`*.test.ts` files, `examples/` folders',
      },
      {
        name: 'History',
        what: 'Commit messages, blame and pull request discussions explain why code is the way it is.',
        pickWhen: 'A line looks strange and you are tempted to delete it.',
        cost: 'Only as good as past commit messages.',
        examples: '`git log -p`, `git blame`, GitHub’s blame view',
      },
      {
        name: 'Running and debugging',
        what: 'Run the code with breakpoints and logs, and watch what actually happens.',
        pickWhen: 'Reading alone leaves you unsure.',
        cost: 'You need the project running on your machine.',
        examples: 'The VS Code debugger, a quick `console.log`',
      },
      {
        name: 'An AI guide',
        what: 'An AI with access to the codebase maps it, finds where things happen and explains modules.',
        pickWhen: 'Getting your bearings quickly in a big codebase.',
        cost: 'It can be confidently wrong — confirm with search and by running code.',
        examples: 'Coding agents and editor chat with access to the whole project',
      },
    ],
    choose: [
      { when: 'How is this library meant to be used?', pick: 'Its official docs for your version, then its examples.' },
      { when: 'Where does our code do this?', pick: 'Search for something visible, then go to definition.' },
      { when: 'Why is this line here?', pick: '`git blame`, and the pull request that added it.' },
      { when: 'What does this function really do?', pick: 'Its tests — then run it with a breakpoint.' },
      { when: 'You are brand new to the codebase', pick: 'The README and scripts, an AI-guided tour, then follow one request.' },
    ],
  },

  modern: {
    lede: 'In the AI era you will read far more code than you write — your teammates’, your libraries’, and above all your AI’s. Reading quickly and accurately has become a core skill, and AI is also the best guide you have ever had for it, as long as you check its map against the territory.',
    defaults: [
      'Read the docs for the exact version you use — check the version in `package.json` first.',
      'Start every exploration from a concrete question and something visible: a URL, a button, an error.',
      'Use “go to definition” and “find references” before scrolling.',
      'Read the tests before changing code you don’t understand.',
      'Check `git blame` before deleting anything that looks pointless.',
      'Ask AI for a map, then verify it by searching and running.',
    ],
    aiGood: [
      'Giving a guided tour of a codebase: entry points, main modules, how data flows',
      'Explaining a confusing function or regular expression',
      'Finding where a feature is implemented',
      'Summarising a long pull request',
      'Explaining a library’s docs at your level, for your use case',
    ],
    aiWrong: [
      { mistake: 'Describes how a library worked in an older version.', fix: 'Tell it your version, and check against current docs.' },
      { mistake: 'Claims a function exists in your codebase when it doesn’t.', fix: 'Search for it yourself before relying on it.' },
      { mistake: 'Explains what code “probably” does without reading it.', fix: 'Give it the actual file, and ask it to cite lines.' },
      { mistake: 'Summarises a pull request and misses the risky change.', fix: 'Read the security- and data-related parts of the diff yourself.' },
      { mistake: 'Suggests deleting code it doesn’t understand.', fix: 'Check the history and the tests first.' },
    ],
  },

  build: {
    title: 'Find your way around a real codebase',
    brief: 'Pick an open-source project you use — or this very app, Unpacked — and in two hours go from “no idea” to a small, correct change, using a question, search, tests, history and an AI guide.',
    byHand: [
      { title: 'Pick a question', text: 'Small and visible: “Where does the app set the page title?” or “How is a lesson’s progress saved?”.' },
      { title: 'Read the front door', text: 'The README, the `package.json` scripts and the top-level folders. Write three sentences about what lives where.' },
      { title: 'Search for something visible', text: 'Search for a piece of text you can see on screen, or a URL, and open the file that matches.' },
      { title: 'Follow one path', text: 'From there, use “go to definition” step by step, and write down every file you pass through.', see: ['request-journey', 1] },
      { title: 'Read the tests', text: 'Find the tests for that code (search for its name in `*.test.*` files). What do they say it should do?' },
      { title: 'Read the history', text: 'Run `git log -p` or blame on the key file: why did its last few changes happen?', see: ['git', 3] },
      { title: 'Make a small change', text: 'Change something small, predict the effect, run it, and see whether you were right.' },
    ],
    withAI: {
      lede: 'Let an AI with access to the code give you the tour — but make it cite files and lines, so you can check every claim.',
      prompt: `I'm new to this codebase, and I want to answer one question: [your question, e.g. "how is lesson progress saved?"].

1. Give me a short map: the entry points, the main folders, and how a request (or a click) flows through them. Cite file paths.
2. List the 5–10 files I should read to answer my question, in reading order, with one line each on why.
3. For every claim you make, point to the file and line. If you are unsure, say so.
4. Suggest a tiny change I could make to test my understanding, and what I should expect to happen.

Do not change any code.`,
    },
    verify: [
      'You wrote your question down before you started.',
      'You can describe the project’s main folders in three sentences.',
      'You followed one request or click through every file it touches.',
      'At least one test or commit message explained something to you.',
      'You checked at least two of the AI’s claims by searching — and know whether they were right.',
      'Your small change did exactly what you predicted, or you know why it didn’t.',
      'It took hours, not weeks.',
    ],
  },

  breakIt: [
    {
      title: 'Docs for another version',
      lang: 'js',
      code: `// copied from a tutorial written for React Router v5
import { Switch, Route, useHistory } from 'react-router-dom';`,
      err: [2],
      answer:
        '`Switch` and `useHistory` were replaced in later versions (by `Routes` and `useNavigate`). Code from an old tutorial — or from an AI trained on many of them — fails against the version you installed. Check `package.json`, then read the docs for that exact version.',
    },
    {
      title: 'The pointless line',
      lang: 'js',
      code: `// TODO: why is this here?
await new Promise((r) => setTimeout(r, 50));`,
      err: [2],
      answer:
        'It looks pointless, so deleting it is tempting. `git blame` might show a commit like “wait for the search index to refresh before redirecting”. The line may be a poor fix — but it is hiding a real problem. Learn why it exists, then fix the cause properly.',
    },
    {
      title: 'Reading everything',
      lang: 'text',
      code: `Day 1: read src/a…   Day 2: src/c…   Day 5: still in src/components/, no change made.`,
      err: [1],
      answer:
        'Reading top to bottom without a question means trying to remember everything and understanding nothing. Start from one question and one visible thing, follow that path, and leave the rest until a question leads you there.',
    },
    {
      title: 'The confident map',
      lang: 'text',
      code: `AI: Progress is saved by saveProgress() in src/utils/storage.ts.
(There is no src/utils/storage.ts in this project.)`,
      err: [1],
      answer:
        'An AI guide can describe the codebase it *expects* rather than the one you have. Always ask it to cite paths and lines, and search to confirm before you rely on any claim.',
    },
  ],

  explain: [
    'Why start reading a codebase from a question rather than from the first file?',
    'How do tests and Git history help you understand code?',
    'How do you check whether an AI’s explanation of a codebase is right?',
  ],

  deeper: [
    {
      q: 'What is a language server?',
      a: 'The engine behind “go to definition”, “find references” and rename in your editor. It understands your code’s structure, so navigation works across thousands of files.',
    },
    {
      q: 'How do I read an unfamiliar library?',
      a: 'Look at what your code calls, not the whole library. Go to the definition of the call, read that function and its docs, and stop once you understand what it returns and what can go wrong.',
    },
    {
      q: 'How do I review a large pull request?',
      a: 'Read the description and the tests first, then the risky files — permissions, data, money — then the rest. If it is too big to review honestly, ask for it to be split.',
    },
    {
      q: 'Why read open-source code?',
      a: 'It is the largest free library of real, working software there is. Seeing how good projects structure code, write tests and explain their changes teaches more than most tutorials.',
    },
    {
      q: 'What makes documentation good?',
      a: 'A quick start that works, explanations of *why*, a reference for every option, examples of common tasks — and versions or dates, so you know it is current. Write your own the same way.',
    },
    {
      q: 'How long should a new codebase take to learn?',
      a: 'With a good README and these habits: a first small change in a day, comfortable in a few weeks. Much longer usually means missing documentation — and writing it is a great first contribution.',
    },
  ],

  next: [
    { q: 'How do you find a bug in code you didn’t write?', chapter: 'debug' },
    { q: 'How do you work with others on the same code?', chapter: 'collaborate' },
    { q: 'How do you build safely with AI?', chapter: 'build-with-ai' },
    { q: 'How do you design a system other people can read?', chapter: 'design' },
  ],
};

export default writing;
