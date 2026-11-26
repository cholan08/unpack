# Unpacked — the Manual of Technology for Building Products

> Read this first. Every plan, page and lesson is judged against it. `PLAN.md` is *how* the platform works; this file is *why* it exists and *what shape* everything must take.

---

## 1. The goal, in the owner's words

**The learner** is a person who is curious about technology but doesn't know where to start, what to do, what to build, or how things work. We are not building for a job, an exam or a promotion. We are building for **curiosity**. Curiosity is the key, and we feed it.

**The insight:** technology is about building things that solve problems. Different people use different stacks, tools and approaches, but **we are all solving the same problems**. So we teach the problems, how the solutions work, and why they exist. The stack is one way to answer a problem; it is not the thing we are teaching.

**The era:** all of this already exists on the internet, but scattered. We approach it differently: in the AI era, a curious person with effort and the right understanding can build real solutions and products. We give them the correct, modern way to do it.

**The end state:** someone who knew nothing becomes an **independent builder**: a person who can take a real problem, understand it, choose the technology, build the product, ship it and improve it. Think of it as being their own **forward-deployed engineer (FDE)**.

> **Unpacked is the manual of technology for building products.**

---

## 2. What that means for the learner's mind

| Truth about the learner | What the app must do |
|---|---|
| **Curiosity starts from a gap.** People want to know more when they notice a gap between what they know and what they want to know. If they know nothing, there's no gap; if they know everything, the gap is closed. | Every entry point is a *question* the learner can almost answer ("How does a message reach a phone that was switched off?"). Reveal a little, then let them predict before showing the answer. |
| **One answer should open the next question.** | Every page ends with *the next question* and *you can build this*. Curiosity becomes a chain that always leads back to building. |
| **Beginners don't know what they don't know.** Too many choices make them freeze. | Show the whole map, but light up only the next 3 steps. Three doors, not fourteen. |
| **Confidence comes from doing.** The strongest source of belief in yourself is a real success you achieved. | Ship something real and public in the **first hour**, not after 54 lessons. |
| **Watching feels like learning but isn't.** | Predict → reveal, explain-back, build it, break it. Something active at every step. |
| **Everyone hits the hard middle** (closures, async, auth, deploys). | Tell them it's normal ("most builders get stuck here"), and give them a smaller step. |
| **Advanced learners are slowed down by beginner hand-holding.** | Let anyone test out of a block and skip ahead. Remove the scaffolding as they grow. |
| **People keep going when they can see who they're becoming.** | Show levels as identity ("You can now build and ship an app with logins"), not percentages. |

---

## 3. The shape: problems first, stacks second

Every product, whether a booking site, a chat app, an AI assistant or a store, is built from the **same building blocks**. The manual is organised around those blocks. Frontend / Backend / Database / DevOps / AI stay as a *lens* (a filter, a colour), not the table of contents.

### The manual's four parts

**Part I: How things work.** Just enough first principles to stop it being magic: how a computer runs code, how the internet moves data, how the web works, how data is stored, how code becomes a running product.

**Part II: The building blocks.** One chapter per problem every product meets:

| # | The problem | Today's content that already belongs here |
|---|---|---|
| 1 | Show something to the user (UI) | HTML/CSS notebooks, React lessons |
| 2 | Let them interact (state, forms, events) | State & re-rendering, useEffect, Context |
| 3 | Remember things (store & model data) | MongoDB part, DBMS notebook |
| 4 | Answer requests (servers & APIs) | Node & Express part, REST API |
| 5 | Know who the user is (authentication) | Auth & Security part |
| 6 | Control what they can do and keep them safe | Authn vs authz, web attacks, protected routes |
| 7 | Talk to other systems (integrations, webhooks) | CORS, Talking to your API |
| 8 | Handle files and media | File uploads |
| 9 | Update live (real-time) | WebSockets |
| 10 | Find things (search) | Indexes, aggregation |
| 11 | Do work later (jobs, queues, schedules) | — |
| 12 | Notify people (email, push, messages) | — |
| 13 | Take money (payments) | — |
| 14 | Make it smart (LLM APIs, RAG, agents, evals) | AI fundamentals notebook (outline) |
| 15 | Automate workflows | n8n notebook (outline) |
| 16 | Make it fast (caching, performance) | Caching, pagination, memo |
| 17 | Serve more people (scale) | Rate limiting, system design notebook |
| 18 | Put it online and keep it running | Git, deploy, CI/CD, containers |
| 19 | Know what's happening (logs, monitoring, analytics) | Observability |
| 20 | Don't break it (testing) | Testing pyramid |

**Part III: The builder's craft** (how building works *now*): turning a vague problem into a clear scope; designing a system; building with AI (specify, generate, read, verify, and knowing what AI gets wrong); debugging; reading docs and other people's code; Git and working with others; shipping, talking to users and iterating.

