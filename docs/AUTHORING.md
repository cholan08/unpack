# Authoring lessons and courses

Everything a learner sees is **data**. You never touch the engine to add content.

```
src/content/courses/<course-id>/course.ts         course, table of contents (with each lesson's catalog entry), glossary
src/content/courses/<course-id>/lessons/<id>.ts   one lesson's content per file — the file name is the lesson id
```

The registry discovers both automatically. A lesson listed in a part without a file shows as **Coming soon**.

**What loads when.** `course.ts` is part of the main bundle: it's all the home page and course map need. Each lesson file becomes its own small chunk, downloaded the first time someone opens (or hovers) that lesson. So keep anything shared between lessons in `src/content/dsl.ts` or the engine, never import one lesson file from another.

---

## Add a lesson in 5 steps

> Shortcut: `npm run new:lesson -- <course> <id>` writes a working 4-step skeleton for steps 2–4.

1. In `course.ts`, give the lesson's entry its catalog fields:
   ```ts
   { id: 'closures', title: 'Scope & Closures', minutes: 10, level: 'beginner',
     summary: 'One sentence that promises the payoff.' },
   ```
2. Create `lessons/closures.ts` (same name as the id) exporting `defineLesson({ goals, steps, … })`.
3. Sketch the story first: **setup → problem → solution → technique(s) → tradeoff → recap**, 7–12 steps, one idea per step.
4. Lay out one scene, then derive every step from it with `patch()` (see below).
5. Run `npm run dev`, step through the lesson in both themes, then run `npm run qa`. In development the console warns (and QA fails) if a written lesson's catalog entry is missing `summary`, `minutes` or `level`.

Use `mern-map.ts` as the simplest template, and `event-loop.ts` for stacks and queues.

## Lesson shape

```ts
// lessons/closures.ts — title, summary, minutes and level live in course.ts
export default defineLesson({
  metrics: [{ id: 'p95', label: 'p95 latency', unit: 'ms', better: 'lower' }],  // optional
  legend: { event: 'callback' },    // optional: rename packet kinds in the legend
  goals: [{ text: 'What a closure captures', step: 3 }],   // step is 1-based
  steps: [ /* … */ ],
});
```

## Step shape

```ts
{
  short: 'Hot spot',                       // label on the progress bar
  beat: 'problem',                         // setup | problem | solution | technique | tradeoff | insight | recap
  title: 'Three servers, one address',
  body: ['Paragraph with **bold**, `code`, [[glossary-key]] and {server:coloured text}.'],
  callout: { kind: 'warn', text: '…' },    // insight | warn | tip | mistake
  code: { file: 'server.js', lang: 'js', code: `…`, hl: [3, 4], err: [7] },
  changes: ['+ added', '~ changed', '- removed'],
  metrics: { p95: 1800 },                  // numbers show ↑/↓ vs the previous step; 'yes'/'no' are coloured
  check: { q: '…', options: ['…', '…'], answer: 1, explain: '…' },   // a "predict" question
  scene: { nodes, links, flows },
}
```

### Rich text

| Write | Get |
|---|---|
| `**bold**`, `*italic*` | emphasis |
| `` `code` `` | inline code |
| `[[cors]]` / `[[cors\|CORS rules]]` | glossary tooltip (the key must exist in the course glossary) |
| `{client:React}` | text in a role colour: `client server data net auth danger warn ok neutral` |

## Scenes

The world is **1000 × 600 units** (override with `stage: { w, h }`). Positions are node **centres**. The camera auto-fits the union of every step's nodes, so a scene never jumps.

### Nodes (from `@/content/dsl`)

