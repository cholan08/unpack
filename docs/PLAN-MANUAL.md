# Unpacked — the Manual: phase plan

> Handoff brief. Read `docs/VISION.md` first (why, and the rules), then `docs/PLAN.md` (how the platform works) and `docs/AUTHORING.md` (lesson DSL). Each phase ships something a learner can use, and leaves `npm run build` and `npm run qa` green.

## Where we start (2026-11-26)

- **Strong:** 54 visual MERN lessons (456 steps), 10 gates, TaskFlow capstone, review cards, common errors, the XOLA mentor, command palette.
- **Thin:** 29 notebooks with ~273 planned pages, ~15 written (DBMS + 1 OS page). Skill Pack is ~3,300 topic names with no content. No lessons yet for jobs, notifications, payments, AI, or automation.
- **Shape problem:** the site is organised by *content type* (Lessons, Notebooks, Techpack, Skill Pack) and by *layer* (Frontend, Backend…). Learners think in *problems*. The Manual fixes the shape; the later phases fill it.

## Phases

| Phase | Outcome | Status |
|---|---|---|
| **M0 · Vision** | `VISION.md`: the goal, learner psychology, the manual's shape, decisions | ✅ |
| **M1 · The spine + one model chapter** | `/manual` (four parts, every chapter, topic filter, honest status) and `/manual/:chapter`. Every chapter links what already exists. **"Know who the user is"** is written in full as the model for the rest | ✅ |
| **M2 · Assemble every chapter** | Write the full chapter (same sections as the model) for every chapter that already has lessons — 23 of them, a few at a time. Reviewed by the owner | ✅ 23 of 23 drafted (plus the model chapter) — awaiting the owner’s review |
| **M3 · Three doors** | Home becomes Explore / Build / Path. Explore = a feed of curiosity questions. Build = "I want to build ___" → the chapters it needs. Sidebar slims down: the Manual, your path, the shelf | ✅ Built, build and QA green (2026-11-26). The door content — 59 Explore questions, 9 Build ideas and 14 features, the Path's order — is an AI draft awaiting the owner's review |
| **M4 · First ship in an hour** | Level 1: a guided first build (a personal page, put online, with AI as a pair). The new start of the Path door | ✅ Built, build and QA green (2026-11-26). *Your first ship* is written as a draft awaiting the owner's review |
| **M5 · The builder's craft** | Part III chapters, starting with **Building with AI** (specify → generate → read → verify) and **Turn a problem into a plan** | ✅ All 7 craft chapters written: the 4 without lessons (*Turn a problem into a plan*, *Build with AI*, *Read docs and other people’s code*, *Ship, listen, improve*) plus the 3 with lessons (in M2) |
| **M6 · Levels as identity** | Levels 0–5 on the dashboard and sidebar ("You can now…"). Test out of a chapter. Progress counted by chapter | ✅ Built, build and QA green (2026-11-26). Level wording and proofs are an AI draft awaiting the owner's review |
| **M7 · New building blocks** | Lessons and chapters for the missing problems: Make it smart (LLM APIs, RAG, agents, evals), Do work later, Notify people, Take money, Automate workflows | ✅ Part 11 “Real-World Building Blocks” (5 visual lessons: AI in your app, background jobs, notifications, payments, automation + a gate) and 5 full chapters: *Make it smart*, *Do work later*, *Reach people*, *Take money*, *Automate the busywork* |
| **M8 · The FDE path** | Part IV briefs with fading support: guided → semi-guided → spec only → open. XOLA plays the client in a discovery interview; the learner scopes, builds, ships, demos, and defends the design | ✅ Built, build, QA and server tests green (2026-11-26). The four briefs and the client persona prompt are an AI draft awaiting the owner's review |
| **Later** | Accounts and sync, community, more branches (hardware/IoT, games…), more languages | |

## Who works on what (two machines in parallel)

The phases split into two tracks that touch different files, so two Claude Code sessions can run at once.

**Who does which track:**
- **Track A — the Windows machine** (`D:\Games\development\unpack`), working on branch `m2-chapters` and later phase branches.
- **Track B — the Linux machine** (`chola-B550M-DS3H`), working on branch `m3-doors` and later phase branches.
- **The owner** reviews chapters, answers questions, and says when a branch can be merged into `main` (the live site).

