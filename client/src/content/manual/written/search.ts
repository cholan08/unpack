/**
 * Chapter: Find things (search & queries).
 * Follows the model chapter, written/identity.ts.
 */
import type { ChapterWriting } from '../types';

const writing: ChapterWriting = {
  hook: {
    story: [
      'You type “red runn” into a shop’s search box. Before you finish the word, it shows red running shoes, best match first — out of two million products. It even forgives you when you type “runing”.',
      'Without help, finding something means looking at everything. That works for a hundred items and collapses at a million. Real search has to be fast, forgiving, and ranked by what you probably meant — and more and more, it has to understand meaning, not just matching letters.',
      'How does a search box find the right thing among millions while you are still typing?',
    ],
    predict: {
      q: 'Your app has 2 million products. Listing one category sorted by price takes 4 seconds. What is the most likely cause?',
      options: [
        'The server is too slow for 2 million products',
        'No index matches the query, so the database reads every product',
        'Sorting by price is always slow',
        'Too many people are searching at once',
      ],
      answer: 1,
      reveal:
        'Without an [[index]] that matches the filter and the sort, the database does a [[collscan|collection scan]]: it reads all 2 million products, keeps the matches, then sorts them in memory. An index on `{ category: 1, price: 1 }` lets it jump straight to that category, already in price order, and read only the first page. Same hardware — milliseconds instead of seconds.',
    },
  },

  idea: {
    lede: 'From a filter on a list to a search engine with typo tolerance and AI, finding things comes down to five jobs.',
    jobs: [
      {
        title: 'Ask precisely',
        text: 'A filter and a sort, written as a query the database understands: category is shoes, price under 100, newest first.',
      },
      {
        title: 'Don’t read everything',
        text: 'An [[index]] keeps the searched fields sorted, with pointers to the records, so the database jumps to the matches instead of scanning them all.',
      },
      {
        title: 'Return a page, not the pile',
        text: 'Send the first 20 results and a way to get more. Nobody reads result number 4,000.',
      },
      {
        title: 'Answer bigger questions',
        text: 'Counts, totals and groupings (“how many in each category?”) are worked out inside the database with [[aggregation]], not in your code.',
      },
      {
        title: 'Find what people mean',
        text: 'A real search box handles word endings, typos and ranking by relevance — and increasingly meaning itself, by comparing *embeddings* of the text.',
      },
    ],
    picture:
      'A library. Asking for “books on birds, newest first” (a query) is quick because the catalogue is already sorted by subject and date (an index). You are handed the first shelf, not the whole building (pagination). The librarian can tell you how many bird books came out each decade without carrying any of them out (aggregation). And a good librarian hears “that blue book about migration” and still finds it (relevance and meaning).',
  },

  lessonNotes: {
    indexes: 'Job 2: why queries slow down as data grows, and the index that fixes them — checked with `explain()`.',
    aggregation: 'Job 4: pipelines of stages — match, group, sort, lookup — that answer big questions inside the database.',
    pagination: 'Job 3: offset versus cursor paging, and infinite scroll.',
  },

  options: {
    lede: '“Search” covers anything from filtering a list to understanding a question in plain language. Start with what your database already does well, and add a search engine when people need to type freely.',
    items: [
      {
        name: 'Queries and indexes',
        what: 'Filters, sorts and ranges on structured fields, backed by indexes.',
        pickWhen: 'Filtering and sorting lists — by category, price, date, status. Most “search” in most apps.',
        cost: 'Not built for free text: no typo tolerance and no relevance ranking.',
        examples: 'MongoDB queries with compound indexes; SQL `WHERE` with B-tree indexes',
        tools: ['mongodb', 'postgresql'],
      },
      {
        name: 'Your database’s text search',
        what: 'Built-in full-text indexes that match words (including their endings) and rank results by relevance.',
        pickWhen: 'A simple search box over a modest amount of text, with no new infrastructure.',
        cost: 'Limited typo tolerance, highlighting and tuning.',
        examples: 'MongoDB text indexes, PostgreSQL full-text search, MongoDB Atlas Search',
      },
      {
        name: 'A search engine',
        what: 'A separate service built for text: typo tolerance, synonyms, facets, highlighting and fine control over ranking.',
        pickWhen: 'Search is central to the product: shops, docs, marketplaces, logs.',
        cost: 'A second copy of your data to keep in sync, and another service to run or pay for.',
        examples: 'Meilisearch, Typesense, Elasticsearch, OpenSearch, Algolia',
        tools: ['elasticsearch'],
      },
      {
        name: 'Semantic (vector) search',
        what: 'Text is turned into embeddings — lists of numbers that capture meaning — and the search finds the closest ones.',
        pickWhen: 'People describe what they want in their own words, or an AI needs your documents (RAG).',
        cost: 'The cost of creating embeddings, less predictable results, and exact words such as codes or names can be missed.',
        examples: 'pgvector, MongoDB Atlas Vector Search, Pinecone, Qdrant',
      },
      {
        name: 'Hybrid search',
        what: 'Run keyword search and semantic search together, then merge and re-rank the results.',
        pickWhen: 'You need both: exact matches for names and codes, meaning for everything else.',
        cost: 'Two kinds of search to tune, and a ranking step to get right.',
        examples: 'Offered by most search engines and vector databases today',
      },
    ],
    choose: [
      { when: 'Filtering and sorting a list', pick: 'Database queries with the right compound index.' },
      { when: 'A simple search box over a little text', pick: 'Your database’s built-in text search.' },
      { when: 'Search is the heart of the product', pick: 'A search engine — Meilisearch or Typesense to start, Elasticsearch or OpenSearch at large scale.' },
      { when: 'People search in their own words, or an AI needs your documents', pick: 'Semantic search, usually combined with keywords (hybrid).' },
    ],
  },

  modern: {
    lede: 'In the AI era, “search” more and more means asking a question and getting an answer. But under every AI answer there is still retrieval — finding the right ten passages among millions — and it still lives or dies by indexes, ranking and fresh data. AI can write the query; you decide what is indexed, and you check what comes back.',
    defaults: [
      'Index every filter-and-sort combination a page uses, and confirm with `explain()` that the index is used.',
      'Paginate every result list — by cursor for long or infinite lists.',
      'Debounce search-as-you-type (wait about 200 ms after typing stops) and drop outdated requests.',
      'Start with your database’s text search; add a search engine when typo tolerance, facets or ranking matter.',
      'For AI features, use hybrid search and keep the search index in step with your data.',
      'Never build a query or a regular expression straight from what someone typed.',
    ],
    aiGood: [
      'Writing aggregation pipelines and complex filters from plain English',
      'Proposing indexes from the queries your app makes',
      'Setting up a search engine’s fields, synonyms and ranking rules',
      'Writing the code that keeps a search index in sync',
      'Building search-as-you-type with debounce and cancellation',
    ],
    aiWrong: [
      { mistake: 'Searches with `$regex` built from user input.', fix: 'Unanchored regexes can’t use indexes, and crafted patterns can stall the server. Use a text index or a search engine, and escape input.' },
      { mistake: 'Fetches everything and filters in JavaScript.', fix: 'Filter, sort and limit in the query.' },
      { mistake: 'Creates one index per field instead of one that matches the query.', fix: 'A compound index ordered by equality fields, then sort, then range.' },
      { mistake: 'Sends a request on every keystroke and shows whichever answer arrives last.', fix: 'Debounce, and ignore or cancel stale requests.' },
      { mistake: 'Puts `$match` after `$group` or `$lookup` in a pipeline.', fix: 'Filter first, so later stages handle fewer documents.' },
      { mistake: 'Returns an exact total count on every page of a huge result.', fix: 'Counting is expensive; show “more results” or an estimate.' },
      { mistake: 'Forgets to remove deleted or private items from the search index.', fix: 'Sync deletes and permission changes, and filter by access at query time.' },
    ],
  },

  build: {
    title: 'Search your bookmarks',
    brief: 'A search box over 50,000 bookmarks: filter by tag, search titles as you type, see how many bookmarks each tag has, and page through the results — fast, and forgiving of typos once you add a search engine.',
    byHand: [
      { title: 'Filter and sort first', text: '`GET /api/bookmarks?tag=react&sort=newest` backed by a compound index `{ tags: 1, createdAt: -1 }`. Check it with `explain()`.', see: ['indexes', 6] },
      { title: 'Words, not letters', text: 'Add a text index on `title`, query with `$text: { $search: q }`, and sort by the relevance score.' },
      { title: 'Type, pause, search', text: 'In React, debounce the input by 200 ms, keep the query in the URL, and drop answers to old queries.', see: ['use-effect', 6] },
      { title: 'Page it', text: 'Return 20 results at a time with a cursor, and a “Load more” button.', see: ['pagination', 5] },
      { title: 'Count by tag', text: 'An aggregation: `$match` your bookmarks, `$unwind` the tags, `$group` with `$sum: 1`, `$sort` by count, `$limit` 20.', see: ['aggregation', 4] },
      { title: 'Filter first', text: 'Make sure `$match` is the first stage, and check how many documents each stage handles.', see: ['aggregation', 7] },
      { title: 'Forgive typos', text: 'Mirror your bookmarks into Meilisearch (or use Atlas Search), search the text there, and load the full records from MongoDB by id.' },
    ],
    withAI: {
      lede: 'Now let your AI assistant build it. The spec names the indexes, the pipeline order and the input rules — and asks for proof that each query uses its index.',
      prompt: `Add search to my bookmarks app (Express + Mongoose + React, 50,000 bookmarks).

Server
- GET /api/bookmarks?tag=&q=&cursor= : filter by tag; full-text search on title when q is given (MongoDB text index, sorted by textScore), otherwise newest first. 20 per page, with a cursor.
- Indexes: { tags: 1, createdAt: -1 } and a text index on title. Show explain('executionStats') proving each query uses one.
- GET /api/tags/counts: an aggregation that $matches the user's bookmarks first, $unwinds tags, $groups with counts, $sorts descending and $limits to 20.
- Validate q (string, at most 100 characters). Never build a $regex from user input.

Client
- The search input is debounced by 200 ms; q and tag live in the URL; stale responses are ignored (TanStack Query keyed by q and tag).
- "Load more" with useInfiniteQuery, plus empty and error states.

Optional, last
- Mirror bookmarks into Meilisearch for typo-tolerant search, kept in sync on create, update and delete.`,
    },
    verify: [
      '`explain()` for “tag + newest first” shows `IXSCAN`, not `COLLSCAN`.',
      'Searching a word in titles returns the best matches first.',
      'Type quickly: the Network tab shows one request after you pause, not one per letter.',
      'An answer to an old query never replaces the answer to a newer one.',
      'Page 50 by cursor is as fast as page 1.',
      'Tag counts arrive in well under a second, and match a manual count for one tag.',
      'Search for `.*` or a very long string: you get a 400 or a normal result — never a hang.',
    ],
  },

  breakIt: [
    {
      title: 'Search with a regex',
      lang: 'js',
      code: `const results = await Product.find({
  name: { $regex: req.query.q, $options: 'i' },
});`,
      err: [2],
      answer:
        'The user is writing your regular expression. An unanchored, case-insensitive regex can’t use an index, so every search scans every product — and a crafted pattern can keep the server busy for seconds. Use a text index or a search engine; if you must use a regex, escape the input and anchor it.',
    },
    {
      title: 'Counting in JavaScript',
      lang: 'js',
      code: `const all = await Bookmark.find({ owner: userId });
const counts = {};
for (const b of all) for (const t of b.tags) counts[t] = (counts[t] ?? 0) + 1;`,
      err: [1],
      answer:
        'This loads every bookmark, with every field, into your server’s memory just to count tags. Let the database do it with an aggregation — `$match`, `$unwind`, `$group` — which sends back a few small rows.',
      see: ['aggregation', 4],
    },
    {
      title: 'Group, then filter',
      lang: 'js',
      code: `Order.aggregate([
  { $group: { _id: '$customerId', total: { $sum: '$amount' } } },
  { $match: { status: 'paid' } },
]);`,
      err: [2, 3],
      answer:
        'After `$group`, each document has only `_id` and `total` — there is no `status` left, so this returns nothing. And even when such a pipeline works, filtering last means grouping every order first. Put `{ $match: { status: \'paid\' } }` first: correct, and able to use an index.',
      see: ['aggregation', 7],
    },
    {
      title: 'Search on every key',
      lang: 'jsx',
      code: `<input
  onChange={(e) =>
    fetch(\`/api/search?q=\${e.target.value}\`).then((r) => r.json()).then(setResults)
  }
/>`,
      err: [3],
      answer:
        'Typing “running” sends seven requests, and whichever answer arrives *last* wins — often the one for “runn”. Debounce the input, keep the query in state, and let TanStack Query (or an AbortController) drop stale answers.',
      see: ['use-effect', 6],
    },
  ],

  explain: [
    'What does an index do, and why does a query without one get slower as data grows?',
    'Why should `$match` come first in an aggregation pipeline?',
    'What is the difference between keyword search and semantic search — and when would you combine them?',
  ],

  deeper: [
    {
      q: 'How does a search engine rank results?',
      a: 'Classic engines score each document by how often your words appear in it and how rare those words are overall (an algorithm called BM25), then apply rules — boosts for titles, popularity, freshness. Semantic search ranks by closeness in meaning.',
    },
    {
      q: 'What is an inverted index?',
      a: 'The structure behind full-text search: for every word, a list of the documents that contain it. Searching for two words means intersecting two lists — instead of reading every document.',
    },
    {
      q: 'How does typo tolerance work?',
      a: 'The engine accepts words within a small “edit distance” — one or two letters added, removed or swapped — and is usually more forgiving with longer words.',
    },
    {
      q: 'What is RAG?',
      a: 'Retrieval-augmented generation: before an AI answers a question, your app searches your own documents for the most relevant passages and gives them to the model to answer from. The answer can only be as good as the search. More in *Make it smart*.',
    },
    {
      q: 'How do the filter counts on shop pages work?',
      a: 'Those are facets: for the current results, the engine counts how many match each value of a field — brand, size, colour. It is an aggregation run alongside the search, fast because the index already groups the values.',
    },
    {
      q: 'When does a search index go stale?',
      a: 'Whenever your data changes and the copy in the search engine doesn’t. Sync on every write (or from a change stream), and make deletes and permission changes the first things you sync.',
    },
  ],

  next: [
    { q: 'How does an app answer questions about your own documents?', chapter: 'ai' },
    { q: 'Why does a page you visited before open instantly?', chapter: 'fast' },
    { q: 'Where does the data actually sit on the disk?', chapter: 'how-data-is-stored' },
    { q: 'What happens when ten thousand people search at once?', chapter: 'scale' },
  ],
};

export default writing;
