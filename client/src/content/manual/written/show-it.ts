/**
 * Chapter: Show something to the user (user interfaces).
 * Follows the model chapter, written/identity.ts.
 */
import type { ChapterWriting } from '../types';

const writing: ChapterWriting = {
  hook: {
    story: [
      'Every app you love started as a blank screen. A feed, a bank balance, a game’s menu — underneath, each one is text in files: some say *what is there*, some say *how it looks*, some say *what happens when you touch it*.',
      'Those same few files must look right on a phone in your hand and on a wide monitor, work for someone who can’t see the screen, and appear in under a second.',
      'How does plain text become the screen in your hand — and how do big apps build hundreds of screens without copying the same button a thousand times?',
    ],
    predict: {
      q: 'A shop shows 300 product cards, all with the same layout. How do modern apps build that?',
      options: [
        'Write the HTML for each card by hand',
        'Write one card component, and repeat it with each product’s data',
        'Design one card as an image and copy it',
        'The server sends 300 pictures of cards',
      ],
      answer: 1,
      reveal:
        'One **component**, many times. A component is a reusable piece of interface — a function that takes data ([[props]]) and returns what to show. `ProductCard` is written once; the list hands each copy its own product. Change the component, and all 300 cards change. UI built from small, reusable pieces fed with data is the idea React, Vue, SwiftUI and Flutter all share.',
    },
  },

  idea: {
    lede: 'Whatever you build it with — plain HTML, React, Flutter, SwiftUI — showing something comes down to four jobs.',
    jobs: [
      {
        title: 'Describe what is there',
        text: 'Structure and meaning: a heading, a list, a button, a form. On the web that is HTML — and it is also what screen readers and search engines read.',
      },
      {
        title: 'Make it look right',
        text: 'Layout, colour, type and spacing with CSS — on every screen, from a 360px phone to a wide monitor.',
      },
      {
        title: 'Build from pieces',
        text: 'Split the screen into [[component|components]]: small parts that take data ([[props]]) and return what to show. Write a card once, use it everywhere.',
      },
      {
        title: 'Turn data into screens',
        text: 'Most screens are data shown a certain way: a list becomes cards, a user becomes a profile. Map the data to components, and give each list item a stable [[list-key|key]].',
      },
    ],
    picture:
      'LEGO. The instructions say what goes where (HTML). The colour and shape of each brick make it look right (CSS). And you build with a few kinds of bricks again and again, instead of carving every castle from one block (components). Same bricks, different instructions: a house, a car, a spaceship — same components, different data.',
  },

  lessonNotes: {
    rendering: 'How the browser turns HTML and CSS into pixels — and what keeps a page blank for too long.',
    'components-props': 'Job 3: splitting a screen into components, and how data flows down through props.',
    'lists-keys': 'Job 4: turning a list of data into a list on screen, and why every item needs a stable key.',
  },

  options: {
    lede: 'Every option below draws the same kinds of screens. They differ in how much is done for you, and which devices you reach.',
    items: [
      {
        name: 'Plain HTML and CSS',
        what: 'Write the page directly, with a little JavaScript where it’s needed.',
        pickWhen: 'Content and landing pages, your first projects — and to understand what every framework produces in the end.',
        cost: 'Repeated pieces by hand; keeping many screens in step gets hard as an app grows.',
        examples: 'HTML, CSS and a sprinkle of JavaScript',
        tools: ['html', 'css', 'javascript'],
      },
      {
        name: 'A component framework',
        what: 'Build the interface from components that redraw themselves when their data changes.',
        pickWhen: 'Apps with many screens and lots of interaction — most products today.',
        cost: 'A build step, a framework to learn, and more JavaScript sent to the browser.',
        examples: 'React (this course), Vue, Svelte, Angular',
        tools: ['react', 'vue', 'angular'],
      },
      {
        name: 'A styling system',
        what: 'A faster, more consistent way to style: utility classes, or ready-made accessible components you adapt.',
        pickWhen: 'You want to move fast and keep one consistent look across many screens.',
        cost: 'Another layer to learn — and ready-made components all look alike until you make them yours.',
        examples: 'Tailwind CSS, shadcn/ui, Material UI, Chakra UI',
        tools: ['tailwind-css', 'shadcn', 'material-ui', 'chakra-ui'],
      },
      {
        name: 'A full-stack framework',
        what: 'A component framework plus routing, server rendering and data loading in one.',
        pickWhen: 'A real product on the web where first-load speed and search ranking matter.',
        cost: 'More concepts: which code runs on the server and which in the browser.',
        examples: 'Next.js, Nuxt, SvelteKit',
        tools: ['nextjs', 'nuxt'],
      },
      {
        name: 'Cross-platform mobile',
        what: 'One codebase that builds real iOS and Android apps.',
        pickWhen: 'Your users live on their phones and need an app-store app: notifications, camera, offline.',
        cost: 'App-store reviews and releases, and some features still need native code.',
        examples: 'React Native (with Expo), Flutter — or native Swift and Kotlin',
        tools: ['react-native', 'flutter', 'swift', 'kotlin'],
      },
    ],
    choose: [
      { when: 'Your first page, or a content site', pick: 'Plain HTML and CSS. You will understand everything that comes after.' },
      { when: 'An app with many screens and lots of interaction', pick: 'React (or Vue or Svelte) with Tailwind or a component kit.' },
      { when: 'A product where first load and search ranking matter', pick: 'Next.js or another full-stack framework.' },
      { when: 'Users who live on their phones', pick: 'React Native with Expo — your React carries over — or Flutter.' },
    ],
  },

  modern: {
    lede: 'AI is very good at interfaces: describe a screen or paste a sketch, and a working page appears. What it rarely gets right unless asked is the part users feel but can’t name — the page on a small phone, for someone using a keyboard or a screen reader, on a slow connection, with an empty list.',
    defaults: [
      'Mobile first: design for a 360px-wide screen, then add room for bigger ones.',
      'Semantic HTML first — a real `<button>`, `<a>`, `<label>`, headings in order — then style it.',
      'Build from components with props, and keep a small set of design tokens (colours, spacing, type) instead of one-off values.',
      'Every screen that shows data has four states: loading, error, empty and full.',
      'Check contrast and keyboard use on every screen; every meaningful image gets `alt` text.',
      'Use AI UI generators for a first draft — then read, simplify and own the code.',
    ],
    aiGood: [
      'A first version of a screen from a description or a screenshot',
      'Turning a design into components and props',
      'Responsive layouts with Flexbox and Grid',
      'Explaining why a layout breaks at a certain width',
      'Component variants: sizes, states, themes',
    ],
    aiWrong: [
      { mistake: 'Uses a `<div onClick>` instead of a `<button>`.', fix: 'Real buttons and links work with the keyboard and screen readers for free.' },
      { mistake: 'Uses the array index as the `key` in a list.', fix: 'Use a stable id from the data.' },
      { mistake: 'Designs for a wide laptop only.', fix: 'Check at 360px; ask for mobile-first CSS.' },
      { mistake: 'Leaves out the loading, error and empty states.', fix: 'Ask for all four states of every data screen.' },
      { mistake: 'Hardcodes colours and sizes all over the place.', fix: 'Use your design tokens: CSS variables or the Tailwind theme.' },
      { mistake: 'Images with no `alt`, no size and no lazy loading.', fix: '`alt` text, `width` and `height`, and `loading="lazy"` below the first screen.' },
      { mistake: 'Shows user text with `dangerouslySetInnerHTML`.', fix: 'Render text as text; sanitise if HTML is truly needed ([[xss|XSS]]).' },
    ],
  },

  build: {
    title: 'A product grid',
    brief: 'A responsive page of product cards built from one `ProductCard` component and an array of data — with an empty state, and right on a phone, on a laptop and with a screen reader.',
    byHand: [
      { title: 'Sketch the pieces', text: 'Draw the screen and circle its parts: page, header, grid, card, price. Each circle is a component.', see: ['components-props', 2] },
      { title: 'One card, with props', text: '`ProductCard({ name, price, image, onAdd })` returns the card. It shows data; it never fetches it.', see: ['components-props', 3] },
      { title: 'Data down, events up', text: 'The page owns the product list and passes each product down; the card calls `onAdd(id)` when its button is pressed.', see: ['components-props', 5] },
      { title: 'Turn the data into a list', text: '`products.map((p) => <ProductCard key={p.id} {...p} onAdd={onAdd} />)` — the key is the product’s id, not its position.', see: ['lists-keys', 4] },
      { title: 'Lay it out', text: 'CSS Grid with `repeat(auto-fill, minmax(220px, 1fr))`: one column on a phone, four on a wide screen, no media queries needed.' },
      { title: 'Make it usable by everyone', text: 'A real `<button>` for Add, `alt` text on every image, visible focus styles, and enough contrast.' },
      { title: 'The empty state', text: 'When the array is empty, show a friendly message and a way forward instead of a blank grid.' },
    ],
    withAI: {
      lede: 'Now let your AI assistant build it — with a spec that asks for the things it usually skips. Then check the result against the list below.',
      prompt: `Build a responsive product grid in React (Vite) with plain CSS (or Tailwind if the project already uses it).

Components
- ProductCard({ id, name, price, image, onAdd }): image, name, price formatted as currency, an "Add to cart" button.
- ProductGrid({ products, onAdd }): one card per product, keyed by product id.

Rules
- Semantic HTML: <ul>/<li> for the grid, a real <button> for "Add to cart", alt text on every image.
- Every image has width and height and loading="lazy".
- Layout with CSS Grid: repeat(auto-fill, minmax(220px, 1fr)). It must work at 360px wide.
- Visible focus styles; text contrast of at least 4.5:1.
- If products is empty, show an empty state with a short message.
- No state and no data fetching inside ProductCard.

Then explain which component owns the data, and how a click on "Add to cart" reaches it.`,
    },
    verify: [
      'At 360px wide (DevTools device mode) nothing scrolls sideways and the cards stack in one column.',
      'Press Tab from the top of the page: you reach every Add button, and you can always see where focus is.',
      'Press Enter on a focused Add button: it works without a mouse.',
      'Every image has meaningful `alt` text (or `alt=""` if it is purely decorative).',
      'Pass an empty array: the empty state appears, not a blank area.',
      'The console shows no warnings about keys.',
      'Lighthouse → Accessibility scores 90 or more.',
    ],
  },

  breakIt: [
    {
      title: 'A clickable box',
      lang: 'jsx',
      code: `<div className="btn" onClick={() => onAdd(product.id)}>
  Add to cart
</div>`,
      err: [1],
      answer:
        'It looks like a button, but a keyboard can’t reach it, Enter does nothing, and a screen reader doesn’t announce it as a button. Use `<button type="button" onClick={…}>` — focus, keyboard and announcements come free.',
    },
    {
      title: 'Keys by position',
      lang: 'jsx',
      code: `{todos.map((todo, i) => (
  <TodoItem key={i} todo={todo} />
))}`,
      err: [2],
      answer:
        'Add a todo at the top and every index shifts: React thinks each row became a different todo, so typed text, ticks and animations land on the wrong item. Use a stable id from the data: `key={todo.id}`.',
      see: ['lists-keys', 5],
    },
    {
      title: 'Tidying a prop',
      lang: 'jsx',
      code: `function PriceTag({ product }) {
  product.price = Math.round(product.price);
  return <span>{product.price} €</span>;
}`,
      err: [2],
      answer:
        'Props are read-only. This changes the parent’s data behind its back — other components suddenly show the rounded price too, and React never learns that anything changed. Compute a new value instead: `const price = Math.round(product.price)`.',
      see: ['components-props', 4],
    },
    {
      title: 'Four columns, always',
      lang: 'css',
      code: `.grid {
  display: grid;
  grid-template-columns: repeat(4, 300px);
  gap: 16px;
}`,
      err: [3],
      answer:
        'Four 300px columns need more than 1,200px. On a phone the grid runs off the screen and the whole page scrolls sideways. Let the browser decide how many fit: `repeat(auto-fill, minmax(220px, 1fr))`.',
    },
  ],

  explain: [
    'What is a component, and why do apps build their screens out of them?',
    'Why does every item in a list need a stable key?',
    'Who can’t use a page built from `<div>`s with click handlers — and why?',
  ],

  deeper: [
    {
      q: 'What is the virtual DOM — and is it what makes React fast?',
      a: 'It is a lightweight description of the interface that React compares between renders, so it can change only what differs in the real page. It isn’t magic speed; it makes updates *predictable*. Careful hand-written DOM code can be just as fast.',
    },
    {
      q: 'What is a design system?',
      a: 'A shared set of design tokens (colours, spacing, type) and components with rules for using them, so a product with hundreds of screens still looks and behaves like one thing.',
    },
    {
      q: 'How does a screen reader read a page?',
      a: 'It walks the *accessibility tree* the browser builds from your HTML: headings, landmarks, buttons, labels. Semantic HTML fills that tree for free; a page of `<div>`s leaves it nearly empty.',
    },
    {
      q: 'What are server components?',
      a: 'React components that run only on the server. They can read data directly and send finished interface to the browser, with none of their own code shipped to it. Next.js uses them by default.',
    },
    {
      q: 'How do responsive images work?',
      a: '`srcset` and `sizes` list the same image at several widths, and the browser downloads the smallest one that still looks sharp on that screen.',
    },
    {
      q: 'Why is it called a *cascade*?',
      a: 'Many CSS rules can match one element. The cascade decides which wins: origin and layers first, then specificity, then whichever comes last. Knowing that ends most “why isn’t my style working?” fights.',
    },
  ],

  next: [
    { q: 'When you tap Like, how does the number change without reloading?', chapter: 'interact' },
    { q: 'Where does the product data come from?', chapter: 'integrate' },
    { q: 'Why does a page you visited before open instantly?', chapter: 'fast' },
    { q: 'How do you put your page on the internet?', chapter: 'ship' },
  ],
};

export default writing;
