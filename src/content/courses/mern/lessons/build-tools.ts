import { box, browser, defineLesson, flow, item, link, patch, stack } from '@/content/dsl';
import type { LinkSpec, NodeSpec } from '@/engine/types';

/* ---------- layout: source on the left; dev path on top, build pipeline below ---------- */
const src = stack(110, 300, 'src/', [
  item('a', 'main.jsx', { tone: 'client' }),
  item('b', 'App.jsx', { tone: 'client' }),
  item('c', 'api.ts', { tone: 'client' }),
  item('d', 'styles.css', { tone: 'client' }),
], { w: 180, h: 200, from: 'top', mono: true, icon: 'file', tone: 'client' });
const dev = box(470, 140, 'Vite dev server', { sub: 'native ESM + HMR', icon: 'bolt', tone: 'net', w: 210 });
const page = browser(845, 140, { w: 220, h: 140, url: 'localhost:5173', screen: [{ t: 'h', text: 'My todos' }, { t: 'item', text: 'Buy milk' }] });
const step = (x: number, label: string, sub: string) => box(x, 440, label, { sub, tone: 'net', w: 150 });
const build: Record<string, NodeSpec> = {
  transform: step(330, 'Transform', 'JSX/TS → JS'),
  bundle: step(500, 'Bundle', 'follow imports'),
  minify: step(670, 'Minify + hash', 'smaller · hashed'),
  dist: stack(860, 440, 'dist/', [item('j', 'index-4f9c.js  58 KB', { tone: 'ok' }), item('m', 'index-4f9c.js.map', { tone: 'neutral' })], { w: 210, h: 130, from: 'top', mono: true, icon: 'boxes', tone: 'ok' }),
};
const devLinks: LinkSpec[] = [link('src', 'dev'), link('dev', 'page')];
const buildLinks: LinkSpec[] = [link('src', 'transform'), link('transform', 'bundle'), link('bundle', 'minify'), link('minify', 'dist')];
const buildFlow = (o: Parameters<typeof flow>[1] = {}) => flow(['src', 'transform', 'bundle', 'minify', 'dist'], { kind: 'data', label: ['42 files', 'JS', '1 bundle', '58 KB'], every: 5.6, dwell: 0.3, ...o });

