/**
 * Part IV — problem briefs: the forward-deployed engineer's path (docs/VISION.md §3 and §5).
 *
 * Real-feeling problems from small, fictional clients, with less help each time:
 * guided → semi-guided → spec only → open. Every brief goes discover → scope → design → build →
 * ship → demo → iterate. In discovery the client is played by the AI mentor: it knows the
 * `knows` facts, and shares `onlyIfAsked` ones only when the learner asks a good question.
 * Clients and organisations are made up. AI drafted; the owner reviews.
 */
export type Support = 'guided' | 'semi-guided' | 'spec' | 'open';
export type StageId = 'discover' | 'scope' | 'design' | 'build' | 'ship' | 'demo' | 'iterate';

export interface Stage {
  id: StageId;
  title: string;
  goal: string;
  /** What "done" looks like — the learner ticks it. */
  done: string;
  /** The note the learner writes at this stage (none for ship, which takes the live link). */
  note?: { label: string; placeholder: string };
}

export const STAGES: Stage[] = [
  {
    id: 'discover',
    title: 'Discover',
    goal: 'Understand the real problem before you think about a solution. Interview the client.',
    done: 'You can say the problem in one sentence, in the client’s words — and who has it.',
    note: { label: 'The problem, in one sentence', placeholder: 'Rosa loses sales every Saturday because…' },
  },
  {
    id: 'scope',
    title: 'Scope',
    goal: 'Cut it down to a first version you could ship in a week or two.',
    done: 'A short list of what version one does — and what it doesn’t.',
    note: { label: 'Version one does… and doesn’t…', placeholder: 'Does: …\nDoesn’t (yet): …' },
  },
  {
    id: 'design',
    title: 'Design',
    goal: 'Choose the building blocks, and sketch the screens and how the data flows.',
    done: 'A sketch you could hand to someone else: screens, data, and where each part runs.',
    note: { label: 'Screens, data and building blocks', placeholder: 'Screens: …\nData: …\nBlocks: …' },
  },
  {
    id: 'build',
    title: 'Build',
    goal: 'Build it with AI as your pair — reading and checking everything it writes.',
    done: 'It works on your machine, end to end, and you can explain every part.',
    note: { label: 'What the AI got wrong, and how you caught it', placeholder: 'It stored… so I…' },
  },
  {
    id: 'ship',
    title: 'Ship',
    goal: 'Put it online at a link the client can open on their phone.',
    done: 'A live https:// link that works on mobile data.',
  },
  {
    id: 'demo',
    title: 'Demo and defend',
    goal: 'Show it to the client in two minutes, in their words. Then defend your design to a sceptical engineer.',
    done: 'A two-minute demo, the client’s first reaction, and answers to the hard questions.',
    note: { label: 'What the client said', placeholder: 'They liked… They asked…' },
  },
  {
    id: 'iterate',
    title: 'Iterate',
    goal: 'Listen, choose one change that matters most, and ship it.',
    done: 'One change, shipped, because of what you heard.',
    note: { label: 'The next change, and why', placeholder: 'Because they said…, next I will…' },
  },
];

export const SUPPORT: Record<Support, { label: string; text: string }> = {
  guided: { label: 'Guided', text: 'Every stage is written out. Follow it, and learn the shape of a real project.' },
  'semi-guided': { label: 'Semi-guided', text: 'Each stage gives a hint or two. The decisions are yours.' },
  spec: { label: 'Spec only', text: 'The client hands you a spec. How you build it is up to you.' },
  open: { label: 'Open', text: 'A vague problem and a real conversation. Everything else is yours.' },
};

/** How much help each support level gives — Levels count "this or harder". */
export const SUPPORT_RANK: Record<Support, number> = { guided: 0, 'semi-guided': 1, spec: 2, open: 3 };

export interface Brief {
  id: string;
  support: Support;
  title: string;
  /** A made-up person; the mentor plays them in discovery. */
  client: { name: string; role: string; org: string; voice: string };
  /** What the client says first — usually vague, as real asks are. */
  ask: string;
  /** For spec-only briefs: the spec the client hands over. */
  spec?: string[];
  /** Facts the client shares when a question touches them. */
  knows: string[];
  /** Facts the client shares only when asked a specific, good question. */
  onlyIfAsked: string[];
  constraints: string[];
  /** What a good result looks like, in one line (open briefs keep it open). */
  outcome: string;
  /** Chapters the brief draws on. */
  chapters: string[];
  /** Help per stage: full steps for guided, a hint or two for semi-guided, none after that. */
  guide?: Partial<Record<StageId, string[]>>;
}

