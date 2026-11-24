import { box, choice, defineLesson, defineSandbox, dot, flow, fmt, link, patch, practice, range, toggle, zone } from '@/content/dsl';
import type { FlowSpec, LinkSpec } from '@/engine/types';

/* ---------- layout: one async function on the left, three API endpoints on the right ---------- */
const fn = box(170, 300, 'loadDashboard()', { sub: 'async function', icon: 'code', tone: 'client', w: 230 });
const ui = box(170, 470, 'Other code', { sub: 'clicks · renders', icon: 'bolt', tone: 'client', w: 230 });
const zs = zone(760, 300, 300, 520, 'API', { tone: 'server', icon: 'server' });
const e1 = box(760, 160, 'GET /api/me', { sub: '100 ms', icon: 'user', tone: 'server', w: 230 });
const e2 = box(760, 300, 'GET /api/todos', { sub: '100 ms', icon: 'express', tone: 'server', w: 230 });
const e3 = box(760, 440, 'GET /api/stats', { sub: '100 ms', icon: 'gauge', tone: 'server', w: 230 });

const pending = dot(420, 300, 'pending', { sub: 'not settled yet', tone: 'warn' });
const fulfilled = dot(545, 185, 'fulfilled', { sub: 'has a value', tone: 'ok' });
const rejected = dot(545, 415, 'rejected', { sub: 'has an error', tone: 'danger' });

const base = { fn, zs, e1, e2, e3 };
const links: LinkSpec[] = [link('fn', 'e1'), link('fn', 'e2'), link('fn', 'e3')];

const call = (to: 'e1' | 'e2' | 'e3', label: string, o: Partial<FlowSpec> = {}): FlowSpec =>
  flow(['fn', to], { label, back: 'res', backLabel: 'data', speed: 1.6, every: 7, ...o });
const sequential = [call('e1', 'getUser()'), call('e2', 'getTodos()', { offset: 2.1 }), call('e3', 'getStats()', { offset: 4.2 })];

/* ---------- sandbox: how the dashboard waits, one slow endpoint, one failure ---------- */
const sandbox = defineSandbox({
  intro: 'Pick how `loadDashboard()` waits, slow down one endpoint, or make one fail. The **total wait** is what the user sits through.',
  controls: [
    choice('mode', 'How you wait', [['seq', 'await × 3'], ['all', 'Promise.all'], ['settled', 'allSettled']]),
    range('stats', 'GET /api/stats takes', { min: 50, max: 3000, value: 100, log: true, unit: 'ms' }),
    toggle('fail', 'GET /api/todos fails (500)'),
  ],
  compute: (v) => {
    const mode = String(v.mode);
    const stats = Number(v.stats);
    const fail = v.fail === true;
    const seq = mode === 'seq';
    const total = seq ? (fail ? 200 : 200 + stats) : mode === 'all' && fail ? 100 : Math.max(100, stats);
    const statsCalled = !(seq && fail);
    const failed = fail && mode !== 'settled';
    const tone = failed ? 'danger' : total > 300 ? 'warn' : 'ok';
    const pace = Math.max(0.35, Math.min(1.6, 160 / stats)); // a slow endpoint → a slow packet
    const every = (seq ? 7 : 3.8) + (pace < 1 ? 4 : 0);
    const err = fail ? ({ back: 'err', backLabel: '500' } as const) : {};
    const flows: FlowSpec[] = seq
      ? [
          call('e1', 'await getUser()', { every }),
          call('e2', 'await getTodos()', { every, offset: 2.1, ...err }),
          ...(statsCalled ? [call('e3', 'await getStats()', { every, offset: 4.2, speed: pace })] : []),
        ]
      : [call('e1', 'getUser()', { every }), call('e2', 'getTodos()', { every, ...err }), call('e3', 'getStats()', { every, speed: pace })];
    const nodes = patch(base, {
      fn: { state: failed ? 'error' : 'ok', badge: failed ? { text: 'catch (err)', tone: 'danger' } : { text: `${fmt(total)} ms`, tone } },
      e2: fail ? { state: 'error', badge: { text: '500', tone: 'danger' } } : {},
      e3: { sub: `${fmt(stats)} ms`, ...(statsCalled ? {} : { state: 'dim', badge: { text: 'never called', tone: 'neutral' } }) },
    });
    const note =
      mode === 'seq'
        ? fail
          ? '`getTodos()` rejects, so its `await` throws and `getStats()` never even starts. The `catch` gets the error after **200 ms**.'
          : `Each \`await\` waits for the one before: 100 + 100 + ${fmt(stats)} = **${fmt(total)} ms** — though none of them needed the others.`
        : mode === 'all'
          ? fail
            ? '`Promise.all` rejects the moment `/api/todos` fails (**100 ms**) — and the user and stats results are thrown away, even though they worked.'
            : `All three start at once; you wait for the slowest: **${fmt(total)} ms**.${stats > 300 ? ' One slow call holds up the whole dashboard — consider loading stats on their own.' : ''}`
          : fail
            ? `\`allSettled\` waits for all three (**${fmt(total)} ms**) and hands back *fulfilled · rejected · fulfilled*: show the user and stats, and an error just for the todos.`
            : `Everything runs together, like \`Promise.all\` (**${fmt(total)} ms**). The difference shows up when something fails — try it.`;
    return { scene: { nodes, links, flows }, metrics: { time: total, depth: 0 }, tone, note };
  },
});

