import { box, chip, defineLesson, flow, item, link, patch, stack, zone } from '@/content/dsl';
import type { LinkSpec, NodeSpec } from '@/engine/types';

/* ---------- layout: the import graph on the left, the bundler and its output on the right ---------- */
const file = (x: number, y: number, label: string, sub?: string, o: Partial<NodeSpec> = {}): NodeSpec =>
  ({ ...box(x, y, label, { sub, icon: 'file', tone: 'client', w: 180 }), ...o }) as NodeSpec;
const graph: Record<string, NodeSpec> = {
  main: file(105, 300, 'main.jsx', 'entry'),
  app: file(315, 190, 'App.jsx'),
  api: file(315, 420, 'api.js'),
  list: file(530, 110, 'TodoList.jsx'),
  utils: file(530, 300, 'utils.js', '2 exports'),
  pkg: file(530, 490, 'date-fns', 'node_modules', { tone: 'neutral', icon: 'boxes' }),
};
const imports: LinkSpec[] = [
  link('main', 'app', { label: 'import' }),
  link('main', 'api'),
  link('app', 'list'),
  link('app', 'utils'),
  link('api', 'utils'),
  link('utils', 'pkg'),
];
const bundler = box(845, 130, 'Vite (Rollup)', { sub: 'follows imports', icon: 'bolt', tone: 'net', w: 200 });
const dist = (items = [item('j', 'index-4f9c.js   58 KB', { tone: 'client' }), item('c', 'index-91ab.css   4 KB', { tone: 'client' })]) =>
  stack(845, 370, 'dist/', items, { w: 250, h: 190, from: 'top', mono: true, icon: 'boxes', tone: 'client' });
const walk = flow(['main', 'app', 'list'], { kind: 'data', label: ['import', 'import'], every: 5, dwell: 0.2 });
const walk2 = flow(['main', 'api', 'utils', 'pkg'], { kind: 'data', label: ['import', 'import', 'import'], every: 5, offset: 0.4, dwell: 0.2 });