| Builder | Use for |
|---|---|
| `box(x, y, label, { sub, icon, tone })` | a service, function, component, middleware |
| `browser(x, y, { url, screen, label })` | a mock browser; `screen` lines: `h text btn input item skeleton spinner error ok` |
| `db(x, y, label, { items })` | a database (items = collections) |
| `actor(x, y, label)` | a person |
| `stack(x, y, label, items, { from })` | call stacks (`from: 'bottom'`) and logs (`from: 'top'`); items animate in and out |
| `queue(x, y, label, items)` | horizontal queues |
| `code(x, y, src, { file, lang, hl, err })` | code on the stage itself |
| `doc(x, y, label, fields)` | a JSON document; `field(k, v, { hl, indent })` — an empty `k` gives a bare array item |
| `chip(x, y, label, { icon, tone })` | small pills: routes, tokens, labels |
| `dot(x, y, label, { sub, caption })` | graph vertices — git commits, timeline points; caption `'below'` (default) or `'above'` |
| `zone(x, y, w, h, label, { tone })` | a background region: *where this runs* |
| `note(x, y, text)` | a free-floating annotation |

Common options: `tone`, `state` (`idle active busy error ok dim ghost`), `badge: { text, tone }`, `meter` (0–1 load bar), `w`, `h`, `z`.

**Icons:** see `src/engine/icons.ts` (e.g. `react node mongo express server db user key shield lock cookie bolt globe`).

### Links

`link(from, to, { route, bend, style, state, label, tone, arrow })`

- `route`: `straight` (default; snaps level when boxes share a band), `hv`, `vh`, `hvh`, `vhv`, `over`, `under`, `left`, `right`
- `state`: `active` (marching dashes), `error`, `off`
- `style: 'dashed'` for "possible" or "return" paths

### Flows (the moving packets)

```ts
flow(['web', 'srv', 'mongo'], {
  kind: 'req',                          // req | res | data | err | event | auth
  label: ['GET /api/todos', 'find()'],  // one label, or one per hop
  back: 'res',                          // come back as this kind…
  returnVia: ['mongo', 'srv', 'web'],   // …along this path (default: the same path reversed)
  backLabel: ['3 docs', '200 OK'],
  every: 4.6,                           // seconds between packets
  offset: 0.8,                          // delay, to sequence several flows
  dwell: 0.18,                          // pause at each hop ("processing")
  speed: 1,
  fail: true,                           // rejected at the last node: red burst, no return
})
```

Packets follow existing links (in either direction) and pulse each node they reach.

### Build steps from one layout

```ts
const base = { zc, you, web, srv };
// step 4: same nodes, server turns red with a badge
nodes: patch(base, { srv: { state: 'error', badge: { text: 'restarted', tone: 'danger' } } })
// add a node / remove one
nodes: patch(base, { mongo: db(830, 345, 'MongoDB'), you: null })
```

Nodes that keep their id **animate** between steps, so moving a node is how you show "reordering". `patch(base, { json: { y: 395 } })` slides the JSON parser below the route.

## Visual language (keep it consistent)

- **Tone = where it runs:** `client` blue (browser/React) · `server` orange (Node/Express) · `data` green (MongoDB) · `net` violet (network/infra) · `auth` rose (security).
- **Packet kind = what travels:** request blue · response green · data amber · event violet · token rose · error red.
- One **problem** step before every **solution**. End with a **recap** whose body uses tone-coloured keywords.
- Prefer real, runnable code. Highlight only the 1–4 lines that matter.
- Add a **predict** `check` once per lesson, at the moment before the reveal.

## Add a course

> Shortcut: `npm run new:course -- <id> "Title"` creates the folder and a starter `course.ts`.

1. `src/content/courses/<id>/course.ts`, exporting `defineCourse({ id, title, short, tagline, description, tone, parts, glossary, hero? })` — `hero: { lesson, steps }` picks the scenes the home page cycles through.
2. Add lessons as above. The home page catalog and the header pick it up automatically.
3. Remove it from the "Coming later" list in `src/site/HomePage.tsx`.

## Quality checklist

- [ ] `npm run build` passes (types catch broken scenes)
- [ ] `npm run qa` reports 0 issues (overlaps, clipped text, overflow, console warnings)
- [ ] Stepped through in light **and** dark
- [ ] Every `[[term]]` exists in the glossary (QA reports unknown ones)
- [ ] Each step teaches one idea; the diagram changes in a way that shows it
