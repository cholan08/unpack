import { box, callout, chip, defineLesson, flow, h, keys, link, note, ol, p, practice, qa, snippet, table, ul, walk, zone } from '@/content/dsl';
import type { NodeSpec } from '@/engine/types';

/* ---------- layout: scopes are nested zones; names are chips inside them ---------- */
const globalZ = zone(500, 300, 920, 540, 'Global scope', { tone: 'neutral', icon: 'globe' });
const v = (x: number, y: number, label: string, o: Partial<NodeSpec> = {}): NodeSpec => ({ ...chip(x, y, label, { tone: 'client', w: 190 }), ...o }) as NodeSpec;

/* the counter layout, shared by steps 1, 4 and 5 */
const fnZ = zone(600, 330, 640, 400, 'makeCounter() scope', { tone: 'client', icon: 'code' });
const innerZ = zone(735, 400, 330, 200, 'increment() scope', { tone: 'client', icon: 'code' });
const app = v(160, 130, 'appName = "Todos"', { tone: 'neutral', w: 200 });
const count0 = v(420, 420, 'count = 0', { w: 160 });
const use = v(760, 420, 'count++', { w: 150, state: 'active' });

const counterCode = `const appName = 'Todos';

function makeCounter() {
  let count = 0;
  return function increment() {
    count++;
    return count;
  };
}

const counter = makeCounter();
counter(); // 1
counter(); // 2
counter(); // 3`;

/* the loop layout, shared by steps 7 and 8 */
const cbs = {
  cb1: v(215, 410, '() => log(i)', { w: 160 }),
  cb2: v(500, 410, '() => log(i)', { w: 160 }),
  cb3: v(785, 410, '() => log(i)', { w: 160 }),
};

