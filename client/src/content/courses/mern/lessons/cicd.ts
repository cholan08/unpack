import { actor, box, chip, defineLesson, flow, link, patch, zone } from '@/content/dsl';
import type { LinkSpec, NodeSpec } from '@/engine/types';

/* ---------- layout: you → GitHub → the CI pipeline → environments ---------- */
const you = actor(80, 300, 'You', { sub: 'git push', icon: 'user' });
const gh = box(250, 300, 'GitHub', { sub: 'PR #42', icon: 'workflow', tone: 'neutral', w: 150 });
const ciZ = zone(570, 300, 420, 200, 'CI · GitHub Actions', { tone: 'net', icon: 'workflow' });
const job = (x: number, label: string, o: Partial<NodeSpec> = {}) => ({ ...chip(x, 310, label, { tone: 'net', w: 112, icon: 'bolt' }), ...o }) as NodeSpec;
const jobs: Record<string, NodeSpec> = { lint: job(440, 'lint'), test: job(570, 'test'), build: job(700, 'build') };
const prod = box(900, 210, 'Production', { sub: 'todo-app.com', icon: 'cloud', tone: 'ok', w: 160 });
const preview = box(900, 420, 'Preview', { sub: 'PR #42 URL', icon: 'browser', tone: 'net', w: 160 });

const base: Record<string, NodeSpec> = { you, gh, ciZ, ...jobs };
const ciLinks: LinkSpec[] = [link('you', 'gh'), link('gh', 'lint'), link('lint', 'test'), link('test', 'build')];
const run = (o: Parameters<typeof flow>[1] = {}) => flow(['you', 'gh', 'lint', 'test', 'build'], { kind: 'event', label: ['push', 'run CI', 'ok', 'ok'], every: 5.4, dwell: 0.35, ...o });

const workflow = `name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build`;

