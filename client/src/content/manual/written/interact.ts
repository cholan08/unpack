/**
 * Chapter: Let people interact (state & interaction).
 * Follows the model chapter, written/identity.ts.
 */
import type { ChapterWriting } from '../types';

const writing: ChapterWriting = {
  hook: {
    story: [
      'You tap the heart under a photo. It turns red and the count goes from 41 to 42 — instantly, no reload. Type in a search box and the results change with every letter. Switch tabs, come back: everything is where you left it.',
      'Nothing on that screen is a picture. Every number, colour and list is drawn from *data the app is holding right now*. Change the data, and the screen has to follow — everywhere that data appears, at once, without flicker.',
      'How does an app keep what you see in step with what it knows?',
    ],
    predict: {
      q: 'In a React component you write `let likes = 41`, and the heart’s click handler does `likes = likes + 1`. You click. What does the screen show?',
      options: [
        '42 — the variable changed',
        '41 — nothing told React to draw the screen again',
        'An error',
        '42, but only after a refresh',
      ],
      answer: 1,
      reveal:
        'Still 41. The variable did change, but nothing asked React to draw again — and on the next render the line `let likes = 41` would run afresh anyway. **State** fixes both: `const [likes, setLikes] = useState(41)` gives the component a memory that survives renders, and calling `setLikes` asks React to [[render]] with the new value.',
    },
  },

  idea: {
    lede: 'Every interactive app — on the web, on a phone, in a game — runs the same loop.',
    jobs: [
      {
        title: 'Hold the data that changes',
        text: '[[state|State]] is what the app remembers right now: the like count, the text in a box, which tab is open. Keep only what can’t be worked out from something else.',
      },
      {
        title: 'Draw the screen from the data',
        text: 'The screen is a function of the state. Never change the screen by hand — change the state, and let the framework render again.',
      },
      {
        title: 'React to the person',
        text: 'Events — a click, a key, a swipe — call handlers that update the state. New state, new screen.',
      },
      {
        title: 'Put state in the right place',
        text: 'State lives in the closest component that needs it. Several need it? [[lift-state|Lift it up]] to their shared parent, or share it with [[context]].',
      },
      {
        title: 'Sync with the outside world',
        text: 'Fetching data, timers and subscriptions happen *after* the screen updates, in [[effect|effects]] — and are cleaned up when they are no longer needed.',
      },
    ],
    picture:
      'A scoreboard at a match. Nobody repaints the numbers by hand: the referee changes the score (state), and every screen in the stadium shows whatever the score is (render). A goal is an event; the scoreboard decides nothing on its own. Keep the score in one place, and every screen agrees.',
  },

  lessonNotes: {
    'react-rendering': 'Jobs 1 to 3: state, the render → compare → commit cycle, and why changing an array in place changes nothing on screen.',
    'use-effect': 'Job 5: effects that run after rendering, dependency arrays, stale answers and cleanup.',
    context: 'Job 4: lifting state up to a shared parent, and context for data needed far down the tree.',
    routing: 'Many screens in one page: the URL as state, links without reloads, and the deep-link 404 in production.',
    memo: 'When interaction feels slow: measure first, move state down, and only then memoise.',
  },

  options: {
    lede: 'Interaction is mostly about *where state lives*. These options aren’t rivals — a real app uses several, each for its own kind of state.',
    items: [
      {
        name: 'Component state',
        what: '`useState` (or `useReducer`) inside the component that uses it.',
        pickWhen: 'UI state one component — or a small group — cares about: an open menu, a form’s text, the selected tab.',
        cost: 'Passing it far down the tree gets clumsy (prop drilling).',
        examples: 'useState, useReducer',
        tools: ['react'],
      },
      {
        name: 'Shared state in context',
        what: 'A provider near the top makes a value available to every component below it.',
        pickWhen: 'A few app-wide values that rarely change: the signed-in user, the theme, the language.',
        cost: 'Every component that reads it re-renders when it changes — a poor fit for fast-changing data.',
        examples: 'React Context with a small custom hook',
      },
      {
        name: 'A state library',
        what: 'A small store outside React that components subscribe to, re-rendering only for the parts they read.',
        pickWhen: 'Lots of client-side state shared by distant screens: an editor, a game, a complex dashboard.',
        cost: 'One more library and pattern to learn — and most apps don’t need it.',
        examples: 'Zustand, Redux Toolkit, Jotai',
      },
      {
        name: 'Server-state caching',
        what: 'Data that really lives on the server is fetched, cached, refreshed and shared by a library, instead of copied into your own state.',
        pickWhen: 'Almost always, for API data: lists, profiles, anything someone else can change.',
        cost: 'You learn its ideas: cache keys, stale time, invalidation.',
        examples: 'TanStack Query, SWR, RTK Query',
      },
      {
        name: 'The URL',
        what: 'Filters, the current page and the selected item live in the path or the query string.',
        pickWhen: 'Anything people might bookmark or share, or expect the Back button to undo.',
        cost: 'Only strings, which you must read and validate.',
        examples: 'React Router’s params and search params, Next.js routing',
      },
    ],
    choose: [
      { when: 'One component’s open/closed, typed text or selected tab', pick: '`useState`, right there in that component.' },
      { when: 'The signed-in user, theme or language', pick: 'Context with a small custom hook.' },
      { when: 'Lists and records from your API', pick: 'TanStack Query or SWR — not copied into your own state.' },
      { when: 'Filters, search, the current page', pick: 'The URL.' },
      { when: 'Complex client-side state that many screens share', pick: 'A small store such as Zustand.' },
    ],
  },

  modern: {
    lede: 'AI writes React fluently — and repeats the mistakes that fill its training data: effects that fetch with no cleanup, state copied from props, arrays changed in place, `useMemo` sprinkled everywhere. The fixes are small once you know the loop: state → render → event → new state.',
    defaults: [
      'Keep state minimal: store the source of truth, and work everything else out during render.',
      'Update immutably: new arrays and objects (`[...items, item]`, `{ ...user, name }`), never `push` or assign into state.',
      'Load API data with a server-state library (TanStack Query, SWR) or your framework’s loaders, rather than a hand-written `useEffect`.',
      'Put shareable UI state — filters, tabs, pages — in the URL.',
      'Measure before optimising. The React Compiler can memoise automatically; add `memo` or `useCallback` by hand only where the profiler shows a cost.',
      'Type your props and state with TypeScript; it catches many interaction bugs before you ever click.',
    ],
    aiGood: [
      'Turning a description of an interaction into state and handlers',
      'Converting old class components and patterns to hooks',
      'Explaining an infinite re-render or a stale value',
      'Writing reducers for complicated state',
      'Wiring TanStack Query hooks to an API',
    ],
    aiWrong: [
      { mistake: 'Changes state in place: `items.push(x); setItems(items)`.', fix: 'Same array, so React sees no change. `setItems([...items, x])`.' },
      { mistake: 'Fetches in `useEffect` with no cleanup, so a quick switch shows the wrong answer.', fix: 'Ignore or abort stale requests in the cleanup — or use TanStack Query.' },
      { mistake: 'Leaves values out of the dependency array, or turns the lint rule off.', fix: 'List every value the effect uses; restructure instead of silencing the rule.' },
      { mistake: 'Copies a prop into state (`useState(props.user)`), which then goes stale.', fix: 'Use the prop directly, or reset the component with a `key`.' },
      { mistake: 'Uses an effect to work out a value from other state.', fix: 'Compute it during render. You might not need an effect.' },
      { mistake: 'Puts fast-changing values in context, so the whole app re-renders on every keystroke.', fix: 'Keep fast state local; split contexts by how often they change.' },
      { mistake: 'Wraps everything in `useMemo` and `useCallback`.', fix: 'Measure first — memoising has a cost too.' },
      { mistake: 'Uses `<a href>` for links inside the app, reloading everything.', fix: 'Use the router’s `<Link>`.' },
    ],
  },

  build: {
    title: 'A live search',
    brief: 'A search box over a list of 1,000 items that filters as you type, keeps the query in the URL, and loads an item’s details from an API when you pick it — with no stale answers and no lag.',
    byHand: [
      { title: 'State for the query', text: '`const [query, setQuery] = useState(\'\')`, and an input whose `value` and `onChange` use it.', see: ['react-rendering', 5] },
      { title: 'Derive, don’t store', text: 'Work out the filtered list during render from the items and the query — no second piece of state to keep in sync.', see: ['use-effect', 8] },
      { title: 'Update immutably', text: 'Starring an item makes a new array with `map`; the old one is never changed.', see: ['react-rendering', 9] },
      { title: 'Put it in the URL', text: 'Keep the query in `?q=` with the router’s search params, so a refresh, a shared link and the Back button all keep the search.', see: ['routing', 4] },
      { title: 'Load details after render', text: 'When an item is picked, fetch its details in an effect, with the item’s id in the dependency array.', see: ['use-effect', 4] },
      { title: 'Throw stale answers away', text: 'In the effect’s cleanup, mark the old request as stale (or abort it), so a slow old answer never replaces a newer one.', see: ['use-effect', 7] },
      { title: 'Keep typing smooth', text: 'If typing lags, move the state down or memoise the list — after the profiler says so, not before.', see: ['memo', 3] },
    ],
    withAI: {
      lede: 'Now let your AI assistant build it. The spec asks for exactly the habits AI tends to get wrong — then the checks below tell you whether it listened.',
      prompt: `Build a "live search" screen in React with React Router.

Behaviour
- A search input filters a list of 1,000 generated items as the user types.
- The query is kept in the URL as ?q= (useSearchParams), so refresh, sharing and Back keep it.
- Clicking an item loads its details from GET /api/items/:id and shows them beside the list.
- Each item has a star toggle.

Rules
- Derive the filtered list during render; do not store it in state.
- Update state immutably (no push, no direct assignment).
- Fetch details with TanStack Query — or, if I ask for no libraries, an effect whose cleanup ignores stale responses.
- Every effect lists all of its dependencies; never disable the exhaustive-deps lint rule.
- Show loading, error and empty states in the details panel.
- No useMemo or useCallback unless you can name the measured problem it fixes.

Then explain where each piece of state lives, and why.`,
    },
    verify: [
      'Type a query and refresh: the same results are still there, because the URL kept it.',
      'Pick an item, then press Back: you return to the previous view, not a different page.',
      'Throttle the network, click item A and then quickly item B: the panel ends on B and never flips back to A.',
      'Star an item, filter, then clear the filter: the star is still there.',
      'The console shows no warnings about keys or missing dependencies.',
      'React DevTools Profiler: typing a letter re-renders the list, not the whole app.',
      'Search for something that matches nothing: an empty state, not a blank panel.',
    ],
  },

  breakIt: [
    {
      title: 'Adding to the list',
      lang: 'jsx',
      code: `function addTodo(text) {
  todos.push({ id: crypto.randomUUID(), text });
  setTodos(todos);
}`,
      err: [2, 3],
      answer:
        '`push` changes the existing array, and `setTodos` receives the *same* array — React compares, sees no change, and skips the render. Make a new array: `setTodos([...todos, { id: crypto.randomUUID(), text }])`.',
      see: ['react-rendering', 9],
    },
    {
      title: 'The effect that ran once',
      lang: 'jsx',
      code: `useEffect(() => {
  fetch(\`/api/users/\${userId}\`)
    .then((r) => r.json())
    .then(setUser);
}, []);`,
      err: [5],
      answer:
        'The empty array means “run once”. When `userId` changes, the effect never runs again and the screen keeps showing the first user. Put `userId` in the dependencies — and add a cleanup, so a slow old answer can’t overwrite a newer one.',
      see: ['use-effect', 5],
    },
    {
      title: 'A copy of the prop',
      lang: 'jsx',
      code: `function Profile({ user }) {
  const [name, setName] = useState(user.name);
  return <h2>{name}</h2>;
}`,
      err: [2],
      answer:
        '`useState` only uses its argument on the first render. When the parent passes a different `user`, `name` keeps the old value. Show `user.name` directly; if you need an editable copy, reset it with `<Profile key={user.id} … />`.',
      see: ['lists-keys', 7],
    },
    {
      title: 'A link to settings',
      lang: 'jsx',
      code: `<nav>
  <a href="/settings">Settings</a>
</nav>`,
      err: [2],
      answer:
        'A plain link makes the browser request a whole new page: the app reloads and every bit of state is lost. Use the router’s `<Link to="/settings">`, which changes the URL without a request.',
      see: ['routing', 3],
    },
  ],

  explain: [
    'Why doesn’t changing a normal variable update the screen — and what does state do differently?',
    'Where should a piece of state live? Explain with an example of lifting state up.',
    'What is a stale response, and how does an effect’s cleanup prevent it?',
  ],

  deeper: [
    {
      q: 'What actually happens when you call `setState`?',
      a: 'React schedules a re-render. It calls your component again for a new description of the interface, compares it with the previous one, and changes only the parts of the real page that differ. Several updates from one event are batched into a single render.',
    },
    {
      q: 'What is the React Compiler?',
      a: 'A build step that analyses your components and adds memoisation automatically, so many hand-written `useMemo`, `useCallback` and `memo` calls become unnecessary. It relies on your components following React’s rules: pure renders, no mutation.',
    },
    {
      q: 'Why is “server state” treated separately?',
      a: 'Data that lives on a server can change without you — someone else edits it, it goes stale. Libraries like TanStack Query treat it as a cache to refresh, a different problem from UI state like an open menu.',
    },
    {
      q: 'Controlled or uncontrolled inputs?',
      a: 'A controlled input’s value comes from state and changes through `onChange`. An uncontrolled input keeps its own value in the page, and you read it when needed — for example on submit. Controlled gives you live validation; uncontrolled is simpler for big forms.',
    },
    {
      q: 'Where do animations fit in?',
      a: 'An animation is state changing over time. CSS transitions handle simple ones; libraries like Motion animate between renders; the View Transitions API animates between whole screens.',
    },
    {
      q: 'What are signals?',
      a: 'Another way to track state: each value knows exactly which parts of the screen read it, and updates only those without re-running whole components. Solid, Svelte, Vue and Angular use them; React re-renders instead.',
    },
  ],

  next: [
    { q: 'Where does the data come from when you pick an item?', chapter: 'integrate' },
    { q: 'How does the app know who you are while you click around?', chapter: 'identity' },
    { q: 'How do big apps stay fast with thousands of items?', chapter: 'fast' },
    { q: 'How does a chat update without you doing anything?', chapter: 'realtime' },
  ],
};

export default writing;
