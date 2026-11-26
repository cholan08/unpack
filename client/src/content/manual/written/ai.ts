/**
 * Chapter: Make it smart (AI in products).
 * Follows the model chapter, written/identity.ts.
 */
import type { ChapterWriting } from '../types';

const writing: ChapterWriting = {
  hook: {
    story: [
      'A shop’s help page answers questions about its own return policy at 3 a.m. A notes app summarises your meeting. A support inbox sorts itself. A few years ago each of these was a research project; today it is an API call.',
      'But a language model on its own knows the internet up to some date — not your documents, your customers or your rules. Making a product *smart* is mostly about what you put around the model: the right information, clear limits, checks on what comes out, and a way to tell whether it is any good.',
      'How does an app answer questions about your own documents, when the AI was never trained on them?',
    ],
    predict: {
      q: 'You want an assistant that answers from your company’s 500 help articles. What is usually the best first approach?',
      options: [
        'Train your own model from scratch',
        'Fine-tune a model on the articles',
        'Search the articles for each question and give the best passages to an existing model (RAG)',
        'Paste all 500 articles into every prompt',
      ],
      answer: 2,
      reveal:
        'Retrieval first. Training from scratch costs a fortune; fine-tuning teaches style more than facts and goes stale when articles change; pasting everything is slow, costly and blurs the model’s attention. Searching for the few relevant passages and asking a capable model to answer from them is cheap and current — edit an article and the next answer uses it — and it can cite its sources. That is [[rag|RAG]].',
    },
  },

  idea: {
    lede: 'Chat assistants, summaries, smart search, AI agents — every AI feature in a product does the same five jobs.',
    jobs: [
      {
        title: 'Call a model from your server',
        text: 'The browser asks your API; your server holds the key, adds instructions (a system prompt), and calls the [[llm|model]] with a limit on length.',
      },
      {
        title: 'Give it the facts',
        text: 'Models don’t know your data. Find the relevant pieces — by keywords, by meaning ([[embedding|embeddings]]) or from your database — and put them in the prompt.',
      },
      {
        title: 'Ask for something you can check',
        text: 'Structured output — JSON with named fields — validated like any other input: an answer with sources, a category, a confidence.',
      },
      {
        title: 'Let it act, within limits',
        text: 'With [[tool-use|tool use]] the model asks your code to run functions; your code decides, with the user’s own permissions.',
      },
      {
        title: 'Measure and guard',
        text: 'A set of test questions with known good answers (evals), limits on cost and abuse, and people in the loop wherever mistakes are expensive.',
      },
    ],
    picture:
      'A brilliant temp who started this morning. They write beautifully and know a lot about the world — and nothing about your company. You hand them the right file for each question (RAG), a form to fill in instead of a blank page (structured output), a phone that only dials approved numbers (tools), and you check their work against known answers before trusting them alone (evals).',
  },

  lessonNotes: {
    'llm-apps': 'All five jobs: calling a model from your server, why it makes things up, RAG and embeddings, checked output, and tools with the user’s own rights.',
  },

  options: {
    lede: 'From one API call to a team of agents — start at the simplest level that solves the problem, and move up only when your evals show you need to.',
    items: [
      {
        name: 'A model API with a good prompt',
        what: 'Send instructions and the user’s input; get text or JSON back.',
        pickWhen: 'Summarising, rewriting, classifying, extracting — tasks where the input already holds everything needed.',
        cost: 'No knowledge of your data; quality rests on clear instructions and checks.',
        examples: 'Anthropic (Claude), OpenAI, Google (Gemini), Mistral — through their SDKs',
      },
      {
        name: 'RAG over your documents',
        what: 'Embed your documents, search them for each question, and answer from the best passages.',
        pickWhen: 'Help centres, internal knowledge, “ask your documents” — answers that must come from your content.',
        cost: 'Chunking, embedding, keeping the index fresh, and search quality to tune.',
        examples: 'pgvector, MongoDB Atlas Vector Search, Pinecone, Qdrant; frameworks such as LlamaIndex or LangChain',
        tools: ['mongodb', 'postgresql'],
      },
      {
        name: 'Tools and agents',
        what: 'The model calls your functions in a loop — look up, calculate, act — until the task is done.',
        pickWhen: 'Tasks that need live data or actions: order status, bookings, multi-step support.',
        cost: 'Harder to predict and test; every tool needs strict permissions and limits.',
        examples: 'Tool calling in every major model API; the Model Context Protocol (MCP) for connecting tools',
      },
      {
        name: 'An open model you host',
        what: 'Run an open-weight model on your own servers or a GPU provider.',
        pickWhen: 'Data that must not leave your servers, very high volume, or offline use.',
        cost: 'GPUs and operations to run, and usually lower quality than the best hosted models.',
        examples: 'Llama, Mistral, Qwen, Gemma — through Ollama, vLLM or a GPU host',
        tools: ['python'],
      },
      {
        name: 'Fine-tuning',
        what: 'Train a model further on your own examples, to change its style or output format.',
        pickWhen: 'A consistent format or tone that prompting can’t achieve, at high volume.',
        cost: 'Data preparation and cost — and it doesn’t keep facts current; retrieval does.',
        examples: 'Providers’ fine-tuning APIs; LoRA on open models',
      },
    ],
    choose: [
      { when: 'Summarise, classify or rewrite', pick: 'A model API with a clear prompt and structured output.' },
      { when: 'Answer from your own documents', pick: 'RAG, with the sources shown.' },
      { when: 'Do things: check orders, book, update', pick: 'Tools with strict permissions — start with one or two.' },
      { when: 'Data can’t leave your servers', pick: 'An open model you host.' },
      { when: 'A format that prompting can’t fix', pick: 'Fine-tuning — after you have evals.' },
    ],
  },

  modern: {
    lede: 'This is the fastest-moving area in the Manual: models, prices and APIs change every few months. What lasts is the shape — calls from your server, your facts in the prompt, checked output, limited tools, measured quality. Build behind your own small wrapper so that changing models is a one-line change.',
    defaults: [
      'Call models only from your server, through one wrapper module, with the model name in config.',
      'Ground answers in your own data with retrieval, and show the sources.',
      'Ask for structured output and validate it; hand over to a person when it fails or is unsure.',
      'Stream long answers, cap tokens, cache repeated questions, and rate-limit per user.',
      'Give tools only the current user’s permissions, and never run model output as code or queries.',
      'Keep an eval set of real questions and good answers, and run it before every prompt or model change.',
    ],
    aiGood: [
      'Drafting system prompts and tool descriptions',
      'Generating test questions for an eval set',
      'Writing chunking and embedding pipelines',
      'Building the streaming interface',
      'Explaining why an answer went wrong, from the prompt and the sources',
    ],
    aiWrong: [
      { mistake: 'Puts the provider’s key in frontend code.', fix: 'Calls from the server only; the browser talks to your API.' },
      { mistake: 'Uses a model name, option or SDK method from an older version.', fix: 'Check the provider’s current docs, and keep the model name in config.' },
      { mistake: 'Treats the model’s text as fact.', fix: 'Answer from retrieved sources, show them, and say “I don’t know” when they are missing.' },
      { mistake: 'Passes user input straight into tools that change data.', fix: 'Validate every tool call, run it with the user’s rights, and confirm destructive actions with the user.' },
      { mistake: 'Sends whole documents or chat histories every time.', fix: 'Retrieve the relevant chunks, summarise long histories, cap tokens.' },
      { mistake: 'Ships with no way to measure quality.', fix: 'An eval set built from real questions, run on every change.' },
      { mistake: 'Logs prompts full of personal data.', fix: 'Redact before logging, and check what your provider keeps.' },
    ],
  },

  build: {
    title: 'Ask your own bookmarks',
    brief: 'Add “Ask my bookmarks” to your app: questions answered from the pages you have saved, with links to the sources — plus a small eval set that tells you whether a change made it better or worse.',
    byHand: [
      { title: 'A wrapper and a route', text: '`llm.js` wraps your provider’s SDK; `POST /api/ask` validates the question, checks the user, and calls it with a system prompt and a token limit.', see: ['llm-apps', 3] },
      { title: 'Chunk and embed', text: 'For each bookmark, build a short text (title, description, your notes), split it into chunks, and store an embedding for each.', see: ['llm-apps', 6] },
      { title: 'Search, then ask', text: 'Embed the question, find the five nearest chunks — *of this user’s bookmarks only* — and answer from them.', see: ['llm-apps', 5] },
      { title: 'Checkable output', text: 'Ask for `{ answer, sources, confident }`, validate it with Zod, and show the sources as links.', see: ['llm-apps', 7] },
      { title: 'Stream it', text: 'Stream the answer, so words appear as they are generated.' },
      { title: 'Limits', text: 'Rate-limit `/api/ask` per user, cap the question and answer lengths, and cache identical questions for an hour.' },
      { title: 'Evals', text: 'Write 15 real questions with what a good answer must contain; run them after every prompt change and keep the score.' },
    ],
    withAI: {
      lede: 'Let your AI assistant build it — with a spec that fixes the three classic mistakes: the key in the browser, searching everyone’s data, and trusting output unchecked.',
      prompt: `Add "Ask my bookmarks" to my Express + Mongoose + React app. Use my existing llm.js wrapper (or create one around the provider SDK I name), with the model name read from an environment variable.

Server
- On bookmark create/update: build text from title, description and notes; split it into chunks of about 500 tokens; store the chunks with embeddings and the owner's id.
- POST /api/ask { question }: requireAuth; validate with Zod (1–500 characters); rate-limit to 20 per hour per user.
- Vector-search ONLY the current user's chunks (filter by owner), top 5.
- System prompt: answer only from the provided sources; if they don't contain the answer, say you don't know.
- Ask for JSON { answer, sources: [bookmarkId], confident }; validate it with Zod; if it fails, return a friendly fallback.
- Stream the answer text to the client.

Evals
- A script that runs the questions in evals.json against /api/ask and reports which answers contain the expected facts and cite a correct source.

Never log full prompts or answers — only ids, token counts and timings.`,
    },
    verify: [
      'Ask about something you saved: the answer is right and links to the bookmark.',
      'Ask about something you never saved: it says it doesn’t know, and invents nothing.',
      'Log in as a second user: your bookmarks never appear in their answers.',
      'The provider key appears nowhere in the browser bundle.',
      'Answers start appearing within a second or two.',
      'The 21st question within an hour gets **429**.',
      'Your eval script prints a score — and you have seen it change after editing the prompt.',
    ],
  },

  breakIt: [
    {
      title: 'Trusting the model’s word',
      lang: 'js',
      code: `const reply = await llm.chat({ messages: [{ role: 'user', content: question }] });
res.json({ answer: reply }); // shown as our official policy`,
      err: [1, 2],
      answer:
        'With none of your documents in the prompt, the model answers from general knowledge — and its guesses are shown as your policy. Retrieve the relevant passages, tell it to answer only from them, and show the sources (or “I don’t know”).',
      see: ['llm-apps', 4],
    },
    {
      title: 'Searching everyone’s notes',
      lang: 'js',
      code: `const q = await llm.embed(question);
const chunks = await Chunk.vectorSearch(q, { limit: 5 });`,
      err: [2],
      answer:
        'The search runs over every user’s chunks, so one person’s question can pull someone else’s private notes into the answer. Filter by owner — and permissions — inside the vector search itself.',
    },
    {
      title: 'A tool with too much power',
      lang: 'js',
      code: `const tools = [{
  name: 'runQuery',
  description: 'Run any MongoDB query',
  input: { collection: 'string', filter: 'object' },
}];`,
      err: [2, 3],
      answer:
        'The model can now read anything in your database — and text hidden in a document could ask it to. Give tools narrow jobs (`getMyOrder(orderNo)`) that run with the current user’s rights.',
      see: ['llm-apps', 8],
    },
    {
      title: 'Parse and hope',
      lang: 'js',
      code: `const data = JSON.parse(reply);
await Order.updateOne({ _id: data.orderId }, { status: data.status });`,
      err: [1, 2],
      answer:
        'Model output is untrusted input. It may not be valid JSON, may name another user’s order, or a status that doesn’t exist. Validate it with a schema, check ownership, allow only known statuses — and confirm destructive actions with the user.',
    },
  ],

  explain: [
    'Why does a language model make things up about your business — and how does RAG prevent it?',
    'Why must tools run with the user’s own permissions?',
    'How would you know whether a prompt change made your assistant better or worse?',
  ],

  deeper: [
    {
      q: 'What is the difference between RAG and fine-tuning?',
      a: 'RAG gives the model facts at question time — edit a document and the next answer uses it. Fine-tuning changes the model’s behaviour through training: good for style and format, poor for facts that change.',
    },
    {
      q: 'What is an AI agent?',
      a: 'A model in a loop with tools: it plans, calls a tool, reads the result and decides the next step until the task is done. Powerful for multi-step work — and harder to predict, so limits and logs matter more.',
    },
    {
      q: 'What is prompt injection?',
      a: 'Instructions hidden in content the model reads — a web page, an email, a document — that try to make it ignore your rules. Treat everything the model reads as untrusted, and limit what its tools can do.',
    },
    {
      q: 'What are evals?',
      a: 'Tests for AI features: inputs paired with what a good output must contain, scored automatically — sometimes by another model — on every change. Without them you are guessing whether you made things better.',
    },
    {
      q: 'Why are AI answers different every time?',
      a: 'Models sample from likely next words, so one prompt can produce different text. Lower randomness, clear instructions and structured output make results more consistent.',
    },
    {
      q: 'What does an AI feature cost to run?',
      a: 'You pay per [[llm-token|token]], in and out. Long prompts with many sources cost more; caching, shorter contexts, smaller models for simple steps and per-user limits keep it predictable. Check your provider’s current prices.',
    },
  ],

  next: [
    { q: 'How do you search by meaning across millions of items?', chapter: 'search' },
    { q: 'How do you run slow AI tasks without making people wait?', chapter: 'background' },
    { q: 'How do you connect AI to the rest of a business’s tools?', chapter: 'automate' },
    { q: 'How do you build *with* AI, not just add it to a product?', chapter: 'build-with-ai' },
  ],
};

export default writing;
