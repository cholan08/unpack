/**
 * Chapter: Remember things (databases & data modelling).
 * Follows the model chapter, written/identity.ts.
 */
import type { ChapterWriting } from '../types';

const writing: ChapterWriting = {
  hook: {
    story: [
      'Put a pair of shoes in your cart on your phone tonight. Open your laptop tomorrow: they are still there. Restart everything, update the app — still there.',
      'Yet the app’s code forgets everything the moment it stops. Variables vanish on every restart; the browser forgets on every new device. So something outside the code must hold on to your cart — find it again in an instant among millions of carts, and never lose half of it.',
      'What is that something, and how do you decide what shape your data takes inside it?',
    ],
    predict: {
      q: 'Your server keeps todos in a variable: `let todos = []`. You restart the server. What happens to the todos?',
      options: [
        'They are still there — the server kept them in memory',
        'They are gone — the process’s memory is wiped when it stops',
        'They are safe in the browser, so users still see them',
        'Node saves them to disk automatically',
      ],
      answer: 1,
      reveal:
        'Gone. A variable lives in the memory of one running process. A restart, a crash or a deploy starts a fresh process with an empty array. Anything that must survive goes to a **database**: a separate program built to keep data on disk, find it fast, and stay correct while many requests write at once.',
    },
  },

  idea: {
    lede: 'Whatever the database — MongoDB, PostgreSQL, SQLite, or the spreadsheet you outgrew — remembering things comes down to the same four jobs.',
    jobs: [
      {
        title: 'Keep it after the app stops',
        text: 'Data lives in a database: its own program, writing to disk, outside your code. Your server connects, asks, and can forget — the database remembers.',
      },
      {
        title: 'Give it a shape',
        text: 'Decide what each thing looks like — a user, an order, a todo — and how things connect: one user has many orders. That shape is your data model, and it decides how easy everything after it will be.',
      },
      {
        title: 'Find it fast',
        text: 'Ask for exactly what you need — a filter, a sort, only the fields you show — and give the database an [[index]] for the questions you ask often, so it never reads every record to answer one.',
      },
      {
        title: 'Keep it correct',
        text: 'Check data before it is saved, and make writes that belong together happen all-or-nothing, so two shoppers can never both buy the last lamp.',
      },
    ],
    picture:
      'A library. The books stay on the shelves when the librarian goes home (it persists). Every book has a set place and a card that describes it (the shape). The catalogue finds one book among a million without anyone walking every aisle (an index). And when two people ask for the last copy at the same moment, the desk lends it to exactly one of them (a transaction).',
  },

  lessonNotes: {
    documents: 'Jobs 1 and 2: how MongoDB organises data into collections of documents, and what an `_id` really is.',
    crud: 'Create, read, update, delete — the four questions every app asks its database. Watch out for the empty filter.',
    indexes: 'Job 3: why a query slows down as data grows, and the index that makes it fast again.',
    'embed-reference': 'The biggest shape decision: keep related data inside one document, or point to it from another?',
    mongoose: 'Job 4 on the way in: schemas, casting and validation, so bad data never reaches the database.',
    transactions: 'Job 4 under pressure: atomic updates and transactions for writes that must succeed or fail together.',
  },

  options: {
    lede: 'There are hundreds of databases, but most products are built on a few kinds. Many use two at once: a main database, plus a cache or a search engine beside it.',
    items: [
      {
        name: 'Relational (SQL)',
        what: 'Data in tables of rows and columns, linked by keys and queried with SQL. The database itself enforces the shape and the relationships.',
        pickWhen: 'Most products — especially data full of relationships (users, orders, payments, stock) where correctness matters.',
        cost: 'You design tables up front and change them with migrations.',
        examples: 'PostgreSQL, MySQL, SQLite — hosted on Supabase, Neon or Amazon RDS',
        tools: ['postgresql', 'mysql'],
      },
      {
        name: 'Document (NoSQL)',
        what: 'Data as JSON-like documents grouped in collections. A document can hold nested objects and arrays, shaped the way your app reads it.',
        pickWhen: 'Data you read as whole objects (a profile, a post with its tags), shapes that change often, JavaScript stacks — this course uses MongoDB.',
        cost: 'Relationships and consistency rules are more up to you, so a schema in your code (Mongoose) matters.',
        examples: 'MongoDB (Atlas), Firestore, CouchDB',
        tools: ['mongodb', 'couchdb'],
      },
      {
        name: 'Key-value and in-memory',
        what: 'Store a value under a key and get it back in well under a millisecond, usually straight from memory.',
        pickWhen: 'Caches, sessions, counters, rate limits and queues — beside a main database, rarely instead of one.',
        cost: 'Simple lookups only; memory is limited and costs more than disk.',
        examples: 'Redis, Valkey, Memcached; DynamoDB on disk',
        tools: ['redis'],
      },
      {
        name: 'Search engines',
        what: 'Built to find text by relevance — with typos, filters, facets and ranking.',
        pickWhen: 'A real search box over lots of text: products, articles, help pages, logs.',
        cost: 'A second copy of your data that must be kept in sync with the main database.',
        examples: 'Elasticsearch, OpenSearch, Meilisearch, Typesense',
        tools: ['elasticsearch'],
      },
      {
        name: 'Vector search',
        what: 'Stores *embeddings* — lists of numbers that capture meaning — and finds the ones closest to a question.',
        pickWhen: 'AI features: “find similar”, search by meaning, giving a language model your own documents (RAG).',
        cost: 'One more moving part. Often the vector features of your main database are enough to start.',
        examples: 'pgvector for PostgreSQL, MongoDB Atlas Vector Search, Pinecone, Qdrant',
      },
    ],
    choose: [
      { when: 'You are learning, or building along with this course', pick: 'MongoDB with Mongoose. Later, build the same app on PostgreSQL to feel the difference.' },
      { when: 'A typical product: users, orders, payments', pick: 'PostgreSQL — the most common default today. Correct, well supported, and it grows a long way.' },
      { when: 'Data you read as whole objects, with shapes that keep changing', pick: 'A document database such as MongoDB.' },
      { when: 'Something is read far more often than it changes', pick: 'Add Redis as a cache beside your main database.' },
      { when: 'A search box, or AI “find similar”', pick: 'Start with your main database’s text or vector search; add a dedicated engine when it isn’t enough.' },
    ],
  },

  modern: {
    lede: 'You can have a hosted database running in two minutes and let an AI write every query. The decisions that hurt later are not the queries. They are the shape of your data, the missing index, and the write that wasn’t all-or-nothing — and AI makes those decisions quietly unless you make them first.',
    defaults: [
      'Use a managed database (MongoDB Atlas, Supabase, Neon, RDS) with automatic backups — and try a restore once.',
      'Define the shape in code: a Mongoose schema or SQL tables, with validation and `unique` where it matters.',
      'Model for how you read: embed what a thing owns and shows together; reference what is shared or grows without limit.',
      'Index every query a page runs often, and check slow ones with `explain()`.',
      'Make multi-step writes safe: a conditional update, or a transaction.',
      'Keep the connection string in an environment variable, and give the app a database user with only the rights it needs.',
    ],
    aiGood: [
      'Writing queries, filters and aggregation pipelines from plain English',
      'Drafting a schema from a description of your product — as a starting point',
      'Explaining an `explain()` plan or a slow query',
      'Writing seed scripts and realistic test data',
      'Translating a query between MongoDB and SQL',
    ],
    aiWrong: [
      { mistake: 'Embeds a list that grows forever — every comment inside the post, every order inside the user.', fix: 'Reference anything unbounded; a MongoDB document can’t pass 16 MB.' },
      { mistake: 'Reads, checks, then writes — so two requests sell the same last item.', fix: 'Put the check inside the write: `findOneAndUpdate({ _id, stock: { $gte: 1 } }, { $inc: { stock: -1 } })`.' },
      { mistake: 'Uses `updateOne` and trusts the schema to validate it.', fix: 'Mongoose skips validators on updates unless you pass `runValidators: true`.' },
      { mistake: 'Builds a filter straight from `req.body` or `req.query`.', fix: 'Check input types first, or `{ "$ne": null }` walks in ([[nosql-injection|NoSQL injection]]).' },
      { mistake: 'Leaves out indexes: fine with 100 test records, a timeout with a million.', fix: 'Index the fields you filter and sort by; confirm with `explain()`.' },
      { mistake: 'Loads every record and filters in JavaScript.', fix: 'Filter, sort and limit in the query, and ask only for the fields you show.' },
      { mistake: 'Writes `deleteMany({})` in a clean-up script.', fix: 'An empty filter matches everything. Read every update and delete filter before it runs.' },
    ],
  },

  build: {
    title: 'Bookmarks that survive a restart',
    brief: 'Take the bookmarks API from *Answer requests* (or a fresh Express app) and give it a real memory: MongoDB. Restart it, crash it, deploy it — the bookmarks stay.',
    byHand: [
      { title: 'Get a database', text: 'Create a free MongoDB Atlas cluster (or run MongoDB on your machine) and put its connection string in `.env` as `MONGO_URL`.', see: ['documents', 2] },
      { title: 'Connect once, at startup', text: '`await mongoose.connect(process.env.MONGO_URL)` before `app.listen(…)`. If it fails, log why and exit — a server without its database shouldn’t pretend to work.', see: ['config', 4] },
      { title: 'Describe the shape', text: 'A `Bookmark` schema: `url` (required), `title` (required, at most 200 characters), `tags` (a list of strings), with `timestamps: true`.', see: ['mongoose', 2] },
      { title: 'Create and read', text: '`Bookmark.create(data)` on POST. On GET: `Bookmark.find(tag ? { tags: tag } : {}).sort({ createdAt: -1 }).limit(50)`.', see: ['crud', 3] },
      { title: 'Update safely', text: '`PATCH /:id` uses `findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })`, so the schema’s rules still apply.', see: ['mongoose', 5] },
      { title: 'Index what you ask', text: 'You filter by tag and sort newest first, so add `bookmarkSchema.index({ tags: 1, createdAt: -1 })`.', see: ['indexes', 6] },
      { title: 'Prove it remembers', text: 'Create three bookmarks, stop the server, start it again, and list them. Still there.', see: ['mern-map', 7] },
    ],
    withAI: {
      lede: 'Now let your AI assistant do it — with a spec that makes the decisions *you* now understand: the shape, the index, and the safe update.',
      prompt: `Add MongoDB to my Express "Bookmarks API" using Mongoose.

Model
- Bookmark: url (String, required), title (String, required, max 200), tags ([String]), timestamps.
- Index { tags: 1, createdAt: -1 }, because lists are filtered by tag and sorted newest first.

Rules
- Connect once at startup from process.env.MONGO_URL; if it fails, log the reason and exit.
- GET /api/bookmarks: optional ?tag=, newest first, limit 50, return only url, title, tags and createdAt.
- PATCH /api/bookmarks/:id: validate the body with Zod, update with $set and runValidators: true; 404 if not found.
- An invalid ObjectId in the URL returns 404, not 500.
- Never build a query from req.query or req.body without validating the types first.

Then show me the explain('executionStats') output for the list query and tell me whether it uses the index.`,
    },
    verify: [
      'Create three bookmarks, restart the server, list them: all three are back.',
      'In Atlas (or MongoDB Compass), each document has `createdAt` and `updatedAt`.',
      'PATCH a title to 500 characters: **400**, and the database is unchanged.',
      'Request `/api/bookmarks/not-an-id`: **404**, not 500.',
      'Send `?tag[$ne]=x`: you get a 400 or an empty list — never every bookmark.',
      'Run the list query with `explain(\'executionStats\')`: it shows `IXSCAN`, not `COLLSCAN`.',
      'Your connection string appears only in `.env`, and `.env` is in `.gitignore`.',
    ],
  },

  breakIt: [
    {
      title: 'The last lamp',
      lang: 'js',
      code: `const lamp = await Product.findById(id);
if (lamp.stock < 1) return res.status(409).json({ error: 'Sold out' });
lamp.stock -= 1;
await lamp.save();`,
      err: [1, 4],
      answer:
        'Two buyers can both read `stock: 1` before either one saves — and both get the lamp. The check and the change must be one atomic step: `Product.findOneAndUpdate({ _id: id, stock: { $gte: 1 } }, { $inc: { stock: -1 } }, { new: true })`. If it returns `null`, it’s sold out.',
      see: ['transactions', 5],
    },
    {
      title: 'A post with all its comments',
      lang: 'js',
      code: `const postSchema = new Schema({
  title: String,
  body: String,
  comments: [{ author: String, text: String, at: Date }],
});`,
      err: [4],
      answer:
        'Comments grow forever. Every read of the post drags them all along, every new comment rewrites a bigger document, and a popular post eventually hits MongoDB’s 16 MB limit. Embed small, bounded lists you always show together; give comments their own collection with a `postId`, and page through them.',
      see: ['embed-reference', 4],
    },
    {
      title: 'The update that skipped the rules',
      lang: 'js',
      code: `// in the schema: priority: { type: Number, min: 1, max: 5 }
await Todo.updateOne({ _id: id }, { priority: 99 });`,
      err: [2],
      answer:
        'Mongoose validates on `save()` and `create()`, but update queries skip validators unless you ask — so priority 99 is saved. Pass `{ runValidators: true }`, or set `mongoose.set(\'runValidators\', true)` once at startup.',
      see: ['mongoose', 5],
    },
    {
      title: 'Find the user',
      lang: 'js',
      code: `app.post('/api/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(401).json({ error: 'Email or password is incorrect' });
  // …check the password
});`,
      err: [2],
      answer:
        'Send `{ "email": { "$ne": null } }` and the filter becomes “email is not null” — it returns the first user in the collection. That is [[nosql-injection|NoSQL injection]]. Check that `email` is a string first (a Zod schema does it), or turn on Mongoose’s `sanitizeFilter`.',
      see: ['validation', 6],
    },
  ],

  explain: [
    'Why does data in a variable disappear when the server restarts, and where should it live instead?',
    'When would you embed data inside a document, and when would you reference it? Give one example of each.',
    'Two people press Buy on the last item at the same moment. What can go wrong, and how does the database prevent it?',
  ],

  deeper: [
    {
      q: 'SQL or NoSQL — which is better?',
      a: 'Neither, in general. Relational databases enforce structure and relationships; document databases store data the way you read it. Most of the real difference is in your data model — PostgreSQL can store JSON documents, and MongoDB has transactions and schema validation.',
    },
    {
      q: 'What is a migration?',
      a: 'A small script that changes the shape of existing data — add a field, rename one, fill in a default — kept in version control and run once per environment, so every copy of the database changes the same way.',
    },
    {
      q: 'How do backups actually work?',
      a: 'Managed databases take regular snapshots plus a continuous log of changes, so you can restore to almost any moment in the last few days. A backup you have never restored is a hope, not a backup.',
    },
    {
      q: 'What is a replica set?',
      a: 'Several copies of the same database on different machines. One takes the writes; the others follow it and take over automatically if it fails. MongoDB transactions need one, and Atlas gives you one by default.',
    },
    {
      q: 'Do I need an ORM?',
      a: 'An ORM or ODM (Prisma, Drizzle, Mongoose) maps database records to objects in your code and adds types and validation. It saves time and mistakes — but you still need to understand the queries it sends.',
    },
    {
      q: 'How does a database find one record among a billion?',
      a: 'With an index — usually a [[b-tree|B-tree]], a sorted structure the database can walk in a handful of steps instead of reading every record. Chapter 4, *How data is stored*, goes inside it.',
    },
  ],

  next: [
    { q: 'How does a search box find the right product among millions?', chapter: 'search' },
    { q: 'How do you know whose bookmarks are whose?', chapter: 'identity' },
    { q: 'Why does a page you visited before open instantly?', chapter: 'fast' },
    { q: 'Where does your data actually sit on the disk?', chapter: 'how-data-is-stored' },
  ],
};

export default writing;
