/**
 * Chapter: Don’t break it (testing).
 * Follows the model chapter, written/identity.ts.
 */
import type { ChapterWriting } from '../types';

const writing: ChapterWriting = {
  hook: {
    story: [
      'You fix a small bug in the checkout. It works. Two days later someone notices that discount codes have stopped working — broken by your fix, in a file you never opened.',
      'Every change can break something you didn’t think of, and as an app grows, nobody can click through every feature before each release. Tests are code that checks your code — automatically, in seconds, every time anything changes.',
      'How do teams change code every day without breaking what already works?',
    ],
    predict: {
      q: 'Which test suite would you rather trust before a release?',
      options: [
        '300 browser tests that take 40 minutes and fail at random one run in five',
        'A few browser tests for the key journeys, more API tests, and many fast unit tests — all in under five minutes',
        'No tests, but a careful manual check of every page',
        'Unit tests only, one for every single function',
      ],
      answer: 1,
      reveal:
        'The **pyramid**. Slow, flaky suites get ignored: when tests fail at random, people re-run them until they pass and stop believing them. Many fast [[unit-test|unit tests]] catch logic mistakes in milliseconds, [[integration-test|integration tests]] prove the API really works with a database, and a handful of [[e2e|end-to-end]] tests prove the key journeys — sign-up, checkout — work for a real user.',
    },
  },

  idea: {
    lede: 'Whatever the language or framework, a test suite you can trust does five jobs.',
    jobs: [
      {
        title: 'Check the logic',
        text: 'Unit tests call one function with inputs and check the output — no network, no database, milliseconds each.',
      },
      {
        title: 'Check the pieces fit',
        text: 'Integration tests call your real API with a real test database, and check status codes, data and permissions.',
      },
      {
        title: 'Check the journeys',
        text: 'End-to-end tests drive a real browser through the few flows that matter most: sign up, log in, pay.',
      },
      {
        title: 'Run on every change',
        text: 'Tests run automatically in [[ci|CI]] on every push, and a red result blocks the merge.',
      },
      {
        title: 'Test behaviour, not wiring',
        text: 'Check what a user or caller sees, not how the code is arranged inside — so you can restructure code without rewriting tests.',
      },
    ],
    picture:
      'Checking a new car. Each part is tested on a bench before assembly — the brakes, the lights (unit tests). The assembled systems are tested together: does pressing the pedal stop the wheels? (integration). A driver takes it round the track on the routes that matter (end-to-end). Every car off the line gets the same checks, automatically (CI) — and the checks ask whether it stops, not which bolts were used (behaviour).',
  },

  lessonNotes: {
    testing: 'All five jobs: unit, integration and end-to-end tests, flaky suites, the pyramid, and testing behaviour instead of implementation.',
  },

  options: {
    lede: 'You need a few kinds of tests, each with its own tools. The art is in the proportions: many cheap, fast tests; a few slow, realistic ones.',
    items: [
      {
        name: 'Unit tests',
        what: 'Fast tests of single functions and modules.',
        pickWhen: 'Logic: calculations, validation, formatting, reducers.',
        cost: 'They don’t prove the pieces work together.',
        examples: 'Vitest, Jest, Node’s built-in test runner',
      },
      {
        name: 'API integration tests',
        what: 'Real requests against your app, with a real test database.',
        pickWhen: 'Every route: success, invalid input, and the auth and permission rules.',
        cost: 'Slower than unit tests, and test data to set up and clean away.',
        examples: 'Supertest with Vitest; MongoDB Memory Server, or a database in Docker',
        tools: ['express', 'mongodb'],
      },
      {
        name: 'Component tests',
        what: 'Render a React component and use it the way a person would.',
        pickWhen: 'UI logic: forms, conditional states, interactions.',
        cost: 'They run in a simulated browser, so real layout isn’t tested.',
        examples: 'React Testing Library with Vitest; Vitest browser mode',
        tools: ['react'],
      },
      {
        name: 'End-to-end tests',
        what: 'A real browser clicks through your running app.',
        pickWhen: 'The few journeys that must never break.',
        cost: 'Slow, and flaky if written carelessly.',
        examples: 'Playwright, Cypress',
      },
      {
        name: 'Automatic checks',
        what: 'Type checking, linting, accessibility checks, screenshot comparisons, load tests.',
        pickWhen: 'Cheap safety nets — types and linting on every single change.',
        cost: 'Each needs tuning so it catches real problems rather than noise.',
        examples: 'TypeScript, ESLint, axe, Playwright screenshots, k6',
        tools: ['typescript'],
      },
    ],
    choose: [
      { when: 'A function with rules or calculations', pick: 'Unit tests.' },
      { when: 'An API route', pick: 'Integration tests with a real test database — forbidden cases included.' },
      { when: 'A form or interactive component', pick: 'Component tests with Testing Library.' },
      { when: 'Sign-up, login, checkout', pick: 'A few end-to-end tests with Playwright.' },
      { when: 'Every change, for free', pick: 'TypeScript and a linter in CI.' },
    ],
  },

  modern: {
    lede: 'AI writes tests very fast — and often tests the wrong thing: that the code does what it currently does, bugs included. In the AI era tests matter *more*: they are how you check AI-written code, and how an AI agent checks its own work. Decide what *should* happen, write that down as tests, and let the AI make them pass.',
    defaults: [
      'Tests run on every push in CI, and a red check blocks the merge.',
      'Most tests are fast unit and API tests; a handful of end-to-end tests cover the critical journeys.',
      'Every bug fix comes with a test that fails before the fix and passes after it.',
      'Permissions are tested explicitly: logged out, wrong user, wrong role.',
      'Tests use public interfaces, and avoid mocking code you own.',
      'Flaky tests are fixed or deleted at once — a suite nobody trusts is worse than none.',
    ],
    aiGood: [
      'Writing test cases from a description of the rules',
      'Listing edge cases you hadn’t thought of',
      'Setting up Vitest, Supertest and Playwright',
      'Turning a bug report into a failing test',
      'Explaining why a test is flaky',
    ],
    aiWrong: [
      { mistake: 'Writes tests that copy the current output, bugs included.', fix: 'Write the expected result from the rules, not from running the code.' },
      { mistake: 'Mocks everything, so nothing real is tested.', fix: 'A real test database for API tests; mock only what is outside your control.' },
      { mistake: 'Tests only the happy path.', fix: 'Ask for invalid input, empty lists, limits and permission cases.' },
      { mistake: 'Edits the test until it passes.', fix: 'When a test fails, decide — on purpose — whether the code or the expectation is wrong.' },
      { mistake: 'Uses fixed waits (`sleep(2000)`) in browser tests.', fix: 'Wait for what you expect to appear; Playwright does this by default.' },
      { mistake: 'Checks implementation details: internal state, CSS classes.', fix: 'Check what users see and what APIs return.' },
    ],
  },

  build: {
    title: 'A test suite you would trust',
    brief: 'Give your bookmarks app the tests you would want before a release: unit tests for the rules, API tests for every route and permission, one end-to-end journey — all running in CI in a few minutes.',
    byHand: [
      { title: 'Unit-test the rules', text: 'Test your validation schema and pagination-cursor helper with Vitest: valid input, invalid input, edge cases.', see: ['testing', 2] },
      { title: 'A real API, a test database', text: 'Use Supertest against your Express app with MongoDB Memory Server, and reset the data before each test.', see: ['testing', 3] },
      { title: 'Every status code', text: 'For each route: success, `400` for bad input, `401` when logged out, `404` for someone else’s bookmark.', see: ['testing', 3] },
      { title: 'Test a component', text: 'With React Testing Library, type into the add-bookmark form, submit, and check the message for a bad URL.', see: ['testing', 4] },
      { title: 'One real journey', text: 'A Playwright test: sign up, add a bookmark, search for it, log out.', see: ['testing', 4] },
      { title: 'Run it on every push', text: 'Add the tests to your GitHub Actions workflow, and make the check required on pull requests.', see: ['cicd', 2] },
      { title: 'Test the bug first', text: 'Next time you find a bug, write a failing test for it *before* fixing it.', see: ['testing', 7] },
    ],
    withAI: {
      lede: 'Let your AI assistant write the suite — from your *rules*, not from your code. The last line is the important one: a failing test is information, not something to edit away.',
      prompt: `Write a test suite for my bookmarks app (Express + Mongoose API, React + Vite client). I'll paste the routes and schemas.

Rules for the tests
- Write expectations from these rules, not from running my code: [paste your rules, e.g. "users only see their own bookmarks", "title is 1–200 characters", "unknown id → 404"].
- Unit: Vitest for the Zod schemas and the cursor helper — valid, invalid and boundary cases.
- API: Vitest + Supertest + mongodb-memory-server. For every route: success, 400 invalid input, 401 logged out, 404 for another user's bookmark. Reset the database before each test.
- Component: React Testing Library for the add-bookmark form, querying by role and label, never by CSS class.
- E2E: one Playwright test — sign up, add a bookmark, search for it, log out. No fixed sleeps.
- A GitHub Actions job that runs everything on push and pull_request.

If a rule seems to be broken by my current code, write the test anyway and tell me. Don't change the expectation.`,
    },
    verify: [
      '`npm test` runs in under a minute on your machine.',
      'Every route has tests for success, bad input, logged out and another user’s data.',
      'Break a rule on purpose (allow 300-character titles): a test fails.',
      'The Playwright journey passes ten runs in a row.',
      'Tests find elements by role, label or text — never by CSS class.',
      'Opening a pull request runs the tests, and a failure blocks the merge.',
      'Your most recent bug fix has a test that would have caught it.',
    ],
  },

  breakIt: [
    {
      title: 'A test that can’t fail',
      lang: 'js',
      code: `test('applies the discount', () => {
  const result = applyDiscount(100, 'SAVE10');
  expect(result).toBe(applyDiscount(100, 'SAVE10'));
});`,
      err: [3],
      answer:
        'It compares the function with itself, so it passes whatever the function returns — even if the discount is wrong. Write the expected value from the rule: `expect(applyDiscount(100, \'SAVE10\')).toBe(90)`.',
    },
    {
      title: 'Mocking what you test',
      lang: 'js',
      code: `vi.mock('../models/Bookmark');
Bookmark.find.mockResolvedValue([{ title: 'A' }]);
const res = await request(app).get('/api/bookmarks');
expect(res.body).toHaveLength(1);`,
      err: [1, 2],
      answer:
        'With the model mocked, the test never touches a database, so it can’t notice a wrong filter (other users’ bookmarks!), a missing field or a broken query. API tests should use a real test database, such as MongoDB Memory Server, with real data.',
    },
    {
      title: 'Only the happy path',
      lang: 'js',
      code: `test('GET /api/bookmarks/:id returns the bookmark', async () => {
  const res = await request(app).get(\`/api/bookmarks/\${mine.id}\`).set('Cookie', anaCookie);
  expect(res.status).toBe(200);
});`,
      err: [1],
      answer:
        'The important cases are missing: Ben asking for Ana’s bookmark (expect `404`), no cookie at all (`401`), an invalid id (`404`). Security bugs live exactly in the cases nobody tested.',
    },
    {
      title: 'Waiting by the clock',
      lang: 'js',
      code: `await page.click('text=Save');
await page.waitForTimeout(2000);
expect(await page.textContent('.list')).toContain('My bookmark');`,
      err: [2],
      answer:
        'Two seconds is too long on a fast machine and too short on a slow CI runner — so the test is slow *and* flaky. Wait for what you expect: `await expect(page.getByText(\'My bookmark\')).toBeVisible()`, which retries until it appears or times out.',
      see: ['testing', 5],
    },
  ],

  explain: [
    'What are unit, integration and end-to-end tests each good for — and why do you want more of some than others?',
    'Why are flaky tests so harmful?',
    'Why should a bug fix start with a failing test?',
  ],

  deeper: [
    {
      q: 'What is test-driven development?',
      a: 'Writing the test before the code: watch it fail, write just enough code to pass, then tidy up. It forces you to decide what *should* happen first — a habit that works especially well when AI writes the code.',
    },
    {
      q: 'Is 100% code coverage the goal?',
      a: 'Coverage is the share of lines your tests run. It shows what is untested, but not whether the tests check anything useful — high coverage with weak assertions is false comfort. Aim for the important behaviour, not the number.',
    },
    {
      q: 'When is a mock the right choice?',
      a: 'A mock is a stand-in for a real dependency. It is right for things outside your control — payment providers, email, the clock — and wrong for your own database and code, where it hides real bugs.',
    },
    {
      q: 'What is contract testing?',
      a: 'Checking that a service still provides exactly what its consumers rely on — fields, types, status codes — so teams can change their services independently without breaking each other.',
    },
    {
      q: 'What is mutation testing?',
      a: 'A tool makes small changes to your code — flips a `>` to `>=` — and checks that some test fails. Tests that keep passing reveal weak assertions.',
    },
    {
      q: 'How do AI coding agents use tests?',
      a: 'They run the suite after each change and keep going until it passes. Good tests turn an agent from a guesser into something that checks its own work; weak tests let it “pass” while being wrong.',
    },
  ],

  next: [
    { q: 'Once a test catches a bug, how do you find the cause?', chapter: 'debug' },
    { q: 'How do changes get from your laptop to users safely?', chapter: 'ship' },
    { q: 'How do you notice something broke in production?', chapter: 'observe' },
    { q: 'How do several people work on the same code?', chapter: 'collaborate' },
  ],
};

export default writing;
