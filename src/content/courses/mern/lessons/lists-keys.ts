import { box, browser, chip, defineLesson, flow, link, zone } from '@/content/dsl';
import type { Badge, LinkSpec, NodeSpec } from '@/engine/types';

/* ---------- layout: the previous render on the left, the next one on the right; lines = React's matches ---------- */
const ROW = [170, 255, 340, 425];
const prevZone = zone(240, 300, 320, 470, 'Previous render', { tone: 'client', icon: 'clock' });
const nextZone = zone(760, 300, 320, 470, 'Next render', { tone: 'client', icon: 'component' });
/** React sits level with the item it creates, so the create line is short and crosses nothing. */
const reactAt = (row: number) => chip(500, ROW[row], 'React', { tone: 'client', icon: 'react', w: 96 });

const CHECKED: Badge = { text: '☑ checked', tone: 'ok' };
const li = (x: number, row: number, text: string, sub: string, o: Partial<NodeSpec> = {}): NodeSpec =>
  ({ ...box(x, ROW[row], text, { sub, tone: 'client', w: 250 }), ...o }) as NodeSpec;
const P = (row: number, text: string, sub: string, o: Partial<NodeSpec> = {}) => li(240, row, text, sub, o);
const N = (row: number, text: string, sub: string, o: Partial<NodeSpec> = {}) => li(760, row, text, sub, o);

const reuse = (a: string, b: string, ok = true): LinkSpec => link(a, b, { tone: ok ? 'ok' : 'danger', state: ok ? 'idle' : 'error', label: ok ? 'reuse' : 'reuse ✗' });
const create = (b: string): LinkSpec => link('react', b, { style: 'dashed', tone: 'ok', label: 'create' });
const moveFlow = (a: string, b: string, kind: 'res' | 'err' = 'res', offset = 0) => flow([a, b], { kind, label: kind === 'res' ? 'same item' : 'wrong item', every: 4.4, offset });
const createFlow = (b: string, offset = 0) => flow(['react', b], { kind: 'data', label: 'new <li>', every: 4.4, offset });

const frame = (createRow: number) => ({ prevZone, nextZone, react: reactAt(createRow) });

