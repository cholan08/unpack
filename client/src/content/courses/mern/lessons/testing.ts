import { actor, box, chip, db, defineLesson, flow, link, patch } from '@/content/dsl';
import type { LinkSpec, NodeSpec } from '@/engine/types';

/* ---------- layout: the testing pyramid on the left, the app it tests on the right ---------- */
const tier = (y: number, w: number, label: string, sub: string, tone: NodeSpec['tone']) => box(260, y, label, { sub, icon: 'bug', tone, w });
const pyramid: Record<string, NodeSpec> = {
  e2e: tier(150, 190, 'End-to-end', 'few · slow', 'net'),
  integ: tier(300, 270, 'Integration', 'some · seconds', 'server'),
  unit: tier(450, 350, 'Unit', 'many · milliseconds', 'client'),
};
const app: Record<string, NodeSpec> = {
  ui: box(680, 150, 'React UI', { sub: 'components', icon: 'react', tone: 'client', w: 190 }),
  api: box(680, 300, 'Express API', { sub: 'routes', icon: 'express', tone: 'server', w: 190 }),
  mongo: db(680, 455, 'MongoDB', { sub: 'test DB', w: 140, h: 100 }),
  fn: chip(895, 300, 'dueLabel()', { tone: 'client', icon: 'code', w: 150 }),
};
const appLinks: LinkSpec[] = [link('ui', 'api', { arrow: false }), link('api', 'mongo', { arrow: false }), link('api', 'fn', { arrow: false })];
const scope = (from: string, to: string) => link(from, to, { style: 'dashed', tone: 'net' });