export default defineLesson({
  metrics: [
    { id: 'time', label: 'Total wait', unit: 'ms', better: 'lower' },
    { id: 'depth', label: 'Nesting depth', better: 'lower' },
  ],
  goals: [
    { text: 'Why callbacks nest into pyramids', step: 2 },
    { text: 'The three states of a promise', step: 3 },
    { text: 'async/await, and what await really pauses', step: 5 },
    { text: 'Handling errors with try/catch', step: 6 },
    { text: 'Running requests in parallel with Promise.all', step: 8 },
    { text: 'The classic async mistakes', step: 9 },
    { text: 'Race sequential, parallel and settled waits', step: 10 },
  ],
  steps: [
    {
      short: 'Waiting',
      beat: 'setup',
      title: 'The answer isn’t here yet',
      body: [
        'A request to your API takes ~100 ms. As the event-loop lesson showed, JavaScript can’t just stop and wait — so `fetch` returns **immediately**, long before the response arrives.',
        'Which raises the question: if it returns right away, what does it return, and how do you get at the data later?',
      ],
      code: {
        file: 'dashboard.js',
        lang: 'js',
        code: `const todos = fetch('/api/todos');
console.log(todos); // the response hasn't arrived yet… so what is this?`,
        hl: [1, 2],
      },
      metrics: { time: 100, depth: 0 },
      scene: { nodes: base, links, flows: [call('e2', 'fetch /api/todos', { backLabel: '100 ms later', every: 3.4, speed: 1 })] },
    },
    {
      short: 'Callbacks',
      beat: 'problem',
      title: 'Callbacks inside callbacks inside callbacks',
      body: [
        'The old answer: pass a [[callback]] — “call this when you’re done”. One step is fine. But the dashboard needs the user, *then* their todos, *then* their stats, so each call goes inside the previous one’s callback.',
        'The code drifts right into a pyramid, every level repeats its own error check, and one forgotten check swallows a failure. That’s [[callback-hell|callback hell]].',
      ],
      code: {
        file: 'dashboard.js',
        lang: 'js',
        code: `getUser((err, user) => {
  if (err) return showError(err);
  getTodos(user.id, (err, todos) => {
    if (err) return showError(err);
    getStats(user.id, (err, stats) => {
      if (err) return showError(err);
      render(user, todos, stats);
    });
  });
});`,
        err: [2, 4, 6],
      },
      metrics: { time: 300, depth: 3 },
      scene: { nodes: patch(base, { fn: { state: 'error', badge: { text: '3 levels deep', tone: 'danger' } } }), links, flows: sequential },
    },
    {
      short: 'A promise',
      beat: 'solution',
      title: 'A promise: a placeholder for a future value',
      body: [
        '`fetch` returns a [[promise]]: an object that stands in for the result. It starts **pending**. Later it settles exactly once — **fulfilled** with a value, or **rejected** with an error.',
        'Instead of passing your callback *into* the function, you attach it *to the promise* with `.then()` (success) and `.catch()` (failure).',
      ],
      code: {
        file: 'dashboard.js',
        lang: 'js',
        code: `const p = fetch('/api/todos'); // Promise {<pending>}

p.then((res) => { /* fulfilled: we have a response */ })
 .catch((err) => { /* rejected: the network failed */ });`,
        hl: [1, 3, 4],
      },
      metrics: { time: 100, depth: 1 },
      scene: {
        nodes: { fn, pending: { ...pending, state: 'active' }, fulfilled, rejected },
        links: [
          link('fn', 'pending', { label: 'returns' }),
          link('pending', 'fulfilled', { tone: 'ok', label: 'resolve(value)' }),
          link('pending', 'rejected', { tone: 'danger', label: 'reject(error)' }),
        ],
        flows: [
          flow(['fn', 'pending'], { kind: 'event', label: 'Promise', every: 8 }),
          flow(['pending', 'fulfilled'], { kind: 'res', label: 'value', every: 8, offset: 1.4 }),
          flow(['fn', 'pending'], { kind: 'event', label: 'Promise', every: 8, offset: 4 }),
          flow(['pending', 'rejected'], { kind: 'err', label: 'error', every: 8, offset: 5.4 }),
        ],
      },
    },
    {
      short: 'Chaining',
      beat: 'technique',
      title: 'Chains instead of pyramids',
      body: [
        'Each `.then()` returns a **new** promise. If your callback returns another promise, the chain waits for it before moving to the next step — so steps line up flat, one per line.',
        'A single `.catch()` at the end handles a failure from any step above it.',
      ],
      code: {
        file: 'dashboard.js',
        lang: 'js',
        code: `getUser()
  .then((user) => getTodos(user.id))  // return a promise → the chain waits
  .then((todos) => render(todos))
  .catch(showError);                   // one place for every error`,
        hl: [2, 4],
      },
      metrics: { time: 200, depth: 1 },
      scene: {
        nodes: patch(base, { e3: { state: 'dim' } }),
        links,
        flows: [call('e1', 'getUser()'), call('e2', 'getTodos(id)', { offset: 2.1 })],
      },
    },
    {
      short: 'async/await',
      beat: 'technique',
      title: 'async/await: promises that read top to bottom',
      body: [
        '[[async-await|async/await]] is the same promises with friendlier syntax. Inside an `async` function, `await` waits for a promise and gives you its value — so asynchronous code reads like ordinary code.',
        'Crucially, `await` pauses **only this function**. The thread is free: clicks, renders and other code keep running, and the function resumes when the promise settles.',
      ],
      callout: { kind: 'insight', text: 'An `async` function always returns a promise — even if you `return 42`, the caller gets `Promise {42}`.' },
      code: {
        file: 'dashboard.js',
        lang: 'js',
        code: `async function loadDashboard() {
  const user = await getUser();          // pause here…
  const todos = await getTodos(user.id); // …and here
  render(user, todos);
}`,
        hl: [2, 3],
      },
      metrics: { time: 200, depth: 0 },
      scene: {
        nodes: patch({ ...base, ui }, {
          fn: { state: 'busy', badge: { text: 'paused at await', tone: 'warn' } },
          ui: { state: 'ok', badge: { text: 'still running ✓', tone: 'ok' } },
          e3: { state: 'dim' },
        }),
        links,
        flows: [call('e1', 'await getUser()'), call('e2', 'await getTodos()', { offset: 2.1 })],
      },
    },
    {
      short: 'Errors',
      beat: 'technique',
      title: 'A rejected await throws — catch it',
      body: [
        'When an awaited promise rejects, `await` **throws** at that line, so ordinary `try/catch` works. One `catch` covers every `await` inside the `try`.',
        'One surprise: `fetch` only rejects when the *network* fails. A `404` or `500` is still a response, so check `res.ok` and throw yourself.',
      ],
      code: {
        file: 'dashboard.js',
        lang: 'js',
        code: `async function loadDashboard() {
  try {
    const res = await fetch('/api/todos');
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`); // 4xx/5xx don't reject
    render(await res.json());
  } catch (err) {
    showError(err); // network failure or bad status — both land here
  }
}`,
        hl: [4, 6, 7],
      },
      metrics: { time: 100, depth: 1 },
      scene: {
        nodes: patch(base, {
          e2: { state: 'error', badge: { text: '500', tone: 'danger' } },
          fn: { badge: { text: 'catch (err)', tone: 'danger' } },
          e1: { state: 'dim' },
          e3: { state: 'dim' },
        }),
        links,
        flows: [call('e2', 'fetch /api/todos', { back: 'err', backLabel: '500 → throw', every: 3.6 })],
      },
    },
    {
      short: 'Sequential',
      beat: 'problem',
      title: 'One await after another adds up',
      body: [
        'The user, their todos and their stats don’t depend on each other. But written as three `await`s in a row, each request waits for the previous one to finish before it even starts.',
        'Three 100 ms calls → 300 ms of waiting, for no reason.',
      ],
      code: {
        file: 'dashboard.js',
        lang: 'js',
        code: `const user  = await getUser();   // 100 ms
const todos = await getTodos();  // +100 ms (only starts after user)
const stats = await getStats();  // +100 ms`,
        err: [2, 3],
      },
      metrics: { time: 300, depth: 0 },
      scene: { nodes: patch(base, { fn: { badge: { text: '300 ms', tone: 'warn' } } }), links, flows: sequential },
    },
    {
      short: 'Promise.all',
      beat: 'solution',
      title: 'Promise.all: start them all, wait once',
      body: [
        'Start all three requests first, then wait for all of them together with [[promise-all|Promise.all]]. They travel in parallel, so the total is roughly the slowest one: **100 ms**.',
        '`Promise.all` rejects as soon as any one fails. When you want every result regardless, use `Promise.allSettled`.',
      ],
      code: {
        file: 'dashboard.js',
        lang: 'js',
        code: `const [user, todos, stats] = await Promise.all([
  getUser(),
  getTodos(),
  getStats(),
]); // ~100 ms total`,
        hl: [1, 5],
      },
      changes: ['~ Three sequential awaits became one Promise.all', '~ 300 ms → 100 ms'],
      metrics: { time: 100, depth: 0 },
      scene: {
        nodes: patch(base, { fn: { state: 'ok', badge: { text: '100 ms', tone: 'ok' } } }),
        links,
        flows: [call('e1', 'getUser()', { every: 3.8 }), call('e2', 'getTodos()', { every: 3.8 }), call('e3', 'getStats()', { every: 3.8 })],
      },
    },
    {
      short: 'Mistakes',
      beat: 'tradeoff',
      title: 'The async mistakes everyone makes',
      body: [
        '**Forgetting `await`**: you get the promise, not the value. Nothing crashes; you just get `undefined` where you expected data.',
        '**`await` inside `forEach`**: `forEach` ignores the promises your callback returns, so the code after it runs before anything finishes. Use `for…of` to go one at a time, or `Promise.all` with `map` to go together.',
      ],
      check: {
        q: '`const todos = getTodos();` (an async function, no await) then `console.log(todos.length)`. What prints?',
        options: ['`3`', '`undefined`', 'It waits, then prints `3`', 'A SyntaxError'],
        answer: 1,
        explain: '`todos` is a Promise object, and promises don’t have a `length` property. Add `await` and you get the array.',
      },
      code: {
        file: 'mistakes.js',
        lang: 'js',
        code: `const todos = getTodos();         // ❌ forgot await → a Promise
console.log(todos.length);        // undefined

items.forEach(async (t) => {      // ❌ forEach doesn't wait
  await save(t);
});

for (const t of items) await save(t);          // ✅ one by one
await Promise.all(items.map((t) => save(t)));  // ✅ all at once`,
        err: [1, 4],
        hl: [8, 9],
      },
      metrics: { time: 0, depth: 0 },
      scene: {
        nodes: patch(base, { fn: { state: 'error', badge: { text: 'Promise {<pending>}', tone: 'danger' } }, e1: { state: 'dim' }, e3: { state: 'dim' } }),
        links,
        flows: [call('e2', 'getTodos()', { every: 3.6 })],
      },
    },
    {
      short: 'Try it',
      beat: 'try',
      title: 'Wait in three different ways',
      body: ['The same three requests. Change how you wait for them, then break one and see who copes.'],
      sandbox,
    },
    {
      short: 'Practice',
      beat: 'try',
      title: 'Practice: Run async tasks sequentially',
      body: [
        'Running async tasks with `forEach` fails to wait. Write `runSequential(tasks)` that accepts an array of async functions and executes them one after another, returning an array of all results.',
      ],
      practice: practice(
        'Implement runSequential(tasks) to execute async functions in sequence and return their results in order.',
        `async function runSequential(tasks) {\n  // Run each async task in order and collect results\n}`,
        `async function runSequential(tasks) {\n  const results = [];\n  for (const task of tasks) {\n    results.push(await task());\n  }\n  return results;\n}`,
        [
          { label: 'runs tasks and collects results in order', run: '(async () => { const order = []; await runSequential([async () => { order.push(1); return "a"; }, async () => { order.push(2); return "b"; }]); return order.join("") === "12"; })()' },
          { label: 'returns array of results', run: '(async () => { const res = await runSequential([async () => 10, async () => 20]); return res[0] === 10 && res[1] === 20; })()' },
        ],
        [
          'Use an empty array const results = [] to collect the returned values.',
          'Use a for...of loop over tasks: for (const task of tasks)',
          'Inside the loop, await task() and push the result.',
        ],
      ),
      scene: {
        nodes: patch(base, { fn: { state: 'ok' } }),
        links,
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Promises, in short',
      body: [
        'A {warn:promise} is a placeholder that settles once: {ok:fulfilled} with a value or {danger:rejected} with an error.',
        '`await` pauses only the current `async` function; the event loop keeps going. Rejections throw, so use `try/catch` — and check `res.ok` with fetch.',
        'Independent work goes in `Promise.all`. Don’t forget `await`, and don’t `await` inside `forEach`.',
      ],
      metrics: { time: 100, depth: 0 },
      scene: {
        nodes: patch(base, { fn: { state: 'ok' } }),
        links,
        flows: [call('e1', 'getUser()', { every: 3.8 }), call('e2', 'getTodos()', { every: 3.8 }), call('e3', 'getStats()', { every: 3.8 })],
      },
    },
  ],
});
