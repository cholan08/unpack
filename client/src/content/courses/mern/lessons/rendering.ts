import { box, browser, chip, defineLesson, flow, link, patch } from '@/content/dsl';
import type { LinkSpec, NodeSpec } from '@/engine/types';

/* ---------- layout: the rendering pipeline, left to right, with the screen at the end ---------- */
const stage = (x: number, y: number, label: string, sub: string, w = 128): NodeSpec => box(x, y, label, { sub, tone: 'client', w });
const nodes: Record<string, NodeSpec> = {
  html: chip(78, 190, 'HTML', { tone: 'client', icon: 'file', w: 92 }),
  css: chip(78, 410, 'CSS', { tone: 'client', icon: 'file', w: 92 }),
  dom: stage(235, 190, 'DOM', 'element tree', 130),
  cssom: stage(235, 410, 'CSSOM', 'style rules', 130),
  rtree: stage(410, 300, 'Render tree', 'visible + styled', 146),
  layout: stage(575, 300, 'Layout', 'geometry', 136),
  paint: stage(730, 300, 'Paint', 'pixels', 120),
  comp: stage(880, 300, 'Composite', 'layers', 134),
  screen: browser(880, 482, { w: 190, h: 120, url: 'todo-app.com', screen: [{ t: 'h', text: 'My todos' }, { t: 'item', text: 'Buy milk' }] }),
};
const blankScreen = browser(880, 482, { w: 190, h: 120, url: 'todo-app.com', screen: [], state: 'error' });
const links: LinkSpec[] = [
  link('html', 'dom'),
  link('css', 'cssom'),
  link('dom', 'rtree'),
  link('cssom', 'rtree'),
  link('rtree', 'layout'),
  link('layout', 'paint'),
  link('paint', 'comp'),
  link('comp', 'screen'),
];
const pipeline = (o: Parameters<typeof flow>[1] = {}) => [
  flow(['html', 'dom', 'rtree', 'layout', 'paint', 'comp', 'screen'], { kind: 'data', every: 6, dwell: 0.25, ...o }),
  flow(['css', 'cssom', 'rtree'], { kind: 'data', every: 6, dwell: 0.25, offset: 0.2, ...o }),
];
const only = (on: string[], extra: Record<string, Partial<NodeSpec>> = {}) =>
  patch(
    nodes,
    Object.fromEntries(
      ['dom', 'cssom', 'rtree', 'layout', 'paint', 'comp'].map((id) => [id, { state: on.includes(id) ? 'active' : 'dim', ...(extra[id] ?? {}) }]),
    ),
  );