export default defineLesson({
  metrics: [
    { id: 'update', label: 'See an edit after', better: 'lower' },
    { id: 'size', label: 'JS shipped', unit: 'KB', better: 'lower' },
  ],
  legend: { data: 'code', event: 'hot update' },
  goals: [
    { text: 'Why source code needs building', step: 1 },
    { text: 'The dev server and hot updates', step: 2 },
    { text: 'The production build pipeline', step: 3 },
    { text: 'Env vars and modes', step: 5 },
    { text: 'Source maps', step: 6 },
  ],
  steps: [
    {
      short: 'Why build?',
      beat: 'setup',
      title: 'Browsers don’t run your source as written',
      body: [
        'Your code uses JSX, maybe TypeScript, imports from `node_modules` by bare name (`import React from \'react\'`), CSS imports, environment variables. Browsers understand none of those directly.',
        'A build tool bridges the gap twice: a fast **dev server** while you work, and an optimised **production build** when you ship. Vite does both.',
      ],
      metrics: { update: '—', size: 240 },
      scene: { nodes: { src, dev, page, ...build }, links: [...devLinks, ...buildLinks] },
    },
    {
      short: 'Dev server',
      beat: 'technique',
      title: 'Development: modules on demand, hot updates',
      body: [
        'In development Vite doesn’t bundle. It serves each file as a native ES module when the browser asks, transforming it on the fly — so start-up is instant however big the app is.',
        'Save a file and only **that** module is swapped into the running page — [[hmr|hot module replacement]]. React keeps component state, so you see the edit without losing what you typed.',
      ],
      metrics: { update: '50 ms', size: 240 },
      scene: {
        nodes: { src: patch({ src }, { src: { items: [item('a', 'main.jsx', { tone: 'client' }), item('b', 'App.jsx · edited', { tone: 'warn', state: 'active' }), item('c', 'api.ts', { tone: 'client' }), item('d', 'styles.css', { tone: 'client' })] } }).src, dev: { ...dev, state: 'active' }, page: { ...page, screen: [{ t: 'h', text: 'My todos ✨' }, { t: 'item', text: 'Buy milk', flash: true }] } },
        links: devLinks,
        flows: [flow(['src', 'dev', 'page'], { kind: 'event', label: ['save App.jsx', 'HMR update'], every: 3 })],
      },
    },
    {
      short: 'Build',
      beat: 'technique',
      title: 'Production: transform, bundle, minify',
      body: [
        '`vite build` runs a pipeline. **Transform** strips TypeScript types and compiles JSX (with esbuild, very fast). **Bundle** follows the import graph into a few chunks (Rollup), dropping unused code. **Minify** removes whitespace and shortens names, and every file gets a content **hash** in its name.',
        '42 source files, 240 KB of readable code → one 58 KB file the browser can cache forever.',
      ],
      code: { lang: 'bash', file: 'Terminal', code: `$ vite build\n✓ 42 modules transformed.\ndist/assets/index-4f9c.js   58.1 kB │ gzip: 19.2 kB\n✓ built in 1.9s`, hl: [3] },
      metrics: { update: '—', size: 58 },
      scene: { nodes: { src, ...patch(build, { transform: { state: 'active' }, bundle: { state: 'active' }, minify: { state: 'active' } }) }, links: buildLinks, flows: [buildFlow()] },
    },
    {
      short: 'Minify',
      beat: 'technique',
      title: 'What minification and hashing actually do',
      body: [
        '[[minify|Minification]] rewrites code to be as short as possible while doing exactly the same thing: comments gone, `const formattedDueDate` becomes `const t`, whitespace removed. Then gzip/brotli compresses it further on the way out.',
        'The hash in the file name changes only when the content does, so browsers and CDNs can cache files with `max-age` of a year.',
      ],
      code: {
        file: 'before → after',
        lang: 'js',
        code: `// before: 212 bytes
export function dueLabel(dueDate, now = new Date()) {
  const days = Math.round((now - dueDate) / 86_400_000); // ms per day
  return days > 0 ? \`\${days} days overdue\` : 'on time';
}

// after: 96 bytes
export function d(e,t=new Date){const n=Math.round((t-e)/864e5);return n>0?\`\${n} days overdue\`:"on time"}`,
        hl: [8],
      },
      metrics: { update: '—', size: 58 },
      scene: { nodes: { src, ...patch(build, { minify: { state: 'active', badge: { text: '−60%', tone: 'ok' } } }) }, links: buildLinks, flows: [buildFlow()] },
    },
    {
      short: 'Env & modes',
      beat: 'technique',
      title: 'Environment variables are baked in at build time',
      body: [
        'In client code, `import.meta.env.VITE_API_URL` and `import.meta.env.MODE` are **replaced with their literal values** during the build. Dead branches like `if (import.meta.env.DEV)` disappear from production entirely.',
        'That’s why changing a front-end env var needs a rebuild — and why it must never hold a secret.',
      ],
      code: { file: 'api.ts', lang: 'ts', code: `const BASE = import.meta.env.VITE_API_URL;   // → "https://api.todo-app.com"\nif (import.meta.env.DEV) enableDebugPanel();  // removed from the production bundle`, hl: [1, 2] },
      metrics: { update: '—', size: 57 },
      scene: { nodes: { src, ...patch(build, { transform: { state: 'active', badge: { text: 'VITE_API_URL → "https://…"', tone: 'net' } } }) }, links: buildLinks, flows: [buildFlow()] },
    },
    {
      short: 'Source maps',
      beat: 'technique',
      title: 'Source maps: debugging minified code',
      body: [
        'An error in production points at `index-4f9c.js:1:48213` — useless. A [[source-map|source map]] (`.map` file) maps each position back to your original file and line, so DevTools and error trackers show `App.jsx:42`.',
        'Upload source maps to your error tracker rather than serving them publicly if you’d rather not publish your source.',
      ],
      check: {
        q: 'Your error tracker shows `TypeError at index-4f9c.js:1:48213`. What turns that into `TodoList.jsx:27`?',
        options: ['Turning off minification in production', 'A source map for that bundle', 'Running the dev server in production', 'Adding console.log everywhere'],
        answer: 1,
        explain: 'Source maps translate minified positions back to original files and lines — you keep the small bundle and get readable stack traces.',
      },
      metrics: { update: '—', size: 57 },
      scene: { nodes: { src, ...patch(build, { dist: { state: 'active' } }) }, links: buildLinks, flows: [buildFlow({ label: ['42 files', 'JS', '1 bundle', '+ .map'] })] },
    },
    {
      short: 'Inspect',
      beat: 'insight',
      title: 'Look inside your bundle',
      body: [
        'When the bundle grows, find out why before guessing: a visualiser (e.g. `rollup-plugin-visualizer`) draws every module by size. Often one heavy dependency — a full icon set, a date library with every locale — dwarfs your own code.',
        'Then import only what you use, swap the library, or split that feature into a lazy chunk.',
      ],
      metrics: { update: '—', size: 41 },
      scene: { nodes: { src, ...patch(build, { bundle: { state: 'active', badge: { text: 'moment.js = 60%!', tone: 'warn' } }, dist: { items: [item('j', 'index-4f9c.js  41 KB', { tone: 'ok', state: 'ok' }), item('m', 'index-4f9c.js.map', { tone: 'neutral' })] } }) }, links: buildLinks, flows: [buildFlow({ label: ['42 files', 'JS', 'lighter', '41 KB'] })] },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'What your build tool does for you',
      body: [
        '{net:Dev}: serve modules on demand and hot-swap edits in milliseconds, keeping state.',
        '{net:Build}: transform JSX/TS, bundle the import graph, tree-shake, minify, hash names, replace env vars, emit source maps.',
        'Measure the bundle, keep it lean, and remember: front-end env vars are public and fixed at build time.',
      ],
      metrics: { update: '50 ms', size: 41 },
      scene: { nodes: { src, dev, page, ...build }, links: [...devLinks, ...buildLinks], flows: [flow(['src', 'dev', 'page'], { kind: 'event', label: ['save', 'HMR'], every: 5.6 }), buildFlow({ offset: 1.5 })] },
    },
  ],
});