export default defineLesson({
  metrics: [
    { id: 'scopes', label: 'Scopes alive' },
    { id: 'value', label: 'Value seen' },
  ],
  legend: { req: 'lookup / call', res: 'value found', data: 'write / update', err: 'not found / stale' },
  goals: [
    { text: 'What scope is: global, module, function and block', step: 1 },
    { text: 'Lexical scope, the scope chain and shadowing', step: 2 },
    { text: 'var vs let vs const, hoisting and the TDZ', step: 3 },
    { text: 'How a function remembers its variables: closures', step: 5 },
    { text: 'The var-in-a-loop bug and why let fixes it', step: 7 },
    { text: 'Closure patterns: memoize, once, debounce, factories', step: 9 },
    { text: 'Stale closures in React, and three fixes', step: 10 },
    { text: 'Closures and memory leaks', step: 13 },
  ],
  steps: [
    /* ------------------------------------------------------------------ 1 */
    {
      short: 'Scope',
      beat: 'setup',
      title: 'Scope: where a name is visible',
      body: [
        'Every name you create (a variable, a constant, a function, a parameter) lives inside a [[scope]]: a box that decides where that name can be seen and used.',
        'Scopes nest like boxes inside boxes. When code uses a name, JavaScript searches the current box first, then the box around it, and keeps going outward until it finds the name or runs out of boxes.',
      ],
      code: { file: 'counter.js', lang: 'js', code: counterCode, hl: [4, 6] },
      detail: [
        h('The four kinds of scope'),
        table(
          ['Scope', 'Created by', 'Example'],
          ['Global', 'The whole program: one per page, or per Node process', '`appName` on line 1'],
          ['Module', 'Every file that uses `import` / `export`, and every Node file', 'a top-level `const` in `api.js`'],
          ['Function', 'Every **call** of a function. Each call gets a fresh box.', '`count` inside `makeCounter`'],
          ['Block', 'Any `{ }`: `if`, `for`, `while` or a bare block. Only for `let`, `const` and `class`.', '`let i` in a `for` loop'],
        ),
        p('In the diagram, the big grey box is the global scope and the blue boxes are function scopes. `increment` is written inside `makeCounter`, so its box sits inside `makeCounter`’s box.'),
        h('How JavaScript finds a name: the scope chain'),
        p('The list of boxes from the inside out is the [[scope-chain|scope chain]]. Every lookup walks it in the same order:'),
        ol(
          'Look in the **current** scope (the function or block that is running).',
          'Not there? Move **one scope out**, to the scope that surrounds this code.',
          'Repeat, box by box, until you reach the **global** scope.',
          'Still not found? JavaScript throws `ReferenceError: x is not defined`.',
        ),
        h('Trace it: what happens on line 6'),
        walk(
          ['L4', 'Calling `makeCounter()` creates a new function scope holding `count = 0`.'],
          ['L5', '`increment` is created **inside** that scope, so that scope becomes its outer scope.'],
          ['L6', '`count++` runs. Is `count` in `increment`’s own scope? No: `increment` declares nothing.'],
          ['→', 'Move one scope out, to `makeCounter`’s scope. `count` is found there (value `0`) and becomes `1`.'],
        ),
        callout('picture', 'Think of rooms with one-way windows. From the inner room you can look out into the hallway and the street, but from the street you can’t see into the room. Code always looks **outward**, never in.'),
        callout('tip', 'Reading the diagram: boxes are scopes, pills are names. A {client:blue} dot is a lookup asking “where is this name?”, a {ok:green} dot is the value coming back, and a {danger:red} dot is a failed or stale lookup.'),
        keys(
          'A scope is the region where a name is visible. Functions, blocks, modules and the program itself each create one.',
          'Scopes nest. Lookups start in the current scope and move outward, one level at a time.',
          'If no scope has the name, you get a `ReferenceError`.',
        ),
      ],
      metrics: { scopes: 3, value: 'count = 0' },
      scene: {
        nodes: { globalZ, fnZ, innerZ, app, count: count0, use },
        links: [link('use', 'count', { style: 'dashed', label: 'look outward' })],
        flows: [flow(['use', 'count'], { kind: 'req', label: 'count?', back: 'res', backLabel: '0', every: 3.6 })],
      },
    },

    /* ------------------------------------------------------------------ 2 */
    {
      short: 'Lexical scope',
      beat: 'technique',
      title: 'Lexical scope: decided where you write it',
      body: [
        'Which scope is “one scope out”? JavaScript decides by **where the function is written in your code**, not by where it is called from. This is [[lexical-scope|lexical scope]]: “lexical” means “based on the source text”.',
        'So you can predict every lookup just by reading the code. Look at the braces around the function, not at who calls it.',
      ],
      code: {
        file: 'lexical.js',
        lang: 'js',
        code: `const name = 'global';

function show() {
  console.log(name);
}

function run() {
  const name = 'run';
  show(); // prints "global"
}

run();`,
        hl: [1, 4, 9],
      },
      detail: [
        h('Why it prints “global”'),
        walk(
          ['L12', "`run()` is called. Its scope gets its own `name = 'run'`."],
          ['L9', '`run` calls `show()`. A new scope for this call of `show` is created.'],
          ['L4', '`show` needs `name`. Its own scope has none, so it moves one scope out.'],
          ['→', "One scope out of `show` is the **global** scope, because `show` is written at the top level. It finds `name = 'global'`. `run`’s `name` is never even checked."],
        ),
        h('Lexical vs dynamic scope'),
        table(
          ['', 'Lexical (JavaScript)', 'Dynamic (not JS)'],
          ['Outer scope is…', 'where the function is **written**', 'whoever **called** it'],
          ['`show()` prints', "`'global'`", "`'run'`"],
          ['Known when?', 'by reading the code', 'only while it runs'],
        ),
        callout('warn', 'One exception: `this`. Unlike variables, `this` is decided by **how** a function is called (`obj.method()`, a plain call, `new`). Arrow functions are the exception to the exception: they take `this` from where they are written, which is why they work so well as callbacks.'),
        h('Shadowing: same name, inner wins'),
        p('When an inner scope declares a name that already exists outside, the inner one **hides** ([[shadowing|shadows]]) the outer one for all code inside it. The lookup stops at the first match it finds.'),
        snippet(
          'routes/todos.js',
          `app.get('/todos', (req, res) => {
  db.find({}, (err, res) => {
    // ❌ this res is the db result,
    // not Express's response!
    res.json(res);
  });
});`,
          { err: [2, 5] },
        ),
        callout('mistake', 'Shadowing by accident is a real MERN bug: the inner callback’s `res` hides Express’s `res`, so `res.json` is suddenly not a function. Give inner names their own name (`result`, `docs`). ESLint’s `no-shadow` rule catches it.'),
        keys(
          'JavaScript uses lexical scope: a function’s outer scope is where it is written, not where it is called.',
          'You can work out any lookup by reading how the code is nested.',
          'An inner name with the same name shadows the outer one, on purpose or by accident.',
        ),
      ],
      check: {
        q: "`paint()` is written at the top level and returns `color`. `room()` declares its own `const color = 'red'` and returns `paint()`. With a global `const color = 'blue'`, what does `room()` return?",
        options: ["`'red'`, because paint is called from inside room", "`'blue'`, because paint looks where it was written", '`undefined`', 'A `ReferenceError`'],
        answer: 1,
        explain: "Lookups follow where `paint` is **written** (the top level), not where it is called. One scope out of `paint` is the global scope, where `color` is `'blue'`. `room`’s `color` is never checked.",
      },
      metrics: { scopes: 3, value: "name = 'global'" },
      scene: {
        nodes: {
          globalZ,
          nameG: v(340, 130, "name = 'global'", { tone: 'neutral', w: 180 }),
          showZ: zone(300, 380, 400, 260, 'show() scope', { tone: 'client', icon: 'code' }),
          runZ: zone(735, 300, 390, 420, 'run() scope', { tone: 'client', icon: 'code' }),
          log: v(340, 410, 'console.log(name)', { w: 190, state: 'active' }),
          nameR: v(735, 220, "name = 'run'", { w: 160, state: 'dim' }),
          callShow: v(735, 410, 'show()', { w: 120 }),
        },
        links: [
          link('callShow', 'log', { style: 'dashed', label: 'calls' }),
          link('log', 'nameG', { label: 'where written' }),
          link('log', 'nameR', { style: 'dashed', state: 'off', label: 'never checked' }),
        ],
        flows: [
          flow(['callShow', 'log'], { kind: 'req', label: 'show()', every: 4.2 }),
          flow(['log', 'nameG'], { kind: 'req', label: 'name?', back: 'res', backLabel: "'global'", every: 4.2, offset: 1.1 }),
        ],
      },
    },

    /* ------------------------------------------------------------------ 3 */
    {
      short: 'let, const, var',
      beat: 'technique',
      title: 'Blocks: let and const vs var',
      body: [
        '`let` and `const` belong to the nearest pair of braces `{ }`: an `if`, a loop, any block. When the block ends, they are gone.',
        '`var` is older and ignores blocks. It belongs to the whole surrounding function (or the global scope). That one difference causes many classic bugs, which is why modern code uses only `const` and `let`.',
      ],
      code: {
        file: 'checkout.js',
        lang: 'js',
        code: `function checkout(items) {
  if (items.length > 0) {
    var total = 0; // whole function
    let tax = 0.2; // this block only
  }
  console.log(total); // 0
  console.log(tax); // ❌ ReferenceError
}`,
        hl: [3, 6],
        err: [7],
      },
      detail: [
        h('var vs let vs const'),
        table(
          ['', '`var`', '`let`', '`const`'],
          ['Scope', 'function', 'block', 'block'],
          ['Used before its line', '`undefined`', '❌ ReferenceError', '❌ ReferenceError'],
          ['Declared twice', 'allowed', '❌ SyntaxError', '❌ SyntaxError'],
          ['Reassigned', '✅', '✅', '❌ TypeError'],
          ['Top level adds `window.x`', 'yes', 'no', 'no'],
        ),
        h('Hoisting: names are created before the code runs'),
        p('Before a scope runs a single line, JavaScript scans it and creates **all** of its names up front. This is [[hoisting]]. What differs is the value each name starts with:'),
        ul(
          '`var` names start as `undefined`, so using one too early quietly gives `undefined`.',
          '`let` and `const` names exist but stay **uninitialised** until their line runs. Touching them early throws. The gap between the start of the scope and the declaration is the [[tdz|temporal dead zone (TDZ)]].',
          'Function **declarations** (`function save() {}`) are hoisted whole: you can call them above the line where they are written.',
          'Function **expressions** and arrows stored in a `const` (`const save = () => {}`) follow `const` rules: TDZ until their line.',
        ),
        snippet(
          'hoisting.js',
          `console.log(a); // undefined
console.log(b); // ❌ ReferenceError (TDZ)
greet(); // ✅ works: hoisted whole

var a = 1;
let b = 2;
function greet() { return 'hi'; }`,
          { hl: [1, 3], err: [2] },
        ),
        callout('warn', '`const` stops you **reassigning** the name, not changing the object. `const todos = []; todos.push(t)` works; only `todos = …` is blocked. The values & references lesson explains why.'),
        callout('tip', 'Default to `const`. Use `let` only when the value must change (a counter, a loop index). Don’t use `var` in new code.'),
        keys(
          '`let` and `const` are block-scoped; `var` is function-scoped and leaks out of blocks.',
          'All declarations are hoisted, but `let` and `const` sit in the temporal dead zone until their line runs.',
          'Prefer `const`, then `let`. Avoid `var`.',
        ),
      ],
      check: {
        q: '`function f() { console.log(x); let x = 1; }`. What happens when you call `f()`?',
        options: ['It logs `undefined`', 'It logs `1`', 'It throws a `ReferenceError`', 'It logs `null`'],
        answer: 2,
        explain: '`x` is hoisted to the top of `f`, but as a `let` it stays in the temporal dead zone until `let x = 1` runs. Reading it before that throws. With `var x` it would log `undefined`.',
      },
      metrics: { scopes: 2, value: 'tax → ReferenceError' },
      scene: {
        nodes: {
          globalZ,
          fnZ: zone(560, 300, 700, 440, 'checkout() scope', { tone: 'client', icon: 'code' }),
          blockZ: zone(400, 320, 300, 200, 'if { } block (ended)', { tone: 'client', icon: 'boxes', state: 'dim' }),
          total: v(400, 150, 'var total = 0', { w: 150, tone: 'warn' }),
          tax: v(400, 340, 'let tax = 0.2', { w: 150, state: 'dim' }),
          logTotal: v(760, 190, 'console.log(total)', { w: 200 }),
          logTax: v(760, 390, 'console.log(tax)', { w: 200, tone: 'danger', state: 'error' }),
        },
        links: [link('logTotal', 'total', { label: 'found' }), link('logTax', 'tax', { style: 'dashed', state: 'error', label: 'block ended' })],
        flows: [
          flow(['logTotal', 'total'], { kind: 'req', label: 'total?', back: 'res', backLabel: '0', every: 3.6 }),
          flow(['logTax', 'tax'], { kind: 'err', label: 'tax?', fail: true, every: 3.6, offset: 1.4 }),
        ],
      },
    },

    /* ------------------------------------------------------------------ 4 */
    {
      short: 'Outward only',
      beat: 'technique',
      title: 'Lookups go outward, never inward',
      body: [
        'Inner code can see outer names: `increment` can read `count`, and `appName` too. Outer code can’t see inner names: from the global scope, `count` simply doesn’t exist.',
        'That one-way rule is what makes `count` **private**. Nothing outside `makeCounter` can read or change it, except through the function `makeCounter` chose to hand out.',
      ],
      code: {
        file: 'counter.js',
        lang: 'js',
        code: `function makeCounter() {
  let count = 0;
  return function increment() {
    count++; // ✅ inner sees outer
    return count;
  };
}

console.log(count);
// ❌ ReferenceError: count is not defined`,
        hl: [4],
        err: [9],
      },
      detail: [
        h('Who can see what'),
        table(['Code running in…', '`appName`', '`count`'], ['the global scope', '✅', '❌'], ['`makeCounter`', '✅', '✅'], ['`increment`', '✅', '✅']),
        h('Why this is useful: privacy'),
        ul(
          '**No accidental changes.** Other code can’t set `count = -50` by mistake. It has no way to reach it.',
          '**You control the door.** The only way in is the function you return, so you decide what is allowed (here: only “add one”).',
          '**No name clashes.** Two files can both have a `count`; each lives in its own scope.',
        ),
        p('Other languages have a `private` keyword for this. In JavaScript, scope gives it to you for free. (Classes now also have `#private` fields that work the same way.)'),
        h('The accidental global'),
        p('What happens if you assign to a name that no scope has declared?'),
        snippet(
          'oops.js',
          `function save() {
  total = 10; // forgot let / const
}
save();`,
          { err: [2] },
        ),
        ul(
          'In an old-style **script** (“sloppy mode”), JavaScript quietly creates a **global** `total`. Any code anywhere can now read and overwrite it.',
          'In **strict mode** it throws `ReferenceError: total is not defined`, so the typo is caught at once. Every ES module and class body is strict automatically.',
        ),
        callout('mistake', 'Forgetting `let` / `const` and creating globals by accident. ES modules and ESLint’s `no-undef` rule catch it: another reason to keep both on.'),
        keys(
          'Lookups only go outward. Inner scopes see outer names; outer scopes never see inner names.',
          'That makes variables inside a function private: only the functions you hand out can reach them.',
          'Assigning to an undeclared name creates a global in sloppy mode and throws in strict mode.',
        ),
      ],
      metrics: { scopes: 3, value: 'ReferenceError' },
      scene: {
        nodes: {
          globalZ,
          fnZ,
          innerZ,
          app,
          ask: v(160, 230, 'console.log(count)', { tone: 'danger', w: 200, state: 'error' }),
          count: { ...count0, badge: { text: 'private', tone: 'client' } } as NodeSpec,
          use: { ...use, state: 'idle' } as NodeSpec,
        },
        links: [link('use', 'count', { style: 'dashed', label: 'outward ✓' }), link('ask', 'count', { style: 'dashed', state: 'error', label: 'inward ✗' })],
        flows: [
          flow(['use', 'count'], { kind: 'req', label: 'count?', back: 'res', backLabel: '0', every: 3.6 }),
          flow(['ask', 'count'], { kind: 'err', label: 'count?', fail: true, every: 3.6, offset: 1.6 }),
        ],
      },
    },

    /* ------------------------------------------------------------------ 5 */
    {
      short: 'Closure',
      beat: 'technique',
      title: 'A function remembers where it was born',
      body: [
        'Normally a function’s scope disappears when the call ends. But `makeCounter()` returns `increment`, and `increment` still needs `count`, so the scope is **kept alive**.',
        'A function together with the scope it remembers is a [[closure]]. Every `counter()` call reaches back into that same, still-living scope: 1, then 2, then 3.',
      ],
      code: { file: 'counter.js', lang: 'js', code: counterCode, hl: [11, 12, 13, 14] },
      detail: [
        h('Step by step: what happens in memory'),
        ol(
          '**L11: `makeCounter()` is called.** A new scope is created with `count = 0`.',
          '**`increment` is created inside it.** At that moment the function quietly stores a link to the scope it was created in.',
          '**`makeCounter` returns `increment`.** The call is over. Normally its scope would now be thrown away by the [[gc|garbage collector]]…',
          '**…but `counter` points to `increment`, and `increment` points to the scope.** Something can still reach it, so it stays.',
          '**L12–14: each `counter()` call** creates a small new scope for `increment`, whose outer scope is the remembered one. `count++` looks outward, finds the living `count` and changes it: 1, 2, 3.',
        ),
        callout('picture', 'Every function carries a **backpack**. When it is created, it packs a link to the scope around it. Wherever the function goes (returned, passed to `setTimeout`, stored in an object) it can open the backpack and use those variables.'),
        h('Three ways a function outlives its scope'),
        table(
          ['How', 'Example'],
          ['**Returned** from the outer function', 'factories like `makeCounter()`'],
          ['**Passed** somewhere as a [[callback]]', '`setTimeout(fn)`, `addEventListener`, `.then(fn)`'],
          ['**Stored** for later', 'an `onClick` prop, `module.exports`, an object property'],
        ),
        p('In all three cases the function runs **after** the outer call has finished, and that is exactly when the remembered scope matters.'),
        h('Under the hood'),
        p('In the JavaScript spec, each scope is an **environment record**: a table of names and values, with a link to its outer record. Every function object has a hidden slot, `[[Environment]]`, that saves the record it was created in. Calling the function creates a new record whose outer link is that saved one. Follow the outer links and you get the scope chain.'),
        callout('insight', 'Technically **every** JavaScript function is a closure: even top-level ones remember the global scope. We just say “closure” when it matters, which is when a function runs after its outer function has returned.'),
        keys(
          'A closure is a function plus the scope it was created in.',
          'That scope stays alive as long as some reachable function still references it.',
          'Closures let a function keep using variables after the call that created them has ended.',
        ),
      ],
      metrics: { scopes: 2, value: 'count = 3' },
      scene: {
        nodes: {
          globalZ,
          fnZ: zone(600, 330, 640, 400, 'makeCounter() — returned, kept alive', { tone: 'client', icon: 'code', state: 'active' }),
          counter: v(160, 330, 'counter  →', { w: 170, state: 'active' }),
          count: v(470, 330, 'count = 3', { w: 160, state: 'ok' }),
          fn: box(760, 330, 'increment()', { sub: 'remembers count', icon: 'code', tone: 'client', w: 200 }),
        },
        links: [link('counter', 'fn', { route: 'over', bend: 30, style: 'dashed', label: 'calls' }), link('fn', 'count', { label: 'count++' })],
        flows: [flow(['counter', 'fn', 'count'], { kind: 'req', label: ['counter()', 'count++'], back: 'res', backLabel: ['3', '3'], every: 4 })],
      },
    },

    /* ------------------------------------------------------------------ 6 */
    {
      short: 'Own scope',
      beat: 'technique',
      title: 'Each call gets its own scope',
      body: [
        'Call `makeCounter()` twice and you get two separate scopes, each with its own `count`. Advancing `a` never touches `b`.',
        'But functions created in the **same** call share the **same** scope. `a.inc` and `a.reset` both reach the one `count` that belongs to `a`.',
      ],
      code: {
        file: 'counters.js',
        lang: 'js',
        code: `function makeCounter() {
  let count = 0;
  return {
    inc: () => ++count,
    get: () => count,
    reset: () => { count = 0; },
  };
}

const a = makeCounter();
const b = makeCounter();
a.inc(); a.inc(); a.inc(); // 3
b.inc(); // 1
a.reset();
a.get(); // 0: reset & get share count
b.get(); // 1: b is untouched`,
        hl: [10, 11, 12, 13],
      },
      detail: [
        h('Rule 1: one call, one fresh scope'),
        p('Every time `makeCounter()` runs, line 2 creates a brand-new `count`. `a` and `b` each came from their own call, so each has its own private `count`, like two bank accounts with the same layout.'),
        h('Rule 2: functions from the same call share it'),
        p('`inc`, `get` and `reset` were all created during the **same** call, so they all remember the **same** scope. When `a.reset()` sets `count = 0`, `a.get()` sees `0` right away.'),
        h('Closures capture variables, not values'),
        p('A closure does not take a snapshot of the value. It keeps a link to the **variable** itself, and reads whatever is in it **when it runs**:'),
        snippet(
          'live.js',
          `let x = 1;
const read = () => x;
x = 2;
read(); // 2, not 1`,
          { hl: [4] },
        ),
        p('Keep this rule in mind: it explains the loop bug in the next step and the stale closure in React.'),
        h('Closure factory vs class'),
        table(
          ['', 'Factory + closure', 'Class'],
          ['Private data', 'yes, automatically', 'only with `#field`'],
          ['Uses `this`', 'no, so nothing to lose', 'yes: methods can lose `this` when passed as callbacks'],
          ['Memory', 'new copies of each function per object', 'methods shared on the prototype'],
        ),
        callout('insight', 'React works the same way: every component on the screen gets its own state, just like every `makeCounter()` call gets its own `count`. Two `<Counter />` elements never share a count.'),
        keys(
          'Each call of the outer function creates a new, independent scope.',
          'Functions created in the same call share that one scope.',
          'Closures read the variable’s current value when they run. They don’t freeze it.',
        ),
      ],
      metrics: { scopes: 3, value: 'a: 3 · b: 1' },
      scene: {
        nodes: {
          globalZ,
          fa: zone(640, 175, 560, 200, 'makeCounter() call #1', { tone: 'client', icon: 'code' }),
          fb: zone(640, 425, 560, 200, 'makeCounter() call #2', { tone: 'client', icon: 'code' }),
          a: v(170, 175, 'a  →', { w: 110 }),
          b: v(170, 425, 'b  →', { w: 110 }),
          incA: v(500, 150, 'inc()', { w: 100 }),
          resetA: v(500, 220, 'reset()', { w: 100 }),
          ca: v(780, 185, 'count = 3', { w: 150, state: 'ok' }),
          incB: v(500, 440, 'inc()', { w: 100 }),
          cb: v(780, 440, 'count = 1', { w: 150, state: 'ok' }),
        },
        links: [
          link('a', 'incA'),
          link('a', 'resetA'),
          link('incA', 'ca'),
          link('resetA', 'ca', { style: 'dashed', label: 'same count' }),
          link('b', 'incB'),
          link('incB', 'cb'),
        ],
        flows: [
          flow(['a', 'incA', 'ca'], { kind: 'req', label: ['a.inc()', 'count++'], back: 'res', backLabel: ['3', '3'], every: 4 }),
          flow(['b', 'incB', 'cb'], { kind: 'req', label: ['b.inc()', 'count++'], back: 'res', backLabel: ['1', '1'], every: 4, offset: 1.4 }),
        ],
      },
    },

    /* ------------------------------------------------------------------ 7 */
    {
      short: 'Loop trap',
      beat: 'problem',
      title: 'The classic bug: var in a loop',
      body: [
        'Put the last rule (closures capture **variables**, not values) next to `var`, and you get the most famous bug in JavaScript, and a favourite interview question.',
        'The loop schedules three callbacks. You expect `1, 2, 3`. It prints `4, 4, 4`.',
      ],
      code: {
        file: 'loop.js',
        lang: 'js',
        code: `for (var i = 1; i <= 3; i++) {
  setTimeout(() => {
    console.log(i);
  }, 100);
}
// prints 4, 4, 4. Why?`,
        hl: [1],
        err: [3],
      },
      detail: [
        h('Why: there is only one i'),
        walk(
          ['L1', '`var i` is **function-scoped** (here: global). The whole loop has exactly **one** `i`.'],
          ['L2', 'Each pass creates a new arrow function and hands it to `setTimeout`. All three close over that **same** `i`.'],
          ['L1', 'The loop finishes in a fraction of a millisecond: `i` goes 1 → 2 → 3 → **4**. `4 <= 3` is false, so it stops.'],
          ['L3', '100 ms later the timers fire. Each callback looks up `i` (the one shared variable) and finds `4`.'],
        ),
        h('The timeline'),
        table(
          ['Time', 'What happens', '`i`'],
          ['0 ms', 'the loop runs and schedules 3 timers', '1 → 4'],
          ['~0 ms', 'the loop ends; nothing else is running', '4'],
          ['100 ms', 'callback 1 logs `i`', '4'],
          ['100 ms', 'callback 2 logs `i`', '4'],
          ['100 ms', 'callback 3 logs `i`', '4'],
        ),
        callout('insight', 'The delay doesn’t matter: even `setTimeout(fn, 0)` prints `4, 4, 4`. Timer callbacks always wait until the current code (the whole loop) has finished. The event loop lesson shows why.'),
        keys('`var` gives the whole loop one shared `i`.', 'Every callback closes over that same variable and reads it later, when it is already `4`.'),
      ],
      check: {
        q: 'Which **one-word** change makes this loop print `1, 2, 3`?',
        options: ['Change `var` to `let`', 'Change `100` to `0`', 'Change `setTimeout` to `setInterval`', 'Change the arrow function to `function () {}`'],
        answer: 0,
        explain: '`let` in a `for` loop creates a **new** `i` for every pass, so each callback closes over its own copy. The next step shows exactly how.',
      },
      metrics: { scopes: 1, value: '4, 4, 4' },
      scene: {
        nodes: {
          globalZ,
          i2: v(500, 170, 'var i = 4', { w: 150, tone: 'warn', badge: { text: 'just one', tone: 'warn' } }),
          ...cbs,
          msg: note(500, 525, 'three callbacks, one shared i', { w: 320 }),
        },
        links: [link('cb1', 'i2'), link('cb2', 'i2'), link('cb3', 'i2')],
        flows: [
          flow(['cb1', 'i2'], { kind: 'req', label: 'i?', back: 'err', backLabel: '4', every: 3.6 }),
          flow(['cb2', 'i2'], { kind: 'req', label: 'i?', back: 'err', backLabel: '4', every: 3.6, offset: 1.2 }),
          flow(['cb3', 'i2'], { kind: 'req', label: 'i?', back: 'err', backLabel: '4', every: 3.6, offset: 2.4 }),
        ],
      },
    },

    /* ------------------------------------------------------------------ 8 */
    {
      short: 'Loop fix',
      beat: 'solution',
      title: 'let gives every pass its own i',
      body: [
        'With `let`, a `for` loop creates a **new block scope for every pass**, each with its own `i`. The value is copied from the previous pass, then incremented.',
        'So each callback closes over a different `i` (`1`, `2` and `3`) and prints exactly that.',
      ],
      code: {
        file: 'loop.js',
        lang: 'js',
        code: `for (let i = 1; i <= 3; i++) {
  setTimeout(() => {
    console.log(i);
  }, 100);
}
// prints 1, 2, 3 ✅`,
        hl: [1, 3],
      },
      detail: [
        h('What the engine does with for (let …)'),
        ol(
          'Pass 1 gets a fresh scope with `i = 1`. Callback 1 is created in it and remembers it.',
          'Before pass 2, JavaScript makes a **new** scope, copies `i` (1) into it, then runs `i++`, giving `2`. Callback 2 remembers this one.',
          'Same again for pass 3: `i = 3`.',
          'When the timers fire, each callback opens its own remembered scope: `1`, `2`, `3`.',
        ),
        h('Other fixes you will see'),
        snippet(
          'iife.js',
          `for (var i = 1; i <= 3; i++) {
  (function (j) {
    setTimeout(() => console.log(j), 100);
  })(i);
}`,
          { hl: [2, 4] },
        ),
        p('Before `let` existed (before 2015), people used an [[iife|IIFE]]: a function called immediately. Each call creates a new function scope where the parameter `j` holds that pass’s value. You will still meet this in older code.'),
        snippet(
          'forEach.js',
          `[1, 2, 3].forEach((i) => {
  setTimeout(() => console.log(i), 100);
});`,
        ),
        p('`forEach` (and `map`) call your function once per item, so each call has its own parameter `i`: a separate scope for free.'),
        h('Which loops are safe?'),
        table(
          ['Loop', '`i` per pass?', 'Prints'],
          ['`for (var i …)`', 'one shared', '4 4 4'],
          ['`for (let i …)`', 'new each pass', '1 2 3'],
          ['`let i;` before the loop', 'one shared', '4 4 4'],
          ['`arr.forEach((i) => …)`', 'new each call', '1 2 3'],
        ),
        callout('mistake', 'Declaring `let i` **outside** the loop (`let i; for (i = 1; …)`) brings the bug straight back: there is again only one `i`. The per-pass copy only happens for a `let` declared in the loop head.'),
        keys(
          '`for (let i …)` creates a new `i` for each pass; closures inside capture that pass’s `i`.',
          'IIFEs and `forEach` fix it the same way: by creating a new scope per pass.',
          'When a callback runs later, ask: which variable does it close over, and what is in it by then?',
        ),
      ],
      metrics: { scopes: 4, value: '1, 2, 3' },
      scene: {
        nodes: {
          globalZ,
          loopZ: zone(500, 320, 880, 420, 'for (let i …) loop', { tone: 'client', icon: 'loop' }),
          it1: zone(215, 345, 260, 290, 'pass 1 scope', { tone: 'client', icon: 'boxes' }),
          it2: zone(500, 345, 260, 290, 'pass 2 scope', { tone: 'client', icon: 'boxes' }),
          it3: zone(785, 345, 260, 290, 'pass 3 scope', { tone: 'client', icon: 'boxes' }),
          i1: v(215, 280, 'i = 1', { w: 110, state: 'ok' }),
          i2: v(500, 280, 'i = 2', { w: 110, state: 'ok' }),
          i3: v(785, 280, 'i = 3', { w: 110, state: 'ok' }),
          ...cbs,
        },
        links: [link('cb1', 'i1'), link('cb2', 'i2'), link('cb3', 'i3')],
        flows: [
          flow(['cb1', 'i1'], { kind: 'req', label: 'i?', back: 'res', backLabel: '1', every: 3.6 }),
          flow(['cb2', 'i2'], { kind: 'req', label: 'i?', back: 'res', backLabel: '2', every: 3.6, offset: 1.2 }),
          flow(['cb3', 'i3'], { kind: 'req', label: 'i?', back: 'res', backLabel: '3', every: 3.6, offset: 2.4 }),
        ],
      },
    },

    /* ------------------------------------------------------------------ 9 */
    {
      short: 'Patterns',
      beat: 'technique',
      title: 'Closures you’ll write on purpose',
      body: [
        'Closures aren’t only a source of bugs. They are how JavaScript gives a function **private memory** that survives between calls.',
        'Every pattern below uses the same recipe: an outer function sets up some variables, returns an inner function that uses them, and the caller keeps that inner function.',
      ],
      code: {
        file: 'memoize.js',
        lang: 'js',
        code: `function memoize(fn) {
  const cache = new Map();
  return (n) => {
    if (cache.has(n)) return cache.get(n);
    const result = fn(n);
    cache.set(n, result);
    return result;
  };
}

const fastSquare = memoize(slowSquare);
fastSquare(9); // computes → 81
fastSquare(9); // from the cache → 81`,
        hl: [2, 4],
      },
      detail: [
        h('How memoize works'),
        walk(
          ['L2', '`cache` is created once, when `memoize(slowSquare)` runs. Nothing outside can touch it.'],
          ['L3', 'The returned arrow function closes over `cache` **and** `fn`.'],
          ['L4', 'On every call it checks the cache first. A hit returns instantly.'],
          ['L5–6', 'A miss runs the slow function once and saves the answer for next time.'],
        ),
        h('once: run setup a single time'),
        snippet(
          'once.js',
          `function once(fn) {
  let done = false;
  let result;
  return (...args) => {
    if (!done) {
      done = true;
      result = fn(...args);
    }
    return result;
  };
}

const connectDb = once(() =>
  mongoose.connect(process.env.MONGO_URI));`,
          { hl: [2, 3] },
        ),
        h('debounce: wait until the user stops typing'),
        snippet(
          'debounce.js',
          `function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

const onType = debounce(search, 300);
onType('m'); onType('mo'); onType('mon');
// search('mon') runs once, 300 ms later`,
          { hl: [2, 4, 5] },
        ),
        p('Each keystroke cancels the previous timer, because every call reaches the **same** `timer` variable in the remembered scope.'),
        h('Factories: preset a function with config'),
        snippet(
          'factory.js',
          `const withTax = (rate) => (price) =>
  price * (1 + rate);

const gst = withTax(0.18);
gst(100); // 118
gst(500); // 590`,
          { hl: [4] },
        ),
        p('This is also called **partial application**: you fill in some arguments now (`rate`) and the rest later (`price`).'),
        h('Cheat sheet'),
        table(
          ['Pattern', 'Remembers', 'Use it for'],
          ['`memoize`', '`cache`', 'expensive, repeated calculations'],
          ['`once`', '`done`, `result`', 'a DB connection, one-time setup'],
          ['`debounce`', '`timer`', 'search boxes, resize, autosave'],
          ['factory', 'config (`rate`, `schema`)', 'validators, middleware, API clients'],
          ['private state', 'any variables', 'counters, stores, modules'],
        ),
        callout('warn', 'A memoize cache that never forgets keeps growing forever. For unlimited inputs, cap its size (an LRU cache), or use a `WeakMap` when the keys are objects.'),
        keys(
          'A closure gives a function private memory that survives between calls.',
          'The recipe: the outer function sets up variables, returns an inner function, and the inner function uses them.',
          '`memoize`, `once`, `debounce` and factories are all this one recipe.',
        ),
      ],
      metrics: { scopes: 2, value: '81 (from cache)' },
      scene: {
        nodes: {
          globalZ,
          memoZ: zone(620, 300, 600, 360, 'memoize(slowSquare) scope', { tone: 'client', icon: 'code', state: 'active' }),
          fast: v(170, 300, 'fastSquare(9)', { w: 160 }),
          inner: box(500, 300, '(n) => …', { sub: 'cache first', icon: 'code', tone: 'client', w: 200 }),
          cache: v(790, 300, 'cache: 9 → 81', { w: 170, state: 'ok' }),
          slow: v(790, 420, 'fn = slowSquare', { w: 170, tone: 'neutral' }),
        },
        links: [link('fast', 'inner', { label: 'calls' }), link('inner', 'cache', { label: 'hit?' }), link('inner', 'slow', { style: 'dashed', label: 'miss only' })],
        flows: [flow(['fast', 'inner', 'cache'], { kind: 'req', label: ['fastSquare(9)', '9?'], back: 'res', backLabel: ['81', '81'], every: 4 })],
      },
    },

    /* ------------------------------------------------------------------ 10 */
    {
      short: 'Stale closure',
      beat: 'problem',
      title: 'Stale closures in React',
      body: [
        'Every [[render]] of a component is just a **function call**. Each call gets its own scope with its own `count`: a constant snapshot for that render, not a live variable.',
        'An [[effect]] with an empty [[deps|dependency array]] runs only once, after render #1. The interval callback it creates closes over render #1’s scope, where `count` is `0` forever. That’s a [[stale-closure|stale closure]].',
      ],
      code: {
        file: 'Timer.jsx',
        lang: 'jsx',
        code: `function Timer() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCount(count + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []); // runs once, after render #1

  return <h1>{count}</h1>;
}`,
        hl: [9],
        err: [6],
      },
      detail: [
        h('What happens, second by second'),
        table(
          ['Time', 'What runs', 'Screen'],
          ['render #1', '`count = 0`. The effect runs once and starts the interval. Its callback remembers **this** scope.', '0'],
          ['1 s', 'the callback runs `setCount(0 + 1)`, so render #2 shows `count = 1`. The effect does **not** run again (`[]`).', '1'],
          ['2 s', 'the same old callback runs `setCount(0 + 1)` again. State is already 1, so React skips the render.', '1'],
          ['3 s, 4 s…', '`setCount(1)`, forever', '1'],
        ),
        h('Why count doesn’t update inside the callback'),
        ul(
          '`count` is a `const` inside **one** render. Render #2 doesn’t change render #1’s `count`; it creates a **new** `count` in a new scope.',
          'The callback was created during render #1, so its outer scope is render #1’s scope. Lookups are lexical: it can never “see” a later render.',
          'Nothing creates a new callback, because the effect never re-runs.',
        ),
        h('Where stale closures hide'),
        ul(
          '`setInterval` / `setTimeout` callbacks inside effects with missing dependencies.',
          "Event listeners added once: `window.addEventListener('keydown', …)` in an effect with `[]`.",
          "Socket handlers: `socket.on('message', …)` that read state.",
          '`useCallback` / `useMemo` with missing dependencies: they hand out an old closure on purpose.',
          'Async functions that `await` and then read state: they still see the render they started in.',
        ),
        callout('mistake', 'Silencing the `react-hooks/exhaustive-deps` lint warning. That rule exists to catch exactly this bug: when it complains, a closure is about to go stale.'),
        keys(
          'Each render is a function call with its own scope and its own values.',
          'A callback sees the values of the render it was created in.',
          'If that callback lives on (an interval, a listener) while the component re-renders, it goes stale.',
        ),
      ],
      check: {
        q: 'Same `Timer`, but the dependency array is `[count]` instead of `[]` (the cleanup stays). What happens?',
        options: [
          'Still stuck at 1: the same bug',
          'It counts 1, 2, 3…: every change re-runs the effect with a fresh closure',
          'It counts twice as fast: the intervals pile up',
          'An infinite loop crashes the page',
        ],
        answer: 1,
        explain: 'With `[count]`, every change runs the cleanup (old interval cleared) and then the effect again, so the new callback closes over the new render’s `count`. It works, but restarts the timer on every tick. Without the cleanup, intervals **would** pile up. The next step shows a cleaner fix.',
      },
      metrics: { scopes: 3, value: 'stuck at 1' },
      scene: {
        nodes: {
          globalZ,
          r1: zone(330, 300, 380, 360, 'render #1 scope', { tone: 'client', icon: 'component', state: 'dim' }),
          r2: zone(760, 300, 340, 360, 'render #2 scope (latest)', { tone: 'client', icon: 'component', state: 'active' }),
          c1: v(330, 220, 'count = 0', { w: 160 }),
          cb: v(330, 380, 'interval callback', { w: 190, tone: 'danger', state: 'error' }),
          c2: v(760, 300, 'count = 1', { w: 160 }),
        },
        links: [link('cb', 'c1', { label: 'reads' }), link('cb', 'c2', { style: 'dashed', state: 'off', label: 'can’t see' })],
        flows: [flow(['cb', 'c1'], { kind: 'err', label: 'count?', back: 'err', backLabel: '0 (stale)', every: 2.4 })],
      },
    },

    /* ------------------------------------------------------------------ 11 */
    {
      short: 'Fix',
      beat: 'solution',
      title: 'Ask React for the latest value',
      body: [
        'Pass the setter a **function**: `setCount((c) => c + 1)`. React calls it with the current state, so the callback no longer reads `count` from its old scope. There is nothing left to go stale.',
        'There are three standard fixes. Which one to pick depends on what the callback needs.',
      ],
      code: {
        file: 'Timer.jsx',
        lang: 'jsx',
        code: `useEffect(() => {
  const id = setInterval(() => {
    // ✅ React passes the latest value
    setCount((c) => c + 1);
  }, 1000);
  return () => clearInterval(id);
}, []);`,
        hl: [3, 4],
      },
      detail: [
        h('Fix 1: functional update (best here)'),
        p('The callback only needs the **previous state** to compute the next one. React gives the updater `(c) => c + 1` the latest value every time, no matter which render created the callback. The effect can safely keep `[]`, and the interval never restarts.'),
        h('Fix 2: list the dependency'),
        snippet(
          'Timer.jsx',
          `useEffect(() => {
  const id = setInterval(() => {
    setCount(count + 1);
  }, 1000);
  return () => clearInterval(id);
}, [count]); // re-sync on change`,
          { lang: 'jsx', hl: [5, 6] },
        ),
        p('Every change runs the [[cleanup]] (old interval cleared), then the effect again with a fresh closure. Correct, but the timer restarts every tick, and forgetting the cleanup makes intervals pile up. Use this when the effect really should re-sync with the new value, such as re-fetching when `userId` changes.'),
        h('Fix 3: a ref for the latest value'),
        snippet(
          'Chat.jsx',
          `const latest = useRef(messages);
useEffect(() => {
  latest.current = messages;
});

useEffect(() => {
  const onPing = () =>
    log(latest.current.length); // fresh
  socket.on('ping', onPing);
  return () => socket.off('ping', onPing);
}, []);`,
          { lang: 'jsx', hl: [3, 8] },
        ),
        p('A ref is **one box that lives across all renders**: every render gets the same object. A long-lived closure that reads `latest.current` always sees the newest value, without re-subscribing.'),
        h('Which fix when?'),
        table(
          ['Fix', 'Write', 'Use when'],
          ['Functional update', '`setX((prev) => …)`', 'the new state is computed from the old state'],
          ['Correct deps', '`[count]` + cleanup', 'the effect should re-run on change'],
          ['Ref', '`ref.current`', 'a long-lived callback must **read** the latest value'],
        ),
        callout('tip', 'Trust `react-hooks/exhaustive-deps`. If it asks for a dependency you don’t want, that’s the signal to use a functional update or a ref, not to disable the rule.'),
        keys(
          'Functional updates remove the need to read state from the closure at all.',
          'Correct dependencies plus a cleanup give the effect a fresh closure on every change.',
          'Refs hold the latest value for callbacks that must live across renders.',
        ),
      ],
      metrics: { scopes: 2, value: 'counts 1, 2, 3…' },
      scene: {
        nodes: {
          globalZ,
          r1: zone(330, 300, 380, 360, 'render #1 scope', { tone: 'client', icon: 'component', state: 'dim' }),
          r2: zone(760, 300, 340, 360, 'React state (latest)', { tone: 'client', icon: 'react', state: 'active' }),
          cb: v(330, 300, 'c => c + 1', { w: 170, state: 'ok' }),
          c2: v(760, 300, 'count = 5', { w: 160, state: 'ok' }),
        },
        links: [link('cb', 'c2', { label: 'React passes c' })],
        flows: [flow(['c2', 'cb'], { kind: 'res', label: 'c = 5', back: 'data', backLabel: '6', every: 2.4 })],
      },
    },

    /* ------------------------------------------------------------------ 12 */
    {
      short: 'In MERN',
      beat: 'insight',
      title: 'You already use closures everywhere',
      body: [
        'Every event handler that reads props or state is a closure. So is every [[middleware]] factory: `validate(TodoInput)` runs **once** at startup and returns a middleware that remembers `schema` for every request after.',
        'Once you see the pattern (the outer function stores config, the inner function uses it later) you’ll spot it on every page of a MERN app.',
      ],
      code: {
        file: 'middleware/validate.js',
        lang: 'js',
        code: `export const validate = (schema) =>
  (req, res, next) => {
    // schema remembered from setup
    const r = schema.safeParse(req.body);
    if (!r.success) {
      return res.status(400).json(r.error);
    }
    next();
  };

app.post('/api/todos',
  validate(TodoInput), createTodo);`,
        hl: [1, 4, 12],
      },
      detail: [
        h('On the server: Express'),
        walk(
          ['L12', 'At startup Express evaluates `validate(TodoInput)` **once**. A scope is created with `schema = TodoInput`.'],
          ['L2', 'It returns the inner `(req, res, next)` function. That is what Express registers as the middleware.'],
          ['L4', 'On request #1, #2 … #1,000,000 the middleware looks up `schema`: not in its own scope, so one scope out, to the remembered one.'],
        ),
        snippet(
          'middleware/auth.js',
          `export const requireRole = (role) =>
  (req, res, next) => {
    if (req.user?.role !== role) {
      return res.sendStatus(403);
    }
    next();
  };

router.delete('/todos/:id',
  requireRole('admin'), removeTodo);`,
          { hl: [1, 3] },
        ),
        snippet(
          'middleware/asyncHandler.js',
          `export const asyncHandler = (fn) =>
  (req, res, next) =>
    fn(req, res, next).catch(next);`,
          { hl: [3] },
        ),
        p('`asyncHandler` remembers **your** route function `fn`, and passes any rejected promise to Express’s error handler with `next`.'),
        h('In the browser: React'),
        snippet(
          'TodoList.jsx',
          `{todos.map((todo) => (
  <TodoItem
    key={todo._id}
    onDelete={() => remove(todo._id)}
  />
))}`,
          { lang: 'jsx', hl: [4] },
        ),
        p('Each arrow function remembers **its own** `todo`: one closure per item. Click the third item and its handler still knows it belongs to the third todo.'),
        h('Inside Node itself'),
        p('Node wraps every CommonJS file in a function before running it: `(function (exports, require, module, __filename, __dirname) { … })`. That is why a top-level `const` in one file is invisible in another. Each file is a function scope, and what you export is what you hand out. ES modules get their own module scope in the same way.'),
        h('Spot the closure'),
        table(
          ['Where', 'Code', 'Remembers'],
          ['Express', '`validate(schema)`', 'the schema'],
          ['Express', "`requireRole('admin')`", 'the role'],
          ['Express', '`rateLimit({ max: 100 })`', 'options and hit counts'],
          ['React', '`onClick={() => remove(id)}`', 'that item’s id'],
          ['React', 'a custom hook', 'its component’s state'],
          ['Node', 'each module file', 'its top-level variables'],
        ),
        keys(
          'Middleware factories run once at startup and hand out a closure that runs on every request.',
          'Every inline React handler is a closure over that render’s props and state.',
          'Module files are private scopes; exports are the doors you open.',
        ),
      ],
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

    /* ------------------------------------------------------------------ 13 */
    {
      short: 'Memory',
      beat: 'tradeoff',
      title: 'Closures keep things alive',
      body: [
        'A closure keeps its remembered scope reachable. As long as the function can be reached (stored in a listener, a timer, a cache), the [[gc|garbage collector]] can’t free the variables it uses.',
        'Usually that’s exactly what you want. But a closure that is never removed holds its memory **forever**. That’s a memory leak.',
      ],
      code: {
        file: 'leak.js',
        lang: 'js',
        code: `function attachLogger() {
  const bigData = new Array(1e6).fill('*');
  window.addEventListener('scroll', () => {
    console.log(bigData.length);
  });
}
// each call adds a listener that keeps
// its own bigData alive, forever`,
        hl: [2, 3],
      },
      detail: [
        h('How the garbage collector decides'),
        p('JavaScript frees memory that **nothing can reach any more**, starting from the roots (the global object and the running call stack). Follow the chain in the diagram:'),
        ol('`window` keeps a list of its scroll listeners.', 'That list holds your arrow function.', 'The arrow function holds its remembered scope.', 'The scope holds `bigData`: a million items.'),
        p('Every link is still there, so none of it can be freed. Call `attachLogger()` ten times and you have ten listeners and ten copies of `bigData`.'),
        h('Common closure leaks'),
        ul(
          '**Event listeners** added but never removed (`addEventListener` without `removeEventListener`).',
          '**Intervals** never cleared: the callback, and everything it closes over, lives as long as the timer.',
          '**Caches** (`memoize`, a module-level `Map`) that grow without a limit.',
          '**Subscriptions** (`socket.on`, `emitter.on`, store subscriptions) without the matching `off` or unsubscribe.',
          '**Big objects captured by accident** when the closure only needed one small field.',
        ),
        h('How to avoid them'),
        snippet(
          'Width.jsx',
          `useEffect(() => {
  function onResize() {
    setWidth(window.innerWidth);
  }
  window.addEventListener('resize', onResize);
  // ✅ cleanup lets the closure go
  return () => {
    window.removeEventListener(
      'resize', onResize);
  };
}, []);`,
          { lang: 'jsx', hl: [7, 8, 9] },
        ),
        ul(
          'In React, **return a cleanup** from every effect that adds a listener, timer or subscription.',
          'On the server, a module-level variable lives as long as the process: cap any cache stored there.',
          'Copy just what you need before creating a long-lived closure: `const n = bigData.length;` then close over `n`.',
          'Use a `WeakMap` when you cache data keyed by objects: entries disappear when the object does.',
        ),
        callout('insight', 'Engines like V8 only keep the variables an inner function actually **uses**. But all closures created in the same scope share one stored context, so if any one of them uses `bigData`, it stays alive for all of them.'),
        callout('tip', 'To hunt a leak: Chrome DevTools → **Memory** → take a heap snapshot, repeat the action a few times, take another, and compare. Objects whose count keeps growing are your suspects.'),
        keys(
          'A closure keeps its scope, and everything that scope references, alive while the closure is reachable.',
          'Leaks come from closures that are stored and never removed: listeners, intervals, subscriptions, unbounded caches.',
          'Clean up what you register, and close over only what you need.',
        ),
      ],
      metrics: { scopes: 2, value: 'bigData: never freed' },
      scene: {
        nodes: {
          globalZ,
          win: box(170, 300, 'window', { sub: 'scroll listeners', icon: 'globe', tone: 'neutral', w: 180 }),
          memZ: zone(640, 300, 520, 300, 'attachLogger() — kept alive', { tone: 'client', icon: 'code', state: 'active' }),
          fn: box(500, 300, 'listener', { sub: 'uses bigData', icon: 'code', tone: 'client', w: 180 }),
          big: v(790, 300, 'bigData · 1M', { tone: 'warn', w: 150 }),
          gc: box(790, 505, 'garbage collector', { icon: 'loop', tone: 'neutral', w: 200 }),
        },
        links: [link('win', 'fn', { label: 'holds' }), link('fn', 'big', { label: 'closes over' }), link('gc', 'big', { style: 'dashed', state: 'error', label: 'free it?' })],
        flows: [
          flow(['win', 'fn', 'big'], { kind: 'req', label: ['scroll', 'bigData?'], back: 'res', backLabel: ['1M', 'logged'], every: 4 }),
          flow(['gc', 'big'], { kind: 'err', label: 'free?', fail: true, every: 4, offset: 2 }),
        ],
      },
    },

    /* ------------------------------------------------------------------ 14 */
    {
      short: 'Practice',
      beat: 'try',
      title: 'Practice: Build a limited-call wrapper',
      body: [
        'Use a closure to keep private state. Write `createLimitedFunction(fn, limit)` that lets `fn` run at most `limit` times.',
        'Calls beyond the limit should return the result of the last successful call, without running `fn` again.',
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
      detail: [
        h('Plan before you code'),
        ol(
          '**What must survive between calls?** How many times `fn` has run, and its last result.',
          '**Where should it live?** Inside `createLimitedFunction`, so each wrapper gets its own private copy, just like `makeCounter`.',
          '**What does the returned function do on each call?** Either run `fn` and remember the result, or skip it and return the remembered result.',
        ),
        h('Expected behaviour'),
        snippet(
          'example.js',
          `const double = createLimitedFunction(
  (x) => x * 2, 2);

double(1); // 2: runs fn
double(2); // 4: runs fn (limit reached)
double(3); // 4: skipped, last result`,
        ),
        callout('tip', 'This is the `once` pattern from step 9 with a counter instead of a true/false flag. `once(fn)` is just `createLimitedFunction(fn, 1)`.'),
      ],
      scene: {
        nodes: {
          globalZ,
          fnZ: zone(600, 330, 640, 400, 'createLimitedFunction() scope', { tone: 'client', icon: 'code' }),
          counter: v(160, 330, 'wrapper()  →', { w: 170 }),
          count: v(470, 330, 'count < limit', { w: 160, state: 'ok' }),
          fn: box(760, 330, 'fn(...args)', { sub: 'called if under limit', icon: 'code', tone: 'client', w: 240 }),
        },
        links: [link('counter', 'count'), link('count', 'fn')],
      },
    },

    /* ------------------------------------------------------------------ 15 */
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Scope and closures',
      body: [
        'Every call creates a {client:scope}. Lookups go **outward** through the [[scope-chain|scope chain]], decided by where the code is written, never inward. That makes inner variables private.',
        '`let` and `const` are {client:block-scoped} and sit in the TDZ before their line. `var` is function-scoped: one shared variable, which causes the {danger:loop bug}.',
        'A {client:closure} is a function plus the scope it was created in. It captures **variables**, not values, and keeps that scope alive as long as the function lives.',
        'In React each render has its own scope: watch for {danger:stale closures} and fix them with functional updates, correct dependencies or refs. Clean up listeners and timers so closures don’t {warn:leak memory}.',
      ],
      detail: [
        h('Cheat sheet'),
        table(
          ['Term', 'In one line'],
          ['Scope', 'where a name is visible'],
          ['Scope chain', 'current scope → outer scopes → global → `ReferenceError`'],
          ['Lexical scope', 'the outer scope is where the function is **written**'],
          ['Block scope', '`let` / `const` live inside `{ }`; `var` ignores blocks'],
          ['Hoisting', 'names are created before the scope’s code runs'],
          ['TDZ', '`let` / `const` exist but can’t be used before their line'],
          ['Closure', 'a function plus the scope it was created in'],
          ['Stale closure', 'a callback still reading an old render’s values'],
        ),
        h('Interview questions: answer first, then open'),
        qa(
          ['What is a closure? Give a real example.', 'A function bundled with the scope it was created in, so it can keep using those variables after the outer function has returned. Real examples: Express middleware factories like `validate(schema)`, `debounce`, a private counter, every React event handler.'],
          ['What does `for (var i = 0; i < 3; i++) setTimeout(() => console.log(i))` print? How do you fix it?', '`3 3 3`. `var` gives the loop one shared `i`, and the callbacks read it after the loop has finished. Fix: use `let` (a new `i` per pass), or an IIFE / `forEach` to create a scope per pass.'],
          ['What are the differences between `var`, `let` and `const`?', 'Scope (function vs block), hoisting (`var` starts as `undefined`; `let` and `const` are in the TDZ), declaring twice (only `var` allows it) and reassigning (`const` can’t be reassigned, but the object it points to can still change).'],
          ['What is hoisting, and what is the temporal dead zone?', 'Hoisting: every declaration in a scope is created before any of its code runs. The TDZ is the time between the start of the scope and a `let` / `const` declaration, when touching the name throws a `ReferenceError`.'],
          ['Do closures capture values or variables?', 'Variables. A closure reads the variable’s current value when it runs, which is why two closures from the same call share state, and why the `var` loop prints the final value.'],
          ['What is lexical scope? How is `this` different?', 'Lexical scope means a function’s outer scope is fixed by where it is written in the code. `this` is not lexical in normal functions: it depends on how the function is called. Arrow functions take `this` lexically.'],
          ['Can closures cause memory leaks? How do you prevent them?', 'Yes: a reachable closure keeps its whole scope alive. Listeners, intervals and subscriptions that are never removed, or caches that never shrink, hold memory forever. Prevent it with cleanup (remove listeners, clear timers, unsubscribe), bounded caches, and by closing over only what you need.'],
          ['What is a stale closure in React, and how do you fix it?', 'A callback created in one render (say, inside an effect with `[]`) keeps reading that render’s state after newer renders. Fix it with a functional update (`setX((prev) => …)`), by listing the right dependencies with a cleanup, or by reading the latest value from a ref.'],
        ),
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
