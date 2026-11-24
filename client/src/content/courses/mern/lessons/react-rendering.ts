import { box, browser, defineLesson, flow, link, patch, practice, zone } from '@/content/dsl';
import type { LinkSpec, ScreenLine } from '@/engine/types';

/* ---------- layout: the component tree as an outline, the real page on the right ---------- */
const two: ScreenLine[] = [
  { t: 'h', text: 'My todos' },
  { t: 'input', text: 'Call mom' },
  { t: 'btn', text: 'Add' },
  { t: 'item', text: 'Buy milk' },
  { t: 'item', text: 'Learn MERN' },
];
const three = (flash = false): ScreenLine[] => [
  { t: 'h', text: 'My todos' },
  { t: 'input', text: 'New todo…', placeholder: true },
  { t: 'btn', text: 'Add' },
  { t: 'item', text: 'Buy milk' },
  { t: 'item', text: 'Learn MERN' },
  { t: 'item', text: 'Call mom', flash },
];

const tree = zone(345, 310, 520, 580, 'Component tree', { tone: 'client', icon: 'component', sub: 'virtual' });
const dom = zone(830, 300, 330, 330, 'Real DOM', { tone: 'client', icon: 'browser', sub: 'what you see' });
const app = box(150, 92, 'App', { icon: 'component', tone: 'client', w: 150 });
const header = box(330, 168, 'Header', { icon: 'component', tone: 'client', w: 170 });
const list = box(330, 244, 'TodoList', { sub: 'state: todos', icon: 'component', tone: 'client', w: 190 });
const add = box(520, 320, 'AddTodo', { sub: '<form>', icon: 'component', tone: 'client', w: 180 });
const i1 = box(520, 396, 'TodoItem', { sub: '"Buy milk"', icon: 'component', tone: 'client', w: 180 });
const i2 = box(520, 472, 'TodoItem', { sub: '"Learn MERN"', icon: 'component', tone: 'client', w: 180 });
const i3 = box(520, 548, 'TodoItem', { sub: '"Call mom"', icon: 'component', tone: 'client', w: 180 });
const page = browser(830, 310, { w: 270, h: 240, url: 'localhost:5173', screen: two });

const base = { tree, dom, app, header, list, add, i1, i2, page };
const withNew = { ...base, i3 };
const treeLinks: LinkSpec[] = [
  link('app', 'header', { route: 'vh', arrow: false }),
  link('app', 'list', { route: 'vh', arrow: false }),
  link('list', 'add', { route: 'vh', arrow: false }),
  link('list', 'i1', { route: 'vh', arrow: false }),
  link('list', 'i2', { route: 'vh', arrow: false }),
];
const treeLinks3 = [...treeLinks, link('list', 'i3', { route: 'vh', arrow: false })];
const eventLink = link('page', 'add', { style: 'dashed' });
const commitLink = link('list', 'page', { style: 'dashed', label: 'commit' });

const listCode = `function TodoList() {
  const [todos, setTodos] = useState(initialTodos);

  function add(text) {
    setTodos([...todos, { id: crypto.randomUUID(), text }]);
  }

  return (
    <section>
      <AddTodo onAdd={add} />
      {todos.map((t) => <TodoItem key={t.id} todo={t} />)}
    </section>
  );
}`;

const rendered = { state: 'busy', badge: { text: 'rendered', tone: 'client' } } as const;

