import { box, chip, db, defineLesson, doc, field, flow, link, patch } from '@/content/dsl';
import type { Field, LinkSpec, NodeSpec } from '@/engine/types';

/* ---------- layout: route → model (compiled from the schema above it) → collection ---------- */
const api = box(120, 330, 'Express route', { sub: 'Todo.create(req.body)', icon: 'express', tone: 'server', w: 226 });
const schema = doc(430, 125, 'todoSchema', [
  field('text', 'String · required · maxlength 200'),
  field('done', 'Boolean · default false'),
  field('priority', 'Number · min 1 · max 5'),
  field('dueAt', 'Date'),
  field('userId', 'ObjectId · required'),
], { w: 330, tone: 'server', icon: 'file' });
const model = box(430, 330, 'Todo model', { sub: 'collection: todos', icon: 'boxes', tone: 'server', w: 216 });
const mongo = db(805, 330, 'todos', { sub: 'collection', w: 150, h: 112 });

const input = (fields: Field[], label = 'req.body') => doc(200, 500, label, fields, { w: 270, tone: 'client', icon: 'json' });
const saved = (fields: Field[], label = 'saved document') => doc(805, 128, label, fields, { w: 290 });

const base: Record<string, NodeSpec> = { api, schema, model, mongo };
const links: LinkSpec[] = [
  link('api', 'model'),
  link('schema', 'model', { style: 'dashed', label: 'compiled into' }),
  link('model', 'mongo'),
  link('input', 'api', { style: 'dashed', arrow: false }),
  link('mongo', 'out', { style: 'dashed', arrow: false }),
];
const through = (label: string[], o: Parameters<typeof flow>[1] = {}) =>
  flow(['api', 'model', 'mongo'], { kind: 'data', label, back: 'res', backLabel: ['saved', '201'], every: 4.8, ...o });

const schemaCode = `const todoSchema = new Schema({
  text:     { type: String, required: true, trim: true, maxlength: 200 },
  done:     { type: Boolean, default: false },
  priority: { type: Number, min: 1, max: 5, default: 3 },
  dueAt:    Date,
  userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
}, { timestamps: true });

export const Todo = model('Todo', todoSchema); // → collection "todos"`;

