/**
 * The Path door: "Teach me from zero" — one guided route through every chapter of the Manual
 * (docs/VISION.md §4 and §5): first ship → foundations → blocks → products → real problems.
 *
 * Every chapter is on the path exactly once (a dev warning says otherwise). The order is the order
 * to learn in, which is not always the Manual's reading order: craft chapters sit where you need
 * them. The page shows the whole route but lights only the next three steps.
 */
export interface PathStage {
  id: string;
  title: string;
  /** What you can do once this stage is behind you. */
  promise: string;
  chapters: string[];
}

export const PATH: PathStage[] = [
  {
    id: 'first-ship',
    title: 'Ship something today',
    promise: 'Put a page you made on the internet, with AI as your pair.',
    chapters: ['first-ship', 'build-with-ai'],
  },
  {
    id: 'foundations',
    title: 'See how it all works',
    promise: 'Explain what happens when you open an app, from the tap to the database and back.',
    chapters: ['how-the-web-works', 'how-the-internet-works', 'how-code-runs', 'how-data-is-stored', 'how-code-ships'],
  },
  {
    id: 'maker',
    title: 'Make a small app',
    promise: 'Build an app that remembers things and knows who its users are.',
    chapters: ['show-it', 'interact', 'answer-requests', 'remember', 'identity', 'protect', 'debug'],
  },
  {
    id: 'builder',
    title: 'Build and ship a whole product',
    promise: 'Combine the blocks into one product, test it, and put it online for real people.',
    chapters: ['integrate', 'ship', 'collaborate', 'testing', 'design', 'design-studies', 'taskflow'],
  },
  {
    id: 'product',
    title: 'Add product powers',
    promise: 'Add files, live updates, search, payments, messages and AI — and keep it fast and running.',
    chapters: ['files', 'realtime', 'search', 'background', 'notify', 'payments', 'ai', 'automate', 'fast', 'scale', 'observe'],
  },
  {
    id: 'independent',
    title: 'Solve real problems',
    promise: 'Take a vague problem from a real person, and ship what solves it — on your own.',
    chapters: ['plan', 'read-code', 'iterate', 'briefs'],
  },
];
