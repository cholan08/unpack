# Unpacked — Phases A–F: from "watch" to "can build alone"

> Handoff brief for an AI/engineer implementing the next phases. Read this file, then `docs/PLAN.md` (architecture, visual language, quality bar) and `docs/AUTHORING.md` (step/scene DSL) before touching code.

## 0. Context

**Goal of the product:** a learner who finishes can build a MERN app *by themselves*, understanding why each piece exists (so they don't "vibe code").

**Already built (do not redo):** Vite + React + TS platform; 54 visual lessons in 10 parts; step player (narrative + animated stage); predict-what-happens checks; 8 interactive sandboxes; glossary with `[[term]]` tooltips; ⌘K search; localStorage progress/resume; light/dark; lazy-loaded lessons; `npm run qa` (headless walk of every step).

**Missing (this brief):** orientation/roadmap, code practice beside the diagram, per-part proof (quiz + challenge), AI tutor, capstone project, retention.

**Dev facts**
- Dev server port **5280** (5173 is taken). Run `npm run qa` before declaring any phase done.
- Content is data: lessons live in `src/content/courses/mern/lessons/*.ts`, built with builders in `src/content/dsl.ts`; parts/lessons are listed in `src/content/courses/mern/course.ts`.
- Engine is course-agnostic (`src/engine/`), player UI in `src/player/`, pages in `src/site/`, stores/theme in `src/lib/`.
- Principle: **adding content never requires touching the engine.** New step kinds go through `types.ts` + `dsl.ts`, then content uses them.
- `npm run build` type-checks all content; a broken scene must be a compile error.
- The working tree has uncommitted changes; do not revert them. Work in small commits per phase.

**Rules for every phase**
1. Visual first; match existing tokens, fonts, role colours, light/dark, `prefers-reduced-motion`, keyboard access.
2. No new heavy dependency without justification (main bundle is ~26 KB gz; keep it lean, lazy-load new features).
3. Update `docs/PLAN.md` (mark phase shipped) and `docs/AUTHORING.md` (new step kinds) at the end of each phase.
4. Each phase must be shippable and leave `npm run qa` + `npm run build` green.

## Defaults for open decisions (override if the owner says otherwise)

| Decision | Default |
|---|---|
| AI tutor key | **Bring-your-own key**, stored only in the learner's browser/localStorage, sent through the thin Express proxy; no hosted key. Provider-agnostic interface, Anthropic first. |
| Capstone app | **TaskFlow**: a task board with auth, CRUD, and realtime updates (covers every part; the existing "Design a Todo/Cart/Chat" lessons already point toward this). |
| Gates | **Recommended, not locked.** Skipping needs one click ("Skip for now") and is recorded; the dashboard nags gently. |
| Editor | **CodeMirror 6**, lazy-loaded only on lessons that contain a Try step. |
| Code execution | In-browser, **sandboxed iframe or Web Worker**, no network access. |

---

## Phase A — Orientation (S, pure content + UI)

**Outcome:** a newcomer lands and knows where to start, where it ends, and why.

Build:
1. **`/start` page ("Start Here")**: 5-minute prerequisites. Required before the course: basic HTML/CSS, JS basics (variables, functions, arrays/objects, loops), using a terminal, installed Node + VS Code + Git. Each item = a short "Can you…?" checklist with a link/hint if not.
2. **Placement quiz** (8–12 questions, MCQ) on `/start`. Result recommends a starting part and marks earlier lessons "skippable". Pure client-side; store the result in the progress store.
3. **`/:course/roadmap` page**: one visual path of the 10 parts ("You are here" marker from progress). Each part card shows: **Why you learn this** (the pain it solves), **You will be able to** (3 outcomes), estimated time, and (later) its gate status.
4. Extend `defineCourse` part type with `why: string` and `outcomes: string[]`; fill them for all 10 parts in `course.ts`.
5. Link the roadmap from Home hero, the course map, and the header. Home's primary CTA for a new visitor becomes "Start here".

Acceptance: new visitor → Home → Start Here → placement → roadmap → first lesson, with no dead ends. `npm run qa` passes; add the new routes to QA if it enumerates routes.

---

## Phase B — Practice: code beside the diagram (M)

**Outcome:** learners write and run code while watching the concept.

Build:
1. New step kind **`try`** (types in `src/engine/types.ts`, builder in `dsl.ts`): `{ prompt, starter, language: 'js', tests: [...], solution, hints: string[] }`. Tests are small assertions the runner evaluates against the learner's code/output.
2. **Practice panel** in `src/player/`: CodeMirror editor, Run / Reset / Show hint buttons, console output pane, test results list (pass/fail with the failing message). Sits in the narrative column or under the stage; the diagram stays visible. On mobile it becomes a sheet.
3. **Sandbox runner**: Web Worker (preferred) with a hard timeout (infinite loops must not freeze the tab), captures `console.log/error`, no network/DOM access. Return structured results to the panel.
4. Lazy-load editor + runner (separate chunk, only when a Try step is mounted).
5. Hint ladder UI (without AI yet): hints reveal one at a time; solution is behind "I'm stuck — show solution" with a confirm.
6. Add Try steps to **6–8 lessons first**: Scope & Closures, The Event Loop, Promises & async/await, Values vs References, State & Re-rendering (pure-JS version), useEffect (stale closure), Pagination (write the offset math), Validation.
7. QA: for every `try` step, run its `solution` against its `tests` in the headless run; fail if any test fails. Also verify the starter *fails* at least one test.

Acceptance: a learner can edit, run, see console output and test results, reset, and get hints; infinite loop is killed gracefully; main bundle size essentially unchanged.

---

## Phase C — Proof: part gates + dashboard (M)

**Outcome:** each part ends with evidence the learner understood it.

Build:
1. New content types: **`quiz`** (MCQ + multi-select + "order the steps", with explanations per option) and **`challenge`** (a `try`-style task with tests, slightly larger). Author them in a per-part file, e.g. `src/content/courses/mern/gates/<part>.ts`, referenced from `course.ts`.
2. **Gate screen** at the end of each part: ~6 quiz questions + 1 challenge. Pass mark default 70%. Failed questions link back to the exact lesson step that teaches them.
3. Gate state in the progress store (`src/lib/`): attempts, best score, passed/skipped, timestamps. Gates are recommended: show a "Skip for now" option; the roadmap shows passed/skipped/not-started.
4. **Dashboard** (`/me` or on Home when returning): streak, time spent, parts passed, weakest topics (from missed quiz questions), "next best action".
5. Write gates for all 10 parts (Part 10 is covered by Phase E; give it a placeholder).

Acceptance: complete a part → gate appears → pass/fail/skip all behave and persist across reload; weak topics link back to the right steps. QA covers gate content (every option set has a correct answer; every challenge solution passes).

---

## Phase D — AI tutor (M, first real backend)

**Outcome:** help that teaches instead of doing the work.

Build:
1. **`server/`**: small Express app (the platform's first real MERN piece; dogfood the course). One route `POST /api/tutor` proxying to the model provider. Learner's key is sent per-request in a header and **never logged or stored**. Rate-limit and size-limit the route. Provider behind an interface so it can be swapped.
2. **Tutor panel** in the player (and in Practice/Gates), context-aware: it receives the lesson title, the current step's text, the learner's code, the test failures, and the course glossary.
3. **System prompt rules (Socratic):**
   - Hint ladder: nudge → point to the relevant diagram step → partial code → full solution **only after** the learner has attempted and asked again.
   - Explains error messages in terms of the lesson's mental model.
   - Ends help with "explain in your own words why this works", then grades that answer against the lesson's key concepts (pass/needs-work + one sentence of feedback).
   - Never writes complete solutions to gates/capstone milestones the learner hasn't attempted.
4. "Explain-back" results feed the progress store (used by Phase F).
5. Settings dialog for the API key with a clear privacy note; app works fully without a key (tutor panel shows how to enable).

Acceptance: with a key, hint #1 never contains the solution; without a key nothing breaks; the key never appears in server logs or network traces other than the one proxied request. Add server tests for the prompt-building and rate limit.

---

## Phase E — Capstone: build TaskFlow (L)

**Outcome:** the learner builds a complete app from an empty folder and understands each piece.

Build (as content + a starter repo):
1. Replace/extend **Part 10 "Build It"** with a milestone track (~10 milestones), each mapped to the earlier lesson that taught it:
   1. Project skeleton & scripts (Node, Vite, Git) → 2. Express server + health route → 3. MongoDB connection + Task model (Mongoose) → 4. REST CRUD for tasks → 5. Validation & error handling → 6. React app, routing, fetching → 7. Forms, state, optimistic UI → 8. Auth (hashing, JWT, protected routes) → 9. Realtime updates (WebSockets) → 10. Deploy + CI.
2. Each milestone page: **goal**, a diagram of what's being added to the whole system (reuse the engine; highlight the new part), **steps to do locally** (copy-able commands), a **checklist of acceptance checks** the learner ticks off (e.g., `curl` outputs to compare), **"why this, not that"** notes, and a **mini review gate** (3 questions + explain-back).
3. **Starter repo** (`capstone/starter/`, plain files in this repo or a linked template) and a **reference solution per milestone** (`capstone/solutions/mN/`) for the owner/QA, not shown by default.
4. AI tutor mode for the capstone: may review code and explain errors, but does not write the milestone's feature code unless the learner explicitly gives up after attempting.
5. Final milestone: **"Defend your design"** — 5 questions about their own choices (why embed vs reference here, why JWT vs sessions, etc.), explain-back graded.

Acceptance: following only the milestone pages, a fresh clone reaches a working deployed TaskFlow; each milestone's checks are runnable; solutions folder passes all checks in CI.

---

## Phase F — Retention & independence (M)

Build:
1. **Spaced review cards**: short recall prompts auto-generated from each lesson's recap + failed quiz items + failed explain-backs; resurface after 1 / 3 / 7 / 21 days. A "Review" queue on Home/dashboard (5 minutes a day).
2. **Debug-it challenges**: broken code + a symptom ("button double-submits", "stale count in effect"); learner finds the cause using the lesson's mental model, fixes it, tests pass. ~2 per part.
3. **No-AI final build**: a variation of TaskFlow (different domain, e.g. "bookmark manager") built with the tutor disabled; self-checklist + defend-your-design.
4. Mini-lesson **"Using AI without losing the skill"**: when to ask, how to read generated code, how to verify it, how to spot hallucinated APIs.
5. **Common-errors glossary**: error message → what it means → which lesson explains it.

Acceptance: review queue schedules correctly (unit-test the scheduler), debug-it solutions pass their tests in QA, the no-AI mode truly disables tutor calls.

---

## Cross-cutting

- **Progress store schema** (`src/lib/`): version it; migrate existing localStorage data without losing lesson progress. Add: placement result, gate results, review schedule, explain-back results, settings.
- **Accessibility:** editor and quiz fully keyboard-operable; focus management on gate/dialog open; announce test results to screen readers.
- **Performance:** every new feature lazy-loaded; report main bundle size before/after each phase.
- **Content volume order:** finish engine/UI for a phase with 2–3 sample items, then fan out content.
- **Privacy:** no analytics or external calls beyond the optional tutor proxy.

## Definition of done (whole effort)
A brand-new learner can: take Start Here → follow the roadmap → learn a concept visually → practise it in the editor → pass the part gate → get Socratic help → build TaskFlow locally from milestones → defend their design → return later to review — and `npm run qa` and `npm run build` are green.