export default defineLesson({
  metrics: [
    { id: 'files', label: 'Files the browser loads', better: 'lower' },
    { id: 'kb', label: 'JavaScript shipped', unit: 'KB', better: 'lower' },
  ],
  legend: { data: 'import', res: 'output' },
  goals: [
    { text: 'Why global scripts collide', step: 1 },
    { text: 'import and export', step: 2 },
    { text: 'CommonJS vs ES modules in Node', step: 3 },
    { text: 'What a bundler does', step: 4 },
    { text: 'Tree shaking and code splitting', step: 5 },
    { text: 'dependencies vs devDependencies', step: 7 },
  ],
  steps: [
    {
      short: 'Global scripts',
      beat: 'problem',
      title: 'Many script tags, one shared global scope',
      body: [
        'Before modules, every `<script>` dumped its names into one global scope. Two files both defining `formatDate`? The last one silently wins. A file using a library loaded later? Crash — order matters, and nothing says what depends on what.',
        'Fine for ten lines of jQuery; hopeless for an app with hundreds of files.',
      ],
      code: { file: 'index.html', lang: 'markup', code: `<script src="dates.js"></script>   <!-- defines formatDate -->\n<script src="utils.js"></script>   <!-- also defines formatDate 💥 -->\n<script src="app.js"></script>     <!-- which one does it get? -->`, err: [2] },
      metrics: { files: 3, kb: 240 },
      scene: {
        nodes: {
          win: zone(620, 300, 520, 300, 'window (one global scope)', { tone: 'danger', icon: 'globe' }),
          s1: chip(150, 180, 'dates.js', { tone: 'neutral', icon: 'file', w: 150 }),
          s2: chip(150, 300, 'utils.js', { tone: 'neutral', icon: 'file', w: 150 }),
          s3: chip(150, 420, 'app.js', { tone: 'neutral', icon: 'file', w: 150 }),
          g: chip(620, 300, 'formatDate = ?', { tone: 'danger', w: 200, state: 'error', badge: { text: 'overwritten', tone: 'danger' } }),
        },
        links: [link('s1', 'g'), link('s2', 'g'), link('s3', 'g', { style: 'dashed' })],
        flows: [flow(['s1', 'g'], { kind: 'data', label: 'formatDate', every: 4 }), flow(['s2', 'g'], { kind: 'err', label: 'formatDate (again)', every: 4, offset: 1 })],
      },
    },
    {
      short: 'ES modules',
      beat: 'solution',
      title: 'Modules: each file has its own scope',
      body: [
        'With [[esm|ES modules]], each file is private by default. It shares names on purpose with `export`, and uses other files’ names with `import`. Nothing leaks into a global scope.',
        'The imports form a **graph**: starting at the entry file, you can see exactly which file needs which — no guessing about order.',
      ],
      code: {
        file: 'utils.js → App.jsx',
        lang: 'js',
        code: `// utils.js
export function formatDate(d) { … }
export function slugify(s) { … }

// App.jsx
import { formatDate } from './utils.js';`,
        hl: [2, 6],
      },
      metrics: { files: 6, kb: 240 },
      scene: { nodes: graph, links: imports, flows: [walk, walk2] },
    },
    {
      short: 'CJS vs ESM',
      beat: 'technique',
      title: 'Node has two module systems',
      body: [
        'Node started with [[commonjs|CommonJS]]: `require()` and `module.exports`. Browsers standardised on ES modules, and Node now supports both. You choose per project with `"type": "module"` in `package.json` (or per file with `.mjs` / `.cjs`).',
        'New code should use ES modules everywhere — the same syntax in React and Express. You’ll still meet `require` in older tutorials and packages.',
      ],
      code: {
        file: 'two styles',
        lang: 'js',
        code: `// CommonJS (older Node)
const express = require('express');
module.exports = { createTodo };

// ES modules ("type": "module" in package.json)
import express from 'express';
export { createTodo };`,
        hl: [6, 7],
      },
      metrics: { files: 6, kb: 240 },
      scene: {
        nodes: patch(graph, { api: { sub: 'require()?' }, utils: { sub: 'import ✓' } }),
        links: imports,
        flows: [walk2],
      },
    },
    {
      short: 'Bundling',
      beat: 'technique',
      title: 'A bundler turns the graph into a few files',
      body: [
        'Browsers *can* load modules one by one, but hundreds of small requests are slow. A [[bundler]] starts at `main.jsx`, follows every import, compiles JSX, and writes a handful of optimised files to `dist/` — with hashed names for caching.',
        'Vite is clever about it: in development it serves your files as native modules (instant start, hot reload); for production it bundles with Rollup.',
      ],
      code: { lang: 'bash', file: 'Terminal', code: `$ npm run build\ndist/assets/index-4f9c.js   58 kB\ndist/assets/index-91ab.css   4 kB`, hl: [1] },
      metrics: { files: 2, kb: 58 },
      scene: {
        nodes: { ...graph, bundler: { ...bundler, state: 'active' }, dist: dist() },
        links: [...imports, link('list', 'bundler', { style: 'dashed' }), link('bundler', 'dist')],
        flows: [walk, walk2, flow(['bundler', 'dist'], { kind: 'res', label: 'bundle', every: 5, offset: 2.6 })],
      },
    },
    {
      short: 'Tree shaking',
      beat: 'technique',
      title: 'Tree shaking: unused code never ships',
      body: [
        'Because `import` and `export` are static, the bundler can see that nothing imports `slugify` — so it leaves it out. That’s [[tree-shaking|tree shaking]], and it works for libraries too: import one function from `date-fns` and you ship one function, not the whole package.',
        'Prefer named imports (`import { format } from ...`) over importing everything, so the bundler can tell what you use.',
      ],
      metrics: { files: 2, kb: 41 },
      scene: {
        nodes: {
          ...patch(graph, { utils: { sub: 'slugify: unused', badge: { text: 'shaken out', tone: 'neutral' } }, pkg: { sub: '1 function used' } }),
          bundler,
          dist: dist([item('j', 'index-4f9c.js   41 KB', { tone: 'ok', state: 'ok' }), item('c', 'index-91ab.css   4 KB', { tone: 'client' })]),
        },
        links: [...imports, link('list', 'bundler', { style: 'dashed' }), link('bundler', 'dist')],
        flows: [flow(['bundler', 'dist'], { kind: 'res', label: '−17 KB', every: 3.6 })],
      },
    },
    {
      short: 'Code splitting',
      beat: 'technique',
      title: 'Code splitting: load parts only when needed',
      body: [
        'A dynamic `import()` tells the bundler “this can come later”. It becomes its own small chunk, downloaded the first time it’s needed — like a settings page most users never open.',
        'This very site does it: each lesson is a separate chunk, fetched when you open it (and prefetched when you hover).',
      ],
      code: {
        file: 'App.jsx',
        lang: 'jsx',
        code: `const Settings = lazy(() => import('./pages/Settings.jsx'));

<Suspense fallback={<Spinner />}>
  <Settings />
</Suspense>`,
        hl: [1],
      },
      metrics: { files: 3, kb: 41 },
      scene: {
        nodes: {
          ...graph,
          settings: file(315, 545, 'Settings.jsx', 'import() — lazy', { tone: 'warn', state: 'active' }),
          bundler,
          dist: dist([item('j', 'index-4f9c.js   41 KB', { tone: 'client' }), item('c', 'index-91ab.css   4 KB', { tone: 'client' }), item('s', 'Settings-7e2a.js  9 KB', { tone: 'warn', state: 'active', sub: 'loaded on demand' })]),
        },
        links: [...imports, link('main', 'settings', { style: 'dashed', tone: 'warn' }), link('bundler', 'dist')],
        flows: [flow(['main', 'settings'], { kind: 'data', label: 'import()', every: 4 })],
      },
    },
    {
      short: 'Packages',
      beat: 'insight',
      title: 'Packages, node_modules and package.json',
      body: [
        '`npm install date-fns` downloads a package into `node_modules` and records it in `package.json`. **dependencies** are needed when the app runs (React, Express); **devDependencies** are only needed to build or test it (Vite, Vitest).',
        '`package-lock.json` pins exact versions of everything, so every machine — and your deploy — installs the same tree. Commit it; never commit `node_modules`.',
      ],
      check: {
        q: 'Where does `vite` belong in a React app’s `package.json`?',
        options: ['dependencies — the app needs it', 'devDependencies — it builds the app but doesn’t run in the browser', 'Neither — install it globally', 'peerDependencies'],
        answer: 1,
        explain: 'Vite produces `dist/`; the browser only receives the built files. Build and test tools are devDependencies.',
      },
      code: {
        file: 'package.json',
        lang: 'json',
        code: `{
  "type": "module",
  "dependencies": { "react": "^18.3.1", "date-fns": "^4.1.0" },
  "devDependencies": { "vite": "^6.4.0", "vitest": "^3.0.0" }
}`,
        hl: [3, 4],
      },
      metrics: { files: 3, kb: 41 },
      scene: {
        nodes: { ...graph, pkg: { ...graph.pkg, state: 'active', badge: { text: 'dependency', tone: 'neutral' } }, bundler: { ...bundler, badge: { text: 'devDependency', tone: 'net' } }, dist: dist() },
        links: [...imports, link('list', 'bundler', { style: 'dashed' }), link('bundler', 'dist')],
        flows: [walk2],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'Modules and bundlers',
      body: [
        '{client:ES modules} give every file its own scope; `export` and `import` make dependencies explicit and form a graph.',
        'A {net:bundler} walks that graph from the entry file and emits a few optimised, hashed files — dropping unused exports (tree shaking) and splitting lazy parts into chunks.',
        'Packages live in `node_modules`, listed in `package.json` (runtime vs dev), pinned by the lockfile.',
      ],
      metrics: { files: 2, kb: 41 },
      scene: {
        nodes: { ...graph, bundler, dist: dist() },
        links: [...imports, link('list', 'bundler', { style: 'dashed' }), link('bundler', 'dist')],
        flows: [walk, walk2, flow(['bundler', 'dist'], { kind: 'res', label: 'bundle', every: 5, offset: 2.6 })],
      },
    },
  ],
});
