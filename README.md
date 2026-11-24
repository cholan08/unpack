# Unpacked

A visual course platform for full-stack development. Every concept is an animated diagram you step through — with the real code beside it.

First course: **MERN Full Stack, Unpacked** — 10 parts, 54 lessons, all written.

## Run it

Everything runs from the repo root — npm workspaces route each command to `client/` or `server/`.

```bash
npm install        # installs client + server in one go
npm run dev        # client → http://localhost:5280
npm run build      # type-checks every lesson, then builds to client/dist/
npm run qa         # with the dev server running: checks every step for layout problems
npm run new:lesson -- mern my-lesson      # scaffold a lesson
npm run new:course -- system-design "System Design"   # scaffold a course
npm run dev:server # AI tutor/mentor server → http://localhost:3001 (the client proxies /api to it)
npm run test:server
```

Press `/` or `Ctrl/⌘ K` anywhere for the command palette: lessons, course parts, glossary terms, common errors (it opens the lesson step that explains each one), Techpack snippets, Skill Pack tools, notebooks and commands. It forgives typos (`corss` → CORS), shows a preview, and remembers what you opened. Type `>` for commands only, `#` for glossary terms. `G` then a letter jumps to a page (`G` `D` Dashboard, `G` `C` your lesson), and `?` shows every shortcut.

## AI mentor

A mentor named **Pax** is docked in the corner of every page, the lesson player included. Open it with the **Pax** button or `Ctrl/⌘ J`. It knows your progress (streak, current lesson, due reviews, gate weak spots, explain-backs that needed work) and which lesson step you are on, so it can give specific advice and link you to the right lesson. The conversation is saved in this browser.

It runs on **your own API key**, pasted into the mentor panel (or Dashboard → AI tutor): an **xAI (Grok)** key (`xai-…`, model `grok-4.7`) or an **Anthropic (Claude)** key (`sk-ant-…`). The server picks the provider from the key. The key stays in your browser and is sent per request through `server/`; it is never logged or stored. **No-AI mode** (Dashboard → AI tutor) hides the mentor and the tutor entirely.

```bash
npm run dev:server   # terminal 1: the proxy on :3001
npm run dev          # terminal 2: the site (forwards /api to :3001)
```

| Env var | Where | What |
|---|---|---|
| `TUTOR_MODEL_XAI` | server | Grok model id (default `grok-4.7`) |
| `TUTOR_MODEL_ANTHROPIC` | server | Claude model id (default `claude-sonnet-5-5`) |
| `TUTOR_PROVIDER` | server | Force `xai` or `anthropic` instead of detecting from the key |
| `TUTOR_MOCK=1` | server | Canned replies, no key or network. For working on the UI |
| `PORT` | server | Listen port (default 3001) |
| `TUTOR_API` | client dev | Where Vite proxies `/api` (default `http://localhost:3001`) |

The static Vercel deploy has no server, so the mentor needs the proxy hosted somewhere and `/api` routed to it.

Lessons marked **Try it** end with an interactive sandbox: drag a slider or flip a switch and the diagram, the metrics and an explanation react live (see “Interactive sandboxes” in `docs/AUTHORING.md`).

## Where things live

```
mernbot/
├── client/          React + Vite front end (the whole site)
│   ├── src/
│   ├── public/
│   ├── scripts/     qa + new:lesson / new:course / new:notebook
│   └── package.json
├── server/          Node back end (AI tutor proxy — to be built out)
│   └── package.json
├── capstone/        Starter + solution code learners use in the capstone
├── docs/
├── package.json     workspace root: scripts that run client/server
└── vercel.json
```

| Path | What |
|---|---|
| `client/src/content/courses/<course>/` | **Content**: course definition and one file per lesson |
| `client/src/content/notebooks/<id>/` | **Content**: topic notebooks |
| `client/src/engine/` | The visual engine: stage, nodes, links, animated packets, sandbox helpers |
| `client/src/player/` | The lesson player: narrative, code, metrics, checks |
| `client/src/site/` | Home, course map, glossary pages |
| `server/` | Back end — currently the `/api/tutor` proxy |
| `docs/PLAN.md` | Vision, design system, curriculum and roadmap |
| `docs/AUTHORING.md` | How to write lessons and add courses |

## The course

All 54 lessons across 10 parts are written — How the Web Works, JavaScript Under the Hood, React, Node & Express, MongoDB, Connecting the Stack, Auth & Security, Shipping Software, Performance & Scale, and Build It (three capstone designs). See `client/src/content/courses/mern/course.ts` for the full table of contents.

## Deploy

The client is a static single-page app: `npm run build` writes `client/dist/`, which can be deployed anywhere. The root `vercel.json` builds the client workspace, serves `client/dist`, and rewrites every route to `index.html`.
