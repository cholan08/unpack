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
npm run dev:server # server → http://localhost:3001 (not wired to the client yet)
npm run test:server
```

Press `/` or `⌘K` anywhere to search lessons and glossary terms.

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
