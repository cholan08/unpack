# Unpacked

A visual course platform for full-stack development. Every concept is an animated diagram you step through — with the real code beside it.

First course: **MERN Full Stack, Unpacked** — 10 parts, 54 lessons, all written.

## Run it

```bash
npm install
npm run dev        # http://localhost:5280
npm run build      # type-checks every lesson, then builds to dist/
npm run qa         # with the dev server running: checks every step for layout problems
npm run new:lesson -- mern my-lesson      # scaffold a lesson
npm run new:course -- system-design "System Design"   # scaffold a course
```

Press `/` or `⌘K` anywhere to search lessons and glossary terms.

Lessons marked **Try it** end with an interactive sandbox: drag a slider or flip a switch and the diagram, the metrics and an explanation react live (see “Interactive sandboxes” in `docs/AUTHORING.md`).

## Where things live

| Path | What |
|---|---|
| `src/content/courses/<course>/` | **Content**: course definition and one file per lesson |
| `src/engine/` | The visual engine: stage, nodes, links, animated packets, sandbox helpers |
| `src/player/` | The lesson player: narrative, code, metrics, checks |
| `src/site/` | Home, course map, glossary pages |
| `docs/PLAN.md` | Vision, design system, curriculum and roadmap |
| `docs/AUTHORING.md` | How to write lessons and add courses |

## The course

All 54 lessons across 10 parts are written — How the Web Works, JavaScript Under the Hood, React, Node & Express, MongoDB, Connecting the Stack, Auth & Security, Shipping Software, Performance & Scale, and Build It (three capstone designs). See `src/content/courses/mern/course.ts` for the full table of contents.

## Deploy

It's a static single-page app: deploy `dist/` anywhere. `vercel.json` already rewrites every route to `index.html`.
