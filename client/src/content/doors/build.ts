/**
 * The Build door: "I want to build ___" → the chapters it needs (docs/VISION.md §4).
 *
 * A product is described by what it does (features), never by a stack. Each feature pulls in the
 * chapters that solve it, with the reason in plain words. An idea is a starting point: a phrase,
 * the features it usually has, and words that recognise it when someone types their own idea.
 * AI drafted these; the owner reviews them (docs/PLAN-MANUAL.md, M3).
 */
import type { LucideIcon } from 'lucide-react';
import {
  Bot,
  CalendarCheck,
  CreditCard,
  Gauge,
  Hourglass,
  Image,
  ListTodo,
  Mail,
  MessagesSquare,
  MousePointerClick,
  Database,
  Newspaper,
  Plug,
  Radio,
  Search,
  ShoppingCart,
  Sparkles,
  SquareKanban,
  UserRound,
  Workflow,
  HeartPulse,
  FileText,
} from 'lucide-react';

/** A chapter a build needs, and why — finishing the sentence "You need this…". */
export interface Need {
  chapter: string;
  why: string;
}

export interface Feature {
  id: string;
  /** What the product does, in the learner's words. */
  label: string;
  icon: LucideIcon;
  needs: Need[];
  /** Words in someone's own idea that mean this feature ("login" → accounts). Lower case. */
  words: string[];
}

export interface Idea {
  id: string;
  /** Fills the blank: "I want to build ___". */
  phrase: string;
  title: string;
  pitch: string;
  icon: LucideIcon;
  /** Feature ids this kind of product usually has. */
  features: string[];
  /** Words that recognise this idea in someone's own description. Lower case. */
  words: string[];
  /** Where it is designed end to end already: a lesson id, or a page. */
  study?: { lesson: string } | { href: string; label: string };
}

/** Every product needs these, whatever it does. */
export const CORE: Need[] = [
  { chapter: 'show-it', why: 'so there is something to see and tap' },
  { chapter: 'ship', why: 'so anyone can open it with a link' },
];

/** How you will work on any build — the craft chapters. */
export const CRAFT: Need[] = [
  { chapter: 'plan', why: 'Cut the idea down to a first version you can ship.' },
  { chapter: 'build-with-ai', why: 'Ask for code you can check — then check it.' },
  { chapter: 'debug', why: 'When it breaks (it will), find out why.' },
];

