import { box, chip, db, defineLesson, doc, field, flow, item, link, stack, zone } from '@/content/dsl';
import type { LinkSpec, NodeSpec } from '@/engine/types';

/* ---------- layout: client · server · data columns, filled in step by step ---------- */
const zc = zone(165, 310, 290, 548, 'Client', { tone: 'client', icon: 'browser' });
const zs = zone(500, 310, 300, 548, 'Server', { tone: 'server', icon: 'server' });
const zd = zone(835, 310, 300, 548, 'Data', { tone: 'data', icon: 'db' });
const zones = { zc, zs, zd };

const spa = box(165, 140, 'React SPA', { sub: 'Vite build on a CDN', icon: 'react', tone: 'client', w: 230 });
const fe = stack(165, 380, 'Front-end structure', [
  item('f1', 'routes + <RequireAuth>', { tone: 'client' }),
  item('f2', 'AuthProvider (useAuth)', { tone: 'client' }),
  item('f3', 'api.js client', { tone: 'client' }),
  item('f4', 'TanStack Query cache', { tone: 'client' }),
  item('f5', 'components', { tone: 'client' }),
], { w: 250, h: 250, from: 'top', mono: true, icon: 'component', tone: 'client' });
const api = box(500, 140, 'Express API', { sub: 'on a PaaS', icon: 'express', tone: 'server', w: 230 });
const pipeline = stack(500, 380, 'Request pipeline', [
  item('p1', 'helmet · rateLimit', { tone: 'auth' }),
  item('p2', 'express.json · session', { tone: 'server' }),
  item('p3', 'requireAuth', { tone: 'auth' }),
  item('p4', 'validate(schema)', { tone: 'auth' }),
  item('p5', 'routes → controllers', { tone: 'server' }),
  item('p6', 'errorHandler', { tone: 'danger' }),
], { w: 250, h: 270, from: 'top', mono: true, icon: 'filter', tone: 'server' });
const atlas = db(835, 140, 'MongoDB Atlas', { sub: 'replica set', w: 180, h: 110 });
const users = doc(835, 320, 'users', [field('email', '"ana@ex.com"'), field('passwordHash', '"$2b$12$…"')], { w: 260 });
const todos = doc(835, 480, 'todos', [field('userId', 'ObjectId(…)', { hl: true }), field('text', '"Buy milk"'), field('done', 'false')], { w: 260, sub: 'idx userId+createdAt' });

const fullNodes: Record<string, NodeSpec> = { ...zones, spa, fe, api, pipeline, atlas, users, todos };
const fullLinks: LinkSpec[] = [link('spa', 'api', { label: 'HTTPS · JSON · cookie' }), link('api', 'atlas'), link('spa', 'fe', { style: 'dashed', arrow: false }), link('api', 'pipeline', { style: 'dashed', arrow: false })];
const roundTrip = flow(['spa', 'api', 'atlas'], { kind: 'data', label: ['POST /api/todos', 'insertOne'], back: 'res', backLabel: ['saved', '201'], every: 5 });