export default defineLesson({
  metrics: [
    { id: 'minutes', label: 'Push → result', unit: 'min', better: 'lower' },
    { id: 'broken', label: 'Broken code can reach main' },
  ],
  legend: { event: 'pipeline run', data: 'deploy' },
  goals: [
    { text: 'What CI runs on every push', step: 2 },
    { text: 'Required checks on pull requests', step: 3 },
    { text: 'Continuous deployment and previews', step: 4 },
    { text: 'Fast pipelines', step: 5 },
    { text: 'Rollbacks and safe migrations', step: 6 },
  ],
  steps: [
    {
      short: 'Laptop deploys',
      beat: 'problem',
      title: 'Deploying from your laptop',
      body: [
        'You run the tests (most days), build on your machine, and upload. One day you deploy from the wrong branch; another day a teammate’s change breaks the build, and nobody notices until users do.',
        'Every manual step is a step someone eventually skips.',
      ],
      metrics: { minutes: '—', broken: 'yes' },
      scene: { nodes: { you, prod: { ...prod, x: 600, y: 300, state: 'error', badge: { text: 'broken build live', tone: 'danger' } } }, links: [link('you', 'prod', { label: 'npm run deploy (from laptop)' })], flows: [flow(['you', 'prod'], { kind: 'data', label: 'untested build', every: 3.6 })] },
    },
    {
      short: 'CI',
      beat: 'solution',
      title: 'CI: every push runs the same checks',
      body: [
        '[[ci|Continuous integration]]: every push and pull request triggers a fresh machine that installs dependencies exactly from the lockfile, then lints, tests and builds. Same steps, every time, for everyone.',
        'Results show up right on the pull request: a green check or a red cross with the failing test.',
      ],
      code: { file: '.github/workflows/ci.yml', lang: 'yaml', code: workflow, hl: [2, 10, 11, 12, 13] },
      metrics: { minutes: 6, broken: 'caught' },
      scene: { nodes: patch(base, { lint: { state: 'ok' }, test: { state: 'ok' }, build: { state: 'ok' } }), links: ciLinks, flows: [run()] },
    },
    {
      short: 'Required checks',
      beat: 'technique',
      title: 'Pull requests can’t merge while red',
      body: [
        'Turn on **branch protection** for `main`: changes arrive only through pull requests, CI must pass, and (on a team) someone must approve.',
        'A failing test now blocks the merge instead of reaching users. `main` is always in a deployable state.',
      ],
      metrics: { minutes: 6, broken: 'no' },
      scene: {
        nodes: patch(base, { lint: { state: 'ok' }, test: { state: 'error', badge: { text: '1 failing', tone: 'danger' } }, build: { state: 'dim' }, gh: { badge: { text: 'merge blocked', tone: 'danger' } } }),
        links: ciLinks,
        flows: [flow(['you', 'gh', 'lint', 'test'], { kind: 'event', label: ['push', 'run CI', 'ok'], every: 5, dwell: 0.35, back: 'err', backLabel: ['✗', '✗', '✗ red'] })],
      },
    },
    {
      short: 'CD',
      beat: 'technique',
      title: 'CD: merges deploy themselves',
      body: [
        '[[cd|Continuous deployment]]: when CI passes on `main`, the same pipeline deploys the build — no laptops involved. Each pull request can also get a **preview deployment** at its own URL, so reviewers click through the change before merging.',
        'Most hosting platforms do both automatically once you connect the repository.',
      ],
      metrics: { minutes: 8, broken: 'no' },
      scene: {
        nodes: { ...patch(base, { lint: { state: 'ok' }, test: { state: 'ok' }, build: { state: 'ok' } }), prod, preview },
        links: [...ciLinks, link('build', 'prod'), link('build', 'preview', { style: 'dashed' })],
        flows: [run(), flow(['build', 'preview'], { kind: 'data', label: 'PR preview', every: 5.4, offset: 3 }), flow(['build', 'prod'], { kind: 'data', label: 'deploy main', every: 5.4, offset: 3.6 })],
      },
    },
    {
      short: 'Fast',
      beat: 'technique',
      title: 'Keep the pipeline fast',
      body: [
        'A 25-minute pipeline means context switches and batched, risky changes. Cache `node_modules` downloads between runs, run independent jobs **in parallel**, and keep slow end-to-end tests to the critical few.',
        'Under ten minutes from push to green keeps the feedback loop tight.',
      ],
      metrics: { minutes: 4, broken: 'no' },
      scene: {
        nodes: { ...patch(base, { lint: { y: 250, state: 'ok' }, test: { y: 310, x: 440, state: 'ok' }, build: { y: 370, x: 440, state: 'ok' }, ciZ: { sub: 'parallel · cached' } }), prod },
        links: [link('you', 'gh'), link('gh', 'lint'), link('gh', 'test'), link('gh', 'build'), link('lint', 'prod', { style: 'dashed' }), link('build', 'prod', { style: 'dashed' })],
        flows: ['lint', 'test', 'build'].map((j) => flow(['you', 'gh', j], { kind: 'event', label: j === 'test' ? ['push', 'parallel'] : undefined, every: 4 })),
      },
    },
    {
      short: 'Rollbacks',
      beat: 'tradeoff',
      title: 'Rollbacks — and migrations that allow them',
      body: [
        'Because every build is kept, rolling back is just redeploying the previous one: seconds, not hours. But the **database** doesn’t roll back with it.',
        'So change schemas in backward-compatible steps (“expand, then contract”): add the new field and write both, deploy, migrate old documents, and only later remove the old field. At every moment, both the old and new code work.',
      ],
      check: {
        q: 'You rename `todo.title` to `todo.text`. What’s the safe sequence?',
        options: ['Rename the field in the database and deploy the new code at the same moment', 'Add `text` (writing both), deploy, migrate old docs, then remove `title` later', 'Deploy the new code first and let it crash until the migration finishes', 'Never rename fields'],
        answer: 1,
        explain: 'Expand-then-contract keeps old and new versions working with the same data, so you can deploy — or roll back — at any point without breaking users.',
      },
      metrics: { minutes: 1, broken: 'no' },
      scene: {
        nodes: { ...patch(base, { lint: { state: 'ok' }, test: { state: 'ok' }, build: { state: 'ok' } }), prod: { ...prod, badge: { text: 'v41 ← v42', tone: 'warn' } }, preview: { ...preview, label: 'Build v41', sub: 'kept' } },
        links: [...ciLinks, link('build', 'prod'), link('preview', 'prod', { label: 'rollback' })],
        flows: [flow(['preview', 'prod'], { kind: 'data', label: 'redeploy v41', every: 3.6 })],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Let the pipeline do the boring parts',
      body: [
        '{net:CI} runs lint, tests and build on every push from a clean machine; branch protection keeps `main` green.',
        '{ok:CD} deploys `main` automatically and gives each pull request a preview URL.',
        'Keep pipelines fast with caching and parallel jobs; keep rollbacks safe with backward-compatible database changes.',
      ],
      metrics: { minutes: 6, broken: 'no' },
      scene: {
        nodes: { ...patch(base, { lint: { state: 'ok' }, test: { state: 'ok' }, build: { state: 'ok' } }), prod, preview },
        links: [...ciLinks, link('build', 'prod'), link('build', 'preview', { style: 'dashed' })],
        flows: [run(), flow(['build', 'prod'], { kind: 'data', label: 'deploy', every: 5.4, offset: 3.6 })],
      },
    },
  ],
});