export default defineLesson({
  metrics: [{ id: 'bad', label: 'Bad documents saved', better: 'lower' }],
  goals: [
    { text: 'Why the raw driver isn’t enough', step: 1 },
    { text: 'Schemas and models', step: 2 },
    { text: 'Casting and validation', step: 3 },
    { text: 'The update-validator gotcha', step: 5 },
    { text: 'Hooks and instance methods', step: 7 },
    { text: 'Faster reads with lean()', step: 8 },
  ],
  steps: [
    {
      short: 'Anything goes',
      beat: 'problem',
      title: 'The driver will store anything you give it',
      body: [
        'The MongoDB driver is a faithful messenger: `insertOne(req.body)` writes whatever arrives. An empty text, a priority of `"high"`, a misspelled `isDone`, even a `role` field the client made up — all saved.',
        'Every bad document becomes a bug later: blank rows, broken sorts, filters that miss things.',
      ],
      code: { file: 'routes/todos.js', lang: 'js', code: `// raw driver: no schema, no checks\nawait db.collection('todos').insertOne(req.body);`, err: [2] },
      metrics: { bad: 1 },
      scene: {
        nodes: {
          api: { ...api, sub: 'insertOne(req.body)' },
          mongo: { ...mongo, state: 'error', badge: { text: 'stored as-is', tone: 'danger' } },
          input: input([field('text', '""', { hl: true }), field('priority', '"high"', { hl: true }), field('isDone', '"yes"', { hl: true }), field('role', '"admin"', { hl: true })]),
        },
        links: [link('api', 'mongo'), link('input', 'api', { style: 'dashed', arrow: false })],
        flows: [flow(['api', 'mongo'], { kind: 'data', label: 'whatever arrived', back: 'res', backLabel: 'ok ¯\\_(ツ)_/¯', every: 4 })],
      },
    },
    {
      short: 'Schema',
      beat: 'solution',
      title: 'A schema describes the shape; a model enforces it',
      body: [
        '[[mongoose|Mongoose]] adds a [[schema]]: field names, types, required fields, limits and defaults. Compiling a schema gives you a [[model]] — `Todo` — bound to the `todos` collection.',
        'From now on, every write goes **through** the model, and the model checks the data against the schema first.',
      ],
      code: { file: 'models/Todo.js', lang: 'js', code: schemaCode, hl: [1, 9] },
      changes: ['+ todoSchema describes valid todos', '+ Todo model sits between your routes and the collection'],
      metrics: { bad: 0 },
      scene: { nodes: patch(base, { model: { state: 'active' } }), links: links.slice(0, 3), flows: [through(['Todo.create()', 'insertOne'])] },
    },
    {
      short: 'Casting',
      beat: 'technique',
      title: 'Casting: turning input into the right types',
      body: [
        'JSON from the browser is mostly strings. The model [[cast|casts]] each field to its schema type: `"2"` becomes the number 2, `"2026-12-01"` becomes a real `Date`, `trim` strips the spaces. Fields not in the schema are dropped.',
        'If a value can’t be converted — `priority: "high"` — you get a `CastError` instead of a bad document.',
      ],
      code: {
        file: 'try it',
        lang: 'js',
        code: `const t = new Todo({ text: '  Buy milk  ', priority: '2', dueAt: '2026-12-01', role: 'admin' });
t.text;      // 'Buy milk'           (trimmed)
t.priority;  // 2                    (number)
t.dueAt;     // 2026-12-01T00:00:00.000Z (Date)
t.role;      // undefined            (not in the schema → dropped)`,
        hl: [2, 3, 4, 5],
      },
      metrics: { bad: 0 },
      scene: {
        nodes: {
          ...base,
          input: input([field('text', '"  Buy milk  "'), field('priority', '"2"', { hl: true }), field('dueAt', '"2026-12-01"', { hl: true }), field('role', '"admin"')]),
          out: saved([field('text', '"Buy milk"'), field('priority', '2', { hl: true }), field('dueAt', 'ISODate("2026-12-01")', { hl: true }), field('done', 'false'), field('createdAt', 'ISODate(…)')]),
        },
        links,
        flows: [through(['strings', 'typed values'])],
      },
    },
    {
      short: 'Validation',
      beat: 'technique',
      title: 'Validation: bad data never reaches the database',
      body: [
        'Before saving, the model runs its validators: `required`, `min`/`max`, `maxlength`, `enum`, and any custom ones. If anything fails, it throws a `ValidationError` listing every problem by field — and nothing is written.',
        'Your error handler can turn that into a `400` with per-field messages for the form.',
      ],
      code: {
        file: 'routes/todos.js',
        lang: 'js',
        code: `try {
  await Todo.create({ text: '', priority: 9, userId });
} catch (err) {
  err.name;                   // 'ValidationError'
  err.errors.text.message;    // 'Path \`text\` is required.'
  err.errors.priority.message;// 'Path \`priority\` (9) is more than maximum allowed value (5).'
}`,
        hl: [4, 5, 6],
      },
      metrics: { bad: 0 },
      scene: {
        nodes: {
          ...patch(base, { model: { state: 'error' } }),
          input: input([field('text', '""', { hl: true }), field('priority', '9', { hl: true })]),
          err: chip(580, 470, 'ValidationError · text, priority', { tone: 'danger', icon: 'ban', w: 290, state: 'error' }),
        },
        links: [...links.slice(0, 4), link('model', 'err', { tone: 'danger' })],
        flows: [flow(['api', 'model'], { kind: 'data', label: 'create({ text: "" })', back: 'err', backLabel: 'ValidationError', every: 4 })],
      },
    },
    {
      short: 'Update gotcha',
      beat: 'problem',
      title: 'Updates skip validators — unless you ask',
      body: [
        'Here’s the gotcha: `create()` and `save()` validate, but `updateOne`, `updateMany` and `findByIdAndUpdate` **don’t** run validators by default. Values are still cast to the right type, but `max: 5` is not checked.',
        'Pass `{ runValidators: true }` on updates (or set it globally) so the rules apply to every write.',
      ],
      check: {
        q: 'The schema says `priority: { max: 5 }`. You run `Todo.updateOne({ _id }, { priority: 99 })` with default options. What happens?',
        options: ['A ValidationError is thrown', 'It saves 99 — update validators are off by default', 'It is clamped to 5', 'The update is ignored'],
        answer: 1,
        explain: 'Update validators are opt-in. Use `{ runValidators: true }`, or `mongoose.set(\'runValidators\', true)` once at startup.',
      },
      code: {
        file: 'routes/todos.js',
        lang: 'js',
        code: `await Todo.updateOne({ _id }, { priority: 99 });                         // ❌ saved: 99
await Todo.updateOne({ _id }, { priority: 99 }, { runValidators: true }); // ✅ ValidationError`,
        err: [1],
        hl: [2],
      },
      metrics: { bad: 1 },
      scene: {
        nodes: {
          ...patch(base, { api: { sub: 'Todo.updateOne(…)' }, model: { badge: { text: 'validators off', tone: 'warn' } }, mongo: { state: 'error' } }),
          out: saved([field('text', '"Buy milk"'), field('priority', '99', { hl: true }), field('done', 'false')], 'stored document'),
        },
        links: [...links.slice(0, 3), link('mongo', 'out', { style: 'dashed', arrow: false })],
        flows: [through(['priority: 99', '$set priority 99'], { backLabel: ['modified', 'ok'] })],
      },
    },
    {
      short: 'Defaults',
      beat: 'technique',
      title: 'Defaults, timestamps and virtuals',
      body: [
        'Schemas fill in what the client didn’t send: `default: false` for `done`, and `{ timestamps: true }` adds `createdAt` and `updatedAt`, maintained for you.',
        'A **virtual** is a computed property that isn’t stored — like `isOverdue`, derived from `dueAt` each time you read it. It never goes stale because it’s never saved.',
      ],
      code: {
        file: 'models/Todo.js',
        lang: 'js',
        code: `todoSchema.virtual('isOverdue').get(function () {
  return !this.done && this.dueAt != null && this.dueAt < new Date();
});

todoSchema.set('toJSON', { virtuals: true }); // include it in res.json()`,
        hl: [1, 2],
      },
      metrics: { bad: 0 },
      scene: {
        nodes: {
          ...base,
          input: input([field('text', '"Buy milk"'), field('dueAt', '"2026-11-20"')]),
          out: saved([field('text', '"Buy milk"'), field('done', 'false', { hl: true }), field('createdAt', 'ISODate(…)', { hl: true }), field('updatedAt', 'ISODate(…)', { hl: true }), field('isOverdue', 'true  (virtual)')]),
        },
        links,
        flows: [through(['2 fields', '+ defaults'])],
      },
    },
    {
      short: 'Hooks',
      beat: 'technique',
      title: 'Hooks and methods: behaviour that travels with the model',
      body: [
        'A [[hook|middleware hook]] runs code around an operation. The classic: hash the password in `pre(\'save\')`, so no route can ever store a plain one by forgetting.',
        '**Methods** put behaviour on each document — `user.checkPassword(plain)` — so the logic lives next to the data it uses.',
      ],
      code: {
        file: 'models/User.js',
        lang: 'js',
        code: `userSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
});

userSchema.methods.checkPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};`,
        hl: [1, 3, 7],
      },
      metrics: { bad: 0 },
      scene: {
        nodes: {
          api: { ...api, sub: 'User.create(req.body)' },
          model: { ...model, label: 'User model', sub: 'collection: users' },
          hook: box(480, 480, 'pre("save")', { sub: 'hash the password', icon: 'fingerprint', tone: 'auth', w: 216, state: 'active' }),
          mongo: { ...mongo, label: 'users' },
          input: input([field('email', '"ana@ex.com"'), field('password', '"hunter2"', { hl: true })]),
          out: saved([field('email', '"ana@ex.com"'), field('password', '"$2b$12$x9Qz…"', { hl: true })]),
        },
        links: [link('api', 'model'), link('model', 'hook'), link('hook', 'mongo'), link('input', 'api', { style: 'dashed', arrow: false }), link('mongo', 'out', { style: 'dashed', arrow: false })],
        flows: [flow(['api', 'model', 'hook', 'mongo'], { kind: 'auth', label: ['hunter2', 'save()', '$2b$12$…'], every: 5, dwell: 0.4 })],
      },
    },
    {
      short: 'lean()',
      beat: 'technique',
      title: 'Read with lean() when you just send JSON',
      body: [
        'By default, queries return full Mongoose documents: change tracking, getters, virtuals and `.save()` on every result. That’s useful when you’ll modify and save them — and wasted work when you only `res.json()` them.',
        '[[lean|.lean()]] returns plain JavaScript objects instead: much lighter and faster for read-only endpoints. (Virtuals and getters aren’t applied, since there’s no document.)',
      ],
      code: {
        file: 'routes/todos.js',
        lang: 'js',
        code: `// full documents: needed if you'll change and .save() them
const todo = await Todo.findById(id);
todo.done = true;
await todo.save();

// plain objects: ideal when you only send JSON
res.json(await Todo.find({ userId }).lean());`,
        hl: [7],
      },
      metrics: { bad: 0 },
      scene: {
        nodes: {
          ...patch(base, { api: { sub: 'find().lean()' }, model: { badge: { text: 'skips hydration', tone: 'ok' } } }),
          out: saved([field('_id', 'ObjectId(…)'), field('text', '"Buy milk"'), field('done', 'false')], 'plain object'),
        },
        links: [...links.slice(0, 3), link('mongo', 'out', { style: 'dashed', arrow: false })],
        flows: [flow(['api', 'model', 'mongo'], { label: ['find', 'find'], back: 'res', backLabel: ['raw docs', 'plain objects'], every: 4.4 })],
      },
    },
    {
      short: 'Its limits',
      beat: 'tradeoff',
      title: 'Mongoose only guards writes that go through it',
      body: [
        'The schema lives in your Node code. A migration script using the raw driver, a quick fix in `mongosh`, or another service writing to the same database all bypass it completely.',
        'For rules that must **never** be broken, add them in the database too: a unique index for emails, a `$jsonSchema` validator for required fields. Mongoose is your first line of defence, not the only one.',
      ],
      metrics: { bad: 1 },
      scene: {
        nodes: {
          ...base,
          script: box(430, 500, 'migration script', { sub: 'raw driver · no schema', icon: 'terminal', tone: 'danger', w: 236 }),
          mongo: { ...mongo, badge: { text: 'needs its own rules', tone: 'warn' } },
        },
        links: [...links.slice(0, 3), link('script', 'mongo', { tone: 'danger', style: 'dashed', label: 'bypasses the model' })],
        flows: [through(['create()', 'insertOne']), flow(['script', 'mongo'], { kind: 'err', label: 'insertMany(raw)', every: 4.8, offset: 2.4 })],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'What Mongoose gives you',
      body: [
        'A {server:schema} describes valid documents; a {server:model} enforces it on every write that goes through it.',
        'Input is cast to the right types and validated before saving — remember `runValidators` for updates. Defaults, timestamps and virtuals fill in the rest.',
        'Hooks and methods keep behaviour next to the data. Use `lean()` for read-only queries, and back critical rules with database-level constraints.',
      ],
      metrics: { bad: 0 },
      scene: {
        nodes: { ...base, out: saved([field('text', '"Buy milk"'), field('priority', '2'), field('done', 'false'), field('createdAt', 'ISODate(…)')]) },
        links: [...links.slice(0, 3), link('mongo', 'out', { style: 'dashed', arrow: false })],
        flows: [through(['create()', 'insertOne'])],
      },
    },
  ],
});
