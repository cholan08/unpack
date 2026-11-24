/* Techpack — quick-reference cheat sheets, one per technology in the MERN stack.
   `icon` is a Skill Pack icon key (./skillpack/icons.tsx) or a lucide fallback key
   handled in TechpackPage. `lesson` links an entry back to the lesson that unpacks it. */

export type TechEntry = {
  title: string;
  code: string;
  lang?: string;
  note?: string;
  lesson?: string;
};
export type TechSection = { title: string; entries: TechEntry[] };
export type TechSheet = {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  accent: 'client' | 'server' | 'data' | 'net' | 'auth';
  sections: TechSection[];
};

export const TECH_SHEETS: TechSheet[] = [
  {
    id: 'javascript',
    name: 'JavaScript',
    tagline: 'The language every layer speaks',
    icon: 'javascript',
    accent: 'net',
    sections: [
      {
        title: 'Values & copies',
        entries: [
          {
            title: 'Copy, don’t mutate',
            code: `const next = { ...user, name: 'Ada' };\nconst list2 = [...list, item];\nconst deep = structuredClone(obj);`,
            lang: 'js',
            note: 'Spread is shallow: nested objects are still shared.',
            lesson: 'values-references',
          },
          {
            title: 'Destructure with defaults',
            code: `const { page = 1, limit = 20 } = req.query;\nconst [first, ...rest] = items;`,
            lang: 'js',
          },
          {
            title: 'Optional chaining & nullish',
            code: `const city = user?.address?.city ?? 'Unknown';`,
            lang: 'js',
            note: '?? only falls back on null/undefined, not on 0 or "".',
          },
        ],
      },
      {
        title: 'Async',
        entries: [
          {
            title: 'async / await with try',
            code: `async function load() {\n  try {\n    const res = await fetch('/api/tasks');\n    if (!res.ok) throw new Error(res.statusText);\n    return await res.json();\n  } catch (err) {\n    console.error(err);\n  }\n}`,
            lang: 'js',
            lesson: 'promises',
          },
          {
            title: 'Run in parallel',
            code: `const [user, tasks] = await Promise.all([\n  getUser(id),\n  getTasks(id),\n]);`,
            lang: 'js',
            note: 'Use Promise.allSettled when one failure must not cancel the rest.',
          },
          {
            title: 'Microtask vs macrotask',
            code: `setTimeout(() => log('timeout'));\nPromise.resolve().then(() => log('promise'));\nlog('sync');\n// sync → promise → timeout`,
            lang: 'js',
            lesson: 'event-loop',
          },
        ],
      },
      {
        title: 'Arrays',
        entries: [
          {
            title: 'map · filter · reduce',
            code: `const total = cart\n  .filter((i) => i.inStock)\n  .map((i) => i.price * i.qty)\n  .reduce((sum, n) => sum + n, 0);`,
            lang: 'js',
          },
          {
            title: 'Find & check',
            code: `items.find((i) => i.id === id);\nitems.some((i) => i.done);\nitems.every((i) => i.done);\nitems.includes('react');`,
            lang: 'js',
          },
        ],
      },
    ],
  },
  {
    id: 'react',
    name: 'React',
    tagline: 'UI as a function of state',
    icon: 'react',
    accent: 'client',
    sections: [
      {
        title: 'State',
        entries: [
          {
            title: 'useState with updater',
            code: `const [count, setCount] = useState(0);\nsetCount((c) => c + 1); // safe with batching`,
            lang: 'jsx',
            lesson: 'react-rendering',
          },
          {
            title: 'Update objects & arrays',
            code: `setUser((u) => ({ ...u, name }));\nsetTodos((t) => t.filter((x) => x.id !== id));`,
            lang: 'jsx',
            note: 'Never mutate state: React compares by reference.',
          },
        ],
      },
      {
        title: 'Effects',
        entries: [
          {
            title: 'Fetch with cleanup',
            code: `useEffect(() => {\n  const ctrl = new AbortController();\n  fetch(url, { signal: ctrl.signal })\n    .then((r) => r.json())\n    .then(setData);\n  return () => ctrl.abort();\n}, [url]);`,
            lang: 'jsx',
            lesson: 'use-effect',
          },
          {
            title: 'Dependency rules',
            code: `useEffect(fn);        // every render\nuseEffect(fn, []);    // once, on mount\nuseEffect(fn, [id]);  // when id changes`,
            lang: 'jsx',
          },
        ],
      },
      {
        title: 'Lists, context, memo',
        entries: [
          {
            title: 'Keys from data',
            code: `{todos.map((t) => (\n  <Todo key={t._id} todo={t} />\n))}`,
            lang: 'jsx',
            note: 'Index keys break when items are inserted or reordered.',
            lesson: 'lists-keys',
          },
          {
            title: 'Context',
            code: `const Auth = createContext(null);\n<Auth.Provider value={user}>{children}</Auth.Provider>\nconst user = useContext(Auth);`,
            lang: 'jsx',
            lesson: 'context',
          },
          {
            title: 'Skip work',
            code: `const sorted = useMemo(() => sort(list), [list]);\nconst onSave = useCallback(() => save(id), [id]);\nexport default memo(Row);`,
            lang: 'jsx',
            lesson: 'memo',
          },
        ],
      },
    ],
  },
  {
    id: 'node',
    name: 'Node.js',
    tagline: 'JavaScript outside the browser',
    icon: 'node',
    accent: 'data',
    sections: [
      {
        title: 'Runtime basics',
        entries: [
          {
            title: 'ES modules',
            code: `// package.json → "type": "module"\nimport fs from 'node:fs/promises';\nexport function helper() {}`,
            lang: 'js',
            lesson: 'modules',
          },
          {
            title: 'Read a file',
            code: `const text = await fs.readFile('notes.txt', 'utf8');`,
            lang: 'js',
            lesson: 'node-runtime',
          },
          {
            title: 'Environment config',
            code: `// node --env-file=.env index.js\nconst port = process.env.PORT ?? 3000;`,
            lang: 'js',
            note: 'Keep .env out of git; commit a .env.example instead.',
            lesson: 'config',
          },
        ],
      },
      {
        title: 'npm',
        entries: [
          {
            title: 'Everyday commands',
            code: `npm init -y\nnpm i express mongoose\nnpm i -D nodemon\nnpm run dev`,
            lang: 'bash',
          },
        ],
      },
    ],
  },
  {
    id: 'express',
    name: 'Express',
    tagline: 'Routes, middleware, responses',
    icon: 'express',
    accent: 'server',
    sections: [
      {
        title: 'App skeleton',
        entries: [
          {
            title: 'Minimal server',
            code: `import express from 'express';\nconst app = express();\napp.use(express.json());\n\napp.get('/api/health', (req, res) => res.json({ ok: true }));\napp.listen(3000);`,
            lang: 'js',
            lesson: 'rest-api',
          },
          {
            title: 'Router per resource',
            code: `const r = express.Router();\nr.get('/', list);\nr.post('/', create);\nr.patch('/:id', update);\nr.delete('/:id', remove);\napp.use('/api/tasks', r);`,
            lang: 'js',
          },
        ],
      },
      {
        title: 'Middleware & errors',
        entries: [
          {
            title: 'Custom middleware',
            code: `function logger(req, res, next) {\n  console.log(req.method, req.url);\n  next();\n}\napp.use(logger);`,
            lang: 'js',
            lesson: 'middleware',
          },
          {
            title: 'Central error handler',
            code: `app.use((err, req, res, next) => {\n  res.status(err.status ?? 500)\n     .json({ error: err.message });\n});`,
            lang: 'js',
            note: 'Four arguments, registered last.',
            lesson: 'errors',
          },
          {
            title: 'Status codes to know',
            code: `200 OK        201 Created    204 No Content\n400 Bad Req   401 Unauth     403 Forbidden\n404 Not Found 409 Conflict   500 Server Error`,
            lang: 'plain',
            lesson: 'http',
          },
        ],
      },
    ],
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    tagline: 'Documents, queries, indexes',
    icon: 'mongodb',
    accent: 'data',
    sections: [
      {
        title: 'CRUD',
        entries: [
          {
            title: 'Create & read',
            code: `db.tasks.insertOne({ title: 'Ship', done: false });\ndb.tasks.find({ done: false }).sort({ createdAt: -1 }).limit(10);`,
            lang: 'js',
            lesson: 'crud',
          },
          {
            title: 'Update & delete',
            code: `db.tasks.updateOne({ _id }, { $set: { done: true } });\ndb.tasks.updateOne({ _id }, { $push: { tags: 'urgent' } });\ndb.tasks.deleteOne({ _id });`,
            lang: 'js',
          },
          {
            title: 'Query operators',
            code: `{ age: { $gte: 18, $lt: 65 } }\n{ tag: { $in: ['a', 'b'] } }\n{ $or: [{ done: true }, { archived: true }] }`,
            lang: 'js',
          },
        ],
      },
      {
        title: 'Performance',
        entries: [
          {
            title: 'Index what you filter',
            code: `db.tasks.createIndex({ owner: 1, createdAt: -1 });\ndb.tasks.find({ owner }).explain('executionStats');`,
            lang: 'js',
            lesson: 'indexes',
          },
          {
            title: 'Aggregate',
            code: `db.orders.aggregate([\n  { $match: { status: 'paid' } },\n  { $group: { _id: '$userId', total: { $sum: '$amount' } } },\n  { $sort: { total: -1 } },\n]);`,
            lang: 'js',
            lesson: 'aggregation',
          },
        ],
      },
      {
        title: 'Mongoose',
        entries: [
          {
            title: 'Schema & model',
            code: `const Task = model('Task', new Schema({\n  title: { type: String, required: true },\n  done: { type: Boolean, default: false },\n  owner: { type: Schema.Types.ObjectId, ref: 'User' },\n}, { timestamps: true }));`,
            lang: 'js',
            lesson: 'mongoose',
          },
          {
            title: 'Populate a reference',
            code: `await Task.find({ done: false }).populate('owner', 'name');`,
            lang: 'js',
            lesson: 'embed-reference',
          },
        ],
      },
    ],
  },
  {
    id: 'auth',
    name: 'Auth',
    tagline: 'Hash, sign, verify',
    icon: 'lock',
    accent: 'auth',
    sections: [
      {
        title: 'Passwords & tokens',
        entries: [
          {
            title: 'Hash a password',
            code: `const hash = await bcrypt.hash(password, 12);\nconst ok = await bcrypt.compare(password, hash);`,
            lang: 'js',
            note: 'Never store or log the plain password.',
            lesson: 'hashing',
          },
          {
            title: 'Sign & verify a JWT',
            code: `const token = jwt.sign({ sub: user.id }, SECRET, { expiresIn: '15m' });\nconst payload = jwt.verify(token, SECRET);`,
            lang: 'js',
            lesson: 'jwt-auth',
          },
          {
            title: 'Protect a route',
            code: `function requireAuth(req, res, next) {\n  const token = req.headers.authorization?.split(' ')[1];\n  try { req.user = jwt.verify(token, SECRET); next(); }\n  catch { res.sendStatus(401); }\n}`,
            lang: 'js',
            lesson: 'protected-routes',
          },
        ],
      },
    ],
  },
  {
    id: 'git',
    name: 'Git',
    tagline: 'Save points for your code',
    icon: 'git',
    accent: 'server',
    sections: [
      {
        title: 'Daily loop',
        entries: [
          {
            title: 'Branch, commit, push',
            code: `git switch -c feature/login\ngit add -p\ngit commit -m "Add login form"\ngit push -u origin feature/login`,
            lang: 'bash',
            lesson: 'git',
          },
          {
            title: 'Look around',
            code: `git status\ngit log --oneline --graph\ngit diff --staged`,
            lang: 'bash',
          },
          {
            title: 'Undo safely',
            code: `git restore file.js          # drop local edits\ngit restore --staged file.js # unstage\ngit commit --amend           # fix last commit`,
            lang: 'bash',
          },
        ],
      },
    ],
  },
];
