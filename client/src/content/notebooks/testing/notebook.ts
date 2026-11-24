import { codeArt, defineNotebook, flowArt, hubArt, iconArt, pg, revision } from '../dsl';

export default defineNotebook({
  id: 'testing',
  title: 'Testing',
  name: 'Software Testing',
  tagline: 'Prove it works and keep it working: the test pyramid, unit tests, mocks, React and API tests, E2E and TDD.',
  color: 'green',
  pillar: 'devops',
  order: 40,
  cover: {
    big: 'TESTING',
    full: 'Software Testing',
    cloud: ['Prove it', 'works,', 'keep it', 'working'],
    art: {
      topLeft: iconArt('laptop', 'Tests', 'green'),
      topRight: flowArt(['Write a test', 'Red ✗', 'Green ✓', 'Refactor'], 'green'),
      left: codeArt(["test('adds', () => {", '  expect(add(2, 3))', '    .toBe(5);', '});'], 'Vitest'),
      centre: hubArt('Pyramid', ['Unit', 'Integration', 'End-to-end', 'Manual'], 'box', 'green'),
    },
    side: { title: 'Tools', items: ['Vitest / Jest', 'Testing Lib.', 'Supertest', 'Playwright'] },
    why: { title: 'Why Testing ?', items: ['Ship with confidence', 'Refactor safely', 'Catch regressions', 'Living documentation'] },
    footer: 'Untested code is broken code!',
  },
  pages: [
    pg('introduction', 'Introduction to Testing', 'Why test', 'Manual vs automated', 'Verification vs validation', 'SDLC and STLC'),
    pg('levels', 'Levels & the Test Pyramid', 'Unit, integration, system, acceptance', 'The test pyramid', 'Black-box vs white-box', 'Functional vs non-functional'),
    pg('unit', 'Unit Testing', 'Arrange, Act, Assert', 'Vitest / Jest basics', 'Matchers', 'Naming and structure'),
    pg('mocks', 'Mocks, Stubs & Spies', 'Test doubles', 'Mocking modules and fetch', 'Fake timers', 'When not to mock'),
    pg('react', 'Testing React', 'React Testing Library', 'Querying by role', 'User events', 'Async UI tests'),
    pg('api', 'Testing APIs', 'Supertest with Express', 'Test databases', 'Fixtures and factories', 'Contract testing'),
    pg('e2e', 'End-to-End Testing', 'Playwright and Cypress', 'Selectors and flaky tests', 'Visual testing', 'Running in CI'),
    pg('tdd', 'TDD, BDD & Coverage', 'Red, green, refactor', 'BDD and Gherkin', 'Code coverage', 'Mutation testing'),
    revision('Unit vs integration', 'Mock vs stub vs spy', 'TDD vs BDD'),
  ],
});
