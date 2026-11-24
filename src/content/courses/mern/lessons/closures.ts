import { box, chip, defineLesson, flow, link, practice, zone } from '@/content/dsl';
import type { NodeSpec } from '@/engine/types';

/* ---------- layout: scopes are nested zones; names are chips inside them ---------- */
const globalZ = zone(500, 300, 920, 540, 'Global scope', { tone: 'neutral', icon: 'globe' });
const v = (x: number, y: number, label: string, o: Partial<NodeSpec> = {}): NodeSpec => ({ ...chip(x, y, label, { tone: 'client', w: 190 }), ...o }) as NodeSpec;

const counterCode = `function makeCounter() {
  let count = 0;                 // lives in makeCounter's scope
  return function increment() {
    count++;                     // found one scope out
    return count;
  };
}

const counter = makeCounter();   // makeCounter has returned…
counter(); counter(); counter(); // 1, 2, 3 — count lives on`;

export default defineLesson({
  metrics: [
    { id: 'scopes', label: 'Scopes alive' },
    { id: 'value', label: 'Value seen' },
  ],
  legend: { req: 'name lookup', res: 'found', err: 'not found / stale' },
  goals: [
    { text: 'What scope is', step: 1 },
    { text: 'Lookups go outward, never inward', step: 2 },
    { text: 'How a function remembers its variables', step: 3 },
    { text: 'Stale closures in React', step: 5 },
    { text: 'Closures you already use in MERN', step: 7 },
  ],
  steps: [
    {
      short: 'Scope',
      beat: 'setup',
      title: 'Scope: where a name is visible',
      body: [
        'Every function call creates a new [[scope]] — a box of names. Scopes nest: a function defined inside another sits inside its scope, which sits inside the global one.',
        'When code uses a name, JavaScript looks in the current scope first, then the one around it, and so on outward until it finds it.',
      ],
      code: { file: 'counter.js', lang: 'js', code: counterCode, hl: [2, 4] },
      metrics: { scopes: 3, value: 'count = 0' },
      scene: {
        nodes: {
          globalZ,
          fnZ: zone(600, 330, 640, 400, 'makeCounter() scope', { tone: 'client', icon: 'code' }),
          innerZ: zone(705, 385, 390, 230, 'increment() scope', { tone: 'client', icon: 'code' }),
          app: v(160, 130, 'appName = "Todos"', { tone: 'neutral', w: 200 }),
          count: v(390, 200, 'count = 0', { w: 160 }),
          use: v(705, 400, 'count++', { w: 160, state: 'active' }),
        },
        links: [link('use', 'count', { style: 'dashed', label: 'look outward' })],
        flows: [flow(['use', 'count'], { kind: 'req', label: 'count?', back: 'res', backLabel: '0', every: 3.6 })],
      },
    },
    {
      short: 'Outward only',
      beat: 'technique',
      title: 'Lookups go outward, never inward',
      body: [
        'Inner code can see outer names — `increment` can read `count` and `appName`. Outer code can’t see inner names: from the global scope, `count` simply doesn’t exist.',
        'That’s what makes `count` **private**. Nothing outside `makeCounter` can read or change it, except through the function it handed out.',
      ],
      code: { file: 'counter.js', lang: 'js', code: `console.log(count); // ❌ ReferenceError: count is not defined`, err: [1] },
      metrics: { scopes: 3, value: 'ReferenceError' },
      scene: {
        nodes: {
          globalZ,
          fnZ: zone(600, 330, 640, 400, 'makeCounter() scope', { tone: 'client', icon: 'code' }),
          app: v(160, 130, 'appName = "Todos"', { tone: 'neutral', w: 200 }),
          ask: v(160, 420, 'console.log(count)', { tone: 'danger', w: 200, state: 'error' }),
          count: v(390, 200, 'count = 0', { w: 160, badge: { text: 'private', tone: 'client' } }),
        },
        links: [link('ask', 'count', { style: 'dashed', state: 'error' })],
        flows: [flow(['ask', 'count'], { kind: 'err', label: 'count?', fail: true, every: 3.2 })],
      },
    },
    {
      short: 'Closure',
      beat: 'technique',
      title: 'A function remembers where it was born',
      body: [
        '`makeCounter()` runs, creates `count`, and returns `increment`. Normally its scope would be thrown away now — but `increment` still refers to `count`, so the scope is **kept alive**.',
        'A function plus the scope it remembers is a [[closure]]. Each call to `counter()` reaches back into that same, still-living scope: 1, 2, 3.',
      ],
      code: { file: 'counter.js', lang: 'js', code: counterCode, hl: [9, 10] },
      metrics: { scopes: 2, value: 'count = 3' },
      scene: {
        nodes: {
          globalZ,
          fnZ: zone(600, 330, 640, 400, 'makeCounter() scope — returned, kept alive', { tone: 'client', icon: 'code', state: 'active' }),
          counter: v(160, 330, 'counter  →', { w: 170, state: 'active' }),
          count: v(470, 330, 'count = 3', { w: 160, state: 'ok' }),
          fn: box(760, 330, 'increment()', { sub: 'remembers count', icon: 'code', tone: 'client', w: 200 }),
        },
        links: [link('counter', 'fn', { route: 'over', bend: 30, style: 'dashed', label: 'calls' }), link('fn', 'count', { label: 'count++' })],
        flows: [flow(['counter', 'fn', 'count'], { kind: 'req', label: ['counter()', 'count++'], back: 'res', backLabel: ['3', '3'], every: 4 })],
      },
    },
    {
      short: 'Own scope',
      beat: 'technique',
      title: 'Every call gets its own scope',
      body: [
        'Call `makeCounter()` twice and you get two separate scopes, each with its own `count`. Advancing one counter doesn’t touch the other.',
        'This is how you get private, per-instance state without classes — and it’s exactly what React hooks do for each component instance.',
      ],
      code: { file: 'counter.js', lang: 'js', code: `const a = makeCounter();\nconst b = makeCounter();\na(); a(); a();  // 3\nb();            // 1 — its own count`, hl: [3, 4] },
      metrics: { scopes: 3, value: 'a: 3 · b: 1' },
      scene: {
        nodes: {
          globalZ,
          fa: zone(620, 180, 600, 210, 'makeCounter() call #1', { tone: 'client', icon: 'code' }),
          fb: zone(620, 430, 600, 210, 'makeCounter() call #2', { tone: 'client', icon: 'code' }),
          a: v(160, 180, 'a  →', { w: 150 }),
          b: v(160, 430, 'b  →', { w: 150 }),
          ca: v(620, 190, 'count = 3', { w: 160, state: 'ok' }),
          cb: v(620, 440, 'count = 1', { w: 160, state: 'ok' }),
        },
        links: [link('a', 'ca'), link('b', 'cb')],
        flows: [flow(['a', 'ca'], { kind: 'req', label: 'a()', back: 'res', backLabel: '3', every: 3.6 }), flow(['b', 'cb'], { kind: 'req', label: 'b()', back: 'res', backLabel: '1', every: 3.6, offset: 1.2 })],
      },
    },
    {
      short: 'Stale closure',
      beat: 'problem',
      title: 'Stale closures in React',
      body: [
        'Each render of a component is a function call with its **own** scope — its own `count`. An effect with `[]` runs once, so its interval callback closes over render #1’s scope, where `count` is 0 forever.',
        'Five seconds later the screen says 5, but the callback still computes `0 + 1`. That’s a [[stale-closure|stale closure]].',
      ],
      check: {
        q: 'The interval runs `setCount(count + 1)` every second inside `useEffect(…, [])`. After 5 seconds, what does the screen show?',
        options: ['5', '1 — it keeps setting 0 + 1', '0', 'It counts up forever, correctly'],
        answer: 1,
        explain: 'The callback belongs to render #1, where `count` is 0. Every tick sets `0 + 1`, so the count is stuck at 1.',
      },
      code: {
        file: 'Timer.jsx',
        lang: 'jsx',
        code: `const [count, setCount] = useState(0);
useEffect(() => {
  const id = setInterval(() => setCount(count + 1), 1000); // count is from render #1
  return () => clearInterval(id);
}, []);`,
        err: [3],
      },
      metrics: { scopes: 5, value: 'stuck at 1' },
      scene: {
        nodes: {
          globalZ,
          r1: zone(330, 300, 380, 360, 'render #1 scope', { tone: 'client', icon: 'component', state: 'dim' }),
          r5: zone(760, 300, 340, 360, 'render #5 scope (latest)', { tone: 'client', icon: 'component', state: 'active' }),
          c1: v(330, 220, 'count = 0', { w: 160 }),
          cb: v(330, 380, 'interval callback', { w: 190, tone: 'danger', state: 'error' }),
          c5: v(760, 300, 'count = 1', { w: 160 }),
        },
        links: [link('cb', 'c1', { label: 'reads' })],
        flows: [flow(['cb', 'c1'], { kind: 'err', label: 'count?', back: 'err', backLabel: '0 (stale)', every: 2.4 })],
      },
    },
    {
      short: 'Fix',
      beat: 'solution',
      title: 'Ask React for the latest value',
      body: [
        'Pass the setter a **function**: `setCount((c) => c + 1)`. React calls it with the current value, so the callback no longer needs to remember `count` at all.',
        'The other fix is to list the value in the dependency array, so a fresh callback (with a fresh closure) is created whenever it changes — with cleanup clearing the old one.',
      ],
      code: {
        file: 'Timer.jsx',
        lang: 'jsx',
        code: `useEffect(() => {
  const id = setInterval(() => setCount((c) => c + 1), 1000); // ✅ always latest
  return () => clearInterval(id);
}, []);`,
        hl: [2],
      },
      metrics: { scopes: 2, value: 'counts 1, 2, 3…' },
      scene: {
        nodes: {
          globalZ,
          r1: zone(330, 300, 380, 360, 'render #1 scope', { tone: 'client', icon: 'component', state: 'dim' }),
          r5: zone(760, 300, 340, 360, 'React state (latest)', { tone: 'client', icon: 'react', state: 'active' }),
          cb: v(330, 300, 'c => c + 1', { w: 170, state: 'ok' }),
          c5: v(760, 300, 'count = 5', { w: 160, state: 'ok' }),
        },
        links: [link('cb', 'c5', { label: 'React passes c' })],
        flows: [flow(['c5', 'cb'], { kind: 'res', label: 'c = 5', back: 'data', backLabel: '6', every: 2.4 })],
      },
    },
    {
      short: 'In MERN',
      beat: 'insight',
      title: 'You already use closures everywhere',
      body: [
        'Every event handler that reads props or state is a closure. So is a **middleware factory**: `validate(TodoInput)` runs once at startup and returns a middleware that remembers `schema` for every request after.',
        'Same with `requireRole(\'admin\')`, `asyncHandler(fn)`, and the custom hooks you write. Once you see the pattern, you’ll spot it on every page.',
      ],
      code: {
        file: 'middleware/validate.js',
        lang: 'js',
        code: `export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body); // schema remembered from setup
  …
};

app.post('/api/todos', validate(TodoInput), createTodo);`,
        hl: [1, 2],
      },
      metrics: { scopes: 2, value: 'schema = TodoInput' },
      scene: {
        nodes: {
          globalZ,
          vz: zone(360, 300, 420, 300, 'validate(TodoInput) scope', { tone: 'auth', icon: 'shield', state: 'active' }),
          schema: v(360, 300, 'schema = TodoInput', { tone: 'auth', w: 210 }),
          mw: box(790, 300, 'middleware', { sub: 'runs on every request', icon: 'filter', tone: 'server', w: 220 }),
        },
        links: [link('mw', 'schema', { label: 'remembers' })],
        flows: [flow(['mw', 'schema'], { kind: 'req', label: 'request #1…#1000', back: 'res', backLabel: 'same schema', every: 2.6 })],
      },
    },
    {
      short: 'Practice',
      beat: 'try',
      title: 'Practice: Build a limited-call wrapper',
      body: [
        'Use closure to encapsulate private state. Write `createLimitedFunction(fn, limit)` that allows `fn` to be invoked up to `limit` times.',
        'Calls beyond the limit should return the result of the last successful call without running `fn` again.',
      ],
      practice: practice(
        'Implement createLimitedFunction(fn, limit) using a closure to keep count and cache the last return value.',
        `function createLimitedFunction(fn, limit) {\n  // Write your closure here\n}`,
        `function createLimitedFunction(fn, limit) {\n  let count = 0;\n  let lastResult;\n  return function(...args) {\n    if (count < limit) {\n      count++;\n      lastResult = fn(...args);\n    }\n    return lastResult;\n  };\n}`,
        [
          { label: 'calls fn up to limit times', run: '(() => { const f = createLimitedFunction(x => x * 2, 2); return f(1) === 2 && f(2) === 4 && f(3) === 4; })()' },
          { label: 'count is not exposed globally', run: 'typeof count === "undefined"' },
        ],
        [
          'Declare let count = 0 inside createLimitedFunction.',
          'Declare let lastResult to remember the previous return value.',
          'Return an inner function that checks if count < limit before calling fn.',
        ],
      ),
      scene: {
        nodes: {
          globalZ,
          fnZ: zone(600, 330, 640, 400, 'createLimitedFunction() scope', { tone: 'client', icon: 'code' }),
          counter: v(160, 330, 'wrapper()  →', { w: 170 }),
          count: v(470, 330, 'count < limit', { w: 160, state: 'ok' }),
          fn: box(760, 330, 'fn(...args)', { sub: 'called if under limit', icon: 'code', tone: 'client', w: 200 }),
        },
        links: [link('counter', 'count'), link('count', 'fn')],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Scope and closures',
      body: [
        'Every call creates a {client:scope}; lookups go **outward** through enclosing scopes, never inward — which makes inner variables private.',
        'A {client:closure} is a function plus the scope it was created in. That scope lives as long as the function does, and each call gets its own.',
        'In React each render has its own scope: watch for {danger:stale closures}, and use functional updates or correct dependencies.',
      ],
      metrics: { scopes: 2, value: 'count = 3' },
      scene: {
        nodes: {
          globalZ,
          fnZ: zone(600, 330, 640, 400, 'makeCounter() scope — kept alive', { tone: 'client', icon: 'code' }),
          counter: v(160, 330, 'counter  →', { w: 170 }),
          count: v(470, 330, 'count = 3', { w: 160, state: 'ok' }),
          fn: box(760, 330, 'increment()', { sub: 'remembers count', icon: 'code', tone: 'client', w: 200 }),
        },
        links: [link('counter', 'fn', { route: 'over', bend: 30, style: 'dashed' }), link('fn', 'count')],
        flows: [flow(['counter', 'fn', 'count'], { kind: 'req', label: ['counter()', 'count++'], back: 'res', every: 4 })],
      },
    },
  ],
});
