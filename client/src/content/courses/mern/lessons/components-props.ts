import { box, browser, code, defineLesson, flow, link, patch } from '@/content/dsl';
import type { LinkSpec, NodeSpec, ScreenLine } from '@/engine/types';

/* ---------- layout: component tree as an outline on the left, the page on the right ---------- */
const screen = (done = false): ScreenLine[] => [
  { t: 'h', text: 'My todos' },
  { t: 'input', text: 'New todo…', placeholder: true },
  { t: 'btn', text: 'Add' },
  { t: 'item', text: 'Buy milk', done, flash: done },
  { t: 'item', text: 'Learn MERN' },
];
const page = browser(860, 300, { w: 240, h: 240, url: 'todo-app.com', screen: screen() });

const cmp = (x: number, y: number, label: string, sub?: string, w = 180): NodeSpec =>
  box(x, y, label, { sub, icon: 'component', tone: 'client', w });
const app = cmp(150, 80, 'App', undefined, 150);
const header = cmp(320, 160, 'Header', 'title');
const list = cmp(320, 245, 'TodoList', 'state: todos');
const add = cmp(500, 330, 'AddTodo', 'onAdd');
const i1 = cmp(500, 415, 'TodoItem', '"Buy milk"');
const i2 = cmp(500, 500, 'TodoItem', '"Learn MERN"');

const tree = { app, header, list, add, i1, i2, page };
const edge = (a: string, b: string): LinkSpec => link(a, b, { route: 'vh', arrow: false });
const treeLinks = [edge('app', 'header'), edge('app', 'list'), edge('list', 'add'), edge('list', 'i1'), edge('list', 'i2')];

const giant = code(330, 300, `function App() {
  return (
    <div>
      <header><h1>My todos</h1> …</header>
      <form> … 40 lines … </form>
      <ul>
        <li><input type="checkbox" /> Buy milk …</li>
        <li><input type="checkbox" /> Learn MERN …</li>
        <li><input type="checkbox" /> Call mom …</li>
      </ul>
      … 260 more lines …
    </div>
  );
}`, { file: 'App.jsx — 312 lines', w: 440, lang: 'jsx', tone: 'client', state: 'error', hl: [7, 8, 9] });