| Track | Phases, in order | Owns these files |
|---|---|---|
| **A · Content** — what the learner reads and builds | M2 → M5 → M7 | `client/src/content/manual/written/*`, new lessons in `client/src/content/courses/mern/lessons/` (M7), notebook pages, link fixes in `chapters.ts` |
| **B · Experience** — how the learner moves through it | M3 → M4 → M6 → M8 | `client/src/site/HomePage.tsx`, `AppShell.tsx`, new pages under `client/src/site/` (doors, levels, briefs), `client/src/lib/progress.ts`, `client/src/lib/mentor.ts`, `server/` (XOLA as the client in M8), plus `written/first-ship.ts` (M4) |

**Before Track A starts M2:** the owner reviews the model chapter (`written/identity.ts`). Every other chapter copies its voice and depth, so changes are cheapest now.

**Where the tracks meet** (agree before changing):
- `chapters.ts` — A adds links to chapters; B may add fields for doors/levels. Keep edits to single entries.
- `course.ts` — A adds new lessons in M7; B shouldn't need it.
- Progress by chapter — B (M6) reads `chapterProgress` / `chapterStatus` from `site/manual/shared.tsx` and `content/manual/index.ts`. A doesn't change those signatures.
- M8 links to the craft chapters A writes in M5 (*Turn a problem into a plan*, *Build with AI*). Until they exist, link the chapter pages — they show as planned.
- This status table: each track updates only its own rows.

**Branches:** one per phase step (`m2-chapters-backend`, `m3-doors`, …). Pull `main` before starting, merge back when `npm run build` and `npm run qa` are green. `main` deploys the live site.

## M1 — what was built

**Content (`client/src/content/manual/`)**
- `types.ts`: `ManualPart`, `Chapter` (the spine entry) and `ChapterWriting` (the hand-written sections).
- `chapters.ts`: the four parts and every chapter. Each chapter is the *problem* ("Know who the user is"), its curiosity *question*, its topic lens, and links to what already exists: lessons, notebooks, Skill Pack tools, a Techpack sheet, a gate, capstone milestones.
- `written/<chapter-id>.ts`: the full chapter, loaded on demand (one chunk per chapter). A file here makes the chapter *complete*.
- `index.ts`: lookups and status. A chapter is **complete** (written), **lessons ready** (has written lessons, chapter text not yet written), or **planned** (nothing yet). Planned chapters still show the question and what they will cover, so they are honest, not empty.

**Pages (`client/src/site/manual/`)**
- `/manual`: the contents. Four parts, each chapter with its number, problem, question, status and lesson progress. A topic filter (All, Frontend, Backend…) replaces topics as the table of contents.
- `/manual/:chapter`: the chapter layout from VISION §3, with a section index on wide screens. Sections that a chapter doesn't have yet are left out; *How it works*, *Break it* (common errors), *Look it up* and *Prove it* are assembled automatically from links.
- Interactive pieces: predict-then-reveal on the question, "what's wrong with this code?" reveals, a copyable AI prompt, a verify checklist, explain-back prompts that open XOLA.

**Wiring:** routes in `App.tsx` (lazy chunks), "The Manual" at the top of the sidebar (`G` then `B`), the Manual and every chapter in the command palette (its own "The Manual" group). The rich-text styles (`.ic`, `.term`, `.term-tip`) moved from `player.css` to `base.css` so chapters can use glossary tooltips.

**QA:** `npm run qa -- manual` opens the contents and every chapter at 1440px and 390px, clicks through the predict, break-it reveals, the AI tab and a Go-deeper answer, and fails on sideways overflow or any console warning (unknown glossary terms, broken chapter links). `QA_CHANNEL=msedge` runs QA in an installed Edge when Playwright's own browser isn't downloaded.

## M3 — what was built