**Part IV: Build products (the FDE path).** Real problem briefs, from small to large, with less and less help each time: guided → semi-guided → spec only → open brief. Each one goes **discover → scope → design → build → ship → demo → iterate**. The capstone (TaskFlow) is the first of these.

### Every building block has the same chapter layout

| Section | What it gives | Built from what we have |
|---|---|---|
| **The question** | A curiosity hook: the problem as a story | new (1 paragraph) |
| **How it works** | The visual lesson: see it move | MERN lessons, notebooks |
| **The options** | The ways to solve it (stacks, services, libraries) and when to pick each | Skill Pack, skill plans |
| **The modern way** | How you'd build it today with AI and managed services, and what to check yourself | new |
| **Build it** | Practice → mini build | Try steps, sandboxes |
| **Break it** | Debug challenges, common errors | Common errors |
| **Prove it / keep it** | Gate, explain-back, review cards | Gates, review |
| **Go deeper** | Internals, scale, trade-offs | Notebooks, lessons |
| **Look it up** | Quick reference | Techpack |

The scattered sections we have today (Notebooks, Techpack, Skill Pack, gates, errors) are not thrown away. **They become sections of the block they belong to.**

### One home stack, other ways shown

We teach one stack in depth so the learner can actually finish things (today: TypeScript, React, Node/Express, MongoDB). Each block shows the idea *stack-free first*, then "in our stack", then "other ways" (other frameworks, managed services, no-code, AI). The learner learns the problem once and can recognise it in any stack.

---

## 4. Three doors in

| Door | For the learner who says | Leads to |
|---|---|---|
| **Explore** | "How does ___ work?" | A curiosity feed of questions → *How it works* sections → "you can build this" |
| **Build** | "I want to build ___" | Pick or describe an idea → the blocks it needs → a path through just those blocks |
| **Path** | "Teach me from zero" | The guided route: first ship in an hour → foundations → blocks → products → FDE briefs |

All three lead into the same block chapters. Nobody is ever more than one click from building.

---

## 5. The journey from zero to independent builder

| Level | They can… | Proof |
|---|---|---|
| **0 · Curious** | Explain what happens when they open an app | Explain-back |
| **1 · First ship** | Put a page they made on the internet (with AI help) | A live link |
| **2 · Maker** | Build a small app that stores data and has users | Mini build, block gates |
| **3 · Builder** | Combine blocks into a full product and deploy it | Capstone |
| **4 · Product builder** | Add AI, payments, real-time, background jobs; make it reliable | Semi-guided product |
| **5 · Independent (FDE)** | Take a vague real-world problem → discover, scope, build, ship, iterate | Open brief, defended design |

---

## 6. Rules for everything we build from now on

1. **Does it move a curious person up a level?** If not, it waits.
2. **Problem first.** Every page opens with the problem it solves, never with a tool's name.
3. **No empty rooms.** An outline with no content is worse than an honest "coming soon". Depth before breadth.
4. **Something to do on every page.** Predict, try, build, break or explain.
5. **The modern way, honestly.** Show how it's done today, including AI, and what the builder still has to understand and check themselves.
6. **Always the next question, always the next build.**
7. **AI is a pair, not a replacement.** Every *Build it* has a "with AI" path (how to ask, what to check, what AI usually gets wrong here) and a "by hand once" path.

---

## 7. Decisions

| # | Decision | Answer | Decided |
|---|---|---|---|
| 1 | AI from day one? | **Yes.** The learner builds with AI as a pair from the first project. Rule: *understand it before you accept it*. Each building block is also built **by hand once**, so the learner knows what the AI is doing. | 2026-11-26 |
| 2 | What counts as "technology"? | **Software products first: web, mobile, AI, automation.** Other branches (hardware/IoT, games, …) come later as new branches added to the same manual. | 2026-11-26 |
| 3 | Home stack | **One stack taught in depth: TypeScript, React, Node/Express, MongoDB.** Each block shows the idea without a stack first, then in our stack, then "other ways". | 2026-11-26 |
| 4 | Organise by building block; Frontend/Backend/… become a filter | **Yes.** The Manual (`/manual`) is the table of contents. Topics stay as a lens: a colour and a filter. Old URLs and saved progress keep working. | 2026-11-26 |
| 5 | How content gets written at this scale | **AI drafts each section; the owner reviews and corrects it.** A chapter is only marked complete after that review. | 2026-11-26 |
| 6 | Accounts, synced progress, community | **Later.** Build the product first; accounts, sync and community come after the manual works. Progress stays in the browser until then. | 2026-11-26 |
| 7 | Language(s) | **English** for now. | 2026-11-26 |
| 8 | Free vs paid | **Free.** The focus now is building the product. | 2026-11-26 |
| 9 | Time and pace | **Quality over speed.** No deadline. The bar is a product the owner is truly satisfied with. | 2026-11-26 |

Phases that turn this vision into the app: `docs/PLAN-MANUAL.md`.