export default defineLesson({
  metrics: [
    { id: 'biggest', label: 'Biggest component', unit: 'lines', better: 'lower' },
    { id: 'comps', label: 'Components' },
  ],
  legend: { data: 'props (down)', event: 'events (up)' },
  goals: [
    { text: 'Why one giant component hurts', step: 1 },
    { text: 'Props are just function arguments', step: 3 },
    { text: 'Why props are read-only', step: 4 },
    { text: 'Sending events up with callbacks', step: 5 },
    { text: 'Wrapping content with children', step: 6 },
    { text: 'Spotting prop drilling', step: 7 },
  ],
  steps: [
    {
      short: 'One giant file',
      beat: 'problem',
      title: 'One component that does everything',
      body: [
        'Our whole app lives in `App`: the header, the form, the list, every item. It’s 312 lines of [[jsx|JSX]], the same `<li>` markup is copy-pasted for each todo, and changing one part means scrolling through all the others.',
        'Two people can’t work on it at once, and nothing can be reused anywhere else.',
      ],
      metrics: { biggest: 312, comps: 1 },
      scene: { nodes: { giant, page }, links: [link('giant', 'page', { style: 'dashed', label: 'renders' })] },
    },
    {
      short: 'Split it',
      beat: 'solution',
      title: 'Split the screen into components',
      body: [
        'A [[component]] is a function that returns a piece of UI. Draw boxes around the parts of the screen — header, form, list, item — and give each its own small function.',
        'Components nest inside each other exactly like the boxes do, forming a tree. Each one is short, named after what it shows, and easy to find.',
      ],
      code: {
        file: 'App.jsx',
        lang: 'jsx',
        code: `function App() {
  return (
    <>
      <Header title="My todos" />
      <TodoList />
    </>
  );
}`,
        hl: [4, 5],
      },
      changes: ['- One 312-line App', '+ Five small components in a tree'],
      metrics: { biggest: 40, comps: 5 },
      scene: { nodes: tree, links: treeLinks },
    },
    {
      short: 'Props',
      beat: 'technique',
      title: 'Props are a component’s arguments',
      body: [
        'Parents configure children with [[props]], written like HTML attributes. The child receives them as one object — usually destructured right in the parameter list.',
        'That’s what makes components reusable: `TodoItem` is written once and rendered for every todo, each time with a different `todo` prop.',
      ],
      code: {
        file: 'TodoItem.jsx',
        lang: 'jsx',
        code: `// a component is a function; props are its arguments
function TodoItem({ todo }) {
  return <li>{todo.text}</li>;
}

<TodoItem todo={{ text: 'Buy milk' }} />    // same component…
<TodoItem todo={{ text: 'Learn MERN' }} />  // …different props`,
        hl: [2, 6, 7],
      },
      metrics: { biggest: 40, comps: 5 },
      scene: {
        nodes: patch(tree, { i1: { state: 'active' }, i2: { state: 'active' } }),
        links: treeLinks,
        flows: [
          flow(['app', 'header'], { kind: 'data', label: 'title', every: 3.4 }),
          flow(['list', 'i1'], { kind: 'data', label: '{ todo }', every: 3.4, offset: 0.4 }),
          flow(['list', 'i2'], { kind: 'data', label: '{ todo }', every: 3.4, offset: 0.8 }),
        ],
      },
    },
    {
      short: 'Read-only',
      beat: 'technique',
      title: 'Data flows down, and props are read-only',
      body: [
        'React has [[one-way-data|one-way data flow]]: data lives in one owner (here, `TodoList`’s state) and flows **down** as props. A child must never change its props — they belong to the parent.',
        'If `TodoItem` flipped `todo.done` itself, the parent’s state wouldn’t know, React wouldn’t re-render, and the screen would silently disagree with the data.',
      ],
      check: {
        q: '`TodoItem` wants to mark its todo as done. What should it do?',
        options: ['Set `props.todo.done = true`', 'Call a function the parent passed in, like `onToggle(todo.id)`', 'Keep a copy of the todo in its own state', 'Edit the DOM directly'],
        answer: 1,
        explain: 'Only the owner of the data should change it. The parent passes a callback; the child calls it; the parent updates its state; React re-renders the child with new props.',
      },
      metrics: { biggest: 40, comps: 5 },
      scene: {
        nodes: patch(tree, { i1: { state: 'error', badge: { text: 'props.todo.done = true ✗', tone: 'danger' } }, list: { state: 'active' } }),
        links: treeLinks,
        flows: [
          flow(['list', 'i1'], { kind: 'data', label: 'todo', every: 3.4 }),
          flow(['list', 'i2'], { kind: 'data', label: 'todo', every: 3.4, offset: 0.4 }),
        ],
      },
    },
    {
      short: 'Callbacks',
      beat: 'technique',
      title: 'Events travel up through callbacks',
      body: [
        'To change data, a child calls a **function prop** its parent gave it. Clicking an item calls `onToggle(todo.id)`; `TodoList` updates its state; React re-renders and the new `todo` flows back down.',
        'Data down, events up. Every React app is this loop, repeated at different levels of the tree.',
      ],
      code: {
        file: 'TodoList.jsx',
        lang: 'jsx',
        code: `function TodoList() {
  const [todos, setTodos] = useState(initial);
  const toggle = (id) =>
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  return todos.map((t) => <TodoItem key={t.id} todo={t} onToggle={toggle} />);
}

function TodoItem({ todo, onToggle }) {
  return <li onClick={() => onToggle(todo.id)}>{todo.text}</li>;
}`,
        hl: [3, 4, 9],
      },
      metrics: { biggest: 40, comps: 5 },
      scene: {
        nodes: patch(tree, { page: { screen: screen(true) }, list: { state: 'active', badge: { text: 'setTodos', tone: 'client' } } }),
        links: [...treeLinks, link('page', 'i1', { style: 'dashed' })],
        flows: [
          flow(['page', 'i1', 'list'], { kind: 'event', label: ['click', 'onToggle(id)'], every: 5 }),
          flow(['list', 'i1'], { kind: 'data', label: '{ done: true }', every: 5, offset: 2.3 }),
        ],
      },
    },
    {
      short: 'children',
      beat: 'technique',
      title: 'children: components that wrap other components',
      body: [
        'Some components are frames: a card, a modal, a page layout. They don’t care what goes inside. Whatever you put between their tags arrives as a special prop, [[children]].',
        '`Card` draws the border and title; `TodoList` goes inside without `Card` knowing anything about todos. This is **composition**, and it keeps components small and generic.',
      ],
      code: {
        file: 'Card.jsx',
        lang: 'jsx',
        code: `function Card({ title, children }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

<Card title="Today">
  <TodoList />   {/* arrives as props.children */}
</Card>`,
        hl: [1, 5, 11],
      },
      metrics: { biggest: 40, comps: 6 },
      scene: {
        nodes: {
          app: { ...app, y: 70 },
          header: { ...header, y: 145, w: 170 },
          card: cmp(320, 225, 'Card', '{children}', 170),
          list: { ...list, x: 490, y: 305, w: 170 },
          add: { ...add, x: 650, y: 385, w: 170 },
          i1: { ...i1, x: 650, y: 465, w: 170 },
          i2: { ...i2, x: 650, y: 545, w: 170 },
          page,
        },
        links: [edge('app', 'header'), edge('app', 'card'), edge('card', 'list'), edge('list', 'add'), edge('list', 'i1'), edge('list', 'i2')],
        flows: [flow(['card', 'list'], { kind: 'data', label: 'children', every: 3.4 })],
      },
    },
    {
      short: 'Drilling',
      beat: 'problem',
      title: 'Prop drilling: passing data through bystanders',
      body: [
        '`Avatar`, deep in the tree, needs the logged-in `user`. Only `App` has it. So `user` gets passed to `Layout`, which passes it to `TodoList`, which passes it to `TodoItem`, which finally gives it to `Avatar`.',
        'Three components handle a prop they never use. That’s [[prop-drilling|prop drilling]]: tedious, and every refactor touches all of them. Composition (passing `<Avatar />` as children) often fixes it; for truly app-wide data, React has **Context**.',
      ],
      metrics: { biggest: 40, comps: 5 },
      scene: {
        nodes: {
          app: { ...app, x: 130, y: 80, badge: { text: 'has user', tone: 'client' } },
          layout: { ...cmp(290, 170, 'Layout', 'props: user', 170), badge: { text: 'doesn’t use it', tone: 'warn' } },
          list: { ...list, x: 450, y: 260, w: 170, sub: 'props: user', badge: { text: 'doesn’t use it', tone: 'warn' } },
          i1: { ...i1, x: 610, y: 350, w: 170, sub: 'props: user', badge: { text: 'doesn’t use it', tone: 'warn' } },
          avatar: { ...cmp(770, 440, 'Avatar', 'uses user', 170), state: 'ok' },
        },
        links: [edge('app', 'layout'), edge('layout', 'list'), edge('list', 'i1'), edge('i1', 'avatar')],
        flows: [flow(['app', 'layout', 'list', 'i1', 'avatar'], { kind: 'data', label: 'user', every: 5, dwell: 0.35 })],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Thinking in components',
      body: [
        'A {client:component} is a function from props to UI. Split the screen into small, named pieces that nest into a tree.',
        '{client:Props} flow down and are read-only. Events flow up through callback props. The owner of the data is the only one who changes it.',
        '`children` lets a component wrap anything. When a prop passes through many components untouched, reach for composition or Context.',
      ],
      metrics: { biggest: 40, comps: 5 },
      scene: {
        nodes: patch(tree, { page: { screen: screen(true) } }),
        links: [...treeLinks, link('page', 'i1', { style: 'dashed' })],
        flows: [
          flow(['list', 'i1'], { kind: 'data', label: 'props', every: 4.4 }),
          flow(['page', 'i1', 'list'], { kind: 'event', label: ['click', 'onToggle'], every: 4.4, offset: 2 }),
        ],
      },
    },
  ],
});
