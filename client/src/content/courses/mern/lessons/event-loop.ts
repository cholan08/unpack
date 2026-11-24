import { chip, code, defineLesson, flow, item, link, patch, practice, queue, stack } from '@/content/dsl';
import type { Item } from '@/engine/types';

/* ---------- layout ----------
   code + console on the left · call stack in the middle · async machinery on the right */
const program = `console.log('A');

setTimeout(() => {
  console.log('B');
}, 0);

Promise.resolve().then(() => {
  console.log('C');
});

console.log('D');`;

const blocking = `console.log('A');

// "wait" two seconds — the wrong way
const start = Date.now();
while (Date.now() - start < 2000) {}

console.log('B');`;

const out = (...lines: string[]): Item[] => lines.map((l, i) => item(`o${i}-${l}`, l, { tone: 'neutral' }));
const script = item('script', 'global script', { tone: 'client', state: 'dim' });
const frame = (id: string, text: string) => item(id, text, { tone: 'client', state: 'active' });

const src = code(170, 205, program, { file: 'main.js', w: 300, tone: 'client' });
const consoleBox = stack(170, 490, 'Console', [], { w: 300, h: 196, from: 'top', mono: true, icon: 'terminal', empty: 'nothing printed yet' });
const callStack = stack(470, 280, 'Call stack', [], { w: 210, h: 340, tone: 'client', icon: 'layers', empty: 'empty', mono: true });
const loop = chip(470, 516, 'event loop', { tone: 'net', icon: 'loop' });
const micro = queue(815, 150, 'Microtask queue', [], { w: 300, tone: 'data', sub: 'promises', mono: true, empty: 'empty' });
const apis = stack(815, 287, 'Web APIs', [], { w: 300, h: 112, tone: 'net', sub: 'outside the JS thread', from: 'top', mono: true, empty: 'idle', icon: 'clock' });
const tasks = queue(815, 430, 'Task queue', [], { w: 300, tone: 'warn', sub: 'timers · events', mono: true, empty: 'empty' });

const base = { src, consoleBox, callStack };
const full = { ...base, loop, micro, apis, tasks };
const machineLinks = [
  link('callStack', 'apis', { style: 'dashed' }),
  link('apis', 'micro', { style: 'dashed' }),
  link('apis', 'tasks', { style: 'dashed' }),
  link('micro', 'callStack'),
  link('tasks', 'callStack'),
];

const cbB = item('cbB', "() => log('B')", { tone: 'warn' });
const cbC = item('cbC', "() => log('C')", { tone: 'data' });

