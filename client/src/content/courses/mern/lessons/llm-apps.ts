import { box, browser, chip, db, defineLesson, doc, field, flow, link, patch } from '@/content/dsl';
import type { LinkSpec, NodeSpec, ScreenLine } from '@/engine/types';

/* ---------- layout: the shop's page (left) → your API (middle) → the model and your data (right) ---------- */
const ask: ScreenLine[] = [
  { t: 'h', text: 'Help' },
  { t: 'input', text: 'Return after 40 days?' },
  { t: 'btn', text: 'Ask' },
];
const answered: ScreenLine[] = [
  { t: 'h', text: 'Help' },
  { t: 'text', text: 'Returns: within 30 days.' },
  { t: 'ok', text: 'Source: returns policy' },
];
const wrong: ScreenLine[] = [
  { t: 'h', text: 'Help' },
  { t: 'error', text: '“60 days, always free!”' },
];

const web = browser(150, 300, { url: 'myshop.app/help', screen: ask, w: 240, h: 190 });
const api = box(470, 300, 'Your API', { sub: 'Express · /api/ask', icon: 'server', tone: 'server', w: 210 });
const llm = box(820, 150, 'LLM provider', { sub: 'model API', icon: 'cpu', tone: 'ai', w: 210 });
const vdb = db(820, 330, 'Vector index', { items: ['policy chunks'], tone: 'data' });
const orders = db(820, 500, 'Orders', { items: ['orders'], tone: 'data' });

const base: Record<string, NodeSpec> = { web, api, llm };
const baseLinks: LinkSpec[] = [link('web', 'api'), link('api', 'llm')];
const ragNodes: Record<string, NodeSpec> = { web, api, llm, vdb };
const ragLinks: LinkSpec[] = [link('web', 'api'), link('api', 'llm'), link('api', 'vdb')];

const routeCode = `import { llm } from '../llm.js'; // one module wraps the provider's SDK

app.post('/api/ask', requireAuth, async (req, res) => {
  const { question } = AskInput.parse(req.body);
  const answer = await llm.chat({
    system: 'You answer questions about MyShop. If unsure, say so.',
    messages: [{ role: 'user', content: question }],
    maxTokens: 400,
  });
  res.json({ answer });
});`;

const ragCode = `const q = await llm.embed(question);                 // meaning → numbers
const chunks = await Chunk.vectorSearch(q, { limit: 3 }); // nearest passages

const answer = await llm.chat({
  system: 'Answer ONLY from the sources. If they do not say, reply "I don't know".',
  messages: [{
    role: 'user',
    content: \`Sources:\\n\${chunks.map((c) => c.text).join('\\n---\\n')}\\n\\nQuestion: \${question}\`,
  }],
});`;

const toolCode = `const tools = [{
  name: 'getOrder',
  description: 'Look up one of the CURRENT user\\'s orders by number',
  input: { orderNo: 'string' },
}];

// the model asks; YOUR code runs it — with the logged-in user's rights
async function getOrder({ orderNo }, user) {
  return Order.findOne({ number: orderNo, owner: user.id }); // never anyone else's
}`;