export const BRIEFS: Brief[] = [
  {
    id: 'bakery',
    support: 'guided',
    title: 'Saturday pre-orders for a bakery',
    client: {
      name: 'Rosa',
      role: 'owner',
      org: 'a neighbourhood bakery',
      voice: 'Warm, busy and practical. Talks about bread and customers, never about technology. Has been up since four.',
    },
    ask: '“Every Saturday I bake too much of some breads and run out of others by nine. Could people order ahead somehow?”',
    knows: [
      'About 120 customers come on a Saturday, and most are regulars.',
      'There are eight kinds of bread; sourdough and cinnamon buns sell out first.',
      'Orders come by phone today and go on a paper list by the till. Rosa misses calls while she bakes.',
      'She needs the final list by Friday at 6 p.m. to plan the dough.',
      'Pickup is Saturday from 7 a.m. to noon. Nobody pays in advance today.',
    ],
    onlyIfAsked: [
      'She does not want online card payments yet: the fees worry her, and people are happy to pay at pickup.',
      'Some older regulars will keep phoning, so staff must be able to add phone orders to the same list.',
      'Bread not collected by noon goes to a food bank.',
      'Her nephew can help set things up, but he won’t look after anything complicated.',
    ],
    constraints: ['Almost no budget: free tiers, or a few dollars a month at most.', 'Rosa checks orders on her phone, between batches.'],
    outcome: 'A pre-order page for Saturday, a list Rosa can read on her phone, and a way for staff to add phone orders.',
    chapters: ['show-it', 'interact', 'answer-requests', 'remember', 'identity', 'ship'],
    guide: {
      discover: [
        'Ask what goes wrong on a Saturday today, and what it costs her.',
        'Ask how orders arrive now, and who writes them down.',
        'Ask when she needs the final numbers, and in what form.',
        'Ask about paying: in advance, or at pickup?',
        'Ask who else has to use it — staff, and regulars who phone.',
      ],
      scope: [
        'Version one: customers choose breads and a pickup time for this Saturday, and leave a name and phone number.',
        'Staff can add a phone order to the same list.',
        'Rosa sees one list for the coming Saturday, sorted by pickup time, on her phone.',
        'Not in version one: online payment, customer accounts, emails.',
      ],
      design: [
        'Three screens: the order form, a thank-you page, and Rosa’s list behind a staff password.',
        'One collection, `orders`: name, phone, items and quantities, pickup time, the Saturday’s date.',
        'A small API: `POST /orders` for anyone; `GET /orders?date=…` and `POST /orders` (phone orders) for staff only.',
        'Orders close on Friday at 6 p.m.: the API refuses new ones after that.',
      ],
      build: [
        'Build the API and the order form, saving orders to the database — the server routes by hand once, then with AI.',
        'Add the staff login: one shared staff account is fine for version one, with a hashed password.',
        'Build Rosa’s list: totals per bread at the top, then each order by pickup time.',
        'Check the Friday cut-off with a test that pretends it is Friday at 6:01 p.m.',
      ],
      ship: [
        'Deploy the frontend and the API, with the database on a free tier.',
        'Place a test order on your phone, over mobile data, and see it appear on Rosa’s list.',
      ],
      demo: [
        'Show Rosa ordering as a customer, then her list. Use her words: “sourdough for Saturday”, not “a POST request”.',
        'Ask her: “What would stop you using this next Saturday?”',
      ],
      iterate: ['Pick the change she asked for most, ship it, and tell her what changed.'],
    },
  },
  {
    id: 'clinic',
    support: 'semi-guided',
    title: 'Fewer missed appointments at a clinic',
    client: {
      name: 'Amara',
      role: 'practice manager',
      org: 'a small physiotherapy clinic with four therapists',
      voice: 'Organised and direct, a little tired of no-shows. Cares about patients and about the clinic’s money.',
    },
    ask: '“People forget their appointments. Every no-show is an hour we can’t get back. Can you fix that?”',
    knows: [
      'About 25 appointments a month are missed across the four therapists.',
      'Appointments are booked by phone and kept in a shared online calendar.',
      'Most patients book a course of six to eight sessions.',
      'Nearly every patient gives a mobile number and an email address.',
    ],
    onlyIfAsked: [
      'They tried phoning patients the day before, but staff ran out of time.',
      'Some patients want to cancel but find phoning awkward, so they simply don’t come.',
      'No health details may appear in a message — only the time and the clinic’s name.',
      'Their calendar can export appointments, and they will not switch to a new calendar.',
      'Text messages cost money and emails are free; a small cost is fine if no-shows drop.',
    ],
    constraints: ['Staff will not type appointments twice.', 'Patient privacy comes first.'],
    outcome: 'A reminder before each appointment, and an easy way to cancel so the slot can go to someone else.',
    chapters: ['remember', 'answer-requests', 'protect', 'integrate', 'background', 'notify', 'ship'],
    guide: {
      discover: ['Find out *why* people miss appointments — forgetting is only one reason.', 'Ask what must never appear in a message.'],
      scope: ['Reminders alone, or reminders plus an easy cancel? Choose what moves the number most.'],
      design: ['Where do appointments come from, without anyone typing them twice?', 'What runs on a schedule — and what happens when a send fails?'],
      build: ['Make the reminder job safe to run twice without sending twice.'],
      ship: ['Test with your own phone number and email first.'],
      demo: ['Show a reminder arriving, and a cancelled slot appearing as free.'],
      iterate: ['Count no-shows for a few weeks before you decide what to change.'],
    },
  },
  {
    id: 'school',
    support: 'spec',
    title: 'A lost-and-found board for a school',
    client: {
      name: 'Mr Okafor',
      role: 'deputy head',
      org: 'a secondary school with about 900 students',
      voice: 'Patient and a little formal. Protective of students’ privacy and of staff time.',
    },
    ask: '“We know what we want — here is the list. Can you build it?”',
    spec: [
      'Staff post a found item with a photo, where it was found, and the date.',
      'Students browse found items and search by what the item is and where it was lost.',
      'A student claims an item; staff see the claim and mark the item collected.',
      'Only people with a school email address can sign in.',
      'Items unclaimed after 30 days are hidden and marked for donation.',
      'It must work well on a phone.',
    ],
    knows: [
      'About 40 items are handed in each week — mostly water bottles, jumpers and calculators.',
      'Items are kept in a cupboard in the main office.',
    ],
    onlyIfAsked: [
      'A photo must never show a student’s face or name label.',
      'Staff time is the real limit: posting an item must take under a minute.',
      'Valuable items such as phones and laptops are never posted; students ask at the office.',
    ],
    constraints: ['School email sign-in only.', 'No student names or faces in photos.'],
    outcome: 'Exactly the spec. How you build it — and which trade-offs you make — is yours to decide and defend.',
    chapters: ['identity', 'protect', 'files', 'search', 'remember', 'background', 'ship'],
  },
  {
    id: 'club',
    support: 'open',
    title: 'A football club run from a group chat',
    client: {
      name: 'Sam',
      role: 'volunteer secretary',
      org: 'an amateur football club with about 60 members',
      voice: 'Friendly, rushed and a bit chaotic. Does this for free in the evenings. Talks fast and goes off on tangents.',
    },
    ask: '“Honestly, everything is a mess. It’s all in one group chat. Can you make us an app?”',
    knows: [
      'Three teams play every weekend; each needs eleven players and a few substitutes.',
      'Every week Sam asks in the group chat who is available, and the replies get lost among jokes and photos.',
      'Membership fees are paid in cash and written in a notebook.',
    ],
    onlyIfAsked: [
      'The real pain is Friday night: Sam spends about two hours messaging people one by one to fill the teams.',
      'Captains pick the teams, but they can’t see in one place who is available.',
      'A few older members have no smartphone and can only be reached by text message.',
      'Kick-off times and grounds change, and every few weeks someone turns up at the wrong ground.',
      'Sam does not want every member’s phone number visible to everyone.',
      'There is no budget, but the club could pay a little from fees if it saved Sam’s Friday nights.',
    ],
    constraints: ['Volunteers will run it: it must stay simple to keep going.'],
    outcome: 'Up to you. “An app” is not a problem — find the real one first.',
    chapters: ['plan', 'design', 'identity', 'remember', 'notify', 'realtime', 'ship', 'iterate'],
  },
];

export const getBrief = (id: string | undefined) => BRIEFS.find((b) => b.id === id);