export default defineLesson({
  metrics: [
    { id: 'output', label: 'Console' },
    { id: 'waiting', label: 'Callbacks waiting' },
  ],
  legend: { event: 'callback' },
  goals: [
    { text: 'What the call stack is', step: 2 },
    { text: 'Why blocking the thread freezes everything', step: 3 },
    { text: 'Where timers and promises wait', step: 5 },
    { text: 'Why microtasks run before tasks', step: 9 },
    { text: 'Why this matters for your Express server', step: 11 },
  ],
  steps: [
    {
      short: 'One thread',
      beat: 'setup',
      title: 'One thread, one thing at a time',
      body: [
        'JavaScript runs your code on a **single thread**: at any moment it is doing exactly one thing.',
        'To remember what it’s in the middle of, it keeps a [[call-stack|call stack]] — a pile of the functions currently running. Let’s run this little program and predict what it prints.',
      ],
      metrics: { output: '—', waiting: 0 },
      scene: { nodes: base },
    },
    {
      short: 'Call stack',
      beat: 'technique',
      title: 'Calling a function pushes it; returning pops it',
      body: [
        'Running the file puts the **global script** on the stack. Calling `console.log(\'A\')` pushes a new frame on top. When it returns, the frame pops off and the script carries on.',
        'Last in, first out — like a stack of plates.',
      ],
      metrics: { output: 'A', waiting: 0 },
      scene: {
        nodes: patch(base, {
          src: { hl: [1] },
          callStack: { items: [frame('logA', "console.log('A')"), script] },
          consoleBox: { items: out('A') },
        }),
      },
    },
    {
      short: 'Blocking',
      beat: 'problem',
      title: 'Slow work would freeze everything',
      body: [
        'Suppose JavaScript simply *waited* for slow things — a timer, a network request, a file. With one thread, the stack would be stuck on that wait.',
        'While the stack is busy nothing else can run: no click handlers, no scrolling, no re-rendering. The page freezes. On a server, every other user waits too.',
      ],
      callout: { kind: 'warn', text: 'While the call stack is busy, the page can’t respond to anything.' },
      metrics: { output: 'A', waiting: 0 },
      scene: {
        nodes: patch(base, {
          src: { code: blocking, err: [5], file: 'blocking.js' },
          callStack: {
            items: [item('spin', 'while (…) {}', { tone: 'danger', state: 'error', sub: 'busy for 2 000 ms' }), script],
            state: 'error',
            badge: { text: 'frozen', tone: 'danger' },
          },
          consoleBox: { items: out('A') },
        }),
      },
    },
    {
      short: 'Web APIs',
      beat: 'solution',
      title: 'Hand slow work to the runtime',
      body: [
        'The browser (and Node.js) ship with machinery that runs **outside** the JavaScript thread: timers, networking, files. In the browser these are the *Web APIs*.',
        '`setTimeout` hands its [[callback]] to a timer and **returns immediately** — even with a 0 ms delay. The stack is free to keep going.',
      ],
      changes: ['+ Web APIs: timers, network and events run off the main thread', '+ Two waiting lines for callbacks (more on those next)'],
      metrics: { output: 'A', waiting: 0 },
      scene: {
        nodes: patch(full, {
          src: { hl: [3, 4, 5] },
          callStack: { items: [frame('st', 'setTimeout(cb, 0)'), script] },
          apis: { items: [item('timer', '⏱ timer 0 ms → cb B', { tone: 'warn', state: 'active' })] },
          consoleBox: { items: out('A') },
        }),
        links: machineLinks,
        flows: [flow(['callStack', 'apis'], { kind: 'event', label: 'cb B', every: 2.6 })],
      },
    },
    {
      short: 'Task queue',
      beat: 'technique',
      title: 'Finished timers wait in the task queue',
      body: [
        'The 0 ms timer is done almost instantly — but its callback can’t barge onto the stack, which is still running the script.',
        'Instead it joins the [[task|task queue]] and waits its turn. Clicks, network responses and other events queue up here too.',
      ],
      metrics: { output: 'A', waiting: 1 },
      scene: {
        nodes: patch(full, {
          src: { hl: [3, 4, 5] },
          callStack: { items: [script] },
          tasks: { items: [cbB] },
          consoleBox: { items: out('A') },
        }),
        links: machineLinks,
        flows: [flow(['apis', 'tasks'], { kind: 'event', label: 'cb B', every: 2.6 })],
      },
    },
    {
      short: 'Microtasks',
      beat: 'technique',
      title: 'Promise callbacks get their own, faster line',
      body: [
        '`Promise.resolve()` is already resolved, so the callback passed to `.then` is ready right away. It doesn’t go to the task queue: it goes to the [[microtask|microtask queue]].',
        'Same idea, different line — and as we’ll see, a line with priority.',
      ],
      metrics: { output: 'A', waiting: 2 },
      scene: {
        nodes: patch(full, {
          src: { hl: [7, 8, 9] },
          callStack: { items: [frame('then', '.then(cb)'), script] },
          micro: { items: [cbC] },
          tasks: { items: [cbB] },
          consoleBox: { items: out('A') },
        }),
        links: machineLinks,
        flows: [flow(['callStack', 'micro'], { kind: 'event', label: 'cb C', every: 2.6 })],
      },
    },
    {
      short: 'Script ends',
      beat: 'technique',
      title: 'Meanwhile, the script keeps running',
      body: [
        'Nothing has waited for anything. The last line runs and prints **D** — before B and C, even though the timer was “0 ms”.',
        'Then the global script finishes and pops off. For the first time, the call stack is empty.',
      ],
      metrics: { output: 'A D', waiting: 2 },
      scene: {
        nodes: patch(full, {
          src: { hl: [11] },
          callStack: { items: [frame('logD', "console.log('D')"), script] },
          micro: { items: [cbC] },
          tasks: { items: [cbB] },
          consoleBox: { items: out('A', 'D') },
        }),
        links: machineLinks,
      },
    },
    {
      short: 'Who’s next?',
      beat: 'insight',
      title: 'The stack is empty — the event loop takes over',
      body: [
        'The [[event-loop|event loop]] is a simple loop that runs forever: *whenever the call stack is empty, take the next waiting callback and run it.*',
        'Two callbacks are waiting, one in each line. Before you step on — which one runs first?',
      ],
      check: {
        q: 'The stack is empty. `cb B` waits in the task queue, `cb C` in the microtask queue. Which runs first?',
        options: ['B — it was scheduled first', 'C — the microtask queue goes first', 'Whichever callback is shorter', 'Both run at the same time'],
        answer: 1,
        explain: 'Every time the stack empties, the event loop drains **all** microtasks before it takes the next task. Promises always beat timers.',
      },
      metrics: { output: 'A D', waiting: 2 },
      scene: {
        nodes: patch(full, {
          callStack: { items: [] },
          loop: { state: 'busy' },
          micro: { items: [cbC] },
          tasks: { items: [cbB] },
          consoleBox: { items: out('A', 'D') },
        }),
        links: machineLinks,
      },
    },
    {
      short: 'C runs',
      beat: 'technique',
      title: 'Microtasks first — all of them',
      body: [
        'The event loop empties the **whole** microtask queue first, so `cb C` moves onto the stack and prints **C**.',
        'If a microtask schedules another microtask, that one runs too, before any task gets a turn.',
      ],
      metrics: { output: 'A D C', waiting: 1 },
      scene: {
        nodes: patch(full, {
          src: { hl: [8] },
          callStack: { items: [item('cbC', "() => log('C')", { tone: 'data', state: 'active' })] },
          loop: { state: 'active' },
          tasks: { items: [cbB] },
          consoleBox: { items: out('A', 'D', 'C') },
        }),
        links: machineLinks,
        flows: [flow(['micro', 'callStack'], { kind: 'event', label: 'cb C', every: 2.6 })],
      },
    },
    {
      short: 'B runs',
      beat: 'technique',
      title: 'Then one task at a time',
      body: [
        'With the microtasks drained and the stack empty again, the loop takes **one** task: `cb B` runs and prints **B**.',
        'After each task the loop checks the microtasks again (and, in a browser, gets a chance to repaint the screen). Final output: **A D C B**.',
      ],
      metrics: { output: 'A D C B', waiting: 0 },
      scene: {
        nodes: patch(full, {
          src: { hl: [4] },
          callStack: { items: [item('cbB', "() => log('B')", { tone: 'warn', state: 'active' })] },
          loop: { state: 'active' },
          consoleBox: { items: out('A', 'D', 'C', 'B') },
        }),
        links: machineLinks,
        flows: [flow(['tasks', 'callStack'], { kind: 'event', label: 'cb B', every: 2.6 })],
      },
    },
    {
      short: 'On the server',
      beat: 'tradeoff',
      title: 'Your Express server runs on the same loop',
      body: [
        'Node.js runs your whole Express app on one thread with this same event loop. Each incoming request is just another callback in the queue.',
        'That’s why one slow, **synchronous** call hurts so much: while `hashSync` grinds for a second, every other user’s request sits in the queue. The async version hands the work to Node’s background threads and keeps the loop free.',
      ],
      callout: { kind: 'mistake', text: 'Never do long synchronous work in a request handler. Use the async API (`bcrypt.hash`, `fs.promises`) or move heavy CPU work to a worker thread.' },
      code: {
        file: 'routes/auth.js',
        lang: 'js',
        code: `app.post('/signup', async (req, res) => {
  // ❌ blocks the only thread for ~1 second
  const hash = bcrypt.hashSync(req.body.password, 14);

  // ✅ runs on a background thread; the loop stays free
  // const hash = await bcrypt.hash(req.body.password, 14);

  await User.create({ email: req.body.email, hash });
  res.status(201).end();
});`,
        err: [3],
        hl: [6],
      },
      metrics: { output: '—', waiting: 3 },
      scene: {
        nodes: patch(full, {
          src: {
            file: 'server.js',
            tone: 'server',
            code: `app.post('/signup', (req, res) => {
  const hash = bcrypt.hashSync(
    req.body.password, 14,
  ); // ~1 s of CPU, nobody else runs
  …
});`,
            hl: [],
            err: [2, 3, 4],
          },
          callStack: {
            tone: 'server',
            items: [
              item('hash', 'bcrypt.hashSync()', { tone: 'danger', state: 'error', sub: '~1 000 ms' }),
              item('h', 'POST /signup handler', { tone: 'server', state: 'dim' }),
            ],
            state: 'error',
            badge: { text: 'blocked', tone: 'danger' },
          },
          apis: { label: 'Node APIs', sub: 'network · disk', tone: 'server', items: [item('sock', '🔌 3 connections open', { tone: 'server' })] },
          tasks: {
            label: 'Waiting requests',
            sub: 'other users',
            items: [item('r2', 'GET /todos', { tone: 'server' }), item('r3', 'POST /login', { tone: 'server' }), item('r4', 'GET /me', { tone: 'server' })],
          },
          loop: { state: 'error', label: 'event loop stuck' },
          consoleBox: { label: 'Server log', items: out('POST /signup …') },
        }),
        links: machineLinks,
        flows: [flow(['apis', 'tasks'], { kind: 'req', label: 'request', every: 1.6 })],
      },
    },
    {
      short: 'Practice',
      beat: 'try',
      title: 'Practice: Build a non-blocking delay helper',
      body: [
        'Blocking with a while loop locks the thread and starves the event loop.',
        'Use `setTimeout` inside a Promise to write `delay(ms, value)` that resolves non-blockingly with `value` after `ms` milliseconds.',
      ],
      practice: practice(
        'Write delay(ms, value) returning a Promise that resolves with value after ms milliseconds.',
        `function delay(ms, value) {\n  // Wrap setTimeout in a Promise\n}`,
        `function delay(ms, value) {\n  return new Promise((resolve) => setTimeout(() => resolve(value), ms));\n}`,
        [
          { label: 'returns a Promise', run: 'delay(10, "ok") instanceof Promise' },
          { label: 'resolves with value after delay', run: '(async () => { const val = await delay(10, 42); return val === 42; })()' },
        ],
        [
          'Return a new Promise((resolve) => ...)',
          'Call setTimeout inside the promise callback.',
          'Pass a function to setTimeout that calls resolve(value).',
        ],
      ),
      metrics: { output: 'await delay(10, 42)', waiting: 0 },
      scene: {
        nodes: patch(full, {
          callStack: { items: [item('p', 'new Promise()', { tone: 'client' })] },
          apis: { label: 'Timer API', items: [item('t', 'setTimeout(ms)', { tone: 'client' })] },
          loop: { state: 'active' },
        }),
        links: machineLinks,
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'The rules of the loop',
      body: [
        '{client:Call stack} — one thread runs one function at a time; sync code runs to completion first.',
        '{net:Web / Node APIs} — timers, network and disk run outside the thread and hand back callbacks.',
        '{data:Microtasks} (promise callbacks) all run as soon as the stack is empty; then {warn:one task} (timers, events, requests) at a time.',
        'Keep every function short and non-blocking — in the browser for a smooth UI, on the server so every user gets a turn.',
      ],
      callout: { kind: 'tip', text: 'Prediction trick: sync code first, then promises, then timers. `A D C B`.' },
      metrics: { output: 'A D C B', waiting: 0 },
      scene: {
        nodes: patch(full, {
          callStack: { items: [] },
          loop: { state: 'active' },
          consoleBox: { items: out('A', 'D', 'C', 'B') },
        }),
        links: machineLinks,
      },
    },
  ],
});
