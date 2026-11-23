# Unpacked — a visual course platform for full-stack development

> Every concept is an animated diagram you step through — from the browser, through the server, to the database and back.

First course: **MERN Full Stack, Unpacked**. The platform is course-agnostic, so System Design, DSA, Git, DevOps, etc. can be added later as pure content.

---

## 1. What we learned from the reference (designed-to-scale.vercel.app)

| What it does | Why it works | What we do |
|---|---|---|
| A lesson is an **ordered list of steps**; each step is pure data (story beat, text, callout, metrics, scene) | One renderer, unlimited lessons; authors write data, not UI | **Adopt** — same model, typed with TypeScript |
| Every step has a **story beat**: setup → problem → solution → technique → tradeoff → recap | Concepts arrive as answers to problems, which sticks | **Adopt** — beat tag + colour on every step |
| A **scene** = entities + links + animated packet flows, re-laid-out per step | You *see* the concept change, not just read about it | **Adopt**, plus richer node kinds (below) |
| **Metrics** per step (p95, errors…) and a **"what changed" diff** (+ added, ~ changed, − removed) | Makes cause and effect explicit | **Adopt** — metrics show deltas vs. the previous step |
| Play/Pause traffic, keyboard nav, resume, "next lesson" | Low friction | **Adopt** |
| No quizzes or code | Pure systems content | **Add**: code panels synced to the diagram, *predict-what-happens* checks, glossary tooltips |
| Network-shaped diagrams only | Fine for system design | **Add**: call stacks, queues, JSON documents, mock browser screens, code cards, zones (where code runs) |

Our visual identity is our own (see §4). We do not copy their palette, isometric art, or copy.

## 2. Product principles

1. **Visual first.** If a step can't be drawn, rethink the step. Text explains the picture, not the other way around.
2. **Problem before solution.** Every concept enters as the fix for a pain the learner just watched happen.
3. **One idea per step.** ~6–12 steps per lesson, 8–15 minutes.
4. **Show the real code.** For MERN, the snippet that causes the behaviour sits beside the diagram, with the active lines highlighted.
5. **Consistent visual language.** Colour = *where it runs*; packet colour = *what it is*. Learned once, reused in every lesson.
6. **Content is data.** Adding a lesson or a course never requires touching the engine.

## 3. Information architecture

```
/                         Home: hero (live diagram), course catalog, "continue where you left off"
/:course                  Course map: parts → lessons, progress, time
/:course/:lesson?s=N      Lesson player (step N, shareable)
/:course/glossary         All terms for the course
```

Hierarchy: **Course → Part (numbered, colour) → Lesson → Step**.

### Lesson anatomy

- **Cover** (step 0): title, summary, minutes, level, goals (each goal jumps to its step)
- **Steps**: beat tag · title · body (rich text with glossary terms) · callout · code · what changed · metrics · optional predict-check
- **Recap** (last step): key takeaways + next lesson card

### Lesson player layout

```
┌ ← Course / Part / Lesson        ▮▮▮▯▯▯▯ (segments = steps, coloured by beat)      ☾ ┐
├──────── Narrative ─────────┬──────────────────── Stage ────────────────────────────┤
│ PROBLEM · 3 / 9            │ legend                              ▶ traffic  1×      │
│ Title                      │                                                       │
│ Body…                      │                 animated diagram                      │
│ [callout]                  │                                                       │
│ code (active lines lit)    │                                                       │
│ What changed               │ metrics strip (value + delta)                         │
│ [◀ Back]  [Next: …  ▶]     │                                                       │
└────────────────────────────┴───────────────────────────────────────────────────────┘
```