export const FEATURES: Feature[] = [
  {
    id: 'interact',
    label: 'People tap, type and fill in forms',
    icon: MousePointerClick,
    needs: [{ chapter: 'interact', why: 'so the screen answers the moment someone does something' }],
    words: ['form', 'forms', 'button', 'click', 'tap', 'type', 'input', 'interactive', 'quiz', 'game', 'calculator', 'editor', 'vote', 'poll'],
  },
  {
    id: 'data',
    label: 'It remembers things for later',
    icon: Database,
    needs: [
      { chapter: 'answer-requests', why: 'so the app can ask a server to save and fetch things' },
      { chapter: 'remember', why: 'so what people saved is still there tomorrow' },
    ],
    words: ['save', 'saved', 'saves', 'store', 'stores', 'remember', 'keep', 'keeps', 'data', 'database', 'list', 'lists', 'history', 'record', 'records', 'track', 'tracker', 'log', 'inventory'],
  },
  {
    id: 'accounts',
    label: 'Each person has their own account',
    icon: UserRound,
    needs: [
      { chapter: 'identity', why: 'so people sign in and the app knows who they are' },
      { chapter: 'protect', why: 'so nobody can see or change someone else’s things' },
    ],
    words: ['login', 'log in', 'sign in', 'sign up', 'signup', 'account', 'accounts', 'user', 'users', 'profile', 'profiles', 'member', 'members', 'password', 'private', 'my own'],
  },
  {
    id: 'files',
    label: 'People upload photos or files',
    icon: Image,
    needs: [{ chapter: 'files', why: 'so uploads are checked and stored where big files belong' }],
    words: ['upload', 'uploads', 'photo', 'photos', 'image', 'images', 'picture', 'pictures', 'video', 'videos', 'file', 'files', 'pdf', 'avatar', 'attachment', 'attachments', 'document', 'documents', 'gallery'],
  },
  {
    id: 'realtime',
    label: 'Changes appear live, without refreshing',
    icon: Radio,
    needs: [{ chapter: 'realtime', why: 'so everyone sees a change the moment it happens' }],
    words: ['live', 'real-time', 'realtime', 'real time', 'instant', 'instantly', 'chat', 'multiplayer', 'together', 'collaborate', 'collaborative', 'presence', 'typing'],
  },
  {
    id: 'search',
    label: 'People search or filter lots of things',
    icon: Search,
    needs: [{ chapter: 'search', why: 'so the right thing turns up fast, even among millions' }],
    words: ['search', 'find', 'filter', 'filters', 'browse', 'catalog', 'catalogue', 'lookup', 'discover', 'directory'],
  },
  {
    id: 'notify',
    label: 'It sends emails, texts or notifications',
    icon: Mail,
    needs: [
      { chapter: 'notify', why: 'so it can reach people when the app isn’t open' },
      { chapter: 'background', why: 'so sending never makes anyone wait' },
    ],
    words: ['email', 'emails', 'notify', 'notification', 'notifications', 'remind', 'reminder', 'reminders', 'sms', 'text message', 'texts', 'push', 'alert', 'alerts', 'newsletter', 'confirmation'],
  },
  {
    id: 'payments',
    label: 'It takes money',
    icon: CreditCard,
    needs: [
      { chapter: 'payments', why: 'so people can pay without you ever touching card numbers' },
      { chapter: 'integrate', why: 'because a payment provider does the hard part and reports back to your server' },
    ],
    words: ['pay', 'payment', 'payments', 'buy', 'sell', 'selling', 'checkout', 'price', 'prices', 'subscription', 'subscriptions', 'donate', 'donation', 'donations', 'money', 'card', 'order', 'orders', 'ticket', 'tickets', 'paid'],
  },
  {
    id: 'ai',
    label: 'It uses AI to answer, write or sort',
    icon: Sparkles,
    needs: [{ chapter: 'ai', why: 'so it can call a model, ground it in your data and check what comes back' }],
    words: ['ai', 'gpt', 'llm', 'chatbot', 'bot', 'assistant', 'smart', 'summarise', 'summarize', 'summary', 'generate', 'recommend', 'recommendations', 'claude', 'rag', 'classify'],
  },
  {
    id: 'integrate',
    label: 'It uses other services: maps, calendars, other apps',
    icon: Plug,
    needs: [{ chapter: 'integrate', why: 'so it can call services you don’t own, and hear back from them' }],
    words: ['api', 'apis', 'map', 'maps', 'calendar', 'google', 'weather', 'integrate', 'integration', 'connect', 'third-party', 'spotify', 'slack', 'whatsapp', 'github', 'webhook', 'webhooks'],
  },
  {
    id: 'automate',
    label: 'Work happens by itself, on a trigger or a schedule',
    icon: Workflow,
    needs: [
      { chapter: 'automate', why: 'so forms, sheets and messages run without anyone clicking' },
      { chapter: 'background', why: 'so scheduled work runs on time, and tries again when it fails' },
    ],
    words: ['automate', 'automation', 'automatic', 'automatically', 'workflow', 'workflows', 'every day', 'every morning', 'every week', 'daily', 'weekly', 'schedule', 'scheduled', 'sync', 'spreadsheet', 'sheet', 'sheets', 'zapier', 'n8n', 'busywork'],
  },
  {
    id: 'heavy',
    label: 'It does slow work: video, reports, imports',
    icon: Hourglass,
    needs: [{ chapter: 'background', why: 'so slow work happens outside the request, and pages stay quick' }],
    words: ['process', 'processing', 'convert', 'report', 'reports', 'import', 'imports', 'export', 'batch', 'transcode', 'resize'],
  },
  {
    id: 'scale',
    label: 'Lots of people use it at once',
    icon: Gauge,
    needs: [
      { chapter: 'fast', why: 'so it stays quick as the data and the crowd grow' },
      { chapter: 'scale', why: 'so one server can become many' },
    ],
    words: ['millions', 'thousands', 'scale', 'popular', 'viral', 'traffic', 'fast', 'performance'],
  },
  {
    id: 'reliable',
    label: 'Real people depend on it every day',
    icon: HeartPulse,
    needs: [
      { chapter: 'testing', why: 'so a new change doesn’t break what already works' },
      { chapter: 'observe', why: 'so you hear about problems before your users do' },
    ],
    words: ['business', 'customers', 'customer', 'clients', 'client', 'reliable', 'production', 'launch', 'company', 'startup', 'patients', 'students', 'staff'],
  },
];

