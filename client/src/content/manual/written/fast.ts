/**
 * Chapter: Make it fast (performance & caching).
 * Follows the model chapter, written/identity.ts.
 */
import type { ChapterWriting } from '../types';

const writing: ChapterWriting = {
  hook: {
    story: [
      'A page you visited yesterday opens instantly today. Your favourite app scrolls through ten thousand posts without a stutter. A shop’s search answers before you finish typing. None of that is luck.',
      'People feel speed long before they can name it, and a page that takes a few seconds loses many visitors before it has said a word. Yet most slowness doesn’t come from slow code. It comes from doing work that didn’t need doing: fetching what you already had, reading every record to find one, sending a whole list when the screen shows twenty, redrawing what didn’t change.',
      'Where does the time really go — and how do you get it back?',
    ],
    predict: {
      q: 'A list page in your app got slow as the data grew. What should you do first?',
      options: [
        'Rewrite it in a faster language',
        'Put a cache in front of everything',
        'Measure, to find where the time actually goes',
        'Move to a bigger server',
      ],
      answer: 2,
      reveal:
        'Measure. Slowness hides in one or two places, and guesses are usually wrong. The culprit might be a missing [[index]] (the database reads everything), sending 10,000 rows when the screen shows 20, requests made one after another that could run together, or a component re-rendering on every keystroke. The Network tab, the Performance panel, the React Profiler and `explain()` each show a different part. Fix the biggest cost, then measure again.',
    },
  },

  idea: {
    lede: 'Every fast product — web, mobile or backend — is fast for the same few reasons. Each one is a way of doing less.',
    jobs: [
      {
        title: 'Measure first',
        text: 'Find where the time goes before changing anything — network, server, database or rendering. Fix the biggest cost, then measure again.',
      },
      {
        title: 'Don’t ask twice',
        text: 'Keep answers close to where they are needed — the browser, a [[cdn|CDN]], an app cache like [[redis|Redis]] — and decide how long each can be trusted (its [[ttl|TTL]]).',
      },
      {
        title: 'Send less',
        text: 'Page through long lists, ask only for the fields you show, compress and resize images, and split JavaScript so each screen loads only its own.',
      },
      {
        title: 'Find it without searching',
        text: 'Give the database an [[index]] for every frequent question, so it jumps to the answer instead of reading every record.',
      },
      {
        title: 'Draw less',
        text: 'Don’t re-render what didn’t change, and keep the main thread free so typing and scrolling stay smooth.',
      },
    ],
    picture:
      'A busy café. The barista keeps the most-ordered pastries on the counter instead of walking to the storeroom each time (a cache). Customers get a cup, not the whole pot (send less). The storeroom is labelled, so anything is found in seconds (an index). Nobody remakes a drink that hasn’t changed just because someone else ordered (draw less). And before rearranging anything, the owner times a morning rush to see where people actually wait (measure).',
  },

  lessonNotes: {
    caching: 'Job 2: every layer that can remember an answer — browser, CDN, Redis — and the trouble with stale data and stampedes.',
    pagination: 'Job 3: offset versus cursor paging, and why page 2,500 gets slow.',
    memo: 'Job 5: measure first, move state down, and memoise only what the profiler points at.',
    rendering: 'Job 5 in the browser: what blocks the first paint, and layout thrashing.',
    indexes: 'Job 4: why a query slows down as data grows, and the index that makes it fast again.',
  },

  options: {
    lede: 'Speed work happens in layers, and each option targets a different place where time goes. That is why measuring first tells you which one to reach for.',
    items: [
      {
        name: 'Browser and CDN caching',
        what: 'Let browsers and edge servers keep copies of files and responses, controlled by `Cache-Control` and `ETag` headers.',
        pickWhen: 'Static files, always — and public API responses that rarely change.',
        cost: 'Getting invalidation right, so nobody is stuck on an old version.',
        examples: 'Cache-Control, ETag, any CDN (your host’s, Cloudflare, Fastly)',
      },
      {
        name: 'An app cache',
        what: 'Keep computed results or database answers in memory, usually in Redis, in front of the database.',
        pickWhen: 'The same expensive question is asked far more often than its answer changes.',
        cost: 'Stale data, invalidation bugs, and one more system to run.',
        examples: 'Redis, Valkey, Memcached',
        tools: ['redis'],
      },
      {
        name: 'Database tuning',
        what: 'Indexes that match your queries, projections, pagination, and fewer round trips.',
        pickWhen: 'Almost always the first backend fix — slow pages are usually slow queries.',
        cost: 'Each index slows writes a little and takes space.',
        examples: '`explain()`, compound indexes, cursor pagination',
        tools: ['mongodb', 'postgresql'],
      },
      {
        name: 'Loading less in the browser',
        what: 'Ship less JavaScript: split code by route, lazy-load heavy parts, optimise images and fonts.',
        pickWhen: 'The first visit is slow, especially on phones.',
        cost: 'More moving parts in the build.',
        examples: 'Vite code splitting, `React.lazy`, modern image formats, Lighthouse',
        tools: ['react'],
      },
      {
        name: 'Rendering less',
        what: 'Avoid unnecessary re-renders, and keep long lists light.',
        pickWhen: 'Typing, scrolling or animations stutter.',
        cost: 'Memoisation adds complexity; use it where the profiler shows a cost.',
        examples: 'Moving state down, `React.memo`, the React Compiler, list virtualisation (TanStack Virtual)',
      },
    ],
    choose: [
      { when: 'Every page is slow on a first visit, especially on phones', pick: 'Load less: smaller bundles, optimised images, a CDN.' },
      { when: 'One list or search page got slower as the data grew', pick: 'The database first: the right index, and pagination.' },
      { when: 'The same expensive answer is computed over and over', pick: 'An app cache with a sensible TTL.' },
      { when: 'Typing or scrolling stutters', pick: 'Render less: move state down, virtualise long lists, memoise what the profiler shows.' },
      { when: 'You don’t know yet', pick: 'Measure: Network tab, Performance panel, React Profiler, `explain()`.' },
    ],
  },

  modern: {
    lede: 'AI is quick to suggest speed-ups — usually the famous ones: add a cache, add `useMemo`, add Redis. Each has a cost, and none helps if it targets the wrong layer. The winning habit is old-fashioned: measure, change one thing, measure again.',
    defaults: [
      'Measure on a mid-range phone and a slow network, and watch the Core Web Vitals: loading, responsiveness, layout shift.',
      'Static files on a CDN, cached for a long time under hashed names.',
      'Every list is paginated, every frequent query has an index, and responses carry only the fields the screen needs.',
      'Split JavaScript by route, lazy-load heavy components, and serve images in modern formats at the right size.',
      'Cache only what is expensive *and* read far more often than it changes — with a TTL and a plan for invalidation.',
      'Let the profiler (or the React Compiler) guide memoisation, and virtualise lists of hundreds of rows.',
    ],
    aiGood: [
      'Reading a Lighthouse report or a performance trace and naming the bottleneck',
      'Explaining an `explain()` plan and proposing an index',
      'Turning offset paging into cursor paging',
      'Setting up code splitting and lazy loading',
      'Writing a small load test to compare before and after',
    ],
    aiWrong: [
      { mistake: 'Adds a cache before anything has been measured.', fix: 'Measure first — a cache can hide a missing index instead of fixing it.' },
      { mistake: 'Caches private or per-user data under a shared key.', fix: 'Put the user in the cache key — or don’t cache it.' },
      { mistake: 'Never invalidates, so people see old data after a change.', fix: 'Delete or update the cached entry when the data changes, and set a TTL.' },
      { mistake: 'Wraps every component in `memo` and every function in `useCallback`.', fix: 'Profile first; memoise the few things that matter.' },
      { mistake: 'Uses `skip` for deep pagination on a huge collection.', fix: 'Cursor pagination: “after this one”, with a limit.' },
      { mistake: 'Makes requests one after another for no reason.', fix: 'Run independent requests together with `Promise.all`.' },
      { mistake: 'Loads a full-size photo for a thumbnail.', fix: 'Resize it, use a modern format, and `loading="lazy"`.' },
    ],
  },

  build: {
    title: 'Make the bookmarks page fast',
    brief: 'Fill your bookmarks app with 50,000 bookmarks, watch it get slow, then make it fast again — one measured change at a time, writing down the numbers before and after each one.',
    byHand: [
      { title: 'Make it slow, honestly', text: 'Seed 50,000 bookmarks. Load the list page and write down three numbers: the API’s response time, the response size, and the time until the list appears.' },
      { title: 'Find where the time goes', text: 'The Network tab for size and timing, `explain(\'executionStats\')` for the query, the React Profiler for rendering.', see: ['indexes', 6] },
      { title: 'Page it', text: 'Return 20 at a time with cursor pagination (`createdAt` plus `_id`), and a “Load more” button.', see: ['pagination', 5] },
      { title: 'Index it', text: 'A compound index that matches the filter and the sort. Check that `explain()` now says `IXSCAN`.', see: ['indexes', 4] },
      { title: 'Send less', text: 'Return only the fields the list shows, and compress responses.', see: ['crud', 5] },
      { title: 'Cache the expensive part', text: 'Keep the tag counts (an aggregation) in Redis for 60 seconds, and clear them when a bookmark is added or removed.', see: ['caching', 4] },
      { title: 'Draw less', text: 'If typing in the filter box stutters, move its state down or virtualise the list — then profile again.', see: ['memo', 3] },
    ],
    withAI: {
      lede: 'Now do it with your AI assistant — but make it work like you just did: measure first, one change at a time, numbers before and after.',
      prompt: `My bookmarks app (Express + Mongoose + React) is slow with 50,000 bookmarks. Help me fix it one measured step at a time.

First
- Write a seed script for 50,000 bookmarks, and tell me exactly how to measure: API time, response size, time until the list shows, and explain('executionStats') for the list query.

Then, one change at a time, each with before/after numbers:
1. Cursor pagination on GET /api/bookmarks (20 per page; cursor = createdAt + _id), with "Load more" in React (TanStack Query useInfiniteQuery).
2. A compound index matching the filter (tag) and the sort (createdAt desc, _id desc).
3. A projection returning only url, title, tags and createdAt; enable gzip compression.
4. Cache GET /api/tags/counts in Redis for 60 seconds and invalidate it when a bookmark is created or deleted. Cache keys must never mix different users' data.
5. Only if the React Profiler shows a problem: move state down or virtualise the list.

Do not add caching or memoisation anywhere else. Explain what each step changed and why.`,
    },
    verify: [
      'You have a before-and-after table with real numbers for every change.',
      'The list API returns 20 items, in under **10 KB**.',
      '`explain()` on the list query shows `IXSCAN`, and it examines about as many documents as it returns.',
      'Page 500 (by cursor) is as fast as page 1.',
      'Add a bookmark: the tag counts reflect it straight away, because the cache was cleared.',
      'Lighthouse Performance on the mobile setting scores **90** or more.',
      'Typing in the filter box stays smooth: the Performance panel shows no long tasks while you type.',
    ],
  },

  breakIt: [
    {
      title: 'A cache for everyone',
      lang: 'js',
      code: `app.get('/api/me/orders', requireAuth, async (req, res) => {
  const cached = await redis.get('orders');
  if (cached) return res.json(JSON.parse(cached));
  const orders = await Order.find({ owner: req.user.id });
  await redis.set('orders', JSON.stringify(orders), 'EX', 60);
  res.json(orders);
});`,
      err: [2, 5],
      answer:
        'The cache key is the same for every user, so the first person’s orders are served to everyone for the next minute — a speed-up that became a data leak. Put the user in the key (`orders:${userId}`), and clear it when their orders change.',
      see: ['caching', 7],
    },
    {
      title: 'Page 2,500',
      lang: 'js',
      code: `const page = Number(req.query.page) || 1;
const items = await Bookmark.find()
  .sort({ createdAt: -1 })
  .skip((page - 1) * 20)
  .limit(20);`,
      err: [4],
      answer:
        '`skip` still walks past every skipped document, so page 2,500 reads 50,000 records to return 20 — and new bookmarks shift every page while people scroll. Use a cursor: “older than the last one I saw”, e.g. `find({ createdAt: { $lt: lastCreatedAt } }).sort({ createdAt: -1 }).limit(20)`, with `_id` as a tie-breaker.',
      see: ['pagination', 3],
    },
    {
      title: 'One after another',
      lang: 'js',
      code: `const user = await getUser(id);
const orders = await getOrders(id);
const reviews = await getReviews(id);`,
      err: [1, 2, 3],
      answer:
        'Each call waits for the one before it, though none needs the others’ results — three round trips back to back. Start them together: `const [user, orders, reviews] = await Promise.all([getUser(id), getOrders(id), getReviews(id)])`.',
    },
    {
      title: 'Memo, just in case',
      lang: 'jsx',
      code: `const Row = memo(function Row({ item, onSelect }) { /* … */ });

{items.map((item) => (
  <Row key={item.id} item={item} onSelect={() => select(item.id)} />
))}`,
      err: [4],
      answer:
        '`memo` skips a render only if every prop is the same as last time — but `onSelect` is a brand-new function on every render, so every row re-renders anyway, and `memo` only adds its comparison cost. Pass a stable function (`useCallback`) and the id — or first measure whether the list needs memo at all.',
      see: ['memo', 5],
    },
  ],

  explain: [
    'Why measure before optimising? Give an example where a guess would be wrong.',
    'What is a cache — and what new problem does every cache bring with it?',
    'Why does page 2,500 get slow with skip-and-limit paging, and how does a cursor fix it?',
  ],

  deeper: [
    {
      q: 'What are Core Web Vitals?',
      a: 'Google’s three measures of how a page feels: how fast the main content appears (LCP), how quickly it responds to taps and typing (INP), and how much it jumps around while loading (CLS). They affect search ranking too.',
    },
    {
      q: 'What is a cache stampede?',
      a: 'A popular cached item expires and thousands of requests miss at once, all hitting the database together. The fixes: refresh it early, let one request rebuild it while the others wait, or spread out expiry times. See [[stampede]].',
    },
    {
      q: 'Can a CDN speed up an API?',
      a: 'For public, cacheable responses, yes — the same way it does for files: answer from a nearby edge without reaching your server. With the right headers, even a dynamic page can be cached for a few seconds and absorb a huge spike.',
    },
    {
      q: 'What is list virtualisation?',
      a: 'Rendering only the rows on screen, plus a few around them, and swapping them as you scroll. A list of 100,000 rows then costs about as much as one of 30. See [[virtualization]].',
    },
    {
      q: 'Why are phones so much slower than my laptop?',
      a: 'Slower processors, less memory, and mobile networks with long round trips. JavaScript that parses in 50 ms on a laptop can take half a second on a mid-range phone — which is why you test there.',
    },
    {
      q: 'When is a faster language actually the answer?',
      a: 'When the time really is CPU work in your own code — image processing, heavy computation — and measuring proved it. For most web apps, the network, the database and the amount of data are the bottleneck.',
    },
  ],

  next: [
    { q: 'What has to change when ten thousand people use it at once?', chapter: 'scale' },
    { q: 'How does a search box find results while you type?', chapter: 'search' },
    { q: 'How do you notice it getting slow before users complain?', chapter: 'observe' },
    { q: 'What happens in the network before the first byte arrives?', chapter: 'how-the-web-works' },
  ],
};

export default writing;