export default defineLesson({
  metrics: [
    { id: 'keySafe', label: 'API key kept on the server' },
    { id: 'grounded', label: 'Answers from your data' },
    { id: 'checked', label: 'Output checked by code' },
  ],
  legend: { data: 'your data', event: 'tool call' },
  goals: [
    { text: 'Why the model is called from your server', step: 2 },
    { text: 'Why models make things up', step: 4 },
    { text: 'RAG: answers grounded in your documents', step: 5 },
    { text: 'Embeddings and vector search', step: 6 },
    { text: 'Tools: letting the model use your functions safely', step: 8 },
  ],
  steps: [
    {
      short: 'The idea',
      beat: 'setup',
      title: 'A help assistant that knows your shop',
      body: [
        'A customer types *“Can I return shoes after 40 days?”* and gets a clear answer in a second — at 3 a.m., in their own words. That is a [[llm|large language model]] working inside a normal web app.',
        'Underneath it is the same round trip as everything else in this course: the browser asks **your API**, your API asks a **model provider**, and the answer travels back.',
      ],
      callout: { kind: 'picture', text: 'A brilliant new shop assistant who has read half the internet — but has never seen *your* shop. Everything in this lesson is about giving them the right papers and the right limits.' },
      metrics: { keySafe: 'yes', grounded: 'no', checked: 'no' },
      scene: {
        nodes: base,
        links: baseLinks,
        flows: [flow(['web', 'api', 'llm'], { kind: 'req', label: ['POST /api/ask', 'question'], back: 'res', backLabel: ['answer', 'answer'], every: 5 })],
      },
    },
    {
      short: 'Not from the browser',
      beat: 'problem',
      title: 'Call the model from the browser? Never.',
      body: [
        'The quickest demo calls the provider straight from React with the API key in a `VITE_` variable. That key is now in your JavaScript bundle: anyone can copy it and run up your bill — or use it for anything they like.',
        'Model calls are like payments: the browser asks *your* server, and only your server holds the key.',
      ],
      code: {
        file: 'src/Help.jsx',
        lang: 'jsx',
        code: `// ❌ the key ships to every visitor
await fetch('https://api.model-provider.example/v1/chat', {
  headers: { Authorization: \`Bearer \${import.meta.env.VITE_AI_KEY}\` },
  body: JSON.stringify({ messages: [{ role: 'user', content: q }] }),
});`,
        err: [3],
      },
      metrics: { keySafe: 'no', grounded: 'no', checked: 'no' },
      scene: {
        nodes: {
          web: { ...web, state: 'error', badge: { text: 'key in bundle', tone: 'danger' } },
          llm,
          key: chip(150, 470, 'VITE_AI_KEY', { tone: 'danger', icon: 'key' }),
        },
        links: [link('web', 'llm', { state: 'error' }), link('web', 'key', { style: 'dashed' })],
        flows: [flow(['web', 'llm'], { kind: 'auth', label: 'Bearer sk-…', every: 4.4 })],
      },
    },
    {
      short: 'Your server',
      beat: 'solution',
      title: 'Your server talks to the model',
      body: [
        'The browser posts the question to `/api/ask`. Your route checks who is asking, validates the input, adds a **system prompt** (your instructions), calls the model, and returns the answer.',
        'Models read and write [[llm-token|tokens]] — chunks of about three-quarters of a word — and you pay per token, both ways. So cap the answer’s length and the question’s size.',
      ],
      code: { file: 'routes/ask.js', lang: 'js', code: routeCode, hl: [3, 5, 6, 8] },
      changes: ['- API key in the browser', '+ /api/ask on your server', '+ System prompt and a token limit'],
      metrics: { keySafe: 'yes', grounded: 'no', checked: 'no' },
      scene: {
        nodes: patch(base, { api: { state: 'active', badge: { text: 'key lives here', tone: 'ok' } } }),
        links: baseLinks,
        flows: [flow(['web', 'api', 'llm'], { kind: 'req', label: ['question', 'system + question'], back: 'res', backLabel: ['answer', 'tokens'], every: 5 })],
      },
    },
    {
      short: 'Made up',
      beat: 'problem',
      title: 'It answers confidently — and wrongly',
      body: [
        'The model has never seen MyShop’s return policy. Asked about it, it predicts what a return policy *usually* says and writes it fluently. That is a [[hallucination]]: not a lie, just a guess that sounds like a fact.',
        'A help assistant that invents policies is worse than none. The model needs *your* facts, every time it answers.',
      ],
      check: {
        q: 'The model was never trained on your shop’s return policy. Asked about it, what does it most often do?',
        options: ['Says it doesn’t know', 'Writes a plausible-sounding policy', 'Looks it up on your website', 'Refuses to answer'],
        answer: 1,
        explain: 'Language models predict likely text. Without your facts in the prompt, “likely” means “what return policies usually say” — stated with confidence.',
      },
      metrics: { keySafe: 'yes', grounded: 'no', checked: 'no' },
      scene: {
        nodes: patch(base, { web: { screen: wrong }, llm: { state: 'error', badge: { text: 'guessing', tone: 'danger' } } }),
        links: baseLinks,
        flows: [flow(['web', 'api', 'llm'], { kind: 'req', label: ['40 days?', 'question'], back: 'err', backLabel: ['“60 days!”', 'invented'], every: 5 })],
      },
    },
    {
      short: 'RAG',
      beat: 'solution',
      title: 'Find the right passages first, then ask',
      body: [
        '[[rag|Retrieval-augmented generation]]: before calling the model, search **your own documents** for the passages most related to the question, and put them in the prompt with one rule — *answer only from these*.',
        'Now the model isn’t remembering; it is reading. The answer can quote its source, and when the documents don’t cover something, it can say *“I don’t know.”*',
      ],
      code: { file: 'routes/ask.js', lang: 'js', code: ragCode, hl: [1, 2, 5] },
      changes: ['+ Search your documents first', '+ Passages go into the prompt', '+ “Answer only from the sources”'],
      metrics: { keySafe: 'yes', grounded: 'yes', checked: 'no' },
      scene: {
        nodes: patch(ragNodes, { web: { screen: answered }, vdb: { state: 'active' } }),
        links: ragLinks,
        flows: [
          flow(['web', 'api'], { kind: 'req', label: 'question', every: 6 }),
          flow(['api', 'vdb'], { kind: 'req', label: 'find similar', back: 'data', backLabel: '3 passages', every: 6, offset: 1 }),
          flow(['api', 'llm'], { kind: 'req', label: 'passages + question', back: 'res', backLabel: 'answer + source', every: 6, offset: 2.6 }),
        ],
      },
    },
    {
      short: 'Embeddings',
      beat: 'technique',
      title: 'Meaning as numbers: embeddings',
      body: [
        'How do you find passages about *returning shoes* when the policy says *“items may be sent back within 30 days”*? Not by matching words — by matching **meaning**.',
        'Split your documents into small chunks, and turn each into an [[embedding]]: a list of numbers where similar meanings land close together. Store them in a vector index. At question time, embed the question and fetch the nearest chunks.',
      ],
      callout: { kind: 'tip', text: 'Start with your existing database’s vector search (MongoDB Atlas Vector Search, pgvector). Re-embed a chunk whenever its document changes, or answers go stale.' },
      metrics: { keySafe: 'yes', grounded: 'yes', checked: 'no' },
      scene: {
        nodes: {
          pages: doc(170, 300, 'returns-policy.md · chunk 2', [field('text', '"Items may be sent…"'), field('vector', '[0.12, -0.41, …]', { hl: true }), field('source', '"returns#30-days"')], { w: 270, tone: 'neutral', icon: 'file' }),
          embed: box(500, 300, 'Embedding model', { sub: 'text → numbers', icon: 'cpu', tone: 'ai', w: 220 }),
          vdb: { ...vdb, state: 'active' },
        },
        links: [link('pages', 'embed'), link('embed', 'vdb')],
        flows: [flow(['pages', 'embed', 'vdb'], { kind: 'data', label: ['chunk text', '1,536 numbers'], every: 4.4 })],
      },
    },
    {
      short: 'Checked output',
      beat: 'technique',
      title: 'Ask for structure — and check it',
      body: [
        'Free text is hard for code to trust. Ask the model for **structured output** — JSON with `answer`, `sources` and `confident` — then validate it with a schema like any other input. If it doesn’t parse, or has no sources, don’t show it.',
        'Your interface can now show the sources as links, and hand low-confidence questions to a human.',
      ],
      code: {
        file: 'routes/ask.js',
        lang: 'js',
        code: `const Answer = z.object({
  answer: z.string().max(1200),
  sources: z.array(z.string()).min(1),
  confident: z.boolean(),
});

const result = Answer.safeParse(JSON.parse(raw));
if (!result.success || !result.data.confident) return handOffToHuman(question);`,
        hl: [3, 8],
      },
      metrics: { keySafe: 'yes', grounded: 'yes', checked: 'yes' },
      scene: {
        nodes: {
          ...patch(ragNodes, { web: { screen: answered } }),
          out: doc(470, 480, 'answer.json', [field('answer', '"Within 30 days…"'), field('sources', '["returns#30-days"]'), field('confident', 'true', { hl: true })], { w: 260, tone: 'server', icon: 'json', state: 'ok' }),
        },
        links: [...ragLinks, link('api', 'out', { style: 'dashed' })],
        flows: [flow(['api', 'llm'], { kind: 'req', label: 'return JSON', back: 'res', backLabel: '{ answer, sources }', every: 5 })],
      },
    },
    {
      short: 'Tools',
      beat: 'technique',
      title: 'Let the model use your functions — on your terms',
      body: [
        '“Where is my order 1042?” isn’t in any document. With [[tool-use|tool use]], you describe functions the model may ask for. It replies *“call getOrder with 1042”*; **your** code runs it, with the logged-in user’s rights, and sends back the result.',
        'The model never touches your database. It can only *ask* — and your code decides, checking ownership exactly as any route would.',
      ],
      code: { file: 'ai/tools.js', lang: 'js', code: toolCode, hl: [8, 9] },
      metrics: { keySafe: 'yes', grounded: 'yes', checked: 'yes' },
      scene: {
        nodes: { web: { ...web, screen: [{ t: 'h', text: 'Help' }, { t: 'input', text: 'Where is order 1042?' }] }, api: { ...api, state: 'active' }, llm, orders: { ...orders, state: 'active' } },
        links: [link('web', 'api'), link('api', 'llm'), link('api', 'orders')],
        flows: [
          flow(['llm', 'api'], { kind: 'event', label: 'call getOrder(1042)', every: 6 }),
          flow(['api', 'orders'], { kind: 'req', label: 'order 1042 of Ana', back: 'data', backLabel: 'shipped', every: 6, offset: 1.2 }),
          flow(['api', 'llm'], { kind: 'data', label: 'result', every: 6, offset: 3 }),
        ],
      },
    },
    {
      short: 'Trade-offs',
      beat: 'tradeoff',
      title: 'Cost, speed and safety',
      body: [
        '**Cost:** every question costs tokens — cache common answers and limit sizes. **Speed:** a model may take seconds; **stream** the answer so words appear as they are generated. **Abuse:** rate-limit `/api/ask` like a login.',
        '**Safety:** text inside documents or messages can try to give the model instructions (*prompt injection*), so tools only ever get the current user’s rights. And measure quality with **evals**: a set of real questions with known good answers, run on every change.',
      ],
      callout: { kind: 'warn', text: 'Never let a model’s output run as code, SQL or a shell command, and never let it act with more permissions than the user who asked.' },
      metrics: { keySafe: 'yes', grounded: 'yes', checked: 'yes' },
      scene: {
        nodes: patch(ragNodes, { web: { screen: answered }, api: { badge: { text: 'limit · cache · log · evals', tone: 'ok' } } }),
        links: ragLinks,
        flows: [flow(['web', 'api', 'llm'], { kind: 'req', label: ['question', 'prompt'], back: 'res', backLabel: ['streamed words', 'stream'], every: 4 })],
      },
    },
    {
      short: 'Recap',
      beat: 'recap',
      title: 'AI in your app, in one picture',
      body: [
        'The browser asks {server:your API}; only your server holds the key and calls the **model**. {data:Your documents} are searched first (RAG), so answers come from your facts — with sources.',
        'Output is {ok:validated} like any input, tools run with the {auth:user’s own rights}, and cost, speed and quality are watched like any other feature.',
      ],
      metrics: { keySafe: 'yes', grounded: 'yes', checked: 'yes' },
      scene: {
        nodes: { ...patch(ragNodes, { web: { screen: answered } }), orders },
        links: [...ragLinks, link('api', 'orders')],
        flows: [
          flow(['web', 'api'], { kind: 'req', label: 'question', every: 6 }),
          flow(['api', 'vdb'], { kind: 'req', label: 'search', back: 'data', backLabel: 'passages', every: 6, offset: 1 }),
          flow(['api', 'llm'], { kind: 'req', label: 'prompt', back: 'res', backLabel: 'answer', every: 6, offset: 2.6 }),
        ],
      },
    },
  ],
});