export const IDEAS: Idea[] = [
  {
    id: 'page',
    phrase: 'a personal page',
    title: 'A personal page',
    pitch: 'A page about you or your work, at a link you can share.',
    icon: FileText,
    features: [],
    words: ['personal', 'portfolio', 'page', 'landing', 'resume', 'cv', 'about me', 'homepage', 'website', 'site'],
    study: { href: '/manual/first-ship', label: 'Your first ship — this exact build, guided, in about an hour' },
  },
  {
    id: 'todo',
    phrase: 'a to-do app',
    title: 'A to-do app',
    pitch: 'Lists that are still there tomorrow, private to each person.',
    icon: ListTodo,
    features: ['interact', 'data', 'accounts'],
    words: ['todo', 'to-do', 'to do', 'tasks', 'checklist', 'habit', 'habits', 'notes', 'planner'],
    study: { lesson: 'design-todo' },
  },
  {
    id: 'booking',
    phrase: 'a booking site for a clinic',
    title: 'A booking site',
    pitch: 'People pick a free slot, get a confirmation, and a reminder the day before.',
    icon: CalendarCheck,
    features: ['interact', 'data', 'accounts', 'notify', 'reliable'],
    words: ['booking', 'bookings', 'book', 'appointment', 'appointments', 'clinic', 'salon', 'doctor', 'dentist', 'reservation', 'reservations', 'slot', 'slots', 'barber', 'gym', 'class'],
  },
  {
    id: 'shop',
    phrase: 'an online shop',
    title: 'An online shop',
    pitch: 'A catalogue with photos, a cart, a checkout, and an email when the order ships.',
    icon: ShoppingCart,
    features: ['interact', 'data', 'accounts', 'files', 'search', 'payments', 'notify', 'reliable'],
    words: ['shop', 'store', 'ecommerce', 'e-commerce', 'cart', 'checkout', 'products', 'merch', 'marketplace', 'bakery', 'boutique'],
    study: { lesson: 'design-cart' },
  },
  {
    id: 'chat',
    phrase: 'a chat app',
    title: 'A chat app',
    pitch: 'Rooms, messages that arrive instantly, and who is online right now.',
    icon: MessagesSquare,
    features: ['interact', 'data', 'accounts', 'realtime', 'files', 'notify'],
    words: ['chat', 'chats', 'messaging', 'messenger', 'messages', 'dm', 'dms', 'community', 'forum'],
    study: { lesson: 'design-chat' },
  },
  {
    id: 'assistant',
    phrase: 'an AI assistant for my documents',
    title: 'An AI assistant',
    pitch: 'Upload notes or manuals, ask questions, and get answers that point to where they came from.',
    icon: Bot,
    features: ['interact', 'data', 'accounts', 'files', 'ai', 'heavy'],
    words: ['assistant', 'chatbot', 'bot', 'gpt', 'llm', 'rag', 'questions', 'knowledge', 'tutor', 'helpdesk'],
  },
  {
    id: 'board',
    phrase: 'a task board for a team',
    title: 'A team task board',
    pitch: 'Boards and tasks the whole team shares, updating live as anyone changes them.',
    icon: SquareKanban,
    features: ['interact', 'data', 'accounts', 'realtime', 'reliable'],
    words: ['kanban', 'board', 'boards', 'team', 'teams', 'project', 'projects', 'taskflow', 'workspace', 'sprint'],
    study: { href: '/capstone', label: 'Build TaskFlow — the capstone, milestone by milestone' },
  },
  {
    id: 'automation',
    phrase: 'a workflow that runs itself',
    title: 'A workflow that runs itself',
    pitch: 'A form fills a sheet, AI sorts each entry, and the right person gets an email.',
    icon: Workflow,
    features: ['automate', 'integrate', 'notify', 'ai'],
    words: ['automate', 'automation', 'workflow', 'zapier', 'n8n', 'form', 'spreadsheet', 'sheet', 'busywork', 'pipeline'],
  },
  {
    id: 'blog',
    phrase: 'a blog with a newsletter',
    title: 'A blog',
    pitch: 'Posts with pictures, a search box, and new posts emailed to subscribers.',
    icon: Newspaper,
    features: ['interact', 'data', 'accounts', 'files', 'search', 'notify'],
    words: ['blog', 'newsletter', 'posts', 'articles', 'publish', 'cms', 'magazine', 'journal', 'recipes'],
  },
];
