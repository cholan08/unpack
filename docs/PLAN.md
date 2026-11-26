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
/                         Home: the pitch (new learners) or the continue card (returning), then the three doors
                          into the Manual — Explore, Build, Path (docs/VISION.md §4)
/explore /build /path     The three doors: a curiosity feed · "I want to build ___" → its chapters · the guided route
/:course                  Course map: parts → lessons, progress, time
/:course/:lesson?s=N      Lesson player (step N, shareable)
/:course/glossary         All terms for the course
```

Hierarchy: **Course → Part (numbered, colour) → Lesson → Step**.

### App shell

Every page except the lesson player sits in one shell (`src/site/AppShell.tsx`, a layout route in `App.tsx`; pages render only their own `<main>`):

- **Wide screens (≥1080px): a sidebar**, always visible and short on purpose. From the top: search · the *one thing to do next* (Continue / Up next / "New here? Start from zero" → the Path) · Home · **The Manual** (All chapters, Explore, Build) · **Your path** (Path, Dashboard, Review with a due badge, My notes) · **The shelf** (Library — course map, roadmap, glossary, Techpack, Skill Pack, notebooks, common errors and the topic pages). *(Until M3 the topics had their own sidebar group; they are a filter now — docs/VISION.md §7.)*
- **Narrow screens: a top bar** (menu, logo, search, theme); the same sidebar slides in as a drawer.
- The lesson player stays full screen: it is where attention belongs.
- Shared progress views (topic stats, "continue" target) live in `src/site/learner.ts`; small shared pieces (logo, progress ring, page header) in `src/site/ui.tsx`.

### Main topics (pillars)

Everything on the site belongs to one of five main topics: **Frontend · Backend · Database · DevOps · AI/ML**. Two more labels cover the way in (**Start Here**) and the way out (**Projects**, which use the stack end to end). Each topic uses the role colour the diagrams already use: Frontend `client` blue, Backend `server` orange, Database `data` green, DevOps `net` violet, AI/ML `ai` fuchsia (a new role colour for models, inference and embeddings).

**AI/ML** (`aiml`, page `/aiml`, added 2026-11-24) has no lessons yet: its page, sidebar entry and home card say “Coming soon”. To fill it, give lessons (or a whole part) `pillar: 'aiml'` in `course.ts`; everything else picks them up. A new topic is one entry in `src/content/pillars.ts`, one id in `PillarId`, and an icon in `PILLAR_ICON` (`AppShell.tsx`).

This is a **label, not a reshape**. Parts, lessons, URLs, gates and saved progress stay as they are. Each lesson gets a `pillar` (set once on the part when every lesson in it shares one). Topic pages are a second view that groups everything by that label. Learners still follow a path that moves between topics (see the Roadmap), because you can't finish Frontend before you have an API to call.

| Topic | Lessons | From parts |
|---|---|---|
| Start Here | 3 | 01 (MERN Map, Visit a URL, HTTP) |
| Frontend | 17 | 02 JavaScript, 03 React, + Browser Rendering, Talking to Your API, Protecting Routes, Build Tools |
| Backend | 15 | 04 Node & Express, + CORS, WebSockets, Uploads, Auth & Security (5), Rate Limiting |
| Database | 9 | 05 MongoDB, + Caching, Pagination |
| DevOps | 6 | Git, Testing, Deploying, CI/CD, Containers, Observability |
| AI/ML | 0 | — (coming soon) |
| Projects | 4 | Full Request Journey, 10 Build It (3) |

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

**Design direction — "Studio":** a calm, neutral canvas so the diagrams carry the colour. Colour is meaning (role colours), never decoration; chrome recedes. One look across every page, light and dark.

**Fonts:** Bricolage Grotesque (headings), Inter (UI/body), JetBrains Mono (code, numbers, labels). Handwriting (Caveat, Kalam) appears only where it *is* the content: Notebooks and the Handnote notepad.

**Tokens and primitives:** `src/styles/tokens.css` (colours, radii, shadows, layout sizes — the engine reads the same names) and `src/styles/base.css` (buttons, pills, badges, fields, cards, progress bars, segmented controls, page header, stats). Feature CSS keeps its own class prefix (CSS is global).

**Stage objects — "paper blocks on a desk"** (Phase V). Diagrams should look like physical things you could pick up, because concrete objects are easier to remember than wireframes:
- Every object (box, browser, stack/queue, code, doc, chip, dot, actor, db) is a **paper block**: a light face with a 2px ink outline, in both themes (`.paper` in `tokens.css` gives objects the light palette).
- Each block has **sides extruded down-right**, hatched in its role colour, with a darker right side and an ink crease (`nodes/Depth.tsx`, sizes in `depthOf()` in `geometry.ts`). The sides sit in their own layer *under* the links, so arrows land on faces. A db is a paper cylinder with a hatched rim; an actor is a coin.
- Zones are **raised platforms** with hatched sides and a solid name plate (CLIENT, SERVER…).
- The **desk** (`--desk`, `--desk-grid`) is an isometric grid; links are ink wires (`--wire`) with an origin ring and a solid head; packets glow.
- States are physical: *active* rises off the desk with a halo, *busy* bobs, *error* turns red and shakes, *ghost* is a dashed outline with no paper.
- Under the stage, **"In this lesson"** lists every step as a numbered stop with its `short` label, coloured by beat, so the story arc is always in view (wide screens; phones keep the segment bar).
- A `picture` callout ("Picture it") gives an everyday analogy to remember a step by.

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
- ✅ Interactive sandboxes — "Try it" steps where sliders, switches and options drive the diagram, the metrics and an outcome note live. Eight lessons have one: Indexes (collection size × index), What Happens When You Visit a URL (distance, server time, CDN, return visit), Promises (await × 3 vs Promise.all vs allSettled, slow and failing calls), Password Hashing (SHA-256 vs bcrypt cost vs password strength), Pagination (offset vs cursor, deep pages, new items), Caching (TTL × traffic × freshness), Performance & Memoization (memo, useCallback, virtualization), Rate Limiting (limit, bot speed, servers, shared counters). QA drives every control to its extremes.

### Phases A–F: From "Watch" to "Can Build Alone" · ✅ shipped
- ✅ **Phase A — Orientation**: `/start` prerequisite checks, placement quiz with skippable recommendations, `/:course/roadmap` visual path with `why` and `outcomes` for all 10 parts, home hero primary CTA.
- ✅ **Phase B — Practice**: Code beside diagram `try` steps with CodeEditor, Web Worker sandbox runner with timeout protection, hint ladder, and integrated practice across core lessons.
- ✅ **Phase C — Proof**: Per-part Gates with comprehensive MCQs and coding challenges (`src/content/courses/mern/gates/*.ts`), and `/me` learner dashboard tracking streaks, gates passed, and weak topics.
- ✅ **Phase D — AI Tutor**: Dogfooding Express backend (`server/`) with rate/size limiting and zero-leak key proxying, Socratic hint ladder (nudge → diagram → scaffold → solution), explain-back grading, and privacy-preserving settings.
- ✅ **Phase E — Capstone: TaskFlow**: 10 milestone curriculum (`src/content/courses/mern/capstone.ts`), starter repo (`capstone/starter/`), reference solutions (`capstone/solutions/`), and interactive checklist UI (`/capstone`).
- ✅ **Phase F — Retention & Independence**: Spaced review cards (`/review`) with 1/3/7/21 day scheduling, Common Errors glossary (`/errors`), and No-AI practice mode.
- ✅ **Phase G — AI Mentor**: one persistent mentor docked on every page (lesson player included; `Ctrl/⌘ J`). Each question carries a fresh, browser-built summary of the learner's progress (streak, current lesson, due reviews, gate weak spots, explain-backs that needed work, every lesson's status) plus the page and step on screen, so advice is specific and the mentor can link to the right lesson. Chat history lives in localStorage. Bring-your-own key (xAI Grok `grok-4.7` or Anthropic Claude, detected from the key prefix) through the existing proxy (`mode: "mentor"` on `POST /api/tutor`, providers in `server/provider.mjs`); hidden in No-AI mode. Keeps the integrity rule: no full gate/capstone solutions without an attempt. Code: `client/src/site/MentorDock.tsx`, `client/src/lib/mentor.ts`, `client/src/site/mentorProfile.ts`.
- Optional, not started: accounts with server-synced progress (a small MERN backend), per-step preview images, offline support, compact mobile layouts per lesson
- Future courses: System Design, Git, DSA, DevOps — each is a new folder under src/content/courses
- ✅ Engineering: lesson content and the player load on demand (main bundle 96 → 26 KB gzipped; each lesson is a 3–5 KB chunk, prefetched on hover); failed chunk downloads reload once, then show a retry screen
- Fill the rest of the curriculum
- Mobile: per-lesson compact layouts so diagrams fit narrow screens without panning
- `Ctrl/⌘ K` search across lessons and glossary
- ✅ Interactive sandboxes: edit a value and watch the diagram react — more lessons can add one (candidates: load balancing, CORS, event loop, embed vs reference)
- Per-step OG images for sharing; PWA/offline
- Optional MERN backend for accounts and synced progress (dogfooding the course itself)
- More courses: System Design, Git, DSA, DevOps

### Phase P — Main topics (Frontend · Backend · Database · DevOps)
Label everything; reshape nothing (see §3, Main topics).
- ✅ **P1 — Labels**: `src/content/pillars.ts` (topics, colours, blurbs), `pillar` on parts or lessons in `course.ts`, all 54 lessons labelled, `pillarOf()` + `LessonEntry.pillar` in the registry, a dev warning (so QA fails) for a missing or doubled label, scaffolding scripts updated
- ✅ **P2 — Topic pages and header**: `/frontend`, `/backend`, `/database`, `/devops` and `/projects` (`TopicPage.tsx`) list their lessons under the original part names. A part split across topics shows only this topic's lessons and links to where the rest are; its Gate link shows only when the whole part is in this topic. The Projects page also links the Capstone. A four-topic switcher with per-topic progress sits at the top. The header has 9 tabs instead of 13: Start Here · Frontend · Backend · Database · DevOps · Projects | Roadmap · Library · Me. The four topics are coloured binder tabs, and a tab stays highlighted on every page it gathers. `/library` (`LibraryPage.tsx`) holds the course map, glossary, Techpack, Skill Pack, notebooks and common errors. "Me" goes to the Dashboard, which now links Review and Handnotes. *(The tabs were replaced by the sidebar in Phase R.)*
- **P3 — Label the rest**: notebooks (DBMS → Database), Techpack sheets, Skill Pack tracks, glossary terms, common errors and capstone milestones, all shown as tabs on each topic page
- **P4 — Progress by topic**: ✅ Dashboard with one progress ring per topic (also in the sidebar and on Home) · Roadmap as a four-lane swimlane · Start page suggesting where to begin
- Open question: DSA and System Design don't fit the four topics. Decide whether they become separate courses beside them.
- DevOps is the thinnest topic (6 lessons), so it's the natural place for new lessons: shell, domains and DNS, reverse proxies, cloud hosting.

### Phase R — Redesign: "Studio" UI/UX · ✅ shipped
The whole site was re-skinned and re-navigated for the learner, without moving content, URLs or saved progress.
- ✅ New design system (tokens + primitives); the global "notebook" re-skin (graph paper, handwritten headings and buttons) is gone — handwriting stays only in Notebooks and Handnote
- ✅ App shell: left sidebar with Continue card, topic progress rings and a review-due badge; top bar + drawer on narrow screens (replaces the 9 right-edge index tabs from P2)
- ✅ Home hub for returning learners (continue at the exact step, drawn live; progress by topic; reviews/gates); pitch for new ones
- ✅ Topic pages and course map as a syllabus (sticky part header + lesson rows with state: number / progress ring / tick)
- ✅ Lesson player: step segments now show beat colours (they were all grey), Next sits on the right, calmer type
- ✅ Dashboard rebuilt (stats, next step, by topic, gates as a list); Gate intro shows what it covers; the gate's coding task now renders (it was a blank page); Start Here has a 3-step indicator and real checkboxes; Glossary has A–Z
- ✅ Roadmap drawn clean (true circles, dot grid, Inter labels on the same metrics — the overlap QA still passes); `SKETCHY` in `roadmap/shapes.ts` brings the hand-drawn look back
- ✅ Motion: active highlights *glide* between items instead of blinking — sidebar, topic switcher, Roadmap Map/List, and the lesson step bar's "you are here" marker. One primitive, `<Glide id>` in `src/site/ui.tsx` (motion `layoutId` + one spring, `GLIDE`); put it inside whichever item is active. Icons answer hover with a small spring, the theme icon spins sun ↔ moon, progress rings draw themselves in, pages rise in. All of it is instant under “reduce motion”
- ✅ Dashboard "By topic" as bins: one square per lesson, filling from the bottom as far as you got (done = full); each square opens its lesson

### Phase V — Visual impact: "paper blocks on a desk" · 🚧 in progress
The concepts were all there but the diagrams read as wireframes (dark cards on a dark canvas, thin grey lines). Goal: a learner who has seen a diagram once can picture it again.
- ✅ V1 — Engine-wide look, so all 54 lessons change with no content edits: paper blocks with extruded hatched sides, platforms for zones, isometric desk, ink wires, bigger packets, physical states (see §4, Stage objects)
- ✅ V2 — "In this lesson" timeline under the stage (labelled, beat-coloured, auto-centred); replaces the top segment bar on wide screens
- ✅ V3 — `picture` callout kind ("Picture it")
- ✅ V4 — Home "How one app works" (`src/site/AppAnatomy.tsx`) redrawn on the desk: platforms for Frontend / Backend / Database with paper blocks inside (screen with a DevTools Network row, fetch, state · router, middleware, logic, model · a MongoDB cylinder holding the documents). One click travels 9 numbered steps out and back; every wire carries its step number, two-way wires have a request lane and a response lane, and each step says what happens, **why that tool is used**, and the real code. Below it: "MERN, letter by letter" (job + why for each tool, jumps to its step) and "Around the app" (build, ship, AI). Laid out with CSS (wide row → tall column via container queries), then measured; wires, numbers and packets reuse the engine (`linkPoints`, `Extrusion`, `PacketLayer`)
- Next: write one "Picture it" analogy per lesson; home/continue-card stage backgrounds on the desk grid; per-lesson emblem on the cover; optional isometric hero mode for data-structure courses (DSA)

### Phase U — A site that anticipates · ✅ shipped
Fewer clicks between "I wonder…" and the answer, and small moments that reward progress.
- ✅ **Command palette** (`/` or `Ctrl/⌘ K`; UI in `src/site/Search.tsx`, index and ranking in `src/site/palette/`). One index over pages, topics, course parts, lessons, gates, glossary terms, common errors (Enter opens the lesson step that explains the error), Techpack snippets, Skill Pack tools and notebooks, plus commands (continue, theme, mentor, due reviews, surprise me, copy a link to this step, shortcuts). Ranking: exact → starts with → word start → anywhere → every word; abbreviations ("evl" → Event Loop) and typo fixes ("corss" → CORS) only when nothing matches directly; description-only matches drop out next to real title matches. Matches are highlighted; a preview pane shows lesson goals and progress, full definitions, an error's meaning/cause/fix, or the snippet's code. Empty box: jump back in, recent picks, up next, commands. `>` limits it to commands, `#` to glossary terms; anything else can go to the mentor ("Ask XOLA: …", prefilled, not sent).
- ✅ **Keyboard everywhere** (`src/site/Hotkeys.tsx`): `G` then a letter jumps to a page (`C` resumes your lesson); a letter panel appears only if you hesitate; `?` opens one shortcut sheet on any page (the lesson player shows its own keys first). Sidebar items show their letter on hover.
- ✅ **Lesson player**: on wide screens the mentor's button sits in the top bar (the floating launcher covered the last stops of the step timeline); a step slides in from the side you moved towards; "~N min left"; the first time a lesson is finished, confetti in the role colours bursts from the Next button and the finish card shows course progress and streak (`src/lib/confetti.ts`; nothing under reduced motion).
- ✅ **Home**: time-of-day greeting, "about N min to finish" on the continue card, hero numbers count up, a soft cursor spotlight on cards (add `spot` to any card; `src/lib/spotlight.ts`, off on touch screens).
- ✅ **404** suggests what the link probably meant, using the palette's matcher and the URL's section (`/skillpack/raect` → React).
- ✅ Deep links with `#anchor` land on the anchor on every page; toasts for quiet confirmations (`toast()` in `src/lib/toast.ts`).
- ✅ Accessibility: tertiary text (`--muted-2`) now passes WCAG AA (≥ 4.5:1) in both themes; 44px touch targets on coarse pointers; the keyboard-shortcuts button is hidden on touch screens.

### Phase M — The Manual · 🚧 in progress
The site's new shape: one chapter per *problem* every product meets, stacks second (`docs/VISION.md`). Plan and status: `docs/PLAN-MANUAL.md`.
- ✅ M1 — `/manual` contents (4 parts, 36 chapters, topic filter, honest status) and `/manual/:chapter` pages that assemble lessons, errors, gates, milestones and cheat sheets per chapter. "Know who the user is" is written in full as the model chapter. Content in `src/content/manual/`, pages in `src/site/manual/`. `npm run qa -- manual` checks every chapter at laptop and phone width.
- ✅ M2 — all 23 chapters that have lessons written in the model chapter’s shape (draft until the owner reviews).
- ✅ M3 — the three doors: `/explore` (curiosity feed), `/build` ("I want to build ___" → the chapters it needs), `/path` (the guided route, next three steps lit); Home leads with them; the sidebar is nine items. Content in `src/content/doors/`, pages in `src/site/doors/`. `npm run qa -- doors`. Details: `docs/PLAN-MANUAL.md`.
- ✅ M4 — *Your first ship* (`written/first-ship.ts`): a personal page built with AI as a pair and put online; the live link is kept as proof (`ships` in progress) and starts the Path.
- ✅ M5 — the builder’s craft: *Turn a problem into a plan*, *Build with AI*, *Read docs and other people’s code*, *Ship, listen, improve*.
- ✅ M6 — levels as identity (`content/levels.ts`, `site/doors/Levels.tsx`): six levels earned with proof and kept; test out of a chapter with its gate; progress by chapter on the dashboard; the level in the sidebar and in the mentor's profile.
- ✅ M7 — Part 11 “Real-World Building Blocks” in the course (lessons `llm-apps`, `background-jobs`, `notifications`, `payments`, `automation`, gate `extend`, 10 glossary terms) and the chapters *Make it smart*, *Do work later*, *Reach people*, *Take money*, *Automate the busywork*. The AI/ML topic now has lessons.
- ✅ M8 — the FDE path: four problem briefs (`content/briefs.ts`, `/briefs`) with fading support; XOLA plays the client in discovery (`mode: "client"`); notes become the build spec; ship a live link, demo, defend the design; briefs prove Levels 4–5.

## 9. Quality bar

- 60 fps animations; no layout jank between steps
- Readable in both themes (contrast-checked tokens)
- Every interactive control reachable by keyboard; motion respects `prefers-reduced-motion`
- `npm run build` type-checks all content: a broken scene is a compile error, not a blank stage