Mobile: stage on top (pannable when it can't fit legibly), narrative below, sticky bottom nav.

Keyboard: `←/→` step · `Space` play/pause · `Home/End` · `?` shortcuts.

## 4. Visual language

**Fonts:** Bricolage Grotesque (display), Inter (UI/body), JetBrains Mono (code, labels).

**Role colours — where it runs** (same in every lesson, tuned for light and dark):

| Role | Use |
|---|---|
| `client` blue | Browser, React, anything on the user's device |
| `server` orange | Node, Express, anything on your server |
| `data` green | MongoDB, caches, storage |
| `net` violet | DNS, internet, CDNs, infra |
| `auth` rose | Tokens, passwords, security |
| `neutral` slate | Everything else |

**Packet kinds — what it is:** `req` request · `res` response · `data` payload/write · `err` error · `event` event/callback · `auth` token/credential.

**Story beats:** setup · problem · solution · technique · tradeoff · insight · recap, each with its own tag colour.

**Node states:** idle · active · busy (pulsing) · error (red, shake) · ok · dim · new.

## 5. Engine architecture

```
src/
  engine/      course-agnostic visual engine
    types.ts         Scene / Node / Link / Flow / Step / Lesson / Course types
    geometry.ts      node rects, link routing (straight / elbow), polyline sampling
    useSceneTween.ts tweens node layout between steps (enter / move / exit)
    Stage.tsx        world (fixed units) scaled to fit; zones → links → nodes → packets
    PacketLayer.tsx  requestAnimationFrame loop; packets ride links, pulse nodes on arrival
    nodes/           box, browser, db, actor, stack, queue, code, doc, chip, zone, note
  player/      lesson player UI (narrative, rail, metrics, code, checks, rich text)
  site/        pages (home, course map, glossary) and shell
  lib/         progress store, theme, syntax highlighting
  content/
    dsl.ts           tiny builders that keep lesson files readable
    registry.ts      discovers every course; loads each lesson on demand (one chunk per lesson)
    courses/<id>/course.ts + lessons/*.ts
```

- **Scenes are declarative.** Each step's scene is a complete snapshot. Nodes with the same `id` animate smoothly between steps; new ones fade in; removed ones fade out.
- **One source of geometry.** The tweened layout feeds nodes (HTML), links (SVG) and packets (SVG), so nothing drifts mid-animation.
- **Packets** follow a path of node ids, optionally return as another kind (`req` → `res`) along the same or a different path (`returnVia`), and pause at each hop to show processing. Their positions are a pure function of time, so pause, speed and replay are exact.
- **Auto-framing.** The camera fits the union of every step's nodes in a lesson, so the diagram is as large as possible and never jumps between steps.
- **QA.** `npm run qa` walks every step of every lesson in a headless browser and fails on overlapping nodes, clipped text, overflowing screens/lists, or console warnings (e.g. unknown glossary terms).

## 6. Adding content (extensibility)

- New lesson: add `content/courses/<course>/lessons/<id>.ts` and list its id in the part. Lessons that aren't written yet show as *Coming soon* automatically.
- New course: add `content/courses/<id>/course.ts`. The registry picks it up; the home catalog lists it.
- Glossary terms are per course; `[[term]]` in any text becomes a tooltip.
- See `docs/AUTHORING.md` for the step and scene reference.

## 7. Curriculum — MERN Full Stack, Unpacked

★ = written — all 54 lessons are complete.

**01 · How the Web Works** — ★ The MERN Map · ★ What Happens When You Visit a URL · ★ HTTP in Depth · ★ How Browsers Render a Page
**02 · JavaScript, Under the Hood** — ★ Values vs References · ★ Scope & Closures · ★ The Event Loop · ★ Promises & async/await · ★ Modules & Bundlers
**03 · React** — ★ Components & Props · ★ State & Re-rendering · ★ useEffect & the Lifecycle · ★ Lists & Keys · ★ Lifting State & Context · ★ Client-side Routing · ★ Fetching Data in React · ★ Performance & Memoization
**04 · Node & Express** — ★ The Node Runtime · ★ The Middleware Pipeline · ★ Designing a REST API · ★ Error Handling · ★ Validation · ★ Config & Secrets
**05 · MongoDB** — ★ Documents & Collections · ★ CRUD & Queries · ★ Embed vs Reference · ★ Indexes · ★ Mongoose Models · ★ The Aggregation Pipeline · ★ Transactions
**06 · Connecting the Stack** — ★ The Full Request Journey · ★ CORS · ★ Talking to Your API from React · ★ Real-time with WebSockets · ★ File Uploads
**07 · Auth & Security** — ★ Authentication vs Authorization · ★ Password Hashing · ★ Sessions vs Tokens · ★ JWT Auth End to End · ★ XSS, CSRF & Injection · ★ Protecting Routes
**08 · Shipping Software** — ★ Git: Snapshots & Branches · ★ Testing Pyramid · ★ Build Tools · ★ Deploying a MERN App · ★ CI/CD Pipelines · ★ Containers
**09 · Performance & Scale** — ★ Caching Layers · ★ Pagination · ★ Rate Limiting · ★ Logging & Monitoring
**10 · Build It** — ★ Design a Todo App · ★ Design a Shopping Cart · ★ Design a Chat App

## 8. Delivery plan (thin slices)

Each phase ships something usable end to end.

### Phase 0 — Vertical slice · ✅ shipped
- Vite + React + TypeScript scaffold, design tokens, light/dark theme
- Stage: box / browser / db / actor / zone nodes, links, packet flows, tween between steps
- Player: narrative panel, step navigation (buttons, keyboard, segmented progress)
- Lesson: **The MERN Map**
- *Done when:* you can step through the lesson with smooth transitions and live packets, in both themes

### Phase 1 — Player and site shell · ✅ shipped
- Home (hero with a live scene, catalog, continue card), course map, glossary page
- Progress + resume (localStorage), `?s=` step URLs, lesson cover with goals, recap + next lesson
- Metrics with deltas, "what changed", callouts, rich text + glossary tooltips, code panel with highlighted lines
- Responsive layouts, `prefers-reduced-motion`, focus states
- *Done when:* a new learner can land, pick a lesson, finish it, and come back to it later

### Phase 2 — Visual vocabulary for code · ✅ shipped
- Stack & queue nodes with push/pop animation, code cards, JSON documents, chips, mock browser screens
- Node states (busy pulse, error shake, ok), arrival pulses, packet labels
- Predict-what-happens checks
- Lessons: **The Event Loop**, **The Middleware Pipeline**, **State & Re-rendering**
- *Done when:* a lesson about code (not just boxes) reads as clearly as one about networks

### Phase 3 — Flagship content · ✅ shipped
- Lessons: **What Happens When You Visit a URL**, **Indexes**, **The Full Request Journey**, **CORS**, **JWT Auth End to End**
- *Done when:* the core MERN journey (browser → React → Express → MongoDB → auth) is covered visually

### Phase 4 — Grow · ✅ shipped (core); optional items below
- ✅ Batch 1: Embed vs Reference, useEffect, REST API design, Password Hashing, Git (+ `dot` node for graphs)
- ✅ Batch 2: Promises & async/await, Components & Props, Lists & Keys, Error Handling, Sessions vs Tokens, Deploying a MERN App
- ✅ Batch 3: Lifting State & Context, Fetching Data in React, Documents & Collections, CRUD & Queries, Mongoose Models, Validation
- ✅ Batches 4–8: the remaining 28 lessons — every lesson in the curriculum is written (54/54, 456 steps)
- ✅ ⌘K / `/` search across lessons and glossary terms, with keyboard navigation and glossary deep links
- ✅ Link-preview image (og.png), app icons and web manifest
- ✅ `npm run new:lesson` / `npm run new:course` scaffolding for future courses
- ✅ QA also checks list rows and sideways overflow in the narrative
- Optional, not started: accounts with server-synced progress (a small MERN backend), interactive sandboxes, per-step preview images, offline support, compact mobile layouts per lesson
- Future courses: System Design, Git, DSA, DevOps — each is a new folder under src/content/courses
- ✅ Engineering: lesson content and the player load on demand (main bundle 96 → 26 KB gzipped; each lesson is a 3–5 KB chunk, prefetched on hover); failed chunk downloads reload once, then show a retry screen
- Fill the rest of the curriculum
- Mobile: per-lesson compact layouts so diagrams fit narrow screens without panning
- `Ctrl/⌘ K` search across lessons and glossary
- Interactive sandboxes: edit a value and watch the diagram react (e.g. change an index, see the scan count change)
- Per-step OG images for sharing; PWA/offline
- Optional MERN backend for accounts and synced progress (dogfooding the course itself)
- More courses: System Design, Git, DSA, DevOps

## 9. Quality bar

- 60 fps animations; no layout jank between steps
- Readable in both themes (contrast-checked tokens)
- Every interactive control reachable by keyboard; motion respects `prefers-reduced-motion`
- `npm run build` type-checks all content: a broken scene is a compile error, not a blank stage
