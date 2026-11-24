# Authoring lessons and courses

> **Paths:** the front end lives in `client/`, so every `src/…` path below means `client/src/…`. Run the `npm run …` commands from the repo root.

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
   Every lesson also belongs to one **main topic** (`pillar`): `frontend`, `backend`, `database`, `devops` or `aiml`, or `start` (the way in) / `projects` (work across the whole stack). The list lives in `src/content/pillars.ts`. If every lesson in the part shares a topic, the part sets `pillar` once. If the part mixes topics, each lesson sets its own. Pick the topic by where the lesson's main idea runs, the same rule as the diagram colours. In development the console warns (and QA fails) when a lesson has no topic, or has one on both the lesson and its part.

   Add `needs: ['event-loop', 'http']` with the ids of the lessons (from any part) this one directly builds on. The roadmap graph draws them as "builds on" threads: hovering a lesson lights up everything it needs (blue) and what it unlocks (teal). List only direct prerequisites. The graph follows the chain itself. In development the console warns when an id in `needs` isn't a lesson.
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
  beat: 'problem',                         // setup | problem | solution | technique | tradeoff | insight | try | recap
  title: 'Three servers, one address',
  body: ['Paragraph with **bold**, `code`, [[glossary-key]] and {server:coloured text}.'],
  callout: { kind: 'warn', text: '…' },    // insight | warn | tip | mistake | picture (an everyday analogy to remember it by)
  code: { file: 'server.js', lang: 'js', code: `…`, hl: [3, 4], err: [7] },
  changes: ['+ added', '~ changed', '- removed'],
  metrics: { p95: 1800 },                  // numbers show ↑/↓ vs the previous step; 'yes'/'no' are coloured
  check: { q: '…', options: ['…', '…'], answer: 1, explain: '…' },   // a "predict" question
  practice: practice(                      // optional interactive "Try it" code practice beside diagram
    'Prompt description',
    `function starter() { ... }`,
    `function solution() { ... }`,
    [{ label: 'returns true', run: 'starter() === true' }],
    ['Hint 1', 'Hint 2']
  ),
  scene: { nodes, links, flows },          // …or `sandbox` instead (see below)
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

## Interactive sandboxes ("Try it" steps)

A step can carry a **sandbox** instead of a fixed `scene`: a few controls, and a `compute` function that turns their values into the scene, the metrics and a one-line outcome. The learner drags a slider and the diagram, the metrics (with ↑/↓ against the previous setting) and the note all react.

```ts
import { defineSandbox, fmt, humanTime, range, toggle, choice } from '@/content/dsl';

const sandbox = defineSandbox({
  intro: 'Drag the collection size and flip the index on and off.',
  controls: [
    range('docs', 'Todos in the collection', { min: 1000, max: 100_000_000, value: 10_000_000, log: true, format: fmt }),
    toggle('indexed', 'Index on userId'),                       // default off
    choice('mode', 'Paging style', [['offset', 'skip / limit'], ['cursor', 'cursor']]),
  ],
  compute: (v) => ({
    scene: { nodes, links, flows },                             // build from the same layout as the other steps
    metrics: { examined: v.indexed ? 2 : Number(v.docs) },      // the lesson's metric ids
    note: 'IXSCAN: still about **1 ms**.',                      // rich text, shown under the controls
    tone: 'ok',                                                 // ok | warn | danger | neutral — colours the note
  }),
});

// in steps, just before the recap:
{ short: 'Try it', beat: 'try', title: 'Grow the data, flip the index', body: ['…'], sandbox },
```

- **Controls:** `range` (`min`, `max`, `value`, optional `step`, `unit`, `format`; `log: true` for ranges spanning orders of magnitude — the slider rounds to 2 significant digits), `toggle`, `choice` (2–4 short options). Two to four controls is the sweet spot.
- **`compute` must be pure and cheap** — it runs on every slider tick. Derive everything from the values; reuse the lesson's node builders so the sandbox scene animates from the step before it.
- **Keep it honest:** use the same model as the lesson's prose (if step 2 says 2,140 ms for 10 M docs, the sandbox should too). State assumptions in a `callout`.
- **Make the outcome readable:** the note should name the cause ("`skip(49,980)` walks over…"), not just the number. Use `tone` to flag bad outcomes, and `humanTime(seconds)`, `fmt(n)` and `approx(n)` for numbers.
- Mark the lesson `interactive: true` in `course.ts` so its card shows the **Try it** pill (in dev, a console warning reminds you).
- The camera frames every scene the sandbox can produce (each control at its extremes), and `npm run qa` drives every control to its min/max/each option and checks each resulting layout — so clipped labels at extreme values are caught.
- The learner's values are kept per step while they move around the lesson; **Reset** returns to the defaults.

## Visual language (keep it consistent)

- **Tone = where it runs:** `client` blue (browser/React) · `server` orange (Node/Express) · `data` green (MongoDB) · `net` violet (network/infra) · `auth` rose (security).
- **Packet kind = what travels:** request blue · response green · data amber · event violet · token rose · error red.
- One **problem** step before every **solution**. End with a **recap** whose body uses tone-coloured keywords.
- Prefer real, runnable code. Highlight only the 1–4 lines that matter.
- Add a **predict** `check` once per lesson, at the moment before the reveal.

## Add a course

> Shortcut: `npm run new:course -- <id> "Title"` creates the folder and a starter `course.ts`.

1. `src/content/courses/<id>/course.ts`, exporting `defineCourse({ id, title, short, tagline, description, tone, parts, glossary, hero? })` — `hero: { lesson, steps }` picks the scenes the home page cycles through. Give each part an `icon` (a name from `src/engine/icons.ts`) for its hub on the roadmap graph, and `why` / `outcomes` for the roadmap's part panel. The graph lays itself out from `course.ts`; `npm run qa` checks its labels at three screen sizes.
2. Add lessons as above. The home page catalog, the sidebar and the topic pages pick it up automatically.
3. Remove it from the "Coming later" list in `src/site/HomePage.tsx`.