export default defineLesson({
  metrics: [
    { id: 'created', label: 'Items created', better: 'lower' },
    { id: 'rewritten', label: 'Items rewritten', better: 'lower' },
    { id: 'wrong', label: 'Checkbox on wrong item' },
  ],
  legend: { res: 'item kept', data: 'item created', err: 'mismatched' },
  goals: [
    { text: 'How React matches items without keys', step: 2 },
    { text: 'What goes wrong when you insert at the top', step: 3 },
    { text: 'How keys fix it', step: 4 },
    { text: 'Why the index is a bad key', step: 5 },
    { text: 'Using keys to reset a component', step: 7 },
  ],
  steps: [
    {
      short: 'map()',
      beat: 'setup',
      title: 'Rendering a list with map()',
      body: [
        'A list in React is an array turned into elements with `map()`. Here each todo becomes an `<li>` with a checkbox — and you’ve ticked *Buy milk*.',
        'React prints a warning in the console about a missing **key**. It’s tempting to ignore. Let’s see what it’s about.',
      ],
      callout: { kind: 'warn', text: 'Console: Each child in a list should have a unique “key” prop.' },
      code: {
        file: 'TodoList.jsx',
        lang: 'jsx',
        code: `<ul>
  {todos.map((t) => (
    <li>
      <input type="checkbox" /> {t.text}
    </li>
  ))}
</ul>`,
        hl: [2, 3],
      },
      metrics: { created: 2, rewritten: 0, wrong: 'no' },
      scene: {
        nodes: {
          page: browser(500, 300, {
            w: 300,
            h: 200,
            url: 'todo-app.com',
            screen: [{ t: 'h', text: 'My todos' }, { t: 'item', text: 'Buy milk', done: true }, { t: 'item', text: 'Learn MERN' }],
          }),
        },
      },
    },
    {
      short: 'By position',
      beat: 'technique',
      title: 'Without keys, React matches items by position',
      body: [
        'After every render, React compares the new list with the old one to decide what to keep. Without keys, all it has is **position**: first old item ↔ first new item, second ↔ second.',
        'Add *Call mom* at the **end** and that works fine: the first two line up, one new `<li>` is created, and your tick stays on *Buy milk*.',
      ],
      metrics: { created: 1, rewritten: 0, wrong: 'no' },
      scene: {
        nodes: {
          ...frame(2),
          p1: P(0, 'Buy milk', 'position 0', { badge: CHECKED }),
          p2: P(1, 'Learn MERN', 'position 1'),
          n1: N(0, 'Buy milk', 'position 0', { badge: CHECKED }),
          n2: N(1, 'Learn MERN', 'position 1'),
          n3: N(2, 'Call mom', 'position 2', { state: 'ok', badge: { text: 'new', tone: 'ok' } }),
        },
        links: [reuse('p1', 'n1'), reuse('p2', 'n2'), create('n3')],
        flows: [moveFlow('p1', 'n1'), moveFlow('p2', 'n2', 'res', 0.3), createFlow('n3', 0.6)],
      },
    },
    {
      short: 'Insert at top',
      beat: 'problem',
      title: 'Insert at the top, and everything shifts',
      body: [
        'Now add *Call mom* at the **top**. Matching by position, React pairs old *Buy milk* with new *Call mom*, and old *Learn MERN* with new *Buy milk*. It rewrites the text of every row and creates a new last one.',
        'Worse, the checkbox is real DOM state attached to the first `<li>` — which now says *Call mom*. Your tick has jumped to the wrong todo.',
      ],
      metrics: { created: 1, rewritten: 2, wrong: 'yes' },
      scene: {
        nodes: {
          ...frame(2),
          p1: P(0, 'Buy milk', 'position 0', { badge: CHECKED }),
          p2: P(1, 'Learn MERN', 'position 1'),
          n1: N(0, 'Call mom', 'position 0', { state: 'error', badge: { text: '☑ checked ✗', tone: 'danger' } }),
          n2: N(1, 'Buy milk', 'position 1', { state: 'error', badge: { text: 'tick lost', tone: 'danger' } }),
          n3: N(2, 'Learn MERN', 'position 2', { state: 'ok', badge: { text: 'new', tone: 'ok' } }),
        },
        links: [reuse('p1', 'n1', false), reuse('p2', 'n2', false), create('n3')],
        flows: [moveFlow('p1', 'n1', 'err'), moveFlow('p2', 'n2', 'err', 0.3), createFlow('n3', 0.6)],
      },
    },
    {
      short: 'Keys',
      beat: 'solution',
      title: 'A key gives each item an identity',
      body: [
        'Give every item a [[list-key|key]] that belongs to the *data*, like its id. Now React matches by key, not position: `t1` is *Buy milk* wherever it appears in the list.',
        'React sees one new item (`t3`), creates one `<li>` and moves the other two. No text rewritten, and the tick stays on *Buy milk*.',
      ],
      code: {
        file: 'TodoList.jsx',
        lang: 'jsx',
        code: `{todos.map((t) => (
  <li key={t._id}>
    <input type="checkbox" /> {t.text}
  </li>
))}`,
        hl: [2],
      },
      changes: ['+ key={t._id} on each <li>', '~ Matching by identity instead of position'],
      metrics: { created: 1, rewritten: 0, wrong: 'no' },
      scene: {
        nodes: {
          ...frame(0),
          p1: P(0, 'Buy milk', 'key="t1"', { badge: CHECKED }),
          p2: P(1, 'Learn MERN', 'key="t2"'),
          n1: N(0, 'Call mom', 'key="t3"', { state: 'ok', badge: { text: 'new', tone: 'ok' } }),
          n2: N(1, 'Buy milk', 'key="t1"', { badge: CHECKED }),
          n3: N(2, 'Learn MERN', 'key="t2"'),
        },
        links: [reuse('p1', 'n2'), reuse('p2', 'n3'), create('n1')],
        flows: [moveFlow('p1', 'n2'), moveFlow('p2', 'n3', 'res', 0.3), createFlow('n1', 0.6)],
      },
    },
    {
      short: 'Index keys',
      beat: 'problem',
      title: 'The index is not an identity',
      body: [
        'A common shortcut silences the warning: `key={index}`. But the index *is* the position — so this is exactly the broken matching from before, just without the warning.',
        'Index keys are only safe when the list never reorders, never filters, and never inserts anywhere but the end.',
      ],
      check: {
        q: 'Using `key={index}`, you insert a todo at the top of a list where the first item is ticked. Where does the tick end up?',
        options: ['On the same todo as before', 'On the new first item', 'It disappears from every item', 'React throws an error'],
        answer: 1,
        explain: 'Index 0 is still index 0, so React keeps the first `<li>` (and its checked box) and just changes its text to the new todo.',
      },
      code: { file: 'TodoList.jsx', lang: 'jsx', code: `{todos.map((t, index) => (\n  <li key={index}>  {/* ❌ position, not identity */}\n    <input type="checkbox" /> {t.text}\n  </li>\n))}`, err: [2] },
      metrics: { created: 1, rewritten: 2, wrong: 'yes' },
      scene: {
        nodes: {
          ...frame(2),
          p1: P(0, 'Buy milk', 'key=0', { badge: CHECKED }),
          p2: P(1, 'Learn MERN', 'key=1'),
          n1: N(0, 'Call mom', 'key=0', { state: 'error', badge: { text: '☑ checked ✗', tone: 'danger' } }),
          n2: N(1, 'Buy milk', 'key=1', { state: 'error' }),
          n3: N(2, 'Learn MERN', 'key=2', { state: 'ok', badge: { text: 'new', tone: 'ok' } }),
        },
        links: [reuse('p1', 'n1', false), reuse('p2', 'n2', false), create('n3')],
        flows: [moveFlow('p1', 'n1', 'err'), moveFlow('p2', 'n2', 'err', 0.3), createFlow('n3', 0.6)],
      },
    },
    {
      short: 'Good keys',
      beat: 'technique',
      title: 'Where good keys come from',
      body: [
        'Use the id your data already has — MongoDB’s `_id` is perfect. For items created in the browser before they’re saved, generate one once with `crypto.randomUUID()` and store it on the item.',
        'Never generate keys *during* render, e.g. `key={Math.random()}`. Every render gets brand-new keys, so React throws away and recreates every item — losing focus, input text and ticks each time.',
      ],
      code: {
        file: 'keys.jsx',
        lang: 'jsx',
        code: `<li key={todo._id}>                 // ✅ id from the database
const draft = { id: crypto.randomUUID(), text }; // ✅ made once, stored

<li key={Math.random()}>             // ❌ new key every render`,
        hl: [1, 2],
        err: [4],
      },
      metrics: { created: 3, rewritten: 0, wrong: 'tick lost' },
      scene: {
        nodes: {
          ...frame(1),
          p1: P(0, 'Buy milk', 'key=0.4182…', { state: 'ghost', badge: { text: 'destroyed', tone: 'danger' } }),
          p2: P(1, 'Learn MERN', 'key=0.9031…', { state: 'ghost', badge: { text: 'destroyed', tone: 'danger' } }),
          n1: N(0, 'Buy milk', 'key=0.1577…', { state: 'ok', badge: { text: 'new', tone: 'ok' } }),
          n2: N(1, 'Learn MERN', 'key=0.6620…', { state: 'ok', badge: { text: 'new', tone: 'ok' } }),
          n3: N(2, 'Call mom', 'key=0.2846…', { state: 'ok', badge: { text: 'new', tone: 'ok' } }),
        },
        links: [create('n1'), create('n2'), create('n3')],
        flows: [createFlow('n1'), createFlow('n2', 0.3), createFlow('n3', 0.6)],
      },
    },
    {
      short: 'Reset trick',
      beat: 'insight',
      title: 'Changing a key resets a component on purpose',
      body: [
        'Keys work anywhere, not just in lists. A different key tells React “this is a different thing”: it removes the old component, with all its state, and mounts a fresh one.',
        'That’s handy for editors. Switch from editing *Buy milk* to *Learn MERN* and you want an empty draft, not the half-typed text from before. Keying the editor by todo id does exactly that.',
      ],
      code: {
        file: 'App.jsx',
        lang: 'jsx',
        code: `// a new todo id → a brand-new editor with fresh state
<TodoEditor key={selected._id} todo={selected} />`,
        hl: [2],
      },
      metrics: { created: 1, rewritten: 0, wrong: 'no' },
      scene: {
        nodes: {
          ...frame(1),
          p1: P(1, 'TodoEditor', 'key="t1" · draft "Buy mi"', { state: 'ghost', badge: { text: 'unmounted', tone: 'neutral' } }),
          n1: N(1, 'TodoEditor', 'key="t2" · draft ""', { state: 'ok', badge: { text: 'fresh state', tone: 'ok' } }),
        },
        links: [create('n1')],
        flows: [createFlow('n1')],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Keys, in three rules',
      body: [
        'React matches list items between renders by {client:key}. Without one, it matches by position.',
        'Use a {ok:stable id from your data} (`_id`), or one created once and stored. Avoid the index when the list can change order, and never use random keys.',
        'A new key means a new component — a handy way to reset state.',
      ],
      metrics: { created: 1, rewritten: 0, wrong: 'no' },
      scene: {
        nodes: {
          ...frame(0),
          p1: P(0, 'Buy milk', 'key="t1"', { badge: CHECKED }),
          p2: P(1, 'Learn MERN', 'key="t2"'),
          n1: N(0, 'Call mom', 'key="t3"', { state: 'ok', badge: { text: 'new', tone: 'ok' } }),
          n2: N(1, 'Buy milk', 'key="t1"', { badge: CHECKED }),
          n3: N(2, 'Learn MERN', 'key="t2"'),
        },
        links: [reuse('p1', 'n2'), reuse('p2', 'n3'), create('n1')],
        flows: [moveFlow('p1', 'n2'), moveFlow('p2', 'n3', 'res', 0.3), createFlow('n1', 0.6)],
      },
    },
  ],
});
