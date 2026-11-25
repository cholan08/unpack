/**
 * Chapter: How your code runs (Part I · How things work).
 * Follows the model chapter, written/identity.ts.
 */
import type { ChapterWriting } from '../types';

const writing: ChapterWriting = {
  hook: {
    story: [
      'You write ten lines, press Run, and something happens. Usually it is what you meant. Sometimes a value changes that you never touched, a timer fires in the “wrong” order, or a click handler remembers an old number.',
      'None of that is random. Your code runs inside a machine with strict rules — where values live, what a function can see, what runs now and what has to wait. People who know the rules read a bug like a sentence; people who don’t, guess.',
      'So what exactly happens, step by step, when your code runs?',
    ],
    predict: {
      q: 'In what order does this print? `console.log(\'A\'); setTimeout(() => console.log(\'B\'), 0); Promise.resolve().then(() => console.log(\'C\')); console.log(\'D\');`',
      options: ['A B C D', 'A D C B', 'A C B D', 'A D B C'],
      answer: 1,
      reveal:
        '**A D C B.** Ordinary code runs first, top to bottom: A, then D. Only when the [[call-stack|call stack]] is empty does the [[event-loop|event loop]] look at waiting callbacks — and promise callbacks ([[microtask|microtasks]]) always go before timers ([[task|tasks]]), even a 0 ms timer. So C, then B. Once you know the rules, the order stops being a surprise.',
    },
  },

  idea: {
    lede: 'JavaScript, Python, Java — every language runs your code by a handful of rules like these. Know these five and most “weird” bugs explain themselves.',
    jobs: [
      {
        title: 'Values live somewhere',
        text: 'Simple values (numbers, strings) are copied. Objects and arrays live in one place, and variables hold *references* to them — so two variables can point at the same object.',
      },
      {
        title: 'Names have a scope',
        text: 'A name is visible only inside the block or function where it is declared ([[lexical-scope|lexical scope]]). Lookups go outward, never inward.',
      },
      {
        title: 'Functions remember',
        text: 'A function keeps access to the variables around the place it was created — a [[closure]] — even after that code has finished running.',
      },
      {
        title: 'One thing at a time',
        text: 'JavaScript runs on one thread with a [[call-stack|call stack]]. Slow work — network, timers, files — is handed off, and its callback waits for the [[event-loop|event loop]].',
      },
      {
        title: 'Code comes in pieces',
        text: 'Files are [[esm|modules]] with their own scope, packages come from npm, and a [[bundler]] turns the whole graph into a few files for the browser.',
      },
    ],
    picture:
      'A kitchen with one chef. The chef cooks one dish at a time (one thread). Anything slow — bread in the oven, a delivery — goes to timers and helpers (the runtime), who ring a bell when it is ready (callbacks). Notes from the head waiter are read before any bell (microtasks before tasks). Each station has its own labelled jars, and every recipe card remembers which station it was written at (scope and closures).',
  },

  lessonNotes: {
    'values-references': 'Job 1: copies versus references, why `===` compares arrows not contents, and why React keeps asking for new objects.',
    closures: 'Jobs 2 and 3: scope, closures, the `var`-in-a-loop bug, and stale closures in React.',
    'event-loop': 'Job 4: the call stack, the two queues, and why promise callbacks beat timers.',
    promises: 'Job 4 in practice: callbacks, then promises, then async/await — and running work in parallel.',
    modules: 'Job 5: modules, npm packages, bundlers, tree shaking and code splitting.',
    'node-runtime': 'The same rules on a server: one thread, the operating system watching connections, and a pool for heavy lifting.',
  },

  options: {
    lede: 'The rules above are nearly universal. Languages differ in how strict they are, where they run and how they handle waiting. This Manual uses JavaScript and TypeScript because they run in the browser *and* on the server.',
    items: [
      {
        name: 'JavaScript',
        what: 'The language of the browser, and of servers through Node.js. Dynamic types, one thread with an event loop.',
        pickWhen: 'Anything on the web — and full-stack apps in a single language.',
        cost: 'Type mistakes only show up when the code runs.',
        examples: 'Every browser; Node.js, Deno and Bun on servers',
        tools: ['javascript', 'node'],
      },
      {
        name: 'TypeScript',
        what: 'JavaScript with types that are checked before the code runs; the types are removed to give plain JavaScript.',
        pickWhen: 'Any project bigger than a script — most professional JavaScript today.',
        cost: 'A type-check step, and types to learn and keep up to date.',
        examples: 'Vite and Next.js projects; recent Node versions can even run `.ts` files directly',
        tools: ['typescript'],
      },
      {
        name: 'Python',
        what: 'Readable, with a huge standard library; the main language of data science and AI.',
        pickWhen: 'AI and machine learning, data work, scripts and automation.',
        cost: 'Slow at heavy computation without native libraries, and a second language beside your web stack.',
        examples: 'FastAPI, Django, pandas, PyTorch',
        tools: ['python', 'django'],
      },
      {
        name: 'Go, Java, C#',
        what: 'Compiled, statically typed languages with real threads, built for large services.',
        pickWhen: 'High-throughput backends, big teams, companies already using them.',
        cost: 'More ceremony, and no code shared with the browser.',
        examples: 'Go; Java with Spring Boot; C# with ASP.NET',
        tools: ['go', 'java', 'csharp'],
      },
      {
        name: 'Rust',
        what: 'Systems-level speed with memory safety, and no garbage collector.',
        pickWhen: 'Performance-critical tools and services, WebAssembly, infrastructure.',
        cost: 'A steep learning curve.',
        examples: 'Rust — which also powers many JavaScript tools such as bundlers and linters',
        tools: ['rust'],
      },
    ],
    choose: [
      { when: 'Building web products, starting out', pick: 'JavaScript — then TypeScript as soon as a project has more than a few files.' },
      { when: 'AI, data or automation', pick: 'Python, beside your web stack.' },
      { when: 'A high-throughput service in a big team', pick: 'Go, Java or C#.' },
      { when: 'Tools where every millisecond counts', pick: 'Rust.' },
    ],
  },

  modern: {
    lede: 'AI writes code faster than anyone can read it. That makes the reader’s skill — predicting what code will do *before* running it — the one that matters most. Every bug in this chapter’s lessons is code that looks right, and AI produces it as confidently as you would.',
    defaults: [
      'TypeScript in strict mode for anything that will live longer than a week.',
      '`const` by default, `let` when you must, never `var`.',
      'Treat objects and arrays in state as read-only: make new ones instead of changing them.',
      '`async`/`await` with `try`/`catch`, and `Promise.all` for independent work.',
      'ES modules (`import`/`export`) everywhere, and few, well-maintained dependencies.',
      'Before running code you didn’t write, predict what it will do — then check.',
    ],
    aiGood: [
      'Explaining what a piece of code does, line by line',
      'Turning callbacks into async/await',
      'Adding TypeScript types to existing code',
      'Predicting output — which you then verify',
      'Explaining an unfamiliar error message',
    ],
    aiWrong: [
      { mistake: 'Changes a shared object or array that other code still uses.', fix: 'Copy before changing: spread, `structuredClone`, or `map` and `filter`.' },
      { mistake: 'Forgets an `await`, then uses the promise as if it were the value.', fix: 'Turn on the `no-floating-promises` lint rule and check every async call.' },
      { mistake: 'Runs independent requests one after another.', fix: '`Promise.all` for work that doesn’t depend on each other.' },
      { mistake: 'Uses `await` inside `forEach`, which doesn’t wait.', fix: '`for…of` with `await`, or `Promise.all` with `map`.' },
      { mistake: 'Captures a stale value in a closure — in a timer, an effect, a handler.', fix: 'Read the latest value: functional updates, refs, or the right dependencies.' },
      { mistake: 'Blocks the event loop with a huge loop or `readFileSync` inside a request.', fix: 'Async APIs, streams, or a worker thread for heavy CPU work.' },
      { mistake: 'Uses `==` and relies on type coercion.', fix: '`===`, always.' },
    ],
  },

  build: {
    title: 'Predict, then prove',
    brief: 'A small Node script that exercises every rule in this chapter. For each part, write down what you think it will print *before* you run it — then run it, and explain every surprise.',
    byHand: [
      { title: 'Copies and references', text: 'Create an object, assign it to a second variable, and change a field through the second. Predict the first. Then try again with `structuredClone`.', see: ['values-references', 3] },
      { title: 'Scope', text: 'Declare the same name with `let` inside and outside a block, and print both. Then try it with `var`.', see: ['closures', 3] },
      { title: 'A counter that remembers', text: 'Write `makeCounter()`, which returns a function, and call it three times. Make a second counter and show that they don’t share a count.', see: ['closures', 6] },
      { title: 'The loop bug', text: 'Three `setTimeout` calls inside `for (var i…)`, then the same with `let`. Predict both.', see: ['closures', 7] },
      { title: 'The queues', text: 'The A–B–C–D snippet from the top of this chapter, plus a second `.then` and a `setTimeout` inside a `.then`. Predict the order.', see: ['event-loop', 9] },
      { title: 'Wait well', text: 'Three fake 300 ms requests made with promises and `setTimeout`: run them one after another, then with `Promise.all`. Time both.', see: ['promises', 8] },
      { title: 'Split it up', text: 'Move half the script into a second file with `export`, `import` it back, and run it as an ES module.', see: ['modules', 2] },
    ],
    withAI: {
      lede: 'This time, use AI the other way round: not to write code, but to quiz you. A good tutor asks before it tells.',
      prompt: `I am learning how JavaScript runs. Quiz me — don't lecture me.

Make 8 short snippets (each under 10 lines) that test, in this order:
1. copying primitives vs objects, 2. shallow vs deep copy, 3. let vs var in blocks,
4. a closure counter, 5. var vs let in a loop with setTimeout,
6. microtasks vs tasks (promises vs setTimeout), 7. sequential await vs Promise.all timing,
8. a forgotten await.

For each snippet, show only the code and ask me to predict the output. Do NOT show the answers.
After I reply with my predictions, tell me which were wrong and explain each one using the call stack,
scope, references or the event loop — in at most two sentences each.`,
    },
    verify: [
      'You wrote down every prediction before running anything.',
      'You can explain why changing `b.name` also changed `a.name`.',
      'Your two counters keep separate counts.',
      'You can say why `var` prints `3 3 3` and `let` prints `0 1 2`.',
      'You predicted the queue order — or can explain exactly why you didn’t.',
      '`Promise.all` finished in about 300 ms; the sequence took about 900 ms.',
      'You got at least 6 of the AI’s 8 questions right.',
    ],
  },

  breakIt: [
    {
      title: 'A copy that isn’t',
      lang: 'js',
      code: `const original = { name: 'Ana', tags: ['admin'] };
const copy = { ...original };
copy.tags.push('editor');
console.log(original.tags); // ?`,
      err: [2, 3],
      answer:
        'Spread copies only the top level. `copy.tags` and `original.tags` are the same array, so `original.tags` is now `[\'admin\', \'editor\']`. Copy the nested part too (`tags: [...original.tags]`) or use `structuredClone(original)`.',
      see: ['values-references', 5],
    },
    {
      title: 'The loop that remembered',
      lang: 'js',
      code: `for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// prints 3, 3, 3`,
      err: [1],
      answer:
        '`var` creates a single `i` for the whole function, and all three callbacks close over it. By the time they run, the loop has finished and `i` is 3. `let` gives each pass its own `i`: 0, 1, 2.',
      see: ['closures', 7],
    },
    {
      title: 'Saving everything',
      lang: 'js',
      code: `async function saveAll(items) {
  items.forEach(async (item) => {
    await save(item);
  });
  console.log('all saved'); // really?
}`,
      err: [2],
      answer:
        '`forEach` doesn’t wait for async callbacks: it starts every `save` and returns at once, so “all saved” prints before anything is saved — and any errors go nowhere. Use `for (const item of items) await save(item)` for one at a time, or `await Promise.all(items.map(save))` for all together.',
      see: ['promises', 9],
    },
    {
      title: 'A busy server',
      lang: 'js',
      code: `app.get('/report', (req, res) => {
  let total = 0;
  for (let i = 0; i < 5_000_000_000; i++) total += i;
  res.json({ total });
});`,
      err: [3],
      answer:
        'This loop runs on the one thread that serves *everyone*. For several seconds no other request — not even a health check — gets an answer. Move heavy CPU work to a worker thread or a background job, or work it out ahead of time.',
      see: ['node-runtime', 4],
    },
  ],

  explain: [
    'Why does changing an object through one variable change it through another?',
    'What is a closure? Give an example you would actually write.',
    'Why does a promise callback run before a `setTimeout(…, 0)` callback?',
  ],

  deeper: [
    {
      q: 'What is the heap, and what does garbage collection do?',
      a: 'The heap is where objects live. The garbage collector frees objects that nothing refers to any more — which is why a closure or a forgotten event listener can keep memory alive longer than you expect.',
    },
    {
      q: 'Is JavaScript compiled or interpreted?',
      a: 'Both. Engines such as [[v8|V8]] start by interpreting, notice which code runs often, and compile those hot paths to fast machine code while the program is running — just-in-time compilation.',
    },
    {
      q: 'If JavaScript has one thread, how do Web Workers exist?',
      a: 'A worker is a separate thread with its own event loop and memory. It talks to the main thread only by sending messages — useful for heavy computation that would otherwise freeze the page.',
    },
    {
      q: 'What is `this`?',
      a: 'A value decided by *how* a function is called, not where it is written — usually the object before the dot. Arrow functions don’t have their own `this`; they use the one around them.',
    },
    {
      q: 'What does “functions are values” mean?',
      a: 'A function can be stored in a variable, passed to another function and returned from one. That is what makes callbacks, closures — and React components — possible.',
    },
    {
      q: 'What does TypeScript actually check?',
      a: 'That values are used consistently with their types — calling a function with the right arguments, not reading a property that might be missing. The types disappear when the code runs; they are a safety net while you write.',
    },
  ],

  next: [
    { q: 'How does a message cross the world to reach a server?', chapter: 'how-the-internet-works' },
    { q: 'What happens between pressing Enter and seeing a page?', chapter: 'how-the-web-works' },
    { q: 'How does a click change what is on screen?', chapter: 'interact' },
    { q: 'How does code on your laptop become a product?', chapter: 'how-code-ships' },
  ],
};

export default writing;