export default defineLesson({
  metrics: [
    { id: 'todos', label: 'Todos to store' },
    { id: 'servers', label: 'API servers needed' },
  ],
  goals: [
    { text: 'Turning requirements into numbers', step: 1 },
    { text: 'A data model you can query', step: 2 },
    { text: 'The API surface', step: 3 },
    { text: 'Backend and frontend structure', step: 4 },
    { text: 'Security and shipping checklists', step: 6 },
  ],
  steps: [
    {
      short: 'Requirements',
      beat: 'setup',
      title: 'Start from requirements — and numbers',
      body: [
        'Before code, write down what the app must do and how big it will get. Features: accounts, add/edit/complete/delete todos, filtering, works on phones, private by default.',
        'Numbers: 10,000 users × ~50 todos = 500,000 documents, maybe 20 requests per second at peak. That’s small: one database cluster and one or two API instances are plenty. Design for what you have, with room to grow.',
      ],
      metrics: { todos: 500000, servers: 1 },
      scene: {
        nodes: {
          req: stack(500, 300, 'Requirements', [
            item('r1', 'sign up · log in · log out', { tone: 'auth' }),
            item('r2', 'add · edit · complete · delete', { tone: 'client' }),
            item('r3', 'filter open/done · search', { tone: 'client' }),
            item('r4', 'fast on phones', { tone: 'client' }),
            item('r5', '10k users × 50 todos', { tone: 'data' }),
            item('r6', 'nobody sees others’ todos', { tone: 'auth' }),
          ], { w: 380, h: 320, from: 'top', mono: true, icon: 'book', tone: 'neutral' }),
        },
      },
    },
    {
      short: 'Data model',
      beat: 'technique',
      title: 'The data model',
      body: [
        'Two collections. `users` holds email and a bcrypt hash. `todos` are separate documents that **reference** their owner with `userId` — some users will have thousands, and we page and filter them.',
        'Index what the main screen queries: `{ userId: 1, createdAt: -1 }` serves “my todos, newest first”, with or without a `done` filter added as the list grows.',
      ],
      check: {
        q: 'Most users have ~50 todos, a few have 20,000. Where should todos live?',
        options: ['An array inside each user document', 'Their own collection with a userId reference', 'In the browser’s localStorage', 'One document per day'],
        answer: 1,
        explain: 'An unbounded, paged, filtered list belongs in its own collection with an index on userId. Embedding would hit the 16 MB limit and drag huge documents around.',
      },
      code: {
        file: 'models/Todo.js',
        lang: 'js',
        code: `const todoSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text:   { type: String, required: true, trim: true, maxlength: 200 },
  done:   { type: Boolean, default: false },
  dueAt:  Date,
}, { timestamps: true });
todoSchema.index({ userId: 1, createdAt: -1 });`,
        hl: [2, 7],
      },
      metrics: { todos: 500000, servers: 1 },
      scene: { nodes: { zd, atlas, users, todos }, links: [link('atlas', 'users', { style: 'dashed', arrow: false }), link('atlas', 'todos', { route: 'left', bend: 30, style: 'dashed', arrow: false })] },
    },
    {
      short: 'API',
      beat: 'technique',
      title: 'The API surface',
      body: [
        'A small REST API covers every feature. Auth endpoints set and clear an httpOnly session cookie; todo endpoints are always scoped to `req.user`.',
        'Lists use cursor pagination and query-string filters, so the same endpoint serves the main screen, filters and infinite scroll.',
      ],
      code: {
        lang: 'text',
        file: 'routes',
        code: `POST   /api/auth/signup     create user, start session
POST   /api/auth/login      check password, start session
POST   /api/auth/logout     destroy session
GET    /api/me              who am I?
GET    /api/todos?done=&before=   my todos, 20 at a time
POST   /api/todos           create
PATCH  /api/todos/:id       update (mine only)
DELETE /api/todos/:id       delete (mine only)`,
      },
      metrics: { todos: 500000, servers: 1 },
      scene: { nodes: { zs, zd, api, atlas, todos }, links: [link('api', 'atlas'), link('atlas', 'todos', { style: 'dashed', arrow: false })], flows: [flow(['api', 'atlas'], { label: 'find({ userId })', back: 'res', every: 3.4 })] },
    },
    {
      short: 'Backend',
      beat: 'technique',
      title: 'The backend: one pipeline for every request',
      body: [
        'Every request walks the same middleware line: security headers and rate limits, body and session parsing, `requireAuth`, schema validation, then the route’s controller, with one error handler at the end.',
        'Controllers stay tiny: they take validated input and `req.user`, call the Mongoose model, return JSON. Config comes from validated env vars; logs are structured with request ids.',
      ],
      metrics: { todos: 500000, servers: 1 },
      scene: {
        nodes: { zs, zd, api, pipeline, atlas },
        links: [link('api', 'pipeline', { style: 'dashed', arrow: false }), link('api', 'atlas')],
        flows: [flow(['api', 'atlas'], { kind: 'data', label: 'validated, scoped', back: 'res', every: 3.4 })],
      },
    },
    {
      short: 'Frontend',
      beat: 'technique',
      title: 'The frontend structure',
      body: [
        'Routes with a `RequireAuth` guard; an `AuthProvider` exposing `useAuth()`; one `api.js` client for URLs, credentials and errors; TanStack Query for fetching, caching and invalidation; and small presentational components.',
        'Each layer does one job, so a bug has an obvious home.',
      ],
      metrics: { todos: 500000, servers: 1 },
      scene: {
        nodes: { zc, zs, spa, fe, api },
        links: [link('spa', 'fe', { style: 'dashed', arrow: false }), link('spa', 'api', { label: 'HTTPS' })],
        flows: [flow(['spa', 'api'], { kind: 'data', label: 'api.todos.create()', back: 'res', every: 3.4 })],
      },
    },
    {
      short: 'Security',
      beat: 'technique',
      title: 'The security checklist',
      body: [
        'Passwords hashed with bcrypt. Sessions in an httpOnly, secure, SameSite cookie. Every todo query includes `userId: req.user.id`. Every body validated with a schema, unknown fields stripped. Login rate-limited. Helmet headers. Secrets only in server env vars.',
        'None of these is optional, and all of them were a lesson in this course.',
      ],
      metrics: { todos: 500000, servers: 1 },
      scene: {
        nodes: {
          ...zones,
          spa,
          api,
          atlas,
          s1: chip(165, 300, 'httpOnly · SameSite', { tone: 'auth', icon: 'cookie', w: 210 }),
          s2: chip(165, 360, 'React escapes text', { tone: 'auth', icon: 'shield', w: 210 }),
          s3: chip(500, 300, 'rate-limited login', { tone: 'auth', icon: 'gauge', w: 220 }),
          s4: chip(500, 360, 'validate + strip', { tone: 'auth', icon: 'filter', w: 220 }),
          s5: chip(500, 420, 'scope by userId', { tone: 'auth', icon: 'key', w: 220 }),
          s6: chip(835, 300, 'bcrypt hashes', { tone: 'auth', icon: 'fingerprint', w: 210 }),
          s7: chip(835, 360, 'least-privilege DB user', { tone: 'auth', icon: 'lock', w: 230 }),
        },
        links: fullLinks.slice(0, 2),
        flows: [roundTrip],
      },
    },
    {
      short: 'Ship it',
      beat: 'technique',
      title: 'Shipping it',
      body: [
        'GitHub with CI on every pull request (lint, unit + API tests, build) and branch protection. Merges deploy automatically: the React build to a static host/CDN with an SPA fallback, the API to a PaaS with a health check, the database on Atlas.',
        'Logs, p95 latency and error-rate alerts from day one. Total cost at this size: close to free.',
      ],
      metrics: { todos: 500000, servers: 2 },
      scene: { nodes: { ...zones, spa: { ...spa, badge: { text: 'CDN', tone: 'net' } }, api: { ...api, badge: { text: '/healthz ✓', tone: 'ok' } }, atlas: { ...atlas, badge: { text: 'backups', tone: 'data' } } }, links: fullLinks.slice(0, 2), flows: [roundTrip] },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'The whole app, one picture',
      body: [
        '{client:React SPA} (routes, auth context, API client, query cache) on a CDN → HTTPS + cookie → {server:Express} (one middleware pipeline, thin controllers, Mongoose models) on a PaaS → {data:MongoDB Atlas} with indexed, user-scoped collections.',
        'Every piece is something you’ve now seen step by step. The next two designs add money and real-time.',
      ],
      metrics: { todos: 500000, servers: 2 },
      scene: { nodes: fullNodes, links: fullLinks, flows: [roundTrip] },
    },
  ],
});