**Content (`client/src/content/doors/`)** — AI drafts, for the owner to review like a chapter.
- `explore.ts`: the curiosity feed. Each question links its chapter, a *peek* (one or two sentences — a hint, not the answer) and, where a lesson shows it, the exact step (`see: [lesson, step]`). Every chapter has at least one question, planned ones too.
- `build.ts`: *features* in the learner's words ("Each person has their own account"), each pulling in chapters with the reason ("so nobody can see or change someone else's things"); *ideas* (a shop, a chat app…) with the features they usually have and the words that recognise them; `CORE` (every product) and `CRAFT` (how you'll work on any build).
- `path.ts`: the guided route in six stages — ship something today → see how it all works → make a small app → build and ship a whole product → add product powers → solve real problems. Every chapter is on it exactly once.
- `index.ts`: dev checks (so QA fails) for unknown chapters or lessons, duplicate ids, a chapter with no question, a chapter missing from the path. **Track A:** a new chapter needs one line in `path.ts` and one question in `explore.ts`.

**Pages (`client/src/site/doors/`)**
- `/explore`: the feed, filterable by topic. Each card asks for a guess, then *Peek* reveals the hint, *See it move* (the lesson step), the chapter, and a way to build it (the chapter's *Build it* section if written, else the Build door with that feature on). *Surprise me*; peeked questions are remembered; `?q=<id>` opens one.
- `/build`: "I want to build ___" — type an idea or pick one. Words switch features on ("log in, pay, get a reminder email"); features can be switched by hand. The chapters it needs appear in reading order with the reason, status and progress, the first one to open, the craft chapters, a design study when one exists, and *Ask XOLA to cut it down* (hidden in No-AI mode). Saved in the browser; `?idea=`, `?q=`, `?add=` start one from a link.
- `/path`: the whole route, with only the next three open chapters lit (a chapter is finished when every written lesson in it is). Links to the 5-minute check and the roadmap.
- Home: the pitch (new) or the continue card (returning), then the three doors — a question to peek at, your build or ideas to start one, the next three steps. The topic grid and course cards left Home.
- Chapter pages: when the learner's build needs the chapter, a *Your build* line says where it sits and links the next chapter for that build (`BuildTrail.tsx`).

**Shell:** the sidebar is nine items — Home · *The Manual* (All chapters, Explore, Build) · *Your path* (Path, Dashboard, Review, My notes) · *The shelf* (Library). Topic pages, the course map, roadmap, glossary, Techpack, Skill Pack, notebooks and errors live on the Library page (which gained the roadmap and *Lessons by topic*) and stay in the palette; old URLs work. A new learner's "next thing" is now the Path, not the placement check. Shortcuts: `G X` Explore, `G I` Build, `G P` Path.

**QA:** `npm run qa -- doors` drives Home and each door at 1440px and 390px (peek, filter, surprise; pick an idea, switch a feature, type an idea; the chapter trail). Courses are now discovered from the Library (`a[data-course]`), not Home. The full run starts a fresh browser for the Manual and doors passes (hundreds of page loads in one browser ended in `net::ERR_INSUFFICIENT_RESOURCES`).

**For M6 (levels):** the path's stages line up with VISION §5's levels; `pathOf()` in `site/doors/model.ts` already gives finished/open per stage and chapter.

## M4 — what was built

- **The chapter** `written/first-ship.ts` (*Your first ship*, Part IV): the full model-chapter order. The build is a one-page site about you, written by hand once and with an AI prompt that is a spec ("use only these facts", one file, viewport line, no placeholders), checked on a phone, and put online with Netlify Drop. The options compare drag-and-drop hosts, Git + Pages, deploy platforms and website builders; *the modern way* lists what AI gets wrong on a first page (invented facts, placeholders, local paths, frameworks for one page, missing viewport, secrets in the page). Draft until the owner sets `reviewed`.
- **Proof of a ship.** A chapter's build can end in `proof` (new optional field on `ChapterWriting.build`): the page asks for the live link (`ShipProof.tsx`), accepts only public `https://` addresses, and keeps it in progress (`ships` in `lib/progress.ts`: `saveShip`, `removeShip`, `useShips`, `shipUrl`). The first save gets confetti. A chapter whose build is shipped counts as finished on the Path. M6 (Level 1) and M8 (briefs) use the same proof.
- **Links:** the chapter links *What Happens When You Visit a URL*, *How Browsers Render a Page* and *Deploying* (one entry in `chapters.ts`); the Build door's *personal page* idea points to it. It is the first lit step of the Path.
- **QA:** the doors pass pastes a localhost link (must be refused) and a real one (must be kept).

## M6 — what was built

- **Levels** (`client/src/content/levels.ts`): 0 Curious (where everyone starts) · 1 First ship (a live link) · 2 Maker · 3 Builder (+ TaskFlow live) · 4 Product builder (+ a semi-guided brief) · 5 Independent builder (an open brief). Each says what you *can now* do. A level's chapters are its Path stage's chapters that have something to finish, so requirements grow with the Manual — but a level once earned is kept (`levels` in progress, `earnLevels`). The level you hold is the top of an unbroken climb from Level 0. Logic: `site/doors/levels.ts`.
- **Finished, by chapter.** A chapter counts as finished when every written lesson is done, its build is shipped, or the learner **tested out** by passing the chapter's gate (`viewOf()` in `site/doors/model.ts`). Chapter pages offer "Know it already? Test out with the … gate" and show *Tested out*. Path, Build and levels all use it.
- **Where it shows** (`site/doors/Levels.tsx`): the sidebar card ("Level 1 · First ship — You can put a page you made on the internet… Next: Maker · 0 of 7 chapters"); the dashboard's *Who you're becoming* ladder with exactly what the next level still needs; *Chapters* — every chapter as a square, part by part. `LevelWatcher` (in `App.tsx`) records a level the moment it is earned and says so once. The capstone's last milestone asks for the live TaskFlow link (Level 3). The mentor's profile carries the level (`server/app.mjs` prints it; tested).
- **QA:** after the first ship, the dashboard ladder and the sidebar must both say Level 1.

## M8 — what was built

- **Briefs** (`client/src/content/briefs.ts`): four made-up clients, less help each time — *Saturday pre-orders for a bakery* (guided: every stage written out), *Fewer missed appointments at a clinic* (semi-guided: a hint or two per stage), *A lost-and-found board for a school* (spec only), *A football club run from a group chat* (open). Each has the client's first, vague ask, what they `knows`, what they share `onlyIfAsked`, constraints and the chapters it draws on. Seven stages for every brief: discover → scope → design → build → ship → demo and defend → iterate (`STAGES`).
- **Pages** (`client/src/site/briefs/`): `/briefs` (the four, with progress) and `/briefs/:id` — per stage the goal, the guide (fading), a note the learner writes, and "Done" with what done looks like. **Discover**: an interview with the client, played by XOLA (`mode: "client"` on `POST /api/tutor`, `buildClientPrompt` in `server/app.mjs`: stays in character, plain words, hidden facts only for good questions, "(out of character)" gives feedback; tested). No key or No-AI mode: "read the client's notes instead". **Build**: the learner's own notes become a copyable spec for an AI assistant. **Ship**: the live link (`ships['brief:<id>']`). **Demo and defend**: "Defend it to XOLA" (a sceptical-engineer prompt) and "I answered the hard questions".
- **Levels:** Level 4 needs a semi-guided (or harder) brief shipped; Level 5 needs the open brief shipped and defended (`site/doors/briefProof.ts`). Stages and "defended" live in progress (`briefs`); notes and the interview transcript in `unpacked:brief:<id>`.
- **Wiring:** the *Solve a real client's problem* chapter opens `/briefs` (one entry in `chapters.ts`), so the Path, Explore and the Manual reach it; palette page; the mentor knows the page. The server's offline mock answers in client mode too.
- **QA:** the doors pass opens the list, works the guided brief (tick a stage; notes become the spec; the no-key message shows), and the open brief, at laptop and phone width.

## Writing a chapter (for M2 onwards)

1. Find the chapter in `chapters.ts`; check its links (lessons, tools, sheet, gate) are right.
2. Copy `written/identity.ts` to `written/<id>.ts` and replace the content. Keep the order: question → idea → how it works notes → options → modern way → build → break → explain-back → deeper → next.
3. Rules: problem first, never a tool name first; every claim about a library or service must be true today; *the modern way* always lists what AI tends to get wrong in this block; every *Build it* has a by-hand path and a with-AI path with checks the learner can run.
4. AI drafts, the owner reviews. Add `reviewed: 'YYYY-MM-DD'` to the writing once the owner has read it; until then the chapter shows a small "draft" note.