## Add a handwritten notebook

Notebooks (`/notebooks`) are exam-style study notes drawn as handwriting on ruled paper, one notebook per subject. They are pure data: the renderer draws the paper, ink, boxes, tables and diagrams. A notebook starts as a **template** (a cover plus an outline of every page) and gets its notes one page at a time.

> Shortcut: `npm run new:notebook -- graphql "GraphQL" "GraphQL APIs" backend` creates the folder and a template `notebook.ts`. The last argument is the topic.

```
src/content/notebooks/<book-id>/
  notebook.ts          cover + ordered page list (loaded up front)
  pages/<page-id>.ts   one page each (loaded on demand)
```

1. `notebook.ts` exports `defineNotebook({ id, title, name, tagline, color, pillar, order?, cover, pages })`. `id` must match the folder. `pillar` is the main topic it is filed under on the shelf (the same ids as lessons, from `src/content/pillars.ts`), and `order` sets its place within that topic. Page 1 is always the cover; it lists the pages as Key Topics and counts them automatically.
2. List the pages with `pg(id, title, ...outline)`: the outline is the sections the page will cover. End with `revision(...differences)`, the standard "Quick Revision & Interview Questions" page.
3. **Template first, notes later.** A page with no `pages/<id>.ts` file is drawn from its outline: the same header, the planned sections in their boxes and ruled space under each, with an "Outline page" note. Write `pages/<id>.ts` to replace it with real notes. The shelf shows each notebook as *Outline*, *n/m written* or *Complete*. A file that isn't listed triggers a dev warning.
4. **Cover art comes from words.** `iconArt(doodle, label)` (top left), `flowArt([4 steps])` (top right), `codeArt([lines], title)` (left) and `hubArt(centre, [4 labels], shape)` (middle) generate the doodles. Doodles: `db` `pc` `server` `laptop` `user` `cloud`. Keep flow steps under ~16 characters, code lines under ~24 and hub labels under ~12 per line (`'Business\nlogic'`). The big cover title shrinks to fit, so `'SYSTEM DESIGN'` is fine.
5. The shelf and the reader pick the notebook up automatically, with no routes or menu to edit.

**A page** is a list of rows. Each row is either two columns of sections or one full-width section. Sections number themselves in reading order (left column, then right).

```ts
import { definePage, exam, full, row, sec, table, ul } from '../../dsl';

export default definePage({
  rows: [
    row(sec('What is a Process ?', ul('A __program in execution__.', 'Has its own **memory**.')), sec('States', /* … */)),
    full(exam('Point one for the exam.', 'Point two.')),
  ],
  quote: 'One line to remember this page by.',
});
```

**Ink markup** in any text: `__underline__` · `**bold ink**` · `==highlighter==` · `` `code` `` · `σ_{sub}` · `x^{sup}`.

**Building blocks** (all from `@/content/notebooks/dsl`):

| Block | Draws |
| --- | --- |
| `ul` `stars` `checks` `arrows` `nums` `circles` `ul2` `stars2` | bullet lists (`li(text, ...sub)` for nested points) |
| `pairs(['Term', 'meaning'], …)` | aligned term – meaning rows |
| `table(head, rows)` / `mini(title, head, rows)` | ruled comparison table / small example table |
| `code(src, label?, tone?)` | hand-copied code in a box; indent it with the source, the common indent is removed |
| `tag` `box` `toneBox` `note` | highlighter label, framed fact, dashed ★ call-out |
| `sub(title, …)` `cols([…], […])` | "(1) Sub-heading" groups, side-by-side blocks |
| `cards({ label, sub, tone, points }…)` | colour-keyed boxes (normal forms, states) |
| `ops(tbl(spec(…)), op('σ_{Age>20}'), tbl(…))` | table → operation → table |
| `venn('inner' \| 'left' \| 'right' \| 'full' \| 'none')` | join / set diagrams |
| `sketch({ w, h, nodes, edges }, caption?)` | any hand-drawn diagram (below) |
| `exam(...points)` | the starred "Important Points (Exam)" section |

**Sketches**: nodes are placed by their **centre** (`x`, `y`) in the sketch's own units. Shapes: `box` `box2` `diamond` `diamond2` `oval` `oval2` `ovalDash` `circle` `pill` `note` `db` `cloud` `pc` `server` `laptop` `user` `text` `point`. Boxes take an `icon` (`pc` `server` `db` `user` `laptop`), and `key: true` underlines a label. Edges run between node ids and clip to the shape outline automatically. Options: `arrow: 'to' | 'from' | 'both' | 'none'`, `dash`, `double` (total participation), `curve`, `via`, `label` (nudge it with `lx` / `ly`). Keep `w` ≤ ~480 for a half-width column and ≤ ~700 for a full-width one. Colours (`tone`) come from the theme, so dark mode works on its own.

**House style**: write the notes in your own words, keep bullets short, underline the 1–3 words a student must remember, use one shared example table across a page, and end every page with an exam section and a one-line quote. Check each page in light and dark and at phone width; the sheet must never scroll sideways.

## Quality checklist

- [ ] `npm run build` passes (types catch broken scenes)
- [ ] `npm run qa` reports 0 issues (overlaps, clipped text, overflow, console warnings)
- [ ] Stepped through in light **and** dark
- [ ] Every `[[term]]` exists in the glossary (QA reports unknown ones)
- [ ] Each step teaches one idea; the diagram changes in a way that shows it
- [ ] A sandbox's note explains *why* the number changed, and every control visibly changes the diagram
