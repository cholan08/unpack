# Unpacked — instructions for Claude Code

Unpacked is **the manual of technology for building products**: it takes a curious person who knows nothing to an independent builder (a forward-deployed engineer) who can take a real problem and ship the product that solves it.

## Read first, every session
1. `docs/VISION.md` — the goal, the learner psychology, the shape of the Manual, the rules, and the owner's decisions (§7). Every change is judged against it.
2. `docs/PLAN-MANUAL.md` — the phases (M1–M8), who is working on which phase, and how to write a chapter.
3. `docs/PLAN.md` (platform architecture, visual language) and `docs/AUTHORING.md` (lesson DSL) when touching lessons or the engine.

## Rules that are easy to miss
- **Problems first, stacks second.** A chapter is a problem ("Know who the user is"), never a tool name. Frontend/Backend/… are only a filter.
- **No empty rooms.** Don't add outlines without content; mark unfinished things honestly (planned / lessons ready / draft).
- **The modern way, honestly.** Every chapter says how it's built today with AI, what AI gets wrong there, and how to verify it. Claims about libraries and services must be true today.
- **AI drafts, the owner reviews.** A written chapter shows "draft" until the owner sets `reviewed: 'YYYY-MM-DD'` in it. Never set it yourself.
- **The model chapter is `client/src/content/manual/written/identity.ts`.** New chapters copy its order, voice and depth.
- **Not now:** accounts/sync/community, other languages, paid features, non-software branches (decided — see VISION §7).

## Commands (run from the repo root)
- `npm run dev` — client on http://localhost:5280 (the owner often has it running already)
- `npm run build` — type-checks every lesson and chapter, then builds
- `npm run qa` — with the dev server running: every lesson step, roadmaps, and every Manual page at laptop and phone width
- `npm run qa -w client -- manual` — only the Manual
- If Playwright's browser can't be downloaded, prefix QA with `QA_CHANNEL=msedge` (uses installed Edge)

A phase is done when `npm run build` and `npm run qa` are green and its row in `docs/PLAN-MANUAL.md` is updated.

## Working in parallel (two machines)
The owner runs two Claude Code sessions on two machines, each owning different phases (see the table in `docs/PLAN-MANUAL.md`).
- `git pull` before starting; work on a branch per phase (`m2-chapters`, `m3-doors`, …); merge to `main` when the phase step is green; pull and merge `main` often.
- Stay inside your phase's files. Shared files that both tracks touch — keep edits small and local: `client/src/content/manual/chapters.ts` (one chapter entry at a time), `client/src/content/courses/mern/course.ts`, `client/src/App.tsx`, `client/src/site/AppShell.tsx`, `client/src/site/palette/items.ts`, and the status table in `docs/PLAN-MANUAL.md` (update only your own rows).
- `main` deploys the live site — only merge work that builds and passes QA.
