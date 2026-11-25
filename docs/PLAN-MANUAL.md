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
| **M2 · Assemble every chapter** | Write *the question*, *the idea without a stack*, *the options* and *next questions* for every chapter that already has lessons (≈14). Reviewed by the owner | next |
| **M3 · Three doors** | Home becomes Explore / Build / Path. Explore = a feed of curiosity questions. Build = "I want to build ___" → the chapters it needs. Sidebar slims down: the Manual, your path, the shelf | |
| **M4 · First ship in an hour** | Level 1: a guided first build (a personal page, put online, with AI as a pair). The new start of the Path door | |
| **M5 · The builder's craft** | Part III chapters, starting with **Building with AI** (specify → generate → read → verify) and **Turn a problem into a plan** | |
| **M6 · Levels as identity** | Levels 0–5 on the dashboard and sidebar ("You can now…"). Test out of a chapter. Progress counted by chapter | |
| **M7 · New building blocks** | Lessons and chapters for the missing problems: Make it smart (LLM APIs, RAG, agents, evals), Do work later, Notify people, Take money, Automate workflows | |
| **M8 · The FDE path** | Part IV briefs with fading support: guided → semi-guided → spec only → open. XOLA plays the client in a discovery interview; the learner scopes, builds, ships, demos, and defends the design | |
| **Later** | Accounts and sync, community, more branches (hardware/IoT, games…), more languages | |

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

**Wiring:** routes in `App.tsx`, "The Manual" at the top of the sidebar (`G` then `B`), the Manual and every chapter in the command palette.

## Writing a chapter (for M2 onwards)

1. Find the chapter in `chapters.ts`; check its links (lessons, tools, sheet, gate) are right.
2. Copy `written/identity.ts` to `written/<id>.ts` and replace the content. Keep the order: question → idea → how it works notes → options → modern way → build → break → explain-back → deeper → next.
3. Rules: problem first, never a tool name first; every claim about a library or service must be true today; *the modern way* always lists what AI tends to get wrong in this block; every *Build it* has a by-hand path and a with-AI path with checks the learner can run.
4. AI drafts, the owner reviews. Add `reviewed: 'YYYY-MM-DD'` to the writing once the owner has read it; until then the chapter shows a small "draft" note.
