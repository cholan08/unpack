/**
 * Chapter: How data is stored (Part I · How things work).
 * Follows the model chapter, written/identity.ts.
 */
import type { ChapterWriting } from '../types';

const writing: ChapterWriting = {
  hook: {
    story: [
      'You tap Save on a photo, a note, an order. It is still there tomorrow, next year, after the phone restarts and the server is replaced. Out of billions of saved things, yours comes back in a blink.',
      'Underneath every app is a disk: a long row of numbered blocks that only knows how to store and return bytes. Everything you call “data” — users, orders, messages — is an agreement about how to lay those bytes out so they can be found, changed and trusted.',
      'Where does your data physically go — and how is one record found among billions without reading them all?',
    ],
    predict: {
      q: 'A collection holds 100 million users. With no index, how does the database find the user whose email is ana@example.com?',
      options: [
        'It jumps straight there — databases know where everything is',
        'It reads the users one by one, checking each against the filter',
        'It asks the operating system to search the disk',
        'It guesses from the first letter',
      ],
      answer: 1,
      reveal:
        'It reads them all. Without an [[index]], the only way to find a match is to look at every record — a hundred million checks, every time. An index on `email` is a separate sorted structure, usually a [[b-tree|B-tree]], that points to each record, so the database walks a few levels of the tree instead of a hundred million records. That is the single biggest idea behind fast databases.',
    },
  },

  idea: {
    lede: 'Spreadsheets, MongoDB, PostgreSQL, your phone’s photo library — every system that stores data solves the same five problems.',
    jobs: [
      {
        title: 'Survive a restart',
        text: 'Memory is fast but forgets when the power goes; disks remember. Databases write to disk — and record each change in a log first, so a crash halfway through can be repaired.',
      },
      {
        title: 'Give data a structure',
        text: 'Rows in tables or [[document|documents]] in collections, with fields and types — a [[schema]], written down or implied — so every program reads the same bytes the same way.',
      },
      {
        title: 'Name every record',
        text: 'A unique key — a primary key, or an [[objectid|ObjectId]] — is how you point at one record, and how records point at each other.',
      },
      {
        title: 'Find without reading everything',
        text: '[[index|Indexes]] keep chosen fields sorted, with pointers back to the records, so a lookup takes a few steps instead of a full scan.',
      },
      {
        title: 'Stay correct under pressure',
        text: 'Many programs read and write at once. Databases make each change all-or-nothing and keep changes from seeing each other half-done — the guarantees known as ACID.',
      },
    ],
    picture:
      'A huge warehouse. Boxes sit on numbered shelves (the disk). Every box has a label in the same format (the structure) and a unique barcode (the key). At the entrance is a catalogue sorted by product name, with the shelf number for each (an index), so nobody walks the aisles. And a clerk writes every delivery in a ledger *before* shelving it, so after a power cut the night shift knows exactly what was half done (the log).',
  },

  lessonNotes: {
    documents: 'How MongoDB lays data out: databases, collections, documents, `_id` — and JSON on the wire versus BSON on disk.',
    indexes: 'Job 4 step by step: why reads scan everything, how a sorted index jumps to the answer, and what indexes cost.',
  },

  options: {
    lede: 'Storage engines lay bytes out in different shapes, each fast at something and slow at something else. You rarely pick one directly — but knowing the shapes explains why databases behave the way they do.',
    items: [
      {
        name: 'Rows',
        what: 'Each record’s fields stored together, in tables with fixed columns.',
        pickWhen: 'Apps that read and write whole records — users, orders — in classic relational databases.',
        cost: 'Adding up one column across billions of rows means reading all the other columns too.',
        examples: 'PostgreSQL, MySQL, SQLite',
        tools: ['postgresql', 'mysql'],
      },
      {
        name: 'Documents',
        what: 'Each record is a self-contained, JSON-like document (stored as BSON in MongoDB), with nested fields and arrays.',
        pickWhen: 'Records you read whole, with nested or varying shapes.',
        cost: 'Data shared between documents is either duplicated or needs lookups.',
        examples: 'MongoDB, Firestore, CouchDB',
        tools: ['mongodb'],
      },
      {
        name: 'Columns',
        what: 'Each column stored separately and compressed, so a query reads only the columns it needs.',
        pickWhen: 'Analytics over huge tables: totals, averages, dashboards.',
        cost: 'Slow at changing single records.',
        examples: 'ClickHouse, BigQuery, Snowflake, DuckDB',
      },
      {
        name: 'Key-value, in memory',
        what: 'Values stored under keys, often entirely in memory.',
        pickWhen: 'Caches, sessions and counters.',
        cost: 'Simple lookups only, and memory is limited.',
        examples: 'Redis, Valkey, DynamoDB',
        tools: ['redis'],
      },
      {
        name: 'Files and objects',
        what: 'Large blobs — images, video, backups — in object storage, found by key.',
        pickWhen: 'Anything big and binary.',
        cost: 'No queries inside the files; their details live elsewhere.',
        examples: 'S3, R2, Google Cloud Storage',
        tools: ['aws'],
      },
    ],
    choose: [
      { when: 'An app’s users, orders and content', pick: 'Rows (PostgreSQL) or documents (MongoDB).' },
      { when: 'Dashboards over billions of events', pick: 'A column store such as ClickHouse or BigQuery.' },
      { when: 'Sessions, caches and counters', pick: 'Key-value: Redis.' },
      { when: 'Images, video and backups', pick: 'Object storage, with a key in your database.' },
    ],
  },

  modern: {
    lede: 'Managed databases hide disks and B-trees well, and you will rarely think about them. But every surprise a database gives you — a query fast on Monday and slow by Friday, a write that “disappeared”, a bill that tripled — is explained by how data is stored. AI can tune a query; it helps enormously if you can tell it what the database is actually doing.',
    defaults: [
      'A managed database with automatic backups and point-in-time restore.',
      'Deliberate keys: a unique id for every record, and references by id, never by name.',
      'Indexes for the queries you run — and `explain()` output instead of guesses.',
      'Remember that every index costs space and slows writes; remove the ones you don’t use.',
      'Big binary files out of the database: store them as objects and keep a key.',
      'Transactions (or single-document atomic updates) when several changes must succeed together.',
    ],
    aiGood: [
      'Explaining an `explain()` plan or a slow-query log',
      'Translating a data model between documents and tables',
      'Estimating storage for a given number of records',
      'Explaining ACID, isolation and replication in plain words',
      'Writing scripts that report collection and index sizes',
    ],
    aiWrong: [
      { mistake: 'Adds an index on every field “to be safe”.', fix: 'Each index costs writes and memory. Index what your queries use.' },
      { mistake: 'Links records by a name or an email.', fix: 'Point at a stable id — names and emails change.' },
      { mistake: 'Stores dates as text in local time.', fix: 'Store a real date in UTC; format it for each person when displaying.' },
      { mistake: 'Stores money as a floating-point number.', fix: 'Integers in the smallest unit (cents), or a decimal type.' },
      { mistake: 'Assumes a write is safe the moment the call returns, on a cluster.', fix: 'Know your write concern: wait for a majority when losing a write would matter.' },
      { mistake: 'Deletes data with no backup or undo plan.', fix: 'Back up — and consider soft deletes for things people may want back.' },
    ],
  },

  build: {
    title: 'Look inside your database',
    brief: 'Take your bookmarks database apart: see how documents are stored and how big they are, what an index is, and exactly what the database does for one query — before and after an index.',
    byHand: [
      { title: 'Look at a document', text: 'In MongoDB Compass (or `mongosh`), open one bookmark. Find its `_id`, and read the creation time hidden inside it with `.getTimestamp()`.', see: ['documents', 4] },
      { title: 'Weigh it', text: 'Compass’s collection view shows the number of documents, the total size and the average document size. Write them down.' },
      { title: 'Scan everything', text: 'Seed 100,000 bookmarks. Query by `title` with `.explain(\'executionStats\')`, and note `totalDocsExamined` and the time.', see: ['indexes', 2] },
      { title: 'Build an index', text: 'Create an index on that field. Note how long it took and how much space it uses (the Indexes tab).', see: ['indexes', 3] },
      { title: 'Jump straight there', text: 'Run the same query again: `IXSCAN`, with keys and documents examined close to the number of results.', see: ['indexes', 4] },
      { title: 'Feel the cost', text: 'Time inserting 10,000 bookmarks with no extra indexes, with one, and with five.', see: ['indexes', 5] },
      { title: 'Read the shelves', text: 'Open the DBMS notebook’s pages on storage and recovery, and match each idea to something you just saw.' },
    ],
    withAI: {
      lede: 'Let your AI assistant run the experiment with you — one step at a time, checking that you understood each result before moving on.',
      prompt: `I want to understand how MongoDB stores and finds my data. Guide me through an experiment, one step at a time, and wait for my output after each step.

1. Show me how to read one document, its _id, and the timestamp inside the ObjectId (mongosh).
2. Show me how to see a collection's document count, storage size and average document size.
3. Give me a script that inserts 100,000 fake bookmarks.
4. Have me run a query on title with explain('executionStats'), then explain the numbers I paste back.
5. Have me create an index, run the query again, and explain what changed: stage, keys examined, documents examined, time.
6. Have me time inserts with 0, 1 and 5 extra indexes, and explain the difference.

After each of my outputs, ask me one question that checks I understood before moving on.`,
    },
    verify: [
      'You read a creation time out of an ObjectId.',
      'You know your collection’s average document size.',
      'Before the index: `COLLSCAN`, and about 100,000 documents examined.',
      'After it: `IXSCAN`, and documents examined close to the number of results.',
      'You measured how much slower inserts are with five extra indexes.',
      'You can explain why the database can’t simply “know” where a record is.',
      'You found where the DBMS notebook explains logs and recovery.',
    ],
  },

  breakIt: [
    {
      title: 'Money as a float',
      lang: 'js',
      code: `const order = { total: 0.1 + 0.2 };
console.log(order.total); // 0.30000000000000004`,
      err: [1],
      answer:
        'Floating-point numbers can’t hold most decimals exactly, so sums drift by tiny amounts — and with money, tiny amounts add up and break equality checks. Store the smallest unit as an integer (`totalCents: 30`) or use a decimal type (`Decimal128` in MongoDB, `numeric` in PostgreSQL).',
    },
    {
      title: 'Linked by email',
      lang: 'js',
      code: `const orderSchema = new Schema({
  customerEmail: String, // links the order to its user
  items: [itemSchema],
});`,
      err: [2],
      answer:
        'When a customer changes their email, every past order loses its link — or points at someone who later takes that address. Point at a stable key that never changes: `customer: { type: Schema.Types.ObjectId, ref: \'User\' }`.',
    },
    {
      title: 'A date as text',
      lang: 'js',
      code: `await Event.create({ title: 'Launch', startsAt: '26/11/2026 18:00' });`,
      err: [1],
      answer:
        'Text can’t be sorted or compared correctly (`\'03/12\' < \'26/11\'` alphabetically), it has no time zone, and `26/11` means something different in other countries. Store a real `Date` in UTC — `new Date(\'2026-11-26T18:00:00Z\')` — and format it for each person’s time zone when you display it.',
    },
    {
      title: 'An index on everything',
      lang: 'js',
      code: `for (const field of ['title', 'url', 'tags', 'createdAt', 'updatedAt', 'notes', 'color']) {
  bookmarkSchema.index({ [field]: 1 });
}`,
      err: [1, 2],
      answer:
        'Seven indexes means every insert and update writes eight times — the document plus seven index entries — and all of them compete for memory. Most will never be used, and none matches a query that filters on one field and sorts on another. Index the queries you actually run, with compound indexes, and drop the rest.',
      see: ['indexes', 5],
    },
  ],

  explain: [
    'Why does a database write to a log before it changes the data itself?',
    'What is an index, physically — and why does it make reads faster but writes slower?',
    'Why should records point to each other by id instead of by name or email?',
  ],

  deeper: [
    {
      q: 'What is a write-ahead log?',
      a: 'Before changing data, the database appends the change to a log on disk. After a crash it replays the log to finish or undo half-done work. The same log feeds replicas and point-in-time backups.',
    },
    {
      q: 'What does ACID stand for?',
      a: 'Atomicity (all or nothing), Consistency (the rules always hold), Isolation (changes running at the same time don’t see each other half-done) and Durability (once confirmed, a change survives a crash).',
    },
    {
      q: 'Why are SSDs so much faster than hard disks for databases?',
      a: 'A hard disk has a moving head that must travel to each block; an SSD has no moving parts, so random reads — exactly what index lookups do — are hundreds of times faster.',
    },
    {
      q: 'What is sharding?',
      a: 'Splitting one collection across several servers by a key, so each holds part of the data. It lets a database grow beyond one machine — at the price of choosing a good key, and more complex queries.',
    },
    {
      q: 'What is replication?',
      a: 'Keeping copies of the data on several servers. If the main one fails, a copy takes over, and copies can also answer reads. MongoDB calls this a [[replica-set|replica set]].',
    },
    {
      q: 'How do column stores answer analytics so fast?',
      a: 'They keep each column together and compressed, so “average order value this year” reads one column, not every field of every order — often a hundred times less data.',
    },
  ],

  next: [
    { q: 'How do you decide what shape your app’s data takes?', chapter: 'remember' },
    { q: 'How does a search box find things while you type?', chapter: 'search' },
    { q: 'Where do big files like photos go?', chapter: 'files' },
    { q: 'Why do pages you visited before open instantly?', chapter: 'fast' },
  ],
};

export default writing;