export default defineLesson({
  metrics: [
    { id: 'stages', label: 'Pipeline stages re-run', better: 'lower' },
    { id: 'frame', label: 'Frame budget used', unit: '%', better: 'lower' },
  ],
  legend: { data: 'page data', req: 'download' },
  goals: [
    { text: 'The steps from HTML to pixels', step: 1 },
    { text: 'Why scripts can block the page', step: 3 },
    { text: 'Why CSS delays the first paint', step: 4 },
    { text: 'Cheap vs expensive changes', step: 5 },
    { text: 'Layout thrashing', step: 6 },
  ],
  steps: [
    {
      short: 'The pipeline',
      beat: 'setup',
      title: 'From bytes to pixels',
      body: [
        'When HTML arrives, the browser runs a pipeline: parse HTML into the [[dom|DOM]], parse CSS into the CSSOM, combine them into the [[render-tree|render tree]], work out geometry ([[layout]]), fill in pixels ([[paint]]), and stack the layers onto the screen ([[composite|composite]]).',
        'Everything that makes pages feel fast or slow is about which of these steps run, and how often.',
      ],
      metrics: { stages: 6, frame: 0 },
      scene: { nodes, links, flows: pipeline() },
    },
    {
      short: 'HTML → DOM',
      beat: 'technique',
      title: 'Parsing HTML into the DOM',
      body: [
        'The parser reads HTML top to bottom and builds a tree of element objects — the DOM. It’s the live structure JavaScript (and React) reads and changes.',
        'The parser works **incrementally**: it can start building before the whole file has arrived, which is why the first HTML bytes matter so much.',
      ],
      code: {
        file: 'index.html',
        lang: 'markup',
        code: `<html>
  <head><link rel="stylesheet" href="/app.css"></head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
        hl: [4],
      },
      metrics: { stages: 1, frame: 0 },
      scene: { nodes: only(['dom'], { dom: { badge: { text: 'growing…', tone: 'client' } } }), links, flows: [flow(['html', 'dom'], { kind: 'data', label: 'tokens → nodes', every: 3 })] },
    },
    {
      short: 'Blocking JS',
      beat: 'problem',
      title: 'A plain <script> stops the parser',
      body: [
        'When the parser meets `<script src="app.js">`, it **stops**: the script might change the document, so it must be downloaded and run first. Put it in the `<head>` and the user stares at a blank page while it downloads.',
        'The fix is one attribute: `defer` (or `type="module"`, which defers by default) downloads in parallel and runs after parsing finishes. Vite’s build output already does this.',
      ],
      code: {
        file: 'index.html',
        lang: 'markup',
        code: `<script src="/app.js"></script>               <!-- ❌ blocks parsing -->
<script src="/app.js" defer></script>         <!-- ✅ runs after parsing -->
<script type="module" src="/app.js"></script> <!-- ✅ deferred by default -->`,
        err: [1],
        hl: [2, 3],
      },
      metrics: { stages: 1, frame: 0 },
      scene: {
        nodes: {
          ...only([], { dom: { state: 'error', badge: { text: 'paused at <script>', tone: 'danger' } } }),
          js: chip(235, 70, 'app.js · 180 KB', { tone: 'warn', icon: 'file', w: 160, state: 'busy' }),
          screen: blankScreen,
        },
        links: [...links, link('js', 'dom', { style: 'dashed' })],
        flows: [flow(['js', 'dom'], { kind: 'req', label: 'downloading…', every: 4, speed: 0.35 })],
      },
    },
    {
      short: 'Blocking CSS',
      beat: 'technique',
      title: 'CSS holds back the first paint',
      body: [
        'The browser won’t paint until it has the CSS: painting unstyled content and then restyling it would flash. So stylesheets are **render-blocking** — a large or slow CSS file delays the first pixel.',
        'Keep CSS lean, serve it from a CDN, and let the bundler split styles per route so each page only waits for what it needs.',
      ],
      metrics: { stages: 2, frame: 0 },
      scene: {
        nodes: only(['cssom'], { cssom: { state: 'busy', badge: { text: 'waiting for app.css', tone: 'warn' } }, rtree: { badge: { text: 'blocked', tone: 'warn' } } }),
        links,
        flows: [flow(['css', 'cssom'], { kind: 'req', label: 'app.css', every: 3.4, speed: 0.5 })],
      },
    },
    {
      short: 'Cheap vs costly',
      beat: 'technique',
      title: 'Some changes are cheap, some redo everything',
      body: [
        'After the first paint, every change re-runs part of the pipeline. Change a `width` or add an element and the browser must redo **layout**, then paint, then composite. Change a colour: paint and composite.',
        'Change only `transform` or `opacity` and it can skip straight to **compositing** — often on the GPU. That’s why smooth animations move things with `transform`, never with `left`/`top`.',
      ],
      check: {
        q: 'You animate a card sliding in. Which property keeps the animation smooth?',
        options: ['`left`', '`margin-left`', '`transform: translateX()`', '`width`'],
        answer: 2,
        explain: '`left`, `margin-left` and `width` change geometry, forcing layout and paint every frame. `transform` only needs compositing.',
      },
      metrics: { stages: 1, frame: 8 },
      scene: {
        nodes: only(['comp'], { comp: { badge: { text: 'transform: only this', tone: 'ok' }, state: 'ok' }, layout: { badge: { text: 'skipped', tone: 'neutral' } }, paint: { badge: { text: 'skipped', tone: 'neutral' } } }),
        links,
        flows: [flow(['comp', 'screen'], { kind: 'data', label: '60 fps', every: 1.2 })],
      },
    },
    {
      short: 'Thrashing',
      beat: 'problem',
      title: 'Layout thrashing: read, write, read, write…',
      body: [
        'Browsers batch layout work — until your code **reads** a geometry value (`offsetHeight`, `getBoundingClientRect`) right after **writing** a style. To answer truthfully, the browser must run layout immediately.',
        'Do that in a loop and you force a layout per item: hundreds of layouts in one frame. That’s [[layout-thrashing|layout thrashing]]. Read everything first, then write.',
      ],
      code: {
        file: 'resize.js',
        lang: 'js',
        code: `// ❌ forces a layout on every iteration
for (const el of items) {
  el.style.height = el.offsetHeight + 10 + 'px'; // read → write → read…
}

// ✅ read all, then write all
const heights = items.map((el) => el.offsetHeight);
items.forEach((el, i) => (el.style.height = heights[i] + 10 + 'px'));`,
        err: [3],
        hl: [7, 8],
      },
      metrics: { stages: 300, frame: 420 },
      scene: {
        nodes: only(['layout'], { layout: { state: 'error', badge: { text: '× 300 this frame', tone: 'danger' } } }),
        links,
        flows: [flow(['layout', 'paint'], { kind: 'err', label: 'layout again', every: 0.8, speed: 2 })],
      },
    },
    {
      short: 'React',
      beat: 'insight',
      title: 'Where React fits in',
      body: [
        'React’s job ends at the DOM: it computes the minimal changes and commits them in one batch. The browser then runs style, layout and paint for what changed — so fewer, batched DOM changes mean less pipeline work.',
        'One consequence of client-side apps: until the JS bundle downloads and runs, the DOM is just an empty `#root`. Server rendering (SSR) or static generation sends real HTML first, so the pipeline can paint sooner.',
      ],
      metrics: { stages: 4, frame: 20 },
      scene: {
        nodes: { ...only(['layout', 'paint', 'comp']), react: chip(235, 70, 'React commit', { tone: 'client', icon: 'react', w: 150, state: 'active' }) },
        links: [...links, link('react', 'dom', { style: 'dashed' })],
        flows: [flow(['react', 'dom', 'rtree', 'layout', 'paint', 'comp', 'screen'], { kind: 'data', label: '+1 <li>', every: 5, dwell: 0.2 })],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'The rendering pipeline',
      body: [
        '{client:HTML → DOM} and {client:CSS → CSSOM} combine into the render tree; then {warn:layout}, {warn:paint}, {ok:composite}.',
        'Defer your scripts, keep CSS small, and know your costs: geometry changes redo layout; `transform`/`opacity` only composite.',
        'Batch DOM reads before writes. React already batches its writes for you.',
      ],
      metrics: { stages: 6, frame: 0 },
      scene: { nodes, links, flows: pipeline() },
    },
  ],
});