export default defineLesson({
  metrics: [
    { id: 'renders', label: 'Components rendered' },
    { id: 'dom', label: 'DOM changes', better: 'lower' },
  ],
  legend: { event: 'event / setState', data: 'props / DOM update' },
  goals: [
    { text: 'Components form a tree; props flow down', step: 2 },
    { text: 'Why changing a variable doesn’t update the screen', step: 4 },
    { text: 'Render → reconcile → commit', step: 6 },
    { text: 'Why mutating state breaks updates', step: 9 },
    { text: 'Where to put state', step: 10 },
  ],
  steps: [
    {
      short: 'The tree',
      beat: 'setup',
      title: 'A UI is a tree of components',
      body: [
        'React apps are built from [[component|components]] — functions that return a piece of UI — nested inside each other like the HTML they produce.',
        '`App` renders a `Header` and a `TodoList`; the list renders an `AddTodo` form and one `TodoItem` per todo. On the right is what ends up in the browser’s [[dom|DOM]].',
      ],
      code: { file: 'TodoList.jsx', lang: 'jsx', code: listCode, hl: [10, 11] },
      metrics: { renders: 0, dom: 0 },
      scene: { nodes: base, links: treeLinks },
    },
    {
      short: 'Props',
      beat: 'technique',
      title: 'Props flow down the tree',
      body: [
        'Parents hand data to their children as [[props]] — exactly like passing arguments to a function. `TodoList` gives each `TodoItem` its `todo`, and gives `AddTodo` an `onAdd` function to call later.',
        'Data flows **down**. A child can’t reach up and change its parent’s data; it can only call a function the parent handed it.',
      ],
      code: { file: 'TodoList.jsx', lang: 'jsx', code: listCode, hl: [10, 11] },
      metrics: { renders: 0, dom: 0 },
      scene: {
        nodes: base,
        links: treeLinks,
        flows: [
          flow(['list', 'add'], { kind: 'data', label: 'onAdd', every: 3 }),
          flow(['list', 'i1'], { kind: 'data', label: 'todo', every: 3, offset: 0.25 }),
          flow(['list', 'i2'], { kind: 'data', label: 'todo', every: 3, offset: 0.5 }),
        ],
      },
    },
    {
      short: 'State',
      beat: 'technique',
      title: 'State is a component’s memory',
      body: [
        '`TodoList` owns the list in [[state]] with `useState`. Unlike a normal variable, state survives between calls to the component — React keeps it for you.',
        '`useState` gives back two things: the current value and a **setter** function. The setter is the only proper way to change it.',
      ],
      code: { file: 'TodoList.jsx', lang: 'jsx', code: listCode, hl: [2] },
      metrics: { renders: 0, dom: 0 },
      scene: {
        nodes: patch(base, { list: { state: 'active', badge: { text: 'todos: 2 items', tone: 'client' } } }),
        links: treeLinks,
      },
    },
    {
      short: 'Plain variable',
      beat: 'problem',
      title: 'Changing a variable doesn’t change the screen',
      body: [
        'Try it without state: keep the todos in a plain variable and `push` the new one. The array really does grow — `console.log` says 3 — but the page still shows two items.',
        'React has no idea anything happened. It only re-runs a component when you *tell* it the data changed.',
      ],
      code: {
        file: 'TodoList.jsx',
        lang: 'jsx',
        code: `function TodoList() {
  let todos = initialTodos;

  function add(text) {
    todos.push({ id: crypto.randomUUID(), text }); // the array changes…
    console.log(todos.length);                     // 3
  }                                                // …the screen doesn’t
  …
}`,
        err: [5],
      },
      metrics: { renders: 0, dom: 0 },
      scene: {
        nodes: patch(base, { list: { sub: 'let todos', state: 'error', badge: { text: 'no re-render', tone: 'danger' } }, page: { screen: two } }),
        links: [...treeLinks, eventLink],
        flows: [flow(['page', 'add', 'list'], { kind: 'event', label: ['click Add', 'todos.push()'], fail: true, every: 3.6 })],
      },
    },
    {
      short: 'setState',
      beat: 'solution',
      title: 'Calling the setter asks React to re-render',
      body: [
        'With state, clicking **Add** calls `onAdd`, which calls `setTodos` with a **new** array. That’s the signal: “this component’s data changed.”',
        'React doesn’t redraw instantly. It schedules a re-render of `TodoList` — the component that owns the state.',
      ],
      code: { file: 'TodoList.jsx', lang: 'jsx', code: listCode, hl: [4, 5, 6] },
      metrics: { renders: 0, dom: 0 },
      scene: {
        nodes: patch(base, { list: { state: 'active', badge: { text: 'update scheduled', tone: 'warn' } } }),
        links: [...treeLinks, eventLink],
        flows: [flow(['page', 'add', 'list'], { kind: 'event', label: ['click Add', 'setTodos(…)'], every: 3.6 })],
      },
    },
    {
      short: 'Render',
      beat: 'technique',
      title: 'Render: React calls your components again',
      body: [
        'To [[render]] a component is simply to **call your function again** with the new state. It returns a fresh description of the UI — now with three items.',
        'By default React also re-renders **every child** of the component that changed: `AddTodo` and all the `TodoItem`s. `App` and `Header` sit outside that branch, so they don’t run.',
      ],
      callout: { kind: 'insight', text: 'Rendering doesn’t touch the screen. It only produces a new description of what the screen should be.' },
      metrics: { renders: 5, dom: 0 },
      scene: {
        nodes: patch(withNew, {
          list: { ...rendered, badge: { text: 'todos: 3 items', tone: 'client' } },
          add: rendered,
          i1: rendered,
          i2: rendered,
          i3: { ...rendered, badge: { text: 'new', tone: 'ok' } },
          app: { state: 'dim' },
          header: { state: 'dim' },
        }),
        links: treeLinks3,
      },
    },
    {
      short: 'Reconcile',
      beat: 'technique',
      title: 'Reconcile: compare the new tree with the old one',
      body: [
        'Now React has two descriptions: the one from last time and the new one. It compares them, element by element — this is [[reconciliation]].',
        'Thanks to each item’s `key`, React can tell that *Buy milk* and *Learn MERN* are the same items as before, and that *Call mom* is new. Everything else is unchanged.',
      ],
      callout: { kind: 'tip', text: 'This is why list items need a stable `key` (like an id): it’s how React matches old items to new ones.' },
      metrics: { renders: 5, dom: 0 },
      scene: {
        nodes: patch(withNew, {
          add: { badge: { text: 'same', tone: 'neutral' } },
          i1: { badge: { text: 'same', tone: 'neutral' } },
          i2: { badge: { text: 'same', tone: 'neutral' } },
          i3: { state: 'ok', badge: { text: 'new', tone: 'ok' } },
          list: { state: 'active' },
          app: { state: 'dim' },
          header: { state: 'dim' },
        }),
        links: treeLinks3,
      },
    },
    {
      short: 'Commit',
      beat: 'technique',
      title: 'Commit: touch only what changed',
      body: [
        'Finally, in the [[commit]] phase, React applies just the differences to the real DOM: **one** new `<li>`. The other elements are left exactly as they were — no flicker, focus and scroll untouched.',
        'Trigger → render → reconcile → commit. That’s every update in React.',
      ],
      metrics: { renders: 5, dom: 1 },
      scene: {
        nodes: patch(withNew, {
          i3: { state: 'ok' },
          page: { screen: three(true), state: 'active' },
          app: { state: 'dim' },
          header: { state: 'dim' },
        }),
        links: [...treeLinks3, commitLink],
        flows: [flow(['list', 'page'], { kind: 'data', label: '+1 <li>', every: 3.2 })],
      },
    },
    {
      short: 'Mutation',
      beat: 'problem',
      title: 'Mutate the array, and React sees no change',
      body: [
        'A very common bug: push into the existing array, then pass that **same** array to the setter.',
        'React decides whether state changed by comparing the old and new value with `Object.is` — for arrays and objects, *is it the same reference?* Same array, so React concludes nothing changed and skips the render.',
      ],
      check: {
        q: 'You call `todos.push(newTodo)` and then `setTodos(todos)`. What happens?',
        options: ['It re-renders with 3 items', 'Nothing re-renders', 'React throws an error', 'It renders twice'],
        answer: 1,
        explain: 'It’s the same array object, so `Object.is(old, new)` is true and React bails out. Always create a new one: `setTodos([...todos, newTodo])`.',
      },
      code: {
        file: 'TodoList.jsx',
        lang: 'jsx',
        code: `function add(text) {
  todos.push({ id: crypto.randomUUID(), text }); // ❌ same array, mutated
  setTodos(todos);                               // React: "no change"

  // ✅ new array → new reference → re-render
  // setTodos([...todos, { id: crypto.randomUUID(), text }]);
}`,
        err: [2, 3],
        hl: [6],
      },
      metrics: { renders: 0, dom: 0 },
      scene: {
        nodes: patch(base, { list: { state: 'error', badge: { text: 'same array → skipped', tone: 'danger' } } }),
        links: [...treeLinks, eventLink],
        flows: [flow(['page', 'add', 'list'], { kind: 'event', label: ['click Add', 'setTodos(todos)'], fail: true, every: 3.6 })],
      },
    },
    {
      short: 'Where state lives',
      beat: 'tradeoff',
      title: 'Where state lives decides what re-renders',
      body: [
        'Move `todos` up into `App` and every change re-renders **everything** under App — including `Header`, which never uses todos.',
        'Keep state as low as you can: in the closest common parent of the components that need it. Usually a few extra renders are cheap; when they aren’t, `React.memo` lets a child skip renders whose props didn’t change.',
      ],
      metrics: { renders: 7, dom: 1 },
      scene: {
        nodes: patch(withNew, {
          app: { ...rendered, w: 196, sub: 'state: todos', badge: { text: 'state moved here', tone: 'warn' } },
          header: { state: 'busy', badge: { text: 'rendered for nothing', tone: 'danger' } },
          list: { ...rendered, sub: 'props: todos' },
          add: rendered,
          i1: rendered,
          i2: rendered,
          i3: rendered,
          page: { screen: three() },
        }),
        links: [...treeLinks3, link('app', 'page', { route: 'hv', style: 'dashed', label: 'commit' })],
        flows: [flow(['app', 'page'], { kind: 'data', label: '+1 <li>', every: 3.2 })],
      },
    },
    {
      short: 'Practice',
      beat: 'try',
      title: 'Practice: Pure state updates for lists',
      body: [
        'React state requires pure functions without mutating existing state arrays or objects.',
        'Implement `toggleTodo(todos, id)` that returns a new array where the item with matching `id` has its `done` boolean inverted.',
      ],
      practice: practice(
        'Return a new array of todos with the item matching id toggled. Do NOT mutate the original array or item!',
        `function toggleTodo(todos, id) {\n  // Return a new array with the target todo toggled\n}`,
        `function toggleTodo(todos, id) {\n  return todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));\n}`,
        [
          { label: 'inverts done status for matching item', run: '(() => { const list = [{ id: 1, done: false }, { id: 2, done: true }]; const res = toggleTodo(list, 1); return res[0].done === true && res[1].done === true; })()' },
          { label: 'does not mutate original array or item', run: '(() => { const item = { id: 1, done: false }; const list = [item]; toggleTodo(list, 1); return list[0].done === false && item.done === false; })()' },
          { label: 'leaves non-matching items identical by reference', run: '(() => { const item2 = { id: 2, done: false }; const list = [{ id: 1, done: false }, item2]; const res = toggleTodo(list, 1); return res[1] === item2; })()' },
        ],
        [
          'Use todos.map(...) to generate a new array.',
          'For items where item.id === id, return a new object: { ...item, done: !item.done }',
          'For non-matching items, return the item as-is.',
        ],
      ),
      metrics: { renders: 1, dom: 1 },
      scene: {
        nodes: patch(withNew, { list: { state: 'active' }, page: { screen: three() } }),
        links: [...treeLinks3, commitLink],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'How a React update works',
      body: [
        '**Trigger** — something calls a state setter with a new value.',
        '**Render** — React calls that component and its children again to get a new UI description.',
        '**Reconcile** — it compares the new description with the old one (keys help match list items).',
        '**Commit** — it changes only those parts of the real DOM.',
        'Never mutate state; always pass a new object or array. Keep state as close as possible to where it’s used.',
      ],
      metrics: { renders: 5, dom: 1 },
      scene: {
        nodes: patch(withNew, { list: { state: 'active' }, page: { screen: three() } }),
        links: [...treeLinks3, eventLink, commitLink],
        flows: [
          flow(['page', 'add', 'list'], { kind: 'event', label: ['click', 'setTodos'], every: 5 }),
          flow(['list', 'page'], { kind: 'data', label: 'commit', every: 5, offset: 2.2 }),
        ],
      },
    },
  ],
});
