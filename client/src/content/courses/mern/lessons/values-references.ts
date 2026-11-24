import { chip, defineLesson, doc, field, flow, link, practice, zone } from '@/content/dsl';
import type { LinkSpec, NodeSpec } from '@/engine/types';

/* ---------- layout: variables on the stack (left), objects on the heap (right), arrows = references ---------- */
const stackZ = zone(205, 300, 330, 530, 'Stack · variables', { tone: 'client', icon: 'layers' });
const heapZ = zone(700, 300, 540, 530, 'Heap · objects', { tone: 'data', icon: 'boxes' });
const v = (y: number, label: string, o: Partial<NodeSpec> = {}): NodeSpec => ({ ...chip(205, y, label, { tone: 'client', w: 230 }), ...o }) as NodeSpec;
const obj = (x: number, y: number, label: string, fields: [string, string, boolean?][], o: Partial<NodeSpec> = {}): NodeSpec =>
  ({ ...doc(x, y, label, fields.map(([k, val, hl]) => field(k, val, { hl })), { w: 250 }), ...o }) as NodeSpec;
const ref = (from: string, to: string, o: Partial<LinkSpec> = {}) => link(from, to, { tone: 'data', ...o });
const frame = { stackZ, heapZ };

export default defineLesson({
  metrics: [
    { id: 'objects', label: 'Objects on the heap' },
    { id: 'surprise', label: 'Original changed by accident' },
  ],
  legend: { data: 'reference', err: 'mutation' },
  goals: [
    { text: 'Primitives are copied by value', step: 1 },
    { text: 'Objects are shared by reference', step: 3 },
    { text: 'What === really compares', step: 4 },
    { text: 'Shallow vs deep copies', step: 5 },
    { text: 'Why React wants new objects', step: 7 },
  ],
  steps: [
    {
      short: 'Primitives',
      beat: 'setup',
      title: 'Numbers and strings are copied',
      body: [
        'For [[primitive|primitives]] — numbers, strings, booleans — a variable holds the value itself. `let b = a` copies it: change `b` and `a` doesn’t notice.',
        'That’s the behaviour everyone expects. Objects are where the surprise comes from.',
      ],
      code: { file: 'values.js', lang: 'js', code: `let a = 1;\nlet b = a;  // copies the value 1\nb = 2;\nconsole.log(a); // 1 — untouched`, hl: [2, 4] },
      metrics: { objects: 0, surprise: 'no' },
      scene: { nodes: { ...frame, a: v(170, 'a = 1'), b: v(240, 'b = 2', { state: 'active' }) } },
    },
    {
      short: 'References',
      beat: 'technique',
      title: 'Objects live on the heap; variables point at them',
      body: [
        'An object or array is created on the [[heap]], and the variable holds a **reference** — an arrow to it, not the object itself.',
        'That’s efficient: passing a 10 000-item array to a function hands over one arrow, not 10 000 items.',
      ],
      code: { file: 'values.js', lang: 'js', code: `const todo = { text: 'Buy milk', done: false };`, hl: [1] },
      metrics: { objects: 1, surprise: 'no' },
      scene: {
        nodes: { ...frame, todo: v(200, 'todo  →'), o1: obj(700, 200, 'object #1', [['text', '"Buy milk"'], ['done', 'false']]) },
        links: [ref('todo', 'o1')],
        flows: [flow(['todo', 'o1'], { kind: 'data', label: 'reference', every: 3.4 })],
      },
    },
    {
      short: 'Shared',
      beat: 'problem',
      title: 'Copying the variable copies the arrow',
      body: [
        '`const copy = todo` doesn’t copy the object — it copies the **arrow**. Now two variables point at the same object.',
        'Set `copy.done = true` and `todo.done` is `true` as well, because there is only one object. This is behind countless “why did my state change?” bugs.',
      ],
      check: {
        q: '`const copy = todo; copy.done = true;` What is `todo.done` now?',
        options: ['`false` — copy is a separate object', '`true` — both names point to one object', '`undefined`', 'It throws: todo is const'],
        answer: 1,
        explain: 'Assignment copies the reference. `const` only stops you reassigning the variable — the object it points to can still be changed.',
      },
      code: { file: 'values.js', lang: 'js', code: `const copy = todo;   // same arrow, same object\ncopy.done = true;\nconsole.log(todo.done); // true 😱`, err: [3] },
      metrics: { objects: 1, surprise: 'yes' },
      scene: {
        nodes: {
          ...frame,
          todo: v(200, 'todo  →'),
          copy: v(290, 'copy  →', { state: 'active' }),
          o1: obj(700, 245, 'object #1', [['text', '"Buy milk"'], ['done', 'true', true]], { state: 'error', badge: { text: 'changed for both', tone: 'danger' } }),
        },
        links: [ref('todo', 'o1'), ref('copy', 'o1')],
        flows: [flow(['copy', 'o1'], { kind: 'err', label: 'done = true', every: 3.4 })],
      },
    },
    {
      short: '===',
      beat: 'technique',
      title: '=== compares arrows, not contents',
      body: [
        'For objects, `===` asks “same object?”, not “same contents?”. Two objects with identical fields are still two different objects: `{ a: 1 } === { a: 1 }` is `false`.',
        'React uses exactly this check (`Object.is`) to decide whether state or props changed — which is why mutating an object in place looks like “no change” to React.',
      ],
      code: { file: 'values.js', lang: 'js', code: `const x = { text: 'Buy milk' };\nconst y = { text: 'Buy milk' };\nx === y;      // false — two objects\nconst z = x;\nx === z;      // true — same object`, hl: [3, 5] },
      metrics: { objects: 2, surprise: 'no' },
      scene: {
        nodes: {
          ...frame,
          x: v(170, 'x  →'),
          y: v(250, 'y  →'),
          z: v(330, 'z  →'),
          o1: obj(700, 170, 'object #1', [['text', '"Buy milk"']]),
          o2: obj(700, 380, 'object #2', [['text', '"Buy milk"']]),
          eq1: chip(205, 450, 'x === y → false', { tone: 'danger', w: 230 }),
          eq2: chip(205, 505, 'x === z → true', { tone: 'ok', w: 230 }),
        },
        links: [ref('x', 'o1'), ref('z', 'o1'), ref('y', 'o2')],
      },
    },
    {
      short: 'Copies',
      beat: 'solution',
      title: 'Real copies — and why spread is shallow',
      body: [
        'Spread makes a new object: `{ ...todo }`. Change the copy’s `done` and the original is safe. But it’s a [[shallow-copy|shallow copy]]: nested objects and arrays are still shared — both `tags` arrows point to one array.',
        'Copy the nested part too (`{ ...todo, tags: [...todo.tags] }`), or use `structuredClone(todo)` for a full deep copy.',
      ],
      code: {
        file: 'values.js',
        lang: 'js',
        code: `const copy = { ...todo };     // new outer object
copy.done = true;             // ✅ todo.done still false
copy.tags.push('urgent');     // ❌ todo.tags changed too (shared array)

const deep = structuredClone(todo); // nothing shared`,
        hl: [1, 2],
        err: [3],
      },
      metrics: { objects: 3, surprise: 'partly' },
      scene: {
        nodes: {
          ...frame,
          todo: v(170, 'todo  →'),
          copy: v(330, 'copy  →', { state: 'active' }),
          o1: obj(590, 150, 'object #1', [['done', 'false'], ['tags', '→ array']]),
          o2: obj(590, 345, 'object #2 (copy)', [['done', 'true', true], ['tags', '→ array']], { state: 'ok' }),
          arr: obj(850, 250, 'array', [['0', '"errand"'], ['1', '"urgent"', true]], { w: 180, state: 'error', badge: { text: 'shared!', tone: 'danger' } }),
        },
        links: [ref('todo', 'o1'), ref('copy', 'o2'), ref('o1', 'arr', { style: 'dashed' }), ref('o2', 'arr', { style: 'dashed' })],
        flows: [flow(['copy', 'o2', 'arr'], { kind: 'err', label: ['copy.tags', 'push'], every: 4 })],
      },
    },
    {
      short: 'Functions',
      beat: 'technique',
      title: 'Functions receive arrows too',
      body: [
        'Passing an object to a function passes the reference. If the function changes the object, the caller’s object changes — a hidden side effect.',
        'Prefer functions that **return a new value** over ones that modify their arguments. They’re easier to test, and they’re what React needs.',
      ],
      code: {
        file: 'todos.js',
        lang: 'js',
        code: `function markDone(t) { t.done = true; }              // ❌ changes the caller's object
const markedDone = (t) => ({ ...t, done: true });    // ✅ returns a new one`,
        err: [1],
        hl: [2],
      },
      metrics: { objects: 1, surprise: 'yes' },
      scene: {
        nodes: {
          ...frame,
          todo: v(170, 'todo  →'),
          param: v(300, 'markDone(t): t  →', { state: 'active' }),
          o1: obj(700, 235, 'object #1', [['text', '"Buy milk"'], ['done', 'true', true]], { state: 'error', badge: { text: 'caller’s object changed', tone: 'danger' } }),
        },
        links: [ref('todo', 'o1'), ref('param', 'o1')],
        flows: [flow(['param', 'o1'], { kind: 'err', label: 't.done = true', every: 3.4 })],
      },
    },
    {
      short: 'React',
      beat: 'insight',
      title: 'Why React keeps asking for new objects',
      body: [
        'To update state, React wants a **new** array or object — so a quick `===` can tell something changed. `todos.map(...)` makes a new array, but every todo you didn’t change keeps its old reference.',
        'That’s cheap (no deep copying) and powerful: React and `memo` can see at a glance which items are the same object as last time and skip them.',
      ],
      code: {
        file: 'TodoList.jsx',
        lang: 'jsx',
        code: `setTodos((prev) =>
  prev.map((t) => (t.id === id ? { ...t, done: true } : t)), // only one new item
);`,
        hl: [2],
      },
      metrics: { objects: 5, surprise: 'no' },
      scene: {
        nodes: {
          ...frame,
          prev: v(170, 'prev todos  →'),
          next: v(380, 'next todos  →', { state: 'active' }),
          a1: obj(560, 170, 'array (old)', [['0', '→ milk'], ['1', '→ mern']], { w: 190 }),
          a2: obj(560, 390, 'array (new)', [['0', '→ milk', true], ['1', '→ mern*']], { w: 190, state: 'ok' }),
          milk: obj(845, 150, 'milk', [['done', 'false']], { w: 170 }),
          mern: obj(845, 300, 'mern', [['done', 'false']], { w: 170 }),
          mern2: obj(845, 450, 'mern*', [['done', 'true', true]], { w: 170, state: 'ok', badge: { text: 'new', tone: 'ok' } }),
        },
        links: [ref('prev', 'a1'), ref('next', 'a2'), ref('a1', 'milk', { style: 'dashed' }), ref('a1', 'mern', { style: 'dashed' }), ref('a2', 'milk', { style: 'dashed' }), ref('a2', 'mern2', { style: 'dashed' })],
      },
    },
    {
      short: 'Practice',
      beat: 'try',
      title: 'Practice: Update nested object immutably',
      body: [
        'React state updates require creating new object references whenever data changes.',
        'Implement `updateCity(user, newCity)` which returns a brand new user object with the updated city at `user.address.city`, without mutating the input object.',
      ],
      practice: practice(
        'Return a new user object with user.address.city updated to newCity. Do NOT mutate user or user.address directly!',
        `function updateCity(user, newCity) {\n  // Return a new object with updated address.city\n}`,
        `function updateCity(user, newCity) {\n  return {\n    ...user,\n    address: {\n      ...user.address,\n      city: newCity\n    }\n  };\n}`,
        [
          { label: 'returns updated city', run: '(() => { const u = { name: "Ada", address: { city: "London" } }; return updateCity(u, "Paris").address.city === "Paris"; })()' },
          { label: 'does not mutate original object', run: '(() => { const u = { name: "Ada", address: { city: "London" } }; updateCity(u, "Paris"); return u.address.city === "London"; })()' },
          { label: 'preserves other properties', run: '(() => { const u = { name: "Ada", age: 36, address: { city: "London", zip: "10001" } }; const res = updateCity(u, "Paris"); return res.age === 36 && res.address.zip === "10001"; })()' },
        ],
        [
          'Spread the outer user object: { ...user, address: ... }',
          'Spread the inner address object: { ...user.address, city: newCity }',
          'Make sure you return the resulting object.',
        ],
      ),
      metrics: { objects: 3, surprise: 'no' },
      scene: {
        nodes: {
          ...frame,
          todo: v(200, 'user  →'),
          copy: v(330, 'next  →'),
          o1: obj(700, 180, 'original user', [['name', '"Ada"'], ['city', '"London"']]),
          o2: obj(700, 380, 'updated copy', [['name', '"Ada"'], ['city', '"Paris"', true]], { state: 'ok' }),
        },
        links: [ref('todo', 'o1'), ref('copy', 'o2')],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Values and references',
      body: [
        '{client:Primitives} are copied. {data:Objects and arrays} live on the heap; variables, properties and function arguments hold **references** to them.',
        'Assigning or passing an object shares it. `===` compares references. Spread is a shallow copy; `structuredClone` is deep.',
        'Don’t mutate shared data — create new objects for what changed and keep the rest. That’s exactly how React expects state updates.',
      ],
      metrics: { objects: 2, surprise: 'no' },
      scene: {
        nodes: { ...frame, todo: v(200, 'todo  →'), copy: v(330, 'copy  →'), o1: obj(700, 180, 'object #1', [['done', 'false']]), o2: obj(700, 380, 'object #2', [['done', 'true', true]], { state: 'ok' }) },
        links: [ref('todo', 'o1'), ref('copy', 'o2')],
      },
    },
  ],
});