export default defineLesson({
  metrics: [
    { id: 'time', label: 'Full test run', better: 'lower' },
    { id: 'conf', label: 'Confidence after a change' },
  ],
  legend: { event: 'test run', res: 'pass' },
  goals: [
    { text: 'Why manual checking doesn’t scale', step: 1 },
    { text: 'Unit tests', step: 2 },
    { text: 'Integration tests for your API', step: 3 },
    { text: 'Component and end-to-end tests', step: 4 },
    { text: 'The shape of a healthy test suite', step: 6 },
  ],
  steps: [
    {
      short: 'Clicking around',
      beat: 'problem',
      title: '“Did my change break anything?”',
      body: [
        'You fix a bug in the due-date logic. To be sure nothing else broke, you click through every page, log in, add a todo, filter, log out… every time, for every change.',
        'You’ll skip it when you’re in a hurry — exactly when bugs slip through. Tests are that checklist, written once and run by a machine in seconds.',
      ],
      metrics: { time: '20 min (by hand)', conf: 'low' },
      scene: {
        nodes: { you: actor(260, 300, 'You', { sub: 'clicking every page', icon: 'user' }), ...app },
        links: [...appLinks, link('you', 'ui', { style: 'dashed' })],
        flows: [flow(['you', 'ui', 'api', 'mongo'], { kind: 'event', label: ['click…', 'click…', 'check…'], every: 5, dwell: 0.8 })],
      },
    },
    {
      short: 'Unit',
      beat: 'technique',
      title: 'Unit tests: one function, milliseconds',
      body: [
        'A [[unit-test|unit test]] calls one function with an input and checks the output. No browser, no server, no database — so thousands run in a couple of seconds with Vitest or Jest.',
        'Perfect for pure logic: formatting, validation rules, price calculations, reducers.',
      ],
      code: {
        file: 'dueLabel.test.js',
        lang: 'js',
        code: `import { test, expect } from 'vitest';
import { dueLabel } from './dueLabel.js';

test('overdue todos say so', () => {
  expect(dueLabel(new Date('2026-01-01'), new Date('2026-01-03'))).toBe('2 days overdue');
});`,
        hl: [4, 5],
      },
      metrics: { time: '3 ms', conf: 'for that function' },
      scene: { nodes: { ...patch(pyramid, { unit: { state: 'active' } }), ...app }, links: [...appLinks, scope('unit', 'fn')], flows: [flow(['unit', 'fn'], { kind: 'event', label: 'dueLabel(…)', back: 'res', backLabel: '✓', every: 1.6, speed: 1.6 })] },
    },
    {
      short: 'Integration',
      beat: 'technique',
      title: 'Integration tests: the API with a real database',
      body: [
        'An [[integration-test|integration test]] checks pieces together. For an Express API: send real HTTP requests to the app (with `supertest`), against a throwaway test database, and assert on the status, body and what got stored.',
        'They catch what unit tests can’t — middleware order, validation, auth, the actual Mongo query.',
      ],
      code: {
        file: 'todos.test.js',
        lang: 'js',
        code: `test('POST /api/todos saves a todo for the logged-in user', async () => {
  const res = await request(app).post('/api/todos').set('Cookie', anaCookie).send({ text: 'Buy milk' });
  expect(res.status).toBe(201);
  expect(await Todo.countDocuments({ userId: ana.id })).toBe(1);
});`,
        hl: [2, 3, 4],
      },
      metrics: { time: '0.4 s', conf: 'for the API' },
      scene: { nodes: { ...patch(pyramid, { integ: { state: 'active' } }), ...app }, links: [...appLinks, scope('integ', 'api')], flows: [flow(['integ', 'api', 'mongo'], { kind: 'event', label: ['POST /api/todos', 'insert'], back: 'res', backLabel: ['saved', '201 ✓'], every: 3.4 })] },
    },
    {
      short: 'Components & E2E',
      beat: 'technique',
      title: 'Component tests and end-to-end tests',
      body: [
        'React Testing Library renders one component and interacts with it **like a user**: find the button by its label, click it, expect the new item on screen.',
        'An [[e2e|end-to-end test]] (Playwright, Cypress) drives a real browser through the whole stack — UI, API and database — exactly as a person would. This site’s own QA script is one.',
      ],
      code: {
        file: 'add-todo.spec.js',
        lang: 'js',
        code: `test('a user can add a todo', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('New todo…').fill('Buy milk');
  await page.getByRole('button', { name: 'Add' }).click();
  await expect(page.getByText('Buy milk')).toBeVisible();
});`,
        hl: [3, 4, 5],
      },
      metrics: { time: '6 s', conf: 'whole flow works' },
      scene: { nodes: { ...patch(pyramid, { e2e: { state: 'active' } }), ...app }, links: [...appLinks, scope('e2e', 'ui')], flows: [flow(['e2e', 'ui', 'api', 'mongo'], { kind: 'event', label: ['click “Add”', 'POST', 'insert'], back: 'res', backLabel: ['', '', 'visible ✓'], every: 5 })] },
    },
    {
      short: 'Flaky',
      beat: 'problem',
      title: 'Slow, flaky suites get ignored',
      body: [
        'End-to-end tests are the most realistic — and the slowest and most fragile. A suite of 400 browser tests takes half an hour and fails randomly when a page is a little slow.',
        'People start re-running until it’s green, then stop trusting red at all. A test nobody trusts is worse than no test.',
      ],
      metrics: { time: '30 min', conf: 'falling' },
      scene: {
        nodes: { ...patch(pyramid, { e2e: { w: 350, state: 'error', badge: { text: '400 tests · flaky', tone: 'danger' } }, unit: { w: 190, sub: 'too few' } }), ...app },
        links: [...appLinks, scope('e2e', 'ui')],
        flows: [flow(['e2e', 'ui'], { kind: 'err', label: 'timeout?', fail: true, every: 2.4 })],
      },
    },
    {
      short: 'The pyramid',
      beat: 'insight',
      title: 'The pyramid: many fast tests, few slow ones',
      body: [
        'Aim for lots of unit tests for logic, a solid layer of integration tests for the API, and a **handful** of end-to-end tests for the critical journeys: sign up, log in, add and complete a todo, pay.',
        'Run the fast ones on every save, all of them in CI on every push.',
      ],
      metrics: { time: '45 s', conf: 'high' },
      scene: {
        nodes: { ...patch(pyramid, { e2e: { state: 'ok', sub: '5 journeys' }, integ: { state: 'ok', sub: '80 API tests' }, unit: { state: 'ok', sub: '600 functions' } }), ...app },
        links: [...appLinks, scope('unit', 'fn'), scope('integ', 'api'), scope('e2e', 'ui')],
        flows: [
          flow(['unit', 'fn'], { kind: 'event', back: 'res', every: 1.2, speed: 2 }),
          flow(['integ', 'api'], { kind: 'event', back: 'res', every: 2.4, offset: 0.4 }),
          flow(['e2e', 'ui'], { kind: 'event', back: 'res', every: 4.8, offset: 0.8 }),
        ],
      },
    },
    {
      short: 'Behaviour',
      beat: 'tradeoff',
      title: 'Test behaviour, not implementation',
      body: [
        'Good tests check what users and callers can observe — the text on screen, the status code, what was saved — not internal details like which hook ran or what a private variable holds.',
        'Then you can refactor freely: the tests only fail when behaviour really changes.',
      ],
      check: {
        q: 'You refactor `AddTodo` from `useState` to `useReducer`. The feature works exactly as before. Which test should keep passing?',
        options: ['One that asserts useState was called', 'One that types text, clicks Add and expects the new todo on screen', 'One that checks the component’s internal state object', 'None — refactors always break tests'],
        answer: 1,
        explain: 'It tests what the user sees, so it survives any internal change that keeps behaviour the same — and fails if behaviour breaks.',
      },
      metrics: { time: '45 s', conf: 'high' },
      scene: { nodes: { ...patch(pyramid, { e2e: { state: 'ok' }, integ: { state: 'ok' }, unit: { state: 'ok' } }), ...app, ui: { ...app.ui, badge: { text: 'refactored inside', tone: 'client' } } }, links: [...appLinks, scope('e2e', 'ui')], flows: [flow(['e2e', 'ui'], { kind: 'event', label: 'type + click', back: 'res', backLabel: 'still ✓', every: 3.4 })] },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'A test suite you’ll actually trust',
      body: [
        '{client:Unit tests} for logic (milliseconds), {server:integration tests} for the API with a test database (seconds), a few {net:end-to-end tests} for critical journeys in a real browser.',
        'Keep the suite fast and deterministic, test observable behaviour, and run it automatically on every push — that’s the next lesson.',
      ],
      metrics: { time: '45 s', conf: 'high' },
      scene: {
        nodes: { ...patch(pyramid, { e2e: { state: 'ok' }, integ: { state: 'ok' }, unit: { state: 'ok' } }), ...app },
        links: [...appLinks, scope('unit', 'fn'), scope('integ', 'api'), scope('e2e', 'ui')],
        flows: [flow(['unit', 'fn'], { kind: 'event', back: 'res', every: 1.2, speed: 2 }), flow(['integ', 'api'], { kind: 'event', back: 'res', every: 2.4, offset: 0.4 }), flow(['e2e', 'ui'], { kind: 'event', back: 'res', every: 4.8, offset: 0.8 })],
      },
    },
  ],
});
